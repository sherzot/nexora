# C7.1 isolated development packaging

Project `nexora` packages only the existing HTTP skeleton (`app`) and optional
one-shot `runtime-demo`. This is not a complete backend or production deployment.
There is no database, worker, Temporal, frontend, source resolution, operational
Run creation/admission/persistence, dispatch, authorization or recovery behavior.

## Prerequisites and offline images

Use Docker with a local daemon, Compose, an existing local BuildKit builder, and
the verified isolated Go 1.27.3 toolchain. No toolchain/image/dependency downloads
are authorized by this procedure. Stop on a missing prerequisite. Check for an
existing project, container-name collision or image tag before creating anything;
do not replace another run's resources. C3/C4 projects are independent and must
not be started, stopped, joined or cleaned up by these commands.

From the repository root, create a private build context outside the repository:

```sh
: "${GOROOT:?Set GOROOT to the verified isolated Go 1.27.3 installation}"
export GOROOT
export GOTOOLCHAIN=local GOPROXY=off GOFLAGS=-mod=readonly
NEXORA_C71_CONTEXT=$(mktemp -d "${TMPDIR:-/tmp}/nexora-c71.XXXXXX")
export GOCACHE="$NEXORA_C71_CONTEXT/cache" GOTMPDIR="$NEXORA_C71_CONTEXT"
"$GOROOT/bin/go" version
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 "$GOROOT/bin/go" build -trimpath -buildvcs=false -ldflags=-buildid= -o "$NEXORA_C71_CONTEXT/nexora" ./cmd/nexora
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 "$GOROOT/bin/go" build -trimpath -buildvcs=false -ldflags=-buildid= -o "$NEXORA_C71_CONTEXT/runtime-demo" ./cmd/runtime-demo
chmod 0555 "$NEXORA_C71_CONTEXT/nexora" "$NEXORA_C71_CONTEXT/runtime-demo"
cp dev/nexora/Dockerfile "$NEXORA_C71_CONTEXT/Dockerfile"
```

Record both binary SHA-256 hashes and verify static Linux ARM64 format with
`file`. Preserve go.mod/go.sum hashes. Before image building, move/copy only the
Dockerfile and two binaries into a separate external packaging directory; do not
send the build cache, temporary files, repository or home directory to Docker.
Set `NEXORA_C71_PACKAGE` to that packaging directory:

```sh
NEXORA_C71_PACKAGE=$(mktemp -d "${TMPDIR:-/tmp}/nexora-c71-package.XXXXXX")
cp "$NEXORA_C71_CONTEXT/Dockerfile" "$NEXORA_C71_CONTEXT/nexora" "$NEXORA_C71_CONTEXT/runtime-demo" "$NEXORA_C71_PACKAGE/"
docker build --network=none --pull=false --platform=linux/arm64 --target app -t nexora-c71-app:local "$NEXORA_C71_PACKAGE"
docker build --network=none --pull=false --platform=linux/arm64 --target runtime-demo -t nexora-c71-runtime-demo:local "$NEXORA_C71_PACKAGE"
```

Both targets use `scratch`, not a registry base image. No Go compiler/module
cache is assumed inside Docker. Each final image contains only its executable
and image configuration. Record image IDs and retain binary/image provenance
for this local run. No executable is bind-mounted at runtime.

## Explicit project lifecycle

```sh
docker compose -p nexora -f dev/nexora/compose.yaml config
docker compose -p nexora -f dev/nexora/compose.yaml up -d --no-build --pull never app
```

Default `up` starts only `app`; the demo is behind profile `demo`. The app listens
on its own container-local 127.0.0.1:8080. Both services use network_mode: none;
there are no published ports, extra networks, credentials, application volumes,
host repository/home mounts, Docker socket mounts or database dependencies.
Both run as 65532:65532 with read-only roots, all capabilities dropped and
no-new-privileges. Failures are not hidden by automatic restarts.

Verify container creation separately from process startup using project-scoped
inspection and logs. Inspect effective network mode, port bindings, mounts,
user, read-only root, capability drops, security options and restart policy.
Do not infer actual HTTP readiness from a running process or a log message.

The scratch images contain no HTTP client or shell. No compliant HTTP verifier
is packaged here; actual container HTTP readiness is NOT VERIFIED by this
procedure. Host HTTP access is intentionally unavailable. Do not publish a port,
attach another network, mount tooling or add a privileged debugger to work around
this limitation. The image also intentionally has no Docker healthcheck.

Gracefully stop the app and inspect its exit code and shutdown logs:

```sh
docker compose -p nexora -f dev/nexora/compose.yaml stop -t 15 app
```

Expected evidence is a bounded SIGTERM shutdown, completion log and exit 0. This
establishes process lifecycle, not domain-work termination or durable recovery.

Run the demo explicitly, using a unique run-owned container name:

```sh
docker compose -p nexora -f dev/nexora/compose.yaml --profile demo run --no-deps --pull never --name nexora-c71-demo-all runtime-demo --scenario=all
docker compose -p nexora -f dev/nexora/compose.yaml --profile demo run --no-deps --pull never --name nexora-c71-demo-coordinate runtime-demo --scenario=coordinate
```

All previous arguments, including no arguments, retain their existing semantics.
Compare stdout with the native executable's output from the same source, repeat
to verify determinism, and verify exit 0 plus effective isolation for each run.
These are local synthetic value preparations, not operational queue admission,
authoritative commits or Workflow execution.

Retain only run-created images, stopped containers and external build artifacts
when needed for inspection; record their names/IDs. Cleanup requires explicit
ownership checks and authorization. No pruning or global cleanup is permitted.
Never remove or modify C3/C4 resources or external credentials.

D02 remains NOT ACCEPTED; normative obligations REVIEW ONLY; O1–O5 and
GO-2026-5932 OPEN. Operational Run creation, admission and persistence remain
BLOCKED. ADR-012's planned service topology is not implementation authorization.

## Later owner-approved local grouping

The separate [database test profile](README.database.md) adds an opt-in `db-test`
service to this same `nexora` Compose project. It preserves the base configuration
above and does not connect the application to a database or enable operations.
Historical C3/C4 resources remain inspection-only; no automatic cleanup/adoption.
