// Run against the guarded synthetic frontend on loopback.
export default async function checkOfficeProductJourney(page, origin) {
  const problems = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) problems.push(request.url());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const heading = page.locator('#page-title');
  const select = (name) => page.getByRole('button', { name, exact: true });
  const inspector = page.getByRole('region', { name: 'Interaction Inspector' });
  const focusedHeading = (name) => page.waitForFunction((title) => {
    const element = document.activeElement;
    return element.id === 'page-title' && element.textContent.includes(title);
  }, name);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + '/#/office');
  await page.locator('.office-webgl canvas').waitFor();
  await select('2D floor plan').press('Enter');
  const ada = page.getByRole('button', { name: /^Select Ada,/ });
  await ada.press('Enter');
  assert(await ada.getAttribute('aria-pressed') === 'true', 'SVG selection must update the Office');
  await page.getByRole('link', { name: 'View agent details' }).press('Enter');
  await focusedHeading('Ada');
  const profileTask = page.locator('.task-detail-list li').first();
  const profileStatus = () => profileTask.locator('.status-label').innerText();
  const fixture = await profileStatus();
  await select('Step forward').press('Enter');
  const active = await profileStatus();
  assert(fixture !== active, 'Fixture task status should give way to active playback');
  await profileTask.getByRole('link').press('Enter');
  await focusedHeading('Task Board');
  assert(await page.locator('.task-card .status-label').innerText() === active, 'Profile and board must agree on task status');
  await page.getByRole('link', { name: 'Return to Office' }).press('Enter');
  await focusedHeading('Virtual Office');
  assert(await page.locator('.agent-inspector h2').first().innerText() === 'Ada', 'Entity inspection must preserve Office agent selection');

  for (let i = 1; i < 24; i++) await select('Step forward').press('Enter');
  await page.getByRole('link', { name: 'Explore collaboration' }).press('Enter');
  await focusedHeading('Collaboration');
  await page.getByRole('button', { name: /Demo Approval/ }).first().press('Enter');
  await inspector.getByRole('link', { name: /^sim-/ }).press('Enter');
  await focusedHeading('Activity Timeline');
  const linkedHash = await page.evaluate(() => location.hash);
  const row = page.locator('[data-collaboration-event]');
  assert(await row.count() === 1, 'Evidence link must resolve one observed interaction');
  const interaction = await row.getAttribute('data-collaboration-event');
  const participant = await inspector.locator('p a[href^="#/agents/"]').first().innerText();
  const taskLink = inspector.locator('a[href^="#/tasks?task="]');
  const task = await taskLink.innerText();
  await taskLink.press('Enter');
  await focusedHeading('Task Board');
  assert(await page.locator('.task-card h3').innerText() === task, 'Interaction task identity changed');
  await page.goBack();
  await focusedHeading('Activity Timeline');
  assert(await row.getAttribute('data-collaboration-event') === interaction, 'Back must restore the evidence route');
  await page.goForward();
  await focusedHeading('Task Board');
  await page.goBack();
  await focusedHeading('Activity Timeline');
  await inspector.getByRole('link', { name: participant, exact: true }).first().press('Enter');
  await focusedHeading(participant);
  await page.getByRole('link', { name: 'Return to Office' }).press('Enter');
  await focusedHeading('Virtual Office');
  assert(await page.locator('[data-office-interaction]').getAttribute('data-office-interaction') === interaction, 'Returning to Office lost the interaction');

  await page.goto(origin + '/' + linkedHash);
  await focusedHeading('Activity Timeline');
  await select('Reset simulation').press('Enter');
  await page.getByText('This interaction is unavailable in the current playback.').waitFor();
  assert(await inspector.count() === 0, 'A reset must clear the stale inspector');
  for (let i = 0; i < 24; i++) await select('Step forward').press('Enter');
  assert(await row.count() === 0 && await inspector.count() === 0, 'Replay must not resurrect the stale link');
  await page.getByRole('link', { name: 'Return to Timeline' }).press('Enter');
  await focusedHeading('Activity Timeline');
  await page.getByLabel('Timeline stream').selectOption('collaboration');
  assert(await row.count() > 1, 'Recovery must expose current observed interactions');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin + '/?mobile=' + width + '#/office');
    await page.locator('svg.office-scene').waitFor();
    await ada.press('Enter');
    await page.getByRole('link', { name: 'View agent details' }).press('Enter');
    await focusedHeading('Ada');
    await profileTask.getByRole('link').press('Enter');
    await focusedHeading('Task Board');
    await page.getByRole('link', { name: 'Return to Office' }).press('Enter');
    await focusedHeading('Virtual Office');
    await page.locator('svg.office-scene').waitFor();
    assert(await ada.getAttribute('aria-pressed') === 'true', 'Mobile return lost the SVG selection');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile Office overflow');
    await page.goto(origin + '/' + linkedHash);
    await page.getByRole('link', { name: 'Return to Timeline' }).waitFor();
  }
  assert(problems.length === 0, JSON.stringify(problems));
  return { keyboard: 'PASS', taskStatus: 'PASS', identity: 'PASS', history: 'PASS', staleLink: 'PASS', mobileWidths: [320, 390] };
}
