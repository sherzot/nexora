# ADR-007 — MCP & Tool Architecture

- Status: **Accepted**
- Proposal date: 2026-10-05
- Decision authority: Human project owner
- Approval date: 2026-10-05
- Approval evidence: explicit human project-owner approval in this conversation: "I approve ADR-007 — MCP & Tool Architecture as proposed." Acceptance preserves the existing architecture and all 34 tool invariants without semantic modification.
- Recommendation: NEXORA-owned Tool/Operation boundary with admitted MCP, native API and internal adapters; controlled execution through ADR-008
- Constraints: Accepted ADR-001 through ADR-006
- Scope: Conceptual tool ownership, admission, authorization, credentials, invocation and effect evidence; no SDK, integration implementation, schema or deployment selection

## 1. Context

NEXORA agents propose engineering work against repositories, collaboration systems and execution facilities. Being able to describe a tool call does not establish identity, policy, credential eligibility, approval, target validity or successful effect. An external system can perform a mutation before its response is lost. A compromised issue or tool descriptor can propose an unauthorized follow-up. These problems exist with MCP, native APIs and command-line tools alike.

Before edits, the constitution, contributor instructions, ADR convention/index, all Accepted ADR-001–006 and all current architecture documentation were re-read. Repository searches covered MCP, tools, integrations/connectors, credentials/capabilities/authorization, sandbox, GitHub/Slack/Notion/Figma, repository/shell/browser, providers and external operations. The repository contains twelve Markdown documents and incidental desktop metadata, with no implementation or measured integration workloads. No configured provider, credential or SDK is evidence of a running NEXORA system.

No material conflict with Accepted architecture was found. Go remains primary core/backend. The initial control plane remains modular, with public owner contracts, inward dependencies and No implicit Shared Kernel. Runtime owns Run lifecycle and immutable launch attribution; tool operations retain separate ownership. Temporal is durable orchestration infrastructure. Events convey facts/requests without authority or universal exactly-once effects. Sophia supplies governed evidence, not credentials or execution permission.

Current scope statements prohibiting ADR-007 are stale under the new owner handoff; only supporting navigation/status/scope text is synchronized. Historical prohibitions and earlier hypotheses inside Accepted ADRs remain historical and unchanged. The overview's MCP direction is refined as an adapter option, not a universal integration/domain layer.

Material evidence update: the official MCP latest page resolved to revision **2026-07-28**, whose per-request version/capability model differs from initialization/session-based revisions through 2025-11-25 [M1–M3]. This proposal does not assume every server or Go SDK implements the latest revision or pin a version. Compatibility and safe recovery must be validated before adoption.

Unknown: actual provider inventory/feature requirements; provider trust and data residency; tenant/project/resource mapping; service versus delegated-user identities; credential issuance/storage/revocation; dispatch fencing; approval classes; operator roles; target conditional-write/idempotency/status APIs; quotas, deadlines, cost and recovery objectives. These are implementation gates. No performance, SDK parity, security, reliable cancellation or cost guarantee is asserted.

## 2. Problem

Define how proposed intent becomes an attributed, validated, currently authorized, appropriately approved, credential-scoped, bounded operation with honest effect evidence. Preserve owner policy across MCP/native/internal/execution mechanisms without creating a generic privileged executor or treating protocol metadata as domain authority.

## 3. Decision Drivers

1. Current policy and owner invariants on every effect and sensitive read path.
2. Tenant/resource/credential binding and approval of the actual intent/revision.
3. Honest dispatch, cancellation, unknown/partial effects and recovery.
4. Controlled provider admission and versioned discovery without privilege expansion.
5. Portable application semantics without erasing useful provider-specific constraints.
6. Bounded concurrency, retries, rate/cost and retained recovery responsibility.
7. Small justified integration boundaries, not a universal tool framework or product-shopping exercise.

## 4. Considered Options

- Directly expose discovered MCP tools as the runtime's universal contracts and execution path.
- NEXORA-owned operation contracts with selective MCP, native API and internal adapters, plus a controlled execution facility.
- Native provider APIs only, with explicit NEXORA governance.
- CLI/process adapters as the default for engineering integrations.

These are architecture approaches, not selected libraries/products. The second is recommended. MCP-only can suit a narrowly governed interoperability requirement but does not cover all internal/execution needs. Native-only can offer precise semantics but unnecessarily exclude useful admitted protocol integrations. Process-only adds execution and credential exposure obligations to operations that could use APIs.

## 5. Decision

**ACCEPTED: adopt a NEXORA-owned Tool/Operation boundary as the stable application architecture. Treat MCP as one integration adapter/protocol behind it, alongside native provider APIs and controlled internal facilities. Agents propose intents; authoritative owners validate current policy, resource scope and required approval before credential-scoped dispatch. Tool operations retain identity and attributable effect evidence independently of Runs, workflows and transport requests.**

The boundary coordinates authoritative security, approval, domain and credential contracts; it does not own all of their policy. Operation-specific contracts can retain provider-relevant semantics, such as expected repository revision, target-state preconditions or asynchronous status. Do not reduce every action to an unvalidated `name + arguments` bag or a universal shared domain entity.

No universal mechanism is mandated: a GitHub capability may use MCP or native API after admission/conformance review; Sophia queries and owner operations can use public application contracts; shell/build/test/repository-code execution must use the controlled ADR-008 facility. Core policy must not depend on MCP SDK types. Adding another runtime language remains subject to ADR-001 justification.

**Tool capability != authorization. Tool discovery != permission. Tool schema != policy. Tool call request != authorized operation. Authorized operation != successful external effect. Successful API response != complete business outcome unless the authoritative owner defines it so. MCP server != trusted authority merely because it is configured. Credential possession != permission to use every available credential capability.**

This decision is Accepted. Owner acceptance does not itself authorize implementation. No MCP server, integration, credential, schema, SDK or infrastructure is created; ADR-008 is not started.

## 6. Detailed Design

### 6.1 Vocabulary and ownership

These are distinctions, not a final type system, database or capability namespace.

| Concept | Meaning / responsibility |
| --- | --- |
| Tool Capability | Technical operation class supported by an integration; not a grant to the caller |
| Tool Definition / Descriptor | Advertised name, inputs/outputs and metadata; provider claims interpreted through admitted contract mapping |
| Operation Intent | Proposed action/target/arguments/purpose and correlations; actor/scope claims remain untrusted until resolved |
| Authorized Operation | Validated intent permitted under current owner decisions, relevant approval, eligible credentials and bounded dispatch conditions; not a permanent bearer grant |
| Tool Invocation / Dispatch Attempt | One attempt to send/execute the logical operation through an adapter; separate request identity and diagnostic evidence |
| External Effect | Actual observed or possible external mutation/disclosure/execution, possibly partial or asynchronous |
| Tool Result | Returned content/status/error translated by adapter; not automatically business completion or truthful evidence |
| Effect Evidence | Attributable observations supporting performed/not-performed/partial/unknown knowledge; tool/target owner interprets strength |
| Integration Adapter | Infrastructure translation between owned operation semantics and provider/protocol, preserving scope and effect limits |
| MCP Server | Protocol endpoint/process exposing tools/resources/prompts and negotiated features; not NEXORA policy owner |
| Credential / Credential Reference | Secret usable against a particular provider/principal, or controlled reference to it; selection/resolution is trusted infrastructure responsibility |
| Execution Facility | Controlled jobs/environments and termination/effect evidence, owned separately under ADR-008 |
| Resource / Target | Canonical owner-resolved repository/PR/channel/page/file/environment/path identity and relevant revision; arbitrary model names are insufficient |
| Tool Provider | Accountable integration source/operator with admitted origin, inventory, scope and behavior; can differ from downstream business-system owner |

Capability examples such as repository read/write, PR comment/merge, issue create, Slack read/send, Notion read/write, deployment trigger and shell execute illustrate distinct effects. Names are not frozen. “Integration supports merge” means it knows how to attempt a merge, not that an Agent may merge this PR now.

The tool/integration operation owner retains dispatch/attempt/effect/reconciliation responsibility. Runtime stores correlated references and decides Run lifecycle/outcome; workflow decides coordination; resource/domain owner governs business facts; security owns authorization; Approval owns approval validity; credential owner governs issuance/use; Sophia owns permitted knowledge ingestion; audit owns governance evidence. Final module/context assignment remains undecided. A Run finishing does not discard an outstanding tool operation.

### 6.2 Application contract and adapter boundary

```text
Agent / application proposes intent
    → NEXORA owned application operation contract
    → tool boundary coordinates owner validation / admission / approval / credentials
    → admitted adapter: MCP | native API | internal owner | controlled execution
    → provider / execution owner
    → translated result + independent effect evidence
```

Interaction arrows are not code dependencies: adapters depend inward on NEXORA contracts, while core policy remains independent of SDK/protocol/database/provider types. Owned interfaces expose meaningful operations and references, not private repositories, mutable domain objects or transaction handles. Minimal policy-neutral transport utilities may be reused; sharing authorization models or business semantics needs ADR-002's explicit Shared Kernel justification, owners, consumers and change review.

Replacing MCP with native GitHub API must preserve target/revision, logical operation and current authorization semantics. It can require a new adapter-specific mapping when behavior differs; do not promise cost-free interchangeability or invent provider parity. The tool boundary is an application coordination responsibility, not a new universal policy engine or independently deployed service.

### 6.3 Intent-to-dispatch pipeline

1. Resolve trusted initiator/delegator, Agent/Run/task/assignment and environment attribution from authoritative bindings. Reject model self-asserted admin identities or tenant credentials.
2. Map requested capability to an admitted provider/contract revision and actor/task eligibility. Resolve target identity, current ownership/scope and expected revision.
3. Validate input shape and bounded semantics, then consult current security/domain policy and approval requirements. Denial has no dispatch.
4. If approval is required, bind the reviewed intent, arguments, target, revision/environment and declared effect surface. Persist through the approval owner; workflow durably waits when applicable.
5. Establish logical operation identity and required durable dispatch/recovery intent. Choose eligible external principal/credential reference through trusted policy; verify intended provider/audience/scope and data exposure.
6. Admit bounded resources/rate/cost; revalidate current policy, approval, claim and credential eligibility sufficiently close to dispatch. Enforce provider conditional preconditions where supported. Reject changed intent rather than silently updating approved arguments.
7. Dispatch through the admitted adapter; record attempt, acceptance uncertainty and permitted response/effect evidence. Reconcile ambiguous or partial effects through owners; return truthful results.

This is a conceptual sequence with operation-specific ordering, not one distributed atomic transaction. Target lookup/validation can itself read private information and requires appropriate access before exposure. Queue residence, approval waits, reconnect and retry invalidate assumptions about authority; an earlier Authorized Operation is not durable permission. Adapters/execution owners must prevent alternate unchecked paths, including background jobs and administrative replay.

When current policy/approval/credential validity cannot be established, block consequential dispatch; do not fall back to a broader credential or weaker provider. Provider-side authorization is an additional control, not a substitute for NEXORA policy. There may be an unavoidable race after a request leaves NEXORA: record dispatch-time checks, enforce available target preconditions, request cancellation/reconciliation and disclose the limit. ADR-009/010 must define enforcement/race guarantees before the relevant feature, rather than claim the conceptual pipeline is atomic.

### 6.4 Classification, input validation and chained operations

Classification uses action, resource, sensitivity, environment, reversibility, external audience, cost and downstream effects. Candidate classes include information retrieval; reversible mutation; consequential/destructive mutation; external communication; billing-sensitive operation; security/credential administration; code execution; deployment/production operation. Classes may overlap; they are not a fixed enum or complete approval matrix.

A read can disclose secrets/private code/customer data or cause provider cost. A comment may publish private information or trigger automation, and deletion may be irreversible. Validate target ownership and permitted recipients, not merely the provider verb. Classification influences policy/approval, credential minimization, evidence strength, retry and audit requirements. Conservative treatment applies when actual effects are unknown.

JSON Schema validates structure, not tenant binding or intent. Validate resource IDs, canonical targets, environment, branch/revision, path/URL safety, semantic constraints, command arguments and size. `../../../other-tenant` can satisfy a string schema while violating scope. Provider annotations, “read-only” labels and idempotency hints are claims to verify, not the policy engine. Descriptor changes require review of semantic mapping, not only parsing.

In read issue → read repository → modify → push → open PR → merge → deploy, each consequential ownership/trust boundary receives its own checks and approval where required. Permission to read an issue does not authorize later write, merge or deployment. Workflow can coordinate the chain but its definition is not authority. Agents cannot chain raw tool output into execution without a new validated intent.

### 6.5 Provider admission and controlled discovery

Configured, reachable, authenticated, admitted, trusted-for-specific-purpose and authorized-operation are separate judgments. Registration considers accountable operator/owner, verified origin, TLS/authentication, capability/effect inventory, external principals and requested credentials, permitted data disclosure, mutation/delegation behavior, protocol/adapter compatibility, privacy/logging, content trust, failure/status/idempotency and revocation support. Authentication proves a relationship to a principal/origin, not safe implementation or universal trust.

Conceptual lifecycle: discovered → inspected → admitted → enabled for scope → suspended/revoked/retired. Admission and scoped enablement can be one simple record if justified; no registry product/state schema is chosen. Inventory/version changes are staged and compared with the admitted contract. Unknown or destructive additions remain unavailable to agents until reviewed. Suspension blocks new operations and records handling of outstanding effects; it does not magically undo them.

Discovery must be filtered before revealing tenant-private repository names, endpoints or descriptor content. Two tenants sharing a provider origin still need separately bound configuration, resources, credentials, inventories and result/cache scope. Provider namespaces and tool names do not establish identity; colliding names cannot silently route to another principal. Cache/list freshness hints cannot extend access after revocation.

Dynamic discovery can refresh metadata; it MUST NOT enlarge effective permissions or mutate an Agent Definition/configuration revision silently. A server advertising `delete_repository` has supplied metadata, not permission. Existing operations retain admitted definition/adapter/version attribution; changed semantics may pause dispatch and require renewed validation/approval. No automatic provider admission or universal exposure is proposed.

### 6.6 MCP features and version/transport semantics

Protocol facts and NEXORA interpretation are separate:

| MCP feature / official evidence | NEXORA use and trust boundary |
| --- | --- |
| Tool listing, schemas and invocation [M4] | Map admitted operations only; discovery/annotations are not authorization or verified effect semantics |
| Resources provide external context/data [M5] | Authorize before model exposure, preserve provider/source/revision/freshness; Sophia projection/promotion follows ADR-006 |
| Prompts expose server-authored templates [M6] | Optional explicitly admitted content; user selection does not make server text system/governance policy |
| Per-request version/client capabilities and discovery in 2026-07-28; older initialization model [M2] | Adapter verifies supported era/version; technical capability negotiation cannot grant application permissions |
| stdio and Streamable HTTP transport bindings [M3, M7] | Infrastructure connection/process/framing and data routing; no final transport selected |
| HTTP OAuth-based resource authorization [M8] | Bind issuer/audience/principal and credentials; distinct from NEXORA resource/action approval |

MCP does not require every protocol feature to be exposed. Resources, prompts and tools remain distinct use cases. Internal policy evaluation/approval lookup/runtime coordination/Sophia queries can use owned application contracts without MCP. Optional extensions or server requests for input do not create new grants, disclose context automatically or become human approval; explicit admission and purpose/scope checks still apply. No tasks/apps/elicitation or deprecated client feature is adopted merely because a server advertises it.

The researched 2026-07-28 model carries version/capabilities per request and has no initialization handshake; earlier revisions have connection/session initialization. Latest HTTP uses request-scoped response streams, with stream closure signaling cancellation; interrupted delivery requires a new protocol request, not proof of a new business operation [M2, M7, M9]. A legacy adapter must honor its actual negotiated session/reconnect behavior rather than blend eras. Server restart or changed metadata causes compatibility/admission revalidation, not blind mutation replay. No MCP session/connection, explicit server handle or request ID is Agent identity, NEXORA authorization or stable operation identity.

Streaming/progress and partial JSON/content are transport observations, not completion evidence. Bound response size/time; incomplete response can leave effect unknown. Reconnect alone cannot establish whether work happened. Modern new request IDs can map to the same logical operation only under the safe owner recovery contract. If a protocol retry or input round trip can repeat mutation, enforce provider/application idempotency or reconcile first. No transport resume guarantee is inferred for latest or legacy servers.

MCP's protocol authorization does not solve downstream credential use or NEXORA business policy. Its security guidance rejects token passthrough and discusses confused-deputy/SSRF risks [M10]. Credential audience and downstream delegation must be explicitly handled. Compatibility/extension support in the chosen Go client remains unverified; no SDK/version is selected.

### 6.7 Credential architecture and delegated identity

**Agent/LLM MUST NOT receive raw credentials merely to invoke tools.** Trusted credential resolution/use sits behind the tool boundary at a broker responsibility or adapter, without selecting a broker product or separate service. Agents may propose targets; policy chooses an eligible reference bound to tenant/project/resource/provider/principal and purpose. Secret lookup is itself privileged; references are not unrestricted bearer permission.

Evaluate short-lived issuance, OAuth grants, installation/app credentials, service accounts and delegated-user authorization per integration. Prefer least provider scope and short lifetime where feasible. Do not select one mechanism for all systems. Record initiating NEXORA actor/Run separately from actual external user/app/service principal and credential reference; provider attribution may omit the initiating agent, so NEXORA must retain permitted correlation with disclosed limits.

GitHub documents repository/permission narrowing for installation tokens [P1]. Slack posting depends on token identity/scopes and target channel [P3]. Notion separates connection capabilities/content access [P4]; Figma distinguishes user and organization authentication options [P5]. These are examples of provider-specific constraints, not selected integrations or proof of NEXORA permission. A broad organization account can technically access more than a task permits; block unauthorized use even when the provider would accept it.

Credentials must not enter prompts, ordinary arguments/results, Sophia, workflow history, event payloads or logs. Trusted adapters may need secrets for approved authentication but must prevent redirects, free-form headers, descriptor metadata or URLs from forwarding them to unapproved audiences. Separate MCP authentication from downstream provider credentials; do not pass a token intended for one resource to another. Local process adapters must not inherit an unrestricted environment by default. Exact vault, key ownership, OAuth, refresh/rotation, secure process delivery and revocation mechanisms belong to ADR-009/012.

If credential eligibility changes after authorization, recheck before dispatch, reject known revocation and record provider denial honestly. If the request was already sent, denial/cancellation is not proof of no effect; reconcile. Do not rotate secrets, create apps or authenticate integrations in this task.

### 6.8 Approval integration and target preconditions

Agent proposes exact intent → authoritative policy identifies approval requirement → approval owner stores action/target/revision/environment/effect bindings → orchestration durably waits where needed → authenticated decision is read/validated from its owner → current authorization and credential eligibility are rechecked → conditional dispatch or rejection.

A displayed approval message, model statement or MCP prompt is not an approval fact. Changed target, arguments, revision or downstream effect invalidates the relevant binding; seek a new owner-reviewed intent/approval where required. Valid human approval is not a blanket privilege and cannot override current denial. ADR-010 owns detailed validity, expiry, reuse and atomic consumption semantics; ADR-009 owns enforcement and revocation races.

Example: approved PR #42 at head revision H must not silently merge H2. The adapter must use appropriate provider preconditions when available, not merely read H then merge an unbound PR later. GitHub's merge API supports an expected head SHA and reports mismatch [P2]. This does not freeze all approval fields or prove every merge adapter offers equivalent controls. When an admitted adapter cannot enforce a required precondition, reject that operation or require a reviewed alternative; MCP/native swapping cannot weaken the approval contract.

### 6.9 Operation identity, durable dispatch and retry

Logical operation identity is distinct from Run, Workflow, event, delivery attempt, MCP request and provider operation IDs. Establish it before consequential dispatch when deduplication/reconciliation requires it; bind to trusted scope, semantic intent/target/revision and operation purpose. Retries/redelivery preserve that identity and use separate attempt records. Conflicting payload/scope under one identity is an integrity defect, not an ordinary duplicate. New semantic work may receive a new linked identity under owner rules; changing IDs cannot bypass unknown-effect handling or exhausted approval.

Durable required operation responsibility cannot live solely in a client session/goroutine. Apply ADR-005 gap-closing intent and consumer deduplication patterns where committed state must cause asynchronous dispatch. Store local state/intent atomically where claimed; no transaction spans arbitrary provider effects. Durable acceptance != dispatched != provider accepted != known effect != task completion. No database, queue, Outbox/Inbox schema or universal executor framework is selected.

| Retry class | Safe owner behavior |
| --- | --- |
| Read / safe retry | Revalidate access, target, freshness and budgets; repeated disclosures/provider costs still matter |
| Inherently idempotent mutation | Verify intended target/revision and actual semantics; same payload does not prove safety if concurrent state changed |
| Provider idempotency key | Reuse stable identity only within verified provider scope, input binding and retention; key support is integration-specific |
| Reconciliation required | Read authoritative operation/target evidence before deciding repeat; absence in a weak/eventually consistent query is not proof |
| Unsafe/non-idempotent replay | No automatic mutation retry on ambiguous outcome; retain responsibility and reviewed disposition |

One owner controls each retry boundary; SDK/MCP/provider/runtime/workflow retries share budgets rather than multiply attempts. Version negotiation errors, authorization denial, schema defects and admission changes are not generic transient mutation retry reasons. Unknown effects block blind retry; an owner-verified target idempotency contract may safely reconnect/repeat the same operation without issuing new semantic work. No such contract is assumed for generic MCP calls.

### 6.10 Effect knowledge, reconciliation and cancellation

| Effect knowledge | Evidence requirement / limit |
| --- | --- |
| Not dispatched | Owner has evidence no dispatch attempt crossed the boundary; local intent alone is not an external failure |
| Confirmed not performed | Authoritative provider/owner evidence under an adequate contract; generic error/timeout is insufficient |
| Confirmed performed | Defined target/effect evidence with provider ID/revision/status; may still be less than complete business outcome |
| Confirmed partially performed | Known affected/unaffected subset plus unresolved remainder; aggregate “success” must not erase partial effects |
| Unknown / indeterminate | Insufficient/conflicting evidence after dispatch, response loss, crash or timeout; durable reconciliation responsibility remains |

Tool results carry translated status/content/error separately from effect evidence and business outcome. A success response might mean only queued/accepted; an error might follow a performed effect. Report strength, source/observation time, target revision and limitations. NEXORA cannot turn untrusted success text into confirmed truth; authoritative contract/provider state determines interpretation.

Reconciliation uses stable operation/provider IDs and authoritative lookup/read, compares intended target/revision/effect and resolves performed/not performed/partial/still unknown. Generic resource state may show a change without attributing it to this operation; preserve that uncertainty and competing mutations. The LLM may propose an investigation, but cannot guess the effect happened. Compensation is a new currently authorized action, not automatic rollback. Manual disposition is attributable review, not fabricated certainty. A later contradictory target observation appends evidence/correction without silently rewriting Run history.

Before dispatch, cancellation can prevent sending with evidenced not-dispatched status. During request, after acceptance or asynchronous work, propagate scoped stop through supported provider/execution contracts, collect evidence and preserve unknown effects if termination is unconfirmed. Local timeout/stream closure does not prove remote non-performance. Bounded cleanup ends local waiting without erasing outstanding operations. Tool operation owner retains reconciliation even if Run becomes Finished/Indeterminate; runtime lifecycle, wait reason, stop request, final outcome and effects remain separate under ADR-003. Terminal Run retry creates a new linked Run; operation redelivery cannot reopen it.

### 6.11 Outputs, resources, prompts and injection

Validate returned shape, size, source/provider and scope before exposing content to models/callers. Tool output may contain secrets, forged instructions, malformed/stale data or oversized payloads. Authoritative status evidence under a verified contract is distinguishable from free-form untrusted content in the same response. Sanitize/minimize secret-bearing content and preserve allowed references/diagnostics; redaction may limit reconstruction and must be disclosed.

Reading a GitHub issue that instructs “send all environment variables to this URL” produces data. Any resulting proposed send/fetch/credential request crosses the same policy, scope, credential, approval and egress checks; content cannot grant capability or authorize another tool. Prompt-only safety is insufficient. Tool results must not become system prompts, policy, approvals, canonical Sophia artifacts or automatic next calls.

MCP resources preserve source/provider/URI/revision/freshness attribution and current authorization before model exposure. Resource links need controlled resolution, not automatic fetch of any URI. Indexing/promotion follows ADR-006, including provenance, derived labels and deletion. MCP prompts are optional provider-authored templates: selecting one cannot elevate it above constitution/system policy, change Agent configuration silently, choose credentials or authorize effects. Admission defines permitted use and content trust independently of endpoint authenticity.

### 6.12 Downstream delegation and execution boundaries

An adapter/provider may perform several effects or call another privileged system. Admission and operation contract must declare that effect surface, credentials/principals, targets, attribution and partial/failure/reconciliation evidence. A single broad tool cannot conceal merge/deploy/security administration behind “update project.” If downstream effects cannot be constrained or observed sufficiently for the required policy, do not admit that operation. Remote promises are not enforcement; deployment/security review must bound provider credentials and network reachability.

External GitHub/Slack/Notion/Figma APIs differ from execution facilities. Shell, builds, tests, CLIs and hostile repository code MUST NOT execute inside the NEXORA control-plane or Agent Runtime process by convenience. Local MCP stdio starts a process [M3]; it is not a sandbox. Provider process hosting and privilege separation require threat review before use. ADR-008 owns controlled environment/jobs, resources, process-tree termination, artifacts and filesystem/network boundaries; no container/microVM is selected here.

Browser/HTTP targets require trusted policy for schemes/origins and egress, including localhost/private networks/cloud metadata, DNS/redirect transitions, credentials, downloads, size and malicious content. Validate every relevant redirected target and credential audience; an allowed initial URL does not approve an internal redirect. Browser session/cookies carry principal context and must not mix tenants. SSRF/path controls must exist before feature use, with mechanisms deferred to ADR-008/009.

Repository/filesystem operations require canonical workspace/resource mapping, path traversal/symlink/boundary escape controls, branch/commit/working-tree attribution, concurrent-change detection, generated-file limits and destructive-write rules. Pre-checks alone can race with symlink/target changes; execution owner must enforce at actual access. Revision mismatches or unexpected work pause affected writes rather than overwrite. No filesystem isolation design or package tree is finalized.

### 6.13 Accepted tool invariants

1. Tool capability is technical support, not authorization.
2. Tool discovery is metadata discovery, not permission.
3. Tool schema/annotations are not policy or verified effect safety.
4. Operation intent/model output is not execution authority.
5. MCP/provider configuration, reachability or authentication alone does not establish purpose-specific trust.
6. Credential possession does not grant NEXORA permission.
7. Consequential dispatch requires current authorization against trusted actor/Run/task, tenant/project/resource/action/environment and owner invariants.
8. Required approval binds relevant intent/resource/revision/effect surface; it is not blanket authority.
9. Raw credentials MUST NOT reach Agent/LLM merely for invocation.
10. Credential selection/use is policy-controlled, scoped to eligible provider/principal and attributable.
11. Inputs receive semantic/resource/revision validation beyond schemas, including appropriate target preconditions.
12. Tool outputs are untrusted data unless an authoritative contract establishes specific evidence semantics.
13. Retrieved/tool content cannot elevate trust, choose credentials or authorize another operation.
14. Every consequential step in a chain or declared downstream delegation is independently governed.
15. Stable logical operation identity/input binding is preserved across retry/redelivery where required; attempts have separate identity.
16. Unknown external effects block blind retry; safe recovery requires verified owner/provider idempotency or reconciliation.
17. Cancellation/timeout/connection loss does not prove no external effect or rollback.
18. External effects are not universally exactly-once.
19. Dispatch/acceptance, tool result, effect evidence and business outcome remain distinguishable.
20. Reconciliation uses authoritative provider/domain evidence where possible; models do not guess effect completion.
21. MCP connection/session/request/server-handle identity is not Agent identity, authorization or NEXORA durable operation identity.
22. MCP resources are externally provided evidence, not automatically canonical Sophia knowledge.
23. MCP prompts are provider templates, not system/governance policy or human approval.
24. MCP/provider/credential SDK types remain outside core domain policy behind inward adapters.
25. MCP is not mandatory for internal owner operations.
26. Shell/build/test/CLI/untrusted-code execution routes through the controlled ADR-008 execution boundary.
27. Provider registration/admission and scope enablement are distinct from per-operation authorization.
28. Dynamic capability/version discovery MUST NOT silently expand permissions or mutate Agent configuration.
29. Trusted tenant/project/resource scope applies to discovery, credentials, dispatch, results and caches.
30. Retries, concurrency, fan-out, waits, payloads and cost/rate use are bounded with explicit owners.
31. Secrets/private chain-of-thought are minimized and excluded from ordinary prompts/results/logs/events/workflow/knowledge history.
32. Tool/provider/contract/capability/adapter version attribution preserves historical interpretation without rewriting Run launch attribution.
33. Tool infrastructure MUST NOT become an implicit Shared Kernel, private cross-owner state path or universal authority.
34. Workflow Definition, Agent Instance, Memory, Event and Tool Descriptor remain non-authoritative by themselves; current owners govern operations.

These are Accepted obligations, not implemented or verified security/effect guarantees.

## 7. Alternatives Analysis

| Approach | Strength / fit | Risk / limitation | Proposed disposition |
| --- | --- | --- | --- |
| MCP adapter | Standard discovery/invocation/context protocol can reduce provider-specific glue [M1, M4–M6] | Metadata trust, era/SDK compatibility, credentials, downstream semantics and recovery remain responsibilities | Use selectively after admission and operation conformance; not universal domain API |
| Native API adapter | Direct conditional writes/status/principal semantics can be exposed precisely, e.g. GitHub merge precondition [P2] | More integration code, API evolution and provider coupling; does not remove policy or uncertainty | Use where direct controls/feature coverage justify it |
| Internal application contract | Calls authoritative owners directly with clear use-case/domain rules | Can become unchecked private access if bypass paths exist | Prefer where protocol adds no value; same governance obligations |
| CLI/process adapter | Can reuse necessary engineering tools and local workflows | Execution environment, supply chain, arguments, credential/output exposure and termination evidence require controlled facility | Conditional ADR-008 path; never default control-plane shell |

The hypothesis is supported by Accepted inward/ownership rules and official MCP's protocol-versus-host responsibility distinction. A provider descriptor is not enough to express NEXORA task approval, revocation races or business effect evidence. The counterargument is duplicated integration policy and excessive abstraction. Keep the boundary small: owner operations plus admitted adapters, not a new capability DSL, all-provider registry product or generic distributed executor. Use existing owner contracts for internal work and retain provider-specific extension semantics deliberately instead of masking them.

MCP can be the preferred adapter for a concrete admitted provider where its available operations meet target binding, data controls, identity and recovery needs. Native API can win when an MCP adapter omits a required precondition/status/credential constraint. Process invocation can win only for a real unavailable API/workload capability with approved execution controls. No method is selected for GitHub, Slack, Notion or Figma now; representative documentation establishes limitations, not product adoption.

## 8. Consequences

### Positive

Proposed intent stays separate from authority. Provider substitution preserves NEXORA policy and Run attribution conceptually. Scoped credentials and honest effect knowledge make lost-response/partial-action recovery reviewable. Selective protocols avoid unnecessary MCP exposure for internal domains.

### Negative

NEXORA must define admitted operation semantics, conditional targets, credentials and reconciliation per provider. SDK interoperability, changing inventories and safe retry require conformance work. Provider attribution can be weaker than NEXORA attribution. Some consequential operations must stop when effects or current permissions cannot be verified.

### Risks

A generic tool boundary can become a universal policy service/Shared Kernel. Discovered descriptors can launder privileges; broad credentials can create cross-tenant deputies. Hidden nested tools, SDK retries and process adapters can bypass dispatch controls. Legacy/current protocol confusion can repeat effects. Documentation alone prevents none of these failures; real boundary verification remains necessary.

## 9. Security Considerations

Enforce policy outside model reasoning. Protect provider admission/configuration and credential references from model modification. Authenticate trusted NEXORA actor, assignment, resource and environment bindings; treat request IDs, tool names, task text and tenant labels as attribution data rather than grants. Apply least privilege to provider clients and administrative operators. Discovery/read calls also require confidentiality and scoped metadata handling.

Bind issuer/audience/provider/principal during credential selection; reject credential forwarding to arbitrary origins and confused-deputy paths. OAuth consent authenticates provider access but does not approve a particular deployment/merge/message. MCP security guidance discusses token passthrough and SSRF [M10]; detailed secret management, consent, redirect/client registration, encryption and server supply-chain controls remain ADR-009/012 gates. NEXORA requires valid user consent for relevant provider/data use; ADR-010 must define how scoped delegation and operation-specific approval satisfy the selected protocol/provider requirements, without treating an integration login as blanket consent.

External communications can disclose sensitive data even when reversible deletion exists. Validate destinations/audiences and content policy before send; financial/security/production operations require appropriately stronger controls. Do not let credentials available inside one tenant's shared endpoint become eligible for another. Provider sessions, browser state, caches and local environment variables must not leak principals across tasks/tenants.

Hostile repository execution, MCP server processes, downloads and parsers require distinct process/trust analysis. Package boundaries are not a sandbox. External content cannot change constitution, approval, policy, tool constraints or egress. No actual auth, secret, isolation or prompt-injection protection is implemented or claimed secure here.

## 10. Operational Considerations

### Failure walkthroughs A–T

Each scenario retains permitted baseline evidence: actor/Run/task/workflow, trusted scope/action/target/revision, provider/contract/adapter version, current policy/approval references, external principal/credential reference without secret, logical operation/attempt/provider IDs, timestamps/status, cancellation and effect/reconciliation owner. The evidence column adds scenario-specific facts. No payload/secret/private-reasoning retention is assumed.

| Scenario | Expected behavior and authorization | Owner / retry and effect knowledge | Additional evidence / unresolved gate |
| --- | --- | --- | --- |
| A — Missing capability | Reject before dispatch; do not auto-enable discovered tool | Runtime eligibility and tool admission owners; no retry without new valid eligibility; not dispatched | Capability/config revision and denial; final eligibility mapping open |
| B — Policy denies resource | Reject even with declared capability and valid provider credential | Security/domain owner; no default retry; not dispatched | Current resource policy decision; identity/enforcement open |
| C — New destructive tool advertised | Quarantine/unexpose pending inspection and admission; no expanded grants | Registration/security owner; discovery refresh only; not dispatched | Inventory diff/provider revision; review lifecycle open |
| D — Valid schema, wrong tenant | Reject trusted scope mismatch before target content/effect exposure | Resource/security owner; no retry to another credential; not dispatched | Resolved ownership and mismatch; tenancy mapping open |
| E — Approved PR changed | Reject stale binding; require appropriate renewed intent/approval and provider precondition | Approval/resource owner; safe retry only for bound revision; not dispatched if prevented | Approved/current head and conditional result; exact approval/race controls open |
| F — Mutation succeeds, reply lost | Preserve unknown locally, reconcile under current read policy; no blind mutation retry | Tool/provider owner; resolve performed only with adequate evidence | Operation/target/status correlations; provider lookup/idempotency open |
| G — Timeout before known effect | Stop local waiting, retain unknown unless authoritative non-performance established | Tool owner; bounded reconciliation rather than generic retry | Send/acceptance/timeout evidence; provider status/retention open |
| H — Cancel after acceptance | Stop new dispatch, request remote cancel and observe; cancellation no rollback | Tool/provider owner; reconcile performed/partial/unknown | Acceptance/cancel acknowledgement; termination semantics open |
| I — MCP crash/restart in call | Revalidate era/provider admission; reconnect is not permission to replay | Adapter/tool owner; unknown after possible send; safe recovery contract only | Server/version and last transport evidence; durable handles/SDK behavior open |
| J — Injected follow-up tool | Treat output as data; proposed privileged call undergoes new checks/denial | Security/tool owner; original effect separate, follow-up not dispatched | Source/output reference and denied intent; content handling open |
| K — Credential revoked before send | Block known revocation, revalidate near dispatch; provider rejection not assumed no effect if sent | Credential/security/tool owners; no broader-token fallback; unknown when already sent | Eligibility/provider denial/dispatch sequence; revocation race guarantees open |
| L — Credential broader than policy | Restrict selection/intent; deny disallowed resource/action despite provider access | Security/credential owner; no dispatch for forbidden operation | Principal scope versus NEXORA decision; least-scope issuance open |
| M — Duplicate logical operation | Validate same binding, atomically converge on prior/pending disposition | Operation owner; no extra effect; existing performed/unknown knowledge retained | Dedup identity/claim/result; persistence/concurrency horizon open |
| N — Contract/version changed | Pause incompatible mapping; re-admit and revalidate affected intent/approval | Registration/adapter owner; no old mutation under guessed semantics | Contract diff/admitted revision; compatibility tests open |
| O — Only first chain step approved | Govern each later boundary; deny unapproved write/merge/deploy | Relevant security/approval/resource owners; prior read remains separate effect; later not dispatched | Step-specific intent/decisions; final risk/approval matrix open |
| P — Shared server, two tenants | Bind credential/resource/inventory/results to trusted tenant; never cross-select | Security/credential/provider owners; reject mismatch; no cross-tenant effect | Config/principal/resource bindings; session/physical isolation open |
| Q — Hostile repo execution | Route through ADR-008; reject if controlled facility unavailable; no runtime shell | Execution/security owner; not dispatched until controls established | Repo/workspace/revision/job intent; sandbox/network/process technology open |
| R — Partial multi-resource mutation | Report known subset plus unknown remainder; reauthorize any repair/compensation | Provider/domain/tool owners; no whole-operation blind retry; partial/unknown | Per-resource evidence and declared delegation; atomicity/status support open |
| S — Success contradicted by target | Record conflicting observations; authoritative interpretation and reconciliation, no silent success/history rewrite | Resource/tool owner; possible concurrent change remains unknown until attributed | Success receipt, later revision/observation and correction links; completion contract open |
| T — Required provider unavailable | Persist pending responsibility or explicit failure/wait; do not weaken policy or choose unapproved fallback | Workflow coordination plus tool owner; bounded retry only when safe; not dispatched or unknown by attempt evidence | Dependency/backlog/dispatch status and wait references; SLO/recovery budgets open |

### Bounds, availability, evidence and recovery

API quotas, operation cost, context volume and execution capacity are scoped across tenant/project/provider/principal. Bound queued and active work, fan-out, retries/deadlines, response/payload size and reconciliation backlog; honor provider rate responses with bounded waiting rather than multiplying requests. No numeric quotas, scheduler or caching mechanism is selected. Reconciliation itself consumes scope/budgets but must retain assigned responsibility when paused.

Workflow-required operations wait/fail visibly on unavailability; optional information can be omitted with declared degraded context when the operation owner permits it. Provider failover is a new admission/credential/behavior decision, not silent availability magic. Temporal durable waits avoid sleeping workers; external calls remain outside deterministic Workflow code. `Workflow != Agent Run != Agent`; no automatic `Agent Run == Temporal Activity` mapping is introduced.

Track operation and attempt statuses, provider acceptance, errors, rate/admission refusals, unknown/partial effects, stop requests and overdue reconciliation separately. Complete business/audit truth remains at owners; tool logs are neither the whole audit trail nor recovery authority. ADR-011 decides integrity/privacy/retention and denied/admin evidence. ADR-012 recovery must preserve intent/dedup/operation evidence and reconcile post-checkpoint effects before replay, rather than blindly resend after restore.

Future separately authorized validation must exercise A–T, actual credential/resource boundaries, revocation/approval/target races, shared-endpoint tenant mixing, discovery/version changes, stream loss/server restart, duplicate concurrency, provider partial/unknown effects, hostile outputs and controlled process dispatch. Demonstrate MCP/native equivalence for the specific admitted operations, including lost-response reconciliation and target preconditions. No application tests, integration connections, credential issuance, SDK install, benchmarks or fault injection were performed here.

## 11. Evolution / Exit Strategy

Agent/application → owned operation contract → admitted MCP/native/internal/controlled-execution adapter. SDKs, provider IDs, transport sessions and secrets stay at adapters; operation semantics and current domain/security/approval contracts remain NEXORA-owned.

Migration MCP → native API or native API → MCP requires mapping target/revision, external principal, allowed data, logical identity/idempotency, cancellation, partial/unknown effect evidence and version attribution. Demonstrate required preconditions and equivalent policy before routing new work. Drain or reconcile old in-flight operations under their original recorded adapter; do not dispatch the same unknown mutation through a second adapter as failover. Historical records retain original provider/contract attribution.

If a mechanism lacks a necessary conditional/status primitive, expose that limit, choose another reviewed operation path or decline the operation; do not weaken domain policy for uniformity. Extraction follows ADR-002 security/scaling/fault/deployment evidence gates, not tool count. New server features/runtimes need explicit admission/architecture review as applicable. Removal requires outstanding-effect disposition and permitted record retention; deletion remains subject to owner authorization.

## 12. Development Constitution Compliance

- Re-read governance, all Accepted ADR-001–006 and all architecture documentation; searched existing integration/trust/operation references before edits.
- Surfaced stale scope restrictions, current versus legacy MCP semantics and material implementation unknowns; no accepted conflict found.
- Preserved Go language policy, modular/inward/public ownership, No implicit Shared Kernel, Runtime history/lifecycle, Temporal infrastructure, event and Sophia boundaries.
- Recorded Accepted status with explicit human project-owner approval dated 2026-10-05; no implementation authority inferred.
- Distinguished official protocol/provider facts from NEXORA architectural inference, with no SDK parity/performance/security guarantees.
- Documentation only; no source, dependencies, servers, OAuth/apps/tokens, schemas, queues, workers, workflows, sandbox or deployment configuration.
- Synchronize directly supporting scope/status/navigation only; Accepted ADR-001–006 unchanged; ADR-008 not started.
- Verification covers scope/status/structure/links/scenarios/invariants and byte preservation, not runtime controls.

## 13. Related Decisions

[Constitution](../../DEVELOPMENT_CONSTITUTION.md), [ADR program](README.md), [architecture context](../architecture/ARCHITECTURE.md), [principles](../architecture/principles.md). Accepted constraints: [ADR-001](ADR-001-core-programming-language.md), [ADR-002](ADR-002-architecture-style.md), [ADR-003](ADR-003-agent-runtime.md), [ADR-004](ADR-004-workflow-engine.md), [ADR-005](ADR-005-event-architecture.md), [ADR-006](ADR-006-memory-architecture.md).

| Deferred ADR | Unresolved implementation gates |
| --- | --- |
| ADR-008 — Sandbox & Execution | Controlled CLI/MCP process hosting, repo/path/symlink/branch safety, browser/network/SSRF, resources, job/termination/effect evidence; no isolation technology chosen |
| ADR-009 — Security & Isolation | Trusted identities/tenancy, provider admission/consent, current policy/claims/fencing, credential issuer/audience/vault/revocation, egress/residency, supply chain and shared endpoint isolation |
| ADR-010 — Human Approval | Risk/action matrix, intent/target/revision/delegation bindings, consent versus approval, expiry/revocation/reuse and dispatch races |
| ADR-011 — Observability | Complete audit versus tool evidence, privacy/integrity/retention/corrections, operation/principal correlation, unknown-effect alerts and cost |
| ADR-012 — Deployment | Supported SDK/protocol/transport/provider versions, topology, secret infrastructure, capacity/rate/recovery objectives, persistence and tested restore; Temporal hosting remains undecided |

Exact MCP SDK/client, version pinning, transport, credential vault/OAuth implementation, policy engine, capability namespace, approval UI, retry counts/timeouts/rate limits, provider libraries, database/queue schemas/mechanisms, sandbox technology and audit backend remain undecided. Final contexts/package layout remain open. Security controls must be resolved before affected feature implementation; future ADRs are not created here.

## 14. Evidence / References

Official documentation reviewed **2026-10-05**. Versioned MCP pages describe researched protocol facts, not a NEXORA version selection or installed SDK conformance. NEXORA ownership/pipeline/invariants are architectural inferences from the owner handoff and Accepted constraints. No representative provider has been connected; API references are illustrative and must be rechecked before implementation.

- M1: [MCP specification overview, 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) — protocol scope, features and host trust responsibilities; latest resolved to this revision during research.
- M2: [MCP versioning and compatibility](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning) — per-request metadata, discovery and modern/legacy interoperability.
- M3: [MCP transport overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports) — stdio and Streamable HTTP bindings; transport mechanisms are not domain semantics.
- M4: [MCP tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) — schemas, listing/invocation, content/results and untrusted annotations.
- M5: [MCP resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources) — external contextual data/resource interface.
- M6: [MCP prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts) — server-authored templates and intended user selection.
- M7: [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) — request-scoped streams/cancellation and transport delivery limits.
- M8: [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) — HTTP resource authorization/token handling; not NEXORA action policy.
- M9: [MCP cancellation](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation) — transport-specific cancellation and bounded timeout expectations.
- M10: [MCP security best practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices) — confused deputy, token passthrough and SSRF concerns.
- M11: [MCP revision changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog) — session/initialization changes and optional-feature lifecycle; no automatic feature adoption.
- P1: [GitHub installation token generation](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app) — repository/permission scoping as a credential example.
- P2: [GitHub merge pull request API](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request) — expected head SHA precondition and provider merge evidence.
- P3: [Slack chat.postMessage](https://docs.slack.dev/reference/methods/chat.postMessage/) — authenticated principal/scope/channel-dependent messaging.
- P4: [Notion connection capabilities](https://developers.notion.com/reference/capabilities) — read/update/insert and content-access distinctions.
- P5: [Figma API authentication](https://developers.figma.com/docs/rest-api/authentication/) — user/organization principal mechanisms and scope distinctions.

Project evidence: current ADR-007 owner handoff, all twelve existing Markdown documents read, repository reference searches and pre-edit byte snapshot. Explicit human project-owner approval was recorded on 2026-10-05. Documentation checks do not establish deployed authorization, sandboxing or safe external effects.
