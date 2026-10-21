# ADR-013 — Define trusted Run creation and immutable launch attribution

- [A] Status: **ACCEPTED**.
- [P] Proposal date: 2026-10-21.
- [A] Decision authority: explicit human project-owner acceptance dated 2026-10-21, limited to the architectural decisions documented in ADR-013. Existing [P] design labels are retained to distinguish these newly accepted decisions from pre-existing Accepted ADR requirements; O1–O5 remain OPEN and block affected operational implementation.
- [P] Semantic owner: Runtime for Run creation and historical projection; source responsibilities remain separate as defined below.
- [P] Scope: one attributable Run creation boundary; architecture/specification only, no operational admission implementation.
- [I] Baseline: `ef9fd6a287e2cd052954b8f416f8490a49c61b18`; PR #4 MERGED. Local HEAD/main/origin/main and live main matched; worktree/index were clean before drafting.
- [A] Acceptance evidence: explicit human project-owner ADR-013 Acceptance Status Update in the conversation on 2026-10-21. This accepts ADR-013 architecture only; it does not authorize implementation or close O1–O5.

## Classification

[A] denotes **Existing Accepted ADR requirement**; [I] denotes **Existing implemented behavior** (including verified repository evidence); [P] denotes **Proposed decision**; [O] denotes **Deferred or unresolved obligation**. Each labelled paragraph or list item has that classification; a labelled table caption applies to every row unless a row explicitly says otherwise. Recommendations below are not Accepted architecture or implemented controls.

## 1. Context

[I] Phases 1–4 implement a local HTTP skeleton, owner-specific identities, partial configuration/assignment attribution, a pure immutable Run lifecycle, and versioned transition preparation. `RunConfigurationAttribution` records only Run ID and two opaque revision references. There is no operational creation, current authorization, tenant enforcement, persistence, durable request disposition or evidence custody. See the [Phase 2](../implementation/phase-02-core-identity-contracts.md), [Phase 3](../implementation/phase-03-agent-run-lifecycle.md) and [Phase 4](../implementation/phase-04-versioned-run-transition-preparation.md) records.

[I] `NewRunSnapshot` accepts caller-supplied locally valid Run/revision values. Prepared predecessor ID/revision does not prove the full predecessor came from an authoritative owner. Competing candidates may both succeed. Complete Run/snapshot/candidate JSON is rejected; there is no durable serialization contract.

[A] ADR-002 requires explicit ownership and no implicit Shared Kernel. ADR-003 requires immutable historical Run attribution, current authority at consequential operations, and separate creation/lifecycle/effects. ADR-009 requires trusted identity, scope and owner enforcement; ADR-010 preserves Approval ownership and current usability. ADR-005/011/012 constrain durable acceptance, evidence and recovery without selecting their concrete mechanisms.

## 2. Problem

[P] Define what the future Runtime creation owner must know, validate and retain before reporting one attributable operational Run as durably Created. Separate caller intent, trusted source facts, current permission, historical attribution, durable acceptance and subsequent execution. Resolve the semantic boundary before freezing storage or public interfaces.

## 3. Decision Drivers

- [P] Prevent duplicate or misattributed creation after response loss without treating IDs as authority.
- [P] Bind the actual instance/configuration and task/assignment, trusted scope and represented actor without owning other domains' truth.
- [P] Preserve history while allowing current restrictions to deny future work.
- [P] Make changed source facts, unavailable owners, insufficient custody and unknown writes explicit.
- [P] Limit decisions to one use case; no universal IAM, resource model, repository framework or workflow engine.

## 4. Considered Options

[P] Alternatives evaluated for this boundary:

| Option | Benefit | Limitation / disposition |
| --- | --- | --- |
| Persist existing partial Run as complete authority | Small initial storage surface | Missing launch/source/scope semantics become durable ambiguity; do not recommend |
| Universal admission/security model shared by all owners | Superficially uniform fields | Transfers domain authority into a Shared Kernel; reject |
| Let Workflow/Temporal establish Run creation truth | Coordination close to its caller | History/retry cannot establish Runtime ownership or current authority; reject |
| Owner-composed creation boundary with immutable Runtime projection | Explicit provenance and narrow consistency responsibility | Requires concrete source/security/custody contracts; recommend, with OPEN gates |

## 5. Decision

[P] Recommend a Runtime-owned creation boundary composed with authoritative identity/security, scope/resource, Definition/Instance, Task/Assignment, Approval and evidence responsibilities. Owners provide facts and decisions through public contracts; Runtime owns creation identity mapping, its Created record and historical projection. No owner repository, transaction handle or mutable domain entity crosses those boundaries.

[P] The first specified use case is a human-initiated request, exercised through an authenticated workload under a validated represented/delegation relationship, to create one Run for an explicitly selected tenant/project, instance/configuration revision and task/assignment revision. It ends at Created and dispatches no work. Workflow is not required. System-mandated autonomous creation, cross-tenant sharing and batch creation are outside this first use case; they require separately reviewed authority paths, not fabricated human identities.

[P] Treat the contracts below as semantic requirements for a future implementation. Accepting this ADR would not implement them or authorize code, persistence, source-owner services, security infrastructure or a later phase.

## 6. Detailed Design

### 6.1 Creation-request identity and duplicate binding

[P] Distinguish the logical creation request from Run identity. A request has one stable identity before its first potentially accepting send. Its logical uniqueness scope is `(Runtime creation purpose, trusted operating tenant, admitted producer namespace, request token)`. Producer namespace is an owner-validated stable request-origin namespace; it is not an arbitrary header or the transient worker/process identity. Project belongs in the bound intent, so changing project under the same request identity is a conflict. No token format, generator, database key or public schema is selected.

[P] Runtime owns the mapping from one scoped request identity to at most one accepted Run identity and an interpretable disposition. Run identity is allocated/validated under Runtime's future creation protocol and never silently replaced on retry. A request ID, Run ID, correlation ID, trace ID, engine ID or Approval ID cannot substitute for another or grant permission.

[P] Bind request identity to material creation intent: source identities and pinned revisions, trusted tenant/project, represented initiator/delegation, creation purpose, requested launch limits and applicable material environment/resource restrictions. Trusted admission enriches and validates that intent; lookup must compare claims to the trusted scope before disclosure. Current policy evaluations, actual retry workload identity, transport attempt IDs and observation timestamps are separately recorded evaluations/attempt evidence, not silent changes to the immutable request intent. A different workload may retry only if independently authenticated and eligible for the same admitted producer/represented authority.

[P] Matching redelivery with an existing accepted disposition returns that same Run/disposition under current read authorization; it does not create again, re-admit execution or refresh old authority. Reuse with materially different bound intent is an integrity conflict, not an ordinary duplicate. Rejection/unavailability before proven acceptance and an unknown write are separate. Reconciliation of an uncertain request keeps its identity and original intent; a new token cannot bypass uncertainty.

[O] Exact canonicalization, producer-namespace ownership/issuance, request token allocation/collision handling, durable disposition representation, terminal rejection retention, deduplication horizon and expiry behavior are OPEN (O1). Until resolved, no durable idempotency is claimed. Expired/missing markers alone cannot prove no Run was created; restore and replay need retained owner evidence or an explicit unresolved disposition.

### 6.2 Trusted scope, actors and source responsibilities

[A] Under ADR-009, authentication, represented authority, current authorization and resource ownership are separate. Multi-tenant membership cannot be unioned into a broader operating scope. Model/repository/Tool text, request IDs, local values, events and Workflow history cannot authenticate or authorize a caller.

[P] Construct trusted operating scope from admitted authentication, validated membership/delegation and authoritative tenant/project/resource relationships. Keep real human initiator, represented subject/delegator, actual authenticated workload and Agent Instance distinct. No raw credentials enter the launch projection. A human initiation without valid authority for the workload cannot become an independently privileged service mandate.

[P] Accountable logical responsibilities for this proposal (these are not existing new packages or accepted final bounded contexts):

| Responsibility | Supplies / decides | Does not delegate to Runtime |
| --- | --- | --- |
| Identity/Security admission | Authenticated human/workload mapping, trusted propagation, current restrictions, delegation eligibility | Identity proof, permission policy or credential issuance |
| Tenant/project membership and resource owners | Canonical scope relationships, operating membership, relevant resource/environment ownership | Cross-tenant grants inferred from caller labels |
| Definition/Instance management | Instance identity, scope, effective definition/configuration revision and permitted overrides, current eligibility | Current configuration truth or instance administration |
| Task/Assignment coordination | Task identity, assignment revision, intended instance/configuration constraints, scope and current assignment eligibility | Task acceptance or assignment administration |
| Runtime | Creation request mapping, local Run invariants, historical projection and owned creation disposition | Authority over the source facts above |
| Approval | Required request/review/decision bindings, current usability and applicable use accounting | Boolean approval flags or permission grants |
| Audit policy / evidence custody | Required evidence, permitted local/independent acknowledgement boundary, access and retention | Business creation truth or current permission |

[O] Concrete owners, source-reference namespaces, interfaces, trusted-construction/propagation mechanisms and tenant/project relationship policy are OPEN (O2). This proposal assigns accountable responsibilities, not implementation mechanisms or organizational teams. Sensitive source lookup must remain blocked if its trusted scope cannot be established.

### 6.3 Source resolution and change consistency

[P] Before creation, resolve exact Instance/configuration and Task/assignment identities/revisions through their respective owners. Verify instance-to-configuration, assignment-to-task/instance and scope relationships, permitted overrides and eligibility for this launch. References must identify owner, source and revision unambiguously under the source contract; syntax or a model-provided name is insufficient.

[P] Use pinned, owner-interpretable revisions for material launch input. A required binding changing from H1 to H2 must not be silently upgraded under the same request. Re-review/re-authorize revised material intent under a new linked request only after the earlier request's disposition is established. A newer source revision existing does not by itself invalidate pinned H1: H1 may remain usable only if its owner still permits the pinned relationship and current restrictions are established. Revocation or changed material relationships block creation even when the historical revision is readable.

[P] Require evidence that the named source/policy eligibility conditions held at the future creation acceptance boundary, with explicit owner revisions/observations and enforceable change checks. A stale lookup or signed observation is not proof of current eligibility. If a relevant change is detected, re-resolve/re-evaluate the same pinned intent or reject; do not use last-writer-wins source facts. If the required consistency cannot be established, withhold confirmed creation.

[A] No cross-owner atomic transaction is assumed (ADR-002/005/009). A local Runtime transaction cannot make separate policy/source reads atomic.

[O] The actual consistency protocol, acceptance linearization point, admissible observation freshness, revocation exposure and race handling are OPEN (O3). No lock, distributed transaction, lease, token or fencing mechanism is selected. This is an operational implementation blocker, not a guarantee supplied by the proposed precondition wording.

### 6.4 Immutable historical launch attribution

[P] Retain the matrix defined in the [Phase 5 specification](../implementation/phase-05-run-admission-prerequisites.md#historical-attribution-fieldsourcevalidation-matrix). Runtime owns this historical projection; source owners retain their facts. Store immutable owner references only when the referenced historical meaning remains available under an agreed interpretation/retention contract. Otherwise retain a permitted bounded historical projection, or refuse creation when necessary attribution cannot be preserved. A mutable URL or a digest without retained meaning is insufficient.

[P] Freeze accepted Run ID, instance/configuration and task/assignment bindings, historical actor/delegation and trusted scope, creation purpose, launch-limit/configuration attribution, and the creation decision/evidence links. Policy history records what was evaluated; current policy is consulted separately for future actions. Provider/model actually used, later Tool/Execution effects, queue decisions and later Approval use are attributed at their actual owner operations rather than invented at creation.

[P] Distinguish required-and-resolved, policy-defined not-applicable, and unresolved/missing relationships. Only the first two can satisfy a required launch contract; unresolved is never encoded as a permissive empty value. For this first use case, Workflow may be not-applicable; human/workload and required scope/source facts may not. No universal optional metadata bag is introduced.

[P] Corrections append a separately identified, authorized record linking the original assertion, corrected interpretation, actor, reason and relevant evidence. They do not silently overwrite launch history, reopen a terminal Run or transfer it to another tenant. Wrong-scope attribution requires restricted investigation/disposition and separately authorized new work where necessary. Suppression/redaction/retention follow approved privacy policy with explicit reconstruction gaps; append-only semantics do not authorize indefinite personal-data retention.

[O] Historical reference availability, permitted projection contents, correction authority, personal-data minimization and retention/suppression contracts are OPEN (O4). No complete serialization or storage representation is selected.

### 6.5 Creation versus scheduling and effects

[P] Preserve the following separate boundaries:

| Boundary | Required meaning |
| --- | --- |
| Creation intent | Untrusted proposed launch, not acceptance |
| Trusted source resolution | Owner-established identities, revisions and relationships, not permanent permission |
| Current creation authorization | Scoped decision for creation and its obligations, not permission to execute |
| Durable Run creation | Runtime-owned confirmed record/disposition within the specified custody boundary |
| Queue admission | Separate Created-to-Queued eligibility, capacity and current checks |
| Runtime execution | Separate valid ownership/current policy and bounded Running segment |
| Tool/Execution dispatch and effects | Independently governed operation/job, current authorization/Approval and owner evidence |

[A] `Created` is not `Queued` or `Running`. Stop intent is not termination; cancellation is not rollback. Approval is not current authorization. Temporal history is not Runtime authority. Tool/Execution effects remain owner-specific (ADR-003/004/007/008/009/010).

[P] For this first use case, future confirmed creation would produce a Created Run at initial revision 1 with complete approved launch attribution; no enqueue/dispatch happens implicitly. Queue denial after creation preserves the Created record and historical evidence. It does not retroactively reject creation, automatically Finish the Run, or cause creation retry to generate another Run. Any later lifecycle change uses its own authorized owner operation.

### 6.6 Creation evidence, confirmation and uncertainty

[P] Runtime produces a minimum creation evidence manifest: scoped creation-request identity and bound intent; resulting Run identity; resolved source identities/revisions and relationship basis; historical actors/operating scope; current creation policy/decision and required Approval references; source-change checks and limits; creation disposition and owner ordering/version evidence; evidence/custody acknowledgement or unresolved responsibility. Actual retries retain separate authenticated workload/attempt observations. Capture occurrence/observation/persisted times with provenance where material, never use wall time as sole ordering authority. Exclude secrets, private reasoning and unnecessary source payloads.

[P] Recommend durable owner-local creation evidence for this non-dispatching use case, plus atomically recorded publication intent when required publication exists, only if the responsible Audit/Security policy explicitly deems that custody sufficient. Require independent custody before confirmation where the selected risk policy requires it. Volatile exporter receipt is never durable custody. Required owner state, request mapping, evidence and local obligations must share an atomic owner acceptance boundary or an explicitly reviewed equivalent recovery protocol.

[P] Report confirmed creation only after the authoritative boundary can establish the bound Created record, its request-to-Run mapping, immutable historical projection and required evidence/custody obligations. Return rejection only with evidence that this attempt was not accepted; an earlier uncertain attempt under the same identity must still be reconciled. Distinguish unavailable preconditions from rejected intent. Failure after possible durable acceptance is Unknown, not confirmed rejection.

[P] On lost response, query the Runtime disposition through a current-authorized scope-bound read using the same request identity. Return the recorded result if known. If absence can be established under the approved consistency/retention protocol, reattempt that same request only after current checks. If evidence is missing, inconsistent, unavailable or restored behind possible acceptance, preserve Unknown and assign recovery responsibility; do not blindly repeat creation or consequential work. A matching result read grants no scheduling authority.

[O] Persistence design, durable request ledger/uniqueness, serialization/reconstruction, transaction/isolation semantics, local versus independent custody policy and receipts, publication obligations, read-after-uncertain-write/absence proof, recovery owner, retention and restore protocol are OPEN (O5). PostgreSQL is the ADR-012 application-data direction, not an already implemented creation mechanism. No SLO, exactly-once guarantee, complete audit, crash-safe idempotency or recovery guarantee is established here.

### 6.7 Required invariants and scenarios

[A] Preserve immutable history; current permission separate from history; trusted scope separate from untrusted input; references separate from validity; Run separate from request identity; no permissive defaults for missing facts; unknown outcomes separate from rejection; local values separate from durability; creation separate from scheduling; Approval/Temporal separate from authority; owner-specific effects; and no assumed cross-owner atomicity.

[P] A duplicate creation request must not silently create another operational Run. This strengthens the concrete request binding for this proposed use case without claiming an implementation. The specification's S01–S12 scenarios define the review cases and required evidence, retry disposition and deferred controls.

## 7. Alternatives Analysis

[P] Owner-composed creation is recommended because each historical assertion has a source and each current constraint retains an enforcing owner. It limits Runtime to a concrete Created-record obligation. The cost is explicit coordination, change consistency and unavailable-owner behavior; calling the boundary "trusted" does not implement those controls.

[P] Opaque reference-only attribution is smaller but loses interpretation if sources mutate/disappear. Duplicating every source payload improves some reconstruction but overcollects data and creates competing truth. Recommend immutable owner references with a retention/interpretation contract, supplemented by only the permitted projections necessary for historical meaning. Block unsupported attribution rather than invent a fallback.

[P] Caller-scoped random Run IDs alone do not deduplicate requests. A global request registry creates cross-owner coupling. Recommend Runtime-owned scoped creation identity and disposition; exact allocation, retention and enforcement stay OPEN. A generic commit interface or Temporal adapter cannot resolve these source/trust decisions on its own.

## 8. Consequences

### Positive

- [P] Creation can be explained using attributable source bindings while preserving independent policy and operation owners.
- [P] Matching/conflicting duplicates and unknown acceptance receive distinct meanings before a schema or API freezes them.
- [P] A narrow creation boundary avoids new execution authority, services and shared domain models.

### Negative

- [P] Owners must resolve O1–O5 before operational creation; some requests will remain unavailable instead of receiving guessed acceptance.
- [P] Historical interpretation and current authorization require separate evidence and retention work.

### Risks

- [P] An "admission context" can become a universal authority bag; references can conceal missing provenance; cross-owner observations can race; old dispositions can be misread as renewed permission. O1–O5 and actual-boundary verification are gates, not mitigations already deployed.

## 9. Security Considerations

[A] Authenticate callers and constrain represented authority at actual owner boundaries, including sensitive lookups and disposition reads. Deny cross-tenant access absent explicit owner-governed relationships; provider credentials, Agent identity, model output and network location are not grants. Current deny/revocation dominates old allow/Approval (ADR-009/010).

[P] Scope request lookup before existence/content disclosure. Bound untrusted intent/reference sizes and avoid logging raw tokens, credentials or source content. Protect admission evidence and correction access separately; an internal service's broad technical access cannot be unioned with the caller's authority. Claiming a request identity from another producer/tenant is not a reconciliation right.

[O] Actual authentication, trusted context integrity, tenant/data enforcement, request abuse limits, revocation consistency and evidence access are unimplemented. No security assurance follows from these documents. The first use case authorizes no hostile execution or Tool effects; ADR-008's isolation requirements remain unchanged for later execution.

## 10. Operational Considerations

[P] Differentiate pre-resolution rejection, dependency unavailability, confirmed acceptance and unknown acceptance in operator-visible owner dispositions. Retain unresolved creation/evidence responsibility across bounded automatic attempts; no poison-request or quarantine disposal may erase it. Do not create a scheduler, relay, reconciliation service or incident platform in this phase.

[P] Future acceptance validation must exercise S01–S12 at real trust/storage/custody boundaries, plus response loss, concurrent duplicates, changed policy/source relationships, retention expiry and restored checkpoints. A constructor test or mocked allow cannot prove owner consistency, durable acceptance or tenant isolation.

[O] O1–O5 remain operational blockers. No runtime tests of these proposed contracts, database experiments, dependencies, providers, benchmarks or deployment are part of Phase 5 drafting.

## 11. Evolution / Exit Strategy

[P] Preserve Runtime/source ownership, request-versus-Run identities, immutable launch meaning and explicit disposition through any later storage/identity/provider change. Do not remap actors by display names, resurrect revoked authority from backup, rewrite launch attribution to latest source, or replay creation simply to rebuild evidence.

[P] Seek explicit owner review if a chosen source contract cannot retain historical meaning, a required restriction cannot be checked at acceptance, a tenancy model requires different lookup isolation, custody independence changes, or source-owner consistency cannot meet the approved risk policy. Any actual Accepted-ADR conflict requires supersession review; this proposal supersedes none.

## 12. Development Constitution Compliance

[P] Current explicit scope acceptance/drafting authorization permits this Proposed ADR and its specification on `docs/phase-05-run-launch-attribution`; it supersedes older Phase 5 drafting prohibitions only for these documents. It does not permit ADR acceptance, code/tests, commit/push, PR/merge or Phase 6. Constitution and AGENTS remain unchanged.

[I] Pre-edit inspection verified the expected baseline, clean worktree/index, merged PR #4, available branch and ADR numbering convention; ADR-013 followed existing ADR-001–012. Existing architecture and source evidence were reviewed in this conversation and remain the baseline.

[P] Verification concerns document classification, structure, links, scenario coverage, exact file scope and baseline preservation. It cannot establish the future guarantees described here. Final drafting checks are reported in the completion report, without adding an implementation claim.

## 13. Related Decisions

[A] Binding sources: [Constitution](../../DEVELOPMENT_CONSTITUTION.md), [ADR index](README.md), [architecture principles](../architecture/principles.md); [ADR-001](ADR-001-core-programming-language.md) Go; [ADR-002](ADR-002-architecture-style.md) ownership; [ADR-003](ADR-003-agent-runtime.md) identity/history/lifecycle; [ADR-004](ADR-004-workflow-engine.md) Workflow/Temporal; [ADR-005](ADR-005-event-architecture.md) durable obligations; [ADR-006](ADR-006-memory-architecture.md) knowledge; [ADR-007](ADR-007-mcp-tool-architecture.md) Tool; [ADR-008](ADR-008-sandbox-execution.md) Execution; [ADR-009](ADR-009-security-isolation.md) current authority; [ADR-010](ADR-010-human-approval.md) Approval; [ADR-011](ADR-011-observability-audit.md) custody; [ADR-012](ADR-012-deployment-architecture.md) storage/deployment gates.

## 14. Evidence and Open Decisions

[I] Implementation evidence: [attribution.go](../../internal/runtime/attribution.go), [run.go](../../internal/runtime/run.go), [preparation.go](../../internal/runtime/preparation.go), [preparation tests](../../internal/runtime/preparation_test.go), [fitness tests](../../internal/architecture/dependencies_test.go), and Phase 1–4 records. No external product capabilities or new technology selection are asserted.

[O] O1–O5 are collected with accountable decision responsibilities, impact and closure evidence in the specification. Human architectural review may accept/revise/reject these recommendations; no open item defaults to allow and no draft wording is acceptance. Phase 5 specification review can complete with explicitly identified OPEN items; operational implementation cannot proceed through the affected blockers. Phase 6 is not started or authorized.
