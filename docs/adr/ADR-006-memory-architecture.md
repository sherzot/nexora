# ADR-006 — Memory Architecture and Sophia Knowledge System

- Status: **Accepted**
- Proposal date: 2026-10-04
- Decision authority: Human project owner
- Approval date: 2026-10-05
- Approval evidence: explicit human project-owner approval in this conversation: "I approve ADR-006 — Memory Architecture and Sophia Knowledge System as proposed." Acceptance preserves the existing architecture and all 25 memory invariants without semantic modification.
- Recommendation: Sophia as governed knowledge and retrieval; PostgreSQL for Sophia-owned canonical artifacts, provenance and relationships, with pgvector for derived semantic retrieval
- Constraints: Accepted ADR-001 through ADR-005
- Scope: Conceptual ownership, knowledge lifecycle, retrieval and technology direction; no schemas, implementation, final contexts or deployment topology

## 1. Context

NEXORA needs engineering continuity across tasks and Runs: requirements, ADRs, specifications, repository artifacts, reviewed lessons and organizational guidance. Useful context must remain distinguishable from authoritative operational facts, current policy and evidence. Calling every persisted transcript, workflow history or vector “memory” conceals different ownership and lifecycle requirements.

The constitution, contributor instructions, ADR convention, all Accepted ADR-001–005, all architecture documents and existing memory/Sophia/knowledge/semantic/PostgreSQL/pgvector references were inspected before modification. The repository contains documentation only, without measured retrieval workloads. The architecture overview's PostgreSQL/pgvector direction was a hypothesis, not an accepted global database choice. Earlier prohibitions on starting ADR-006 are superseded by the current owner handoff. Historical scope statements inside Accepted ADRs remain historical and unchanged.

No material conflict with Accepted decisions was found. Go remains the core/backend language. Sophia must respect public owner contracts, inward dependencies, owned consistency and No implicit Shared Kernel. Agent Runtime owns Run lifecycle and immutable launch attribution; current authorization remains dynamic. Temporal owns orchestration mechanics, not organizational knowledge. Events, publication obligations and audit evidence retain their separate meanings.

Unknown: corpus size/types/languages, query distribution, tenant/organization membership, sensitivity, residency, permitted providers, review roles, freshness tolerances, retention/legal obligations, update rates, latency/availability targets, staffing, budget and recovery objectives. These prevent performance, cost, security or operational guarantees and final physical design. They do not prevent an owner-reviewable proposal. The required safety behavior is specified here; enforcement has not been implemented.

## 2. Problem

Define what NEXORA may retain, who owns it, how it is attributed, promoted, revised, retrieved and retired, and how Sophia assists engineering without becoming invisible authority or a universal shared domain model. Choose an initial storage/retrieval direction without equating a vector database with memory or building an unmeasured knowledge platform.

## 3. Decision Drivers

1. Preserve domain ownership, current authorization, approval and immutable historical attribution.
2. Provide evidence-bearing context with explicit provenance, freshness, conflicts and derivation.
3. Prevent tenant leakage, poisoned memory, hidden agent beliefs and uncontrolled promotion.
4. Make deletion, revocation, failed indexing and recovery responsibilities explicit.
5. Support exact identifiers and engineering terminology as well as semantic discovery.
6. Limit initial infrastructure while retaining replaceable retrieval mechanisms.
7. Fit Go and future operational constraints without inventing thresholds or measured superiority.

## 4. Considered Options

1. PostgreSQL structured knowledge/provenance plus pgvector semantic projections.
2. Structured canonical store plus dedicated vector infrastructure, such as Qdrant.
3. Structured canonical store plus search/hybrid infrastructure, such as OpenSearch.
4. Structured canonical store plus provider-managed retrieval/vector stores.
5. Structured and lexical retrieval only, without semantic vectors.

All options need governance, source ownership, deletion and current access enforcement. None makes retrieved content authoritative. The first option is recommended conditionally; alternatives and reversal gates appear in sections 7 and 11.

## 5. Decision

**ACCEPTED: adopt Sophia as NEXORA's governed organizational knowledge and retrieval subsystem. Use PostgreSQL for canonical Sophia-owned knowledge, provenance and relationships, and pgvector as a derived semantic retrieval mechanism within that architecture. Externally owned artifacts remain authoritative at their owners and appear through attributable references/projections.**

This accepts a Sophia-specific technology direction, not PostgreSQL for every NEXORA owner or Temporal persistence. Semantic retrieval is an available architectural capability, not a requirement to embed every artifact or create approximate indexes initially. Start future implementation with the smallest useful structured/lexical path; enable vectors where representative queries justify them. No separate vector database or search engine is initially selected. Reassess before implementation if provider, isolation, extension availability or workload evidence invalidates this direction.

Architectural commitments are ownership, attributable durable records, distinct canonical and derived data, governed promotion, scoped retrieval before model exposure, explicit freshness/conflicts, deletion/revocation propagation and replaceable mechanisms. Schemas, SDKs, embedding provider/model, dimensions, metric, index type, chunk sizes, ranking algorithms and deployment remain undecided.

**Memory is not authority.** It can inform, contextualize, retrieve evidence, suggest, support reasoning and improve continuity. It MUST NOT grant permission/approval, override current policy, rewrite domain state or accepted ADRs, rewrite Run history/outcomes, silently alter Agent identity/configuration, turn inference into organizational truth, or authorize an external action. Even approved guidance is content governed by its owner; execution authorization still belongs to the authoritative security/domain/approval owners.

**Retrieved knowledge != current truth. Embedding similarity != correctness. LLM-generated summary != source evidence. Conversation history != durable organizational decision. Vector index != source of truth.**

Accepted on 2026-10-05 with explicit human project-owner approval. Acceptance does not authorize implementation; separate implementation authorization is required. ADR-007 is not started.

## 6. Detailed Design

### 6.1 Sophia ownership and authority boundary

Sophia may own curated knowledge artifacts: organizational engineering guidance, reviewed lessons learned, approved reusable patterns and intentional knowledge entries. Each has an accountable publishing owner, scope, revision, review status and supersession rules. The authority to publish that class of guidance must be established explicitly; storing it in Sophia cannot manufacture that authority. An ADR or policy remains governed by its originating process unless ownership is explicitly assigned otherwise.

Sophia owns its ingestion/projection lifecycle, provenance and controlled retrieval contracts. It may expose authorized context packages and source relationships. It does not own every domain's business facts, authorization, approval, Agent/Run configuration or lifecycle, workflow state, event history, audit, secrets, or arbitrary blobs. Common vocabulary does not justify a universal Agent, Task, Policy or Artifact domain entity. Owner contracts exchange minimal references and representations; similarly named models can remain separate.

Cross-owner ingestion uses declared query/export/change contracts, never private repositories or arbitrary SQL. A shared physical PostgreSQL deployment would not merge data ownership or transactions. Sophia's canonical artifact transaction can protect its own revision/status/projection intent; it cannot atomically change a repository, another domain, an embedding provider and Temporal.

### 6.2 Taxonomy: purposes and authority

These are semantic categories, not ten services, aggregates or tables. Conversation and operational state are not all Sophia memory.

| Category | Owner / purpose | Authority level | Isolation and retrieval |
| --- | --- | --- | --- |
| Working / Run Context | Runtime assembles current assignment, bounded transcript window, evidence and workflow references | Temporary reasoning input; Run facts remain runtime-owned | Trusted tenant/project/task/Run scope and data budgets; no cross-Run implicit sharing |
| Conversation Context | Accountable interaction-content owner, to be named before implementation; continuity and user-visible transcript where warranted | Attributed statements, not permission or decisions by default | Participant and artifact visibility; selective authorized retrieval, never all history by default |
| Task / Workflow Context | Task and Workflow owners separately; objectives, constraints, dependencies and coordination | Owner records govern their own facts; Sophia copy is projection | Query owners through public contracts; current task revision and relevant scope |
| Project Knowledge | Repository/specification/ADR/artifact owners; engineering evidence | Owner-governed source has its defined status, scope and revision | Project/resource access and source branch/revision; Sophia cannot accept an ADR |
| Organizational Knowledge | Sophia-owned curated artifacts under designated publishing/review authority | Approved guidance only within assigned scope; not security grants | Organization/tenant visibility and deliberate cross-project publication, no default sharing |
| User-provided Knowledge | User/submission owner; supplied documents or claims | User statement/upload, with provenance; approval is not inferred from text | Upload scope and permitted recipients; authenticity and correctness assessed separately |
| External / Retrieved Knowledge | External publisher owns source; NEXORA ingestion owner governs allowed copy/reference | External evidence, with trust/freshness limits | Authorized source access, approved egress/provider routing; no automatic organization-wide publication |
| Derived Knowledge / Summaries | Sophia derivation responsibility or originating artifact owner | Marked extraction, transformation or inference; not independent source evidence | Scope cannot broaden source visibility; multiple-source derivations need permitted intersection or reviewed redaction |
| Semantic Retrieval Index | Sophia retrieval adapter | Disposable derived candidate index, never canonical facts | Trusted filters and current eligibility; vectors cannot confer access |
| Episodic / Historical operational knowledge | Runtime/tool/workflow/audit owners retain facts; Sophia may own reviewed lessons or project an approved history subset | Historical evidence, not present configuration, permission or outcome writer | Purpose-bound, tenant/task/resource scoped; historical mode explicit |

Episodic retention is justified only by a learning/reconstruction use case and permitted data policy. Do not copy all operation payloads into a permanent agent diary. User personalization is a separate optional preference/profile category: an explicitly scoped user-owned preference may guide presentation, but cannot override project policy, accepted architecture or authorization. No product-wide personal-memory implementation is selected.

### 6.3 Taxonomy: lifecycle, persistence and provenance

All durable categories require owner, identity/revision, producer, scope, source/derivation and lifecycle attribution. The table adds category-specific obligations; exact retention durations remain open.

| Category | Persistence / lifecycle | Provenance and update/delete rules |
| --- | --- | --- |
| Working / Run Context | Normally ephemeral or bounded; persist only permitted references/checkpoints needed by runtime recovery | Task/Run/configuration and evidence revisions; rebuild from owners after restart, expire buffers; no private chain-of-thought |
| Conversation Context | Combination of transient interaction and optionally durable user-visible transcript under explicit policy | Participants, times, source message/revision; explicit corrections and deletion; extraction creates a separate candidate, not silent canon |
| Task / Workflow Context | Authoritative long-lived coordination persists at its owners; Sophia projections optional | Owner/task/workflow revision and launch references; update through owners, invalidate copies; deletion cannot silently erase pending responsibility |
| Project Knowledge | Owned artifact history/status persists according to source policy | Repository commit/branch/path or document/ADR revision, author and governance status; supersession/deletion invalidates descendants |
| Organizational Knowledge | Canonical revisioned artifact: candidate → review → published → superseded/retired as governed | Publisher/reviewer and approval evidence where required; corrections/new revisions explicit; retention/deletion reconciled with governance history |
| User-provided Knowledge | Retain only for declared use and visibility, not permanently by default | Submitter/source/method/time, claimed versus validated facts; correction/withdrawal/deletion propagates |
| External / Retrieved Knowledge | Reference or permitted bounded copy; revalidate by source-specific freshness needs | Publisher/URL/source revision or observed representation, retrieval time/method; unknown revision explicit; remove expired/revoked copies |
| Derived Knowledge / Summaries | Optional attributable output with review state and source dependency links | Exact source revisions, derivation method/producer/version; source changes mark affected output stale; errors corrected explicitly, dependencies govern deletion |
| Semantic Retrieval Index | Rebuildable extraction/chunk/embedding generations | Source revision, chunk method/revision, offsets, model/version and index generation; delete/rebuild independently of canonical identity |
| Episodic / Historical operational knowledge | Selectively retained historical references or reviewed lessons | Run/operation/time/outcome references with recorded uncertainty; later learning cannot rewrite original history; policy governs deletion/redaction |

Provider context windows/sessions are temporary mechanisms, not durable memory. Restart must not erase authoritative work: runtime/workflow/operation owners retain required facts independently of prompts and Sophia availability. Context rebuilding may omit optional knowledge; it cannot invent missing outcomes or permission.

### 6.4 Canonical records and knowledge projections

```text
Externally owned artifact (owner + identity + revision + governance status)
    → owner-authorized reference/export
    → Sophia projection metadata / permitted extracted content / relationships
    → source-aware chunks → embeddings → retrieval index → candidates

Sophia-owned curated artifact (canonical content + owner + revision + status)
    → separate retrieval projection → chunks / embeddings → candidates
```

The reverse direction does not establish truth. A chunk is a representation of part of a source, not an independently authoritative fact. Sophia may retain a source reference without duplicating full content. Retrieval should return source owner/identity/revision, meaningful location/citation and freshness/derivation/status alongside content; a vector row or similarity score alone is insufficient.

Conceptual metadata includes artifact/projection identity; source owner/type/ID/revision; tenant/organization/project and relevant user/task/Run scope; author/producer; source-created/updated and observed/ingested times; extraction/derivation method/version; chunk offsets/revision; embedding provider/model/version and compatible space; index generation; review/validation status; supersession/dependency links; classification; visibility; retention/deletion state. This is not a schema. Unknown metadata must be explicit rather than filled with fabricated certainty. Source revision, observed time and ingestion time have different meanings.

A mutable URL or unversioned source requires permitted observation evidence and an explicit validation limitation; a content digest can identify an observed representation but does not prove publisher authority or ongoing freshness. Sources needing immutable reproducibility must provide suitable retained references/evidence before consequential use.

### 6.5 Ingestion, events and Temporal

Artifact update notification → validate producer/scope/contract → read authoritative owner when correctness requires → compare source revision/status/access → create attributable projection and durable required indexing intent → extract/chunk/embed → publish eligible projection generation.

Automatic indexing of already authorized sources is permissible without human review of every chunk. It does not publish a new organizational rule. Revision-aware processing must prevent a delayed job for an older source revision from replacing newer content or resurrecting a deletion. Semantic processing identity includes owner/source/scope/revision and transformation purpose/version; conflicting input under one identity is an integrity defect. Concurrent duplicates converge through an owner-supported atomic protocol, not an in-memory check alone.

Follow ADR-005 when a committed artifact must reliably trigger asynchronous ingestion: owner state and publication intent use Outbox/equivalent gap closure; Sophia processing uses Inbox/equivalent durable identity where appropriate. Event != knowledge truth; Outbox != knowledge database. Old event content is not permanent canonical source. Replay/backfill is explicit, bounded and purpose-scoped, rechecks current source/access/tombstones and cannot duplicate canonical promotions. No broker, polling/CDC mechanism or schema is selected. `DB commit + Temporal Signal` remains non-atomic.

Temporal may coordinate justified long ingestion/reindex/review jobs. Owned operations run outside deterministic Workflow code and retain their own idempotency/current authorization. History carries limited correlation and permitted references, not a corpus, credentials or private reasoning. Workflow replay reconstructs orchestration; it is not memory retrieval and cannot refresh evidence by calling external systems inside replay. Workflow Definition is not authority.

### 6.6 Retrieval contracts and minimal pipeline

```text
Task / user request
    → trusted identity, current authorization, permitted purpose and scope
    → bounded query interpretation
    → eligible candidate retrieval (metadata / lexical / optional vector / relationships)
    → optional ranking or fusion within eligible candidates
    → source status, freshness, provenance and current access checks
    → bounded evidence-bearing context package
    → Agent / LLM → generated answer or proposal
```

Scope is derived from trusted identity, current tenant/organization/project membership, artifact visibility, inherited access and relevant user/Agent/task/environment constraints. Agent identity is attribution, not a permission grant. Model-supplied IDs, query rewrites and discovered documents cannot broaden scope. Authorization applies before/during retrieval; all paths including relationship expansion, snippets, counts, suggestions and citation resolution must respect it. Sensitive candidate content MUST NOT reach a model or unauthorized caller before validation. Revalidate revocation-sensitive access before context delivery; consequential actions independently consult their authoritative owners afterward.

Vector queries carry trusted scope filters; filtering only generated answers is too late. A database may internally scan index entries before applying predicates, but unauthorized content must not cross the retrieval boundary. Approximate filtering can reduce recall and a shared approximate index can couple tenants' recall/speed [S4]. Do not widen tenant filters to fill missing results. Physical isolation and side-channel controls remain ADR-009/012 gates. RLS is an evaluated defense layer, not a chosen tenancy design or authorization substitute: PostgreSQL documents privileged/owner bypasses and integrity-check leakage concerns [S3].

Structured retrieval handles exact artifact IDs, project, type, review status, revision and relationships. Lexical retrieval helps exact terms, symbols, identifiers and phrases; PostgreSQL documents token/lexeme-based full-text matching/ranking [S2]. Semantic retrieval helps paraphrase and related concepts, but may miss precise negation/version/identifier meaning. Hybrid retrieval combines appropriate channels with explicit metadata and freshness constraints; source quality reflects actual governance, not model-assigned authority. Recency can help ranking but does not prove authority.

Initially an explicit scoped query and source-aware results can suffice. Query-understanding models, multi-stage fusion, rerankers, relationship graphs and repeated LLM evaluation are optional additions needing quality/cost evidence. No reranking provider or algorithm is selected. A lexical implementation must validate code identifiers and corpus languages rather than assume natural-language tokenization fits everything.

A context package includes permitted excerpts and source/citation references, source and projection revisions, governance/derived labels, freshness observation, conflict/supersession notes, scope and retrieval-purpose attribution, and omitted/unavailable-evidence warnings where relevant. It respects task/model budgets and source boundaries. Ranking is neither authorization nor truth; a cited answer can still misinterpret its source.

### 6.7 Freshness, contradictions and supersession

| State | Meaning / retrieval behavior |
| --- | --- |
| Current | Validated against source/status under a declared use-specific freshness policy and observation; not eternally current |
| Stale | Known changed revision or expired validation; omit from current-evidence operations, or return explicitly labeled historical/optional context when permitted |
| Superseded | Owner has identified replacement/retirement; prefer valid replacement, retain authorized history only in explicit historical mode |
| Deleted / revoked | Deleted source or unavailable permission; suppress content immediately at access boundary, independently of physical cleanup progress |
| Unknown freshness | Owner/revision cannot be validated; disclose limitation, block uses requiring current evidence |

Freshness, governance status and access eligibility are separate dimensions: an unchanged document can be revoked; a current Proposed ADR is still unaccepted. Source revisions/status changes invalidate or mark relevant chunks, vectors, summaries and caches. Event notification reduces lag but cannot establish complete freshness by itself; source reconciliation remains required under an agreed policy. Exact checks, freshness windows and revocation consistency mechanisms are unresolved implementation gates.

Contradictions retain separate source identities and claims. Accepted current ADRs govern architecture because the project constitution/owner process establishes that authority; old chat cannot supersede them. A current repository implementation can evidence behavior without accepting architectural drift. Changed policies must be read from their current authoritative owner. Duplicate representations may collapse for presentation only while retaining provenance.

There is no universal “newest wins.” Owner-defined precedence must name scope and authority. If apparently authoritative sources conflict and no governing rule resolves them, surface both with revisions/status, request resolution from the accountable owner, and block the affected consequential decision. Do not synthesize a false consensus. Superseded ADRs may be historically relevant but cannot outrank current accepted constraints merely through similarity.

### 6.8 Derived knowledge, promotion and memory writes

Distinguish source-backed extraction, transformation, inference and human-approved knowledge. Label generated summaries, tags, relationships, classifications, inferred lessons and suggested patterns as derived, with source revisions and producer/method attribution. Validation can record reviewed/unreviewed, evidence coverage and known limitations; numerical “confidence” is not invented certainty. Preserve permitted access to source evidence instead of silently replacing it with a summary.

Candidate → validation/review → governed owned artifact → retrieval projection is a conceptual promotion flow, not a mandatory workflow engine. Source indexing is different from semantic promotion. An important conversation decision should be recorded in an ADR, specification, task, decision record or approved document through its owner. Chat alone cannot change accepted architecture. The candidate must retain who said what, source context and claimed authority without assuming every utterance is approved.

| Write target | Authorized writer / gate |
| --- | --- |
| Ephemeral Run context | Runtime under current assignment/data/budget policy; no durable hidden beliefs |
| Conversation history | Interaction-content owner under participant/retention policy; append/correct attributable statements |
| Retrieval projection | Sophia ingestion operation under source/export and indexing permissions; cannot edit source truth |
| Derived summary | Authorized derivation operation; sources scoped, output labeled and review status explicit |
| Canonical Sophia artifact | Designated publishing owner through explicit application contract, validation and revision rules |
| High-impact organizational rule / architecture decision | Relevant governance owner with explicit human approval where required; agent may propose, never silently publish |

Read permission != write permission != promotion authority. Automatic low-risk extraction may remain an unreviewed candidate; owner validation suffices for classes expressly delegated by governance. High-impact rules/decisions require appropriate human approval and explicit artifacts. ADR-010 owns general approval mechanics; this proposal cannot decide who may approve all organizational knowledge. Corrections, reviewer actions and supersession are attributable revisions rather than silent history replacement.

### 6.9 Agent memory, personalization and caches

Avoid unconstrained opaque per-agent long-term memory. Specialization primarily comes from versioned Agent Definition/configuration, current assignment and governed project/organizational evidence. An exception requires an explicit learning use case, accountable owner, provenance, visibility/exportability, allowed readers/writers, review rules, scope and expiry/deletion policy. Private notes may help continuity but cannot become hidden policy or inherited authority; agent identity alone cannot make notes readable across projects.

Personal preferences are separately attributed user statements, optional and correctable. They cannot override project rules or grant permissions. Do not implement a universal profile system here. Provider-managed conversational continuity remains subject to the same retention, current access and data-routing obligations.

Caches are disposable acceleration, not canonical memory. Cache identity includes relevant source/projection generations and trusted scope; eligibility must be rechecked on delivery. Policy-aware invalidation/expiry and a trusted revocation check prevent cached results from surviving access loss. TTL alone is not a revocation guarantee. When current access cannot be established, deny sensitive delivery. Already delivered information cannot be retroactively un-read; stop future disclosure, cancel/discard pending context where feasible and record incident/recovery limits rather than promise erasure from prior model processing.

### 6.10 Deletion, revocation and retention

Source owners decide source retirement/deletion and notify through supported contracts. Sophia owns suppression and cleanup of its copies, chunks, vectors, lexical indexes, summaries, relationships containing content, caches and derivation descendants; connectors/provider adapters own deletion of permitted external copies with tracked confirmation. Project/user deletion, retention expiry and privacy/legal requests must resolve the applicable owner and scope instead of treating a vector delete as completion.

Suppress retrievability under current policy before relying on eventually completed physical cleanup. Track pending cleanup and exceptions; keep minimal permitted tombstone/deletion evidence to stop stale replay/reindex/restore resurrecting data. A derived artifact incorporating several sources must be withheld, regenerated without removed content, or explicitly reviewed under lawful retention rules; deleting only its citation is insufficient. Changing access may restrict a derivative even if the source content did not change.

Deletion is distinct from immutable decision/audit retention. Required governance evidence may be retained under independently justified restricted policy; it does not remain ordinary retrievable knowledge. Event/audit references may need redaction or restricted retention without rewriting accepted historical Run attribution; explicit auditable correction/retention decisions resolve this tension. ADR-011/012 with security/legal owner input must set exact policies.

Backups can contain earlier content. No instantaneous erasure from every immutable backup is promised. Restrict restore access, apply current deletion/revocation ledger and authoritative reconciliation before serving, prevent reindex resurrection, and expire/purge backups under the approved policy. Backup encryption/key policy, provider deletion guarantees, propagation deadlines and legal exceptions remain unresolved. A failed purge remains visible responsibility, not false success.

### 6.11 Extraction, chunks and embedding generations

Chunking is source-aware retrieval representation, not domain modeling. Preserve document/section or code-symbol boundaries, parent source revision and offsets/references needed for citations. Overlap is permitted when quality evidence warrants it. Code and prose may need different extraction. No token count, size, overlap, parser or chunking library is fixed; arbitrary chunks cannot become independent authoritative claims.

Embedding generations record model/provider/version or reproducible deployment identity, dimensions/space configuration and transformation provenance. Do not compare incompatible spaces merely because dimensions match. Canonical knowledge identity survives provider/model/dimension changes. Query embeddings must match the selected candidate generation. Evaluate migrations on permitted representative queries; keep generations separate, validate completeness/access/deletion and cut over explicitly. If fusing independently queried generations, translate their results without treating raw scores as comparable or concealing version differences.

Failed or partial indexing is explicit pending/failed coverage after canonical commit, not a rollback of source truth. Keep required recovery intent and bounded retry/quarantine responsibility. Revision guards prevent stale completions overwriting current eligibility. Old authorized generations may serve only under declared freshness/use policy; deleted/revoked content never becomes a fallback. Rollback uses a compatible, still permitted generation, not resurrected stale policy or erased deletion. Retaining every old vector forever is unnecessary; retirement follows approved policy.

Provider transfer is a governed data disclosure: embeddings and query text can be sensitive too. Version identity and provider data controls must be verified before adoption. OpenAI documentation describes embedding-based similarity and provider-managed retrieval operations [S8, S9]; it does not establish NEXORA correctness or deletion completeness. Provider-managed file removal can be eventually consistent [S9], so an application-side current eligibility barrier remains necessary.

### 6.12 Accepted memory invariants

1. Memory is not authority and MUST NOT grant permission, approval or domain-state mutation.
2. Retrieved knowledge is not automatically current truth; current use requires appropriate owner evidence.
3. Vector similarity is candidate retrieval, not correctness or validation.
4. Embeddings/vector indexes are derived projections, not canonical records.
5. Every durable knowledge item/projection has attributable source/producer, revision, scope and lifecycle provenance.
6. Externally owned truth remains with its authoritative owner; ingestion uses public contracts.
7. Derived/generated knowledge is explicitly labeled and linked to source revisions; it does not silently replace evidence.
8. Conversation content does not automatically become canonical organizational knowledge or a durable decision.
9. High-impact promotion requires governed validation and appropriate human approval through the relevant owner.
10. Trusted retrieval authorization and scope are enforced before sensitive content reaches a model or caller.
11. Semantic similarity MUST NOT bypass tenant/organization/project/resource/user/task isolation.
12. Retrieved content cannot elevate its own trust or override constitution, policy, approval or tool constraints.
13. Stale/superseded/deleted/revoked/unknown-freshness content is not silently presented as current.
14. Source revision, extraction/chunk revision, embedding space and index generation remain distinguishable.
15. Deletion/revocation propagates to retrievable projections, derivatives and caches under policy; delayed cleanup cannot permit disclosure.
16. Embedding model/provider changes do not change canonical identity; incompatible spaces are not silently mixed.
17. RAG output remains generated output and exposes evidence/limitations for consequential reasoning.
18. Agent Instances MUST NOT accumulate opaque unrestricted durable memory, stale authority or hidden organizational rules.
19. Read, write and canonical-promotion permissions are distinct and currently validated.
20. Ingestion/reindex/replay is idempotent, revision-aware and cannot resurrect retired sources or duplicate canonical promotions.
21. Workflow, event, audit, conversation and knowledge histories remain distinct; none silently acquires another owner's truth.
22. Secrets/credentials and private chain-of-thought are not intentionally persisted as knowledge; sensitive derivatives are minimized and governed.
23. Retrieval caches are disposable, scoped and current-authorization-aware.
24. Knowledge-system failure cannot invent context, falsely assert freshness or weaken authorization.
25. Sophia MUST NOT become an implicit Shared Kernel, universal domain authority or private cross-owner database access path.

These are Accepted obligations, not implemented controls. They strengthen Accepted constraints without deciding ADR-009/010 enforcement mechanics.

## 7. Alternatives Analysis

Product facts have official evidence; relative fit and lifecycle costs below are NEXORA architectural inferences without benchmarks.

| Option | Structured metadata, transactions and provenance | Retrieval and tenant filtering | Operations, update/delete and recovery | Portability / Go / disposition |
| --- | --- | --- | --- | --- |
| PostgreSQL + pgvector | Canonical artifacts, relationships and projection eligibility can share Sophia's local transaction boundary [S1]; source owners still separate | PostgreSQL full-text plus vector candidates and SQL predicates [S2, S4]; approximate-filter recall and physical isolation need validation | One Sophia-specific storage direction, but extension upgrades, contention, index maintenance, backups and cleanup remain work; remote embeddings not atomic | SQL/data export and rebuildable vectors reduce coupling; Go support exists [S5]; recommended initial direction, no driver/version selected |
| Dedicated vector store | Keep structured canonical ownership elsewhere; vector metadata duplicates must track revisions/status | Qdrant documents payload/ID filtering [S6]; actual hybrid/recall/security capabilities must be evaluated for chosen product | Adds service/credentials/backup and canonical-to-index consistency; specialist scaling may justify it; deletion lag needs adapter-specific evidence | Own vector/API contracts and rebuild from sources; Go adapter feasibility to verify before adoption; defer pending workload need |
| Search / hybrid engine | Keep canonical store separate; document/index metadata is projection, not domain transaction authority | OpenSearch documents combined keyword/semantic queries and fusion pipelines [S7]; exact authorization not guaranteed by ranking | Extra cluster/service, ingestion synchronization, relevance tuning, restore and deletion responsibilities | Engine query/analyzer semantics can lock in; Go HTTP/client compatibility needs evaluation; defer until lexical/hybrid requirements justify cost |
| Provider-managed retrieval | Own canonical IDs/revisions/provenance outside provider; reconcile provider file IDs | Documented semantic search, attributes and managed indexing [S9]; constrained filtering must satisfy actual policy | Less owned indexing operation, but external data exposure, opaque behavior, asynchronous operations and eventual removal; local deny barrier required | Provider IDs/algorithms/retention/export create coupling; documented Go API examples exist [S9], conformance still unverified; do not select |
| No vectors | Structured canonical/provenance store and owner contracts unchanged | Metadata/lexical/relationship retrieval; may miss paraphrases and concept discovery | Avoid embedding cost/provider disclosure and vector migration; still needs all access/freshness/delete rules | Strong baseline and fallback when explicitly safe; loses semantic discovery but could win if evaluated queries show no useful vector gain |

PostgreSQL plus pgvector is recommended because this problem requires structured ownership, revisions, relationships and eligibility as much as similarity. Co-locating Sophia data can reduce additional consistency/operational seams; this is an inference, not proof it is cheaper or fast enough. PostgreSQL transactions cover local database changes, not remote source/provider operations [S1]. Backup options exist, but recovery completeness is application-specific [S10].

The strongest challenges are extension availability/residency, high vector workload contention, recall under selective scope filters, richer lexical requirements and inability to operate PostgreSQL safely. Dedicated infrastructure can win on measured isolation, search quality, scaling or lifecycle needs. Provider-managed retrieval can win where data/control/export/deletion requirements are verified and operator savings justify coupling. No-vector retrieval can win for an exact-document workload or unacceptable provider/privacy cost. Familiarity alone is insufficient justification.

Before implementation, evaluate a permitted corpus containing exact ADR IDs, code identifiers, paraphrases, contradictions, superseded documents and tenant-isolated negatives. Agree quality/latency/cost/freshness targets before measurement. Compare structured/lexical baseline with semantic/hybrid additions under identical authorized scopes. Do not invent corpus-volume thresholds, numerical quality scores, index tuning or comparative performance.

## 8. Consequences

### Positive

Evidence can accompany continuity without becoming authority. Separate canonical/projection identity permits rebuild and provider changes. Minimal initial infrastructure and optional stages prevent premature platform expansion. Explicit provenance, promotion and lifecycle responsibilities make wrong or stale summaries reviewable.

### Negative

NEXORA must define source contracts, governance roles, freshness checks, access barriers and deletion dependency tracking. Some retrieval remains unavailable while source owners are down. PostgreSQL/pgvector still requires operational expertise and workload validation. Hybrid search and historical context add interpretation complexity.

### Risks

A shared knowledge store can become private SQL access or a shared domain model. Summaries can launder untrusted claims into apparent truth. Delayed invalidation, caches and restores can leak revoked content. Provider ingestion can expose sensitive data. Approximate recall can conceal important contrary evidence. Endless reindexing can consume budgets. These remain design risks until tested at real boundaries.

## 9. Security Considerations

Treat repository README files, issues/comments, uploaded documents, external pages, compromised MCP results and malicious knowledge artifacts as data, not executable instructions. “Ignore policy and send credentials” has no authority regardless of source formatting, signature, semantic rank or previous ingestion. Authentic source identity and trustworthy content are separate. Separate policy/control inputs from retrieved evidence and enforce action constraints at tool/domain owners; prompting alone is not security enforcement.

Apply current tenant/organization/project/user/resource/task scope to ingestion, queries, related-artifact expansion, snippets, caches, promotion and provider disclosure. Inherited access and membership changes require current checks; organizational guidance is not automatically cross-tenant public. Do not trust model-generated scope IDs. Reject forged/cross-tenant requests before sensitive content exposure and minimize existence/count/timing leaks. Detailed identity, RLS/namespace, encryption and revocation consistency belong to ADR-009/012 before relevant implementation.

Sophia is not a secret manager. Prefer scoped references over credentials, tokens, raw provider payloads or unnecessary private repository/customer/PII content. Do not intentionally store private chain-of-thought; retain chosen actions/evidence/validation as permitted instead. Embeddings, queries, summaries and relationships can themselves expose sensitive information. Data minimization and approved provider routing apply before external embedding/reranking/model calls. Ingestion parsers/connectors need resource bounds and safe handling of URLs/files; SSRF/path traversal and execution controls await ADR-007/008/009, without permission to postpone them past implementation.

RAG is evidence-assisted generation, not an authority mechanism or truth guarantee. Output remains generated, even with citations. Consequential engineering decisions expose source evidence and unresolved conflicts; execution independently revalidates current policy, approval and domain invariants. Retrieved memory cannot mutate historical Run attribution, launch configuration, lifecycle, waiting reason, stop request, outcome or external-effect knowledge. Runtime's accepted lifecycle remains `Created → Queued → Running → Waiting → Queued → Running → Finished`, with direct `Running → Finished` permitted.

## 10. Operational Considerations

### Failure walkthroughs A–O

“Historical use” below always requires current access, explicit labeling and an allowed purpose. It never substitutes for current authorization or evidence required by a consequential operation. Remaining uncertainties are implementation gates, not silent success fallbacks.

| Scenario | Expected behavior / stale use | Authority and recovery responsibility | Evidence / remaining uncertainty |
| --- | --- | --- | --- |
| A — Source updated, old vector remains | Mark stale/ineligible for current use; historical context only when allowed; fetch new revision | Source owner owns content; Sophia repairs descendants | Source/projection revisions and invalidation/job records; update notification and freshness window open |
| B — Source deleted, vector/chunk remains | Deny retrieval before physical purge; no fallback to deleted content | Source deletion owner; Sophia/connector cleanup owners | Tombstone, dependency coverage and purge confirmations; propagation/provider deadlines open |
| C — Conflicting authoritative-looking sources | Surface separate claims/status; apply only established ownership precedence, otherwise block affected decision | Governing source owners resolve conflict; Sophia reports it | Source IDs/revisions/governance scope and resolution artifact; precedence for each class open |
| D — Superseded ADR ranks first | Exclude from current-decision evidence, resolve current accepted replacement; historical use explicit | ADR governance owner; Sophia status/projection repair | Supersession links/status and source revision; sync latency open |
| E — Tenant A closest to Tenant B query | Enforce trusted B scope, never return A content; fewer results is acceptable | Security/source access owners; Sophia query boundary | Trusted scope/decision and safe rejection evidence; physical isolation/side channels open |
| F — Incorrect generated summary | Label derived, withdraw/correct and invalidate dependents; use source evidence, not erroneous summary as truth | Source owner validates facts; derivation/publishing owner corrects | Source revisions, producer/method, review and correction links; validation roles open |
| G — Embedding provider/model changes | Separate compatible generations, re-embed and validate, explicit cutover; old generation only if still permitted | Sophia retrieval owner; provider/data-policy owners | Space/model/config and evaluation/cutover references; model, dimensions and cost open |
| H — Index fails after canonical commit | Canonical record remains; expose pending/failed coverage, use authorized structured/lexical source path if suitable | Canonical owner; Sophia indexing recovery owner | Commit/revision, durable job identity and failure; retry/worker mechanism open |
| I — Retrieval unavailable | Declare degraded optional context or block evidence-required work; safe current cache only under policy | Operation owner decides evidence requirement; Sophia operations restores | Dependency error, missing-evidence declaration and current access; SLOs/freshness budgets open |
| J — Malicious repository injection | Treat as untrusted data; do not execute/elevate; flag/quarantine when warranted | Repository owns artifact; tool/security owners enforce; Sophia isolates evidence | Source location/revision, safe incident and rejected action; detection/control mechanisms open |
| K — Indexed/cached access revoked | Deny future delivery and invalidate; stale access never permits cache use; prior disclosure cannot be undone | Current access owner; Sophia/cache/connector owners | Revocation decision/check and cleanup record; atomicity/race protocol open |
| L — Important chat decision, no artifact | Return attributed candidate only; create/review owned decision artifact through authorized process | Relevant ADR/spec/task/governance owner, not transcript or model | Conversation attribution and explicit approval/artifact evidence; publishing workflow roles open |
| M — Older projection backup restored | Quarantine serving until current access/deletion/source reconciliation; rebuild; no stale-as-current restoration | Source owners and Sophia/DR operator | Backup checkpoint, deletion ledger and reconciled revisions; RPO/RTO/restore sequence open |
| N — Reindex/replay twice | Converge per source revision/transformation purpose; no duplicate canonical promotion or rollback to older revision | Sophia processing owner; promotion owner separately | Processing identity, source version and atomic disposition; storage/concurrency protocol open |
| O — Owner unavailable for freshness | Mark unknown; permitted labeled historical/optional use only with valid current access; block current-evidence requirements | Source owns truth; operation owner sets requirement; Sophia retries/reconciles | Last validated revision/time and failure; acceptable freshness and source availability open |

### Availability, bounds and observability

Knowledge availability does not redefine permission. Optional learning/context may be omitted with an explicit degraded-context result; evidence-required operations wait/fail visibly. A safe cache needs both permitted freshness and current access; owner unavailability is not permission to guess. Required durable work remains at its runtime/workflow/domain owners despite Sophia outage.

Bound ingestion/query fan-out, document/output/context sizes, parser work, provider calls, reindex concurrency, caches and tenant backlog/cost. Retries are finite and attributable; exhausted indexing tasks retain visible recovery ownership. Exact queues, quotas, fairness and worker topology remain open. Mixed canonical/query/vector workloads require representative contention and maintenance evaluation before deployment.

Record permitted source IDs/revisions, extraction/derivation producer, embedding/index generation, indexing time/status, trusted scope and policy decision references, candidate selection reasons/channel, freshness/conflicts, delivered context references and subsequent deletion/revocation. Telemetry is not business authority or the complete audit system. Avoid raw sensitive queries/content and private reasoning by default. ADR-011 owns audit integrity/retention and reconstruction limits; ADR-012 owns backup/restore. PostgreSQL backup mechanisms [S10] do not ensure source/projection/deletion consistency automatically.

Future separately authorized validation must exercise A–O at real boundaries: unauthorized snippets/provider inputs, revoke/cache races, stale/duplicate completion, dependency deletion, derived-scope intersections, incompatible embedding migrations, restore resurrection, injection-driven tool intent and unavailable-owner evidence gates. Include retrieval quality and cost comparisons against the lexical baseline. No runtime test, embedding job, database or benchmark was run in this documentation task.

## 11. Evolution / Exit Strategy

Ownership/dependency intent:

```text
Domain / knowledge owner → explicit knowledge contract → Sophia use cases
Retrieval/storage adapters → inward Sophia contracts
    (pgvector initially; future vector/search/provider mechanisms)
```

This distinguishes interaction flow from code dependencies: core knowledge policy does not import database/vector/provider types. Preserve canonical IDs, source references/revisions, governance status and provenance independently of vector point IDs, provider file IDs and query DSLs. Not every type requires an interface; introduce only real substitution/ownership boundaries.

Later infrastructure adoption requires evidence of unmet retrieval quality, selective-filter recall, workload contention/latency, isolation, feature, operational or cost needs. Evaluate a separate vector/search service with owned projection contracts, update/deletion synchronization, migration/export, tenant enforcement, backups, staffing and budget. Do not silently redefine external source ownership to suit a product API.

Rebuild new projections from permitted canonical/source representations; maintain compatible query generations and source-status barriers during coexistence; compare quality and scope, cut over deliberately, retain rollback only if still authorized and current. New chunking/reranking/provider strategies create attributed projection revisions without changing canonical identity. Retire old mechanisms through reviewed retention and explicit deletion authorization. Exportability reduces replacement cost but does not guarantee live-index portability or cost-free migration.

## 12. Development Constitution Compliance

- Inspected governance, all Accepted ADRs and all current architecture documentation/references before edits; surfaced stale scope text and material unknowns.
- Recorded ADR-006 Accepted on 2026-10-05 with explicit human project-owner approval; the existing architecture and all 25 memory invariants remain semantically unchanged. Acceptance does not authorize implementation.
- Preserved Accepted ADR-001–005; no material conflict requiring modification was found.
- Maintained language, modular/public ownership, inward dependencies, No implicit Shared Kernel, runtime attribution/current authorization, Temporal and event distinctions.
- Used current official capability evidence, separated architectural inferences, and avoided benchmarks or guaranteed controls.
- Documentation only; supporting status/navigation/scope updates are limited to this proposal. No source, modules, schemas, indexes, embeddings, dependencies, infrastructure or configuration; ADR-007 not started.
- Document verification covers status, sections, links, scenarios, invariants, changed-file scope and byte preservation. Runtime validation remains future authorized work.

## 13. Related Decisions

[Constitution](../../DEVELOPMENT_CONSTITUTION.md), [ADR index](README.md), [architecture context](../architecture/ARCHITECTURE.md), [principles](../architecture/principles.md). Accepted constraints: [ADR-001](ADR-001-core-programming-language.md), [ADR-002](ADR-002-architecture-style.md), [ADR-003](ADR-003-agent-runtime.md), [ADR-004](ADR-004-workflow-engine.md), [ADR-005](ADR-005-event-architecture.md).

| Deferred ADR | Unresolved questions / implementation gates |
| --- | --- |
| ADR-007 — MCP & Tools | Authenticated ingestion/export sources, retrieval tools, credentials, URL/file validation, provider contracts and effect evidence |
| ADR-008 — Sandbox | Repository/extraction execution safety, resource/network/file isolation, artifacts and termination/cleanup evidence |
| ADR-009 — Security & Isolation | Trusted tenant/organization/user/agent scope, inheritance/current authorization/revocation races, physical/RLS strategy, secrets, encryption/residency and provider disclosure |
| ADR-010 — Human Approval | Publishing/review roles, high-impact promotion approval, intent/revision binding, expiry/revocation and consequential operation enforcement |
| ADR-011 — Observability | Retrieval evidence versus complete audit, privacy/integrity, correction/deletion/retention, alerts, cost and reconstruction limits |
| ADR-012 — Deployment | Supported store/extension versions and hosting, workload/resource targets, worker topology, capacity, backups/deletion ledger, RPO/RTO and recovery drills; Temporal hosting still undecided |

These future ADRs are not created here. Detailed controls must be resolved before their affected features, not deferred past implementation. Later conflicts require proposal revision or explicit Accepted-decision supersession review.

## 14. Evidence / References

Official sources reviewed **2026-10-04**. Facts below support feasibility and limitations; Sophia ownership, recommendation, taxonomy and invariants are NEXORA architectural inferences from the owner handoff and Accepted constraints. No installed-version conformance, comparative throughput/cost, recall evaluation, operational deployment or runtime security test is claimed. Recheck supported versions/features during separately authorized implementation.

- S1: [PostgreSQL transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) — local all-or-nothing database transactions; not remote owner/provider atomicity.
- S2: [PostgreSQL full-text search introduction](https://www.postgresql.org/docs/current/textsearch-intro.html) — document tokens/lexemes, matching and ranking; no universal code-search quality guarantee.
- S3: [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) — row-policy facility, privileged/owner bypass and integrity-check caveats; no final RLS design selected.
- S4: [pgvector official repository](https://github.com/pgvector/pgvector) — exact/approximate similarity, filtering/iterative scans, multitenant recall coupling and hybrid options; no index or tuning chosen.
- S5: [pgvector Go support](https://github.com/pgvector/pgvector-go) — Go integration availability; no library/driver selected or verified in NEXORA.
- S6: [Qdrant filtering](https://qdrant.tech/documentation/search/filtering/) — payload/ID conditions as a dedicated-vector category example, not selected infrastructure or proof of authorization.
- S7: [OpenSearch hybrid search](https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/index/) — keyword/semantic combination and search pipelines; no engine adopted.
- S8: [OpenAI vector embeddings](https://developers.openai.com/api/docs/guides/embeddings) — similarity representations as a provider example; no model/provider/dimension selected.
- S9: [OpenAI retrieval](https://developers.openai.com/api/docs/guides/retrieval) — managed vector-store search/attributes, asynchronous file operations, Go examples and eventual file-removal consistency; no provider-wide deletion or NEXORA security guarantee.
- S10: [PostgreSQL backup and restore](https://www.postgresql.org/docs/current/backup.html) — backup categories; application reconciliation and recovery targets remain separate obligations.

Project evidence: current ADR-006 owner handoff; direct reads of all eleven existing Markdown documents and repository reference searches; Accepted ADR-001–005 unchanged. Acceptance recorded on 2026-10-05 with explicit human project-owner approval in this conversation.
