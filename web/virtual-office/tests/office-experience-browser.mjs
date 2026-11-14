/** Existing approved browser tooling supplies a Page; no runner dependency added. */
export default async function checkExperience(page, origin = 'http://127.0.0.1:4186') {
  page.setDefaultTimeout(10000);
  await page.bringToFront();
  const assert = (condition, label) => { if (!condition) throw new Error(label); };
  await page.addInitScript(() => {
    window.__experienceFrames = 0;
    window.__experienceView = [];
    window.__experienceViews = [];
    const uniforms = new WeakMap();
    const lookup = WebGL2RenderingContext.prototype.getUniformLocation;
    WebGL2RenderingContext.prototype.getUniformLocation = function (program, name) {
      const location = lookup.call(this, program, name); if (location) uniforms.set(location, name); return location;
    };
    const matrix = WebGL2RenderingContext.prototype.uniformMatrix4fv;
    WebGL2RenderingContext.prototype.uniformMatrix4fv = function (location, transpose, values, ...rest) {
      if (location && uniforms.get(location) === 'viewMatrix') {
        window.__experienceView = Array.from(values);
        if (window.__experienceViews.length < 120) {
          const view = JSON.stringify(window.__experienceView);
          if (window.__experienceViews.at(-1) !== view) window.__experienceViews.push(view);
        }
      }
      return matrix.call(this, location, transpose, values, ...rest);
    };
    window.__experiencePending = new Set();
    const cancel = window.cancelAnimationFrame;
    window.cancelAnimationFrame = (id) => { window.__experiencePending.delete(id); return cancel(id); };
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      const id = raf((time) => { window.__experiencePending.delete(id); window.__experienceFrames++; callback(time); });
      window.__experiencePending.add(id); return id;
    };
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto(`${origin}/#/office`); await page.waitForSelector('canvas'); await page.waitForTimeout(200);
  const canvas = page.locator('canvas');
  const capture = async () => {
    if (page.viewportSize().width > 700) await page.evaluate(() => scrollTo(0, 0));
    let clip = await canvas.boundingBox();
    if (clip.y < 0 || clip.y + clip.height > page.viewportSize().height) { await canvas.scrollIntoViewIfNeeded(); clip = await canvas.boundingBox(); }
    // Capture the viewport without resizing it, then compare scene pixels above
    // the DOM caption. A clipped CDP capture can itself cause pointerleave.
    const session = await page.context().newCDPSession(page);
    try {
      const image = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const pixels = await page.evaluate(async ({ data, clip }) => {
        const image = new Image(); image.src = 'data:image/png;base64,' + data; await image.decode();
        const scale = image.naturalWidth / innerWidth;
        const canvas = document.createElement('canvas'); canvas.width = Math.round(clip.width); canvas.height = Math.round(clip.height - 110);
        canvas.getContext('2d').drawImage(image, clip.x * scale, clip.y * scale, clip.width * scale, (clip.height - 110) * scale, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL().split(',')[1];
      }, { data: image.data, clip });
      return Buffer.from(pixels, 'base64');
    } finally { await session.detach(); }
  };
  await canvas.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0); await page.waitForTimeout(100);
  const initial = await capture();
  const overviewMatrix = await page.evaluate(() => window.__experienceView);
  assert(overviewMatrix.length === 16, 'Camera view matrix must reach GPU');
  const noah = await canvas.evaluate((element) => {
    const r = element.getBoundingClientRect(), yaw = Math.PI / 5, pitch = 0.82;
    const x = 2.4 * 3.7 - 12, y = 1.5, z = 2.4 * 1.5 - 8.4 + 1.5, t = Math.tan(21 * Math.PI / 180);
    const depth = 38 - x * Math.cos(pitch) * Math.sin(yaw) - y * Math.sin(pitch) - z * Math.cos(pitch) * Math.cos(yaw);
    return { x: r.x + (1 + (x * Math.cos(yaw) - z * Math.sin(yaw)) / (depth * t * r.width / r.height)) * r.width / 2,
      y: r.y + (1 - (-x * Math.sin(pitch) * Math.sin(yaw) + y * Math.cos(pitch) - z * Math.sin(pitch) * Math.cos(yaw)) / (depth * t)) * r.height / 2 };
  });
  await page.mouse.move(noah.x, noah.y, { steps: 5 });
  await page.waitForFunction(() => document.querySelector('.office-scene-caption')?.textContent.includes('NoahReviewing'));
  await page.waitForTimeout(100);
  assert((await page.locator('.office-scene-caption').textContent()).includes('NoahReviewing'), 'Hover uses fixture name and status');
  assert(!initial.equals(await capture()), 'Hover must change marker pixels');
  assert(await page.locator('.agent-inspector h2').textContent() === 'Ada', 'Hover must not change React selection');
  await page.mouse.move(20, 20);
  const startFrames = await page.evaluate(() => window.__experienceFrames);
  await page.evaluate(() => { window.__experienceViews = []; });
  await page.getByRole('button', { name: 'Focus Ada', exact: true }).click();
  await page.waitForFunction(() => window.__experienceViews.length >= 2 && window.__experiencePending.size === 0);
  const focused = await capture();
  assert(!initial.equals(focused), 'Camera focus must animate to a distinct view');
  const animatedFrames = await page.evaluate(() => window.__experienceFrames) - startFrames;
  assert(animatedFrames > 2, 'Normal focus schedules multiple frames');
  const idleStart = await page.evaluate(() => window.__experienceFrames); await page.waitForTimeout(250);
  assert(await page.evaluate(() => window.__experienceFrames) === idleStart, 'No idle animation loop');
  const zones = ['Product studio', 'Engineering', 'Quality lab', 'Research corner'];
  for (const zone of zones) {
    const before = await capture();
    const button = page.getByRole('button', { name: new RegExp(zone) }); await button.click(); await page.waitForTimeout(600);
    assert(await button.getAttribute('aria-pressed') === 'true', `Zone active: ${zone}`);
    assert(!before.equals(await capture()), `Zone camera focus: ${zone}`);
  }
  await page.getByRole('button', { name: 'Reset camera' }).click();
  await page.getByRole('button', { name: '2D floor plan' }).click(); await page.waitForTimeout(100);
  assert(await page.evaluate(() => window.__experiencePending.size) === 0, 'Unmount during focus cancels every pending frame');
  await page.getByRole('button', { name: '3D office', exact: true }).click(); await page.waitForSelector('canvas');
  await page.mouse.move(0, 0); await page.waitForTimeout(150);
  await page.getByLabel('Follow selection').check();
  await page.locator('.agent-select').filter({ hasText: 'Theo' }).click(); await page.waitForTimeout(600);
  assert(await page.locator('.agent-inspector h2').textContent() === 'Theo', 'Follow keeps inspector synchronized');
  assert((await page.locator('.office-scene-caption').textContent()).includes('TheoAway'), 'Away is presentation state and remains selectable');
  await page.getByLabel('Follow selection').uncheck();
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(100);
  const beforeReduced = await page.evaluate(() => window.__experienceFrames);
  await page.getByRole('button', { name: 'Reset camera' }).click(); await page.waitForTimeout(600);
  const reducedFrames = await page.evaluate(() => window.__experienceFrames) - beforeReduced;
  assert(reducedFrames <= 2, 'Reduced motion must snap instead of animating');
  await page.locator('.agent-select').filter({ hasText: 'Ada' }).click();
  await page.mouse.move(0, 0); await page.waitForTimeout(150);
  assert(JSON.stringify(overviewMatrix) === JSON.stringify(await page.evaluate(() => window.__experienceView)), 'Reset restores the exact overview camera matrix');
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload(); await page.waitForSelector('svg.office-scene');
  assert(await page.evaluate(() => !performance.getEntriesByType('resource').some((entry) => entry.name.includes('/renderer-'))), 'Mobile SVG must not fetch renderer chunk');
  await page.getByRole('button', { name: /Research corner/ }).click();
  assert(await page.locator('.agent-inspector h2').textContent() === 'Sora', 'SVG zone navigation selects fixture-owned agent');
  await page.getByRole('button', { name: '3D office', exact: true }).click(); await page.waitForSelector('canvas'); await page.waitForTimeout(100);
  const beforeZoom = await capture(); await page.getByRole('button', { name: 'Zoom in', exact: true }).click(); await page.waitForTimeout(100);
  assert(!beforeZoom.equals(await capture()), 'Mobile explicit zoom control');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile 3D has no horizontal overflow');
  await page.getByRole('button', { name: '2D floor plan' }).click(); assert(await canvas.count() === 0, 'Mobile can return to SVG');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { hover: 'PASS', selectedStatus: 'PASS', zoneFocus: 4, followSelection: 'PASS', animatedFrames, reducedFrames,
    reset: 'PASS', transitionUnmount: 'PASS', idleFrames: 0, mobileLazyLoad: 'PASS', mobileZoom: 'PASS', mobileFallback: 'PASS' };
}
