import { SimulationTimeline } from '../simulation/SimulationTimeline';
import { useSimulation } from '../simulation/SimulationProvider';
import { useState } from 'react';
import { activities, agents, tasks } from '../demo/fixtures';
import { activityTime, agentHref, findAgent, findTask } from '../demo/selectors';
import { AgentAvatar } from '../components/AgentAvatar';

export function ActivityTimeline({ interactionId }: { interactionId?: string }) {
  const { view } = useSimulation();
  const [agent, setAgent] = useState('');
  const [task, setTask] = useState('');
  const visible = activities.filter((event) => (!agent || event.agentId === agent) && (!task || event.taskId === task));
  if (view.snapshot.active) return <SimulationTimeline interactionId={interactionId} />;
  return <><section className="page-heading"><div><p className="eyebrow">A FIXED MOMENT IN THE WORKSPACE</p><h1 id="page-title" tabIndex={-1}>Activity Timeline</h1><p className="page-description">Six synthetic events, October 25, 2026. No live feed, polling or external activity.</p></div></section>
    <div className="filter-bar"><label>Agent<select value={agent} onChange={(event) => setAgent(event.target.value)}><option value="">All agents</option>{agents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Task<select value={task} onChange={(event) => setTask(event.target.value)}><option value="">All tasks</option>{tasks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><button className="text-button" onClick={() => { setAgent(''); setTask(''); }}>Clear filters</button></div><p className="result-count" role="status">{visible.length} fixed events · chronological order · UTC</p>
    <ol className="activity-timeline">{visible.map((event) => { const person = findAgent(event.agentId); return <li key={event.id}><time dateTime={event.timestamp}>{activityTime(event.timestamp)}<span>25 OCT</span></time><span className="timeline-node" aria-hidden="true">{person && <AgentAvatar agent={person} />}</span><article><span className="overline">SYNTHETIC EVENT / {String(event.sequence).padStart(2, '0')}</span><h2>{event.title}</h2><p>{event.detail}</p><div className="event-links"><a href={agentHref(event.agentId)}>{person?.name ?? 'Unknown demo agent'}</a><span aria-hidden="true">·</span><a href={`#/tasks?task=${encodeURIComponent(event.taskId)}`}>{findTask(event.taskId)?.title ?? 'Unknown demo task'}</a></div></article></li>; })}</ol>
    {visible.length === 0 && <div className="empty-state"><h2>No matching activity examples</h2><p>No events are generated when you interact with this interface.</p><button className="secondary-button" onClick={() => { setAgent(''); setTask(''); }}>Clear filters</button></div>}
  </>;
}
