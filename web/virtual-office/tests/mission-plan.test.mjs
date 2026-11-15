import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/mission/plan.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
});
const exports = {};
vm.runInNewContext(outputText, { exports });
const { comparePlans, evaluatePlan, validatePlan } = exports;
const catalog = ['a', 'b', 'c', 'd'];
const edge = (prerequisiteId, dependentId) => ({ prerequisiteId, dependentId });
const plan = (taskIds, edges = []) => ({ taskIds, edges });
const plain = (value) => JSON.parse(JSON.stringify(value));

test('evaluates dependencies and disconnected tasks in fixture order', () => {
  const valid = plan(['d', 'c', 'b', 'a'], [edge('b', 'c'), edge('a', 'c'), edge('a', 'b')]);
  assert.equal(validatePlan(valid, catalog), undefined);
  assert.deepEqual(plain(evaluatePlan(valid, ['a'], catalog).tasks), [
    { id: 'a', status: 'Assumed complete', unmet: [] },
    { id: 'b', status: 'Ready in this plan', unmet: [] },
    { id: 'c', status: 'Blocked in this plan', unmet: ['b'] },
    { id: 'd', status: 'Ready in this plan', unmet: [] },
  ]);
  assert.deepEqual(plain(evaluatePlan(valid, [], catalog).tasks[2].unmet), ['a', 'b']);
});

test('rejects invalid edits without mutating input', () => {
  const prior = Object.freeze(plan(Object.freeze(['a', 'b', 'c']),
    Object.freeze([Object.freeze(edge('a', 'b')), Object.freeze(edge('b', 'c'))])));
  for (const [candidate, error] of [
    [plan(['unknown']), /Unknown task/],
    [plan(['a', 'a']), /once/],
    [plan(prior.taskIds, [...prior.edges, edge('a', 'unknown')]), /Unknown dependency/],
    [plan(prior.taskIds, [...prior.edges, edge('a', 'd')]), /Select both/],
    [plan(prior.taskIds, [...prior.edges, edge('a', 'b')]), /already exists/],
    [plan(prior.taskIds, [...prior.edges, edge('a', 'a')]), /itself/],
    [plan(prior.taskIds, [...prior.edges, edge('c', 'a')]), /cycle/],
  ]) {
    assert.match(validatePlan(candidate, catalog), error);
    assert.match(evaluatePlan(candidate, [], catalog).error, error);
  }
  assert.deepEqual(prior, plan(['a', 'b', 'c'], [edge('a', 'b'), edge('b', 'c')]));
});

test('rejects inconsistent completion assumptions and keeps readiness out of invalid results', () => {
  const draft = plan(['a', 'b'], [edge('a', 'b')]);
  assert.match(evaluatePlan(draft, ['d'], catalog).error, /selected tasks/);
  const result = evaluatePlan(draft, ['b'], catalog);
  assert.match(result.error, /b complete.*a/);
  assert.equal(result.tasks.length, 0);
});

test('comparison ignores insertion order, applies common assumptions and reports plan-only tasks', () => {
  const reference = plan(['a', 'b'], [edge('a', 'b')]);
  const same = plan(['b', 'a'], [edge('a', 'b')]);
  const changed = plan(['a', 'b', 'd'], [edge('a', 'b')]);
  assert.equal(comparePlans(reference, same, [], catalog).equal, true);
  const result = comparePlans(reference, changed, ['a', 'd'], catalog);
  assert.equal(result.equal, false);
  assert.deepEqual(plain(result.reference.tasks), plain(result.draft.tasks.slice(0, 2)));
  assert.equal(result.draft.tasks.at(-1).id, 'd');
  assert.equal(result.draft.tasks.at(-1).status, 'Assumed complete');
  assert.deepEqual(reference, plan(['a', 'b'], [edge('a', 'b')]));
});

test('comparison preserves each plan error and handles empty plans', () => {
  const reference = plan(['a', 'b'], [edge('a', 'b')]);
  const draft = plan(['a', 'b']);
  const result = comparePlans(reference, draft, ['b'], catalog);
  assert.match(result.reference.error, /prerequisites are unmet/);
  assert.equal(result.draft.error, undefined);
  assert.equal(result.equal, false);
  const empty = comparePlans(plan([]), plan([]), [], catalog);
  assert.equal(empty.equal, true);
  assert.equal(empty.reference.tasks.length, 0);
});

test('removing a task from the draft preserves reference-only completion assumptions', () => {
  const reference = plan(['a', 'b'], [edge('a', 'b')]);
  const draft = plan(['b']);
  const { reference: a, draft: b } = comparePlans(reference, draft, ['a'], catalog);
  assert.deepEqual(Array.from(a.tasks, ({ status }) => status), ['Assumed complete', 'Ready in this plan']);
  assert.equal(b.error, undefined);
  assert.deepEqual(Array.from(b.tasks, ({ status }) => status), ['Ready in this plan']);
  assert.equal(comparePlans(reference, draft, [], catalog).reference.tasks[1].status, 'Blocked in this plan');
  const invalid = comparePlans(reference, draft, ['b'], catalog);
  assert.match(invalid.reference.error, /prerequisites are unmet/);
  assert.equal(invalid.reference.tasks.length, 0);
});
