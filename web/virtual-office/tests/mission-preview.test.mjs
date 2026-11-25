import { test } from 'node:test';
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
const { createMissionPreview, stepMissionPreview, resetMissionPreview } = load('mission/preview.ts');
const { tasks } = load('demo/fixtures.ts');
const [a, b, c] = tasks;
const graph = Object.freeze({
  taskIds: Object.freeze([c.id, b.id, a.id]),
  edges: Object.freeze([Object.freeze({ prerequisiteId: a.id, dependentId: c.id }), Object.freeze({ prerequisiteId: b.id, dependentId: c.id })]),
});
const assignments = Object.freeze(Object.fromEntries([a, b, c].map((task) => [task.id, task.agentIds[0]])));
const start = createMissionPreview(graph, [], assignments);
const advance = (initial) => {
  let state = initial;
  for (let i = 0; i < 6; i++) {
    const next = stepMissionPreview(state);
    assert.equal(next.events.length, state.events.length + 1);
    state = next;
  }
  return state;
};
const end = advance(start);
assert.ok(end.terminal);
assert.equal(stepMissionPreview(end), end);
assert.equal(JSON.stringify(advance(resetMissionPreview(end))), JSON.stringify(end));
assert.equal(JSON.stringify(Array.from(end.events, (event) => [event.step, event.taskId, event.type, event.provenance])),
  JSON.stringify([a, b, c].flatMap((task, i) => [[2*i+1, task.id, 'started', 'hypothetical'], [2*i+2, task.id, 'completed', 'hypothetical']])));
assert.equal(start.events.length, 0);
assert.notEqual(start.input.plan, graph);
assert.notEqual(start.input.plan.edges[0], graph.edges[0]);
assert.notEqual(start.input.assignments, assignments);
assert.equal(start.tasks[2].status, 'Blocked');
let current = stepMissionPreview(stepMissionPreview(start));
assert.equal(current.tasks[2].status, 'Blocked');
assert.equal(current.tasks[2].unmet.join(), b.id);
current = stepMissionPreview(stepMissionPreview(current));
assert.equal(current.tasks[2].status, 'Ready');
const assumed = createMissionPreview(graph, [a.id], { [b.id]: assignments[b.id], [c.id]: assignments[c.id] });
assert.equal(assumed.tasks[0].status, 'Assumed complete');
assert.equal(stepMissionPreview(assumed).events[0].taskId, b.id);
const all = createMissionPreview(graph, [a.id, b.id, c.id], {});
assert.ok(all.terminal && all.events.length === 0);
assert.throws(() => createMissionPreview(graph, [c.id], assignments), /prerequisite/);
assert.throws(() => createMissionPreview(graph, [], {}), /proposed agent/);
assert.throws(() => createMissionPreview(graph, [], { ...assignments, [a.id]: 'unknown' }), /eligible/);
assert.throws(() => createMissionPreview(graph, [], { ...assignments, unknown: 'unknown' }), /selected tasks/);
assert.throws(() => createMissionPreview({ taskIds: [], edges: [] }, [], {}), /Select at least one/);
assert.throws(() => createMissionPreview({ ...graph, edges: [...graph.edges, { prerequisiteId: c.id, dependentId: a.id }] }, [], assignments), /cycle/);
console.log('PASS: dependency order, fixture-order ties, assumed completion, terminal no-op, replay determinism, immutable capture and input rejection.');


const { projectMissionOffice } = load('mission/presentation.ts');
test('mission office projection uses captured task states and keeps display copies detached', () => {
  const original = JSON.stringify(start);
  const view = projectMissionOffice(start);
  assert.equal(view.agents.length, 8);
  assert.equal(view.agents.find(({ id }) => id === assignments[a.id]).label, 'Ready');
  assert.equal(view.agents.find(({ id }) => id === assignments[c.id]).label, 'Blocked');
  assert.equal(view.agents.find(({ id }) => id === 'demo-agent-owen').label, 'Not assigned');
  const active = projectMissionOffice(stepMissionPreview(start));
  assert.equal(active.agents.find(({ id }) => id === assignments[a.id]).tone, 'active');
  assert.equal(active.agents.find(({ id }) => id === assignments[c.id]).tasks[0].unmet.join(), [a.id, b.id].join());
  const terminal = projectMissionOffice(end);
  assert.ok(terminal.agents.filter(({ tasks }) => tasks.length).every(({ label }) => label === 'Completed'));
  view.agents.find(({ id }) => id === assignments[c.id]).tasks[0].unmet.pop();
  view.agents.find(({ id }) => id === assignments[a.id]).tasks[0].status = 'Changed display';
  assert.equal(JSON.stringify(start), original);
  assert.equal(JSON.stringify(projectMissionOffice(resetMissionPreview(end))), JSON.stringify(projectMissionOffice(start)));
});

test('assumed tasks retain their label without inventing assigned agents or completion events', () => {
  const before = JSON.stringify(all);
  const view = projectMissionOffice(all);
  assert.equal(view.unassigned.length, 3);
  assert.ok(view.unassigned.every(({ status }) => status === 'Assumed complete'));
  assert.ok(view.agents.every(({ label }) => label === 'Not assigned'));
  assert.equal(all.events.length, 0);
  const explicitlyAssigned = projectMissionOffice(createMissionPreview(graph, [a.id, b.id, c.id], assignments));
  assert.ok(explicitlyAssigned.agents.filter(({ tasks }) => tasks.length).every(({ tone }) => tone === 'assumed'));
  view.unassigned[0].unmet.push('display only');
  assert.equal(JSON.stringify(all), before);
});

test('an agent with several tasks retains each status instead of claiming all are completed', () => {
  const language = tasks.find(({ id }) => id === 'demo-task-language');
  const input = createMissionPreview({ taskIds: [a.id, language.id], edges: [] }, [], { [a.id]: 'demo-agent-ada', [language.id]: 'demo-agent-ada' });
  const completedFirst = stepMissionPreview(stepMissionPreview(input));
  const view = projectMissionOffice(completedFirst).agents.find(({ id }) => id === 'demo-agent-ada');
  assert.equal(view.label, 'Ready');
  assert.equal(view.tasks.map(({ status }) => status).join(), 'Completed,Ready');
  const activeSecond = projectMissionOffice(stepMissionPreview(completedFirst)).agents.find(({ id }) => id === 'demo-agent-ada');
  assert.equal(activeSecond.label, 'Active');
  assert.equal(activeSecond.tasks[1].id, language.id);
});
