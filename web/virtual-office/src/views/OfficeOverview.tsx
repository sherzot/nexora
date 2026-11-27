import { InteractionInspector } from '../collaboration/InteractionInspector';
import { useSimulation } from '../simulation/SimulationProvider';
import { eventsForAgent, virtualTime } from '../simulation/selectors';
import { agents, rooms } from '../demo/fixtures';
import { findAgent, findRoom, findTask, tasksForAgent, agentHref } from '../demo/selectors';
import { AgentAvatar } from '../components/AgentAvatar';
import { StatusLabel } from '../components/StatusLabel';
import { OfficeViewport } from '../office/OfficeViewport';
import { LocalModelConsoleLink } from '../office/LocalModelConsoleLink';

export function OfficeOverview({ dark = false, reducedMotion = false }: { dark?: boolean; reducedMotion?: boolean }) {
  const { selectedId, select: setSelectedId, view } = useSimulation();
  const simulated = view.snapshot.active ? view.snapshot.agents.find((agent) => agent.id === selectedId) : undefined;
  const related = eventsForAgent(view.snapshot, selectedId).slice(-3);
  const selected = findAgent(selectedId);
  const snapshot = view.snapshot;
  const moving = snapshot.active ? snapshot.agents.filter(({ activity }) => activity === 'moving').length : 0;
  const working = snapshot.active ? snapshot.agents.filter(({ activity }) => ['working', 'collaborating', 'reviewing'].includes(activity)).length : 0;
  const demoTaskIds = new Set(snapshot.plans.map(({ taskId }) => taskId));
  const completed = snapshot.active ? [...demoTaskIds].filter((id) => snapshot.taskStates[id] === 'Done').length : 0;
  const latest = snapshot.events.slice(-5).reverse();
  return <>
    <section className="page-heading"><div><p className="eyebrow">A PLACE FOR THE TEAM</p><h1 id="page-title" tabIndex={-1}>Virtual Office<span className="heading-dot">.</span></h1><p className="page-description">Start a synthetic scenario, watch the team move, and inspect the tasks behind each activity.</p></div><span className="quiet-label">Floor 01 <span aria-hidden="true">↗</span></span></section>
    <div className="office-summary"><span><strong>{agents.length}</strong> synthetic agents</span><span><strong>{rooms.length}</strong> rooms</span><span><span className="small-blue-dot" aria-hidden="true" />{view.snapshot.active ? 'Synthetic playback · no operations' : 'Fixed scene · no live activity'}</span></div>
    <div className="office-layout">
      <section className="office-canvas" aria-label="Office floor plan"><div className="scene-toolbar"><span className="scene-label">THE WORKSPACE</span><span>Explore · Select an agent</span></div><OfficeViewport selectedId={selectedId} onSelect={setSelectedId} dark={dark} reducedMotion={reducedMotion} /><div className="scene-legend">{view.snapshot.active ? ['idle', 'moving', 'working', 'collaborating', 'reviewing', 'completed'].map((activity) => <span key={activity}><i className="legend-dot" data-activity={activity} />{activity}</span>) : <><span><i className="legend-dot focused" />Focused</span><span><i className="legend-dot available" />Available</span><span><i className="legend-dot reviewing" />Reviewing</span><span><i className="legend-dot away" />Away</span></>}<span className="legend-note">Synthetic presentation only</span></div></section>
      <aside id="office-agent-inspector" tabIndex={-1} className="agent-inspector" aria-label="Selected synthetic agent">
        <p className="eyebrow">IN FOCUS</p>
        <span className="sr-only" role="status">{selected ? `${selected.name} selected` : 'Select an agent'}</span>
        {selected ? <><AgentAvatar agent={selected} large /><h2>{selected.name}</h2><p className="inspector-role">{selected.role}</p>{simulated ? <span className="simulation-tag">Synthetic · {simulated.activity}</span> : <StatusLabel status={selected.status} />}<dl className="detail-facts"><div><dt>Room</dt><dd>{findRoom(simulated?.zoneId ?? selected.roomId)?.name ?? 'Unknown demo room'}</dd></div><div><dt>Specialty</dt><dd>{selected.specialty}</dd></div><div><dt>Demo tasks</dt><dd>{tasksForAgent(selected.id).length} linked examples</dd></div></dl><a className="primary-link" href={agentHref(selected.id)}>View agent details <span aria-hidden="true">↗</span></a><p><a href="#/collaboration">Explore collaboration</a> · <a href="#/mission">Plan a mission</a></p><ul className="simulation-related" aria-label="Selected agent simulation activity">{related.map((event) => <li key={event.id}>{virtualTime(event.virtualMs)} · {event.activity}</li>)}</ul><p className="inspector-note">This is a synthetic profile. Selecting it does not assign work or initiate an operation.</p></> : <p className="empty-state">Select an agent from the scene or list.</p>}
        {simulated && <section className="office-current-task" aria-label="Selected agent current task">
          <h3>Current demo task</h3>
          <a href={`#/tasks?task=${encodeURIComponent(simulated.taskId)}`}>{findTask(simulated.taskId)?.title ?? 'Unknown demo task'}</a>
          <p>{snapshot.taskStates[simulated.taskId]} · {simulated.activity}</p>
          <p>Destination: {findRoom(snapshot.plans.find(({ id }) => id === selectedId)?.zoneId ?? '')?.name ?? 'Unknown demo room'}</p>
        </section>}
        <InteractionInspector />
      </aside>
    </div>
    <section className="office-results" aria-labelledby="office-results-title">
      <div className="section-heading"><h2 id="office-results-title">Playback results</h2><a href="#/analytics">Open analytics &amp; reports →</a></div>
      <p>{!snapshot.active ? 'Start the demo to see observed activity here. No task results have been observed.'
        : view.mode === 'finished' ? 'This synthetic scenario is finished. Results remain available until you reset or change the scenario.'
        : 'Observed so far in this playback. Counts change as the scenario advances.'}</p>
      <dl className="office-result-metrics">
        <div><dt>Moving agents</dt><dd>{moving} / {agents.length}</dd></div>
        <div><dt title="Working, collaborating or reviewing">On-task agents</dt><dd>{working} / {agents.length}</dd></div>
        <div><dt>Completed demo tasks</dt><dd>{completed} / {demoTaskIds.size}</dd></div>
        <div><dt>Observed events</dt><dd>{snapshot.events.length}</dd></div>
      </dl>
      <div className="office-result-detail">
        <section aria-label="Playback task outcomes"><h3>Scenario tasks</h3>
          <ul>{[...demoTaskIds].map((id) => <li key={id}><a href={`#/tasks?task=${encodeURIComponent(id)}`}>{findTask(id)?.title ?? 'Unknown demo task'}</a>
            <span>{snapshot.active ? snapshot.taskStates[id] : 'Not observed'}</span></li>)}</ul>
          <a href="#/tasks">Open task board →</a>
        </section>
        <section aria-label="Recent office activity"><h3>Recent activity</h3>
          {latest.length ? <ol>{latest.map((event) => <li key={event.id}>
            <time>{virtualTime(event.virtualMs)}</time><button type="button" className="text-button" onClick={() => {
                setSelectedId(event.agentId);
                const inspector = document.getElementById('office-agent-inspector');
                inspector?.focus({ preventScroll: true }); inspector?.scrollIntoView({ block: 'start', behavior: 'instant' });
              }}
              aria-label={`Inspect ${findAgent(event.agentId)?.name} at ${virtualTime(event.virtualMs)}`}>{findAgent(event.agentId)?.name} · {event.activity}</button>
            <span>{findTask(event.taskId)?.title}</span>
          </li>)}</ol> : <p>No observed activity yet.</p>}
          <a href="#/activity">Open activity timeline →</a>
        </section>
      </div>
      <p className="office-planning-note"><a href="#/mission">Plan a hypothetical mission →</a> Planning is a separate local exercise; loading a sample does not run Office agents.</p>
    </section>
    <section className="agent-strip-section" aria-labelledby="office-list-title"><div className="section-heading"><h2 id="office-list-title">Around the office</h2><a href="#/agents">Browse directory <span aria-hidden="true">→</span></a></div><p className="section-description">Equivalent agent selection, without the floor plan.</p><ul className="agent-strip">{agents.map((agent) => <li key={agent.id}><button className={selectedId === agent.id ? 'agent-select is-selected' : 'agent-select'} aria-pressed={selectedId === agent.id} onClick={() => setSelectedId(agent.id)}><AgentAvatar agent={agent} /><span><strong>{agent.name}</strong><span>{agent.role}</span></span><span className="selection-indicator" aria-hidden="true">↗</span></button></li>)}</ul></section>
    <LocalModelConsoleLink />
  </>;
}
