import { MissionScene } from './MissionScene';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPreviewPlayback } from './playback';
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
  const latest = useRef({ onStep, terminal });
  latest.current = { onStep, terminal };
  const [clock] = useState(() => createPreviewPlayback(() => latest.current.onStep(), () => latest.current.terminal));
  const playback = useSyncExternalStore(clock.subscribe, clock.getSnapshot);
  useEffect(() => { clock.reset(); }, [clock, input]);
  useEffect(() => { if (terminal) clock.pause(); }, [clock, terminal]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) clock.pause(); };
    document.addEventListener('visibilitychange', hidden);
    // Pause rather than dispose: React StrictMode can replay effect setup on this same clock.
    return () => { document.removeEventListener('visibilitychange', hidden); clock.pause(); };
  }, [clock]);
  const captured = evaluatePlan(input.plan, input.assumptions, input.plan.taskIds);
  const capturedStatuses = new Map(captured.tasks.map(({ id, status }) => [id, status]));

  return <div className="mission-preview-layout">
    <div className="mission-preview-heading">
    <h2 id="mission-preview-title">Mission preview</h2>
    <p>Hypothetical preview of captured Plan B. Changes to Plan B that affect simulated work clear this preview.</p>
    <div className="filter-bar preview-playback-controls" role="group" aria-label="Mission playback controls">
      <button type="button" className="text-button" aria-disabled={terminal || playback.mode !== 'idle'} onClick={() => {
        if (!document.hidden && playback.mode === 'idle') clock.play();
      }}>Play preview</button>
      <button type="button" className="text-button" aria-disabled={playback.mode !== 'playing' || terminal} onClick={() => clock.pause()}>Pause preview</button>
      <button type="button" className="text-button" aria-disabled={terminal || playback.mode !== 'paused'} onClick={() => {
        if (!document.hidden && playback.mode === 'paused') clock.play();
      }}>Resume preview</button>
      <label>Preview speed<select value={playback.speed} onChange={(event) => clock.setSpeed(Number(event.target.value))}>
        {[1, 2, 4].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
      </select></label>
      <button type="button" className="text-button" ref={stepButton} aria-disabled={terminal || playback.mode === 'playing'} onClick={() => clock.step()}>Step preview</button>
      <button type="button" className="text-button" onClick={() => {
        clock.reset(); stepButton.current?.focus();
        onReset();
      }}>Reset preview</button>
    </div>
    <p role="status" aria-label="Mission playback status">Preview playback: {terminal ? 'finished' : playback.mode}.</p>
    <p className="preview-playback-help">Speed controls presentation pacing only: 1× is one logical transition per second, not task duration. Reset preview, then Play preview to replay this capture. Playback pauses when this tab is hidden.</p>
    </div>
    <MissionScene state={state} dark={dark} reducedMotion={reducedMotion} />
    <section className="content-section" aria-labelledby="mission-preview-title">
    <p role="status" aria-live={playback.mode === 'playing' ? 'off' : 'polite'}>{terminal ? 'Preview complete.' : 'Preview in progress.'} Step {events.length}.</p>
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
