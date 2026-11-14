// Runs on any Playwright engine with a working WebGL 2 context.
export default async function checkOfficeResize(page, origin) {
  await page.addInitScript(() => {
    const Observer = ResizeObserver;
    window.ResizeObserver = class extends Observer {
      constructor(callback) {
        super((entries, observer) => {
          window.repeatOfficeResize = () => callback(entries, observer);
          callback(entries, observer);
        });
      }
    };
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + '/#/office');
  const canvas = page.locator('.office-webgl canvas');
  await canvas.waitFor();
  await page.waitForFunction(() => typeof window.repeatOfficeResize === 'function');
  const repeats = await canvas.evaluate(async (node) => {
    let writes = 0;
    const observer = new MutationObserver((records) => { writes += records.length; });
    observer.observe(node, { attributes: true, attributeFilter: ['width', 'height'] });
    try {
      for (let i = 0; i < 30; i++) window.repeatOfficeResize();
      await new Promise(requestAnimationFrame);
      return writes;
    } finally {
      observer.disconnect();
    }
  });
  if (repeats !== 0) throw new Error(`Duplicate resize delivery rewrote the drawing buffer ${repeats} times`);
  const width = await canvas.evaluate((node) => node.width);
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.waitForFunction((previous) => {
    const node = document.querySelector('.office-webgl canvas');
    return node && node.width !== previous;
  }, width);
  await canvas.press('Home');
  await page.getByRole('button', { name: '2D floor plan' }).click();
  await page.locator('svg.office-scene').waitFor();
  if (await canvas.count()) throw new Error('Resize followed by fallback retained a canvas');
  return { duplicateNotifications: 30, bufferDimensionWrites: repeats, realResize: 'PASS', fallback: 'PASS' };
}
