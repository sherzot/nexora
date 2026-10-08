package runtime

import "errors"

var (
	ErrInvalidRun        = errors.New("invalid or unset Run")
	ErrInvalidValue      = errors.New("invalid Run lifecycle metadata")
	ErrIllegalTransition = errors.New("illegal Run lifecycle transition")
	ErrStopRequested     = errors.New("Run stop already requested")
	ErrRunSerialization  = errors.New("Run serialization contract is not defined")
)

// Run is an immutable, persistence-free lifecycle value with partial launch
// attribution. Successful operations return a new value; errors return the
// unchanged receiver. Copies do not synchronize concurrent owners or establish
// authority. A future application boundary must enforce current policy, claims,
// budgets, dependency resolution and actual outcome/effect evidence.
//
// The zero value is unset and rejects every operation. This is not a complete
// production Run record, durable wait, stop protocol, audit log or retry engine.
type Run struct {
	attribution RunConfigurationAttribution
	state       LifecycleState
	wait        WaitingReason
	outcome     Outcome
	effect      EffectKnowledge
	stop        StopCause
}

func NewRun(id RunID, attribution RunConfigurationAttribution) (Run, error) {
	if id.IsZero() || attribution.IsZero() || attribution.RunID() != id {
		return Run{}, ErrInvalidRun
	}
	// Construction alone supplies no external-operation evidence.
	return Run{attribution: attribution, state: Created, effect: EffectUnknown}, nil
}

func (r Run) IsZero() bool                             { return r.attribution.IsZero() }
func (r Run) ID() RunID                                { return r.attribution.RunID() }
func (r Run) Attribution() RunConfigurationAttribution { return r.attribution }
func (r Run) State() LifecycleState                    { return r.state }
func (r Run) EffectKnowledge() EffectKnowledge         { return r.effect }
func (r Run) WaitingReason() (WaitingReason, bool)     { return r.wait, r.state == Waiting }
func (r Run) FinalOutcome() (Outcome, bool)            { return r.outcome, r.state == Finished }
func (r Run) StopRequest() (StopCause, bool)           { return r.stop, r.stop.valid() }

// Enqueue represents local admission only; it cannot establish authorization.
func (r Run) Enqueue() (Run, error) {
	if err := r.canAdvance(Created); err != nil {
		return r, err
	}
	r.state = Queued
	return r, nil
}

// Start represents a claimed logical segment, not dispatch or resource creation.
func (r Run) Start() (Run, error) {
	if err := r.canAdvance(Queued); err != nil {
		return r, err
	}
	r.state = Running
	return r, nil
}

func (r Run) Wait(reason WaitingReason) (Run, error) {
	if err := r.canAdvance(Running); err != nil {
		return r, err
	}
	if !reason.valid() {
		return r, ErrInvalidValue
	}
	r.state, r.wait = Waiting, reason
	return r, nil
}

// Requeue requires future caller-owned dependency and admission validation. It
// clears only the categorical wait; it cannot grant Approval or execute a retry.
func (r Run) Requeue() (Run, error) {
	if err := r.canAdvance(Waiting); err != nil {
		return r, err
	}
	r.state, r.wait = Queued, 0
	return r, nil
}

// Finish records an explicitly established outcome, not inferred termination.
// Success requires a Running segment; Created can reject/cancel/expire but has
// no started attempt to lose. Queued can be resumed after earlier work, so an
// Indeterminate result is possible there as well as in Running/Waiting.
// The caller must establish the outcome under ADR-003's evidence contract.
func (r Run) Finish(outcome Outcome) (Run, error) {
	if err := r.canChange(); err != nil {
		return r, err
	}
	if !outcome.valid() {
		return r, ErrInvalidValue
	}
	if outcome == Succeeded && r.state != Running || outcome == Indeterminate && r.state == Created {
		return r, ErrIllegalTransition
	}
	r.state, r.wait, r.outcome = Finished, 0, outcome
	return r, nil
}

// RequestStop records explicitly initiated stop intent, retaining the first cause.
// Observed unexpected worker loss alone is not a request; its observation and
// recovery belong to future authoritative coordination. No cause authenticates
// a requester. This method blocks future advancement. It neither
// changes state/outcome/effects nor verifies external termination. Evidence can
// still be recorded and Finish must be explicit. Repeated requests are errors.
func (r Run) RequestStop(cause StopCause) (Run, error) {
	if err := r.canChange(); err != nil {
		return r, err
	}
	if !cause.valid() {
		return r, ErrInvalidValue
	}
	if r.stop.valid() {
		return r, ErrStopRequested
	}
	r.stop = cause
	return r, nil
}

// WithEffectKnowledgeProjection copies a caller-reported Runtime interpretation.
// Even a Confirmed category does not verify provenance or receipt custody. This
// is not authorization, a Tool result, an Execution Job result or authoritative
// external-effect truth. ConfirmedNotPerformed does not establish safe retry.
// It does not aggregate operations or impose evidence ordering. Finished freezes
// the projection; later authoritative reconciliation belongs to operation owners.
func (r Run) WithEffectKnowledgeProjection(knowledge EffectKnowledge) (Run, error) {
	if err := r.canChange(); err != nil {
		return r, err
	}
	if !knowledge.valid() {
		return r, ErrInvalidValue
	}
	r.effect = knowledge
	return r, nil
}

func (r Run) canChange() error {
	if r.IsZero() || !r.state.valid() || !r.effect.valid() {
		return ErrInvalidRun
	}
	if r.state == Finished {
		return ErrIllegalTransition
	}
	return nil
}

func (r Run) canAdvance(from LifecycleState) error {
	if err := r.canChange(); err != nil {
		return err
	}
	if r.state != from {
		return ErrIllegalTransition
	}
	if r.stop.valid() {
		return ErrStopRequested
	}
	return nil
}

// Explicitly reject accidental empty-object encoding of private fields.
func (r Run) MarshalJSON() ([]byte, error) { return nil, ErrRunSerialization }
func (r *Run) UnmarshalJSON([]byte) error  { return ErrRunSerialization }
