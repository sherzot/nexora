# Local NEXORA database test profile

The owner-approved consolidation uses the existing Compose project `nexora`.
`compose.database.yaml` adds one opt-in service, `db-test`, without changing the
base app configuration. No additional runner container is needed: the pinned
image already contains the local PostgreSQL client. This is a disconnected
synthetic database experiment, not operational NEXORA persistence or an agent.

## Boundaries

- Base `app` and `runtime-demo` definitions remain unchanged. Default startup does
  not start PostgreSQL. Always target `db-test` explicitly.
- The exact retained Linux ARM64 image is used by immutable ID; pulls/builds and
  mutable-tag substitution are disabled.
- `network_mode: none`, no published ports, non-root PostgreSQL user, read-only
  root, all capabilities dropped, no-new-privileges, 1 CPU, 512 MiB memory/no extra
  swap, 128 PIDs. These are container controls, not hostile-code isolation.
- Only the current R0 experiment volume `nexora-r0-d5-preflight-data` is mounted.
  It must already exist and contain the verified initialized PostgreSQL17 cluster
  with local peer auth and host rejection. Missing volume/cluster must fail;
  there is no initialization, credential generation or automatic migration.
- `nocopy` avoids image data population. There are no repository/home/secret or
  Docker-socket mounts. Temporary files use a bounded tmpfs.
- The old standalone R0 preflight container must remain stopped to avoid two
  PostgreSQL processes sharing the data directory. Do not restart it or launch
  another replica. Validate image/volume identity and ownership before startup.
- Health uses pg_isready instead of parsing stdout/stderr logs. Actual settings
  and SQL tests must still be checked independently.

## Commands

From the repository root, after explicit local provisioning/test authorization:

```sh
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.database.yaml config
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.database.yaml --profile db-test config
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.database.yaml --profile db-test up -d --no-deps --no-recreate --no-build --pull never --wait --wait-timeout 30 db-test
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.database.yaml --profile db-test exec -T --user postgres db-test psql -X -h /tmp -U postgres -d postgres -c 'SELECT version();'
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.database.yaml --profile db-test stop -t 10 db-test
```

If the existing app was launched from another checkout, inspect its Compose
config labels and use that unchanged canonical base file as the first `-f`, with
this profile file as the second. Confirm effective app config is byte-for-byte
unchanged and retain the running app's ID/start timestamp before/after. Never
issue an unqualified `up` or recreate the app to add this profile.

Do not use `down`, `rm`, `--remove-orphans`, `--renew-anon-volumes`, `--force-recreate`,
pruning or data-directory cleanup. Stop only the explicitly targeted test service.
Preserve container, volume, SQL fixtures and evidence after testing.

## Docker Desktop grouping and historical resources

The new service is labeled by Compose under project `nexora`, beside `app`.
Historical C3/C4 projects and the standalone R0 preflight container retain their
old labels and remain stopped. Existing containers cannot be adopted into another
Compose project by renaming them. Removing/recreating historical resources needs
separate explicit approval and preserved evidence; this profile performs neither.
Future active local work should reuse this managed test service, not create a
new standalone container/runner for each test. The retained volume is experiment
storage, not a production database or recovery guarantee.

## Verification scope

Read-only configuration resolution must show that disabled-profile configuration
is identical to the existing base, and enabling the profile adds only db-test.
Inspect the actual created container's image, project/service labels, network,
ports, mounts, resources, effective user/capabilities and no-new-privileges.
Use actual SQL to check server version, disabled TCP, peer/reject auth and enabled
fsync/synchronous_commit/full_page_writes. No external access is enabled.

The associated synthetic D5 experiment exercises separate NOLOGIN owner roles,
source locks, duplicate/conflicting tokens, source revocation ordering, mandatory
evidence rollback, controlled response suppression and a creation-counter limit.
Its trusted test coordinator is not production authentication or authorization.
It does not prove complete canonical intent validation, byte-retention limits,
crash/restore recovery, actual unknown-commit reconciliation, human Approval,
provider suitability or end-to-end operational Run admission. D02 NOT ACCEPTED,
normative REVIEW ONLY, O1–O5 and GO-2026-5932 OPEN remain unchanged.
