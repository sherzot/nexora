# C5 fixed-fixture local lifecycle demonstration

Run every fixed scenario, in deterministic order:

```sh
go run ./cmd/runtime-demo --scenario=all
```

For the established offline environment, use the verified isolated Go 1.27.3
executable with its explicit GOROOT, GOTOOLCHAIN=local, GOPROXY=off and
GOFLAGS=-mod=readonly. No database, container, credentials or external service is
needed by this command.

The combined transcript contains four independent synthetic demonstrations:

1. Created/1 construction; enqueue and start candidates; illegal Created-to-Running
   rejection; Succeeded finish with Unknown effects; terminal mutation rejection;
   competing finish/stop preparations from the same predecessor revision.
2. Running → Waiting (ExternalInput) → Queued → Running, clearing categorical
   waiting metadata on requeue. No actual dependency is resolved.
3. Stop intent without implicit lifecycle/outcome/effect changes; prohibited
   advancement rejection; separately prepared Cancelled terminal outcome.
4. Run identity mismatch, expected revision mismatch and revision overflow
   rejection, with zero rejected candidates and unchanged predecessors.

All candidate metadata, revision and predecessor checks use the existing Runtime
APIs. Selecting a candidate copy for the next local snapshot is not an authoritative
commit. Each scenario starts from independent hardcoded fixtures; the combined
command is not a production orchestration or creation/admission pipeline.

Existing invocations remain unchanged:

```sh
go run ./cmd/runtime-demo
go run ./cmd/runtime-demo --scenario=wait-resume
go run ./cmd/runtime-demo --scenario=stop
go run ./cmd/runtime-demo --scenario=revision-guards
```

Output goes only to stdout, with errors/usage on stderr. Exit codes: 0 for a
successful demonstration, 1 for execution/output failure, 2 for invalid arguments.
The combined command stops on the first failure and does not run later scenarios.
No arbitrary fixture or configuration input is accepted.

This development command introduces no operational Run creation, source lookup,
authorization, persistence, admission, dispatch, Temporal execution, durable
outcome evidence or recovery. The governed first creation use case still ends at
Created; the transitions here are local value demonstrations only. D02 remains
NOT ACCEPTED, normative obligations REVIEW ONLY, O1–O5 and GO-2026-5932 OPEN.

## C6 in-memory fixture coordination

```sh
go run ./cmd/runtime-demo --scenario=coordinate
```

The private development coordinator accepts an explicit context, a preconstructed
WorkflowID used only for correlation, and an ordered slice of preconstructed Run
snapshots with expected identity/revision and synthetic finish outcomes. It calls
PrepareFinish once per item. It neither constructs Runs nor selects candidates as
committed state. Per-item rejection results remain in input order; cancellation
stops before the next item and returns the already-produced results, without
retry or recovery. No goroutines, scheduler, service or external calls are added.

The fixed CLI example shows a valid finish candidate, a stale-revision rejection,
and a terminal mutation rejection. Tests additionally cover illegal transitions,
identity mismatch, invalid snapshots, repeated deterministic calls, unchanged
inputs and cancellation between items. Workflow identity grants no authority or
execution behavior. C5's --scenario=all and all earlier transcripts are unchanged.
