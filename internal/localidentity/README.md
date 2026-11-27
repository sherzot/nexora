# R0 D2 — Explicit local binding observations

This mechanism slice composes two explicitly supplied owner lookups:

1. Identity/Security maps an exact kernel-account tuple to an enabled provisioned
   operator/workload record and its positive revision.
2. The scope owner supplies an enabled operator/workload-to-organization/project
   relationship and its positive revision.

`Observer.Resolve` requires exact account equality and exact operator/workload
agreement across these records. There is no default tenant/admin, fallback to
another account, latest-version substitution, cache, persistence or provisioning.
Opaque references must be bounded nonblank UTF-8 without control characters or
surrounding whitespace; they are copied without normalization. Their namespace
and meaning remain the source owner's responsibility, not a universal identity
scheme invented here. Human display names are not converted into lookup keys.

`internal/platform/localidentity.Resolver.Observe` accepts a connected Unix stream,
not UID/operator/project arguments from a request body. It calls `localpeer.Read`
and only then invokes the owner-composition module. The platform adapter cannot
consume a client payload or choose a project from it. Context cancellation checks
prevent a successful observation after a noticed cancellation between source
calls. Sources must honor the caller context; this code cannot terminate an
uncooperative source or provide an independent deadline for it.

## What the result means

The immutable observation contains the exact account, operator/workload and scope
references and both source revisions observed. It is ordinary evidence data,
**not an authenticated principal, bearer credential, current permission,
Approval, admission decision or operational Run**. JSON marshal/unmarshal reject:
there is no persistence or request-body reconstruction contract for this value.
Zero-valued observations never signify a successful resolution.

Sequential source observations do not establish atomic freshness or revocation
at a later acceptance point. Every invocation calls sources again, but lack of a
cache alone is not the D5 consistency protocol. A previous observation remains
historical data even after its sources are disabled. The source records and
platform mechanism do not authenticate which human or executable currently
holds a socket descriptor, nor prove tenant isolation or delegation.

No real operator, workload, organization or project is provisioned by this code.
No production lookup implementation, database/credential/registry, listener,
HTTP/CLI endpoint, model provider, Tool, Workflow or Runtime is wired here. No
binding is inferred from the developer's account name, model output, conversation
permissions, root UID or C27 CSRF token. Real account-to-operator/workload source
provenance and current read/action policy still require the separately reviewed
R0 owner contracts. Test fixture IDs are not real configured NEXORA identities.

Missing/disabled/mismatched bindings deny before a successful observation.
Identity denial occurs before scope lookup. Unknown source errors/malformed
owner evidence return unavailable without leaking raw errors or lookup data.
The public core method takes asserted Account data as an internal dependency
boundary; an untrusted transport must not call it with user-selected values.
Use the kernel-reading platform adapter with trusted composition dependencies.
Lookups are never provided or replaced by client/model instructions.

## Ownership and verification

The inward `internal/localidentity` package owns only composition/validation of
owner projections, with no platform dependency. The platform resolver depends
narrowly on that consumer and the existing `localpeer` mechanism. Existing domain
owners do not acquire any new dependency or permission. No Shared Kernel or
identity database is introduced. No third-party dependency is added.

With the existing Go1.27.1 toolchain in offline/readonly module mode:

```sh
go test -count=1 ./internal/localidentity ./internal/platform/localidentity ./internal/platform/localpeer ./internal/architecture
go test -race -count=1 ./internal/localidentity ./internal/platform/localidentity ./internal/platform/localpeer ./internal/architecture
go vet ./...
go test ./...
```

Unit tests use controlled owner fixtures; they do not verify a real registry,
policy service or durable revocation. The Darwin ARM64 integration test uses a
real same-process/same-account socket and fake owner projections. It checks that
forged payload values are untouched, kernel identity reaches the first lookup,
scope comes from its owner fixture, a newly disabled source denies and a closed
socket cannot reach sources. No cross-user/process attestation is claimed.
Private temporary socket artifacts are retained; descriptors/listeners close.
Unsupported OS/architecture combinations remain fail-closed through localpeer.
A cross-compiled test binary is not execution evidence on that target.

ADR-014 remains conditional; the separate ADR-015 draft is not accepted or changed
by these library tests. D02 NOT ACCEPTED, normative REVIEW ONLY, O1–O5 and
GO-2026-5932 OPEN, historical forensic/PR29 P1 restrictions unchanged. Production
Run creation/admission/dispatch/persistence and deployment are not enabled.
