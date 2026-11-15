import { interactionLabels } from '../collaboration/projection';
import { AgentAvatar } from '../components/AgentAvatar';
import { StatusLabel } from '../components/StatusLabel';
import { CoordinationComparison } from '../coordination/CoordinationComparison';
import { taskFacts } from '../coordination/preview';
import { agentHref, findAgent, findTask } from '../demo/selectors';
import { useSimulation } from '../simulation/SimulationProvider';

export function TaskWorkspace({ id }: { id: string }) {
  const { view } = useSimulation();
  const task = findTask(id);
  if (!task) return <section className="empty-state">
    <h1 id="page-title" tabIndex={-1}>Task not found</h1>
    <p>This task link does not match a synthetic fixture.</p><a href="#/tasks">Return to Task Board</a>
  </section>;
  const facts = taskFacts(view.snapshot, task.id);
  return <>
    <section className="page-heading"><div>
      <p className="eyebrow">SYNTHETIC TASK WORKSPACE</p>
      <h1 id="page-title" tabIndex={-1}>{task.title}</h1>
      <p>{task.description}</p><StatusLabel status={facts.status} />
    </div></section>
    <p><a href="#/office">Return to Office</a> · <a href={`#/tasks?task=${encodeURIComponent(task.id)}`}>Find on task board</a></p>
    <section className="content-section" aria-label="Linked synthetic agents">
      <h2>Linked agents</h2>
      <ul className="task-agents">{task.agentIds.map((id) => {
        const agent = findAgent(id);
        return agent && <li key={id}><a href={agentHref(id)}><AgentAvatar agent={agent} />{agent.name}</a></li>;
      })}</ul>
      <p><a href="#/activity">Open Timeline</a></p>
      <h3>Observed task interactions</h3>
      {facts.interactions.length ? <ol>{facts.interactions.map((item) => <li key={item.id}>
        <a href={`#/activity?interaction=${encodeURIComponent(item.id)}`}>{interactionLabels[item.type]} · {findAgent(item.source)?.name} → {findAgent(item.target)?.name}</a>
      </li>)}</ol> : <p>No observed task interactions in current playback.</p>}
    </section>
    <CoordinationComparison key={view.epoch} snapshot={view.snapshot} taskId={task.id} />
  </>;
}
