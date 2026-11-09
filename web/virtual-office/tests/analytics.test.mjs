import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = fileURLToPath(new URL('../src/', import.meta.url)), cache = new Map();
function load(filename) {
  const absolute = path.resolve(root, filename); assert.ok(absolute.startsWith(root) && absolute.endsWith('.ts'));
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const output = ts.transpileModule(readFileSync(absolute, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }; cache.set(absolute, module);
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => { assert.ok(name.startsWith('.')); return load(path.relative(root, path.resolve(path.dirname(absolute), name + '.ts'))); } });
  return module.exports;
}
const { initialSnapshot, stepSnapshot } = load('simulation/engine.ts');
const { deriveMetrics, basisPoints, percent } = load('analytics/metrics.ts');
const { compareScenarios } = load('analytics/comparison.ts');
const { filterEvents } = load('analytics/selectors.ts');
const { createReport, reportJson, reportCsv, csvCell } = load('analytics/export.ts');
const { activityOrder } = load('analytics/model.ts');
const plain = (value) => JSON.parse(JSON.stringify(value));
const snapshotAt = (tick, scenario = 'day', seed = 42) => { let state = initialSnapshot(scenario, seed); for (let i = 0; i < tick; i++) state = stepSnapshot(state); return state; };
let count = 0;
const test = (name, run) => { run(); count++; console.log('PASS:', name); };
test('zero horizon has no observed duration or utilization estimate', () => {
  const m = deriveMetrics(initialSnapshot()); assert.equal(m.totalEvents, 0); assert.equal(m.eligibleAgentMs, 0); assert.equal(m.utilizationBps, null); assert.equal(m.taskCount, 8); assert.equal(m.progressBps, 0);
  assert.ok(m.zones.every((zone) => zone.shareBps === null)); assert.equal(percent(null), '—');
});
test('one observed tick is initial idle, not paused wall time', () => {
  const m = deriveMetrics(snapshotAt(1)); assert.equal(m.eligibleAgentMs, 4000); assert.equal(m.activeMs, 0); assert.equal(m.inactiveMs, 4000); assert.equal(m.utilizationBps, 0);
  assert.ok(m.agents.every((agent) => agent.durationMs.idle === 500));
});
test('every prefix matches an independent per-tick state integration', () => {
  for (const scenario of ['day', 'collaboration', 'review']) {
    let state = initialSnapshot(scenario, 42);
    const expected = Object.fromEntries(state.agents.map((agent) => [agent.id, Object.fromEntries(activityOrder.map((activity) => [activity, 0]))]));
    for (let tick = 0; tick <= 32; tick++) {
      const metrics = deriveMetrics(state);
      for (const agent of metrics.agents) assert.deepEqual(plain(agent.durationMs), expected[agent.id]);
      assert.equal(metrics.zones.reduce((sum, zone) => sum + zone.durationMs, 0), tick * 500 * 8);
      if (tick < 32) { for (const agent of state.agents) expected[agent.id][agent.activity] += 500; state = stepSnapshot(state); }
    }
  }
});
test('full-horizon active denominator excludes idle and completed', () => {
  const m = deriveMetrics(snapshotAt(32)); assert.equal(m.activeMs, 80000); assert.equal(m.eligibleAgentMs, 128000); assert.equal(m.utilizationBps, 6250); assert.equal(percent(m.utilizationBps), '62.50%');
  assert.equal(m.activeMs + m.inactiveMs, m.eligibleAgentMs); assert.equal(m.progressBps, 10000);
});
test('agent filtering deduplicates linked fixture tasks and preserves denominators', () => {
  const state = snapshotAt(32), all = deriveMetrics(state), ada = deriveMetrics(state, 'demo-agent-ada');
  assert.equal(ada.agents.length, 1); assert.equal(ada.eligibleAgentMs, 16000); assert.equal(ada.taskCount, 2); assert.equal(ada.utilizationBps, 6250);
  assert.equal(all.taskCount, 8); assert.equal(new Set(ada.tasks.map((task) => task.id)).size, ada.taskCount);
  const empty = deriveMetrics(state, 'unknown'); assert.equal(empty.taskCount, 0); assert.equal(empty.completionBps, null); assert.equal(empty.utilizationBps, null);
});
test('incomplete histories never invent duration estimates', () => {
  const state = snapshotAt(32);
  for (const broken of [{ ...state, events: state.events.slice(1) }, { ...state, events: [] }, { ...state, agents: [] }]) {
    const m = deriveMetrics(broken); assert.equal(m.historyComplete, false); assert.equal(m.activeMs, null); assert.equal(m.utilizationBps, null); assert.ok(m.agents.every((agent) => agent.durationMs === null));
  }
  assert.throws(() => deriveMetrics({ ...state, virtualMs: 1 }));
});
test('basis-point rounding is explicit, including thirds and half up', () => {
  assert.equal(basisPoints(1, 3), 3333); assert.equal(basisPoints(2, 3), 6667); assert.equal(basisPoints(1, 32), 313); assert.equal(percent(313), '3.13%');
});
test('comparison has equal seed/horizon/scope without mutating live snapshot', () => {
  const live = snapshotAt(7, 'review', 9), before = JSON.stringify(live);
  const first = compareScenarios(live.seed, 16, 'demo-agent-ada'); assert.deepEqual(plain(first), plain(compareScenarios(9, 16, 'demo-agent-ada')));
  assert.equal(first.length, 3); assert.ok(first.every((m) => m.seed === 9 && m.tick === 16 && m.agentIds.length === 1));
  assert.equal(JSON.stringify(live), before); assert.throws(() => compareScenarios(42, 33));
});
test('filter combinations are inclusive, ordered, read-only and empty-safe', () => {
  const state = snapshotAt(32), before = JSON.stringify(state.events), sample = state.events.find((event) => event.activity === 'reviewing');
  const filtered = filterEvents([...state.events].reverse(), { agentId: sample.agentId, activity: sample.activity, zoneId: sample.zoneId, fromTick: sample.tick, toTick: sample.tick });
  assert.ok(filtered.some((event) => event.id === sample.id)); assert.ok(filtered.every((event) => event.tick === sample.tick));
  assert.equal(filterEvents(state.events, { search: 'ada' }).length, state.events.filter((event) => event.agentId === 'demo-agent-ada').length);
  assert.equal(filterEvents(state.events, { fromTick: 32, toTick: 0 }).length, 0); assert.equal(filterEvents([], {}).length, 0);
  assert.equal(JSON.stringify(state.events), before); const ordered = filterEvents([...state.events].reverse(), {}); assert.deepEqual(plain(ordered), plain(state.events));
});
test('JSON and CSV are byte-identical for identical inputs and expose schema/definitions', () => {
  const state = snapshotAt(16), before = JSON.stringify(state);
  const report = createReport(deriveMetrics(state), compareScenarios(42, 32));
  assert.equal(report.schemaVersion, 1); assert.equal(report.horizon.tickMs, 500); assert.ok(report.definitions.length >= 8);
  assert.equal(reportJson(report), reportJson(createReport(deriveMetrics(state), compareScenarios(42, 32))));
  assert.equal(reportCsv(report), reportCsv(createReport(deriveMetrics(state), compareScenarios(42, 32))));
  assert.ok(reportCsv(report).startsWith('schema_version,record,scenario')); assert.ok(reportCsv(report).includes('comparison_zone')); assert.equal(JSON.stringify(state), before);
  assert.throws(() => createReport(deriveMetrics(state), compareScenarios(43, 32)));
});
test('CSV escapes commas, quotes, newlines and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('Ada, "demo"\nline'), '"Ada, ""demo""\nline"'); assert.equal(csvCell(null), ''); assert.equal(csvCell(123), '123'); assert.equal(csvCell('=1+1'), "'=1+1");
});
console.log(`PASS: ${count} analytics metric/filter/comparison/export regressions.`);
