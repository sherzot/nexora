# NEXORA Hybrid Virtual Office — mock frontend foundation

Development-only mock UI. Every agent, room, task, workflow presentation,
activity and review label is synthetic. The persistent notice reads:
“Demo workspace · Synthetic data · No operations performed”.

## Views and local interactions

- Virtual Office: original SVG/CSS isometric rooms, desks and selectable agents;
  a corresponding HTML selection list and context inspector.
- Agent Directory: local search and role/room/display-status filters.
- Agent Detail: synthetic profile, linked tasks/activity and unknown-ID fallback.
- Task Board: four presentation columns and workflow/agent filters. Task links
  focus a single example; review labels are display-only, not approval decisions.
- Activity Timeline: fixed chronological UTC events and agent/task filters.
- Workspace: light/dark appearance, reduced-motion preference and local reset.

Hash navigation stays within the browser. Unknown routes have an explicit
fallback. State is in React memory only: reload/reset restores the fixed fixture.
There is no storage, random input, current-clock data, polling or live feed.
Task/agent labels are presentation vocabulary, not Runtime lifecycle states.

## Dependency and execution boundary

Exact direct pins: react 19.2.4, react-dom 19.2.4, typescript 5.9.3, vite 8.3.5,
@types/react 19.2.14 and @types/react-dom 19.2.3. No plugin, router, UI kit,
icon/font service, state library, WebGL or additional dependency is introduced.
The C10.6 lockfile is retained unchanged: lockfile v3, with 47 package entries.
Of these, 23 packages apply to the reviewed macOS ARM64 installation. C10.10D2-F1
materialized that previously verified installation into local, ignored
`node_modules` and compared every regular-file hash, permission and internal
symlink target. No installation or dependency resolution occurred during that copy.
The repository contains no dependency archives and does not populate dependencies
automatically.

Historical verification, with the unchanged application source:

- C10.8A-R1: strict TypeScript typecheck and 30-record fixture integrity PASS,
  using approved dependencies installed outside the repository.
- C10.8B-R1: guarded production build PASS; only the approved Rolldown and
  Lightning CSS ARM64 bindings loaded. Optional fsevents was denied.
- C10.9: Chrome loopback static preview PASS for the inspected interactions,
  desktop/mobile layouts and local-only asset requests. This was historical
  verification and was not repeated after the repository-local builds.
- C10.10D1: OS network/listener denial and JavaScript subprocess/worker
  interception verified with bounded non-native probes.
- C10.10D2-R1: two direct repository-local guarded builds PASS. Both produced
  identical artifacts, also byte-identical to C10.8B-R1. Each complete audit
  records two approved native loads, one expected fsevents denial and no fatal
  status. The fixed child ran through the audited macOS sandbox invocation.
- C10.10E-B: standard local `npm run typecheck` and `npm run test` PASS, with
  Node 22.18.0 and observed npm 11.5.2 on macOS ARM64. TypeScript resolved local
  React declarations without external mappings; all 30 fixture records passed.
  Both commands exited 0 with empty stderr, network denied and native addons
  disabled. npm 11.5.2 is the tested version, not a verified universal requirement.

The direct guarded-build command was `node scripts/guarded-build.cjs`. The complete
`npm run build` command was executed successfully under Node 22.18.0 / npm 11.5.2
on macOS ARM64 during C10.10E-C. It completed both `tsc --noEmit` and
`node scripts/guarded-build.cjs`, exiting 0 with no TypeScript diagnostics or
stderr. Fresh-checkout installation and clean-checkout reproducibility remain
unverified.
None of these results is a production-readiness or GitHub CI claim.
Do not execute installation, build or preview commands without separate owner
authorization and approved local dependency availability:

```sh
cd web/virtual-office
npm run typecheck
npm run test
node scripts/guarded-build.cjs
# Full combined command verified locally in C10.10E-C (Node 22.18.0 / npm 11.5.2, macOS ARM64):
# npm run build
# Dev-server and preview use require separate authorization:
# npm run dev
# npm run preview
```

The dev command binds 127.0.0.1:5173 with strict port selection. Preview binds
127.0.0.1:4173. There is no backend proxy; HMR is disabled. The HTML policy denies
connection APIs and remote resources. Future browser inspection must verify its
interaction with Vite's development client and CSS handling; static configuration
is not runtime evidence. Do not weaken it silently to make preview work.

## Guarded production build policy

Initial supported build environment: exact Node 22.18.0 on macOS ARM64.
The observed npm version for C10.10E-B standard local verification was 11.5.2.
Other platforms and Node versions fail before Vite execution; their native
binaries are not authorized by this policy. No package source is modified.
C10.6 previously verified isolated installation with the command form
`npm ci --offline --ignore-scripts --no-audit --no-fund`, using its separately
prepared, preapproved npm cache. This is not a fresh-checkout installation result.
A later authorized installation must explicitly select such a cache, for example
with `--cache "$APPROVED_NPM_CACHE"`, after verifying that the variable names an
existing approved cache. Lifecycle scripts remain disabled; no automatic cache
priming or artifact acquisition is provided here. Installation is script-disabled,
not covered by the build sandbox. Portable offline cache provisioning is still
undocumented and unverified. The unchanged lockfile includes other-platform
optional packages; their presence does not authorize native execution.

`npm run build` typechecks, then invokes `scripts/guarded-build.cjs`. The wrapper
requires local canonical `node_modules`, the reviewed lockfile, matching installed
package identities and exact native file hashes. External dependency aliases or
temporary compiler configurations are not used. It launches exactly one fixed
Node/Vite child through `/usr/bin/sandbox-exec`, denying OS network access. Missing
sandbox support, child failure or incomplete audit fails without an unsandboxed
retry. The Vite config loader is explicitly `native`; no dev server is started.

The child receives an allowlisted environment rather than inherited Node/native
loader overrides. The preload restricts ordinary `process.dlopen` calls to:

- `@rolldown/binding-darwin-arm64@1.2.15` and its reviewed binary SHA-512.
- `lightningcss-darwin-arm64@1.33.0` and its reviewed binary SHA-512.

The exact reviewed `fsevents@2.3.3` binary is denied before execution; Vite may
catch this expected optional denial and continue. Any other addon, changed binary
or mismatched identity is denied and makes the audit fail even if its exception
is caught. Native loads are audited before execution and after success. Approved
load failures and audit write failures cannot be reported as a successful build.

Additional child processes and JavaScript workers are intercepted by JavaScript
hooks; this is not an OS-level subprocess-isolation claim. The macOS sandbox
denies network connections and listeners. JavaScript network hooks supplement
that OS boundary; they are not its replacement. This is a
control for reviewed build dependencies, not a hostile-code sandbox. It does not
prove isolation from arbitrary approved-native syscalls, compromised bootstrap
code or concurrent filesystem tampering. Start from a trusted Node/npm environment;
child sanitization cannot undo code already run by an inherited parent preload.

Each invocation retains a separate `.verification/build-*/` directory containing
`command.json`, `native-audit.jsonl` and `dist/`. No repository-root `dist/` is
written and no previous output is automatically deleted. Only output accompanied
by a successful wrapper exit and complete audit is verified. Evidence is ignored
by Git and can contain local filesystem paths; do not publish it unreviewed.
The default `preview` script serves root `dist/`, not this isolated output: do not
use it to claim guarded-output verification. A separately authorized static
preview must explicitly serve the successful run's output on loopback.

Mock-only guard verification (no native loading, Vite, subprocess or network):

```sh
node --no-addons tests/native-guard.test.cjs
```

C10.10C and C10.10D1-F1 mocked guard checks and the C10.10D1 non-native preflight passed.
C10.10D2-R1 subsequently verified two real repository-local sandboxed builds.
No additional build or clean-checkout execution is authorized by those results.
Lifecycle scripts, dev-server use and fsevents execution remain unauthorized.
Keep the previously reviewed license/notice records. C10.4/C10.5 established
Lightning CSS 1.33.0 and its ARM64 binding as MPL-2.0, and reviewed the upstream
Rolldown 1.2.15 MIT license text for the native binding whose archive lacked that
text. Those retained provenance/notice records were external inspection evidence;
this package does not invent or include a portable provenance bundle. Preserve
existing MIT, ISC, BSD, Apache and MPL notices. No dependency source is modified
or binary redistributed by these source files; no redistribution approval or
definitive legal opinion is established by the local verification.

## Fixture integrity test design

The standard-library Node assertion script uses the already-approved TypeScript
compiler to transpile the fixture module in memory. It evaluates only that module
through a data URL after rejecting unexpected runtime imports. No Vite/native
import, test framework, temporary file, subprocess or listener is required.
It checks 30 fixed records: unique demo IDs, provenance/revision, ordering,
room/desk bounds, references, reciprocal task/workflow links, task/agent activity
consistency, exact timestamps and display-only review labels. Full application
type safety is a separate tsc check. The historical integrity test passed in
C10.8A-R1; standard repository-local typecheck and fixture testing also passed
in C10.10E-B without the external declaration-resolution workaround.

## Remaining clean-checkout limitations

The 29 frontend source/configuration files are committed on
`feat/c10-hybrid-virtual-office`. PR #15 remains Draft and unmerged; current
`main` does not contain this frontend. Fresh committed-source Git archive
reproduction passed in C10.12B for macOS ARM64, Node 22.18.0 / npm 11.5.2 and
the approved offline cache. The complete repository-local npm build sequence
is verified for that tested environment. Independent Git clone reproduction
and portable offline-cache provisioning remain unverified. The local dependency
copy and retained temporary npm cache are not portable delivery mechanisms.
Durable access to reviewed provenance/notice evidence remains unresolved.
The ordinary preview script targets root `dist/`, while guarded output is retained
under `.verification/build-*/dist/`; historical browser checks do not validate a
new preview invocation.

## Accessibility and responsive design

Semantic landmarks, skip navigation, labelled native controls, visible focus,
route-heading focus and keyboard-accessible agent selection are implemented.
The HTML agent list is equivalent to scene selection. Mobile navigation is
collapsible; task columns reflow. System reduced-motion settings always apply;
the session preference can additionally disable motion. Status text accompanies
color. C10.9 inspected keyboard focus and desktop/mobile presentation in Chrome.
Exhaustive contrast, screen-reader and cross-browser coverage remain unverified;
no conformance certification is claimed.

## Isolation and governance

No Go imports or backend DTOs, fetch/XHR/WebSocket/EventSource, credentials,
authentication, telemetry, real approvals, service worker, remote assets,
PostgreSQL, Temporal, Sophia, agent execution or operational APIs are implemented.
Review examples cannot grant authority. No operation is initiated by navigation,
selection, filtering or reset. HTTP skeleton readiness is not operational readiness.

D02 remains NOT ACCEPTED. Definition/Instance and Task/Assignment obligations
remain REVIEW ONLY. O1–O5 and GO-2026-5932 remain OPEN. Operational Run creation,
admission, dispatch and persistence remain BLOCKED. No permanent frontend ADR,
production deployment or operational integration is accepted by this mock slice.
