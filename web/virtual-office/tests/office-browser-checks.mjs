/** Runs with an existing Playwright Page supplied by approved browser tooling.
 * No browser package/install is required by the application or this module.
 */
export default async function checkOffice(page, origin = 'http://127.0.0.1:4182') {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const external = [], errors = [];
  page.on('request', (request) => { if (new URL(request.url()).origin !== origin) external.push(request.url()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const audit = window.__officeAudit = { listeners: new Map(), observers: new Set(), frames: new Set() };
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, options) {
      if (this instanceof HTMLCanvasElement || (this === document && type === 'visibilitychange')) {
        let events = audit.listeners.get(this);
        if (!events) audit.listeners.set(this, events = new Map());
        if (!events.has(type)) events.set(type, new Set());
        events.get(type).add(fn);
      }
      return add.call(this, type, fn, options);
    };
    EventTarget.prototype.removeEventListener = function (type, fn, options) {
      audit.listeners.get(this)?.get(type)?.delete(fn);
      return remove.call(this, type, fn, options);
    };
    const Native = ResizeObserver;
    window.ResizeObserver = class extends Native {
      observe(...args) { audit.observers.add(this); return super.observe(...args); }
      disconnect() { audit.observers.delete(this); return super.disconnect(); }
    };
    const raf = requestAnimationFrame, caf = cancelAnimationFrame;
    window.requestAnimationFrame = (fn) => {
      const id = raf((time) => { audit.frames.delete(id); fn(time); });
      audit.frames.add(id); return id;
    };
    window.cancelAnimationFrame = (id) => { audit.frames.delete(id); return caf(id); };
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/#/office`);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(200);
  const canvas = page.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const positions = await canvas.evaluate((element) => {
    const r = element.getBoundingClientRect(), yaw = Math.PI / 5, pitch = 0.82, distance = 38, tangent = Math.tan(21 * Math.PI / 180);
    // Project the authoritative fixture desk centers at the actual avatar head height.
    return [[1.1, 1.1], [3.1, 1.1], [5.8, 1.1], [8, 1.1], [1.1, 4.6], [3.1, 4.6], [5.8, 4.6], [8, 4.6]].map(([u, v]) => {
      const x = 2.4 * (u + 0.6) - 12, y = 1.5, z = 2.4 * (v + 0.4) - 8.4 + 1.5;
      const depth = distance - x * Math.cos(pitch) * Math.sin(yaw) - y * Math.sin(pitch) - z * Math.cos(pitch) * Math.cos(yaw);
      const nx = (x * Math.cos(yaw) - z * Math.sin(yaw)) / (depth * tangent * r.width / r.height);
      const ny = (-x * Math.sin(pitch) * Math.sin(yaw) + y * Math.cos(pitch) - z * Math.sin(pitch) * Math.cos(yaw)) / (depth * tangent);
      return { x: r.x + (nx + 1) * r.width / 2, y: r.y + (1 - ny) * r.height / 2 };
    });
  });
  const names = ['Ada', 'Noah', 'Mira', 'Leo', 'Iris', 'Owen', 'Sora', 'Theo'];
  for (const [index, point] of positions.entries()) {
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(30);
    assert(await page.locator('.agent-inspector h2').textContent() === names[index], `Canvas selection: ${names[index]}`);
  }
  await canvas.focus();
  const before = await canvas.screenshot();
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(80);
  assert(!before.equals(await canvas.screenshot()), 'Keyboard orbit must change the frame');
  await page.keyboard.press('Shift+ArrowRight'); await page.keyboard.press('+'); await page.keyboard.press('Home');
  for (const name of names) {
    await page.locator('.agent-select').filter({ hasText: name }).focus(); await page.keyboard.press('Enter');
    assert(await page.locator('.agent-inspector h2').textContent() === name, `Keyboard selection: ${name}`);
  }
  const metrics = () => page.evaluate(() => ({
    canvas: document.querySelectorAll('canvas').length, observers: window.__officeAudit.observers.size,
    frames: window.__officeAudit.frames.size,
    listeners: [...window.__officeAudit.listeners.values()].reduce((sum, events) => sum + [...events.values()].reduce((n, set) => n + set.size, 0), 0),
  }));
  await page.waitForFunction(() => window.__officeAudit.frames.size === 0);
  const mounted = await metrics();
  await page.getByRole('button', { name: '2D floor plan' }).click();
  const appBaseline = await metrics();
  await page.getByRole('button', { name: '3D office' }).click(); await page.waitForSelector('canvas');
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: '2D floor plan' }).click();
    assert(await canvas.count() === 0, '2D must unmount the GPU canvas');
    await page.getByRole('button', { name: '3D office' }).click(); await page.waitForSelector('canvas');
  }
  await page.waitForTimeout(100);
  const remounted = await metrics();
  assert(JSON.stringify(mounted) === JSON.stringify(remounted), 'Remount must not accumulate resources/listeners');
  await canvas.evaluate((element) => element.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForSelector('svg.office-scene'); await page.waitForTimeout(100);
  const released = await metrics();
  assert(released.canvas === 0 && released.observers === 0 && released.frames === 0 && released.listeners === appBaseline.listeners, 'Context-loss fallback must release renderer resources while preserving application listeners');
  for (const route of ['/agents', '/agents/demo-agent-ada', '/tasks', '/activity', '/workspace']) {
    await page.evaluate((hash) => { location.hash = hash; }, route); await page.waitForTimeout(100);
    assert(await page.locator('#page-title').count() === 1 && await canvas.count() === 0, `Route ${route}`);
  }
  await page.getByRole('combobox', { name: /Theme/ }).selectOption('dark');
  await page.evaluate(() => { location.hash = '/office'; }); await page.waitForSelector('canvas');
  assert(await page.locator('.app-shell').getAttribute('data-theme') === 'dark', 'Dark theme');
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload(); await page.waitForSelector('svg.office-scene');
  assert(await canvas.count() === 0, 'Mobile defaults to SVG');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile must not overflow horizontally');
  await page.locator('.agent-select').filter({ hasText: 'Theo' }).click();
  assert(await page.locator('.agent-inspector h2').textContent() === 'Theo', 'Mobile selection');
  const unsupported = await page.context().newPage();
  await unsupported.setViewportSize({ width: 1280, height: 900 });
  await unsupported.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) { return kind === 'webgl2' ? null : getContext.call(this, kind, ...args); };
  });
  await unsupported.goto(`${origin}/#/office`); await unsupported.waitForSelector('svg.office-scene');
  assert((await unsupported.locator('.office-view-help[role=status]').textContent()).includes('unavailable'), 'Initialization failure must explain fallback');
  await unsupported.close();
  assert(external.length === 0 && errors.length === 0, 'No external requests or uncaught application errors');
  return { canvasAgents: 8, keyboardAgents: 8, mounted, remounted, released, appBaseline, routes: 6, mobile: 'PASS', unsupportedWebGL: 'PASS', external, errors };
}
