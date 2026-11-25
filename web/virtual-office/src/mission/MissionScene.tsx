import { useEffect, useMemo, useState } from 'react';
import { agents } from '../demo/fixtures';
import { findTask } from '../demo/selectors';
import { OfficeViewport } from '../office/OfficeViewport';
import type { MissionPreviewState } from './preview';
import { projectMissionOffice } from './presentation';

export function MissionScene({ state, dark, reducedMotion }: { state: MissionPreviewState; dark: boolean; reducedMotion: boolean }) {
  const presentation = useMemo(() => projectMissionOffice(state), [state]);
  const [selectedId, setSelectedId] = useState<string>(agents[0].id);
  const [followActive, setFollowActive] = useState(false);
  const activeTask = state.tasks.find(({ status }) => status === 'Active');
  const activeAgent = activeTask ? state.input.assignments[activeTask.id] : undefined;
  useEffect(() => { if (followActive && activeAgent) setSelectedId(activeAgent); }, [followActive, activeAgent]);
  const displayedId = followActive && activeAgent ? activeAgent : selectedId;
  const select = (id: string) => { setFollowActive(false); setSelectedId(id); };
  const selected = presentation.agents.find(({ id }) => id === displayedId);
  const name = (id: string) => findTask(id)?.title ?? id;
  return <section className="mission-scene" aria-labelledby="mission-scene-title">
    <h3 id="mission-scene-title">Mission office preview</h3>
    <p>Hypothetical step {state.events.length}. Agent badges reflect this captured mission, not Office playback.</p>
    <p>Agents stay at their fixture desks. No travel time, duration or real work is simulated.</p>
    <label className="mission-follow-active"><input type="checkbox" checked={followActive} onChange={(event) => setFollowActive(event.target.checked)} />Follow active agent</label>
    <p>Follow updates selection and camera only. Manual agent selection turns it off.</p>
    <OfficeViewport selectedId={displayedId} onSelect={select} followSelection={followActive} dark={dark} reducedMotion={reducedMotion} presentation={presentation} />
    <div className="mission-agent-choices" role="group" aria-label="Mission agent selection">
      {agents.map((agent) => <button key={agent.id} type="button" className="text-button" aria-label={`Select mission ${agent.name}`}
        aria-pressed={displayedId === agent.id} aria-describedby={`mission-agent-${agent.id}-status`} onClick={() => select(agent.id)}>
        {agent.name}<span id={`mission-agent-${agent.id}-status`}>{presentation.agents.find(({ id }) => id === agent.id)?.label}</span>
      </button>)}
    </div>
    <section aria-label="Selected mission agent tasks">
      <h4>{agents.find(({ id }) => id === displayedId)?.name} · {selected?.label}</h4>
      {selected?.tasks.length ? <ul>{selected.tasks.map((task) => <li key={task.id} data-mission-task={task.id}>
        <strong>{name(task.id)}</strong> · {task.status}
        {task.unmet.length > 0 && <p>Requires: {task.unmet.map(name).join(', ')}</p>}
      </li>)}</ul> : <p>No tasks assigned in this captured mission.</p>}
    </section>
    {presentation.unassigned.length > 0 && <section aria-label="Mission tasks without an assigned agent">
      <h4>Tasks without an assigned agent</h4>
      <ul>{presentation.unassigned.map((task) => <li key={task.id}>{name(task.id)} · {task.status}</li>)}</ul>
    </section>}
    <p>For agents with several tasks, the badge prioritizes Active, Blocked, Ready, Completed, then Assumed complete. Every task keeps its own status below.</p>
  </section>;
}
