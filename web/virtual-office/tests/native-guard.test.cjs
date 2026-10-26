'use strict';
// In-process mocks only: no child process, network, native addon or file writes.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const { policy, hash, inspectNative, createGuard, constrainChild } = require('../scripts/native-guard.cjs');
const { lockHash, checkRuntime, checkDependencies, childEnvironment, validateAudit, runBuild } = require('../scripts/guarded-build.cjs');

const root = path.resolve('/mock-frontend');
function fixture() {
  const bytes = Buffer.from('mock binary; never executable');
  const rules = policy.map((item) => ({ ...item, sha512: hash(bytes) }));
  const files = new Map();
  for (const item of rules) {
    const base = path.join(root, 'node_modules', item.name);
    files.set(path.join(base, 'package.json'), JSON.stringify({ name: item.name, version: item.version }));
    files.set(path.join(base, item.file), bytes);
  }
  const io = { realpathSync: (name) => name, lstatSync: () => ({ isFile: () => true }), readFileSync: (name) => {
    if (!files.has(name)) throw new Error('Mock file missing');
    return files.get(name);
  } };
  const events = []; const proc = {}; const calls = [];
  const guard = createGuard({ root, io, rules, proc, write: (event) => events.push(event), load: (...args) => { calls.push(args); return 'mock loaded'; } });
  return { bytes, rules, files, io, events, proc, calls, guard, file: (index) => path.join(root, 'node_modules', rules[index].name, rules[index].file) };
}

test('production policy pins exactly two allowed bindings and one expected denial', () => {
  assert.deepEqual(policy.map(({ name, version, allow }) => ({ name, version, allow })), [
    { name: '@rolldown/binding-darwin-arm64', version: '1.2.15', allow: true },
    { name: 'lightningcss-darwin-arm64', version: '1.33.0', allow: true },
    { name: 'fsevents', version: '2.3.3', allow: false },
  ]);
  for (const item of policy) assert.match(item.sha512, /^[a-f0-9]{128}$/);
  assert.equal(lockHash, '9933f51002748b831cea99633ac66c66d0e7cfe20bdb464affc56344e0ebd4bc');
});

test('approved identity and hash are audited before and after mocked native loading', () => {
  const f = fixture();
  assert.equal(f.guard.dlopen({ parent: { filename: 'requester.cjs' } }, f.file(0)), 'mock loaded');
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.events.map((event) => event.event), ['start', 'attempt', 'loaded']);
  assert.equal(f.events[1].requester, 'requester.cjs');
  assert.equal(f.events[1].sha512, hash(f.bytes));
  f.guard.finish(); assert.equal(f.events.at(-1).fatal, false);
});

test('altered binary hash never reaches native loader', () => {
  const f = fixture(); f.files.set(f.file(0), Buffer.from('altered'));
  assert.throws(() => f.guard.dlopen({}, f.file(0)), /binary-hash-mismatch/);
  assert.equal(f.calls.length, 0); assert.equal(f.proc.exitCode, 1);
});

test('wrong package name or version fails closed', () => {
  for (const pkg of [{ name: 'unexpected', version: '1.2.15' }, { name: policy[0].name, version: '1.2.16' }]) {
    const f = fixture(); f.files.set(path.join(root, 'node_modules', policy[0].name, 'package.json'), JSON.stringify(pkg));
    assert.equal(inspectNative(root, f.file(0), f.io, f.rules).reason, 'package-identity-mismatch');
    assert.throws(() => f.guard.dlopen({}, f.file(0)), /package-identity-mismatch/); assert.equal(f.calls.length, 0);
  }
});

test('canonical native file or package-root escape is fatal', () => {
  for (const target of ['file', 'root']) {
    const f = fixture(); const escape = path.resolve('/outside/native.node'); f.files.set(escape, f.bytes);
    const changed = target === 'file' ? f.file(0) : path.dirname(f.file(0));
    f.io.realpathSync = (name) => name === changed ? escape : name;
    assert.throws(() => f.guard.dlopen({}, f.file(0)), /canonical-path-mismatch/); assert.equal(f.calls.length, 0);
  }
});

test('unreadable identity and unknown addon both deny without execution', () => {
  const f = fixture(); const unknown = path.join(root, 'node_modules', 'unknown', 'unknown.node');
  f.files.set(unknown, f.bytes);
  assert.throws(() => f.guard.dlopen({}, unknown), /unknown-native-addon/);
  assert.throws(() => f.guard.dlopen({}, '/missing.node'), /unreadable-native-identity/);
  assert.equal(f.calls.length, 0); assert.equal(f.proc.exitCode, 1);
});

test('exact fsevents denial is recorded but not fatal and never loads', () => {
  const f = fixture(); assert.throws(() => f.guard.dlopen({}, f.file(2)), /expected-fsevents-denial/);
  f.guard.finish(); assert.equal(f.calls.length, 0); assert.equal(f.proc.exitCode, undefined);
  assert.equal(f.events.at(-1).fatal, false); assert.equal(f.events[1].decision, 'deny');
  f.files.set(f.file(2), Buffer.from('different optional binary'));
  const changed = inspectNative(root, f.file(2), f.io, f.rules);
  assert.equal(changed.fatal, true); assert.equal(changed.reason, 'binary-hash-mismatch');
});

test('caught unexpected rejection still latches mandatory failure', () => {
  const f = fixture(); try { f.guard.dlopen({}, '/missing.node'); } catch { /* importing code catches */ }
  f.proc.exitCode = 0; f.guard.finish();
  assert.equal(f.proc.exitCode, 1); assert.equal(f.events.at(-1).fatal, true);
});

test('audit write failure blocks before native loading', () => {
  const f = fixture(); let count = 0;
  const guard = createGuard({ root, io: f.io, rules: f.rules, proc: f.proc, load: () => f.calls.push('unexpected'), write: () => { if (++count > 1) throw new Error('disk full'); } });
  assert.throws(() => guard.dlopen({}, f.file(0)), /audit unavailable/); assert.equal(f.calls.length, 0); assert.equal(f.proc.exitCode, 1);
  assert.throws(() => createGuard({ root, proc: f.proc, write: () => { throw new Error('disk full'); } }), /audit unavailable/);
});

test('native load failure is recorded and cannot become success', () => {
  const f = fixture(); const events = [];
  const guard = createGuard({ root, io: f.io, rules: f.rules, proc: f.proc, write: (event) => events.push(event), load: () => { throw new Error('driver diagnostic'); } });
  assert.throws(() => guard.dlopen({}, f.file(0)), /Approved native addon failed/);
  guard.finish(); assert.deepEqual(events.map((event) => event.event), ['start', 'attempt', 'load-failed', 'complete']); assert.equal(events.at(-1).fatal, true);
});

const supported = { version: 'v22.18.0', platform: 'darwin', arch: 'arm64' };
const sandboxIO = { accessSync: () => {}, statSync: () => ({ isFile: () => true }) };
test('runtime preflight rejects unsupported platform, architecture and Node version', () => {
  checkRuntime(supported, sandboxIO);
  for (const patch of [{ platform: 'linux' }, { arch: 'x64' }, { version: 'v22.18.1' }]) assert.throws(() => checkRuntime({ ...supported, ...patch }, sandboxIO));
});
test('missing/non-executable sandbox never falls back or launches a child', () => {
  assert.throws(() => checkRuntime(supported, { accessSync: () => { throw new Error('missing sandbox'); } }), /missing sandbox/);
  let spawned = false;
  assert.throws(() => runBuild({ runtime: { ...supported, argv: ['node', 'wrapper'] }, io: { accessSync: () => { throw new Error('missing sandbox'); } }, spawn: () => { spawned = true; } }));
  assert.equal(spawned, false);
  assert.throws(() => checkRuntime(supported, { ...sandboxIO, statSync: () => ({ isFile: () => false }) }), /sandbox unavailable/);
});
test('child environment strips Node, native and npm overrides', () => {
  const env = childEnvironment({ HOME: '/home/test', NODE_OPTIONS: '--require attacker', NODE_PATH: '/outside', NAPI_RS_NATIVE_LIBRARY_PATH: '/outside.node', ROLLDOWN_BINDING_PATH: '/outside', LIGHTNINGCSS_FORCE_WASM: '1', DYLD_INSERT_LIBRARIES: '/outside', npm_config_registry: 'https://outside', SECRET: 'not inherited' }, '/node/bin/node', root, '/run');
  for (const key of ['NODE_OPTIONS', 'NODE_PATH', 'NAPI_RS_NATIVE_LIBRARY_PATH', 'ROLLDOWN_BINDING_PATH', 'LIGHTNINGCSS_FORCE_WASM', 'DYLD_INSERT_LIBRARIES', 'npm_config_registry', 'SECRET']) assert.equal(env[key], undefined);
  assert.equal(env.NAPI_RS_ENFORCE_VERSION_CHECK, '1'); assert.equal(env.NEXORA_GUARD_ROOT, root); assert.equal(env.npm_config_offline, 'true');
});

function auditFixture() {
  const events = [{ event: 'start' }]; const loaded = [];
  for (const item of policy) {
    const file = path.join(root, 'node_modules', item.name, item.file);
    events.push({ event: 'attempt', attemptedPath: file, resolvedPath: file, package: item.name, version: item.version, sha512: item.sha512, decision: item.allow ? 'allow' : 'deny', reason: item.allow ? 'approved-file' : 'expected-fsevents-denial', fatal: false });
    if (item.allow) { events.push({ event: 'loaded', resolvedPath: file, sha512: item.sha512 }); loaded.push(file); }
  }
  events.push({ event: 'complete', fatal: false, loaded });
  return events.map((event, index) => ({ sequence: index + 1, ...event }));
}
const jsonl = (events) => events.map((event) => JSON.stringify(event)).join('\n') + '\n';
test('wrapper validates complete audit and rejects incomplete, forged and fatal evidence', () => {
  const events = auditFixture(); assert.deepEqual(validateAudit(jsonl(events), root), { loaded: 2, expectedDenials: 1 });
  for (const bad of ['', '{invalid', jsonl(events.slice(0, -1)), jsonl(events.map((event) => event.event === 'complete' ? { ...event, fatal: true } : event)), jsonl(events.map((event) => event.event === 'attempt' ? { ...event, sha512: 'wrong' } : event)), jsonl(events.map((event) => ({ ...event, sequence: 1 })))]) assert.throws(() => validateAudit(bad, root));
});
test('child constraints cover subprocesses, JS workers, listeners and network clients with mocks', () => {
  const method = () => { throw new Error('original mock API must not execute'); };
  const net = { connect: method, createConnection: method, Socket: { prototype: { connect: method } }, Server: { prototype: { listen: method } } };
  const modules = {
    'node:child_process': { ...Object.fromEntries(['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork'].map((key) => [key, method])), ChildProcess: function ChildProcess() {} },
    'node:worker_threads': { Worker: method }, 'node:net': net, 'node:tls': { connect: method },
    'node:http': { get: method, request: method, createServer: method }, 'node:https': { get: method, request: method, createServer: method },
    'node:http2': { connect: method, createServer: method, createSecureServer: method }, 'node:dgram': { createSocket: method },
    'node:dns': { resolve: method, lookup: method, reverse: method }, 'node:dns/promises': { resolve: method, lookup: method },
    'node:module': { syncBuiltinESMExports: () => {} },
  };
  const f = fixture(); const proc = { binding: method, _linkedBinding: method, getBuiltinModule: method }; const globals = { fetch: method, WebSocket: method };
  constrainChild(f.guard, (name) => modules[name], proc, globals);
  for (const invoke of [() => modules['node:child_process'].spawn(), () => new modules['node:worker_threads'].Worker(), () => net.connect(), () => net.Socket.prototype.connect(), () => net.Server.prototype.listen(), () => modules['node:http2'].connect(), () => modules['node:dns/promises'].lookup(), () => globals.fetch(), () => proc.binding()]) assert.throws(invoke, /Build boundary denied/);
  assert.equal(Object.getOwnPropertyDescriptor(proc, 'dlopen').writable, false);
  f.guard.finish(); assert.equal(f.events.at(-1).fatal, true);
});

test('dependency preflight rejects nonlocal roots, changed lock, manifest drift and missing packages', () => {
  const approvedLock = fs.readFileSync(path.join(__dirname, '../package-lock.json'));
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const makeIO = () => ({
    realpathSync: (name) => name,
    readFileSync: (name) => name.endsWith('package-lock.json') ? approvedLock : JSON.stringify(manifest),
    readdirSync: () => [],
  });
  let io = makeIO(); io.realpathSync = () => '/outside';
  assert.throws(() => checkDependencies(root, io), /not canonical/);
  io = makeIO(); io.realpathSync = (name) => name.endsWith('node_modules') ? '/outside' : name;
  assert.throws(() => checkDependencies(root, io), /node_modules/);
  io = makeIO(); io.readFileSync = () => Buffer.from('{}');
  assert.throws(() => checkDependencies(root, io), /lockfile identity/);
  io = makeIO(); io.readFileSync = (name) => name.endsWith('package-lock.json') ? approvedLock : JSON.stringify({ ...manifest, dependencies: { react: 'wrong' } });
  assert.throws(() => checkDependencies(root, io), /Manifest\/lock dependency/);
  assert.throws(() => checkDependencies(root, makeIO()), /dependency missing/);
});

function subprocessFixture() {
  const f = fixture();
  let originalSpawns = 0;
  let originalConstructions = 0;
  function ChildProcess() { originalConstructions++; }
  ChildProcess.prototype.spawn = function () { originalSpawns++; };
  // Represents an instance created before interception, using only an inert double.
  const existing = new ChildProcess();
  const cp = { ChildProcess };
  for (const key of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) cp[key] = function () { originalSpawns++; };
  const modules = {
    'node:child_process': cp, 'node:worker_threads': {},
    'node:net': { Socket: { prototype: {} }, Server: { prototype: {} } },
    'node:tls': {}, 'node:http': {}, 'node:https': {}, 'node:http2': {},
    'node:dgram': {}, 'node:dns': {}, 'node:dns/promises': {},
    'node:module': { syncBuiltinESMExports() {} },
  };
  constrainChild(f.guard, (name) => modules[name], {}, {});
  return { ...f, cp, existing, originalPrototype: ChildProcess.prototype, counts: () => ({ originalSpawns, originalConstructions }) };
}

test('original and exported ChildProcess prototypes block existing and direct instances', () => {
  const f = subprocessFixture();
  const attempts = [
    () => f.originalPrototype.spawn.call(f.existing, {}),
    () => f.existing.spawn({}),
    () => f.cp.ChildProcess.prototype.spawn.call({}, {}),
    () => Object.create(f.cp.ChildProcess.prototype).spawn({}),
    () => Object.getPrototypeOf(f.existing).spawn.call(f.existing, {}),
  ];
  for (const attempt of attempts) assert.throws(attempt, /Build boundary denied: subprocess/);
  assert.deepEqual(f.counts(), { originalSpawns: 0, originalConstructions: 1 });
  assert.equal(f.events.filter((event) => event.event === 'violation').length, attempts.length);
  f.proc.exitCode = 0; f.guard.finish();
  assert.equal(f.proc.exitCode, 1); assert.equal(f.events.at(-1).fatal, true);
});

test('ChildProcess constructor, call, Reflect and prototype-constructor paths are audited', () => {
  const f = subprocessFixture();
  const attempts = [
    () => new f.cp.ChildProcess(),
    () => f.cp.ChildProcess.call({}),
    () => Reflect.construct(f.cp.ChildProcess, []),
    () => new f.originalPrototype.constructor(),
    () => f.existing.constructor.call(f.existing),
    () => f.cp.ChildProcess.prototype.constructor(),
    () => f.cp.ChildProcess.prototype.constructor.prototype.spawn.call({}, {}),
  ];
  for (const attempt of attempts) assert.throws(attempt, /Build boundary denied: subprocess/);
  assert.deepEqual(f.counts(), { originalSpawns: 0, originalConstructions: 1 });
  assert.equal(f.events.filter((event) => event.event === 'violation').length, attempts.length);
  for (const [object, key] of [[f.cp, 'ChildProcess'], [f.originalPrototype, 'constructor'], [f.originalPrototype, 'spawn']]) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    assert.equal(descriptor.writable, false); assert.equal(descriptor.configurable, false);
  }
  f.guard.finish(); assert.equal(f.events.at(-1).fatal, true);
});

test('all seven top-level subprocess methods still audit and latch caught rejections', () => {
  const f = subprocessFixture();
  for (const key of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
    assert.throws(() => f.cp[key](), /Build boundary denied: subprocess/);
  }
  assert.equal(f.counts().originalSpawns, 0);
  assert.equal(f.events.filter((event) => event.event === 'violation').length, 7);
  f.proc.exitCode = 0; f.guard.finish(); assert.equal(f.proc.exitCode, 1); assert.equal(f.events.at(-1).fatal, true);
});
