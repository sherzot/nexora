import { pathToFileURL } from 'node:url';
import reliability from './office-reliability-browser.mjs';
import benchmark from './office-performance-browser.mjs';
import office from './office-browser-checks.mjs';
import experience from './office-experience-browser.mjs';
import simulation from './simulation-browser.mjs';
import analytics from './analytics-browser.mjs';
import collaboration from './collaboration-browser.mjs';
import resize from './office-resize-browser.mjs';
import hardening from './office-hardening-browser.mjs';

const [engine, origin, mode = 'regression'] = process.argv.slice(2);
const runtime = process.env.NEXORA_PLAYWRIGHT_MODULE;
if (!['chromium', 'firefox', 'webkit'].includes(engine) || !/^http:\/\/127\.0\.0\.1:\d+$/.test(origin ?? '') || !runtime?.startsWith('/')) {
  throw new Error('Specify engine, loopback origin, and absolute NEXORA_PLAYWRIGHT_MODULE path');
}
const playwright = await import(pathToFileURL(runtime).href);
const launcher = playwright[engine] ?? playwright.default?.[engine];
const browser = await launcher.launch();
try {
  // The pixel comparison in M2 uses Chromium's DevTools Protocol.
  const cameraSuites = engine === 'chromium' ? [experience] : [];
  if (mode === 'all' && !cameraSuites.length) {
    console.log(JSON.stringify({ engine, suite: experience.name, status: 'SKIPPED', reason: 'Requires Chromium CDP screenshots' }));
  }
  const suites = mode === 'all' ? [office, ...cameraSuites, simulation, analytics, collaboration, hardening, reliability, resize]
    : mode === 'benchmark' ? [benchmark] : mode === 'resize' ? [resize] : [reliability];
  for (const suite of suites) {
    const context = await browser.newContext({ acceptDownloads: true });
    try {
      const page = await context.newPage();
      await page.bringToFront();
      console.log(JSON.stringify({ engine, version: browser.version(), suite: suite.name,
        result: await suite(page, origin, mode === 'all' ? 'regression' : mode) }));
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
