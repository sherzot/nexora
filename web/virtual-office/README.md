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

Current exact direct pins: react 19.2.4, react-dom 19.2.4, typescript 5.9.3,
vite 8.3.5, @types/react 19.2.14, @types/react-dom 19.2.3, three 0.186.1 and
@types/three 0.186.0. Commit `10f728e5441f660256caae5aee8de5f12bd2d841`
added the two Three.js pins and six reviewed transitive records. The current
lockfile is v3 with 55 non-root package records; all 47 C10 records are unchanged.
C11-M1 adds a lazy-loaded procedural Three.js office with bounded orbit/pan/zoom,
eight fixture-owned selectable markers and the existing React inspector. The
original SVG is retained as the explicit 2D, mobile and WebGL-failure fallback. No plugin, router,
UI kit, remote font service or additional dependency is authorized here.
See [C11 dependency and readiness status](../../docs/governance/C11-dependency-integration-status.md)
for the exact closure, authorization limits and unresolved evidence findings.

Historically, C10.6 used a v3 lockfile with 47 non-root package records, of which
23 packages applied to the reviewed macOS ARM64 installation. C10.10D2-F1
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

The subsequent GOV-01/C11 readiness assessment verified the installed TypeScript
5.9.3 files against its pinned archive, then ran the following direct commands
with Node 22.18.0, native addons disabled and an OS sandbox profile denying
network, file writes and subprocess creation:

- `node --no-addons tests/native-guard.test.cjs`: 21/21 mocked tests PASS.
- `node --no-addons node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node --no-addons tests/fixture-integrity.mjs`: 30 synthetic records PASS.

All three commands exited 0 with empty stderr. npm and a production build were
not run in that assessment. These results verify the current synthetic frontend
and mocked boundary; they do not verify an unimplemented renderer or clear the
historical C11.3J3 recovery-integrity BLOCKED result. The proposed
[renderer plan](../../docs/architecture/C11-virtual-office-renderer-plan.md)
has subsequent bounded owner implementation GO for C11-M1 orbit/pan/zoom.
First-person exploration and operational behavior are outside that slice.

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
`feat/c10-hybrid-virtual-office`. PR #15 is open, ready for review and unmerged
at the readiness assessment; current
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

## C11-M1 local verification

The owner authorized the bounded implementation in “COMPLETE PENDING PRs AND
IMPLEMENT C11-M1 3D VIRTUAL OFFICE”. No first-person controls, new dependencies,
addons, physics, WASM, workers, external assets or operational integration are added.
Selection remains React-owned. Camera changes are immediate, with no idle or
animated motion; leaving the route disposes the renderer and resets the camera.

Commands from this directory using Node 22.18.0:

- `node --no-addons node_modules/typescript/bin/tsc --noEmit`
- `node --no-addons tests/native-guard.test.cjs` — 21 mocked guard cases.
- `node --no-addons tests/fixture-integrity.mjs` — 30 synthetic records.
- `node --no-addons tests/office-renderer.test.mjs` — selection, camera bounds,
  lifetime cleanup and import restrictions.
- `node scripts/guarded-build.cjs` — fixed sandboxed Vite child; never bypass it.

`tests/office-browser-checks.mjs` exports a browser regression function accepting
an existing approved Playwright Page and a loopback static-server origin. It
installs nothing. It covers all eight canvas/list selections, six views,
remount/context-loss cleanup, theme, mobile and unsupported-WebGL fallback.
Keep browser evidence separate from compiler and mocked-test results.

The Three.js renderer chunk exceeds Vite's default 500 kB warning threshold;
it is lazy-loaded and is not requested by the default mobile SVG path. No FPS,
cross-browser or production-readiness claim follows. Historical forensic gaps
and GOV-01 reviewer acceptance remain unresolved.

Observed C11-M1 verification: all four direct checks above exited 0 (21 guard
cases, 30 records and nine office regressions). The guarded build completed with
two approved native loads, one expected fsevents denial and final fatal=false.
Chrome 156 passed the browser regression at 1440×1000 and 390×844, including all
eight canvas and keyboard selections, six views, dark theme, five remounts,
context-loss cleanup and unsupported-WebGL fallback. No external requests or
uncaught application errors were observed. The browser's automatic favicon
request returned 404; the forced unsupported-WebGL/context-loss cases emitted
expected diagnostic messages. Screenshots and native audit remain local ignored
verification artifacts; they are not GitHub CI evidence.

## C11-M2 experience

The owner-authorized C11-M2 slice adds four furnished zones, fixture-derived status
badges, hover/selected emphasis, zone navigation, explicit agent focus and optional
Follow selection. Focus/reset uses a bounded 480 ms camera transition; either the
Workspace reduced-motion setting or system preference snaps immediately. Pointer,
keyboard and zoom input cancel an in-progress transition. No idle animation runs.

The scene batches repeated static furniture by shared geometry/material, while
keeping avatar hit meshes independent. Geometry/materials and instance buffers
are owned by the renderer lifetime. Mobile retains SVG by default, with an explicit
3D choice, zoom buttons and adaptive overview framing. The renderer chunk is not
requested by the default mobile SVG path.

Additional verification commands:

- `node --no-addons tests/office-experience.test.mjs` — five camera/transition cases.
- `tests/office-experience-browser.mjs` — injected existing Chromium Playwright Page;
  checks hover pixels, all four zone cameras, follow-selection, GPU camera reset,
  reduced motion, unmount during transition and mobile zoom/fallback. Installs nothing.

Measured desktop browser draw calls were 176 per frame in M1, versus 124 on the
first M2 shadow-building frame and 65 on subsequent camera frames in the same
1440×1000 viewport. Static shadows are built once per renderer lifetime; selection
rings do not cast shadows. This is a draw-call result,
not a frame-rate or cross-device guarantee. The lazy renderer chunk remains above
500 kB (about 544 kB minified); Three.js's WebGL renderer and shared core are its
principal payload. No new dependency, private Three.js import, custom dependency
build or warning suppression is introduced to disguise that size.

All six views, fixture identities, native allowlist, lockfile and operational
exclusions remain unchanged. This implementation is not deployment permission.
D02 NOT ACCEPTED; O1–O5 and GO-2026-5932 OPEN; normative obligations REVIEW ONLY;
operational Run creation/admission/dispatch/persistence BLOCKED.

## C11-M3 synthetic simulation

The C11-M3 owner instruction authorizes only this browser-local demonstration.
`src/simulation/` separates readonly models, seeded scenario plans, pure transitions,
selectors, a playback controller and React adapters. Existing fixture IDs and task
references remain authoritative; no fixture or dependency is changed.

Normal Office Day, Team Collaboration and Review Workflow Demonstration each run
for at most 32 virtual ticks of 500 ms. The seed defaults to 42. State changes,
positions, event IDs and ordering depend on the seed and tick, never Date.now or
elapsed wall time. The controller's one cancellable timeout determines when the
next explicit tick is requested, at 1×, 2× or 4×; browser delays never cause catch-up
or skipped ticks. Pausing cancels it; a hidden tab pauses explicitly. Reset and
scenario switching clear snapshots and derived view state. History is capped at
128 events. All activity labels and task transitions are synthetic, not Runtime,
Workflow or Approval events.

One provider owns the playback snapshot and selected agent across all six views.
The Office inspector, simulation timeline and task columns derive from it. Event
selection opens the corresponding agent in Office. Three.js only interpolates
logical positions from snapshots; paused playback freezes the current visual
position, paused steps and reduced motion snap to the new logical position. SVG
uses the same logical positions. No perpetual idle renderer loop is added.
Architecture shadows stay cached; moving avatars do not cast baked ghost shadows.

Additional checks:

- `node --no-addons tests/simulation.test.mjs` — deterministic replay, seed changes,
  transitions, references/order, paths, scheduler control, reset, speed and cleanup.
- `tests/simulation-browser.mjs` — injected existing approved Playwright Page;
  movement, cross-view controls, timeline/task synchronization, pause safety,
  reset replay, reduced motion and mobile SVG. Installs nothing.

The M1/M2 browser suites remain applicable while simulation is inactive. Their
resource check distinguishes the provider's visibility listener from renderer-owned
listeners; canvas teardown must return to the same application baseline. Pixel
checks capture the foreground viewport without changing its size or moving the
pointer, then inspect the scene region above the DOM caption.

No network, backend, operational persistence, provider, tool, worker, WASM or
physics capability is added. No deployment permission is implied. Historical
forensic restrictions, D02 NOT ACCEPTED, normative obligations REVIEW ONLY,
O1–O5 OPEN, GO-2026-5932 OPEN and operational Run blocking remain unchanged.

## C11-M4 synthetic analytics

Owner-authorized C11-M4 adds a seventh, read-only Simulation Analytics view; the
six existing frontend views remain available. `src/analytics/` separates metric
models/definitions, pure calculations, event selectors, comparison and report
serialization. It changes neither the simulation engine nor its snapshots.

Metric contract:

- Time is integer virtual milliseconds. State at tick k owns [k×500, (k+1)×500);
  the current tick is right-censored. Paused wall time is excluded.
- Active time = moving + working + collaborating + reviewing. Idle + completed
  time is inactive. Utilization = active agent-ms / observed eligible agent-ms.
- Agent scope is all eight fixtures or one selected fixture agent. Task completion
  uses distinct fixture tasks linked to that scope; unassigned examples are not
  removed from the denominator. Current status counts use snapshot state.
- Logical zone attribution uses event zoneId, not GPU position. Moving time belongs
  to the source zone until the authoritative arrival event.
- Percentages use integer basis points with half-up rounding. A zero denominator
  or incomplete activity history produces unavailable values (—/null), not an
  invented estimate. Progress is current tick / 32.

Comparison evaluates the three existing pure scenarios locally at the same seed,
agent scope and explicit tick horizon, without advancing playback. Equal event,
utilization and completion totals are expected when phase durations match; zone
attribution and activity mix can differ. These are not employee productivity metrics.

Simulation timeline filters combine agent, activity, zone, inclusive tick range
and description search. Filtering copies/derives the event list without altering
history. Event details and Office selection remain synchronized. Inactive fixture
timeline behavior is preserved; virtual-time filters apply to simulation events.

JSON and CSV exports use schema version 1, stable field/record order, scenario/seed/
horizon metadata, scope, definitions, per-agent durations, tasks and comparisons.
No generated timestamp or wall-clock data enters report contents. CSV uses CRLF,
quote escaping and spreadsheet-formula neutralization for text cells. One report
Blob URL is retained at most and revoked on replacement or analytics unmount.
Reports are downloaded only on an explicit button action; there is no backend store.

Additional verification:

- `node --no-addons tests/analytics.test.mjs` — metric/interval correctness,
  denominators, incomplete inputs, comparison, immutability, filtering and exports.
- `tests/analytics-browser.mjs` — injected existing approved Playwright Page;
  actual repeated JSON/CSV downloads are byte-compared, timeline/filter/reset
  synchronization, theme/mobile/reduced-motion access and Blob cleanup checked.

The M3 renderer asset is unchanged. Analytics uses lightweight SVG/CSS, memoized
bounded derivations and local comparisons of at most 3×32 ticks. No chart library,
renderer animation loop, external observability service, telemetry ingestion,
operational capability, dependency, native permission or deployment is introduced.

### Synthetic collaboration

Open **Collaboration** to follow the selected scenario's fixture tasks and agent
relationships. Planned steps have no event timestamp. Observed steps point to the
simulation activity that supports them, with the current step highlighted until
the next step is observed. Review outcomes are labeled **Demo Approval** and
grant no authority. Single-agent tasks use a fixture peer for illustration.

Select an interaction to inspect its causal predecessor, jump to the relevant
timeline entry, or highlight both participants in the Office. The timeline has
a separate collaboration stream. Analytics continue to use simulation activity
and retain their existing metric definitions.

Run the projection regressions with
`node --no-addons tests/collaboration.test.mjs`. The browser suite
`tests/collaboration-browser.mjs` takes a Playwright page and the origin of a
locally served guarded build.

### Office hardening and performance checks

`tests/office-hardening-browser.mjs` verifies renderer retention across playback
resets, pointer burst coalescing, direct timeline links, analytics clock updates,
keyboard focus and the SVG path at 320 and 390 CSS pixels.
`tests/office-performance-browser.mjs` runs the same benchmark against any
guarded build served on loopback. Pass a fresh foreground Playwright page and
the local origin. Run each build in a fresh browser context.

Measured the M5 baseline (`eec1ab4`) and M6 guarded build with Chromium
156.0.8078.81 on macOS 27.2, Apple M2 (Mac14,7), 8 GB RAM, ANGLE Metal,
1440 × 1000 CSS pixels. Three navigations per build, one first navigation
followed by two repeat navigations. Each run sent 240 primary pointer events
in one task, observed 3.5 seconds of 1× Normal Office Day playback, then
sampled 500 ms each at idle and while paused after the pause render settled.

| Metric | M5 | M6 |
| --- | ---: | ---: |
| Minified main JavaScript | 267,179 B | 267,740 B |
| Minified lazy renderer | 545,650 B | 545,861 B |
| Navigation load event, median | 10.9 ms | 9.6 ms |
| Navigation to first WebGL draw, median | 33.3 ms | 24.3 ms |
| Renderer response end to first draw, median | 15.4 ms | 6.5 ms |
| Initial / steady WebGL draw calls per frame | 84 / 65 | 84 / 65 |
| Pointer burst canvas bounds reads | 240 | 1 |
| Pointer event dispatch time, median | 3.7 ms | 0.9 ms |
| Active RAF callback CPU duration, median run p95 | 1.7 ms | 1.8 ms |
| Active draw-to-draw RAF interval, median run p95 | 17.6 ms | 17.6 ms |
| Idle / paused RAF callbacks per 500 ms | 0 / 0 | 0 / 0 |

Initial navigation timings were variable (275.3 ms to first draw on M5 and
258.6 ms on M6). Treat timing samples as local observations. The repeatable
improvements are the bounds-read count and keeping the existing canvas through
scenario changes and resets. The route departure check found no remaining
canvas or pending RAF in all runs. Existing browser suites check listener,
observer, canvas and object URL cleanup. Long-run heap and GPU memory were
not measured. RAF CPU duration is not GPU render time.

The renderer already uses named Three.js imports and a separate lazy entry
point. It still needs Three.js WebGL rendering, lit materials and shadows.
The build retains the 500 kB warning. No bundle-size reduction is claimed.

### M7 reliability verification

`node --no-addons tests/simulation.test.mjs` includes 90 complete replays
across three scenarios and five seeds. The manual scheduler tests speed
changes, stale callbacks, pause/step/resume and disposal during notification.
Each replay must match the direct simulation engine, with at most one pending
timer and no more than 128 events.

Run `tests/office-reliability-browser.mjs` with a fresh foreground Playwright
page, downloads enabled, and a locally served guarded build. It cycles through
Office, Timeline, Collaboration and Analytics six times, compares replayed
event identities, checks selection and exports, and injects a draw failure
during playback. It asserts same-frame teardown and focus restoration to the
2D control. Diagnostics live in the test page only.

In Chromium 156.0.8078.81 on macOS 27.2 (Apple M2, 8 GB, ANGLE Metal),
the suite observed 13 WebGL contexts and 13 context-loss events, including
the injected failure. Each completed cycle returned to zero canvases,
observers, pending frames and report object URLs, with one application
visibility listener. The final sample counted 208 buffer creates and deletes,
208 vertex-array creates and deletes, 76 texture creates / 16 explicit deletes,
40 program creates / 24 explicit deletes and 47 framebuffer creates / 8
explicit deletes. These are WebGL API calls. Context loss invalidates the
remaining handles. Individual Three.js geometry/material allocations and
GPU memory bytes were not measured. Chromium's sampled JS heap ranged from
about 10.0 to 15.1 MB after cycles and was 11.3 MB after failure. These
short, garbage-collection-dependent samples do not establish a long-run
memory trend.

The installed Playwright tooling exposed Chromium. Firefox and Playwright
WebKit binaries were unavailable. Safari 27.2 WebDriver refused a session
because remote automation was disabled. Firefox and WebKit remain untested.

For the M7 benchmark, use the same harness on guarded builds from
`032e85c` (M6 baseline) and M7. Use a fresh context per build and a 1440 × 1000
viewport, seed 42 and 1× Normal Office Day. Exclude the first navigation as
warm-up and summarize the next three. Each run samples 3.5 seconds of active
playback and 500 ms each at idle and settled pause. Scenario switch timing
includes two RAF callbacks after dispatch, so it is a paint-opportunity proxy
rather than pure controller execution time.

| Metric | M6 baseline | M7 |
| --- | ---: | ---: |
| Minified main JavaScript | 267,740 B | 267,873 B |
| Minified lazy renderer | 545,861 B | 546,037 B |
| Navigation load event, median | 8.0 ms | 9.7 ms |
| Navigation to first draw, median | 19.0 ms | 21.5 ms |
| 240-event pointer dispatch, median | 0.9 ms | 1.0 ms |
| Canvas bounds reads per burst | 1 | 1 |
| Active frame interval, median / median run p95 | 16.7 / 17.5 ms | 16.7 / 17.7 ms |
| Scenario switch, median / p95 across nine switches | 33.2 / 34.1 ms | 33.1 / 34.7 ms |
| Scenario switch renderer remounts | 0 / 9 | 0 / 9 |
| Initial / steady draw calls per frame | 84 / 65 | 84 / 65 |
| Idle / paused RAF callbacks per 500 ms | 0 / 0 | 0 / 0 |

Timing samples are diagnostic only. The emitted lazy chunk contains the
Three.js WebGL renderer, lit-material and shadow code. The lockfile has one
runtime Three.js version and the source uses named imports through its
approved entry point. No safe reduction below 500 kB was demonstrated.
The existing warning remains enabled.

### M8 browser and soak checks

Use a separately provisioned Playwright runtime and its approved local browser
binaries. The test launcher uses an explicit absolute module path and a loopback
origin. Serve the guarded build's `dist` directory on that origin, then run
from `web/virtual-office`:

```sh
export NEXORA_PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core/index.mjs
node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 all
node tests/run-office-browser.mjs firefox http://127.0.0.1:4204 all
node tests/run-office-browser.mjs webkit http://127.0.0.1:4204 all
node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 smoke
```

The M2 screenshot suite uses Chromium's DevTools Protocol. The launcher
explicitly skips that suite on Firefox and WebKit and runs the shared browser
checks there. A missing engine executable blocks that engine's run. The
launcher leaves provisioning to the approved tooling outside this repository.

The stress modes are `smoke` (5 minutes), `validation` (30 minutes), and
`extended` (60 minutes). Each mode finishes its current cycle at the time
limit, then exercises an injected draw failure and checks teardown. A cycle
uses seed 42, rotates through the three scenarios, and finishes playback at
4× speed. It revisits the Office, Timeline, Collaboration and Analytics,
compares replay identities, and checks export URLs and renderer teardown.
`regression` runs six short cycles. `resize` runs the focused duplicate
resize regression. `benchmark` runs one warm-up and three measured runs.

The stress harness retains up to 32 cycle snapshots and a fixed histogram of
positive RAF intervals up to 100 ms. The histogram excludes longer idle gaps.
Browser timer counts are a test-side proxy keyed to the simulation's
125/250/500 ms delays. The controller tests independently check its exact
scheduler behavior. Counts of WebGL API calls and context-loss events describe
resource lifecycle, not GPU memory bytes. Optional Chromium heap samples are
garbage-collection-dependent, and a smoke run cannot establish a long-run trend.

Chromium 153.0.8010.12 on macOS 27.2 / Apple M2 completed 66 smoke cycles
in 302.739 seconds at 1440 × 1000. It observed 133 WebGL contexts and
133 context-loss events. After the injected failure, the counters returned
to zero canvases, observers, RAF callbacks, playback timers and export URLs,
and one application visibility listener. The timer proxy peaked at one.
Buffers and vertex arrays each showed 1,742 creates and 1,742 explicit
deletes. Textures showed 733 creates / 134 explicit deletes, programs
335 / 201, and framebuffers 466 / 67. All contexts were lost at teardown.
The retained 32 Chromium heap samples returned the same coarse 10 MB
reading. The 12,411 sampled RAF intervals had a median of 17 ms and p95
of 33 ms, including stress navigation and playback.

All eight Chromium suites passed. The duplicate-resize test recorded 120
canvas dimension writes on M7 and zero on M8 for 30 repeated notifications.
Real resize and SVG fallback passed on M8. The remount test initially failed its resource comparison with a fixed
100 ms delay under headless Chromium. It passed after switching to a wait
for renderer readiness and an empty frame queue.

Firefox revision 1543 and WebKit revision 2359 were absent from the
configured Playwright cache, so their launches were blocked. The 30- and
60-minute modes were not run. JS geometry/material counts, precise heap
trends, and GPU memory bytes remain unverified.

Paired M7/M8 benchmarks used Chromium 153.0.8010.12 with ANGLE SwiftShader
on macOS 27.2 (Apple M2), 1440 × 1000, seed 42, and 1× Normal Office Day.
Each build used a fresh context, one warm-up and three measured runs.
The local static server sent uncompressed assets. Gzip and Brotli totals
are offline Node zlib defaults across the two JavaScript files.

| Metric | M7 | M8 |
| --- | ---: | ---: |
| Main JS, minified | 267,873 B | 267,873 B |
| Lazy renderer, minified | 546,037 B | 546,137 B |
| Cold JavaScript transfer, browser Resource Timing | 814,510 B | 814,610 B |
| Combined gzip / Brotli JS | 216,973 / 181,059 B | 217,033 / 181,173 B |
| Median navigation to first draw | 29.7 ms | 23.7 ms |
| Median pointer burst dispatch | 1.1 ms | 1.0 ms |
| Active RAF interval, median / median run p95 | 16.7 / 33.4 ms | 16.7 / 33.4 ms |
| Scenario switch, median / p95 | 32.2 / 42.9 ms | 33.3 / 38.6 ms |
| Initial / steady draw calls | 84 / 65 | 84 / 65 |
| Idle / settled-pause RAF callbacks per 500 ms | 0 / 0 | 0 / 0 |
| Remounts across nine scenario switches | 0 | 0 |

Warm navigations reused cached JS. Timings vary across runs and do not
establish a speedup. The import audit found one Three.js runtime version.
Named imports use the approved root entry point, and the main chunk
contains no WebGL renderer markers. The lazy chunk retains the WebGL
renderer, standard lit materials and shadow code. No WebGPU or audited
decoder markers appeared in either chunk. The 500 kB threshold remains
in effect. No safe bundle reduction was demonstrated.

### M9 browser result reporting

The local runner emits one JSON record per suite with its engine, version,
registered executable, and PASS or FAIL status. A launch error is BLOCKED
and identifies the registered executable. Suite failures leave a nonzero
exit status while allowing the remaining suites to run. The registered
Chromium executable may differ from the headless shell actually launched.
Set `NEXORA_BROWSER_EXECUTABLE` to an approved absolute executable path when
the exact binary must be selected explicitly.

With an approved Playwright 1.63.0 runtime, the standard provisioning command
is `node /absolute/path/to/playwright-core/cli.js install firefox webkit`.
Use `--dry-run` first to review platform, revisions and mirrors. The pinned
macOS ARM64 revisions for this environment are Firefox 1543 and WebKit 2359.
The standard browser installation is separate from NEXORA's package and
native build policy.

On macOS 27.2 ARM64, the pinned Firefox and WebKit archives installed via
the standard CLI. Chromium 153.0.8010.12 passed all eight suites and WebKit
26.6 passed all seven shared suites. The Chromium-only screenshot suite
was explicitly reported as NOT RUN on WebKit. Firefox 155.0 (revision 1543)
was BLOCKED before session creation: the process exited with “Could not
find profile folder.” A fresh canonical temporary root returned the same
error during the initial run. The macOS-specific follow-up below resolved
that launch blocker and verified the shared suites.

Two timing-sensitive Chromium test observations were corrected. Renderer
resource snapshots are now captured within the same browser turn that
observes an empty RAF queue. The camera test records distinct animated
view matrices and compares the settled viewport image, avoiding a
fixed-time screenshot whose capture can finish after the transition.

Chromium 153.0.8010.12 used the Playwright 1243 ARM64 headless shell
(`chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell`
under the Playwright cache). The WebKit launcher was `webkit-2359/pw_run.sh`.
Firefox attempted `firefox-1543/firefox/Nightly.app/Contents/MacOS/firefox`.

| Chromium stress mode | Elapsed | Cycles | Contexts created / lost | RAF median / p95 |
| --- | ---: | ---: | ---: | ---: |
| Smoke | 305.529 s | 60 | 121 / 121 | 17 / 50 ms |
| Validation | 1,802.801 s | 380 | 761 / 761 | 17 / 33 ms |
| Extended | 3,604.176 s | 744 | 1,489 / 1,489 | 17 / 33 ms |

The modes overlapped in separate processes on the same Apple M2 host.
All three passed with at most one tracked timer and zero canvases,
observers, pending frames, tracked timers and export URLs after teardown.
The extended run counted 20,826 buffer creations and deletions and
20,826 vertex-array creations and deletions. The retained extended-run
heap samples ranged from 39.6 to 50.4 MB. These coarse Chromium readings
and the bounded sample window cannot establish a heap trend. WebKit's
six-cycle regression passed with 13 contexts created and lost, and
exposed no heap reading. GPU memory bytes were unavailable.

Production JS matched M8 byte for byte (267,873 B main, 546,137 B lazy
renderer). The Chromium benchmark ran with stress processes active and
recorded 65 steady draw calls, zero idle/settled-pause RAF callbacks and
zero scenario-switch remounts. Median first draw was 25.7 ms and the
median run p95 frame interval was 50 ms. These timings are diagnostic
and do not isolate a performance change. The existing warning remains.

#### M9 Firefox follow-up on macOS 27.2

Firefox 155.0 (revision 1543) reproduced the profile error when launched
directly with a fresh, writable profile. For test runs, give Firefox a
fresh app-data root using the process-local Core Foundation setting. This
addresses the macOS 27 app-data lookup reported in
[Playwright issue #42768](https://github.com/microsoft/playwright/issues/42768).

```sh
firefox_test_root=$(mktemp -d /private/tmp/nexora-firefox-suite.XXXXXX)
CFFIXED_USER_HOME="$firefox_test_root" node tests/run-office-browser.mjs firefox http://127.0.0.1:4205 all
```

Set `NEXORA_PLAYWRIGHT_MODULE` and serve the guarded build as above. With
Playwright 1.63.0, all seven shared Firefox suites passed using this
setting. The CDP screenshot suite remains Chromium-specific. The pinned
runtime, browser executable and system privacy settings were unchanged.

### C12 product journey

1. In the Office, select a synthetic agent by its marker or agent button.
   Open **View agent details**, follow a linked task to the board, then use
   **Return to Office**. Agent profiles and the board show the same task
   status once the simulation is active.
2. Step playback until collaboration evidence exists, then choose
   **Explore collaboration**. Open an observed step and follow its event
   link to the Timeline. The inspector links to the related task and both
   participants. Browser Back and Forward revisit the corresponding routes.
3. Return to the Office from the task or profile. The shared selection retains
   the inspected interaction and its participant cues during navigation.
   Reset or scenario change clears epoch-bound selection. An unavailable
   evidence link offers a return to the Timeline without reopening itself
   as playback advances.

Serve the guarded build on loopback and use the existing Playwright runtime
and browser setup above. Run
`node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 journey`
(or select `firefox` with the macOS workaround, or `webkit`). The `all`
mode also runs the journey. The suite verifies keyboard route focus,
task status, evidence identity, Back/Forward, reset recovery, and SVG
navigation at 320 and 390 CSS pixels. This is a synthetic local demo.

### C13 synthetic coordination sandbox

Select an Office agent, open its profile, then choose **Open task workspace**
on a linked task. The same workspace is available from the Task Board and
Interaction Inspector. Step playback to populate observed task interactions.
Choose an alternative scenario to compare at the current seed and tick.
The comparison keeps its captured tick as playback advances. Only observed
links open Timeline evidence. **Reset preview** returns focus to the chooser.
Leaving the workspace or resetting playback clears the preview. Use
**Return to Office** to revisit the current Office selection.

With the guarded build served on loopback and the existing Playwright setup,
run `node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 coordination`.
Firefox uses the macOS workaround above. WebKit uses the same command with
`webkit`. The `all` mode includes both the C12 and C13 journeys.

### C14 synthetic mission planning

From the Office, choose **Plan a mission**. Select fixture tasks and add
prerequisites by choosing the dependent task and its required task.
Use **Assume complete** to explore readiness under hypothetical completion
assumptions. Capture Plan A, then edit Plan B to compare prerequisites,
task membership and readiness under the current assumptions. An invalid
comparison explains the conflicting assumptions.

The mission draft is local to the page, separate from playback. **Reset
mission** clears both plans and returns focus to task selection. Leaving or
reloading the route clears the draft. **Return to Office** preserves Office
selection according to the existing playback rules.

With the guarded build served on loopback, run
`node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 mission`.
Use the existing Playwright setup above for Firefox and WebKit. The
`all` mode includes the C12, C13 and C14 journeys.

### C15 hypothetical mission preview

From **Plan a mission**, choose Plan B tasks and prerequisites. Select an
eligible proposed agent for each task that still needs simulated work.
Choose **Start preview** to capture those inputs. **Step preview** starts the
first ready task in fixture order or completes the active task, emitting one
hypothetical event per step. Tasks already assumed complete emit no events.
Inspect task states, unmet prerequisites, proposed agents and the result
against the captured Plan B input.

**Reset preview** restores step zero from the captured input and focuses
**Step preview**. A successful Plan B edit clears the captured preview.
Plan A-only edits and rejected edits preserve it. **Reset mission** clears
all planning state. Leaving or reloading the route ends the draft session.
Playback uses its own controls and never consumes the preview events.

With the guarded build served on loopback and the existing Playwright setup,
run `node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 mission-preview`.
Firefox uses the documented macOS workaround. The `all` mode includes this
journey and the C12–C14 regressions.

### C16 hypothetical mission diagnostics

On **Mission Planning**, select a task in **Mission diagnostics** to inspect
its proposed assignment, fixture eligibility, and prerequisites. After
starting the preview, inspect blockers, the next transition, and the
hypothetical step that satisfied a final prerequisite. Fixture order breaks
ties among ready tasks. The preview uses serial transitions and does not
model agent availability or capacity.

Capture **Variant A** and **Variant B** from the editable Plan B. Each capture
starts at step zero and holds its own tasks, prerequisites, assumptions, and
assignments. Compare inputs, event order and attribution, logical step counts,
and terminal states. Logical steps do not measure elapsed time. C14's
**Plan A** remains the separate structural comparison reference.

Draft edits and **Reset preview** preserve captured variants. **Reset mission**,
route exit, and reload clear them. Playback controls remain independent, and
preview events are hypothetical throughout.

With the guarded build served on loopback, run
`node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 mission-diagnostics`.
Use the existing Playwright setup and Firefox macOS workaround above.
The `all` mode also includes this journey.

### C17 synthetic planning readiness and what-if analysis

Open **Mission Planning** to inspect **Synthetic Planning Readiness** for
editable Plan B. An empty plan or missing required assignment is incomplete.
Graph, assumption, or assignment violations make the configuration invalid.
A valid configuration can include initially blocked tasks. Readiness describes
whether the synthetic plan can be previewed.

Capture **Variant A** as the baseline, change Plan B, and capture **Variant B**
as the alternative. The what-if comparison uses the existing deterministic
hypothetical preview to compare input changes, blockers and assumptions,
transition order and attribution, and terminal outcomes. An eligible assignment
change alone affects attribution while preserving transition order and count.
Logical steps are transition counts. The model does not evaluate real agent
availability, capacity, elapsed time, or operational authorization.

C14 Plan A remains the separate structural reference. Draft edits and preview
reset preserve captured variants. Mission reset, route exit, and reload clear
them. Playback controls do not change the draft or captured variants.

With the guarded build served on loopback, run
`node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 mission-readiness`.
The `all` mode includes this journey. Use the existing Playwright setup and
the documented macOS workaround for Firefox.

### C18 Mission Decision

Capture validated Plan B inputs in Variant A, Variant B, and Scenario C.
Variant A and B still feed the existing readiness comparison. Each slot
holds an independent hypothetical snapshot. Capturing a replacement or
removing a scenario leaves the editable draft and other captures intact.

In **Mission Decision**, select one or both structural comparison criteria.
Recommendations describe fewer initially blocked tasks or fewer direct
prerequisite relationships under the selected criteria. Comparisons
with different task membership or assumptions show evidence without a
recommendation. Equal observations tie and conflicting criteria show a
trade-off. A collection recommendation requires the same scenario to
be favored in each comparison against another occupied slot.

Choose a preferred scenario, optionally enter a rationale, and record the
local preference. It binds to the exact capture and comparison evidence.
Scenario or criterion changes clear that preference. Plan B edits,
playback changes, and Reset Preview preserve the captures. Reset Mission,
navigation away, and reload end the local session. Preferences are
hypothetical and carry no approval or execution authority.

With the guarded build served on loopback, run the model tests with
`node --no-addons tests/mission-scenarios.test.mjs` and the browser
journey with
`node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 mission-decision`.
The `all` mode includes this journey. Use the existing Playwright setup and
the documented Firefox macOS workaround.

### C19 mission navigation

Use Mission sections to move keyboard focus to Configure, Readiness,
Preview & Diagnostics, or Decision. These destinations remain available
throughout the session. Navigation keeps the mission route and browser
history intact.

Plan B is the editable draft. Plan A is its structural reference.
Variant A/B fill Scenario A/B in the same three-slot collection.
Use Go to scenario decisions and Go to A/B capture controls to move
between capture and comparison. View recorded evidence opens the
current local preference's comparison evidence.

Draft edits and Reset Preview preserve captures and the recorded local
preference. Capture changes or criteria changes clear the preference.
Reset Mission, leaving the route, and reload clear the local session.
All results remain hypothetical and confer no operational authority.

With the guarded build served on loopback, run
`node tests/run-office-browser.mjs chromium http://127.0.0.1:4204 mission-decision`.
Run the same mode in Firefox and WebKit with the documented platform
conventions, then run `all` for integrated verification.

### C20 resume a captured scenario

Use **Use Scenario A/B/C as Plan B** to replace the editable draft with
the indicated scenario revision. Configure receives keyboard focus.
The draft uses detached copies of captured tasks, edges, assignments
and completion assumptions.

Loading preserves captures, revision counters, criteria and the recorded
local preference. It clears the current preview and prerequisite selectors.
Editing the loaded draft keeps the capture intact. Recapturing a scenario
or changing criteria still clears the local preference.

Plan A retains its structure and assumptions for tasks exclusive to it.
Shared task assumptions follow the loaded scenario. If those assumptions
conflict with Plan A, loading is rejected with an explanation and current
mission state is preserved. Reset Mission, route exit and reload retain
their existing session cleanup behavior. This remains hypothetical planning.

Verify using the existing `mission-decision` browser mode and `all` mode
against a guarded build served on loopback, with the documented Firefox
and WebKit conventions.
