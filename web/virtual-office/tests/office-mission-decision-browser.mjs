import assert from 'node:assert/strict';

export default async function checkMissionDecision(page, origin) {
  const external = [];
  const errors = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  const button = (name) => page.getByRole('button', { name, exact: true });
  const mission = page.getByRole('region', { name: 'Mission Decision', exact: true });
  const task = (name) => page.getByRole('group', { name: 'Select mission tasks' }).getByRole('checkbox', { name, exact: true });
  const combo = (name) => page.getByRole('combobox', { name, exact: true });
  const heading = (title) => page.waitForFunction((name) =>
    document.activeElement?.id === 'page-title' && document.activeElement.textContent.includes(name), title);
  const captureA = button('Capture Variant A');
  const captureB = button('Capture Variant B');
  const captureC = button('Capture Scenario C');
  const removeB = button('Remove Scenario B');
  const criterion = page.getByRole('checkbox', { name: 'Fewer initially blocked tasks', exact: true });
  const edgeCriterion = page.getByRole('checkbox', { name: 'Fewer direct prerequisite relationships', exact: true });
  const select = combo('Preferred scenario');
  const record = button('Record local preference');
  const rationale = page.getByLabel('Rationale', { exact: true });
  const layout = 'Shape the workspace layout';
  const map = 'Map rooms to team context';
  const focusVisible = (control) => control.evaluate((node) => node === document.activeElement && node.matches(':focus-visible'));
  const navigate = async (label, id) => {
    const before = await page.evaluate(() => ({ hash: location.hash, length: history.length }));
    await page.getByRole('navigation', { name: 'Mission sections' }).getByRole('button', { name: label, exact: true }).press('Enter');
    const target = page.locator('#' + id);
    assert.ok(await focusVisible(target), label + ' must receive visible keyboard focus');
    assert.ok(await target.evaluate((node) => {
      const box = node.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight;
    }), label + ' destination must be in the viewport');
    assert.deepEqual(await page.evaluate(() => ({ hash: location.hash, length: history.length })), before);
  };
  const navigation = async () => {
    for (const [label, id] of [
      ['Configure', 'mission-configure'], ['Readiness', 'mission-readiness'],
      ['Preview & Diagnostics', 'mission-preview-diagnostics'], ['Decision', 'mission-decision-title'],
    ]) await navigate(label, id);
  };
  const choosePreference = async (slot, reason) => {
    const options = await select.getByRole('option').allTextContents();
    const label = options.find((option) => new RegExp('(?:Scenario |Variant )?' + slot + '(?:$|[ ·(])').test(option));
    assert.ok(label, 'Expected captured scenario ' + slot);
    await select.selectOption({ label });
    await rationale.fill(reason);
    await record.press('Enter');
    assert.match(await mission.innerText(), /hypothetical/i);
    const before = await page.evaluate(() => ({ hash: location.hash, length: history.length }));
    await button('View recorded evidence').press('Enter');
    assert.ok(await focusVisible(page.locator('#mission-recorded-evidence')));
    assert.ok(await page.locator('#mission-recorded-evidence').evaluate((node) => {
      const box = node.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight;
    }));
    assert.deepEqual(await page.evaluate(() => ({ hash: location.hash, length: history.length })), before);
    assert.ok((await mission.getByText(reason, { exact: false }).count()) > 0, 'Recorded rationale must be visible as text');
  };
  const configure = async () => {
    await task(layout).press('Space');
    await task(map).press('Space');
    await combo('Proposed agent for ' + layout).selectOption('demo-agent-ada');
    await combo('Proposed agent for ' + map).selectOption('demo-agent-noah');
  };
  const addEdge = async (dependent, required) => {
    await page.getByLabel('Dependent task').selectOption(dependent);
    await page.getByLabel('Required task').selectOption(required);
    await button('Add prerequisite').press('Enter');
  };

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + '/#/mission');
  await heading('Mission Planning');
  await mission.waitFor();
  await navigation();
  await configure();
  await button('Go to scenario decisions').press('Enter');
  assert.ok(await focusVisible(page.locator('#mission-decision-title')));
  await button('Go to A/B capture controls').press('Enter');
  assert.ok(await focusVisible(captureA));
  await captureA.press('Enter');
  await addEdge('demo-task-map', 'demo-task-layout');
  await captureB.press('Enter');
  await combo('Proposed agent for ' + layout).selectOption('demo-agent-leo');
  await captureC.press('Enter');
  await criterion.press('Space');
  assert.ok(await focusVisible(criterion));
  assert.match(await mission.getByRole('status').innerText(), /Scenario A is favored/i);
  assert.match(await mission.innerText(), /tie/i, 'Equal B/C structural counts must tie');
  await choosePreference('A', 'Keep the layout and map independent.');
  await choosePreference('B', 'Prefer the named prerequisite.');
  assert.equal(await mission.getByText('Keep the layout and map independent.', { exact: false }).count(), 0);

  const recorded = mission.getByText('Prefer the named prerequisite.', { exact: false });
  await button('Step forward').press('Enter');
  await combo('Scenario').selectOption('review');
  await button('Reset simulation').press('Enter');
  await button('Start preview').press('Enter');
  await button('Step preview').press('Enter');
  await button('Reset preview').press('Enter');
  await recorded.waitFor();
  await navigation();

  await task(map).press('Space');
  await recorded.waitFor();
  await combo('Proposed agent for ' + layout).selectOption('');
  await captureB.press('Enter');
  await recorded.waitFor();
  await combo('Proposed agent for ' + layout).selectOption('demo-agent-leo');
  await captureC.press('Enter');
  assert.equal(await recorded.count(), 0);
  await navigation();
  assert.match(await mission.innerText(), /different tasks/i);
  assert.match(await mission.getByRole('status').innerText(), /no collection recommendation/i);
  assert.equal(await page.getByRole('status').filter({ hasText: 'Local preference cleared because its evidence changed.' }).count(), 1);
  await choosePreference('B', 'Retain both tasks despite the scope difference.');

  await edgeCriterion.press('Space');
  assert.equal(await mission.getByText('Retain both tasks despite the scope difference.', { exact: false }).count(), 0);
  await choosePreference('B', 'Retain both tasks under both structural criteria.');
  await removeB.press('Enter');
  assert.ok(await focusVisible(captureB), 'Removing B must restore focus to its capture control');
  assert.equal(await mission.getByText('Retain both tasks under both structural criteria.', { exact: false }).count(), 0);

  await button('Reset mission').press('Enter');
  assert.ok(await focusVisible(task(layout)));
  assert.equal(await removeB.count(), 0);
  assert.equal(await criterion.isChecked(), false);
  await configure();
  await captureA.press('Enter');
  await captureB.press('Enter');
  await page.getByRole('link', { name: 'Return to Office', exact: true }).press('Enter');
  await heading('Virtual Office');
  await page.goBack();
  await heading('Mission Planning');
  assert.equal(await removeB.count(), 0, 'History return starts a fresh local decision session');
  await page.goForward();
  await heading('Virtual Office');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin + '/#/mission');
    await heading('Mission Planning');
    await navigation();
    await configure();
    await captureA.press('Enter');
    await captureB.press('Enter');
    await captureC.press('Enter');
    await edgeCriterion.press('Space');
    await choosePreference('C', 'Use the C capture in this local session.');
    await button('Use Scenario C as Plan B').press('Enter');
    assert.ok(await focusVisible(page.locator('#mission-configure')));
    assert.ok(await page.locator('#mission-configure').evaluate((node) => {
      const box = node.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight;
    }));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow at ' + width);
    await page.reload();
    await heading('Mission Planning');
    assert.equal(await removeB.count(), 0);
    assert.equal(await mission.getByText('Use the C capture in this local session.', { exact: false }).count(), 0);
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await button('Reset mission').press('Enter');
  await configure();
  await captureA.press('Enter');
  await captureB.press('Enter');
  await criterion.press('Space');
  await choosePreference('A', 'Keep the original captured configuration.');
  await button('Start preview').press('Enter');
  await button('Step preview').press('Enter');
  await task(map).press('Space');
  await page.getByLabel('Dependent task').selectOption('demo-task-layout');
  await page.getByLabel('Required task').selectOption('demo-task-layout');
  await button('Start preview').press('Enter');
  await button('Step preview').press('Enter');
  const capturesBefore = await mission.getByRole('list', { name: 'Scenario collection', exact: true }).innerText();
  const locationBefore = await page.evaluate(() => ({ hash: location.hash, length: history.length }));
  await button('Use Scenario A as Plan B').press('Enter');
  assert.ok(await focusVisible(page.locator('#mission-configure')));
  assert.ok(await page.locator('#mission-configure').evaluate((node) => {
    const box = node.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight;
  }));
  assert.deepEqual(await page.evaluate(() => ({ hash: location.hash, length: history.length })), locationBefore);
  assert.equal(await task(map).isChecked(), true);
  assert.equal(await page.getByLabel('Dependent task').inputValue(), '');
  assert.equal(await page.getByLabel('Required task').inputValue(), '');
  assert.equal(await button('Step preview').count(), 0);
  assert.equal(await mission.getByRole('list', { name: 'Scenario collection', exact: true }).innerText(), capturesBefore);
  await mission.getByText('Keep the original captured configuration.', { exact: false }).waitFor();
  await button('Start preview').press('Enter');
  await button('Step preview').press('Enter');
  await task(map).press('Space');
  assert.equal(await mission.getByRole('list', { name: 'Scenario collection', exact: true }).innerText(), capturesBefore);
  await captureB.press('Enter');
  assert.equal(await button('View recorded evidence').count(), 0);

  // A scenario can be valid on its own yet conflict with captured Plan A.
  await button('Reset mission').press('Enter');
  await configure();
  await page.getByRole('checkbox', { name: 'Assume complete: ' + map, exact: true }).press('Space');
  await captureA.press('Enter');
  await page.getByRole('checkbox', { name: 'Assume complete: ' + map, exact: true }).press('Space');
  await addEdge('demo-task-map', 'demo-task-layout');
  await button('Capture Plan A').press('Enter');
  await captureB.press('Enter');
  await criterion.press('Space');
  await choosePreference('B', 'Preserve the compatible plan while rejecting load.');
  await button('Start preview').press('Enter');
  await button('Step preview').press('Enter');
  const draftBefore = await page.getByRole('region', { name: 'Plan B readiness', exact: true }).innerText();
  const previewBefore = await page.getByRole('region', { name: 'Mission preview', exact: true }).innerText();
  const evidenceBefore = await mission.innerText();
  await button('Use Scenario A as Plan B').press('Enter');
  assert.equal(await page.getByRole('region', { name: 'Plan B readiness', exact: true }).innerText(), draftBefore);
  assert.equal(await page.getByRole('region', { name: 'Mission preview', exact: true }).innerText(), previewBefore);
  assert.equal(await mission.innerText(), evidenceBefore);
  assert.equal(await page.getByRole('status').filter({ hasText: 'Cannot load scenario while captured Plan A' }).count(), 1);

  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  return { resume: 'PASS', atomicRejection: 'PASS', scenarios: 'PASS', recommendations: 'PASS', preference: 'PASS', focus: 'PASS', history: 'PASS',
    playbackIsolation: 'PASS', mobileWidths: [320, 390], external, errors };
}
