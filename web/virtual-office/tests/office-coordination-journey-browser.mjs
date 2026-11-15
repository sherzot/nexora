// Run against the guarded build on loopback with the existing Playwright runtime.
export default async function checkCoordinationJourney(page, origin) {
  const problems = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) problems.push(request.url());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const button = (name) => page.getByRole('button', { name, exact: true });
  const link = (name) => page.getByRole('link', { name, exact: true });
  const region = (name) => page.getByRole('region', { name, exact: true });
  const chooser = page.getByLabel('Alternative scenario');
  const observed = region('Observed playback');
  const hypothetical = region('Hypothetical preview');
  const clock = () => page.locator('.simulation-controls time').textContent();
  const focusedHeading = (title) => page.waitForFunction((text) =>
    document.activeElement?.id === 'page-title' && document.activeElement.textContent.includes(text), title);
  const openWorkspace = async () => {
    await page.getByRole('button', { name: /^Select Ada,/ }).press('Enter');
    await link('View agent details').press('Enter');
    await focusedHeading('Ada');
    const task = page.locator('.task-detail-list li').first();
    const title = await task.locator('h3').innerText();
    await task.getByRole('button', { name: 'Open task workspace' }).press('Enter');
    await focusedHeading(title);
    assert(await region('Linked synthetic agents').getByRole('link', { name: /Ada/ }).count() === 1, 'Workspace must preserve linked participant identity');
    return title;
  };

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + '/#/office');
  await page.locator('.office-webgl canvas').waitFor();
  await button('2D floor plan').press('Enter');
  const title = await openWorkspace();
  const taskHash = await page.evaluate(() => location.hash);
  for (let i = 0; i < 24; i++) await button('Step forward').press('Enter');
  const tick = await clock();
  await chooser.selectOption('collaboration');
  const first = await hypothetical.innerText();
  assert(await hypothetical.getByRole('link').count() === 0, 'Hypothetical evidence must stay outside the Timeline');
  assert(await clock() === tick, 'Choosing an alternative changed playback');
  await chooser.selectOption('review');
  await chooser.selectOption('collaboration');
  assert(await hypothetical.innerText() === first, 'Identical inputs must produce identical preview output');
  await button('Step forward').press('Enter');
  assert(await clock() !== tick && await hypothetical.innerText() === first, 'Playback must advance independently from the captured comparison');
  await button('Reset preview').press('Enter');
  assert(await hypothetical.count() === 0 && await chooser.evaluate((node) =>
    node === document.activeElement && node.matches(':focus-visible')), 'Reset preview must restore visible focus');
  const afterReset = await clock();
  assert(afterReset === 'T+00:12.500', 'Reset preview moved the simulation clock');
  await chooser.selectOption('review');

  const evidence = observed.getByRole('link').first();
  const href = await evidence.getAttribute('href');
  await evidence.press('Enter');
  await focusedHeading('Activity Timeline');
  assert(await page.locator('[data-collaboration-event]').count() === 1, 'Timeline must resolve the observed evidence');
  await page.goBack();
  await focusedHeading(title);
  assert(await hypothetical.count() === 0, 'Leaving the workspace must clear its ephemeral preview');
  await page.goForward();
  await focusedHeading('Activity Timeline');
  assert(await page.evaluate(() => location.hash) === href, 'Forward must preserve evidence identity');
  await page.goto(origin + '/' + taskHash);
  await focusedHeading(title);
  await chooser.selectOption('review');
  await page.getByRole('combobox', { name: 'Scenario', exact: true }).selectOption('collaboration');
  assert(await hypothetical.count() === 0, 'Scenario change must invalidate the comparison');
  await chooser.selectOption('review');
  await button('Reset simulation').press('Enter');
  assert(await hypothetical.count() === 0, 'Playback reset must invalidate the comparison');
  await page.goto(origin + '/' + href);
  await link('Return to Timeline').waitFor();
  await page.goto(origin + '/#/tasks/unknown-task');
  await focusedHeading('Task not found');
  await link('Return to Task Board').press('Enter');
  await focusedHeading('Task Board');
  assert(await link('Open task workspace').count() > 0, 'Board recovery must expose workspace links');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin + '/?coordination-mobile=' + width + '#/office');
    await page.locator('svg.office-scene').waitFor();
    await openWorkspace();
    await chooser.selectOption('review');
    await hypothetical.waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile comparison overflow');
    await link('Return to Office').press('Enter');
    await focusedHeading('Virtual Office');
    await page.locator('svg.office-scene').waitFor();
    assert(await page.getByRole('button', { name: /^Select Ada,/ }).getAttribute('aria-pressed') === 'true', 'Return lost the SVG selection');
  }
  assert(!problems.length, JSON.stringify(problems));
  return { comparison: 'PASS', playbackIsolation: 'PASS', history: 'PASS', reset: 'PASS', mobileWidths: [320, 390] };
}
