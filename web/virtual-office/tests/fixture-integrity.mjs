// Future authorized execution uses TypeScript's JS compiler only; no Vite/native
// binding, browser, listener, subprocess, temporary file or testing framework.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/demo/fixtures.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal((compiled.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error).length, 0, 'fixture syntax diagnostics');
// Fixtures have type-only imports, erased during transpilation. A runtime import
// would exceed this standalone integrity test's scope.
assert.doesNotMatch(compiled.outputText, /\bimport\s*(?:\(|['"{*]|[\w]+\s+from)/, 'unexpected runtime fixture import');
const fixtures = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const { agents, rooms, tasks, workflows, activities, reviews } = fixtures;
assert.equal(fixtures.fixtureRevision, 'c10-fixtures-01');
assert.equal(fixtures.provenance, 'synthetic-demo');
const collections = { agents, rooms, tasks, workflows, activities, reviews };
const expectedCounts = { agents: 8, rooms: 4, tasks: 8, workflows: 2, activities: 6, reviews: 2 };
const globalIds = new Set();
for (const [name, values] of Object.entries(collections)) {
  assert.equal(values.length, expectedCounts[name], `${name} count`);
  for (const [index, item] of values.entries()) {
    assert.match(item.id, /^demo-/);
    assert.ok(!globalIds.has(item.id), `duplicate ID: ${item.id}`);
    globalIds.add(item.id);
    assert.equal(item.provenance, 'synthetic-demo');
    assert.equal(item.fixtureRevision, fixtures.fixtureRevision);
    assert.equal(name === 'activities' ? item.sequence : item.order, index + 1, `${name} fixed order`);
  }
}
const byId = (values, id) => {
  const value = values.find((item) => item.id === id);
  assert.ok(value, `missing reference: ${id}`);
  return value;
};
for (const agent of agents) {
  const room = byId(rooms, agent.roomId);
  assert.ok(agent.desk.x >= room.x && agent.desk.y >= room.y);
  assert.ok(agent.desk.x + 1.2 <= room.x + room.width && agent.desk.y + 0.8 <= room.y + room.depth);
}
for (const task of tasks) {
  assert.ok(task.agentIds.length > 0);
  assert.equal(new Set(task.agentIds).size, task.agentIds.length);
  for (const id of task.agentIds) byId(agents, id);
  assert.ok(byId(workflows, task.workflowId).taskIds.includes(task.id));
}
for (const workflow of workflows) {
  assert.equal(new Set(workflow.taskIds).size, workflow.taskIds.length);
  for (const id of workflow.taskIds) assert.equal(byId(tasks, id).workflowId, workflow.id);
}
for (const [index, event] of activities.entries()) {
  byId(agents, event.agentId);
  assert.ok(byId(tasks, event.taskId).agentIds.includes(event.agentId));
  assert.equal(event.timestamp, `2026-10-25T${['09:00', '09:15', '09:30', '09:45', '10:00', '10:15'][index]}:00Z`);
}
for (const review of reviews) {
  byId(tasks, review.taskId);
  assert.equal(review.displayOnly, true);
  assert.ok(['Example: review pending', 'Example: review complete'].includes(review.label));
}
console.log('PASS: 30 synthetic records; IDs, provenance, fixed order, room placement and cross-references verified.');
