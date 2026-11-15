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
const { compareCoordination } = load('coordination/preview.ts');
const { tasks } = load('demo/fixtures.ts');
const freeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const initial = initialSnapshot('day', 42);
const taskId = initial.plans[0].taskId;
const empty = compareCoordination(freeze(initial), taskId, 'review');
assert.ok(empty.equal && empty.observed.interactions.length === 0 && empty.hypothetical.interactions.length === 0);
let baseline = initial;
for (let i = 0; i < 32; i++) baseline = stepSnapshot(baseline);
freeze(baseline);
const before = JSON.stringify(baseline);
const comparison = compareCoordination(baseline, taskId, 'collaboration');
assert.equal(JSON.stringify(comparison), JSON.stringify(compareCoordination(baseline, taskId, 'collaboration')));
assert.equal(JSON.stringify(baseline), before);
assert.equal(comparison.tick, 32);
assert.ok(comparison.observed.interactions.length && comparison.hypothetical.interactions.length);
assert.ok(comparison.observed.interactions.every((item) => baseline.events.includes(item.evidence)));
assert.ok(comparison.hypothetical.interactions.every((item) => item.id.startsWith('preview-') && !('evidence' in item)));
assert.equal(new Set(comparison.hypothetical.interactions.map((item) => item.id)).size, comparison.hypothetical.interactions.length);
const unassigned = tasks.find((task) => !baseline.plans.some((plan) => plan.taskId === task.id));
assert.ok(unassigned);
assert.equal(compareCoordination(baseline, unassigned.id, 'review').hypothetical.participants.length, 0);
for (const args of [
  [baseline, 'missing', 'review'], [baseline, taskId, 'missing'], [baseline, taskId, 'day'],
  [{ ...baseline, tick: -1 }, taskId, 'review'], [{ ...baseline, tick: 33 }, taskId, 'review'],
  [{ ...baseline, tick: 1.5 }, taskId, 'review'], [{ ...baseline, seed: -1 }, taskId, 'review'],
]) assert.throws(() => compareCoordination(...args));
console.log('PASS: frozen baseline, determinism, provenance, equal and unassigned outcomes, horizon and input validation.');
