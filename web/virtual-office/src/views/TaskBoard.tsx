import { useSimulation } from '../simulation/SimulationProvider';
import { useState } from 'react';
import { agents, reviews, tasks, workflows } from '../demo/fixtures';
import type { TaskStatus } from '../demo/model';
import { agentHref, findAgent, findTask, findWorkflow } from '../demo/selectors';
import { AgentAvatar } from '../components/AgentAvatar';
import { StatusLabel } from '../components/StatusLabel';

const columns: readonly TaskStatus[] = ['Planned', 'In progress', 'In review', 'Done'];
export function TaskBoard({ focusedId = '' }: { focusedId?: string }) {
  const { view } = useSimulation();
  const displayed = view.snapshot.active ? tasks.map((task) => ({ ...task, status: view.snapshot.taskStates[task.id] ?? task.status })) : tasks;
  const [workflow, setWorkflow] = useState('');
  const [agent, setAgent] = useState('');
  const visible = displayed.filter((task) => (!workflow || task.workflowId === workflow) && (!agent || task.agentIds.some((id) => id === agent)) && (!focusedId || task.id === focusedId));
  return <><section className="page-heading"><div><p className="eyebrow">WORK, AS AN ILLUSTRATION</p><h1 id="page-title" tabIndex={-1}>Task Board</h1><p className="page-description">{view.snapshot.active ? 'Synthetic simulation task states · no operational workflow or approvals.' : 'Fixed task examples. Columns describe presentation states, not live Run lifecycle or dispatch.'}</p></div><span className="quiet-label">{tasks.length} synthetic tasks</span></section>
    <a className="back-link" href="#/office">Return to Office</a>
    <div className="workflow-overview">{workflows.map((item) => <div key={item.id}><span className="overline">DEMO WORKFLOW PRESENTATION</span><h2>{item.title}</h2><p>{item.stages.join(' → ')}</p></div>)}</div>
    <div className="filter-bar"><label>Workflow presentation<select value={workflow} onChange={(event) => setWorkflow(event.target.value)}><option value="">All workflow examples</option>{workflows.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Linked agent<select value={agent} onChange={(event) => setAgent(event.target.value)}><option value="">All agents</option>{agents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{focusedId && <a className="back-link" href="#/tasks">Clear task focus</a>}</div>
    {focusedId && <p className="scope-note">{findTask(focusedId) ? `Focused example: ${findTask(focusedId)?.title}` : 'Unknown task identifier. No fixture matches this link.'}</p>}
    <p className="result-count" role="status">{visible.length} task examples shown</p>
    {visible.length === 0 ? <div className="empty-state"><h2>No matching task examples</h2><p>Change the filters or return to the complete board.</p><a className="primary-link" href="#/tasks" onClick={() => { setAgent(''); setWorkflow(''); }}>Show all examples</a></div> : <div className="task-board">{columns.map((status, index) => {
      const items = visible.filter((task) => task.status === status);
      return <section key={status} className="task-column" aria-labelledby={`column-${index}`}><div className="column-heading"><h2 id={`column-${index}`}>{status}</h2><span>{items.length}</span></div>{items.length === 0 && <p className="column-empty">No examples in this column.</p>}{items.map((task) => <article key={task.id} className="task-card"><span className="overline">{task.category}</span><h3>{task.title}</h3><p>{task.description}</p> <a href={`#/tasks/${encodeURIComponent(task.id)}`}>Open task workspace</a><StatusLabel status={task.status} /><p className="task-workflow">{findWorkflow(task.workflowId)?.title}</p><ul className="task-agents" aria-label="Linked synthetic agents">{task.agentIds.map((id) => { const person = findAgent(id); return person ? <li key={id}><a href={agentHref(id)}><AgentAvatar agent={person} /><span>{person.name}</span></a></li> : null; })}</ul>{!view.snapshot.active && reviews.filter((review) => review.taskId === task.id).map((review) => <p className="review-example" key={review.id}>{review.label}<span>Display only · not an approval</span></p>)}</article>)}</section>;
    })}</div>}
  </>;
}
