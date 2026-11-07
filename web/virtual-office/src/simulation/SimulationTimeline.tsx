import { useState } from 'react';
import { findAgent, findRoom, findTask } from '../demo/selectors';
import { useSimulation } from './SimulationProvider';
import { virtualTime } from './selectors';
export function SimulationTimeline() {
  const { view, selectedId, select } = useSimulation();
  const [focused, setFocused] = useState(false);
  const events = view.snapshot.events.filter((event) => !focused || event.agentId === selectedId);
  return <><section className="page-heading"><div><p className="eyebrow">SYNTHETIC PLAYBACK ONLY</p><h1 id="page-title" tabIndex={-1}>Activity Timeline</h1><p className="page-description">Virtual clock · deterministic order · no operational NEXORA events.</p></div></section>
    <label className="simulation-filter"><input type="checkbox" checked={focused} onChange={(event) => setFocused(event.target.checked)} />Only selected agent: {findAgent(selectedId)?.name}</label>
    <p className="result-count" role="status">{events.length} synthetic simulation events</p>
    <ol className="activity-timeline">{events.map((event) => <li key={event.id} data-simulation-event={event.id}><time>{virtualTime(event.virtualMs)}</time><span aria-hidden="true">{event.sequence}</span><article><span className="overline">SYNTHETIC · {findRoom(event.zoneId)?.name}</span><h2>{findAgent(event.agentId)?.name} · {event.activity}</h2><p>{findTask(event.taskId)?.title}</p><button className="text-button" onClick={() => { select(event.agentId); window.location.hash = '/office'; }}>Inspect {findAgent(event.agentId)?.name}</button></article></li>)}</ol>
    {!events.length && <p className="empty-state">No synthetic events yet. Start or step the simulation.</p>}
  </>;
}
