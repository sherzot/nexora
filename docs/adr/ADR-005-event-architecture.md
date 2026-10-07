# ADR-005 — Event Architecture and Delivery Semantics

- Status: **Accepted**
- Proposal date: 2026-10-04
- Decision authority: Human project owner
- Approval date: 2026-10-04
- Approval evidence: explicit human project-owner approval in this conversation: "I approve ADR-005 — Event Architecture and Delivery Semantics as proposed." Acceptance preserves the existing architecture and all 22 event invariants without semantic modification.
- Scope: Communication semantics, reliable publication/consumption patterns and conceptual delivery ownership; documentation only
- Constraints: Accepted ADR-001 through ADR-004

## 1. Context

NEXORA coordinates controlled engineering work across owners, Agent Runs, approvals, artifacts, workflows and external integrations. Accepted ADR-002 establishes a modular initial control plane, public owner contracts, owned consistency, inward dependencies and No implicit Shared Kernel. ADR-003 owns stable Run identity, immutable historical attribution, current authorization, bounded retries, stop/outcome/effect distinctions and Indeterminate outcomes. ADR-004 accepts Temporal for durable orchestration, not domain authority or general event distribution. Workflow Definition is not authority; Workflow != Agent Run != Agent; Activities are not automatically Runs. Go remains the primary core/backend language under ADR-001.

A committed Run outcome must reliably wake its waiting workflow. A lost acknowledgement must not cause a second consequential operation. An event or signed webhook cannot grant permission or override an owner's invariants. Reliable communication is needed even when producer and consumer belong to one deployable.

All existing governance, ADRs and architecture documents were inspected. The current owner handoff authorizes this proposal and supersedes earlier scope text prohibiting ADR-005; no material conflict with accepted decisions was found. Accepted ADR-001–004 remain unchanged. Tenancy, final data owners, transactional stores, capacity, recovery objectives, retention, compliance, cloud preference and integration protocols remain unknown. PostgreSQL is not accepted as the database for every module; Temporal hosting remains ADR-012 work. No benchmark or operational evidence justifies a broker selection or numeric comparison.

## 2. Problem

Define how facts, action requests, workflow inputs, external messages and evidence cross ownership boundaries without missing committed publication, duplicating unsafe effects, inventing exactly-once guarantees, or creating a universal event model/bus.

Separate four successes: owner transaction committed; publication durably accepted; recipient processed input; consequential operation outcome known. These are different acknowledgement boundaries. A transport acknowledgement is not business completion.

## 3. Decision Drivers

- Preserve semantic ownership and current authorization across every entry path.
- Close domain commit/publication and consumer commit/acknowledgement gaps.
- Recover after crashes, duplicate delivery, long outages and uncertain external effects.
- Make identity, ordering, version compatibility, replay and recovery responsibility explicit.
- Preserve Temporal's explicit multi-step orchestration and runtime-owned Run semantics.
- Bound backlog, retries, fan-out, concurrency and per-tenant resource/cost use.
- Add infrastructure only for demonstrated communication needs; retain a credible transport replacement path.

## 4. Considered Options

1. **Best-effort post-commit sends/local callbacks only:** simple but insufficient for business-critical asynchronous consequences.
2. **Semantic boundaries plus durable publication/consumer patterns, without an initial general-purpose broker:** direct contracts, local events, Temporal inputs and owned integration adapters.
3. **Introduce a broker now:** Kafka-compatible retained log, NATS JetStream, RabbitMQ or AWS messaging; still needs publication, deduplication and effect-safety patterns.
4. **Use Temporal as a universal event bus:** consolidate infrastructure but conflate orchestration and distribution.
5. **Default Event Sourcing:** make domain event histories the persistence source of truth, beyond reliable publication alone.

## 5. Decision

**Accept option 2: intentional communication contracts and at-least-once-safe asynchronous processing, with Transactional Outbox where committed owner state must reliably cause cross-boundary publication, and Inbox/equivalent durable consumer deduplication where needed. Do not select an initial general-purpose distributed broker or adopt Event Sourcing by default.** Accepted on 2026-10-04 with explicit human project-owner approval. Acceptance does not authorize implementation.

Use direct synchronous owner contracts when an immediate answer/invariant is needed. Use local domain events for meaningful internal reactions with explicit transaction/failure semantics. Use Temporal for durable process dependencies/waits and owned adapters for integrations. Durable communication may be necessary within the monolith; asynchronous communication does not require a broker.

Business-critical asynchronous obligations MUST NOT rely solely on a send after commit. Atomically persist owner state and publication intent in the same transactional boundary, or establish a separately reviewed equivalent recovery protocol. Transactional Outbox is the preferred conceptual pattern when that atomicity is available [S1]. Consumer-side local changes and processed identity should commit together where possible. External effects require their own idempotency/reconciliation contract.

**Accepted architectural commitments:** reliable intent, stable identity, duplicates expected, bounded recovery, scoped ordering, owned contract evolution and honest effects. **Undecided implementation choices:** stores/tables, polling versus CDC, relay topology, locks/leases, schema registry, wire encoding, retention periods, broker/client libraries and cloud configuration. No universal publication framework or final module/package tree is defined.

Challenge to the recommendation: without a broker, durable target delivery tracking and recovery are still infrastructure responsibilities. This proposal does not authorize rebuilding a generic broker in the Outbox relay. If independent consumers/fan-out/retained replay or buffering make that mechanism complex, adopt suitable infrastructure through an evidence-based ADR rather than repeatedly extending the relay. Neither a broker nor Event Sourcing by itself closes arbitrary database/external-effect gaps.

## 6. Detailed Design

### 6.1 Communication taxonomy

Names below illustrate semantics, not final Go types, wire schemas or context definitions.

| Kind | Meaning / example | Ownership and guarantees |
| --- | --- | --- |
| Domain Event | Internal business fact, e.g. `AgentRunFinished` | Originating domain owns meaning; local reaction is not automatically durable/public |
| Integration Event | Deliberately published cross-boundary fact, e.g. a versioned Run-finished contract | Producer owns contract and attribution; consumer owns its reaction; translated from internal model |
| Command | Request to attempt an action, e.g. `StartAgentRun` | Addressed authoritative owner validates current policy/invariants; accepted/rejected/completed are distinct results |
| Workflow input | Governed start, Signal or Update targeting orchestration | Correlated adapter translates a fact/request into engine input; not itself a domain fact |
| External Event / Webhook | GitHub, CI or integration notification | Untrusted until authenticated, validated, correlated and translated; authenticity != authorization |
| Notification | Presentation/information delivery, e.g. UI progress | May be lossy/coalesced only when contract says so and authoritative refresh exists; no critical work depends solely on it |
| Audit Record | Attributed governance/security/operator evidence | Audit owner sets integrity/retention; not automatically an integration contract or source of business state |
| Event Stream | Deliberately retained ordered collection within a named scope, with cursor/retention/replay contracts | Useful when independent historical consumption is required; not every queue or event list is a stream |

**Command != Event. Event != Authorization. Event != Audit Record. Workflow Signal != Domain Event. Broker Message != Business Truth.** Query is a read interaction, not a mutation or an event merely because a transport carries it. Infrastructure envelopes cannot change these meanings. A reusable technical envelope may carry identity/tracing; a universal domain `Event` entity or generic event handler cannot become an implicit Shared Kernel.

### 6.2 Local interaction versus durable reaction

A direct call uses an owner's public application contract and explicit error/deadline/transaction behavior. Synchronous rejection can be appropriate when a caller needs current eligibility or an immediate invariant check; events must not hide that dependency.

A domain event raised before commit is tentative until the transaction succeeds. Handlers participating in that transaction must have explicit allowed ownership/consistency and rollback behavior. They cannot perform irreversible external effects before commit and call them rolled back afterward. Do not widen a transaction across owners by sharing its handle through an event.

Post-commit in-memory reactions are useful for disposable projections/notifications only with a documented loss/rebuild policy. A required business reaction is persisted as publication/processing intent, even if its recipient is in-process. No goroutine/channel or local callback registry provides restart durability. A failed local handler must have a visible failure and assigned responsibility, not silent swallowing.

### 6.3 Transactional Outbox and publication boundary

Conceptual flow:

Owner transaction → owner state + publication intent → COMMIT → relay/publication boundary → named target transport/adapter → consumer.

The state owner owns whether/what fact or command is emitted, its stable identity and contract revision. Publication machinery owns attempts/status under that declared intent, not business truth. It accesses a narrow owner-authorized publication contract, not arbitrary private tables or business writes. Logical ownership applies even when technical persistence is shared.

Required when committed owner state must reliably cause an asynchronous cross-boundary reaction: Run outcome to workflow; accepted task assignment to a durable coordinator; an owned decision to another owner/integration. It is unnecessary for pure calculations, ordinary synchronous queries, or local tentative events already handled within the required transaction. It does not imply a table for every domain event. Outgoing commands can use durable publication intent too, while remaining commands.

Persist state and intent atomically; neither is visible as committed without the other. Publish only committed intent. Publishing before state commit can expose a fact later rolled back and is prohibited for that fact contract. If state/intent cannot share a transaction, this Outbox guarantee does not apply: choose an owner-supported atomic append/CDC/recovery design and prove the gap is closed before implementation, rather than assuming two stores commit together.

Relay reclaims pending work after crashes, retries bounded attempts with backoff, and retains durable pending/quarantined responsibility when automatic retries exhaust. A publisher claim/lease is not proof remote delivery did not happen. Multiple publishers need concurrency/claim safety; precise fencing and storage mechanisms remain implementation gates. A lost acknowledgement may cause duplicate publication with the same logical message identity.

Distinguish conceptual status, without freezing a state-machine/schema: intent committed; attempt active; target acceptance confirmed/unknown; required consumer disposition pending/recorded; quarantined with owner/reason. **Published** may mean only target's durable transport acceptance. It must not mean “all consumers finished” or “external effect completed.” Direct delivery needs a documented durable consumer acceptance or committed-processing acknowledgement; enqueueing in process memory is insufficient. Record per-target obligations where fan-out is required, so one success cannot discard another target's pending work.

Persist contract version, trusted tenant/project attribution, business references, correlation/causation and only necessary permitted payload. Logical payload is stable across retries; attempts carry separate diagnostics. Retain unresolved intents, target dispositions and reconciliation evidence; cleanup requires a reviewed policy after all required responsibilities are satisfied. An Outbox is a delivery obligation store, not permanent audit or Event Sourcing. Exact retention depends on outage/replay/deduplication horizons and privacy decisions. A new consumer's historical needs do not automatically justify retaining every Outbox forever.

### 6.4 Inbox, local atomic processing and external operations

For a business-critical consumer whose reaction changes its transactional state:

Validate trusted producer/scope/contract → check/claim consumer-scoped logical message identity → apply owned business transition + record processed identity/result in one transaction → commit → acknowledge.

The conceptual deduplication identity includes intended consumer/processing purpose and trusted producer/scope as appropriate; one consumer processing a fact must not suppress another's independent reaction. Concurrent duplicates require atomic uniqueness/serialization or equivalent owner mechanism. A durable natural business-operation identity can replace a separate Inbox when it proves the same behavior; no Inbox table/schema is mandated.

If processing fails before commit, neither business transition nor processed marker commits. If commit succeeds but acknowledgement is lost, redelivery finds recorded disposition and safely acknowledges without repeating work. A marker committed before the required business transition can lose work; a marker committed afterward in another transaction can duplicate it. A temporary “claimed” record is not completed processing and needs crash recovery.

A consumer that must invoke an external API cannot wrap the remote mutation in its local transaction. Prefer atomically record a durable owned operation intent (and processed message disposition) then acknowledge acceptance of that obligation; a separately governed executor dispatches/reconciles it. Alternatively use a proven remote idempotency contract. In either case, command accepted != operation complete. The Inbox alone does not prevent an effect after crash or recover a lost response.

Establish stable operation identity/input binding before dispatch; repeated attempts reuse it only for the same intended operation. Verify target-enforced idempotency and its retention, or reconcile remote evidence. Unknown effects block blind consequential retries; retain Indeterminate and partial/performed/unknown evidence through the actual owner. Manual resolution and compensation are explicit authorized operations. Message redelivery cannot reopen a terminal Run: return existing evidence, or create a new linked Run only for a separately authorized semantic retry. Historical launch attribution stays immutable.

### 6.5 Delivery guarantees and limits

| Semantics | Accepted use / limit |
| --- | --- |
| At-most-once / best effort | Optional transient presentation updates with authoritative refresh; loss disclosed, never sole trigger for required work |
| At-least-once-safe | Default design for business-critical async obligations: persist before acknowledging, recover/retry, expect duplicates |
| Effectively-once | Narrow description of one consumer's local transactional reaction when processed identity and state change commit atomically, concurrent duplicates are prevented, and deduplication covers the permitted delivery horizon |
| Exactly-once | No universal claim. Any product guarantee must name its storage/processing boundary and failure/retention assumptions; never extend it to arbitrary external APIs |

“At least once” is a target delivery contract under available durable storage, recoverable service, supported messages and retained obligations—not unconditional eventual success during permanent outage, expired retention, policy denial or poison input. Bounded automatic retries may end in durable quarantine/reconciliation instead of delivery; business responsibility cannot disappear. Implementation must set retry/retention and recovery targets before claiming an operational guarantee.

Producer retry, relay retry, consumer retry, transport redelivery, Run retry and workflow restart have separate owners/budgets. A send timeout means unknown acceptance, not proof of non-delivery. Consumer success before lost acknowledgement is normal duplicate territory. Neither idempotent publication nor a broker transaction grants permission or resolves arbitrary external effects. Kafka's transactional topic/offset processing boundary, for example, requires destination cooperation outside Kafka [S2].

### 6.6 Identity, correlation and causation

Conceptual metadata, not a frozen envelope:

- Stable logical message/event ID, kind/type and intentional contract version.
- Producer/semantic owner, occurrence time, trusted tenant/project scope and applicable entity/aggregate reference.
- Correlation ID identifying a process/task relationship; causation ID referencing the triggering message/operation.
- Source Run/workflow/operation and definition/revision references when meaningful.
- Trace context and sensitivity/classification/retention hints where justified; these are validated metadata, not authority.
- Separate delivery attempt/target/consumer identity and diagnostics.

Event identity != business entity identity != delivery attempt identity. One Run can produce several distinct facts; repeated publication of the same fact keeps its ID. Reuse of an identity with conflicting payload/scope is an integrity defect: reject/quarantine, never silently treat it as an ordinary duplicate. A genuinely new correction/fact has a new identity linked to the earlier record, not overwritten history. A transformed integration contract explicitly records source causation and its own semantic identity; transport replacement preserves that identity.

Example: `TaskAssigned` event E1 correlates to Task #123 → `StartAgentRun` command C1 has causation E1 and the same process correlation → `AgentRunFinished` event E2 has causation C1/operation reference and independent event identity. Task correlation can span many transactions/Runs; trace context may be sampled/lost and cannot be the sole durable correlation. No ID is an authorization token.

### 6.7 Ordering and concurrent state

No global order is required. It would serialize unrelated tenants/entities and add coordination/availability costs without an established invariant. Producer-local order, entity revision order, workflow-input order and broker partition order are different contracts. An event's wall-clock occurrence timestamp is evidence, not a safe concurrency/order authority.

For an order-sensitive consumer, define the scope and monotonic owner revision/sequence or expected predecessor. Reject/defer stale transitions and detect gaps; reconcile/query authoritative state through the owner's contract or buffer within bounded limits. Snapshot-style projections may safely ignore older revisions; delta-style consumers may need contiguous sequence processing. Neither rule is universal.

Parallel relays, retries and independent producers can reorder messages. A partition key cannot alone make concurrent application processing/side effects ordered. If strict per-entity ordering is required, preserve it through relay, transport, consumer concurrency and owned transitions. A poison predecessor cannot be skipped without reviewed consistency handling; isolation per key avoids blocking unrelated work. No global sequence implementation or partition layout is selected.

### 6.8 Contract evolution and replay

Producer owns a deliberately designed integration contract with named consumers and compatibility/change rules. Do not serialize internal entities/repositories/provider payloads as permanent public contracts. Consumer validates type/version/scope/required semantics and payload bounds at ingress.

Additive optional fields may be compatible only if old readers tolerate them and defaults preserve meaning. Removal, renaming, changed units/meaning, newly required fields and changed authority/outcome interpretation can be breaking even if JSON parses. Use a new intentional contract revision/type and a producer/consumer rollout plan. Deploy compatible consumers before enabling new required semantics, retain old handling through the permitted delivery/replay horizon, and track which versions remain outstanding. Dual publication needs explicit equivalent-operation deduplication; different envelope IDs must not cause two effects for one business intent.

Historical messages retain their original attribution/version; translation/upcasting must be explicit, attributable and semantically valid. Unsupported historical contracts quarantine or go to a compatible handler, not perpetual retry or guessed defaults. Schema validation is required where appropriate, but no schema registry/encoding/library is selected.

| Mechanism | Meaning and safe boundary |
| --- | --- |
| Transport redelivery | Same logical message after missing/negative acknowledgement; same ID |
| Consumer retry | Another processing attempt under the same consumer purpose/message; current policy and effect knowledge apply |
| Event replay/backfill | Explicit selected historical input to a named purpose/job, with bounded scope, compatible handler and reviewed effect policy |
| Temporal replay | Reconstruct deterministic orchestration from recorded history; not external event redistribution or fresh API calls |
| Audit reconstruction | Read evidence to explain actions, not execute them or reconstruct business state automatically |

Replay may rebuild a projection under a distinct processing-purpose identity without clearing live deduplication. Live consequential consumers must not subscribe implicitly to backfill. Administrative replay is authenticated/authorized, tenant-scoped, previewed and attributed; default historical processing is observation/projection, not renewed external effects. Intentionally issuing a new consequential operation needs current permission/valid approval, new operation identity and links to original evidence. Restoring old deduplication checkpoints must also reconcile effects already performed.

### 6.9 Temporal ↔ event interaction

Temporal is orchestration infrastructure, not a universal event broker, integration event store, audit system or owner of business facts [Accepted ADR-004].

**Event → Workflow:** committed fact/intent → reliable publication → authenticated, authorized and correlated adapter → Temporal Start/Signal/Update. The adapter selects the intended logical workflow and expected Run/step/revision, never arbitrary payload-supplied tenant/engine identity. Creation versus resumption is explicit; a late completion must not recreate a closed workflow accidentally. Unknown start acknowledgement needs stable start/operation correlation and reconciliation, not a new random workflow.

**Workflow → Domain:** Activity → owned application operation → validated current policy/invariants → domain state + any required publication intent committed together. Retrying the Activity reconnects to the same operation/Run; it does not privately write another owner's state or generate new semantic work. External/nondeterministic operations stay outside deterministic Workflow code.

**Agent Run → Workflow:** runtime atomically records outcome and required correlated notification intent → publisher/adapter delivers → workflow deduplicates input and checks expected Run/wait/step → reads/reconciles authoritative evidence where needed → current authorization before consequential continuation. The notification preserves outcome and effect uncertainty rather than treating “finished” as “succeeded with no outstanding effects.”

`DB commit + Temporal Signal` is **not** one atomic transaction. Use the originating owner's Outbox/equivalent reliable intent. Once Temporal durably accepts a Signal, transport responsibility may be fulfilled, but worker handling and business completion remain separate. Signal retries can duplicate logical input; workflow needs application-level deduplication/step guards. Carry required identity/wait state across Continue-As-New and safely drain/complete handlers before rollover [S3]. Engine-local request IDs cannot replace end-to-end operation identity.

Updates expose acceptance/completion and results, but validation rejection is not automatically an audited business rejection. Queries read state and cannot serve as durable commands. Define which acknowledgement the adapter is waiting for and reconcile timeout ambiguity [S3]. If delivery to a closed/missing workflow is permanently invalid, quarantine/record disposition and invoke owner recovery rather than infinite retry. Where handling itself must be confirmed, track an explicit correlated processing receipt or reconcile via an owner-supported status contract; engine acceptance alone is insufficient.

A publication acknowledgement can close one transport obligation while a workflow wait remains legitimately unresolved. Detect unmatched outcomes/waits through recovery checks, retaining domain facts and correlations according to policy. Durable workflow state coordinates timers and dependencies; it does not ingest every fact just to make it durable.

### 6.10 Orchestration, choreography and notifications

Use Temporal when one durable process coordinates dependent steps, approvals, rework, retries, cancellation and outcome. Do not recreate that process as an invisible chain of event consumers with no coordinator. Independent reactions to a fact—such as refreshing a projection and separately preparing an informational notification—can use choreography with explicit own failure/recovery contracts. Consumer dependencies must remain reviewable; an event bus cannot hide semantic cycles.

UI notifications can be coalesced/disconnected and refreshed only where harmless. Required approval decisions, cancellation requests, Run outcomes and execution evidence are durable owner inputs/facts; they are not downgraded to lossy UI traffic. Notifications cannot become the backend source of truth.

### 6.11 Accepted event invariants

1. Command != Event; commands request action and facts describe owned occurrences.
2. Event != Authorization != Audit Record; transport trust/IDs/history cannot grant current permission.
3. Workflow Signal != Domain Event; Broker Message != Business Truth.
4. Domain Events and Integration Events have explicit, separate semantic owners/contracts.
5. Required cross-boundary consequences of committed state MUST have atomically persisted publication intent or a reviewed equivalent gap-closing protocol.
6. At-least-once-safe processing assumes duplicates; acceptance, processing and known effect are distinct.
7. Duplicate input MUST NOT itself authorize duplicate consequential effect; unsafe uncertainty is reconciled or stopped.
8. Unknown external effects block blind consequential retry and retain attributed responsibility/Indeterminate evidence.
9. Logical message identity and semantic input remain stable across redelivery; attempts have separate identity.
10. Ordering is scoped and verified through owner revisions where needed, never inferred solely from timestamps.
11. Integration contracts are intentionally versioned; internal domain objects do not become universal public payloads.
12. External inputs are untrusted until authenticated, validated, correlated and translated; authenticity is not action authority.
13. Replay/backfill is explicit, purpose-scoped and governed; it MUST NOT casually reproduce side effects.
14. Temporal coordinates workflows; it is not the universal event bus or complete audit system.
15. Event infrastructure MUST NOT become an implicit Shared Kernel or bypass public owner boundaries/inward dependencies.
16. Publication, consumption, fan-out and recovery are bounded and tenant-aware; retries share declared budgets.
17. Quarantine/DLQ and transport acknowledgement MUST NOT erase unresolved business/effect responsibility.
18. Secrets/credentials/private chain-of-thought MUST NOT enter payloads; sensitive data/references are minimized and governed.
19. Observability records/projections do not become business authority; current owners validate consequential operations.
20. Consumer processing identity and transactional business changes commit atomically where claimed; external APIs are outside that guarantee.
21. Run retry/history/cancellation semantics remain ADR-003/004-compliant; redelivery cannot reopen terminal Runs or rewrite attribution.
22. Every durable delivery obligation has a named owner, target, acknowledgement boundary, retention/recovery policy and explicit unresolved disposition.

These are accepted architectural obligations, not implemented controls or operational guarantees.

## 7. Alternatives Analysis

### Initial options and Event Sourcing

| Option | Benefit | NEXORA limitation / disposition |
| --- | --- | --- |
| Best-effort sends only | Small local mechanism | Loses required work after commit/crash; retain only for explicitly disposable reactions |
| Owned durable patterns, no broker initially | Fits modular control plane plus Temporal; limits infrastructure while closing required gaps | Relay, consumer tracking and recovery still need engineering; recommended conditionally |
| Broker now | Independent buffering/fan-out/retention can reduce custom delivery work | No established scale/fan-out/hosting evidence; adds operational/trust surface and still needs Outbox/consumer contracts |
| Temporal as universal bus | Reuses an accepted service | Wrong semantic owner and distribution model; reject universal use |
| Default Event Sourcing | Domain reconstruction/history and temporal analysis can be product features | Requires event completeness, evolution, replay/privacy and projection discipline; no such requirement established |

**Do not adopt Event Sourcing by default.** Ordinary owner state remains authoritative; domain facts, Integration Events, Outbox intents, audit records and Temporal history can all coexist without business state being reconstructed from an event stream. Event Sourcing could be justified for a specific owner if reproducible historical business-state reconstruction is a concrete requirement and privacy/evolution costs are accepted. That requires its own architecture decision, not inference from the word “event.” Audit needs alone do not prove an event-sourced domain model is necessary.

### Future broker categories, none selected

The following is qualitative capability comparison and architectural inference, not measured NEXORA performance. Kafka-compatible implementations need their own conformance evaluation; Apache behavior does not prove all products/Go clients support identical features.

| Candidate/category | Queue/pub-sub/log, fan-out and replay | Ordering / failure semantics | Operations, managed options and Go fit |
| --- | --- | --- | --- |
| Kafka-compatible retained log | Retained partitions; independent consumer groups/cursors support fan-out and historical consumption | Partition-scoped order; configured durability/offset handling matter. Kafka topic transactions can atomically coordinate outputs/offsets, not arbitrary API effects [S2] | Plan partitions, storage/retention, replication, group lag and recovery. Self-managed or managed service needs provider evaluation. Go client feature/transaction compatibility remains a gate [S11] |
| NATS JetStream | Persisted subject-bound streams and independently tracked consumers, including shared work; replay from retained positions | Acknowledgements/redelivery support at-least-once; retention/storage/consumer configuration matters. Core NATS alone has at-most-once live delivery [S4] | Replication, subjects/permissions, storage and consumer limits remain responsibilities. Managed versus self-host requires review; Go client available, no selection [S12] |
| RabbitMQ | Exchange routing/fan-out to queues and competing consumers; separate Streams provide retained-log/replay behavior | Publisher confirms != consumer acknowledgements. Redelivery/concurrency complicate processing order; queues are not automatically a replayable log [S5, S6] | Review queue type/durability, prefetch, replication and recovery; managed/self-host option is deployment evaluation. Maintained AMQP Go client available [S13] |
| AWS SNS/SQS | SNS fan-out with subscription delivery policy; SQS queues buffer consumer work, usually one queue per independent reaction | Standard SQS permits duplicates; FIFO-specific order/deduplication scope requires separate analysis. SNS retries are endpoint-specific; DLQ/retention matter [S7, S8] | Managed AWS resources reduce broker administration; IAM, quotas, cost and cloud coupling remain. AWS Go SDK is available [S14] |
| AWS EventBridge | Rule-based managed event routing; archives/replay are separate capabilities, not generic consumer-group log behavior | Retry/age limits and DLQ disposition matter; archive replay order need not match original order [S9, S10] | Strong AWS integration fit when intentional; target policies, quotas, archive retention and cost require evidence. Uses AWS API/Go integration [S14] |

Any advertised exactly-once feature must be evaluated within its precise persistence, deduplication window and acknowledgement boundary before use. It never establishes exactly-once provider/sandbox/repository mutation. A managed broker may reduce staffing burden enough to justify cloud coupling; no cheapest or most reliable candidate is asserted.

### Adoption triggers

Review broker adoption when evidence establishes independent extracted services/consumer lifecycles, multiple independent required consumers, high fan-out, prolonged producer/consumer availability decoupling, buffering/backlog beyond the direct publication design, throughput/independent scaling needs, cross-region distribution, retained historical replay, or an integration ecosystem needing a standard transport.

A trigger starts evaluation, not automatic Kafka adoption. Record workload/latency/recovery/retention budgets, measured backlog/fan-out, owner contracts, security, staffing, managed cost and migration readiness. “Project became large,” “agents use events,” or “Temporal already exists” is insufficient. If reliable initial direct delivery would require recreating a broker, that complexity is itself evidence to reconsider before implementation.

## 8. Consequences

### Positive

Required publication survives process crashes conceptually. Distinct semantic contracts preserve ownership and prevent messages becoming authority. Duplicates/effect uncertainty are explicit. Initial infrastructure stays aligned with modular architecture, and transport adapters can evolve without redefining domain facts.

### Negative

Outbox/consumer bookkeeping, compatibility, retention, target acknowledgement and recovery must be engineered. Async reactions have visible lag and eventual consistency. Broker-free operation still needs durable backlog monitoring and operator procedures; it is not zero-cost infrastructure.

### Risks

Relay complexity can become a homemade broker; premature broker adoption can hide rather than solve gaps. Cleared deduplication markers, unbounded retries, accidental cross-tenant routing, stale authority, replayed mutations, hidden choreography and universal event types can violate accepted constraints. Documentation alone does not prevent these failures.

## 9. Security Considerations

Authenticate producer/transport identities and authorize publication/subscription/consumption scopes. Trusted tenant attribution comes from authoritative bindings, not a payload's claimed tenant or a subject/topic name alone. Consumer verifies message scope against both its trusted context and target resource ownership before reads/writes. Tenant mismatch rejects/quarantines with restricted evidence and no cross-tenant mutation. Internal transports, publisher credentials and historical signatures do not grant current action permission.

Every consequential owner operation revalidates current trusted policy, tenant/project/resource/action/task/environment and valid approval where required. Command/event/Workflow Definition/Agent Instance history cannot override domain invariants or widen Run grants. Stale workers/claims need owner-enforced fencing before effects; detailed mechanism and revocation races belong to ADR-009/010.

Webhook path: authenticate/signature-check raw bytes → basic type/size/action validation → trusted tenant/resource correlation → durable source-identity deduplication/receipt → translation → owner/workflow boundary. Return success only after the promised durable acceptance or completed processing; acknowledge-before-memory-only scheduling loses work. GitHub documents signatures/secrets, delivery IDs reused on redelivery, and timely responses [S15, S16]. Do not assume all providers retry indefinitely or share these semantics; recovery of missed source deliveries needs integration-specific reconciliation.

A valid signature proves source authenticity/integrity under its secret, not freshness, relevance or current authority. Replay protection needs source-scoped identity, permitted freshness where available and retained deduplication evidence. Arbitrary caller-supplied delivery IDs are insufficient authentication. Unsupported/forged/replayed input is not converted into a trusted internal fact merely by deserialization.

No credentials/secrets/private chain-of-thought in messages. Minimize PII, repository content, provider output and raw webhook evidence; scoped references still require access/retention controls. Preserve permitted original evidence/digests when needed, with explicit reconstruction limits. Treat content as untrusted to prevent model/tool injection; validate links/resource targets through controlled adapters. Broker/publisher/admin permissions, encryption, residency, replay access and redaction/deletion versus deduplication retention remain ADR-006/007/009/011/012 gates. No runtime security controls are claimed verified.

## 10. Operational Considerations

### Failure classification and quarantine

| Category | Response |
| --- | --- |
| Transient infrastructure / temporary dependency failure | Bounded backoff under shared budgets; pending durable responsibility remains |
| Invalid message / unsupported version | Reject/quarantine with diagnostic/version; no blind retry |
| Authorization failure | No effect; record denied disposition. Later retry requires reviewed eligibility/current policy, not default looping |
| Domain rejection | Explicit business result, not necessarily technical poison; acknowledge only recorded disposition |
| Consumer defect | Quarantine/pause affected scope, diagnose compatible fix; protect unrelated keys/tenants |
| Permanently unrecoverable input | Attributed final/recovery disposition; do not erase required business responsibility |
| Unknown external effect | Reconciliation queue/owner/manual review; automatic consequential retry blocked |

Quarantine/DLQ is a durable operational mechanism, not a place failed business work disappears. Preserve tenant, message/contract, consumer/target, correlation, attempts, safe diagnostics and effect evidence; assign recovery owner and visible age/escalation. If acknowledging original transport after quarantine, durable custody must already exist. Redrive preserves logical identity and rechecks compatibility/current authorization/effects. Payload correction creates explicitly linked revised input, not silent replacement. No broker-specific DLQ is selected.

### Failure walkthroughs

| Scenario | Expected behavior / remaining uncertainty |
| --- | --- |
| A — Domain commit, publisher crashes before send | State and publication intent committed together; recovery resumes pending publication. Store/relay recovery mechanism and targets remain to implement. |
| B — Send succeeds, publisher crashes before marking | Retry same message; recipient deduplicates. Confirmed transport acceptance is not consumer completion. |
| C — Transport redelivers | Validate identity/scope; recover existing consumer disposition or process atomically. No new semantic Run/effect merely from delivery. |
| D — Consumer commits, acknowledgement lost | Processed identity/state already committed; redelivery returns prior disposition and acknowledges. Requires atomic owner transaction. |
| E — Remote mutation succeeds, response lost | Outcome unknown; reconcile target with stable operation identity or stop for manual disposition. Inbox cannot prove no effect. |
| F — Same event twice | Concurrent duplicates converge on one consumer purpose/operation; conflicting content under same ID quarantines. |
| G — Out-of-order events | Scoped owner revisions/expected predecessor detect staleness/gaps; defer/reconcile with bounded buffer. Do not order by timestamp alone. |
| H — Consumer unavailable hours | Persist target obligation/backlog, backoff and alert; admission/fairness protects capacity. Retention/outage horizon must be agreed, not infinite retention. |
| I — New contract with old consumers | Compatible evolution or versioned coexistence; unsupported input quarantines with recovery owner. Retain compatible handlers through replay horizon. |
| J — Malicious webhook replay | Source verification plus durable deduplication/freshness and current authorization; no repeated consequential effect. Provider-specific protections remain to define. |
| K — Outcome committed, Temporal notification fails | Outbox retains intent; retry same correlated input. Missing/closed workflow is explicit recovery disposition; monitor pending waits and unmatched outcomes. No DB/Temporal atomicity claimed. |
| L — Tenant A routed toward Tenant B | Compare trusted producer/message scope, consumer context and resource owner; reject before sensitive reads/effects, record security evidence and repair route. Transport naming cannot authorize it. |

### Backpressure, observability and recovery

Bound relay batches/concurrency, per-target backlog, per-tenant admission/fairness, consumer concurrency, payload size, ordering buffers, retry attempts/deadlines and replay fan-out. Downstream outage must not exhaust unlimited memory/goroutines or bypass provider/tool budgets. Persist existing accepted obligations; when durable capacity is exhausted, stop/reject new admission explicitly rather than silently drop critical messages. Counts/age and outstanding effect responsibility remain visible when attempts are paused/quarantined. Quotas, scheduling algorithm and numerical limits remain unselected.

Track producer and why, causation/correlation, tenant/project, source workflow/Run/operation, target/consumer purpose, publication acceptance, duplicate/attempt counts, processed disposition, latency/age, contract failures and known effect/reconciliation owner. Trace IDs supplement durable identity; event logs != audit system. ADR-011 defines complete integrity/privacy/retention and operator reconstruction, including denied/admin actions.

Disaster recovery must restore state, intent, consumer identities and operation evidence consistently. Rewinding an Inbox or Outbox checkpoint can resend messages for effects already performed; reconcile before dispatch. Broker backups alone cannot restore NEXORA business truth. ADR-012 sets RPO/RTO, recovery drills and storage/retention assumptions. No reliability figure or delivery-latency guarantee is asserted.

Future separately authorized verification must exercise A–L, including concurrent duplicates, atomicity rollback/crash points, lost acknowledgements, uncertain remote effects, stale claims/revocation, terminal Run identity, tenant mismatch, contract rollout, replay isolation, long outages/backpressure, quarantine recovery and checkpoint restore. No source/tests/schema/broker configuration is created here.

## 11. Evolution / Exit Strategy

Domain/Application → Owned Integration Contract → Publication Boundary → initial direct/Temporal/integration adapter or future broker adapter.

Core policy does not import Kafka/NATS/RabbitMQ/AWS message types. Preserve logical identities, tenant attribution and semantic contract/version through transport changes. SDK delivery tags/offsets/request IDs remain adapter metadata, not domain entity identity. No promise of effortless replacement: routing, retention, ordering, consumer identities, replay and permission controls still need migration work.

Broker adoption requires a reviewed Proposed ADR and separate implementation authorization. Define target acknowledgements, consumer takeover, draining old obligations, deduplication across old/new paths and cutover recovery before migration. Dual transport delivery may occur but must preserve semantic identity and operation deduplication; do not create permanent dual business writers. Reconcile outstanding/quarantined work before retiring an adapter; deletion requires owner permission.

Exit from Event Sourcing is not relevant because it is not adopted. If later proposed for a specific context, evaluate reconstruction semantics and migration separately. Subsequent security/retention/workload findings can revise this proposal or require explicit supersession after acceptance, not silent drift in Accepted ADRs.

## 12. Development Constitution Compliance

- Re-read constitution, agent scope, ADR convention, Accepted ADR-001–004 and all current architecture documentation before edits; surfaced scope override and unknowns.
- Preserve Go language policy, modular/inward/public ownership, No implicit Shared Kernel, runtime identity/effects and Temporal infrastructure/not-authority invariants.
- Recorded ADR-005 Accepted on 2026-10-04 with explicit human project-owner approval; the existing architecture and all 22 event invariants remain semantically unchanged. Acceptance does not authorize implementation.
- Use primary documentation for product semantics, distinguish those facts from NEXORA design inferences, and disclose missing workload/operational evidence.
- Documentation only; no source, Go module, dependencies, schemas/tables, broker/cloud/Temporal configuration, workers, infrastructure, final contexts/packages or microservices conversion.
- Preserve Accepted ADR-001–004; synchronize only directly supporting status/scope documentation; do not start ADR-006.
- Verification is document/status/link/scope/byte-preservation checks, not runtime tests or observed delivery guarantees.

## 13. Related Decisions

[Constitution](../../DEVELOPMENT_CONSTITUTION.md), [ADR index](README.md), [architecture context](../architecture/ARCHITECTURE.md), [principles](../architecture/principles.md), [Accepted ADR-001](ADR-001-core-programming-language.md), [Accepted ADR-002](ADR-002-architecture-style.md), [Accepted ADR-003](ADR-003-agent-runtime.md), [Accepted ADR-004](ADR-004-workflow-engine.md).

| Deferred ADR | Unresolved implementation gates |
| --- | --- |
| ADR-006 — Memory | Sensitive content/reference retention, Sophia projections and memory notifications, replay/deletion implications; no state authority from knowledge |
| ADR-007 — MCP & Tools | Integration contracts, authenticated sources, operation idempotency, remote status/reconciliation and scoped credentials |
| ADR-009 — Security | Tenant/producer/consumer identities and access, current-policy enforcement, fencing/revocation, encryption/residency and replay permissions |
| ADR-010 — Approval | Validity/expiry/action-revision binding, decision notification, replay/race behavior and authoritative execution-time enforcement |
| ADR-011 — Observability | Audit versus messages/logs, correlation/integrity/privacy/retention, quarantine alerts, costs and operator recovery evidence |
| ADR-012 — Deployment | Transactional stores, publisher/consumer topology, polling/CDC, capacity/budgets/retention, managed infrastructure and tested restore/RPO/RTO; Temporal hosting |

ADR-008 must additionally establish sandbox effect/termination evidence used by reconciliation. These dependencies are not newly created decisions or permission to defer necessary security checks until implementation is complete.

## 14. Evidence / References

Official documentation reviewed **2026-10-04**. Capability statements are scoped to each documented boundary; NEXORA patterns/invariants/recommendation are architectural inferences from the owner handoff and accepted constraints. No installed-version compatibility, throughput/cost comparison, broker conformance, deployment, or runtime fault injection was performed. Recheck versions/features/service limits before separately authorized implementation.

- S1: [AWS Transactional Outbox guidance](https://docs.aws.amazon.com/en_en/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) — dual-write gap, atomic state/intent and duplicate publication; not authority for exactly-once external effects.
- S2: [Apache Kafka 4.3 design — delivery semantics](https://kafka.apache.org/43/design/design/) — partitions/cursors, transactions and destination-cooperation limits.
- S3: [Temporal Go message passing](https://docs.temporal.io/develop/go/workflows/message-passing) — Signal/Update/Query and handler/Continue-As-New boundaries; interpreted within Accepted ADR-004.
- S4: [NATS JetStream concepts](https://docs.nats.io/concepts/jetstream) — streams, consumer positions, redelivery, scoped retention/replay and distinction from Core NATS.
- S5: [RabbitMQ acknowledgements and confirms](https://www.rabbitmq.com/docs/confirms) — independent publisher/consumer acknowledgement boundaries and redelivery.
- S6: [RabbitMQ Streams](https://www.rabbitmq.com/docs/streams) — retained-log/stream option distinct from ordinary queues.
- S7: [SQS at-least-once delivery](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html) — Standard queue duplicates and idempotent processing.
- S8: [SNS delivery retries](https://docs.aws.amazon.com/sns/latest/dg/sns-message-delivery-retries.html) — endpoint-specific retry/disposition.
- S9: [EventBridge delivery retry policy](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-retry-policy.html) — bounded delivery retry and DLQ option.
- S10: [EventBridge archive/replay](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-archive.html) — explicit archive and replay-order limits.
- S11: [Apache Kafka client ecosystem](https://kafka.apache.org/43/getting-started/ecosystem/) — client evaluation entry point, not proof of Go feature parity.
- S12: [NATS Go client](https://github.com/nats-io/nats.go) — available Go integration; no dependency selected.
- S13: [RabbitMQ-maintained AMQP Go client](https://github.com/rabbitmq/amqp091-go) — available Go integration; no dependency selected.
- S14: [AWS SDK for Go v2](https://docs.aws.amazon.com/sdk-for-go/v2/developer-guide/welcome.html) — AWS Go integration; no service/SDK selected.
- S15: [GitHub webhook best practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks) — delivery identity/redelivery, response and validation considerations.
- S16: [GitHub webhook validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) — secret/signature validation; not current resource authorization.

Project evidence: current owner ADR-005 handoff and all ten existing Markdown documents, including Accepted ADR-001–004. Acceptance recorded on 2026-10-04 with explicit human project-owner approval in this conversation.
