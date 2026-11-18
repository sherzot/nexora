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

const {
  emptyScenarioCollection, captureScenario, removeScenario, evaluateScenario,
  compareScenarios, recommendCollection, recordPreference, decisionInvalidation,
} = load('mission/scenarios.ts');
const { tasks } = load('demo/fixtures.ts');
const [a, b, c, d] = tasks;
const ids = [a.id, b.id, c.id, d.id];
const edge = (prerequisite, dependent) => ({ prerequisiteId: prerequisite.id, dependentId: dependent.id });
const input = {
  plan: { taskIds: ids, edges: [edge(a, c), edge(b, c)] },
  assumptions: [],
  assignments: Object.fromEntries([a, b, c, d].map(({ id, agentIds }) => [id, agentIds[0]])),
};
const blocked = 'fewer-initial-blockers';
const edges = 'fewer-prerequisite-edges';
const capture = (collection, slot, value = input, revision = collection.lastRevision + 1) => {
  const result = captureScenario(collection, slot, revision, value);
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.collection;
};
const compare = (collection, left, right, criteria = [blocked]) =>
  compareScenarios(evaluateScenario(collection.slots[left]), evaluateScenario(collection.slots[right]), criteria);
const allPairs = (collection, criteria) => {
  const slots = Object.keys(collection.slots);
  return slots.flatMap((left, index) => slots.slice(index + 1).map((right) => compare(collection, left, right, criteria)));
};

test('captures detached, immutable, deterministically replayable inputs', () => {
  const source = JSON.parse(JSON.stringify(input));
  const collection = capture(emptyScenarioCollection, 'A', source);
  const scenario = collection.slots.A;
  const captured = JSON.stringify(scenario);
  source.plan.taskIds.pop();
  source.plan.edges[0].dependentId = d.id;
  source.assumptions.push(a.id);
  source.assignments[a.id] = 'different';
  assert.equal(JSON.stringify(scenario), captured);
  for (const value of [scenario, scenario.ref, scenario.input, scenario.input.plan,
    scenario.input.plan.taskIds, scenario.input.plan.edges, scenario.input.plan.edges[0],
    scenario.input.assumptions, scenario.input.assignments]) {
    assert.ok(Object.isFrozen(value));
  }
  const evaluated = evaluateScenario(scenario);
  assert.equal(evaluated.kind, 'valid');
  assert.equal(Array.from(evaluated.readiness.initial.ready).join(), [a.id, b.id, d.id].join());
  assert.equal(evaluated.readiness.initial.blocked[0].unmet.join(), [a.id, b.id].join());
  assert.equal(evaluated.terminal.events.length, 8);
  assert.ok(evaluated.terminal.events.every(({ provenance }) => provenance === 'hypothetical'));
  assert.equal(JSON.stringify(evaluateScenario(scenario)), JSON.stringify(evaluated));
});

test('bounds the slots, rejects invalid captures, and never reuses a removed or replaced revision', () => {
  let collection = capture(emptyScenarioCollection, 'A');
  collection = capture(collection, 'B');
  collection = capture(collection, 'C');
  assert.equal(Object.keys(collection.slots).sort().join(), 'A,B,C');
  assert.equal(captureScenario(collection, 'D', 4, input).ok, false);
  assert.equal(removeScenario(collection, 'D'), collection);
  const original = collection.slots.A;
  const invalid = captureScenario(collection, 'A', 4, { ...input, assignments: {} });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.issues.some(({ code }) => code === 'missing-assignment'));
  assert.equal(collection.slots.A, original);
  collection = removeScenario(collection, 'B');
  assert.equal(collection.lastRevision, 3);
  assert.equal(captureScenario(collection, 'B', 2, input).ok, false);
  collection = capture(collection, 'B');
  assert.equal(collection.slots.B.ref.revision, 4);
  collection = capture(collection, 'A');
  assert.equal(collection.slots.A.ref.revision, 5);
  assert.equal(captureScenario(collection, 'A', original.ref.revision, input).ok, false);
});

test('applies R1 fairness to assignments, assumptions, membership, and invalid or insufficient evidence', () => {
  const reassigned = { ...input, assignments: { ...input.assignments, [a.id]: a.agentIds[1] } };
  let collection = capture(capture(emptyScenarioCollection, 'A'), 'B', reassigned);
  const tied = compare(collection, 'A', 'B', [blocked, edges]);
  assert.equal(tied.kind, 'tie');
  assert.equal(tied.evidence.provenance, 'hypothetical');
  const left = evaluateScenario(collection.slots.A);
  const right = evaluateScenario(collection.slots.B);
  const order = (result) => JSON.stringify(result.terminal.events.map(({ taskId, type }) => [taskId, type]));
  assert.equal(order(left), order(right));
  assert.notEqual(left.terminal.events[0].agentId, right.terminal.events[0].agentId);
  assert.equal(compare(collection, 'A', 'B', []).reason, 'insufficient-evidence');

  collection = capture(collection, 'B', { ...input, assumptions: [a.id] });
  assert.equal(compare(collection, 'A', 'B').reason, 'different-assumptions');
  const { [d.id]: removed, ...assignments } = input.assignments;
  collection = capture(collection, 'B', { ...input, plan: { ...input.plan, taskIds: ids.slice(0, 3) }, assignments });
  assert.equal(compare(collection, 'A', 'B').reason, 'different-membership');
  const invalid = evaluateScenario({ ref: collection.slots.B.ref, input: { ...input, assignments: {} } });
  assert.equal(invalid.kind, 'invalid');
  assert.equal(compareScenarios(left, invalid, [blocked]).reason, 'invalid');

  const assumed = { ...input, assumptions: ids, assignments: {} };
  collection = capture(collection, 'B', assumed);
  const terminal = evaluateScenario(collection.slots.B);
  assert.equal(terminal.terminal.events.length, 0);
  assert.ok(terminal.terminal.tasks.every(({ status }) => status === 'Assumed complete'));
  assert.equal(compare(collection, 'A', 'B').kind, 'withheld');
  collection = capture(collection, 'A', assumed);
  assert.equal(compare(collection, 'A', 'B').kind, 'tie');
});

test('reports trade-offs and requires one candidate to lead every occupied comparison', () => {
  const fanIn = { ...input, plan: { taskIds: ids, edges: [edge(a, d), edge(b, d), edge(c, d)] } };
  const separate = { ...input, plan: { taskIds: ids, edges: [edge(a, c), edge(b, d)] } };
  const noEdges = { ...input, plan: { taskIds: ids, edges: [] } };
  let collection = capture(capture(emptyScenarioCollection, 'A', fanIn), 'B', separate);
  const criteria = [blocked, edges];
  const conflict = compare(collection, 'A', 'B', criteria);
  assert.equal(conflict.kind, 'trade-off');
  assert.deepEqual(JSON.parse(JSON.stringify(conflict.evidence.observations)), [
    { criterion: blocked, left: 1, right: 2 },
    { criterion: edges, left: 3, right: 2 },
  ]);
  collection = capture(collection, 'C', noEdges);
  assert.equal(recommendCollection(allPairs(collection, criteria), collection, criteria).slot, 'C');
  const partial = [compare(collection, 'A', 'C', criteria)];
  assert.equal(recommendCollection(partial, collection, criteria), null);
  collection = capture(collection, 'B', noEdges);
  assert.equal(recommendCollection(allPairs(collection, criteria), collection, criteria), null);
});

test('records the exact preference and rejects stale selected or compared revisions', () => {
  let collection = capture(capture(emptyScenarioCollection, 'A'), 'B');
  const criteria = [blocked];
  const evidence = allPairs(collection, criteria);
  const selected = collection.slots.A.ref;
  const result = recordPreference(collection, selected, criteria, evidence, 'Keep A for local discussion.');
  assert.equal(result.ok, true);
  assert.equal(result.record.preferred.ref.revision, selected.revision);
  assert.equal(result.record.provenance, 'hypothetical');
  assert.equal(result.record.rationale, 'Keep A for local discussion.');
  assert.equal(decisionInvalidation(result.record, collection, criteria), null);
  assert.equal(decisionInvalidation(result.record, collection, [edges]), 'criteria-changed');
  assert.equal(recordPreference(collection, selected, [edges], evidence, '').ok, false);
  const added = capture(collection, 'C');
  assert.equal(decisionInvalidation(result.record, added, criteria), 'scenario-added');
  assert.equal(recordPreference(added, selected, criteria, evidence, '').ok, false);
  const removed = removeScenario(collection, 'B');
  assert.equal(decisionInvalidation(result.record, removed, criteria), 'scenario-removed');
  collection = capture(collection, 'B');
  assert.equal(decisionInvalidation(result.record, collection, criteria), 'scenario-replaced');
  assert.equal(recordPreference(collection, selected, criteria, evidence, '').ok, false);
  collection = capture(collection, 'A');
  assert.equal(recordPreference(collection, selected, criteria, allPairs(collection, criteria), '').ok, false);
  assert.equal(emptyScenarioCollection.lastRevision, 0);
  assert.equal(Object.keys(emptyScenarioCollection.slots).length, 0);
});
