# Implementation Phase 2 — Core Identity & Attribution Contracts

## Authorization and evidence

Explicit human project-owner authorization dated 2026-10-08 permits only owner-specific identity and attribution contracts, their tests, necessary fitness checks and scope documentation. This is an implementation record, not an ADR. No Phase 3, subsystem behavior, persistence, provider integration, infrastructure, PR creation or merge is authorized.

- Repository: `sherzot/nexora`.
- Verified clean starting branch: `main` at **`6c7ffbde744f8430273c1a71ca469491957345ef`**, matching local tracking and live remote state; PR #1 is merged.
- Architecture baseline: `cebc1d30b8235acfec608ce5bee465e11060db5c`.
- Implementation branch: `feat/core-identity-contracts`, created from that exact Phase 1 merge.
- Go/module remain `1.27.1` / `github.com/sherzot/nexora`; standard library only.

The constitution, contributor guidance, README, Phase 1 record, architecture context/principles/index and all Accepted ADRs were read before mutation. No conflict requiring ADR amendment was identified. ADR-003 sections 6.1, 6.2, 6.8 and invariant 16 distinguish Run ownership from definition/instance/task coordination and freeze historical configuration references. ADR-004 section 6 separates logical Workflow and engine execution identity. ADR-007 section 6.9 distinguishes Operation/attempt/provider identities. ADR-008 distinguishes Job/Attempt/provider execution; ADR-010 owns Request/Decision references. ADR-005 and ADR-011 distinguish message, correlation, causation and delivery/trace evidence. ADR-002's No implicit Shared Kernel and ADR-009's current authority rules constrain every contract.

## Identity ownership analysis

“Durable” below describes the ADR's owner-record requirement or provider responsibility, **not implemented persistence**. All identifiers/references alone have **no security authority**. Final bounded contexts are not selected by these package names.

| Concept | Authoritative owner | Same as another identity? | Security authority? | Durable requirement | Phase 2 outcome / reason |
| --- | --- | --- | --- | --- | --- |
| Agent Definition | Definition management; final module unresolved (ADR-003) | No; not Instance/Run | No | Stable/versioned source | Deferred: management contract unresolved; no Definition behavior |
| Agent Instance | Instance management; final module unresolved (ADR-003) | No; not principal/session | No | Stable configured reference | Deferred: no instance consumer or management contract yet |
| Task | Task/assignment coordination (ADR-003) | No; not Run/Workflow | No | Objective/assignment history | Deferred: coordination model/owner contract unresolved |
| Agent Run | Agent Runtime (ADR-003) | No; not Workflow/Tool/Job | No | Stable historical execution record | `runtime.RunID`: essential primary distinction |
| Workflow | NEXORA workflow coordination (ADR-004) | No; not engine or Agent Run | No | Logical orchestration references | `workflow.WorkflowID`: provider-neutral primary distinction |
| Temporal Workflow ID | Temporal infrastructure, through future adapter (ADR-004) | No; not NEXORA Workflow | No | Engine-defined identity | Deferred: no Temporal adapter/code authorized |
| Temporal Run ID | Temporal execution/history, through future adapter (ADR-004) | No; not Agent Run; may change in a logical chain | No | Engine-defined execution | Deferred: no SDK, engine mapping or history model |
| Tool Operation | Tool operation owner (ADR-007) | No; not Run/Workflow/event/request | No | Stable operation responsibility | `tool.OperationID`: primary semantic operation identity |
| Tool attempt | Tool dispatch owner (ADR-007) | No; not logical Operation/provider request | No | Attributable dispatch evidence | Deferred: no dispatch/attempt consumer; future contract must distinguish it |
| Execution Job | Execution owner (ADR-008) | No; not Run/Workflow/Operation/PID/provider | No | Logical job responsibility | `execution.JobID`: independent primary job identity |
| Execution Attempt | Execution owner (ADR-008) | No; not Job or provider environment | No | Attributable attempt evidence | Deferred: no execution attempt contract/behavior yet |
| Approval Request | Approval owner (ADR-010) | No; not Decision/permission | No | Reviewed-intent/request evidence | `approval.RequestID`: request reference, never a grant |
| Approval Decision | Approval owner (ADR-010) | No; not Request/quorum/use | No | Immutable human contribution | Deferred: no decision reference consumer or decision behavior |
| Event / logical message | Producing authoritative owner and explicit integration contract (ADR-005) | No; not delivery/Tool/audit | No | Stable logical identity where delivery is required | Deferred: no event owner/contract exists; no universal event ID registry |
| Delivery attempt | Actual transport/publication/consumer responsibility (ADR-005) | No; not logical message | No | Contract-dependent delivery evidence | Deferred: transport and consumer contracts absent |
| Correlation | Participating owners' intentional linking contracts (ADR-005/011) | No; groups related work, not identity or proof of cause | No | Retained where owner evidence requires it | Deferred: no current cross-owner link consumer; no universal correlation mandate |
| Causation | Producing owner identifying the immediate predecessor (ADR-005/011) | No; needs predecessor semantics, not correlation | No | Retained where required | Deferred: predecessor kind/contract must be explicit; do not invent a universal causal UUID |
| Tenant | Authoritative tenant/resource management; Security resolves trusted scope (ADR-009) | No; not Project/provider account/region | No | Stable scope evidence when used | Deferred: final owner and scope contract unresolved; no tenant model |
| Project | Authoritative project/resource management; Security resolves trusted scope (ADR-009) | No; not Tenant/workspace string | No | Stable scope evidence when used | Deferred: final owner and scope contract unresolved; no project model |
| Human principal | Trusted identity/Security admission (ADR-009/010) | No; not Agent/workload or email alias | No; identity alone is insufficient | Trusted mapping/history as required | Deferred: principal mapping/assurance unresolved; no universal PrincipalID |
| Workload/service principal | Trusted workload identity/Security admission (ADR-009/012) | No; not human/Run/Workflow/Job by default | No; credential ceiling differs from policy | Governed identity/evidence | Deferred: no identity technology/admission mapping authorized |
| Provider request | External provider and admitted adapter (ADR-007/011) | No; not NEXORA Operation | No | Provider-specific retention | Deferred: no admitted adapter/provider contract |
| External resource | Authoritative resource owner/provider (ADR-007/009) | No; not a universal ResourceID | No | Resource-specific references/revisions | Deferred: resource kind, canonical mapping and scope unresolved |
| Effective configuration revision reference | Source definition/configuration owner; Runtime records a historical projection (ADR-003) | No; not assignment revision/current policy | No | Frozen launch reference | `runtime.ConfigurationRevisionRef`: bounded opaque source reference only |
| Task/assignment revision reference | Source task coordination owner; Runtime records a historical projection (ADR-003) | No; not config revision/Task identity | No | Frozen launch reference | `runtime.AssignmentRevisionRef`: bounded opaque source reference only |

## Implemented representation

| Type/package | Owner | Canonical internal text |
| --- | --- | --- |
| `runtime.RunID` | Agent Runtime | `run_` + 32 lowercase hex digits |
| `workflow.WorkflowID` | NEXORA workflow coordination | `workflow_` + 32 lowercase hex digits |
| `tool.OperationID` | Tool operation owner | `operation_` + 32 lowercase hex digits |
| `execution.JobID` | Execution owner | `job_` + 32 lowercase hex digits |
| `approval.RequestID` | Approval owner | `approval_request_` + 32 lowercase hex digits |

Each is a distinct defined struct with a private 16-byte payload, comparable by value. It has an owner-specific parser, canonical `String`, explicit text/JSON codecs and `IsZero`. Empty, wrong prefix, whitespace, uppercase/non-hex, wrong length and all-zero payload are rejected. The zero value is unset and cannot serialize as a valid ID. JSON must be a valid ID string; null, non-string and malformed values fail. Failed decoding preserves the receiver. Explicit successful decoding changes only the target value; it cannot mutate previously copied attribution.

Prefixes reject accidentally re-parsing another owner's string identity. All five implementations intentionally own their small codecs rather than centralizing domain identity into a universal package. Their compatible technical encoding is not evidence of shared domain semantics. These are internal contracts, not UUID claims, database schemas or external API/wire-format decisions. No generator exists: generation and collision/idempotency policy require a real owner admission use case. Syntax never proves existence, uniqueness, authenticity, tenancy, current authorization or Approval.

`ConfigurationRevisionRef` and `AssignmentRevisionRef` are distinct private immutable string values in Runtime's historical projection. Parsers preserve the exact text of bounded (1–256 byte) ASCII tokens using letters, digits and `-_.:/@`; whitespace/control/Unicode are rejected. The source owner must define and resolve the reference namespace/object/revision before actual Run creation. These are not definition/task IDs, credentials, verified current revisions or new sources of truth. No source-owner format, ordering rule, JSON representation or persistence is selected for these references.

`runtime.RunConfigurationAttribution` requires a nonzero Run ID and both revision references. Private fields/getters preserve value copies; a newer revision creates a separate value, never silently updates an earlier one. The zero value is invalid/unset. It is **only the configuration/assignment subset** of launch attribution, not a complete Run record or permission to create a Run. Instance identity, task identity, initiator/delegator, tenant/project/resource scope, workflow links and other required historical launch references remain future contracts. No mutable current policy, Approval, credential, provider state, prompt or memory is included. JSON explicitly fails instead of silently producing an empty private-field object; full attribution serialization is deferred.

## Actual package dependency graph

```text
cmd/nexora -> internal/platform/config -> standard library
           -> internal/platform/httpserver -> standard library
internal/runtime   -> local validation/codecs only
internal/workflow  -> local validation/codecs only
internal/tool      -> local validation/codecs only
internal/execution -> local validation/codecs only
internal/approval  -> local validation/codecs only
internal/architecture -> standard library (test-only fitness checks)
```

The five owner packages have no project dependencies and are not composed into the executable. They permit only their current codec/validation standard-library imports and `testing`. They cannot depend on each other, platform HTTP/config, process execution, persistence or providers. Platform packages cannot import owner contracts. Unknown packages fail the fitness check, preventing an accidental common/shared/types/models package. There is no Shared Kernel, registry, universal principal, universal context bag or cross-owner metadata object.

## Security and scope limits

**Identity != Authority. Correlation != Authority. Attribution != Authority. Provider identity != NEXORA authority.** No ID authenticates or authorizes, grants a capability/delegation/Approval/credential/tenant access, or treats an Agent/Run/Workflow/Tool/Job as a principal. Current trusted policy and owner resolution remain required for every future consequential operation.

No lifecycle, retries, cancellation, definition/instance/task behavior, workflow execution, Tool dispatch, Execution/Sandbox, Approval decisions, Security engine, persistence, Temporal SDK, provider/AI/MCP integration, events/tracing/audit, frontend, infrastructure or CI/CD is introduced. Phase 1 HTTP behavior is unchanged. No final bounded contexts or external schemas are frozen.

## Verification evidence

Executed on darwin/arm64 with Go 1.27.1: `gofmt -l cmd internal` returned no filenames; `go vet ./...`, `go test ./...`, `go test -race ./...`, `go build ./...` and `git diff --check` each exited 0. Tests passed for all nine packages; some unchanged deterministic test results were cached. Native fuzz verification also passed for every ID parser (2 seconds each, one worker):

```sh
go test ./internal/runtime -run '^$' -fuzz '^FuzzParseRunID$' -fuzztime=2s -parallel=1
go test ./internal/workflow -run '^$' -fuzz '^FuzzParseWorkflowID$' -fuzztime=2s -parallel=1
go test ./internal/tool -run '^$' -fuzz '^FuzzParseOperationID$' -fuzztime=2s -parallel=1
go test ./internal/execution -run '^$' -fuzz '^FuzzParseJobID$' -fuzztime=2s -parallel=1
go test ./internal/approval -run '^$' -fuzz '^FuzzParseRequestID$' -fuzztime=2s -parallel=1
```

 Tests cover canonical/invalid inputs, zero values, text/JSON round trips, failed decode preservation and immutable revision attribution. Architecture verification inspects actual direct imports and unknown package paths.

Pre-commit inspection of the actual package graph confirmed each package has a current contract and tests, no shared domain registry, no authority semantics, no identity collapse, no mutable authorization in attribution, no subsystem behavior/provider coupling and no external API declaration. Removing any new owner package would remove one of the five required primary distinctions; the two revision reference types exist solely for the frozen Runtime projection. Preservation compares ADR-001–012, constitution and principles to the architecture baseline. Final Git verification must show unchanged local/remote `main`, one compact feature commit, matching pushed HEAD/upstream and a clean worktree. No PR or merge is authorized.

## Remaining uncertainty

The matrix's deferred identities require real authorized consumers and resolved owner contracts. Full Run launch attribution must add the omitted identities and trusted historical initiator/delegator/scope references before Run creation. Generation, collision handling, source-reference resolution, namespaces, migration/versioning, persistence/retention and external serialization remain undecided. No distributed ordering, globally collision-free identity, idempotency or current authority guarantee follows from this encoding. Other platforms and production behavior remain unverified; ID JSON is an internal representation only.
