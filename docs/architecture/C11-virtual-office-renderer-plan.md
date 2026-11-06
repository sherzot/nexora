# C11 synthetic Virtual Office renderer plan

DESIGN RECORD — the later C11-M1 owner instruction authorizes only the bounded
orbit/pan/zoom implementation and verification. First-person exploration remains
a future proposal. This plan itself implements no renderer
and accepts no new architecture decision. It applies only to the existing
synthetic frontend. Constitution/Accepted ADR precedence and the
[C11 status record](../governance/C11-dependency-integration-status.md) remain binding.

## Existing seam and authoritative state

`OfficeOverview.tsx` owns `selectedId` and renders the inspector and equivalent
HTML selection list. `OfficeScene.tsx` consumes `selectedId` and `onSelect`.
`App.tsx` owns theme/reduced-motion preferences, route changes and reset keys.
These remain React-owned. The renderer receives read-only fixture data and emits
only validated selection IDs or presentation errors. It owns no tasks, approvals,
backend state or lifecycle authority. `demo/fixtures.ts` remains the source of
four rooms and eight agents; IDs, order, provenance and relationships must not change.

Preserve current SVG and HTML behavior. Keep selection, inspector and synthetic
notice outside the GPU failure boundary. On Office re-entry reset the camera and
selection according to the existing remount/reset behavior; no storage is added.

## Proposed file boundaries and contracts

Only after implementation GO, propose these paths under `web/virtual-office/`:

| Path | Responsibility |
| --- | --- |
| `src/office/OfficeViewport.tsx` | React host, capability/fallback state, accessible controls, theme/motion inputs |
| `src/office/three/contracts.ts` | Read-only scene inputs and renderer handle; type-only Three.js references |
| `src/office/three/layout.ts` | Pure fixture-to-world transform, room bounds, doors, desks and colliders |
| `src/office/three/geometry.ts` | Shared primitive meshes, materials and eight fixture-keyed avatars |
| `src/office/three/navigation.ts` | Input state, bounded movement, collision sliding and camera reset |
| `src/office/three/selection.ts` | Raycast hit-to-DemoId mapping; no authority or fixture mutation |
| `src/office/three/renderer.ts` | WebGL scene creation, invalidation, resize and exhaustive disposal |
| `src/views/OfficeOverview.tsx` | Replace only the scene host; retain selection/inspector/list |
| `src/App.tsx` | Pass existing theme and motion preferences into the Office view |
| `src/styles.css` | Viewport, DOM labels, focus, pointer-lock help and mobile fallback styles |

Keep `OfficeScene.tsx`, fixtures, models, routes and other five views intact.
No manifest, lockfile, native guard, tsconfig or Vite change is part of this plan.
Any required deviation needs explicit scope review.

The renderer factory accepts an owned container, a read-only room/agent snapshot,
`selectedId`, theme/motion values, `onSelect(DemoId)` and `onUnavailable(reason)`.
Its handle exposes `setSelection`, `setTheme`, `setReducedMotion`, `setCameraMode`,
`resetCamera` and idempotent `dispose`. It must never query React state directly.
Selection input is validated against the existing agent-ID set. React callbacks
are stable or updated through an explicit handle; no stale closure may write after
disposal. DOM event objects and Three.js instances never enter fixture data.

## Floor, rooms, avatars and collision

Use a single 24×18 floor: x ∈ [-12,12], z ∈ [-9,9], ground y=0. Map existing
fixture coordinates (u,v) using x=2.4u−12 and z=2.4v−8.4. This preserves uniform
scale, fixture relationships and margins; it does not rewrite the fixtures.

| Room ID | World x bounds | World z bounds |
| --- | --- | --- |
| demo-room-studio | [-11.28,-0.96] | [-7.68,-0.24] |
| demo-room-engineering | [0,11.28] | [-7.68,-0.24] |
| demo-room-quality | [-11.28,-0.96] | [0.96,7.68] |
| demo-room-library | [0,11.28] | [0.96,7.68] |

Use 1.2-unit openings on the corridor-facing horizontal wall: left room doors
centered at x=-6.12 and right room doors at x=5.64. Top doors lie at z=-0.24;
bottom doors at z=0.96. Subtract openings from wall colliders. Proposed spawn is
(-0.48,1.65,0.36), validated against expanded colliders before activation. The
vertical corridor is 0.96 units wide and the horizontal corridor 1.2 units;
test the proposed 0.25 player radius against the actual wall thickness/margins.
Do not declare connectivity until the pure geometry tests pass.

Transform the existing 1.2×0.8 fixture desk footprint at the same scale. Put each
avatar's seat outside that footprint with clearance checked inside its assigned
room. Use lightweight shared boxes, cylinders and spheres, original stylized
silhouettes and existing tone/status labels. All eight IDs remain selectable,
including Away; appearance never implies an actual agent process or availability.
No imported models, textures, fonts, physics engine or animated execution status.

Use static axis-aligned wall/desk bounds, expanded by player radius, with swept
movement and axis-separated sliding. Clamp frame delta to 50 ms, subdivide travel
to at most 0.1 unit per collision step and prevent floor escape/tunnelling. Validate
spawn and every door with deterministic tests. Cutaway overview changes wall
visibility only; first-person collision boundaries remain complete.

## Camera, selection and accessibility

Default to a fixed elevated overview framing the full floor; first-person mode
uses a 1.65-unit eye height, bounded pitch and WASD speed proposed at 3 units/s.
No imported OrbitControls or PointerLockControls addon. Camera state is ephemeral.
Reset on Office route re-entry and workspace reset.

Pointer lock starts only from an explicit Explore/Resume Exploring button and a
trusted user activation. Denial leaves a usable overview and explanation. Escape,
focus loss, hidden document or route exit clear pressed keys and stop movement.
Tab must release lock and allow normal focus navigation; do not trap keyboard
users. Do not intercept shortcuts or typing in form fields. Restore focus to the
entry control after leaving exploration. A centered reticle and help text exist
only during active exploration. Inspecting a selected agent releases lock before
focus moves to the React inspector.

Raycast only registered agent meshes. Hover/selected DOM labels use fixture text;
raycast IDs must resolve through the existing selection contract. Mouse and HTML
list selection update the same inspector. Keep the HTML agent buttons visible,
labelled and keyboard-operable; canvas is not the sole interaction path. Reduced
motion disables decorative motion and animated camera travel, not user-controlled
essential access. Respect the shell's preference and system preference.

## Renderer lifecycle and resource ownership

Create the scene in a React effect after a measurable container exists. Support
StrictMode setup→cleanup→setup without duplicate canvases, listeners or loops.
Fail to SVG on unsupported WebGL, renderer creation failure or context loss.
Keep a visible user-selected 2D mode. Use SVG by default on narrow/coarse-pointer
mobile layouts; no pointer-lock requirement on mobile. Do not repeatedly recreate
a failed context automatically. Offer an explicit retry only after cleanup.

Use one owned requestAnimationFrame schedule: render on invalidation in overview;
continuous frames only during active movement or approved presentation animation.
Pause when hidden; clamp time on resume. Resize via one ResizeObserver and cap
device pixel ratio at a proposed 1.5. Update theme materials and selection through
the handle rather than rebuilding the whole scene for each React render.

Maintain an explicit resource registry. Dispose each shared geometry/material/
texture/render target exactly once, cancel RAF, disconnect observers, remove all
listeners, clear input state and callbacks, release owned pointer lock, dispose
the renderer and remove its canvas. Remove context listeners before intentional
context release. Asynchronous import completion after unmount must not install a
scene; dispose resources created by a stale initialization. Keep generation/disposed
checks at every deferred callback. Never globally clear another renderer's caches.

## Runtime/import and native-build boundaries

Use named imports from the pinned `three` root only. No React Three Fiber, Drei,
`three/addons`, `three/examples`, `three/webgpu`, TSL, decoder, physics, compressed
asset, XR-session or worker API use. No runtime imports of the installed type
closure packages. Disable XR use; do not initiate device/session discovery. Use
primitive geometry, local shader/material definitions and existing CSS/DOM labels.
No fetch, WebSocket, telemetry, service worker or backend endpoint is added.

Source import checks alone are insufficient: future emitted module/asset inventories
must exclude forbidden reachable modules and WASM/worker/decoder payloads, followed
by browser request auditing. Root imports/tree shaking are not proof of absence
of every forbidden capability. Browser WebGL/GPU behavior is a separate future
browser verification scope; it does not expand Node `.node` build allowances.
Keep the existing guarded build unchanged. A build must stop on an unexpected
native attempt, identity failure or fatal/incomplete audit, with no fallback.

## Regression and acceptance requirements

| Layer | Required check before a renderer slice is accepted |
| --- | --- |
| Fixtures | Existing 30-record integrity remains; exactly four rooms/eight agents and all IDs unchanged |
| Pure geometry | Exact transform/bounds/desk placement; open door connectivity; no invalid spawn or escape |
| Navigation | Sliding, wall/desk contact, high-delta tunnelling, blur/unlock key reset, pitch bounds |
| Selection | Registered hit only, invalid-ID rejection, list/canvas/inspector synchronization |
| Lifecycle | StrictMode remount, pending-init unmount, resize/hidden state, context loss, idempotent disposal; one canvas/loop |
| Security | AST/module-graph import checks, forbidden capability/asset absence, complete guarded native audit |
| Accessibility | Keyboard-only equivalent path, visible focus, Escape/Tab exit, label/status text, reduced motion |
| Browser | Desktop themes, mobile SVG, WebGL failure, pointer-lock denial, all six routes, no external/backend requests |
| Performance | Profile declared hardware/browser; proposed ≤150 draw calls and ≤100k triangles; target 60 FPS desktop; report measured results |

Budgets are proposed acceptance targets, not measurements. No browser, GPU or
Three.js API compatibility has been verified by the current C10-only typecheck.
Use existing Node/TypeScript tooling for pure tests; add no framework/package merely
to test this slice. New browser execution and real native build execution require
their satisfied prerequisites and explicit scope. Do not replace real lifecycle
or request auditing with mocks.

## Implementation order after explicit GO

1. Integrate a primitive overview host with all eight marker IDs, shared selection,
   resource cleanup, accessible HTML and forced SVG fallback. No first-person code.
2. Add fixture-derived rooms/desks/avatars and theme mapping; verify geometry and
   resource budgets before enabling more interactions.
3. Add first-person input/collision and explicit pointer-lock lifecycle; verify
   denial, Escape/Tab, route reset and keyboard alternatives.
4. Run the authorized type/fixture/guard/build/browser/asset audits and report all
   limitations. Keep unsupported paths on SVG; do not claim production readiness.

The later owner-authorized C11-M1 instruction grants implementation GO for
procedural overview, bounded orbit/pan/zoom, shared selection and fallback.
First-person controls are excluded from this initial implementation. GOV-01 reviewer disposition,
merge and deployment are separate decisions. All existing operational exclusions
remain unchanged.
