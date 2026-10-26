'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { policy, inspectNative } = require('./native-guard.cjs');
const lockHash = '9933f51002748b831cea99633ac66c66d0e7cfe20bdb464affc56344e0ebd4bc';
const sandbox = '/usr/bin/sandbox-exec';
const profile = '(version 1) (allow default) (deny network*)';

function checkRuntime(runtime = process, io = fs) {
  if (runtime.version !== 'v22.18.0') throw new Error('Guarded build requires Node 22.18.0');
  if (runtime.platform !== 'darwin' || runtime.arch !== 'arm64') throw new Error('Guarded build supports macOS ARM64 only');
  io.accessSync(sandbox, fs.constants.X_OK);
  if (!io.statSync(sandbox).isFile()) throw new Error('Required macOS sandbox unavailable');
}

function checkDependencies(root, io = fs) {
  if (io.realpathSync(root) !== root) throw new Error('Frontend root is not canonical');
  const modules = path.join(root, 'node_modules');
  if (io.realpathSync(modules) !== modules) throw new Error('Local node_modules must not escape frontend root');
  const lockPath = path.join(root, 'package-lock.json');
  if (io.realpathSync(lockPath) !== lockPath) throw new Error('Lockfile path mismatch');
  const bytes = io.readFileSync(lockPath);
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== lockHash) throw new Error('Approved lockfile identity mismatch');
  const lock = JSON.parse(bytes);
  const manifest = JSON.parse(io.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const kind of ['dependencies', 'devDependencies']) {
    const actual = manifest[kind]; const expected = lock.packages[''][kind];
    if (JSON.stringify(Object.entries(actual).sort()) !== JSON.stringify(Object.entries(expected).sort())) throw new Error('Manifest/lock dependency mismatch');
  }
  const installed = [];
  for (const entry of io.readdirSync(modules)) {
    if (entry === '.bin' || entry === '.package-lock.json') continue;
    if (entry.startsWith('@')) for (const name of io.readdirSync(path.join(modules, entry))) installed.push(`${entry}/${name}`);
    else installed.push(entry);
  }
  for (const name of installed) {
    const packageRoot = path.join(modules, name);
    const manifestPath = path.join(packageRoot, 'package.json');
    if (io.realpathSync(packageRoot) !== packageRoot || io.realpathSync(manifestPath) !== manifestPath) throw new Error('Installed package path mismatch');
    const pkg = JSON.parse(io.readFileSync(manifestPath, 'utf8'));
    if (!lock.packages[`node_modules/${name}`] || pkg.name !== name || pkg.version !== lock.packages[`node_modules/${name}`].version) throw new Error('Unexpected installed package identity');
  }
  const required = [...Object.keys(manifest.dependencies), ...Object.keys(manifest.devDependencies), 'rolldown', 'lightningcss', ...policy.map((item) => item.name)];
  if (required.some((name) => !installed.includes(name))) throw new Error('Required approved dependency missing');
  for (const item of policy) {
    const result = inspectNative(root, path.join(modules, item.name, item.file), io);
    if (result.fatal) throw new Error(`Native identity verification failed: ${result.reason}`);
  }
  const vite = path.join(modules, 'vite', 'bin', 'vite.js');
  if (io.realpathSync(vite) !== vite) throw new Error('Vite CLI path mismatch');
  return vite;
}

function childEnvironment(env, executable, root, run) {
  // An allowlist prevents inherited Node, native-loader and npm overrides.
  const clean = {};
  for (const key of ['HOME', 'TMPDIR', 'LANG', 'LC_ALL', 'LC_CTYPE']) if (env[key]) clean[key] = env[key];
  return { ...clean, PATH: `${path.dirname(executable)}:/usr/bin:/bin`, NODE_ENV: 'production', NO_COLOR: '1', NAPI_RS_ENFORCE_VERSION_CHECK: '1', npm_config_offline: 'true', npm_config_ignore_scripts: 'true', npm_config_audit: 'false', npm_config_fund: 'false', NEXORA_GUARD_CHILD: '1', NEXORA_GUARD_ROOT: root, NEXORA_GUARD_RUN: run, NEXORA_GUARD_AUDIT: path.join(run, 'native-audit.jsonl') };
}

function validateAudit(text, root) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('Incomplete native audit');
  const events = lines.map((line) => JSON.parse(line));
  const loaded = []; let pending = null;
  const identities = new Map(policy.map((item) => [path.join(root, 'node_modules', item.name, item.file), item]));
  for (const [index, event] of events.entries()) {
    if (event.sequence !== index + 1) throw new Error('Invalid audit sequence');
    if (index === 0) { if (event.event !== 'start') throw new Error('Missing audit start'); continue; }
    if (event.event === 'attempt') {
      if (pending) throw new Error('Incomplete native load');
      const identity = identities.get(event.resolvedPath);
      if (!identity || event.attemptedPath !== event.resolvedPath || event.package !== identity.name || event.version !== identity.version || event.sha512 !== identity.sha512 || event.fatal !== false) throw new Error('Invalid native identity audit');
      if (identity.allow) {
        if (event.decision !== 'allow' || event.reason !== 'approved-file') throw new Error('Invalid native allowance');
        pending = event;
      } else if (event.decision !== 'deny' || event.reason !== 'expected-fsevents-denial') throw new Error('Invalid optional denial');
    } else if (event.event === 'loaded') {
      if (!pending || event.resolvedPath !== pending.resolvedPath || event.sha512 !== pending.sha512) throw new Error('Unmatched native load');
      loaded.push(event.resolvedPath); pending = null;
    } else if (event.event === 'complete') {
      if (index !== events.length - 1 || event.fatal !== false || pending || JSON.stringify(event.loaded) !== JSON.stringify(loaded)) throw new Error('Invalid audit completion');
    } else throw new Error('Native audit contains a failure or unknown event');
  }
  if (events.at(-1).event !== 'complete' || policy.filter((item) => item.allow).some((item) => !loaded.includes(path.join(root, 'node_modules', item.name, item.file)))) throw new Error('Required native evidence incomplete');
  return { loaded: loaded.length, expectedDenials: events.filter((event) => event.reason === 'expected-fsevents-denial').length };
}

function runBuild({ runtime = process, io = fs, spawn = spawnSync } = {}) {
  if (runtime.argv.length !== 2) throw new Error('Guarded build accepts no arguments');
  checkRuntime(runtime, io);
  const root = io.realpathSync(path.resolve(__dirname, '..'));
  const vite = checkDependencies(root, io);
  const evidence = path.join(root, '.verification');
  io.mkdirSync(evidence, { recursive: true });
  if (io.realpathSync(evidence) !== evidence) throw new Error('Verification directory path mismatch');
  const run = io.mkdtempSync(path.join(evidence, 'build-'));
  const env = childEnvironment(runtime.env, runtime.execPath, root, run);
  const argv = ['-p', profile, runtime.execPath, '--require', path.join(__dirname, 'native-guard.cjs'), vite, 'build', '--config', path.join(root, 'vite.config.mjs'), '--configLoader', 'native', '--outDir', path.join(run, 'dist')];
  io.writeFileSync(path.join(run, 'command.json'), JSON.stringify({ executable: sandbox, argv, cwd: root }, null, 2), { mode: 0o600 });
  // This is the sole permitted bootstrap child. No unsandboxed retry exists.
  const result = spawn(sandbox, argv, { cwd: root, env, stdio: 'inherit', timeout: 120000, killSignal: 'SIGTERM' });
  if (result.error || result.signal || result.status !== 0) throw new Error('Sandboxed build failed; inspect retained build evidence');
  const audit = validateAudit(io.readFileSync(env.NEXORA_GUARD_AUDIT, 'utf8'), root);
  return { run, ...audit };
}

if (require.main === module) {
  try { const result = runBuild(); console.log(`PASS: guarded build; ${result.loaded} native loads; ${result.expectedDenials} expected denials; output ${path.join(result.run, 'dist')}`); }
  catch (error) { console.error(`Guarded build failed: ${error.message}`); process.exitCode = 1; }
}
module.exports = { lockHash, sandbox, profile, checkRuntime, checkDependencies, childEnvironment, validateAudit, runBuild };
