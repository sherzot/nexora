// C28 navigation only; no model request or automatic port discovery.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
export default async function checkOfficeLocalConsole(page, origin) {
  const consoleOrigin = process.env.NEXORA_LOCAL_CONSOLE_ORIGIN;
  if (!/^http:\/\/127\.0\.0\.1:[1-9]\d{0,4}$/.test(consoleOrigin ?? '')) throw new Error('Provide the running trusted console origin');
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [], outside = [], consoleRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.context().on('request', request => {
    const url = new URL(request.url());
    if (url.origin === consoleOrigin) consoleRequests.push({ url: request.url(), method: request.method(), referer: request.headers().referer });
    else if (url.origin !== origin) outside.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + '/#/office');
  const region = page.getByRole('region', { name: 'Work with the local model' });
  const input = region.getByLabel('Console address');
  const prepare = region.getByRole('button', { name: 'Prepare console link' });
  const link = region.getByRole('link', { name: /Open local model console/ });
  await region.scrollIntoViewIfNeeded();
  assert(await input.inputValue() === '' && await link.count() === 0, 'No saved/default destination');
  const rejected = ['', 'https://127.0.0.1:53737', 'http://localhost:53737', 'http://127.1:53737',
    'http://2130706433:53737', 'http://127.0.0.2:53737', 'http://[::1]:53737', 'http://user@127.0.0.1:53737',
    'http://127.0.0.1:0', 'http://127.0.0.1:65536', 'http://127.0.0.1:0537',
    'http://127.0.0.1:53737/api/probe', 'http://127.0.0.1:53737/?prompt=Ada',
    'http://127.0.0.1:53737/#/office', 'javascript:alert(1)', 'http://example.com:53737',
    'http://127.0.0.1:53737\\@example.com', 'http://127.0.0.1:53737/%0a'];
  for (const address of rejected) {
    await input.fill(address); await prepare.press('Enter');
    assert(await input.getAttribute('aria-invalid') === 'true' && await region.getByRole('alert').isVisible() && await link.count() === 0, 'Unsafe address rejected: ' + address);
  }
  for (const port of ['1', '65535']) {
    await input.fill(`http://127.0.0.1:${port}`); await prepare.press('Enter');
    assert(await link.getAttribute('href') === `http://127.0.0.1:${port}/`, 'Boundary port accepted without connecting');
  }
  await input.fill(' ' + consoleOrigin + '/ '); await input.press('Enter');
  assert(await link.getAttribute('href') === consoleOrigin + '/', 'Canonical address');
  assert(consoleRequests.length === 0, 'Typing/validation cannot contact the console');
  assert(await link.getAttribute('rel') === 'noopener noreferrer' && await link.getAttribute('referrerpolicy') === 'no-referrer', 'Opener/referrer isolation');
  // Keep keyboard focus predictable across the dynamic status insertion.
  await prepare.focus();
  const tab = process.platform === 'darwin' && page.context().browser().browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(tab);
  assert(await link.evaluate(node => node === document.activeElement && node.matches(':focus-visible')), 'Link reachable with visible keyboard focus');
  const before = await page.evaluate(() => ({ hash: location.hash, history: history.length, agent: document.querySelector('.agent-inspector h2')?.textContent }));
  const popupReady = page.waitForEvent('popup');
  await link.press('Enter');
  const popup = await popupReady;
  popup.on('pageerror', error => errors.push(error.message));
  await popup.waitForLoadState('domcontentloaded');
  assert(popup.url() === consoleOrigin + '/', 'Only the root URL is opened');
  assert(await popup.evaluate(() => window.opener === null), 'No opener access');
  assert(await popup.locator('#prompt').inputValue() === '', 'No Office text prefilled');
  assert(await popup.getByRole('heading', { name: 'Local Model Review', exact: true }).isVisible(), 'Real C27 console loaded');
  assert((await popup.locator('#warning').innerText()).includes('incorrect answers'), 'Unverified warning retained');
  assert(consoleRequests.every(request => request.method === 'GET' && !request.referer && new URL(request.url).search === ''), 'No prompt, API request or referrer passed');
  const evidence = process.env.NEXORA_C28_EVIDENCE;
  if (evidence?.startsWith('/')) {
    mkdirSync(evidence, { recursive: true });
    await region.screenshot({ path: path.join(evidence, 'office-console-desktop.png') });
  }
  await popup.close();
  assert(JSON.stringify(await page.evaluate(() => ({ hash: location.hash, history: history.length, agent: document.querySelector('.agent-inspector h2')?.textContent }))) === JSON.stringify(before), 'Office route/history/selection untouched');
  await input.fill(consoleOrigin + '/changed');
  assert(await link.count() === 0, 'Editing immediately invalidates the previous link');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 }); await region.scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile overflow at ' + width);
    assert(await prepare.evaluate(node => node.getBoundingClientRect().height >= 44), 'Mobile target height');
    if (evidence?.startsWith('/')) await region.screenshot({ path: path.join(evidence, `office-console-${width}.png`) });
  }
  await page.goto(origin + '/#/workspace');
  await page.getByRole('combobox', { name: /Theme/ }).selectOption('dark');
  await page.getByRole('checkbox', { name: /Reduce motion/ }).check();
  await page.goto(origin + '/#/office');
  await region.scrollIntoViewIfNeeded();
  assert(await input.evaluate(node => getComputedStyle(node).colorScheme === 'dark'), 'Dark theme inherited by the input');
  if (evidence?.startsWith('/')) await region.screenshot({ path: path.join(evidence, 'office-console-dark.png') });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await input.fill(consoleOrigin); await input.press('Enter');
  await page.reload(); await input.waitFor();
  assert(await input.inputValue() === '' && await link.count() === 0, 'Reload clears address');
  await input.fill(consoleOrigin); await input.press('Enter');
  await page.goto(origin + '/#/agents'); await page.getByRole('heading', { name: /Agent Directory/ }).waitFor();
  await page.goto(origin + '/#/office'); await input.waitFor();
  assert(await input.inputValue() === '' && await link.count() === 0, 'Route exit clears address');
  assert(errors.length === 0 && outside.length === 0, JSON.stringify({ errors, outside }));
  return { rejectedAddresses: rejected.length, realConsoleOpened: true, modelPosts: consoleRequests.filter(r => r.method === 'POST').length, mobileWidths: [320, 390], pageErrors: errors, externalRequests: outside };
}
