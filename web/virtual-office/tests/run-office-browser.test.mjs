import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const filename = fileURLToPath(import.meta.url);

// The real CLI imports this file as its mock browser runtime in child processes.
export const chromium = {
  executablePath: () => '/mock/chromium',
  async launch() {
    const mode = process.env.NEXORA_TEST_FAILURE;
    let count = 0;
    let connected = true;
    return {
      version: () => 'mock',
      isConnected: () => connected,
      async newContext() {
        const first = ++count === 1;
        if (mode === 'context-setup' && first) throw new Error('context creation failed');
        return {
          async newPage() {
            if (mode === 'page-setup' && first) throw new Error('page creation failed');
            if (mode === 'close-only') {
              const locator = {
                async waitFor() {}, async evaluate() { return 0; }, async press() {},
                async count() { return 0; },
              };
              return {
                async bringToFront() {}, async addInitScript() {}, async setViewportSize() {},
                async goto() {}, async waitForFunction() {}, locator: () => locator,
                getByRole: () => ({ async click() {} }),
              };
            }
            return {
              async bringToFront() {},
              async setDefaultTimeout() {},
              async addInitScript() { throw new Error('suite failed'); },
            };
          },
          async close() {
            if (!first) return;
            if (mode === 'disconnect') connected = false;
            if (['context-close', 'disconnect', 'close-only'].includes(mode)) throw new Error('context close failed');
          },
        };
      },
      async close() {
        if (mode === 'browser-close') throw new Error('browser close failed');
      },
    };
  },
};

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  function run(mode) {
    const child = spawnSync(process.execPath, [
      '--no-addons', fileURLToPath(new URL('./run-office-browser.mjs', import.meta.url)),
      'chromium', 'http://127.0.0.1:4205', mode === 'close-only' ? 'resize' : 'all',
    ], {
      encoding: 'utf8', timeout: 5000,
      env: { ...process.env, NEXORA_PLAYWRIGHT_MODULE: filename,
        NEXORA_BROWSER_EXECUTABLE: '', NEXORA_TEST_FAILURE: mode },
    });
    assert.ifError(child.error);
    assert.equal(child.status, 1, child.stderr);
    assert.equal(child.stderr, '');
    return child.stdout.trim().split('\n').map(JSON.parse);
  }

  for (const scenario of ['context-setup', 'page-setup', 'context-close']) {
    test(scenario + ' failure allows the next suite to run', () => {
      const rows = run(scenario);
      assert.ok(rows.every((row) => row.status === 'FAIL'));
      assert.equal(rows[0].suite, 'checkOffice');
      assert.equal(rows[0].phase, scenario === 'context-close' ? 'suite' : 'setup');
      if (scenario === 'context-close') assert.equal(rows[1].phase, 'context-close');
      assert.ok(rows.some((row) => row.suite === 'checkOfficeResize'));
    });
  }

  test('a passing suite with failed cleanup emits only FAIL and exits nonzero', () => {
    const rows = run('close-only');
    assert.deepEqual(rows.map(({ status, phase, suite }) => [status, phase, suite]),
      [['FAIL', 'context-close', 'checkOfficeResize']]);
  });

  test('browser disconnect records teardown and stops later suites', () => {
    const rows = run('disconnect');
    assert.deepEqual(rows.map((row) => row.phase), ['suite', 'context-close', 'browser-disconnect']);
    assert.ok(rows.every((row) => row.suite === 'checkOffice'));
  });

  test('browser close failure is reported separately', () => {
    assert.equal(run('browser-close').at(-1).phase, 'browser-close');
  });
}
