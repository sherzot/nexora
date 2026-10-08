# Implementation Phase 3 — Agent Runtime Core Lifecycle & Run Model

## Authorization and verified baseline

Explicit human project-owner implementation authorization dated 2026-10-08 permits only provider-neutral, persistence-free Agent Run lifecycle domain semantics, focused tests and directly supporting scope documentation. This record is not an ADR. The owner authorizes one coherent feature commit and push; no PR, merge, branch deletion, Phase 4 or adjacent subsystem implementation is authorized.

- Repository/module: `sherzot/nexora` / `github.com/sherzot/nexora`.
- Starting branch: clean `main`, matching tracking and live remote at `07e5ed8d14dad5f655b9a28b740e0e8b4c5a207e`.
- PR #2 verified MERGED; Phase 2 commit `d0c61baf23e89e84b4d745aaf6507d3d803680e4` remains an ancestor.
- Phase 1 baseline: `6c7ffbde744f8430273c1a71ca469491957345ef`.
- Architecture baseline: `cebc1d30b8235acfec608ce5bee465e11060db5c`; all twelve ADRs Accepted and byte-preserved, together with constitution/principles.
- Feature branch: `feat/agent-run-lifecycle`, created from the exact Phase 2 merge.
- Go remains `1.27.1`; no module/dependency change.

Governance, README, Phase 1/2 records, architecture context/principles/index and Accepted ADR constraints were inspected before implementation. Current explicit authorization supersedes historical documentation scope restrictions without revising their historical records. ADR-003 sections 6.5–6.8, accepted invariants 5–8 and 16 are the primary authority. ADR-004 sections 6.1/6.2/6.6, ADR-007 operation/effect semantics, ADR-008 Job/Attempt/termination ownership, ADR-009 current authority, ADR-010 Approval ownership, ADR-011 evidence ownership and ADR-012 readiness gates constrain the model. No accepted conflict requiring amendment was found.

## Ownership discovery matrix

| Concept | Authoritative owner | Phase 3 responsibility | Explicitly not owned |
| --- | --- | --- | --- |
| Run identity | Agent Runtime | Reuse `RunID`; enforce matching attribution | Authority, generation, principal |
| Historical configuration/assignment | Source owners; Runtime historical projection | Reuse frozen Phase 2 attribution | Current configuration truth, complete launch record |
| Lifecycle | Agent Runtime | Five states and guarded semantic operations | Workflow orchestration, execution dispatch |
| Waiting reason | Agent Runtime | Typed categorical reason | Dependency resolution, Approval decision, durable wait protocol |
| Final outcome | Agent Runtime | Explicit settled Run conclusion | Task acceptance, complete external effect truth |
| Effect knowledge | Tool/Execution/resource operation owners; Runtime projection | Caller-supplied bounded categorical projection only | Provider truth, evidence validation, reconciliation or aggregation engine |
| Stop request | Agent Runtime | First local cause; block further advancement | Authenticated requester, propagated stop, acknowledgement or proven termination |
| Workflow identity/state | Workflow | None; existing ID unchanged | Run identity; engine/Temporal behavior |
| Tool operation | Tool owner | None; existing ID unchanged | Run lifecycle takeover; Tool dispatch/result |
| Execution Job | Execution owner | None; existing ID unchanged | Run lifecycle takeover; process/sandbox termination |
| Approval | Approval owner | Category can name a wait only | Creation, decision, quorum, usability, consumption |
| Current authorization | Security and consequential owners | No implementation; caller obligations stated | Historical attribution as authority |

No Workflow/Tool/Execution/Approval IDs are forced into the model. No cross-owner imports or shared model package is introduced.

## Value ownership and construction

`Run` is an immutable value: private fields, semantic methods returning `(Run, error)`, no public setters. Errors return the unchanged receiver. Successful calls leave earlier value copies unchanged; callers explicitly retain the returned value. This avoids alias mutation of history and makes local transition review straightforward. It is not atomic ownership, concurrency control or durable history. Competing value copies must be coordinated by a future authoritative application boundary; no mutex/goroutine/claim store is implemented.

`NewRun(id, attribution)` requires a nonzero `RunID`, valid nonzero Phase 2 attribution and exact ID match. It starts at Created, with no waiting reason, no final outcome, no stop request and EffectUnknown. Run ID is derived from the immutable attribution instead of stored twice. The Go zero value remains an explicit unset value and rejects every operation; it is not a valid Created Run. Enum zero/unknown values are invalid. No parser accepts arbitrary lifecycle strings; diagnostic `String` methods return `Invalid` for unknown values and do not define a wire schema.

This is a partial in-memory Run model. Complete launch attribution—including Agent Instance, Task, trusted initiator/delegator and tenant/project/resource scope—remains deferred. No Run is dispatched by construction or transition. No current authorization, Approval, credentials, provider state, prompts or memory enter attribution.

## Exact legal transition relation

All advancement operations require a constructed nonterminal Run and no stop request. The caller must separately establish current owner/policy/budget/dependency guards before real work; a successful domain method does not establish them.

| From | Operation | To | Required local data |
| --- | --- | --- | --- |
| Created | `Enqueue` | Queued | No stop request |
| Queued | `Start` | Running | No stop request |
| Running | `Wait` | Waiting | Valid WaitingReason; no stop request |
| Waiting | `Requeue` | Queued | No stop request; clears reason |
| Created | `Finish` | Finished | Failed, Cancelled or TimedOut |
| Queued | `Finish` | Finished | Failed, Cancelled, TimedOut or Indeterminate |
| Running | `Finish` | Finished | Succeeded, Failed, Cancelled, TimedOut or Indeterminate |
| Waiting | `Finish` | Finished | Failed, Cancelled, TimedOut or Indeterminate; clears reason |
| Finished | Any operation | Rejected, unchanged | Terminal values cannot mutate |

Every unlisted lifecycle transition is rejected. No direct Waiting → Running, Created → Running, Running → Queued, or terminal reopen exists. The normal sequence is `Created → Queued → Running → Waiting → Queued → Running → Finished`; Running can finish directly. The outcome guards follow ADR-003's early rejection/expiry/stop paths: Created cannot claim unexecuted success or a lost started attempt. Success requires Running. Queued can represent resumed admission after earlier work, so uncertainty remains representable there; Waiting may retain uncertainty about outstanding work. Indeterminate in these non-Created states is supported by ADR-003's worker-loss/ambiguous-evidence rule, not inferred from queue position.

| State | Meaning | Valid operations | Excluded meaning |
| --- | --- | --- | --- |
| Created | Identity and partial historical configuration references established; not admitted | Enqueue, allowed Finish, RequestStop, WithEffectKnowledgeProjection | Permission, Approval, Temporal scheduling, dispatch, sandbox |
| Queued | Local Runtime admission/readiness, awaiting a logical claim | Start, allowed Finish, RequestStop, WithEffectKnowledgeProjection | Current authority, guaranteed capacity, actual queue technology |
| Running | Logical Run segment can advance | Wait, all Finish outcomes, RequestStop, WithEffectKnowledgeProjection | Goroutine/process, Activity, model/Tool call or sandbox identity |
| Waiting | Logical advancement suspended on a categorical dependency | Requeue, allowed Finish, RequestStop, WithEffectKnowledgeProjection | Resolved dependency, granted Approval, worker/process retention |
| Finished | Runtime attempt no longer advances | Read access only | Every child stopped, no effect, rollback, task accepted |

`RequestStop` and `WithEffectKnowledgeProjection` do not change lifecycle. With stop intent present, Enqueue/Start/Wait/Requeue reject with ErrStopRequested; explicit Finish and effect recording remain available. Repeated stop requests also reject, preserving the first cause. Normal invalid operations return sentinel errors (invalid Run, invalid metadata, illegal transition, stop already requested) instead of panicking or silently ignoring them.

## Waiting

WaitingReason is a distinct typed enum: Tool, Approval, Workflow, ExternalInput, RetryTimer. These are exactly ADR-003 section 6.5's categories. RetryTimer is only a categorical label, not a timer, retry policy, counter or engine. There is no speculative resource taxonomy. A reason is present only in Waiting and is cleared by Requeue or Finish; it grants no authority.

This phase does **not** implement a complete operational wait. Correlation reference, expected resolver, expiry/deadline, durable intent, ownership validation and current-policy/resolution checks are required before actual suspension/resumption of work and remain future owner/application contracts. `Requeue` does not validate a notification or decide Approval usability. No sleeping goroutines, channels, timer scheduling or durable orchestration is introduced.

## Outcomes and stop intent

Finished has exactly one valid Outcome: Succeeded, Failed, Cancelled, TimedOut or Indeterminate. Nonterminal values expose no settled outcome. The caller explicitly establishes a terminal conclusion; the model cannot prove external termination, required-result validation or operation truth. Succeeded records passed Run result checks/known required outcomes under ADR-003; it is not Task acceptance. Failed is a known failure, not evidence of no effect. Cancelled/TimedOut describe stopped advancement, not rollback or safe retry. Indeterminate means no stronger reliable Run conclusion can be established; it is not Failed, Cancelled or a retry grant.

The first local StopCause is retained independently: UserCancellation, WorkflowCancellation, DeadlineExpiration, PolicyRevocation, WorkerShutdown, ProviderCancellation, ToolOrProcessCancellation. These follow ADR-003 section 6.6's cause classes for explicitly initiated stop intent. StopWorkerShutdown means deliberate operational shutdown, not unexpected loss or user cancellation. Unexpected worker loss alone creates no request and infers no outcome or effects; observation/recovery is deferred to authoritative coordination. ADR-003's combined operational row does not require every observation to be recorded as stop intent. The value records intent only, not an authenticated request, acknowledgement, cancellation propagation or complete stop record. Requester/source identity, request time and acknowledgement are deferred; no guessed principal or wall-clock ordering is introduced. A future operational stop protocol must add those owned references and evidence before real execution. No timestamp or `time.Now()` is needed for local value correctness.

A stop request leaves lifecycle/outcome/effects unchanged and prevents further advancement. Finishing remains explicit; a caller can establish success after a request when completion wins the resolution, as ADR-003 requires. Terminal values reject later stop requests and every other mutation; late intent cannot rewrite established outcome. No cancellation/timeout request can itself establish termination, Finished, Cancelled, no effect or rollback.

## Effect projection and ownership

Phase 3 implements EffectKnowledge separately: NotDispatched, ConfirmedNotPerformed, ConfirmedPerformed, ConfirmedPartiallyPerformed, Unknown. Zero/unknown enum codes are rejected; **EffectUnknown is a valid first-class knowledge category**. It starts Unknown because construction provides no external-operation evidence.

`WithEffectKnowledgeProjection` only copies a caller-reported interpretation; Confirmed labels do not verify provenance or receipt custody. It is not authorization, a Tool result, an Execution Job result or authoritative external-effect truth. ConfirmedNotPerformed does not establish safe retry. It cannot validate receipts, collapse operation identities, infer dispatch from Running, aggregate arbitrary operations or become authoritative Tool/Execution truth. Runtime keeps a bounded summary projection under ADR-003 section 6.8; actual scoped operation references/provenance and reconciliation remain owner contracts before operational use. No evidence-ordering/monotonicity rule is invented. A later local owner interpretation may report uncertainty again; prior immutable value copies are not rewritten. These copies are not an audit log or durable correction mechanism.

Finish preserves the projection for every outcome, including Succeeded and Indeterminate. The Run-level projection does not state that all operations are required for success: actual required-result/operation interpretation belongs to the caller and operation owners. There is no automatic safe-to-retry or exactly-once guarantee. Terminal Run values freeze even this projection; ADR-003's later reconciliation must append separate linked owner evidence or an auditable correction without rewriting the original value. That protocol is deferred, not prohibited.

## Package graph and non-goals

```text
cmd/nexora -> internal/platform/config -> Go standard library
           -> internal/platform/httpserver -> Go standard library
internal/runtime   -> encoding/hex, encoding/json, errors, strings
internal/workflow  -> encoding/hex, encoding/json, errors, strings
internal/tool      -> encoding/hex, encoding/json, errors, strings
internal/execution -> encoding/hex, encoding/json, errors, strings
internal/approval  -> encoding/hex, encoding/json, errors, strings
internal/architecture -> Go standard library (test-only)
```

Runtime lifecycle adds only `errors`; tests use existing codec/testing imports. Owner packages have no project imports. The existing architecture fitness check already permits precisely these package paths/imports, blocks HTTP/config/other owners/provider/process/persistence imports, and rejects unknown packages, so no fitness-test relaxation or edit is necessary. The executable is not composed with Runtime. No Shared Kernel, registry, universal context, principal, Tenant/Project, repository/service/executor interface or speculative package is added.

No Temporal/Workflow, Tool/MCP, Sandbox/Execution, Security/authentication/authorization, Approval behavior, Sophia/AI/conversations, events/Outbox/Inbox, persistence/schema/migrations, audit/telemetry, frontend, infrastructure/deployment or CI/CD is implemented. No retry policy/backoff/new Run generation, framework, SDK, third-party module, go.sum, source relocation or additional ADR. JSON for the complete Run explicitly fails, preventing accidental empty private-field object encoding; no external serialization/API contract is frozen.

## Tests and verification evidence

Focused tests enumerate all four advancement operations from all five states and all terminal outcomes from every state, checking both legal results and unchanged rejected values. They cover initial/zero/mismatched construction, all five wait reasons and repeated resume, all seven stop causes from every nonterminal state, duplicate stops, stopped advancement, explicit completion after stop, all 25 effect/outcome pairs, terminal freeze, caller copies and deferred JSON. All 256 values of each metadata enum exercise valid/invalid admission; unknown lifecycle diagnostics do not look valid.

`FuzzRunLifecycle` checks bounded arbitrary operation sequences (at most 1024 bytes), immutable ID/attribution, waiting/outcome/stop/effect invariants, unchanged errors and terminal freeze. It does not test concurrency, durability, current authorization or actual external effects.

Executed on 2026-10-08 using Go 1.27.1 on darwin/arm64:

| Command | Observed result |
| --- | --- |
| `go test ./internal/runtime ./internal/architecture` | Exit 0; focused tests and dependency fitness passed |
| `gofmt -l cmd internal` | Exit 0; no filenames |
| `go vet ./...` | Exit 0; no diagnostics |
| `go test ./...` | Exit 0; nine packages passed; architecture executed and the other eight package results were cached after focused verification |
| `go test -race ./...` | Exit 0; Runtime and architecture executed, seven unchanged package results cached |
| `go build ./...` | Exit 0 |
| `git diff --check` | Exit 0; no diagnostics |
| `go test ./internal/runtime -run '^$' -fuzz '^FuzzRunLifecycle$' -fuzztime=2s -parallel=1` | PASS, exit 0; 6,366 executions, 22 new interesting inputs; bounded fuzzing plus shutdown completed in 3.659s |

`go list -m all` lists only the NEXORA module; the actual nine-package import graph matches the table above. Outside-repository byte comparison verified exactly seven authorized added/modified files, no deletions, all prior Phase 1/2 code and tests unchanged, and all twelve Accepted ADRs/constitution/principles byte-preserved against the architecture baseline. Local and live remote main must remain at the Phase 2 baseline after the feature-only commit/push; final Git evidence is reported separately. No runtime security, production/cross-platform, provider, database or orchestration claim follows from unit/race/fuzz checks.

## Final architecture review and remaining gates

The local value keeps Run lifecycle separate from Workflow; state separate from outcome and WaitingReason; stop intent separate from termination; cancellation separate from rollback; effect projection separate from outcome and operation truth. Identity/attribution/correlation grant no authority. All transitions preserve historical configuration/assignment. Finished never reopens; invalid public metadata operations preserve the prior value. Go permits an unset zero value, which rejects operations. No complete production Run is claimed.

Still deferred: complete launch attribution; Agent Definition/Instance/Task identities and authoritative models; source revision resolution; current authorization/claim/budget integration; full stop request identity/source/time/acknowledgement; complete correlated/durable wait and expiry/resolution; Approval, Workflow and Tool/Execution integration; effect provenance/aggregation/reconciliation and terminal correction; persistence/atomic transitions/fencing/concurrency ownership; event publication; durable audit evidence; external serialization; retry/continuation admission and linked terminal Runs. Separate authorization and concrete owner contracts are required before any of those features.

## Phase 3 semantic remediation

Separate explicit human project-owner authorization permits only the two reviewed semantic corrections on the existing feature branch, starting at `d8e2def8ed724e66368ed5ec3a12754fed7034f0`. Clean local/tracking/live feature branches matched that HEAD; local/tracking/live main matched `07e5ed8d14dad5f655b9a28b740e0e8b4c5a207e`, with exactly one feature commit before mutation. One additional commit/push is authorized; no PR or merge.

Issue A renames `RecordEffectKnowledge` to `WithEffectKnowledgeProjection` because a record-oriented name can imply evidence custody. The new operation explicitly names the bounded Runtime projection and immutable value-copy behavior. Category acceptance/replacement, errors, effect/outcome independence and terminal freeze are unchanged. No compatibility alias retains the ambiguous API.

Issue B renames `StopWorkerShutdownOrLoss` to `StopWorkerShutdown`, retaining its enum position, and restricts RequestStop to explicitly initiated intent. ADR-003 section 6.6's combined operational cause imposes coordination/reconciliation obligations, not automatic cancellation on loss. Unexpected loss has no observation API here, creates no request and cannot select any outcome. Deliberate shutdown is representable; its cause does not authenticate a requester. Recovery may later establish an outcome through explicit Finish using authoritative evidence.

Both renames require source callers to update; diagnostic worker-cause text changes to WorkerShutdown. There is no frozen external serialization contract. No lifecycle transition, outcome, waiting reason, attribution or evidence-ordering rule changes. Worker monitoring, receipt/provenance custody, recovery and durable stop protocols remain deferred. No separate architecture decision is needed for these narrow clarifications; operational contracts still require future authorization.

Remediation verification on 2026-10-08, Go 1.27.1 darwin/arm64:

| Command | Actual result |
| --- | --- |
| `gofmt -l cmd internal` | Exit 0; no filenames |
| `go vet ./...` | Exit 0; no diagnostics |
| `go test -count=1 ./...` | Exit 0; all nine packages freshly passed, including architecture fitness |
| `go test -race -count=1 ./...` | Exit 0; all nine packages freshly passed |
| `go build ./...` | Exit 0 |
| `git diff --check` | Exit 0; no diagnostics |
| `go test ./internal/runtime -run '^$' -fuzz '^FuzzRunLifecycle$' -fuzztime=2s -parallel=1` | PASS, exit 0; 4,586 executions, four new interesting inputs, 30 total; shutdown included in 3.631s |

Focused additions test category-only projection admission without evidence objects in every nonterminal state, unchanged lifecycle/attribution, no fabricated stop, deliberate shutdown intent and explicit selection of every Running outcome with independently Unknown effects. Existing exhaustive enum, effect/outcome, transition, terminal freeze and arbitrary sequence coverage is retained and updated to the new API. Tests cannot simulate an unimplemented loss observer or prove trusted coordination/receipt custody; those are deferred guarantees, not tested claims.

Only the five authorized existing files changed; none added/deleted. Module dependencies remain zero third-party, no go.sum or artifacts were created, all twelve Accepted ADRs/constitution/principles and prior implementations remain byte-identical to the original Phase 3 HEAD. Main remains at the authorized baseline; final commit/push evidence is reported separately.
