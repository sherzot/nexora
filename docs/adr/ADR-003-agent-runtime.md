# ADR-003 — Agent Runtime Architecture

- Status: **Accepted**
- Proposed: 2026-10-04
- Decision authority: human project owner
- Approval date: 2026-10-04
- Approval evidence: explicit human project-owner approval in this conversation: "I approve ADR-003 — Agent Runtime Architecture, with two additional architectural clarifications." Acceptance includes the Agent Instance is not authority and Historical Run Attribution is immutable invariants requested in the same message.
- Decision: NEXORA-owned runtime identity, lifecycle and governance, with explicit subsystem boundaries and optional framework adapters
- Constraints: [Accepted ADR-001](ADR-001-core-programming-language.md) and [Accepted ADR-002](ADR-002-architecture-style.md)
- Scope: conceptual runtime model and invariants; no final contexts, aggregates, API schemas, packages, storage engines, frameworks or deployment choices

## 1. Context

NEXORA coordinates specialized engineering agents performing real repository, tool and external-system operations. A provider response alone cannot represent identity, permission, execution ownership, cancellation, or accountable outcomes. The Virtual Office presents state; it does not own runtime truth. Sophia supplies knowledge; retrieval does not grant authority.

Verified repository evidence on 2026-10-04: eight Markdown files existed before this task, with no source, dependencies, schemas, infrastructure or runtime tests. Governance, both accepted ADRs, the ADR index and all architecture documents were inspected. Overview files still describe ADR-002 as Proposed and restrict ADR-003 under the previous scope. The current owner handoff authorizes this proposal; supporting status/navigation text is synchronized. Accepted ADR-001/002 are preserved unchanged.

ADR-001 requires Go as primary core/backend language and explicit justification for additional runtimes. ADR-002 requires modular ownership, public contracts, inward dependencies, owned consistency, policy on every path, honest delivery, justified isolation and No implicit Shared Kernel. No material conflict with those constraints is identified.

Unknown: tenant model, tasks' acceptance authority, workload mix, quotas, availability/recovery targets, data retention/residency, provider feature needs, execution threat model, and framework compatibility. These block affected implementation choices, not this conditional conceptual proposal. No framework governance guarantees or runtime performance results are available. This record makes no claim that the described controls are implemented or secure.

## 2. Problem

Define the smallest governed agent runtime that preserves stable identity, configuration attribution, controlled execution, explicit failure/cancellation, bounded resources, and honest effects without becoming a universal workflow, memory, sandbox, or domain framework.

## 3. Decision Drivers

1. Separate logical identity and policy from models, tools, processes, conversations and workflows.
2. Attribute every attempted operation to authenticated context and effective configuration.
3. Enforce capability, authorization and approval boundaries before effects.
4. Preserve interpretable lifecycle and outcomes during cancellation, crashes and uncertain external effects.
5. Bound concurrency, waits, retries and resource consumption.
6. Keep domain policy portable without flattening useful provider features.
7. Retain clear subsystem ownership and Go idioms without speculative abstraction.

Future verification scenarios: restart during approval wait; cancellation after an external request is sent; stale worker completion after ownership changes; duplicate execution request; policy revocation before a tool starts; untrusted output proposing a privileged tool; tenant mixing in retrieved context; unsupported model capability; and quota exhaustion. Expected response principles appear below; timing, capacity and recovery targets remain unknown. These scenarios have not been executed.

## 4. Considered Options

1. **Thin NEXORA-native runtime:** NEXORA owns identity, policies, lifecycle and orchestration of a bounded attempt; providers and tools are adapters. No general-purpose agent framework is required.
2. **Framework-owned runtime:** an external agent framework's agent/session/loop state is the authoritative core model, extended to meet NEXORA governance.
3. **Hybrid with adapters:** NEXORA owns the same core as option 1; a framework may provide a bounded planning/model interaction implementation behind an adapter when demonstrated value justifies it. Its internal state never becomes authoritative governance.

No named framework is evaluated as a selected dependency. Framework capabilities and compatibility require evidence in a later, separately authorized adoption decision.

## 5. Decision

**ACCEPTED: NEXORA owns the Agent Runtime identity, effective configuration attribution, lifecycle and outcome model. Models, tools, memory, workflows, approvals and execution facilities are accessed through explicit boundaries. Start with a thin runtime; permit optional framework adapters only when justified and verified against the same invariants.**

An Agent Execution is one controlled, bounded logical attempt for an assigned objective. It may contain multiple model/tool interactions and yield without holding a worker. A controlled continuation can resume the same nonterminal run; a retry after terminal failure is a new run linked to the original. This is not automatically a durable workflow, a process, or one provider request.

Durable multi-step coordination across agents, timers, approvals and retries belongs to Workflow, not a hidden agent loop. Required long-lived runtime records must survive process loss, but persistence and recovery protocols are deferred to ADR-004/005 and relevant state owners. No Temporal, database, broker, MCP SDK, agent framework, sandbox or deployment technology is selected.

This accepted decision does not finalize aggregates or bounded contexts. Accepted on 2026-10-04 with explicit human project-owner approval recorded above. Acceptance does not authorize implementation.

## 6. Detailed Design

### 6.1 Conceptual vocabulary and necessity

| Concept | Meaning and relevant state | Why separate / candidate responsibility |
| --- | --- | --- |
| Agent | Logical governed actor able to perform a role's work using capabilities | Umbrella product concept; configured identity represented by Instance, not an extra mandatory entity |
| Agent Definition | Stable definition/type identity with versioned configuration: role, capability declarations, policy references, model requirements/settings, tool/memory policy and runtime limits | Reusable behavior contract; definition management responsibility, final module undecided |
| Agent Instance | Stable configured logical identity attributed to organization/project and tenant context, referencing a definition and permitted overrides | Distinguishes a configured employee from a role type or run; instance management responsibility |
| Task | Objective, constraints, inputs/references, expected result and acceptance criteria, with delegated authorization context references | Coordination owns objective/assignment and task outcome; runtime consumes an authorized assignment snapshot |
| Agent Execution / Run | Unique logical attempt binding instance, task/assignment revision, effective definition/configuration and initiator; lifecycle, deadlines, budget accounting, interaction/artifact references and outcome | Runtime owns its execution record and controlled state transitions |
| Workflow | Durable business coordination of runs/agents, timers, dependencies, approvals and recovery | Workflow owner, ADR-004; not the runtime attempt |
| Conversation / transcript | Interaction content or presentation history with attribution and retention policy | Content responsibility to resolve in ADR-006/011; not permission, identity or execution truth |
| Model | Provider-backed capability used for inference | Model adapter; no authority to change policy or identity |
| Tool | Controlled operation offered by an integration/execution facility | Tool owner reports invocation/effect state; runtime records correlated references |
| Sandbox | Isolated execution environment with resource/files/network lifecycle | Execution owner, ADR-008; not the agent itself |

**Agent != LLM call. Agent != Task != Run != Workflow != Conversation != Model != Tool != Sandbox.** These are semantic distinctions, not a demand for nine classes/tables/services. Stable instance identity is justified by the Virtual Office's recurring employees, cross-run attribution and revocation. A transient configured instance can have a short lifetime while still being identifiable; anonymous provider sessions cannot substitute for it.

“Backend Engineer” is a role label/configuration, not a long-lived OS process or Go subtype. Specialization composes instructions, capabilities and policy references. Do not create one service/type per job title or an inheritance hierarchy. An instance may have several runs if policy permits; an instance's displayed activity is a derived view of those runs, not one mutable global conversation or run state.

Instances may retain definition references, scope attribution, availability/disablement policy, authorized assignments and durable knowledge references. They do not implicitly retain unlimited transcripts, secrets, provider objects or all prior execution context. Runs carry private execution-local state; no hidden per-instance mutable state may leak across tasks or tenants.

### 6.2 Effective configuration and identity

A run must have a stable execution identity before dispatch and remain attributable to the effective definition/version and allowed overrides used. Record task/assignment revision, instance identity, authenticated initiator/delegator, tenant/project/resource attribution, policy references/versions, model selection metadata and configured limits. These are conceptual attribution fields, not an API schema.

Definition changes to instructions/prompts, role policy, tool capability policy, memory policy or model settings create a new attributable revision. Existing runs do not silently adopt a new definition. Dynamic revocation and restrictive safety policy may still constrain a run; log the effective policy at each consequential decision rather than treating a launch snapshot as permanent authority. Policy upgrade/resume rules belong to ADR-009/010. Secrets are referenced, not embedded in configuration snapshots.

Validate claimed identity and scope through trusted execution coordination. A model-supplied “agent name” is not authenticated identity. Duplicate admission requests must be detected or reconciled according to their business identity; a random new run ID alone does not prevent duplicate side effects. The authoritative claim/transition mechanism must prevent stale workers from advancing a run after losing ownership; fencing/leases/version checks are candidates, not selected implementations (ADR-004/005/009).

### 6.3 Capabilities versus authorization

A capability declares an operation the actor/runtime can support, not a grant to perform it on every resource. Examples for analysis include repository reading/writing, tests, shell execution, MCP tools, knowledge queries, architecture proposals, approval requests and external mutations; this is not the final taxonomy.

A conceptual request path is:

Authorized task assignment → validated operation intent → declared capability check → tenant/project/resource/action/task/environment policy → approval if required → current authorization revalidation → controlled tool/execution boundary → attributed result/effect evidence.

Effective permission is constrained by the intersection of supported capabilities, instance/task scope, resource/environment policy and any required valid approval; it cannot be enlarged by model output or tool descriptions. Denial is explicit. Enforce again at the consequential execution boundary to avoid stale authorization or a confused deputy. Approval is not a credential and does not bypass revoked policy. ADR-009/010 define identity propagation, grants, expiry, revocation and checks.

### 6.4 Capability-oriented model boundary

Model requests express needed behavior (for example structured output, tool use, streaming or multimodal input) plus permitted settings. Adapters expose documented capabilities and limitations: context/output limits, reasoning controls, caching and provider-specific features may differ. Validate compatibility before invocation; do not silently downgrade a safety-critical structured-output requirement or change data routing/provider to conceal a failure.

Keep OpenAI, Anthropic, AWS Bedrock, model names and SDK types out of core policy. Provider identity and selected model remain recorded for attribution, not erased behind an anonymous universal “LLM.” Translate outputs to validated internal results with usage, finish/interruption and error metadata. Treat proposed tool calls and generated artifacts as untrusted input; model completion is not task acceptance.

Useful provider features may be exposed through explicit capability extensions translated by adapters. They must not become SDK objects in domain policy or a generic unvalidated options bag. No final routing/fallback/caching strategy or canonical model API is selected. Any switch must satisfy authorization, data exposure, capability and budget constraints and be observable. Availability of a provider feature is not assumed without verification.

### 6.5 Execution lifecycle, wait reason and outcome

Propose five lifecycle states and an orthogonal stop request/outcome, avoiding separate states for every error or wait type:

| State | Meaning | Permitted next states / guard |
| --- | --- | --- |
| Created | Identity/configuration/task attribution exists; not admitted | Queued after validation/admission; Finished on rejection, cancellation or expiry |
| Queued | Admitted, awaiting resource/worker allocation | Running on a valid claim and current policy/budget checks; Finished on expiry, denial or stop |
| Running | Authorized owner actively advances the bounded attempt | Waiting on an identified dependency; Finished with evidenced outcome |
| Waiting | Progress is suspended on a named dependency; worker need not be retained | Queued after validated dependency resolution for resumed admission; Finished on failure, denial, expiry or stop |
| Finished | Runtime attempt no longer advances | No return to active state; retry uses a new linked run |

Normal path: **Created → Queued → Running → Waiting → Queued → Running → Finished**. Running can finish directly; early rejection/stop can finish Created or Queued without starting work.

Waiting reason is metadata, not another lifecycle machine: tool, approval, workflow coordination, external input, or a bounded retry timer. Every wait has a correlation reference, expected resolver, expiry/deadline and resume validation. A wait on a tool does not erase the tool's independent operation state. A long-lived wait records durable intent/reference and releases execution resources when feasible; it is never represented solely by a blocked goroutine. Resource release is not proof that external work stopped.

Final outcome is separate from state: Succeeded, Failed, Cancelled, TimedOut, or Indeterminate. Succeeded means the run's required result checks passed and required operation outcomes are known; coordination owns whether the task is accepted or complete. Failed means a known failure prevented success. Cancelled/TimedOut describe why advancement stopped, not the absence of effects. Indeterminate means worker loss or ambiguous evidence prevents asserting a reliable run result; it must not appear successful. Additional failure details and outstanding effects remain orthogonal.

A stop request is first-class metadata with cause, source, time and acknowledgement; “stop requested” is not already Finished. On receipt, stop scheduling new consequential work, propagate cancellation, and collect available evidence under a bounded cleanup allowance. If cleanup cannot establish termination, finish the runtime attempt with unresolved-operation references and honest effect status; the execution facility still owns any live child operation and reconciliation responsibility. No leaked process is declared stopped merely because the run finished.

Transitions require an authorized current owner, valid prior state, budget/deadline checks and a recorded reason. Duplicate/late resume and completion notifications are validated against correlation and execution ownership. Completion racing with cancellation preserves evidence and records the resolution; a late cancellation does not rewrite already established success or undo effects. Selection of atomic transition storage, clock/order authority and fencing is deferred; it is required before concurrent execution is implemented.

A Finished record's terminal lifecycle/outcome is not reopened to continue work. Later reconciliation can append linked effect evidence or a reviewed correction without erasing the original uncertainty; any continuation is a new authorized run. Workflow can remain active to reconcile while the run is terminal.

### 6.6 Cancellation and shutdown semantics

| Cause | Runtime obligation | What must not be inferred |
| --- | --- | --- |
| User cancellation | Authenticate authority, record intent, stop advancement and propagate | User intent proves tool termination |
| Workflow cancellation | Validate coordinating owner/scope, stop assigned work | Parent workflow cancel reverses committed effects |
| Deadline expiration | Stop new work, record deadline cause, bounded cleanup | Timeout means remote request failed before execution |
| Policy revocation | Block further affected operations; propagate stop where required | Pinned definition keeps revoked permission valid |
| Worker shutdown/loss | Drain or stop claims, record/reconcile incomplete attempts via authoritative coordination | A process restart means all runs were cancelled or safe to replay |
| Provider cancellation | Request supported cancellation, capture acknowledgement/uncertainty | Cancelling local streaming prevents remote processing or billing |
| Tool/process cancellation | Send a scoped stop request; obtain termination/effect evidence from owner | One subprocess cancellation proves descendants or external effects stopped |

Worker shutdown is an operational cause, not automatically user cancellation. Whether the run is continued under a new claim or ends Indeterminate depends on persisted evidence and recovery rules in ADR-004/005; no worker may guess and replay a consequential operation. UI disconnect is not implicit cancellation of long-lived work; the owning operation's explicit deadline/cancellation policy governs it.

Go `context.Context` carries local cancellation/deadlines [S1]. It is neither durable execution state nor authoritative permission. Explicit cancellation must cross process/provider boundaries using their contracts. Go process APIs [S2] do not establish sandboxing or full process-tree cleanup. Cleanup itself has a bounded, scoped allowance; do not evade cancellation with an unbounded background context that continues privileged work.

### 6.7 Failure, effects and retry semantics

Candidate failure categories are operator-facing distinctions, not a frozen error taxonomy:

| Category | Distinction needed |
| --- | --- |
| Model/provider | Transport, quota, service rejection or interruption; whether request was sent/charged is separate |
| Invalid model output | Validation/schema/tool-intent failure; no bypass via unchecked output |
| Tool or sandbox/process | Reported tool error, abnormal exit, isolation failure or unavailable environment |
| Authorization denial / policy violation | Expected rejection versus attempted forbidden action; not transient by default |
| Timeout / cancellation | Stop cause, acknowledgement and unresolved child operations |
| Dependency failure | Workflow, approval, memory or integration unavailable; no fake success fallback |
| Internal runtime defect | Unexpected state/logic failure needing operator diagnosis, not invented agent judgment |

Report category, phase, operation reference, safe diagnostic, cause, retry eligibility and effect evidence. A tool can return an error after causing a mutation; failure is not synonymous with no effect. Avoid swallowed errors and generic “agent failed” when actionable attribution exists.

Each consequential operation must distinguish conceptual effect knowledge: not dispatched; confirmed not performed; confirmed performed (possibly partial); or unknown. Cancellation/timeout/connection loss cannot turn unknown into confirmed not performed. Unknown effects require reconciliation or explicit operator handling and block automatic unsafe replay. No exactly-once claim is made.

| Retry level | Safe runtime principle | Policy owner |
| --- | --- | --- |
| Provider call | Bounded retry only when semantics, remaining budget and data policy permit; account for possible repeated inference/cost | Runtime/model adapter policy; coordination with ADR-004 |
| Tool operation | Retry only with known non-performance, idempotency or verified reconciliation; reauthorize | Tool/integration owner, ADR-007/008; delivery ADR-005 |
| Whole execution | New identity linked to prior attempt; retain prior artifacts/effects; do not silently rerun everything | Authorized coordination / Workflow, ADR-004 |
| Workflow | Durable orchestration decides recovery across runs; runtime does not create competing retries | ADR-004/005 |

One owner must control each retry boundary to avoid multiplicative framework/SDK/runtime/workflow retry loops. Retry budgets, timers and eligibility are explicit; no “intelligence” loophole. Model repair/replanning is another governed operation with consumed budget, not an excuse to ignore failures. Repair output is validated again. Compensation is an explicit authorized effect, not an automatic rollback guarantee.

### 6.8 State ownership and durability

These are conceptual responsibilities to refine through later ADRs, not final modules or shared aggregates.

| State category | Candidate authoritative responsibility | Runtime retains / durability expectation |
| --- | --- | --- |
| Definition/configuration | Definition management | Version/reference and effective permitted configuration; durable attribution |
| Instance/context | Instance management | Stable identity/scope and current eligibility; durable reference, not hidden session authority |
| Task/assignment | Project/task coordination | Authorized revision/objective/constraints reference; run does not change task acceptance privately |
| Run lifecycle/outcome | Agent Runtime | Stable identity, attribution, transitions, waits, stop intent, budget/effect summary and correlated references; required long-lived facts survive restart |
| Workflow state | Workflow | Correlation and authorized commands/results, not duplicate workflow truth |
| Memory/organizational knowledge | Memory / Sophia | Scoped retrieval and durable memory references; no hidden authority |
| Conversation/transcript | Content ownership to resolve ADR-006/011 | Selective references; content/retention is not run or policy truth |
| Tool operation state | Tool/integration owner | Request/result/effect references; operation may outlive run |
| Sandbox state | Execution facility | Environment/job/artifact/termination references; lifecycle not owned by runtime |
| Audit/telemetry | Governance audit / observability responsibility, ADR-011 | Attributed structured records/correlation; logs are not authoritative workflow state |

Ephemeral state includes goroutines, clients, local buffers, current model token assembly, cached retrieval, temporary planning context and worker claims as local handles. Durable records must include facts needed for governance, recovery and outstanding-effect tracking; exact persistence of tokens/transcripts is a privacy/retention decision, not a demand to store everything. Approval facts belong to Approval, even when runtime stores a wait reference.

A restart must not erase authoritative long-lived work. This is an architecture obligation, not a selected storage implementation or guarantee that inference can resume at an arbitrary token. Recovery must consult authoritative run, workflow and operation evidence, validate policy and determine continuation/reconciliation before advancing. The commit/dispatch gap between run records and external effects must be resolved by ADR-004/005/007 before those effects are implemented. No shared transaction across all subsystem stores is assumed.

Names such as Agent, Task and Execution are local vocabulary within an owner. Other contexts can maintain separate models and exchange minimal contracts/references. Do not place a universal Agent/Task/Execution domain model in `shared`, `common`, `core`, `platform`, `utils`, or equivalents. Domain Shared Kernels require ADR-002's explicit justification, ownership, consumers, compatibility/change rules and review. Policy-neutral utilities can be shared; intentional model duplication is preferable to accidental authority coupling.

### 6.9 Memory and conversation boundaries

Execution-local context is bounded input for this run. Retrieved context is scoped, untrusted knowledge carrying source/provenance and permissible use. Durable memory references identify separately owned records; they are not unrestricted mutable actor state. Conversations/transcripts may span runs or be absent; a chat history is not proof of task progress, permission or persistent memory.

Sophia owns organizational intelligence/knowledge responsibility, not hidden mutable agent authority. Retrieve only authorized tenant/project material within context/data budgets. Memory writes must use explicit authorized operations; do not automatically remember every secret, tool payload or transcript. ADR-006 defines working/episodic/semantic/organizational/project memory, retention and retrieval. Embeddings, vector storage and algorithms are not selected.

### 6.10 Tool, execution and approval contracts

A tool request is validated intent, never execution authority. Tool/MCP adapters must expose supported operations and truthful outcomes while preserving scope, correlation, deadlines, permission/approval references and resource limits. Arbitrary discovered descriptions cannot add grants or bypass policy. Discovery does not equal allowlisting; ADR-007 owns protocols, credential scope and tool lifecycle.

Execution facilities must conceptually accept a scoped authorized job, isolate it as required, report accepted/started/result states, expose cancellation/termination evidence, and correlate artifacts and effect uncertainty. Runtime is not the sandbox; hostile repository code, builds, tests and shell commands must not execute inside its Go control process by convenience. Workspace/network/filesystem/secret restrictions and process cleanup are ADR-008 work; no isolation technology is chosen.

When approval is required, create a governed request with stable action/target/context correlation and record a wait reference. Persist the governance fact through its owner, yield the runtime worker, and resume only from a validated decision tied to unchanged authorized intent and current policy. Changed arguments/targets or expired/revoked approval cannot be reused. The precise binding, expiry, revalidation and durable delivery protocol is ADR-010/004/005 work. A Go goroutine waiting on a channel is never the source of approval truth.

### 6.11 Workflow and multi-agent collaboration

A workflow coordinates business progress across tasks/runs/agents and can remain active across terminal runtime attempts. A run owns a bounded attempt's internal progress; a simple model/tool loop is permissible only within its governed limits. Once progress depends on durable multi-agent coordination, long business timers, approvals or recovery, the workflow/approval owners represent that coordination. This boundary adds explicit handoffs but avoids competing authoritative state and hidden framework workflow engines.

A run may wait on workflow input and later resume; it does not own workflow timers or automatically schedule another actor. Immediate serial calculations inside a run need not become a workflow step each. ADR-004 must resolve continuation granularity, durable waits and attempt recovery without conflating them with provider sessions.

Collaboration consists of explicit artifact delivery, authorized task routing, review requests, governed delegation or completion notifications. Each operation names source actor/run, receiving scope, artifact/task revision, expected outcome and authorization/audit correlation. Delegation cannot enlarge authority and needs policy/coordination permission. Agents do not directly mutate peer context or invoke each other through hidden calls. Artifact consumption is validated and tenant-scoped. An agent saying “the reviewer approved” is not authenticated human or review authority. Protocols and delivery remain ADR-004/005/007 work.

### 6.12 Concurrency and idiomatic Go mechanisms

Admission considers global, tenant, project, instance where justified, provider and tool capacity along with execution deadline, output/context limits, model token/cost budgets and sandbox resources. Bound active work and queued work; backpressure/rejection must be visible. Fairness must prevent one tenant/project consuming all capacity; algorithm and numeric quotas await workload evidence. Waiting work may release CPU/worker capacity but still counts toward appropriate durable backlog/outstanding-operation limits.

Reserve/check budgets before an operation and reconcile actual usage afterward; late/unknown provider charges are not free. Runtime-local counters cannot be the only authority where several workers share quotas. ADR-004/009/011 must resolve coordinated admission/accounting and budget updates. Quota refusal, waiting and exhaustion are explicit outcomes/reasons rather than unbounded goroutine creation.

Use Go contexts to propagate scoped deadlines/stop requests; bounded worker patterns for local admission; typed outcomes/errors; explicit composition; and small interfaces at genuine provider/tool/coordination boundaries. Context cancellation must be observed by adapters; goroutines do not create safe unlimited concurrency. Domain policy does not depend on `context.Context` as stored durable state or a bag of authority. No Go module, package structure, framework or concurrency dependency is introduced.

### 6.13 Reproducibility and observability

LLM results are non-deterministic; identical inputs may not reproduce identical outputs. Aim for attributable evidence and reproducible validation, not deterministic inference replay. Record or reference effective definition/instruction revision, task inputs and allowed context provenance, policy versions, provider/model identity and permitted configuration, model/tool requests/results, approval decisions, artifact revisions and final outcome according to data policy.

Where sensitive payloads cannot be retained, record permitted references/digests and redacted metadata and disclose the resulting reconstruction limits. Redaction must not remove the correlation needed to explain a consequential decision. Do not require private chain-of-thought; capture explicit chosen actions, policy decisions, validation and outcomes.

Runtime supports structured transition, operation, budget and outcome events tied to run/instance/task identity, effective configuration, tenant/project scope and authorization/approval references. Model metadata can include usage, latency, finish/interruption and cost evidence; tool metadata includes requested action, permitted target reference and effect status. Secrets, credentials and unnecessary sensitive payloads must not enter logs. ADR-011 owns event delivery, traces, retention, integrity and audit/telemetry distinctions; logs alone are not runtime recovery state.

### 6.14 Accepted runtime invariants

1. Agent identity/policy is independent of LLM calls, workflows, conversations, tools, processes and sandboxes.
2. Every run has stable identity, task/assignment attribution and effective definition/configuration version; identity claims are authenticated, not model assertions.
3. Role labels configure specialization; they do not imply classes, processes or permission grants.
4. Capabilities never bypass scoped current authorization or required valid approval; model/tool/repository/retrieved input cannot expand authority.
5. Lifecycle, waiting reason, stop request, final outcome and external-effect knowledge are distinct and evidence-backed.
6. Cancellation stops advancement and requests downstream termination; it never proves reversal, process-tree cleanup or absence of external effects.
7. Retry is bounded and owned at each level; uncertain consequential effects block blind replay; terminal-run retries have new linked identities.
8. Concurrent transitions and resumption require current ownership and correlation; stale/duplicate claims cannot authorize progress.
9. Concurrency, queues, waits, context/output and resource/cost use are bounded; tenant/project fairness is explicit.
10. Long-lived authoritative work and approvals cannot exist solely in Go process memory or a provider session.
11. Runtime owns run state, not all task, workflow, memory, tool, sandbox or audit state; collaboration uses explicit governed handoffs.
12. Core policy remains independent of provider/framework/MCP/workflow/sandbox SDK types; optional adapters cannot own NEXORA governance.
13. Auditability uses attributed actions and outcomes, not private chain-of-thought or false deterministic-replay claims.
14. No implicit Shared Kernel: shared names do not justify shared domain authority/models; comply with ADR-002 ownership and compatibility review.

#### 15. Agent Instance is not authority

An Agent Instance represents stable configured identity, scope attribution, eligibility/configuration references, and specialization. It is not itself a permission grant or durable authorization token.

Capabilities associated with an Agent Definition or Instance describe what the agent/runtime can support; they do not establish current authority to perform a consequential operation.

Every consequential operation MUST be authorized against current trusted policy and relevant tenant/project/resource/action/task/environment context, including valid approval where required.

Long-lived Agent Instances MUST NOT accumulate or retain stale authority merely because an earlier task, run, session, or approval possessed it.

Model output, conversation state, retrieved memory, provider sessions, cached runtime state, or an Agent Instance's historical configuration MUST NOT substitute for current authorization.

This clarification strengthens the existing capability-versus-authorization rule without deciding ADR-009 or ADR-010.

#### 16. Historical Run Attribution is immutable

Once a Run has been created, its historical attribution to the effective Agent Definition/configuration revision, task/assignment revision, initiator/delegator, and other recorded launch-time identity/configuration references MUST NOT be silently rewritten to newer revisions.

Later policy changes, revocation, safety restrictions, or authorization decisions may constrain or stop future operations within a nonterminal Run, but they do not rewrite the historical configuration that produced earlier actions.

Where consequential decisions occur under dynamically revalidated policy, record/reference the effective policy decision/version applicable to that operation without mutating prior historical attribution.

Corrections to erroneous metadata must be explicit, auditable corrections rather than silent replacement of history.

This does not require storing secrets, private chain-of-thought, or every provider payload.

## 7. Alternatives Analysis

The comparison is conceptual. No selected framework or measured productivity/cost claim supports a numeric score.

| Criterion | Thin native runtime | Framework-owned runtime | NEXORA-owned hybrid/adapters |
| --- | --- | --- | --- |
| Lifecycle control | Explicit NEXORA transitions; design/implementation effort remains | Must prove framework states match cancellation/wait/outcome needs | Core stable; adapter translates bounded internal behavior |
| Authorization/tool governance | Explicit scoped checks before effects | Hidden tool/loop paths may bypass checks; guarantees unverified | All adapter operations must cross the same governed boundary |
| Auditability/observability | NEXORA correlation and explicit evidence | Framework sessions may omit attribution or retain excess content | Translate framework telemetry without making it recovery truth |
| Provider portability | Capability-oriented adapters; adapters require maintenance | Framework feature/SDK support constrains provider choice | Useful supported features retained behind explicit extensions |
| Cancellation/failure semantics | Honest effects and stop model designed for NEXORA | Framework return/stop may not describe remote effects | Must verify cancellation, late completion and uncertainty mapping |
| Workflow/sandbox separation | NEXORA keeps independent owners | Framework can embed orchestration or local execution authority | Reject adapter behavior that usurps workflow or isolation policy |
| Testability | Direct invariant and boundary tests | Internal framework lifecycle can obscure controlled failure injection | Core tests plus adapter conformance/integration tests |
| Operational complexity | Small initial dependency surface, custom lifecycle work | Dependency upgrades and opaque behavior become core operations | Additional adapters only where benefit offsets maintenance |
| Lock-in | Core semantics owned; provider contracts still require care | Identity/state migration may bind core to framework | Restrict adapter state so framework can be removed |
| Developer productivity | Must implement genuine NEXORA behavior; avoid rebuilding generic AI ecosystem | Could accelerate features if governance compatibility is demonstrated | Reuse focused behavior without surrendering core authority; integration cost remains |

Recommend thin native ownership with a hybrid extension policy. A framework-owned option could be superior if concrete evidence shows its identity/lifecycle, scoped authority, durable attribution, cancellation/effect handling, migration and Go integration satisfy NEXORA with less total effort. No such evidence exists here; adoption without it would delegate architectural authority prematurely.

“Thin” does not mean prompt plus while loop. It means only the identity, admission, lifecycle, validation and coordination obligations needed for controlled work, with external capabilities behind real boundaries. Conversely, do not build a plugin ecosystem, generic policy DSL, universal agent class hierarchy or all-purpose distributed runtime before needs justify them. Optional framework reuse is permission to evaluate later, not a dependency decision now.

## 8. Consequences

### Positive

Governed identity and outcomes survive provider/framework substitution conceptually. Distinct subsystem responsibility prevents runtime from absorbing all organizational state. Explicit cancellation/effect uncertainty supports truthful operator intervention. Version attribution and controlled collaboration align with a real engineering organization.

### Negative

NEXORA must design and later implement lifecycle and attribution instead of outsourcing them to a framework. Boundary mapping, operation reconciliation and adapter conformance add work. Recovery, privacy and approval requirements need additional ADRs before relevant features can be built.

### Risks

A “thin” runtime can grow into an enterprise abstraction framework. A model/tool loop can bypass governance if adapters expose shortcuts. Duplicated workflow/runtime state can diverge. Cancelled runs can leave live operations. Cross-run caches/transcripts can leak tenant context. Uncoordinated retries/budgets can multiply effects/cost. Version snapshots can be mistaken for irrevocable permissions. These are design risks requiring verification, not observed runtime defects.

## 9. Security Considerations

| Threat | Runtime obligation | Major unresolved control owners |
| --- | --- | --- |
| Prompt/tool injection | Treat generated/discovered intent as untrusted; separate policy and content, validate before action | ADR-007/009/010 |
| Hostile repository or retrieved content | No execution authority from content; scoped retrieval and isolated code execution | ADR-006/008/009 |
| Capability escalation/confused deputy | Authenticate initiator/actor, bind task/resource/action, revalidate at effects | ADR-007/009/010 |
| Cross-tenant state leakage | Explicit attribution in context, artifacts, caches, memory and operation requests | ADR-006/008/009 |
| Tool privilege escalation / sandbox escape | Controlled tool/job boundary; no default execution in runtime process | ADR-007/008/009 |
| Secret/provider data exposure | Secret references and minimal context; permitted provider/data routing; redacted telemetry | ADR-006/007/009/011 |
| Forged agent identity | Trusted attribution and ownership claims; model role text is not a principal | ADR-009 |
| Replay of run/resume/approval requests | Correlate/deduplicate, validate revision/ownership/current policy, reconcile effects | ADR-004/005/007/009/010 |

Runtime architecture alone does not solve these threats. Detailed authentication, capabilities, sandboxing, encryption, revocation, audit integrity and provider retention/residency remain unresolved. Those are implementation gates for corresponding operations, not optional later cleanup. Neither in-process package separation nor a framework agent class establishes a trust boundary.

## 10. Operational Considerations

Operators need to distinguish queued, running, waiting, stop requested, terminal outcome and outstanding effects. A UI must not display cancellation as proof of no mutation. Provider outages/quota errors, slow tools, expired approvals, resource exhaustion and worker crashes require attributed failure/wait/reconciliation paths rather than fake fallbacks.

Graceful shutdown stops new claims and coordinates bounded draining/cleanup. Crash recovery uses authoritative evidence; inferred goroutine/process absence is insufficient. Runtime telemetry must reveal backpressure, wait age, retries, outstanding effects, usage/cost and error causes without secrets or private reasoning. No numeric limits, SLOs or durability implementation are asserted.

Future verification must cover state transitions, late/duplicate signals, completion/stop races, claim loss, budget exhaustion, tenant isolation, policy revocation, provider/tool capability mismatch, approval intent changes, adapter cancellation and crash recovery. Test security/effects at their real boundary; race detection [S3] helps only on exercised Go paths and cannot prove governance or recovery. No application tests, build or benchmark can run in this documentation-only repository.

## 11. Evolution / Exit Strategy

Before implementation, approve the conceptual model and resolve relevant owner contracts, durability and threat-model gates. Start with one separately authorized representative role/use case and the smallest needed boundaries; do not pre-build a complete taxonomy, framework or protocol suite.

An optional framework adoption proposal must identify concrete missing capability/productivity benefit, ADR-001-compliant runtime requirements, license/supply-chain posture, supported provider features, explicit state mapping and governed tool behavior. Demonstrate stop/retry/effect semantics, policy enforcement and adapter replacement. Framework-managed durable state cannot silently become NEXORA authority; reject or redesign adoption if that is necessary.

A removal path must preserve run/definition attribution and artifacts without depending on opaque framework sessions. Any unavoidable external state dependency needs a reviewed migration/export plan. Runtime extraction follows ADR-002's security/scaling/fault/operational evidence gate, not the number of roles or agents.

Later ADRs may expose problems with the proposed run/wait boundary or state ownership. Surface those conflicts and revise this proposal, or supersede it after acceptance through explicit owner-approved decisions. Do not modify accepted ADR-001/002 by inference.

## 12. Development Constitution Compliance

- Re-read governance, accepted ADR-001/002 and current architecture documentation before modification.
- Recorded ADR-003 Accepted on 2026-10-04 with explicit human project-owner approval and the two requested invariants; no framework guarantee, benchmark or runtime verification is claimed.
- Preserved accepted language, topology, modular ownership, inward dependencies and No implicit Shared Kernel constraints.
- Defined conceptual responsibilities and safety obligations without selecting final contexts, schemas, API contracts or infrastructure.
- Disclosed unresolved durability, tenancy, budgets, approval and isolation controls as implementation gates.
- Created documentation only; no source, Go modules, dependencies, framework, broker, MCP SDK, sandbox technology or deployment configuration.
- ADR-004 is not started; further decisions/implementation require explicit owner direction.

## 13. Related Decisions

[Constitution](../../DEVELOPMENT_CONSTITUTION.md), [ADR program](README.md), [architecture context](../architecture/ARCHITECTURE.md), [principles](../architecture/principles.md). ADR-001 and ADR-002 remain Accepted constraints.

| Future ADR | Boundary and unresolved questions |
| --- | --- |
| ADR-004 — Workflow | Durable orchestration, run continuation/attempt recovery, waits/timers, authoritative claims, cancellation coordination and retry ownership; no engine selected |
| ADR-005 — Events | Commit/dispatch gaps, ordering, deduplication, durable delivery, resume/late notification and effect reconciliation; no broker selected |
| ADR-006 — Memory | Sophia knowledge, working/episodic/semantic memory, retrieval, transcript/context ownership, retention and tenant scope; no embeddings/storage selected |
| ADR-007 — MCP & Tools | Tool contracts/discovery, capability exposure, scoped credentials, effects/idempotency and cancellation; no SDK selected |
| ADR-008 — Sandbox | Workspace/network/files/secret isolation, process trees, resource and artifact lifecycle, termination evidence; no technology selected |
| ADR-009 — Security | Identity, tenancy, resource authorization, quotas, revocation, provider data controls and runtime claim trust |
| ADR-010 — Approval | Durable action/target/config binding, validity/expiry, resume authority, changes and policy revalidation |
| ADR-011 — Observability | Runtime event/tracing/audit correlation, integrity, privacy, retention, cost accounting and reconstruction limits |

ADR-012 later owns process/deployment mapping. The responsibilities above are conceptual dependencies, not newly created ADRs or permission to implement them. Task acceptance, final bounded contexts and named module ownership remain to be resolved through domain discovery and applicable decisions.

## 14. Evidence / References

Design semantics are reasoned proposals from the current owner handoff and accepted project constraints, not proven runtime outcomes. No external agent framework has been selected or claimed conformant.

- [Accepted ADR-001](ADR-001-core-programming-language.md) — primary Go core/backend language and runtime-language justification.
- [Accepted ADR-002](ADR-002-architecture-style.md) — ownership, dependency, consistency, trust and No implicit Shared Kernel invariants.
- Repository evidence: eight Markdown files inspected before this task with `rg --files --hidden` and direct document reads; no source or runtime verification facilities present.
- S1: [Go context package](https://pkg.go.dev/context) — local deadline/cancellation propagation; not durable governance storage. Reviewed 2026-10-04.
- S2: [Go os/exec package](https://pkg.go.dev/os/exec) — process invocation/cancellation APIs; not a sandbox guarantee. Reviewed 2026-10-04.
- S3: [Go race detector](https://go.dev/doc/articles/race_detector) — exercised-path race detection, not proof of policy or durability. Reviewed 2026-10-04.
