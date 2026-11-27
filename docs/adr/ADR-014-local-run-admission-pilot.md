# ADR-014 — Admit a bounded local Run before enabling model execution

- Status: **ACCEPTED — DIRECTION ONLY; FEASIBILITY GATED**.
- Owner decision date: 2026-11-27 (Asia/Tokyo).
- Proposal date: 2026-11-27 (Asia/Tokyo).
- Authority: after reviewing the proposed ADR-014, the owner instructed “commit, push va mergeni amalga oshhirib, Tavsiya etilgan birinchi bo‘lakdan boshla!” in the conversation. This approves publication and starting the recommended R0 direction and its feasibility work. It does not supply missing mechanism, schema, provisioning or security evidence. Conversation evidence is retained in this chat, not independently GitHub-accessible evidence.
- Decision rationale: establish trusted non-dispatching admission before any model/tool receives operational authority; preserve the explicit D1/D4/D5/D6 implementation conditions and all existing operational gates.
- Baseline: remote main `22da8fe59d2f33fb627c223ad36658e2e7e56541`, after PR #44. Existing source inspected; index/worktree clean before this draft.
- Effect: D1–D8 are accepted as the conditional direction of this narrow R0 pilot. Concrete D5 protocol, provisioning/schema and operational acceptance remain gated below. Earlier Accepted ADRs and O1–O5 remain unchanged; no operation is activated and no obligation is marked closed. The original draft SHA-256 was `cc419c84f871c28595b614d5066da24ce6504c76a3d3b23ee4b0374b6504a3c5`; this editorial acceptance record does not invent prior approval dates or signatures.

## Context

The operator wants real local agents accessible from Virtual Office. The existing
HTTP application has health routes only. Runtime owns pure immutable values and
preparation, not an authenticated operational application service. The C26 model
probe and C27 console perform explicit text inference, without Run admission,
source-owner authority or durable custody. C28 provides a separate-tab link only.

The C29 retained comparison executed 20 fixed fixtures per retained model, one
attempt each. Qwen2.5-Coder 1.5B scored 9/20 semantic and 7/20 combined semantic
and format; Qwen3 4B scored 16/20 semantic and 12/20 combined. Injection cases were
1/6 and 5/6 respectively. Neither passed the predeclared gate. These observations
are not a universal capability estimate; no model is selected for autonomous work.
The host reports 8 GiB physical RAM. No capacity or isolation guarantee follows.

## Problem

A model response or UI toggle cannot supply the identity, permission, source
ownership, current-policy, durable disposition and evidence contracts required by
ADR-003/009/010/011/013. Building arbitrary dispatch now would bypass those
requirements. A single reviewable decision must settle the first admission slice
without pretending to approve every later tool or execution capability.

## Decision Drivers

1. No model-generated text can grant authority or choose privileged actions.
2. Known, conflicting and unknown creation outcomes remain distinguishable.
3. A local pilot must not invent tenant identity from caller labels or loopback.
4. Existing provider pins, fixtures, frontend contracts and pure Runtime values
   remain compatible; no new dependency is selected by this proposal.
5. The initial deliverable must have real owner-boundary verification, rather
   than simulated evidence of persistence, isolation or approval.

## Considered Options

| Option | Value | Cost / decision |
| --- | --- | --- |
| Connect the current console to Runtime.Start | Fast visual result | Reject: local lifecycle values do not authorize or dispatch anything; no custody |
| In-memory/local JSON ledger called operational | Low setup cost | Reject: contradicts durable creation/evidence requirements and accepted PostgreSQL direction |
| Full autonomous coding organization immediately | Broader product behavior | Defer: model quality, hostile-code isolation, Tool/Approval and source owners are not implemented |
| Narrow PostgreSQL-backed non-dispatching admission, then separately admitted execution | Testable real foundation, follows ADR-013 | Recommend, conditional on the explicit decisions and feasibility gates below |

## Decision — Accepted direction, conditional implementation

Approve **R0 only** as the first operational foundation: one human-initiated local
CLI request, one trusted local operator scope, one pinned instance/configuration
and task/assignment, ending at durably **Created**. There is no queue, model call,
worker, Tool, shell, repository access, autonomous retry or deployment in R0.
This is not yet an operational coding agent. R1 model dispatch remains closed.

Use the existing Go modular application direction and PostgreSQL category from
ADR-012. Do not select SQLite, filesystem logs as durable authority, a broker,
Temporal hosting, a new cloud provider or an authentication product implicitly.
The proposal does not authorize an installation, database/schema migration,
credential provisioning or a dependency change.

### Bounded decisions and mandatory implementation conditions

| Decision | Recommended bounded choice | Acceptance / implementation condition |
| --- | --- | --- |
| D1 — initial actor and surface | CLI-only admission through a local Unix-domain socket; admit one configured OS account, mapping the authenticated peer to a separately provisioned operator and workload identity | Peer-credential behavior must be proven on the actual macOS platform. Socket permissions/loopback alone are insufficient. Reject unsupported peer identity; no browser bearer-token substitute |
| D2 — scope and source ownership | Separate Identity/Security, scope membership, Definition/Instance and Task/Assignment owners; one explicitly provisioned operator organization/project and exact source revisions | No default tenant/admin, caller-selected authoritative scope or hardcoded human identity. Administrative provisioning and authenticated mappings must be separately reviewable |
| D3 — request identity | Runtime-issued 32-byte cryptographic request token in an owner-scoped producer namespace; v1 canonical, typed material intent; SHA-256 content identity plus full canonical-byte equality | Token issuance and lifecycle must be tested; a hash alone is not equality or authority. Reject unknown fields, duplicate JSON keys, noncanonical versions and unsupported material fields |
| D4 — persistence | Runtime-owned creation/request/evidence state in PostgreSQL, accessed by an inward-facing port and an infrastructure adapter | Confirm approved local endpoint, storage/custody, least-privilege roles, driver advisory disposition and schema review before writes. Existing postgrescheck SELECT 1 is not approval of operational storage |
| D5 — source consistency | One explicitly reviewed PostgreSQL acceptance protocol for the local pilot, validating owner revisions/current restrictions at the same durable acceptance boundary | A cross-owner transaction is NOT assumed. A protocol must demonstrate source-owner authority, lock order, revocation ordering and no transaction/repository handle crossing public domain APIs. If this cannot be implemented within ADR-002/013, STOP and revise this proposal before code |
| D6 — evidence/custody | Owner-local durable acknowledgement only for the non-dispatching R0 class, with the owner explicitly accepting lack of independent custody for this class | Run, scoped request disposition and required evidence commit atomically. Audit/Security policy approval is required. This choice grants no custody exception for later tools, execution or confidential workloads |
| D7 — retention and privacy | No automatic deletion, expiry-based re-creation or evidence rewriting; refuse capacity beyond 1,000 pilot requests or 64 MiB retained owner payload, whichever comes first | Proposed limits are product limits, not capacity measurements. Store identifiers/revisions/decisions/digests, not secrets, model reasoning or console history. Restore remains fail-closed until current authority and retained disposition continuity are proven |
| D8 — creation policy | Explicit R0 policy for the provisioned operator and non-dispatching action, including whether domain Approval is not required for that exact action | Record the policy basis. Conversation permission and the console CSRF token do not become an ADR-010 Approval. A missing/unusable required Approval denies acceptance |

D5 is an outstanding feasibility gate, not an assertion that shared PostgreSQL
automatically resolves cross-owner consistency. D1, D4 and D6 also need actual
boundary evidence. Acceptance of the direction alone cannot convert those
unverified controls into implemented guarantees.

## Detailed Design

### Proposed boundaries

| Owner | Owns | Excludes |
| --- | --- | --- |
| Identity/Security admission | Verified peer/account-to-operator/workload mapping, current restriction decision | Model identity, UI labels, blanket local-user authority |
| Project membership | Authoritative operating organization/project relationship | Scope inferred from HTTP fields or Unix UID alone |
| Definition/Instance | Versioned instance/configuration relationship and current eligibility | Runtime authority or silent provider-pin substitution |
| Task/Assignment | Versioned task/assignment, intended instance and allowed purpose | Permission inferred from task text |
| Runtime admission application | Request binding, preconditions, immutable launch projection and disposition | Ownership of source facts, credential issuance, tool execution |
| Runtime persistence adapter | Owner-specific durable storage and atomic write protocol | A universal repository or Shared Kernel |
| Audit policy/custodian | Required evidence, access, acknowledgement and interpretation rules | Approval or creation truth supplied by a diagnostic log |

New package names, public contracts and schema are reviewed as part of the R0
implementation contract; the existing pure Runtime contract does not acquire
network, database, OS authentication or provider dependencies. The architecture
fitness test must enumerate new owners narrowly; no broad standard-library or
platform allowlist is permitted.

### Request and disposition rules (O1)

The request identity is creation-purpose + trusted organization + admitted
producer namespace + Runtime-issued stable token. Bind project, represented
operator, actual workload, instance/configuration revision, task/assignment
revision, purpose, limits and relevant policy/approval references. Material intent
uses a versioned fixed field order and canonical encodings; no floating point,
unordered arbitrary maps or provider objects are accepted.

- Concurrent identical requests produce one Run and one durable association.
- Matching replay returns the original disposition through current read policy.
- Conflicting canonical intent never overwrites the old association.
- Invalid/denied/dependency-unavailable/final-rejected/Created/Unknown remain
  separate; ordinary validation failure cannot erase a possibly accepted request.
- Lost commit acknowledgement yields Unknown until same-token authorized lookup.
- No automatic retry, new-token fallback, expiry-based replay or erase-and-retry.

### Source authority and currentness (O2/O3)

Source owners resolve their own pinned facts using trusted scope. All mandatory
relationships must be demonstrated before sensitive cross-scope disclosure.
No latest-version substitution is allowed. The implementation must demonstrate
which owner can mutate each participating fact and how a concurrent revocation
is ordered relative to durable creation. A stale observation, permit timestamp,
process-local mutex or mocked test does not establish this property.

D5 must be settled by a concrete protocol review before R0 operational code.
The ADR-013 no-cross-owner-atomicity default stays binding until that review.
Owner-controlled source facts cannot be reassigned to Runtime just to simplify
its transaction.

### Historical projection and evidence (O4/O5)

Retain the original scoped actor/workload/source revisions, request identity,
material-intent bytes and digest, restriction observations, exact creation-policy
basis, Approval disposition when relevant, creation ordering/version, Run binding
and named custody acknowledgement boundary. Corrections append linked evidence;
no history is rewritten. Missing retained meaning is an explicit interpretation
gap; a matching digest cannot recreate unavailable source content.

Confirmed Created requires the actual durable transaction acknowledgement under
the approved protocol. A failed audit obligation blocks confirmation. Ambiguous
commit outcome is not absence. Backup and restoration must retain request/Run/
evidence relationships; no production RPO/RTO is claimed for this pilot.

### Later execution boundary — not selected or authorized here

R1 would introduce an explicit single text-inference action, separately checked
current authority, bounded quota/concurrency, cancellation and honest outcome
reporting. It requires a declared model suitability policy and exact model/digest
admission; current C29 failures remain visible. Browser integration must use a
real authentication/authorization contract rather than reusing C27 CSRF as auth.

Repository reads/writes, shell, MCP, generated-code execution, network tools and
production actions remain denied. Any later hostile code needs the admitted
Execution isolation required by ADR-008; a separate process or ordinary
container is not evidence of that isolation. Models can only return untrusted
text and cannot choose capabilities, credentials, scope, next actions or approve
their own results.

## Alternatives Analysis

The staged approach retains domain ownership and makes absent controls visible.
Its cost is that R0 does not yet call the model or animate real Office work.
Combining everything would conceal the unresolved authentication, cross-owner
consistency and custody protocol. A local-only limit does not eliminate these
obligations. An external hosted agent is not a substitute for NEXORA authority
and would require separate provider/data/budget review.

## Consequences

### Positive

A concrete acceptance boundary and replay/custody semantics can be tested before
any model or tool receives operational authority. Existing model/frontend slices
remain independent and usable for diagnostics.

### Negative

Provisioning, database operation and actual concurrency/recovery testing are
necessary. Single-host custody has explicitly limited failure independence.
No claim of a working agent follows from an Accepted document or mocked port.

### Risks

Privileged local account/server compromise, peer-identity portability, source
owner coupling, PostgreSQL role/procedure errors, lost acknowledgement and
restore discontinuity require explicit review. Known model quality failures
remain; a different model is not assumed to solve authorization or injection.

## Security Considerations

Fail closed on unknown identity, scope, policy, source relationship, Approval
usability or custody. Never ingest credentials or permission from model output.
Do not expose a listener to the LAN, add wildcard origins or share raw local
credentials. No production tenancy or compromise containment is claimed.
Review fixed-size validation, concurrent duplicates, path/symlink/socket ownership,
secret redaction, least-privilege database access and denial before disclosure.

## Operational Considerations

No database is started/configured by this proposal. Before migration or R0 code,
record the exact local store/role/driver identity, current security advisory
assessment (including GO-2026-5932), custody risk acceptance and restore test
procedure. Unknown security status is not PASS. Preserve historical forensic
findings and existing evidence; recovery promotion or repair is not authorized.

## Evolution / Exit Strategy

1. Owner accepted the bounded D1–D8 direction and starting R0 feasibility in the conversation. Acceptance does not close the conditions in the table.
2. Establish D1/D4 feasibility and D5 protocol; amend the candidate visibly if
   necessary, without treating speculative mechanisms as proven.
3. Review the exact application/adapter/schema file allowlist and operational
   verification contract. Authorize provisioning/migrations separately.
4. Implement R0; test real trusted-source, database and failure boundaries.
5. Only after acceptance evidence, assess R1 text inference. Tools/autonomous
   execution require their own admitted contracts and isolation.

No data deletion, silent migration, rollback that erases evidence or automatic
execution enablement follows from acceptance. The owner separately authorized
this documentation commit, push and merge; future source publication remains
subject to its applicable delivery authorization.

### Acceptance matrix for R0 implementation

| Scenario | Required evidence |
| --- | --- |
| Forged operator/scope or unsupported peer credentials | Denial before protected source lookup; real socket/OS verification |
| Revoked operator, changed source binding or required Approval unusable | No Created result; actual race/ordering and policy-owner evidence |
| Concurrent same request | One durable Run; actual database concurrency test |
| Same token/different material intent | Immutable conflict, no second Run |
| Commit acknowledged then response lost | Same-token lookup returns original Run, no redispatch |
| Ambiguous database commit | Unknown until authoritative reconciliation; no blind retry |
| Required evidence write fails | No confirmed Created; tested transactional behavior |
| Store restored with missing request/evidence continuity | Block new acceptance/replay until owner reconciliation |
| Capacity/retention boundary reached | Explicit refusal; no deletion or token reuse |
| Any model/tool/shell/provider dispatch attempted in R0 | Architecture/runtime denial; no external effects |

## Development Constitution Compliance

This records the owner-approved conditional architecture direction, not AI
self-acceptance or an operational exception. Constitution sections 3/9 still
govern concrete mechanism/protocol decisions. No earlier Accepted ADR is amended. D02
remains NOT ACCEPTED; normative obligations REVIEW ONLY; O1–O5 OPEN;
GO-2026-5932 OPEN; historical PR #29 P1/forensic restrictions unchanged.
No exact D02 closure record is substituted or reconstructed. Operational
creation/admission/dispatch/persistence remain BLOCKED until the applicable
accepted decision and implementation/verification gates are satisfied. Neither
this candidate nor conversation-level intent fabricates implementation evidence.

## Related Decisions

- [Constitution](../../DEVELOPMENT_CONSTITUTION.md)
- [Architecture and ownership](ADR-002-architecture-style.md)
- [Runtime](ADR-003-agent-runtime.md)
- [Execution](ADR-008-sandbox-execution.md)
- [Security](ADR-009-security-isolation.md)
- [Human Approval](ADR-010-human-approval.md)
- [Audit](ADR-011-observability-audit.md)
- [Deployment/storage](ADR-012-deployment-architecture.md)
- [Run creation](ADR-013-run-launch-attribution-creation-preconditions.md)
- [Phase 5 and O1–O5](../implementation/phase-05-run-admission-prerequisites.md)
- [Delivery policy](../governance/delivery-driven-engineering-policy.md)
