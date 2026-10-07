# Architecture context

## Verified starting state

On 2026-10-04, inspection with `ls -la` found an empty project directory. `git status --short` reported that it was not a Git repository. No implementation, tests, manifests, architecture documents, or existing instructions were present. No conflicts with the supplied handoff were found. This bootstrap creates documentation only and does not initialize Git.

## Product intent

The human operator directs a virtual engineering organization containing project management, architecture, backend, frontend, QA, security, platform, and review agents as justified. Agents are intended to inspect repositories, design and modify code, run commands and tests, review work, prepare pull requests, and perform controlled integration and deployment workflows.

Conceptual interaction, **not a selected topology or deployment plan**:

Human → Virtual Office → Agent Organization → Orchestrator → Workflow Engine → Agent Runtime → Sandbox / Execution → MCP / Tools → External engineering systems.

The Virtual Office presents identities, tasks, states, progress, dependencies, blocks, collaboration, approvals, and activity. It is not the system of record; execution and workflow state must exist independently of visualization.

Sophia is the governed knowledge and retrieval subsystem under Accepted ADR-006. Externally owned specifications, ADRs, decisions and project artifacts remain authoritative at their owners; Sophia may own curated guidance and maintain attributable retrieval projections. Memory and similarity do not grant authority or establish current truth.

## Decision status and remaining hypotheses

| Concern | Current direction | Decision boundary |
| --- | --- | --- |
| Frontend | TypeScript / React / Next.js | Future explicit evaluation; not selected here |
| Core | Go as primary core/backend language | ADR-001, Accepted 2026-10-04 |
| Structure | Modular control plane with explicit ownership and justified extraction | ADR-002, Accepted 2026-10-04; final contexts not selected |
| Runtime | NEXORA-owned identity/lifecycle/governance with explicit subsystem boundaries | ADR-003, Accepted 2026-10-04 |
| Workflow | Temporal accepted for durable orchestration; NEXORA retains domain/runtime authority | ADR-004, Accepted 2026-10-04; hosting undecided |
| Communication | Owned semantic contracts and reliable intent/consumer patterns; no initial broker or default Event Sourcing | ADR-005, Accepted 2026-10-04; transport/store choices undecided |
| Sophia storage | Sophia-specific PostgreSQL canonical/provenance storage direction plus derived pgvector retrieval; scoped structured/lexical/semantic context | ADR-006, Accepted 2026-10-05; no schema/index/model selected |
| Integrations | Accepted NEXORA-owned operation contracts with admitted MCP/native/internal adapters, scoped credentials and effect evidence | ADR-007, Accepted 2026-10-05; SDK/version/transport undecided |
| Execution | Accepted dedicated controlled execution boundary with attributable bounded jobs and stronger hostile-code isolation | ADR-008, Accepted 2026-10-05; exact runtime/provider undecided |
| Security | Accepted compositional current authority, trusted scope, bounded delegation, credential references and consequential owner enforcement | ADR-009, Accepted 2026-10-05; identity/policy/secret mechanisms undecided |
| Approval | Accepted durable governance with owner-defined reviewed intent, trusted reviewer eligibility, immutable decisions and current usability/use enforcement | ADR-010, Accepted 2026-10-05; policy/channel/storage mechanisms undecided |
| Telemetry / audit | Accepted hybrid operational telemetry, explicit durable audit contracts and authoritative owner evidence; diagnostic signals do not grant authority | ADR-011, Accepted 2026-10-06 by explicit human project-owner architecture approval; technology/custody/retention implementation undecided |
| Deployment | Accepted hybrid incremental topology: one modular Go control-plane application, separate trusted worker operation, managed PostgreSQL with owner discipline, dedicated Temporal and strongly isolated execution | ADR-012, Accepted with explicit human project-owner architecture approval dated 2026-10-06; no initial Kubernetes requirement, providers/Temporal hosting unresolved |

Redis, Kafka, separate services, and additional storage require demonstrated needs. Agent Runtime and Sandbox may warrant extraction based on isolation or workload evidence; this document does not authorize it.

## Unknowns and gates

Tenant model, operating systems, workload volume, concurrency, resource limits, latency/recovery objectives, budget, retention, compliance, deployment ownership, and integration protocols/versions remain unknown. They block final designs and quantitative claims in affected future ADRs, but do not prevent the conceptual runtime and durable-orchestration proposals. No capacity, availability, performance, or security guarantee is made.

ADR-001, ADR-002, ADR-003 and ADR-004 are Accepted. Acceptance does not authorize implementation. ADR-005 is Accepted. ADR-006 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-007 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-008 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-009 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-010 is Accepted with explicit human project-owner architecture approval dated 2026-10-05. Acceptance does not authorize implementation. ADR-011 is Accepted with explicit human project-owner architecture approval dated 2026-10-06. Acceptance does not authorize implementation. ADR-012 is Accepted with explicit human project-owner architecture approval dated 2026-10-06. The currently planned foundation architecture is complete; acceptance does not authorize implementation. Its broader initial application-data PostgreSQL direction is accepted through ADR-012, not already selected by Sophia-specific ADR-006. Do not proceed to implementation or additional architecture decisions under the current scope.
