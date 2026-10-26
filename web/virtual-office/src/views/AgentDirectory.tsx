import { useState } from 'react';
import { agents, rooms } from '../demo/fixtures';
import { agentHref, findRoom } from '../demo/selectors';
import type { AgentStatus } from '../demo/model';
import { AgentAvatar } from '../components/AgentAvatar';
import { StatusLabel } from '../components/StatusLabel';

const statuses: readonly AgentStatus[] = ['Focused', 'Available', 'Reviewing', 'Away'];
export function AgentDirectory() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [room, setRoom] = useState('');
  const [status, setStatus] = useState('');
  const roles = [...new Set(agents.map((agent) => agent.role))];
  const visible = agents.filter((agent) => `${agent.name} ${agent.role} ${agent.specialty}`.toLowerCase().includes(query.toLowerCase().trim()) && (!role || agent.role === role) && (!room || agent.roomId === room) && (!status || agent.status === status));
  const reset = () => { setQuery(''); setRole(''); setRoom(''); setStatus(''); };
  return <><section className="page-heading"><div><p className="eyebrow">THE PEOPLE IN THE PICTURE</p><h1 id="page-title" tabIndex={-1}>Agent Directory</h1><p className="page-description">Eight fictional specialists, one shared workspace. All profiles and assignments are synthetic.</p></div></section>
    <div className="filter-bar"><label className="search-field">Search agents<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, role or specialty" /></label><label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option value="">All roles</option>{roles.map((value) => <option key={value}>{value}</option>)}</select></label><label>Room<select value={room} onChange={(event) => setRoom(event.target.value)}><option value="">All rooms</option>{rooms.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All display statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label><button className="text-button" onClick={reset}>Clear filters</button></div>
    <p className="result-count" role="status">{visible.length} of {agents.length} synthetic agents</p>
    <div className="directory-header" aria-hidden="true"><span>AGENT</span><span>ROOM</span><span>DISPLAY STATUS</span><span /></div><ul className="directory-list">{visible.map((agent) => <li key={agent.id}><a className="directory-row" href={agentHref(agent.id)}><span className="agent-identity"><AgentAvatar agent={agent} /><span><strong>{agent.name}</strong><span>{agent.role}</span></span></span><span className="room-name">{findRoom(agent.roomId)?.name}</span><StatusLabel status={agent.status} /><span className="row-arrow" aria-hidden="true">↗</span></a></li>)}</ul>
    {visible.length === 0 && <div className="empty-state"><h2>No agents match these filters</h2><p>The fixture still contains eight agents. Try a different search.</p><button className="secondary-button" onClick={reset}>Clear filters</button></div>}
  </>;
}
