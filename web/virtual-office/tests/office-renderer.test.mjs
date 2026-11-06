import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const compile = async (path) => {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  assert.equal(result.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error).length, 0);
  assert.doesNotMatch(result.outputText, /\bimport\s/);
  return import(`data:text/javascript;base64,${Buffer.from(result.outputText).toString('base64')}`);
};
const { createLifetime, initialOrbit, navigate, zoom, selectAgent } = await compile('../src/office/three/runtime.ts');
const { agents, rooms } = await compile('../src/demo/fixtures.ts');
let count = 0;
function test(name, run) { run(); count++; console.log(`PASS: ${name}`); }

test('all eight fixture IDs select; unknown and malformed IDs cannot reach React', () => {
  const ids = new Set(agents.map((agent) => agent.id));
  const selected = [];
  for (const agent of agents) assert.equal(selectAgent(agent.id, ids, (id) => selected.push(id)), true);
  for (const id of [null, undefined, {}, 'demo-agent-unknown', '__proto__']) assert.equal(selectAgent(id, ids, () => assert.fail('invalid selection')), false);
  assert.deepEqual(selected, agents.map((agent) => agent.id));
});
test('orbit pitch and pan remain bounded under extreme input', () => {
  for (const amount of [-1e8, 1e8]) {
    const orbit = navigate(initialOrbit(), amount, amount);
    assert.ok(orbit.pitch >= 0.4 && orbit.pitch <= 1.35);
    const pan = navigate(orbit, amount, amount, true);
    assert.ok(Math.abs(pan.x) <= 6 && Math.abs(pan.z) <= 4);
  }
});
test('zoom is bounded, finite and rejects invalid input', () => {
  let orbit = initialOrbit();
  for (let i = 0; i < 1000; i++) orbit = zoom(orbit, 1e9);
  assert.equal(orbit.distance, 48);
  for (let i = 0; i < 1000; i++) orbit = zoom(orbit, -1e9);
  assert.equal(orbit.distance, 20);
  assert.equal(zoom(orbit, NaN), orbit);
  assert.equal(navigate(orbit, Infinity, 0), orbit);
});
test('camera reset returns independent deterministic state', () => {
  const a = initialOrbit(), b = initialOrbit();
  assert.deepEqual(a, b); a.distance = 20; assert.equal(b.distance, 38);
});
test('teardown is LIFO and idempotent across remounts', () => {
  for (let i = 0; i < 3; i++) {
    const life = createLifetime(), calls = [];
    life.own(() => calls.push('geometry')); life.own(() => calls.push('listener')); life.own(() => calls.push('frame'));
    life.dispose(); life.dispose();
    assert.deepEqual(calls, ['frame', 'listener', 'geometry']); assert.equal(life.disposed, true);
  }
});
test('partial initialization failure releases every acquired resource', () => {
  const life = createLifetime(), calls = [];
  life.own(() => calls.push('renderer'));
  life.own(() => { calls.push('broken observer'); throw new Error('cleanup failure'); });
  life.own(() => calls.push('canvas'));
  assert.throws(() => life.dispose(), AggregateError);
  assert.deepEqual(calls, ['canvas', 'broken observer', 'renderer']);
  life.dispose(); life.own(() => calls.push('late resource'));
  assert.equal(calls.at(-1), 'late resource');
});
test('fixture layout maps four rooms and eight desks inside the 24x18 floor', () => {
  assert.equal(rooms.length, 4); assert.equal(agents.length, 8);
  for (const room of rooms) {
    assert.ok(2.4 * room.x - 12 >= -12 && 2.4 * (room.x + room.width) - 12 <= 12);
    assert.ok(2.4 * room.y - 8.4 >= -9 && 2.4 * (room.y + room.depth) - 8.4 <= 9);
  }
});
for (const name of ['runtime.ts', 'renderer.ts']) {
  const source = await readFile(new URL(`../src/office/three/${name}`, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true);
  test(`${name}: imports exclude addons and unapproved runtime dependencies`, () => {
    for (const node of ast.statements) if (ts.isImportDeclaration(node)) {
      const path = node.moduleSpecifier.text;
      assert.ok(path === 'three' || path.startsWith('./') || node.importClause?.isTypeOnly, path);
    }
    assert.doesNotMatch(source, /\b(?:fetch|WebSocket|Worker|SharedWorker|WebAssembly|importScripts|eval)\s*\(|three\/(?:addons|examples|webgpu)|rapier|meshoptimizer|fflate/);
  });
}
console.log(`PASS: ${count} office selection, navigation, lifecycle and import-boundary regressions.`);
