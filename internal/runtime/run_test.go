package runtime

import (
	"encoding/json"
	"errors"
	"testing"
)

func newRun(t testing.TB) Run {
	t.Helper()
	id, err := ParseRunID("run_0123456789abcdef0123456789abcdef")
	if err != nil {
		t.Fatal(err)
	}
	configuration, err := ParseConfigurationRevisionRef("definition:revision-1")
	if err != nil {
		t.Fatal(err)
	}
	assignment, err := ParseAssignmentRevisionRef("task:assignment-1")
	if err != nil {
		t.Fatal(err)
	}
	attribution, err := NewRunConfigurationAttribution(id, configuration, assignment)
	if err != nil {
		t.Fatal(err)
	}
	run, err := NewRun(id, attribution)
	if err != nil {
		t.Fatal(err)
	}
	return run
}

func must(t testing.TB, run Run, err error) Run {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
	return run
}

func checkRun(t testing.TB, r Run, original Run) {
	t.Helper()
	if r.IsZero() || r.ID() != original.ID() || r.Attribution() != original.Attribution() {
		t.Fatal("identity or historical attribution changed")
	}
	reason, waiting := r.WaitingReason()
	if waiting != (r.State() == Waiting) || waiting && (reason < WaitForTool || reason > WaitForRetryTimer) || !waiting && reason != 0 {
		t.Fatal("invalid waiting combination")
	}
	outcome, finished := r.FinalOutcome()
	if finished != (r.State() == Finished) || finished && (outcome < Succeeded || outcome > Indeterminate) || !finished && outcome != 0 {
		t.Fatal("invalid outcome combination")
	}
	if r.State() < Created || r.State() > Finished || r.EffectKnowledge() < EffectNotDispatched || r.EffectKnowledge() > EffectUnknown {
		t.Fatal("invalid lifecycle/effect value")
	}
	cause, requested := r.StopRequest()
	if requested && (cause < StopUserCancellation || cause > StopToolOrProcessCancellation) || !requested && cause != 0 {
		t.Fatal("invalid stop metadata")
	}
}

func states(t testing.TB) []Run {
	t.Helper()
	created := newRun(t)
	queued, err := created.Enqueue()
	queued = must(t, queued, err)
	running, err := queued.Start()
	running = must(t, running, err)
	waiting, err := running.Wait(WaitForApproval)
	waiting = must(t, waiting, err)
	finished, err := running.Finish(Succeeded)
	finished = must(t, finished, err)
	return []Run{created, queued, running, waiting, finished}
}

func TestRunConstruction(t *testing.T) {
	r := newRun(t)
	checkRun(t, r, r)
	if r.State() != Created || r.EffectKnowledge() != EffectUnknown {
		t.Fatal("construction inferred progress or external evidence")
	}
	other, err := ParseRunID("run_1123456789abcdef0123456789abcdef")
	if err != nil {
		t.Fatal(err)
	}
	for _, input := range []struct {
		id RunID
		a  RunConfigurationAttribution
	}{{RunID{}, r.Attribution()}, {r.ID(), RunConfigurationAttribution{}}, {other, r.Attribution()}} {
		result, err := NewRun(input.id, input.a)
		if !errors.Is(err, ErrInvalidRun) || !result.IsZero() {
			t.Fatal("invalid identity/attribution admitted")
		}
	}
	copyID := r.ID()
	if err := copyID.UnmarshalText([]byte(other.String())); err != nil {
		t.Fatal(err)
	}
	if r.ID() != r.Attribution().RunID() || copyID == r.ID() {
		t.Fatal("getter leaked mutable historical identity")
	}
	if _, err := json.Marshal(r); !errors.Is(err, ErrRunSerialization) {
		t.Fatal("undefined Run serialization succeeded")
	}
	copy := r
	if err := json.Unmarshal([]byte("{}"), &copy); !errors.Is(err, ErrRunSerialization) || copy != r {
		t.Fatal("undefined deserialization changed Run")
	}
}

func TestRunTransitionTable(t *testing.T) {
	// This table enumerates every lifecycle-changing operation from every state.
	finishOutcomes := map[LifecycleState][]Outcome{
		Created:  {Failed, Cancelled, TimedOut},
		Queued:   {Failed, Cancelled, TimedOut, Indeterminate},
		Running:  {Succeeded, Failed, Cancelled, TimedOut, Indeterminate},
		Waiting:  {Failed, Cancelled, TimedOut, Indeterminate},
		Finished: {},
	}
	operations := []struct {
		name string
		call func(Run) (Run, error)
		from LifecycleState
		to   LifecycleState
	}{
		{"enqueue", Run.Enqueue, Created, Queued},
		{"start", Run.Start, Queued, Running},
		{"wait", func(r Run) (Run, error) { return r.Wait(WaitForApproval) }, Running, Waiting},
		{"requeue", Run.Requeue, Waiting, Queued},
	}
	for _, r := range states(t) {
		for _, op := range operations {
			t.Run(r.State().String()+"/"+op.name, func(t *testing.T) {
				result, err := op.call(r)
				if r.State() == op.from {
					if err != nil || result.State() != op.to {
						t.Fatalf("legal transition: state %v, error %v", result.State(), err)
					}
				} else if !errors.Is(err, ErrIllegalTransition) || result != r {
					t.Fatal("illegal transition changed state or lacked explicit error")
				}
				checkRun(t, result, r)
			})
		}
		for outcome := Succeeded; outcome <= Indeterminate; outcome++ {
			t.Run(r.State().String()+"/finish/"+outcome.String(), func(t *testing.T) {
				result, err := r.Finish(outcome)
				legal := false
				for _, allowed := range finishOutcomes[r.State()] {
					legal = legal || allowed == outcome
				}
				if legal {
					actual, settled := result.FinalOutcome()
					if err != nil || result.State() != Finished || !settled || actual != outcome {
						t.Fatalf("legal finish failed: %v", err)
					}
				} else if !errors.Is(err, ErrIllegalTransition) || result != r {
					t.Fatal("illegal finish admitted")
				}
				if result.EffectKnowledge() != r.EffectKnowledge() {
					t.Fatal("outcome rewrote external-effect knowledge")
				}
				checkRun(t, result, r)
			})
		}
	}
}

func TestWaitResumeAndStop(t *testing.T) {
	running := states(t)[2]
	for reason := WaitForTool; reason <= WaitForRetryTimer; reason++ {
		waiting, err := running.Wait(reason)
		waiting = must(t, waiting, err)
		actual, present := waiting.WaitingReason()
		if !present || actual != reason {
			t.Fatal("wait reason lost")
		}
		queued, err := waiting.Requeue()
		queued = must(t, queued, err)
		r, err := queued.Start()
		r = must(t, r, err)
		checkRun(t, r, running)
		if r != running {
			t.Fatal("wait/resume altered unrelated state")
		}
	}
	for _, r := range states(t)[:4] {
		for cause := StopUserCancellation; cause <= StopToolOrProcessCancellation; cause++ {
			stopped, err := r.RequestStop(cause)
			stopped = must(t, stopped, err)
			actual, requested := stopped.StopRequest()
			if !requested || actual != cause || stopped.State() != r.State() || stopped.EffectKnowledge() != r.EffectKnowledge() {
				t.Fatal("stop request changed lifecycle/effects or lost cause")
			}
			if _, settled := stopped.FinalOutcome(); settled {
				t.Fatal("stop request inferred a terminal outcome")
			}
			var next Run
			switch r.State() {
			case Created:
				next, err = stopped.Enqueue()
			case Queued:
				next, err = stopped.Start()
			case Running:
				next, err = stopped.Wait(WaitForTool)
			case Waiting:
				next, err = stopped.Requeue()
			}
			if !errors.Is(err, ErrStopRequested) || next != stopped {
				t.Fatal("stop intent allowed further advancement")
			}
			next, err = stopped.RequestStop(StopDeadlineExpiration)
			if !errors.Is(err, ErrStopRequested) || next != stopped {
				t.Fatal("repeated stop replaced earlier provenance")
			}
			known, err := stopped.RecordEffectKnowledge(EffectConfirmedPerformed)
			known = must(t, known, err)
			terminal, err := known.Finish(Cancelled)
			terminal = must(t, terminal, err)
			if terminal.EffectKnowledge() != EffectConfirmedPerformed {
				t.Fatal("cancellation implied rollback")
			}
			checkRun(t, terminal, r)
		}
	}
	// Completion can win after a request when the caller establishes success.
	stopped, err := running.RequestStop(StopUserCancellation)
	stopped = must(t, stopped, err)
	finished, err := stopped.Finish(Succeeded)
	finished = must(t, finished, err)
	checkRun(t, finished, running)
}

func TestEffectOutcomeOrthogonalityAndTerminalFreeze(t *testing.T) {
	running := states(t)[2]
	for effect := EffectNotDispatched; effect <= EffectUnknown; effect++ {
		for outcome := Succeeded; outcome <= Indeterminate; outcome++ {
			r, err := running.RecordEffectKnowledge(effect)
			r = must(t, r, err)
			finished, err := r.Finish(outcome)
			finished = must(t, finished, err)
			if finished.EffectKnowledge() != effect {
				t.Fatal("terminal outcome overwrote independent knowledge")
			}
			for _, op := range []func(Run) (Run, error){Run.Enqueue, Run.Start, Run.Requeue,
				func(r Run) (Run, error) { return r.Wait(WaitForTool) },
				func(r Run) (Run, error) { return r.Finish(Failed) },
				func(r Run) (Run, error) { return r.RequestStop(StopUserCancellation) },
				func(r Run) (Run, error) { return r.RecordEffectKnowledge(EffectUnknown) }} {
				result, err := op(finished)
				if !errors.Is(err, ErrIllegalTransition) || result != finished {
					t.Fatal("Finished value mutated")
				}
			}
		}
	}
	// No unsupported evidence ordering: an owner may report uncertainty again.
	r, err := running.RecordEffectKnowledge(EffectConfirmedPerformed)
	r = must(t, r, err)
	r, err = r.RecordEffectKnowledge(EffectUnknown)
	r = must(t, r, err)
	if r.EffectKnowledge() != EffectUnknown {
		t.Fatal("owner uncertainty suppressed")
	}
}
