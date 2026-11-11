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
const { createController } = load('simulation/controller.ts');
const { projectCollaboration, interactionLabels } = load('collaboration/projection.ts');
const { agents, tasks } = load('demo/fixtures.ts');

for (const scenario of ['day', 'collaboration', 'review']) {
  for (const seed of [0, 42, 0xffffffff]) {
    let state = initialSnapshot(scenario, seed);
    const initial = projectCollaboration(state);
    const ids = initial.flows.flatMap((flow) => flow.interactions.map((item) => item.id));
    assert.equal(ids.length, new Set(ids).size);
    assert.equal(initial.observed.length, 0);
    for (let tick = 0; tick <= 32; tick++) {
      const before = JSON.stringify(state);
      const projection = projectCollaboration(state);
      assert.equal(JSON.stringify(projection), JSON.stringify(projectCollaboration(state)));
      assert.equal(JSON.stringify(state), before);
      assert.deepEqual(projection.flows.flatMap((flow) => flow.interactions.map((item) => item.id)), ids);
      for (const flow of projection.flows) {
        for (const [i, item] of flow.interactions.entries()) {
          assert.ok(agents.some((agent) => agent.id === item.source));
          assert.ok(agents.some((agent) => agent.id === item.target));
          assert.notEqual(item.source, item.target);
          assert.ok(tasks.find((task) => task.id === item.taskId).agentIds.includes(flow.agentId));
          assert.equal(item.predecessor, flow.interactions[i - 1]?.id);
          if (!item.evidence) { assert.equal(item.status, 'pending'); continue; }
          assert.ok(item.evidence.tick <= tick && item.evidence.virtualMs <= state.virtualMs);
          assert.ok(state.events.includes(item.evidence));
          if (i) assert.ok(flow.interactions[i - 1].evidence.sequence <= item.evidence.sequence);
        }
      }
      assert.ok(projection.observed.every((item, i) => !i || item.evidence.sequence >= projection.observed[i - 1].evidence.sequence));
      if (tick === 32) {
        assert.equal(projection.observed.length, ids.length);
        assert.ok(projection.observed.every((item) => item.status === 'completed'));
      }
      state = stepSnapshot(state);
    }
  }
}
assert.equal(interactionLabels.approval, 'Demo Approval');
assert.match(interactionLabels.review, /Synthetic Review/);
const scheduler = { schedule(fn) { this.pending = fn; return 1; }, cancel() { this.pending = undefined; } };
const controller = createController(scheduler);
const read = () => JSON.stringify(projectCollaboration(controller.getSnapshot().snapshot));
controller.reset('review');
controller.start();
scheduler.pending();
controller.pause();
const paused = read();
assert.equal(scheduler.pending, undefined);
assert.equal(read(), paused);
controller.step();
assert.notEqual(read(), paused);
controller.reset('review');
controller.step();
assert.equal(read(), paused);
controller.reset('collaboration');
assert.equal(projectCollaboration(controller.getSnapshot().snapshot).observed.length, 0);
assert.notEqual(read(), paused);
console.log('PASS: collaboration determinism, stable identity, fixture references, causal order, horizon, review labels, pause, step, replay and scenario reset.');
