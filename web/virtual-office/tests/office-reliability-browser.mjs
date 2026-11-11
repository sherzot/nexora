// Use a foreground Playwright page in a fresh context with downloads enabled.
export default async function checkOfficeReliability(page, origin = 'http://127.0.0.1:4199') {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [], external = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (new URL(request.url()).origin !== origin) external.push(request.url()); });
  await page.addInitScript(() => {
    const stats = window.reliability = {
      contexts: 0, losses: 0, observers: 0, listeners: 0, urls: 0, failNextDraw: false, failed: false, failureCleanedInFrame: false,
      pending: new Set(), gl: {},
    };
    const contexts = new WeakSet();
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      const context = getContext.call(this, type, ...args);
      if (type === 'webgl2' && context && !contexts.has(context)) {
        contexts.add(context);
        stats.contexts++;
        this.addEventListener('webglcontextlost', () => stats.losses++, { once: true });
      }
      return context;
    };
    const proto = WebGL2RenderingContext.prototype;
    for (const kind of ['Buffer', 'Texture', 'Program', 'Framebuffer', 'Renderbuffer', 'VertexArray']) {
      const counts = stats.gl[kind] = { created: 0, deleted: 0 };
      const create = proto['create' + kind], remove = proto['delete' + kind];
      proto['create' + kind] = function (...args) {
        const value = create.apply(this, args);
        if (value) counts.created++;
        return value;
      };
      proto['delete' + kind] = function (value) {
        if (value) counts.deleted++;
        return remove.call(this, value);
      };
    }
    for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const draw = proto[name];
      proto[name] = function (...args) {
        if (stats.failNextDraw) {
          stats.failNextDraw = false;
          stats.failed = true;
          throw new Error('Injected renderer failure for reliability test');
        }
        return draw.apply(this, args);
      };
    }
    const callbacks = new WeakMap();
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, options) {
      if ((this instanceof HTMLCanvasElement && !options?.once) || (this === document && type === 'visibilitychange')) {
        const key = type + ':' + (typeof options === 'boolean' ? options : Boolean(options?.capture));
        const entries = callbacks.get(this) ?? new Map();
        callbacks.set(this, entries);
        const handlers = entries.get(key) ?? new Set();
        entries.set(key, handlers);
        if (!handlers.has(fn)) { handlers.add(fn); stats.listeners++; }
      }
      return add.call(this, type, fn, options);
    };
    EventTarget.prototype.removeEventListener = function (type, fn, options) {
      const key = type + ':' + (typeof options === 'boolean' ? options : Boolean(options?.capture));
      if (callbacks.get(this)?.get(key)?.delete(fn)) stats.listeners--;
      return remove.call(this, type, fn, options);
    };
    const NativeObserver = ResizeObserver, observed = new WeakSet();
    window.ResizeObserver = class extends NativeObserver {
      observe(...args) {
        if (!observed.has(this)) { observed.add(this); stats.observers++; }
        return super.observe(...args);
      }
      disconnect() {
        if (observed.delete(this)) stats.observers--;
        return super.disconnect();
      }
    };
    const raf = requestAnimationFrame, cancel = cancelAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      const id = raf((time) => {
        stats.pending.delete(id);
        const injecting = stats.failNextDraw;
        callback(time);
        if (injecting && stats.failed) {
          stats.failureCleanedInFrame = stats.pending.size === 0 && stats.observers === 0
            && !document.querySelector('.office-webgl canvas');
        }
      });
      stats.pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => { stats.pending.delete(id); cancel(id); };
    const createUrl = URL.createObjectURL, revoke = URL.revokeObjectURL, urls = new Set();
    URL.createObjectURL = (blob) => { const url = createUrl(blob); urls.add(url); stats.urls = urls.size; return url; };
    URL.revokeObjectURL = (url) => { urls.delete(url); stats.urls = urls.size; revoke(url); };
  });
  const state = () => page.evaluate(() => {
    const { pending, ...stats } = window.reliability;
    return { ...stats, raf: pending.size, canvases: document.querySelectorAll('canvas').length,
      heapBytes: performance.memory?.usedJSHeapSize ?? null };
  });
  const go = async (route, title) => {
    await page.goto(origin + '/#/' + route);
    await page.getByRole('heading', { name: title, level: 1 }).waitFor();
  };
  const button = (name) => page.getByRole('button', { name, exact: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go('office', 'Virtual Office.');
  const canvas = page.locator('.office-webgl canvas');
  await canvas.waitFor();
  const webgl = await canvas.evaluate((node) => Boolean(node.getContext('webgl2')));
  assert(webgl, '3D WebGL context is unavailable for this stress run');
  const clock = () => page.locator('.simulation-controls time').textContent();
  const steps = async (count) => { for (let i = 0; i < count; i++) await button('Step forward').click(); };
  const fingerprints = new Map(), samples = [];
  for (let cycle = 0; cycle < 6; cycle++) {
    const scenario = ['day', 'collaboration', 'review'][cycle % 3];
    const selector = page.getByRole('combobox', { name: 'Scenario', exact: true });
    await selector.selectOption(scenario);
    await button('Reset simulation').click();
    const before = (await state()).contexts;
    await steps(8);
    assert(await clock() === 'T+00:04.000', 'Scenario tick drift');
    assert((await state()).contexts === before, 'Scenario reset remounted WebGL');
    for (const agent of await page.locator('.agent-select').all()) await agent.press('Enter');
    await button('2D floor plan').click();
    await page.locator('svg.office-scene').waitFor();
    await button('3D office').click();
    await canvas.waitFor();
    await go('activity', 'Activity Timeline');
    const events = await page.locator('[data-simulation-event]').evaluateAll((rows) => rows.map((row) => row.dataset.simulationEvent));
    assert(events.length > 0 && events.length <= 128 && new Set(events).size === events.length, 'History is empty, unbounded or duplicated');
    const fingerprint = JSON.stringify(events);
    if (fingerprints.has(scenario)) assert(fingerprints.get(scenario) === fingerprint, 'Scenario replay changed event ordering');
    fingerprints.set(scenario, fingerprint);
    await go('collaboration', 'Collaboration');
    await page.locator('.workflow-node').first().press('Enter');
    await page.getByRole('region', { name: 'Interaction Inspector' }).waitFor();
    await go('analytics', 'Simulation Analytics');
    for (const format of ['JSON', 'CSV']) {
      const [download] = await Promise.all([page.waitForEvent('download'), button('Export ' + format).click()]);
      assert(download.suggestedFilename().endsWith('.' + format.toLowerCase()), 'Unexpected export filename');
    }
    assert((await state()).urls === 1, 'Report object URLs accumulated');
    await go('activity', 'Activity Timeline');
    await page.waitForFunction(() => {
      const s = window.reliability;
      return s.observers === 0 && s.listeners === 1 && s.pending.size === 0 && s.urls === 0 && s.losses === s.contexts;
    });
    samples.push(await state());
    await go('office', 'Virtual Office.');
    await canvas.waitFor();
  }
  await page.getByRole('combobox', { name: 'Speed', exact: true }).selectOption('4');
  await button('Resume').click();
  await page.waitForFunction(() => document.querySelector('.simulation-controls time').textContent !== 'T+00:04.000');
  await button('Pause').click();
  const paused = await clock();
  await page.waitForTimeout(200);
  assert(await clock() === paused && (await state()).raf === 0, 'Pause left a clock or renderer running');
  await button('Resume').click();
  await page.waitForFunction((previous) => document.querySelector('.simulation-controls time').textContent !== previous, paused);
  await canvas.evaluate((node) => {
    node.focus();
    window.reliability.failNextDraw = true;
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  });
  await page.locator('svg.office-scene').waitFor();
  await page.waitForFunction(() => {
    const s = window.reliability;
    return s.failed && s.losses === s.contexts && s.pending.size === 0 && s.observers === 0 && s.listeners === 1;
  });
  assert((await state()).failureCleanedInFrame, 'Failed draw queued more work or retained the canvas until a later commit');
  assert(await button('2D floor plan').evaluate((node) => node === document.activeElement), 'Fallback did not restore keyboard focus');
  await button('Pause').click();
  assert(!errors.length && !external.length, JSON.stringify({ errors, external }));
  return { cycles: samples.length, afterEachCycle: samples, afterInjectedFailure: await state(), errors, external };
}
