// Run against the guarded synthetic frontend on loopback.
export default async function checkMissionPreview(page, origin) {
  const problems = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) problems.push(request.url());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  const assert = (ok, reason) => { if (!ok) throw new Error(reason); };
  const button = (name) => page.getByRole('button', { name, exact: true });
  const link = (name) => page.getByRole('link', { name, exact: true });
  const heading = (title) => page.waitForFunction((name) =>
    document.activeElement?.id === 'page-title' && document.activeElement.textContent.includes(name), title);
  const focus = (control) => control.evaluate((node) => node === document.activeElement && node.matches(':focus-visible'));
  const tasks = page.getByRole('group', { name: 'Select mission tasks' }).getByRole('checkbox');
  const region = page.getByRole('region', { name: 'Mission preview', exact: true });
  const events = region.getByRole('list', { name: 'Hypothetical mission events' }).getByRole('listitem');
  const step = button('Step preview');
  const first = 'Shape the workspace layout';
  const second = 'Map rooms to team context';
  const assignment = (task) => page.getByRole('combobox', { name: 'Proposed agent for ' + task, exact: true });
  const assign = async () => {
    await assignment(first).selectOption('demo-agent-ada');
    await assignment(second).selectOption('demo-agent-noah');
  };
  const clock = () => page.locator('.simulation-controls time').innerText();
  const assumption = (title) => page.getByRole('checkbox', { name: new RegExp('^Assume complete: ' + title) });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + '/#/office');
  await button('2D floor plan').press('Enter');
  await page.getByRole('button', { name: /^Select Leo,/ }).press('Enter');
  await link('Plan a mission').press('Enter');
  await heading('Mission Planning');
  await tasks.nth(0).press('Space');
  await tasks.nth(1).press('Space');
  await tasks.nth(2).press('Space');
  await button('Capture Plan A').press('Enter');
  await tasks.nth(2).press('Space');
  const dependent = page.getByLabel('Dependent task');
  const required = page.getByLabel('Required task');
  await dependent.selectOption('demo-task-map');
  await required.selectOption('demo-task-layout');
  await button('Add prerequisite').press('Enter');
  const start = button('Start preview');
  if (await start.isEnabled()) await start.press('Enter');
  assert(await step.count() === 0 || await step.isDisabled(), 'A task without a proposed agent must block simulated work');
  await assign();
  const initialClock = await clock();
  await start.press('Enter');
  await step.waitFor();
  assert(await events.count() === 0, 'Preview must start at step zero');
  const initial = await region.innerText();
  assert(initial.includes('Ready') && initial.includes('Blocked'), 'Preview must expose readiness and unmet prerequisites');

  await step.press('Enter');
  assert(await events.count() === 1 && (await events.first().innerText()).includes(first), 'First ready task must start with exactly one event');
  assert((await events.first().innerText()).includes('Ada'), 'First task event must name its proposed agent');
  await step.press('Enter');
  assert(await events.count() === 2 && (await events.nth(1).innerText()).includes(first), 'Active prerequisite must complete before its dependent starts');
  await step.press('Enter');
  assert(await events.count() === 3 && (await events.nth(2).innerText()).includes(second), 'Completion must make the dependent eligible to start');
  await step.press('Enter');
  assert(await events.count() === 4 && (await events.nth(3).innerText()).includes('Noah'), 'Terminal mission must retain both participant identities');
  assert(await step.isDisabled(), 'Terminal preview must prevent further transitions');
  const terminal = await events.allTextContents();
  assert(terminal.every((event, index) => event.includes(String(index + 1)) && /hypothetical/i.test(event)), 'Events must expose step number and hypothetical provenance');
  assert(await clock() === initialClock, 'Mission preview must not advance playback');

  await assumption('Trace keyboard navigation').press('Space');
  assert(JSON.stringify(await events.allTextContents()) === JSON.stringify(terminal), 'Plan A-only edits must preserve the preview');
  await button('Add prerequisite').press('Enter');
  assert(JSON.stringify(await events.allTextContents()) === JSON.stringify(terminal), 'Rejected edits must preserve the preview');
  await button('Step forward').press('Enter');
  assert(await clock() !== initialClock, 'Playback must remain independently controllable');
  await page.getByRole('combobox', { name: 'Scenario', exact: true }).selectOption('review');
  await button('Reset simulation').press('Enter');
  assert(JSON.stringify(await events.allTextContents()) === JSON.stringify(terminal), 'Playback step, scenario switch, and reset must preserve the preview');

  await button('Reset preview').press('Enter');
  assert(await events.count() === 0 && await focus(step), 'Reset preview must clear events and restore visible focus to Step preview');
  assert(await assignment(first).inputValue() === 'demo-agent-ada', 'Reset preview must retain the editable assignment');
  for (let i = 0; i < 4; i++) await step.press('Enter');
  assert(JSON.stringify(await events.allTextContents()) === JSON.stringify(terminal), 'Reset and replay must produce identical rendering');
  await assignment(first).selectOption('demo-agent-leo');
  assert(await events.count() === 0, 'Successful assignment edit must invalidate the captured preview');
  await start.press('Enter');
  await step.press('Enter');
  assert((await events.first().innerText()).includes('Leo'), 'A replacement preview must use the new assignment');
  await assumption(first).press('Space');
  assert(await events.count() === 0, 'Changing a Plan B completion assumption must invalidate the preview');
  await start.press('Enter');
  await step.press('Enter');
  assert(await events.count() === 1 && (await events.first().innerText()).includes(second), 'Assumed prerequisite completion must emit no event and unblock the dependent');
  await page.getByRole('button', { name: /^Remove prerequisite:/ }).press('Enter');
  assert(await events.count() === 0 && await focus(dependent), 'Removing a prerequisite must invalidate preview and recover keyboard focus');
  await start.press('Enter');
  await step.press('Enter');
  await tasks.first().press('Space');
  assert(await events.count() === 0 && await assignment(first).count() === 0, 'Removing a task must invalidate preview and remove its assignment');
  await tasks.first().press('Space');
  assert(await assignment(first).inputValue() === '', 'A re-added task must not inherit its removed assignment');

  await button('Reset mission').press('Enter');
  assert(await focus(tasks.first()) && await assignment(first).count() === 0 && await events.count() === 0, 'Reset mission must clear inputs and restore visible focus');
  await tasks.first().press('Space');
  await link('Return to Office').press('Enter');
  await heading('Virtual Office');
  await page.goBack();
  await heading('Mission Planning');
  assert(!(await tasks.first().isChecked()), 'Returning through history must start a fresh draft');
  await page.goForward();
  await heading('Virtual Office');
  await button('2D floor plan').press('Enter');
  await page.getByRole('button', { name: /^Select Leo,/ }).press('Enter');
  await link('Plan a mission').press('Enter');
  await link('Return to Office').press('Enter');
  await heading('Virtual Office');
  assert((await page.locator('.agent-inspector h2').first().innerText()) === 'Leo', 'Mission route must preserve selection outside playback resets');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin + '/?mission-preview=' + width + '#/office');
    await page.locator('svg.office-scene').waitFor();
    await link('Plan a mission').press('Enter');
    await heading('Mission Planning');
    await tasks.first().press('Space');
    await assignment(first).selectOption('demo-agent-ada');
    await start.press('Enter');
    await step.press('Enter');
    assert(await events.count() === 1 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile preview must fit and expose events');
    await page.reload();
    await heading('Mission Planning');
    assert(!(await tasks.first().isChecked()) && await events.count() === 0, 'Reload must end the local preview session');
  }

  assert(problems.length === 0, JSON.stringify(problems));
  return { assignment: 'PASS', prerequisites: 'PASS', replay: 'PASS', isolation: 'PASS', invalidation: 'PASS', focus: 'PASS', history: 'PASS', widths: [320, 390], problems };
}
