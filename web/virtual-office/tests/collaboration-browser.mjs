// Run against the guarded build on a loopback origin using an existing Playwright page.
export default async function checkCollaboration(page, origin = 'http://127.0.0.1:4196') {
  const external = [], errors = [];
  const onRequest = (request) => { if (!request.url().startsWith(origin + '/')) external.push(request.url()); };
  const onError = (error) => errors.push(error.message);
  const expect = (ok, message) => { if (!ok) throw new Error(message); };
  page.on('request', onRequest);
  page.on('pageerror', onError);
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + '/#/collaboration');
    const graph = page.getByRole('region', { name: 'Synthetic workflow graph' });
    const inspector = page.getByRole('region', { name: 'Interaction Inspector' });
    const planned = graph.locator('[data-status="pending"]');
    await planned.first().waitFor();
    expect(await planned.count() === 48, 'The initial graph should contain only planned review steps');
    await graph.getByRole('button', { name: /Task assignment/ }).first().press('Enter');
    expect((await inspector.innerText()).includes('Pending playback'), 'Planned step has an observed timestamp');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    expect(await page.getByLabel('Workflow scale').innerText() === '120%', 'Graph zoom did not change');
    await page.getByRole('button', { name: 'Reset zoom' }).click();
    expect(await page.getByLabel('Workflow scale').innerText() === '100%', 'Graph zoom did not reset');
    await page.getByLabel('Workflow agent').selectOption('demo-agent-ada');
    expect(await graph.locator('.collaboration-flow').count() < 8, 'Agent filter did not narrow graph');
    await page.getByLabel('Workflow agent').selectOption('');
    await page.getByLabel('Workflow task').selectOption({ index: 1 });
    expect(await graph.locator('.collaboration-flow').count() < 8, 'Task filter did not narrow graph');
    await page.getByLabel('Workflow task').selectOption('');
    for (let tick = 0; tick < 24; tick++) await page.getByRole('button', { name: 'Step forward' }).click();
    await graph.getByRole('button', { name: /Demo Approval/ }).first().click();
    expect((await inspector.innerText()).includes('grants no authority'), 'Missing demo approval qualification');
    const eventLink = inspector.getByRole('link', { name: /^sim-/ });
    await eventLink.click();
    await page.locator('[data-collaboration-event]').waitFor();
    expect(await page.locator('[data-collaboration-event]').count() === 1, 'Timeline link did not isolate the interaction');
    await page.getByLabel('Interaction type').selectOption('handoff');
    expect(await page.locator('[data-collaboration-event]').count() === 0, 'Interaction filter did not exclude approval');
    await page.getByLabel('Interaction type').selectOption('approval');
    await inspector.getByRole('link', { name: 'Inspect in Office' }).click();
    await page.locator('.office-webgl canvas').waitFor();
    await page.locator('[data-office-interaction]').waitFor();
    await page.getByRole('button', { name: '2D floor plan' }).click();
    expect(await page.locator('[data-collaboration-agent]').count() === 2, 'Expected two SVG participant cues');
    expect(await page.locator('.office-webgl canvas').count() === 0, 'Canvas was retained after switching to 2D');
    await page.getByRole('button', { name: 'Clear interaction' }).click();
    expect(await page.locator('[data-collaboration-agent]').count() === 0, 'Cleared selection left SVG cues');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + '/#/collaboration');
    await page.getByLabel('Scenario').selectOption('collaboration');
    await planned.first().waitFor();
    expect(await graph.getByRole('button', { name: /Collaboration request/ }).count() === 8, 'Scenario switch did not replace the flow');
    await graph.getByRole('button', { name: /Collaboration request/ }).first().press('Space');
    await inspector.waitFor();
    await page.getByRole('button', { name: 'Reset simulation' }).click();
    expect(await inspector.count() === 0, 'Reset retained a stale interaction');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile graph overflowed horizontally');
    expect(!external.length && !errors.length, JSON.stringify({ external, errors }));
    return { graph: 'PASS', keyboard: 'PASS', inspector: 'PASS', timeline: 'PASS', office: 'PASS', mobileReducedMotion: 'PASS', external, errors };
  } finally {
    page.off('request', onRequest);
    page.off('pageerror', onError);
  }
}
