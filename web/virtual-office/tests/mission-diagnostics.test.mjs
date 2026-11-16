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
import { test } from 'node:test';

const { createMissionPreview, stepMissionPreview, resetMissionPreview } = load('mission/preview.ts');
const { diagnoseMission, diagnoseAssignments, captureMissionVariant, compareMissionVariants } = load('mission/diagnostics.ts');
const { tasks } = load('demo/fixtures.ts');
const [a, b, c, d] = tasks;
const plan = {
  taskIds: [d.id, c.id, b.id, a.id],
  edges: [{ prerequisiteId: a.id, dependentId: c.id }, { prerequisiteId: b.id, dependentId: c.id }, { prerequisiteId: c.id, dependentId: d.id }],
};
const assignments = Object.fromEntries(tasks.slice(0, 4).map((task) => [task.id, task.agentIds[0]]));
const variant = captureMissionVariant(plan, [], assignments);
const advance = (state, steps) => {
  for (let i = 0; i < steps; i++) state = stepMissionPreview(state);
  return state;
};
const task = (diagnostics, id) => diagnostics.tasks.find((row) => row.id === id);

test('projects direct blockers, final completion, and fixture-order selection', () => {
  const initial = createMissionPreview(plan, [], assignments);
  const first = diagnoseMission(initial);
  assert.equal(first.next.taskId, a.id);
  assert.equal(first.next.reason, 'fixture-order');
  assert.equal(task(first, c.id).status, 'Blocked');
  assert.equal(task(first, c.id).prerequisites.join(), [a.id, b.id].join());
  assert.equal(task(first, c.id).unmet.join(), [a.id, b.id].join());
  assert.equal(task(first, d.id).unmet.join(), c.id);
  const active = diagnoseMission(advance(initial, 1));
  assert.equal(active.next.taskId, a.id);
  assert.equal(active.next.type, 'completed');
  assert.equal(active.next.reason, 'active');
  assert.equal(task(active, a.id).status, 'Active');
  const partial = diagnoseMission(advance(initial, 2));
  assert.equal(task(partial, c.id).unmet.join(), b.id);
  assert.equal(task(partial, c.id).unblockedBy, undefined);
  const ready = diagnoseMission(advance(initial, 4));
  assert.equal(task(ready, c.id).status, 'Ready');
  assert.equal(task(ready, c.id).unblockedBy.taskId, b.id);
  assert.equal(task(ready, c.id).unblockedBy.step, 4);
  assert.equal(task(ready, c.id).unblockedBy.provenance, 'hypothetical');
  const terminal = diagnoseMission(advance(initial, 8));
  assert.equal(terminal.next, undefined);
  assert.equal(terminal.terminal, true);
  assert.equal(terminal.allAssumed, false);
  assert.equal(task(terminal, c.id).status, 'Completed');
});

test('distinguishes assumed completion and all-assumed terminal previews', () => {
  const initial = createMissionPreview(plan, [a.id], assignments);
  assert.equal(task(diagnoseMission(initial), a.id).status, 'Assumed complete');
  const ready = diagnoseMission(advance(initial, 2));
  assert.equal(task(ready, c.id).unblockedBy.taskId, b.id);
  const allAssumed = createMissionPreview(plan, plan.taskIds, {});
  assert.equal(diagnoseMission(allAssumed).allAssumed, true);
  assert.equal(diagnoseMission(allAssumed).terminal, true);
  assert.equal(diagnoseMission(allAssumed).next, undefined);
  assert.equal(allAssumed.events.length, 0);
});

test('reports missing, ineligible and eligible assignments from fixtures', () => {
  const rows = diagnoseAssignments(plan, [a.id], { [c.id]: 'unknown', [d.id]: assignments[d.id] });
  const row = (id) => rows.find(({ taskId }) => taskId === id);
  assert.equal(row(a.id).status, 'not-required');
  assert.equal(row(b.id).status, 'missing');
  assert.equal(row(c.id).status, 'invalid');
  assert.equal(row(d.id).status, 'eligible');
  assert.equal(row(d.id).agentId, assignments[d.id]);
  assert.equal(row(a.id).eligibleAgentIds.join(), a.agentIds.join());
  assert.throws(() => captureMissionVariant(plan, [], {}), /proposed agent/);
  assert.throws(() => captureMissionVariant(plan, [], { ...assignments, [a.id]: 'unknown' }), /eligible/);
  assert.throws(() => captureMissionVariant(plan, [d.id], assignments), /prerequisite/);
});

test('captures detached inputs and compares attribution independently of order and step count', () => {
  const source = { taskIds: [...plan.taskIds], edges: plan.edges.map((edge) => ({ ...edge })) };
  const proposed = { ...assignments };
  const assumptions = [];
  const captured = captureMissionVariant(source, assumptions, proposed);
  source.taskIds.pop();
  source.edges[0].dependentId = d.id;
  proposed[a.id] = a.agentIds[1];
  assumptions.push(a.id);
  assert.equal(JSON.stringify(captured), JSON.stringify(variant));

  const reassigned = captureMissionVariant(plan, [], { ...assignments, [a.id]: a.agentIds[1] });
  const comparison = compareMissionVariants(captured, reassigned);
  assert.equal(comparison.assignmentsChanged, true);
  assert.equal(comparison.eventAttributionChanged, true);
  for (const key of ['membershipChanged', 'dependenciesChanged', 'assumptionsChanged', 'eventOrderChanged', 'stepCountChanged', 'terminalStatesChanged']) {
    assert.equal(comparison[key], false, key);
  }
  assert.equal(comparison.left.events[0].agentId, a.agentIds[0]);
  assert.equal(comparison.right.events[0].agentId, a.agentIds[1]);
  assert.equal(JSON.stringify(compareMissionVariants(captured, reassigned)), JSON.stringify(comparison));
  assert.equal(JSON.stringify(advance(resetMissionPreview(comparison.left), 8)), JSON.stringify(comparison.left));
});

test('reports changed membership, edges, assumptions, steps and terminal task states', () => {
  const onlyA = captureMissionVariant({ taskIds: [a.id], edges: [] }, [a.id], {});
  const comparison = compareMissionVariants(variant, onlyA);
  for (const key of ['membershipChanged', 'dependenciesChanged', 'assumptionsChanged', 'eventOrderChanged', 'stepCountChanged', 'terminalStatesChanged']) {
    assert.equal(comparison[key], true, key);
  }
  assert.equal(comparison.right.events.length, 0);
  assert.equal(comparison.right.terminal, true);
});

test('keeps disconnected tasks in fixture order when they share an eligible agent', () => {
  const other = tasks[7];
  const agentId = a.agentIds[0];
  const independent = { taskIds: [other.id, a.id], edges: [] };
  const proposed = { [a.id]: agentId, [other.id]: agentId };
  const initial = createMissionPreview(independent, [], proposed);
  const diagnostics = diagnoseMission(initial);
  assert.equal(diagnostics.next.taskId, a.id);
  assert.equal(task(diagnostics, other.id).status, 'Ready');
  assert.equal(task(diagnostics, other.id).unblockedBy, undefined);
  const result = advance(initial, 4);
  assert.equal(result.terminal, true);
  assert.equal(result.events.map((event) => event.agentId).join(), Array(4).fill(agentId).join());
});
