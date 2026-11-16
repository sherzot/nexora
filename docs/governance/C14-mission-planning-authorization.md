# C14 mission planning authorization record

## Authority and provenance

The retained project conversation contains the owner instruction titled **NEXORA — C14 FULL BATCH IMPLEMENTATION AUTHORIZATION**, with the decision **APPROVED — EXECUTE C14-S1 THROUGH C14-S4**. It names baseline `4a57dbcda7f4d1b16b067cf486435e6e5fec4553` and branch `feat/c14-virtual-organization-mission-planning`. This record documents that prior bounded decision. The approval source is the retained conversation. A repository-hosted copy of the original instruction, an approval timestamp, and a signature are unavailable in the reviewed evidence.

[PR #29](https://github.com/sherzot/nexora/pull/29) and its engineering reviews provide separate implementation and review evidence. The [follow-up review](https://github.com/sherzot/nexora/pull/29#pullrequestreview-5909326411) describes the historical owner instruction, the exact-head correction and conditional integration recommendation. The [C10 scope record](C10-hybrid-virtual-office-scope.md) retains its historical scope. The [Development Constitution](../../DEVELOPMENT_CONSTITUTION.md) and [Accepted ADRs](../adr/README.md) retain precedence.

## Authorized synthetic frontend work

1. **C14-S1 — Mission Workspace.** Select fixture tasks, edit prerequisites and hypothetical completion assumptions, capture Plan A, edit Plan B, inspect readiness, compare and reset the route-local draft.
2. **C14-S2 — Dependency graph.** Validate prerequisite-to-dependent edges in a pure model. Reject unknown tasks, unselected endpoints, duplicates, self-dependencies, and cycles while preserving the previous valid draft.
3. **C14-S3 — Evaluation and comparison.** Evaluate readiness in fixture order, apply common assumptions to shared tasks, and suppress comparison when either plan has inconsistent assumptions. Keep captured Plan A structurally independent of Plan B.
4. **C14-S4 — Office integration.** Add the Office entry and `#/mission` route. Verify keyboard interaction, focus recovery, history, route lifetime, mobile layouts, Office selection and playback isolation while preserving C12 and C13 journeys.

### Historical eight-file allowlist

All paths were relative to `web/virtual-office/`.

- `src/views/MissionWorkspace.tsx`
- `src/mission/plan.ts`
- `tests/mission-plan.test.mjs`
- `src/App.tsx`
- `src/views/OfficeOverview.tsx`
- `tests/office-mission-journey-browser.mjs`
- `tests/run-office-browser.mjs`
- `README.md`

The original authorization covered implementation, the scoped local verification matrix, scoped commits, a non-force feature branch push, and one PR against `main`. Verification covered TypeScript, fixtures, model and deterministic simulation regressions, collaboration and analytics, C12–C14 journeys, runner and native guard mocks, the guarded build, and Chromium, Firefox and WebKit. The browser scope preserved the macOS Firefox workaround and the Chromium-only CDP designation. Merge, deployment, deletion, force push and changes beyond the eight paths were outside that authorization.

## Correction and integration evidence

The initial formal review at `ee16ffab5417150a6bd0a81efd25f496dd792d64` identified loss of an assumption when a task was removed from Plan B while remaining in captured Plan A. The subsequent focused owner request authorized the correction and verification within the original allowlist. Reviewed feature HEAD [`6c03791c0fd767b3b45693004fac2c5f299af8ad`](https://github.com/sherzot/nexora/commit/6c03791c0fd767b3b45693004fac2c5f299af8ad) retains Plan A-only assumptions, keeps them editable, and adds model and browser coverage. GitHub records squash merge [`6cafc9a694275ee8001a5280126e4470b7e3669e`](https://github.com/sherzot/nexora/commit/6cafc9a694275ee8001a5280126e4470b7e3669e).

The [P1 review thread](https://github.com/sherzot/nexora/pull/29#discussion_r4577204222) asks for a repository record of explicit C14 authority. This record supplies that reconciliation once integrated. Reviewer acceptance and thread disposition remain separate.

## Preserved boundaries

Scope was confined to synthetic presentation. It excluded real scheduling or forecasting, operational Run creation/admission/dispatch, real agent or Workflow execution, Tool or MCP invocation, approval consumption, persistence, backend integration, external calls, new dependencies, schema or infrastructure changes, native policy changes, and production deployment.

D02 remains NOT ACCEPTED. Normative obligations remain REVIEW ONLY. O1–O5 and GO-2026-5932 remain OPEN. This historical record grants no new implementation, integration, or operational authority.
