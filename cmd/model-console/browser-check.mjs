// Use an existing approved Playwright runtime/browser; never install packages.
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const [engine, origin] = process.argv.slice(2);
const runtime = process.env.NEXORA_PLAYWRIGHT_MODULE;
const evidence = process.env.NEXORA_CONSOLE_EVIDENCE;
if (!['chromium', 'firefox', 'webkit'].includes(engine) || !/^http:\/\/127\.0\.0\.1:\d+$/.test(origin ?? '') || !runtime?.startsWith('/') || !evidence?.startsWith('/')) throw new Error('Specify engine, loopback origin, existing absolute Playwright module and external evidence directory');
mkdirSync(evidence, { recursive: true });
const playwright = await import(pathToFileURL(runtime).href);
const launcher = playwright[engine] ?? playwright.default?.[engine];
const browser = await launcher.launch();
let context;
try {
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const external = [], errors = [];
  let posts = 0;
  page.on('request', request => { if (new URL(request.url()).origin !== origin) external.push(request.url()); if (request.url() === origin + '/api/probe') posts++; });
  page.on('pageerror', error => errors.push(error.message));
  const assert = (ok, reason) => { if (!ok) throw new Error(reason); };
  const prompt = page.getByRole('textbox', { name: 'Prompt', exact: true });
  const send = page.getByRole('button', { name: 'Send to local model', exact: true });
  const cancel = page.getByRole('button', { name: 'Cancel request', exact: true });
  const clear = page.getByRole('button', { name: 'Clear', exact: true });
  const output = page.locator('#output'), status = page.getByRole('status');
  const nextFocus = process.platform === 'darwin' && engine === 'webkit' ? 'Alt+Tab' : 'Tab';
  const waitOutput = text => page.waitForFunction(value => document.getElementById('output').textContent === value, text, { timeout: 15000 });
  const result = text => ({ result: { model: 'fixture', text, input_tokens: 4, output_tokens: 3 } });
  const mock = data => page.route(origin + '/api/probe', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) }));

  await page.goto(origin);
  assert(await page.getByRole('heading', { name: 'Local Model Review', exact: true }).count() === 1, 'Console heading');
  assert(await send.getAttribute('aria-disabled') === 'true' && posts === 0, 'GET cannot generate a model response');
  assert((await page.locator('#warning').innerText()).includes('incorrect answers'), 'Unverified-output warning stays explicit');
  await prompt.fill('Reply exactly CONSOLE_READY and nothing else.');
  await page.keyboard.press(nextFocus);
  assert(await send.evaluate(node => node === document.activeElement && node.matches(':focus-visible')), 'Tab must reach visibly focused Send');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.getElementById('status').dataset.state !== 'loading', undefined, { timeout: 70000 });
  const liveState = await status.getAttribute('data-state');
  assert(liveState === 'complete' && (await output.innerText()).trim().length > 0, 'Actual local model request must complete: ' + await status.innerText() + ' ' + await page.locator('#error').textContent());
  assert((await page.locator('#stats').innerText()).includes('qwen2.5-coder:1.5b'), 'C26 pinned model preserved');
  const liveText = await output.innerText();
  await page.screenshot({ path: path.join(evidence, engine + '-live-desktop.png'), fullPage: true });

  await mock(result('<script>window.modelExecuted=true</script><img src="http://external.invalid/x">\u001b[31m'));
  await send.press('Enter');
  await waitOutput('<script>window.modelExecuted=true</script><img src="http://external.invalid/x">\u001b[31m');
  assert(await output.locator('script,img').count() === 0 && await page.evaluate(() => window.modelExecuted === undefined), 'Model markup must remain literal text');
  await page.unroute(origin + '/api/probe');
  await page.route(origin + '/api/probe', route => route.fulfill({ status: 504, contentType: 'application/json', body: JSON.stringify({ error: 'Local request exceeded the 60-second deadline.' }) }));
  await send.press('Enter');
  await page.getByRole('alert').waitFor();
  assert((await page.getByRole('alert').innerText()).includes('60-second') && await output.textContent() === '', 'Timeout must show error and discard old output');
  await page.unroute(origin + '/api/probe');

  // Controlled stale response ignores AbortSignal on purpose. This verifies
  // generation isolation beyond the browser's own normal fetch cancellation.
  await page.evaluate(() => {
    const original = window.fetch;
    let first = true;
    window.fetch = (...args) => {
      if (first && args[0] === '/api/probe') {
        first = false;
        return new Promise(resolve => { window.deliverStaleConsoleResponse = () => resolve(new Response(JSON.stringify({ result: { model: 'fixture', text: 'obsolete response', input_tokens: 1, output_tokens: 1 } }), { headers: { 'Content-Type': 'application/json' } })); });
      }
      return original(...args);
    };
    window.restoreConsoleFetch = () => { window.fetch = original; delete window.restoreConsoleFetch; delete window.deliverStaleConsoleResponse; };
  });
  await send.press('Enter');
  assert(await status.getAttribute('data-state') === 'loading' && await prompt.getAttribute('readonly') !== null, 'Busy state preserves captured input');
  assert(await status.evaluate(node => getComputedStyle(node, '::before').animationName === 'none'), 'Reduced motion disables busy animation');
  await cancel.press('Enter');
  assert(await status.getAttribute('data-state') === 'canceled' && await send.evaluate(node => node === document.activeElement), 'Cancel must restore Send focus');
  await mock(result('new response'));
  await send.press('Enter'); await waitOutput('new response');
  await page.evaluate(async () => { window.deliverStaleConsoleResponse(); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  assert(await output.textContent() === 'new response', 'Canceled old response cannot replace a new one');
  await page.evaluate(() => window.restoreConsoleFetch());
  await page.unroute(origin + '/api/probe');

  const before = posts;
  await prompt.fill('界'.repeat(1366));
  await send.press('Enter');
  assert(await send.getAttribute('aria-disabled') === 'true' && posts === before && (await page.locator('#byte-count').innerText()).startsWith('4098'), 'UTF-8 byte limit must prevent submission');
  await page.keyboard.press(nextFocus);
  assert(await clear.evaluate(node => node === document.activeElement && node.matches(':focus-visible')), 'Tab must reach Clear after disabled Cancel');
  await page.keyboard.press('Enter');
  assert(await prompt.inputValue() === '' && await output.textContent() === '' && await prompt.evaluate(node => node === document.activeElement && node.matches(':focus-visible')), 'Clear must reset and focus Prompt');
  const rejected = await page.evaluate(async () => (await fetch('/api/probe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'no token' }) })).status);
  assert(rejected === 403, 'Actual browser request without token must be rejected');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await prompt.fill('mobile fixture');
    await mock(result('mobile response'));
    await send.press('Enter'); await waitOutput('mobile response');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile horizontal overflow');
    assert(await page.locator('button').evaluateAll(nodes => nodes.every(node => node.getBoundingClientRect().height >= 44)), 'Mobile touch targets');
    await page.screenshot({ path: path.join(evidence, engine + '-mobile-' + width + '.png'), fullPage: true });
    await page.unroute(origin + '/api/probe');
    await page.reload();
    assert(await prompt.inputValue() === '' && await output.textContent() === '', 'Reload cannot retain prompt/results');
  }
  assert(external.length === 0 && errors.length === 0, JSON.stringify({ external, errors }));
  console.log(JSON.stringify({ engine, version: browser.version(), status: 'PASS', liveModelResponse: liveText, checks: ['live local model', 'keyboard focus', 'text-only rendering', 'timeout UI (fixture)', 'cancel/stale response (controlled injection)', 'byte limit', 'actual missing-token rejection', '320/390 mobile', 'dark/reduced motion', 'reload reset'], external, errors }));
} catch (error) {
  console.log(JSON.stringify({ engine, status: 'FAIL', error: error.stack ?? String(error) })); process.exitCode = 1;
} finally {
  try { await context?.close(); } catch (error) { console.log(JSON.stringify({ engine, status: 'FAIL', phase: 'context-close', error: String(error) })); process.exitCode = 1; }
  try { await browser.close(); } catch (error) { console.log(JSON.stringify({ engine, status: 'FAIL', phase: 'browser-close', error: String(error) })); process.exitCode = 1; }
}
