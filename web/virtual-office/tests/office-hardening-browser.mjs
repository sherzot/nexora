// Run against a guarded build with an existing Chromium Playwright page.
export default async function checkOfficeHardening(page, origin = 'http://127.0.0.1:4198') {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [], external = [];
  const onError = (error) => errors.push(error.message);
  const onRequest = (request) => { if (new URL(request.url()).origin !== origin) external.push(request.url()); };
  page.on('pageerror', onError);
  page.on('request', onRequest);
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + '/#/office');
    const canvas = page.locator('.office-webgl canvas');
    await canvas.waitFor();
    const original = await canvas.elementHandle();
    const button = (name) => page.getByRole('button', { name, exact: true });
    const scenario = page.getByRole('combobox', { name: 'Scenario', exact: true });
    for (const id of ['collaboration', 'review', 'day']) {
      await scenario.selectOption(id);
      await button('Step forward').click();
      await button('Reset simulation').click();
      assert(await original.evaluate((node) => node.isConnected), 'Playback reset or scenario change recreated the canvas');
    }
    const hoverReads = await canvas.evaluate(async (el) => {
      const rect = el.getBoundingClientRect(), original = el.getBoundingClientRect;
      let reads = 0;
      el.getBoundingClientRect = () => { reads++; return original.call(el); };
      try {
        for (let i = 0; i < 240; i++) el.dispatchEvent(new PointerEvent('pointermove', {
          isPrimary: true, pointerId: 1, clientX: rect.left + rect.width * .5, clientY: rect.top + rect.height * .5,
        }));
        await new Promise(requestAnimationFrame);
        return reads;
      } finally {
        el.getBoundingClientRect = original;
      }
    });
    assert(hoverReads === 1, 'A pointer burst should pick only its final position');
    await original.dispose();
    await button('2D floor plan').click();
    await scenario.selectOption('review');
    assert(await canvas.count() === 0, 'Scenario switch should retain the selected 2D mode');
    for (let i = 0; i < 8; i++) await button('Step forward').click();
    await page.goto(origin + '/#/activity');
    await page.getByLabel('Timeline stream').selectOption('collaboration');
    const rows = page.locator('[data-collaboration-event]');
    await rows.first().getByRole('button').click();
    const second = await rows.nth(1).getAttribute('data-collaboration-event');
    await page.goto(origin + '/#/activity?interaction=' + encodeURIComponent(second));
    const inspector = page.getByRole('region', { name: 'Interaction Inspector' });
    await inspector.getByText(second, { exact: true }).waitFor();
    assert(await rows.count() === 1, 'Deep link should show its matching interaction only');
    await inspector.getByRole('link', { name: 'Inspect in Office' }).click();
    assert(await page.locator('[data-office-interaction]').getAttribute('data-office-interaction') === second, 'Office cue diverged from timeline selection');
    await button('Reset simulation').click();
    assert(await inspector.count() === 0, 'Reset retained an old interaction');
    await page.goto(origin + '/#/analytics');
    await page.getByText(/No virtual time observed yet/).waitFor();
    await button('Step forward').click();
    await page.getByText(/Observed 500 ms per agent/).waitFor();
    await page.getByRole('region', { name: 'Agent activity breakdown table' }).focus();
    assert(await page.getByRole('region', { name: 'Agent activity breakdown table' }).evaluate((el) => el === document.activeElement), 'Analytics table scroll region should accept keyboard focus');
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      const navigation = page.getByRole('button', { name: 'Navigation' });
      await navigation.press('Enter');
      const collaboration = page.getByRole('navigation').getByRole('link', { name: 'Collaboration' });
      await collaboration.focus();
      await collaboration.press('Escape');
      assert(await navigation.getAttribute('aria-expanded') === 'false', 'Escape did not close navigation');
      assert(await navigation.evaluate((el) => el === document.activeElement && getComputedStyle(el).outlineStyle !== 'none'), 'Escape did not restore visible keyboard focus');
      assert((await navigation.boundingBox()).height >= 44, 'Mobile menu target is under 44 pixels');
      for (const route of ['collaboration', 'office', 'activity', 'analytics']) {
        await page.goto(origin + '/#/' + route);
        await page.locator('#page-title').waitFor();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow in ${route} at ${width}px`);
        if (route === 'office') {
          await page.locator('svg.office-scene').waitFor();
          assert(await canvas.count() === 0, 'Essential Office navigation required WebGL');
          const results = page.getByRole('region', { name: 'Playback results', exact: true });
          await results.waitFor();
          const start = button('Start');
          assert((await start.boundingBox()).height >= 44, 'Playback start target is under 44 pixels');
          await button('Step forward').press('Enter');
          assert((await results.innerText()).includes('Observed so far'), 'Mobile fallback must expose observed results');
          await button('Reset simulation').press('Enter');
          assert((await results.innerText()).includes('No task results have been observed.'), 'Mobile reset must clear outcomes');
        }
      }
    }
    assert(!errors.length && !external.length, JSON.stringify({ errors, external }));
    return { hoverReads, retainedRenderer: 'PASS', timelineSelection: 'PASS', analyticsClock: 'PASS', keyboardFocus: 'PASS', mobileWidths: [320, 390], errors, external };
  } finally {
    page.off('pageerror', onError);
    page.off('request', onRequest);
  }
}
