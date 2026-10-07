# ADR-004 — Workflow Engine and Durable Orchestration

- Status: **Accepted**
- Proposal date: 2026-10-04
- Decision authority: Human project owner
- Approval date: 2026-10-04
- Approval evidence: explicit human project-owner approval in this conversation: "I approve ADR-004 — Workflow Engine and Durable Orchestration, with one additional architectural clarification." Acceptance includes the Workflow Definition is not authority invariant requested in the same message.
- Scope: Durable orchestration infrastructure and conceptual ownership, recovery, retry, evolution and security boundaries; documentation only
- Related constraints: Accepted ADR-001, ADR-002 and ADR-003

## 1. Context

NEXORA coordinates governed engineering work across agents, artifacts, tests, reviews, external systems and human decisions. Such coordination can outlive a process, worker deployment or provider session. An approval may arrive days after the proposing Run yielded. A sandbox build may continue while its caller disappears. A webhook can be duplicated or arrive after cancellation.

Accepted ADR-003 distinguishes Agent, Agent Instance, Task, Agent Run, Workflow, Conversation, Tool Operation and Sandbox. Runtime owns controlled Run identity/lifecycle; Workflow coordinates durable multi-step processes. Lifecycle state, waiting reason, stop request, final outcome and external-effect knowledge remain separate. Agent Instances/configuration are not authority, and historical Run attribution is immutable. Current authorization can constrain future operations without rewriting launch-time history.

Accepted ADR-001 requires Go for the core/execution-facing backend. Accepted ADR-002 requires a modular initial control plane, inward dependencies, explicit ownership, evidence-driven extraction and No implicit Shared Kernel. A workflow service or isolated worker is a process/deployment boundary, not proof of a new bounded context or a microservices control plane.

The repository contains documentation, with no executable system or measured workload. Existing overview files still describe ADR-003 as Proposed; its Accepted record and the current owner handoff resolve that stale metadata. No substantive conflict with the accepted decisions was found. Workload, concurrency, maximum duration, cloud preference, budget, retention, tenancy, residency, recovery objectives and operational staffing remain unknown. They prevent deployment and quantitative cost/reliability conclusions, but do not prevent a proposed infrastructure choice.

## 2. Problem

Choose how to persist orchestration progress, coordinate waits and work, and recover honestly without building an unreliable distributed engine inside an agent loop or letting an infrastructure product own NEXORA's domain model.

Durability must distinguish persisted coordination from completed external effects. Replaying an engine history cannot discover whether a remote repository mutation happened before an acknowledgement was lost. Nor can it recreate a sandbox, prove cancellation, or grant current permission.

## 3. Decision Drivers

- Hours/days of durable waits and explicit multi-agent dependencies, independent of UI/process lifetime.
- Recovery from worker crashes and deployment changes without erasing Run identity or repeating uncertain effects.
- Go integration, explicit cancellation, timers, incoming messages and independently coordinated sub-processes.
- Reviewable workflow evolution while old executions remain active.
- Current policy/approval enforcement at consequential operations, tenant scope and minimal sensitive history.
- Engine visibility, operational recovery and a credible exit path without invented performance or cost scores.
- Keep domain ownership and differentiating governance in NEXORA; consume generic infrastructure when its integration/operational cost is justified.

## 4. Considered Options

1. **Temporal:** code-defined durable workflows with history replay and external Activities.
2. **Restate:** journaled durable handlers/services, keyed Virtual Objects and Workflows with Go support.
3. **Custom PostgreSQL-backed orchestration:** an owned persisted state-machine engine, with explicit workers, claims, timers and recovery.
4. **AWS Step Functions Standard:** a credible managed state-machine alternative for an AWS-centered product, including human callbacks and external work. Express is not the candidate for hours/days of approval waits.

No broker, database implementation, agent framework, Kubernetes platform or hosting provider is selected by this comparison.

## 5. Decision

**Use Temporal as NEXORA's dedicated durable orchestration infrastructure. NEXORA retains domain workflow semantics, Agent Run identity/lifecycle, authorization, approval validity, and outcome/effect models.** Accepted on 2026-10-04 with explicit human project-owner approval. Acceptance does not authorize implementation.

Separate three commitments:

- **Architecture:** use a dedicated durable system for long-lived coordination; do not implement it as an in-memory agent loop.
- **Technology:** use Temporal's Go Workflow/Activity model behind an explicit infrastructure boundary, subject to future conformance evidence.
- **Deployment/implementation:** Cloud versus self-hosting, versions, persistence, worker topology, queues, namespaces, SDK configuration and rollout tooling remain undecided.

Temporal is recommended because the required durable branching, long waits, messaging, child coordination, replay testing and workflow evolution form a coherent documented model [T1–T9]. This is a NEXORA-specific architectural inference, not a measured superiority claim. Restate is a serious challenger with relevant durable Go primitives; Step Functions can win if AWS hosting and its state-machine constraints become positive requirements. A custom engine could win for a demonstrably smaller finite coordination problem or a requirement existing engines cannot meet.

Build versus buy is therefore conditional, not ideological. NEXORA differentiates in governed collaboration, engineering intelligence, knowledge integration and safe execution. Workflow definitions and their policy-facing contracts belong to that differentiation; leasing, durable timer recovery and history replay do not currently show independent product value. The supplied scenarios already require more than a simple job queue. Owning the generic engine would consume safety/operations effort without established benefit. Revisit if deployment constraints, unacceptable service cost, licensing, or a proven product requirement invalidate this assumption.

## 6. Detailed Design

### 6.1 Ownership and conceptual operation

NEXORA Control Plane → Workflow Client/Boundary → Durable Workflow System → Workers → owned application operations / Agent Runtime coordination / external adapters.

This is a responsibility flow, not a final process topology. Client/worker mechanisms depend inward on NEXORA contracts; domain policy does not import Temporal, provider or infrastructure types. Activities translate infrastructure execution into owned application operations. Cross-owner private repositories/SQL remain prohibited.

| Concept | Authority and responsibility |
| --- | --- |
| NEXORA Workflow | Domain process definition/revision, dependencies, coordination position, timers/wait conditions, orchestration retry choices, child relationships, reconciliation/compensation decisions and references |
| Temporal history/state | Authoritative persisted orchestration progress for the selected implementation; not a competing copy of all domain state |
| Agent Runtime | Agent identities/configuration and authoritative Run lifecycle, admission, attribution, stop/outcome/effect evidence |
| Approval/security owners | Approval records/validity and current trusted authorization; engine receives references/results, not authority |
| Tool/Sandbox/provider owners | Operations, credentials, execution status and effect evidence; workflow coordinates through contracts |
| Other domains / Sophia | Their business data or knowledge; workflow stores references and needed coordination results |
| UI/read models | Projections of owned state; never alternative recovery truth |

There must not be two independent writers for orchestration position. NEXORA may maintain workflow metadata, external correlations and query projections, but their ownership and freshness must be explicit; they cannot independently advance the same process. An engine-history reference is not permission to query another owner's private data. Engine state is not a universal Shared Kernel.

### 6.2 Workflow ↔ Agent Run mapping

| NEXORA concept | Temporal relationship | Constraint |
| --- | --- | --- |
| Logical Workflow identity and definition revision | One execution or a deliberately linked chain of executions | Preserve logical identity/revision and engine execution references; do not equate engine Run ID with Agent Run ID |
| Orchestration step | Activities, durable waits/timers, message handling or child coordination | A step may span several engine tasks/attempts |
| Agent Run | Independently owned runtime attempt referenced by orchestration | May contain several model/tool calls, yield/resume and survive a worker attempt |
| Temporal Activity | Bounded adapter/application operation, not a domain Run by definition | Retrying the Activity must not silently create a new Run or repeat an unknown effect |
| Child Workflow | Independently coordinated sub-process with its own history/lifecycle | Not automatically one agent, one role or one Run |

Preferred mapping is **runtime-owned Runs referenced by workflows**, using idempotent Activities to admit/create a Run, dispatch/advance a bounded operation, request stop, observe status or reconcile evidence. Durable waiting happens in Workflow state; runtime implements the actual Run transition. Several Activities may participate in one Run, without becoming its competing lifecycle owner. Operation identifiers must be established before consequential dispatch; transactional dispatch gaps await ADR-005.

A single Activity can execute a genuinely bounded Run segment, or an entire bounded Run when its cancellation/recovery/idempotency contract fits. It is inappropriate as the sole durable container for days of approval waiting. Asynchronous Activity completion is another adapter mechanism, not a decision that Activities own Runs [T3]. A child workflow can coordinate an independently valuable sub-process containing Runs, but does not transfer runtime identity or authority to Temporal.

An Activity retry reconnects to the existing logical Run/operation using stable correlation. If that Run is nonterminal, runtime decides whether continuation is safe under its current claim/policy. If terminal, the adapter returns its recorded result. A requested semantic retry after terminal failure creates a **new linked Agent Run**, as ADR-003 requires. Engine retry/reset/Continue-As-New cannot silently rewrite historical Run attribution.

The accepted lifecycle remains `Created → Queued → Running → Waiting → Queued → Running → Finished`, with `Running → Finished` also valid. Workflow events coordinate transitions through the runtime owner. They do not collapse lifecycle, waiting reason, stop request, final outcome or external-effect knowledge.

### 6.3 Temporal execution, replay and determinism

Temporal persists history of Workflow Execution events; workers execute Workflow Tasks and produce commands. Recovery replays recorded events to reconstruct coordination. Workflow code must produce compatible commands for its history; workflow-task failures can leave an execution open and retrying rather than producing a domain terminal failure [T1, T2]. Persistence depends on a correctly operated service and retained data, not the surviving memory of a worker.

**Inside deterministic Workflow code:** branching over recorded inputs/results, explicit dependencies, SDK timers, SDK concurrency/message primitives, scheduling Activities/children, and recording coordination choices. Use workflow SDK time/randomness mechanisms where supported; ordinary wall-clock reads, uncontrolled goroutines, random generation and mutable external configuration cannot determine replay behavior.

**Outside deterministic Workflow code:** LLM/provider calls, MCP calls, shell/build execution, repository mutations, network APIs, sandbox operations, database reads/writes, secret lookup and current policy decisions. These cross Activities or owned external subsystems. Return permitted results/references through the engine boundary; do not call the model again merely because history is replayed. Large or sensitive content remains in its owner with an explicitly retained, authorized reference sufficient for future interpretation.

Deterministic orchestration is not deterministic LLM behavior. Persisting/reference-recording an observed result makes that choice attributable; it does not make a new inference reproducible. A failed Activity before durable acknowledgement can repeat its external call, so external safety still needs the operation contract.

Do not record an authorization result and then reuse it forever as a grant. Replay reconstructs a historical decision; **each new consequential dispatch requires current trusted authorization**, including relevant tenant/project/resource/action/task/environment and valid approval where required. The execution owner must reject stale claims/revoked authority at the effect boundary. Pinning old orchestration code cannot preserve old permissions. Record/reference the effective policy decision/version for each operation while preserving historical Run configuration attribution.

### 6.4 Timers, messages and approvals

Durable timers and wait conditions survive worker loss; no sleeping process/goroutine is the source of truth. Waits need correlation, deadlines/expiry where appropriate, cancellation behavior and backlog limits. Timer firing is an orchestration input, not permission or evidence an external operation stopped.

Temporal message types have different contracts [T4]:

- **Signal:** asynchronous durable input; service acceptance does not mean the worker handled it or NEXORA completed the business request.
- **Update:** tracked request with acceptance/completion and a result; validators can reject inputs. Requires workflow-worker participation and is not a resource authorization oracle. Rejected validation is not a complete business audit record.
- **Query:** read of workflow state, with no mutation/history command; worker availability matters. It is not a durable approval decision or audit event.

Ingress authenticates the caller/event, derives trusted tenant/resource attribution, authorizes mutation, validates the expected workflow/step/revision and correlates/deduplicates delivery. Raw browser, model or webhook input must not directly address privileged engine mutation APIs. A workflow signal/command is orchestration input; a domain event is an owner business fact; an integration event is a cross-boundary contract; an external webhook is untrusted input requiring translation. They are not one universal event abstraction. ADR-005 resolves durable delivery, ordering, lost acknowledgements and late-input rules.

Approval flow: owned request with action/target/configuration references → durable workflow wait → authenticated decision notification → retrieve/validate current approval through its owner → revalidate current policy → dispatch governed operation or reject/expire/stop. Changed intent may require new approval. Notification alone cannot prove validity; ADR-010 decides expiry, revocation, races and atomic enforcement. Repeated or late approvals cannot reopen a terminal Run automatically.

### 6.5 Retry ownership and external effects

| Retry level | Owner and permitted meaning |
| --- | --- |
| Provider/network | Adapter, bounded within a declared operation budget; only when safe under provider/effect semantics |
| Tool operation | Tool/execution owner, stable operation identity; reconcile unknown effects before retry |
| Agent Run | Runtime admission plus explicit orchestration decision; terminal retry creates a new linked Run |
| Workflow step | Workflow policy; engine Activity attempts are transport/execution attempts, not new semantic work by default |
| Whole workflow | Explicit governed restart/retry with links, compatible definition and reviewed prior effects; not automatic erasure/reset |

Select finite retry/deadline budgets and error classifications deliberately; no default unlimited retry policy is accepted as NEXORA behavior. Nested retries share an overall budget rather than multiplying attempts/cost invisibly. Do not use whole-workflow retries to blindly replay a partially completed engineering process.

An external operation needs tenant-scoped stable idempotency identity and semantic input binding where the target supports it, plus durable correlation, deduplication retention and reconciliation where it does not. Reuse a key for attempts of the same operation; new semantic work requires a new identity. A key alone is insufficient if the remote system does not enforce it or its retention expires.

Worker crash after effect / lost acknowledgement / API timeout means the result may be **unknown**, not failed-with-no-effect. Query remote evidence or reconcile with the owner before another consequential attempt. If reliable reconciliation is unavailable, retain Indeterminate/effect uncertainty and escalate for reviewed/manual disposition. Duplicate delivery must return existing evidence or be rejected safely. Temporal does not provide exactly-once external side effects [T3].

Workflow/Run launch gaps and domain-commit/notification gaps cannot be solved by pretending engine and domain writes form one transaction. ADR-005 must establish the protocol; an outbox or another mechanism is a candidate, not selected here. Stale/partitioned workers need owner-enforced claim/fencing semantics at dispatch and safe late-completion reconciliation. Engine task timeouts alone do not fence a remote mutation.

### 6.6 Cancellation, compensation and reconciliation

User / Policy / Parent → authorized Workflow stop request → Agent Run stop request → Tool / Sandbox / Provider cancellation attempt → observed outcome/effect knowledge.

This chain is cooperative. Stop scheduling new consequential work, request stop through owned contracts, observe/reconcile outstanding operations, and record honest disposition. Temporal Activity cancellation commonly relies on heartbeats; cancellation of the caller does not instantly kill remote work. Waiting for Activity cancellation completion and bounded cleanup require deliberate configuration [T5]. Heartbeats are progress evidence, not durable proof that an external effect did not occur.

A workflow close status `Cancelled` must be accompanied by unresolved-effect references/disposition where needed, rather than implying rollback. Preserve Run final outcome `Indeterminate` and independent effect knowledge. If cleanup exceeds its budget, durable responsibility for later reconciliation must remain explicitly assigned; no disappearing orphan operations.

Engine termination bypasses ordinary cooperative workflow cleanup and must be an exceptional authenticated/audited administrative action with an orphan-recovery procedure, not routine user cancellation. Child parent-close/cancellation policy must be intentional; engine defaults cannot determine business abandonment or external cleanup [T6].

**Compensation** is a new governed action attempting to offset a prior effect, which can fail and may itself need approval. **Reconciliation** determines/repairs consistency using evidence. **Retry** repeats permitted work; **manual intervention** is an attributed operator decision; **Indeterminate** records insufficient evidence. None is automatically rollback of an irreversible distributed effect.

### 6.7 Workflow evolution and bounded history

Record NEXORA workflow definition/revision, launch attribution, engine IDs and worker/code release references needed for interpretation. Domain revision, Temporal execution Run ID and worker Build ID have different meanings. Preserve immutable Run launch references across deployment, resume and engine history rollover.

Current Worker Versioning supports Pinned and Auto-Upgrade behavior. Pinned workflows route to a deployment version; Auto-Upgrade requires replay-safe code evolution. Activity queues outside that version can have independent routing, so pinning orchestration does not pin every external adapter. Retain necessary old worker code while old executions remain dependent on it [T8]. This ADR proposes version-aware coexistence, not a specific configuration or automatic migration policy.

Compatible changes still need historical replay tests; incompatible command order/branch changes need supported patching or explicitly reviewed version routing/migration [T1]. Do not base a design on obsolete experimental pre-2025 versioning. New code cannot freely reinterpret old history. Policy revocation remains enforceable independently of pinned definitions.

Continue-As-New starts a new engine execution Run/history under the Workflow ID and carries explicitly supplied coordination state [T7]. It bounds history, not domain accountability. Plan history/message-volume thresholds from engine limits and workload evidence; no numeric threshold is selected here. Carry required references, deduplication state and wait correlations, finish handlers safely, and account for messages arriving at rollover. Parent child relationships do not simply carry to the new parent execution; explicitly review outstanding children and close policy [T4, T6]. Version inheritance/routing must also be reviewed [T8].

Continue-As-New is neither a new Agent Run nor a repair for already incompatible history. Reset/restart can revisit commands and external-operation boundaries; require prior-effect reconciliation, new execution links and reviewed attribution. Migration of live workflow state to another engine is not automatic.

### 6.8 Required scenario walkthroughs

| Scenario | Proposed coordination and recovery |
| --- | --- |
| A — Software task | Task assignment → Architect Run → artifact reference → Backend Run → owned test operation → QA Run → review → completion. Persist dependencies/results; worker replay resumes position and reconnects to existing Runs. Artifact production is not automatically task acceptance. |
| B — Human approval | Create owned approval reference, durable wait with expiry/cancel path, consume authenticated decision, revalidate approval/current authority at operation. Worker/UI absence cannot lose the wait. |
| C — Long execution | Record Run/job reference, dispatch governed sandbox work, wait durably. Lost worker reconciles sandbox evidence through its owner; retry cannot create another build/mutation without a safe contract. Unknown outcome stays explicit. |
| D — External event | Verified GitHub/CI/integration/user input is translated into correlated orchestration input. Duplicate/late/wrong-tenant input is rejected or deduplicated; ingress-delivery gaps await ADR-005. |
| E — Cancellation | Receive scoped request, stop advancement, propagate runtime/operation stop, observe effects, bounded cleanup and assigned reconciliation. Cancellation is not evidence of reversal. |
| F — Virtual office | PM delegation → Architect/Backend/Frontend/QA/Security dependencies and approval/rework loops are explicit workflow steps/child coordination where justified. Agent conversations may supply artifacts/proposals, but cannot become hidden scheduling or authority. Bound loops/budgets and record new Run attempts. |

### 6.9 Accepted workflow invariants

1. Workflow != Agent Run != Agent; engine identities are not substitutes for NEXORA identities.
2. One explicit owner per fact: engine progress, runtime lifecycle, approvals, policy and execution effects remain separate authorities.
3. Durable waits and pending work MUST NOT exist solely in process memory, goroutines or provider sessions.
4. External effects MUST NOT be assumed exactly-once; unknown effects block blind consequential retry.
5. Retry MUST preserve Run identity/history; terminal Run retries create new linked attempts.
6. Consequential operations require current trusted authorization and valid approval where required; engine/Agent Instance/history is not a grant.
7. Historical launch/configuration attribution is immutable; corrections are explicit and auditable.
8. Cancellation requests and observed outcomes/effects are separate; cancellation never implies rollback.
9. Nondeterministic/external operations remain outside deterministic Workflow code; replay cannot trigger fresh effects casually.
10. External input cannot mutate workflows without authenticated/authorized ingress, trusted attribution and correlation.
11. Secrets and unnecessary sensitive payloads MUST NOT enter history/state/visibility; necessary references have access/retention rules.
12. Infrastructure contracts/state MUST NOT become an implicit Shared Kernel or bypass domain ownership/inward dependencies.
13. Running-history compatibility, old-worker availability and policy revocation MUST be considered before deployment.
14. Engine visibility is not the complete audit system; durable operator recovery/reconciliation responsibilities are explicit.
15. Retry, wait, admission and resource/cost budgets are bounded and owned; stale workers cannot advance solely because an engine attempt exists.

#### 16. Workflow Definition is not authority

A Workflow Definition or workflow revision describes orchestration semantics such as sequencing, dependencies, waits, branching, coordination, retry/compensation intent, and required operations.

It MUST NOT itself:

- grant permissions,
- create authorization merely because a step exists,
- substitute for required human approval,
- override domain invariants,
- become the authoritative source of business state owned by another subsystem,
- grant an Agent Instance or Agent Run additional authority,
- or treat historical authorization/approval results as permanent permission.

Every consequential operation crossing an ownership or trust boundary MUST be validated by the authoritative owner at execution time against current trusted policy, relevant tenant/project/resource/action/task/environment context, and valid approval where required.

A workflow may retain historical references to authorization and approval decisions for attribution and auditability, but those historical records do not automatically authorize future consequential operations.

Workflow progression means:

`the orchestration says what should happen next`

not:

`the orchestration has authority to make it happen`.

This invariant is engine-independent. It applies even if Temporal is later replaced.

It strengthens the existing ownership, current-authorization, approval, No implicit Shared Kernel, and infrastructure-not-authority rules without deciding ADR-009 or ADR-010.

These are accepted constraints, not implemented or verified controls.

## 7. Alternatives Analysis

Qualitative fit, based on official semantics and the supplied scenarios; no benchmarks, maturity rankings, adoption figures or numeric scores.

| Dimension | Temporal | Restate | Custom PostgreSQL engine | Step Functions Standard |
| --- | --- | --- | --- | --- |
| Durability/recovery | Persisted history and deterministic Workflow replay; Activities can reattempt [T1–T3] | Journaled SDK actions/results replay on recovery; external calls in durable Run blocks still need safe effects [R1] | Explicit state transitions/checkpoints and crash recovery must be designed | Managed persisted state-machine progression; external work remains separate [A1] |
| Long waits/timers/input | Durable timers, Signals/Updates and owned approval references | Durable timers/delayed sends, repeated Signals, one-shot awakeables/promises and suspension [R2, R3] | Persist timers, wakeup scheduling, race-safe messages and expiry | Wait states and callback task tokens fit approval/external completion; Standard duration limit [A1, A2] |
| Sub-processes/cancellation | Child Workflows, explicit close policy and cooperative Activity cancellation | Durable service/workflow composition; invocation cancellation needs owner effect reconciliation [R4, R6] | Build parent/child ownership, propagation and orphan recovery | Nested executions/tasks; define stop propagation and callback disposition, not remote rollback |
| Retry ownership | Configure bounded Activity/step policy; preserve runtime Run identity | Regular errors retry by default, documented unbounded behavior unless constrained; terminal errors stop [R5] | Own scheduler, backoff, classifications, deduplication and retry budgets | Explicit Retry/Catch state-machine policy; task retry/redrive cannot erase Run identities |
| Evolution/determinism | Command-history compatibility, patching/version routing, old workers, Continue-As-New | Journal compatibility and immutable registered deployment endpoints; in-flight invocations remain on original deployment [R7] | Version definitions/state formats and retain interpreters or migrate | ASL definition versions; task implementations need their own release compatibility [A3] |
| Go and cognitive load | Documented Go Workflow SDK/testing; replay discipline and two execution contexts to learn [T4, T9] | Documented Go handlers and durable primitives; journal boundaries and keyed concurrency to learn | Idiomatic Go possible; distributed correctness/tooling entirely owned | Go external workers/API integration possible; orchestration is Amazon States Language, not ordinary Go durable code |
| Local testing/visibility | SDK mocks/time skipping/replay, local service and history visibility; integration tests still needed [T9] | Local server plus journal/service/invocation tools; equivalent conformance evidence not collected [R8] | Full control; simulator, history viewer and recovery tools must be built | Console/history/TestState; AWS documents Local as unsupported and not feature-parity [A5] |
| Operations/scale | Cloud or self-hosting; workers still owned; backlog/history/queues/version capacity need planning [T10, T11] | Cloud, managed BYOC or self-hosting; service endpoints and replicated state/log operations need planning [R8] | DB operation plus custom claiming, timer throughput, fairness, fencing and all engine support | AWS operates engine; account/region quotas, callbacks, external worker capacity and state-transition billing remain [A1, A4] |
| Security/tenancy | Namespace/service access != application tenant authorization [T12] | Service/key/invocation address != tenant authorization | Could align with owner data boundaries; DB credentials/claims need enforcement | IAM/account separation != NEXORA resource/approval policy; task tokens sensitive |
| Portability/DR | Open-source self-hosting option; histories/SDK workflow semantics still lock in; restore must be tested | Self-host/cloud option; journals/state APIs/deployment semantics lock in | Data format/control owned; engineer departures/bugs and recovery debt remain | AWS service/model coupling; definitions exportable, live execution/history transfer not assumed |

### Temporal: strengths and costs

Strong fit for explicit process coordination with Go and historical replay tooling. Its Workflow/Activity separation makes the external boundary visible but does not enforce NEXORA governance. More service/SDK/worker lifecycle knowledge is required than a local queue. Histories, task queues, timeouts, retry defaults, payloads, versions and retention need active engineering. Self-hosting requires persistence/service operations; Cloud removes engine administration, not worker governance or application DR. No NEXORA operating-cost comparison is established.

### Restate: serious alternative

Basic Services execute independent handlers; Virtual Objects provide keyed state with serialized writers; Workflows provide a run-per-key model with concurrent interaction handlers [R4]. This may be attractive for keyed coordination, durable service calls and fewer conceptual distinctions between services and orchestration. It must not imply Agent Instance == Virtual Object == authority.

Current Go documentation includes **Signals** as well as awakeables and workflow promises; this evaluation does not assume only one-shot callbacks. They support durable external interactions and suspended waits [R3]. Durable timers support delayed work [R2]. Journaled results and SDK action compatibility remain a code-evolution constraint, distinct from Temporal command history [R1, R7].

Versioned endpoints must remain immutable/available for in-flight invocation retries. Long-running code retention and state compatibility across deployments are real obligations; not automatic migration. Default retry behavior needs explicit bounds/error mapping. Cancellation/kill must not be mistaken for stopping arbitrary remote work [R5–R7]. Cancellation requires a reachable endpoint, is non-blocking, and propagates through the call graph at await points. Detached one-way/delayed calls remain separate. Kill skips compensation and can leave inconsistent state; changing deployment when resuming requires compatible journal behavior [R6]. The UI/CLI and introspection expose invocation/journal/state evidence, not a complete NEXORA audit [R9].

Restate could replace the recommendation if a separately authorized Go conformance evaluation demonstrates the scenarios, approval/stop races, long-duration deployment evolution, operational recovery and acceptable total cost more simply. No comparative production reliability, Go SDK maturity metric, capacity benchmark or feature-parity test was obtained. Temporal's more directly examined orchestration/evolution/testing model currently provides the clearer reviewable fit; this is an evidence limit, not proof Restate is immature.

### Custom PostgreSQL-backed engine: credible but costly ownership

A finite persisted state machine could offer tight owner-data integration, simple inspectable rows, controlled semantics and reduced third-party DSL/SDK coupling. It could be justified if real needs reduce to a few durable transitions/timers and the team can operate the resulting system. PostgreSQL is an evaluated hypothetical persistence choice, not surrounding infrastructure selected here.

NEXORA would need to implement correct state persistence/atomic transitions; leases/claim renewal and stale-worker fencing; crash detection/recovery; durable timers and wakeup races; backoff/retry budgets; message deduplication/order/correlation; concurrent updates; cancellation propagation; child processes; definition/state versioning; immutable history/audit references; operation idempotency support; backlog/admission/fairness; stuck/poison detection; inspection/manual recovery tools; backup/restore and failure drills. A transactional row claim cannot make an external API transactional.

There is no need to reproduce deterministic code replay: an explicitly versioned persisted interpreter could work. It still needs compatibility and recovery semantics for every durable transition. The required multi-agent/rework/approval scenarios make this a distributed infrastructure commitment, not a small helper. Its main risk is silently funding that commitment inside the agent runtime. Current evidence favors consuming an engine; a future custom proposal needs a concrete unmet requirement and comparative lifecycle cost, not developer convenience.

### AWS Step Functions Standard: credible managed alternative

Standard coordinates an ASL state machine, not replay of arbitrary Go Workflow code. Callback task tokens support human/external completion; Go execution-facing workers can remain outside the service, with no requirement to select Lambda [A1, A2]. This fits NEXORA well if AWS integrations/operating model become deliberate preferences.

AWS describes Standard workflow execution as exactly-once unless retry behavior is specified. That statement MUST NOT be generalized to exactly-once repository/provider effects under task retry, redrive or lost acknowledgement. Express has a five-minute duration model and lacks the relevant callback pattern; it is not the long-wait option [A1].

Documented Standard constraints include a one-year execution duration, 25,000 history events, 256 KiB state/task payload limit and ordinarily 90-day completed history retention [A4]. Long processes need reference payloads and planned execution segmentation; external audit retention remains owned by NEXORA. Versioned state-machine definitions do not pin downstream Go/tool implementations [A3]. Managed service operation and state-transition billing may be worth the AWS coupling, but actual workload/region/cost evidence is missing. Local tooling limitations increase the need for AWS integration testing [A5]. It loses this proposal on unestablished cloud commitment and a less direct Go orchestration model, not vendor specificity alone.

## 8. Consequences

### Positive

Generic durable waits/recovery move out of agent loops. Explicit workflow position and dependencies support auditability and visible virtual-office coordination. Runtime identities and effects remain attributable across worker attempts. Temporal's Go model fits accepted language policy without additional backend runtime languages.

### Negative

Temporal introduces an infrastructure dependency and replay-aware workflow development. Live-history compatibility, old workers, adapter contracts and safe operation recovery add work. SDK boundaries cannot make definitions entirely engine-neutral. Hosting/capacity/cost questions remain before implementation.

### Risks

Engine state may absorb domain authority; Activity retries may duplicate effects; dual workflow/runtime writers may diverge; histories may expose content; pinned workers may become unavailable; stuck workflow tasks may hide failures; operators may reset/terminate work without reconciliation. Documented invariants and future validation address these risks conceptually; none is mitigated by documentation alone.

## 9. Security Considerations

Namespaces partition Temporal resources, but are not automatically NEXORA tenants or authorization boundaries [T12]. Namespace-per-tenant versus grouped tenants, administrative blast radius and trusted worker scope need ADR-009/012 evaluation. Workflow IDs, tenant-like names and possession of a signal/callback identifier are not permission grants. Avoid sensitive information in IDs/search metadata.

Authenticate/authorize starts, signals, updates, queries, cancellation, reset and termination. Ingress derives tenant/project/action context from trusted identities, checks workflow ownership and binds inputs to expected revisions. Workers require least-privilege engine and subsystem credentials; sandbox/provider operations do not inherit broad workflow-service administration. Administrative access can inspect histories or alter executions and needs independent review/audit.

Minimize inputs/results, history, search attributes and errors; use scoped secret references, never durable credentials or private chain-of-thought. Encryption in transit/at rest must be established for the chosen hosting model; payload encryption/codecs, key access/rotation and metadata coverage need explicit evaluation. Encryption does not remove privileged worker access or make all visibility metadata secret. References also need tenant authorization and retention; purging payloads may reduce replay/reconstruction capabilities and must be assessed.

Replay must not bypass current policy. Stale/duplicated execution claims require enforcement at the effect owner, including revocation/approval races. Multi-tenancy, data residency, key ownership and DR access are unresolved implementation gates. No runtime security guarantee is made.

## 10. Operational Considerations

### Failure model

| Failure | Expected behavior and limitation |
| --- | --- |
| NEXORA process crash | Persisted workflows remain; start/command acknowledgement may be unknown, so retry with stable correlation. Domain/engine commit gap still requires protocol. |
| Workflow worker crash | Another compatible worker replays persisted history. Activity attempt may timeout/retry; external effects require reconciliation. Sandboxes are not recreated by replay. |
| Workflow service outage | Progress/ingress/heartbeats may stall; callers see explicit unavailability. Recovery assumes service/persistence restoration, not magically available workers. No SLO/RPO/RTO selected. |
| Network partition | Engine acceptance and external outcomes may be unknown; deadlines and owner-enforced fencing prevent stale attempts from unilaterally advancing. |
| Duplicate delivery | Correlate/deduplicate by semantic operation; report prior evidence rather than create a new Run/effect. Retention and atomic mechanisms await ADR-005. |
| External API timeout / crash after effect | Preserve uncertainty, reconcile or escalate; neither timeout nor engine retry proves no effect. |
| Stale worker | Engine timeout is insufficient external fencing; operation owner rejects invalid claim/current policy and reconciles late results. |
| Active-work deployment | Preserve replay compatibility/version routing, old code availability and current-policy enforcement; stop rollout if conformance fails. |
| Invalid/corrupt input | Validate before admission/mutation, classify nonretryable defects, quarantine/reject visibly. Do not retry malformed input forever. |
| Poison/stuck workflow | Detect age/repeated failures/backlog; inspected repair or reviewed migration/reset/termination with effect reconciliation, not silent skipping. |
| Persistence loss/corruption | Durability guarantees no longer follow from worker replay; restore engine plus domain/operation correlations consistently and reconcile external reality. |

Engine visibility supplies execution history/status, retries, timers and failures; worker/backlog health and stuck work need monitoring. NEXORA still needs Run/operation/approval/policy/artifact correlation, tenant-safe audit, cost accounting and unresolved-effect ownership. Engine history is not the full audit trail and retention is not an audit policy. ADR-011 owns that design.

Self-hosted Temporal means operating service persistence, visibility, upgrades, capacity, security, backups and tested restores [T10]. Temporal Cloud provides managed engine infrastructure, while NEXORA still owns workers, integrations, permissions, definition evolution and application recovery [T11]. No database backend, cloud plan or deployment topology is selected.

Capacity planning must account for active workers, dormant waits, event/history growth, signal throughput, tenant fairness, provider/tool quotas and separate runtime admission. Workflow fan-out cannot bypass shared budgets. Costs include engine usage/hosting, worker compute, retained payload/history, telemetry, old-version coexistence, egress and operational staffing; no price/benchmark or cheapest-option claim is made. ADR-012 establishes workload estimates and recovery targets before choosing hosting.

### Future validation gates, not performed tests

Separately authorized implementation must demonstrate scenarios A–F with worker/service restarts; time-skipped waits plus real message/cancel races; duplicate/lost acknowledgements; effect-after-crash reconciliation; revoked policy and forged/cross-tenant input rejection; unchanged Run attribution; bounded retries/fairness; old/new worker coexistence and historical replay; Continue-As-New with pending messages/children; stuck-work repair; and restoration reconciling engine/domain/external evidence. SDK mocks alone cannot prove remote-effect or deployed security correctness [T9]. No workers, tests or dependencies are created in this task.

## 11. Evolution / Exit Strategy

Keep NEXORA workflow definitions/revisions, Run/operation identities and domain records interpretable independently of engine-native IDs. Adapters limit SDK spread but do not erase lock-in: rewriting workflow definitions, replay behavior, signals, child semantics, version handling, retained history and operational procedures can be expensive.

For an engine change, obtain a Proposed supersession ADR with an unmet requirement, security/operations/cost evidence and separately authorized migration. Prefer routing new workflows to the new engine while old workflows drain under their original owner. Where that is impossible, define reviewed migration checkpoints, reconciliation and new execution links. Do not run permanent dual writers or assume Temporal history imports into Restate/ASL/a custom interpreter.

Exporting definitions/records/history supports investigation but is not live-state portability. Retention/backup/export/licensing constraints must be checked for the selected service/version. Disaster recovery requires tested engine and owner-state restoration, correlation continuity, credential/key recovery and reconciliation with effects that happened after the restored checkpoint. No disaster-recovery guarantee is inferred from vendor availability.

Revisit for unacceptable operating cost, residency/tenancy constraints, inability to retain compatible workers, unsupported workflow evolution or a demonstrated simpler alternative. Reversal cost is material; boundary discipline preserves domain semantics while reducing, not eliminating, migration effort.

## 12. Development Constitution Compliance

- Re-read governance, ADR convention, all Accepted ADR-001/002/003 and current architecture documentation before edits; current human handoff supersedes stale scope labels.
- Preserve accepted language, topology, ownership, inward dependency, No implicit Shared Kernel and runtime identity/authorization/effect/history invariants.
- Recorded ADR-004 Accepted on 2026-10-04 with explicit human project-owner approval and the Workflow Definition is not authority invariant; acceptance does not authorize implementation.
- Separate official technology facts from NEXORA inferences and unresolved workload/hosting questions.
- Documentation only: no source, Go modules, dependencies, schemas, workers, brokers, deployment or infrastructure configuration; no final contexts/package tree.
- Synchronize only supporting overview/index/scope metadata; do not modify Accepted ADRs or start ADR-005.
- Verification covers document status, links, scope and unchanged files; no executable conformance, performance, cost or recovery evidence is claimed.

## 13. Related Decisions

[Constitution](../../DEVELOPMENT_CONSTITUTION.md), [ADR program](README.md), [architecture context](../architecture/ARCHITECTURE.md), [principles](../architecture/principles.md), [Accepted ADR-001](ADR-001-core-programming-language.md), [Accepted ADR-002](ADR-002-architecture-style.md), [Accepted ADR-003](ADR-003-agent-runtime.md).

| Deferred decision | Questions that remain implementation gates |
| --- | --- |
| ADR-005 — Events | Commit/dispatch gap, transactional coordination, ingress-to-engine durability, duplicate/late/out-of-order messages, idempotency retention, effect notification/reconciliation protocol; no broker selected |
| ADR-009 — Security | Trusted claims/fencing, tenancy/namespace strategy, authentication/authorization, revocation races, quotas/fairness, secrets/encryption/residency and administrative access |
| ADR-010 — Approval | Action/target/revision binding, decision authenticity, expiry/revocation, changed intent, cancellation races and enforcement at dispatch |
| ADR-011 — Observability | Correlation, complete audit vs engine history, integrity/privacy/retention, stuck-work alerts, costs and operator recovery evidence |
| ADR-012 — Deployment | Cloud/self-host, process/worker topology, supported versions, capacity/region/budget, upgrade/drain procedures, backups and tested RPO/RTO |

ADR-006 owns referenced knowledge/context retention; ADR-007 tool/provider contracts and credentials; ADR-008 sandbox job ownership, recovery and termination evidence. These are dependencies, not created decisions or permission to implement. Further discoveries require explicit proposal revision or owner-approved supersession, never silent accepted-decision changes.

## 14. Evidence / References

Official documentation reviewed **2026-10-04**. Facts are scoped to the documented model; NEXORA mappings, recommendation and invariants are architectural inferences from the owner scenarios. No installed-version compatibility, benchmark, comparative operational maturity or deployment verification was performed. Versions/features/quotas must be rechecked when implementation is separately authorized.

### Temporal

- T1: [Workflow definitions](https://docs.temporal.io/workflow-definition) — deterministic command replay and evolution.
- T2: [Tasks](https://docs.temporal.io/tasks) — task execution, persisted commands, task failures and Activity heartbeat progress.
- T3: [Activity execution](https://docs.temporal.io/activity-execution) — external execution, retry/cancellation and asynchronous completion boundaries.
- T4: [Go message passing](https://docs.temporal.io/develop/go/workflows/message-passing) — Signals, Updates, Queries and handler completion.
- T5: [Go workflow cancellation](https://docs.temporal.io/develop/go/workflows/cancellation) — cooperative cancellation/cleanup and Activity heartbeats.
- T6: [Child workflows](https://docs.temporal.io/child-workflows) — separate history, parent close policy and Continue-As-New relationship limits.
- T7: [Go Continue-As-New](https://docs.temporal.io/develop/go/workflows/continue-as-new) — new execution/history and carried input.
- T8: [Worker Versioning](https://docs.temporal.io/worker-versioning) — Pinned/Auto-Upgrade, Activity routing and version inheritance.
- T9: [Go testing](https://docs.temporal.io/develop/go/best-practices/testing-suite) — test suite, time skipping, mocks and replay validation.
- T10: [Self-hosted guide](https://docs.temporal.io/self-hosted-guide) — operation responsibility.
- T11: [Temporal Cloud](https://docs.temporal.io/cloud) — managed service option.
- T12: [Namespaces](https://docs.temporal.io/namespaces) — resource partitioning; application authorization remains NEXORA's obligation.

### Restate

- R1: [Go durable steps](https://docs.restate.dev/develop/go/durable-steps) — journaled results, external-operation boundaries and retry configuration.
- R2: [Go scheduling and timers](https://docs.restate.dev/develop/go/durable-timers) — durable sleep, delayed messages and timeouts.
- R3: [Go Signals and external events](https://docs.restate.dev/develop/go/external-events) — repeated Signals, awakeables, workflow promises and suspension.
- R4: [Services](https://docs.restate.dev/concepts/services/) — Basic Services, Virtual Objects, Workflows and Go availability.
- R5: [Go error handling](https://docs.restate.dev/develop/go/error-handling) — retries and terminal errors.
- R6: [Managing invocations](https://docs.restate.dev/services/invocation/managing-invocations) — cancellation, kill, pause/resume and deployment compatibility.
- R7: [Service versioning](https://docs.restate.dev/services/versioning) — immutable endpoints, in-flight deployment retention and journal/state compatibility.
- R8: [Hosting options](https://docs.restate.dev/hosting/overview) and [deployment/development guides](https://docs.restate.dev/guides/) — cloud/self-host/local options; no topology inferred.

- R9: [Introspection](https://docs.restate.dev/services/introspection) — invocation/journal/state inspection.

### AWS Step Functions

- A1: [Choosing Standard versus Express](https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html) — execution model, duration, integration patterns and billing distinction.
- A2: [Service integration patterns](https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html) — callbacks and task tokens.
- A3: [State-machine versions](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-state-machine-version.html) — definition attribution; external implementation release remains separate.
- A4: [Service quotas](https://docs.aws.amazon.com/step-functions/latest/dg/service-quotas.html) — duration, history, payload and retention constraints.
- A5: [Testing and debugging](https://docs.aws.amazon.com/step-functions/latest/dg/test-and-debug.html) — TestState and unsupported/non-parity Local tooling.

Project evidence: owner ADR-004 handoff; direct inspection of all nine existing Markdown documents; Accepted ADR-001/002/003 preserved. Acceptance recorded on 2026-10-04 with explicit human project-owner approval in this conversation.
