import assert from 'node:assert/strict';

export default async function checkMissionReadiness(page, origin) {
  const external = [];
  const errors = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  const button = (name) => page.getByRole('button', { name, exact: true });
  const task = (name) => page.getByRole('group', { name: 'Select mission tasks' }).getByRole('checkbox', { name, exact: true });
  const combo = (name) => page.getByRole('combobox', { name, exact: true });
  const heading = (title) => page.waitForFunction((name) =>
    document.activeElement?.id === 'page-title' && document.activeElement.textContent.includes(name), title);
  const readiness = page.getByRole('region', { name: 'Synthetic Planning Readiness', exact: true });
  const variants = page.getByRole('region', { name: 'Hypothetical variant comparison', exact: true });
  const whatIf = page.getByRole('region', { name: 'What-if readiness', exact: true });
  const layout = 'Shape the workspace layout';
  const map = 'Map rooms to team context';
  const proposedLayout = combo('Proposed agent for ' + layout);
  const captureA = button('Capture Variant A');
  const captureB = button('Capture Variant B');
  const focusVisible = (control) => control.evaluate((node) => node === document.activeElement && node.matches(':focus-visible'));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + '/#/mission');
  await heading('Mission Planning');
  assert.match(await readiness.innerText(), /configuration incomplete/i);
  await task(layout).press('Space');
  await task(map).press('Space');
  assert.ok(await focusVisible(task(map)));
  assert.match(await readiness.innerText(), /configuration incomplete/i);
  assert.match(await readiness.innerText(), /Shape the workspace layout/);
  await proposedLayout.selectOption('demo-agent-ada');
  await combo('Proposed agent for ' + map).selectOption('demo-agent-noah');
  await page.getByLabel('Dependent task').selectOption('demo-task-map');
  await page.getByLabel('Required task').selectOption('demo-task-layout');
  await button('Add prerequisite').press('Enter');
  assert.match(await readiness.innerText(), /valid for hypothetical preview/i);
  assert.match(await readiness.innerText(), /initially blocked/i);
  assert.match(await readiness.innerText(), /Map rooms to team context/);

  await captureA.press('Enter');
  await proposedLayout.selectOption('demo-agent-leo');
  await captureB.press('Enter');
  const assignmentComparison = await whatIf.innerText();
  assert.match(await variants.innerText(), /event attribution: changed/i);
  assert.match(await variants.innerText(), /event order: unchanged/i);
  assert.match(await variants.innerText(), /logical step count: unchanged/i);
  assert.match(assignmentComparison, /hypothetical/i);

  await page.getByRole('checkbox', { name: 'Assume complete: ' + layout, exact: true }).press('Space');
  assert.match(await readiness.innerText(), /assumed complete/i);
  assert.equal(await whatIf.innerText(), assignmentComparison, 'Draft edits must preserve both captures');
  await captureB.press('Enter');
  const assumedComparison = await whatIf.innerText();
  assert.notEqual(assumedComparison, assignmentComparison);

  await button('Step forward').press('Enter');
  await combo('Scenario').selectOption('review');
  await button('Reset simulation').press('Enter');
  await button('Start preview').press('Enter');
  await button('Step preview').press('Enter');
  await button('Reset preview').press('Enter');
  assert.ok(await focusVisible(button('Step preview')));
  assert.equal(await whatIf.innerText(), assumedComparison, 'Playback and preview reset must preserve the comparison');

  await button('Reset mission').press('Enter');
  assert.ok(await focusVisible(task(layout)));
  assert.match(await readiness.innerText(), /configuration incomplete/i);
  assert.equal(await whatIf.count(), 0, 'Reset mission must clear the comparison');
  await task(layout).press('Space');
  await page.getByRole('link', { name: 'Return to Office', exact: true }).press('Enter');
  await heading('Virtual Office');
  await page.goBack();
  await heading('Mission Planning');
  assert.equal(await task(layout).isChecked(), false);
  await page.goForward();
  await heading('Virtual Office');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin + '/#/mission');
    await heading('Mission Planning');
    await task(layout).press('Space');
    await proposedLayout.selectOption('demo-agent-ada');
    await captureA.press('Enter');
    await proposedLayout.selectOption('demo-agent-leo');
    await captureB.press('Enter');
    await whatIf.waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow at ' + width);
    await page.reload();
    await heading('Mission Planning');
    assert.equal(await whatIf.count(), 0);
    assert.match(await readiness.innerText(), /configuration incomplete/i);
  }
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  return { readiness: 'PASS', whatIf: 'PASS', focus: 'PASS', history: 'PASS', mobileWidths: [320, 390], external, errors };
}
