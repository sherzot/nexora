package runtime

import (
	"errors"
	"testing"
)

func TestUnsetRunAndInvalidMetadata(t *testing.T) {
	var unset Run
	for _, op := range []func(Run) (Run, error){Run.Enqueue, Run.Start, Run.Requeue,
		func(r Run) (Run, error) { return r.Wait(WaitForApproval) },
		func(r Run) (Run, error) { return r.Finish(Failed) },
		func(r Run) (Run, error) { return r.RequestStop(StopUserCancellation) },
		func(r Run) (Run, error) { return r.RecordEffectKnowledge(EffectUnknown) }} {
		result, err := op(unset)
		if !errors.Is(err, ErrInvalidRun) || result != unset {
			t.Fatal("unset Run admitted a transition")
		}
	}
	r := states(t)[2]
	// Exercise every representable value, including all unknown enum values.
	for n := 0; n <= 255; n++ {
		reason := WaitingReason(n)
		result, err := r.Wait(reason)
		if n >= 1 && n <= 5 {
			if err != nil || reason.String() == "Invalid" {
				t.Fatal("valid waiting category rejected")
			}
			checkRun(t, result, r)
		} else if !errors.Is(err, ErrInvalidValue) || result != r || reason.String() != "Invalid" {
			t.Fatal("unknown wait category accepted")
		}
		outcome := Outcome(n)
		result, err = r.Finish(outcome)
		if n >= 1 && n <= 5 {
			if err != nil || outcome.String() == "Invalid" {
				t.Fatal("valid outcome rejected")
			}
			checkRun(t, result, r)
		} else if !errors.Is(err, ErrInvalidValue) || result != r || outcome.String() != "Invalid" {
			t.Fatal("unknown outcome accepted")
		}
		knowledge := EffectKnowledge(n)
		result, err = r.RecordEffectKnowledge(knowledge)
		if n >= 1 && n <= 5 {
			if err != nil || knowledge.String() == "Invalid" {
				t.Fatal("valid effect knowledge rejected")
			}
			checkRun(t, result, r)
		} else if !errors.Is(err, ErrInvalidValue) || result != r || knowledge.String() != "Invalid" {
			t.Fatal("unknown effect knowledge accepted")
		}
		cause := StopCause(n)
		result, err = r.RequestStop(cause)
		if n >= 1 && n <= 7 {
			if err != nil || cause.String() == "Invalid" {
				t.Fatal("valid stop cause rejected")
			}
			checkRun(t, result, r)
		} else if !errors.Is(err, ErrInvalidValue) || result != r || cause.String() != "Invalid" {
			t.Fatal("unknown stop cause accepted")
		}
		state := LifecycleState(n)
		if (n >= 1 && n <= 5) == (state.String() == "Invalid") {
			t.Fatal("unknown lifecycle state looks valid")
		}
	}
}

// Sequences exercise stop/finish races, repeated waits, invalid metadata and
// arbitrary operation order. This tests value invariants, not concurrent claims.
func FuzzRunLifecycle(f *testing.F) {
	for _, seed := range [][]byte{
		{}, {0, 0, 1, 0, 2, 2, 3, 0, 1, 0, 4, 1},
		{0, 0, 1, 0, 5, 1, 6, 5, 4, 5, 0, 0},
		{2, 255, 4, 0, 5, 255, 6, 0},
	} {
		f.Add(seed)
	}
	f.Fuzz(func(t *testing.T, sequence []byte) {
		if len(sequence) > 1024 {
			return
		}
		original := newRun(t)
		r := original
		for i := 0; i+1 < len(sequence); i += 2 {
			before := r
			var err error
			value := sequence[i+1]
			switch sequence[i] % 7 {
			case 0:
				r, err = r.Enqueue()
			case 1:
				r, err = r.Start()
			case 2:
				r, err = r.Wait(WaitingReason(value))
			case 3:
				r, err = r.Requeue()
			case 4:
				r, err = r.Finish(Outcome(value))
			case 5:
				r, err = r.RequestStop(StopCause(value))
			case 6:
				r, err = r.RecordEffectKnowledge(EffectKnowledge(value))
			}
			if err != nil && r != before {
				t.Fatal("rejected operation changed Run")
			}
			if before.State() == Finished && (err == nil || r != before) {
				t.Fatal("terminal Run reopened or mutated")
			}
			checkRun(t, r, original)
		}
	})
}
