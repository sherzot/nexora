package main

import (
	"bytes"
	"context"
	"strings"
	"testing"

	"github.com/sherzot/nexora/internal/runtime"
	"github.com/sherzot/nexora/internal/workflow"
)

func coordinationFixtures(t *testing.T) (workflow.WorkflowID, []finishFixture) {
	t.Helper()
	r, e := runningFixture()
	if e != nil {
		t.Fatal(e)
	}
	w, e := workflow.ParseWorkflowID("workflow_0123456789abcdef0123456789abcdef")
	if e != nil {
		t.Fatal(e)
	}
	return w, []finishFixture{{r, r.Run().ID(), r.Revision(), runtime.Succeeded}, {r, r.Run().ID(), r.Revision(), runtime.Cancelled}}
}
func TestCoordinationOrderAndImmutability(t *testing.T) {
	w, fixtures := coordinationFixtures(t)
	before := [2]finishFixture{fixtures[0], fixtures[1]}
	for attempt := 0; attempt < 2; attempt++ {
		results, e := coordinateFixtures(context.Background(), w, fixtures)
		if e != nil || len(results) != 2 {
			t.Fatalf("results: %v", e)
		}
		for i, r := range results {
			if r.index != i || r.correlation != w || r.predecessor != before[i].snapshot || r.rejection != nil || fixtures[i] != before[i] {
				t.Fatal("order, input or correlation changed")
			}
			if e := checkCandidate(before[i].snapshot, r.prepared, runtime.OperationFinish, runtime.Finished); e != nil {
				t.Fatal(e)
			}
			outcome, settled := r.prepared.Candidate().FinalOutcome()
			if !settled || outcome != fixtures[i].outcome || r.prepared.Candidate().EffectKnowledge() != runtime.EffectUnknown {
				t.Fatal("wrong candidate")
			}
		}
		// Caller-owned result slices do not become coordinator state.
		results[0] = fixtureResult{}
	}
}
func TestCoordinationRejections(t *testing.T) {
	w, fixtures := coordinationFixtures(t)
	base := fixtures[0]
	id, e := runtime.ParseRunID("run_1123456789abcdef0123456789abcdef")
	if e != nil {
		t.Fatal(e)
	}
	wrong, e := runtime.NewRunRevision(1)
	if e != nil {
		t.Fatal(e)
	}
	finished, e := base.snapshot.PrepareFinish(base.expectedID, base.expectedRevision, runtime.Succeeded)
	if e != nil {
		t.Fatal(e)
	}
	terminal, e := runtime.NewRunSnapshot(finished.Candidate(), finished.ProposedRevision())
	if e != nil {
		t.Fatal(e)
	}
	wait, e := base.snapshot.PrepareWait(base.expectedID, base.expectedRevision, runtime.WaitForExternalInput)
	if e != nil {
		t.Fatal(e)
	}
	waiting, e := runtime.NewRunSnapshot(wait.Candidate(), wait.ProposedRevision())
	if e != nil {
		t.Fatal(e)
	}
	for _, tc := range []struct {
		name    string
		fixture finishFixture
		want    error
	}{
		{"Identity", finishFixture{base.snapshot, id, base.expectedRevision, runtime.Succeeded}, runtime.ErrRunIdentityMismatch},
		{"Revision", finishFixture{base.snapshot, base.expectedID, wrong, runtime.Succeeded}, runtime.ErrExpectedRevisionMismatch},
		{"Illegal", finishFixture{waiting, base.expectedID, waiting.Revision(), runtime.Succeeded}, runtime.ErrIllegalTransition},
		{"Terminal", finishFixture{terminal, base.expectedID, terminal.Revision(), runtime.Cancelled}, runtime.ErrTerminalMutation},
		{"Unset", finishFixture{}, runtime.ErrInvalidSnapshot},
	} {
		t.Run(tc.name, func(t *testing.T) {
			input := []finishFixture{tc.fixture, base}
			before := input[0]
			results, e := coordinateFixtures(context.Background(), w, input)
			if e != nil || len(results) != 2 || results[0].rejection == nil || !strings.Contains(results[0].rejection.Error(), tc.want.Error()) || !results[0].prepared.IsZero() || results[1].rejection != nil || input[0] != before {
				t.Fatal("rejection was hidden, changed inputs or reordered results")
			}
		})
	}
}

// Cancel deterministically at the next item boundary using a real cancellable
// context. No scheduler timing, goroutines, callbacks or external dependencies.
type boundaryCancellation struct {
	context.Context
	cancel context.CancelFunc
	checks int
}

func (c *boundaryCancellation) Err() error {
	c.checks++
	if c.checks == 3 {
		c.cancel()
	}
	return c.Context.Err()
}
func TestCoordinationCancellation(t *testing.T) {
	w, fixtures := coordinationFixtures(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	results, e := coordinateFixtures(ctx, w, fixtures)
	if e != context.Canceled || len(results) != 0 {
		t.Fatal("pre-cancellation ignored")
	}
	parent, stop := context.WithCancel(context.Background())
	defer stop()
	controlled := &boundaryCancellation{Context: parent, cancel: stop}
	results, e = coordinateFixtures(controlled, w, fixtures)
	if e != context.Canceled || len(results) != 1 || results[0].index != 0 || results[0].rejection != nil {
		t.Fatal("boundary cancellation lost completed work or ran later fixture")
	}
}
func TestCoordinationInputs(t *testing.T) {
	w, fixtures := coordinationFixtures(t)
	if _, e := coordinateFixtures(nil, w, fixtures); e == nil {
		t.Fatal("nil context accepted")
	}
	if _, e := coordinateFixtures(context.Background(), workflow.WorkflowID{}, fixtures); e == nil {
		t.Fatal("unset correlation accepted")
	}
	results, e := coordinateFixtures(context.Background(), w, nil)
	if e != nil || len(results) != 0 {
		t.Fatal("empty supplied fixture batch failed")
	}
}
func TestCoordinationTranscript(t *testing.T) {
	const want = "Synthetic local values only; no operational acceptance, queue admission, execution or authoritative commit.\ncoordination: workflow=workflow_0123456789abcdef0123456789abcdef; three supplied fixtures; input order; correlation only.\nfixture[0]: Running/3 -> prepared Finished/4 outcome=Succeeded effects=Unknown.\nfixture[1]: rejected ErrExpectedRevisionMismatch; zero candidate.\nfixture[2]: rejected ErrTerminalMutation; zero candidate.\nPredecessors unchanged; no Workflow execution, scheduling, retries or external effects.\n"
	for i := 0; i < 2; i++ {
		var out, diagnostic bytes.Buffer
		if code := execute([]string{"--scenario=coordinate"}, &out, &diagnostic); code != 0 || diagnostic.Len() != 0 || out.String() != want {
			t.Fatalf("transcript: %q diagnostics: %q", out.String(), diagnostic.String())
		}
	}
	var diagnostic bytes.Buffer
	if code := execute([]string{"--scenario=coordinate"}, failingWriter{}, &diagnostic); code != 1 {
		t.Fatal("output failure concealed")
	}
}
