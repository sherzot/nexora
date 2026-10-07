# Architecture principles

These constraints derive from the project handoff and [constitution](../../DEVELOPMENT_CONSTITUTION.md). They do not accept a technology or establish a concrete module design.

- Model real organizational work and explicit outcomes. Visual animation must reflect underlying execution state.
- Keep authoritative agent and workflow state independent of the Virtual Office.
- Separate Sophia's knowledge responsibilities from execution authority; retrieval never grants permission.
- Follow Accepted ADR-002: a modular control plane, explicit ownership and inward dependencies, selective DDD and application-level vertical slices. Final bounded contexts remain undecided.
- Follow ADR-002's No implicit Shared Kernel invariant: reuse does not justify centralizing domain authority; domain sharing needs explicit ownership and compatibility review.
- Extract services only for demonstrated independent scaling, security/isolation, fault containment, deployment lifecycle, runtime, or workload needs.
- Keep domain policy independent of LLM vendors, MCP transports, storage, and frameworks through explicit boundaries.
- Make authorization, tenant isolation, cancellation, retry safety, and human approvals substantive backend responsibilities.
- Justify infrastructure against requirements; do not default to brokers, Redis, Kubernetes, or extra databases.
- Observe explicit decisions, inputs allowed by privacy policy, tool activity, outcomes, errors, latency, and cost. Do not depend on private model chain-of-thought.
- Surface conflicts and revise architecture through the ADR process, preserving history.
