# ADR-010 — Human Approval Architecture

- Status: **Accepted**
- Proposal date: 2026-10-05
- Decision authority: Human project owner
- Approval date: 2026-10-05
- Approval evidence: explicit human project-owner architecture approval in this conversation: "I explicitly approve ADR-010 — Human Approval Architecture as proposed." Acceptance preserves the substantive architecture and all 100 approval invariants without semantic modification; it does not authorize implementation.
- Recommendation: Dedicated durable approval governance semantics, owner-defined reviewed intent, trusted human eligibility, immutable decisions, explicit usability/consumption and current consequential-owner enforcement
- Constraints: Accepted ADR-001 through ADR-009
- Scope: Conceptual approval ownership, policy composition, binding, review, lifecycle, use, failure and evidence; no implementation, product, schema, final package/context or deployment selection

## 1. Context

NEXORA's human governance must survive delayed decisions, changing resources and policy, duplicate notifications, concurrent reviewers and uncertain external effects. A human reviewing PR #42 at head H is making a different decision from merging H2. A staging approval does not cover production, a read does not cover a write, and a valid approval does not restore a disabled initiator's authority. A durable workflow can coordinate this review without owning its validity.

VERIFIED repository evidence before edits: fifteen Markdown documents and two incidental desktop metadata files; no source, manifests, schemas, workers, approval integrations or executable tests. The constitution, AGENTS, ADR convention/index, all Accepted ADR-001–009 completely and all architecture documentation were re-read. Topic searches covered approval, review, identity, policy, delegation, scope, revisions, waits, notifications, effects and recovery. The directory is not a Git repository; preservation uses a pre-edit byte snapshot rather than assumed Git history.

Current human direction authorizes ADR-010 and supersedes the supporting documents' older prohibition on starting it. Only directly supporting scope/status/navigation is synchronized. Historical scope wording in Accepted ADRs remains unchanged. No material conflict requiring an Accepted ADR amendment was found. The user-provided AGENTS scope predating ADR-007 is also stale against subsequent explicit owner directions and the actual Accepted records.

Required constraints: Go primary core/backend with no extra runtime for a convenient approval SDK; modular initial control plane and inward public owner contracts; selective DDD and application slices; no implicit Shared Kernel or universal ApprovalObject/GlobalAction/GlobalResource model; immutable Run launch attribution and separate lifecycle/wait/stop/outcome/effects; Temporal infrastructure without Workflow authority or automatic Run == Activity mapping; durable intent/deduplication and honest effects without an initial broker/default Event Sourcing; Sophia knowledge without authority; governed Tool operations and ADR-008's stronger hostile-code isolation; ADR-009's compositional current authority, trusted reviewer identity/scope, bounded delegation, current denies and actual PEPs.

UNKNOWN: tenant/organization relationships, concrete operation/risk classes, eligible reviewer groups, assurance requirements, conflicts of interest, quorum/rejection policy, emergency duties, numeric lifetime/use/budget limits, provider preconditions, privacy/compliance, consistency/fencing guarantees, workload, staffing and recovery objectives. These are affected implementation gates; this proposal does not invent roles, thresholds or universal reviewer rules. A hostile Agent/content/channel or compromised reviewer is an explicit threat assumption, not a proven runtime incident. Proposed controls are unimplemented and unverified.

## 2. Problem

Define what was reviewed, by which authenticated eligible human, against which policy and exact owner-defined intent, how long and how often it can be used, and what current checks permit actual dispatch. Prevent replay, material substitution, privilege widening and uncertain-effect retries while preserving immutable historical decisions and understandable ownership.

The approval boundary must provide durable governance without becoming a giant enterprise platform or deciding every domain's risk. Approval receipt, quorum satisfaction, current usability, consumption, provider acceptance, effect success and business outcome are separate facts.

## 3. Decision Drivers

1. Bind human review to the actual consequential intent and prevent scope/revision substitution.
2. Preserve current domain/security authority, provider eligibility and sandbox obligations at use.
3. Establish attributable reviewer eligibility, distinct-person quorum and policy-specific separation of duties.
4. Preserve durable immutable history while permitting expiration, revocation, cancellation and supersession.
5. Handle consumption, duplicate delivery, concurrent decisions and unknown effects honestly.
6. Keep channels, workflow, notifications and knowledge non-authoritative.
7. Use the smallest owner-composed governance boundary, independent of products and deployment.

Quality scenarios A–BZ in section 10 cover these priorities. Future authorized validation must prove rejection before actual dispatch/disclosure, convergence after lost responses and no duplicated human quorum or external operation. Timing, availability, volume, cost and revocation targets require owner-agreed measurements; none is selected or claimed passed.

## 4. Considered Options

1. Informal approval in chat/conversation.
2. A boolean `approved` field on an operation.
3. Workflow-owned approval state.
4. Tool-owned approval flag.
5. Generic approval service owning every operation's business semantics.
6. Domain-specific approvals only.
7. Dedicated approval governance boundary with owner-defined review envelopes and consequential PEP validation.
8. Human-approved standing policies/mandates for bounded automation.

Options can combine only while ownership is explicit. Option 7 is recommended; domain-specific meaning remains at its owner. Option 8 is a distinct governed policy/configuration decision, not reuse of an ordinary approval forever. A logical boundary does not require a separate deployed service.

## 5. Decision

**ACCEPTED: NEXORA models human approval as dedicated durable governance semantics. Authenticated, currently eligible humans review an immutable owner-defined intent/envelope revision. Approval owns requests, attributable immutable decisions, quorum evaluation, current approval usability and controlled consumption/revocation history. Domain/security owners determine requirements and retain operation semantics/current authority. The consequential owner PEP retrieves authoritative approval state and revalidates current policy, intent/resource/revision binding, provider/credential eligibility and enforceable obligations before actual use.**

Material changes require renewed review. Expired, revoked, superseded, stale, cancelled or otherwise unusable approval cannot satisfy required review for new consequential dispatch. Approval IDs, decisions, notifications, workflow history and model claims are references/evidence, never bearer grants. Current deny remains effective even when review is satisfied. Approval cannot lower ADR-008 isolation or grant raw credential access.

The hypothesis is refined in three ways: safe resource resolution/prevalidation is needed to construct a review; one linear pipeline cannot make local approval consumption and remote effects atomic; and reviewer eligibility after a decision is an explicit risk-specific policy, rather than universal automatic revocation on any role change. Stronger current policy and security incidents still constrain future use. A narrow logical boundary composed inside the modular control plane is sufficient initially; no new service, universal resource model or approval DSL is selected.

**Approval != Authorization != Authentication. Approval != Capability or Permission. Approval != Delegation != Impersonation. Approval != Workflow authority != Tool authority != Credential != Execution authority. Approval != successful external effect != successful business outcome != permanent permission.** An approval can satisfy one required human-review obligation within current authorization; it does not independently authorize the operation.

**Approval Request != Approval Decision. Approval Policy != Approval Instance. Reviewer Eligibility != Reviewer Decision. Approval Record != current authorization. Expired/revoked/stale approval != usable approval. Break-glass != ordinary approval.** Intent A is not A′; H is not H2; inspection, mutation and deployment differ; staging is not production; one operation is not an arbitrary chain; approval to dispatch is not approval to blindly retry an unknown effect.

This record is **Accepted** on 2026-10-05 with explicit human project-owner architecture approval recorded above. Acceptance does not authorize implementation. ADR-011 is not started.

## 6. Detailed Design

### 6.1 Approval vocabulary

These thirty concepts describe semantics, not mandatory classes, tables, roles, services or shared domain entities.

| Concept | Meaning / distinction |
| --- | --- |
| Approval Policy | Owned rules for when review is required, eligibility, binding, quorum, validity and use; not one approval |
| Approval Requirement | Concrete applicable human-review obligation composed from domain/security policies for an intent |
| Approval Request | Durable invitation to decide on a particular immutable review revision and requirements |
| Approval Subject / Reviewed Intent | Owner-defined consequential operation, effect/disclosure surface, scope and relevant revisions |
| Review Envelope | Trusted resolved binding plus human-review presentation, references, labels and requirements |
| Reviewer / Approver | Authenticated human making a decision through an admitted channel; identity is not eligibility |
| Reviewer Eligibility | Current scoped policy result that this person may contribute to this request |
| Approval Decision | Attributed human approve/reject/abstain/recuse decision for an exact reviewed revision |
| Approval Rejection | Negative governance decision with explicit request/quorum consequences |
| Abstention / Unable to Decide | Non-approval contribution or inability; neither silently counts as approve nor necessarily a veto |
| Approval Record | Authoritative retained request/decision/governance history and usable-state references |
| Approval Evidence | Permitted proof of reviewed meaning, identity, eligibility, policy and decision/use history |
| Approval Scope | Trusted tenant/project/resource/action/task/environment and material contextual limits |
| Approval Binding | Owner-defined relationship between reviewed intent and the actual consequential operation |
| Approval Validity | Whether required review is presently usable under applicable constraints; not authorization |
| Approval Expiration | Time/context/revision/generation/use-bound end of usable approval, preserving history |
| Approval Revocation | Authorized prospective withdrawal/restriction, appended without undoing prior effects |
| Approval Consumption | Controlled association/use accounting for logical operation(s), separate from success |
| Approval Reuse | Explicit permitted additional use within bound scope and limits; never implied |
| Approval Supersession | New linked review replacing materially changed intent/requirements without rewriting history |
| Stale Approval | Review no longer matches a material current intent, resource, requirement or context |
| Quorum | Policy-specific combination of distinct eligible contributions/groups/order |
| Separation of Duties | Required distinct actors/roles or conflict restrictions for selected operation risks |
| Self-Approval | Review by an initiator/author/represented human with a potential policy conflict |
| Approval Escalation | Governed routing/attention or revised requirement, not permission from timeout |
| Delegated Reviewer | Human acting under explicit scoped attenuated review authority; not an Agent task delegate |
| Emergency / Break-glass Approval | Exceptional bounded incident review/duty relationship under ADR-009 |
| Approval Notification | Informational delivery/wakeup referencing an authoritative record; not authority |
| Approval Owner | Accountable owner of durable review/decision/use semantics, not all business state |
| Consequential Operation | Owner-defined mutation, disclosure, execution, cost or other effect requiring current enforcement |

Request, Decision, Operation, Run, Workflow, Job, attempt, event and provider request identities remain distinct. Preserve stable correlations without making any ID a credential or idempotency key. A logical operation identity supports deduplication only under its actual owner/provider contract.

### 6.2 Ownership and policy composition

| Responsibility | Authority retained | Public interaction / prohibited takeover |
| --- | --- | --- |
| Domain/resource owner | Resource identity/revision, action semantics, invariant, materiality and domain review requirement | Supplies resolved intent and enforceable preconditions; Approval cannot decide whether a merge is a valid business transition |
| Security/identity/membership owner | Trusted human/workload identity, scope, assurance, current restrictions, reviewer/delegation eligibility | Supplies current decisions; roles and infrastructure admin status are not universal review grants |
| Approval owner | Request/revision, admitted decision, immutable evidence, quorum, usability, consumption, revocation/supersession | Exposes narrow governance contracts; no private cross-owner SQL or universal risk model |
| Tool/Execution owner | Actual operation/job/source, adapter/principal, effects, dispatch/reconciliation and required controls | Coordinates approval and current authorization at actual use; cannot invent approved flags |
| Workflow / Runtime | Durable waits/coordination and separately owned Run lifecycle/attribution | Retains references and asks owners; cannot write approval truth or reopen terminal Runs by notification |
| Channel / Virtual Office | Authenticated review interaction and truthful presentation through admitted adapter | No local button state, message or notification is approval truth |
| Sophia | Permitted knowledge/reference projection | No approval source of truth or semantic/embedding-derived permission |
| Audit/observability | Broader reconstruction, custody and operations under ADR-011 | Approval defines necessary governance evidence, not the complete audit implementation |

Compare policy placement: one centralized approval policy is easy to inspect but risks owning every domain's meaning; only domain-local policy preserves meaning but can omit common security requirements; security-only placement cannot determine business transition risk. Recommend **compositional requirements**: relevant domain and security owners supply required reviews, eligibility/conflict and stronger restrictions; Approval provides durable governance semantics and evaluates those requirements through owned contracts. No arbitrary last-writer-wins policy merge or least-restrictive fallback. Unresolved owner conflicts block affected use and go to accountable review.

Multi-purpose review (security, cost, production ownership) names explicit required contributions. One request with multiple requirements or linked requests are both possible; do not freeze an aggregate/schema. Satisfaction requires all applicable obligations, without covert notification chains becoming approval authority. Policy revisions and the applied composition are attributable. A new stronger requirement cannot be bypassed by a pending request created under weaker policy; adapt through a reviewed revision/new request or block until requirements are satisfied. Completed historical decisions retain their original policy attribution.

This boundary remains compatible with ADR-002: adapters depend inward, owners expose minimal semantics/references, similarly named models may differ, and no final bounded contexts/package tree or Approval-as-a-service topology is fixed. Domain-semantic shared contracts require explicit ownership, consumers, compatibility/change rules and review; reuse alone does not justify `shared`, `common`, `core`, `platform`, `utils` or equivalents.

### 6.3 Canonical approval flow and consequential enforcement

```text
Workflow / application proposes next operation
    → trusted identity/scope and authorized owner resource resolution
    → operation prevalidation + current domain/security approval requirement
    → immutable owner-defined reviewed intent / Review Envelope revision
    → Approval owner durably creates Request and required notification intent
    → Workflow durably waits; Runtime may use Waiting with reason approval
    → admitted channel authenticates human, discloses only authorized review content
    → current reviewer eligibility / conflicts / assurance / revision check
    → immutable Decision + authoritative quorum/governance update persisted
    → reliable notification referencing decision/request
    → Workflow wakes; Activity / consequential owner retrieves authoritative state
    → current approval usability + exact binding + controlled consumption
      AND current authorization + resource/preconditions + provider/credential + obligations
    → controlled actual dispatch or explicit denied/stale/unavailable disposition
    → independent effect/reconciliation evidence and business result at their owners
```

Prevalidation protects target lookup and allows a safe truthful envelope; it is not durable authorization. Final checks apply after waits, queues, credential resolution and retries. Approval eligibility cannot be inferred from the Agent's choice of reviewer. Mutable reviewer/security/resource/approval checks occur outside deterministic Temporal Workflow code. An Activity is an application/infrastructure boundary, not automatically an Agent Run.

A local owner transition can use a reviewed atomic check/consume protocol where available. Remote dispatch does not share one transaction with Approval, security or Temporal. Before implementation, define authoritative claim/consumption ordering, dispatch uncertainty and recovery; prevent concurrent users from spending a one-shot approval on two different logical operations. Revalidation at the dispatcher alone cannot fence a remote request already accepted. Enforce target conditions where available or refuse an operation whose required binding cannot be guaranteed; record residual in-flight limits instead of claiming instantaneous revocation or exactly-once effects.

### 6.4 Review Envelope and exact-intent binding

The operation owner defines canonical resolved machine intent and its material semantics. Trusted human-readable facts MUST derive from the same reviewed revision and describe the consequential meaning the PEP enforces. Labels, names and an AI summary alone cannot be the binding. Any redaction must still permit adequate authorized review; if required facts cannot be disclosed or understood through that channel, route to an eligible permitted review path or block, rather than solicit blind approval.

Potential material dimensions: trusted tenant/project; canonical owner/resource and action; expected source/target state/revision; validated arguments and downstream effect set; environment/destination/recipient/provider/account; disclosure data/purpose; execution profile/source/image where material, egress and credential class/reference identity without values; amount/item membership/count/cost ceiling; task/assignment/Run/Workflow relationships; approval requirement/policy revision and validity/use rules. **Every dimension that changes human risk or meaning must be bound or force renewed review.** Not every field is material for every operation, and no universal field list/schema/hash serialization is selected.

Example: merge PR #42 in repository R/account X at head H, against material target-base assumptions B and environment E. Reviewed H must match dispatch H; H2 requires re-review where source binding matters. GitHub documents an expected head SHA parameter for merge [G1]; that concrete API does not freeze a NEXORA adapter or prove protection for every base/policy change. Required preconditions must be actually enforceable under the admitted operation contract, not a read-H then unchecked merge. Unsupported constraints require refusal or a separately reviewed alternative.

Read resource R is not write R; staging is not production; recipient X is not Y; credential repo-wide scope cannot widen R; one approved step cannot cover a hidden merge/deploy chain. Materiality is determined through owner rules, not a model asserting “equivalent.” Content corrections, comments or harmless display metadata need not invalidate unrelated review, but significance uncertainty blocks affected use until resolved. Immutable reviewed revisions preserve what was shown; material changes create a linked new review revision/request, never silently alter an exposed envelope.

### 6.5 Trusted presentation, content and admitted channels

Review separates **trusted governance/operation facts**, **advisory AI-generated explanation**, and **untrusted reviewed content** such as PR description/diff, webpage, issue, log, Tool output or Sophia excerpt. An Agent can summarize/recommend but cannot establish binding or omit machine-relevant risk. Preserve explanation revision/source references when material to reconstructing what the human saw; do not retain private chain-of-thought. AI-generated explanations remain advisory even if helpful or fluent.

Untrusted content cannot change scope, hide effects, add credentials, approve another action or override policy. Free-text reviewer comments are untrusted metadata: “approve staging, and production too” cannot extend the machine-bound staging intent. A new proposed action must cross the owner's requirement/envelope/review boundary. Reasons may be optional, required for selected rejection/high-risk decisions or other policy-specific needs; no universal comment mandate is chosen.

| Channel alternative | Potential fit | Admission obligations / unresolved choice |
| --- | --- | --- |
| NEXORA web UI | Rich trusted intent display and revision handling | Authentication/assurance, disclosure, CSRF/clickjacking, scope, stale page and decision authenticity need verification; no framework selected |
| Email link | Asynchronous reach | Email receipt/forwarded link does not authenticate an eligible reviewer or approve; retrieve authoritative request and admitted authenticated action |
| Slack/Teams interactive action | Convenient collaboration | Signed provider payload/channel membership alone does not establish NEXORA identity/eligibility; map trusted human, request, revision and scope |
| Mobile push | Timely attention | Notification/device receipt is not decision; sufficient trusted facts and authenticated action still required |
| Provider-native review | Existing review evidence near artifact | Provider reviewer/action/revision semantics must meet NEXORA requirements and trusted admission; cannot assume provider approval covers deployment or current NEXORA policy |
| CLI | Engineering-oriented explicit interaction | Authenticated principal/scope, authoritative revision, intelligible review and replay/concurrency checks; no endpoint/tool implemented |

No channel is selected. Every admitted decision establishes reviewer principal, assurance/session basis, decision, time/order, request/envelope revision, eligibility/policy basis, quorum contribution and channel, with a reason where required. A normal chat “yes” is an attributed statement only unless an explicitly admitted boundary authentically binds that human decision to the authoritative reviewed request and policy. No model interpretation of chat can manufacture approval. OAuth/integration consent remains provider access/data-use consent under ADR-009, distinct from approval of one consequential action.

Phishing, forged messages, stolen session/device, wrong tenant/account, stale browser, misleading labels, notification fatigue, coercive repeated requests and prompt injection are review threats. Admit channels only with adequate identity, scope, presentation, stale protection and current eligibility; control request/notification abuse and bound escalation. Exact authentication, CSRF/session, signing and presentation technologies remain undecided. Backend decision admission and PEP enforcement remain required even with a good UI.

### 6.6 Reviewer eligibility, conflicts, quorum and rejection

Authenticate the human through an admitted mechanism. Then evaluate current tenant/project/resource/action/environment/sensitivity scope, required group/duty, assurance, relationship to initiator/author/delegator, conflict rules, delegated review scope and current restrictions for this request. A tenant admin or operator is not automatically eligible, and possession of review content or a request ID grants nothing. Cross-tenant review requires an explicit owner-governed relationship; humans in both tenants select an explicit operating scope rather than union memberships. Agents/LLMs cannot become human reviewers or approve themselves through a delegated task.

Self-approval is policy-specific. Initiator reviewing their request, human reviewing their delegated Agent's action, developer approving production deployment, service maintainer approving maintenance, or operator reviewing emergency access can present different conflicts. Where separation is required, enforce it against actual authenticated principals/represented relationships, not display names. Do not universally prohibit all same-human decisions or presume all are permitted. Unspecified material conflict rules block affected use until an accountable policy is established.

Quorum can be one eligible human, N-of-M distinct humans, required groups, parallel or sequential contributions. No universal numeric quorum is selected. A contribution binds principal and exact review/requirement revision; retry, aliases or two devices cannot count one person twice for distinct-principal positions. Distinct groups do not establish distinct people unless policy says so; conflicting required-role occupancy and sequence changes must be governed. Concurrency must yield an authoritative attributable result, not a count in a browser. Unknown quorum/update state is not satisfied.

Reviewer eligibility MUST hold at decision admission. After that, compare three policies: decision-time eligibility preserves a valid historical contribution when routine membership changes; current-until-consumption rechecks contributions at use but adds availability and reviewer churn; risk-dependent policy combines explicit rules. Recommend explicit risk-specific contribution/usability policy, with stricter current checks where risk requires. No universal retroactive erasure or automatic role-change revocation. Current compromised/disabled identity, incident restrictions, changed requirements or explicit withdrawal can make future use unusable according to applicable policy; decision history stays immutable. Before any affected implementation, specify which eligibility dependencies remain current until quorum/consumption.

Approve, reject, abstain, recuse and unable-to-decide are distinct. Rejection's veto/terminal/rework behavior is requirement policy; no last-click-wins or silent conversion to approve. A rejected request may close or await explicitly permitted contributions, but unusable requirements cannot dispatch. New material work can create a linked revised request under current rules; identical Agent resubmission cannot pressure-loop or evade rejection. Overrides require explicit authoritative policy, eligible human review and linked evidence, never Agent retry. Abstention/recusal does not count as approval or automatically imply rejection. Escalation changes routing/attention or governed requirements, not authority merely because a timeout elapsed.

### 6.7 Orthogonal request, decision, usability and outcome semantics

| Dimension | Conceptual values / meaning | Distinction |
| --- | --- | --- |
| Request lifecycle | Created/draft, open for review, closed, cancelled, superseded under owner rules | Closing/routing is not proof an operation executed |
| Individual decision | Approve, reject, abstain, recuse, unable-to-decide; immutable revision-bound evidence | Later withdrawal/correction is linked history, not overwritten decision |
| Requirement/quorum | Pending, satisfied, unsatisfied/rejected or unable to establish | Satisfied is a derived governance fact, not current usability |
| Current usability | Valid or expired/revoked/stale/superseded/cancelled/restricted/unknown | Evaluated for a bound consequential use and current requirements |
| Consumption | Unused, reserved/claimed where selected, associated use(s), exhausted, unresolved dispatch association | Consumed is not performed or succeeded |
| Operation/effects | Not dispatched, confirmed not performed, performed/partial/unknown under ADR-007/008 | Owned separately, with reconciliation even after request/Run closes |

These labels are conceptual, not a single giant enum or final state machine. Normal path: request created → open → admitted decisions → quorum satisfied → usable bound use/consumption → operation dispatch → separate effect/outcome. A satisfied request can become unusable before use. Rejected/expired/revoked/superseded/cancelled dispositions retain evidence and resolve waiting through explicit owner coordination; a late notification cannot reopen a terminal Run. Runtime retains `Created → Queued → Running → Waiting → Queued → Running → Finished`, plus `Running → Finished`; approval is a waiting reason, not a replacement lifecycle. Stop request, final outcome and effect knowledge remain separate.

Expiration may be absolute time, context/resource revision, policy generation or consumption-bound, as appropriate. No universal TTL or clock implementation is chosen. Revalidate usability after workflow wake and near dispatch; waiting cannot extend validity. Expiration is future-use restriction without deleting history. Authorized revocation appends actor/cause/scope/effective decision and enforcement observations; it cannot undo a provider-accepted mutation. Cancellation closes pending intent under policy and records its race with decisions/use; it does not prove external cancellation. Supersession links materially changed intent/requirements to new review; old facts remain attributable.

Policy upgrades, changes of resource ownership/provider/effect meaning and revoked authority can constrain use without rewriting what earlier humans reviewed. Unrelated metadata need not make an approval stale. Completed historical consumption and effects remain historical under their original attribution; corrections are explicit, auditable, linked, never silent replacement.

### 6.8 Consumption, reuse, dispatch races and retries

| Use model | Potential fit | Required limits |
| --- | --- | --- |
| Single logical operation | High-impact merge/deploy/payment with exact reviewed meaning | One-shot association cannot authorize a different operation; duplicate delivery converges on existing association |
| Bounded multi-use/batch | Explicit item set/count/amount/destination/period | Stable material membership/limits, attributable per-item uses, concurrent accounting and current authorization for each consequential item |
| Bounded read/session class | Explicit low-risk scoped read class where justified | Recipient/data/purpose/validity and usage rules, current disclosure authorization; not arbitrary future chain |
| Standing automation policy/mandate | Human-governed bounded autonomous configuration | Separate owned versioned policy and current mandate, not one eternal approval ID |

Prefer narrow exact-operation review for high-impact action; do not require one-shot approval for every read or every sandbox job. Reuse requires explicit policy for operation class, semantic bindings, use/amount limits, expiration, revocation and authoritative accounting. One approval for O cannot silently bind O2. A reservation/claim mechanism may prevent concurrent competing consumption; its durable ordering and recovery must be resolved before implementation, without choosing locks/schema. Authority is not returned to a pool just because a sender timed out.

Differentiate notification redelivery, logical-operation redelivery, safe dispatch-attempt retry, terminal semantic retry/new work and reconciliation. Same logical operation redelivery finds the prior consumption/dispatch disposition, even after consumption; it does not mint fresh review or repeat effect. Terminal Run retry creates a new linked Run under ADR-003; the operation owner's semantic identity/effects and approval policy determine whether new review is required. Prior approval never automatically covers a new semantic retry.

After a possible send, preserve unknown effect and consumption association. Reconcile through authoritative provider/operation evidence before deciding retry. Confirmed not performed permits evaluation of a safe retry only with unchanged intent, valid use/reuse policy, current authorization and eligible provider/credential; non-performance alone does not replenish an exhausted approval. Confirmed performed returns that evidence without another mutation. Partial performance requires per-effect disposition; unknown remains blocked from blind replay and retains durable escalation/manual custody. Verified target idempotency may permit reconnecting to the same logical operation under its actual scope/horizon; approval ID is not that idempotency key. No universal exactly-once or distributed atomic transaction is claimed.

Revocation/cancellation before definitive owner acceptance blocks affected new use. After dispatch, stop future work and request supported containment/cancel; effects may already be accepted or irreversible. Record check/consume/dispatch/revoke order and actual enforcement evidence. Exact linearization point, claim fencing and approved-use-to-provider boundary are operation-specific implementation gates. Approval-system unavailability cannot prove an old call stopped or safely release uncertain consumption.

### 6.9 Workflow, events, Runtime and Sophia

Approval creates durable governance outside deterministic Workflow state. Temporal waits on coordination references and wakes on authenticated correlated notification; Activities/owners retrieve authoritative current state before new use. Historical branch replay does not refresh, recreate, extend or consume approval. Signals/Updates indicate input delivery/coordination, never approval authenticity/validity. `Workflow != Agent Run != Agent`; no automatic `Agent Run == Temporal Activity` mapping. Workflow definition and history remain non-authority; hosting stays ADR-012.

ApprovalRequested, ApprovalDecisionRecorded, ApprovalSatisfied, ApprovalRevoked and ApprovalExpired are illustrative fact names, not chosen topics/contracts. Events are facts/notifications, not authority. Apply ADR-005 durable publication intent/Outbox and durable consumer deduplication/equivalent where committed approval must reliably wake another owner. `DB commit + Temporal Signal` is non-atomic. Duplicate/replayed events reconcile current request/use state, not recreate consumed/revoked/expired approval. Notification delivery success is not workflow handling, current validity or dispatch success. No general broker, Event Sourcing, wire format or schema is selected.

Sophia can later index permitted explanatory/reference material through owner contracts; governance decisions remain Approval-owned, not normal knowledge facts. Embedding similarity, retrieved text, conversation or AI summary cannot establish approval, reviewer eligibility or current policy. Projections respect current access/deletion rules; Sophia is not the approval source of truth. Approved organizational guidance does not become a permission grant.

### 6.10 Tool, Execution, disclosure, cost, batches and autonomy

Tool dispatch must match the reviewed action/target/arguments/revision/environment/provider/account/effect surface; broad provider credentials do not widen approved scope. Check current credential/provider admission and owner restrictions near actual dispatch. An MCP schema, descriptor, native API login, external consent or Tool flag cannot substitute for approval. Changing adapter is acceptable only if admitted equivalent semantics/control coverage remain valid; changed consequential semantics requires re-review.

Execution binds material source representation including relevant patches/dirty inputs, execution profile, environment, egress, credential class/reference identity, output destination and effect surface. Policy decides which risks require review, not every sandbox job. H cannot become H2, restricted network cannot become broader network, and a new secret requirement cannot be silently added. Approval does not waive isolation/resource/output/process/cleanup controls or give hostile code privileged host access. Deliberately supplied secret remains readable by that code under ADR-008; approval cannot guarantee its confidentiality. Cleanup, exit, effect and business outcome remain separately evidenced.

Sensitive reads/model exposure, source export, cross-organization sharing and logs can require human review. Bind material data scope, recipient/provider/account/purpose and permitted disclosure, then revalidate current read/disclosure authority before sending. Review content exposure itself is a sensitive read. Approval to send to provider X cannot silently route to Y. Already disclosed information cannot be retroactively unread; owner suppression/incident cleanup applies without false rollback claims.

Large model runs, fan-out, paid provider operations or infrastructure cost can require bound budget ceilings/units and effect limits under owner policy; no currency or numeric threshold is selected. Materially exceeding approved scope requires new review, not accepting a post-hoc charge as approval. Estimates and provider-billing uncertainty must be visible; cost evidence does not automatically make the business outcome successful.

Batch approval names material membership/count/amount/destinations and any authorized conditional item rules. Do not expand 100 to 101 or substitute a different item. Each consequential item receives current authorization and binding at use. If an item becomes forbidden, policy may block the whole batch or permit the reviewed independent eligible subset only if partial execution was part of the approved semantics; report excluded/performed/unknown items. A new batch identity cannot hide prior effects or exhausted consumption.

Autonomy level is not blanket approval. Pre-approved low-risk classes and bounded Agent mandates must be governed current policy with responsible owner, actions/resources/environment/limits and revocation. A human may approve automation policy/configuration separately; material changes follow its governance, and each action still crosses current authorization and approval requirements. Represent recurring authority as an attributable versioned policy/mandate, never an ordinary permanent `approval_id` or inherited Agent Instance permission.

### 6.11 Reviewer delegation and break-glass

Reviewer delegation, where policy permits, binds delegating human, delegated human, scope/action/environment/purpose, validity, attenuation, revocation and conflict restrictions. Review authority cannot exceed the upstream eligible authority or waive separation of duties. Re-delegation needs explicit policy; historical attribution preserves the chain and decision-time basis. Delegation of an engineering task to an Agent cannot make it a human reviewer. A delegated reviewer outside scope is denied, not remedied by platform privileges.

Emergency review complements ADR-009, not bypasses it. Evaluate pre-authorized narrow emergency duty, emergency human approval/dual control where policy requires, and independent post-action review. Unavailable reviewers may route to an explicitly governed eligible alternate or invoke a previously defined bounded emergency duty under its own current conditions; if neither exists, the action is unavailable. Post-action review cannot retroactively authorize an unauthorized operation. `break_glass = true`, operator root access or incident urgency is insufficient.

Emergency scope/reason/incident/actor/eligibility/validity/effect/obligations remain attributable, minimal, revocable and independently reviewable. Operator self-review is denied when applicable segregation policy requires another human; do not invent universal dual control for every incident or silently allow unrestricted self-approval. Agents cannot self-grant/invoke emergency privilege. Physical impossibility, provider revocation and ADR-008 isolation remain binding. Irreversible emergency effects are reconciled/reviewed honestly, not presumed rolled back. Reviewer classes, unavailability behavior and emergency assurance/evidence path require explicit owner policy before use.

### 6.12 Availability, write uncertainty and concurrent governance

Required valid approval unavailable/unestablished means **no new consequential dispatch**. Distinguish owner/store unavailable, identity/eligibility unavailable, pending/rejected/stale request and technical notification failure; no fake rejection or allow. Already dispatched effects retain reconciliation custody. Independently authorized safety cleanup can continue under ADR-009's narrow duty, not by fabricating unrelated approval.

Request creation failure leaves no presumed request; uncertain creation requires stable semantic correlation and authoritative reread. A reviewer click timing out leaves decision write unknown, not automatically failed. Reconcile by stable request/decision-command identity and exact binding before soliciting a duplicate decision; conflicting payload under one identity is an integrity error. Retry only converges on existing disposition or completes a proven absent decision under current admission rules. No universal exactly-once decision-delivery claim.

Authoritative concurrency semantics govern decision admission, revision/eligibility, quorum, cancellation, supersession, revocation and consumption. Two simultaneous reviewers may contribute independently, but the same human on two devices cannot create two quorum positions. Approve/reject conflicts require policy-defined decision replacement/withdrawal/conflict/veto behavior and attributable order; no unqualified last-write-wins. A stale page cannot decide a superseded review. A delayed rejection after apparent satisfaction must be adjudicated before use under the same authoritative policy; an already accepted external effect is not erased.

Approval notification loss/delay does not erase a durable decision. Retain publication obligation, bounded retries/recovery and stale-wait reconciliation. Workflow wake failure keeps coordination responsibility; reread owner state, correlate expected request/wait/Run and avoid duplicating review or dispatch. Stale replicas cannot establish required fresh usability when their restriction/revision coverage is insufficient. Crash during quorum/consumption recovers from durable owner evidence, not an in-memory count. Atomic write/version/locking/read-consistency mechanisms and clocks remain implementation decisions.

### 6.13 Provenance, evidence and privacy

Preserve sufficient permitted evidence to reconstruct what the human saw: trusted intent/envelope revision and material resource/source/target/provider/environment references; policy/requirement revision; presentation/source references and material AI-explanation version; untrusted attachment provenance; reviewer principal/session assurance/channel; eligibility/conflict/delegation basis; admitted decision and time/order; distinct quorum contributions; current usability/restriction, consumption/operation association; revoke/expire/cancel/supersede/correction links; actual PEP checks/dispatch/effect references. References/hashes may preserve meaning only when governed source availability and reconstruction limitations are explicit; a digest alone does not explain deleted content or establish human comprehension.

Immutable decision attribution is historical. Later restrictions append current decisions; policy/role changes cannot silently rewrite the earlier person, reviewed intent, effective policy or Run attribution. Corrections retain what was erroneous, who corrected it and why through auditable links, subject to privacy policy; no ordinary silent replacement. Approval evidence is not an authorization token or full audit system.

Minimize sensitive diffs, source names, identity, business data and comments. Current authorization governs evidence/review access. Raw secrets and private chain-of-thought are excluded. If a comment accidentally contains a secret, withhold/restrict the contaminated content and handle a redacted incident/correction under approved privacy/custody rules rather than copy it everywhere; preserve meaningful attribution without retaining the raw value in ordinary evidence. Perfect content detection is not claimed. ADR-011 owns final retention, correction/deletion balance, storage/integrity and broader audit; ADR-012 owns backing infrastructure. Required evidence incomplete/unavailable blocks applicable decision admission/use or causes an explicit incident for already performed work, never invented authenticity.

### 6.14 Accepted approval invariants

The following refine the owner's candidates into Accepted architectural obligations. They are not implemented controls or acceptance evidence. Eligibility-at-use, rejection, comment and reuse policies remain explicitly operation/risk-specific; no universal quorum or TTL is inferred.

1. Approval is not authorization.
2. Approval is not authentication.
3. Approval is not capability or permission.
4. Approval is not delegation.
5. Approval is not a credential.
6. Approval is not Workflow authority.
7. Approval is not Tool authority.
8. Approval is not execution authority.
9. Approval does not override current security/domain denial.
10. Approval does not weaken ADR-008 isolation.
11. Agent/LLM cannot approve itself.
12. Model output cannot create human approval.
13. Conversation text is not approval unless admitted through the authoritative approval boundary.
14. Approval notification is not authoritative approval.
15. Event/Signal/Update delivery is not approval.
16. Approval ID is not an authorization token.
17. Approval ID is not an idempotency key.
18. Approval Request identity is distinct from Approval Decision, Tool Operation, Run, Workflow, Job and provider request identity.
19. Approval binds a specific reviewed intent and authoritative scope.
20. Material intent changes require re-review.
21. Source revision changes invalidate source-bound approval where material.
22. Target/environment changes invalidate approval where material.
23. Provider/account/recipient changes invalidate approval where material.
24. Human-readable review and machine-enforced binding must describe the same consequential intent.
25. AI-generated summaries are advisory and cannot replace canonical trusted operation facts.
26. Untrusted reviewed content cannot broaden approval scope.
27. Reviewer identity is authenticated through a trusted admitted channel.
28. Reviewer eligibility is policy-controlled and attributable.
29. Reviewer eligibility is distinct from reviewer identity.
30. Reviewer role alone does not imply eligibility for every request.
31. Cross-tenant approval is denied absent explicit owner-governed relationship.
32. Self-approval is governed explicitly, not assumed allowed.
33. Separation of duties is operation/risk policy, not a universal hard-coded rule.
34. Quorum counts distinct eligible reviewer contributions according to current request policy.
35. Duplicate decision delivery does not create duplicate human authority.
36. A reviewer cannot satisfy multiple distinct-principal quorum positions merely by retrying.
37. Approval decisions are immutable historical facts; later revocation/supersession is appended, not rewritten.
38. Pending request contents cannot be silently mutated after reviewer exposure.
39. Material changes create a new review revision/request rather than reusing old approval silently.
40. Rejection cannot be transformed into approval by Agent retry or event replay.
41. Approval expiration makes approval unusable for new consequential dispatch but preserves history.
42. Approval revocation is prospective and cannot undo accepted external effects.
43. Approval consumption is distinct from effect success.
44. Approval consumption is distinct from operation outcome.
45. Approval reuse requires explicit policy and exact binding.
46. One-shot approval cannot authorize a different logical operation.
47. Redelivery of the same logical operation is distinct from authorization of a new operation.
48. Terminal semantic retry is not automatically authorized by prior approval.
49. Unknown external effect blocks blind replay regardless of approval validity.
50. Reconciliation determines retry safety; approval does not.
51. Current authorization is revalidated before consequential dispatch even when approval is valid.
52. Current resource/revision binding is revalidated before dispatch.
53. Current provider/credential eligibility is revalidated before dispatch.
54. Current deny/revocation/fence constraints supersede stale approval.
55. Approval policy revision is attributable.
56. Stronger current approval requirements cannot be bypassed by stale pending requests.
57. Workflow replay cannot recreate or extend approval authority.
58. Temporal history may retain approval references but is not approval source of truth.
59. Sophia is not approval source of truth.
60. Retrieved approval-like text is not authority.
61. Tool/MCP metadata cannot define reviewer eligibility.
62. Credential possession cannot create or substitute approval.
63. Broad provider credentials cannot widen approved scope.
64. Approval comments cannot widen machine-bound intent.
65. Raw secrets are excluded from approval requests, comments and evidence.
66. Approval content exposure itself follows current disclosure authorization.
67. Reviewer UI must separate trusted governance facts from untrusted/AI-generated content.
68. Approval service uncertainty does not default to allow.
69. Unable to establish required valid approval means no new consequential dispatch.
70. Approval write uncertainty is reconciled before asking for a semantically duplicate decision.
71. Notification failure does not erase durable approval.
72. Notification success does not prove approval is currently usable.
73. Request cancellation does not prove external effect cancellation.
74. Approval revocation/cancellation does not imply rollback.
75. Already-dispatched effects retain ADR-007 effect semantics.
76. Approval owner does not become universal domain/security authority.
77. Domain owner retains operation semantics and resource invariants.
78. Security owner retains current authorization/restriction semantics.
79. Approval owner retains durable review/decision semantics.
80. Workflow owns coordination/waiting, not approval authority.
81. Approval evidence is not itself authorization.
82. Approval evidence excludes private chain-of-thought.
83. Historical approval attribution is immutable.
84. Reviewer delegation is explicit, bounded, attributable and revocable.
85. Reviewer delegation cannot make an Agent a human reviewer.
86. Break-glass is exceptional and cannot be self-granted by Agents.
87. Break-glass does not override physical/provider impossibility or ADR-008 isolation.
88. Human-approved automation policy is distinct from an ordinary reusable approval instance.
89. Autonomous Agent level is not equivalent to blanket permanent approval.
90. Batch approval cannot silently expand item count, membership, amount, destination or risk scope.
91. Each batch item still requires current authorization at consequential use where applicable.
92. Approval system MUST NOT become an implicit Shared Kernel or universal business authority.
93. Acceptance of ADR-010 does not authorize implementation.
94. Required one-shot/use-limit accounting MUST prevent competing consumption by different logical operations; an uncertain dispatch does not automatically replenish use.
95. Reviewer eligibility MUST hold at decision admission; policy explicitly defines continuing eligibility dependencies at quorum/consumption without erasing historical decisions.
96. Conflicting concurrent decisions, withdrawal, cancellation, supersession and rejection-after-quorum MUST follow authoritative attributable ordering/conflict rules; unknown state is not satisfied.
97. Required binding/preconditions and approval obligations MUST be enforceable at actual use; dispatcher checks alone cannot guarantee a remote request is fenced after acceptance.
98. A decision command reused with conflicting intent/principal/scope/revision MUST be rejected as an integrity defect, rather than treated as an ordinary duplicate.
99. Required review facts and evidence must be sufficiently available to eligible reviewers and authoritative owners; insufficient review/provenance cannot be converted into blind approval.
100. Non-performance evidence does not alone restore exhausted approval; retry must satisfy unchanged intent, explicit use policy and all current owner checks.

The owner's 93 distinctions are retained, with seven additions specifying consumption competition, eligibility dependencies, concurrent governance, actual enforcement, conflicting duplicates, evidence adequacy and retry limits. Invariant 93 applies to this acceptance; this record is Accepted.

## 7. Alternatives Analysis

Comparisons are architectural judgments from the owner scenarios and Accepted constraints, not measured delivery speed, capacity, security, cost or product maturity. No numeric scoring is justified.

| Approval approach | Benefit / possible fit | Limitation / proposed treatment |
| --- | --- | --- |
| Informal chat | Low interaction friction; captures attributed discussion | Ambiguous intent/reviewer/revision, spoofing and model interpretation; discussion only unless admitted through governed decision boundary |
| Boolean approved | Small current-state representation | Cannot explain person, scope, quorum, expiry, history or consumption; a derived convenience view only, never complete authority |
| Workflow-owned state | Durable coordination close to waiting | Replayed history becomes stale permission, domain/eligibility checks drift; retain waiting/references, not approval ownership |
| Tool-owned flag | Close to dispatch | Duplicated reviewer/lifecycle policy and cross-tool inconsistency; retain operation binding/PEP, consult governance owner |
| Universal approval service owning all semantics | Central inspection and workflow | Universal resource/risk/domain model and Shared Kernel; reject takeover, allow narrow governance semantics |
| Domain-only approval | Precise business meaning and local consistency | Repeated generic lifecycle/channel/quorum work and divergent common restrictions; viable for genuinely distinct domain meaning through explicit contracts |
| Dedicated governance with owner envelopes | Durable consistent decisions/use while preserving domain and security authority | Contract/freshness/consumption races and availability work remain; recommended logical boundary, no separate service requirement |
| Standing policy/mandate | Reduces repetitive low-risk reviews and supports bounded autonomy | Wider blast radius if unspecified/stale; separately govern policy revisions and current mandate, never permanent ordinary instance |

Strongest challenge to the recommendation: a new generic boundary could require many cross-owner checks and grow into a governance framework. The refinement is to start later authorized work with one meaningful operation and only the necessary immutable review, eligibility, decision, usability/use and PEP contracts. Operation-owner models may remain separate. Do not build every channel, arbitrary approval chains, policy DSL, universal permission graph or enterprise committee system before requirements justify them. Domain-only review could be preferable for a narrow isolated need, but the supplied cross-tool/workflow/retry scenarios already require common durable governance semantics.

Policy placement alternatives are compared in section 6.2; the recommendation composes domain meaning and common current security restrictions, rather than moving all risk into Approval. Review-channel alternatives are compared in section 6.5; none is chosen.

| Evidence approach | Value | Limit / proposed treatment |
| --- | --- | --- |
| Mutable row/current state only | Simple status queries | Loses reviewed meaning/attribution on overwrite; insufficient alone |
| Append-only decision/governance history plus current usability | Preserves attribution while deriving current usable state | Needs consistency, correction/privacy and evidence custody; recommended semantics without choosing physical storage |
| Event-sourced approval aggregate | Reconstructs owner state from complete versioned event history | Adds replay/evolution/privacy completeness obligations; not required or selected by durable history |
| Signed decision artifact | Can prove defined origin/integrity | Signature does not prove human comprehension, current eligibility, revocation or safe use; no cryptographic implementation selected |
| Domain-owned approval records | Can preserve rich local review meaning | Cross-owner generic rules/notifications must remain coherent; use explicit governance references, no arbitrary private access |

Durable immutable decisions and current usable-state semantics are required. They do not select Event Sourcing, cryptographic signatures, an immutable ledger or blockchain. Storage and channel substitution must preserve semantics and evidence, not merely current flags.

## 8. Consequences

### Positive

Reviewed meaning remains explicit across delays and provider/channel changes. Human identity, eligibility and distinct quorum are attributable. Separate historical decisions and current usability preserve both evidence and revocation. Consequential owner checks prevent approval becoming a deputy privilege. Durable waits and reliable notifications support recovery without sleeping processes. Bound reuse/autonomy avoids repeated unnecessary review while preventing permanent inherited authority.

### Negative

NEXORA must define materiality, reviewer/conflict policy, use accounting, owner contracts and evidence before implementation. High-impact operations can wait/deny when approval state or current obligations cannot be established. Human attention, safe presentation and uncertain-write recovery require operational care. External effects cannot be made atomic with review by a generic service, and some adapters must refuse operations with unenforceable preconditions.

### Risks

Approval fatigue or misleading AI summaries can undermine informed review. Review channels and principals can be compromised. A central boundary can absorb domain authority; domain-local flags can drift. Concurrent consumption, stale replicas, role changes, stronger pending policy and replay can revive stale apparent authority. Unknown effects can be repeated if consumption is incorrectly replenished. Emergency paths can turn into hidden admin bypasses. None of these risks is mitigated by documentation alone.

## 9. Security Considerations

Protect decision authenticity, tenant scope, intent integrity, evidence and current use at every admitted channel/owner boundary. Authenticate reviewer and actual effective workload separately; verify current reviewer eligibility and authorized review-data exposure before admitting a decision. Revalidate current operation authority even after quorum. Current principal/tenant/provider/credential/resource restrictions and enforceable approval obligations dominate stale allows. Do not let a privileged Approval/Tool workload exercise unrelated authority for a weaker caller.

Untrusted repository/Tool/web/Sophia/comment content and advisory model output cannot authenticate, select reviewers/credentials, alter policy, expand effects or approve. Presentation must expose authoritative consequential facts and flag derived content. Scope switching, phishing, CSRF/clickjacking, stale pages, notification abuse, session compromise, forged IDs, replay and concurrency require actual boundary testing. Backend enforcement, not prompt wording or a button, establishes the proposed guarantees.

ADR-008 remains binding: approved jobs retain dedicated stronger hostile-code isolation, source/network/files/resource/output/process/cleanup policy and no ambient control-plane credentials. Approval cannot grant escape or secrecy from hostile code receiving a secret. ADR-009 retains narrow exceptional operator authority and current deny/fence semantics. Revocation after remote acceptance is not rollback; preserve unknown/partial/performed effects and independently authorized recovery.

Evidence and comments can expose source or identity; minimize sensitive content, authorize readers and handle contamination without raw secret replication. Exclude private chain-of-thought. No claim of legal consent adequacy, perfect phishing/injection detection, tamper-proof storage, instantaneous revocation, universal exactly-once effects or production security is made. Those remain requirements to substantiate through separately authorized implementation and relevant review.

## 10. Operational Considerations

### Failure walkthroughs A–BZ

Every row inherits the following **explicit baseline**, supplemented by its scenario-specific columns. Approval owns immutable Request/Decision/review revisions and authoritative quorum/usability/consumption; identity/security owns authenticated human and current eligibility/conflicts; domain/Tool/Execution owns binding/current authorization/provider/credential/dispatch/effects; Workflow owns wait/wakeup. Unless a row states otherwise, current eligibility is required at decision admission and continuing eligibility follows the explicit section 6.6 risk policy; material intent changes require linked renewed review; current authorization and enforceable obligations apply at use; no new use/consumption or dispatch is implied by a notification; already-dispatched effects retain ADR-007/008 reconciliation custody.

In every row, notification delivery is only a correlated wakeup to reread authoritative state; loss/duplicate/replay cannot create decisions or permission. Required evidence includes section 6.13's human/eligibility/policy/intent/revision and request/decision/operation/use/order references, plus current PEP and independent effect evidence. Before dispatch, prevented operation can be recorded as not dispatched only with adequate owner evidence; after possible send, effect remains unknown unless authoritative evidence resolves it. All unresolved gates below must be decided and verified before affected implementation. This baseline supplies all eleven requested dimensions for every row rather than inventing redundant credentials or reviewer events where none exists.

| Scenario | Owner; request/decision and reviewer interpretation | Binding, current authorization and expected behavior | Consumption/reuse, notification/wait and effect response | Additional evidence / unresolved implementation gate |
| --- | --- | --- | --- | --- |
| A — PR H changes to H2 before approval | Resource/Approval; exposed H request stale, no decision for H2; eligible reviewer must review new revision | Reject stale decision; current owner resolves H2 and requires renewed source-bound review | No fresh use; wake/re-route for supersession, not merge; prevented dispatch has no new effect | Exposed/current heads and supersession; source observation/admission race protocol open |
| B — H changes after approval | Resource/Tool/Approval; historical H decision retained but unusable for H2 | Reject at actual-use precondition, reauthorize and re-review material H2 | Do not consume for H2 or retry unchecked; workflow waits on revised intent; reconcile if already sent | Approved/current SHA and provider condition; required base/target precondition coverage open |
| C — Staging approval used for production | Environment/resource/Approval; staging decision cannot satisfy production requirement | Environment is material; deny substitution despite eligible staging reviewer/provider credential | No production use; new review/current production authority required; no production dispatch | Reviewed/actual environment; canonical environment mapping open |
| D — Read approval used for write | Resource/Tool/Approval; read decision remains limited | Action/effect mismatch denied; reviewer eligibility for read is not write eligibility | No write consumption or chained permission; request new write review; earlier read disclosure separate | Action/effect contracts and PEP denial; read/write taxonomy open |
| E — Broad credential targets another repo | Resource/credential/Tool; repository R1 decision not R2 | Resolve actual owner/account/repository; deny R2 regardless of token ceiling | No broadened use or credential fallback; notify denied disposition; reconcile any prior R1 work separately | Approved/actual repo and external principal without token; adapter target enforcement open |
| F — Initiator loses authority | Security/delegation/Approval; human decision remains historical | Current initiator/represented authority fails; approval cannot restore permission | Block new use, resolve wait as restricted; consumed/in-flight work retains evidence | Revocation and approval/PEP order; delegation validity propagation open |
| G — Reviewer loses role before dispatch | Identity/security/Approval; historical eligible decision retained | Apply explicit decision-time versus continuing-eligibility policy; continuing dependency failure blocks use, routine unrelated role change need not erase decision | Recompute usable quorum if required; seek eligible replacement only through policy; no dispatch on unknown eligibility | Old/current role, requirement and policy; risk-specific eligibility-at-use rule open |
| H — Tenant suspended | Tenant/security/Approval; decision does not exempt business work | Current affected tenant denial blocks dispatch/disclosure; safety duty separate | No new business use; constrain waits/work, reconcile prior effects; cleanup only under own duty | Suspension scope and affected uses; tenant versus containment scope policy open |
| I — Provider suspended | Provider/security/Tool; approval for admitted provider remains historical | Block affected dispatch and credential resolution; no automatic alternate provider | No fresh consumption for substitute semantics; wake to restriction; contain/reconcile in-flight effects | Provider admission/suspension and operation refs; independent status trust coverage open |
| J — Credential revoked | Credential/security/Tool; approval is not access credential | Revalidate eligible reference; deny known revocation with no broader substitute | Preserve prior consumption association if sent; reconcile remote effect, not replay with new token | Reference/version/revoke/dispatch sequence; provider revocation observation open |
| K — Expiry during workflow wait | Approval/Workflow; decisions retained, usability expired | Waiting does not extend validity; no consequential authorization from timer/event | Wake/expire wait under owner policy; fresh review where needed, no new use | Validity basis and wait reference; clock/expiry notification protocol open |
| L — Expiry after wake before dispatch | Approval/Tool; quorum may remain satisfied but unusable | Check current validity near actual use and refuse expired operation | No unchecked consumption/dispatch; reconcile claimed use under defined ordering; workflow handles expired disposition | Wake/check/claim timing; expiry-to-use linearization open |
| M — Revoked before dispatch | Approval/security/PEP; append revocation, preserve decision | Current revocation barrier rejects new affected use despite old satisfied event | No new use; release only proven unused claim under protocol, update wait; no effect if prevented | Revocation/claim/PEP observations; actual receiver fence mechanism open |
| N — Revoked after provider acceptance | Tool/provider/Approval; earlier decision/use remains historical, future usability withdrawn | Block further operations; accepted request may complete despite revocation | Do not replenish use or promise rollback; stop supported work and reconcile performed/partial/unknown | Acceptance/revoke/cancel/status order; provider in-flight cancellation/fencing open |
| O — Duplicate approval notification | Approval/consumer/Workflow; one immutable decision/quorum result | Notification cannot change binding or current authority | Deduplicate/reconcile same wait/reference; no extra quorum/use/dispatch; return existing effect disposition | Logical notification and wait IDs; consumer deduplication horizon open |
| P — Old satisfied event replay | Approval/consumer; historical fact not present usability | Reread current expired/revoked/consumed/superseded state; reject stale use | Replay cannot recreate approval or replenish consumption; stale wait resolves from owner, effects unchanged | Event versus current governance revisions; replay-purpose routing open |
| Q — Workflow approval branch replay | Workflow/Approval/PEP; recorded historical branch retained | Deterministic replay restores coordination only; new operation checks current owners outside Workflow code | No new decision/consumption from replay; Activity reconnects prior logical operation, unknown effect blocks replay | History/operation/current approval refs; adapter replay/retry conformance open |
| R — Superseded request, page open | Approval/channel; old request immutable and unusable, reviewer sees old revision | Admission rejects old revision, retrieves replacement within authorized scope | No old quorum/use; refresh/reroute waiting, no silent approval migration | Exposed/submitted/current revision; optimistic revision admission mechanism open |
| S — Stale browser approval | Channel/Approval/identity; current principal alone insufficient | Compare actual reviewed/submitted revision, active scope and current requirements/eligibility | Reject stale contribution, refresh facts before new decision; no consumption/dispatch | Presentation and request versions; stale-page protection implementation open |
| T — Approve response timeout | Approval/channel; decision write unknown, not failed | Same request/principal/revision must be authoritatively reconciled; current admission checks still apply if absent | Do not solicit blind second approve; workflow pending/notification may already exist; no effect assumption | Stable decision-command identity and durable result; read-after-uncertain-write protocol open |
| U — Decision retry after uncertainty | Approval; retry finds original immutable disposition or verified absence | Same identity/content converges; changed payload/principal/revision rejected | No double quorum/use; notification may repeat harmlessly; no new operation from retry alone | Original/retry binding and reconciliation; deduplication/absence proof open |
| V — Concurrent reviewers approve | Approval/eligibility; distinct eligible humans contribute to same revision | Validate each identity/conflict/group and current requirement; authoritative quorum update | Quorum may satisfy once; bounded use remains independent; wake deduplicates | Contributions/order/requirement revision; atomic quorum concurrency primitive open |
| W — Approve on phone, reject on desktop | Approval/channel; same human conflicting decisions, neither silently overwritten | Apply revision and explicit withdrawal/replacement/conflict/veto policy; stale page rejected | Unknown/conflicted quorum blocks use; notify reconciled disposition; prior dispatch cannot be erased | Devices/channels/decision order without secrets; conflict policy and admission ordering open |
| X — Same principal counted twice | Approval/identity; one human despite attempts/aliases | Distinct-principal quorum cannot count duplicate identity mappings | Retain one eligible contribution, quorum pending if second human required; no extra use/dispatch | Canonical reviewer/contribution refs; identity-linking and uniqueness enforcement open |
| Y — Eligibility lost before quorum | Eligibility/Approval; prior contribution historical | Continuing-dependency policy decides whether contribution still counts; stronger current restriction enforced | Reevaluate unsatisfied/unknown quorum and request eligible review, no automatic stale count/use | Eligibility change and quorum basis; contribution-continuity risk policy open |
| Z — Requirement changes 1-of-1 to 2-of-2 | Requirement/security/Approval; old decision retained, old satisfied status insufficient | Current stronger policy requires distinct additional review or new linked revision as material | No weaker pending-request bypass/use; workflow waits on updated governance | Old/new requirement and adaptation links; policy activation/version migration open |
| AA — Forbidden self-approval | Eligibility/Approval; initiator/represented human conflict | Deny contribution where separation required, regardless of role/credential | Quorum remains unmet, route eligible independent reviewer; no new consumption/effect | Initiator/reviewer relationship and conflict decision; operation-specific segregation rules open |
| AB — Operator approves own emergency request | Emergency/security/Approval; root privilege not eligibility | Deny where emergency segregation requires independent reviewer; only explicit narrow emergency policy applies | No unrestricted use; eligible alternate or established duty, otherwise unavailable; reconcile prior incident effects | Operator/incident/conflict/emergency policy; reviewer-unavailable exception rules open |
| AC — Approved in normal chat | Channel/Approval; attributed text not admitted decision | No inferred identity/eligibility/intent binding from model interpretation | No quorum/use/wakeup grant; direct human to governed review boundary if required | Conversation reference and missing decision evidence; admitted chat criteria open |
| AD — Email/Slack says approved, owner disagrees | Approval/channel; message notification is not authoritative state | Retrieve current authenticated request/decision; do not substitute channel payload | Stay pending/denied per owner, no new use; reconcile delivery mismatch without effect | Channel message versus owner disposition; authentication/mapping contract open |
| AE — Fabricated approval ID | Approval/security/Tool; no authoritative valid bound decision | Validate existence, scope and current usability without leaking foreign metadata | Deny use/dispatch, preserve restricted incident; no retry with guessed IDs | Claimed reference/redacted lookup denial; scoped lookup/abuse control open |
| AF — Arguments changed after decision | Operation/Approval; approved immutable A not A′ | Material argument/effect mismatch requires linked re-review/current authorization | No reuse for changed operation; wait on new envelope; earlier effect separate | Approved/current canonical intent diff; materiality/argument normalization open |
| AG — Adapter treats ID as bearer grant | Tool/security/Approval; ID only correlation | PEP must consult current state/binding and all authority; block unchecked path | No use from possession alone, contain defective adapter; reconcile any actual dispatch | PEP bypass/operation/restriction evidence; adapter conformance coverage open |
| AH — Comment broadens scope | Approval/operation; comment metadata not binding | Preserve original intent; added action becomes new validated request if authorized | No extra scope/use/quorum permission; original operation only if still usable | Comment versus canonical revision; comment sanitation/reason policy open |
| AI — PR description injects approval instruction | Channel/security/Approval; source text untrusted | Display as data, cannot change trusted requirements/arguments or reviewer rules | No added production approval/use; original review remains separately evaluated | Source revision/location and rejected expansion; content/presentation isolation open |
| AJ — AI summary omits dangerous argument | Operation/channel/Approval; advisory explanation inadequate if trusted review misleading | Show material authoritative facts; block inadequate review/re-review affected envelope, never bind only summary | No valid use based on deficient facts; detect after effect as incident, not fabricated approval | Canonical/displayed facts and explanation version; review adequacy/presentation verification open |
| AK — UI repo A, binding repo B | Operation/channel/Approval; integrity mismatch invalid review | Refuse decision/use until same consequential meaning is presented/enforced | Quarantine defective mapping, new review as needed; reconcile any B effect separately | Presentation/machine target discrepancy; mapping and canonical-render conformance open |
| AL — Disclosure provider X becomes Y | Disclosure/provider/Approval; X decision not Y | Recipient/account/purpose material; deny unreviewed routing, reauthorize Y | No X reuse for Y; notification cannot approve fallback; prior X exposure not reversible | Approved/actual destination and data scope; provider-routing precondition open |
| AM — Cost exceeds ceiling C | Budget/operation/Approval; bound C unchanged | Material higher amount/fan-out scope requires new review/current budget admission | No additional consumption above limit; pause remaining work, preserve accrued/unknown cost | Approved ceiling/requested scope/usage uncertainty; estimation and actual-use accounting open |
| AN — Payment effect unknown | Payment/Tool/Approval; review/use can be valid, result uncertain | Current allow does not establish retry safety | Preserve logical payment/use, reconcile; workflow waits/escalates rather than issue another payment | Operation/provider/acceptance/response-loss refs; authoritative payment lookup/idempotency open |
| AO — Blind unknown payment retry | Payment/Tool/security; same approval cannot prove non-performance | Deny unsafe repeat regardless of current approval; require effect contract | No new payment/use/key workaround; retain unknown/manual custody | Blocked retry and unresolved prior effect; replay guard across SDK/workflow open |
| AP — Payment proven not performed | Payment/Tool/Approval; adequate owner evidence, prior review unchanged | Evaluate safe same-intent retry with current authorization/credential/usability | Explicit policy decides use/attempt eligibility; no automatic replenishment, notify recovery disposition | Non-performance evidence strength and use ledger; retry-versus-consumption policy open |
| AQ — Payment proven performed | Payment/Tool; approval use retained, effect now known | Return performed evidence, no second mutation; current reads still authorized | No fresh use; workflow advances from correlated result under current next-step checks | Provider receipt/operation attribution; completion/business acceptance contract open |
| AR — Effect indefinitely unknown | Effect/recovery owner + Approval; history cannot settle reality | Block blind repeat; independently authorized investigation/compensation only | Keep durable escalation/manual responsibility, consumed association unresolved; do not loop review to evade | Last observations/reconciliation attempts and owner; escalation/retention/manual disposition open |
| AS — Approval store unavailable at dispatch | Approval/PEP; required usability unable to establish | No guessed allow/stale replica fallback lacking required current coverage | No new consequential use/dispatch; retain wait/claim uncertainty and reconcile prior sends | Outage/current-state requirement/claim refs; read consistency and outage policy open |
| AT — Notification fails after approval | Approval/publication; decision/quorum durable | Current usability remains owner-governed; send failure does not erase approval | Retain publication obligation/retry, workflow may wait; no duplicate human decision/use | Commit/publication obligation/attempts; gap-closing relay/recovery mechanism open |
| AU — Workflow wake fails | Workflow/Approval adapter; valid decision remains independent | Reconcile authoritative request and expected wait; no grant from wake success/failure | Retry correlated notification/observe wait, do not duplicate review/operation; existing effects unchanged | Wait/request/engine acceptance versus handling; stale-wait reconciliation protocol open |
| AV — Incomplete approval evidence | Approval/evidence/security; record existence insufficient authenticity | Block required decision/use if eligibility/review binding cannot be established; incident if previously used | No fabricated quorum/provenance or fresh consumption; workflow exposes unable-to-establish | Missing provenance and affected uses; minimum evidence/correction gate open |
| AW — Cross-tenant reviewer | Identity/membership/Approval; foreign human not eligible by default | Deny absent explicit owner-governed review relationship; protect request content | No contribution/quorum/use; route authorized reviewer, no cross-tenant disclosure | Trusted reviewer/resource scope/relationship; legitimate sharing model open |
| AX — Multi-tenant reviewer wrong scope | Identity/channel/Approval; memberships not unioned | Require explicit validated operating tenant and matching review relationship | Reject wrong-scope decision/content exposure, refresh authorized request; no use | Active scope and request owner; scope selection/channel binding open |
| AY — Delegated reviewer exceeds scope | Delegation/eligibility/Approval; human chain bounded | Deny beyond tenant/resource/action/environment/current upstream eligibility or conflicts | No quorum contribution, route eligible reviewer; no expanded use | Delegation chain/limits/denial; review-delegation attenuation/revocation open |
| AZ — Agent delegated as reviewer | Approval/security/Runtime; task delegate not human principal | Reject Agent/LLM contribution; human delegation cannot convert model output into review | Quorum unmet; request authentic human review, no use/dispatch | Claimed versus authenticated reviewer class; trusted human admission mechanism open |
| BA — Autonomous Agent cites blanket old approval | Mandate/security/Approval; ordinary historical decision not standing policy | Validate current owned mandate/operation and required review; deny permanent inherited authority | No arbitrary reuse; new exact review or valid policy path, unknown prior effects still reconcile | Old instance versus current mandate/policy; bounded automation governance open |
| BB — Approved automation policy changes | Policy owner/security; historical policy approval revision retained | Material actions/scope/limits change require governed policy review; old revision cannot approve new mandate | No ordinary approval-instance migration; current operations constrained and waits updated | Policy old/new revisions and promotion approval; mandate evolution/activation open |
| BC — Batch 100 becomes 101 | Batch/Approval/budget; membership/count binding exceeded | Reject extra scope, re-review revised batch and current item authority | No over-limit consumption; original eligible items only if approved partial semantics permit | Approved membership/count versus submitted; concurrent count accounting open |
| BD — Batch contents substituted | Batch/resource/Approval; same count is not same intent | Material set/amount/destination change stale; new linked envelope/review | No old use for changed items; wait on revision, preserve prior per-item effects | Material item set/revisions; canonical membership/conditional-item binding open |
| BE — Batch item loses authority | Item owner/security/batch; batch approval still historical | Each item current authorization; reject affected item; whole/subset rule must match reviewed semantics | No unauthorized item use; partial allowed only if approved; report performed/blocked/unknown items | Per-item decision/use/effect and batch rule; partial execution policy open |
| BF — Execution H replaced H2 | Source/Execution/Approval; source-bound H decision unusable for H2 | Reject at actual start/materialization, preserve patches/input provenance | No H reuse, new review/current start checks; notification cannot launch changed source | Reviewed/materialized representation; immutable staging and start precondition open |
| BG — Broader sandbox network profile | Execution/security/Approval; approved narrow profile not broader | Deny downgrade/expansion, new review cannot waive ADR-008 required controls | No broader start/use; revised permitted intent only, effects already sent remain separate | Profile/egress diff and readiness; profile materiality/enforcement open |
| BH — New secret requirement | Credential/Execution/Approval; reviewed effect/access surface changed | Pause, assess material credential class/reference/recipient risk and re-review where required; no raw values | No implicit secret delivery/use; ADR-008 hostile-recipient limits retained | Old/new access requirements without secret; test-secret acceptability/delivery policy open |
| BI — Reviewer compromised after decision | Identity/security/Approval; earlier decision historical | Apply incident/current usability policy; suspend affected new use as required, independently validate prior review | Do not erase decision; stop future use/reconcile effects; replace review only through governed path | Compromise interval/restriction/uses; affected-decision incident scope open |
| BJ — Compromise existed at decision | Identity/security/Approval/evidence; authenticity/eligibility now suspect | Mark affected review unusable/under investigation, obtain trusted new review; do not assume old decision authentic | No future use; earlier dispatch remains attributable possibly unauthorized incident, no rollback fiction | Discovery versus decision time and evidence strength; forensic/correction procedure open |
| BK — Duplicate decision commands | Approval; same command/principal/revision converges | Validate matching content/current admission for proven absent record; conflict rejected | One contribution, no duplicate quorum/use; notification may repeat, effects separate | Command identity/binding/disposition; durable command dedup horizon open |
| BL — Commit succeeds, response lost | Approval/channel; durable decision exists despite timeout | Authoritative reread returns original record, not inferred failure | No second human contribution/use; reliable notification obligation retained | Commit/result and retry correlation; stable reread/ack protocol open |
| BM — Decision durable, publication delayed | Approval/publication/Workflow; human fact independent of lag | Dispatch still checks current usability; delayed event may already be stale | Retain committed notification intent, bounded recovery; waiting not sleeping process; no duplicate use | Decision/publication lag/expiry; recovery and stale-wait detection open |
| BN — Crash during quorum update | Approval; outcome unknown until durable recovery | Reconstruct authoritative contributions and applied requirement; no in-memory satisfied assumption | No use until quorum established; notifications reconcile recovered revision, no duplicate effect | Committed decisions/quorum transition/claim refs; atomicity/crash protocol open |
| BO — Cancellation races with approval | Approval/channel; immutable admitted decisions and cancellation order retained | Authoritative ordering/policy decides whether decision admitted and future usability; unknown blocks | Cancelled request cannot dispatch from delayed wake; no new consumption | Revision/decision/cancel order; race linearization and channel response semantics open |
| BP — Cancellation races with dispatch | Approval/operation/PEP; cancelled governance separate from provider call | If cancellation wins defined acceptance boundary, prevent use; after send attempt, stop future work and reconcile | Do not release unknown association or claim no effect; workflow receives honest disposition | Claim/cancel/dispatch/accept order; local-to-remote race guarantees open |
| BQ — Rejection after apparent quorum | Approval/requirement; earlier contributions historical | Explicit veto/conflict/closure policy resolves authoritative current usability before dispatch; apparent UI count insufficient | Block if rejected/unknown; no unnoticed use; already accepted remote effect still persists | Decision/quorum/rejection/use order; rejection-after-satisfaction policy open |
| BR — Consumed approval, terminal retry | Runtime/operation/Approval; new linked Run, prior review/use preserved | New semantic work requires its own current intent/authority and explicit review/use policy | No automatic reuse/reset; reconcile prior effect first, workflow requests governed retry | Prior/new Run/operation/use links; semantic retry classification open |
| BS — Same operation redelivered after use | Operation/Approval; original association remains authoritative | Validate same semantic binding and current recovery authority; ID collision with changed content rejected | Return prior/pending evidence, no extra consumption or duplicate send; unknown reconciles | Same operation/use/provider mappings; dedup retention and target idempotency open |
| BT — Provider semantics/version changes | Admission/Tool/resource/Approval; original reviewed effect contract historical | Material behavior change pauses dispatch, re-admission/re-review/current checks required | No invisible version retry/use migration; drain/reconcile prior version effects | Old/new contract/version/effect diff; compatibility/materiality conformance open |
| BU — Resource ownership changes | Resource/security/Approval; target relationship materially changed | Resolve current owner/scope and binding, reject stale affected review; current denial wins | No old cross-owner use; new review where material, update wait; previous effect retained | Old/current ownership/revision and review scope; ownership transition consistency open |
| BV — Incident strengthens requirements | Security/requirement/Approval; old policy attribution retained | Current stronger review/restrictions apply to pending/new use; no stale-policy bypass | Pause consumption/dispatch until compliant; route eligible review, reconcile in-flight separately | Incident/new requirement/affected requests; activation and migration barriers open |
| BW — Emergency reviewer unavailable | Emergency/security/Approval; absence is not approval | Eligible alternate or already-governed narrow emergency duty only; otherwise action unavailable | No ordinary approval fabrication/self-grant; preserve incident waiting/containment custody | Reviewer unavailability/emergency mandate; emergency duty/assurance/evidence path open |
| BX — Emergency irreversible effect | Emergency/operation/provider; real actor and decision/duty historical | Validate bounded emergency conditions before use; urgency cannot remove provider/isolation constraints | Track consumption/effect; independent post-action review/compensation only under new authority, no rollback guarantee | Incident/reason/decision/duty/receipt; emergency-effect reconciliation/review procedure open |
| BY — Evidence reveals sensitive source | Approval/disclosure/evidence owner; provenance still required within policy | Authorize reviewer/evidence reader and minimize permitted references; insufficient visible facts blocks blind review | No unauthorized review disclosure/use; restrict custody, workflow metadata minimal; prior leak incident | Classification/read/presentation/redaction refs; ADR-011 retention/access reconstruction balance open |
| BZ — Secret in approval comment | Approval/credential/evidence/security; comment cannot grant scope and raw value excluded | Withhold/restrict contaminated content, record redacted incident/correction; current use depends on adequate safe evidence | Do not replicate secret in event/Sophia/history; authorized containment/revocation separate, prior exposure not erased | Redacted comment/credential/recipient refs; secret detection/sanitization/custody implementation open |

### Bounds, availability, recovery and future validation

Bound request creation/resubmission, review/notification fan-out, backlog, envelope/content sizes, reviewer attempts, lookup cost, quorum work, use accounting, retries, pending waits and reconciliation. Escalation is attributable and bounded; no Agent rejection-pressure loop, automatic approve-on-timeout or hidden credential/provider fallback. Reserve recovery/containment capacity and apply tenant fairness. Exact limits, algorithms, SLOs and budgets remain unknown.

Expose pending review/requirements, satisfaction versus usability, stale/expired/revoked/superseded/cancelled dispositions, uncertain decision writes, publication lag, stale waits, conflicting decisions, consumption/dispatch uncertainty and independent effects. Approval unavailable is different from human rejection. Required consequential operations wait/refuse until authoritative approval can be established; a stale cached satisfied flag is insufficient. Actual availability design belongs to ADR-012; no uptime promise is made.

Recovery/restore must retain or reconcile request/decision/envelope/policy/eligibility/quorum/use/revocation/supersession history plus logical operation/provider effects. Restoring an old checkpoint must not resurrect consumed, revoked or expired approvals or duplicate effects completed after the checkpoint. Quarantine uncertain serving/use until current owner state and effects are reconciled. Backups or engine history alone are insufficient; no universal atomic restore across owners is assumed.

Future separately authorized verification must exercise A–BZ at actual channel/owner/PEP boundaries, including changed source/target/recipient, stale browser/replica, compromised reviewer, conflicting two-device decisions, policy upgrade, concurrent one-shot use, decision/notification/dispatch crash points, duplicate/replayed events, workflow replay, revocation/cancel races, bounded batch partial execution, emergency unavailability and unknown-effect recovery. Verify actual provider preconditions, not mocked approval booleans; ensure displayed intent equals machine-enforced meaning and unauthorized review/evidence/model exposure is prevented. Measure timing/cost/availability only against agreed targets. No runtime tests, build, credentials, channel integrations or fault injection were performed in this documentation task.

## 11. Evolution / Exit Strategy

```text
Domain / Security / Tool / Execution owners
    → owner-defined Approval Requirement + immutable Review Envelope
    → Approval Governance (requests / human decisions / quorum / usability / use)
        ← admitted Web / Chat / Other reviewer channel adapters
    → durable decision/evidence and reliable correlated notification
    → consequential owner PEP + current authorization + actual intent/preconditions
    → separate operation/effect/reconciliation evidence
```

This is responsibility flow, not a deployment diagram or final package structure. Channels/storage adapters depend inward on owned governance contracts; core policy does not import UI, vendor, database, Temporal or signing SDK types. Start later authorized implementation with one representative operation, one admitted channel and smallest necessary governance model. Expand only for actual risk/requirements; no universal engine/platform is pre-built.

Migration must preserve stable request/approval identity, exact reviewed intent/presentation references, immutable decisions, reviewer/principal attribution and eligibility basis, policy revisions/quorum, consumption/reuse, expiration/revocation/cancellation/supersession, and Run/Workflow/Operation/Job links. Changing a channel or database cannot reset use, silently remap people by email, widen scope, replay old approval, or erase rejection. Drain/reconcile old in-flight operations under their original recorded contract before switching; no permanent dual authority writers. Demonstrate new/old semantics and current restrictions before cutover. Rollback respects current revocation and completed effects, not just an older schema snapshot.

Revisit for new regulated review requirements, provider-native review semantics, unacceptable human latency/abuse, ownership conflict, unavailable binding controls, compromised channels, consistency/availability limits or measured operational cost. Material changes to Accepted constraints require owner-approved ADR supersession; this Accepted record is governed by that supersession process. Implementation and further ADRs still require explicit direction.

## 12. Development Constitution Compliance

- Re-read canonical governance, ADR convention, all Accepted ADR-001–009 completely and all architecture documents; inspected inventory and relevant approval/security/effect references before edits.
- Surfaced stale scope prohibition and unresolved risk/reviewer/consistency policies; no material conflict requiring Accepted ADR changes found.
- Preserve Go, modular public/inward ownership, selective DDD/slices, No implicit Shared Kernel, Runtime lifecycle/history, Temporal infrastructure, event delivery, Sophia, Tool and Execution constraints.
- Record ADR-010 Accepted with approval date 2026-10-05 and explicit human project-owner architecture approval; preserve the proposal date and substantive architecture. Acceptance does not authorize implementation.
- Distinguish owner requirements, verified primary-source facts, architectural inference and unknown implementation gates; no invented capacity/security guarantees.
- Documentation only: no source, Go modules, dependencies, roles/constants/policy files, API/UI, schemas/tables/migrations, workers/workflows, event topics, integrations, keys, infrastructure or configuration; no deletions.
- Synchronize only four directly supporting status/scope/navigation documents. Accepted ADR-001–009, constitution and principles remain unchanged; ADR-011 not started.
- Verification covers document structure/status/links/table/scenario/invariant coverage, file inventory and byte preservation; runtime effectiveness remains unverified.

## 13. Related Decisions

[Constitution](../../DEVELOPMENT_CONSTITUTION.md), [ADR index](README.md), [architecture context](../architecture/ARCHITECTURE.md), [principles](../architecture/principles.md). Accepted constraints: [ADR-001](ADR-001-core-programming-language.md), [ADR-002](ADR-002-architecture-style.md), [ADR-003](ADR-003-agent-runtime.md), [ADR-004](ADR-004-workflow-engine.md), [ADR-005](ADR-005-event-architecture.md), [ADR-006](ADR-006-memory-architecture.md), [ADR-007](ADR-007-mcp-tool-architecture.md), [ADR-008](ADR-008-sandbox-execution.md), [ADR-009](ADR-009-security-isolation.md).

| Boundary | Preserved / deferred responsibility |
| --- | --- |
| ADR-001/002 | Go primary, modular/inward/public owner discipline, no implicit Shared Kernel; no added language/service/context layout |
| ADR-003 | Agent/Run identity/lifecycle/history owned by Runtime; approval waiting reason separate from stop/outcome/effects |
| ADR-004 | Temporal infrastructure, deterministic coordination and durable waits; Workflow Definition/history not authority, no automatic Run == Activity, hosting undecided |
| ADR-005 | Intent/deduplication patterns, notifications/events not grants, unknown effects; DB commit + Temporal Signal non-atomic, no initial broker/default Event Sourcing |
| ADR-006 | Sophia governed knowledge/projections, current authorized exposure, no memory approval authority; PostgreSQL + pgvector remain Sophia-specific |
| ADR-007/008 | Exact Tool/Execution operation/source/provider/credential/effect binding; actual start/dispatch checks, stronger hostile-code isolation, separate cleanup/effects |
| ADR-009 | Trusted identity/current eligibility, scoped attenuating delegation, current authorization/deny, credential references, actual PEP/fence and governed emergency duties |
| ADR-011 — Observability/Audit | Approval evidence semantics defined here; backend, retention durations, integrity/tamper-evidence implementation, broader audit/correction/privacy, SIEM, traces, alerts and metrics remain deferred |
| ADR-012 — Deployment | Approval deployment/service mapping, HA, database topology, regions/scaling/DR, notification/secret infrastructure, clocks/failure targets and supported versions remain deferred; Temporal hosting still undecided |

Deliberately open implementation decisions: actual reviewer roles/assurance, risk/action matrix and self-approval/conflict rules; N-of-M/group/order/veto policy; eligibility continuity; reason requirements; precise validity/expiry/revocation numbers and use accounting/linearization; material field representation/canonicalization; policy version activation; conditional provider operations/idempotency/reconciliation; database/schema/locking/read consistency; event encoding/outbox/inbox/relay; review channels/UI/mobile/CLI; authentication/session/CSRF/signing mechanisms; privacy/retention/recovery targets, workload limits, final contexts/packages and topology.

No Slack/Teams/email/notification vendor, Auth0/Okta/Cognito or other IdP, OPA/Cedar/OpenFGA or other policy engine, database, broker/Kafka/NATS/SQS/EventBridge, signing/PKI/KMS/HSM/ledger, audit backend/SIEM, mobile framework or workflow UI is selected. ADR-010 does not authorize implementation or start ADR-011/012. Open policy questions must be explicitly resolved before affected features, not silently defaulted to permissive behavior.

## 14. Evidence / References

VERIFIED project evidence: the current owner ADR-010 handoff, direct governance/architecture/Accepted ADR reads, repository file inventory/topic searches, not-a-Git-repository result and pre-edit byte snapshot. These establish documentation state and constraints, not enforcement. NEXORA vocabulary, recommendation, policy composition, lifecycle, invariants and failure responses are **architectural proposals/inferences** from those requirements. Reviewer/risk/technology/consistency/retention/deployment details are **unknown**, not hidden assumptions.

Primary sources reviewed 2026-10-05 during proposal preparation:

- O1: [OWASP Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) — guidance supports intelligible significant transaction facts, protected reviewed data, server-side enforcement and final execution checks. Its transaction-authorization terminology and authenticator recommendations do not equate a NEXORA human approval with complete current authorization or select an authentication/cryptographic mechanism.
- G1: [GitHub merge pull request API](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request) — expected head SHA as an illustrative provider-side source precondition. This fact does not select GitHub integration/adapter or establish other resource/policy/approval fence guarantees.

Accepted ADR-004/005 supply the existing researched Temporal/event constraints; they are preserved rather than reopened or substituted with a new engine. No comparative product evaluation is needed to propose owner semantics. Recheck actual selected provider/version/conditional behavior before separately authorized implementation. No channel, provider, database or runtime was connected; no application build/test/security test, benchmark or approval enforcement is claimed verified. Explicit human project-owner architecture approval of ADR-010 was recorded with approval date 2026-10-05; acceptance does not establish implemented or verified approval enforcement.
