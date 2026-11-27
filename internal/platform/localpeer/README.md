# R0 D1 — Kernel peer-account facts

`localpeer.Read(*net.UnixConn)` reads kernel UID/GID facts from an already
connected Unix **stream** socket. It does not open listeners, read a payload,
access repository/configuration files, execute commands, persist state or call
any provider. No executable or operational endpoint is added by this package.

This is the next mechanism slice after the owner-approved R0 feasibility work.
The actual local diagnostic verified Darwin's peer credentials using both the
system-library interface and Go getsockopt. Only **Darwin ARM64** is enabled;
other OS/architecture combinations return ErrUnsupported, with no fallback.
Nil/invalid or datagram connections reject. A closed connection, kernel error,
unknown credential version, unexpected struct size or invalid group count
returns no facts and ErrUnavailable (or ErrConnection when no valid stream
exists). Callers must always check the error: UID/GID zero can be real OS facts.

## Boundary and limitations

- UID/GID are account facts, not a NEXORA principal, workload identity, delegation,
  trusted tenant/project scope, current authorization, Approval or Run admission.
- No UID, including root, is granted permission. No configured account match or
  actor lookup occurs here. Public Credentials values are ordinary data and must
  never be accepted from a caller as an authenticated context.
- Peer credentials do not attest a human or binary, the currently writing
  process, current memberships, revocation or descriptor-passing behavior. Those
  are separate admission/threat-model responsibilities, still unimplemented.
- The caller controls socket creation, private directory permissions, peer
  lifecycle, deadlines and closure. Reading credentials does not establish a
  trustworthy listener or an OS sandbox. Host/root compromise is not contained.
- The Darwin ARM64 adapter is a narrowly contained unsafe/syscall mechanism:
  SOL_LOCAL=0, LOCAL_PEERCRED=1, xucred v0,76bytes, up to16 advisory groups,
  as declared by the platform SDK. RawConn.Control protects the descriptor while
  the syscall runs. Returned metadata is checked before exposing raw facts.
  No unsafe mechanism is added to existing Runtime or other owner packages.
- No data is consumed and no credential result is cached. A claimed UID/role
  inside the socket payload cannot replace the kernel values returned here.

## Verification

Use the existing approved Go1.27.1 toolchain, offline module mode; no installation:

```sh
GOTOOLCHAIN=local GOPROXY=off GOFLAGS=-mod=readonly go test -count=1 ./internal/platform/localpeer ./internal/architecture
GOTOOLCHAIN=local GOPROXY=off GOFLAGS=-mod=readonly go test -race -count=1 ./internal/platform/localpeer
GOTOOLCHAIN=local GOPROXY=off GOFLAGS=-mod=readonly go test -gcflags=all=-d=checkptr=2 ./internal/platform/localpeer
```

Tests cover actual stream credentials, untrusted payload preservation, closed and
invalid descriptors, unsupported layout rejection, unconnected datagrams and
concurrent reads. The real-socket tests use same-process/same-account connections;
this is not proof of cross-user isolation or descriptor-transfer safety. Mocked
kernel structures check parser rejection, not a different real OS ABI.

Tests intentionally retain private temporary socket directories/files for
inspection; descriptors/listeners are closed and no process remains running.
Unsupported-target cross-compilation can verify the fail-closed build path, but
must not be reported as execution on that target.

No dependency, model pin, PostgreSQL privilege/schema, existing domain API or
operational gate is changed. ADR-014 direction remains feasibility gated; ADR-015
is a separate draft. D02 NOT ACCEPTED; normative REVIEW ONLY; O1–O5 and
GO-2026-5932 OPEN; historical restrictions unchanged. This module does not enable
an Agent/Run, Tool, Workflow, persistence, model dispatch or deployment.
