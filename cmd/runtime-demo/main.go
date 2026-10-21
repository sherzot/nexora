// Command runtime-demo demonstrates local values using fixed synthetic fixtures.
package main

import (
	"errors"
	"fmt"
	"io"
	"os"

	"github.com/sherzot/nexora/internal/runtime"
)

func main() {
	os.Exit(execute(os.Args[1:], os.Stdout, os.Stderr))
}

func execute(args []string, out, diagnostic io.Writer) int {
	if len(args) != 0 {
		fmt.Fprintln(diagnostic, "usage: runtime-demo (no arguments)")
		return 2
	}
	if err := demonstrate(out); err != nil {
		fmt.Fprintln(diagnostic, "runtime-demo:", err)
		return 1
	}
	return 0
}

func demonstrate(out io.Writer) error {
	id, err := runtime.ParseRunID("run_0123456789abcdef0123456789abcdef")
	if err != nil {
		return err
	}
	configuration, err := runtime.ParseConfigurationRevisionRef("demo:configuration-1")
	if err != nil {
		return err
	}
	assignment, err := runtime.ParseAssignmentRevisionRef("demo:assignment-1")
	if err != nil {
		return err
	}
	attribution, err := runtime.NewRunConfigurationAttribution(id, configuration, assignment)
	if err != nil {
		return err
	}
	run, err := runtime.NewRun(id, attribution)
	if err != nil {
		return err
	}
	revision, err := runtime.NewRunRevision(1)
	if err != nil {
		return err
	}
	created, err := runtime.NewRunSnapshot(run, revision)
	if err != nil {
		return err
	}
	if run.State() != runtime.Created || run.EffectKnowledge() != runtime.EffectUnknown {
		return errors.New("unexpected initial local value")
	}
	if _, settled := run.FinalOutcome(); settled {
		return errors.New("Created unexpectedly has a final outcome")
	}
	beforeCreated := created
	enqueue, err := created.PrepareEnqueue(id, created.Revision())
	if err != nil {
		return err
	}
	if err := checkCandidate(created, enqueue, runtime.OperationEnqueue, runtime.Queued); err != nil {
		return err
	}
	// Selecting value copies for this demonstration is not authoritative commit.
	queued, err := runtime.NewRunSnapshot(enqueue.Candidate(), enqueue.ProposedRevision())
	if err != nil {
		return err
	}
	beforeQueued := queued
	start, err := queued.PrepareStart(id, queued.Revision())
	if err != nil {
		return err
	}
	if err := checkCandidate(queued, start, runtime.OperationStart, runtime.Running); err != nil {
		return err
	}
	running, err := runtime.NewRunSnapshot(start.Candidate(), start.ProposedRevision())
	if err != nil {
		return err
	}
	beforeRunning := running
	illegal, err := created.PrepareStart(id, created.Revision())
	if !errors.Is(err, runtime.ErrIllegalTransition) || !illegal.IsZero() {
		return errors.New("expected illegal local transition rejection")
	}
	finish, err := running.PrepareFinish(id, running.Revision(), runtime.Succeeded)
	if err != nil {
		return err
	}
	if err := checkCandidate(running, finish, runtime.OperationFinish, runtime.Finished); err != nil {
		return err
	}
	outcome, settled := finish.Candidate().FinalOutcome()
	if !settled || outcome != runtime.Succeeded || finish.Candidate().EffectKnowledge() != runtime.EffectUnknown {
		return errors.New("local outcome/effect distinction changed")
	}
	finished, err := runtime.NewRunSnapshot(finish.Candidate(), finish.ProposedRevision())
	if err != nil {
		return err
	}
	beforeFinished := finished
	terminal, err := finished.PrepareRequestStop(id, finished.Revision(), runtime.StopUserCancellation)
	if !errors.Is(err, runtime.ErrTerminalMutation) || !errors.Is(err, runtime.ErrIllegalTransition) || !terminal.IsZero() {
		return errors.New("expected terminal local mutation rejection")
	}
	stop, err := running.PrepareRequestStop(id, running.Revision(), runtime.StopUserCancellation)
	if err != nil {
		return err
	}
	if err := checkCandidate(running, stop, runtime.OperationRequestStop, runtime.Running); err != nil {
		return err
	}
	cause, requested := stop.Candidate().StopRequest()
	if !requested || cause != runtime.StopUserCancellation || stop.ProposedRevision() != finish.ProposedRevision() || stop.Candidate() == finish.Candidate() {
		return errors.New("competing local candidates lost their distinct meanings")
	}
	if created != beforeCreated || queued != beforeQueued || running != beforeRunning || finished != beforeFinished || created.Run() != run {
		return errors.New("local predecessor changed")
	}
	// Diagnostic text only: no complete Run serialization contract is introduced.
	_, err = fmt.Fprintf(out, "Local Runtime demo — synthetic fixtures; no operational creation, authorization, commit, persistence or dispatch.\n"+
		"Created: state=%s revision=%d effects=%s final-outcome=unset\n"+
		"Prepared enqueue: candidate=%s proposed-revision=%d predecessor=Created/1 unchanged\n"+
		"Local value selection only; not operational queue admission or execution.\n"+
		"Prepared start: candidate=%s proposed-revision=%d predecessor=Queued/2 unchanged\n"+
		"Illegal start from Created/1: rejected ErrIllegalTransition; zero candidate; predecessor unchanged\n"+
		"Prepared finish: candidate=%s proposed-revision=%d outcome=%s effects=%s (synthetic local report only)\n"+
		"Terminal stop from Finished/4: rejected ErrTerminalMutation and ErrIllegalTransition; zero candidate; predecessor unchanged\n"+
		"Competing preparations from Running/3: finish=%s/4 stop=%s/4 stop-intent=%s; both prepared; no exclusivity or winner\n",
		run.State(), revision.Value(), run.EffectKnowledge(),
		enqueue.Candidate().State(), enqueue.ProposedRevision().Value(),
		start.Candidate().State(), start.ProposedRevision().Value(),
		finish.Candidate().State(), finish.ProposedRevision().Value(), outcome, finish.Candidate().EffectKnowledge(),
		finish.Candidate().State(), stop.Candidate().State(), cause)
	return err
}

func checkCandidate(predecessor runtime.RunSnapshot, prepared runtime.PreparedRunTransition, operation runtime.RunOperation, state runtime.LifecycleState) error {
	if prepared.IsZero() || prepared.PredecessorID() != predecessor.Run().ID() ||
		prepared.PredecessorRevision() != predecessor.Revision() || prepared.Operation() != operation ||
		prepared.Candidate().ID() != predecessor.Run().ID() || prepared.Candidate().Attribution() != predecessor.Run().Attribution() ||
		prepared.Candidate().State() != state || prepared.ProposedRevision().Value() != predecessor.Revision().Value()+1 {
		return errors.New("unexpected local prepared candidate")
	}
	return nil
}
