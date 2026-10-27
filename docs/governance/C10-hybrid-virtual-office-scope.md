# C10 — Hybrid Virtual Office Development Scope

## Status and purpose

OWNER-APPROVED RECONCILIATION — the project owner explicitly authorized the local documentation implementation of this C10 scope record and its narrow AGENTS.md cross-reference in C10.14B2. Repository publication was separately authorized in C10.14B5;
PR review acceptance, merge and deployment remain separately gated.

C10.14B3 authorized local implementation and recorded the C10.14B2 approval.
C10.14B5 separately authorized publication. This record is committed on
feat/c10-hybrid-virtual-office in
922f0551dce4edbf257f265c92a6147be79e68f2 and included in PR #15;
it is not merged into main. Merge and deployment remain separately gated.

This record documents the separately authorized C10 synthetic frontend
slice and reconciles it with the historical Phase 4 scope recorded in
AGENTS.md. It is not an ADR, permanent frontend architecture decision,
security waiver, merge authorization or deployment authorization.

The [Development Constitution](../../DEVELOPMENT_CONSTITUTION.md) remains
the highest project governance authority. Accepted ADRs and unrelated
subsystem restrictions remain binding.

## Historical authority evidence

The following explicit project-owner instructions are retained in the
project conversation:

- C10.6 — Controlled Offline Frontend Dependency Installation:
  dependency preparation, approved manifest/lockfile creation, graph
  verification and script-disabled offline installation only.
- C10.7 — Hybrid Virtual Office Frontend Foundation Implementation,
  followed by the Narrow Manifest Amendment & Source Implementation
  Resume: bounded synthetic frontend source and reviewed npm scripts.
- C10.10C — Repository-Local Guarded Build Implementation:
  the wrapper, native preload guard and mocked regression tests.
- Subsequent C10 verification gates: separately bounded typecheck,
  fixture verification, sandbox preflight, guarded production builds,
  local browser verification and fresh committed-source reproduction.
- C10.11B/C: separately authorized initial commit and feature-branch
  publication for PR #15.
- C10.13D1–D4: SEC-01 process.execve interception, DOC-01 correction,
  independent review, compatibility verification and correction publication.

Retained source identifiers for the original attached instructions:

- C10.6: attachment 92eab3ac-15ce-422c-8041-070edb3a8b12.
- C10.7: attachment af27fb2d-475e-4b58-ae11-733a2a426c16.
- C10.10C: attachment 86eeea54-0b4a-4d6c-ace0-6fb0595f8083.

These identifiers reference retained conversation evidence; they are not
independently accessible GitHub evidence links or repository-hosted evidence
files. No approval date or signature is inferred.

The recorded implementation comprises commits
17cbacf6abf037c3f0363aaaa51ac95f5dd443a6 and
682bf3dad7670c8f1ece65836a98cb443ebc1c37 on
feat/c10-hybrid-virtual-office, with 29 frontend files under
web/virtual-office/.

## Authorized development scope

The slice is a client-only, synthetic-data demonstration using React,
TypeScript, Vite and an original SVG/CSS office renderer.

Exactly six mock-only views are included:

1. Virtual Office.
2. Agent Directory.
3. Agent Detail.
4. Task Board.
5. Activity Timeline.
6. Workspace.

Permitted interactions are navigation, search, filtering, synthetic agent
selection, inspector display, theme and reduced-motion preferences, and
resetting in-memory presentation state.

Fixtures use deterministic identifiers, ordering, timestamps, revision and
synthetic provenance. The persistent notice states:
“Demo workspace · Synthetic data · No operations performed”.

Presentation states do not establish Runtime state, authority or execution.

## Dependency exception

The six approved direct pins are:

| Classification | Package | Version |
| --- | --- | --- |
| Runtime | react | 19.2.4 |
| Runtime | react-dom | 19.2.4 |
| Development | typescript | 5.9.3 |
| Development | vite | 8.3.5 |
| Development | @types/react | 19.2.14 |
| Development | @types/react-dom | 19.2.3 |

The reviewed lockfile is version 3, with 47 package entries and 23
applicable installed packages for the tested macOS ARM64 environment.

Approved package-lock.json SHA-256:
9933f51002748b831cea99633ac66c66d0e7cfe20bdb464affc56344e0ebd4bc

The bounded offline installation used approved artifacts/cache inputs and:
npm ci --offline --ignore-scripts --no-audit --no-fund

This records completed authorization; it is not standing permission to
install, download, upgrade, resolve additional packages or mutate caches.
Installation approval does not grant native-code execution permission.

## License and provenance limits

C10.6 permitted unmodified Lightning CSS use under the reviewed MPL-2.0
disposition for bounded local development preparation.

Preserve applicable MIT, ISC, BSD, Apache-2.0 and MPL-2.0 notices and
reviewed Rolldown MIT attribution. The native binding archive's missing
license text was addressed through retained upstream provenance evidence.

No dependency-source modification, package-binary redistribution,
permanent legal acceptance or production dependency acceptance follows.
Portable delivery of the retained provenance/notice evidence remains
unresolved.

## Guarded-build restrictions

The verified environment is macOS ARM64 with Node 22.18.0 and npm 11.5.2.

The repository-local wrapper requires canonical local dependencies,
the approved lockfile and exact native identities. It uses a fixed Vite
entrypoint, sanitized child environment, macOS sandbox network denial,
isolated output and mandatory complete audit validation. No unsandboxed
fallback is permitted.

Only these reviewed native bindings may execute through this build path:

- @rolldown/binding-darwin-arm64@1.2.15.
- lightningcss-darwin-arm64@1.33.0.

Their exact canonical filenames and SHA-512 identities remain pinned in
scripts/native-guard.cjs. Exact fsevents@2.3.3 loading is denied before
execution and audited as the expected nonfatal denial. Unknown native
attempts, approved-load failures and prohibited process/worker operations
must fail closed.

Subprocess, worker and process.execve interception are JavaScript controls.
They do not establish OS-level process isolation or protection against
compromised bootstrap code, previously captured aliases or arbitrary
approved-native syscalls. The sandbox network policy also denies listeners;
that OS boundary is distinct from JavaScript interception.

New execution requires its own authorization; this record grants none.

## Historical verification and limitations

Retained evidence records:

- Standard local typecheck and 30-record fixture verification PASS.
- C10.13D3: 21 mocked guard tests PASS and one guarded npm build PASS.
- Approved native loads, expected fsevents denial and complete audit with
  final fatal status false.
- Five verified build outputs with identical three-asset hashes.
- C10.12B fresh committed-source Git archive reproduction PASS for
  17cbacf6abf037c3f0363aaaa51ac95f5dd443a6 using the approved offline cache.
- Historical Chrome loopback UI verification.

Fresh-export reproduction of post-correction commit
682bf3dad7670c8f1ece65836a98cb443ebc1c37 has not been verified.
Independent Git clone reproduction, portable offline-cache provisioning
and cross-platform reproduction remain unverified. Browser checks were
not repeated for the correction. Local evidence does not establish
GitHub CI success or production readiness.

## Explicit exclusions

This exception authorizes no:

- Go/backend contract changes or production API integration.
- Operational Run creation, admission, scheduling, dispatch or persistence.
- Agent or sandbox execution, MCP/tool invocation or real approvals.
- PostgreSQL, Temporal or Sophia integration.
- Authentication or authorization implementation.
- Telemetry, external runtime assets or service workers.
- New infrastructure or production deployment.
- Unrelated dependencies, native permissions or platform support.

## Relationship to historical scope and future decisions

Phase 4 restrictions remain the historical authorization for Phase 4 work.
The separately authorized C10 exception applies only to this recorded
synthetic frontend and does not broaden another subsystem's authority.

ADR-001's Go core/backend requirement remains unchanged. This bounded
frontend selection is not permanent acceptance of a frontend framework
or deployment architecture.

Any scope expansion requires explicit owner authorization and applicable
architecture, dependency, security and license review. An accepted ADR
conflict must follow the constitutional ADR change process.

Historical C10 implementation, verification and publication approvals
are distinct from C10.14B2/B3 approval of local reconciliation and
C10.14B5 approval of its commit and push. Those bounded publication
actions are complete. PR review approval, merge authorization and
production deployment authorization remain separate decisions;
this record grants none of them.

## Preserved governance

- D02: NOT ACCEPTED.
- Normative obligations: REVIEW ONLY.
- O1–O5: OPEN.
- GO-2026-5932: OPEN.
- Operational Run creation, admission, dispatch and persistence: BLOCKED.

GOV-01 remediation is committed and independently verified. Reviewer
acceptance and thread resolution remain pending; publication alone
does not close the thread.
