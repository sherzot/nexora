// Chromium benchmark. Pass the guarded build's local origin and use a fresh context.
export default async function measureOffice(page, origin = 'http://127.0.0.1:4197') {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    const audit = window.officePerformance = { draw: 0, reads: 0, frames: [], pending: new Set() };
    for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function (...args) {
        audit.draw++;
        return original.apply(this, args);
      };
    }
    const rect = HTMLCanvasElement.prototype.getBoundingClientRect;
    HTMLCanvasElement.prototype.getBoundingClientRect = function () { audit.reads++; return rect.call(this); };
    const raf = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      const id = raf((time) => {
        audit.pending.delete(id);
        const draw = audit.draw, start = performance.now();
        callback(time);
        audit.frames.push({ time, cpuMs: performance.now() - start, draws: audit.draw - draw });
      });
      audit.pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => { audit.pending.delete(id); cancel(id); };
  });
  const runs = [];
  for (let run = 0; run < 3; run++) {
    await page.goto(origin + '/?benchmark=' + run + '#/office');
    await page.locator('.office-webgl canvas').waitFor();
    await page.waitForFunction(() => window.officePerformance.frames.some((frame) => frame.draws));
    runs.push(await page.evaluate(async () => {
      const audit = window.officePerformance;
      const nav = performance.getEntriesByType('navigation')[0];
      const chunk = performance.getEntriesByType('resource').find((entry) => /\/renderer-.*\.js$/.test(entry.name));
      const initial = audit.frames.find((frame) => frame.draws);
      const canvas = document.querySelector('.office-webgl canvas');
      const gl = canvas.getContext('webgl2');
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const bounds = canvas.getBoundingClientRect();
      const before = audit.frames.length, reads = audit.reads, start = performance.now();
      for (let i = 0; i < 240; i++) canvas.dispatchEvent(new PointerEvent('pointermove', {
        clientX: bounds.left + bounds.width * (0.2 + (i % 60) / 100),
        clientY: bounds.top + bounds.height * 0.52,
        pointerId: 1, isPrimary: true,
      }));
      const dispatchMs = performance.now() - start;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return {
        loadMs: nav.loadEventEnd, firstDrawMs: initial.time,
        chunkReadyToFirstDrawMs: initial.time - chunk.responseEnd,
        initialDraws: initial.draws, hoverReads: audit.reads - reads,
        dispatchMs, hoverCallbacks: audit.frames.length - before,
        gpu: info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
      };
    }));
    const frameCount = () => page.evaluate(() => window.officePerformance.frames.length);
    const idle = await frameCount();
    await page.waitForTimeout(500);
    runs.at(-1).idleFrames = await frameCount() - idle;
    const start = await frameCount();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.waitForTimeout(3500);
    const stop = await frameCount();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForTimeout(100);
    const paused = await frameCount();
    await page.waitForTimeout(500);
    runs.at(-1).pausedFrames = await frameCount() - paused;
    Object.assign(runs.at(-1), await page.evaluate(([start, stop]) => {
      const frames = window.officePerformance.frames.slice(start, stop).filter((frame) => frame.draws);
      const percentile = (values, p) => values.sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];
      return {
        activeFrames: frames.length,
        activeCpuP95Ms: percentile(frames.map((frame) => frame.cpuMs), .95),
        activeIntervalP95Ms: percentile(frames.slice(1).map((frame, index) => frame.time - frames[index].time), .95),
        steadyDraws: percentile(frames.map((frame) => frame.draws), .5),
      };
    }, [start, stop]));
    await page.goto(origin + '/#/analytics');
    await page.getByRole('heading', { name: 'Simulation Analytics', exact: true }).waitFor();
    runs.at(-1).released = await page.evaluate(() => !document.querySelector('canvas') && window.officePerformance.pending.size === 0);
  }
  return { browser: page.context().browser().version(), platform: await page.evaluate(() => navigator.platform), runs };
}
