# C11 dependency integration and renderer readiness

## Status and authority

RECORDED BOUNDED AUTHORIZATION — synthetic C11-M1 implementation owner-authorized.

This record describes completed dependency work and the current documentation
and verification scope. It does not accept an ADR, broaden the C10 exception,
grant standing package execution permission, approve the PR or authorize merge.
The Development Constitution and Accepted ADRs retain precedence.

Authority comes from explicit project-owner instructions retained in the project
conversation, not from this document's existence:

- C11.3H authorized exactly four local manifest/lockfile/hash-pin edits. Its
  retained instruction is attachment `a6d6c070-c320-4722-a56d-f9c4fe1b9e6f`.
- The subsequent installation and verification gates had their own bounded
  permissions; their historical outcomes below are not standing permission.
- “NEXORA — CONSOLIDATED OWNER-AUTHORIZED EXECUTION” authorized finalizing the
  external publication assurance decision, one exact-four-file commit and one
  non-force push, with source/Git-object and side-effect verification.
- “NEXORA — GOV-01 REMEDIATION & C11 RENDERER READINESS” authorizes the present
  bounded remediation, factual documentation, renderer design and verification
  where safe. It expressly keeps renderer implementation paused while NO-GO.

These are retained conversation references, not GitHub-hosted signed approval
artifacts. No signature or approval date is inferred. The external publication
decision's SHA-256 is
`bc9cf928209979d3c74e881d78cb55ba6fb9a58f90118794766b482a017c9d25`;
its verification receipt was read back before publication. That publication-only
decision does not accept missing forensic evidence or authorize renderer work.
The later owner instruction “COMPLETE PENDING PRs AND IMPLEMENT C11-M1 3D
VIRTUAL OFFICE” (retained attachment a6789011-b453-45d5-80d4-1b1f101d007c)
separately authorizes procedural Three.js geometry, eight fixture-owned markers,
bounded orbit/pan/zoom, React inspector selection, SVG fallback, cleanup, tests,
verified guarded builds/browser checks and feature-branch publication. It adds no
dependency, physics/WASM/worker/addon, remote asset, operational or deployment
permission. PR merge remains conditional on review and protection requirements.

## Published dependency scope

Commit `10f728e5441f660256caae5aee8de5f12bd2d841`, parent
`38d98b8d3b6f78cc9a7259f3e68c64a02caf43cb`, published only:

- `web/virtual-office/package.json`
- `web/virtual-office/package-lock.json`
- `web/virtual-office/scripts/guarded-build.cjs`
- `web/virtual-office/tests/native-guard.test.cjs`

The new direct pins are runtime `three@0.186.1` and development
`@types/three@0.186.0`. The latter's six locked transitive additions are:

| Package | Version | Installation does not authorize |
| --- | --- | --- |
| fflate | 0.8.3 | Compression workers or arbitrary runtime use |
| @types/webxr | 0.5.24 | XR session/device access |
| meshoptimizer | 1.1.1 | WASM, decoders or workers |
| @types/stats.js | 0.17.4 | New runtime instrumentation |
| @tweenjs/tween.js | 23.1.3 | A new animation/runtime dependency |
| @dimforge/rapier3d-compat | 0.12.0 | Physics or WASM execution |

The six existing C10 direct pins remain React/React DOM 19.2.4, TypeScript 5.9.3,
Vite 8.3.5, @types/react 19.2.14 and @types/react-dom 19.2.3. The v3 lockfile has
55 non-root records: all 47 C10 records are unchanged, with eight C11 additions.

Current package.json SHA-256:
`38a0b887bfd14e895b3e0787d25efcf4bebe0ff65b88c86e09072fca8a99233a`

Current package-lock.json SHA-256:
`304c48feb9c924a28aa7051bede55af07500e53e96b8a80f3a7d26fe363ccaf2`

The wrapper/test changes only align that lockfile hash. Native policy is unchanged:
the exact reviewed Rolldown ARM64 1.2.15 and Lightning CSS ARM64 1.33.0 bindings
are the only build-addon allowances. Exact fsevents denial remains nonfatal;
unexpected attempts and approved-load failures remain fatal. JavaScript hooks
are not OS process isolation. No native allowance extends to browser features.

No Three.js runtime import, renderer, backend integration or operational agent
capability has been added. Dependency approval does not authorize addons,
examples, loaders, remote assets, XR, physics, WASM, workers or additional pins.
Retained license inventory records MIT for seven added packages and Apache-2.0
for Rapier; bundled notice completeness and future redistribution remain separate
review concerns. Preserve all applicable notices; no redistribution clearance is
established here.

## GOV-01 disposition

The original P1 finding asked for recorded human frontend/dependency authorization
and reconciliation with AGENTS.md's historical Phase 4 restriction. C10 commits
`922f0551dce4edbf257f265c92a6147be79e68f2` and
`38d98b8d3b6f78cc9a7259f3e68c64a02caf43cb` supply the C10 reconciliation and
publication-status correction. The existing owner reply requests reassessment.

The thread `PRRT_kwDOVAIfj86woDii` remains unresolved. No reviewer acceptance is
claimed. The present C11 record and narrow AGENTS cross-reference address the
new dependency publication's documentation gap locally; they must not be described
as committed/published or reviewer-accepted until those events occur. There is
no permission to resolve the thread automatically.

## Verification and remaining uncertainty

Historical outcomes remain: C11.3H, C11.3I-E2 and C11.3J2 PASS; C11.3J3 BLOCKED;
D3 BLOCKED; D4 COMPLETE; D5 BLOCKED; D6 NO VIABLE ISOLATION DESIGN; D7-R REVIEW
COMPLETE; D8-P SPECIFICATION COMPLETE — DRAFT NOT APPROVED; G1 BLOCKED;
G1-D1 COMPLETE; G1-D2 and A1 BLOCKED; A2 NO VERIFIED COPIES FOUND. None is
retrospectively changed by a later source-only check or publication.

In the current readiness assessment, all 132 installed TypeScript 5.9.3 files
(23,625,066 bytes) matched the archive's lockfile-pinned SHA-512 and regular-file
inventory. No extraction, installation or cache mutation was performed. Using
Node 22.18.0 with `--no-addons` and an OS sandbox profile denying network,
file writes and subprocess creation, direct commands returned:

| Command from web/virtual-office | Result |
| --- | --- |
| `node --no-addons tests/native-guard.test.cjs` | Exit 0; 21/21 mocked tests |
| `node --no-addons node_modules/typescript/bin/tsc --noEmit` | Exit 0; no diagnostics |
| `node --no-addons tests/fixture-integrity.mjs` | Exit 0; 30 synthetic records |

All stderr streams were empty. No real addon, browser, worker or process-replacement
probe ran. These checks do not verify rendering behavior or future Three.js API
integration. A production build was not run: full current build-tool payload
provenance was not independently re-established, and documentation changes do not
require extending native execution. No bypass or new dependency is proposed.

Missing G1-D1/G1-D2 manifests, missing expected Rapier source, UNKNOWN complete
31-archive availability, historical 125 cache differences and ten additional
differences remain unresolved. A2's negative finding is limited to its recorded
search locations. Actors and causes remain UNKNOWN. Current source checks do not
certify global cache health, recovery integrity or independent-clone reproduction.
Browser evidence remains historical; GitHub CI success is not established here.

## Renderer decision

The [renderer plan](../architecture/C11-virtual-office-renderer-plan.md) preserves
its earlier proposed design. The subsequent owner instruction grants bounded
implementation GO for C11-M1 orbit/pan/zoom, not first-person/pointer-lock behavior.
The renderer must preserve fixtures, React state, SVG/HTML fallback and all
security exclusions. Reviewer disposition of GOV-01, eligible PR merge and
production deployment remain separate states; deployment is not authorized.

D02 NOT ACCEPTED. Normative obligations REVIEW ONLY. O1–O5 OPEN.
GO-2026-5932 OPEN. Operational Run creation/admission/dispatch/persistence BLOCKED.
