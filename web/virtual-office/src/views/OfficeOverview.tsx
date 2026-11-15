import { InteractionInspector } from '../collaboration/InteractionInspector';
import { useSimulation } from '../simulation/SimulationProvider';
import { eventsForAgent, virtualTime } from '../simulation/selectors';
import { agents, rooms } from '../demo/fixtures';
import { findAgent, findRoom, tasksForAgent, agentHref } from '../demo/selectors';
import { AgentAvatar } from '../components/AgentAvatar';
import { StatusLabel } from '../components/StatusLabel';
import { OfficeViewport } from '../office/OfficeViewport';

export function OfficeOverview({ dark = false, reducedMotion = false }: { dark?: boolean; reducedMotion?: boolean }) {
  const { selectedId, select: setSelectedId, view } = useSimulation();
  const simulated = view.snapshot.active ? view.snapshot.agents.find((agent) => agent.id === selectedId) : undefined;
  const related = eventsForAgent(view.snapshot, selectedId).slice(-3);
  const selected = findAgent(selectedId);
  return <>
    <section className="page-heading"><div><p className="eyebrow">A PLACE FOR THE TEAM</p><h1 id="page-title" tabIndex={-1}>Virtual Office<span className="heading-dot">.</span></h1><p className="page-description">A shared view of a fictional engineering team. Explore the space, then look closer.</p></div><span className="quiet-label">Floor 01 <span aria-hidden="true">↗</span></span></section>
    <div className="office-summary"><span><strong>{agents.length}</strong> synthetic agents</span><span><strong>{rooms.length}</strong> rooms</span><span><span className="small-blue-dot" aria-hidden="true" />{view.snapshot.active ? 'Synthetic playback · no operations' : 'Fixed scene · no live activity'}</span></div>
    <div className="office-layout">
      <section className="office-canvas" aria-label="Office floor plan"><div className="scene-toolbar"><span className="scene-label">THE WORKSPACE</span><span>Explore · Select an agent</span></div><OfficeViewport selectedId={selectedId} onSelect={setSelectedId} dark={dark} reducedMotion={reducedMotion} /><div className="scene-legend">{view.snapshot.active ? ['idle', 'moving', 'working', 'collaborating', 'reviewing', 'completed'].map((activity) => <span key={activity}><i className="legend-dot" data-activity={activity} />{activity}</span>) : <><span><i className="legend-dot focused" />Focused</span><span><i className="legend-dot available" />Available</span><span><i className="legend-dot reviewing" />Reviewing</span><span><i className="legend-dot away" />Away</span></>}<span className="legend-note">Synthetic presentation only</span></div></section>
      <aside className="agent-inspector" aria-label="Selected synthetic agent">
        <p className="eyebrow">IN FOCUS</p>
        <span className="sr-only" role="status">{selected ? `${selected.name} selected` : 'Select an agent'}</span>
        {selected ? <><AgentAvatar agent={selected} large /><h2>{selected.name}</h2><p className="inspector-role">{selected.role}</p>{simulated ? <span className="simulation-tag">Synthetic · {simulated.activity}</span> : <StatusLabel status={selected.status} />}<dl className="detail-facts"><div><dt>Room</dt><dd>{findRoom(simulated?.zoneId ?? selected.roomId)?.name ?? 'Unknown demo room'}</dd></div><div><dt>Specialty</dt><dd>{selected.specialty}</dd></div><div><dt>Demo tasks</dt><dd>{tasksForAgent(selected.id).length} linked examples</dd></div></dl><a className="primary-link" href={agentHref(selected.id)}>View agent details <span aria-hidden="true">↗</span></a><p><a href="#/collaboration">Explore collaboration</a></p><ul className="simulation-related" aria-label="Selected agent simulation activity">{related.map((event) => <li key={event.id}>{virtualTime(event.virtualMs)} · {event.activity}</li>)}</ul><p className="inspector-note">This is a synthetic profile. Selecting it does not assign work or initiate an operation.</p></> : <p className="empty-state">Select an agent from the scene or list.</p>}
        <InteractionInspector />
      </aside>
    </div>
    <section className="agent-strip-section" aria-labelledby="office-list-title"><div className="section-heading"><h2 id="office-list-title">Around the office</h2><a href="#/agents">Browse directory <span aria-hidden="true">→</span></a></div><p className="section-description">Equivalent agent selection, without the floor plan.</p><ul className="agent-strip">{agents.map((agent) => <li key={agent.id}><button className={selectedId === agent.id ? 'agent-select is-selected' : 'agent-select'} aria-pressed={selectedId === agent.id} onClick={() => setSelectedId(agent.id)}><AgentAvatar agent={agent} /><span><strong>{agent.name}</strong><span>{agent.role}</span></span><span className="selection-indicator" aria-hidden="true">↗</span></button></li>)}</ul></section>
  </>;
}
