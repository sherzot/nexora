# NEXORA — Delivery-Driven Engineering Policy

Status: OWNER-DIRECTED DELIVERY WORKFLOW; implementation authorization remains batch-specific.
The [Development Constitution](../../DEVELOPMENT_CONSTITUTION.md) remains the canonical authority. The [Accepted ADRs](../adr/README.md) remain binding architectural constraints.

This workflow reconciles the pending [delivery policy branch](https://github.com/sherzot/nexora/tree/428a40637c405e25e83392b900ab2e724af9fd74).

## Purpose
Governance protects delivery; it must not become an endless substitute for development. Optimize for working, demonstrable, verified product capabilities instead of serial micro-milestones and repeated review-only loops. Prefer a coherent vertical slice that can be tested and demonstrated over isolated cosmetic patches, while preserving clean architecture, DDD boundaries, security and evidence.

## Default execution model
1. **Inspect and contract.** Read the Constitution, AGENTS.md, applicable ADRs, repository code and tests. Establish current main SHA, boundaries, user-facing outcome, acceptance criteria, exclusions, dependencies, verification and permitted Git actions. Make architecture-significant unknowns explicit.
2. **One owner-approved delivery batch.** Present a concrete batch contract for approval. The owner's explicit approval authorizes all **specified** tasks and their ordinary implementation decisions within that contract. Do not ask for renewed approval at every internal subtask or trivial fix.
3. **Parallel vertical slices.** Split independent work by clear ownership and interfaces (e.g., Virtual Office UI, application/state logic, regression/integration tests). Agree on shared interfaces before parallel edits, assign each file to a single owner at a time, and integrate continuously. Parallel work is an optimization, not permission to bypass review or architecture boundaries.
4. **Build continuously.** Implement functionality and appropriate unit, integration, browser, architecture and security tests together. Reproduce defects before fixing when practical. Surface failures rather than hiding them.
5. **Risk-based gates.** Lightweight review for low-risk changes inside approved scope; deeper review for security, authorization, persistence, external contracts, dependencies, architecture and operations. Consolidate routine review at meaningful integration points instead of making every tiny patch a new owner decision.
6. **Deliver evidence.** Each batch ends with a demonstrable capability, exact changes and SHA(s), checks actually executed, failures, known limitations, governance compliance and a clear next action. Do not report unrun checks as PASS.

## Authorization and STOP rules
- The Constitution is controlling. Accepted ADRs are architectural constraints, not execution permission.
- A batch contract must explicitly name scope, affected boundaries, verification, exclusions, and any authorized branch, commit, push, or PR actions. Work independently within those permissions; STOP only the affected portion when a material ambiguity or new approval gate arises.
- New dependencies, schema or infrastructure changes, significant architectural decisions, external contracts, security-model changes and scope expansion require explicit owner direction where the Constitution requires it.
- Destructive actions, force pushes, production deployment, irreversible changes, and file/branch deletion require explicit owner authorization. Do not infer merge permission from permission to code, push, or open a PR.
- Existing D02 NOT ACCEPTED, normative obligations REVIEW ONLY, O1–O5 and GO-2026-5932 OPEN remain unchanged. Operational Run creation/admission/dispatch/persistence and deployment remain BLOCKED.
- No automatic merge, no deletion, no deployment. No change to operational backend authority via frontend delivery.

## Working rhythm
Default planning cadence: 10 working days per integrated, testable capability (target, not guarantee): days 1–2 contract and architecture, 3–6 parallel implementation, 7–8 integration and hardening, 9–10 reviewable release candidate. Adjust based on actual scope and risk. Prioritize measurable product progress over documentation volume.

## Agent response behavior
When asked for “next step,” propose or execute the **next authorized development action**, not merely another discovery/review loop. Avoid re-requesting permission already granted within the exact approved batch. If implementation is not yet authorized, provide one complete owner-decision-ready batch contract rather than fragmenting authorization into micro-requests. Maintain honest distinctions among planned, authorized, implemented, verified, merged and deployed.
