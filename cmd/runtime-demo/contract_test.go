package main

import (
	"context"
	"errors"
	"testing"

	"github.com/sherzot/nexora/internal/runtime"
)

func TestContractOrderedMixedBatch(t *testing.T) {
	correlation, supplied := coordinationFixtures(t)
	base := supplied[0]
	otherID, err := runtime.ParseRunID("run_1123456789abcdef0123456789abcdef")
	if err != nil {
		t.Fatal(err)
	}
	wrongRevision, err := base.expectedRevision.Next()
	if err != nil {
		t.Fatal(err)
	}
	finish, err := base.snapshot.PrepareFinish(base.expectedID, base.expectedRevision, runtime.Succeeded)
	if err != nil {
		t.Fatal(err)
	}
	terminal, err := runtime.NewRunSnapshot(finish.Candidate(), finish.ProposedRevision())
	if err != nil {
		t.Fatal(err)
	}
	wait, err := base.snapshot.PrepareWait(base.expectedID, base.expectedRevision, runtime.WaitForExternalInput)
	if err != nil {
		t.Fatal(err)
	}
	waiting, err := runtime.NewRunSnapshot(wait.Candidate(), wait.ProposedRevision())
	if err != nil {
		t.Fatal(err)
	}
	cases := []struct {
		name    string
		fixture finishFixture
		want    error
	}{
		{"success", base, nil},
		{"identity", finishFixture{base.snapshot, otherID, base.expectedRevision, runtime.Succeeded}, runtime.ErrRunIdentityMismatch},
		{"revision", finishFixture{base.snapshot, base.expectedID, wrongRevision, runtime.Succeeded}, runtime.ErrExpectedRevisionMismatch},
		{"terminal", finishFixture{terminal, base.expectedID, terminal.Revision(), runtime.Cancelled}, runtime.ErrTerminalMutation},
		{"illegal", finishFixture{waiting, base.expectedID, waiting.Revision(), runtime.Succeeded}, runtime.ErrIllegalTransition},
		{"invalid outcome", finishFixture{base.snapshot, base.expectedID, base.expectedRevision, runtime.Outcome(0)}, runtime.ErrInvalidValue},
		{"invalid snapshot", finishFixture{}, runtime.ErrInvalidSnapshot},
		{"success after rejections", supplied[1], nil},
	}
	fixtures := make([]finishFixture, len(cases))
	for i, tc := range cases {
		fixtures[i] = tc.fixture
	}
	before := append([]finishFixture(nil), fixtures...)
	results, err := coordinateFixtures(context.Background(), correlation, fixtures)
	if err != nil || len(results) != len(cases) {
		t.Fatalf("batch error=%v results=%d", err, len(results))
	}
	for i, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := results[i]
			if fixtures[i] != before[i] || result.predecessor != before[i].snapshot || result.index != i || result.correlation != correlation {
				t.Fatal("fixture, predecessor, order or correlation changed")
			}
			if tc.want != nil {
				if !errors.Is(result.rejection, tc.want) || result.prepared != (runtime.PreparedRunTransition{}) {
					t.Fatalf("expected zero candidate and classification %v; got %v", tc.want, result.rejection)
				}
				return
			}
			p := result.prepared
			if result.rejection != nil || p.IsZero() || p.PredecessorID() != tc.fixture.expectedID || p.PredecessorRevision() != tc.fixture.expectedRevision || p.Operation() != runtime.OperationFinish || p.ProposedRevision().Value() != tc.fixture.expectedRevision.Value()+1 {
				t.Fatal("successful preparation metadata differs from supplied predecessor")
			}
			candidate := p.Candidate()
			outcome, settled := candidate.FinalOutcome()
			if candidate == before[i].snapshot.Run() || candidate.ID() != before[i].snapshot.Run().ID() || candidate.Attribution() != before[i].snapshot.Run().Attribution() || candidate.State() != runtime.Finished || !settled || outcome != tc.fixture.outcome || candidate.EffectKnowledge() != runtime.EffectUnknown {
				t.Fatal("candidate identity, attribution, lifecycle, outcome or effects changed unexpectedly")
			}
		})
	}
	// Both successes use the same predecessor: neither rejected the other or
	// advanced the caller's snapshot. These candidates establish no exclusivity.
	if results[0].prepared.PredecessorID() != results[7].prepared.PredecessorID() || results[0].prepared.PredecessorRevision() != results[7].prepared.PredecessorRevision() || results[0].prepared.ProposedRevision() != results[7].prepared.ProposedRevision() {
		t.Fatal("competing preparations no longer share predecessor/revision metadata")
	}
}

func TestContractCancellationRetainsCompletedResults(t *testing.T) {
	for _, name := range []string{"before", "between", "after final success", "after final rejection"} {
		t.Run(name, func(t *testing.T) {
			correlation, fixtures := coordinationFixtures(t)
			parent, cancel := context.WithCancel(context.Background())
			defer cancel()
			var ctx context.Context = parent
			wantCount := 0
			var wantRejection error
			if name == "before" {
				cancel()
			} else {
				// Reuse the existing C6 context fixture; its third Err check
				// occurs before item 2, or after item 1 when it is the last.
				ctx = &boundaryCancellation{Context: parent, cancel: cancel}
				wantCount = 1
				if name != "between" {
					fixtures = fixtures[:1]
				}
				if name == "between" || name == "after final rejection" {
					wrong, err := fixtures[0].expectedRevision.Next()
					if err != nil {
						t.Fatal(err)
					}
					fixtures[0].expectedRevision = wrong
					wantRejection = runtime.ErrExpectedRevisionMismatch
				}
			}
			before := append([]finishFixture(nil), fixtures...)
			// Establish the expected completed result independently, without
			// the cancellation wrapper, using the unchanged Runtime API.
			var expected runtime.PreparedRunTransition
			if wantCount == 1 {
				var err error
				f := fixtures[0]
				expected, err = f.snapshot.PrepareFinish(f.expectedID, f.expectedRevision, f.outcome)
				if !errors.Is(err, wantRejection) {
					t.Fatalf("fixture classification: %v", err)
				}
			}
			results, err := coordinateFixtures(ctx, correlation, fixtures)
			if !errors.Is(err, context.Canceled) || len(results) != wantCount {
				t.Fatalf("cancellation=%v result count=%d, want %d", err, len(results), wantCount)
			}
			for i := range fixtures {
				if fixtures[i] != before[i] {
					t.Fatal("cancellation changed caller-owned fixture")
				}
			}
			if wantCount == 1 {
				r := results[0]
				if r.index != 0 || r.correlation != correlation || r.predecessor != before[0].snapshot || r.prepared != expected || !errors.Is(r.rejection, wantRejection) {
					t.Fatal("cancellation lost or changed the completed result")
				}
			}
		})
	}
}
