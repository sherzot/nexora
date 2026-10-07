# Architecture Decision Records

ADRs preserve context, evaluated alternatives, consequences, and human decision authority. All ADR work must follow the [Development Constitution](../../DEVELOPMENT_CONSTITUTION.md). A proposal is not implementation authorization.

## Convention and approval

Use `ADR-NNN-short-kebab-case-title.md`, with monotonically increasing three-digit numbers. Never reuse a number. Create records when analysis begins, not empty placeholders for the entire roadmap. Record status, proposal date, owner authority, scope, approval evidence, and related decisions.

Required sections: Context; Problem; Decision Drivers; Considered Options; Decision; Detailed Design; Alternatives Analysis; Consequences (Positive, Negative, Risks); Security Considerations; Operational Considerations; Evolution / Exit Strategy; Development Constitution Compliance; Related Decisions. Add evidence and validation gates where useful.

| Status | Meaning / transition |
| --- | --- |
| Proposed | Under review; may be revised, explicitly Accepted, or Rejected |
| Accepted | Explicitly approved by the human project owner; record date and approval reference |
| Superseded | Replaced by an explicitly accepted new ADR; link both directions |
| Deprecated | Explicitly retired without a replacement; record rationale and permitted remaining use |
| Rejected | Considered and declined; retain reasoning and owner decision evidence |

Only the owner may authorize acceptance or retirement of accepted decisions. Preserve accepted reasoning; material changes require a new Proposed ADR and explicit acceptance before superseding the old record. Editorial corrections must preserve meaning and be identifiable. Resolve conflicts before implementation; later analysis can reopen earlier assumptions but cannot silently override accepted decisions.

## Current index

| Record | Status | Recommendation |
| --- | --- | --- |
| [ADR-001 — Core Platform Programming Language](ADR-001-core-programming-language.md) | Accepted | Go as primary core/backend language; owner approval 2026-10-04 |
| [ADR-002 — Architecture Style](ADR-002-architecture-style.md) | Accepted | Modular control plane with evidence-driven extraction and No implicit Shared Kernel; owner approval 2026-10-04 |
| [ADR-003 — Agent Runtime Architecture](ADR-003-agent-runtime.md) | Accepted | NEXORA-owned runtime lifecycle/governance with current authorization and immutable attribution; owner approval 2026-10-04 |
| [ADR-004 — Workflow Engine and Durable Orchestration](ADR-004-workflow-engine.md) | Accepted | Temporal infrastructure with NEXORA-owned workflow semantics and Run identities; owner approval 2026-10-04 |
| [ADR-005 — Event Architecture and Delivery Semantics](ADR-005-event-architecture.md) | Accepted | Owned contracts, Outbox/consumer deduplication and honest effects; no initial broker or default Event Sourcing; owner approval 2026-10-04 |
| [ADR-006 — Memory Architecture and Sophia Knowledge System](ADR-006-memory-architecture.md) | Accepted | Governed knowledge, owner truth and attributable projections; PostgreSQL + pgvector direction; owner approval 2026-10-05 |
| [ADR-007 — MCP & Tool Architecture](ADR-007-mcp-tool-architecture.md) | Accepted | Owned operation boundary; admitted MCP/native/internal adapters, scoped credentials and honest effect evidence; owner approval 2026-10-05 |
| [ADR-008 — Sandbox & Execution Architecture](ADR-008-sandbox-execution.md) | Accepted | Dedicated controlled execution boundary; attributable bounded jobs, stronger hostile-code isolation and honest termination/effect/cleanup evidence; owner approval 2026-10-05 |
| [ADR-009 — Security & Isolation Architecture](ADR-009-security-isolation.md) | Accepted | Compositional current authority, trusted context, bounded delegation, scoped credential references and owner enforcement; owner approval 2026-10-05 |
| [ADR-010 — Human Approval Architecture](ADR-010-human-approval.md) | Accepted | Durable governance, owner-defined reviewed intent, eligible humans, immutable decisions, explicit usability/consumption and current owner enforcement; explicit human project-owner approval 2026-10-05 |
| [ADR-011 — Observability & Audit Architecture](ADR-011-observability-audit.md) | Accepted | Hybrid operational telemetry, explicit durable audit contracts and authoritative owner evidence; explicit human project-owner architecture approval 2026-10-06 |
| [ADR-012 — Deployment Architecture](ADR-012-deployment-architecture.md) | Accepted | Hybrid incremental topology: modular Go control plane, separately operated trusted workers, managed PostgreSQL and strongly isolated execution; no initial Kubernetes requirement; approval 2026-10-06, explicit human project-owner architecture approval |

## Roadmap and dependencies

ADR-001, ADR-002, ADR-003, ADR-004 and ADR-005 are Accepted. The sequence below includes those records and future roadmap items. ADR-006 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-007 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-008 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-009 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-010 is Accepted with explicit human project-owner architecture approval dated 2026-10-05. Acceptance does not authorize implementation. ADR-011 is Accepted with explicit human project-owner architecture approval dated 2026-10-06. Acceptance does not authorize implementation. ADR-012 is Accepted with explicit human project-owner architecture approval dated 2026-10-06. The currently planned foundation architecture is complete; acceptance does not authorize implementation. This is the final currently planned foundation architecture decision; no implementation or additional architecture decision is authorized. The reasoning sequence is:

1. ADR-001 — Core Platform Programming Language
2. ADR-002 — Architecture Style: modular monolith, microservices, distributed modular architecture, hybrid evolution
3. ADR-003 — Agent Runtime: identity, roles, lifecycle/state, capabilities, execution, cancellation, retries/failures, tool permissions, model abstraction
4. ADR-004 — Workflow Engine: Temporal and alternatives; durability, timers/signals, approvals, recovery, determinism
5. ADR-005 — Event Architecture: agents, workflows, backend, UI, external integrations; minimal justified infrastructure
6. ADR-006 — Memory Architecture: working, episodic, semantic, organizational/project knowledge, durable decisions; Sophia
7. ADR-007 — MCP & Tool Architecture: discovery, capability boundaries, authorization, scoped credentials, audit
8. ADR-008 — Sandbox & Execution: commands, repositories, builds/tests, networks/files, isolation technologies and threat boundaries
9. ADR-009 — Security & Isolation: tenancy, authorization, secrets, RBAC/ABAC/capabilities, networks, supply chain, injection/escape, audit
10. ADR-010 — Human Approval: autonomous, policy-controlled, approval-required, prohibited operations; backend enforcement
11. ADR-011 — Observability: execution/workflows/tools/models, errors, latency/cost, audit/traces; no private chain-of-thought
12. ADR-012 — Deployment Architecture: local → development → staging → production → distributed runtime; justify Kubernetes

The intended reasoning chain is ADR-001 → ADR-002 → ADR-003 → ADR-004 → ADR-005 → ADR-006 → ADR-007 → ADR-008 → ADR-009 → ADR-010 → ADR-011 → ADR-012. It is not permission to postpone security until ADR-009. Cross-cutting constraints apply from the start; later ADRs feed conflicts back into earlier proposals or supersession review.
