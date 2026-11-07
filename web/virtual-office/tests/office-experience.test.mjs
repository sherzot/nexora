import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/office/three/runtime.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { initialOrbit, focusPoint, transitionOrbit, overviewForAspect } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const test = (name, fn) => { fn(); console.log(`PASS: ${name}`); };
test('focus clamps every target and rejects invalid input', () => {
  const start = initialOrbit();
  assert.deepEqual(focusPoint(start, 100, -100, 1), { ...start, x: 6, z: -4, distance: 20, pitch: 0.88 });
  assert.equal(focusPoint(start, NaN, 0), start);
  assert.equal(focusPoint(start, 0, Infinity), start);
});
test('camera transition has exact endpoints without mutating inputs', () => {
  const start = initialOrbit(), target = focusPoint(start, -4, 2), before = { ...start };
  assert.deepEqual(transitionOrbit(start, target, 0), start);
  assert.deepEqual(transitionOrbit(start, target, 1), target);
  assert.deepEqual(transitionOrbit(start, target, 10), target);
  assert.deepEqual(start, before);
});
test('transition stays within the target bounds and completes monotonically', () => {
  const start = initialOrbit(), target = focusPoint(start, -6, 4, 23);
  let previous = start.distance;
  for (let i = 0; i <= 100; i++) {
    const frame = transitionOrbit(start, target, i / 100);
    assert.ok(frame.distance <= previous && frame.distance >= 23);
    assert.ok(frame.x >= -6 && frame.x <= 0 && frame.z >= 0 && frame.z <= 4);
    previous = frame.distance;
  }
});
test('yaw crosses the shortest arc at the wrap boundary', () => {
  const from = { ...initialOrbit(), yaw: Math.PI - 0.1 }, to = { ...initialOrbit(), yaw: -Math.PI + 0.1 };
  assert.ok(Math.abs(transitionOrbit(from, to, 0.5).yaw - from.yaw) < 0.2);
});
test('portrait overview widens without changing the camera target', () => {
  assert.equal(overviewForAspect(2).distance, 38);
  assert.equal(overviewForAspect(0.7).distance, 48);
  assert.equal(overviewForAspect(0).distance, 48);
  assert.equal(overviewForAspect(0.7).x, 0);
});
console.log('PASS: 5 M2 camera focus and responsive-view regressions.');
