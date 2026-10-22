# Isolated local PostgreSQL smoke harness

Development-only PostgreSQL SQL exercise. This is not an application database,
Run persistence, operational creation, an authoritative repository, Audit custody,
a durability/restart test, or a recovery protocol. It adds no Go dependencies.
D02 is not accepted; reviewed source semantics are not promoted by this harness.
O1–O5 remain open. SQL success does not establish a Run.

## Fixed boundary and prerequisites

- Docker daemon through a local Unix-socket context; Docker Compose plugin
  (`docker compose`, not standalone `docker-compose`) with `--wait` and
  `--wait-timeout`, Python 3.9+, and a POSIX shell.
- Project `nexora-c3-postgres`, service `postgres`, database/user `nexora_c3`.
- Only image
  `docker.io/library/postgres:17.11-bookworm@sha256:858bb5e98eed02eb8cafbcdc007f9a65d1b613972028944a8ec2133ccaf80d27`.
  The digest pins the multi-platform index; host architecture selects its image.
- `network_mode: none`, no published ports, no external networks, no Docker socket.
  The container-local client connects to `127.0.0.1:5432` using a password.
- Data uses a 256 MiB tmpfs at `/var/lib/postgresql/data`; no persistent or anonymous
  data volume. Temporary SQL tables disappear when their client session ends.
  Container stop loses the tmpfs database. This is deliberately not durable.
- No automatic cleanup, replacement, container removal or volume deletion.
  Inspect any pre-existing C3 project before startup; STOP on a mismatch. Do not
  run these commands against a project created by another checkout or owner.

## Credentials

Set `NEXORA_C3_PASSWORD_FILE` to an absolute path to a private regular file outside
this repository, owned by you, with no group/other permissions (for example 0600).
Do not use a symlink. The file must contain a nonempty local-only password of at
most 4096 bytes. A single line of randomly generated ASCII without a trailing
newline is recommended. Supply it through a local secret manager or create it
outside the repository with restrictive permissions; do not put the password in
shell history, command arguments, `.env`, logs, or this repository.

Compose mounts the file read-only at `/run/secrets/postgres_password` and passes
only `POSTGRES_PASSWORD_FILE` to the image. The client reads that file inside the
container into its scoped process environment. Never enable shell tracing.
Docker administrators and privileged container processes can access these
credentials; Compose file-backed secrets are not a production secret vault.
The image initialization user is a superuser, restricted here to the synthetic,
network-isolated disposable database. This is not application authorization.
Changing the file does not rotate a running database password; do not silently
recreate or repair a credential mismatch.

## Explicit lifecycle (from repository root)

Unset inherited `COMPOSE_*`, `DOCKER_HOST`, `DOCKER_CONTEXT`, `DOCKER_TLS_VERIFY`
and `DOCKER_CERT_PATH` overrides. Confirm `docker context inspect` identifies a
local Unix socket. The smoke script rejects endpoint overrides, strips Compose
and libpq overrides, and always supplies its fixed Compose file and project.
Inspect existing project resources before startup and stop on conflicts:

```sh
docker ps -a --filter label=com.docker.compose.project=nexora-c3-postgres
```

Image pull is an explicit operation requiring authorization; no other image or
mutable-tag substitution is permitted:

```sh
docker pull docker.io/library/postgres:17.11-bookworm@sha256:858bb5e98eed02eb8cafbcdc007f9a65d1b613972028944a8ec2133ccaf80d27
```

Start only after validating the external credential file and absence of conflicts:

```sh
docker compose --env-file /dev/null -p nexora-c3-postgres -f dev/postgres/compose.yaml \
  up --detach --wait --wait-timeout 60 --pull never postgres
```

Readiness is limited to 60 seconds once Compose starts waiting; this is not a
hard timeout for a hung Docker daemon. Use a bounded host Python subprocess
watchdog around lifecycle commands when verifying automated startup/stop.
Readiness uses `pg_isready`; successful smoke SQL separately proves client access.

```sh
sh dev/postgres/smoke.sh
```

The script accepts no arguments or remote DSN. It inspects the sole dedicated
container before SQL: exact image/config path, service, tmpfs, read-only secret,
network mode, and absence of published ports or extra mounts. Raw infrastructure
and libpq diagnostics are not echoed, avoiding accidental credential disclosure.

Explicit stop (never automatic):

```sh
docker compose --env-file /dev/null -p nexora-c3-postgres -f dev/postgres/compose.yaml \
  stop --timeout 10 postgres
```

Do not run `down`, prune, volume deletion or unrelated resource cleanup. Stopped
containers are left for inspection. No trap starts, stops or removes resources.

## Assertions and failure classification

A successful run performs actual SQL with `psql -X -w -qAt`, fixed loopback target,
`ON_ERROR_STOP=1` and script input via `-f -`:

1. Require exact scalar `SELECT 1` output.
2. Insert 11 and 22 into a session-local temporary table; assert exact values.
3. Begin a transaction, insert 33, assert its presence, roll back, and assert the
   original 11/22 contents remain exactly.
4. Assert no non-system application tables exist.
5. In a separate session, execute division by zero followed by a sentinel query.
   Require psql exit 3, SQLSTATE 22012 and no sentinel output. A connection failure
   cannot satisfy this expected SQL failure check.

Client connection timeout is 3 seconds; statement timeout 5 seconds; lock timeout
2 seconds; idle transaction timeout 5 seconds. A Python watchdog bounds all smoke
Docker calls together to 30 seconds. On expiry it kills its local client process
group; this does not prove server-side termination. Server-side timeouts provide
separate SQL limits. No uncertain-write or recovery behavior is implemented.

Smoke exit codes: 0 = all assertions including the expected SQL failure verified;
2 = infrastructure/prerequisite/configuration failure; 3 = SQL assertion failure;
64 = unsupported arguments; 124 = client watchdog expiry. Expected psql exit 3 is
reported explicitly while the overall successful harness exits 0.

Run smoke twice while the service is running to verify repeatability without
application tables. After explicitly stopping the service, run smoke again:
require nonzero infrastructure exit 2 within 30 seconds, with no PASS marker.
This is a distinct negative verification; the script never stops the database to
manufacture unavailability. No SQL failure is claimed when the service is absent.

Use `docker inspect` on only the dedicated service container to confirm `HostConfig.Tmpfs` specifies the data
mount (Docker may omit tmpfs from `Mounts`), no mount type is `volume`, network mode is `none`, and no
host ports are bound. The script also verifies the live mount in `/proc/mounts`.
Filter inspection output; do not dump credentials or logs.
Go source, Runtime contracts, production health checks and architecture fitness
rules remain unchanged; verify the existing Go suite independently.
