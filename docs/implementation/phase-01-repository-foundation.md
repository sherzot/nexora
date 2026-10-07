# Implementation Phase 1 — Repository Foundation & Executable Skeleton

## Authorization and baseline

Explicit human project-owner implementation authorization received on 2026-10-08 is limited to this phase. This is an implementation record, not an ADR. Accepted ADR-001 through ADR-012 remain binding and unchanged.

- Repository: `sherzot/nexora` (private).
- Baseline: `cebc1d30b8235acfec608ce5bee465e11060db5c` — `docs: establish NEXORA foundation architecture baseline`.
- Branch: `feat/repository-foundation`; no merge or push to `main` is authorized.
- Authorized work: one Go module, one executable, process configuration, local HTTP lifecycle and health, focused tests, dependency fitness checks and developer instructions.
- No later phase, product capability, deployment or additional ADR is authorized.

## Concrete ownership

| Package | Responsibility | Permitted project dependencies |
| --- | --- | --- |
| `cmd/nexora` | Configuration/HTTP composition, signal handling and process exit | The two foundation packages below |
| `internal/platform/config` | Validated process settings | None |
| `internal/platform/httpserver` | Health handlers and bounded local HTTP shutdown | None |
| `internal/architecture` | Test-only dependency fitness check | None |

`platform` contains policy-neutral process utilities only. It is not a domain Shared Kernel or authority. No final bounded contexts, domain/application trees, service extraction or speculative subsystem packages are introduced. New packages require explicit ownership/dependency review and appropriate phase authorization. Go's internal visibility and compiler enforce external import restrictions and import-cycle rejection; the fitness test checks actual Go files, including tests, against the table and the installed standard library. Future domain dependency rules require the corresponding authorized implementation; this test does not pretend those models exist.

## Go evidence and compatibility

The installed host default was Go 1.25.0 (`darwin/arm64`). On 2026-10-08 the official [downloads](https://go.dev/dl/) and [release history](https://go.dev/doc/devel/release) listed Go 1.27.1 as stable. Go supports a major release until two newer major releases exist; 1.25 is outside that policy with 1.27 available. The selected module minimum and verification toolchain are **Go 1.27.1**.

`GOTOOLCHAIN=go1.27.1 go version` confirmed that toolchain on this host. The single module is `github.com/sherzot/nexora`; no separate `toolchain` directive, third-party module or `go.sum` is needed. Use Go 1.27.1 or a later supported compatible release. Compatibility with later releases and other operating systems is an assumption, not executed verification. A Go installation with automatic toolchain selection may download the required toolchain outside this repository; this is developer tooling, not an application integration.

## Implemented behavior

| Variable | Default | Validation |
| --- | --- | --- |
| `NEXORA_LISTEN_ADDRESS` | `127.0.0.1:8080` | Literal IPv4/IPv6 address plus numeric port 1–65535; empty host explicitly means wildcard binding; hostnames/service names rejected |
| `NEXORA_SHUTDOWN_TIMEOUT` | `10s` | Positive Go duration within `time.Duration` range |

Explicitly empty values are errors. No environment-file parser, secret settings, provider configuration or environment dumps exist. Non-loopback/wildcard exposure must be an intentional operator override; it is not production deployment authorization.

`GET /health/live` returns `200 {"status":"live"}` when the HTTP surface answers. `GET /health/ready` returns `200 {"status":"ready"}` while serving and `503 {"status":"not_ready"}` before serving or during shutdown where an existing connection can observe it. HEAD is also supported by Go's GET routing, with no response body. Other methods receive 405; other paths receive 404. Responses disclose only status and are non-cacheable. Readiness has no dependency probes and does not imply production readiness or any NEXORA product capability.

The HTTP server has 5s header, 10s read/write and 60s idle timeouts, with a 16 KiB header setting. These are small-skeleton defensive defaults, not capacity/SLO decisions for future product routes. SIGINT/SIGTERM cancel the process context, withdraw readiness and drain local HTTP requests within the configured timeout. On timeout the server closes remaining connections and reports failure. Startup/shutdown failures produce non-zero exit. Operational JSON logs report startup, listener, shutdown and errors; they are not durable Audit Records. No request bodies, credentials or environment values are logged.

## Non-goals and limitations

No domain/product endpoints or placeholders, persistence, schemas, migrations, Temporal integration/workers, Agent Runtime, Tool/MCP, provider calls, Execution/Sandbox, Sophia, Security/authentication/authorization/tenant enforcement, Approval, events/Outbox/Inbox, durable audit, OpenTelemetry, frontend, secrets, CI/CD, containers or infrastructure are implemented or configured.

Shutdown governs this local HTTP process only; it does not establish durable cancellation, external-effect rollback or workflow recovery. Health and the race detector do not establish runtime security, hostile-code isolation, authorization, approval enforcement, durability, recovery, audit custody, tenant isolation, capacity or production behavior. No deployment was performed.

## Verification and completion evidence

Required checks on this branch:

```sh
gofmt -l cmd internal
go vet ./...
go test ./...
go test -race ./...
go build ./...
go build -o /tmp/nexora-phase1 ./cmd/nexora
git diff --check
```

All listed checks passed on darwin/arm64 using Go 1.27.1: gofmt verification returned no filenames; vet, unit/HTTP/architecture tests, race tests, package build, explicit executable build and diff whitespace check succeeded. Local process checks additionally verified GET/HEAD, 405/404, SIGINT/SIGTERM with exit 0, invalid configuration and occupied address with exit 1, and a stalled request exceeding shutdown time with exit 1. The tests use local loopback only; no provider, database or product integration was tested. The executable artifact was built outside the repository. Preservation compares all twelve ADRs, constitution and principles byte-for-byte with the baseline. The feature branch must track its remote with a clean worktree; `main` must stay at the baseline. No merge or PR creation is authorized by this work.
