'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const policy = Object.freeze([
  Object.freeze({ name: '@rolldown/binding-darwin-arm64', version: '1.2.15', file: 'rolldown-binding.darwin-arm64.node', sha512: '81c1fc3fdeb99de0c0d6b9772d5785e106c7e33bf168af4f0b361c5fd1a997ce56eda3d40166b86496652fe93e57a8529479c7d4c9c3764817d99d098ea93753', allow: true }),
  Object.freeze({ name: 'lightningcss-darwin-arm64', version: '1.33.0', file: 'lightningcss.darwin-arm64.node', sha512: '2f5162a6dfd1daf492c026acb0c605adc06bc07ba359c31587280548fe78b7b928e11238a496ba75be29b04a29bb69384b584737c4282cbaef0ffa5b7e0276a4', allow: true }),
  // Identity/hash matching makes only this known optional denial non-fatal.
  Object.freeze({ name: 'fsevents', version: '2.3.3', file: 'fsevents.node', sha512: '5918ad5e690852dcd802a82ad48a2cc21dd49ed1b4b6f4770235e8961357932d0c56d903da0547f62cfd64b376bbbf9313d6d10806ba42d7f83b4cbedeaba872', allow: false }),
]);
const hash = (bytes) => crypto.createHash('sha512').update(bytes).digest('hex');

function inspectNative(root, filename, io = fs, rules = policy) {
  const modules = path.join(root, 'node_modules');
  const attemptedPath = path.resolve(filename);
  const resolvedPath = io.realpathSync(attemptedPath);
  const sha512 = hash(io.readFileSync(resolvedPath));
  const rule = rules.find((item) => path.join(modules, item.name, item.file) === attemptedPath);
  const evidence = { attemptedPath, resolvedPath, sha512, package: rule?.name ?? null, version: null };
  if (!rule) return { ...evidence, decision: 'deny', reason: 'unknown-native-addon', fatal: true };
  const packageRoot = path.join(modules, rule.name);
  if (io.realpathSync(packageRoot) !== packageRoot || resolvedPath !== attemptedPath || !io.lstatSync(attemptedPath).isFile()) {
    return { ...evidence, decision: 'deny', reason: 'canonical-path-mismatch', fatal: true };
  }
  const manifest = path.join(packageRoot, 'package.json');
  if (io.realpathSync(manifest) !== manifest) throw new Error('Native package manifest path mismatch');
  const pkg = JSON.parse(io.readFileSync(manifest, 'utf8'));
  evidence.version = pkg.version;
  if (pkg.name !== rule.name || pkg.version !== rule.version) return { ...evidence, decision: 'deny', reason: 'package-identity-mismatch', fatal: true };
  if (sha512 !== rule.sha512) return { ...evidence, decision: 'deny', reason: 'binary-hash-mismatch', fatal: true };
  return { ...evidence, decision: rule.allow ? 'allow' : 'deny', reason: rule.allow ? 'approved-file' : 'expected-fsevents-denial', fatal: false };
}

function createGuard({ root, write, load, proc = process, io = fs, rules = policy }) {
  let fatal = false;
  let sequence = 0;
  let finished = false;
  const loaded = [];
  const fail = () => { fatal = true; proc.exitCode = 1; };
  const record = (event) => {
    try { write({ sequence: ++sequence, ...event }); }
    catch { fail(); throw new Error('Native audit unavailable'); }
  };
  record({ event: 'start' });
  const guard = {
    dlopen(module, filename, ...rest) {
      if (finished) { fail(); throw new Error('Native guard already finalized'); }
      let evidence;
      try { evidence = inspectNative(root, filename, io, rules); }
      catch {
        evidence = { attemptedPath: path.resolve(String(filename)), resolvedPath: null, decision: 'deny', reason: 'unreadable-native-identity', fatal: true };
      }
      if (evidence.fatal) fail();
      record({ event: 'attempt', ...evidence, requester: module?.parent?.filename ?? null, stack: new Error().stack });
      if (evidence.decision !== 'allow') throw new Error(`Native addon denied: ${evidence.reason}`);
      try {
        const result = load.call(proc, module, filename, ...rest);
        loaded.push(evidence.resolvedPath);
        record({ event: 'loaded', resolvedPath: evidence.resolvedPath, sha512: evidence.sha512 });
        return result;
      } catch {
        fail(); record({ event: 'load-failed', resolvedPath: evidence.resolvedPath });
        throw new Error('Approved native addon failed to load');
      }
    },
    block(operation) {
      fail(); record({ event: 'violation', operation });
      throw new Error(`Build boundary denied: ${operation}`);
    },
    finish() {
      if (finished) return;
      finished = true;
      record({ event: 'complete', fatal, loaded });
      if (fatal) proc.exitCode = 1;
    },
  };
  return guard;
}

function constrainChild(guard, get = require, proc = process, globals = globalThis) {
  Object.defineProperty(proc, 'dlopen', { value: guard.dlopen, writable: false, configurable: false });
  const deny = (object, key, operation) => {
    if (key in object) Object.defineProperty(object, key, { value: function () { return guard.block(operation); }, writable: false, configurable: false });
  };
  const cp = get('node:child_process');
  for (const key of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) deny(cp, key, 'subprocess');
  const ChildProcess = cp.ChildProcess;
  if (typeof ChildProcess !== 'function' || !ChildProcess.prototype) guard.block('subprocess-interface');
  // Patch the original prototype too: existing instances must not retain spawn.
  deny(ChildProcess.prototype, 'spawn', 'subprocess');
  const blockedConstructor = function () { return guard.block('subprocess'); };
  Object.defineProperty(blockedConstructor, 'prototype', { value: ChildProcess.prototype, writable: false });
  Object.defineProperty(ChildProcess.prototype, 'constructor', { value: blockedConstructor, writable: false, configurable: false });
  Object.defineProperty(cp, 'ChildProcess', { value: blockedConstructor, writable: false, configurable: false });
  deny(get('node:worker_threads'), 'Worker', 'javascript-worker');
  const net = get('node:net');
  for (const key of ['connect', 'createConnection']) deny(net, key, 'network');
  deny(net.Socket.prototype, 'connect', 'network'); deny(net.Server.prototype, 'listen', 'listener');
  deny(get('node:tls'), 'connect', 'network');
  for (const name of ['node:http', 'node:https', 'node:http2']) {
    const api = get(name);
    for (const key of ['request', 'get', 'connect', 'createServer', 'createSecureServer']) deny(api, key, 'network');
  }
  deny(get('node:dgram'), 'createSocket', 'network');
  for (const name of ['node:dns', 'node:dns/promises']) {
    const api = get(name);
    for (const key of Object.keys(api)) if (/^(lookup|resolve|reverse)/.test(key)) deny(api, key, 'network');
  }
  deny(proc, 'execve', 'process-replacement');
  for (const key of ['getBuiltinModule', 'binding', '_linkedBinding']) deny(proc, key, 'alternate-builtin-access');
  deny(globals, 'fetch', 'network'); deny(globals, 'WebSocket', 'network');
  get('node:module').syncBuiltinESMExports();
}

if (process.env.NEXORA_GUARD_CHILD === '1') {
  try {
    const root = fs.realpathSync(process.env.NEXORA_GUARD_ROOT);
    if (root !== path.resolve(__dirname, '..')) throw new Error('Guard root mismatch');
    const audit = process.env.NEXORA_GUARD_AUDIT;
    if (!audit || path.dirname(audit) !== process.env.NEXORA_GUARD_RUN) throw new Error('Guard audit path mismatch');
    const fd = fs.openSync(audit, 'wx', 0o600);
    const guard = createGuard({ root, write: (event) => { const line = JSON.stringify(event) + '\n'; if (fs.writeSync(fd, line) !== Buffer.byteLength(line)) throw new Error('Incomplete audit write'); }, load: process.dlopen });
    constrainChild(guard);
    process.on('beforeExit', () => { try { guard.finish(); } catch { process.exitCode = 1; } });
  } catch { process.stderr.write('Guard initialization failed\n'); process.exit(1); }
}
module.exports = { policy, hash, inspectNative, createGuard, constrainChild };
