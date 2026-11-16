import assert from 'node:assert/strict';

export default async function checkMissionDiagnostics(page, origin) {
  const external = [];
  const errors = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const button = (name) => page.getByRole('button', { name, exact: true });
  const task = (name) => page.getByRole('group', { name: 'Select mission tasks' }).getByRole('checkbox', { name, exact: true });
  const named = (name) => page.getByRole('combobox', { name, exact: true });
  const heading = (title) => page.waitForFunction((name) =>
    document.activeElement?.id === 'page-title' && document.activeElement.textContent.includes(name), title);
  const diagnostics = page.getByRole('region', { name: 'Mission diagnostics', exact: true });
  const comparison = page.getByRole('region', { name: 'Hypothetical variant comparison', exact: true });
  const selected = named('Diagnostic task');
  const captureA = button('Capture Variant A');
  const captureB = button('Capture Variant B');
  const step = button('Step preview');
  const layout = 'Shape the workspace layout';
  const map = 'Map rooms to team context';
  const layoutId = 'demo-task-layout';
  const mapId = 'demo-task-map';
  const proposedLayout = named('Proposed agent for ' + layout);
  const proposedMap = named('Proposed agent for ' + map);
  const focusVisible = (control) => control.evaluate((node) => node === document.activeElement && node.matches(':focus-visible'));
  const chooseLayout = async () => {
    await task(layout).press('Space');
    await proposedLayout.selectOption('demo-agent-ada');
  };

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + '/#/mission');
  await heading('Mission Planning');
  await task(layout).press('Space');
  await task(map).press('Space');
  await selected.focus();
  await selected.press('Home');
  assert.ok(await focusVisible(selected), 'Diagnostic task chooser must have visible keyboard focus');
  await selected.selectOption(mapId);
  assert.match(await diagnostics.innerText(), /missing|choose a proposed agent/i);
  assert.match(await diagnostics.innerText(), /Noah/);
  await proposedLayout.selectOption('demo-agent-ada');
  await proposedMap.selectOption('demo-agent-noah');
  await page.getByLabel('Dependent task').selectOption(mapId);
  await page.getByLabel('Required task').selectOption(layoutId);
  await button('Add prerequisite').press('Enter');
  await button('Start preview').press('Enter');
  assert.match(await diagnostics.innerText(), /blocked/i);
  assert.match(await diagnostics.innerText(), /fixture order/i);
  assert.match(await diagnostics.innerText(), new RegExp(layout));
  await step.press('Enter');
  await step.press('Enter');
  assert.match(await diagnostics.innerText(), /ready/i);
  assert.match(await diagnostics.innerText(), /step 2/i);
  await captureA.press('Enter');
  await proposedLayout.selectOption('demo-agent-leo');
  assert.equal(await step.count(), 0, 'Assignment edit should invalidate only the current preview');
  await captureB.press('Enter');
  const captured = await comparison.innerText();
  assert.match(captured, /Ada/);
  assert.match(captured, /Leo/);
  assert.match(captured, /event attribution/i);
  assert.match(captured, /unchanged/i);
  assert.match(captured, /logical steps?/i);

  await button('Step forward').press('Enter');
  await named('Scenario').selectOption('review');
  await button('Reset simulation').press('Enter');
  assert.equal(await comparison.innerText(), captured, 'Global playback controls must preserve both variants');
  await button('Start preview').press('Enter');
  await step.press('Enter');
  await button('Reset preview').press('Enter');
  assert.ok(await focusVisible(step), 'Reset preview should restore visible focus');
  assert.equal(await comparison.innerText(), captured, 'Reset preview must preserve comparison');
  const tab = process.platform === 'darwin' && page.context().browser()?.browserType().name() === 'webkit'
    ? 'Alt+Tab' : 'Tab';
  await step.press(tab);
  assert.ok(await focusVisible(button('Reset preview')), 'Step preview should tab to Reset preview');

  await button('Reset mission').press('Enter');
  assert.ok(await focusVisible(task(layout)), 'Reset mission should restore visible task selection focus');
  assert.doesNotMatch(await comparison.innerText(), /Ada|Leo/, 'Reset mission must clear both captures');
  await chooseLayout();
  await captureA.press('Enter');
  await captureB.press('Enter');
  await page.getByRole('link', { name: 'Return to Office', exact: true }).press('Enter');
  await heading('Virtual Office');
  await page.goBack();
  await heading('Mission Planning');
  assert.equal(await task(layout).isChecked(), false);
  assert.doesNotMatch(await comparison.innerText(), /Ada|Leo/, 'Back must start a clean mission session');
  await page.goForward();
  await heading('Virtual Office');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin + '/?mission-diagnostics=' + width + '#/office');
    await page.locator('svg.office-scene').waitFor();
    await page.getByRole('link', { name: 'Plan a mission', exact: true }).press('Enter');
    await heading('Mission Planning');
    await chooseLayout();
    await captureA.press('Enter');
    await proposedLayout.selectOption('demo-agent-leo');
    await captureB.press('Enter');
    assert.match(await comparison.innerText(), /unchanged/i);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow at ' + width);
    await page.reload();
    await heading('Mission Planning');
    assert.doesNotMatch(await comparison.innerText(), /Ada|Leo/, 'Reload must clear captures');
  }
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  return { diagnostics: 'PASS', attribution: 'PASS', variantLifetime: 'PASS', focus: 'PASS', history: 'PASS', mobileWidths: [320, 390], external, errors };
}
