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

const { createReadinessReport, createDecisionSummary } = load('mission/readiness.ts');
const { captureMissionVariant } = load('mission/diagnostics.ts');
const { tasks } = load('demo/fixtures.ts');
const [a, b, c, d] = tasks;
const edges = [a, b].map(({ id }) => ({ prerequisiteId: id, dependentId: c.id }));
const input = {
  plan: { taskIds: [d.id, c.id, b.id, a.id], edges },
  assumptions: [],
  assignments: Object.fromEntries([a, b, c, d].map(({ id, agentIds }) => [id, agentIds[0]])),
};
const issueCodes = (report) => Array.from(report.issues, ({ code }) => code);
const capture = (value) => captureMissionVariant(value.plan, value.assumptions, value.assignments);

test('classifies empty and missing assignments as incomplete and assigns precedence to invalid issues', () => {
  const empty = createReadinessReport({ plan: { taskIds: [], edges: [] }, assumptions: [], assignments: {} });
  assert.equal(empty.status, 'incomplete');
  assert.ok(issueCodes(empty).includes('empty-plan'));
  const missing = createReadinessReport({ ...input, assignments: {} });
  assert.equal(missing.status, 'incomplete');
  assert.equal(missing.issues.filter(({ code }) => code === 'missing-assignment').length, 4);
  const invalid = createReadinessReport({ ...input, assignments: { [a.id]: 'unknown-agent', 'unknown-task': a.agentIds[0] } });
  assert.equal(invalid.status, 'invalid');
  assert.ok(issueCodes(invalid).includes('invalid-assignment'));
  assert.ok(issueCodes(invalid).includes('assignment-outside-plan'));
});

test('withholds initial readiness for invalid graph or conflicting assumptions', () => {
  const cyclic = createReadinessReport({ ...input, plan: { ...input.plan, edges: [
    ...edges, { prerequisiteId: c.id, dependentId: a.id },
  ] } });
  const inconsistent = createReadinessReport({ ...input, assumptions: [c.id] });
  for (const report of [cyclic, inconsistent]) {
    assert.equal(report.status, 'invalid');
    assert.equal(report.initial, null);
    assert.ok(issueCodes(report).includes('plan-validation'));
  }
});

test('reports fan-in blockers and disconnected initial readiness without failing the configuration', () => {
  const report = createReadinessReport(input);
  assert.equal(report.status, 'valid-for-hypothetical-preview');
  assert.equal(report.taskCount, 4);
  assert.equal(report.edges.length, 2);
  assert.deepEqual(Array.from(report.initial.ready), [a.id, b.id, d.id]);
  assert.equal(report.initial.blocked[0].taskId, c.id);
  assert.deepEqual(Array.from(report.initial.blocked[0].unmet), [a.id, b.id]);
  assert.equal(report.assignments.filter(({ status }) => status === 'eligible').length, 4);
});

test('all-assumed input is previewable with a zero-transition terminal outcome', () => {
  const assumed = { ...input, assumptions: input.plan.taskIds, assignments: {} };
  const baseline = capture(input);
  const alternative = capture(assumed);
  const { draft, comparison } = createDecisionSummary(assumed, baseline, alternative);
  assert.equal(draft.status, 'valid-for-hypothetical-preview');
  assert.equal(draft.initial.assumedComplete.length, 4);
  assert.equal(comparison.outcome.right.terminal, true);
  assert.equal(comparison.outcome.right.events.length, 0);
  assert.equal(comparison.outcome.stepCountChanged, true);
  assert.equal(comparison.provenance, 'hypothetical');
  assert.ok(comparison.assumptionFindings.some(({ taskId }) => taskId === c.id));
});

test('eligible assignment-only alternatives preserve transitions and captured inputs', () => {
  const baseline = capture(input);
  const edited = { ...input, assignments: { ...input.assignments, [a.id]: a.agentIds[1] } };
  const alternative = capture(edited);
  const original = JSON.stringify([baseline, alternative]);
  const first = createDecisionSummary(edited, baseline, alternative);
  assert.equal(first.comparison.outcome.eventAttributionChanged, true);
  assert.equal(first.comparison.outcome.eventOrderChanged, false);
  assert.equal(first.comparison.outcome.stepCountChanged, false);
  assert.equal(first.comparison.outcome.left.events[0].agentId, a.agentIds[0]);
  assert.equal(first.comparison.outcome.right.events[0].agentId, a.agentIds[1]);
  assert.equal(JSON.stringify(createDecisionSummary(edited, baseline, alternative)), JSON.stringify(first));
  assert.equal(JSON.stringify([baseline, alternative]), original);
});

test('reports dependency and membership differences and excludes invalid variants', () => {
  const baseline = capture(input);
  const withoutEdges = { ...input, plan: { ...input.plan, edges: [] } };
  const dependency = createDecisionSummary(withoutEdges, baseline, capture(withoutEdges)).comparison;
  assert.equal(dependency.outcome.dependenciesChanged, true);
  assert.equal(dependency.baseline.initial.blocked.length, 1);
  assert.equal(dependency.alternative.initial.blocked.length, 0);

  const smaller = {
    ...input,
    plan: { ...input.plan, taskIds: input.plan.taskIds.filter((id) => id !== d.id) },
    assignments: Object.fromEntries(Object.entries(input.assignments).filter(([id]) => id !== d.id)),
  };
  const membership = createDecisionSummary(smaller, baseline, capture(smaller)).comparison;
  assert.equal(membership.outcome.membershipChanged, true);
  assert.equal(membership.outcome.stepCountChanged, true);
  assert.equal(membership.outcome.terminalStatesChanged, true);
  assert.equal(createDecisionSummary(input, baseline, { ...smaller, assignments: {} }).comparison, null);
});

test('attributes final fan-in satisfaction only to the corresponding hypothetical event', () => {
  const baseline = capture(input);
  const hypothetical = { ...input, assumptions: [a.id, b.id] };
  const alternative = capture(hypothetical);
  const comparison = createDecisionSummary(hypothetical, baseline, alternative).comparison;

  const blockers = comparison.resolvedBlockers;
  assert.equal(blockers.baseline.length, 1);
  assert.equal(blockers.baseline[0].taskId, c.id);
  assert.equal(blockers.baseline[0].event.taskId, b.id);
  assert.equal(blockers.baseline[0].event.type, 'completed');
  assert.equal(blockers.baseline[0].event.provenance, 'hypothetical');
  assert.equal(blockers.baseline[0].event.step, 4);
  assert.equal(blockers.alternative.length, 0);
  assert.ok(comparison.assumptionFindings.every(({ source }) => source === 'variant-inputs'));
});
