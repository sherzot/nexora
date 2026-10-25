# C7.2 opt-in host HTTP access

This development-only HTTP skeleton reuses the existing C7.1 image. Build it
using README.md first if absent; do not pull or replace images as part of this
procedure. C3/C4 fixtures remain independent. Operational Run creation,
admission, dispatch and persistence are not enabled.

The default `app` retains network_mode: none and container-local listening.
`app-host` is opt-in through profile `host`: it listens on container interfaces
and publishes one dynamically assigned IPv4 port on host 127.0.0.1 only.
Its dedicated bridge permits outbound networking. Loopback publication does
not block egress or provide authentication. Docker administrators and peers
explicitly attached to the bridge can access the listener; do not attach other
containers. No LAN/public publication is intended. This is not production
packaging or operational backend readiness.

From the repository root, inspect ownership and stop on any existing app-host
or host_access network collision. Preserve the base app and unrelated projects.
Validate the configuration and start only the opt-in service:

```sh
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.host.yaml --profile host config
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.host.yaml --profile host up -d --no-deps --no-build --pull never app-host
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.host.yaml --profile host port app-host 8080
```

Record the exact created container/network IDs. Inspect actual bindings: only
127.0.0.1, TCP target 8080, no wildcard/IPv6 publication. Verify non-root
65532:65532, read-only root, ALL capabilities dropped, no-new-privileges,
restart disabled, no mounts and only the dedicated bridge. Base app must retain
network_mode: none and no published ports.

Use the discovered port, not an assumed host port:

```sh
: "${NEXORA_C72_PORT:?Set to the discovered host port}"
curl --noproxy '*' --fail-with-body --max-time 5 -i "http://127.0.0.1:$NEXORA_C72_PORT/health/live"
curl --noproxy '*' --fail-with-body --max-time 5 -i "http://127.0.0.1:$NEXORA_C72_PORT/health/ready"
```

Expect HTTP 200 independently for each response, with JSON bodies
`{"status":"live"}` and `{"status":"ready"}` respectively. Readiness covers
only the local HTTP skeleton. Test an appropriate LAN-facing host IP separately;
a failed connection is limited evidence, not universal topology isolation.

After verification, gracefully stop and remove only app-host:

```sh
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.host.yaml --profile host stop app-host
docker compose -p nexora -f dev/nexora/compose.yaml -f dev/nexora/compose.host.yaml --profile host rm app-host
```

Inspect the recorded network ID and confirm project nexora, logical network
host_access, and zero attached containers before `docker network rm` with that
exact ID. Never use broad compose down, force removal, volume/image removal or
pruning. Preserve all pre-existing resources and images.

D02 remains NOT ACCEPTED; normative obligations REVIEW ONLY; O1–O5 and
GO-2026-5932 OPEN. No governance decision is changed by this configuration.
