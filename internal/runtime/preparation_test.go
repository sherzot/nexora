package runtime

import (
	"encoding/json"
	"errors"
	"testing"
)

func revision(t testing.TB, value uint64) RunRevision {
	t.Helper()
	r, err := NewRunRevision(value)
	if err != nil {
		t.Fatal(err)
	}
	return r
}

func snapshot(t testing.TB, run Run, value uint64) RunSnapshot {
	t.Helper()
	s, err := NewRunSnapshot(run, revision(t, value))
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func TestRunRevision(t *testing.T) {
	if r, err := NewRunRevision(0); !errors.Is(err, ErrInvalidRevision) || !r.IsZero() {
		t.Fatal("zero revision accepted")
	}
	if r, err := (RunRevision{}).Next(); !errors.Is(err, ErrInvalidRevision) || !r.IsZero() {
		t.Fatal("unset revision advanced")
	}
	for _, value := range []uint64{1, 2, ^uint64(0) - 1, ^uint64(0)} {
		r := revision(t, value)
		if r.Value() != value || r.IsZero() {
			t.Fatal("revision value lost")
		}
		next, err := r.Next()
		if value == ^uint64(0) {
			if !errors.Is(err, ErrRevisionOverflow) || !next.IsZero() {
				t.Fatal("revision wrapped")
			}
		} else if err != nil || next.Value() != value+1 {
			t.Fatal("wrong successor")
		}
		if r.Value() != value {
			t.Fatal("successor mutated predecessor revision")
		}
	}
}

func TestRunSnapshotValidation(t *testing.T) {
	r := newRun(t)
	for _, test := range []struct {
		run   Run
		rev   RunRevision
		cause error
	}{
		{Run{}, revision(t, 1), ErrInvalidRun},
		{r, RunRevision{}, ErrInvalidRevision},
	} {
		s, err := NewRunSnapshot(test.run, test.rev)
		if !errors.Is(err, ErrInvalidSnapshot) || !errors.Is(err, test.cause) || !s.IsZero() {
			t.Fatal("invalid snapshot admitted")
		}
	}
	for _, run := range states(t) {
		s := snapshot(t, run, 1)
		if s.IsZero() || s.Run() != run || s.Revision().Value() != 1 || s.Run().Attribution() != run.Attribution() {
			t.Fatal("snapshot altered Run")
		}
	}
	// Package-internal malformed combinations cannot become valid snapshots.
	for _, change := range []func(*Run){
		func(r *Run) { r.state = 255 }, func(r *Run) { r.effect = 0 },
		func(r *Run) { r.wait = WaitForTool }, func(r *Run) { r.state = Waiting },
		func(r *Run) { r.outcome = Failed }, func(r *Run) { r.state = Finished },
		func(r *Run) { r.stop = 255 },
	} {
		bad := r
		change(&bad)
		if _, err := NewRunSnapshot(bad, revision(t, 1)); !errors.Is(err, ErrInvalidSnapshot) {
			t.Fatal("malformed Run accepted")
		}
	}
}

// This test-only adapter enumerates the seven concrete preparation entry points.
func prepareTest(s RunSnapshot, id RunID, expected RunRevision, op RunOperation, value byte) (PreparedRunTransition, error) {
	switch op {
	case OperationEnqueue:
		return s.PrepareEnqueue(id, expected)
	case OperationStart:
		return s.PrepareStart(id, expected)
	case OperationWait:
		return s.PrepareWait(id, expected, WaitingReason(value))
	case OperationRequeue:
		return s.PrepareRequeue(id, expected)
	case OperationFinish:
		return s.PrepareFinish(id, expected, Outcome(value))
	case OperationRequestStop:
		return s.PrepareRequestStop(id, expected, StopCause(value))
	case OperationWithEffectKnowledgeProjection:
		return s.PrepareWithEffectKnowledgeProjection(id, expected, EffectKnowledge(value))
	default:
		panic("test requested nonexistent preparation API")
	}
}

func checkPrepared(t testing.TB, s RunSnapshot, p PreparedRunTransition, op RunOperation) {
	t.Helper()
	if p.IsZero() || p.PredecessorID() != s.Run().ID() || p.PredecessorRevision() != s.Revision() || p.Operation() != op || p.ProposedRevision().Value() != s.Revision().Value()+1 {
		t.Fatal("candidate lost predecessor/operation/revision binding")
	}
	checkRun(t, p.Candidate(), s.Run())
}

func TestPreparationPreconditions(t *testing.T) {
	s := snapshot(t, newRun(t), 7)
	other, err := ParseRunID("run_1123456789abcdef0123456789abcdef")
	if err != nil {
		t.Fatal(err)
	}
	for op := OperationEnqueue; op <= OperationWithEffectKnowledgeProjection; op++ {
		for _, test := range []struct {
			s    RunSnapshot
			id   RunID
			rev  RunRevision
			want error
		}{
			{RunSnapshot{}, s.Run().ID(), s.Revision(), ErrInvalidSnapshot},
			{s, RunID{}, s.Revision(), ErrRunIdentityMismatch},
			{s, other, s.Revision(), ErrRunIdentityMismatch},
			{s, s.Run().ID(), RunRevision{}, ErrInvalidRevision},
			{s, s.Run().ID(), revision(t, 8), ErrExpectedRevisionMismatch},
		} {
			before := test.s
			p, err := prepareTest(test.s, test.id, test.rev, op, 1)
			if !errors.Is(err, test.want) || p != (PreparedRunTransition{}) || test.s != before {
				t.Fatalf("op %d: precondition error %v, want %v", op, err, test.want)
			}
		}
	}
}

func TestPreparationTransitionMatrix(t *testing.T) {
	for _, r := range states(t) {
		s := snapshot(t, r, 1)
		for op := OperationEnqueue; op <= OperationWithEffectKnowledgeProjection; op++ {
			max := byte(1)
			if op == OperationWait || op == OperationFinish || op == OperationWithEffectKnowledgeProjection {
				max = 5
			}
			if op == OperationRequestStop {
				max = 7
			}
			for value := byte(1); value <= max; value++ {
				p, err := prepareTest(s, r.ID(), s.Revision(), op, value)
				legal := false
				if r.State() != Finished {
					switch op {
					case OperationEnqueue:
						legal = r.State() == Created
					case OperationStart:
						legal = r.State() == Queued
					case OperationWait:
						legal = r.State() == Running
					case OperationRequeue:
						legal = r.State() == Waiting
					case OperationFinish:
						legal = Outcome(value) != Succeeded || r.State() == Running
						legal = legal && (Outcome(value) != Indeterminate || r.State() != Created)
					case OperationRequestStop, OperationWithEffectKnowledgeProjection:
						legal = true
					}
				}
				if !legal {
					if !errors.Is(err, ErrIllegalTransition) || !p.IsZero() {
						t.Fatalf("state %v op %d value %d: invalid transition admitted: %v", r.State(), op, value, err)
					}
					if r.State() == Finished && !errors.Is(err, ErrTerminalMutation) {
						t.Fatal("missing terminal classification")
					}
					continue
				}
				if err != nil {
					t.Fatalf("state %v op %d value %d: legal preparation rejected: %v", r.State(), op, value, err)
				}
				checkPrepared(t, s, p, op)
				c := p.Candidate()
				switch op {
				case OperationEnqueue, OperationRequeue:
					if c.State() != Queued {
						t.Fatal("not queued")
					}
				case OperationStart:
					if c.State() != Running {
						t.Fatal("not running")
					}
				case OperationWait:
					if reason, present := c.WaitingReason(); !present || reason != WaitingReason(value) {
						t.Fatal("wait reason lost")
					}
				case OperationFinish:
					if outcome, present := c.FinalOutcome(); !present || outcome != Outcome(value) {
						t.Fatal("outcome lost")
					}
				case OperationRequestStop:
					if cause, present := c.StopRequest(); !present || cause != StopCause(value) || c.State() != r.State() {
						t.Fatal("stop intent changed lifecycle")
					}
				case OperationWithEffectKnowledgeProjection:
					if c.EffectKnowledge() != EffectKnowledge(value) || c.State() != r.State() {
						t.Fatal("projection changed lifecycle")
					}
				}
				if s.Run() != r || s.Revision().Value() != 1 {
					t.Fatal("preparation mutated predecessor")
				}
			}
		}
	}
}

func TestPreparationMetadataAndOverflow(t *testing.T) {
	s := snapshot(t, states(t)[2], 1)
	for _, op := range []RunOperation{OperationWait, OperationFinish, OperationRequestStop, OperationWithEffectKnowledgeProjection} {
		for n := 0; n <= 255; n++ {
			p, err := prepareTest(s, s.Run().ID(), s.Revision(), op, byte(n))
			max := 5
			if op == OperationRequestStop {
				max = 7
			}
			if n >= 1 && n <= max {
				if err != nil {
					t.Fatal(err)
				}
				checkPrepared(t, s, p, op)
			} else if !errors.Is(err, ErrInvalidValue) || !p.IsZero() {
				t.Fatal("invalid metadata admitted")
			}
		}
	}
	for op := OperationEnqueue; op <= OperationWithEffectKnowledgeProjection; op++ {
		r := states(t)[2]
		switch op {
		case OperationEnqueue:
			r = states(t)[0]
		case OperationStart:
			r = states(t)[1]
		case OperationRequeue:
			r = states(t)[3]
		}
		max := snapshot(t, r, ^uint64(0))
		p, err := prepareTest(max, r.ID(), max.Revision(), op, 1)
		if !errors.Is(err, ErrRevisionOverflow) || !p.IsZero() || max.Run() != r || max.Revision().Value() != ^uint64(0) {
			t.Fatal("overflow produced candidate or mutated predecessor")
		}
	}
}

func TestPreparationStopCompletionAndProjection(t *testing.T) {
	for _, r := range states(t)[:4] {
		stopped, err := r.RequestStop(StopUserCancellation)
		if err != nil {
			t.Fatal(err)
		}
		s := snapshot(t, stopped, 2)
		op := OperationWait
		switch r.State() {
		case Created:
			op = OperationEnqueue
		case Queued:
			op = OperationStart
		case Waiting:
			op = OperationRequeue
		}
		for _, blocked := range []RunOperation{op, OperationRequestStop} {
			p, err := prepareTest(s, r.ID(), s.Revision(), blocked, 1)
			if !errors.Is(err, ErrStopRequested) || !p.IsZero() {
				t.Fatal("stop restriction lost")
			}
		}
		p, err := s.PrepareFinish(r.ID(), s.Revision(), Cancelled)
		if err != nil {
			t.Fatal(err)
		}
		if p.Candidate().EffectKnowledge() != EffectUnknown {
			t.Fatal("cancel inferred effects")
		}
		checkPrepared(t, s, p, OperationFinish)
		if r.State() == Running {
			p, err = s.PrepareFinish(r.ID(), s.Revision(), Succeeded)
			if err != nil {
				t.Fatal("stop prevented explicit completion", err)
			}
			checkPrepared(t, s, p, OperationFinish)
		}
		p, err = s.PrepareWithEffectKnowledgeProjection(r.ID(), s.Revision(), EffectUnknown)
		if err != nil || p.Candidate() != stopped || p.ProposedRevision().Value() != 3 {
			t.Fatal("same-category projection did not advance revision independently")
		}
	}
	// Every effect/outcome pair stays orthogonal; neither supplied category is
	// evidence validation, authorization or a retry grant.
	for effect := EffectNotDispatched; effect <= EffectUnknown; effect++ {
		r, err := states(t)[2].WithEffectKnowledgeProjection(effect)
		if err != nil {
			t.Fatal(err)
		}
		s := snapshot(t, r, 9)
		for outcome := Succeeded; outcome <= Indeterminate; outcome++ {
			p, err := s.PrepareFinish(r.ID(), s.Revision(), outcome)
			if err != nil || p.Candidate().EffectKnowledge() != effect {
				t.Fatal("outcome changed effects")
			}
		}
	}
}

func TestCompetingPreparationsHaveNoCommitExclusivity(t *testing.T) {
	s := snapshot(t, states(t)[2], 4)
	before := s
	finish, err := s.PrepareFinish(s.Run().ID(), s.Revision(), Succeeded)
	if err != nil {
		t.Fatal(err)
	}
	stop, err := s.PrepareRequestStop(s.Run().ID(), s.Revision(), StopPolicyRevocation)
	if err != nil {
		t.Fatal(err)
	}
	checkPrepared(t, s, finish, OperationFinish)
	checkPrepared(t, s, stop, OperationRequestStop)
	if finish.ProposedRevision() != stop.ProposedRevision() || finish.Candidate() == stop.Candidate() || s != before {
		t.Fatal("competing candidates lost independent value semantics")
	}
	repeated, err := s.PrepareFinish(s.Run().ID(), s.Revision(), Succeeded)
	if err != nil || repeated != finish {
		t.Fatal("preparation acquired ownership or lost determinism")
	}
	copy := finish.Candidate()
	copy, err = copy.RequestStop(StopUserCancellation)
	if !errors.Is(err, ErrIllegalTransition) || copy != finish.Candidate() || s != before {
		t.Fatal("candidate getter changed stored values")
	}
	active := stop.Candidate()
	changed, err := active.WithEffectKnowledgeProjection(EffectConfirmedPerformed)
	if err != nil || changed == active || stop.Candidate() != active || s != before {
		t.Fatal("changing a candidate copy mutated retained values")
	}
}

func TestPreparationHasNoExternalSerialization(t *testing.T) {
	s := snapshot(t, newRun(t), 1)
	p, err := s.PrepareEnqueue(s.Run().ID(), s.Revision())
	if err != nil {
		t.Fatal(err)
	}
	for _, v := range []any{s.Revision(), s, p} {
		if _, err := json.Marshal(v); !errors.Is(err, ErrRunSerialization) {
			t.Fatal("undefined serialization accepted")
		}
	}
	r, copyS, copyP := s.Revision(), s, p
	for _, v := range []any{&r, &copyS, &copyP} {
		if err := json.Unmarshal([]byte("{}"), v); !errors.Is(err, ErrRunSerialization) {
			t.Fatal("undefined decode accepted")
		}
	}
	if r != s.Revision() || copyS != s || copyP != p {
		t.Fatal("decode mutated values")
	}
}

func FuzzRunPreparation(f *testing.F) {
	for _, seed := range [][]byte{{}, {0, 1, 0, 1, 1, 0, 2, 3, 0, 3, 1, 0, 1, 1, 0, 4, 1, 0}, {5, 1, 0, 6, 5, 0, 4, 1, 0}, {2, 255, 0, 4, 0, 0, 6, 0, 0}, {0, 0, 3, 0, 0, 1, 0, 0, 2}} {
		f.Add(seed)
	}
	f.Fuzz(func(t *testing.T, sequence []byte) {
		if len(sequence) > 1024 {
			return
		}
		original := newRun(t)
		s := snapshot(t, original, 1)
		for i := 0; i+2 < len(sequence); i += 3 {
			before := s
			op := RunOperation(sequence[i]%7 + 1)
			id, expected := s.Run().ID(), s.Revision()
			switch sequence[i+2] % 4 {
			case 1:
				expected = RunRevision{}
			case 2:
				id = RunID{}
			case 3:
				expected = revision(t, s.Revision().Value()+1)
			}
			p, err := prepareTest(s, id, expected, op, sequence[i+1])
			if s != before {
				t.Fatal("preparation changed predecessor")
			}
			if err != nil {
				if p != (PreparedRunTransition{}) {
					t.Fatal("rejection exposed candidate")
				}
				continue
			}
			if before.Run().State() == Finished {
				t.Fatal("terminal mutation accepted")
			}
			checkPrepared(t, before, p, op)
			checkRun(t, p.Candidate(), original)
			// Explicit local value selection is not an authoritative commit.
			s = snapshot(t, p.Candidate(), p.ProposedRevision().Value())
		}
	})
}
