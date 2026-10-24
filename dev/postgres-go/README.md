# C4 isolated PostgreSQL integration fixture

Development only. Fixed SELECT 1 checks technical connectivity, not operational
Run creation, authorization, durability, queue admission or recovery. No schema
or migration is installed. C3 and the loopback-only public probe API are unchanged.

Both services reuse the approved cached PostgreSQL image by digest, with pulls
forbidden. PostgreSQL listens only on 127.0.0.1 inside its own network namespace.
The opt-in runner joins that namespace using network_mode: service:postgres.
No host ports are published. The dedicated bridge remains internal: true.

Prepare outside the repository, without printing credential contents:

- A random dedicated password file, mode 0600, owned by the non-root runner UID.
- An executable test binary and writable isolated build cache.
- NEXORA_C4_PASSWORD_FILE, NEXORA_C4_TEST_BINARY, NEXORA_C4_UID and NEXORA_C4_GID.

Using the verified isolated Go 1.27.3 toolchain with explicit GOROOT,
GOTOOLCHAIN=local, GOPROXY=off and GOFLAGS=-mod=readonly:

```sh
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 "$GOROOT/bin/go" list -deps -test -json ./...
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 "$GOROOT/bin/go" test -c -o "$NEXORA_C4_TEST_BINARY" ./internal/platform/postgrescheck
```

Require complete package loading with no OpenPGP prefix, no downloads, and no
module-file change. Record the binary hash and confirm Linux ARM64 format.

Start only PostgreSQL, refusing existing conflicting C4 resources:

```sh
docker compose -f dev/postgres-go/compose.yaml up -d --pull never --wait --wait-timeout 60 postgres
docker compose -f dev/postgres-go/compose.yaml --profile integration run -d --no-deps --pull never --name nexora-c4-postgres-runner runner
```

The runner waits up to 20 seconds without reading its secret or connecting.
Before releasing its gate, inspect both containers and the network:

- Exact project, service and approved image identity; no privilege or Docker socket.
- No published ports, one internal bridge, no extra network attachments.
- Runner HostConfig.NetworkMode names the inspected PostgreSQL container;
  /proc/self/ns/net is identical in both containers.
- PostgreSQL SHOW data_directory matches PGDATA; inspect HostConfig.Tmpfs,
  Mounts and /proc/self/mountinfo. The longest matching live mount must be tmpfs.
- No persistent or anonymous volumes in either container. The runner's separate
  data-path tmpfs only overrides the image VOLUME; it proves nothing about the
  PostgreSQL container's PGDATA.
- Runner is non-root, read-only, drops all capabilities, has no-new-privileges,
  and can read its private, read-only credential. Only the binary and credential
  are host-file mounts. Inspect routes and namespace membership for extra paths.

Only then release the gate and collect the runner exit code and logs:

```sh
docker exec nexora-c4-postgres-runner touch /tmp/c4-verified
docker wait nexora-c4-postgres-runner
docker logs nexora-c4-postgres-runner
```

Tests cover real SELECT 1, invalid credentials, pre-cancellation, expired deadline,
unavailable loopback endpoint and independent server-session observation. These
are not in-flight timeout/cancellation tests. Protocol-fixture unit tests cover
in-flight cancellation separately. Client cleanup does not prove server rollback.
The session observation reports only this fixture at its observation point.

On completion or failure, stop and remove only recorded containers and the empty
network created by that run. Remove that run's external credential. Never delete
pre-existing resources or unexpected volumes; report unexpected volume identities
and stop for disposition. No automatic cleanup is performed by the test binary.

GO-2026-5932 remains OPEN. Recheck package exclusion for changed dependencies,
imports, targets or tags. Trusted Docker administrators can enter namespaces;
this fixture is not a boundary against the host operator.
