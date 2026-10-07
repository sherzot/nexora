# ADR-002 — Architecture Style

- Status: **Accepted**
- Proposed: 2026-10-04
- Decision authority: human project owner
- Approval date: 2026-10-04
- Approval evidence: explicit human project-owner approval in this conversation: "I approve ADR-002 — Architecture Style, with one additional architectural clarification." Acceptance includes the No implicit Shared Kernel invariant requested in the same message.
- Decision: modular monolith for the initial control plane, with evidence-driven extraction
- Constraint: [Accepted ADR-001](ADR-001-core-programming-language.md); Go is the primary core and execution-facing backend language
- Scope: topology and architectural invariants; not final bounded contexts, package layout, schemas, runtime/workflow design, or deployment configuration

## 1. Context

NEXORA coordinates an engineering organization performing real controlled work. Its capabilities include the Virtual Office, agent organization, project/task coordination, agent runtime, workflow orchestration, sandbox/execution management, Sophia knowledge and memory, MCP/tools, external integrations, approvals, authorization, audit, and observability. These are capability names, **not accepted bounded contexts or a one-capability-per-service mapping**.

Verified repository evidence on 2026-10-04: seven Markdown documents were present before this task; no source, manifests, schemas, deployment files, or executable architecture checks existed. The constitution, agent instructions, ADR index, accepted ADR-001, and all architecture documents were re-read. Several overview files still describe ADR-001 as Proposed and prohibit ADR-002 under the earlier bootstrap scope. The owner's current instruction authorizes this proposal and supersedes that scope restriction; navigation/status text is synchronized without changing ADR-001.

ADR-001 fixes Go as the primary language and requires justification for additional runtime languages. TypeScript is expected for the web layer subject to its decision; Python is conditional on specialized technical/ecosystem needs. Nothing in the topology analysis invalidates that decision. It is not reopened.

Unknown: tenancy and threat model, workload/resource profiles, latency and availability objectives, recovery targets, compliance, staffing, team ownership, and independent release needs. There is no measured need for separately deployed control-plane services. Absence of evidence is not proof that distribution will never be needed. Security-sensitive execution is a distinct concern and cannot wait for a scale benchmark.

## 2. Problem

Select an initial control-plane architecture that supports coordinated agent work and human governance while preventing private-state coupling, arbitrary data access, and eventual distributed-monolith behavior. Preserve the ability to isolate execution without selecting its implementation now.

## 3. Decision Drivers

1. Enforce business policy, authorization, and ownership across agent/workflow/tool paths.
2. Separate untrusted or privileged execution from control-plane trust as required by the threat model.
3. Make lifecycle and approval coordination understandable and testable without unnecessary network boundaries.
4. Keep uncertain domain boundaries revisable at low cost.
5. Limit infrastructure and operator burden while retaining demonstrable extraction paths.
6. Respect Go idioms and accepted language policy; avoid framework-driven ceremony.

No benchmark or staffing estimate supports a numeric score. Review scenarios: an internal refactor must preserve another module's public contract; a new feature must not read another owner's tables; invalid authorization must prevent side effects through every entry path; a worker failure must have an explicit recovery outcome; extraction must not require shared writes or synchronized releases. These are proposed acceptance scenarios, not passed tests; timing/capacity targets await later ADRs.

## 4. Considered Options

The terms below are operational definitions for this comparison, since “distributed modular architecture” has no single topology implied by this handoff.

1. **Modular monolith:** control-plane modules are composed into a shared deployable application with explicit APIs and private implementation/data ownership. It may have multiple replicas; monolith does not mean one machine.
2. **Microservices from the beginning:** capability services have separate deployments, contracts, and authoritative data access from initial implementation.
3. **Distributed modular architecture:** a small number of coarse deployables group related modules, selected before operational evidence establishes those deployment boundaries. Each deployable can itself be modular.
4. **Hybrid/evolutionary architecture:** begin with a modular control plane and add only justified process/deployment boundaries. This is an evolution strategy, not an excuse for ad hoc mixtures or a separate domain modeling method.

## 5. Decision

**ACCEPTED: start the NEXORA control plane as a modular monolith, with selective DDD, inward dependency rules, and vertical slices at the application/use-case level. Evolve into independently deployable components only through justified architecture decisions.**

This combines option 1 as the initial control-plane topology with option 4 as its evolution policy. It does not mandate that workflow workers, agent runtimes, or untrusted execution share the control-plane process. In-process execution of hostile repository code is not authorized. Necessary isolation may be required from the first execution feature; its mechanism belongs to ADR-008/009 and deployment mapping to ADR-012.

The recommendation is conditional on subsequent threat and operational analysis: if the control-plane process must itself cross incompatible trust/compliance boundaries, review this decision through the ADR process rather than forcing co-location. No such incompatibility is established by current evidence. Accepted on 2026-10-04 with explicit human project-owner approval recorded above. This acceptance does not authorize implementation.

## 6. Detailed Design

### 6.1 Independent architecture dimensions

| Dimension | Proposed use | Does not imply |
| --- | --- | --- |
| System topology | Modular control plane; justified extraction | Every agent is a service |
| Domain decomposition | Bounded contexts where language, policy and ownership differ | Every context has a process or database |
| Dependency discipline | Core policy independent of external mechanisms | Interface for every type |
| Use-case organization | Cohesive vertical slices where helpful | Slice may bypass owner policy |

A domain boundary defines meaning and invariants. A process/runtime boundary defines execution and failure containment. A deployment boundary defines release and operational lifecycle. One bounded context can span processes; one deployable can host several contexts. Their mapping must be explicit, not assumed.

### 6.2 Selective DDD

Future domain discovery must examine competing vocabulary, invariant ownership, consistency needs, change patterns, and trust boundaries before assigning contexts. Organization/coordination, execution lifecycle, approvals/policy, and Sophia are areas to investigate, not frozen module names. The Virtual Office can consume read models without becoming a separate business context; audit and observability can be cross-cutting mechanisms while their policy/retention ownership still needs definition.

| Pattern | Use when justified | Avoid |
| --- | --- | --- |
| Bounded context | A distinct model/language and policy owner exists | Mechanical capability-to-context mapping |
| Entity | Identity and lifecycle matter across changes | Identity attached to transient data without need |
| Value object | A value carries validation/equality semantics | Wrapping every primitive ceremonially |
| Aggregate | A real consistency boundary protects related invariants | One aggregate for the whole workflow or every table |
| Domain service | Important domain behavior spans concepts and fits no entity/value | Generic services housing all business rules |
| Domain event | A meaningful business fact has occurred | Treating every field update as public integration contract |
| Application use case | Coordinates authorization, domain behavior and side effects | Reimplementing invariants in handlers |
| Repository/port | Persistence or external boundary needs protected domain semantics | Generic CRUD repository/interface for every object |

For example, acceptance of an approval must enforce its eventual binding/validity policy in the owning domain, not just an HTTP handler. The actual aggregate and policy are deferred to ADR-010. Simple read-only/query adapters need not acquire elaborate domain objects. Avoid both anemic policy models and artificial rich models.

### 6.3 Modules and dependency boundaries

Before a module is implemented, record its accountable ownership role, responsibility, public operations/contracts, authoritative state, permitted dependencies, transaction rules, and applicable trust constraints. Staffing names can follow later. A folder alone is not a module.

Public APIs expose use-case semantics and validated data, not another module's mutable entities, repositories, SQL handles, transactions, or SDK types. Private behavior stays private. A caller uses the owner's public operation; a coordinating application use case must not become a backdoor to private storage. Record the allowed directed dependency graph and reject cycles. If a cycle arises, reconsider ownership or move orchestration to an explicit coordinator rather than hiding it behind an event bus or generic shared package.

Core domain policy must not import HTTP, database implementations, Temporal, MCP, LLM/cloud SDKs, UI frameworks, or sandbox implementations. Adapters depend on inward contracts. Application use cases coordinate policy through boundaries; explicit composition supplies concrete adapters. Interfaces are warranted for real ownership, substitution, testing, or trust boundaries. Direct concrete calls are acceptable within a cohesive module when no such need exists. Keep shared code limited to policy-neutral utilities; shared entities or a universal “platform service” must not erase ownership.

### 6.4 Idiomatic Go enforcement

Use packages for cohesive responsibilities, unexported identifiers for private package implementation, and deliberate exported APIs. A Go module is a dependency/versioning unit, not automatically a DDD context. No final package tree or number of Go modules is selected.

The Go specification rejects direct/indirect package self-imports [S1]. This prevents import cycles, not semantic cycles through callbacks, data access, or event routing. `internal/` limits imports to the parent subtree [S2]; a single repository-root `internal/` does **not** isolate sibling business modules. Future layout must combine suitable nested boundaries with explicit import rules. Exporting a symbol does not make it an approved cross-module API.

Prefer small consumer-owned interfaces where appropriate and explicit constructor/composition wiring. Do not add a dependency-injection framework to imitate Spring. Avoid repetitive domain/application/infrastructure folders and interfaces where they obscure a small cohesive package. Architectural intent must be enforceable with compiler constraints plus graph/rule checks, not naming conventions alone [S1–S3].

### 6.5 Data and transaction ownership

If a shared PostgreSQL deployment is later chosen, logical ownership still applies. Each authoritative table/schema has one module owner; its migrations and writes go through that owner. No final schema or database selection is made here.

- Cross-module writes use owner operations, never direct SQL, shared repositories, or mutable ORM objects.
- Cross-module reads use owner query contracts or purpose-built projections. Read-only access is still coupling and can breach tenancy.
- Reporting uses an explicitly owned projection/read model with documented freshness, authorization, and retention. Any direct multi-owner reporting view requires reviewed contracts and a recorded exception; it does not grant arbitrary table access.
- A use case normally has one transaction owner and keeps invariants inside that ownership boundary. Public contracts must not leak transaction handles.
- A truly atomic invariant spanning owners requires a recorded consistency analysis before implementation: reconsider the boundary, or explicitly approve a coordinated transaction through a narrow composition facility while owners retain writes. Such an exception must document participating operations, failure behavior, and extraction constraints. Do not silently create a universal unit of work or default to distributed transactions.
- Non-atomic coordination needs explicit partial-failure/compensation behavior. Async delivery is not automatically preferable, and no saga/workflow technology is selected here.

Extraction must migrate authoritative data access so separate services do not keep sharing mutable tables. Logical ownership helps preparation; it does not make extraction free.

### 6.6 Communication semantics

| Mechanism | Initial role | Required boundary |
| --- | --- | --- |
| Direct in-process call | Immediate owner use-case/query interaction when response is needed | Public contract; explicit error/deadline and transaction semantics |
| Application port/contract | Cross-owner or external dependency where decoupling has value | Consumer needs and owner semantics; no SDK/private-state leakage |
| In-process domain event | Local business fact for explicit internal reactions | Define ordering, transaction timing and failure handling; not durable by default |
| Durable integration event | State change must reach another process/system despite restart | Persistence/delivery coordination, idempotent consumers, evolution and recovery; ADR-005 |
| Workflow signal | Input to a durable workflow if an engine is selected | Workflow identity, permission and engine semantics; ADR-004/005 |
| External event | Untrusted integration/webhook input | Authentication, replay handling, tenant attribution and translation; ADR-007/009 |

A goroutine/channel or local event handler is not durable delivery. Internal domain events are not automatically stable public integration events; adapters translate when necessary. Do not claim exactly-once external effects. If a committed change must reliably cause an external effect, resolve the commit/delivery gap before implementing it; an outbox is one candidate for ADR-005, not selected here. No broker is selected or needed merely to label this architecture event-driven. Avoid hiding synchronous chains or dependency cycles behind events.

### 6.7 Architectural invariants

These rules are accepted; enforcement is not implemented.

1. **One authority:** every business fact, invariant and persistent dataset has an explicit owner; the Virtual Office is a projection/interaction layer, and Sophia retrieval does not grant execution authority.
2. **Public boundaries:** cross-module access uses declared APIs/contracts; private state, repositories and arbitrary cross-owner SQL are prohibited.
3. **Inward dependencies:** core policy remains independent of external transports, storage, providers, workflow and execution implementations.
4. **Acyclic composition:** allowed imports and semantic coordination are explicit; no hidden cycles or shared-domain dumping ground.
5. **Owned consistency:** every use case names transaction/consistency ownership and partial-failure semantics; cross-owner atomicity needs prior reviewed justification.
6. **Policy on every path:** slices, background jobs, events and tools cannot bypass domain invariants, tenant authorization or approval enforcement. Relevant execution boundaries must independently enforce their permitted action.
7. **Honest delivery:** distinguish calls, local events, durable events, workflow signals and external inputs; specify idempotency/recovery when effects can repeat.
8. **Trust before convenience:** topology grants no security isolation; hostile/privileged execution needs threat-appropriate isolation before use, even at initial scale.
9. **Evidence before distribution:** extraction needs a recorded driver, owned contracts/data and operational readiness, not codebase size or agent count.
10. **Fitness before completion:** future implementation adds appropriate boundary checks and behavior/security verification; exceptions are explicit and reviewed, never silently waived.
11. **Language discipline:** retain Go as primary core/backend language; added runtimes need ADR-001-compliant technical/workload justification.
12. **No implicit Shared Kernel:** cross-domain concepts MUST NOT be moved into `shared`, `common`, `core`, `platform`, `utils`, or equivalent packages merely to enable reuse.

A Shared Kernel containing domain semantics requires explicit architectural justification, clearly identified ownership, consumers, compatibility/change rules, and review.

Policy-neutral technical utilities may be shared when they contain no domain authority or business semantics.

Do not centralize entities, value objects, repositories, domain services, authorization policy, or business rules merely because multiple modules contain similarly named concepts.

Two bounded contexts may intentionally use separate models for similarly named concepts when their semantics or invariants differ.

Prefer small, intentional duplication over accidental domain coupling when the concepts are not genuinely the same model.

This invariant strengthens ownership and bounded-context rules without defining final bounded contexts or package layout.

Vertical slices may colocate commands/queries, handlers, validation, DTOs and tests. They still call owner domain behavior, enforce authorization, respect transaction rules, and share genuine domain policy rather than becoming duplicated mini-applications. Domain objects cannot import transport DTOs just to improve colocation.

## 7. Alternatives Analysis

This is a qualitative assessment based on the owner handoff and observed absence of implementation/operational evidence, not measured performance.

| NEXORA concern | Modular monolith | Microservices initially | Distributed modular initially | Hybrid/evolutionary |
| --- | --- | --- | --- | --- |
| Agent/task/approval coordination | Local contracts avoid network hops while ownership is discovered | Cross-service approval/task transitions require partial-failure policy immediately | Fewer remote seams, but early grouping may misplace invariants | Local initially; split only after consistency boundaries are understood |
| Sophia vs execution ownership | Private models/APIs prevent knowledge from becoming execution authority | Independent data/service lifecycle possible; query and freshness contracts needed early | Coarse knowledge/execution separation possible but unproven | Extract if retrieval scaling, retention or isolation demands it |
| Runtime/workflow/execution | Shared control-plane failure/resource domain unless execution is separated appropriately | Service processes help containment; do not sandbox hostile commands by themselves | Can separate coarse worker/control groups early | Separate when security requires; scale-driven separation needs measurements |
| Boundary discovery and delivery | Refactoring local APIs costs less than moving deployed contracts/data | Premature boundaries add migrations/versioning/release coordination | Fewer contracts than fine-grained services, still uncertain grouping | Maintains optionality but requires enforcing seams from day one |
| Operations/local development | Fewer control-plane deployables; external tools still fail | Multiple services, networks, credentials and recovery procedures | Intermediate burden and risk of synchronized deployment | Burden grows only with justified splits; migration work remains |
| Tenant isolation/blast radius | Modules cannot contain a compromised process or broad DB credential | Can narrow identities/network/data permissions if actually configured | Can separate trust classes if boundaries fit | Threat-driven split may precede load-driven split |
| Independent scaling/releases | Shared release and resource allocation can become bottlenecks | Supports independent lifecycle if contracts/data permit it | Coarse scaling/release units | Extraction gate turns observed bottlenecks into targeted change |

**Why modular control plane wins this proposal:** project/task/approval coordination and uncertain domain boundaries favor simpler local consistency and debugging. No current evidence establishes independent control-plane scaling, release cadence, availability classes or teams. Go supports package composition without selecting a framework. These reasons are specific to current NEXORA evidence, not a claim that monoliths always cost less.

**Challenge from microservices:** a verified regulatory separation, independently staffed owner, materially incompatible availability requirement, or resource/security boundary can justify distribution immediately. Security-sensitive workers are the strongest present reason to investigate separation. This does not establish that every control capability should be a service.

**Challenge from coarse distributed modules:** separating a control plane, knowledge subsystem and workers could fit future operational needs. Without ownership/consistency discovery, that grouping can produce shared data, chatty synchronous chains and coordinated deployments—a distributed monolith. The evolutionary proposal permits a justified coarse split without freezing one now.

**Evolutionary risk:** “extract later” fails when APIs leak state or transactions cross every module. The invariants and extraction gate are therefore part of the recommendation, not optional cleanup. It is not a promise of effortless service conversion.

## 8. Consequences

### Positive

Local coordination and fewer initial control-plane deployments reduce the number of remote failure boundaries to design now. Explicit ownership and contracts make revisions and focused tests possible. Topology remains compatible with isolated execution and accepted Go language policy.

### Negative

Control-plane modules initially share release cadence, process failure exposure, and resource contention. Boundary checks require deliberate maintenance. Separate execution remains a security/operational responsibility. Extraction can require significant data and transaction redesign.

### Risks

An unstructured monolith can form through arbitrary imports, SQL and shared entities. A distributed monolith can form through shared mutable data, synchronous cycles, coordinated releases and unowned contracts. Overengineering can slow delivery through artificial aggregates, interface proliferation and premature event infrastructure. These risks motivate invariants and fitness checks; documentation alone does not mitigate them in a running system.

## 9. Security Considerations

A modular monolith is not tenant or privilege isolation. Package boundaries organize trusted code; they cannot stop malicious code in the same process from using available memory, files, network, or credentials. A shared DB credential can expose every tenant/module despite logical ownership. Future designs must enforce tenant/resource attribution, authorization and least privilege at application and relevant data/execution boundaries.

Separate control-plane authority from untrusted execution. Sandbox workers must not inherit unrestricted control-plane credentials or network reachability. Approvals need action/target binding and enforcement before effects, not only UI confirmation. Tool/model/repository/retrieved input is untrusted. Secret access, network policy, sandbox strength, worker identity, revocation, audit retention and blast-radius controls remain ADR-007–010/012 work and prerequisites to corresponding features.

Audit records require an explicit owner and integrity/privacy policy; observability must not log secrets or private chain-of-thought. No runtime security controls are implemented or verified here. An isolation/compliance requirement may invalidate co-location and trigger topology review before implementation.

## 10. Operational Considerations

Early distribution adds network and partial failures, timeout/retry budgets, idempotency, distributed tracing, eventual-consistency handling, contract/version management, deployment coordination, local-development orchestration, infrastructure provisioning, telemetry and operational staffing. Those costs are justified when the required isolation or independence exceeds them; NEXORA has no current quantitative evidence establishing that tradeoff for the entire control plane.

The monolith still faces external network failures, provider/tool failures, concurrency contention and shutdown/recovery problems. It must not retry external effects blindly or treat a local transaction as an external transaction. Workflow workers may need durable recovery; agent runtime may need long-lived sessions; sandbox workers may need different resource/privilege classes. ADR-003/004/008/012 decide their process mapping and mechanisms.

### Proposed architecture fitness mechanisms

| Mechanism | Future evidence required | Limitation |
| --- | --- | --- |
| Compiler/package visibility and suitable `internal/` boundaries | Build and package-boundary checks pass | Does not enforce every allowed dependency or DB access |
| Dependency graph allowlist | CI compares import graph, obtainable via `go list`, against owner rules | Tool/rule implementation is not selected or added here |
| Domain import checks | Reject external mechanism SDKs in core policy | Must include transitive/indirect coupling review |
| Module API/ownership review | API/data/transaction owner recorded for each module and change | Human review alone is insufficient enforcement |
| Architecture/security integration tests | Cross-owner access and unauthorized side effects fail; sanctioned APIs work | SQL ownership and tenant guards need actual boundary tests |
| Contract/failure tests | Compatibility, duplicate inputs, cancellations and partial outcomes covered | Mocks alone do not validate deployed behavior |
| CI and exception review | Rule failures block merge; justified exceptions have owner approval and review conditions | No CI exists in this documentation-only scope |

Inspect dependency visibility and semantic cycles as well as compiler cycles. Data ownership may eventually use permissions, migration checks and query review; actual mechanisms depend on schema/tenancy decisions. No tooling/dependencies are installed now.

## 11. Evolution / Exit Strategy

An extraction proposal must identify a concrete driver and evidence; “microservices because the project became large” is insufficient. Security requirements can justify separation without waiting for a production incident.

| Signal | Evidence needed to justify review |
| --- | --- |
| Independent scaling/resource profile | Representative measurements show a module workload violates an agreed resource/latency budget and targeted scaling improves it |
| Security/isolation or compliance | Threat model or obligation requires distinct privileges, data locality, network or execution trust |
| Fault containment/availability | Failure analysis or incidents show shared fate breaches agreed recovery/availability requirements |
| Deployment cadence | Recorded change/release coupling blocks independently needed releases despite compatible contracts |
| Ownership/team boundary | Accountable team needs independent operations and can staff the resulting lifecycle |
| Technology/runtime requirement | Demonstrated technical/ecosystem need satisfies ADR-001; developer convenience does not |
| Operational readiness | Monitoring, failure recovery, on-call ownership, local development and cost budget are established |

Numeric thresholds are not invented; owners must set them before measurements are used as acceptance evidence. A driver alone is not extraction readiness. The proposal must define owned data and contracts, call/event failure behavior, consistency/compensation, version compatibility, identities/secrets, observability and migration/recovery strategy.

Incremental path: validate ownership → tighten public boundary and fitness checks → design contracts/data migration in a Proposed ADR → obtain owner approval → separately authorize implementation → validate coexistence and rollback/roll-forward → cut over authoritative access → remove obsolete paths only with explicit deletion approval. Do not keep permanent dual writers or shared mutable tables. A rollback after writes move requires a verified reconciliation plan, not just deploying the old binary.

Reject or postpone extraction if it requires synchronized releases, uncontrolled shared data, unexplained synchronous cycles, or missing operational ownership. Reassess if topology constraints invalidate an accepted ADR; surface the conflict and follow constitution/ADR supersession rules.

## 12. Development Constitution Compliance

- Inspected all governance, accepted ADR-001 and architecture documents before modification; current instruction resolves earlier scope text.
- Recorded Accepted status on 2026-10-04 with explicit human project-owner approval, preserving the topology decision and adding the No implicit Shared Kernel invariant.
- Preserved ADR-001 without reopening it; no material language conflict found.
- Kept boundaries and enforcement explicit while deferring final contexts, packages, schemas and tool selections.
- Considered tenant/trust/authorization consequences without claiming verified runtime security.
- No source, scaffolding, services, Docker, databases, dependencies or CI tooling created; ADR-003 not started.
- Verification is document/link/status/scope verification; no application build, tests or benchmarks are claimed.

## 13. Related Decisions

[ADR program](README.md), [constitution](../../DEVELOPMENT_CONSTITUTION.md), [architecture context](../architecture/ARCHITECTURE.md), and [principles](../architecture/principles.md).

ADR-001 is Accepted and constrains language choices. ADR-003 must refine runtime/domain ownership without bypassing these accepted invariants. ADR-004 owns durable workflow selection; ADR-005 owns delivery/event guarantees; ADR-006 Sophia/memory authority and persistence; ADR-007 integrations; ADR-008 isolation; ADR-009 tenancy/security; ADR-010 approvals; ADR-011 telemetry/audit mechanisms; ADR-012 deployment. None of ADR-003–012 is created or selected here. Later discoveries feed back into explicit proposal revision or accepted-decision supersession, not silent drift.

## 14. Evidence / References

Primary Go documentation reviewed 2026-10-04 supports compiler/tool behavior. Architecture tradeoffs are reasoned proposals from the owner-provided NEXORA requirements, not externally proven NEXORA outcomes.

- S1: [Go specification — imports and exported identifiers](https://go.dev/ref/spec) — package visibility and import-cycle constraints.
- S2: [Go command — internal directories](https://pkg.go.dev/cmd/go#hdr-Internal_Directories) — subtree-based import restrictions.
- S3: [Organizing a Go module](https://go.dev/doc/modules/layout) — package/module organization guidance; not a mandated project tree.
- Project evidence: initial seven Markdown files inspected with `rg --files --hidden` and read directly; [Accepted ADR-001](ADR-001-core-programming-language.md), approval dated 2026-10-04; current owner handoff authorizes ADR-002 as Proposed.
