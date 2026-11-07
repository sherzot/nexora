import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = fileURLToPath(new URL('../src/', import.meta.url));
const cache = new Map();
function load(filename) {
  const absolute = path.resolve(root, filename);
  assert.ok(absolute.startsWith(root) && absolute.endsWith('.ts'), 'Only repository TypeScript modules');
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const source = readFileSync(absolute, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} }; cache.set(absolute, module);
  const requireLocal = (specifier) => { assert.ok(specifier.startsWith('.')); return load(path.relative(root, path.resolve(path.dirname(absolute), specifier + '.ts'))); };
  vm.runInNewContext(result.outputText, { module, exports: module.exports, require: requireLocal, setTimeout: () => assert.fail('Real timer used'), clearTimeout: () => assert.fail('Real timer cancelled') });
  return module.exports;
}
const { initialSnapshot, stepSnapshot, positionOnPath, validateTransition } = load('simulation/engine.ts');
const { createController } = load('simulation/controller.ts');
const { END_TICK, HISTORY_LIMIT, TICK_MS } = load('simulation/model.ts');
const { eventsForAgent } = load('simulation/selectors.ts');
const { agents, tasks, rooms } = load('demo/fixtures.ts');
const plain = (value) => JSON.parse(JSON.stringify(value));
const replay = (scenario, seed) => { let state = initialSnapshot(scenario, seed); for (let i = 0; i < END_TICK; i++) state = stepSnapshot(state); return state; };
let count = 0;
const test = (name, fn) => { fn(); count++; console.log('PASS:', name); };
function setup() {
  let id = 0; const scheduled = new Map(), retained = [];
  const clock = { schedule(fn, delay) { const handle = ++id; scheduled.set(handle, { fn, delay }); retained.push(fn); return handle; }, cancel(handle) { scheduled.delete(handle); } };
  const controller = createController(clock);
  return { controller, scheduled, retained, fire() { const [key, job] = scheduled.entries().next().value; scheduled.delete(key); job.fn(); return job.delay; } };
}
test('all scenarios replay identically for identical seeds and keep inputs immutable', () => {
  for (const scenario of ['day', 'collaboration', 'review']) {
    const state = initialSnapshot(scenario, 42), before = JSON.stringify(state); stepSnapshot(state); assert.equal(JSON.stringify(state), before);
    assert.deepEqual(plain(replay(scenario, 42)), plain(replay(scenario, 42)));
    assert.ok(replay(scenario, 42).agents.every((agent) => agent.activity === 'completed'));
  }
});
test('different seeds change plans; invalid seeds/scenarios reject', () => {
  assert.notDeepEqual(plain(initialSnapshot('day', 42).plans), plain(initialSnapshot('day', 43).plans));
  assert.throws(() => initialSnapshot('missing', 42)); assert.throws(() => initialSnapshot('day', -1));
});
test('illegal state transitions reject', () => {
  validateTransition('idle', 'moving'); validateTransition('moving', 'working');
  assert.throws(() => validateTransition('idle', 'completed')); assert.throws(() => validateTransition('completed', 'working'));
});
test('events have stable unique IDs, tick/agent order and valid fixture references', () => {
  for (const scenario of ['day', 'collaboration', 'review']) {
    const state = replay(scenario, 7); assert.ok(state.events.length <= HISTORY_LIMIT);
    assert.equal(new Set(state.events.map((event) => event.id)).size, state.events.length);
    state.events.forEach((event, i) => {
      assert.equal(event.sequence, i + 1); assert.equal(event.virtualMs, event.tick * TICK_MS);
      assert.ok(agents.some((agent) => agent.id === event.agentId)); assert.ok(rooms.some((room) => room.id === event.zoneId));
      assert.ok(tasks.find((task) => task.id === event.taskId).agentIds.includes(event.agentId));
      if (i) assert.ok(event.tick >= state.events[i - 1].tick);
    });
    assert.equal(state.virtualMs, END_TICK * TICK_MS); assert.equal(stepSnapshot(state), state);
  }
});
test('path interpolation uses distance, exact endpoints and stays finite/in floor bounds', () => {
  const path = [{ x: 0, z: 0 }, { x: 3, z: 0 }, { x: 3, z: 1 }];
  assert.deepEqual(plain(positionOnPath(path, 0.5)), { x: 2, z: 0 });
  assert.deepEqual(plain(positionOnPath(path, 1)), path[2]); assert.throws(() => positionOnPath([], 0));
  for (const scenario of ['day', 'collaboration', 'review']) {
    let state = initialSnapshot(scenario, 42);
    for (let i = 0; i < END_TICK; i++) { state = stepSnapshot(state); for (const agent of state.agents) assert.ok(Math.abs(agent.position.x) <= 12 && Math.abs(agent.position.z) <= 9); }
  }
});
test('pause, stale timer and resume preserve virtual state without wall-clock catch-up', () => {
  const { controller: c, scheduled, retained, fire } = setup(); c.start(); assert.equal(scheduled.size, 1); fire();
  c.pause(); const before = JSON.stringify(c.getSnapshot()); assert.equal(scheduled.size, 0); retained.at(-1)(); assert.equal(JSON.stringify(c.getSnapshot()), before);
  c.start(); assert.equal(scheduled.size, 1); fire(); assert.equal(c.getSnapshot().snapshot.tick, 2);
  c.dispose(); assert.equal(scheduled.size, 0);
});
test('step works from inactive and paused, but never doubles playing ticks', () => {
  const { controller: c, scheduled } = setup(); c.step(); assert.equal(c.getSnapshot().mode, 'paused'); assert.equal(c.getSnapshot().snapshot.tick, 1); assert.equal(scheduled.size, 0);
  c.start(); c.step(); assert.equal(c.getSnapshot().snapshot.tick, 1); assert.equal(scheduled.size, 1); c.dispose();
});
test('1x/2x/4x change scheduler delay only, not tick results', () => {
  for (const speed of [1, 2, 4]) { const { controller: c, fire, scheduled } = setup(); c.setSpeed(speed); c.start(); assert.equal(fire(), TICK_MS / speed); assert.deepEqual(plain(c.getSnapshot().snapshot), plain(stepSnapshot(initialSnapshot()))); c.setSpeed(4); assert.equal(scheduled.size, 1); c.dispose(); }
  assert.throws(() => setup().controller.setSpeed(3));
});
test('reset and scenario switch clear obsolete state and pending callbacks', () => {
  const { controller: c, fire, scheduled, retained } = setup(); c.start(); fire(); c.reset(); assert.deepEqual(plain(c.getSnapshot().snapshot), plain(initialSnapshot())); assert.equal(scheduled.size, 0);
  c.reset('collaboration', 9); retained[0](); assert.equal(c.getSnapshot().snapshot.scenario, 'collaboration'); assert.equal(c.getSnapshot().snapshot.events.length, 0); assert.equal(c.getSnapshot().mode, 'inactive'); c.dispose();
});
test('task board and agent timeline selectors derive from the same snapshot', () => {
  const state = replay('review', 42);
  for (const agent of state.agents) { assert.equal(state.taskStates[agent.taskId], 'Done'); assert.ok(eventsForAgent(state, agent.id).every((event) => event.agentId === agent.id)); }
});
test('completed playback stops its timer and subscriptions clean up', () => {
  const { controller: c, fire, scheduled } = setup(); let calls = 0; const unsubscribe = c.subscribe(() => calls++);
  c.start(); for (let i = 0; i < END_TICK; i++) fire(); assert.equal(c.getSnapshot().mode, 'finished'); assert.equal(scheduled.size, 0);
  unsubscribe(); const before = calls; c.reset(); assert.equal(calls, before); c.dispose();
});
test('reentrant reset/start cannot create duplicate timers', () => {
  const { controller: c, scheduled } = setup(); let replaced = false;
  c.subscribe(() => { if (!replaced && c.getSnapshot().mode === 'playing') { replaced = true; c.reset(); c.start(); } });
  c.start(); assert.equal(scheduled.size, 1); c.dispose(); assert.equal(scheduled.size, 0);
});
console.log(`PASS: ${count} deterministic simulation/controller regressions.`);
