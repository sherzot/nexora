package main

import (
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/sherzot/nexora/internal/runtime"
	"github.com/sherzot/nexora/internal/workflow"
)

// finishFixture is an already-constructed development snapshot and an explicit
// synthetic finish report. It is neither a command envelope nor launch authority.
type finishFixture struct {
	snapshot         runtime.RunSnapshot
	expectedID       runtime.RunID
	expectedRevision runtime.RunRevision
	outcome          runtime.Outcome
}

type fixtureResult struct {
	correlation workflow.WorkflowID
	index       int
	predecessor runtime.RunSnapshot
	prepared    runtime.PreparedRunTransition
	rejection   error
}

// coordinateFixtures prepares independent finish candidates in input order.
// Rejections are retained in order; cancellation stops before the next item and
// returns only results already prepared/rejected. Nothing is committed or retried.
// Workflow identity is carried unchanged solely for correlation.
func coordinateFixtures(ctx context.Context, correlation workflow.WorkflowID, fixtures []finishFixture) ([]fixtureResult, error) {
	if ctx == nil || correlation.IsZero() {
		return nil, errors.New("development coordination requires context and Workflow correlation")
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	results := make([]fixtureResult, 0, len(fixtures))
	for i, fixture := range fixtures {
		if err := ctx.Err(); err != nil {
			return results, err
		}
		candidate, err := fixture.snapshot.PrepareFinish(fixture.expectedID, fixture.expectedRevision, fixture.outcome)
		results = append(results, fixtureResult{correlation, i, fixture.snapshot, candidate, err})
	}
	if err := ctx.Err(); err != nil {
		return results, err
	}
	return results, nil
}

func demonstrateCoordination(out io.Writer) error {
	running, err := runningFixture()
	if err != nil {
		return err
	}
	correlation, err := workflow.ParseWorkflowID("workflow_0123456789abcdef0123456789abcdef")
	if err != nil {
		return err
	}
	finish, err := running.PrepareFinish(running.Run().ID(), running.Revision(), runtime.Succeeded)
	if err != nil {
		return err
	}
	terminal, err := runtime.NewRunSnapshot(finish.Candidate(), finish.ProposedRevision())
	if err != nil {
		return err
	}
	stale, err := runtime.NewRunRevision(2)
	if err != nil {
		return err
	}
	fixtures := []finishFixture{
		{running, running.Run().ID(), running.Revision(), runtime.Succeeded},
		{running, running.Run().ID(), stale, runtime.Succeeded},
		{terminal, terminal.Run().ID(), terminal.Revision(), runtime.Cancelled},
	}
	before := [3]finishFixture{fixtures[0], fixtures[1], fixtures[2]}
	results, err := coordinateFixtures(context.Background(), correlation, fixtures)
	if err != nil {
		return err
	}
	if len(results) != 3 {
		return errors.New("unexpected local coordination result count")
	}
	for i, r := range results {
		if r.index != i || r.correlation != correlation || r.predecessor != fixtures[i].snapshot || fixtures[i] != before[i] {
			return errors.New("local coordination order, correlation or predecessor changed")
		}
	}
	if err = checkCandidate(running, results[0].prepared, runtime.OperationFinish, runtime.Finished); err != nil {
		return err
	}
	outcome, settled := results[0].prepared.Candidate().FinalOutcome()
	if results[0].rejection != nil || !settled || outcome != runtime.Succeeded || results[0].prepared.Candidate().EffectKnowledge() != runtime.EffectUnknown || !errors.Is(results[1].rejection, runtime.ErrExpectedRevisionMismatch) || !results[1].prepared.IsZero() || !errors.Is(results[2].rejection, runtime.ErrTerminalMutation) || !results[2].prepared.IsZero() {
		return errors.New("unexpected local coordination outcome")
	}
	_, err = fmt.Fprintf(out, scenarioBoundary+"coordination: workflow=%s; three supplied fixtures; input order; correlation only.\nfixture[0]: Running/3 -> prepared Finished/4 outcome=Succeeded effects=Unknown.\nfixture[1]: rejected ErrExpectedRevisionMismatch; zero candidate.\nfixture[2]: rejected ErrTerminalMutation; zero candidate.\nPredecessors unchanged; no Workflow execution, scheduling, retries or external effects.\n", correlation)
	return err
}
