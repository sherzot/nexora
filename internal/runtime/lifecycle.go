package runtime

// LifecycleState describes a logical Run, not a worker, Workflow or operation.
// Zero and unknown values are invalid; String is diagnostic, not a wire contract.
type LifecycleState uint8

const (
	Created LifecycleState = iota + 1
	Queued
	Running
	Waiting
	Finished
)

func (s LifecycleState) valid() bool { return s >= Created && s <= Finished }
func (s LifecycleState) String() string {
	if !s.valid() {
		return "Invalid"
	}
	return [...]string{"", "Created", "Queued", "Running", "Waiting", "Finished"}[s]
}

// WaitingReason is the categorical part of a dependency wait (ADR-003 6.5).
// Resolver, correlation, expiry and resume validation are future owner contracts.
// No reason grants permission or establishes that its dependency is resolved.
type WaitingReason uint8

const (
	WaitForTool WaitingReason = iota + 1
	WaitForApproval
	WaitForWorkflow
	WaitForExternalInput
	WaitForRetryTimer
)

func (r WaitingReason) valid() bool { return r >= WaitForTool && r <= WaitForRetryTimer }
func (r WaitingReason) String() string {
	if !r.valid() {
		return "Invalid"
	}
	return [...]string{"", "Tool", "Approval", "Workflow", "ExternalInput", "RetryTimer"}[r]
}

// Outcome settles only this Run attempt. Task acceptance and operation effects
// remain owned separately. Cancelled and TimedOut never establish rollback.
type Outcome uint8

const (
	Succeeded Outcome = iota + 1
	Failed
	Cancelled
	TimedOut
	Indeterminate
)

func (o Outcome) valid() bool { return o >= Succeeded && o <= Indeterminate }
func (o Outcome) String() string {
	if !o.valid() {
		return "Invalid"
	}
	return [...]string{"", "Succeeded", "Failed", "Cancelled", "TimedOut", "Indeterminate"}[o]
}

// EffectKnowledge is a caller-supplied Runtime projection, never authoritative
// Tool/Execution evidence, operation results or authorization. Confirmed labels
// describe the report, not independently verified provenance or receipt custody.
// No ordering, safe-retry or exactly-once claim follows.
type EffectKnowledge uint8

const (
	EffectNotDispatched EffectKnowledge = iota + 1
	EffectConfirmedNotPerformed
	EffectConfirmedPerformed
	EffectConfirmedPartiallyPerformed
	EffectUnknown
)

func (e EffectKnowledge) valid() bool {
	return e >= EffectNotDispatched && e <= EffectUnknown
}
func (e EffectKnowledge) String() string {
	if !e.valid() {
		return "Invalid"
	}
	return [...]string{"", "NotDispatched", "ConfirmedNotPerformed", "ConfirmedPerformed", "ConfirmedPartiallyPerformed", "Unknown"}[e]
}

// StopCause retains the first local stop intent's cause (ADR-003 6.6).
// It is neither authenticated requester attribution nor termination evidence.
// Requester identity, time, source references and acknowledgement remain deferred.
type StopCause uint8

const (
	StopUserCancellation StopCause = iota + 1
	StopWorkflowCancellation
	StopDeadlineExpiration
	StopPolicyRevocation
	// StopWorkerShutdown is deliberately initiated shutdown intent, not observed
	// unexpected worker loss. Loss observation/recovery is deferred to its owner.
	StopWorkerShutdown
	StopProviderCancellation
	StopToolOrProcessCancellation
)

func (c StopCause) valid() bool {
	return c >= StopUserCancellation && c <= StopToolOrProcessCancellation
}
func (c StopCause) String() string {
	if !c.valid() {
		return "Invalid"
	}
	return [...]string{"", "UserCancellation", "WorkflowCancellation", "DeadlineExpiration", "PolicyRevocation", "WorkerShutdown", "ProviderCancellation", "ToolOrProcessCancellation"}[c]
}
