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
	run := demonstrate
	if len(args) != 0 {
		if len(args) != 1 {
			return usage(diagnostic)
		}
		switch args[0] {
		case "--scenario=all":
			run = demonstrateAll
		case "--scenario=wait-resume":
			run = demonstrateWaitResume
		case "--scenario=stop":
			run = demonstrateStop
		case "--scenario=revision-guards":
			run = demonstrateRevisionGuards
		default:
			return usage(diagnostic)
		}
	}
	if err := run(out); err != nil {
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

func usage(out io.Writer) int {
	fmt.Fprintln(out, "usage: runtime-demo (no arguments) | --scenario=wait-resume | --scenario=stop | --scenario=revision-guards | --scenario=all")
	return 2
}

// Synthetic snapshots only: constructing or selecting copies grants no authority.
func runningFixture() (runtime.RunSnapshot, error) {
	id, err := runtime.ParseRunID("run_0123456789abcdef0123456789abcdef")
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	configuration, err := runtime.ParseConfigurationRevisionRef("demo:configuration-1")
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	assignment, err := runtime.ParseAssignmentRevisionRef("demo:assignment-1")
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	attribution, err := runtime.NewRunConfigurationAttribution(id, configuration, assignment)
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	run, err := runtime.NewRun(id, attribution)
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	revision, err := runtime.NewRunRevision(1)
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	created, err := runtime.NewRunSnapshot(run, revision)
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	enqueue, err := created.PrepareEnqueue(id, revision)
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	queued, err := selectCandidate(created, enqueue, runtime.OperationEnqueue, runtime.Queued)
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	start, err := queued.PrepareStart(id, queued.Revision())
	if err != nil {
		return runtime.RunSnapshot{}, err
	}
	return selectCandidate(queued, start, runtime.OperationStart, runtime.Running)
}

func selectCandidate(before runtime.RunSnapshot, candidate runtime.PreparedRunTransition, operation runtime.RunOperation, state runtime.LifecycleState) (runtime.RunSnapshot, error) {
	if err := checkCandidate(before, candidate, operation, state); err != nil {
		return runtime.RunSnapshot{}, err
	}
	return runtime.NewRunSnapshot(candidate.Candidate(), candidate.ProposedRevision())
}

const scenarioBoundary = "Synthetic local values only; no operational acceptance, queue admission, execution or authoritative commit.\n"

func demonstrateWaitResume(out io.Writer) error {
	running, err := runningFixture()
	if err != nil {
		return err
	}
	beforeRunning := running
	wait, err := running.PrepareWait(running.Run().ID(), running.Revision(), runtime.WaitForExternalInput)
	if err != nil {
		return err
	}
	waiting, err := selectCandidate(running, wait, runtime.OperationWait, runtime.Waiting)
	if err != nil {
		return err
	}
	beforeWaiting := waiting
	reason, present := waiting.Run().WaitingReason()
	if !present || reason != runtime.WaitForExternalInput {
		return errors.New("unexpected local waiting reason")
	}
	requeue, err := waiting.PrepareRequeue(waiting.Run().ID(), waiting.Revision())
	if err != nil {
		return err
	}
	queued, err := selectCandidate(waiting, requeue, runtime.OperationRequeue, runtime.Queued)
	if err != nil {
		return err
	}
	beforeQueued := queued
	if reason, present := queued.Run().WaitingReason(); present || reason != 0 {
		return errors.New("requeue retained categorical waiting information")
	}
	start, err := queued.PrepareStart(queued.Run().ID(), queued.Revision())
	if err != nil {
		return err
	}
	resumed, err := selectCandidate(queued, start, runtime.OperationStart, runtime.Running)
	if err != nil {
		return err
	}
	if reason, present := resumed.Run().WaitingReason(); present || reason != 0 {
		return errors.New("resumed value retained waiting information")
	}
	if running != beforeRunning || waiting != beforeWaiting || queued != beforeQueued {
		return errors.New("local wait/resume predecessor changed")
	}
	_, err = fmt.Fprintf(out, scenarioBoundary+"wait-resume: %s/%d -> %s/%d reason=%s -> %s/%d -> %s/%d\nCategorical wait cleared by requeue; predecessors unchanged; no actual dependency resolution.\n", running.Run().State(), running.Revision().Value(), waiting.Run().State(), waiting.Revision().Value(), reason, queued.Run().State(), queued.Revision().Value(), resumed.Run().State(), resumed.Revision().Value())
	return err
}

func demonstrateStop(out io.Writer) error {
	running, err := runningFixture()
	if err != nil {
		return err
	}
	beforeRunning := running
	stop, err := running.PrepareRequestStop(running.Run().ID(), running.Revision(), runtime.StopUserCancellation)
	if err != nil {
		return err
	}
	stopped, err := selectCandidate(running, stop, runtime.OperationRequestStop, runtime.Running)
	if err != nil {
		return err
	}
	beforeStopped := stopped
	cause, requested := stopped.Run().StopRequest()
	outcome, settled := stopped.Run().FinalOutcome()
	originalOutcome, originalSettled := running.Run().FinalOutcome()
	if !requested || cause != runtime.StopUserCancellation || outcome != originalOutcome || settled != originalSettled || stopped.Run().EffectKnowledge() != running.Run().EffectKnowledge() {
		return errors.New("stop changed outcome or effects")
	}
	rejected, err := stopped.PrepareWait(stopped.Run().ID(), stopped.Revision(), runtime.WaitForExternalInput)
	if !errors.Is(err, runtime.ErrStopRequested) || !rejected.IsZero() {
		return errors.New("stop did not reject advancement")
	}
	finish, err := stopped.PrepareFinish(stopped.Run().ID(), stopped.Revision(), runtime.Cancelled)
	if err != nil {
		return err
	}
	finished, err := selectCandidate(stopped, finish, runtime.OperationFinish, runtime.Finished)
	if err != nil {
		return err
	}
	final, settled := finished.Run().FinalOutcome()
	finalCause, finalRequested := finished.Run().StopRequest()
	if !settled || final != runtime.Cancelled || !finalRequested || finalCause != cause || finished.Run().EffectKnowledge() != runtime.EffectUnknown {
		return errors.New("unexpected separate terminal candidate")
	}
	if running != beforeRunning || stopped != beforeStopped {
		return errors.New("local stop predecessor changed")
	}
	_, err = fmt.Fprintf(out, scenarioBoundary+"stop: %s/%d -> %s/%d stop-intent=%s; outcome unset; effects=%s\nAdvancement rejected: ErrStopRequested; zero candidate; predecessors unchanged.\nSeparate finish: %s/%d outcome=%s effects=%s; no termination, rollback or external-effect evidence.\n", running.Run().State(), running.Revision().Value(), stopped.Run().State(), stopped.Revision().Value(), cause, stopped.Run().EffectKnowledge(), finished.Run().State(), finished.Revision().Value(), final, finished.Run().EffectKnowledge())
	return err
}

func demonstrateRevisionGuards(out io.Writer) error {
	running, err := runningFixture()
	if err != nil {
		return err
	}
	beforeRunning := running
	otherID, err := runtime.ParseRunID("run_1123456789abcdef0123456789abcdef")
	if err != nil {
		return err
	}
	rejected, err := running.PrepareWait(otherID, running.Revision(), runtime.WaitForExternalInput)
	if !errors.Is(err, runtime.ErrRunIdentityMismatch) || !rejected.IsZero() {
		return errors.New("expected snapshot identity mismatch")
	}
	wrongRevision, err := runtime.NewRunRevision(2)
	if err != nil {
		return err
	}
	rejected, err = running.PrepareWait(running.Run().ID(), wrongRevision, runtime.WaitForExternalInput)
	if !errors.Is(err, runtime.ErrExpectedRevisionMismatch) || !rejected.IsZero() {
		return errors.New("expected revision mismatch")
	}
	maximum, err := runtime.NewRunRevision(^uint64(0))
	if err != nil {
		return err
	}
	exhausted, err := runtime.NewRunSnapshot(running.Run(), maximum)
	if err != nil {
		return err
	}
	beforeExhausted := exhausted
	rejected, err = exhausted.PrepareWait(exhausted.Run().ID(), exhausted.Revision(), runtime.WaitForExternalInput)
	if !errors.Is(err, runtime.ErrRevisionOverflow) || !rejected.IsZero() {
		return errors.New("expected revision overflow rejection")
	}
	if running != beforeRunning || exhausted != beforeExhausted {
		return errors.New("revision guard predecessor changed")
	}
	_, err = fmt.Fprint(out, scenarioBoundary+"revision-guards: identity mismatch rejected ErrRunIdentityMismatch; zero candidate.\nExpected revision mismatch rejected ErrExpectedRevisionMismatch; zero candidate.\nRevision overflow rejected ErrRevisionOverflow; zero candidate; no wrapping.\nAll predecessors unchanged; checks concern supplied snapshots only.\n")
	return err
}

// demonstrateAll composes existing fixed-fixture scenarios, not a production
// creation/admission flow. Each scenario constructs independent local values.
func demonstrateAll(out io.Writer) error {
	for _, scenario := range []func(io.Writer) error{
		demonstrate, demonstrateWaitResume, demonstrateStop, demonstrateRevisionGuards,
	} {
		if err := scenario(out); err != nil {
			return err
		}
	}
	return nil
}
