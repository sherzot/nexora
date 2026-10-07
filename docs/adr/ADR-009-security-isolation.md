# ADR-009 — Security & Isolation Architecture

- Status: **Accepted**
- Proposal date: 2026-10-05
- Decision authority: Human project owner
- Approval date: 2026-10-05
- Approval evidence: explicit human project-owner approval in this conversation: "I approve ADR-009 — Security & Isolation Architecture as proposed." Acceptance preserves the existing architecture and all 74 security invariants without semantic modification.
- Recommendation: Compositional current-authority security with trusted identity/context, authoritative resource resolution, bounded delegation, scoped credential references and consequential owner enforcement
- Constraints: Accepted ADR-001 through ADR-008
- Scope: Conceptual identity, authority, tenancy, delegation, credentials, trust, revocation/fencing and security evidence; no implementation, product, schema, final context/package or deployment selection

## 1. Context

NEXORA coordinates humans, configured Agents, Runs, durable workflows, Sophia retrieval, Tools, isolated execution and external providers. A model can propose an operation, but cannot establish who is acting, on whose behalf, under which current authority, using which credentials, or against which owned resource. A privileged service can technically perform more than its caller is permitted to request. Long waits, cached decisions, partitions and external effects make admission-time authorization insufficient.

VERIFIED repository evidence: fourteen Markdown documents and incidental desktop metadata; no source, manifests, security configuration, tests or deployed infrastructure. `rg --files --hidden`, direct document reads, a security-reference search and a pre-edit byte snapshot were used. `git status --short` reports that this directory is not a Git repository; changes are compared to the snapshot, not invented Git history. The constitution, AGENTS, ADR convention, all Accepted ADR-001–008 completely and all architecture documentation were re-read before modification.

The owner's current request supersedes supporting prohibitions on ADR-009. Supporting scope/navigation is synchronized; earlier scope statements inside Accepted ADRs remain historical and unchanged. No material conflict requiring an Accepted ADR change was found. Go remains primary core/security-facing backend; no runtime is added for an IAM SDK. Modular Monolith control plane, public owner contracts, inward dependencies, selective DDD, application-level slices and No implicit Shared Kernel remain constraints. Security, domain, process, sandbox and deployment boundaries are distinct.

ADR-003 owns Run identity, lifecycle and immutable launch attribution; ADR-004 owns durable orchestration using Temporal, not permission; ADR-005 owns communication/delivery semantics; ADR-006 owns Sophia knowledge/retrieval, not policy or secrets; ADR-007 owns Tool/Operation contracts; ADR-008 owns dedicated controlled execution and its stronger-than-ordinary-container hostile-code baseline. ADR-009 composes security constraints with these owners, rather than absorbing their state or invariants.

UNKNOWN implementation gates: tenant/organization relationship and membership authority; supported human/workload authentication, required assurance and account recovery; resource classes and legitimate sharing; actual provider/OAuth capabilities; privacy, residency, compliance and data classification; operator staffing and emergency risks; consistency, revocation latency, clocks and partition behavior; workloads, policy size, SLOs/RPO/RTO, budgets and evidence retention. These block affected final designs and guarantees, not this conceptual proposal. Explicit assumptions: project/dependency/generated/LLM/provider content can be hostile; infrastructure and operators can be compromised; provider credential rights can exceed a NEXORA task. No measured security, availability or latency result exists.

## 2. Problem

Establish trusted identity and current authority across humans, Agents, workflows, tools, workers and providers while preventing privilege escalation, confused deputies, stale authorization, credential leakage and cross-tenant disclosure. Answer: who initiated, who delegated, which workload acts, which Agent/Run/task caused it, whose resource is targeted, what current policy and approval permit, which external principal/credential is eligible, what boundary enforces it, and what revocation/fencing can actually prevent.

A decision is not enforcement. A revocation record is not proof a partitioned worker stopped or a remote request was rejected. Historical attribution is not durable permission. Architecture must represent these distinctions honestly without building a giant IAM platform before concrete needs justify it.

## 3. Decision Drivers

1. Prevent unauthorized effects and disclosure at actual ownership/trust boundaries, including reads and model exposure.
2. Preserve authoritative identity, scope, resource ownership, bounded delegation and independent service authority.
3. Maintain current authorization across waits, replay, retries, sessions, caches, provider changes and revocation.
4. Limit credentials and provider trust by purpose; contain compromise and preserve honest in-flight uncertainty.
5. Retain domain policy ownership and inward contracts without universal security-domain models.
6. Provide attributable decisions, enforcement and recovery evidence without secrets or private chain-of-thought.
7. Choose the smallest compositional mechanism, with explicit availability tradeoffs and replaceable infrastructure.

Future quality scenarios are A–AZ in section 10: a revoked actor must not cause a new affected dispatch; a forged tenant must not disclose another tenant's content; a stale worker must fail the actual owner fence where supported; loss after dispatch must preserve unknown effects; a provider migration must preserve identity and policy meaning. Verify actual decision-to-use races and denied output at real boundaries. Numeric propagation, availability, latency and recovery targets require owner-approved risk/workload evidence before implementation; none is invented here.

## 4. Considered Options

- Pure role-based authorization at API ingress.
- Attribute/context-based or relationship-based authorization as the sole universal model.
- One central security service owning every resource, permission and business invariant.
- Independent domain-local authorization without common security constraints.
- Compositional authorization: trusted identities and current security constraints plus owner rules, relevant roles/relationships/context, delegation and approval, enforced by actual owners.

The last option is recommended. It is a semantic composition, not a policy engine, separate service, graph database or fixed DSL. Credential references and scoped/short-lived resolution are preferred where feasible; they do not replace current authorization or guarantee external revocation.

## 5. Decision

**ACCEPTED: NEXORA uses a compositional current-authority security model. Authenticate trusted human/workload principals, construct explicit scope and delegation context, resolve resources through their authoritative owners, compose current security constraints with domain rules, capability/role/relationship eligibility, purpose/task/environment, required valid approval and credential/provider eligibility, then enforce obligations at consequential owner boundaries. Current deny/revocation/fence constraints block affected operations even when an older allow, role or approval exists.**

Agents/LLMs propose intent, never authenticate, grant permission, approve themselves, choose raw credentials, broaden tenant scope, declare provider trust, weaken sandboxing or declare unknown effects reconciled. Runs, workflows, operation/job IDs and event correlations are attribution, not permission tokens. Identity/authentication, policy decision, enforcement, credentials, effects and evidence remain distinct.

Prefer bounded attenuating delegation over impersonation. Preserve initiating/delegating humans, Agent and Run attribution, effective workload and external provider principal separately. A service's independent authority for a declared safety/maintenance responsibility does not become authority available to its caller. No default universal `admin` bypass.

Prefer trusted credential references and minimum necessary scope/lifetime rather than long-lived raw secret distribution. Not every allowed operation needs a NEXORA bearer token, external credential or new principal. In-process owner calls can use trusted validated context; infrastructure adapters translate identity and policy without owning domain meaning.

Revocation restricts future authority; fencing is enforced rejection of stale exercise at the actual receiver where possible. Neither is retroactive rollback. Stop/contain/reconcile affected running work under explicit owners; do not equate worker loss, timeout or revocation acknowledgement with absence of effects. Unknown security state blocks new consequential mutation, secret disclosure or cross-tenant read when required authority cannot be established. Narrow degraded reads and independently authorized safety cleanup are analyzed separately, not a general fail-open path.

No IdP, authentication protocol, IAM product, policy language/engine, token format, secret manager, graph/store, service mesh, cryptographic implementation, supply-chain tool, numeric limit or topology is selected. ADR-008's additional admitted userspace-kernel, VM/microVM or demonstrated-equivalent hostile-code isolation remains mandatory for that workload; ordinary same-kernel containers alone remain insufficient. This record is Accepted with explicit human project-owner approval dated 2026-10-05; acceptance does not authorize implementation, which requires separate explicit human direction. ADR-010 is not started.

### Fundamental distinctions

**Authentication != Authorization. Identity != Authority. Agent identity != Authority. Agent capability != Permission. Role != unconditional permission. Tool Capability != Authorization. Tool Discovery != Permission. Credential possession != NEXORA authority. Credential scope != NEXORA policy scope. Approval != permanent authorization. Workflow Definition != Authority. Workflow history != current authorization. Event != Authority. Memory != Authority. Retrieved knowledge != Policy. Sandbox != Authorization. Isolation != Authorization. Provider authentication != Provider trust. Provider admission != per-operation authorization. Tenant identity != Resource ownership proof. Resource identifier != access grant. Network reachability != Permission. Successful TLS connection != trusted business authority. Service identity != permission to every operation that service can technically perform. Delegation != impersonation. Impersonation != unrestricted authority transfer. Revocation request != immediate proof that all previously issued authority is unusable. Audit record != authorization. Security evidence != business truth unless the authoritative owner defines it so.**

## 6. Detailed Design

### 6.1 Security vocabulary

These thirty-six concepts describe semantic responsibilities, not mandatory classes, tables, services or a universal Shared Kernel.

| Concept | Meaning and distinction |
| --- | --- |
| Principal | Authenticated accountable human or workload identity eligible to participate in policy; identity alone grants nothing |
| Human Principal | Person authenticated through an admitted identity mechanism, separately mapped to current memberships |
| Service / Workload Principal | Authenticated software workload with its own narrowly defined operational authority; not every correlation ID |
| Agent Identity | Runtime-owned stable configured identity/specialization and attribution; not automatically an independently authenticated principal |
| Initiator | Principal that originated the task/operation, retained historically |
| Delegator | Principal granting bounded act-on-behalf authority through trusted policy; not merely an Agent named in text |
| Effective Actor | Authenticated workload/person exercising an operation, evaluated with represented/delegated authority rather than flattened into one label |
| Subject | Identity/context whose eligibility is evaluated; distinguish it from network caller and resource owner |
| Tenant / Organization Scope | Trusted isolation/governance context; whether organization equals tenant is unresolved |
| Project Scope | Owner-resolved project relationship and permitted membership; not permission to every project resource |
| Resource | Owner-defined protected object/data/operation target with canonical identity, scope and relevant revision |
| Resource Owner | Authoritative domain responsible for resource meaning, ownership, invariants and access facts |
| Action | Owner-defined requested behavior/effect/disclosure, not only HTTP verb or tool name |
| Capability | Technical/configured eligibility to support an operation; no unconditional grant |
| Permission | Contextual current allowance constrained by all required owners, restrictions and obligations |
| Role | Governed grouping of eligibility/relationships; scoped and revocable, not unconditional permission |
| Policy | Attributable current rules owned by security, domain or other designated authority |
| Authorization Request | Validated actor/delegation, action/resource, scope, purpose/task/environment and required current facts |
| Authorization Decision | Allow/deny or explicit unable-to-establish result, with obligations, scope, revisions, validity and evidence; not eternal authority |
| Obligation / Constraint | Required condition at use, such as source binding, restricted destination, masking, budget or approval; inability to enforce blocks allow |
| Delegation | Explicit bounded act-on-behalf authority with chain, attenuation, scope, validity and revocation |
| Impersonation | Exceptional governed act represented as another identity while retaining real operator attribution; distinct from routine delegation |
| Approval | Independently owned decision binding reviewed intent/context; required where policy says, never overrides current denial |
| Credential | Authentication/technical access material for a particular principal/audience; not complete NEXORA permission |
| Credential Reference | Controlled owner-scoped lookup/binding identifier; possession is not authority to resolve or use |
| Secret | Sensitive material requiring restricted handling, including keys/tokens; may not be a credential |
| Session | Bounded authenticated interaction continuity; not permanent authority for durable work |
| Security Context | Trusted validated identity, represented actor/delegation and scope/revision references propagated with integrity; not model claims |
| Provider | External or infrastructure identity/policy/credential/integration/execution source with purpose-specific trust |
| Provider Admission | Reviewed eligibility/control coverage for defined use and scope, independent of per-operation permission |
| Trust Boundary | Point where identity, authority, input trust or disclosure assumptions change |
| Revocation | Owner decision that affected authority/eligibility must no longer apply; enforcement propagation is separate |
| Fencing | Receiver/enforcement behavior preventing stale authority/ownership from being successfully exercised in its covered boundary |
| Break-glass / Emergency Access | Exceptional, reason-bound, minimal, attributable, bounded and independently reviewable emergency authority |
| Security Evidence | Permitted records of identity, decisions, enforcement, restrictions and incidents, not grants or universal business truth |
| Security Incident | Suspected/confirmed loss of confidentiality, integrity, authority or boundary control requiring owned containment/recovery |

### 6.2 Principals, identities and attribution

| Actor class | Principal interpretation | Current authority and separate attribution |
| --- | --- | --- |
| Human user | Authenticated human principal | Membership, resource rules, context and approval still required |
| Tenant/organization administrator | Human principal with scoped administrative eligibility | No automatic platform or other-tenant authority; organization/tenant mapping explicit |
| Project member | Human principal with project relationship | Membership is relevant evidence, not every-action permission |
| NEXORA service/workload | Authenticated workload principal | Narrow own duties plus separately validated represented caller authority |
| Agent Instance | Stable Runtime configuration identity; not a permission-bearing principal by default | Trusted mapping to effective workload/assignment; capability/current eligibility checked |
| Agent Run | Runtime-owned attribution and bounded attempt | Not principal merely because it has an ID; immutable launch attribution and dynamic restrictions |
| Workflow execution | Owned orchestration identity | Not actor authority; coordinates authenticated owner operations outside deterministic policy replay |
| Execution worker/provider | Authenticated management workload/provider principal | Assignment, admission, control readiness and current claim; job code does not inherit worker management identity |
| Integration provider | Authenticated endpoint or external principal as its contract establishes | Admitted use, scope and downstream external principal remain distinct |
| MCP server | Authenticated provider/process identity where supported | Not Agent identity or automatically trusted policy; descriptor content remains data |
| External user-delegated identity | Provider-authenticated user/grant identity | Explicit link to internal person/tenant/consent; provider scopes do not establish NEXORA policy |
| Operator/platform administrator | Authenticated human/workload with declared infrastructure role | Application/tenant data access and impersonation require distinct governed authority |

Tool Operation, Execution Job/Attempt, Workflow ID, Run ID, session handle and event correlation are not automatically security principals. They can bind a request to an assignment/source/ownership claim without becoming independent identities. If a future workload needs a principal specifically for an Agent or job, require explicit credential issuance, audience, lifecycle, scope and revocation review; never infer it from the identifier.

Identity responsibility owns stable internal principal mapping and authentication evidence; membership/relationship owners own current scope facts. Account linking/unlinking and identity-provider migration are privileged changes, not email matching. VERIFIED OIDC facts: Core defines authentication claims and issuer/subject identity, and validates issuer/audience, validity and relevant nonce; email is not a guaranteed stable unique identity [I1]. NEXORA inference: if OIDC is selected later, bind admitted issuer plus subject to an internal principal without treating external roles/claims as globally authoritative membership. No OIDC provider or token format is selected here.

Retain the chain: human initiator → bounded delegation/task → configured Agent proposes → Run/task/workflow attribution → authenticated Tool/Execution workload dispatches → bound external user/app/service principal acts. The Agent is a product actor; the dispatching service is the authenticated executing principal; represented authority derives from valid delegation or independently governed system duties. Evidence retains all applicable identities instead of `actor = Agent`.

Historical initiator/delegator/configuration/task revision remain immutable under ADR-003. Append each operation's effective current policy/delegation/approval/workload/credential reference and explicit corrections; do not rewrite prior attribution after membership changes. An autonomous scheduled operation needs a current system-owned mandate and responsible principal, not an invented human delegation or perpetual authority from the last logged-in user.

### 6.3 Tenant, project, resource and authoritative resolution

Security policy derives scope from authenticated identity, trusted assignment and owner relationships. Tenant and organization may coincide, nest or differ; no final hierarchy/cardinality is frozen. A user can belong to multiple tenants, but every operation selects one explicit validated operating scope or an explicitly authorized sharing relationship; membership sets must not be unioned into accidental access. A project belongs to a trusted governance/isolation scope through its owner. Resources can have more specific ownership/classification and sharing restrictions.

Example: model proposes “modify repository foo” → trusted repository owner resolves tenant A / project P / repository R / branch B / source H → resource lookup itself checks permitted metadata access → current authorization for intended action against R/H and recipient/environment → provider credential bound to permitted external account/repository → conditional actual use. Display names, URLs, paths, provider IDs and MCP descriptors are claims, not access grants. Ambiguous identity, owner mismatch or missing authoritative resource information blocks sensitive use; do not search all tenants to guess a match.

Resolve and bind ownership/revision at actual use. Local owner writes can use appropriate atomic checks with their transaction; remote operations need provider preconditions or a reviewed equivalent with disclosed race limits. Never describe a separate policy read plus remote API call as an atomic transaction. Source H cannot silently execute/merge H2; ADR-007/008 attribution stays intact. If required binding cannot be enforced, refuse that operation or propose a separately reviewed path.

| Isolation surface | Owner-enforced conceptual requirement |
| --- | --- |
| Domain data | Trusted caller/resource scope on owner queries and mutations; no arbitrary cross-owner SQL; data-layer defense where justified, no RLS/schema choice |
| Sophia | Scope before candidates/snippets/counts/relationships and sensitive model delivery; current access/source status; vectors cannot bypass isolation |
| Tool discovery/MCP | Scope inventory, descriptors, server configuration, targets and dynamic additions before exposure; shared origin does not share permission |
| Credentials/provider accounts | Trusted eligibility and reference resolution by owner, principal, tenant/project/resource/action/environment; no cross-account fallback |
| Execution/workspaces | Dedicated ADR-008 boundary, trusted source/job/attempt scope, no host/control-plane secrets or cross-job writable access |
| Caches | Trusted scope, generation/provenance and eligibility; private writes, reviewed sharing, no model-chosen namespace |
| Browser/session state | Scope profiles/cookies/storage/downloads to tenant/job and external account; reuse only under verified allowed lifecycle |
| Events/workflows | Trusted producer/caller and target ownership; IDs/topic/namespace/history are not grants; sensitive payload minimization |
| Logs/evidence/artifacts | Current reader/recipient authorization, sensitivity and custody; untrusted outputs never auto-executable or canonical |
| External AI/embedding/provider data | Governed disclosure before transmission, including prompts, source, summaries and vectors |

Default cross-tenant access is denied. Shared organization resources/project sharing require explicit owner relationships and recipient actions; support access is scoped operator access; multi-tenant humans select scope; cross-organization integrations require source export and destination acceptance authority; migration/export/import separately authorize source read, transport, recipient and destination write, with conflict/revocation handling. A tenant name in a prompt cannot create any of these relationships.

Shared infrastructure with logical isolation can fit lower operational complexity only when threat/compliance requirements permit and actual controls are verified. Stronger account/host/physical separation can be required for sensitivity, provider blast radius or side channels. Per-tenant external credentials narrow exposure but add lifecycle work; shared provider accounts require enforceable tenant bindings and may be unacceptable if narrower policy cannot be enforced. No topology, tenant schema or physical isolation claim is selected.

### 6.4 Delegation, impersonation and effective authority

Delegation is explicit act-on-behalf authority, not copying the delegator's identity/token. Bind delegator, delegate/effective workload, tenant/project/resource/action set, purpose/task/assignment revision, environment, provider/credential eligibility, permitted downstream effects, relevant approval, expiry/freshness, chain and revocation dependencies. Maximum depth and numeric lifetimes remain open. Re-delegation is denied unless explicitly permitted; validate every hop and prevent cycles/ambiguous chains. New delegates receive equal-or-narrower scope, not broader privileges through a service.

For delegated user actions, the delegate cannot exceed the delegator's current authority for that operation. The effective allowance is the intersection of valid upstream delegated authority, delegate/workload eligibility, current owner/security rules and relevant obligations. A removed delegator invalidates the affected user-authority path; other legitimate system work may proceed only under its separately defined mandate, not silently relabeled to evade revocation.

Challenge: a service needs independent infrastructure authority to clean up a revoked job, preserve incident evidence or perform owned maintenance. Such authority is not derived from the user's permission and cannot be modeled as a union granting the user the service's privileges. Name the service duty, trigger, targets and bounded effect surface; validate and attribute that duty separately. If a user action requires both represented permission and service execution rights, require both. Cleanup cannot publish source, deploy or read unrelated tenant data merely because it needs privileged termination.

Impersonation is exceptional, explicit, purpose-bound and reviewable, with real operator, represented subject, justification, allowed operations, scope and validity retained. It must not erase operator identity or silently substitute another tenant session. Final approval/quorum/UX/expiry mechanics belong to ADR-010. Protocol token exchange or provider “act as user” behavior, if later used, must preserve these semantics; no token-exchange protocol is adopted here.

### 6.5 Compositional authorization, ownership and PDP/PEP

Conceptual allow requires all applicable checks: trusted authenticated principal/workload; valid operating scope and memberships/relationships; eligible action/capability; authoritative resource/ownership/revision; current security and domain policy; purpose/task/environment restrictions; sufficient valid delegation or declared own-duty mandate; required valid approval; eligible admitted provider/credential where used; no current applicable deny, revocation or fence; and enforceable obligations. An inapplicable provider credential is not fabricated for a pure local calculation. Absence of required facts yields explicit unable-to-establish/deny, never guessed allow.

Roles can group stable eligibility; contextual attributes bind environment, sensitivity, source revision and purpose; resource relationships express ownership/sharing; domain rules determine valid state transitions. None alone handles all NEXORA paths. Deny dominates allow within applicable current security restrictions: tenant suspension, principal/credential/provider revocation, resource lock, environment restriction and incident fences block the affected scope. Scope matters: tenant business suspension need not prohibit separately authorized safe cleanup. An emergency exception is a new owned bounded rule under governance, never “admin ignores deny.” Owner conflicts cannot be resolved by whichever allow arrived last.

| Policy responsibility | Authority retained | Composition boundary |
| --- | --- | --- |
| Identity/security | Authentication mapping; disabled principal, tenant restriction, environment, delegation, provider/credential eligibility and incident constraints under explicit owners | Supplies trusted current facts/decisions; does not own every resource/business state |
| Domain resource owner | Resource identity/ownership/sharing facts, permitted actions and business invariants, e.g. whether this repository change may merge now | Owns consequential resource operation; security allow cannot override invariant |
| Approval owner | Valid reviewed intent/context and decision references | ADR-010 defines mechanics; current security deny still applies |
| Runtime | Agent configuration eligibility, assignment and Run lifecycle/history | Cannot grant arbitrary domain permission |
| Tool owner | Admitted operation semantics, input binding, external principal/effects | Coordinates relevant policy, not universal resource owner |
| Execution owner | ADR-008 isolation/readiness, job/source/resource/network/secret constraints, termination and cleanup | Authorization does not prove safe execution; isolation does not grant authority |
| Sophia/source owner | Knowledge/source visibility, retrieval/derivation/promotion eligibility | No policy inferred from retrieved instructions |

**Policy Decision Point (PDP)** is a responsibility evaluating trusted facts and returning an attributable scoped decision plus obligations/validity. It may be local or invoke public owner/security contracts. **Policy Enforcement Point (PEP)** refuses/permits actual operation only when all required checks and obligations hold, binds decision to the operation/resource/current claim and reports evidence. A PDP allow which the PEP cannot enforce is insufficient. PDP/PEP need not be separate services; no centralized rule language or policy model is selected.

PEPs exist at API ingress, domain-owner action/read, Tool dispatch, execution admission and actual start, sensitive Sophia delivery, credential resolution, external provider call, artifact/log exposure and administrative action. API ingress can establish identity and reject obvious invalid requests but cannot protect every background, replay, retry or internal path. Reads and target resolution can be PEPs before metadata is disclosed. In-process trusted calls still use owner contracts; package boundaries alone do not contain a compromised control process.

Use minimal operation-specific NEXORA contracts and references. Security facts do not justify moving `SecurityUser`, `GlobalResource`, `GlobalPolicyObject`, `UniversalPermission`, domain entities, repositories or business authorization into shared/common/core/platform/utils. Shared semantic contracts need explicit owners, consumers and compatibility/change review under ADR-002; policy-neutral transport utilities alone may be reused without domain authority. Accountable roles for final owners must be named before implementation, but this ADR does not freeze bounded contexts/packages.

### 6.6 Operation flow, trust context and TOCTOU

```text
Admitted authentication of human/workload
    → trusted identity + represented actor/delegation + scope/task/environment
    → owner-authorized resource resolution and intent/revision validation
    → compositional current decisions + required approval + provider/credential eligibility
    → scoped decision, obligations, validity/revision references
    → consequential owner PEP: revalidate applicable current state and actual use binding
        → local owner transition OR trusted credential resolution + admitted external call
    → effect evidence, denial/unknown disposition and durable recovery responsibility
```

Challenge the linear handoff: a decision and later credential lookup/start are not one atomic act. Resource resolution can itself disclose sensitive data; credentials are unnecessary for many owner operations; every downstream action may need new checks. Queue waits, secret resolution, redirect, resource revision changes and retries require current validation at their own PEP. No compulsory NEXORA bearer grant or bearer “AuthorizedOperation” is minted. Mutable policy is evaluated outside deterministic Temporal Workflow code; recorded decisions are history, not authority on replay. Temporal Signals/Updates/Activities require caller/input/target checks despite engine delivery.

Propagated context preserves authenticated sender, represented identities/delegation, scope, operation/attempt/source/task/revision, purpose/environment and policy/approval references as needed, with integrity and audience restrictions appropriate to the boundary. Network receivers authenticate channels/messages, validate intended recipient and trusted issuer/binding, reject spoofed headers or arbitrary model metadata, and check current permission. In-process context derives from trusted composition, not unvalidated request fields. No token format, mTLS or mesh is selected. A receiver may narrow context; broadening requires independent authority and explicit attribution.

Use correlation/idempotency/ownership checks to prevent duplicate or stale progress, not as authentication. Same operation identity with different semantics/scope is rejected. Current reauthorization does not make repeating an unknown effect safe; ADR-005/007/008 recovery still applies. Each retry boundary has one owner and shared budgets. `DB commit + Temporal Signal` remains non-atomic; durable required security/operation obligations use ADR-005 patterns where appropriate, without Event Sourcing or a new general broker.

### 6.7 Confused-deputy defenses

A privileged service's technical ability MUST NOT imply caller permission. Authenticate the actual caller, resolve represented/delegated context from trusted sources, authorize target lookup and canonical ownership, validate action/purpose/environment and current restrictions, select only eligible credential/principal, constrain downstream effects and retain the full chain. A service accepting arbitrary target plus its own broad token is an unauthorized proxy even when provider authentication succeeds.

| Deputy scenario | Required defense and authoritative owner |
| --- | --- |
| Agent requests another tenant's repository | Repository owner resolves trusted caller scope before sensitive lookup; reject unauthorized target, never expand to all memberships |
| Tool adapter has organization-wide GitHub token | Tool/security/credential/resource owners permit only R1/read; constrain actual API target and response, deny R2/write even if provider accepts |
| Worker can reach internal services | Execution/security enforce ADR-008 no ambient internal egress/management credentials; internal receiver also authenticates and authorizes |
| Sophia can read wider corpus | Sophia/source access enforces caller visibility before snippets/content reach model; private candidate similarity is not permission |
| Workflow invokes privileged Activity | Activity calls owner PEP with current actor/delegation/intent; workflow code/history cannot authorize service duty |
| MCP server has broader downstream rights | Admit declared effect surface; enforce per-operation target/account/delegation; reject tool if necessary constraints cannot be enforced/observed |
| Platform operator acts “for tenant” | Explicit scoped support/delegation/exception, actual operator recorded; infrastructure privilege is insufficient for tenant-data access |

Downstream trusted context propagation must not forward an upstream credential to the wrong audience or allow a remote server to substitute its broader principal silently. MCP official security guidance describes confused-deputy, audience/token-passthrough and SSRF risks [M1]; NEXORA applies equivalent ownership constraints to native/internal/CLI adapters. Authentication and a signed request can prove sender/integrity, not the correctness of resource claims or downstream effect safety. If a provider can secretly broaden effects despite the allowed operation, restrict its credential/reachability, decline that operation or require stronger review; do not pretend a prompt limits it.

### 6.8 Credential architecture and selection

Credential owner governs issuance/storage references, binding, eligibility, disclosure, rotation and revocation. Resource owner governs intended target/action; Tool/Execution adapter uses a reference only under a current authorized operation. A reference is not raw secret and not unrestricted permission to resolve it. The model may request “GitHub integration for R”; trusted policy chooses eligible account/principal/reference and adapter, never model-supplied token, authorization header, vault path or arbitrary origin.

Every credential class must identify owner/issuer, external principal, intended audience, trusted tenant/project/resource/action/purpose/environment limits, validity/freshness, issuance/rotation/revocation state, delegation restrictions, permitted storage/reference/recipient and disclosure/evidence risk. Lifetimes and mechanisms are unknown; no secret provider is chosen. Record permitted credential reference/version/principal and dispatch-time eligibility without value. Trusted authentication necessarily handles material at its adapter; raw material must not enter normal model, Tool content, conversation, event, workflow, Sophia, log or artifact contexts.

| Class | Binding/authority distinction | Lifecycle and disclosure considerations |
| --- | --- | --- |
| NEXORA service identity | Workload owner; intended internal recipient and declared duty | Narrow issuer/audience, supported expiry/rotation/revocation; never job environment |
| Organization integration | Integration owner and specific provider account/resources | Broad rights may exceed task; constrain eligibility, review exposure and suspend affected uses |
| Tenant credential | Tenant credential owner and admitted audience | No cross-tenant lookup/fallback; disable when tenant/provider policy requires |
| Project credential | Project/resource owner and permitted environment/actions | Membership alone cannot resolve secret; project deletion restricts future use |
| User-delegated OAuth | User/provider grant plus tenant organization policy | Access and refresh lifecycles separately checked; consent/grant is not action approval |
| Execution/test credential | Explicit test resource owner and job/attempt purpose | Prefer synthetic/mediated action; hostile recipient can read any delivered secret; no broad source/provider token |
| Short-lived workload credential | Trusted issuer/broker and constrained audience/action/task | Expiry reduces future exposure, not immediate external fencing or previous disclosure |
| Provider API token | External principal/issuer/account and admitted operations | Static broad tokens need strongest minimization; unavailable/revoked token never replaced by broader ambient token |
| Certificate/key material | Workload/key owner and authenticated recipient/use | Private-key custody/rotation/compromise, separate identity proof from application grant; no key/certificate generated here |

Flow: owner-authorized operation → eligible credential binding → trusted reference → current resolution/use by approved recipient → bound provider call → independent effect evidence. Recheck operation/provider/credential eligibility near resolution/disclosure/dispatch; a reference resolved during yesterday's approval wait does not remain valid indefinitely. Provider `repo:*` may technically permit all repositories while NEXORA allows only `repo:R1:read`; enforce R1/read and authorized returned data, not the token ceiling. Narrow provider issuance is defense in depth where supported. Credential access must not become a generic tool available to the model.

Prefer scoped/short-lived issuance and brokered operations where their actual provider capabilities and complexity justify them. Counterargument: issuance/refresh can fail and some providers supply only broad long-lived material. A reference alone does not narrow a powerful adapter or hostile recipient. Admit only uses whose confidentiality/effect constraints can be enforced; document residual blast radius or decline. Never fallback from unavailable secret provider to environment, developer token, another tenant or administrative credential.

Secrets are absent by default from ADR-008 jobs; control-plane environment is not inherited. Explicit authorized test delivery must assume recipient code can read/retain/encode the secret; no isolation/redaction guarantee removes that risk. Prefer mediated ADR-007 operations; if confidentiality cannot tolerate hostile recipient access, deny/redesign delivery. Minimize live adapter buffers and recipients, validate redirects/audiences and protect storage/transit under selected mechanisms later; encryption does not undo disclosure or establish authority.

### 6.9 User-delegated OAuth and service/workload identity

OAuth grant is provider authorization for a client to access agreed resources; an access token exercises provider access; a refresh token may obtain further tokens under that grant. Provider scopes/expiry/revocation and client/account binding differ from NEXORA current tenant/resource/action policy and approval. A provider-valid token is insufficient after NEXORA permission loss; a NEXORA allow is insufficient if provider rejects/revokes credentials. Disconnect, user/provider revocation and organization restrictions independently constrain use. Refresh is a governed credential operation, not permission to resurrect revoked task authority.

VERIFIED protocol facts: RFC 9700 recommends privilege restriction and discusses audience/sender constraints, redirect protection and refresh-token replay defenses [O1]. RFC 7009 explicitly recognizes revocation propagation delay and server-dependent related-token behavior [O2]. RFC 7662 supplies current token-state introspection but discusses stale-cache tradeoffs [O3]. NEXORA inference: selected OAuth integration must verify client/issuer/audience/account, consent/scope, lifecycle and replay/redirect protection against current guidance, with explicit provider-specific revocation limits. No provider, grant flow, token format or introspection mandate is selected; OAuth consent never substitutes for ADR-010 consequential approval.

Service-to-service calls require authenticated workload identity bound to intended audience, narrow duty, lifetime/rotation and current recipient policy, with integrity/channel protection and relevant anti-replay. External provider principal and originating user/Agent remain separately attributed. A certificate, cloud identity or valid signed token proves only its established identity claim; it cannot authorize every domain operation. Shared/internal network location grants nothing [Z1]. Management/control identity is separate from job code and must not be exposed through workload context/handles.

Local modular calls need trusted construction/owner checks, not fabricated token exchange per function. Separately hosted workers/provider channels need validated identities, assignments, generations and narrow control/evidence access. Short-lived identity is preferred where issuer/availability and revocation requirements support it; TTL alone cannot fence a partitioned workload. Certificates/cloud identities/signed assertions/opaque sessions are alternatives, not selected mechanisms or permission schemas.

### 6.10 Sessions, current authority and historical state

Login establishes bounded authenticated continuity. Session freshness, device/session theft response, logout, account disable, tenant removal, role changes and reauthentication/assurance requirements are policy inputs, not permanent grants. Session owner revokes affected continuity and security owners constrain future actions. Do not claim logout immediately kills every access token or external request; session and downstream credential revocation may differ.

A long-running Run/Workflow retains historical initiator/configuration, not perpetual validity of that initiating browser session. Distinguish a valid durable delegation/system mandate from the initiating interactive session. Logout may terminate interactive continuity without automatically cancelling separately authorized durable work; task/delegation policy must explicitly decide, and account/tenant/resource revocation still constrains relevant future actions. No session theft, disablement or fresh policy check is hidden by history replay. Each resumed/queued/retried operation uses its actual current authority path.

Runtime lifecycle remains `Created → Queued → Running → Waiting → Queued → Running → Finished`, with `Running → Finished` also valid. Lifecycle, wait reason, stop request, outcome and external-effect knowledge remain separate; restricting authority cannot silently rewrite launch attribution or terminal outcome. A terminal retry is a new linked Run. Mutable policy lookup is outside deterministic Workflow code; temporal history can retain decision references but not silently replay permission.

### 6.11 Revocation, fencing and in-flight limits

Revocation applies independently to human accounts, sessions, memberships, roles, delegations, approvals, credentials, providers, Agent/configuration eligibility, resource/project access and execution authority. Record scope, effective owner decision/revision, cause, targets and propagation/enforcement evidence. Relevant current denies block new operations; policy/owner changes supersede prior allows. Agent configuration revocation constrains future use while immutable Run launch revision remains recorded.

Revocation latency depends on decision caches, credential expiry/provider enforcement, offline workers, channels/partitions, polling/notification and in-flight requests. Before implementation, name which effects are fenceable, the enforcing receiver and owner-agreed maximum stale-use exposure by risk. No instantaneous or numeric latency claim is justified. A centrally committed revocation does not prove every remote PEP observed it; retain observed/unobserved enforcement and affected-operation responsibility.

| Candidate fencing mechanism | Covered boundary and limitation; none selected |
| --- | --- |
| Generations/epochs | Owner rejects stale generation at actual transition/use; cached comparison at dispatcher alone is insufficient |
| Lease/current ownership | Receiver validates live ownership; expiry does not kill process or retract remote call; clock/partition semantics must be proven |
| Credential rotation/provider revocation | May block subsequent uses if receiver recognizes revocation; old requests/tokens can remain effective during propagation/overlap |
| Resource version/precondition | Owner rejects changed target/revision, not every security change unless included in the enforced contract |
| Operation identity/idempotency | Prevents duplicate logical effect within actual target scope/horizon; not permission or complete fencing |
| Network isolation/admission suspension | Can block future reachability/starts; existing connections/accepted requests and other paths need independent coverage |

A NEXORA database fence does not fence a request already accepted by GitHub or code running on an unreachable provider. ADR-008 stop intent, attempted termination, whole-population observation, effects, outputs and cleanup remain orthogonal. Current authority is revalidated near actual start and consequential operations; worker loss cannot justify replacement/replay before reconciliation. Unknown effects block blind replay; cancellation is not rollback. Idempotency needs its actual provider/input/retention contract, never universal exactly-once assumptions.

Containment/reconciliation needs its own narrow authority and evidence: stop new affected work, request provider revocation/termination, restrict outputs/credentials/reachability, observe actual enforcement and reconcile external owners. Some already-authorized external effects are irreversible. When confirmation is impossible, preserve unknown, quarantine suspect environments and assign durable manual recovery. No token rotation, resource deletion or provider suspension is executed by this documentation task.

### 6.12 Authorization caching and degraded availability

Cached decisions are disposable optimizations, not durable grants. Cache validity must bind all relevant principal/represented workload, tenant/project/resource/action/ownership/revision, role/relationship, capability/assignment/purpose, environment, delegation chain, approval, provider/credential eligibility, policy revisions and revocation/fence generations. Exact key encoding is not selected. Missing a material dimension invalidates reuse; another tenant's matching resource name never authorizes a hit.

Revocation/current-policy barriers must invalidate or supersede affected cached allows; mere TTL cannot prove timely revocation. High-risk mutations/disclosures may require fresh authoritative evaluation. A bounded policy snapshot can be useful only if its provenance, integrity, scope, validity, applicability and current restriction coverage meet the operation's risk; a signature proves integrity, not freshness. Restored caches are not trusted without current reconciliation. Negative caching must also be bounded and cannot invent resource existence leaks or indefinitely hide newly permitted access. O3 documents the token-state caching freshness/performance tradeoff; NEXORA decisions have additional domain/delegation facts.

| Situation | Accepted behavior and authority requirement |
| --- | --- |
| Consequential mutation, secret disclosure, cross-tenant read | Deny/wait when required current authorization/obligations cannot be established; no default allow or broad credential fallback |
| Already-running operation | Outage does not prove stopped; restrict future work, propagate permitted containment, observe/reconcile and retain effect uncertainty |
| Low-risk cached read | Possible only under explicit owner-approved bounded reuse policy with valid identity/scope, data freshness and required current revocation coverage; otherwise withhold; not a generic exception for sensitive data |
| Cleanup/revocation/incident containment | Continue under independently scoped safety duty where safe, even if ordinary user-action path is unavailable; minimize irreversible actions and record durable evidence |
| IdP outage | No fabricated identity/new unauthenticated login; existing verified continuity usable only within declared assurance/validity and current restrictions |
| Secret provider outage | No substituted ambient/broader secret; already-resolved credential usable only if its current eligibility and approved lifetime remain established |
| PDP/security state outage | No guessed allow; unavailable/unknown distinct from policy rejection; persist pending responsibility and protect unrelated scopes where verified |

Cleanup cannot bypass admission to launch new hostile code, deliver extra secrets or invoke unrelated effects. An emergency access path must remain explicitly governed, including its own validation/revocation/evidence; availability cannot be solved by a hidden permanent superuser. ADR-010/011/012 resolve approval, evidence durability and security-system recovery. No availability window, cache backend or topology is fixed.

### 6.13 Provider trust, admission and trust boundaries

Provider lifecycle dimensions are distinct: discovered, configured, authenticated, admitted for purpose/control coverage, enabled for scope, per-operation authorized, currently healthy/trusted, suspended/revoked. These are not a required universal enum. Admission names accountable operator, verified identity/origin, downstream principal/effects, supported contract/version, custody/privacy/retention, security and isolation controls, revocation/fencing/status/cleanup limitations, supply chain and incident obligations. Revalidate changed inventory, versions, terms or control coverage; discovered capabilities cannot silently expand permission.

Apply to MCP/native integrations, execution providers, IdPs, secret providers and managed infrastructure. Authenticity and availability do not establish trust for sensitive source, credential issuance or hostile execution. Suspension blocks affected new operations and triggers active-operation containment/reconciliation; status evidence from a compromised provider is suspect. Independent observations may be necessary; do not declare cleanup/effect completion from an untrusted report. Provider migration/failover is a fresh admission and semantic review, not replay through a new endpoint.

The following maps thirteen required boundaries. In every row, current validation is enforced before permitted disclosure/effect; deny new affected use when required facts are unavailable, retain unknown in-flight effects, and restrict/reconcile on revocation. The table adds boundary-specific identity, authority, data and credential distinctions.

| Boundary | Identity and authority | Data trust / credential exposure | Current validation and failure/revocation owner |
| --- | --- | --- | --- |
| User/browser ↔ NEXORA | Human session + trusted scope; browser claims not membership | Input untrusted, session credentials never model content | Ingress and resource PEP; session theft/disable/revoke handled by respective owners |
| Agent/LLM ↔ trusted Runtime | Runtime-authenticated workload with Agent/Run attribution | Model intent/data cannot grant authority or receive raw credentials | Runtime + relevant owner validate intent and context; reject injection/escalation |
| Runtime ↔ domain owner | Authenticated/trusted caller plus represented chain | Narrow contracts, no private repositories/SQL | Domain resolves resource/invariants and security restrictions at actual action/read |
| Runtime ↔ Temporal | Scoped engine/workload access; workflow identity not actor | Inputs/signals/history not grants; no secrets in history | Ingress/Activities/owner PEP; replay references historical decisions, reauthorize new use |
| Runtime ↔ Sophia | Trusted caller/purpose and source scope | Retrieved content untrusted evidence; no secrets or policy from memory | Sophia/source access before snippets/model delivery; revoke suppresses future retrieval |
| Runtime ↔ Tool boundary | Trusted represented actor and current intent | Tool request/descriptor not permission; reference-only credentials | Operation/resource/security checks near dispatch; durable unknown-effect custody |
| Tool ↔ MCP/native provider | Admitted endpoint plus bound external principal | Outputs/prompts untrusted; audience-bound credentials; no token passthrough | Tool/credential/provider owners enforce scope; compromised provider blocked/reconciled |
| Control plane ↔ execution provider | Narrow authenticated management identity and assignment | Job code hostile, management identity not job secret | Execution start/readiness/current claim PEP; incident/quarantine, no host fallback |
| Execution ↔ external network | Job-scoped egress and explicit test/operation principal | Allowed endpoint can exfiltrate; secrets absent by default | Actual network/Tool owner restrictions, redirects/DNS/source binding; stop/effects separate |
| NEXORA ↔ IdP | Admitted issuer/workload and internal mapping | External claims validated, not universal role/membership truth | Identity validation/linking owner; fail without invented identity, disable affected use |
| NEXORA ↔ secret provider | Authenticated restricted resolver and eligible reference | Raw material only approved trusted recipient, no model/log | Credential owner validates scope/audience/lifetime; outage no fallback, revoke limits recorded |
| Operator ↔ production control plane | Real operator identity + declared duty/support/exception | Tenant data access distinct from infrastructure access | Admin/domain/security PEP + explicit evidence; no invisible impersonation |
| CI/build/supply chain ↔ production artifact | Admitted builder/source/release responsibility | Artifact/provenance/signature not proof code benign; build credentials restricted | Promotion/admission/version policy; vulnerable/compromised outputs suspended and incident recovery |

### 6.14 LLM, data disclosure, operator and supply-chain boundaries

LLM output is untrusted proposed content. Repository files, websites, MCP prompts/resources/results, logs, Sophia records and uploaded documents cannot authenticate, alter current security policy or confer authority by saying “approved.” Model output can request investigation or action; trusted owners validate it. Separate policy/control input from data with bounded parsing and explicit operations; prompting alone is not a security boundary. Content cannot lower ADR-008 baseline or grant network/secret access.

Reads are consequential when disclosing sensitive data. Authorize repository reads, Sophia candidates/snippets/relationship expansion, discovery, Tool output, browser/fetch, artifacts, logs, embeddings, model context and debugging/support access before exposure. Authorized read does not automatically authorize sending to another provider or recipient. Avoid unauthorized counts/existence/metadata, unsafe citation fetching and secret-bearing errors. Already delivered content cannot be retroactively un-read; suppress future delivery/derived retrieval, discard queued context where possible, govern provider-copy cleanup and report limits.

External model, embedding, reranking or other provider transmission is a disclosure operation. Validate current purpose, trusted tenant/project/resource scope, classification, permitted recipients/provider/account/admission, consent or approval where required, retention/training/residency/privacy eligibility and actual payload before send. Changed provider terms/admission pause affected new disclosure until reviewed; no automatic provider fallback to preserve model availability. No AI/DLP provider, classification taxonomy or legal guarantee is selected.

Operators have separately scoped platform operations, infrastructure administration, tenant support, incident response and data repair duties. Infrastructure control can physically expose data despite application rules; least privilege, segregation, independent review and evidence must address that residual risk under actual deployment. Application authority does not automatically follow root/cloud privilege. Tenant support/impersonation requires explicit context, real operator attribution and authorized data/action scope. An `admin` label cannot silently override resource invariants or current incident denies.

Break-glass is exceptional, explicit, reason/incident-bound, minimal, time/operation bounded, attributable, independently reviewable, visible through permitted evidence and revocable. Agents cannot grant or invoke emergency privilege to themselves. Approval routing, reviewers/quorum, UX, expiration values and escalation mechanics remain ADR-010. Security-infrastructure outage does not justify a hidden unrestricted path; define and validate a narrow independently governed emergency mechanism before use, or declare unavailable. Post-use review cannot retroactively make an unauthorized action authorized.

Trusted NEXORA infrastructure supply chain includes source/build dependencies, base images, binaries/packages, CI Actions/components, SDKs, MCP servers, sandbox runtime and deployment artifacts. Their compromise can exercise platform authority; project dependencies remain hostile execution inputs under ADR-008 even if pinned/scanned. Trusted infrastructure requires accountable dependency/release ownership, admitted sources/versions, integrity against trusted expectations, provenance adequate to risk, least-privilege build/promotion access, supported-version/vulnerability response, controlled promotion and rollback/revocation. A checksum/signature proves only its defined integrity/origin property, not absence of malicious behavior. SLSA organizes source/build and provenance requirements [S1] as an evidence framework example; no level/tool/attestation format is adopted.

Incident handling retains orthogonal principal/session/membership/delegation/approval/credential/provider/resource/job restrictions, evidence trust and effect uncertainty; do not invent one “secure/compromised” enum for everything. Freeze affected access, suspend provider/new artifact use, quarantine suspect execution, preserve permitted evidence and reconcile external effects through owners. Incident actions have narrow current authority and durable custody; no history rewriting or blind rollback to a vulnerable/revoked artifact.

### 6.15 Security evidence

Required permitted evidence: authentication issuer/method/assurance and mapped principal; actual caller/initiator/delegator/effective workload/represented chain; Agent/Run/task/workflow/operation/job/attempt; trusted tenant/project/resource/action/revision/purpose/environment; relevant policy and relationship revisions; decision/reason/obligations/validity and approval reference; credential reference/version/external principal/audience without value; admitted provider/contract/version; PEP and actual enforcement observation; revocation/fence versions and acknowledgement versus enforcement; dispatch/acceptance/effects/reconciliation; restricted operator/incident/correction links. Minimize content and retain reconstruction limits where payloads cannot be stored.

Do not log raw secrets, access/refresh tokens, private keys, unnecessary sensitive data or private chain-of-thought. Denied requests and failed authorization must be explainable without disclosing other tenants' resource existence. Evidence access is itself authorized and tenant-scoped. Security records can establish a security fact under their owner contract; they do not become authorization tokens, canonical Sophia policy, universal business truth or complete audit merely because a log exists.

ADR-011 owns storage/integrity/retention/alerting and reconstruction, not this document. If a consequential operation requires durable security evidence and required custody cannot be established, block that operation rather than silently drop evidence. Scoped incident containment must retain recovery responsibility when telemetry is degraded, using a separately reviewed emergency evidence path, not leak tokens into ordinary logs. Required asynchronous security obligations follow ADR-005 semantics; no broker, Event Sourcing, schema or backend is introduced.

### 6.16 Accepted security invariants

1. Authentication is not authorization.
2. Identity is not authority.
3. Agent identity/configuration is not authority.
4. Capability is not permission.
5. Role membership alone is not unconditional permission.
6. Credential possession is not NEXORA authorization.
7. Provider credential scope is a ceiling/capability, not the complete NEXORA policy.
8. Approval is not permanent authorization.
9. Workflow Definition/history is not authority.
10. Event/message possession is not authority.
11. Memory/retrieved content is not authority.
12. Sandbox isolation is not authorization.
13. Network reachability is not permission.
14. Provider authentication/registration is not purpose-specific trust.
15. Provider admission is distinct from per-operation authorization.
16. Resource identifiers supplied by Agents/providers are claims until authoritative resolution.
17. Tenant/project/resource scope is validated at authoritative boundaries.
18. Cross-tenant access is denied absent explicit owner-governed relationship.
19. A privileged service's technical ability does not imply caller permission.
20. Consequential operations require current trusted authorization near enforcement.
21. Mutable security state cannot be frozen forever in a Workflow, Run, event or queue item.
22. Historical attribution remains immutable even when future authority is revoked.
23. Delegated authority is bounded and attributable.
24. Delegation cannot silently expand authority.
25. Re-delegation requires explicit policy; it is not implied.
26. Impersonation is exceptional and distinct from ordinary delegation.
27. Raw credentials/secrets are not selected or exposed to Agents/LLMs.
28. Credential selection/resolution is a trusted attributable operation.
29. Credential eligibility is checked against tenant/resource/action/environment/purpose.
30. Control-plane credentials are not ambient execution/job state.
31. Security decisions use authoritative resource identity, not model-supplied paths/URLs/names alone.
32. Authorization and actual resource use must address relevant TOCTOU/revision changes.
33. Reads/disclosures require authorization, not only mutations.
34. Model context exposure is a disclosure boundary.
35. External AI/provider transmission is an explicitly governed disclosure.
36. Prompt/retrieval/tool/repository content cannot elevate authority.
37. Authorization caches are disposable optimization, not durable authority.
38. Relevant revocation/policy revision must invalidate or supersede stale cached decisions.
39. Revocation is not retroactive rollback.
40. Revocation request does not prove all previously issued authority is unusable.
41. Fencing stale authority is distinct from recording revocation.
42. Unknown in-flight external effects remain unknown until authoritative reconciliation.
43. Security service failure does not default to allow for consequential operations.
44. Identity-provider failure does not fabricate identity.
45. Secret-provider failure does not substitute broader/ambient credentials.
46. Provider compromise/suspension blocks new affected operations and triggers reconciliation/containment.
47. Tenant suspension/restriction can constrain future work without rewriting history.
48. Operator infrastructure privilege does not automatically grant tenant application/data authority.
49. Tenant impersonation/support access is explicit and attributable.
50. Break-glass authority is exceptional, bounded and reviewable.
51. Agents cannot invoke break-glass on themselves.
52. Security policy and domain invariants retain explicit owners.
53. A central PDP/enforcement mechanism does not become universal owner of domain semantics.
54. Enforcement occurs at consequential owner boundaries, not only API ingress.
55. Service/workload identity is audience/scope constrained and not universal internal trust.
56. Internal network location is not authentication or authorization.
57. Security context propagated between services is integrity-protected and cannot be broadened by the receiver without authority.
58. Correlation IDs, Run IDs, Workflow IDs, Job IDs and Operation IDs are not authorization tokens.
59. Supply-chain trust for NEXORA infrastructure is distinct from sandboxing hostile project dependencies.
60. Trusted infrastructure artifacts require attributable source/version/provenance appropriate to risk.
61. A vulnerable/revoked trusted dependency/provider version can be denied for future use without rewriting past evidence.
62. Security evidence excludes raw secrets/private keys/tokens/private chain-of-thought.
63. Security evidence does not itself grant authority.
64. Security infrastructure MUST NOT become an implicit Shared Kernel or universal business authority.
65. Current deny/revocation/fence constraints cannot be bypassed merely by an older allow/approval.
66. A lower-trust principal cannot cause a more privileged deputy to exercise unrelated authority on its behalf.
67. Authorization must be evaluated against the effective actor/delegation context, not only the dispatching service identity.
68. Tenant isolation applies consistently to data, memory, tools, credentials, execution, caches, sessions and evidence.
69. Security-sensitive changes are attributable and subject to current authorization/approval as appropriate.
70. Unknown security/effect state is represented honestly rather than converted to allow/success.
71. An allow with obligations that the actual PEP cannot enforce does not authorize dispatch or disclosure.
72. Independent service safety duties cannot be silently unioned into a delegated caller's authority or used to evade revocation.
73. Logout/session continuity and durable delegation have distinct validity; neither implicitly preserves revoked account, scope or resource authority.
74. ADR-008's stronger hostile-code isolation requirement remains binding; security authorization cannot downgrade it, and secret delivery to hostile code cannot guarantee secrecy from that recipient.

The owner's seventy candidate invariants are retained, with four explicit refinements for enforceable obligations, service-duty separation, session/delegation distinction and ADR-008 preservation. These are Accepted architectural obligations, not implemented protections or verified security guarantees.

## 7. Alternatives Analysis

Comparisons are NEXORA architectural inferences against the owner scenarios, not product maturity, benchmark or cost rankings. Mechanisms can combine; selecting compositional semantics does not select physical PDP topology.

### Authorization semantics and placement

| Alternative | Benefit | Limits for NEXORA / proposed disposition |
| --- | --- | --- |
| Pure RBAC | Understandable scoped eligibility and administration for stable duties | Role explosion for context/resources; admin bypass and stale membership risks; use roles as one input, not sole policy |
| ABAC/contextual | Express purpose, environment, sensitivity, revision and current conditions | Trust/freshness of attributes and rule conflicts need ownership; useful input, no universal attribute schema |
| Relationship-based | Express membership, ownership, sharing and delegation edges | Graph freshness, cycles and cross-tenant semantics; cannot alone handle source preconditions/provider trust; no graph product |
| Central policy service | Consistent security restrictions, revision/evidence interfaces | Availability/latency dependency, stale caches and universal-domain risk; viable evaluation mechanism only with owned rules |
| Domain-owner-local | Authoritative resources/invariants near transitions; simpler local consistency | Inconsistent security restrictions and missed common revocation paths if uncoordinated; retain ownership with common constraints |
| Hybrid/compositional | Fits independent owners, current constraints and actual PEPs | More contract/freshness/decision composition work; recommended semantics, avoid building generic IAM framework |

The expected hypothesis is supported because no single role, relation or provider scope captures current source, delegated authority, approval, disclosure and isolation together. Challenge: coordinating multiple owners can add failure/latency and difficult policy debugging. Start future authorized work with a few meaningful resource actions and narrow public checks; centralize common evaluation only when semantics and evidence justify it. Do not build a policy DSL or universal permission inventory in advance.

### Policy availability and distribution

| Placement | Freshness, consistency and revocation | Availability, latency and operational/ownership tradeoff |
| --- | --- | --- |
| Local evaluation | Can enforce authoritative local resource transition; needs current common restriction/relationship state | Fewer remote calls, but rule distribution/version skew and security ownership contracts remain |
| Central decision service | Can converge current security decisions; remote owner facts still need suitable consistency | Adds network/critical dependency and capacity/HA; centralized evaluation must not take over domain meaning |
| Hybrid | Common identity/restrictions plus owner-local invariants; explicit revision/validity composition | Reduces universal model pressure, but coordinating freshness and outages needs deliberate contracts |
| Signed/bounded snapshots | Useful for verified scoped offline/low-risk evaluation, not proof current revocation was observed | Can reduce call load, but partitioned stale allows must expire/be superseded; risk-specific reuse gates and clocks required |

Recommendation chooses ownership/composition, not “central always” or “local always.” A monolith can begin with trusted in-process application contracts; justified extracted workers may need authenticated remote evaluation or bounded local state. Strong revocation needs a current receiver-enforced barrier or refusal when it cannot be established. Do not invent consistency, cache TTL, latency or offline windows to make availability look solved.

### Identity alternatives

| Alternative | Potential fit | Required limits / why not selected now |
| --- | --- | --- |
| Application-managed identity | Owned lifecycle with fewer external dependencies | Password/authenticator/recovery, abuse, assurance and operations all become NEXORA duties; no evidence justifies building full identity platform |
| External OIDC identity provider | Standard authentication/claims can externalize credential/login operations [I1] | Account linking, admitted issuer, assurance, outages and current memberships remain local obligations; provider undecided |
| Cloud/workload identity | Fits selected cloud's workload issuance and infrastructure rights | Audience, platform coupling, off-cloud/local behavior and application policy still need review; no cloud IAM selection |
| Certificate-based workload identity | Can authenticate channels/workloads without exposing human credentials | Issuance/key custody/rotation/revocation and application authorization remain work; no mTLS/mesh/certificate mechanism selected |
| Delegated provider identity | Appropriate external attribution for user-granted integration | Not universal NEXORA login or permission; consent/scope/refresh/revocation and tenant binding differ by provider |

Prefer stable NEXORA identity mapping and narrow adapters over embedding provider types/IDs as every domain's principal model. Actual human/workload mechanisms need assurance, platform, federation, recovery and staffing requirements before adoption.

### Secret and credential alternatives

| Alternative | Potential value | Risks / proposed direction |
| --- | --- | --- |
| Encrypted application database | Local transaction/reference bookkeeping and inspectable ownership | Encryption/key custody, broad DB access, backup exposure, rotation and resolver privilege; not chosen merely because Sophia uses PostgreSQL |
| Dedicated secret manager | Specialized custody, issuance/access controls and lifecycle | Extra availability/operations; does not enforce every business action or erase recipient exposure |
| Cloud secret manager | Managed custody integrated with a deliberate cloud choice | Cloud/IAM coupling, residency, quotas and cross-platform/local access; provider not selected |
| External vault | Existing enterprise custody may reduce duplication | External ownership/availability/protocol and delegated access need review; no Vault product adoption |
| Short-lived brokered credentials/operations | Narrow scope/lifetime, possible withholding of raw secrets from jobs | Issuance outages/privileged broker and provider limits; stale in-flight use remains; preferred where demonstrated feasible |
| Provider-native delegated OAuth | Consent and provider user/account scope | Refresh custody, provider rights broader than NEXORA and revocation limits; appropriate per admitted integration, not universal credential scheme |

References/scoped resolution are the architectural preference. A short-lived token is still a secret and may be broad; a long-lived integration can be acceptable only after explicit risk/ownership/eligibility review, not convenience. Credential migration must preserve ownership/revocation semantics and avoid double active broad access.

### Supply-chain alternatives

| Evidence/control | Value | Limit / proposed treatment |
| --- | --- | --- |
| Version pinning only | Attributable selected release, prevents silent version drift | Can pin malicious/vulnerable code; necessary where relevant but insufficient alone |
| Integrity/checksum verification | Detects substitution against trusted expected representation | Self-supplied checksum proves nothing about source or benignness |
| Provenance/attestation | Relates artifact to source/builder/inputs under verified trust [S1] | Claim verification/trusted builder required; cannot prove code has no vulnerability |
| Artifact signing | Establishes authenticated signer/integrity under chosen trust policy | Stolen key or malicious authorized signer remains possible; no signing product chosen |
| SBOM/vulnerability scanning | Inventory/known issue response and exposure investigation | Incomplete inventory/detection, unknown vulnerabilities and false findings; no format/scanner selected |
| Controlled promotion | Owned review/validation of exact artifact, environment and rollback eligibility | Adds release work and custody; compromised builder/reviewer still residual risk |

Combine risk-appropriate attributable source, version/integrity, provenance, review and controlled promotion for trusted infrastructure. Concrete standards/levels/tooling require a separately reviewed implementation decision. Project artifact success, provider registration or package name cannot promote hostile code into trusted platform infrastructure.

## 8. Consequences

### Positive

Current authority remains distinct from identity, credentials and historical coordination. Owner PEPs contain deputies and preserve domain semantics. Bounded delegation and independently attributed service duties prevent accidental privilege union. Scope and disclosure checks cover retrieval/models as well as writes. Revocation/fencing/effects have honest evidence and recovery ownership. Provider-independent contracts preserve replacement options.

### Negative

NEXORA must define identity/membership mappings, owner action contracts, policy revisions, credential eligibility, current validation and evidence custody. Some operations must wait/deny during security outages. Revocation across providers is not atomic; integration-specific fencing and reconciliation add work. Operator/supply-chain governance and verified emergency recovery need staffing. Narrow credentials may not be supported by every provider; some workloads will be refused or redesigned.

### Risks

A central PDP can become a universal Shared Kernel or critical bottleneck; local policies can drift. Valid tokens and trusted services can conceal deputy escalation. Cached/signed context can retain revoked authority. Poor delegation binding can union tenants or service privileges. Compromised providers/builders/operators can forge evidence or disclose data. Prompt-only defenses cannot enforce authority. Documentation does not mitigate these risks in a running system; controls remain unimplemented and unverified.

## 9. Security Considerations

Protected assets are human/workload identity, tenant source/data, credentials, policy/delegation/approval state, control-plane/domain authority, execution boundary and recovery/security evidence. Threat actors include hostile model/repository/web content, compromised providers/workloads/CI, stolen sessions/tokens, cross-tenant callers and privileged operators. Authentication, tenancy, current authority, secret custody, input validation, SSRF, injection/path traversal, sandbox escape, supply chain and evidence poisoning must be verified at their actual boundary before affected features.

ADR-008 is preserved: hostile repository/dependency/generated code executes outside control-plane, Runtime, Temporal and Sophia processes with admitted stronger-than-ordinary-container isolation, bounded process trees/files/network/resources/output/cleanup and no ambient control-plane secrets. Security contracts do not move code into trusted processes or select a weaker runtime. Tool/Execution grants do not allow escape, broad egress, raw token delivery or privileged host/network access by implication.

Residual limits: a compromised trusted control process can access privileges it holds despite package rules; a permitted recipient can retain disclosed data; a secret intentionally delivered to hostile code is readable; an allowed endpoint can leak content; credential revocation cannot undo accepted mutations; signed evidence can originate from a compromised signer; infrastructure administrators can bypass application boundaries physically. Threat/compliance evidence may require stronger account/process/host separation before use, through ADR-002/012 review. No claim of universal exactly-once, instantaneous revocation, complete confidentiality or production security is made.

## 10. Operational Considerations

### Failure walkthroughs A–AZ

All fifty-two rows require the baseline evidence in section 6.15: real initiator/delegator/effective workload and Agent/Run/task/workflow/operation/job references where applicable, trusted scope/action/resource/revision, current decisions/approval and credential-reference/provider identity without values, PEP observation, revocation/fence state and effect/recovery disposition. Historical attribution is retained in every row. If no credential is needed, do not invent one. Each row names owner and identity interpretation, current authorization/credential behavior, revocation/fencing/effect response and scenario-specific evidence plus unresolved implementation question.

| Scenario | Authoritative owner and identity/delegation interpretation | Current authorization and credential behavior | Revocation/fencing, expected effects and recovery | Additional evidence / unresolved question |
| --- | --- | --- | --- | --- |
| A — Project removal during active Run | Membership/resource/security owners; initiator retained, affected delegation current validity lost | Deny new project effects/disclosure; stop selecting affected credential despite active Run | Constrain/stop future work, request owned job stop; earlier effects retained/unknown until reconciled | Removal revision, blocked PEPs/job observations; membership propagation/fence contract open |
| B — User disabled during approval wait | Identity/security + Approval/Workflow; historical human remains initiator | Approval arrival cannot restore disabled actor authority; no credential dispatch | Durable wait resolves denied/stopped per coordination; retain approval and disable facts separately | Disable/current decision/approval refs; notification and wait disposition protocol open |
| C — Role changes after queueing | Role/security/domain owners; queued workload acts for currently eligible subject | Reevaluate at dispatch, deny lost action; previously selected token does not authorize | Invalidate stale allow; no effect if prevented before send, otherwise reconcile ambiguity | Old/current role and dispatch evidence; queue-to-use consistency open |
| D — Another tenant's repository | Repository/security owners; Agent identity is proposal attribution | Trusted resource resolution denies caller scope; no broader tenant token or metadata | Prevent unauthorized read/write; contain incident if exposure occurred | Claimed/resolved scope and redacted denial; owner lookup isolation mechanism open |
| E — Adapter credential broader than caller | Tool/credential/resource/security owners; service deputy plus represented caller | Enforce caller's narrow action/target despite broad token; restrict response | Block unrelated uses, suspend unsafe adapter if constraints unenforceable; prior effects independent | External token ceiling versus NEXORA scope; provider narrowing capability open |
| F — New MCP admin tool | Provider/Tool admission + security; server not Agent authority | Keep unadmitted capability unavailable, no auto-added role or credential rights | Discovery changes do not grant permission; suspend incompatible mapping | Inventory/contract diff and admission evidence; review/SDK/version mechanism open |
| G — Valid OAuth, NEXORA revoked | Security/delegation/resource owners; external grant distinct from internal subject | Deny dispatch and refresh-for-task use despite provider-valid access token | Fence applicable owner paths; provider grant may remain but cannot authorize this task | NEXORA revocation/grant refs; integration disconnect versus grant retention policy open |
| H — NEXORA allows, provider revoked | Credential/provider/Tool owners; external principal unable to exercise access | Block known revoked credential; provider denial explicit, no administrative fallback | If already sent, denial is not universal proof no effect; reconcile target | Eligibility/provider response/dispatch timing; revocation status lookup coverage open |
| I — Token expires during operation | Credential/Tool/provider owners; expiry does not change historical actor | New calls require eligible credential/current permission; refresh only under valid grant | Do not repeat mutation on generic auth error after possible acceptance; unknown preserved | Expiry/attempt/provider effect status; provider idempotency/status semantics open |
| J — Refresh revoked during long wait | Credential/grant + Workflow; historical user grant not perpetual authority | Resume must verify live grant/current policy; re-consent only through governed path | Deny new call, wait/fail visibly; no replacement account silently selected | Grant failure/wait/approval refs; renewal and user interaction mechanics open |
| K — LLM supplies scope IDs | Domain/security owners; authenticated workload separate from untrusted claims | Resolve trusted assignment/ownership; reject ambiguous/unbound claims before disclosure | No effect authorized by ID possession; retain restricted denial | Claimed versus trusted bindings; canonical resolver/access contract open |
| L — Cross-tenant Sophia query | Sophia/source/security; query text cannot change caller scope | Enforce before candidate/snippet/model exposure; no token granting corpus-wide read | Deny foreign results, invalidate leaked cache/projection path and contain | Retrieval scope/source revisions; index/data-layer enforcement and side-channel controls open |
| M — Activity reattempt after policy change | Domain/Tool/Runtime/security; Workflow/Activity IDs are correlations | New execution attempt checks current actor/policy; historical result is not allow | Replay of recorded Workflow result alone creates no new effect; actual Activity retry reconnects safely | History/attempt/current decisions; SDK mapping and effect contract open |
| N — Event replay after permission loss | Consumer/domain/security; producer/correlation not current authority | Replayed command/consequential reaction revalidates applicable authority; no stale token payload | Safe projection use separately authorized; deny unsafe effect, preserve message custody | Replay purpose/consumer disposition; live versus backfill routing open |
| O — Stale worker reconnects | Execution/security/claim owner; authenticated worker lacks current assignment | Reject stale claim/generation before start/control transitions; no inherited credential reuse | Observe old attempt first; local fence does not prove prior remote effects absent | Claim/generation/population refs; receiver-enforced fencing primitive open |
| P — Partitioned worker after revocation | Execution/security/credential/provider; workload identity persists, authority restricted | No new privileged actions without valid current control; admission requires independent bounded-loss policy | Request isolation/credential/provider fences; cannot claim instant death; no replacement until reconciliation | Last trusted observation/revocation attempts; offline stop/egress/provider guarantees open |
| Q — Agent selects raw token | Credential/Tool/security; model request is intent only | Reject raw selection, resolve only eligible controlled reference for authorized operation | No model exposure; incident if value leaked, restrict/revoke under owner process | Denied intent/reference access; resolver interface and leak prevention open |
| R — Tool-output privilege injection | Runtime/Tool/security; provider content not delegator | Treat output as data, independently validate any follow-up; no expanded credential | Reject elevation, preserve original operation effects separately | Output provenance/blocked request; parser/content isolation controls open |
| S — Repository disables restrictions | Execution/security/source owner; file has no administrative authority | Ignore proposed downgrade; enforce ADR-008 baseline/no default egress | Deny unsafe start/change; stop/contain violation, no host fallback | Source/policy/control-readiness refs; actual enforcement conformance open |
| T — Authenticated MCP compromised | Provider/security/Tool; endpoint identity not trusted behavior | Suspend affected use/credential resolution; outputs and status suspect | Contain, revoke applicable access, reconcile independently; no blind failover/retry | Incident/last admitted version/operations; compromise detection and independent evidence open |
| U — Suspect execution cleanup report | Execution/security; reporting provider's evidence trust downgraded | Do not authorize reuse/output from assertion alone; restrict further credentials | Quarantine, independently observe/destroy under authorized custody; cleanup unknown until adequate evidence | Suspect report/incident/quarantine; independent teardown proof mechanism open |
| V — Organization GitHub token for R1 | Resource/Tool/credential; external app distinct from initiating caller | Enforce R1 allowed action/revision and returned data, not repo-wide permission | Reject R2/extra effects; broad credential residual risk reviewed, no token to repository code | Bound external account/repo/action; narrow issuance/adapter control support open |
| W — Multi-tenant user, ambiguous resource | Membership/resource owners; one human has separate scoped relationships | Require explicit validated active scope/owner resolution; no union or search-based selection | No sensitive result until bound; deny ambiguity without other-tenant details | Scope selection/owner binding; organization/tenant cardinality and UX open |
| X — Wrong-tenant cached allow | Security/cache/resource owners; caller identity cannot be replaced by cached subject | Reject cache mismatch before read/action; re-evaluate correct scope, no wrong credential | Invalidate/quarantine faulty cache generation and assess exposure | Cache dimensions/current decision; cache key/isolation implementation open |
| Y — Cache survives revocation | Security/policy/cache + PEP; old subject/policy result is historical | Current restriction barrier supersedes allow; high-risk fresh check where required | Deny stale use; partition unable to establish required freshness blocks dispatch | Old/new revisions/invalidation observations; freshness/propagation target open |
| Z — Support needs tenant data | Operator/security/domain owners; real operator distinct from tenant user | Explicit purpose/scope/support authority and approval as required; eligible support path, not tenant token theft | Minimal bounded access, evidence/revocation; already disclosed data cannot be un-read | Ticket/reason/operator/resource decision; support approval/read policy open |
| AA — Invisible impersonation | Operator/security/session owners; actual caller must remain visible | Reject hidden identity replacement; no arbitrary tenant session/cookie | Block, investigate any completed access; retain real operator attribution | Attempted represented identity/denial; impersonation controls/approval open |
| AB — Incident break-glass | Security/emergency/domain owners; independently authorized operator, never self-granted Agent | Validate explicit emergency duty, scope/validity and approved exception; narrow credential | Enforce bounds/revoke, independent review; effects still attributable, not automatic rollback | Incident/reason/exception/PEP evidence; ADR-010 emergency mechanics open |
| AC — Tenant suspended with active work | Tenant/security + Runtime/Workflow/Execution; original delegation retained historically | Block affected future business effects/disclosures and credential uses | Safe separately authorized containment continues; stop attempts/effects tracked separately | Tenant restriction and active jobs; scope of suspension/cleanup recovery target open |
| AD — Project revoked after retrieval | Resource/Sophia/Runtime/security; prior context not new authority | Suppress future retrieval/provider send; discard pending context where feasible; no new credential use | Prior model exposure cannot be erased; constrain actions, propagate derivative/cache suppression | Source/revocation/delivered context refs; provider cleanup and context invalidation open |
| AE — AI provider loses admission | Disclosure/provider/security owners; model endpoint not automatically trusted | Deny new sensitive prompts/embeddings/transfers; no unapproved fallback account | Restrict queued sends, assess in-flight disclosure and owner-governed deletion | Provider/data eligibility/dispatch refs; privacy/residency/deletion contract open |
| AF — Retention/training terms change | Provider admission/data-policy owner; previous consent not perpetual purpose trust | Pause affected disclosure pending reviewed eligibility; credentials cannot override | Reconcile already-transmitted data/provider obligations; no secrecy/erasure promise | Old/new terms/review and transmission refs; change detection/legal classification open |
| AG — Secret enters model context | Credential/security/disclosure owner; model has no custody authority | Stop further exposure, withhold contaminated output, restrict resolution; no repeated secret logging | Incident, authorized rotation/revocation and provider cleanup; already exposed value treated compromised as policy requires | Redacted exposure/recipient/version refs; detection/provider-copy guarantees open |
| AH — Rotation with old call in flight | Credential/Tool/provider; external principal/credential version separately attributed | New use requires eligible version/current policy; do not replay using replacement token blindly | Rotation may not fence accepted call; reconcile old effect, track overlap and provider acknowledgement | Old/new references/dispatch timeline; provider revocation/overlap contract open |
| AI — PDP unavailable | Security/domain/PEP; caller cannot invent decision | Deny/wait consequential use; narrow documented low-risk reuse only if required current coverage valid | Already-running effects unknown; safe own-duty containment/recovery continues | Unavailable versus deny and pending custody; PDP distribution/HA/bounded reuse open |
| AJ — IdP unavailable | Identity/session owner; no fabricated new principal | No new unverifiable authentication; existing validated continuity only under declared current constraints | Account/session revocation still enforced where established; unavailable facts cannot authorize escalation | Session/issuer validity/error; assurance, federation and offline continuity open |
| AK — Secret provider unavailable | Credential/adapter owner; reference still not raw authority | Block unresolved required secret; no environment/developer/broader fallback | Earlier resolved use only if current eligible policy allows; in-flight effects separately reconciled | Resolution failure/version eligibility; custody availability and permitted live-buffer lifetime open |
| AL — Stale provider admission | Provider/security/Tool/Execution; endpoint authentication insufficient | Revalidate required purpose/control/version coverage; reject unknown critical admission | Suspend affected new use, observe existing operations without trusting stale attestations blindly | Admission/version/freshness refs; review cadence/control-change detection open |
| AM — Domain/security disagree | Domain + security owners; neither caller nor PDP replaces other owner | Required conjunction denies if either authoritative constraint disallows; no credential dispatch | Surface conflict/review; no silent latest-allow precedence or invariant bypass | Both decisions/revisions/reasons; owner escalation and fact-consistency protocol open |
| AN — Deny versus role allow | Security/role/domain owners; admin role not universal principal privilege | Applicable current deny wins; old approval/token cannot override | Fence affected PEPs, retain denial/effect evidence if any prior send | Deny scope/role/context; exception governance/policy conflict semantics open |
| AO — Privileged service for weak caller | Service-duty/domain/security owners; delegated caller and own workload authority separate | Require caller permission for user action plus service right; no privilege union | Unrelated platform mutation denied; safety cleanup only under distinct owned mandate | Represented chain/service duty/action; least-privilege deputy contract open |
| AP — Agent re-delegates | Delegation/security/task owner; configured Agent cannot grant itself permissions | Re-delegation explicit, attenuated and current upstream valid; deny by default | Revoke dependent chains, no credential copying; prior effects remain historical | Chain/scope/depth/mandate refs; depth limits and atomic chain validation open |
| AQ — Delegation crosses tenants | Delegation/resource/security owners; no authority from named tenant alone | Require explicit source/destination owner sharing and allowed onward action; otherwise deny | Constrain credentials/audiences at every hop; revoke affected relationship prevents future use | Both scopes/relationship/chain refs; legitimate cross-org sharing model open |
| AR — Approval valid, actor revoked | Security/delegation + Approval; approval not replacement principal | Deny affected operation despite valid human approval; no token resolution | Prior approval stays historical; fresh authority/new valid intent required to proceed | Approval and revocation refs; ADR-010 binding/consumption/review mechanics open |
| AS — Resource revision/owner changes | Resource/security/approval/Tool owners; canonical target now different | Revalidate and enforce actual use precondition; reject stale source H/ownership, not silently H2 | No effect if target rejects; if dispatched without adequate evidence retain unknown and reconcile | Reviewed/current revision/conditional receipt; target precondition/atomicity support open |
| AT — Sensitive read-only operation | Resource/disclosure/security owners; “read-only” not harmless | Authorize sensitive content and recipient/purpose before exposure, select narrow read credential | Deny unauthorized disclosure; prior delivered data cannot be rolled back | Data classification/recipient/decision; read risk/approval and output masking policy open |
| AU — Foreign browser cookie reused | Browser/Execution/credential/security; session external principal differs from job | Reject wrong-scope profile/account before navigation/disclosure; no borrowed credential | Quarantine state, contain possible access, verify clean reset before reuse | Profile origin/job scope/incident refs without cookie; browser isolation/reset implementation open |
| AV — Malicious CI dependency artifact | Release/supply-chain/security; authenticated builder not proof artifact benign | Suspend suspect trusted artifact promotion/use, restrict build/release credentials | Contain fleet/artifact lineage, reconcile possible platform exposure; rollback only to still-admitted release | Source/build/provenance/promotion refs; integrity/attestation review and recovery controls open |
| AW — Vulnerable SDK version | Provider/supply-chain/security + owning adapter | Restrict affected version/operations by exposure, no silent policy-weaker fallback | Patch/re-admit under reviewed compatibility, reconcile active operations; historical version unchanged | Advisory/installed version/affected use refs; supported-version/upgrade response targets open |
| AX — Token in evidence/log | Evidence/credential/security owners; evidence reader is separate principal | Withhold/restrict affected evidence and stop leak; sanitized usable correlation, no raw copies | Incident and authorized revocation; controlled purge/correction with privacy/history limits | Redacted credential reference/location/recipient refs; ADR-011 sanitation/custody/retention open |
| AY — Immediate provider suspension, in-flight | Provider/security/Tool/Execution; suspended principal may still execute remotely | Block new dispatch/resolution; propagate stop/fences where supported | Request urgency does not prove instantaneous enforcement; unknown effects retained, independent reconciliation | Suspension/acknowledgement/observed fences/operations; provider in-flight fence guarantees open |
| AZ — Remote mutation accepted before revoke | External resource/Tool/security; valid historical dispatch actor retained | No new affected operations; any compensation needs current independent authority | Accepted effect may complete despite revoke; reconcile performed/partial/unknown, no retroactive rollback | Acceptance/remote status/revocation timeline; provider completion/cancel/compensation contract open |

### Operational validation and recovery

Bound authentication/authorization lookup cost, context/delegation size/depth, provider resolution, caches, fan-out, queued requests and denial/incident/reconciliation backlog. Reserve resources for revocation/containment/recovery, rather than allowing malicious tenants or outage retries to exhaust the security path. Workload/quota/fairness and numeric limits remain unknown. No generic infinite retry or permission-denial retry is implied.

Owner policy changes need attributable revision, trusted publication/activation, compatibility and current validation. Event-driven invalidation can reduce lag, but notification loss cannot be the only safety mechanism; required current barriers or bounded explicitly permitted reuse must cover it. Restore must apply current restrictions/deletion/provider state and reconcile already-performed effects before serving decisions or resuming work. Restoring an old policy/cache/credential checkpoint must not resurrect revoked authority. No global atomic transaction across owners/providers/Temporal is assumed.

Future separately authorized verification must exercise A–AZ, all PEP entry paths, tenant scope on snippets/logs/credentials/browser caches, deputy escalation, delegated/own-duty separation, account linking, replay/cache/queue revocation races, actual source/resource preconditions, partitioned fencing, provider compromise, outages and emergency duties, secret leaks and incident evidence, supply-chain admission and restore. Verify denial before actual disclosure/effect, not merely a mocked PDP return; measure propagation/latency/cost under realistic permitted workloads against owner-agreed budgets. No security implementation, provider connection, credential issuance, fault injection, build, application test or benchmark was run here.

## 11. Evolution / Exit Strategy

```text
Domain / Runtime / Tool / Execution / Sophia owners
    → narrow NEXORA-owned security contracts and references
Identity / Policy / Credential infrastructure adapters
    → depend inward on those contracts
    → replaceable admitted providers/mechanisms
```

This is interaction/dependency intent, not three required services or final package structure. Start later authorized implementation with a representative owned operation and the smallest validated identity/context, owner PEP and credential path; do not pre-build every role, graph, plugin, policy language or IAM service. Expand only for demonstrated resource/relationship, security, availability or operational needs.

Provider-specific IDs, tokens and SDK types remain adapter metadata where feasible. Migration of IdP, policy mechanism, secret provider or integration must preserve or explicitly remap stable internal principals, tenant/project/resource relationships, delegation, authorization meaning, credential ownership, revocation state, historical attribution and security evidence. Account mapping cannot merge people because emails match; policy translation cannot broaden allows; secret transfer cannot reenable revoked references. Review and demonstrate old/new enforcement compatibility and current restriction coverage before cutover.

Prefer governed coexistence/draining, reconcile in-flight effects under their original recorded provider, and route new work only after admission. No permanent dual authority writers or blind cross-provider retries. Rollback can restore only an admitted release/state respecting current revocation, not resurrect old authority. ADR-012 owns actual restore/HA/topology and validated RPO/RTO. Review for new compliance/tenant models, federation, unavailable provider fences, unacceptable measured latency/complexity, incident evidence or isolation needs. Material changes to Accepted constraints require explicit supersession review; no silent edits.

## 12. Development Constitution Compliance

- Re-read canonical governance, ADR convention, all Accepted ADR-001–008 completely and all architecture docs; inspected file inventory and existing security references before edits.
- Surfaced stale ADR-009 prohibition, no material Accepted conflict, threat assumptions and implementation gates; current owner direction authorizes only this proposal.
- Preserve Go, modular control plane/public boundaries/inward dependencies/selective DDD/slices and No implicit Shared Kernel; no universal security-domain models or cross-owner SQL.
- Preserve Runtime lifecycle/history/current authority, Temporal infrastructure/determinism, event delivery/effect distinctions, Sophia evidence and Tool/Execution governance, including ADR-008 stronger hostile-code baseline.
- Record Accepted status with explicit human project-owner approval dated 2026-10-05; acceptance does not authorize implementation.
- Separate verified primary protocol facts, NEXORA requirements, design inference and unknown choices; no unsupported product/security/availability/performance ranking.
- Documentation only, no source, Go modules/dependencies, security policies/configuration, IdP/OAuth clients, tokens/keys/certificates, vaults, schemas, workers, network/infrastructure/CI/deployment artifacts or deletions.
- Synchronize only directly supporting scope/status/navigation; Accepted ADR-001–008 unchanged; ADR-010 not started.
- Verification is document/status/structure/link/coverage/scope and byte preservation, not runtime security evidence.

## 13. Related Decisions

[Constitution](../../DEVELOPMENT_CONSTITUTION.md), [ADR convention/index](README.md), [architecture context](../architecture/ARCHITECTURE.md), [principles](../architecture/principles.md). Accepted constraints: [ADR-001](ADR-001-core-programming-language.md), [ADR-002](ADR-002-architecture-style.md), [ADR-003](ADR-003-agent-runtime.md), [ADR-004](ADR-004-workflow-engine.md), [ADR-005](ADR-005-event-architecture.md), [ADR-006](ADR-006-memory-architecture.md), [ADR-007](ADR-007-mcp-tool-architecture.md), [ADR-008](ADR-008-sandbox-execution.md).

| Decision boundary | Preserved or unresolved responsibility |
| --- | --- |
| ADR-001/002 | Go primary; modular ownership/public contracts and No implicit Shared Kernel; security separation does not define final contexts/packages |
| ADR-003 | Runtime owns Instance/Run attribution, lifecycle, wait/stop/outcome/effects; historical launch references immutable, restrictions dynamic |
| ADR-004 | Temporal infrastructure and deterministic orchestration; no Workflow authority, no automatic Run == Activity; hosting still undecided |
| ADR-005 | Commands/events/signals/audit distinct; durable intent/dedup where required, duplicates and unknown effects; DB commit + Signal non-atomic, no initial general broker/default Event Sourcing |
| ADR-006 | Sophia governed knowledge/projections, authorized retrieval before sensitive exposure, no memory authority/secrets; PostgreSQL + pgvector remain Sophia-specific |
| ADR-007 | NEXORA Tool/Operation and admitted MCP/native/internal adapters, scoped credentials, actual current authorization, effect/reconciliation ownership |
| ADR-008 | Dedicated controlled execution outside authoritative processes, stronger hostile-code isolation, Job/Attempt/source attribution, filesystem/network/secret/resource/output/process/cleanup/retry evidence |
| ADR-010 — Human Approval | Valid current approval reference when required; cannot bypass deny or survive relevant actor/resource/delegation/security changes automatically. Reviewer selection/quorum/UX/workflow/expiry/escalation and emergency mechanics deferred |
| ADR-011 — Observability/Audit | Required security decision/enforcement/incident evidence specified; backend/SIEM/integrity implementation/retention/trace/alerts and correction/privacy custody deferred |
| ADR-012 — Deployment | Actual IdP/policy/secret/workload identity/network/security HA/provider topology, versions, regions, capacity/budgets, backups/DR and measured revocation targets deferred |

Deliberately undecided: identity provider, authentication protocol/provider/assurance implementation, JWT/PASETO or other token format; RBAC/ABAC/ReBAC language/namespace/role taxonomy, OPA/Cedar/Verified Permissions/Zanzibar/SpiceDB/OpenFGA/Casbin or equivalent; authorization store/graph/schema; Vault/cloud secret manager/KMS/HSM or equivalent; OAuth provider/flow/client; SPIFFE/SPIRE/cloud IAM/mTLS/service mesh or equivalent; cache implementation/TTLs; secret injection/rotation mechanisms; network/sandbox implementation; Sigstore/SLSA level/implementation/SBOM format/scanner; exact resource, session, expiry, retry and revocation numbers; audit store/retention/alerts; final security package/bounded-context layout and deployment topology. Auth0/Okta/Cognito/Clerk/Keycloak/Entra/Google Identity and named runtime/cloud products are not selected. No further ADR is created.

Open questions for owner review and later gates: who owns memberships and allowable sharing; which human/workload assurance and recovery requirements apply; which providers support sufficiently scoped access/conditional operations/revocation; what disclosures/residency/classification are permissible; which effects can be fenced and what latency is acceptable; what emergency duties and operator segregation are required; what audit/privacy retention applies; and what staffing, workload and HA/DR budget supports the chosen mechanisms. ADR-010/011/012 must resolve their own mechanics before affected features; delegation to future ADRs is not permission to implement incomplete security.

## 14. Evidence / References

Primary sources reviewed **2026-10-05**. Protocol/platform facts are narrowly scoped to each source; the recommendation, composition, ownership, invariants and failure responses are NEXORA architectural inferences from the owner request and Accepted constraints. These references do not select protocols/products or establish installed compatibility, certification or deployed security. Recheck selected provider/standard versions and conformance before separately authorized implementation.

- I1: [OpenID Connect Core 1.0, errata set 2](https://openid.net/specs/openid-connect-core-1_0.html) — authentication claims, issuer/subject identity and validation; sections 2, 3.1.3.7 and 5.7. No IdP or token format chosen.
- O1: [RFC 9700 — OAuth security guidance](https://www.rfc-editor.org/rfc/rfc9700.html) — privilege/audience/sender restriction, redirect and refresh replay protection; no selected OAuth flow/provider.
- O2: [RFC 7009 — Token Revocation](https://www.rfc-editor.org/rfc/rfc7009.html) — section 2.1 acknowledges propagation delay and related-token policy; not proof of instant external-effect fencing.
- O3: [RFC 7662 — Token Introspection](https://www.rfc-editor.org/rfc/rfc7662.html) — token-state query and section 4 cache-staleness/performance tradeoff; does not determine NEXORA domain authority.
- Z1: [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) — no implicit trust solely from network location/ownership; authentication and authorization distinct. No zero-trust product or certification claimed.
- M1: [MCP security guidance, 2026-07-28](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices) — confused deputy, audience/token passthrough and SSRF; used consistently with Accepted ADR-007, not a NEXORA protocol version selection.
- S1: [SLSA v1.2 specification](https://slsa.dev/spec/v1.2/) — source/build tracks and provenance as supply-chain evidence examples, not an adopted level/format/tool.

Project evidence: current ADR-009 owner handoff; direct document reads; `rg --files --hidden`; security-topic `rg -n -i` reference search (1,211 matching lines before edits); `git status --short` not-a-repository result; pre-edit file-byte snapshot. No security product, provider connection, credential, runtime configuration or implementation artifact was created. Explicit human project-owner approval was recorded on 2026-10-05; enforcement effectiveness remains UNKNOWN until separately authorized implementation and real-boundary verification.
