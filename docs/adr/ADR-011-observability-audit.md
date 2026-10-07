# ADR-011 — Observability & Audit Architecture

- Status: **Accepted**
- Proposal date: 2026-10-06
- Decision authority: Human project owner
- Approval date: 2026-10-06
- Approval evidence: explicit human project-owner architecture approval in this conversation: "I explicitly approve ADR-011 — Observability & Audit Architecture as proposed." Acceptance preserves the substantive architecture, all 48 vocabulary concepts, all 86 invariants, all 60 threat scenarios and all 36 failure walkthroughs F01–F36; it does not authorize implementation.
- Recommendation: Hybrid operational telemetry, explicit durable audit contracts and authoritative owner evidence, with bounded linked traces and durable correlation
- Constraints: Accepted ADR-001 through ADR-010; Development Constitution and architecture principles
- Scope: Conceptual evidence, observability, audit, ownership, propagation, privacy, integrity and failure semantics; documentation only

## 1. Context

NEXORA coordinates consequential engineering work through human direction, bounded delegation, Agent Runs, Temporal workflows, approvals, Tool Operations, controlled Execution Jobs and external providers. These operations can cross trust boundaries, outlive workers, wait for days, retry after lost acknowledgements, or leave uncertain effects. Authorized operators need to diagnose behavior; authorized investigators need attributable evidence about decisions and actions. Those are related but different requirements.

The repository is architecture documentation, not an implemented system. Before edits, the inventory contained 16 Markdown documents and two existing filesystem metadata files. All ten existing ADRs have Accepted metadata. A byte preservation snapshot was created outside the repository, including the constitution, principles, index and context. Repository searches located evidence obligations in every relevant owner: Run launch attribution in ADR-003, orchestration history in ADR-004, durable publication in ADR-005, governed projections in ADR-006, effects in ADR-007/008, trusted current scope in ADR-009, and immutable approval decisions/current use in ADR-010. This proposal supplies their cross-boundary evidence architecture without changing their semantics.

At proposal creation, supporting documents prohibited ADR-011 under the previous authorized scope. The original owner request authorized this Proposed record and strictly necessary supporting status changes without acceptance or implementation authorization. ADR-011 is now Accepted by explicit human project-owner architecture approval dated 2026-10-06; acceptance does not authorize implementation or ADR-012. No substantive conflict with Accepted ADRs is identified.

Unknowns include workloads, tenant model, event volume, investigation needs, privacy/legal obligations, retention horizons, residency, hosting, operations staffing, budget, recovery targets and acceptable telemetry loss. These prevent final products, numeric targets and physical designs. This proposal establishes requirements and gates, not demonstrated availability, compliance, tamper resistance or secure enforcement.

## 2. Problem

Make it possible to reconstruct **who initiated what, on whose behalf, under which tenant/project/task/policy/approval, which Agent Run/Workflow/Tool Operation/Execution Job participated, what external interaction was attempted, what was actually known about the effect, and what evidence supports that conclusion**.

A visually complete trace is insufficient: it may be sampled, expired, incomplete or forged. A permanent log archive is insufficient: diagnostic messages need not establish authenticated attribution or a committed fact. A central ledger claiming to own all business history would violate owner boundaries. The decision must support investigation without granting authority to observations, accumulating sensitive payloads, or building a speculative enterprise platform.

## 3. Decision Drivers

In priority order: preserve owner/current-authority semantics and honest effects; establish required durable evidence custody; preserve trusted scope and minimize sensitive exposure; support failure diagnosis and cross-boundary reconstruction; resist forgery, loss and abuse with explicit limitations; bound cost and operational complexity; preserve portable concepts while deferring products.

Quality scenarios for later validation: reconstruct a mutation with a missing trace; distinguish a timed-out Tool Operation from confirmed non-performance; resume a multi-day workflow without a forever-open span; investigate a forged worker report using independent evidence; reject cross-tenant queries and exports; retain required evidence during collector outage without indefinite exporter blocking; suppress deleted payloads after backup restore; and distinguish estimated model charges from confirmed billing. No numeric objective or executed conformance result is available.

## 4. Considered Options

A. Logs-only architecture. B. Metrics plus logs without distributed tracing. C. OpenTelemetry-style unified observability signals. D. Audit derived entirely from ordinary application logs. E. Separate audit pipeline/store. F. Owner-local audit evidence only. G. Central audit ledger owning all history. H. Hybrid operational telemetry plus explicit durable audit contracts and authoritative owner evidence.

These options mix signal strategy and evidence custody; they are compared as architectural approaches rather than mutually exclusive products. C can support H; E can become necessary when custody requirements justify physical separation. Neither implies selecting OpenTelemetry libraries, a Collector deployment, a database or a vendor now.

## 5. Decision

**ACCEPTED: Separate operational observability from durable audit semantics. Use bounded structured logs, aggregate metrics and diagnostic traces with intentional context propagation. Establish risk-driven audit contracts at authoritative owners, durable custody/publication where required, and authorized reconstruction through attributable references. Prefer bounded linked traces plus durable correlation for asynchronous and long-lived work.**

**Observability != Audit.** Observability supports understanding system behavior. Audit supports attributable governance/security/history reconstruction. Neither becomes business authority. Audit is evidence about owner decisions/actions, not a competing authorization engine or universal domain database. The proposal is engine-independent even where Temporal integration is examined.

Explicit distinctions:

- Log != Audit Record. Trace != Audit Record. Metric != Audit Record. Event != Audit Record.
- Domain Event != Audit Record. Integration Event != Audit Record. Workflow History != Audit Record.
- Agent conversation != Audit Record. Sophia memory != Audit Record. Approval evidence != complete system audit.
- Tool result != Audit Record. Execution output != Audit Record. External provider response != automatically trusted evidence.
- Audit Record != business source of truth. Audit evidence != authorization, approval, credential or current policy.
- Telemetry presence != operation success. Missing telemetry != proof that an operation did not occur.
- Successful span != successful external effect. HTTP 2xx != business success. Process exit code 0 != complete effect knowledge.
- Cancellation != rollback. Timeout != confirmed non-performance.

A record can be represented using a logging-compatible format and still qualify as audit evidence only under an explicit audit contract covering attribution, custody, integrity, access and retention. Renaming debug logs “audit” does not supply those guarantees.

Accepted on 2026-10-06 by explicit human project-owner architecture approval recorded above. Acceptance does not authorize implementation.

## 6. Detailed Design

### 6.1 Conceptual vocabulary

These 48 concepts describe meanings, not mandatory classes, tables, packages, services or universal cross-domain models.

| Concept | Meaning and boundary |
| --- | --- |
| Observability Signal | Operational observation used to understand behavior; may be lossy under declared policy |
| Structured Log | Timestamped, structured diagnostic or operational record; not inherently durable audit |
| Metric | Aggregated numeric observation over declared dimensions/time; not individual business history |
| Trace | Diagnostic causal/temporal representation of bounded operations, possibly incomplete |
| Span | One bounded observed operation with context, timing and diagnostic disposition |
| Audit Record | Durable attributable governance/security/history evidence under an explicit audit contract |
| Security Event | Security-relevant occurrence for detection or investigation; not automatically an incident |
| Business Event | Owned Domain/Integration Event fact under ADR-005; publication does not create audit completeness |
| Effect Evidence | Owner-interpreted evidence of performance, partial performance, non-performance or uncertainty |
| Provenance | Source, ownership, revision, observation and transformation lineage; not a truth guarantee |
| Correlation | Association among relevant records/operations; does not necessarily establish causation |
| Causation | Explicit recorded triggering relationship; may have multiple antecedents |
| Actor | Authenticated initiating human/workload identity reference; dispatching service may differ |
| Represented Actor / On-Behalf-Of | Principal whose bounded delegated authority is exercised, separate from initiator and effective workload |
| Subject / Target Resource | Owner-resolved affected/observed resource, revision and environment |
| Observation Time | When an observer noticed an occurrence, with observer/clock provenance |
| Event / Occurrence Time | When the source reports an occurrence; unknown or uncertain is explicit |
| Ingestion Time | When a pipeline received evidence; not when its business effect happened |
| Trace ID | Diagnostic trace identity, not a durable business-operation identity or bearer grant |
| Span ID | Identity within trace context; not a Tool/Run/Job identity |
| Correlation ID | Durable association reference under a declared scope, not a credential |
| Causation ID | Reference to a triggering operation/message/evidence fact; not proof by itself |
| Agent Run ID | Runtime-owned bounded attempt identity with immutable launch attribution |
| Workflow ID | Logical orchestration identity; engine execution references remain separately identified |
| Tool Operation ID | Tool-owner logical operation identity, distinct from dispatch attempts |
| Execution Job ID | Execution-owner job identity, distinct from Attempt and process identifiers |
| Approval Request / Decision Reference | Separate Approval-owned reviewed-intent/request and human-decision references |
| External Provider Request ID | Provider-scoped request/receipt identity interpreted under its admitted contract |
| Tenant / Project Scope | Trusted operational attribution and access scope resolved through authoritative context |
| Policy / Authorization Decision Reference | Historical decision/version/enforcement context reference, not reusable current permission |
| Audit Evidence | Records and permitted source material supporting reconstruction, with explicit gaps |
| Audit Integrity Evidence | Checkpoints, proofs or custody receipts supporting integrity claims within their verification boundary |
| Retention Class | Policy-governed purpose, custodian, disposal/hold rules and required horizon; no duration selected |
| Sensitivity Classification | Handling/access category determined by owner/data policy, not arbitrary producer reassurance |
| Redaction | Governed removal/masking of sensitive information with disclosed interpretation limits |
| Suppression | Preventing retrieval/exposure of ineligible content independently of physical cleanup completion |
| Tombstone / Deletion Evidence | Minimal permitted evidence of deletion/suppression and affected references; no retained secret payload |
| Incident | Governed security/operational case requiring accountable response, not every normal denial |
| Investigation | Authorized purpose/scope and attributed inquiry into evidence and its limitations |
| Telemetry Collector / Pipeline | Transport/processing responsibility with bounded validated inputs and explicit loss/custody semantics |
| Telemetry Sink | Destination for storage/query/aggregation; storage does not confer business authority |
| Audit Owner | Responsibility for audit contracts, reconstruction, integrity, access and correction/deletion rules |
| Observability Owner | Responsibility for diagnostic collection, propagation, metrics, querying and operational signals |
| Evidence Custodian | Responsibility for retained evidence, access, custody, integrity and governed disposal |
| Persisted Time | When a named custodian durably stored a record; acknowledgement boundary must be stated |
| Provider Time | Provider-reported timestamp with external clock/trust limitations |
| Alert | Detection output routed for attention; separate from evidence, incident classification and response |
| Response | Authorized containment/remediation operation with its own current checks and attributable effects |

### 6.2 Ownership and minimum responsibilities

| Responsibility | Owns / concrete requirement that fails without it | Does not own |
| --- | --- | --- |
| Observability | Collection/propagation contracts, structured diagnostics, metrics, health/performance, diagnostic queries and conceptual dashboards/alerts; otherwise failures and latency cannot be diagnosed coherently | Domain truth, authorization, Approval, Run lifecycle, Workflow state, Tool effects, Execution truth or Sophia knowledge |
| Audit | Durable evidence requirements, cross-owner reconstruction, historical security/governance evidence, integrity/access/correction/deletion contracts; otherwise consequential actions lack attributable reconstruction | Every owner's business model or a universal database of all state |
| Evidence custody | Preserve required records, record acceptance boundaries, control access/disposal and disclose gaps; otherwise “recorded” may mean only volatile export | Interpreting every domain action or granting permission |
| Domain owner | Resource/business truth, invariants and operation meaning | Telemetry sink claims cannot override it |
| Security | Trusted identity, current authorization/restrictions and attributable decisions | Historical allow records cannot grant current access |
| Agent Runtime | Run identity/configuration attribution, lifecycle, wait reason, stop request, outcome | Trace/span status is not Run state |
| Workflow / Temporal | NEXORA coordination semantics and engine orchestration/history respectively | Universal audit, Agent Run identity, authority or complete effect truth |
| Event owner | ADR-005 fact/contract identity, delivery and processing obligations | Broker/relay messages are not business or audit truth by themselves |
| Sophia | Governed knowledge and permitted derived retrieval projections | Audit custody, original historical evidence or authority |
| Tool owner | Logical Tool Operation, attempts, admitted-provider evidence and effect reconciliation | HTTP status/provider text alone cannot establish effect success |
| Execution owner | Job/Attempt/source attribution, isolation/policies, execution/termination/cleanup evidence | Hostile stdout is not authenticated control-plane fact |
| Approval | Request/review revision, human decisions, eligibility/quorum, current usability and consumption | Audit copies cannot approve, replenish consumption or replace owner checks |
| External provider | Only observations/evidence its admitted operation contract supports | Global NEXORA identity, permission, business state or complete audit |

These are logical responsibilities within the ADR-002 modular control plane, not selected bounded contexts or deployables. An initial owner-local durable evidence mechanism plus an authorized correlated view may satisfy custody; physical isolation is justified when producer compromise, administration or retention risks require independent protection. Do not create a separate service, stream-processing platform, SIEM/SOC or replicated ledger without that requirement and operating evidence.

No universal `AuditObject`, `GlobalActor`, `GlobalResource` or `GlobalAction` model is proposed. Evidence exchanges deliberately versioned minimal owner references and attributable assertions. Similarly named concepts may retain separate semantics. Policy-neutral serialization/propagation utilities may be shared; domain semantics follow ADR-002's explicit Shared Kernel justification, ownership, consumers and change review.

### 6.3 Reconstruction and evidentiary limits

```text
Trusted initiator + bounded delegation/task references
  → configured Agent Instance + immutable Agent Run launch references, if involved
  → logical Workflow + engine execution references, if involved
  → current policy decision + required usable Approval references
  → logical Tool Operation + dispatch attempt, if involved
  → Execution Job + Attempt + actual source/policies, if involved
  → admitted external provider request/receipt, if involved
  → owner effect disposition + provenance + unresolved responsibility
```

This is an optional relationship chain, not a required call graph. An API read can have no Agent or Workflow; an Execution Job need not invoke an external provider; a workflow can coordinate many Runs and Tools. Record meaningful absent/not-applicable/unknown relationships without inventing layers. Parent-child relationships, delegation and “on behalf of” are different relationships and need explicit meanings.

**Trace ID != Run ID != Workflow ID != Tool Operation ID != Execution Job ID != Approval ID != Event ID != provider request ID.** Temporal engine Run ID is also distinct from Agent Run ID. Multiple spans/attempts can reference one logical operation; semantic retries use new linked identities where their owners require them. Provider IDs are scoped by provider/account/operation contract to avoid false joins. Evidence/semantic-record identity is stable across redelivery; delivery observations remain separately identifiable.

An authorized reconstruction follows owner references, then contextual telemetry, then permitted independent provider/resource evidence. It records the investigator's scope, as-of interpretation, relevant revisions, custody/integrity checks, known gaps, conflicting assertions and inferred versus confirmed conclusions. Reading evidence never re-executes commands. A summary is a derived account with citations, not replacement evidence. An owner record describes what that owner asserted; provider/source compromise may limit even a formally intact record.

Preserve original Run definition/configuration, assignment and initiator/delegator attribution. Later security restrictions constrain future actions without rewriting history. Per-operation policy/approval references explain the effective decision at that operation, not timeless launch permission. Corrections append explicit attributable links to erroneous evidence and resulting interpretations, rather than silently replacing prior attribution.

### 6.4 Trace context and propagation

OpenTelemetry supports parent-child context and links to spans in the same or different traces [E1]. W3C Trace Context defines interoperable trace headers and warns about privacy, malicious inputs and abuse of sampling hints [E3]. These are verified external mechanisms; choosing their conceptual semantics for NEXORA is an architectural inference, not an SDK/product adoption.

| Boundary | Proposed propagation and trace interpretation |
| --- | --- |
| API ingress | Parse/bound external context as untrusted diagnostics; start a local span or trace/link under admitted policy; derive authenticated actor/scope separately |
| Module/application calls | Parent-child spans for actual synchronous nesting; retain owner operation references without importing tracing types into domain rules |
| Runtime | Bounded admission, segment, model-call and wait/resume observations; durable Run identity survives absent/new traces |
| Workflow start/Signals/Updates | Carry permitted correlation and initiating context references; admission, engine acceptance and business handling have different evidence |
| Temporal Activities/children | Actual worker/Activity attempts get bounded observations and logical owner references; child coordination has distinct execution identity |
| Event publication/consumption | Producer/consumer observations carry stable logical message ID, contract revision, causation and separate delivery attempt; delayed consumers may start linked traces |
| Tool/MCP/native integration | Observe validated operation/admission/dispatch/response/reconciliation, never discovered metadata as authority; strip unapproved baggage before external requests |
| Execution Jobs | Correlate trusted admission/Attempt/termination/cleanup observations; hostile processes cannot assign trusted actor/tenant or control control-plane spans |
| Provider calls | Propagate context only if disclosure and admitted contract permit; retain provider receipt IDs as external evidence, not authorization |
| Callbacks/webhooks | Independently authenticate/validate replay and scope; correlate to expected owner operation; an echoed trace header is not proof of origin |
| Async fan-out/fan-in | Link actual antecedents and preserve durable causal references; do not invent one parent implying all branches committed |

Baggage lacks built-in integrity protection and can propagate sensitive values to unintended downstream destinations [E2]. Allow only bounded policy-neutral permitted attributes; never derive tenant/project/actor/permission from incoming baggage. Trusted security context follows ADR-009, independently integrity-protected and enforced. Correlation is not delegation. A foreign trace context may be dropped/restarted while retaining a safe link/reference; loss of that context cannot erase audit obligations.

| Trace approach | Strength | Failure/limit | Proposed disposition |
| --- | --- | --- | --- |
| Continuous distributed trace | Convenient view for bounded synchronous work | Multi-day spans, disconnected providers, sampling and backend retention leave misleading completeness | Use only where bounded operation lifetime fits |
| Linked traces | Natural separation of resumed segments, async attempts and fan-in | Backends may visualize links differently; links can expire | Prefer at long waits/trust/lifetime boundaries |
| Durable correlation/causation | Reconstruction independent of tracing retention/sampling | Requires owner contracts and intentional query semantics, not automatic latency visualization | Required where durable evidence needs it |
| Hybrid | Diagnostic spans plus durable logical identities/references | More mapping discipline; cannot promise one complete waterfall | Recommend |

No forever-open span across days of Workflow waiting is required. Record wait entry/resume observations and durable wait reference; use a new bounded segment trace with links when feasible. Retries/redelivery create actual attempt observations, not fake repeated logical successes. A terminal Run retry creates a new linked Run, regardless of trace reuse. Bound fan-out links and payloads; durable owner relationships carry reconstruction when trace limits discard links.

### 6.5 Structured logs, metrics and sampling

Logs conceptually carry source time and observation time where material; severity; component/instrumentation provenance; trusted permitted tenant/project and actor/workload references; applicable Run/Workflow/Tool/Job/Approval/event/provider references; trace/span context; operation/phase; outcome/disposition; safe error classification; attempt/retry relationship; classification and permitted source references. Optionality follows purpose. There is no universal JSON schema, final field naming convention or mandatory serialization library.

Ordinary telemetry MUST exclude raw secrets, access/refresh tokens, API keys, passwords, cookies, private keys, raw credential material and private chain-of-thought. No dump of contexts, headers, environment variables, SDK objects or request bodies by convenience. OWASP recommends deliberate logging content, protection and testing of logging failures [E7]; NEXORA's payload restrictions are explicit architectural requirements rather than an assumption redaction will catch everything.

Metrics answer aggregate rate, error, latency, saturation, queue/backlog and capacity questions. Candidate dimensions include bounded operation class, component, admitted provider/model class, error category, environment and result disposition. Observe Workflow backlog/wait age, Run outcomes, Tool latency/failure, Execution resource use, provider reliability, token/model usage/cost, Approval wait age, retry and reconciliation counts. Aggregates do not supply individual historical truth or sole budget authority.

Tenant/project/resource/Run IDs, URLs, customer names, arbitrary model text and external request IDs MUST NOT casually become metric labels. Per-tenant accounting can use authorized bounded owner records/query views rather than exploding every timeseries. Define dimension budgets, allowed values and trusted classification before instrumentation. Even low-cardinality aggregates may leak another tenant through sparse counts, exemplars, shared dashboards or timing; authorize disclosure of aggregates and drill-down links.

Trace goals are latency decomposition, dependency/retry/fan-out visualization, failure localization and provider/Workflow/Activity interaction diagnosis. Traces are diagnostic; a successful span describes the instrumented boundary, not an external business effect. Sample/rate-limit debug logs and spans under declared policy; expose drop/overflow/coverage limitations. Metrics aggregation has its own estimation/window semantics. Mandatory audit/security records must have non-loss custody obligations independent of trace sampling. This is a requirement under stated durability/recovery assumptions, not a guarantee against permanent storage loss. Audit does not impose permanent retention on every debug span. Exact sampling percentages, log levels and metric names are deferred.

### 6.6 Risk-driven audit contracts and custody

Define audit requirements with the operation/security owner: purpose/risk, required assertions and evidence references, producer authentication, stable record identity, trusted scope, required pre-dispatch evidence, post-result facts, custody acknowledgement, ordering, delivery horizon, reconciliation, retention/access and unavailable-evidence behavior. Not every internal function or ordinary read requires its own durable audit record. Sensitive disclosure/export is consequential even without mutation.

| Candidate category | Evidence obligation to define with its owner |
| --- | --- |
| Authentication/security sessions | Trusted identity/method reference, success/failure, suspicious usage and relevant revocation; exclude credentials |
| Consequential authorization | Effective actor/delegation, owner-resolved resource/action/context, policy/decision/version and enforceable obligations |
| Delegation/membership/role/policy changes | Initiator, prior/new governed references, scope and effective restrictions; not broad raw policy copies everywhere |
| Assignment/Run launch | Immutable task/configuration/Instance/initiator/delegator launch references and admission disposition |
| Consequential Tool operations | Validated bound intent, current policy/required Approval, admitted provider/credential class, dispatch and effect evidence |
| Execution admission/start/stop | Job/Attempt, actual source, policy/isolation evidence, process population, outcome/effects/cleanup |
| Approval governance | Request/review revision, human decision, eligibility/policy/quorum, usability/use/revocation links |
| Credential/secret access | Trusted workload/purpose/reference/class and eligibility/disposition without secret values |
| Provider governance | Admission/version/purpose/suspension, attributable changes and affected operations |
| Disclosure/export/production changes | Authorized data/target/environment/revision scope, reviewed intent where required, actual dispatch/effect evidence |
| Emergency/admin/security configuration | Governed exceptional authority, reason, duration/scope and operation evidence; no omniscient admin assumption |
| Audit policy/correction/deletion/access | Authorized actor, policy/reason, affected identities, prior evidence links, custody/disposal outcome and gaps |

Separate attempted, admitted, authorized, approved, dispatched, provider-accepted, performed, partially performed, failed, cancelled, timed-out and unknown. These are orthogonal phases/dispositions, not a single `success=true/false` or universal state machine. An approved request can remain undispatched; a failed response can follow a performed effect. Scope/action/revision/time/provenance are needed to interpret every consequential assertion.

Where committed owner state must reliably cause asynchronous audit publication, atomically persist owned state and required evidence/publication intent, or establish a reviewed equivalent gap-closing protocol under ADR-005. An Outbox is an architectural pattern, not a selected table/CDC/poller/broker. Receipt by a volatile exporter is not durable custody. A remote audit write is not assumed atomic with the business transaction; neither is `DB commit + Temporal Signal` atomic.

Define whether required pre-action evidence is sufficiently established by a durable owner-local record plus recoverable publication intent, or requires an independent custody receipt before dispatch for that operation's risk. This decision belongs to explicit owner policy before implementation. Independent custody can reduce producer compromise risks at extra availability/cost; local intent cannot claim independence it lacks. Outcomes after an irreversible effect cannot be made atomic retroactively: preserve dispatch evidence, unresolved result obligation and reconciliation responsibility if post-effect recording fails.

Consumer durable deduplication uses record identity, producer/scope and processing purpose. A conflicting payload under the same identity is an integrity defect. Different observations/corrections have new linked identities. Delivery retries do not change business facts or create permission. Pending/quarantined publication remains owned responsibility; no DLQ disposal loophole. A query projection is rebuildable and displays custody/coverage lag; it cannot advance owners or silently conceal missing evidence.

### 6.7 Effect evidence, provenance and time

| Effect knowledge | What the evidence may assert | Required limitation |
| --- | --- | --- |
| Not dispatched | Authoritative owner has not crossed its dispatch boundary | A missing dispatch log alone is insufficient proof |
| Confirmed not performed | Admitted authoritative contract/reconciliation establishes non-performance | Timeout/local error/absent span does not establish this |
| Confirmed performed | Operation-specific trusted evidence establishes the recorded effect | Provider receipt acceptance or transport success may be weaker |
| Confirmed partially performed | Evidence identifies known performed subset and remaining disposition | No silent all-or-nothing simplification |
| Unknown / indeterminate | Insufficient, conflicting or unavailable evidence | Block blind unsafe retry and retain assigned reconciliation |

Retain producer/owner, operation/attempt, observed source/revision, admitted provider/account contract, transformation and custody references with each material assertion. Describe verified versus claimed evidence and interpretation limits; do not invent numerical confidence. Independent resource checks can corroborate a provider receipt but must themselves be authorized and attributable. Contradictions append evidence and revise an explicit interpretation through the owner; do not erase the original uncertainty or replace old Run attribution. Compensation is a new current-authorized action with its own outcome and possible uncertainty.

Occurrence, observation, ingestion, persisted and provider time have different clocks and meanings. Use explicit timezone/clock provenance and uncertainty where material; OTel separately represents source and observed timestamps [E4]. Wall-clock precision is not ordering authority. Delayed records, retries and skew can invert apparent order. For order-sensitive facts use owner durable revision/sequence/expected predecessor/fencing evidence, not one global telemetry sequence. Workflow history order establishes engine-local ordering, not total order across domain transactions/providers. A UI chronology must label uncertain/partial order rather than imply unsupported causality.

### 6.8 Integrity and trust limits

**Append-only semantics != cryptographically tamper-proof. Immutable storage != truthful source.** A compromised producer can submit false evidence through a legitimate authenticated channel. A signed false statement remains false. Audit must expose both producer provenance and the integrity/custody boundary checked.

| Approach | Can support | Cannot alone establish / additional gate |
| --- | --- | --- |
| Restricted append paths | Limit admitted producers and modifications; separate writer/reader/admin authority | Compromised allowed producer truthfulness; privileged storage administrator bypass |
| Append-only storage semantics | Preserve accepted record versions and explicit corrections | Cryptographic tamper detection, absence of omitted records or external effect truth |
| Hash chaining/checkpoints | Detect some alteration/reordering/gaps against trusted retained anchors | Unanchored tail truncation, rewritten whole history, false/missing producer input; anchor custody/verification required |
| Signed records/checkpoints | Attribution to admitted signing key and integrity of signed bytes | Accurate actor/action assertion, key uncompromised at production, completeness; key lifecycle/revocation/provenance required |
| WORM/immutable retention | Restrict changes within named storage/version/retention boundary | Producer truth, captures before storage, administrator/provider/account failure outside guarantee; privacy conflict must be resolved before locking |
| Trusted timestamps | Support evidence that committed data existed by a stated time [E11] | True event occurrence time, business ordering or correct underlying facts |
| Replicated/independent custody | Reduce loss or unilateral rewriting when failure/admin domains are independent | Independence merely because there are two copies; matching forged input remains forged |
| Independent evidence sources | Corroborate effect/identity assertions and detect contradictions | Universal complete evidence, automatic resolution or permission to collect unlimited sensitive data |

RFC 9162 describes Merkle append-only consistency proofs for certificate transparency [E12]; it illustrates externally verified proof boundaries, not selection of CT as NEXORA's audit protocol. S3 Object Lock documents version-specific WORM retention and differing governance/compliance controls [E13]; it illustrates storage limits, not a selected cloud/storage service. Chaining and signing approaches require explicit verification coverage, trusted anchors, canonical representation/key handling and disposal compatibility before adoption. No algorithm, signing scheme, KMS/HSM or immutable-store implementation is selected.

Detect missing obligations through owner references, expected scoped sequences/checkpoints, custody receipts and reconciliation—not by claiming cryptography proves every action was logged. Suspected collector/worker/provider compromise marks affected evidence suspect and triggers governed containment/independent reconstruction. Evidence integrity verification failure must be visible to an authorized investigator and cannot be silently ignored as a debug error.

### 6.9 Privacy, retention, suppression and access

Classify before collection at the earliest trusted boundary. Defense in depth may redact again during processing/export/query, but collectors cannot undo a secret already leaked upstream. Raw prompts/model responses, code/diffs, Tool arguments/results, stdout/stderr, HTTP bodies/headers, personal/customer data, comments, uploads and security findings are potentially sensitive. Prefer permitted metadata, owner references, revisions/digests and bounded safe excerpts; content capture requires justified purpose, current access, classification, custodian and retention policy. Digests can leak low-entropy content and references can disclose resource names, so neither is automatically safe. No private chain-of-thought or provider reasoning trace is required or intentionally persisted. Credential values remain excluded even when a debug session or investigator would find them convenient.

Separate sensitive owner payloads from routine telemetry where necessary. Evidence links must remain resolvable only to currently authorized readers and disclose deletion/unavailability; immutable references cannot imply perpetual readable content. Avoid raw source or review payload duplication into tracing, audit, Workflow History and Sophia. Uploaded evidence receives bounded validation and provenance; rendering treats it as untrusted content, including control characters/active content. Collector/vendor export is a governed disclosure, not permission implied by instrumentation.

| Retention class | Purpose and governing responsibility |
| --- | --- |
| Ephemeral/debug diagnostics | Short-lived investigation/performance utility under observability/data-owner policy; no infinite default |
| Aggregate operational signals | Trend/capacity analysis with dimensional/disclosure limits and defined disposal |
| Required security/governance evidence | Risk-driven attribution, investigation and required custody under audit/security/data-owner policy |
| Durable owner attribution/references | Preserve interpretable Run/operation/decision history while minimizing personal/sensitive details |
| Detached sensitive payload | Separately justified owner evidence with tighter access and independent deletion/redaction |
| Incident/investigation hold | Explicit purpose, authorized hold/release, scope, review and disposal requirements if applicable |

No durations or legal compliance claims are made. Requirements must reconcile investigation horizons, minimization, user/tenant/artifact deletion, jurisdiction and applicable holds before choosing physical immutability. Retain permitted pseudonymous attribution or tombstones where justified; do not erase evidence that an actor acted simply because a profile was deleted, or retain their entire personal profile by default. Policies may require disposal of records, not only payloads; record permitted minimal disposition and honest resulting gaps rather than claiming complete history after deletion.

Suppression prevents retrieval/exposure as soon as required, independently of delayed physical cleanup. Propagate deletion/retention to detached payloads, logs, traces, indexes, caches, exports under custody, Sophia derivatives and backups/restore procedures. Backup restore must reapply suppression/tombstones before exposing content. Outside exported copies may not be technically retractable: establish recipient/custody controls and disclose limits. A tombstone must not preserve the deleted secret. Authorized correction/redaction records identify purpose, actor, affected references and reconstruction limits without fabricating “never occurred.”

Tenant-authorized operational view, project view, platform operation, security investigation, compliance/governance review, incident response and evidence export are access purposes/categories, not final roles. Current ADR-009 authorization applies to search, counts, suggestions, graph expansion, traces, dashboards, metric exemplars, indexes, caches, citations and downloads. Tenant ID in a record is not isolation. Enforce access using trusted resolved scope, including referenced owner evidence; a permitted top-level record does not grant every linked payload.

Cross-tenant correlation/investigation needs explicit privileged owner-governed purpose/scope and attribution, denied by default otherwise. Infrastructure administration does not grant tenant application/content access. Support access and break-glass remain ADR-009/010-governed, bounded and reviewable; Agents cannot self-grant it. Risk-sensitive queries/exports/administrative reads may require their own audit evidence. Protect export manifests, filtered scopes, custody, safe serialization and integrity evidence; no evidence-reader “read everything” exception.

### 6.10 Owner integrations and cost attribution

**Runtime:** observe Definition/config revision, Instance, Task/assignment, immutable Run/initiator/delegator, model/provider interactions, transitions, waiting reasons, stop requests, final outcomes and separate effects. Keep `Created → Queued → Running → Waiting → Queued → Running → Finished`, including direct `Running → Finished`. A trace failure cannot set Run outcome; launch identity is not prompt text. Historical attribution cannot silently adopt newer configuration.

**Temporal:** Workflow ID, engine execution Run ID, definition/release, Activity identity/attempt, task queue and child references are distinct diagnostics. Continue-As-New creates a new engine execution/history [E6], not automatically a new Agent Run. Preserve logical workflow/Run/operation links across rollover. Starts, Signals and Updates have separate admission/engine acceptance/handling evidence. Durable waits do not require sleeping goroutines. No automatic `Agent Run == Temporal Activity` mapping is introduced.

Temporal's Go documentation covers client/worker metrics and tracing and currently labels its OpenTelemetry v2 integration pre-release and replay-safe [E5]. Go `workflow.GetLogger` avoids duplicate replay logs [E14]. These facts require rechecking for a future selected version; no SDK/integration is adopted. Replay reconstructs coordination, not new human decisions/business actions/audit facts. Use replay-aware observations; if replay diagnostics are intentionally emitted for investigation, label them explicitly and avoid counting them as actual attempts. External audit writes stay outside deterministic Workflow code through owned operations with stable semantic record identities. Activities can reattempt after uncertain completion; their audit publication must deduplicate logical facts while retaining actual attempt evidence. Temporal history remains authoritative for engine orchestration only, and must not receive secrets/raw sensitive payloads to improve tracing.

**Tools/MCP:** correlate logical operation and attempt, admitted provider/version/purpose, validated bound intent, current policy/required Approval, safe credential reference/class, provider receipt, results and effect/reconciliation. Discovery metadata is not permission/evidence truth. Output remains untrusted; provider-generated IDs cannot assign NEXORA authority.

**Execution:** reference Job/Attempt, actual source representation (commit/tree/patch/dirty/generated/lock evidence as appropriate), image/toolchain/provider revision, required isolation class, resource/filesystem/network policies and secret-use metadata. Capture process-population termination, bounded classified output/artifact references, cleanup disposition and effects independently. Exit code or parent termination cannot prove descendants stopped. Old unresolved Attempts remain visible before restart; unknown cleanup requires quarantine, not presumed reuse. ADR-008 stronger hostile-code isolation remains binding; authorization/approval or observability convenience cannot weaken it. Instrumentation must not put hostile builds inside trusted Runtime/control-plane processes. Sandbox escape/compromised workers can make their own output/evidence suspect.

**Approval:** retain references for Request, reviewed intent/revision, requirement/policy, Decision, reviewer/eligibility basis, quorum, current usability, consumption, expiry/revocation/supersession and associated operation. Approval owns these semantics; audit cannot refresh expired approval, restore use after non-performance or copy a comment as a grant. Avoid duplicating full sensitive review envelopes. Historical approval evidence is not current approval.

**Sophia:** selected permitted operational lessons may later be projected with evidence links, provenance, current access and deletion dependencies. Sophia != audit store; vector index != audit; summary != evidence; similarity != historical truth. A projection cannot rewrite audit history or resurrect suppressed/deleted evidence. No audit-to-Sophia ingestion mechanism is chosen.

**AI usage/cost:** attribute permitted provider/model identity, logical request and attempt, request class, Run/task/workflow/tenant/project, input/output usage where available, latency, retry/error, estimates and confirmed charges separately. Provider reports can be delayed, incomplete or corrected; record source, accounting unit/currency/rate reference where meaningful and reconciliation status. Unknown charges are not zero; repeated inference can incur additional charges even without useful business output. Deduplicate repeated receipts without hiding legitimate retry costs. Aggregated metrics are diagnostics, not billing or distributed budget authority. Prompts are unnecessary for cost accounting. Quota/admission/budget owners remain authoritative; no billing platform is selected.

### 6.11 Security events, pipeline failures and abuse

Security-relevant occurrences include authentication failure/suspicious token usage; denied authorization and cross-tenant/forged scope/actor/confused-deputy attempts; credential anomalies or suspected secret disclosure; provider/worker compromise; policy/escalation/break-glass changes; audit availability/integrity failure; unusual Tool/Execution activity or isolation incidents; webhook signature/replay failure; repeated approval manipulation; and activity after identity revocation/suspension. Classify by risk, repetition, context and corroboration. A normal deny is not automatically a high-severity incident. Security event → detection/alert → governed incident/investigation → authorized response are separate stages; none is a permission grant.

| Failure | Required conceptual behavior |
| --- | --- |
| Logs/metrics/traces unavailable | Declare degraded diagnostics and bounded loss/coverage; routine failure does not automatically stop all business work or prove business failure |
| Mandatory audit unavailable | Apply declared operation policy: establish sufficient required custody or block selected consequential dispatch; do not invent universal fail-open/fail-closed behavior |
| Required publication pending | Preserve owner intent and custody responsibility, bounded attempts/age/backlog, quarantine and explicit recovery rather than silent drop |
| Unknown audit write acknowledgement | Reconcile stable semantic identity before replacement/retry; unknown receipt is not proof absence |
| Collector crash/partition/storage full | Distinguish volatile loss from persisted obligations, bounded buffering and recovery; surface gaps and suspend affected custody-dependent actions where policy requires |
| Duplicate/out-of-order records | Idempotent consumer purpose, conflict detection, owner causal/version interpretation; no timestamp-driven rewrite |
| Malformed/sensitive records | Reject/suppress/quarantine with safe metadata and accountable remediation; no raw dangerous payload in unrestricted error logs |
| Integrity verification failure | Mark affected coverage suspect, retain permitted evidence, governed containment and independent verification |
| Exporter stalls/backpressure | Bounded export work/resources; no indefinite blocking of critical execution. Mandatory audit uses explicit custody/admission semantics rather than an unbounded logger |
| Security incident during telemetry loss | Incident owner records available facts/gaps via governed fallback custody; containment remains scoped current-authorized, no fabricated evidence or unrestricted emergency access |

Bound record size, link count, attributes, label values, output excerpts, queue/backlog, concurrency, retained volume and retries; numeric limits require workload evidence. Attacker-controlled repository/stdout/Tool/model text is content, not trusted structured record syntax. Encode/sanitize control characters and newline injection, validate names/keys and prevent arbitrary tenant/routing/sink selection. Do not permit recursive Agent telemetry storms, metric cardinality explosions or storage exhaustion to silently consume critical audit capacity. Reserve/isolate required custody capacity only when justified by risk, without selecting topology.

Collector/pipeline configuration changes, destinations and privileges need current authorization and attributable versions. Transport/source authentication and protected access must cover producer-to-custody and custody-to-query/export, without claiming transport authentication makes contents true. Pipeline health should have an independent permitted observation/escalation path where common failure could hide an incident; that path must be governed and bounded too. Exact SIEM, destinations, alarm thresholds and deployment failover remain undecided.

### 6.12 Accepted invariants

The following are Accepted architectural obligations, not implemented controls or verified runtime enforcement.

1. Observability is not audit.
2. Audit is not business authority.
3. Log is not Audit Record.
4. Trace is not Audit Record.
5. Metric is not Audit Record.
6. Event is not Audit Record.
7. Workflow History is not universal Audit Record.
8. Conversation is not Audit Record.
9. Sophia is not audit source of truth.
10. Audit evidence is not authorization.
11. Audit evidence is not approval.
12. Audit evidence is not credential.
13. Correlation ID is not authority.
14. Trace context is not authorization context.
15. Tenant scope is derived from trusted context, not telemetry claims.
16. No identifier becomes a bearer grant.
17. Run/Workflow/Tool/Job/Approval/provider identities remain distinct.
18. Historical Run Attribution remains immutable.
19. Audit does not overwrite owner truth.
20. Effect evidence cannot be stronger than authoritative evidence supports.
21. Timeout is not confirmed non-performance.
22. Cancellation is not rollback.
23. Exit code is not complete effect evidence.
24. HTTP success is not automatically business success.
25. Unknown effects remain unknown until reconciled.
26. Compensation is a new attributable action.
27. Missing telemetry is not proof of non-occurrence.
28. Duplicate telemetry does not create duplicate business effects.
29. Workflow replay cannot manufacture new business/audit facts.
30. Activity retry is distinguished from semantic operation retry.
31. Critical audit evidence does not depend solely on sampled traces.
32. Debug telemetry need not have audit retention.
33. Raw secrets are excluded from ordinary telemetry.
34. Private chain-of-thought is excluded.
35. Credentials are represented by safe references/metadata, not values.
36. Telemetry access is authorized.
37. Cross-tenant telemetry access is denied by default.
38. Tenant ID in a record does not establish isolation.
39. Audit access can itself require audit.
40. Untrusted content cannot control telemetry security scope.
41. Untrusted content cannot define metric names/label keys without validation.
42. Logs/artifacts/tool outputs are untrusted inputs.
43. Audit evidence records provenance.
44. Immutable storage does not prove producer truthfulness.
45. Append-only does not equal tamper-proof.
46. Cryptographic integrity does not prove business correctness.
47. Wall-clock timestamp is not total-order authority.
48. Occurrence/observation/ingestion times remain distinguishable where material.
49. Audit correction does not silently rewrite history.
50. Deletion/redaction does not fabricate false history.
51. Retention is policy/class driven, not infinite by default.
52. Telemetry pipeline failure has explicit semantics.
53. Required audit publication has durable custody where required.
54. Remote telemetry publication is not assumed atomic with business commit.
55. Trace collector outage does not automatically mean business failure.
56. Metrics backend outage does not automatically mean business failure.
57. Mandatory audit inability may block selected consequential operations under explicit policy.
58. Provider evidence has explicit provenance/trust level.
59. Compromised provider/worker evidence may be suspect.
60. Audit subsystem must not become an implicit Shared Kernel.
61. Audit subsystem must not own every domain resource/action model.
62. Sensitive telemetry is minimized.
63. Audit export preserves tenant/scope authorization.
64. Backups/indexes/caches are included in deletion/retention reasoning.
65. Sophia projection cannot resurrect suppressed/deleted sensitive evidence.
66. Approval evidence remains Approval-owned authoritative governance evidence.
67. Security decisions remain Security-owned.
68. Tool effects remain Tool/operation-owner semantics.
69. Execution evidence remains Execution-owner semantics.
70. Workflow state remains Workflow-owned.
71. Business state remains domain-owned.
72. Acceptance of ADR-011 does not authorize implementation.
73. Every consequential operation still requires current trusted owner authorization and valid approval where required; historical evidence cannot satisfy those checks by itself.
74. Attempt, admission, authorization, approval, dispatch, provider acceptance, performance, outcome and effect knowledge MUST remain independently interpretable.
75. Long-lived workflows use bounded observations and durable relationships; no forever-open trace is required for reconstruction.
76. Required evidence identity and input binding remain stable across delivery attempts; conflicting duplicates are integrity defects.
77. Actual source, execution Attempt, required isolation, process-population termination and cleanup evidence remain distinct; observability cannot weaken ADR-008.
78. Audit custody acknowledgement MUST name its durability boundary; acceptance into a volatile exporter is not durable custody.
79. Integrity verification states its trusted anchors, coverage and limitations; intact chains cannot prove completeness or uncompromised sources.
80. Suppression and current access apply before exposure independently of physical deletion; restoration cannot bypass tombstones.
81. AI usage/cost evidence distinguishes reported, estimated, unknown, reconciled and confirmed charges; repeated attempts can incur real cost.
82. Collector/export destinations and changes require governed authority; instrumentation does not grant data-disclosure permission.
83. All telemetry inputs, queues, fan-out and exports are bounded; untrusted payloads cannot control routing or exhaust required audit custody silently.
84. Incident, investigation and response are attributable governed operations; ordinary denials are not automatically high-severity incidents.
85. Corrections and interpretation changes are explicit linked evidence, preserving prior uncertainty and immutable historical attribution.
86. ADR-011 does not select final vendors, schemas, cryptography, retention durations, numeric SLOs or deployment topology; ADR-012 remains unstarted.

The 72 owner candidates are retained, with 14 refinements covering enforcement, orthogonal phases, bounded traces, conflicting duplicates, isolation, custody, proof limits, suppression, cost, disclosure, abuse, response, corrections and deferred scope. All 86 are Accepted without changes to their numbered text.

## 7. Alternatives Analysis

Qualitative evaluation against NEXORA's accepted constraints; no benchmark, pricing estimate or installed-product comparison is claimed.

| Option | Correctness / reconstruction / retries | Ownership / coupling / portability | Security / privacy / isolation / integrity | Operations / cost / failures | Assessment |
| --- | --- | --- | --- | --- | --- |
| A — Logs only | Human diagnosis possible; causal paths and individual custody may be incomplete; replay/attempt messages easy to misread | Small initial surface; message parsing couples investigators to implementation prose | Sensitive dumping and forged lines; no audit guarantee merely by retention | Initially cheap, investigation labor/growing volume costly; missing pipeline hides behavior | Insufficient as sole architecture; bounded logs remain useful |
| B — Metrics + logs, no tracing | Good aggregate detection; weak distributed latency/fan-out localization; durable audit still separate | Low instrumentation complexity, reasonable portability | Metrics can leak labels; ordinary logs still lack audit provenance/custody | Less trace cost, more manual correlation; backend loss remains diagnostic loss | Viable initial capability subset where paths are simple, not rejection of trace semantics |
| C — OTel-style unified signals | Interoperable context/log/metric concepts aid diagnosis; sampling does not establish audit completeness | Reduces signal-format fragmentation; SDK/convention/version coupling remains | Propagated baggage and centralized sensitive attributes create risk; product adoption does not establish tenant access/integrity | Instrumentation/collector/backend overhead and upgrades; lossy exports often acceptable only for diagnostics | Useful conceptual observability approach within H; no final SDK/Collector selection |
| D — Audit entirely from normal logs | Missing/sampled/reformatted logs cannot reliably establish who authorized/dispatched/performed; retries inflate apparent actions | Audit meaning becomes coupled to incidental logging statements | Routine access/retention may expose payloads and allow deletion; source forgery unaddressed | Low initial effort conceals serious reconstruction/recovery debt; loss after commit unrecoverable | Reject as sole audit strategy |
| E — Separate audit pipeline/store | Explicit custody/integrity contracts and deduplication possible; owner interpretation still needed | Separates evidence responsibilities; migration/dual persistence and publication gaps remain | Independent protection possible, not automatic; more privileged destinations and privacy copies | Added availability/storage/operations cost; selected operations may stop if required custody fails | Physical separation only when threat/custody requirements justify it; not mandatory service topology |
| F — Owner-local evidence only | Strong local atomic attribution possible; cross-owner investigation must join references; producer loss/compromise limits trust | Preserves ownership, minimal infrastructure; fragmented query/access/retention contracts | Owner controls scope; administrator/producer can affect own evidence; custody independence weak | Cheap start, expensive manual reconstruction; recovery requires each owner | Useful custody starting point where adequate, insufficient alone for independent evidence needs |
| G — Central ledger owning all history | Apparent easy chronology; cannot legitimately replace owner state/current policy or guarantee all effects | Universal models/transactions violate bounded contexts; high lock-in and coupling | Concentrates sensitive data and administrator blast radius; immutable wrong facts remain wrong | Large speculative platform, bottleneck/failure authority and retention conflicts | Reject universal ownership; a central authorized evidence projection is different |
| H — Hybrid | Durable owner facts/custody survive sampled traces; attempts/replays/effects explicitly interpreted; gaps disclosed | Owner semantics independent of signal/backend formats, intentional minimal contracts | Current scoped queries, minimization, separate evidence trust/integrity; still requires real enforcement | Moderate contract/verification effort; selective durable evidence controls cost; diagnostic loss separate from custody failure | Recommended conditional on future conformance and workload/custody evidence |

H wins because A–D alone cannot meet consequential reconstruction, F alone cannot cover independent/cross-owner custody, and G violates accepted authority boundaries. It does not require an immediate fleet of E services. Start conceptually with owned attributable records, the smallest sufficient durable publication/custody path, and an authorized correlated view; add diagnostics at real boundaries. Independent storage, a SIEM or cryptographic ledger needs a specific threat or obligation, not a desire for a complete-looking platform.

## 8. Consequences

### Positive

Investigators can follow actual owner facts despite incomplete tracing. Operational debugging can use bounded sampled signals without weakening required governance evidence. Explicit uncertainty, immutable attribution and provenance prevent misleading success/rollback claims. Logical ownership and conditional custody reduce technology coupling.

### Negative

Owners must define meaningful evidence contracts, retry identities, access and failure policies. Cross-boundary reconstruction requires more deliberate work than logging strings. Durable evidence, integrity verification, deletion propagation and incident procedures cost storage and operator time. Redacted/deleted data can limit reconstruction, and those limitations must remain visible.

### Risks

Overcollection can turn audit into a sensitive universal database. A central projection can drift into authority/Shared Kernel. “Non-loss” can be falsely advertised without tested custody/recovery. A collector may become a privileged exfiltration path. Producer compromise can corrupt trustworthy-looking history. Overly broad audit gating can stop harmless work, while weak gating can allow unauditable consequential actions. Physical immutability may conflict with deletion policy. No controls or guarantees are established by this document.

## 9. Security Considerations

### Threat model

Assets: trustworthy attribution, owner references, required evidence custody, tenant confidentiality, credential exclusion, current authorization and approval, interpretable effect uncertainty, and bounded operational availability. Adversaries include malicious tenant/users, hostile repositories/models/Tool outputs, compromised workers/providers/collectors, abusive evidence readers and privileged administrators. Trust boundaries include ingress, delegated owner calls, external provider/Execution boundaries, publication/custody, query/export and restoration/projections.

The following T01–T60 map every requested threat to a required response and a remaining limit. Threats are architecture analysis, not tested mitigations.

| Threat | Proposed control / owner | Residual limit or implementation gate |
| --- | --- | --- |
| T01 — Attacker removes incriminating logs. | Restricted custody writes, protected checkpoints and scoped gap reconciliation; Audit/Security | Independent anchors and administrator boundary needed; omitted records may be unknowable |
| T02 — Compromised service forges audit records. | Authenticated producers, recorded provenance, independent corroboration; Audit and source owner | A compromised admitted producer can still lie |
| T03 — Compromised worker emits false execution evidence. | Mark worker reports as source assertions, verify process/artifact/provider evidence independently; Execution | Stronger isolation and trusted observation mechanisms unresolved |
| T04 — Provider response is forged/spoofed. | Authenticate expected provider/callback contract, replay-check and correlate owner operation; Tool | Authenticity does not prove all claimed effects |
| T05 — Cross-tenant log query leaks data. | Current query/graph/count/export scope enforcement; Security and evidence owners | Index/cache/backend enforcement needs real boundary tests |
| T06 — Tenant ID injected into telemetry. | Derive scope from trusted ingress/owner resolution, record injected claim as untrusted; Security | No security scope from baggage or payload |
| T07 — Actor ID forged in log fields. | Authenticate initiator/effective workload/delegation separately from message actor field; Security | Producer authentication alone does not authenticate every claim |
| T08 — Correlation ID used as authorization. | Keep correlation separate from authorization, resolve actual resource and current context; consequential owner | ID secrecy is not access control |
| T09 — Trace baggage carries untrusted security context. | Allowlist/bound propagation and keep integrity-protected security context separate; Observability/Security | Baggage has no built-in integrity and may leak downstream |
| T10 — Secrets appear in logs. | Exclude credential values at collection, suppress detected leaks and govern containment; data owner/Security | Redaction detection is imperfect; prior disclosure cannot be undone |
| T11 — Access token appears in span attributes. | Exclude tokens from span attributes and propagation; Observability/Security | Instrumentation defaults and SDK-object dumping must be tested |
| T12 — Prompt contains secret and is logged. | No routine prompt capture; permitted metadata/references only; model/data owner | Prompt references/digests also need classification |
| T13 — Tool result contains secret. | Treat Tool result as untrusted classified content, bounded safe excerpts; Tool | Automated secret detection cannot guarantee complete sanitization |
| T14 — Execution stdout contains credential. | Keep hostile output bounded/classified outside routine central logs; Execution | Hostile code can deliberately encode secrets to evade detection |
| T15 — Approval comment contains secret. | Approval comments do not expand scope; classify/exclude sensitive content; Approval | Reviewer-input channel cannot guarantee no secret was typed |
| T16 — Provider body contains personal information. | Minimize provider bodies, separate authorized payload custody; Tool/data owner | Provider data can contain unexpected personal information |
| T17 — Trace sampling removes important evidence. | Required audit facts have independent durable custody outside sampled traces; Audit | Permanent storage loss still needs recovery assumptions |
| T18 — Log sampling removes security event. | Risk-required security evidence bypasses lossy debug sampling; Security/Audit | Bounded custody and overload policy needed |
| T19 — Metric labels leak customer/resource names. | Use admitted bounded label dimensions and authorized aggregate views; Observability | Sparse aggregates/exemplars can still leak information |
| T20 — Cardinality attack exhausts backend. | Bound label names/values/series budgets and reject untrusted dimensions; Observability | Actual volume/cardinality capacity unknown |
| T21 — Log flood causes storage exhaustion. | Bound records/output/queues and protect required custody obligations; Observability/Execution/Audit | Numeric budgets and overload behavior unresolved |
| T22 — Audit backend unavailable. | Apply operation-specific required custody gate, retain pending obligations; action owner/Audit | No universal fail-open/fail-closed; availability cost explicit |
| T23 — Audit publication is lost after business commit. | Atomic owner state plus evidence/publication intent or proven equivalent; ADR-005 owner | Remote write is not atomic; selected stores/protocol require proof |
| T24 — Duplicate audit publication. | Stable semantic record identity, durable consumer deduplication and conflict check; Audit | Deduplication horizon/custody implementation unresolved |
| T25 — Out-of-order records. | Interpret owner revisions/predecessors and causation; preserve arrival times; Audit/source owner | No universal global order |
| T26 — Clock skew changes apparent order. | Separate clocks/time provenance, owner sequence/version evidence; source owner | Clock synchronization does not provide total order |
| T27 — Workflow replay duplicates logs/audit. | Replay-aware instrumentation and idempotent owner audit facts; Workflow/Runtime/Audit | Selected SDK/interceptor behavior must be verified |
| T28 — Activity retry appears as multiple business operations. | Separate Activity attempt from logical Run/Tool operation; Workflow/Tool | Actual attempt effects require reconciliation |
| T29 — Agent retry hides previous failed Run. | New linked terminal retry Run, retain prior outcome/effects/launch references; Runtime | Correlation queries must show history and gaps |
| T30 — Tool retry hides unknown effect. | Preserve prior unknown effect, reconcile before unsafe repeat; Tool | Provider contracts may not permit reliable reconciliation |
| T31 — Execution attempt restarts but old process still runs. | Retain Job/Attempt process-population evidence, quarantine ambiguity; Execution | Old process fencing/termination proof unresolved |
| T32 — Cancellation logged as success. | Separate stop intent, lifecycle, outcome and effects; Runtime/Execution | Cancellation acknowledgement may not establish termination |
| T33 — HTTP success incorrectly recorded as effect success. | Interpret HTTP acceptance under operation contract; Tool/domain owner | 2xx does not prove target invariant satisfied |
| T34 — Provider evidence later contradicts local evidence. | Append contradictory evidence and revise explicit owner interpretation; Tool/Audit | Automatic resolution cannot invent certainty |
| T35 — Admin deletes audit evidence. | Separate admin/disposal authority, governed deletion records and independent custody where needed; Audit/Security | Storage administrators/provider/account loss remain threat-model boundaries |
| T36 — Break-glass activity not attributable. | Govern exceptional actor/delegation/reason/scope and operation evidence; Security/Approval | Emergency path needs available permitted custody, not self-granted bypass |
| T37 — Audit reader abuses sensitive evidence access. | Purpose-scoped evidence access and high-risk read auditing; Security/Audit | Insider misuse may require investigation and independent oversight |
| T38 — Exported audit package leaks another tenant. | Authorize filtered export and all references, custodian/manifest/provenance; Audit | Copies outside governed custody may not be retractable |
| T39 — Backup retains supposedly deleted sensitive payload. | Backup policy and restore suppression before exposure; custodian/data owner | Physical expiry/hold conflicts require explicit requirements |
| T40 — Index/cache retains deleted data. | Propagate suppression/deletion to indexes/caches and scoped query checks; custodians | Delayed cleanup must not mean delayed access denial |
| T41 — Sophia projection resurrects deleted evidence. | Current source/tombstone/access validation for Sophia derivatives; Sophia | Restoration/backfill must not reintroduce suppressed content |
| T42 — Security incident occurs while telemetry unavailable. | Declare evidence gaps, scoped containment and governed fallback custody; incident owner | No magically complete timeline during outage |
| T43 — Collector compromise modifies/drops telemetry. | Independent custody/checkpoints/producer references and collector privilege limits; Audit/Observability | Compromised collector can hide upstream observations |
| T44 — Telemetry pipeline becomes exfiltration path. | Admit destinations, minimize payloads and authorize data transmission; Security/data owner | Network/egress topology deferred |
| T45 — External telemetry vendor compromise. | Provider admission, limited export, data protection and compromise response; Security/custodian | External vendor administrative/trust limits remain |
| T46 — Malicious repository writes misleading structured log syntax. | Treat repository output as encoded content, never authoritative structured envelope; Execution/Observability | Trusted wrappers and renderer validation needed |
| T47 — Newline/log injection. | Encode newline/control characters and bound entries; Observability | Parser/rendering conformance must be tested |
| T48 — Model generates fake “audit approved” message. | Ignore model assertions as approval/authority; use authoritative owner evidence; Approval/Security | Diagnostic content must visibly differ from trusted facts |
| T49 — Audit record interpreted as current authorization. | Current policy at actual boundary; historical audit record is attribution only; Security/action owner | Evidence replay cannot bypass current enforcement |
| T50 — Old approval evidence interpreted as current approval. | Read current usability/binding/use through Approval owner; action owner | Decision reference alone is not usable approval |
| T51 — Old security allow interpreted as current permission. | Revalidate restrictions/revocation and resource context at use; Security | Cache freshness/fencing guarantees require implementation evidence |
| T52 — Deleted user identity destroys historical attribution. | Preserve permitted immutable pseudonymous attribution/tombstone; Runtime/Audit | Retained personal data and lawful deletion policy unresolved |
| T53 — Tenant deletion destroys necessary security evidence. | Govern scoped retained evidence or explicit disposal with honest gaps; Audit/data owner | No automatic indefinite retention or universal legal basis |
| T54 — Retention never expires and violates minimization. | Purpose/class-driven expiry, review and accountable disposal; custodians | Durations depend on actual obligations |
| T55 — Retention expires before incident investigation. | Define investigation horizon/hold and release/disposal responsibilities; Audit/incident owner | No retroactive recovery of already disposed evidence |
| T56 — Tamper-proof storage preserves false producer data. | Label immutable source assertions and corroborate consequential effects; owner/Audit | WORM cannot prove truth or complete capture |
| T57 — Hash chain is intact but source was compromised. | Verify anchors and provenance plus independent sources; Audit | Intact chain proves only its cryptographic boundary |
| T58 — Central audit service becomes Shared Kernel. | Minimal versioned references, no universal domain objects/policy ownership; ADR-002 owners | Any real Shared Kernel needs explicit separate review |
| T59 — Telemetry exporter blocks critical execution indefinitely. | Bound exporter resources/time and separate required custody/admission; Observability/action owner | Backpressure capacity and latency budgets unresolved |
| T60 — Missing telemetry is interpreted as proof of non-occurrence. | Report coverage/gaps and reconcile owner/external evidence; investigator/owner | Absence of evidence is not evidence of absence |

Additional analysis: telemetry identifiers/digests can reveal low-entropy secrets; evidence-link expansion can become SSRF or cross-owner private access; tamper alarms themselves can be forged/flooded; restore can roll back deduplication and suppression; a central investigator can become a confused deputy; and synchronized multi-tenant suppression can erase evidence needed to identify compromised infrastructure. Handle these through current owner-resolved references, bounded validated queries, explicit custody/restore protocols and independent security purpose rather than a universal access exception. Legal/privacy conflicts require actual requirements and owner review before implementation, not an invented compliance claim.

## 10. Operational Considerations

### Failure walkthroughs F01–F36

Each row is a concrete future failure/recovery scenario, not an executed test. Actor columns distinguish initiating/delegated context from responsible owner. ID references are conceptual; no physical schema is selected. Telemetry is diagnostic; audit evidence is the declared risk-required custody obligation. Effect knowledge is stated only at the named owner boundary. Every recovery action requires current authorization/required Approval; “reconcile” is not permission to use unrestricted credentials. The final column combines interpretation and the unresolved gate, keeping the expected conclusion distinct from an implementation guarantee.

| Scenario | Authoritative owner; initiating actor/delegation | Relevant IDs | Diagnostic telemetry | Required audit evidence | Effect knowledge | Retry/reconciliation | Security/privacy concern | Investigator interpretation; unresolved gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F01 — API response lost after admitted mutation | Domain owner; authenticated human for own scoped action | API operation/resource revision, policy, required Approval, trace | Ingress/owner span, response timeout | Resolved actor/scope/intent, admission/dispatch, owner disposition | Response lost; effect unknown until owner read | Resolve same operation identity before retry | No bearer authority from request ID | Caller timeout does not prove failure; atomic owner operation/admission protocol |
| F02 — API forged tenant baggage | Security/resource owner; attacker claims another tenant | Claimed trace versus trusted request/resource scope | Safe validation/deny signal, bounded security count | Risk-relevant rejected cross-tenant claim and trusted attribution | Not dispatched under enforced rejection | Reject; no retry into claimed tenant | Log malicious fields as content, no routing | Tenant claim untrusted; actual ingress/PEP/query conformance |
| F03 — Run worker crashes during launch acknowledgement | Runtime; workload acting under human/task delegation | Instance, task/config revision, Run, admission command | Worker loss/launch latency | Immutable launch attribution and claim/admission disposition | No inference from worker absence; child effects checked | Reconnect to same admitted Run; no fresh random launch | Do not substitute newer config or broad service duty | One logical launch may be admitted; stable identity/fencing recovery |
| F04 — Finished Run semantic retry | Runtime/coordination; trusted delegated task actor | Old/new linked Runs, task/config and operation links | Retry count, separate segment traces | Retry decision and preserved prior outcome/effects | Prior effects unchanged; new work separately known | Admit new linked Run with current checks | Prior approval does not automatically authorize retry | Two attempts, no erased history; retry/use binding protocol |
| F05 — Runtime wait resumed after revocation | Runtime/Security; same delegated actor now restricted | Run/wait/task, current policy and historical launch | Wait age/resume denial | Restriction/operation denial with unchanged launch references | New affected operation not dispatched | Stop/retain wait or finish under owner rules | No stale session/config authority | Historical eligibility differs from current authority; revocation/claim enforcement |
| F06 — Multi-day Workflow wait and trace expires | Workflow/Approval; original actor and eligible human resolver | Logical workflow/engine execution, wait, Run, Approval | Wait/resume observations in linked bounded traces | Owner wait/decision/operation references independent of span retention | Waiting proves no later effect only where owner records do | Resume through current owners, not retained tracing | No review payload in history to fill gaps | Partial diagnostic trace, durable reconstruction possible; custody/retention contracts |
| F07 — Temporal deterministic replay | Workflow; authorized existing coordination, no new actor action | Workflow/engine Run, definition/release, operation refs | Replay-safe/suppressed diagnostics or explicit replay labels | Prior facts referenced, no new audit facts merely by replay | Recorded outcomes, no fresh external call inside replay | Replay coordination; actual owner operations deduplicate | No historical allow reused as permission | Replay is recovery, not repeated human/business action; selected SDK conformance |
| F08 — Activity retry after lost outcome | Tool/Runtime owner; original scoped delegation | Activity attempts, stable Tool Operation/Run, provider receipt | Distinct worker/Activity attempt spans | Attempt evidence linked to one semantic operation | Potentially performed/unknown | Reconcile existing owner state before fresh dispatch | Reauthorize current action/approval use | Multiple engine attempts need not mean multiple effects; end-to-end idempotency horizon |
| F09 — Continue-As-New while input arrives | Workflow/event adapter; authenticated external/owner initiator | Workflow, old/new engine Runs, message/wait, Agent Run | Rollover/input handling observations | Stable input identity/acceptance and logical links | Message acceptance != consequence performed | Deduplicate and validate expected wait across rollover | Recheck callback scope; no inherited bearer grant | New engine history, same logical coordination; rollover/handler compatibility |
| F10 — Approval notification duplicated or expired | Approval/action owner; eligible reviewer then delegated executor | Request/review revision, Decision, quorum/use, operation | Notification attempts, approval wait/usability | Decision admission/eligibility, current usability/use disposition | No dispatch if required Approval unusable | Return prior decision receipt; no new permission | Avoid raw comments/review payload and forged Agent approval | Notification is not approval truth; concurrent decision/use protocol |
| F11 — Approval consumed, dispatch response unknown | Approval/Tool; delegated actor with required human decision | Request/Decision/use, Tool Operation/attempt, provider ID | Dispatch timeout/reconciliation age | Bound use/dispatched intent and unknown result obligation | Unknown; use not automatically replenished | Reconcile; new operation requires explicit owner reuse rules | Old decision cannot bypass current deny | Consumption differs from effect; atomic competing-use accounting and dispatch gap |
| F12 — Tool times out after provider acceptance | Tool; trusted scoped delegated workload | Tool Operation/attempt, provider/account/receipt, policy/Approval | Provider latency/timeout/error | Admitted intent, dispatch, receipt provenance and uncertainty | Unknown, even with transport failure | Query admitted provider/resource under current authority | Do not dump arguments/response credentials | No blind repeat; provider idempotency/reconciliation contract |
| F13 — HTTP 2xx but resource change absent/partial | Tool/domain owner; authorized human/delegated actor | Operation, target revision, provider request | Transport-success span, business validation observation | Receipt plus owner effect evidence and partial/unknown disposition | Accepted transport != complete performed effect | Confirm actual resource/effect; reviewed compensation if needed | Provider body untrusted and classified | Span OK with incomplete effect; operation-specific evidence contract |
| F14 — Provider later contradicts local report | Tool/domain owner; original actor, authorized investigator | Original evidence/operation plus new provider/source revisions | Contradiction/reconciliation signal | Linked new evidence, trust assessment, explicit interpretation correction | Prior asserted knowledge now disputed/unknown where needed | Governed independent check; no silent replacement | Suspected compromise, restricted evidence access | Preserve what was known then and now; contradiction resolution/custody anchors |
| F15 — Execution parent exits 0, descendants remain | Execution; delegated scoped job actor | Job/Attempt, process-population, Run/Tool links | Exit/output plus termination/backlog signals | Actual source/policies, parent exit, descendants/stop/cleanup disposition | Exit known; external effect/termination may be unknown | Contain/reconcile process population, quarantine | Strong hostile-code isolation remains required | Successful exit not complete cleanup/effect; trusted population tracking |
| F16 — Execution retry while old Attempt partitioned | Execution; original job actor/new authorized recovery | Job, old/new Attempt claims, provider/source refs | Partition/retry/active-attempt signals | Old uncertainty and new-admission/fencing decision | Old processes/effects unknown | Block unsafe duplicate; reconcile/contain before restart | No stale worker or extra ambient secrets | Two attempts cannot be assumed exclusive; provider fencing/termination contract |
| F17 — Hostile stdout contains credential and fake audit | Execution/Security; hostile repository under delegated job | Job/Attempt/artifact and output bounds | Bounded safe leak/overflow metadata | Trusted secret-use/isolation/incident facts, not hostile claimed approval | Effects assessed by owner, not text | Suppress/classify output; contain leak through authorized response | No raw stdout in central logs; model fake approval ignored | Content cannot forge control facts; output sanitization/isolation tests |
| F18 — Job source changes between review and start | Execution/Approval; delegated actor with source-bound review | Job/Attempt, actual tree/patch/source H2, review H | Source mismatch/admission denial | Actual source and changed binding/review disposition | Not dispatched if required precondition fails | New review/revalidation if material; no pretend H execution | Do not log raw proprietary diff by default | Approved H != actual H2; source attestation/TOCTOU mechanism |
| F19 — Cancellation while external mutation in flight | Tool/Runtime/Workflow; authenticated stop requester | Stop/Run/Workflow/Tool/Job/provider refs | Stop request/ack, late completion | Stop intent, operation status, evidence/cleanup/reconcile duty | Can be performed/partial/unknown despite Cancelled | No blind repeat; compensation is new action | Stop authority distinct from independent safety duty | Cancellation is not rollback; propagation/cleanup limits |
| F20 — Event commit followed by relay crash | Origin owner/Audit; original trusted operation actor | Owner revision, logical evidence/event, publication target | Relay failure/backlog/age | Durable state/evidence publication intent and custody disposition | Business effect independent of publication success | Resume same logical record, deduplicate custody | No tenant/scope derived from untrusted envelope | Commit may precede audit visibility; proven atomic intent protocol |
| F21 — Duplicate audit with conflicting payload | Audit/source owner; admitted producer identity | Same semantic record ID, producer/scope, input binding | Conflict/quarantine signal | Both permitted conflicting assertions and integrity disposition | No duplicate business effect from evidence delivery | Reject conflict, reconcile source; do not silently choose newest | Forged actor/scope or compromised producer possible | Integrity defect, not normal duplicate; stable identity/dedup rules |
| F22 — Out-of-order evidence and clock skew | Source owners/Audit; original actor(s), investigator | Owner sequence/version/causation, all clock times | Ingestion lag/skew metadata | Retained source ordering/provenance and gap evidence | Unknown ordering until relevant owner evidence | Bounded gap reconciliation; no timestamp overwrite | No false accusations from visual chronology | Arrival/timestamp order not causal total order; owner sequence protocol |
| F23 — Tenant suspended during active Run | Security/action owner; originally delegated tenant actor | Tenant/task/Run, restriction revision, operation | Restriction/deny and in-flight reconcile signals | Suspension/revalidation/stop decisions preserving launch | New denied action not dispatched; in-flight unknown | Fence future affected use, reconcile accepted operations | History retained under authorized access, not tenant bypass | Revocation not retroactive rollback; enforceable scope/fencing bounds |
| F24 — Credential revoked between check and provider use | Security/Tool; scoped workload on behalf of actor | Credential reference/version/class, operation/provider | Eligibility/dispatch failure or uncertain receipt | Current eligibility/check/use and revocation references, no value | Rejection may confirm no dispatch; accepted request may be unknown | No ambient broader fallback; current reconciliation | Raw tokens excluded from logs/spans | Credential state differs from operation authority/effect; provider revocation guarantees |
| F25 — Logs, metrics and trace collector all unavailable | Observability/business owner; normal permitted actor | Operation/owner IDs, pipeline coverage window | Bounded local health/drop indications where feasible | Required audit custody remains independently governed | Owners determine effects despite missing diagnostics | Restore diagnostics; recover audit obligations separately | Missing telemetry must not become permission or non-occurrence | Diagnostic blind interval; bounded exporter/drop/fallback policy |
| F26 — Mandatory pre-action audit custody unavailable | Consequential owner/Audit; authenticated authorized actor | Intent/operation/policy, required custody contract | Custody outage/admission denial | Record gate decision when permitted custody available, retain pending facts | Selected gated action not dispatched | Establish required custody or block per explicit policy | No silent fail-open or universal harmless-work shutdown | Authorization alone insufficient for required evidence condition; operation risk/custody gate |
| F27 — Remote audit write acknowledgement lost | Audit/custodian; admitted producer for original actor | Stable audit ID and publication attempt/receipt | Write timeout/retry signal | Pending obligation, identity/binding and later receipt | Business effect unchanged; custody initially unknown | Query/deduplicate same record before retry | No raw payload in uncertain-write diagnostics | Two sends can mean one durable record; atomic custody acknowledgement protocol |
| F28 — Cardinality/output flood fills storage | Observability/Audit/Execution; malicious tenant/repository | Job/operation, admitted dimension class, obligation refs | Safe overflow/drop/pressure aggregates | Risk-required abuse/containment and critical custody disposition | Owner effects unaffected/unknown per operation | Bound/throttle/quarantine source, governed backlog recovery | No attacker labels/sink routing; tenant fairness | Deliberate loss coverage, not fabricated completeness; numeric budgets/isolation capacity |
| F29 — Security incident during telemetry outage | Incident/Security/evidence owners; authorized responder under independent duty | Incident/investigation, affected scope/ops, custody gap | Independent permitted health/containment evidence | Responder authority, available facts/gaps, action/effect evidence | Partial known facts; unresolved operations explicit | Scoped containment and later independent reconstruction | Break-glass remains bounded human-governed | Timeline incomplete, no unlimited emergency access; fallback custody/duty policy |
| F30 — Collector or telemetry vendor compromised | Audit/Security/custodian; producer actors, authorized responder | Pipeline/version/destination, checkpoint/evidence/incident | Suspect integrity/coverage signals from independent source | Compromise assessment, custody boundaries and containment | Source operations not inferred from forged/dropped telemetry | Suspend affected export, verify owners/independent evidence | Exfiltration/PII and secrets classification | Intact stored bytes may still be false; independent anchors/provider trust |
| F31 — Privileged administrator deletes/truncates evidence | Audit/Security; admin actor versus original action actor | Admin operation, custody checkpoint/range/incident | Integrity/gap and privileged-change observations | Authorized disposal or suspected tamper, prior anchor evidence | Prior business effects unchanged; history coverage reduced | Recover independent custody or mark gap, investigate | Admin infra privilege not tenant evidence authority | Missing tail may evade unanchored chain; admin separation/custody verification |
| F32 — Cross-tenant evidence query/export | Security/Audit; support/investigator with claimed scope | Investigation/export/query purpose, trusted tenant/resource refs | Safe deny/export bounded count | High-risk access decision, filtered export/custody provenance | Denied disclosure not performed where enforced | No broadened retry; explicit approved investigation relationship | Counts/linked traces/caches can leak even without raw logs | Search access is consequential disclosure; query/export/aggregate enforcement |
| F33 — User/tenant deletion conflicts with incident hold | Data owner/Audit; authenticated deletion requester, eligible case authority | Actor tombstone/tenant/evidence/hold/deletion policy | Suppression/cleanup/hold state | Reason/scope/policy, retained permitted attribution and explicit disposal gaps | Content access suppressed where required; history not falsely denied | Resolve actual policy conflict, detach payload and track cleanup | No infinite personal-data retention or automatic total erasure | Deleted profile can remain historical actor reference; obligations/hold policy needed |
| F34 — Restore or Sophia backfill resurrects deleted payload | Custodians/Sophia; authorized restore/backfill operator | Source/evidence revision, tombstone, projection/backup generation | Restore validation/cleanup/suppression signals | Restore/backfill purpose, tombstone application and disposition | No permitted disclosure until current checks | Reapply suppression before exposure, remove derivatives | Backup/index/cache/summary leakage | Restored bytes not current eligibility; restore/tombstone propagation protocol |
| F35 — Late provider token/cost correction after retry | Model/accounting owner; delegated Run actor, authorized reconciliation | Model/provider requests/attempts, Run/task/tenant, billing receipt | Usage/latency/error aggregates and estimated cost | Risk-required spending/disclosure decision references; authoritative receipt provenance | Inference/charge may be known independent of task success | Reconcile receipts/corrections; count real repeated usage not delivery duplicates | No prompts for billing; scoped financial views | Unknown != free, estimate != actual; usage/price/late-receipt contract |
| F36 — Investigator summary claims old approval is current | Approval/Security/Audit; authorized reader or generated summary | Historical Decision/policy, current operation/owner refs | Safe stale-evidence/deny signal | Current check/deny and attributable derived interpretation | No new dispatch solely from summary | Resolve current owner state and exact binding/use before work | Summary/model content is data, no self-elevated trust | Historical evidence supports attribution only; trusted presentation/current query contracts |

### Operations, recovery and future validation

Define custody/query coverage, backlog age, duplicate/conflict rates, ingestion lag, dropped diagnostics, integrity-verification status, unresolved-effect counts, suspicious scope attempts, output/cardinality pressure and usage/cost uncertainty as conceptual operational signals. No alerts, dashboards, thresholds, numeric SLOs or instrumentation are created. Alert design must distinguish expected denials and diagnostic degradation from unfulfilled mandatory custody or suspect evidence.

Before separately authorized implementation, validate F01–F36 at actual trust/custody boundaries: crashes before/after commit/dispatch, producer/collector partitions, duplicate/conflicting/redelivered records, real provider uncertainty, temporal replay/rollover, concurrent approval use, stale worker/process population, cross-tenant query/count/cache/export, hostile output injection, secret exclusion, restore/tombstone propagation and independent integrity anchors. SDK mocks alone cannot establish external effects, deployed isolation or durable custody. No implementation tests, application build, security conformance, capacity or cost benchmark were run here.

Unknown workload/obligations gate evidence classes, event volume, horizons and budgets. Unknown hosting gates topology, administrative independence and recovery. Unknown provider contracts gate effect reconciliation, request propagation and billing accuracy. Unknown data/legal requirements gate retention/hold/disposal and immutable storage. Unknown operation policies gate which consequential actions require which custody acknowledgement before use. Those questions require accountable owner decisions before the affected implementation, without blocking this conceptual proposal.

## 11. Evolution / Exit Strategy

Start only after separate approval and implementation authorization with one representative consequential operation and the smallest complete evidence path: trusted owner attribution, current decision/required Approval references, durable custody/publication, honest effect disposition, authorized query and governed disposal. Add bounded diagnostics where they answer actual failure/latency questions. Do not pre-build a generic audit DSL, federation platform, universal schema, multi-region ledger or SIEM pipeline.

Evolve signal conventions and evidence contracts intentionally with producer/consumer compatibility and retained history interpretation. Sink replacement must preserve semantic IDs, custody/provenance, tenant authorization, policy-driven suppression and reconstruction limits. Diagnostic retention/sample changes cannot silently alter required audit obligations. Retain pending obligations and original evidence during governed migration; no unreviewed double writers or replay of effects to rebuild history. Revisit independent custody or stronger integrity mechanisms for demonstrated producer/admin compromise risk, applicable retention obligations, investigation needs or measured loss/capacity limits. Material accepted architecture changes require explicit supersession review.

ADR-012 remains **Deployment Architecture**, unstarted. It must later consider requirements for infrastructure/collector/storage placement, regions/residency, HA/DR, independent administrative/failure domains, network isolation/private connectivity, managed versus self-hosted services, cloud IAM, secret/KMS infrastructure and tested backup/recovery. None is decided here.

Explicit non-goals: final telemetry/logging/tracing/metrics vendor, SIEM, audit database/object store, WORM implementation, signing scheme or KMS/HSM; retention durations, numeric SLOs/alert thresholds/sampling percentages; metric names, universal JSON schema, API or database schema; Collector/cloud account/network/deployment/HA/DR topology; final package tree. No new runtime language, broker, Event Sourcing adoption, global database decision or product implementation is introduced. Existing Go, Temporal, Sophia-specific PostgreSQL/pgvector and hostile-code isolation decisions remain with their Accepted ADRs.

## 12. Development Constitution Compliance

Governance and architecture evidence were inspected before edits; a preservation baseline and repository concept search were established. The current owner request authorizes only documentation acceptance and directly supporting status/navigation synchronization. No accepted architecture, constitution or principles are amended. Minimal logical responsibilities follow ADR-002 and inward dependencies; no final bounded contexts or Shared Kernel are invented.

This proposal distinguishes verified primary-source mechanisms from NEXORA recommendations, unimplemented requirements and unresolved gates. Security covers current identity/authority, tenant isolation, secrets/disclosure, untrusted inputs, hostile execution evidence, forgery/tamper, administrative abuse and bounded failure. Documentation verification covers status, references, numbered sections and preservation; it does not establish runtime enforcement or compliance. Explicit human project-owner architecture approval is recorded above, dated 2026-10-06. No implementation or ADR-012 is authorized.

## 13. Related Decisions

| Binding record | Relationship preserved |
| --- | --- |
| [Development Constitution](../../DEVELOPMENT_CONSTITUTION.md) | Human authority, inspect/minimal change, evidence, no drift/deletion/unauthorized implementation |
| [ADR index](README.md), [architecture context](../architecture/ARCHITECTURE.md), [principles](../architecture/principles.md) | Proposal navigation, scope and conceptual constraints |
| [Accepted ADR-001](ADR-001-core-programming-language.md) | Go primary core/backend; no convenience runtime introduction |
| [Accepted ADR-002](ADR-002-architecture-style.md) | Modular ownership/inward dependencies and No implicit Shared Kernel; no universal audit domain |
| [Accepted ADR-003](ADR-003-agent-runtime.md) | Distinct Run lifecycle/outcome/wait/stop/effects, immutable attribution, Instance not authority, linked terminal retries |
| [Accepted ADR-004](ADR-004-workflow-engine.md) | Temporal infrastructure, Workflow not authority, replay discipline, independent Runs/Activities and deferred hosting |
| [Accepted ADR-005](ADR-005-event-architecture.md) | Event != Audit, reliable intent/deduplication, scoped order, no initial broker/default Event Sourcing, non-atomic DB commit + Signal |
| [Accepted ADR-006](ADR-006-memory-architecture.md) | Sophia knowledge/projection provenance, current access, suppression and no authority/secret/CoT retention |
| [Accepted ADR-007](ADR-007-mcp-tool-architecture.md) | Logical operation/attempts, current policy/Approval, admitted provider/credential references and honest effects |
| [Accepted ADR-008](ADR-008-sandbox-execution.md) | Dedicated stronger hostile-code isolation, actual source, bounded Job/Attempt, termination/cleanup/effects and untrusted output |
| [Accepted ADR-009](ADR-009-security-isolation.md) | Trusted current actor/delegation/resource scope, consequential enforcement, disclosure, revocation/fencing limits, governed operator access |
| [Accepted ADR-010](ADR-010-human-approval.md) | Immutable reviewed-intent/decision references, current usability/use/eligibility and Approval ownership; evidence cannot grant permission |

ADR-012 is a roadmap dependency only; no file or proposal is created.

## 14. Evidence / References

Primary sources reviewed **2026-10-06**. The facts below are scoped to the inspected official material. Proposed ownership, hybrid selection, custody policy, threat responses and failure walkthroughs are **NEXORA architectural inferences/requirements**, not source-provided guarantees. Versions/features must be rechecked before separately authorized implementation. No installed SDK/backend, runtime test, comparative benchmark, vendor price or compliance certification was verified.

| Reference / source | Exact external fact supported | NEXORA inference or limitation |
| --- | --- | --- |
| E1 — [OpenTelemetry Tracing API](https://opentelemetry.io/docs/specs/otel/trace/api/) | Span links can refer to contexts in the same or different traces; links at creation can inform sampling | Bounded linked traces fit async/resumed NEXORA work; links alone are not durable audit |
| E2 — [OpenTelemetry Baggage](https://opentelemetry.io/docs/concepts/signals/baggage/) | Baggage can propagate to unintended downstream resources and lacks built-in integrity checks | Never use baggage as trusted tenant/actor/authorization context; minimize disclosure |
| E3 — [W3C Trace Context](https://www.w3.org/TR/trace-context/) | Defines trace propagation headers; identifies information exposure, malicious-header parsing and denial-of-service risks | Admit/bound diagnostics separately from security scope; no header grants |
| E4 — [OpenTelemetry Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/) | Distinguishes occurrence timestamp and observed timestamp and permits trace/span correlation | Keep clock meanings explicit; do not freeze a NEXORA physical log schema |
| E5 — [Temporal Go observability](https://docs.temporal.io/develop/go/platform/observability) | SDK client/worker metrics and tracing are documented; current OpenTelemetry v2 integration is labeled pre-release and replay-safe | Future version/conformance review required; no integration adoption or audit completeness inferred |
| E6 — [Temporal Go Continue-As-New](https://docs.temporal.io/develop/go/workflows/continue-as-new) | New Workflow Execution/history continues the logical workflow with carried input | Preserve logical owner identities/correlations; not a new Agent Run by definition |
| E7 — [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) | Advises deliberate event content, sensitive-data exclusion, protection, injection handling and testing logging failures | Risk-driven custody and payload minimization rather than “log everything” |
| E8 — [OWASP ASVS 5.0.0 V16](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x25-V16-Security-Logging-and-Error-Handling.md) | Specifies logging inventory, investigation metadata/time, security events and protected/encoded log handling | Use as future verification input, not an ASVS compliance claim or selected verification level |
| E9 — [NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final) | Published guidance addresses computer security log-management processes/infrastructure | Lifecycle/custody/operations need accountable ownership; no NEXORA retention duration inferred |
| E10 — [OpenTelemetry security guidance](https://opentelemetry.io/docs/security/), [sensitive data](https://opentelemetry.io/docs/security/handling-sensitive-data/), [Collector configuration](https://opentelemetry.io/docs/security/config-best-practices/) | Discusses sensitive telemetry, tampering/DoS and collector configuration protection | Collector is a trust/exfiltration boundary; no configured pipeline or topology verified |
| E11 — [RFC 3161 timestamp protocol](https://www.rfc-editor.org/rfc/rfc3161) | Trusted timestamping supports evidence a datum existed before a particular time | Does not establish actual occurrence time or event truth; no protocol selected |
| E12 — [RFC 9162 Certificate Transparency](https://www.rfc-editor.org/rfc/rfc9162) | Merkle consistency proofs verify append-only consistency relative to tree commitments | Proof boundary does not establish source honesty or every NEXORA action captured; CT not selected |
| E13 — [S3 Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html) | Retention applies to object versions; governance and compliance modes have different bypass/protection semantics | Illustrative WORM tradeoff only, no AWS/storage/retention choice; immutable false input remains false |
| E14 — [Temporal Go workflow.GetLogger](https://pkg.go.dev/go.temporal.io/sdk/workflow#GetLogger) | Workflow-aware logger avoids duplicate logs during replay | Future instrumentation must verify actual replay behavior and separate attempts from logical audit facts |

Repository evidence: explicit owner ADR-011 handoff; current governance/status/index/context/principles; all ten Accepted ADRs and their owner evidence obligations; 18-file pre-edit byte snapshot and concept search retained outside the repository. Preservation and document checks are reported separately at completion. ADR-011 is Accepted with explicit human project-owner architecture approval dated 2026-10-06; acceptance does not authorize implementation.
