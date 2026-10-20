# NEXORA

NEXORA is an AI-native Virtual Engineering Organization: specialized AI agents coordinate real software engineering work through a visual Virtual Office under human governance.

**Project state: Active Development — Phases 1–3 merged; Phase 4 Versioned Run Transition Preparation on its feature branch.** This foundation contains governance, Accepted ADR-001 (core language), Accepted ADR-002 (architecture style), Accepted ADR-003 (agent runtime), Accepted ADR-004 (durable orchestration), Accepted ADR-005 (event architecture), Accepted ADR-006 (memory architecture/Sophia), Accepted ADR-007 (MCP/tool architecture), Accepted ADR-008 (sandbox/execution), Accepted ADR-009 (security/isolation), Accepted ADR-010 (human approval), Accepted ADR-011 (observability/audit), and Accepted ADR-012 (deployment architecture); implementation is limited to the local HTTP skeleton, owner-specific identity/attribution contracts, persistence-free Run lifecycle domain semantics and pure versioned transition preparation.

## Start here

1. Read [Development Constitution](DEVELOPMENT_CONSTITUTION.md), the canonical development policy.
2. Follow [agent instructions](AGENTS.md).
3. Review [architecture context](docs/architecture/ARCHITECTURE.md) and [principles](docs/architecture/principles.md).
4. Review the [ADR program](docs/adr/README.md), [Accepted ADR-001](docs/adr/ADR-001-core-programming-language.md), [Accepted ADR-002](docs/adr/ADR-002-architecture-style.md), [Accepted ADR-003](docs/adr/ADR-003-agent-runtime.md), [Accepted ADR-004](docs/adr/ADR-004-workflow-engine.md), [Accepted ADR-005](docs/adr/ADR-005-event-architecture.md), [Accepted ADR-006](docs/adr/ADR-006-memory-architecture.md), [Accepted ADR-007](docs/adr/ADR-007-mcp-tool-architecture.md), [Accepted ADR-008](docs/adr/ADR-008-sandbox-execution.md), [Accepted ADR-009](docs/adr/ADR-009-security-isolation.md), [Accepted ADR-010](docs/adr/ADR-010-human-approval.md), [Accepted ADR-011](docs/adr/ADR-011-observability-audit.md), and [Accepted ADR-012](docs/adr/ADR-012-deployment-architecture.md).

ADR-004 is Accepted with explicit human project-owner approval dated 2026-10-04. Acceptance does not authorize implementation. ADR-005 is Accepted with explicit human project-owner approval dated 2026-10-04. ADR-006 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-007 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-008 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-009 is Accepted with explicit human project-owner approval dated 2026-10-05. ADR-010 is Accepted with explicit human project-owner architecture approval dated 2026-10-05. Acceptance does not authorize implementation. ADR-011 is Accepted with explicit human project-owner architecture approval dated 2026-10-06. Acceptance does not authorize implementation. ADR-012 is Accepted with explicit human project-owner architecture approval dated 2026-10-06. The currently planned foundation architecture is complete. Its hybrid incremental topology is the accepted deployment direction. Acceptance does not authorize implementation. Separate explicit human project-owner authorization dated 2026-10-08 permits only Implementation Phase 1 — Repository Foundation & Executable Skeleton. Phases 1–3 are merged at `e2ce082814f001d6dd5a0727da04018591b02c54`. Separate explicit human project-owner authorization dated 2026-10-20 permits only Phase 4 Versioned Run Transition Preparation on `feat/versioned-run-transition-preparation`, its tests, documentation, verification and one feature commit/push; no PR, merge, Phase 5 or additional architecture decision is authorized.

## Run and verify the Phase 1 skeleton

Use **Go 1.27.1** or a later supported compatible release (standard library only). Version evidence, authorization, package boundaries and verification are recorded in [Phase 1](docs/implementation/phase-01-repository-foundation.md).

```sh
go run ./cmd/nexora
```

The default listener is `127.0.0.1:8080`. `NEXORA_LISTEN_ADDRESS` accepts a literal IP and numeric port; `NEXORA_SHUTDOWN_TIMEOUT` defaults to `10s` and accepts a positive Go duration. Invalid or explicitly empty settings fail startup. There is no `.env` parser. To override:

```sh
NEXORA_LISTEN_ADDRESS=127.0.0.1:8081 NEXORA_SHUTDOWN_TIMEOUT=5s go run ./cmd/nexora
```

`GET /health/live` reports only HTTP liveness; `GET /health/ready` reports only readiness of this skeleton. HEAD is supported; other methods receive 405. No product endpoints exist. Ctrl-C stops the local server with bounded request draining. These endpoints and operational logs do not establish production readiness, security, authorization or durable audit.

```sh
gofmt -l cmd internal
go vet ./...
go test ./...
go test -race ./...
go build ./...
go build -o /tmp/nexora-phase1 ./cmd/nexora
git diff --check
```

Use the explicitly built executable to test SIGTERM directly (`go run` introduces a tool wrapper). Keep build artifacts outside the repository.

Phases 1–3 are merged. Phase 3 adds an immutable, provider-neutral Run lifecycle domain value; it does not implement a production Agent Runtime, LLM calls, Tool dispatch or code execution. See [the Phase 2 identity/attribution record](docs/implementation/phase-02-core-identity-contracts.md) and [the Phase 3 lifecycle, ownership and verification record](docs/implementation/phase-03-agent-run-lifecycle.md). Lifecycle, Waiting reason, stop intent, final outcome and Runtime effect projection remain separate; these values grant no authority. Complete launch attribution, durable waits/stops and owner integrations remain deferred.

No PostgreSQL/persistence, Temporal, Tool/MCP, Sandbox/Execution, Sophia, Security, Approval behavior, event infrastructure, durable audit, frontend, infrastructure or CI/CD is implemented. The Phase 1 executable is unchanged. Phase 4 adds Runtime-owned `RunRevision`, `RunSnapshot` and immutable prepared candidates through seven operation-specific methods. Prepared means only locally valid: no commit, authorization, dispatch or durable record. Competing candidates may both succeed; same-category effect projection still proposes the next revision. See [Phase 4](docs/implementation/phase-04-versioned-run-transition-preparation.md). Only the named feature branch may be committed/pushed after verification; PR creation, merge and Phase 5 remain unauthorized.
