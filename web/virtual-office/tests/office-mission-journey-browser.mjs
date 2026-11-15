// Run against the guarded build on loopback.
export default async function checkMissionJourney(page, origin) {
  const problems = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) problems.push(request.url());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const button = (name) => page.getByRole('button', { name, exact: true });
  const link = (name) => page.getByRole('link', { name, exact: true });
  const title = (name) => page.waitForFunction((text) =>
    document.activeElement?.id === 'page-title' && document.activeElement.textContent.includes(text), name);
  const tasks = page.getByRole('group', { name: 'Select mission tasks' }).getByRole('checkbox');
  const assumptions = page.getByRole('group', { name: 'Hypothetical completion assumptions' }).getByRole('checkbox');
  const dependent = page.getByLabel('Dependent task');
  const required = page.getByLabel('Required task');
  const plan = page.getByRole('region', { name: 'Plan comparison' });
  const clock = () => page.locator('.simulation-controls time').innerText();
  const focus = (locator) => locator.evaluate((node) => document.activeElement === node && node.matches(':focus-visible'));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + '/#/office');
  await button('2D floor plan').press('Enter');
  const agent = page.getByRole('button', { name: /^Select Leo,/ });
  await agent.press('Enter');
  await link('Plan a mission').press('Enter');
  await title('Mission Planning');
  for (let i = 0; i < 3; i++) await tasks.nth(i).press('Space');
  const before = await clock();
  // Native select popup keystrokes differ across headless macOS engines.
  await dependent.selectOption({ index: 2 });
  await required.selectOption({ index: 1 });
  const nextFocus = process.platform === 'darwin' && page.context().browser()?.browserType().name() === 'webkit'
    ? 'Alt+Tab' : 'Tab';
  await required.focus();
  await page.keyboard.press(nextFocus);
  assert(await focus(button('Add prerequisite')), 'Sequential focus must reach the add button');
  await button('Add prerequisite').press('Enter');
  const blocked = page.getByRole('region', { name: 'Plan B readiness' });
  assert((await blocked.innerText()).includes('Blocked in this plan'), 'Unmet prerequisite must block its dependent');
  await assumptions.nth(1).press('Space');
  assert(!(await assumptions.nth(1).isChecked()), 'Inconsistent completion assumption must be rejected');
  await assumptions.first().press('Space');
  assert(!(await blocked.innerText()).includes('Blocked in this plan'), 'Assuming prerequisite completion must unblock its dependent');
  await button('Capture Plan A').press('Enter');
  assert((await plan.innerText()).includes('same tasks'), 'Captured reference should equal the current draft');
  const a = await dependent.inputValue(), b = await required.inputValue();
  await dependent.selectOption(b);
  await required.selectOption(a);
  await button('Add prerequisite').press('Enter');
  await page.getByText('These prerequisites create a dependency cycle.').waitFor();
  assert(await page.getByRole('button', { name: /^Remove prerequisite:/ }).count() === 1, 'Cycle rejection must preserve the original graph');
  await page.getByRole('button', { name: /^Remove prerequisite:/ }).press('Enter');
  assert(await focus(dependent), 'Removal must restore visible focus to the dependency control');
  await assumptions.first().press('Space');
  assert((await plan.getByRole('region', { name: 'Plan A' }).innerText()).includes('Blocked in this plan'), 'Reference graph changed with the draft');
  assert(!(await plan.getByRole('region', { name: 'Plan B' }).innerText()).includes('Blocked in this plan'), 'Draft must reflect the removed edge');
  await assumptions.nth(1).press('Space');
  assert(!(await assumptions.nth(1).isChecked()), 'Shared assumption must also satisfy Plan A prerequisites');
  await page.getByText(/Plan A: Cannot assume/).waitFor();

  await assumptions.first().press('Space');
  await tasks.first().press('Space');
  const referenceOnly = page.getByRole('checkbox', { name: /Assume complete:.*Plan A only/ });
  assert(await referenceOnly.isChecked(), 'Removing a task from Plan B must preserve the Plan A assumption');
  const reference = plan.getByRole('region', { name: 'Plan A' });
  assert((await reference.innerText()).includes('Assumed complete'), 'Plan A must retain its assumed completion');
  assert(!(await blocked.innerText()).includes('Assumed complete'), 'Plan B must ignore Plan A-only assumptions');
  await referenceOnly.press('Space');
  assert((await reference.innerText()).includes('Blocked in this plan'), 'Editing an A-only assumption must update Plan A readiness');
  await referenceOnly.press('Space');
  assert(await referenceOnly.isChecked() && (await reference.innerText()).includes('Assumed complete'), 'Plan A-only assumption must be restorable');
  await tasks.nth(2).press('Space');
  assert(!(await plan.getByRole('region', { name: 'Plan A' }).innerText()).includes('Only in Plan A: None'), 'Plan-only task should be shown');
  assert(await clock() === before, 'Mission edits must not advance playback');
  await button('Step forward').press('Enter');
  assert(await clock() !== before && await plan.count() === 1, 'Playback must advance independently');
  await page.getByRole('combobox', { name: 'Scenario', exact: true }).selectOption('review');
  assert(await plan.count() === 1, 'Scenario change must preserve the mission');
  await button('Reset mission').press('Enter');
  assert(await focus(tasks.first()) && await plan.count() === 0, 'Reset must clear the mission and restore visible focus');
  await tasks.first().press('Space');
  await link('Return to Office').press('Enter');
  await title('Virtual Office');
  assert((await page.locator('.agent-inspector h2').first().innerText()) === 'Ada', 'Office must follow existing scenario-reset selection rules');
  await page.goBack();
  await title('Mission Planning');
  assert(!(await tasks.first().isChecked()), 'Leaving the workspace must end the draft session');
  await page.goForward();
  await title('Virtual Office');
  await button('2D floor plan').press('Enter');
  await agent.press('Enter');
  await link('Plan a mission').press('Enter');
  await title('Mission Planning');
  await link('Return to Office').press('Enter');
  await title('Virtual Office');
  assert((await page.locator('.agent-inspector h2').first().innerText()) === 'Leo', 'Mission navigation must preserve Office selection');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin + '/?mission-mobile=' + width + '#/office');
    await page.locator('svg.office-scene').waitFor();
    await link('Plan a mission').press('Enter');
    await title('Mission Planning');
    await tasks.first().press('Space');
    await button('Capture Plan A').press('Enter');
    await plan.waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mission overflowed at ' + width);
    await link('Return to Office').press('Enter');
    await page.locator('svg.office-scene').waitFor();
  }
  await page.goto(origin + '/?mission-direct=1#/mission');
  await title('Mission Planning');
  assert(!(await tasks.first().isChecked()), 'Direct route must start with an empty draft');
  assert(!problems.length, JSON.stringify(problems));
  return { graph: 'PASS', comparison: 'PASS', focus: 'PASS', playbackIsolation: 'PASS', history: 'PASS', mobileWidths: [320, 390] };
}
