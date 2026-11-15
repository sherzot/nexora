import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import reliability from './office-reliability-browser.mjs';
import benchmark from './office-performance-browser.mjs';
import office from './office-browser-checks.mjs';
import experience from './office-experience-browser.mjs';
import simulation from './simulation-browser.mjs';
import analytics from './analytics-browser.mjs';
import collaboration from './collaboration-browser.mjs';
import resize from './office-resize-browser.mjs';
import mission from './office-mission-journey-browser.mjs';
import coordination from './office-coordination-journey-browser.mjs';
import journey from './office-product-journey-browser.mjs';
import hardening from './office-hardening-browser.mjs';

const [engine, origin, mode = 'regression'] = process.argv.slice(2);
const runtime = process.env.NEXORA_PLAYWRIGHT_MODULE;
if (!['chromium', 'firefox', 'webkit'].includes(engine) || !/^http:\/\/127\.0\.0\.1:\d+$/.test(origin ?? '') || !runtime?.startsWith('/')) {
  throw new Error('Specify engine, loopback origin, and absolute NEXORA_PLAYWRIGHT_MODULE path');
}
const playwright = await import(pathToFileURL(runtime).href);
const launcher = playwright[engine] ?? playwright.default?.[engine];
const registeredExecutable = launcher.executablePath();
const override = process.env.NEXORA_BROWSER_EXECUTABLE;
if (override && (!override.startsWith('/') || !existsSync(override))) {
  throw new Error('NEXORA_BROWSER_EXECUTABLE must be an existing absolute path');
}
let browser;
try {
  browser = await launcher.launch(override ? { executablePath: override } : {});
} catch (error) {
  console.log(JSON.stringify({ engine, registeredExecutable, executableOverride: override, status: 'BLOCKED', phase: 'launch', error: error.message }));
  process.exitCode = 1;
}
if (browser) await run(browser);

async function run(browser) {
  try {
    // The pixel comparison in M2 uses Chromium's DevTools Protocol.
    const cameraSuites = engine === 'chromium' ? [experience] : [];
    if (mode === 'all' && !cameraSuites.length) {
      console.log(JSON.stringify({ engine, suite: experience.name, status: 'NOT RUN', reason: 'Requires Chromium CDP screenshots' }));
    }
    const suites = mode === 'all' ? [office, ...cameraSuites, simulation, analytics, collaboration, hardening, reliability, resize, journey, coordination, mission]
      : mode === 'mission' ? [mission] : mode === 'coordination' ? [coordination] : mode === 'journey' ? [journey] : mode === 'benchmark' ? [benchmark] : mode === 'resize' ? [resize] : [reliability];
    const identity = { engine, version: browser.version(), registeredExecutable, executableOverride: override,
      platform: process.platform, architecture: process.arch };
    const fail = (phase, error, suite) => {
      process.exitCode = 1;
      console.log(JSON.stringify({ ...identity, suite, status: 'FAIL', phase, error: error?.stack ?? String(error) }));
    };
    for (const suite of suites) {
      let context;
      let phase = 'setup';
      let result;
      let failed = false;
      try {
        context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();
        await page.bringToFront();
        phase = 'suite';
        result = await suite(page, origin, mode === 'all' ? 'regression' : mode);
      } catch (error) {
        failed = true;
        fail(phase, error, suite.name);
      } finally {
        try {
          await context?.close();
        } catch (error) {
          failed = true;
          fail('context-close', error, suite.name);
        }
      }
      if (!browser.isConnected()) {
        fail('browser-disconnect', new Error('Browser disconnected before the run completed'), suite.name);
        break;
      }
      if (!failed) console.log(JSON.stringify({ ...identity, suite: suite.name, status: 'PASS', result }));
    }
  } finally {
    try {
      await browser.close();
    } catch (error) {
      process.exitCode = 1;
      console.log(JSON.stringify({ engine, status: 'FAIL', phase: 'browser-close', error: error?.stack ?? String(error) }));
    }
  }
}
