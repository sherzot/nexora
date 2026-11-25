import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../src/', import.meta.url)), cache = new Map();
function load(filename) {
  const absolute = path.resolve(root, filename);
  assert.ok(absolute.startsWith(root) && absolute.endsWith('.ts'));
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const output = ts.transpileModule(readFileSync(absolute, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }; cache.set(absolute, module);
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => {
    assert.ok(name.startsWith('.'));
    return load(path.relative(root, path.resolve(path.dirname(absolute), name + '.ts')));
  } });
  return module.exports;
}
const { createPreviewPlayback } = load('mission/playback.ts');
const { createMissionPreview, stepMissionPreview, resetMissionPreview } = load('mission/preview.ts');
const { sampleMission } = load('mission/scenarios.ts');
class FakeScheduler {
  entries = new Map(); active = new Set(); sequence = 0;
  schedule = (callback, delay) => {
    const id = ++this.sequence; this.entries.set(id, { callback, delay }); this.active.add(id); return id;
  };
  cancel = (id) => { this.active.delete(id); };
  deliver(id) { this.active.delete(id); this.entries.get(id).callback(); }
  next() { const [id] = this.active; assert.ok(id); this.deliver(id); }
  get pending() { return this.active.size; }
  get current() { return [...this.active][0]; }
  finish() { for (let i = 0; this.pending && i < 50; i++) this.next(); assert.equal(this.pending, 0); }
}
function fixture() {
  const scheduler = new FakeScheduler();
  let state = createMissionPreview(sampleMission.plan, [], sampleMission.assignments);
  const clock = createPreviewPlayback(() => { state = stepMissionPreview(state); }, () => state.terminal, scheduler);
  return { clock, scheduler, state: () => state, reset() { clock.reset(); state = resetMissionPreview(state); } };
}

test('each playback speed emits exactly the manual deterministic transition trace', () => {
  let manual = createMissionPreview(sampleMission.plan, [], sampleMission.assignments);
  while (!manual.terminal) manual = stepMissionPreview(manual);
  for (const speed of [1, 2, 4]) {
    const f = fixture(), captured = JSON.stringify(f.state().input);
    f.clock.setSpeed(speed); f.clock.play();
    assert.equal(f.scheduler.entries.get(f.scheduler.current).delay, 1000 / speed);
    f.scheduler.finish();
    assert.equal(JSON.stringify(f.state()), JSON.stringify(manual));
    assert.equal(JSON.stringify(f.state().input), captured);
    assert.equal(f.state().events.length, 6);
    f.clock.play(); f.clock.step(); assert.equal(f.scheduler.pending, 0);
  }
});

test('pause rejects already-queued callbacks and resume advances only one new step', () => {
  const f = fixture(); f.clock.play(); f.scheduler.next();
  const stale = f.scheduler.current; f.clock.pause();
  f.scheduler.deliver(stale);
  assert.equal(f.state().events.length, 1); assert.equal(f.scheduler.pending, 0);
  f.clock.play(); assert.equal(f.scheduler.pending, 1);
  f.scheduler.next(); assert.equal(f.state().events.length, 2);
});

test('speed change replaces one timer, rejects stale/duplicate delivery and preserves the current step', () => {
  const f = fixture(); f.clock.play(); const old = f.scheduler.current;
  f.clock.setSpeed(2); assert.equal(f.scheduler.pending, 1);
  assert.equal(f.scheduler.entries.get(f.scheduler.current).delay, 500);
  f.scheduler.deliver(old); assert.equal(f.state().events.length, 0);
  const current = f.scheduler.current; f.scheduler.deliver(current); f.scheduler.deliver(current);
  assert.equal(f.state().events.length, 1); assert.equal(f.scheduler.pending, 1);
  const same = f.scheduler.current; f.clock.setSpeed(2); assert.equal(f.scheduler.current, same);
  f.clock.pause(); f.clock.setSpeed(4); assert.equal(f.scheduler.pending, 0);
  f.clock.play(); assert.equal(f.scheduler.entries.get(f.scheduler.current).delay, 250);
  assert.throws(() => f.clock.setSpeed(3), /Unsupported/);
  f.clock.pause();
});

test('reset and source replacement isolate the new session from all old callbacks', () => {
  const f = fixture(); f.clock.play(); f.scheduler.next(); const stale = f.scheduler.current;
  f.reset(); assert.equal(f.state().events.length, 0); assert.equal(f.clock.getSnapshot().mode, 'idle');
  f.clock.play(); f.scheduler.deliver(stale); assert.equal(f.state().events.length, 0);
  f.scheduler.finish(); const first = JSON.stringify(f.state().events);
  f.reset(); f.clock.play(); f.scheduler.finish();
  assert.equal(JSON.stringify(f.state().events), first);
});

test('manual step and playback never both consume one transition', () => {
  const f = fixture(); f.clock.step(); assert.equal(f.state().events.length, 1);
  f.clock.play(); f.clock.step(); assert.equal(f.state().events.length, 1);
  f.scheduler.next(); assert.equal(f.state().events.length, 2);
  f.clock.pause(); f.clock.step(); assert.equal(f.state().events.length, 3);
  f.clock.pause();
});

test('already-terminal assumed capture schedules nothing and invents no events', () => {
  const scheduler = new FakeScheduler();
  const state = createMissionPreview(sampleMission.plan, sampleMission.plan.taskIds, {});
  const clock = createPreviewPlayback(() => assert.fail('terminal step'), () => state.terminal, scheduler);
  clock.play(); clock.step(); clock.setSpeed(4);
  assert.equal(scheduler.pending, 0); assert.equal(state.events.length, 0);
});

test('disposal cancels timers and late delivery cannot advance or notify', () => {
  const f = fixture(); let notifications = 0;
  f.clock.subscribe(() => notifications++); f.clock.play(); const stale = f.scheduler.current;
  f.clock.dispose(); const before = notifications;
  f.scheduler.deliver(stale); f.clock.play(); f.clock.step(); f.clock.setSpeed(4);
  assert.equal(f.scheduler.pending, 0); assert.equal(f.state().events.length, 0); assert.equal(notifications, before);
});

test('reentrant reset and disposal during notifications prevent subsequent scheduling or stepping', () => {
  const f = fixture();
  const unsubscribe = f.clock.subscribe(() => { if (f.clock.getSnapshot().mode === 'playing') f.clock.reset(); });
  f.clock.play(); assert.equal(f.scheduler.pending, 0); unsubscribe();
  f.clock.subscribe(() => f.clock.dispose()); f.clock.step();
  assert.equal(f.state().events.length, 0); assert.equal(f.scheduler.pending, 0);
});

test('step and scheduling failures remain observable and stop playback', () => {
  const scheduler = new FakeScheduler();
  const clock = createPreviewPlayback(() => { throw new Error('step failed'); }, () => false, scheduler);
  clock.play(); assert.throws(() => scheduler.next(), /step failed/);
  assert.equal(clock.getSnapshot().mode, 'paused'); assert.equal(scheduler.pending, 0);
  const broken = createPreviewPlayback(() => {}, () => false, { schedule() { throw new Error('scheduler failed'); }, cancel() {} });
  assert.throws(() => broken.play(), /scheduler failed/);
  assert.equal(broken.getSnapshot().mode, 'paused');
});
