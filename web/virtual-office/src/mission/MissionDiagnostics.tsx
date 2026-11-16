import { findAgent, findTask } from '../demo/selectors';
import { compareMissionVariants, diagnoseAssignments, diagnoseMission } from './diagnostics';
import type { MissionPreviewState } from './preview';

const taskName = (id: string) => findTask(id)?.title ?? id;
const agentName = (id: string) => findAgent(id)?.name ?? id;
const names = (ids: readonly string[]) => ids.map(taskName).join(', ') || 'None';
type Variant = MissionPreviewState['input'];

const explanations = {
  Ready: 'All prerequisites are satisfied.',
  Blocked: 'At least one prerequisite remains unmet.',
  Active: 'This task started in the hypothetical preview.',
  Completed: 'This task completed in the hypothetical preview.',
  'Assumed complete': 'This task was assumed complete at capture and emits no events.',
};

export function MissionDiagnostics({ input, preview, selectedId, onSelect, variantA, variantB, onCapture }: {
  input: Variant;
  preview?: MissionPreviewState;
  selectedId: string;
  onSelect: (id: string) => void;
  variantA?: Variant;
  variantB?: Variant;
  onCapture: (slot: 'A' | 'B') => void;
}) {
  const assignments = diagnoseAssignments(input.plan, input.assumptions, input.assignments);
  const diagnostics = preview && diagnoseMission(preview);
  const selected = assignments.find(({ taskId }) => taskId === selectedId) ?? assignments[0];
  const task = diagnostics?.tasks.find(({ id }) => id === selected?.taskId);
  const next = diagnostics?.next;

  return <>
    <section className="content-section" aria-labelledby="mission-diagnostics-title">
      <h2 id="mission-diagnostics-title">Mission diagnostics</h2>
      <p>Hypothetical explanations based on synthetic fixture data.</p>
      {selected ? <label>Diagnostic task<select value={selected.taskId} onChange={(event) => onSelect(event.target.value)}>
        {assignments.map(({ taskId }) => <option key={taskId} value={taskId}>{taskName(taskId)}</option>)}
      </select></label> : <p>Select a mission task to inspect it.</p>}
      {selected && <div aria-live="polite">
        <h3>{taskName(selected.taskId)}</h3>
        <p>Proposed agent: {selected.agentId ? agentName(selected.agentId) : 'None'}</p>
        <p>Eligible fixture agents: {selected.eligibleAgentIds.map(agentName).join(', ') || 'None'}</p>
        <p>{{
          eligible: 'The fixture links this agent to the task. The assignment determines hypothetical event attribution.',
          missing: 'Missing assignment. Choose an eligible agent before starting.',
          invalid: 'Invalid assignment. The fixture does not link this agent to the task.',
          'not-required': 'Assumed completion requires no proposed agent.',
        }[selected.status]}</p>
        {task && <>
          <p>{task.status}. {explanations[task.status]}</p>
          <p>Direct prerequisites: {names(task.prerequisites)}</p>
          <p>Unmet prerequisites: {names(task.unmet)}</p>
          {task.unblockedBy && <p>Step {task.unblockedBy.step}: {taskName(task.unblockedBy.taskId)} completed and satisfied the final unmet prerequisite.</p>}
        </>}
      </div>}
      <p role="status">{next
        ? `Next transition: ${next.type === 'completed' ? 'Complete' : 'Start'} ${taskName(next.taskId)}. ${next.reason === 'active' ? 'The active task completes first.' : 'Ready tasks are selected in fixture order.'}`
        : diagnostics?.allAssumed ? 'All tasks were assumed complete. No transition remains.'
        : diagnostics?.terminal ? 'Preview complete. No transition remains.'
        : 'Start a preview to inspect the next transition.'}</p>
    </section>
    <section className="content-section" aria-labelledby="mission-variants-title">
      <h2 id="mission-variants-title">Hypothetical variant comparison</h2>
      <p>Capture two versions of editable Plan B at step zero. These variants are separate from captured Plan A. Steps count transitions in the trace.</p>
      <div className="filter-bar">
        <button type="button" className="text-button" onClick={() => onCapture('A')}>Capture Variant A</button>
        <button type="button" className="text-button" onClick={() => onCapture('B')}>Capture Variant B</button>
      </div>
      <p role="status">Variant A {variantA ? 'captured' : 'empty'} · Variant B {variantB ? 'captured' : 'empty'}</p>
      {variantA && variantB && <VariantComparison a={variantA} b={variantB} />}
    </section>
  </>;
}

function VariantComparison({ a, b }: { a: Variant; b: Variant }) {
  const comparison = compareMissionVariants(a, b);
  const changed = (value: boolean) => value ? 'Changed' : 'Unchanged';
  return <>
    <h3>Input differences</h3>
    <ul>
      <li>Task membership: {changed(comparison.membershipChanged)}</li>
      <li>Dependencies: {changed(comparison.dependenciesChanged)}</li>
      <li>Agent assignments: {changed(comparison.assignmentsChanged)}</li>
      <li>Completion assumptions: {changed(comparison.assumptionsChanged)}</li>
    </ul>
    <h3>Hypothetical outcome differences</h3>
    <ul>
      <li>Event order: {changed(comparison.eventOrderChanged)}</li>
      <li>Event attribution: {changed(comparison.eventAttributionChanged)}</li>
      <li>Logical step count: {changed(comparison.stepCountChanged)}</li>
      <li>Terminal task states: {changed(comparison.terminalStatesChanged)}</li>
    </ul>
    <div className="analytics-charts">
      {([{ label: 'Variant A', state: comparison.left }, { label: 'Variant B', state: comparison.right }]).map(({ label, state }) =>
        <section key={label} aria-label={label}>
          <h3>{label}</h3>
          <p>Tasks: {names(state.input.plan.taskIds)}</p>
          <p>Assumed complete: {names(state.input.assumptions)}</p>
          <p>Dependencies: {state.input.plan.edges.map(({ prerequisiteId, dependentId }) =>
            `${taskName(dependentId)} requires ${taskName(prerequisiteId)}`).join('; ') || 'None'}</p>
          <ul aria-label="Terminal task states">{state.tasks.map(({ id, status }) =>
            <li key={id}>{taskName(id)} · {state.input.assignments[id] ? agentName(state.input.assignments[id]) : 'No proposed agent'} · {status}</li>)}</ul>
          <p>Logical steps: {state.events.length}</p>
          <ol aria-label="Hypothetical variant events">{state.events.map(({ step, taskId, agentId, type }) =>
            <li key={step}>Step {step} · {taskName(taskId)} · {agentName(agentId)} · {type} · hypothetical</li>)}</ol>
        </section>)}
    </div>
  </>;
}
