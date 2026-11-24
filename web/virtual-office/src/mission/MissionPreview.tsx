import { MissionScene } from './MissionScene';
import { useRef } from 'react';
import { findAgent, findTask } from '../demo/selectors';
import { evaluatePlan } from './plan';
import type { MissionPreviewState } from './preview';

const taskName = (id: string) => findTask(id)?.title ?? id;
const agentName = (id: string) => findAgent(id)?.name ?? id;

export function MissionPreview({ state, onStep, onReset, dark = false, reducedMotion = false }: {
  state: MissionPreviewState;
  dark?: boolean; reducedMotion?: boolean;
  onStep: () => void;
  onReset: () => void;
}) {
  const stepButton = useRef<HTMLButtonElement>(null);
  const { input, tasks, events, terminal } = state;
  const captured = evaluatePlan(input.plan, input.assumptions, input.plan.taskIds);
  const capturedStatuses = new Map(captured.tasks.map(({ id, status }) => [id, status]));

  return <div className="mission-preview-layout">
    <div className="mission-preview-heading">
    <h2 id="mission-preview-title">Mission preview</h2>
    <p>Hypothetical preview of captured Plan B. Changes to Plan B that affect simulated work clear this preview.</p>
    <div className="filter-bar">
      <button type="button" className="text-button" ref={stepButton} aria-disabled={terminal} onClick={() => { if (!terminal) onStep(); }}>Step preview</button>
      <button type="button" className="text-button" onClick={() => {
        stepButton.current?.focus();
        onReset();
      }}>Reset preview</button>
    </div>
    </div>
    <MissionScene state={state} dark={dark} reducedMotion={reducedMotion} />
    <section className="content-section" aria-labelledby="mission-preview-title">
    <p role="status">{terminal ? 'Preview complete.' : 'Preview in progress.'} Step {events.length}.</p>
    <h3>Captured Plan B and preview state</h3>
    {tasks.length ? <ul className="task-detail-list">{tasks.map(({ id, status, unmet }) => <li key={id}>
      <div>
        <strong>{taskName(id)}</strong>
        <p>At capture: {capturedStatuses.get(id)}</p>
        {unmet.length > 0 && <p>Unmet prerequisites: {unmet.map(taskName).join(', ')}</p>}
      </div>
      <span>{status}</span>
    </li>)}</ul> : <p>No tasks in the captured plan.</p>}
    <h3>Hypothetical mission events</h3>
    {events.length === 0 && <p>No hypothetical events yet.</p>}
    <ol aria-label="Hypothetical mission events">{events.map((event) => <li key={event.step}>
      Step {event.step} · {taskName(event.taskId)} · {agentName(event.agentId)} · {event.type} · {event.provenance}
    </li>)}</ol>
    </section>
  </div>;
}
