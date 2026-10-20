package runtime

import "errors"

var (
	ErrInvalidRevision          = errors.New("invalid or unset Run revision")
	ErrRevisionOverflow         = errors.New("Run revision exhausted")
	ErrInvalidSnapshot          = errors.New("invalid or unset Run snapshot")
	ErrRunIdentityMismatch      = errors.New("expected Run identity differs from supplied snapshot")
	ErrExpectedRevisionMismatch = errors.New("expected revision differs from supplied snapshot")
	ErrTerminalMutation         = errors.New("cannot prepare mutation of Finished Run")
)

// RunRevision is Runtime-local predecessor metadata, not authoritative freshness,
// a timestamp, an ownership claim, a lease or a fencing token. Zero is unset.
type RunRevision struct{ value uint64 }

func NewRunRevision(value uint64) (RunRevision, error) {
	if value == 0 {
		return RunRevision{}, ErrInvalidRevision
	}
	return RunRevision{value: value}, nil
}

func (r RunRevision) Value() uint64 { return r.value }
func (r RunRevision) IsZero() bool  { return r.value == 0 }

func (r RunRevision) Next() (RunRevision, error) {
	if r.IsZero() {
		return RunRevision{}, ErrInvalidRevision
	}
	if r.value == ^uint64(0) {
		return RunRevision{}, ErrRevisionOverflow
	}
	return RunRevision{value: r.value + 1}, nil
}

// RunSnapshot pairs a Run value with a caller-supplied revision. Construction
// validates local values only; it does not retrieve, admit or persist a Run.
type RunSnapshot struct {
	run      Run
	revision RunRevision
}

func NewRunSnapshot(run Run, revision RunRevision) (RunSnapshot, error) {
	s := RunSnapshot{run: run, revision: revision}
	if err := s.validate(); err != nil {
		return RunSnapshot{}, err
	}
	return s, nil
}

func (s RunSnapshot) Run() Run              { return s.run }
func (s RunSnapshot) Revision() RunRevision { return s.revision }
func (s RunSnapshot) IsZero() bool          { return s.validate() != nil }

func (s RunSnapshot) validate() error {
	if s.revision.IsZero() {
		return errors.Join(ErrInvalidSnapshot, ErrInvalidRevision)
	}
	r := s.run
	if r.IsZero() || !r.state.valid() || !r.effect.valid() ||
		(r.state == Waiting && !r.wait.valid()) || (r.state != Waiting && r.wait != 0) ||
		(r.state == Finished && !r.outcome.valid()) || (r.state != Finished && r.outcome != 0) ||
		(r.stop != 0 && !r.stop.valid()) {
		return errors.Join(ErrInvalidSnapshot, ErrInvalidRun)
	}
	return nil
}

// RunOperation identifies an existing local semantic operation. It is output
// metadata, not a command dispatcher, wire encoding or execution permission.
type RunOperation uint8

const (
	OperationEnqueue RunOperation = iota + 1
	OperationStart
	OperationWait
	OperationRequeue
	OperationFinish
	OperationRequestStop
	OperationWithEffectKnowledgeProjection
)

// PreparedRunTransition is an immutable candidate, not a commit, authorization,
// dispatch, Audit Record or durable fact. Zero is unset. Competing candidates
// against the same predecessor can both exist; neither acquires ownership.
type PreparedRunTransition struct {
	predecessorID       RunID
	predecessorRevision RunRevision
	operation           RunOperation
	candidate           Run
	proposedRevision    RunRevision
}

func (p PreparedRunTransition) IsZero() bool                     { return p.predecessorID.IsZero() }
func (p PreparedRunTransition) PredecessorID() RunID             { return p.predecessorID }
func (p PreparedRunTransition) PredecessorRevision() RunRevision { return p.predecessorRevision }
func (p PreparedRunTransition) Operation() RunOperation          { return p.operation }
func (p PreparedRunTransition) Candidate() Run                   { return p.candidate }
func (p PreparedRunTransition) ProposedRevision() RunRevision    { return p.proposedRevision }

func (s RunSnapshot) PrepareEnqueue(id RunID, expected RunRevision) (PreparedRunTransition, error) {
	return s.prepare(id, expected, OperationEnqueue, true, Run.Enqueue)
}

func (s RunSnapshot) PrepareStart(id RunID, expected RunRevision) (PreparedRunTransition, error) {
	return s.prepare(id, expected, OperationStart, true, Run.Start)
}

func (s RunSnapshot) PrepareWait(id RunID, expected RunRevision, reason WaitingReason) (PreparedRunTransition, error) {
	return s.prepare(id, expected, OperationWait, reason.valid(), func(r Run) (Run, error) { return r.Wait(reason) })
}

func (s RunSnapshot) PrepareRequeue(id RunID, expected RunRevision) (PreparedRunTransition, error) {
	return s.prepare(id, expected, OperationRequeue, true, Run.Requeue)
}

func (s RunSnapshot) PrepareFinish(id RunID, expected RunRevision, outcome Outcome) (PreparedRunTransition, error) {
	return s.prepare(id, expected, OperationFinish, outcome.valid(), func(r Run) (Run, error) { return r.Finish(outcome) })
}

func (s RunSnapshot) PrepareRequestStop(id RunID, expected RunRevision, cause StopCause) (PreparedRunTransition, error) {
	return s.prepare(id, expected, OperationRequestStop, cause.valid(), func(r Run) (Run, error) { return r.RequestStop(cause) })
}

func (s RunSnapshot) PrepareWithEffectKnowledgeProjection(id RunID, expected RunRevision, knowledge EffectKnowledge) (PreparedRunTransition, error) {
	return s.prepare(id, expected, OperationWithEffectKnowledgeProjection, knowledge.valid(), func(r Run) (Run, error) { return r.WithEffectKnowledgeProjection(knowledge) })
}

// Only the seven concrete methods above can select an operation. The callback
// stays private; callers cannot inject custom Run transformations.
func (s RunSnapshot) prepare(id RunID, expected RunRevision, operation RunOperation, validMetadata bool, apply func(Run) (Run, error)) (PreparedRunTransition, error) {
	if err := s.validate(); err != nil {
		return PreparedRunTransition{}, err
	}
	if id.IsZero() || id != s.run.ID() {
		return PreparedRunTransition{}, ErrRunIdentityMismatch
	}
	if expected.IsZero() {
		return PreparedRunTransition{}, ErrInvalidRevision
	}
	if expected != s.revision {
		return PreparedRunTransition{}, ErrExpectedRevisionMismatch
	}
	if !validMetadata {
		return PreparedRunTransition{}, ErrInvalidValue
	}
	if s.run.State() == Finished {
		return PreparedRunTransition{}, errors.Join(ErrTerminalMutation, ErrIllegalTransition)
	}
	candidate, err := apply(s.run)
	if err != nil {
		return PreparedRunTransition{}, err
	}
	next, err := s.revision.Next()
	if err != nil {
		return PreparedRunTransition{}, err
	}
	return PreparedRunTransition{
		predecessorID: s.run.ID(), predecessorRevision: s.revision,
		operation: operation, candidate: candidate, proposedRevision: next,
	}, nil
}

// No complete external representation is defined. Reject accidental {} encoding
// of private fields and leave receivers unchanged on decoding attempts.
func (r RunRevision) MarshalJSON() ([]byte, error)           { return nil, ErrRunSerialization }
func (r *RunRevision) UnmarshalJSON([]byte) error            { return ErrRunSerialization }
func (s RunSnapshot) MarshalJSON() ([]byte, error)           { return nil, ErrRunSerialization }
func (s *RunSnapshot) UnmarshalJSON([]byte) error            { return ErrRunSerialization }
func (p PreparedRunTransition) MarshalJSON() ([]byte, error) { return nil, ErrRunSerialization }
func (p *PreparedRunTransition) UnmarshalJSON([]byte) error  { return ErrRunSerialization }
