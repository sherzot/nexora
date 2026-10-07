# ADR-012 — Deployment Architecture

- Status: **Accepted**
- Proposal date: **2026-10-06**
- Decision authority: **Human project owner**
- Approval date: **2026-10-06**
- Approval: **Explicit human project-owner architecture approval**
- Approval evidence: Human project owner explicitly stated: “I explicitly approve ADR-012 — Deployment Architecture as proposed.”
- Recommendation: Hybrid incremental deployment: modular trusted control plane, purpose-specific trusted workers, managed PostgreSQL and dedicated Temporal infrastructure, separately isolated hostile execution
- Constraints: Accepted ADR-001 through ADR-011; Development Constitution and architecture principles
- Scope: Deployment principles, initial conceptual topology, operational boundaries and evolution gates; documentation only

## 1. Context

NEXORA coordinates engineering work through a browser-facing Virtual Office, trusted control/governance, durable workflows, Agent Runs, Tool Operations, isolated Execution Jobs and governed knowledge. A deployment must preserve their different owners while containing hostile code, protecting current authority and recovering honestly after uncertain effects. The question is what must deploy together, what must isolate, what may coexist, and what evidence justifies later extraction.

VERIFIED project evidence: 19 existing files, comprising 17 Markdown documents and two filesystem metadata files; no implemented application or deployment. The constitution, contributor instructions, root README, index, architecture context/principles and all eleven Accepted ADRs were completely re-read. Deployment-topic searches and an outside-repository byte snapshot precede edits. This directory has previously been verified as not a Git repository; document changes use the snapshot rather than assumed Git history. Supporting documents still prohibited ADR-012 under the previous scope. The current explicit owner handoff authorizes this proposal and strictly supporting status/navigation changes; historical scope statements inside Accepted ADRs remain unchanged.

No material Accepted-decision conflict requiring amendment is identified. ADR-006's PostgreSQL/pgvector direction is Sophia-specific. **The broader initial application-data PostgreSQL recommendation is accepted through ADR-012, not an interpretation that ADR-006 already selected a global database.** Temporal hosting was intentionally deferred to this decision; analysis here leaves its provider unresolved for stated requirements, rather than silently adopting Cloud or self-hosting.

UNKNOWN: actual tenant/compliance/residency requirements, workforce/operator capacity, provider contracts, workload classes and concurrency, connection/streaming needs, allowed disclosures, budget, SLO/SLA, RPO/RTO, supported platforms and secret-bearing tests. No production capacity, reliability, isolation conformance, security or cost guarantee exists. Recommendations below are reviewable architectural inferences; mechanisms are verified only within the official-source facts in section 14. Unknowns gate affected implementation, not this requested proposal.

## 2. Problem

Choose the smallest initial deployable arrangement that preserves modular ownership, stronger hostile-code isolation, current tenant/operation authority, valid Approval, Temporal compatibility, explicit audit custody and recoverable business responsibility. Avoid both one privileged process containing everything and a service fleet created merely from module names. Make shared failure exposure visible and specify safe degradation, releases, restoration, backpressure and evidence-driven exits.

## 3. Decision Drivers

Priority: authority and hostile-code containment; recoverable owner state and honest effects; understandable operational ownership; tenant isolation and bounded resource/cost use; compatible releases and recovery; incremental delivery; useful portability. Familiarity with Kubernetes or a cloud is a preference, not a driver.

Future measurable scenarios: kill an API instance after commit without duplicating a mutation; keep an old workflow compatible through a new release without retaining old authorization; deny a hostile job any control-plane credential/network route; restore without reviving consumed Approval or deleted Sophia content; isolate one tenant's workload flood; retain required audit obligations during diagnostic outage. Owners must agree exposure, latency, recovery, cost and capacity targets before measurements. No numbers or passing runtime results are invented.

## 4. Considered Options

A. Single-process monolith. B. Single trusted application deployable with managed dependencies and isolated execution. C. Several justified purpose-specific deployables. D. Kubernetes-based modular platform. E. Microservices first. F. Serverless first. G. VM-centric operation. H. Hybrid incremental deployment.

Recommend **H**, starting near B with a distinct trusted worker operating role from C. This keeps one modular control-plane application and shared code/release ownership, while separating API serving, compatible worker versions and hostile execution for concrete lifecycle/trust reasons. Section 7 compares complete strategies, Kubernetes K1–K4 and workload primitives. This is not an extraction roadmap or a mandatory number of containers/hosts.

## 5. Decision

**ACCEPTED: use a hybrid incremental deployment architecture. Initially deploy one trusted Go modular-monolith control-plane application; deliver Virtual Office assets separately where useful; operate trusted Temporal workers as separate processes/deployment groups from API serving and Temporal Server; use one managed PostgreSQL deployment for initial NEXORA-owned relational state with strict logical ownership; keep Temporal as dedicated orchestration infrastructure; place all hostile repository/dependency/generated code in a separately admitted, stronger isolation Execution Plane.**

Trusted workers may share the application artifact, release pipeline and nearby trusted infrastructure. They are processing roles of the same application, not a microservice per module. Separate worker operation is justified immediately by polling/background lifetimes, workflow-version coexistence, credential ceilings and failure/resource containment relative to public API serving. Process separation alone is not compromise containment: shared host/identity/storage privileges and residual blast radius must be declared and reviewed. Further privileged/resource-heavy workers or adapters separate only when concrete exposure or workload evidence requires it.

**Kubernetes is not required initially.** Prefer K1: managed long-running application/runtime primitives, managed application data, separately chosen Temporal hosting, and dedicated admitted execution isolation. No initial general-purpose broker, Redis cache, separate vector database, microservice-per-module, active/active multi-region or speculative multi-cloud abstraction. No cloud, runtime product, exact hosting primitive or vendor is selected.

Managed PostgreSQL is a category recommendation conditional on extension support, owner/tenant control, residency, recovery and operational acceptance. Temporal hosting remains **unresolved**: evaluate managed Temporal first for operator burden, but select only after residency/security, recovery/export, workload limits, staffing and total cost comparison. Self-hosting requires a concrete control/residency or operational justification and demonstrated capability. An alleged managed equivalent must actually preserve Temporal semantics and supported compatibility; replacing the engine requires ADR-004 supersession review.

Observability uses bounded diagnostic transport; Audit uses explicit owner evidence/custody contracts. Object storage is introduced only for justified large artifacts or required custody, not as universal domain truth. Admitted Tool/MCP/native providers and external AI calls cross explicit disclosure/credential boundaries. A single initial application-data store does not include Temporal persistence automatically, merge domain ownership, mandate audit custody there, or freeze schema/RLS design.

This record is **Accepted** with explicit human project-owner architecture approval dated **2026-10-06**. Acceptance does not authorize implementation.

### Fundamental distinctions

**Logical boundary != Process boundary != Deployment boundary != Trust boundary != Scaling boundary != Failure boundary.**

- Module != Service. Service != Container. Container != Sandbox. Container != VM. Pod != security boundary by definition.
- Process separation != hostile-code isolation. Network separation != authorization. Private network != trusted identity. Service account != unlimited authority. Cluster membership != permission.
- Region != tenant boundary. Availability Zone != failure-proof. Replica != backup. Backup != disaster recovery. Database HA != backup. Backup completion != successful restore.
- Health check != correctness. Autoscaling != capacity planning. Kubernetes != architecture. Serverless != stateless business semantics. Managed service != automatically secure.
- Infrastructure IAM != NEXORA application authorization. Deployment success != business correctness. Observability != audit. Workflow durability != business-data durability.
- Encryption != authorization. Secret storage != permission to use a secret.

## 6. Detailed Design

### 6.1 Conceptual vocabulary

These 32 concepts are distinctions, not required services, classes, tables or final package names.

| Concept | Meaning / boundary |
| --- | --- |
| Logical Boundary | Owner/model/contract separation regardless of hosting |
| Process Boundary | Separate operating-system process; no assumed hostile-code protection |
| Deployment Boundary | Independently installed/released operating unit or group |
| Trust Boundary | Change in identity, authority, input trust or disclosure assumptions |
| Scaling Boundary | Workload/capacity that can grow under its own constraints |
| Failure Boundary | Set of resources/authority affected by a specified failure |
| Deployment Unit | Attributable operated artifact/role and dependencies, not automatically a domain |
| Control Plane | Trusted application coordination/governance responsibilities |
| Execution Plane | Bounded potentially hostile job processing under admitted isolation |
| Trusted Worker | Application processing role polling/coordinating owned operations; not hostile code |
| Temporal Service | Durable orchestration infrastructure separate from application workers |
| Data Plane | Persistent owner state and controlled derived storage facilities |
| Network Zone | Conceptual routing/exposure grouping, not an authorization grant |
| Workload Identity | Authenticated software identity with narrow duties and audience |
| Deployment Identity | Source/build/release/configuration attribution of an operating unit |
| Secret Reference | Controlled credential lookup/binding, not raw material or permission |
| Admission | Current authorization plus bounded resource/control readiness before acceptance/start |
| Backpressure | Explicit bounded refusal/defer behavior when downstream capacity is insufficient |
| Bulkhead | Resource/privilege separation limiting specified failure exposure |
| Artifact | Scoped attributable output/input content under its owner's contract |
| Durable State | A named owner's acknowledged persisted responsibility within stated recovery limits |
| Volatile State | Buffers/sessions/local computation lost on process or host failure |
| Custody Acknowledgement | Receipt naming actual durable retention boundary and limitations |
| Release Compatibility | Ability of coexisting versions to interpret contracts/state/history safely |
| Health / Readiness | Narrow operating-condition checks; not business correctness proof |
| High Availability | Ability to continue selected capabilities through specified failures |
| Replication | Maintained copies with explicit consistency/lag/failure behavior |
| Backup | Recoverable retained representation independent of normal serving lifecycle |
| Restore / PITR | Recovery of a covered store/checkpoint/time, not global effect reversal |
| Disaster Recovery | Governed restoration of capabilities, dependencies, authority and effects after major loss |
| Business Continuity / RPO / RTO | Needed capability continuity, tolerated recovery data gap and time; targets require evidence |
| Extraction Gate | Owner-reviewed evidence that an independent deployment's benefit outweighs new seams |

### 6.2 Initial topology and deployment units

Conceptual **accepted initial** topology; arrows are permitted contract interactions, not unrestricted reachability. Versions may coexist; boxes imply no exact replica/host count.

```text
Users / Browser (untrusted client)
    → Public Edge / Virtual Office asset delivery
    → authenticated NEXORA API
        → Trusted Go modular control-plane application
            ↔ owner-controlled PostgreSQL state
            ↔ dedicated Temporal Service
                ← separately operated trusted application workers
                    → current owner contracts / bounded provider operations
            → admitted Tool / MCP / native / AI provider boundary
            → Execution admission / provider management contract
                → separately isolated Execution Plane
                    → ephemeral hostile Execution Job environments
                    → bounded classified results / artifacts

Trusted producers → bounded diagnostic pipeline → diagnostic sink/query
Authoritative owners → durable audit intent/custody → authorized reconstruction
Artifact owners ↔ controlled object custody (only when justified)
Operators → separately governed administrative boundary
```

Temporal does not sit as an authorization gateway between every API and owner. Workers do not own every module merely because they execute Activities. API, worker and publisher paths invoke the same public owner rules; no private SQL or unchecked alternate dispatch. Database calls inside an Activity are nondeterministic application operations, not database calls from Workflow code. Control-plane authority is never extended to hostile jobs by the diagram.

| Unit | Initial placement and reason | Ownership, credentials and failure boundary |
| --- | --- | --- |
| A — Virtual Office / web | Browser client and static asset delivery at public edge; separate delivery where cache/release/public exposure warrants | Trusted backend owns business/session decisions; browser is untrusted and receives no server secret. Authenticated API interaction, CSRF/session and review integrity; streaming reconnect refreshes authoritative state. Framework, SSR/client-server rendering and hosting remain open |
| B — Control plane | One Go modular application, not one service per owner | Runtime control, task/project coordination, Tool admission, Approval, Security, Sophia application/domain logic, audit reconstruction, event publication and admin APIs can coexist logically. Module contracts preserve invariants; a compromised process can exercise its held privileges. Public/admin exposure and credentials must be minimized |
| C — Trusted workers | Separate processes/deployment groups, potentially same artifact and nearby trusted compute | Durable polling/coordination, version coexistence and bounded Activities. Separate identities from API and engine administration; split credential-bearing/high-resource groups when risk requires. No hostile code inside ordinary worker processes |
| D — Temporal service | Dedicated infrastructure, hosting unresolved in 6.4 | Owns engine history/task dispatch, not Agent Run/domain/security/Approval truth. Separate engine persistence/administration recovery contract; no default reuse of application database credentials |
| E — Execution plane | Dedicated admitted isolation providers/environments outside all trusted application/data/engine processes | Additional userspace-kernel, VM/microVM or demonstrated equivalent protection; management identity distinct from Job access. Separate trusted host/authority placement prevents an execution-host compromise inheriting API/DB credentials |
| F — Application data | One managed PostgreSQL deployment initially, subject to requirements gates | Owner-controlled repositories/transactions/credentials, Sophia canonical/provenance and derived pgvector; owner Outbox/Inbox and governance state. Shared outage/resource exposure explicit; independent audit custody when policy requires. No arbitrary cross-owner SQL |
| G — Tool / MCP | Reviewed trusted adapters may be in-process; third-party/local servers separately admitted and confined; remotes outside trust | Credential resolver responsibility may initially be local, but references remain purpose-scoped. New provider process cannot inherit application environment or control trust. Reachability != admission != authorization |
| H — Diagnostics / Audit | Minimal sufficient diagnostic transport/sink and explicit durable audit custody, different contracts | Collector/query privileges narrow; owner-local custody only where risk permits. Independent custody/admin/failure domains required where producer compromise or obligations demand them; no assumption one telemetry backend suffices |
| I — AI/model providers | External admitted API boundary | Current disclosure policy before prompt/source/embedding transfer; minimum eligible credentials, bounded quota/cost/retry. Regional/provider outage is not permission to choose unadmitted fallback or invent knowledge |

Administrative APIs can share application code while having separately governed exposure and operator authorization. External identity/secret services are additional admitted dependencies where later selected, not mandatory newly built services. Deployment ownership names the accountable application, data, orchestration, execution, security/credential and evidence operators before production; logical responsibility does not invent final teams or bounded contexts.

### 6.3 Trusted control versus hostile execution

The conceptual separation is mandatory. Project code, dependencies, generated code, scripts, tests, hooks and code-loading preparation are potentially malicious. They MUST NOT execute inside the web process, control-plane process, Agent Runtime process, Temporal Server, ordinary trusted worker process or database process. Containers used to package trusted software are not evidence of sandbox protection.

Admission resolves trusted initiator/delegator/workload, tenant/project/source, task/Run/Tool/Workflow references, exact materialized source/configuration, Job and Attempt. Current policy, valid Approval where required, provider admission and resource availability apply before acceptance and again before actual start/disclosure. Required filesystem/process/network/secret/output controls must be ready before any code-loading preparation. A queued “authorized” job is not durable authority. A changed source or environment requires valid revised binding, not silent execution of latest.

Management requests flow from admitted trusted scheduler/adapter to provider over narrow authenticated scope. Provider status/results return through validated evidence contracts bound to assigned Job/Attempt and source; a provider can assert observations but cannot set arbitrary tenant, policy or Run outcome. Job code has no direct DB, Temporal admin, secret resolver or general control-plane access. A narrow brokered operation, if justified, enforces current exact action/target/purpose rather than exposing a privileged API. Result and artifact content remain untrusted; extraction/rendering/parsing are separate bounded attack surfaces.

No shared hostile-execution host should carry trusted API/ordinary worker/DB/Temporal authority. Execution management can hold only the minimum credentials needed for assigned provider duties; co-resident jobs must not access those credentials. Account/cluster/physical separation is additionally decided from provider compromise, side-channel and compliance risks; a different process or namespace does not prove it. Cleanup has independent bounded capacity and durable custody. Parent exit, cancellation or lost control connection cannot prove population termination, absent external effect or cleanup. Unknown cleanup quarantines environments; no assumed safe reuse or pooling.

| Isolation family | Mechanism fact / NEXORA requirement | Disposition and gates |
| --- | --- | --- |
| Ordinary containers | OCI defines namespace/resource/security settings [E8]; shared-kernel containers expose host attack paths [E6] | Packaging/confinement only; reject as sole hostile-code baseline, including ordinary Kubernetes Pods |
| Userspace-kernel sandbox | gVisor interposes application system calls and restricts its host interface; resource/network/hardware limits remain [E9] | Candidate admitted class; test actual syscall/toolchain/browser compatibility, escape exposure, host overhead, egress and termination; no product selected |
| MicroVM / VM | Firecracker production guidance requires host/guest and jailer-equivalent controls [E10] | Candidate hardware boundary; image/device/host patching, privileges, deadlines, networking, startup and recovery still required; no hypervisor selected |
| Managed isolated platform | Provider may operate one of these mechanisms under its own contract | Require demonstrated equivalent isolation plus source/control readiness, dedup/status/stop/cleanup, data/residency, administrative exposure, cost and incident evidence; brand alone insufficient |
| Kubernetes with stronger runtime | Scheduler plus separately admitted runtime and host/control separation | Conditional later K3; RuntimeClass/Pod names do not prove coverage, network readiness or harmless retries |

Provider admission must demonstrate whole-job descendant ownership, actual source attribution, resource bounds including output/storage/provider overhead, no host mounts/runtime sockets/ambient secret, actual egress enforcement, attempt dedup/reconciliation, independent deadlines, cleanup/quarantine, patch response and trustworthy observation limits. Lost provider authority suspends new jobs and requires independent containment/effect review; no blind cross-provider rerun. Isolation reduces particular risks without guaranteeing confidentiality of a secret deliberately supplied to hostile code.

### 6.4 Temporal workers, hosting and compatibility

Trusted workers initially operate near the trusted application/data boundary under restricted workload identities. Workflow workers and Activity roles can begin in a small shared trusted group where privilege/resource exposure is acceptable; separate groups for high resource use, different credentials, provider trust or release lifecycle require a named reason. Mere Activity/type count does not justify services. External Tool/Execution operations retain their owners even when initiated by an Activity.

Deterministic Workflow code MUST NOT call databases, mutable policy, credential stores, external HTTP/MCP, LLMs, ordinary randomness/time or filesystem operations directly. Those go through owned application operations in Activities or other supported SDK boundaries. Durable approval/provider waits belong to Workflow state, not sleeping application goroutines. **Workflow != Agent Run != Agent** and there is no automatic **Agent Run == Temporal Activity** mapping. A workflow can coordinate multiple Runs, operations and Activities; a Run can span multiple bounded segments. Activity attempts reconnect to stable owner identities and reconcile unknown effects.

For API serving, compatible rolling replacement may be suitable. **Worker release is separately compatibility-controlled.** Temporal currently documents Pinned versus Auto-Upgrade behavior, coexisting blue-green/rainbow versions, and ordinary rolling replacement as incompatible with its Worker Versioning model [E2]. Prefer version-aware coexistence and controlled new-work routing, retaining required old code until safe drain. Do not pin a concrete SDK/versioning configuration here; a simpler rollout requires proven replay-compatible evolution/patching instead of assuming ordinary rolling is safe. Pinned workflow code does not freeze mutable authorization or every separately routed Activity adapter. Old workers must call current owners or be rejected before consequential use when they cannot enforce strengthened requirements.

Retain applicable old workflow handlers, data/contract compatibility and permitted release metadata. Continue-As-New/history evolution must preserve logical correlations and owned state; it does not create a new Agent Run automatically. New worker routing, API contracts, event versions, task/configuration references and database evolution must coexist. Drain stops new acquisition and bounds existing work; shutdown/cancellation is not rollback. In-flight external uncertainty survives worker termination.

| Hosting option | Availability, security, residency and recovery | Cost / operating control and recommendation |
| --- | --- | --- |
| Temporal Cloud | Official guides expose security, connectivity, regions/limits and recovery choices [E3]; verify actual contracted coverage and data export/recovery limits | Externalizes engine operation, retains application/worker/identity/data obligations; provider fees, dependency and exit work. First evaluation candidate, not selected |
| Self-hosted Temporal | Operator owns persistence/visibility, hardening, upgrades, capacity, failure recovery and production tests [E1] | Greater infrastructure control/residency flexibility, substantial continuing staff/capacity cost. Choose only when justified and operable; development server not production architecture |
| Managed Temporal-compatible offering | Validate engine/API/version compatibility and complete operational responsibility, not marketing equivalence | Could satisfy existing enterprise requirements; actual supported provider/contract unknown. Cannot silently replace Temporal semantics |

Hosting decision gate: documented data/region constraints, workload/task/history limits, application latency, incident support, capacity staffing, total lifecycle cost, recovery/export rights and tested dependency recovery. No SLA/RPO/RTO or region is selected. Temporal history archival is not automatically recovery of live coordination, and engine recovery is not restoration of PostgreSQL business/Approval/security state. Self-hosted Temporal persistence has its own custody, credentials, upgrade and resource/failure contract; do not place it in the application PostgreSQL deployment by convenience.

### 6.5 Network zones and flow policy

Conceptual zones are not VPCs/subnets/CIDRs or final firewall rules. Every permitted flow also needs admitted identity, current owner authorization, bounded inputs and approved disclosure.

| Zone / initiating flow | Permitted purpose | Default restriction / owner |
| --- | --- | --- |
| Public → edge/API | Static delivery, authenticated user API/review and declared streams | No public data/Temporal/worker/admin/collector control ports; ingress validates session, scope, request limits and trusted review binding |
| Trusted application ↔ application data | Owner-controlled query/transaction; migration only under distinct duty | Narrow client roles; no job access or arbitrary private cross-owner SQL; application/data operators |
| Application/workers ↔ Temporal | Scoped start/input/poll/completion and authorized observation | Worker identity not engine administrator; engine input/history not permission; Workflow/operations owners |
| Trusted adapter → provider egress | Explicit admitted origin/account/action and data purpose | No arbitrary model-selected endpoint or credential audience; Tool/disclosure owners |
| Execution management ↔ provider | Bound admission/status/stop/evidence/artifact transfer | Narrow management contract outside hostile Job identity; Execution/security |
| Hostile Job → network | None by default; explicitly scoped registry/fetch or synthetic test dependency where granted | No host-loopback, private/link-local/metadata/control/data/admin routes; actual IPv4/IPv6/DNS/redirect/proxy-bypass enforcement; Execution/network owner |
| Producer → diagnostic/custody destinations | Bounded permitted signals or risk-required durable evidence | Destinations admitted, no incoming telemetry privilege; Observability/Audit/security |
| Authorized reader → evidence/object query | Current tenant/resource/purpose-scoped access including linked payloads | Counts/index/cache/export not exempt; evidence/artifact owners |
| Operator → administrative boundary | Authenticated declared maintenance/incident/support duty | No unrestricted tenant authority from infrastructure role; separate credentials, attributable change and Approval where required |

Minimize ingress and egress; explicit destinations are preferable to broad internal reachability. Private IP, encrypted channel, service discovery or cluster membership grants no trust. Protect cloud metadata, link-local and private destinations from SSRF, including encoded addresses, DNS rebinding, redirects and actual connection resolution. Revalidate credential audience on every relevant hop. OWASP supports destination and redirect defenses [E12]; sandbox non-HTTP traffic needs actual network enforcement, not only an HTTP client check. Kubernetes NetworkPolicy depends on enforcement implementation and has scope/connection limits [E7]; configuration existence is not readiness. Test controls before starting code and disclose established-connection revocation limits.

Job results and uploads cannot open privileged callback destinations. Synthetic job-local networks can be allowed without exposing production private services. Browser automation includes subresources, downloads, sockets and session state; it receives separately scoped profiles. Administrative access must not share public browser trust or job credentials. No service mesh, mTLS, VPN, proxy or firewall product is selected.

### 6.6 Deployment identities and secret lifecycle

| Identity | Narrow role / authority distinction |
| --- | --- |
| Browser/user session | Admitted authenticated human continuity; current operating tenant and resources separately resolved |
| Control-plane workload | Application serving duty plus explicit represented/delegated actor; no privilege union |
| Temporal worker | Scoped polling/owned-operation duty; logical workflow/Activity identity is attribution, not permission |
| Tool adapter | Eligible provider/operation audience and external principal; caller cannot inherit adapter's technical ceiling |
| Execution scheduler/management provider | Admission/status/termination of assigned jobs; no general DB or business mutation duty |
| Execution Job | Bound attempt/access capability only if explicitly issued; no inherited worker identity |
| Telemetry producer | Permitted bounded submission, not evidence-reader/admin authority |
| Audit custodian | Durable custody/acknowledgement, protected administration; no domain truth or approval grants |
| Database client | Owner-scoped data access; migration/backup roles distinct from application operation |
| External provider | Admitted endpoint and bound external account/principal; no NEXORA authority |

Identity mechanism remains open: SPIFFE, mTLS, JWT, cloud IAM or alternatives require concrete issuer/audience/rotation/federation/current-revocation review. Internal trusted in-process context need not mint a token per call. Network receivers authenticate actual caller and represented context, resolve current resource scope, enforce applicable policy/Approval/obligations and reject stale claims. Workload credentials set a technical ceiling, not business permission. Independently authorized cleanup/containment duty cannot be exposed to delegated callers as added privileges.

```text
Secret source → trusted resolution → authorized workload/purpose
    → minimum-scope delivery → bounded lifetime → rotation/revocation
```

Secret source/store access is privileged and separate from authority to use a reference. Startup material must bootstrap only the intended workload with a reviewed minimum scope; dynamic/short-lived issuance is preferred where actual provider support and operating cost justify it. Provider API keys, DB credentials, signing keys and test/job credentials have distinct owners, audiences, custody and rotation contracts. No Vault/KMS/HSM/cloud secret manager is selected. Signing-key recovery and provenance trust anchors require separate custody review; application backup must not blindly duplicate unrestricted keys.

Browser receives no server secret; Agent/LLM receives no raw credential merely to invoke tools. Hostile execution receives none by default. A deliberately supplied test secret is readable by that code; prefer synthetic credentials/mediated operations, otherwise deny or redesign if confidentiality cannot tolerate it. Environment variables, mounts and buffers can leak to recipient code/dumps/logs; common delivery is not automatically safe [E11]. No privileged staging inherits developer homes, SSH/cloud config, parent environment or runtime sockets. Secrets/private chain-of-thought stay out of ordinary logs, traces, events, Sophia, conversation and workflow history. No perfect output-redaction guarantee.

Credential selection binds current tenant/project/resource/action/task/environment/provider/principal/purpose; delivery is bounded and attributable without raw values. Rotation/revocation blocks new affected use under actual receiver controls; cached credentials and requests already accepted may survive. Reconcile in-flight effects and record observed enforcement separately from revocation intent. Unavailable resolution means no broader/developer/environment fallback. Numeric lifetimes, overlap, clocks and maximum stale-use exposure remain risk-specific gates.

### 6.7 Application data, tenancy and extraction seams

Recommend one managed PostgreSQL deployment initially for NEXORA-owned relational data, rather than a database/cluster per logical module. Owner schemas/tables and narrow credentials are conceptual isolation tools, **not final layout**. Each owner alone defines repositories, mutations, migrations, consistency and published contracts. Shared physical storage does not authorize arbitrary SQL, cross-owner writes or shared transaction handles. Separate same-named entities remain legitimate; no implicit Shared Kernel through database utilities. Cross-owner consequences use public contracts with ADR-005 atomic owner state/publication intent and Inbox/equivalent durable consumer disposition where required.

Sophia retains its own canonical knowledge/provenance/relationships and derived pgvector retrieval. Structured/lexical retrieval is baseline; vectors introduced when representative queries justify them. No separate vector database, index type, metric, embedding model/dimension, chunking or ranking is selected. Externally owned truth remains at its owner; a shared cluster does not move it into Sophia or a global database domain.

| Data alternative | Fit / tradeoff | Initial judgment and revisit trigger |
| --- | --- | --- |
| One managed PostgreSQL deployment | Fewer infrastructure lifecycles, local owner transactions; shared outages/IO/connection/admin blast radius | Recommend conditionally; validate extensions, least-privilege owner paths, tenant controls, recovery and contention |
| Database per module/service | Separate namespace/credentials/lifecycle possible; extra connections/migrations and lost local consistency | No automatic adoption from module count; consider actual owner lifecycle/isolation requirements |
| Multiple PostgreSQL clusters | Stronger resource/failure/admin separation at cost of operation/recovery seams | Extract for demonstrated scale, residency, independent availability or privileged custody requirements |
| Separate vector store | Specialist retrieval scaling, adds projection consistency/deletion/recovery | Defer until measured Sophia quality/contention/isolation justifies it |
| Distributed database | Could meet evidenced geographic/scale requirements; semantics/operations differ | No requirement establishes benefit; defer, review owner consistency and migration before adoption |

Connection budgets cover API instances, coexisting worker versions, publishers, migrations, admin/recovery, vector/lexical workloads and tenant bursts. Bounded per-role pools and admission prevent horizontal scaling multiplying connections beyond capacity. No pooling product or pool size selected. Distinguish query/mutation deadlines and uncertain commits: response loss requires same-operation reconciliation. Replicas may serve eligible stale reads only under explicit freshness/current-restriction contracts; not fresh Approval or authorization merely because accessible. Owner-governed expand/contract migrations must tolerate coexisting code and outstanding events/history before retiring fields/contracts.

Backups/PITR and replicas have separate purposes; PostgreSQL base backup plus required WAL can recover covered database state, not remote effects or all external configuration [E4]. Managed providers must prove those covered boundaries and restore access. Shared deployment requires workload evaluation of write/IO/maintenance/vector pressure; reserve governance/recovery capacity and extract if real requirements cannot coexist safely. No concrete version, instance size, tables, RLS, migration library or numeric capacity is chosen.

| Tenant model | Proposed treatment / evolution gate |
| --- | --- |
| Shared application + logically isolated data | Initial candidate only where actual sensitivity/regulatory requirements permit; every owner query/action and model/evidence/artifact exposure enforces trusted current scope |
| Schema/database per tenant | Consider lifecycle or stronger namespace control; names alone do not prevent privileged bypass, noisy neighbors or mistaken credentials |
| Dedicated tenant deployment/stores | Consider regulatory/customer contract, residency, key isolation, noisy-neighbor/scale or availability evidence; adds fleet/release/DR burden |
| Hybrid enterprise isolation | Explicit supported tenancy classes and routing contracts if requirements justify; no ad hoc customer privilege exceptions |

Tenant ID, region, schema or shared provider account alone is not isolation. A multi-tenant user selects one trusted operating scope; memberships are not unioned. Current authority applies to queries, counts, caches, search results, objects and linked evidence. Physical separation can reduce particular exposure but does not replace owner authorization. Final RLS/tenant hierarchy, key design and physical mapping await actual requirements and boundary verification.

### 6.8 Object/artifact storage and custody

Repository snapshots where needed, uploads, generated binaries/reports, execution outputs, large Tool/model artifacts, permitted audit attachments and exports may justify object storage. Do not put arbitrary large binaries in PostgreSQL by convenience. Domain owner records establish artifact meaning, identity, trusted scope, source/Attempt/revision, digest/provenance, sensitivity and custody reference; object existence is not domain completion or universal truth. Temporary scratch differs from retained evidence; only required permitted outputs receive durable custody.

Object transfer is not atomic with owner metadata commit. Define upload/verification/owned publication intent, orphan disposition and retrieval eligibility before claiming durable availability. Bound file/byte/archive expansion, validate paths/links/types and treat malware/active content as untrusted. Extraction and rendering do not execute artifact code with trusted authority. A digest verifies integrity against a trusted expectation, not benignness. Current authorization covers metadata, download, export and content-disclosure destinations.

Signed/temporary access is a bounded bearer capability to a named object/purpose/recipient where enforceable, not tenant authority. Leaked access can be exercised within provider limits; duration does not guarantee immediate revocation or prevent recipient retention. Bind allowed operations/scope/lifetime, avoid logging URLs/tokens and require brokered current checks where stronger revocation is needed. No signing scheme or provider is selected. Lifecycle/deletion suppresses access before delayed purge, propagates to derivatives/caches/exports under custody, and includes backup restore tombstones. Audit attachment retention follows its independent policy; object storage is not automatically immutable audit custody.

### 6.9 Observability, audit and provider boundaries

Diagnostics: producer → bounded authenticated collector/pipeline where justified → admitted sink → authorized query. Agent/gateway/direct-export patterns have different operating tradeoffs [E5]; no Collector topology, OTel SDK or telemetry vendor is selected. Keep collection/external export finite and declare sampling/drop coverage. A persistent collector queue can survive some restarts but still lose data under overflow/disk/retry failure [E5]; it is not automatically required audit custody.

Audit: authoritative owner → sufficient durable local evidence/publication intent or independent pre-action custody receipt under explicit operation policy → retained evidence → current-authorized reconstruction. Receipt names actual durability/admin/failure coverage. Owner-local PostgreSQL custody may initially suffice for suitable risks; independent custody is required when producer/admin compromise, retention or obligations demand it. Remote custody write and business commit are not one transaction. `DB commit + Temporal Signal` remains explicitly **non-atomic**. Outbox/Inbox are patterns, not schemas, polling/CDC/broker implementations. No initial general-purpose broker/default Event Sourcing or universal exactly-once external effect is introduced.

Diagnostic sink outage degrades observation; audit custody failure blocks only operations whose declared required evidence cannot be established. Pending obligations stay durably owned, quarantined/escalated when automatic retries exhaust. Query projection lag never becomes business truth. Independent bounded security observation can detect pipeline/admin failures when justified; no SIEM/SOC or all-tenant evidence access by default. Current tenant/source reader authorization and deletion suppression apply before every query/count/link/export/model exposure.

Tool admission separates trusted internal adapters, confined local third-party MCP servers, remote MCP and native API contracts. A local stdio server is a process, not trusted because configured or child-launched; code-loading risks follow ADR-008. Credible provider identity does not prove truthful output or authorized downstream effects. High-privilege adapters separate deployment only when credential/fault/trust evidence warrants it. Resolver/broker is a responsibility, not mandatory new service.

External AI/embedding/reranking calls require current source/recipient/purpose/tenant disclosure eligibility before transmission, approved provider account/region/data terms, bounded payload/context, quotas and cost. Availability failover requires newly valid provider admission and data routing; never automatic unapproved disclosure. Retry can charge again; separate logical request, attempt, estimated/reported/unknown/confirmed billing. Provider responses and retrieved context remain data; they cannot elevate authority, certify business completion or grant a Run more permissions.

### 6.10 Environments, releases and supply chain

| Environment purpose | Necessary separation / minimal infrastructure |
| --- | --- |
| Local development | Synthetic data, nonproduction credentials, replaceable dependencies where suitable; Temporal development facility is not production readiness [E1]. If admitted isolation unavailable, hostile execution is blocked or uses a reviewed remote path |
| CI | Isolated validation/build identities and artifact evidence; external project PR/dependency code remains hostile, never privileged release execution. Ephemeral test services where needed, no production credential inheritance |
| Development/shared integration | Create only for real collaborative/integration needs; restricted test provider accounts, synthetic data and bounded scope; shared integration need not become two permanent fleets by convention |
| Staging/preproduction | Representative compatibility/security/recovery tests and controlled release candidate; separate production secrets/data. Fidelity needed by a specific risk, not copies of every production scale dimension |
| Production | Governed customer data/authority, admitted infrastructure, operations/restore/access procedures and owner-approved capability targets |

These are conceptual purposes, not created environments or mandatory always-on resources. Shared nonproduction infrastructure is permitted only when scope/trust/resource requirements allow it; production/nonproduction credentials, data and privileged routing remain separated. Prefer test/sandbox provider accounts and synthetic dependencies. Production data copying is a separately governed sensitive disclosure decision; no default dev access. Hostile execution baseline applies to CI/test jobs too, not only a paid production offering.

Trusted NEXORA release artifacts are immutable/attributable to reviewed source revision, build identity, dependency state, base/runtime version and release/configuration identity. Verify integrity against trusted promotion evidence; keep narrowly scoped build versus deploy versus runtime credentials. Dependency locks, SBOM, vulnerability scanning, signing/attestation concepts support origin/inventory/control, not benignness. No CI/CD vendor, registry, Sigstore/SLSA tooling/level or signing algorithm is selected. Hostile project dependencies remain hostile even if signatures verify origin; do not promote successful project tests into trusted platform artifacts.

Release admission evaluates current artifact eligibility/vulnerabilities, API/event contract compatibility, Agent/task configuration interpretation, database expand/contract evolution and Temporal replay/version routing. Stage representative tests under separate authorization before any future production deploy; current work creates none. API rolling deployment drains connections/work with bounded deadlines and honest unknown commit/dispatch responses. Streams reconnect using authorized owner refresh/cursors, not a required new broker or persistent browser truth. Worker version coexistence follows 6.4; immutable Run/configuration launch attribution is never rewritten to the deployed latest.

Rollback is allowed only to a still-admitted version compatible with written state, pending contracts and Workflow histories. Database reverse migration may be unsafe after writes; forward-fix can be required. Old vulnerable/revoked code cannot return because it once passed. Deployment rollback does not undo accepted Tool/Execution/model disclosure effects or replenish consumed approvals. Artifact/configuration/identity/secret rotations are separate attributable changes with compatibility and recovery review; no specific deployment script, migration or config is defined.

### 6.11 Availability, regional architecture and recovery

Availability is capability-specific, not a universal percentage. Required fresh authorization, valid Approval and audit custody gate affected consequential operations. In-flight effects may continue despite infrastructure failure. Independent bounded safety cleanup can proceed under its own current duty, without unioning that privilege into caller authority.

| Failed dependency | Capability response / retained responsibility |
| --- | --- |
| Public edge/API instance | Route only to suitable serving instances if later provisioned; committed requests reconnect by owner identity. UI may be unavailable while durable work continues |
| Control application | No fabricated admission/current decisions; durable owner/Workflow responsibilities remain; independent authorized execution stop may continue |
| PostgreSQL | Reject/wait owner writes and fresh governance use; uncertain commits reconcile. Optional permitted cached reads only with required current restriction/freshness coverage |
| Temporal service | No assumed durable new coordination/input acceptance; owner facts/intents can commit only if their contract allows pending publication. Existing external jobs may continue; restore engine before resuming dependent steps |
| Trusted workers | Durable coordination can wait for compatible polling capacity; no lost worker implies absent effect or automatically new Run |
| Execution plane | Refuse/defer within bounded admitted durable capacity; no host fallback. Stop/reconciliation capacity retained separately |
| AI provider | Optional context visibly omitted only if owner permits; model-required work waits/fails; no invented answer or unapproved disclosure fallback |
| Tool provider | Owned pending/failed operation or unknown effect; no blind mutation retry or replacement provider |
| Audit custody | Block selected custody-dependent actions, retain result/publication uncertainty; not universal shutdown of harmless work |
| Diagnostic transport/sink | Declare bounded diagnostic loss, continue independent allowed work; audit and incident evidence separately governed |
| Sophia retrieval | Optional evidence visibly degraded or evidence-required action blocked; no stale/deleted context or fabricated knowledge |

Prefer **one initial region and one primary application infrastructure provider**, subject to actual residency/continuity needs; external managed services need not share that vendor. Multi-AZ within that region is a production HA candidate when capability targets, dependency coverage and staff support justify it, not a fixed replica count or AZ guarantee. No exact provider, region or AZ selected. Multi-region is not a substitute for restoration evidence.

| Regional option | Tradeoff / gate |
| --- | --- |
| Single region | Simplest owner/engine/data latency and operations; region loss requires tested restore/continuity plan. Initial recommendation while geographic requirements unknown |
| Multi-AZ in one region | Can reduce specified local failures if all critical dependencies/configuration support it; shared regional/control/provider failures remain. Decide with HA requirements before production |
| Active/passive regions | Consider measured continuity/residency requirement and approved RPO/RTO; restore/replicate owner data, Temporal, evidence, artifacts, secrets/identity and restrict old writers |
| Active/active regions | Complex authoritative consistency, Approval consumption, ordering/fences and duplicate external dispatch; reject as default without a concrete requirement and verified protocols |

Region/AZ are failure/resource placements, not tenant/authorization boundaries. PostgreSQL promotion, Temporal state, approval/credential revocation, audit chronology and external operations do not become one atomic failover. Prevent simultaneous stale dispatchers at actual owner/receiver where enforceable; partitioned old execution may remain alive. DNS cutover alone does not fence credentials or stop jobs. Before resumed consequential work, establish current authority and old-attempt/effect disposition. No universal exactly-once guarantee, global ordering or instant stop.

**HA, replication, backup, restore, PITR, DR and business continuity are distinct.** HA serves covered failures; replication can propagate damaging changes. Backup retains a recoverable representation; PITR targets a covered store/time; restore demonstrates readable usable state; DR coordinates dependencies, authority, custody and actual external effects; continuity sets which user capabilities matter. Owner-approved numeric RPO/RTO depend on business loss, workloads and restoration drills. Backup job success alone proves none of these outcomes [E4, E13].

| Recoverable class | Required coverage / distinct recovery owner |
| --- | --- |
| Application PostgreSQL | Authoritative owner state, immutable Run attribution, tasks, operation/Job identities, Outbox/Inbox/claims and unresolved effects; data/semantic owners verify checkpoints |
| Approval | Requests/envelopes/decisions/quorum/use/revocation/supersession; restoring old unused flags cannot revive consumed authority |
| Security/governance | Current restrictions, memberships/delegations, credential/provider admission and fence state; security owner establishes current trusted recovery basis before serving |
| Temporal | Engine persistence/history/coordination and compatible workers; engine operator's recovery contract separate from application truth; closed history export alone insufficient |
| Sophia | Canonical permitted content, source revision/provenance/relationships and tombstones. Derived embeddings/indexes rebuild only from surviving eligible sources with compatible generation metadata |
| Audit | Required records, custody receipts/anchors, corrections/suppression and honest coverage gaps; custodian verifies integrity/access, not reconstructed debug logs |
| Objects/artifacts | Required content plus owner references/integrity/scope/lifecycle; object recovery and metadata reconciliation coordinated without presumed atomic snapshot |
| Configuration/release metadata | Supported artifact/build/configuration identities, dependency/compatibility mapping, network/identity admission and recovery runbooks; no secrets copied into ordinary metadata |
| Secrets/keys/identity access | Independently governed recoverable custody/issuance and trusted administrative access; correct bytes alone do not restore permission |

Conceptual restore sequence: restrict serving/dispatch → establish trusted operators, admitted artifacts and current identity/security/secret controls → verify backup integrity, keys and covered checkpoints → recover authoritative stores/Temporal/custody/objects and compatible workers without dispatch → reapply deletion/revocation/tombstones/current policy → reconcile cross-store references, approval consumption, messages/dedup, provider attempts and effects completed after checkpoint → verify tenant/evidence access and owner invariants → enable selected capabilities under attributable recovery approval. Recovery order is dependency/risk-specific, not a universal atomic script.

If the latest restrictions/deletion or effect evidence cannot be recovered, isolate affected capabilities and obtain authoritative current owner reconciliation; do not assume an old backup is safe current policy. Restored caches/signed snapshots do not confer fresh authority. External evidence after a checkpoint can prove consumption/performance absent from local restore; never automatically redispatch pending-looking records. Derived rebuild must not resurrect deleted data. Verify representative restore and actual recovery timing/data loss before claiming targets. Backup integrity, WAL continuity, protected failure/admin domains and configuration coverage are explicit gates; no retention duration or backup product is selected.

### 6.12 Scaling, backpressure and containment

| Scaling surface | Constraint / admission and extraction evidence |
| --- | --- |
| Web/API/streams | Stateless request serving where designed; connections/subscriptions and downstream DB/current checks limit replicas. Session/refresh semantics survive instance loss |
| Temporal workers | Polling slots/task queues, compatible version capacity, Activity resource/credential classes; not CPU alone. Scale without starting duplicate logical work |
| Agent Runs | Logical concurrent work, task/delegation/cost/fan-out budgets; Run identity is not a machine or worker slot |
| Model/provider requests | Provider/account quotas, eligible regional routing, context/cost and unknown charges; retries share budgets |
| Tool operations | Target-specific rates, safe attempt/reconciliation and tenant fairness; SDK/workflow retries cannot multiply independent quotas |
| Execution jobs | Admitted isolation capacity, guest/host/storage/output/cleanup overhead and tenant workload classes; no unsafe overcommit/downgrade |
| PostgreSQL | Connections, IO/write/lock/memory/maintenance and backup pressure; pool/admission limit total active versions/instances |
| Sophia / pgvector | Authorized query quality, filter/selectivity/index/ingestion contention; baseline lexical fallback only where evidence policy permits |
| Audit ingestion/query | Required custody capacity, publication lag and independent admin/failure requirements; query projection backlog does not erase evidence |
| Diagnostic telemetry | Bounded attributes/cardinality/output/queues/exports and permitted loss; do not exhaust audit/governance capacity |

Admission covers new Runs, Workflow backlog, recursive Agent fan-out, Tool/provider calls, Job queues, DB pools and evidence volume against global/tenant/project/provider budgets. No numeric limits or fairness algorithm selected. Reject/defer explicitly before durable acceptance when obligation capacity is unavailable; accepted obligations cannot disappear. Durable queueing means assigned recoverable custody, bounded growth/age and disposition, not unlimited resilience. Durable Workflow wait differs from an unbounded local queue/sleeping goroutine.

Reserve independent capacity for cancellation, revocation, audit-required custody, orphan cleanup and reconciliation when risk requires; tenants cannot spend it as general work. Bulkheads can be logical quotas first where sufficient; process/identity/store separation follows actual security/resource/fault requirements. Provider outage must not corrupt owner state; one tenant flood must not consume every tenant's capacity; malicious output must not fill trusted memory/storage. Autoscaling respects downstream capacity, admitted provider quotas, Temporal version routing, execution availability, cost and fairness rather than moving saturation into PostgreSQL. No cache/broker added to conceal uncontrolled demand.

### 6.13 Accepted deployment invariants

The 60 owner candidates are retained below, followed by 12 refinements. These are accepted architectural obligations, not implemented controls. Acceptance does not authorize implementation.

1. Logical boundary is not deployment boundary.
2. Module is not automatically a service.
3. Service is not automatically a security boundary.
4. Container is not sufficient hostile-code isolation by definition.
5. Private network location grants no NEXORA authority.
6. Infrastructure identity does not replace application authorization.
7. Control plane and hostile execution have distinct trust requirements.
8. Hostile project code does not run in the trusted control-plane process.
9. Execution workers do not receive broad DB/control-plane access.
10. Secrets are absent from hostile execution by default.
11. Browser receives no server credential.
12. Agent/LLM receives no raw credential merely for Tool invocation.
13. One physical PostgreSQL deployment does not create shared data ownership.
14. Cross-owner mutation follows owner contracts.
15. pgvector remains derived Sophia retrieval state.
16. Replica is not backup.
17. Backup is not DR.
18. Backup success is not restore proof.
19. Deployment rollback is not business rollback.
20. Workflow durability is not business-state durability.
21. Temporal history is not universal business truth.
22. Provider success is not business success.
23. Autoscaling is bounded by downstream capacity and policy.
24. Unbounded queueing is prohibited as a resilience strategy.
25. Unlimited Agent fan-out is prohibited.
26. Multi-region does not imply correctness.
27. Failover cannot blindly replay unknown external effects.
28. Network retry cannot silently duplicate consequential operations.
29. Region failover requires effect/idempotency/reconciliation reasoning.
30. Service extraction requires explicit evidence.
31. Kubernetes requires demonstrated operational value.
32. Kubernetes Pod alone does not satisfy ADR-008.
33. Managed service does not remove NEXORA security responsibility.
34. Self-hosting requires explicit operational justification.
35. Telemetry outage is distinct from audit-custody failure.
36. Audit infrastructure does not become business authority.
37. Infrastructure logs do not become authorization.
38. Secret store access does not grant business permission.
39. Encryption does not replace authorization.
40. Tenant scope remains current-authorized at every consequential owner.
41. Shared infrastructure must preserve tenant isolation.
42. Production and non-production credentials remain separated.
43. Development must not implicitly access production data.
44. Build provenance does not prove project code safety.
45. Hostile dependencies remain hostile inside the execution boundary.
46. Deployment artifacts are attributable to source/build identity.
47. Database migrations require compatibility/evolution strategy.
48. Temporal worker deployment requires workflow compatibility strategy.
49. Old workers cannot silently apply new authority semantics.
50. Current authorization is revalidated near consequential use.
51. Revocation does not prove already-running work stopped.
52. Shutdown does not prove external effect absence.
53. Health checks do not prove business correctness.
54. HA does not replace backup.
55. Restore procedures require verification.
56. Derived indexes can be rebuilt only from surviving canonical data/provenance.
57. Object artifacts remain scoped and attributable.
58. Signed URLs/tokens are bounded capabilities, not tenant authority.
59. Execution results remain untrusted until interpreted by their owner contract.
60. Deployment acceptance does not authorize implementation.
61. Separate trusted worker operation must preserve one modular application and owner contracts; independent deployables need a named lifecycle, resource, trust or failure reason.
62. Processes sharing a host, identity, credentials or storage MUST declare their remaining common compromise/failure exposure; process separation cannot claim independence it lacks.
63. A hostile execution host MUST NOT inherit trusted API, ordinary worker, Temporal or database authority; Job access remains distinct from provider management identity.
64. Required isolation, egress, resource and credential controls MUST be ready before code-loading preparation or execution begins; missing controls block admission/start.
65. Temporal version-aware releases require compatible coexistence/routing or a proven replay-safe alternative; ordinary rolling replacement is not assumed equivalent.
66. Required audit acknowledgements identify the actual durable custody and administrative/failure boundary; volatile collector acceptance is insufficient.
67. Restores MUST establish current trusted restrictions, approval consumption and deletion/suppression before serving or dispatch; uncertain recovered authority blocks affected capabilities.
68. Cross-store backups and failover are not presumed atomic; post-checkpoint provider effects, messages, jobs and custody obligations MUST be reconciled before unsafe resumption.
69. Multi-AZ or managed hosting claims name covered dependencies and remaining common failures; neither implies tested restoration or a selected uptime guarantee.
70. Control, admission and recovery capacity MUST be bounded and protected from tenant fan-out and diagnostic floods according to explicit risk policy.
71. Object publication/custody must reconcile content and owner metadata; upload success alone cannot establish a committed domain fact or readable current eligibility.
72. Final infrastructure/provider, tenant enforcement, numeric targets and recovery guarantees require explicit requirements and separately authorized real-boundary validation; foundation completion does not decide them implicitly.

## 7. Alternatives Analysis

Qualitative architectural judgments against Accepted constraints; no deployment, benchmark, capacity, staffing cost or product parity has been measured. Every compliant strategy retains current authorization, durable owner responsibility, explicit audit custody and ADR-008 protection. A cost judgment includes recovery/incident labor, not only compute price.

| Strategy | Security / isolation / consistency | Operations, cost and developer change | Scale / failures / Temporal / portability | Disposition |
| --- | --- | --- | --- | --- |
| A — Single-process monolith | Simple local calls; unacceptable if hostile code or Temporal/data authority is folded into that process | Few releases, privileged blast radius; apparent cheapness hides escape/recovery risk | One lifecycle/resource profile; cannot independently support engine/worker version operation | Reject all-in-one topology; retain modular application ownership within H |
| B — One trusted application + managed dependencies + isolated execution | Fits owner-local data and strong hostile separation if provider controls proven | Small application operating surface; managed contracts/credentials/recovery still work | Can replicate API and separate worker role; shared DB/control failures remain; useful contract portability | Strong initial base for H |
| C — Several purpose-specific deployables | Narrows credential/resource exposure where real requirements differ; adds authenticated seams | More releases/diagnostics/coordination but fewer than per-module services | Independent worker/adapter/execution scaling; cross-process failures not automatically independent hosts | Use justified worker and execution roles initially; additional splits evidence-driven |
| D — Kubernetes modular platform | Can host owner architecture with admitted sandbox runtimes; RBAC/network/host policy not automatic | Cluster/add-on/admission/upgrade/patch expertise and baseline cost | Scheduling/version orchestration possible, shared control/nodes remain; platform/API coupling | Conditional future option, not initial requirement |
| E — Microservices first | More possible boundaries, distributed owner transactions and confused-deputy seams | Fleet/contracts/on-call and migration cost before known need; slower coherent changes possible | Independent scale if actually needed, amplified dependency/trace/DR complexity; Temporal not every service's authority | Reject initial service-per-owner; ADR-002 extraction criteria govern |
| F — Serverless first | Isolated functions still not arbitrary hostile-code admission; business durability external | Low management for suitable bursts, provider time/connection/identity limits and cold starts require validation | Long streams/workers/background polling may not fit chosen product; store/effect semantics unchanged | Select only suitable edge/short operations later, not force all workloads |
| G — VM-centric | Explicit host/kernel/guest control; strong job isolation needs correct VM policy, not VM name | OS/images/patching/capacity/backup/on-call owned; idle and staff costs | Long-lived API/workers fit, scaling/release automation additional work; useful where hardware/control constraints | Valid alternative if operational/platform evidence wins; no default host execution |
| H — Hybrid incremental | Modular trusted application, separate worker lifecycle and strong hostile plane; logical owner data discipline | Minimum justified roles/dependencies, managed categories where appropriate, gradual complexity | Workload-specific scaling/failure contracts, Temporal coexistence, portable semantics and reviewed exit costs | Recommend initial topology in section 5 |

The strongest challenge to H is a shared trusted application/data blast radius and several provider-dependent seams. Separate processes do not protect against a privileged common host/operator. If actual sensitive workloads require independent administrative custody or worker credentials incompatible with sharing, stronger separation must precede use, not await scale. Conversely, choosing one managed product for each category can cost more and complicate recovery; consolidate only where risk and ownership permit. No comparative performance or lowest-price claim supports the recommendation.

### Kubernetes K1–K4

| Option | Networking/identity/isolation | Worker release, scale and observation | Upgrades/patching/cost/team burden / judgment |
| --- | --- | --- | --- |
| K1 — No Kubernetes initially | Managed runtime identities and explicit zones; dedicated execution isolation outside ordinary app containers | Platform must support long-running pollers, version coexistence, bounded resources and diagnostics | Avoid cluster operation until demonstrated benefit; runtime/provider limits need conformance. **Recommend initially** |
| K2 — Kubernetes trusted workloads only | Cluster policies for trusted app/worker/operator access, execution separately admitted | Could standardize rollout/worker versions and scaling; observability/admission add-ons need ownership | Appropriate when existing supported platform/staff or fleet evidence outweighs burden; no need established now |
| K3 — Kubernetes control + stronger execution runtime | Separate authority/node/resource placement and admitted userspace-kernel/VM-equivalent runtime; protect scheduler/admin and egress readiness | Jobs can duplicate starts; semantic identities/cleanup and compatible trusted worker routing remain application duties | Substantial sandbox/node/plugin/admission/upgrade conformance and incident burden; consider only demonstrated workload benefit |
| K4 — Kubernetes everywhere, ordinary containers | Ordinary Pods share kernel attack exposure; namespace/network labels do not satisfy ADR-008 | Scheduler/autoscaling cannot repair missing protection, resource/effect or authority semantics | **Reject for hostile execution**; operational convenience cannot waive Accepted baseline |

Kubernetes requires operating ownership for control plane, nodes/runtimes, networking/enforcement, identity/RBAC, admission, upgrades, patched images, observability and recovery. Managed Kubernetes may outsource some duties but leaves workload/security/configuration obligations. No distribution, cluster count, RuntimeClass, Helm chart or manifest selected. Official sandboxing and NetworkPolicy limitations support the distinction [E6, E7], not a claim K1 is universally safer.

### Trusted workload primitives and cloud strategy

| Primitive | Fit / limits requiring evidence |
| --- | --- |
| Serverless functions | Suitable bounded edge/request/burst tasks if product supports deadlines, connections, identity and cost. Do not assume long-lived streams or Temporal polling survives suspension; serverless does not make business state stateless |
| Long-running containers / managed app runtime | Preferred initial evaluation for Go API/worker roles: natural process lifetimes and artifact promotion; require appropriate connection draining, resource controls, version coexistence and credentials. Packaging trusted code does not admit hostile code |
| VMs | Useful control/hardware/custom runtime; explicit OS patching, process/resource supervision and host isolation costs. Could support H without Kubernetes |
| Kubernetes | Justified orchestration platform for actual fleet/operational needs; additional complexity and shared control/node exposure; K1 remains initial choice |

No single primitive is mandated for web assets, API, workers and execution. Runtime selection must validate actual streaming/polling/startup/resource/background behavior and operator cost. Platform labels are not external facts about every product. Initial one-primary-cloud evaluation simplifies operations while allowing specialized external providers; active multi-cloud adds correlated authority, data, identity, recovery and duplicate-dispatch complexity without a demonstrated requirement. Do not build speculative cross-cloud deployment abstractions. Portable owner contracts, logical identity, exportable governed state and effect semantics matter more than pretending infrastructure is interchangeable. Managed service coupling is acceptable when justified and exit/recovery cost understood.

### Self-host versus managed / SaaS

| Category | Self-host duties / value | Managed or SaaS duties / value; unresolved gate |
| --- | --- | --- |
| PostgreSQL | Own patch/extension/HA/WAL/backup/restore/capacity/admin; useful control but staffing must be demonstrated | Prefer managed category initially if extension/residency/current scope/recovery are adequate; actual backup rights, connections, restore and total cost verified before choice |
| Temporal | Own engine persistence/visibility/upgrades/security/DR/support [E1] | Managed first evaluation; application workers remain operated. Contracted security/residency, limits, recovery/export and billing unknown; no host selection |
| Diagnostics | Own collectors/sinks/query/storage and incident coverage | Can externalize backend operation; data disclosure, labels, credentials, access, loss and vendor exit still NEXORA duties |
| Audit custody | Control administrative/failure boundary and integrity/disposal | Verify actual acknowledgement/independence/retention/privacy/export; ordinary telemetry service does not inherit suitability |
| Objects | Own capacity/integrity/access/lifecycle/backup and incident recovery | Verify scoped temporary access, revocation limits, residency, restore/export and costs; introduce only justified class |
| Secret custody | Own issuance/key/rotation/access/recovery expertise | Specialized service may reduce some duties, creates availability/IAM/exit dependencies; store access still not business authority; product open |
| Execution | Own stronger runtime, hosts/images/network/patch/cleanup/conformance and idle capacity | May externalize host operation, but equivalent control/evidence, provider compromise, workload limits, residency, cost and exit required |

Managed does not remove security responsibility; self-host is not inherently cheaper. Compare staff/on-call, outage/data-loss exposure, migration/egress, idle/burst cost and business constraints before procurement. Research is not selection, and no referenced product is implied as a dependency.

## 8. Consequences

### Positive

The topology preserves one coherent modular application while separating concrete trust/lifecycle requirements. Initial infrastructure stays small relative to service-per-module designs. Owner state/current authority remain distinguishable from engine history and diagnostic output. Version-aware workers, explicit custody and restoration/effect reconciliation make failures reviewable. Deployment semantics survive provider replacement through owned contracts.

### Negative

Strong execution isolation, compatible old workers, credential boundaries, tenant admission and restore verification require real engineering and operator capacity. Shared initial application/DB exposes correlated failures and may later require extraction. Managed services introduce contracts, fees, quotas and migration limits. Some jobs/actions must wait or be refused when required controls/current facts are unavailable.

### Risks

Logical boundaries may be mistaken for compromise isolation; shared credentials can undo process separation. Old worker compatibility can become retained stale authority. Restores can revive revoked access or duplicate external effects. Collector/object providers can leak sensitive data. Overbroad audit gating can halt harmless work; weak custody can lose required evidence. A hybrid proposal may be mistaken for implemented production readiness. These risks remain unmitigated until separately authorized controls and real-boundary validation.

## 9. Security Considerations

Protected assets: current authority/Approval, tenant source/data/secrets, trusted artifacts and infrastructure identities, engine/business durability, audit custody, scoped objects, recovery records and bounded capacity. Adversaries include public attackers, hostile projects/dependencies/model outputs, compromised providers/workloads/CI, stolen sessions and privileged operators. Requirements below are accepted architectural controls, not verified mitigations. T01–T50 map every minimum requested threat; numbers are coverage identifiers, not severity scores.

| Threat | Required containment / authoritative owner | Residual exposure / implementation gate |
| --- | --- | --- |
| T01 — Public API compromise | Narrow ingress privileges, owner PEPs and current scope; Security/application | Compromised API process can exercise held privileges; independent credential/host boundaries and detection required |
| T02 — Web session compromise | Admitted session protection/assurance/revocation, exact review binding; identity/Approval | Stolen valid session may act within authority; session theft/re-auth controls not selected |
| T03 — Control-plane process compromise | Least credentials, narrow provider/data duty, independent custody where risk requires; Security/operations | Package boundaries do not contain process compromise; actual privilege blast radius must be assessed |
| T04 — Temporal worker compromise | Worker identity separate from API/admin, scoped owner calls/current enforcement; worker/Security | Worker-held credentials and allowed duty can be abused; privileged worker groups may need stronger separation |
| T05 — Temporal service compromise | Limited history content/engine credentials, owner checks outside replay; orchestration/Security | Forged/lost coordination affects availability; engine evidence not trusted business truth; provider incident/restore contract |
| T06 — PostgreSQL credential compromise | Narrow owner roles, separate migration/backup duty and audit; data/Security | Privileged DB access can bypass app checks; custody/admin boundaries and revocation coverage needed |
| T07 — Tool adapter compromise | Declared effects, minimum provider credential and current target binding; Tool/credential | Adapter can abuse its technical ceiling; provider narrowing/independent observations needed |
| T08 — MCP provider compromise | Purpose admission, confined local code, bounded external credentials/output; Tool/Security | Authenticated malicious provider can lie/exfiltrate; suspend/reconcile, no automatic failover |
| T09 — Execution scheduler compromise | Narrow management identity and independent start readiness/source validation; Execution/Security | Scheduler authority can schedule abusive assigned jobs; provider and control channels need conformance |
| T10 — Sandbox escape | Stronger admitted boundary, no co-resident trusted authority, quarantine; Execution/incident | Unknown runtime bugs and side channels remain; detection, host replacement and evidence trust open |
| T11 — Host kernel compromise | Separate hostile hosts/authority, patch/runtime admission, constrained management; operations/Security | Shared execution hosts/co-tenants at risk; stronger physical classes from sensitivity evidence |
| T12 — Malicious repository build | All code-loading phases within ADR-008 policy/source binding; Execution | Successful build is not benignness; actual runtime and extraction safety required |
| T13 — Malicious dependency install script | Same isolation/egress/bounds as tests, no privileged preparation; Execution/toolchain | Verified origin can still be malicious; cache/image/staging controls open |
| T14 — Secret exfiltration | No ambient secrets, narrow mediation/data disclosure, output quarantine; credential/Security | Secret given to hostile code is readable and encodable; deny/redesign intolerable workload |
| T15 — Metadata credential theft | Deny metadata/link-local actual traffic and absent management credentials; network/Execution | IPv6/alternate routes/proxy bypass and established connections require testing |
| T16 — SSRF into internal services | Owner-resolved destinations, no arbitrary routes, recipient authentication; Tool/network | Client prechecks alone race; actual connect and non-HTTP paths need enforcement |
| T17 — DNS rebinding/redirect abuse | Validate each hop and actual resolved endpoint/audience; network/adapter | Resolver/connect/client behavior unknown; do not forward tokens to redirected origins |
| T18 — Cross-tenant DB query | Trusted scope at all owner paths, least data roles/defense in depth; data/Security | RLS/schema not finalized, privileged bypass and counts/leaks require tests |
| T19 — Cross-tenant object access | Current owner metadata/download scope and narrow storage capabilities; artifact/Security | Leaked bearer access and provider policy gaps; broker where fresh revocation required |
| T20 — Telemetry exfiltration | Minimize before collection, governed destinations and reader scope; Observability/Security | Unexpected payloads and vendor/operator compromise; no perfect redaction claim |
| T21 — Audit tampering | Protected write/admin/correction paths, independent custody/anchors where required; Audit | Signed false producer data or missing tail can remain; proof/custody coverage gates |
| T22 — CI/CD compromise | Separate build/promotion/deploy identity, trusted provenance, no hostile privileged CI; release/Security | Compromised admitted builder/reviewer remains possible; independent admission evidence |
| T23 — Artifact substitution | Immutable reference/integrity against trusted build/promotion; release | Self-supplied checksum insufficient; signer/trust policy and registry custody open |
| T24 — Deployment credential theft | Narrow environment/duty/lifetime and governed use; release/credential | Deployment rights may expose production data; rotation/fence and admin segregation required |
| T25 — Vulnerable rollback | Current release admission and schema/history compatibility; release/Security | Past approval not present eligibility; forward-fix may be only safe path |
| T26 — Supply-chain compromise | Locked attributable dependencies, inventory/provenance/review/patch response; release | Signatures prove origin, not safety; unknown vulnerabilities remain |
| T27 — Compromised administrator | Declared least duty, tenant support separate, independent evidence; Security/Audit | Physical/root/provider privileges can bypass app; segregation/custody risk review |
| T28 — Break-glass abuse | Explicit narrow incident scope, eligible human governance, revocable evidence; Security/Approval | Urgency/post-action review cannot retroactively authorize; fallback policy and custody required |
| T29 — Region outage | Capability continuity, protected backups and current-authority/effect-safe recovery; DR owners | No cross-region atomicity or selected RPO/RTO; recovery drill required |
| T30 — AZ outage | Dependency-aware HA placement only where justified; operations | Common regional/control failures remain; multi-AZ label not guarantee |
| T31 — DB corruption | Backup/PITR integrity and owner invariant verification; data/DR | Replicas can carry corruption; detection/checkpoint coverage unknown |
| T32 — Backup corruption | Protected independent custody, integrity and representative restores; backup owner | A green job cannot prove usable data; multi-copy/admin failure boundaries reviewed |
| T33 — Restore failure | Rehearsed trusted access/keys/config/dependencies and restricted recovery; DR | Missing keys/WAL/config can prevent restore; measured recovery gate |
| T34 — Temporal persistence loss | Engine-specific recovery plus domain/effect reconciliation; orchestration/DR | Closed history export may not restore live coordination; no permission from reconstructed history |
| T35 — Provider outage | Bounded owned waiting/refusal, current admission before fallback; Tool/AI/Execution | Accepted external effects may continue; no unsafe substitution |
| T36 — Conflicting provider response | Append contradictory observations, independent owner reconciliation; Tool/Audit | Compromised provider receipt may lie; keep unknown and stop blind retries |
| T37 — Execution flood | Tenant/global admission, resource bulkheads and recovery reserve; Execution/budget | Numeric capacity/fairness unresolved; isolation does not solve exhaustion |
| T38 — Agent fan-out explosion | Bounded Runs/recursive work, shared cost/provider budgets; Runtime/task | Unlimited recursion prohibited; finite acceptance/disposition mechanism needed |
| T39 — DB connection exhaustion | Aggregate pool budgets including old workers/admin and backpressure; data/application | Autoscaling can amplify pressure; pool/admission targets need measurements |
| T40 — Telemetry cardinality attack | Validated bounded labels/records, no attacker routing; Observability | Drops/coverage explicit; do not exhaust required custody |
| T41 — Queue/backlog exhaustion | Bounded durable acceptance, fair scheduling and owned quarantine; publication/workflow | Queue length is not resilience; unresolved obligations cannot be discarded |
| T42 — Stale deployment processes work | Current receiver owner fences/claims and compatible version routing; Security/worker | Old code may lack strengthened controls; stop affected use, not freeze authority with pinning |
| T43 — Split-brain deployment | Single authoritative write/dispatch ownership, receiver fences; data/Execution | DNS/lease expiry alone insufficient; partitioned processes and external calls can persist |
| T44 — Duplicate failover dispatch | Stable logical operation, post-checkpoint reconciliation/provider dedup; Tool/DR | No universal external exactly-once; unknown effects block blind replay |
| T45 — Revoked cached credential used | Current eligibility near use, receiver/provider restriction, containment; credential/Security | Propagation/accepted calls limit instant stop; observed enforcement retained |
| T46 — Untrusted execution result becomes fact | Validated provider provenance, bounded output and owner interpretation; Execution/Runtime | Compromised provider can forge observations; exit/text not complete business truth |
| T47 — Internal IP used as authorization | Authenticate actual workload and current resource context at recipient; Security | Private routes/cluster membership grant nothing; background entry paths tested |
| T48 — Service account exceeds delegated duty | Separate caller delegation and own-duty ceiling, no privilege union; owner/Security | Technical broad token may remain; constrain adapter or refuse if policy unenforceable |
| T49 — Signed object access leaks | Narrow capability, no log/model exposure, govern revocation limits; artifact/Security | Recipient retention/valid leaked bearer cannot be undone; broker/current check where required |
| T50 — Development reaches production | Separate credential/data/privileged routing, synthetic/test accounts; environment/Security | Misconfigured cross-account route or privileged CI can bypass labels; test actual deny |

Additional coverage: restore can resurrect suppressed content or current-denied policy; a common secret/identity outage can disable containment; artifact parsers can escape before validation; compromised object/telemetry vendors can forge custody; stalled WAL or object publication can exhaust storage; and shared DB vector work can starve Approval. Sections 6.3–6.12 require actual-boundary controls, independent recovery duty, publication reconciliation and scoped resource limits. More physical isolation may be necessary before use; documentation alone demonstrates none of it.

## 10. Operational Considerations

### Failure walkthroughs F01–F32

Every row is future validation, not an executed test. The owner/unit/identity column identifies authoritative semantic owners, operating unit and effective trusted identity; initiating/delegated actor remains separately recorded. D means required durable state, V volatile state. Effect knowledge never follows merely from absent process/log. Responses distinguish fail/degrade/durable wait, retry and reconciliation. All reads/recovery/cleanup require current scope and valid Approval where required; safety duties are independently governed, not a privilege fallback. Evidence includes original Run/config/task/delegator attribution, current operation policy/Approval/credential references without values, release/provider versions and stable semantic identities. This common baseline plus each row covers the eleven requested dimensions.

| Scenario | Owner / unit / trusted identity | Durable (D), volatile (V) / effects | Behavior, retry and reconciliation | Security / recovery requirement / unresolved gate |
| --- | --- | --- | --- | --- |
| F01 — API instance dies during request | Domain owner / API role / authenticated user via workload | D owner operation/commit/intent; V request buffers. Commit/effect unknown to caller | Fail connection; resolve same operation from owner before retry; do not generate new semantic mutation | Current reader scope; recover surviving/restore state and required custody; atomic acceptance/uncertain-commit protocol open |
| F02 — Rolling deploy during active Run | Runtime/domain / API and workers / delegated workload | D immutable Run and owned operation state; V local segment/stream. In-flight effects may be unknown | Drain API, refresh streams, reconnect Run; worker routing separate, no latest launch rewrite | New attempts current policy/Approval; compatible schema/API/event/worker versions required; drain and claim fencing gate |
| F03 — Old worker handles old workflow | Workflow/operation owners / old worker / narrow worker identity | D engine history/config/owner facts; V replay cache. Replay is not a new effect | Retain compatible code, reconstruct coordination; fresh owner operation checks; deny unsupported strengthened obligations | Pinned code cannot retain stale authority; recover required version or reviewed compatible migration; routing/replay conformance open |
| F04 — PostgreSQL failover | Data/domain / data deployment / owner DB client | D acknowledged state subject to actual replication contract; V connections/transactions. Lost reply commit unknown | Reconnect boundedly; resolve transaction/logical operation before duplicate write; no fresh checks from stale replica | Trusted writer promotion/fence and current policy; verify checkpoint/loss/owner state; provider consistency/failover guarantees gate |
| F05 — DB unavailable | Domain/Security/Approval / application data / scoped workload | D prior accepted obligations; V pools/unfinished calculation. No new committed state presumed | Block dependent writes/current checks; durable wait only where custody can be established; optional explicitly safe read degraded | No stale allow/approval fallback; restore verified authoritative DB and restrictions; outage/cached-read policy gate |
| F06 — Temporal unavailable | Workflow/publication / engine and workers / admitted caller-worker | D owner facts/publication intent and available engine checkpoint; V SDK connection. Start/input acceptance unknown | Bounded retries/lookup same correlation; retain owner intent; no assumed new durable workflow. Running external jobs reconciled separately | Workflow not authority; recover engine before dependent continuation; hosting recovery and input acknowledgement gate |
| F07 — Execution capacity exhausted | Execution/budget / scheduler/provider / assigned management identity | D accepted Job responsibility where capacity reserved; V pending local request. Not started only if evidenced | Reject/defer within bounded queue, preserve accepted custody and safety capacity; no host fallback | Tenant fairness/current start checks; restore admitted capacity; quotas and overload disposition gate |
| F08 — Sandbox crashes | Execution/Tool / Job environment / management versus Job identity | D Job/Attempt/source/provider mapping; V process/files not retained. Effects/population may be unknown | Observe provider and external target; refuse blind restart; extract only stable permitted outputs | Strong isolation intact; quarantine suspect environment and restore evidence/controls; population/status/idempotency contract gate |
| F09 — Cleanup fails | Execution / provider/reaper / independent cleanup duty | D orphan/teardown obligation; V transport. Cleanup and effects independent, possibly unknown | End bounded caller wait honestly; keep quarantine/destruction/reconciliation responsibility, never reuse | No added business permissions; verify population/access removal before reuse; cleanup confirmation and incident mechanism gate |
| F10 — Provider timeout after possible effect | Tool/resource / adapter/provider / bound external principal + delegated workload | D operation/attempt/use/dispatch; V response. External effect unknown | Stop blind mutation retries; lookup same provider/target identity; reconcile partial/performed/not-performed | Current read/recovery authority and approval use not replenished; authoritative provider recovery; idempotency/status horizon gate |
| F11 — AI provider unavailable | Model/disclosure / AI adapter / eligible provider account | D request/budget/Run refs; V generation stream. Inference/disclosure/charge unknown by attempt | Optional context visibly omitted or required Run waits/fails; bounded safe retry charges separately; no unadmitted fallback | Current recipient/data eligibility; recover provider/account or separately admit alternative; quotas/terms/billing gate |
| F12 — Tool provider unavailable | Tool/workflow / adapter / scoped represented actor | D operation/intent/wait; V session. Prior possible send retains unknown | Durable bounded wait/refusal; reconcile before dispatch retry; no broader adapter/credential fallback | Current provider admission/Approval; restore operation contract and pending responsibility; availability/retry budgets gate |
| F13 — Mandatory audit custody unavailable | Audit/action owner / custodian / authenticated producer | D local evidence/intent if adequate; V exporter. Business effect distinct from receipt uncertainty | Block selected pre-action-gated work; recover same semantic custody ID; retain post-effect obligations if already sent | No diagnostic substitution or universal shutdown; establish required durable boundary; risk-specific acknowledgement/independence gate |
| F14 — Telemetry unavailable | Observability/business owners / pipeline / producer/query identities | D required audit separate; V diagnostics may be lost. Missing telemetry proves no effect absence | Degrade diagnostics, bound/drop explicitly, continue independent allowed work; restore coverage | No raw payload emergency dumping; recover diagnostics/custody separately and report gaps; buffer/loss/fallback policy gate |
| F15 — Secret rotated during operation | Credential/Tool / resolver/adapter / eligible workload | D credential version/operation refs without value; V live secret. Old accepted call may continue | Revalidate new calls; do not resend mutation with new key blindly; reconcile old attempt | No broader fallback; verify issuer/provider overlap/revocation and expose limits; lifecycle/current-use guarantee gate |
| F16 — Workload identity revoked | Security/Execution/Tool / affected workload / now-restricted principal | D restriction/fence/operation history; V cached credential. Already-running effect unknown | Block new affected use, request bounded containment; observe receiver fences/population, do not assume stopped | Separate safety duty only; restore trusted identity/current state before resume; propagation/offline fencing gate |
| F17 — Object store unavailable | Artifact/domain / object custody / narrow storage client | D metadata/publication intent; V partial transfer. Upload/read availability unknown | Block required artifact completion; bounded resumable same-object reconciliation if supported, optional output degraded | No foreign object fallback; recover required content/integrity/current access; upload-metadata atomicity substitute and orphan policy gate |
| F18 — Backup restored | Data/DR and all owners / recovered stores / governed operator | D older checkpoints, external newer facts; V caches untrusted. Post-checkpoint effects unknown | Restrict serving/dispatch; apply current restrictions/tombstones; reconcile uses/messages/attempts before resumption | No resurrected Approval/authority/content; verify keys/config/stores/invariants and coverage; restore protocol/targets gate |
| F19 — Region loss | DR/capability owners / regional fleet/dependencies / recovery duty | D surviving backups/replicas under contract; V regional processes unreachable. Remote old jobs/calls may continue | Fail affected capabilities; activate reviewed recovery without simultaneous unsafe writers; reconcile unknown external dispatch | Current identity/secrets/admission/residency and Approval; recover whole dependency graph; region/continuity/RPO/RTO gate |
| F20 — Network partition | Claim/security/operation owners / API-worker-provider paths / scoped workloads | D accepted intent/claims; V channels. Liveness and external acceptance unknown | Deny new consequential use lacking current facts; observe/contain old attempts before replacement; no heartbeat-as-death | Receiver fences and independent deadlines; recover current ownership and effects, not only routing; partition exposure gate |
| F21 — DNS failure or rebinding | Network/Tool/Execution / egress / admitted workload or Job | D intent/destination policy; V resolver/connect state. Prior sends may be unknown | Refuse unvalidated endpoint; bounded permitted resolution, no unrestricted IP/redirect fallback | Protect metadata/private routes/audience; restore trusted resolution/connection binding; actual client/runtime enforcement gate |
| F22 — Deployment rollback | Release/domain/workflow / API-worker roles / governed deploy identity | D writes/history/approval uses remain; V new code removed. Effects not undone | Admit only compatible still-eligible old release; forward-fix when rollback unsafe; reconcile in-flight attempts | No vulnerable version/current-policy rollback; recover compatible code and owner state; compatibility matrix/cutover gate |
| F23 — Incompatible migration detected | Data/release/owners / schema/code / migration duty | D migration progress/current schema; V rollout plan. Partial DDL/writes depend on actual mechanism | Stop affected promotion/use, retain known progress, forward repair under review; no guessed destructive reverse | Least migration privileges/current owner invariants; restore safe compatible capability; locking/version/evolution protocol gate |
| F24 — Tenant floods system | Admission/budget/Execution / API-worker-job fleet / abusive scoped actor | D accepted tenant obligations; V incoming excess. Previously sent effects persist | Fair bounded refusal/defer, protect unrelated tenants and cleanup/governance capacity; no uncontrolled scale/retry | No cross-tenant budget/credential substitution; recover backlog without loss; aggregate quotas/fairness targets gate |
| F25 — Queue backlog grows | Publication/workflow/operation / relays-workers / scoped producer-consumer | D committed obligations/quarantine; V local buffers. Publication != processing/effect | Bound new admission/attempts, isolate poison keys, retain assigned responsibility; reconcile required targets | Current scope at retry, no DLQ disposal; restore capacity and compatible handlers; retention/dedup/age disposition gate |
| F26 — CI provenance fails | Release/Security / build-promotion / admitted builder/deployer | D source/build/artifact evidence; V candidate workspace. Candidate not trusted/promoted | Reject promotion; inspect lineage, rebuild from trusted inputs if authorized; no runtime adoption | Hostile PR code has no deploy identity; restore trusted pipeline/keys/artifact trust; attestation/integrity policy gate |
| F27 — AZ outage | Capability/data/engine operators / affected placement / operating duty | D covered replicated/persisted state; V lost instances. In-flight commits/dispatch unknown | Continue only covered capabilities on ready capacity; reconcile uncertain work, no HA claim for uncovered dependencies | Current identities and writer fences; verify data/engine/custody availability and restore gaps; provider/AZ dependency coverage gate |
| F28 — Split brain and duplicate dispatch risk | Claim/Tool/Execution/data / old-new fleets / separate authenticated workloads | D divergent checkpoint/claim/provider refs; V partitions. Same effect possibly sent twice | Suspend unsafe dispatch; establish one authoritative claim at covered receivers; reconcile provider/effect identities | DNS or lease alone insufficient; contain old workers/jobs/credentials and append conflicts; real fencing/idempotency protocol gate |
| F29 — Compromised execution provider reports success | Execution/Security/domain / provider/evidence channel / authenticated but suspect provider | D source/report/incident refs; V report stream. Effect/cleanup not confirmed by assertion | Suspend starts, quarantine outputs/environments; independently reconstruct/reconcile, no ordinary rerun | No artifact promotion or Run success from hostile text; restore admitted trusted controls; independent observation/incident gate |
| F30 — Sophia index starves governance DB | Sophia/data/Approval / shared store-worker roles / owner clients | D canonical/governance state and indexing intent; V candidates. Retrieval incomplete, no invented evidence | Bound vector/ingest demand and connections; optional retrieval degrade, fresh governance protected; extract only if measured need | Current access/source status before model, not stale fallback; recover resources/projection generations; contention/quality tests gate |
| F31 — DB/WAL or backup corruption | Data/backup/DR / data-backup units / restricted recovery operator | D surviving verified base/WAL/owner evidence; V failed query state. Post-checkpoint effects unknown | Stop unsafe serving, choose verified recovery point, restore and reconcile lost interval; replicas not presumed clean | Restrict backup access/current policy, retain incident gaps; verify archive chain and configuration/keys; detection/restore integrity gate |
| F32 — Identity/secret service unavailable during incident | Security/credential/incident / admission-resolver-admin / existing governed responder | D restrictions/duty/evidence; V unresolved login/secret. Running effects not proven stopped | No new unverifiable identity or ambient secret; narrow pre-established authorized containment only, otherwise unavailable | No hidden permanent superuser; recover trusted access and custody before dispatch; emergency authentication/custody/availability policy gate |

### Operations and validation gates

Before production, assign operating/custody owners and approved capability targets, then demonstrate actual startup/readiness, session/tenant/query boundaries, secret eligibility/revocation, worker coexistence/replay, duplicate and uncertain commits/dispatch, isolated Job process/egress/cleanup, artifact extraction, audit custody acknowledgements and bounded overload. Test F01–F32 at real boundaries including region/partition/restore and stale policy/Approval use. Mocked success cannot prove isolation, provider effects or restoration.

Observe capacity/backlog/wait age, DB connections and archive/backup health, version routing/drain, stale claims, unknown effects, orphan cleanup, artifact custody lag, provider quota/cost, audit pending/integrity gaps and diagnostic drop/cardinality. Health checks/readiness establish only specified dependencies and ability to serve/poll; they do not establish complete business correctness. Independent incident observation must not rely solely on the compromised producer where risk requires. No dashboards, probes, tests, alerts, limits or runbooks-as-executable-config are created here.

## 11. Evolution / Exit Strategy

Evolution is conditional, not inevitable. Every independent deployment needs a concrete owner-reviewed scaling, trust/security, failure, resource, availability, technology, release cadence, compliance/residency or operational ownership benefit. Evaluate new authenticated contracts, data consistency, cost/on-call, tracing/custody, migration, rollback/current authority and recovery seams against that benefit. Multiple logical owners or generic scalability slogans are insufficient.

| Candidate change | Evidence trigger | Safe transition / exit criteria |
| --- | --- | --- |
| Control module → independent service | Measured independent load, incompatible privileges/failure exposure, release/operating cadence, runtime or contractual isolation | Owned versioned contract, private-data migration, current PEP/delegation, durable publication and compatible consumers; one authoritative writer, reconcile pending effects before cutover |
| Worker group separation | Resource saturation, distinct credential ceiling, unavailable version coexistence or unacceptable API blast radius | Narrow identity/queue/routing, compatible owner operations, old-version drain and effect reconciliation; no extra domain takeover |
| Shared PostgreSQL → separated stores | Measured IO/connection/vector contention, independent availability/admin lifecycle, tenant/regulatory/residency requirement | Preserve canonical IDs/owner contracts, migrate permitted state and publication/dedup/custody without dual authority; verify backup/recovery and current access |
| Execution expansion | Admitted workload/hardware/OS/geography/stronger sensitivity or capacity requirement | Review each runtime/provider class and credential/egress/source/cleanup conformance; drain/reconcile old Attempts before changing provider, no unknown-effect rerun |
| Separate Sophia search/vector | Representative query quality/filtering or contention evidence that cannot be met economically | Rebuild derived eligible projections from surviving canonical sources; generation/tenant/tombstone checks, compare quality/cost and current exposure before cutover |
| Broker / cache | Concrete transport fan-out/delivery/lag or repeated expensive read requirement | Preserve ADR-005 semantics and current authorization; broker not truth, cache not permission; bounded recovery/dedup/privacy and operational ownership review |
| Independent audit custody | Producer/admin compromise, retention/independence or measured loss/reconstruction requirement | Named acknowledgement and protected failure/admin domains, stable evidence identity, permitted export/verification and correction/deletion; no false completeness from migration |
| Kubernetes | Existing supported platform or demonstrated fleet/routing/resource burden where operator benefit exceeds complexity | K2/K3 security/runtime readiness and release/DR conformance, staffed upgrades/incident plan; K4 still rejected |
| Dedicated tenants / additional region | Real regulatory/customer/residency/key/scale/noisy-neighbor/continuity requirement | Explicit supported tenant class and current access/claim/data/engine/effect-safe recovery; no split-brain or silent weaker policies |
| Managed ↔ self-hosted / provider exit | Contract, residency, control, cost or staffing changes supported by evidence | Exportable governed state/config/identity mappings and required custody, tested new controls/recovery; in-flight work stays attributed to original provider and reconciled |

Portable semantics include owner identities/meaning, historical attribution, current policy/Approval, source/provenance, event contracts, unknown effects and recovery responsibility. Infrastructure/API/live process state is not automatically portable. Review data export, extension/history compatibility, retained-version artifacts, key/identity control and exit costs before selection; do not build all adapters or multi-cloud orchestration in advance. Retiring resources/files still requires explicit authorization. Material changes to Accepted constraints require explicit supersession review.

## Post-ADR Architecture Readiness

ADR-012 is the final **currently planned foundation** architecture decision, not an exhaustive implementation specification. Foundation architecture is complete; scoped work below may begin only **after separate explicit human implementation authorization**. No skeleton, environment, schema or feature is started now. Future decisions need explicit owners; architecture-significant choices use reviewed ADRs, with no next-number placeholder created here.

| Future work category | Prerequisite decisions / smallest reviewable authorized scope |
| --- | --- |
| Repository/package skeleton | Discover actual bounded contexts/public contracts/inward dependencies and test meaningful fitness constraints; no universal Shared Kernel layout |
| Environment bootstrap | Supported platform, residency, operator roles, allowed provider accounts, production separation and validated hostile CI path |
| PostgreSQL schema/migrations | Owner data/transaction contracts, tenant enforcement/RLS decision, connections, compatibility, backup/restore and suppression; no preselected tables |
| Temporal integration | Hosting decision, supported SDK/service compatibility, workflow contracts, worker routing/coexistence, durable intent/handling and effect-safe retry |
| Security implementation | Human/workload identities/assurance, memberships/delegation/current policy/PEPs, enforcement/fencing and tenant/disclosure/incident requirements |
| Approval implementation | One representative operation/risk policy, exact envelope/channel/eligibility/quorum/use/consumption race, current enforcement and recovery |
| Tool gateway | One admitted provider/operation, external principal/credential scope, actual target conditions and unknown-effect reconciliation |
| Execution provider | One admitted strong isolation/workload path, source binding, readiness/egress/resources/population/artifact/secret/cleanup conformance |
| Sophia storage/retrieval | Permitted canonical/provenance models and structured/lexical baseline, current access/deletion; vector/embedding choices only with query evidence |
| Observability instrumentation | Bounded trusted propagation, fields/cardinality/data disclosure and diagnostic loss; no sampled trace as sole audit |
| Audit custody/reconstruction | Risk-specific evidence/acknowledgement/independence, integrity trust anchors, query scope and actual retention/privacy/disposal obligations |
| Virtual Office frontend | Relevant web architecture/framework/rendering decision, authenticated review presentation, session/streaming/disclosure contracts; TypeScript expectation preserved, React/Next.js not selected |
| CI/CD and infrastructure-as-code | Trusted build/provenance/promotion/deploy identity, platform/IaC/registry/secret/rollout decisions and compatibility; no vendor selected |
| Integration/security tests | Real tenant/PEP/custody/provider boundaries for the authorized feature, denied disclosure/dispatch and duplicate/uncertain effects |
| Chaos/recovery tests | Owner-approved capability targets and isolated test conditions, verified backups/current restrictions/Approval/effect restoration; no production fault injection implied |

Unresolved implementation records may be needed for identity/policy/tenant isolation, secret custody/key recovery, Temporal hosting and version behavior, execution provider, web architecture, evidence custody/privacy/integrity, PostgreSQL physical/schema evolution, transport/Outbox relay, provider contracts, cloud/runtime/IaC and HA/DR/capacity targets. These are categories, not created ADRs or reopened foundation decisions. Foundation acceptance does not select every product or authorize building a generic enterprise platform.

## 12. Development Constitution Compliance

Complete governance/Accepted ADR reads, inventory and deployment searches precede the byte snapshot and documentation edits. The explicit human project-owner approval authorizes documentation-only acceptance of this record and four directly supporting status/navigation/scope documentation changes. Accepted ADR-001–011, constitution and principles are preserved. No final contexts/package layout, Shared Kernel or convenience runtime language is introduced. Go remains primary core/backend; TypeScript remains expected for the web subject to its decision; Python needs specialized justification.

The proposal preserves modular control-plane ownership, inward public contracts, immutable Run attribution and orthogonal lifecycle/wait/stop/outcome/effects; Temporal infrastructure and Workflow-not-authority; reliable owner intent/dedup and non-atomic DB commit plus Signal; Sophia's non-authoritative canonical/derived distinction; Tool governance; stronger hostile execution; current identity/tenant/delegation/Approval; and observability separate from durable audit. Terminal Run retries remain new linked Runs. Runtime lifecycle remains `Created → Queued → Running → Waiting → Queued → Running → Finished`, including direct `Running → Finished`.

External facts, architectural requirements/inferences and unresolved choices are labeled separately. Document verification concerns metadata, sections, links, coverage, change scope and byte preservation; it cannot establish production enforcement. No source, manifest/dependency, schema/migration, Dockerfile/Compose/Kubernetes/Helm, IaC/CI/workers/API, secrets/environment, infrastructure/resources or implementation tests are created. No deletion. Status is Accepted with explicit human project-owner architecture approval dated 2026-10-06; stop for review, not implementation.

## 13. Related Decisions

| Binding record | Constraint preserved |
| --- | --- |
| [Development Constitution](../../DEVELOPMENT_CONSTITUTION.md), [principles](../architecture/principles.md) | Explicit human authority, minimal evidence-based changes, no unauthorized implementation/deletion |
| [ADR index](README.md), [architecture context](../architecture/ARCHITECTURE.md) | Accepted navigation/scope and remaining unknowns |
| [ADR-001](ADR-001-core-programming-language.md) | Go primary; web TypeScript expectation; no convenience language addition |
| [ADR-002](ADR-002-architecture-style.md) | Modular Monolith, evidence-driven extraction, inward owner contracts, no implicit Shared Kernel; logical/process/deployment distinct |
| [ADR-003](ADR-003-agent-runtime.md) | Agent Instance not authority; immutable launch attribution; Runtime identity/lifecycle/orthogonal outcomes and linked terminal retries |
| [ADR-004](ADR-004-workflow-engine.md) | Temporal infrastructure; Workflow not authority; no automatic Run == Activity; deterministic code and release compatibility; hosting analyzed but unresolved |
| [ADR-005](ADR-005-event-architecture.md) | Owned communication, Outbox/Inbox patterns, stable identity/dedup, unknown effects; DB commit + Signal non-atomic; no initial broker/default Event Sourcing |
| [ADR-006](ADR-006-memory-architecture.md) | Sophia governed knowledge, external owner truth, derived pgvector, current access/provenance/deletion; broader application-data store accepted only through ADR-012 |
| [ADR-007](ADR-007-mcp-tool-architecture.md) | Owned Tool operation/admission/current credential/target/effect boundaries; MCP/provider content not authority |
| [ADR-008](ADR-008-sandbox-execution.md) | Dedicated stronger hostile-code protection and bounded source/Job/Attempt/process/files/network/secret/output/cleanup semantics |
| [ADR-009](ADR-009-security-isolation.md) | Current trusted identity/tenant/resource/delegation, PEP/fencing, credential ceiling and independently governed duty/incident controls |
| [ADR-010](ADR-010-human-approval.md) | Immutable review/decisions, current usability/consumption/binding, risk-specific human eligibility and effect-safe use/recovery |
| [ADR-011](ADR-011-observability-audit.md) | Diagnostic signals != audit; actual custody and authorized reconstruction, honest effects/provenance/privacy/suppression and bounded pipelines |

No Accepted ADR is modified. Historical deferred references in those records are preserved, not rewritten as deployment acceptance. No new architecture decision beyond ADR-012 is started.

## 14. Evidence / References

Primary sources inspected **2026-10-06**. Facts below support mechanism distinctions only; topology recommendations, boundary requirements, invariants and failure responses are **NEXORA architectural inferences/requirements** under the owner handoff and Accepted constraints. Actual providers, supported releases, installed compatibility, isolation conformance, cost, capacity, recovery/SLO and legal obligations remain **unresolved**. Recheck selected versions/contracts before separately authorized implementation. No deployment or runtime tests have been run.

| Reference / primary source | Verified external fact used | NEXORA inference / unresolved choice |
| --- | --- | --- |
| E1 — [Temporal self-hosted guide](https://docs.temporal.io/self-hosted-guide), [production checklist](https://docs.temporal.io/self-hosted-guide/production-checklist) | Production operation includes persistence/security/monitoring/upgrades, capacity and recovery work; local development facility is separately described | Self-hosting needs staffing/evidence; no server/store/config/version selected |
| E2 — [Temporal Worker Versioning](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning) | Distinguishes Pinned and Auto-Upgrade, version coexistence/routing; ordinary rolling replacement is documented as incompatible with this Worker Versioning model | Compatible releases/coexistence required, exact supported mechanism/version/type behavior remains a gate; no Kubernetes Controller adoption |
| E3 — [Temporal Cloud guide](https://docs.temporal.io/cloud) | Documents separate security, connectivity, service availability/regions/limits, account, usage and recovery subjects | Compare actual contracts and obligations; not a selected hosting provider or NEXORA uptime/DR guarantee |
| E4 — [PostgreSQL continuous archiving/PITR](https://www.postgresql.org/docs/current/continuous-archiving.html), [standby servers](https://www.postgresql.org/docs/current/warm-standby.html) | Base backup plus required continuous WAL enables covered recovery; DB WAL does not restore manually edited configuration; standby/replication have their own consistency settings | Verify full application/dependency restore, current restrictions and effects; no backup tool, mode, retention, replica count or PostgreSQL version chosen |
| E5 — [OpenTelemetry Collector deployment](https://opentelemetry.io/docs/collector/deploy/), [resiliency](https://opentelemetry.io/docs/collector/resiliency/), [security](https://opentelemetry.io/docs/security/) | Agent/gateway patterns documented; persistent sending queues can recover some restarts but overflow, disk and retry failures can still lose data; Collector security includes sensitive data/tamper/DoS | Minimal bounded diagnostic transport, separate explicit audit custody; no Collector deployment, durable queue extension or broker selected |
| E6 — [Kubernetes multi-tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/) | Shared cluster control isolation does not solve all node/data-plane threats; container sandboxing can add VM or userspace-kernel environments | Ordinary Pods cannot satisfy ADR-008 by definition; no cluster/runtime selected |
| E7 — [Kubernetes NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) | Enforcement depends on network implementation, with node/loopback and existing-connection behavior limitations | Actual egress/metadata/SSRF readiness and separate current authorization required; no network policy/plugin chosen |
| E8 — [OCI Linux runtime configuration](https://github.com/opencontainers/runtime-spec/blob/main/config-linux.md) | Defines namespace, resource and security configuration surfaces; unspecified namespace types can be inherited | Configuration names do not prove hostile-code conformance; no OCI runtime/profile selected |
| E9 — [gVisor security model](https://gvisor.dev/docs/architecture_guide/security/) | Application system interface is interposed with restricted host interactions; network/resources/hardware risks remain | Candidate isolation family, not universal VM ranking or selected gVisor; workload/host controls require verification |
| E10 — [Firecracker production host setup](https://github.com/firecracker-microvm/firecracker/blob/main/docs/prod-host-setup.md) | Production guidance requires jailer or equally restrictive process constraints and host/resource security measures | VM boundary alone not a complete Execution Contract; no Firecracker/hypervisor/provider selected |
| E11 — [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) | Discusses scoped secret lifecycle and delivery risks; environment values can be accessible to processes and appear in logs/dumps | Purpose-bound resolution and minimum delivery, absent hostile secrets by default; no store/delivery mechanism or guarantee selected |
| E12 — [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) | Discusses destination validation, DNS and redirect defenses | Actual connection/non-HTTP sandbox coverage must be verified; no proxy/network product selected |
| E13 — [NIST SP 800-34 Rev. 1](https://csrc.nist.gov/pubs/sp/800/34/r1/final) | Published contingency-planning guidance addresses recovery requirements/priorities and relationships to resilience/incident planning | Capability-driven recovery and verified restore rather than backup success alone; no federal compliance or numeric targets inferred |
| E14 — [NIST SP 800-190](https://csrc.nist.gov/pubs/sp/800/190/final) | Published guide addresses security concerns of OS-virtualization application packaging | Container adoption requires actual security review, not assurance from a label; no certification claim |

Repository evidence: explicit ADR-012 owner handoff; complete governance/Accepted ADR reads; relevant file inventory; deployment-topic `rg` search; outside-repository pre-edit byte snapshot. The exact final diff and verification evidence are reported at completion. This ADR is Accepted with explicit human project-owner architecture approval dated 2026-10-06; foundation completion remains separate from implementation authority.
