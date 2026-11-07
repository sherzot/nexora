import { useMemo, useState } from 'react';
import { agents, rooms } from '../demo/fixtures';
import { findAgent, findRoom, findTask } from '../demo/selectors';
import { activityOrder } from '../analytics/model';
import { filterEvents } from '../analytics/selectors';
import { useSimulation } from './SimulationProvider';
import { virtualTime } from './selectors';
export function SimulationTimeline() {
  const { view, selectedId, select } = useSimulation();
  const [focused, setFocused] = useState(false);
  const [agent, setAgent] = useState(''), [activity, setActivity] = useState(''), [zone, setZone] = useState('');
  const [from, setFrom] = useState(0), [to, setTo] = useState(32), [search, setSearch] = useState('');
  const events = useMemo(() => filterEvents(view.snapshot.events, { agentId: focused ? selectedId : agent, activity, zoneId: zone, fromTick: from, toTick: to, search }), [view.snapshot.events, focused, selectedId, agent, activity, zone, from, to, search]);
  const clear = () => { setFocused(false); setAgent(''); setActivity(''); setZone(''); setFrom(0); setTo(32); setSearch(''); };
  return <><section className="page-heading"><div><p className="eyebrow">SYNTHETIC PLAYBACK ONLY</p><h1 id="page-title" tabIndex={-1}>Activity Timeline</h1><p className="page-description">Virtual clock · deterministic order · no operational NEXORA events.</p></div></section>
    <label className="simulation-filter"><input type="checkbox" checked={focused} onChange={(event) => setFocused(event.target.checked)} />Only selected agent: {findAgent(selectedId)?.name}</label>
    <div className="filter-bar"><label>Timeline agent<select value={agent} disabled={focused} onChange={(event) => setAgent(event.target.value)}><option value="">All agents</option>{agents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Activity type<select value={activity} onChange={(event) => setActivity(event.target.value)}><option value="">All activities</option>{activityOrder.map((item) => <option key={item}>{item}</option>)}</select></label><label>Timeline zone<select value={zone} onChange={(event) => setZone(event.target.value)}><option value="">All zones</option>{rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>From tick (500 ms)<input type="number" min="0" max="32" step="1" value={from} onChange={(event) => setFrom(Math.min(32, Math.max(0, Math.trunc(Number(event.target.value) || 0))))} /></label><label>Through tick (inclusive)<input type="number" min="0" max="32" step="1" value={to} onChange={(event) => setTo(Math.min(32, Math.max(0, Math.trunc(Number(event.target.value) || 0))))} /></label><label>Search synthetic events<input type="search" value={search} maxLength={120} onChange={(event) => setSearch(event.target.value)} /></label><button className="text-button" onClick={clear}>Clear simulation filters</button></div>
    {from > to && <p role="alert">The start tick is after the end tick. No events match this range.</p>}
    <p className="result-count" role="status">{events.length} synthetic simulation events · inclusive tick range {from}–{to}</p>
    <ol className="activity-timeline">{events.map((event) => <li key={event.id} data-simulation-event={event.id}><time>{virtualTime(event.virtualMs)}</time><span aria-hidden="true">{event.sequence}</span><article><span className="overline">SYNTHETIC · {findRoom(event.zoneId)?.name}</span><h2>{findAgent(event.agentId)?.name} · {event.activity}</h2><p>{findTask(event.taskId)?.title}</p><details><summary>Event details</summary><dl><div><dt>ID</dt><dd className="analytics-event-id">{event.id}</dd></div><div><dt>Tick / virtual ms</dt><dd>{event.tick} / {event.virtualMs}</dd></div><div><dt>Task</dt><dd>{event.taskId}</dd></div></dl></details><button className="text-button" onClick={() => { select(event.agentId); window.location.hash = '/office'; }}>Inspect {findAgent(event.agentId)?.name}</button></article></li>)}</ol>
    {!events.length && <p className="empty-state">No matching synthetic events. Start or step the simulation, or clear the filters.</p>}
  </>;
}
