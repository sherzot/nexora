import { useRef, useState } from 'react';
import { findAgent, findTask } from '../demo/selectors';
import { useSimulation } from '../simulation/SimulationProvider';
import { virtualTime } from '../simulation/selectors';
import { interactionLabels } from '../collaboration/projection';
import { InteractionInspector } from '../collaboration/InteractionInspector';

export function CollaborationOverview() {
  const { view, collaboration, interaction, selectInteraction, select } = useSimulation();
  const graph = useRef<HTMLElement>(null);
  const taskFilter = useRef<HTMLSelectElement>(null);
  const restoreFocus = () => {
    const step = graph.current?.querySelector<HTMLButtonElement>('.workflow-node[aria-pressed="true"]');
    (step ?? taskFilter.current)?.focus();
  };
  const [agent, setAgent] = useState('');
  const [task, setTask] = useState('');
  const [zoom, setZoom] = useState(100);
  const taskIds = [...new Set(collaboration.flows.map((flow) => flow.taskId))];
  const flows = collaboration.flows.filter((flow) => (!task || flow.taskId === task)
    && (!agent || flow.interactions.some((item) => item.source === agent || item.target === agent)));
  return <>
    <section className="page-heading"><div><p className="eyebrow">SYNTHETIC PLAYBACK</p><h1 id="page-title" tabIndex={-1}>Collaboration</h1>
      <p className="page-description">Trace assignments, handoffs and review steps as the simulation advances.</p></div>
      <span className="quiet-label">Tick {view.snapshot.tick} · {virtualTime(view.snapshot.virtualMs)}</span></section>
    <div className="filter-bar">
      <label>Workflow agent<select value={agent} onChange={(event) => { const id = event.target.value; setAgent(id); if (id) select(id); }}><option value="">All agents</option>{collaboration.flows.map((flow) => <option key={flow.agentId} value={flow.agentId}>{findAgent(flow.agentId)?.name}</option>)}</select></label>
      <label>Workflow task<select ref={taskFilter} value={task} onChange={(event) => setTask(event.target.value)}><option value="">All tasks</option>{taskIds.map((id) => <option key={id} value={id}>{findTask(id)?.title}</option>)}</select></label>
      <div className="office-view-controls" role="group" aria-label="Workflow zoom">
        <button type="button" disabled={zoom <= 80} onClick={() => setZoom(zoom - 20)}>Zoom out</button>
        <button type="button" disabled={zoom >= 140} onClick={() => setZoom(zoom + 20)}>Zoom in</button>
        <button type="button" onClick={() => setZoom(100)}>Reset zoom</button>
        <output aria-label="Workflow scale">{zoom}%</output>
      </div>
    </div>
    <div className="collaboration-layout">
      <section ref={graph} className="collaboration-graph" aria-label="Synthetic workflow graph" style={{ fontSize: `${zoom}%` }}>
        {flows.map((flow) => <section key={flow.agentId} className="collaboration-flow">
          <h2>{findTask(flow.taskId)?.title}</h2><p>{findAgent(flow.agentId)?.name} · fixture task</p>
          <ol>{flow.interactions.map((item) => <li key={item.id}>
            {item.predecessor && <svg aria-hidden="true" className="workflow-edge" viewBox="0 0 16 20"><path d="M8 0v17m-4-4 4 4 4-4" fill="none" stroke="currentColor" /></svg>}
            <button type="button" className="workflow-node" data-status={item.status} aria-pressed={interaction?.id === item.id} onClick={() => selectInteraction(item.id)}>
              <strong>{interactionLabels[item.type]}</strong>
              <span>{findAgent(item.source)?.name} → {findAgent(item.target)?.name}</span>
              <span className="workflow-status">{item.status === 'pending' ? 'Planned' : item.status}</span>
            </button>
          </li>)}</ol>
        </section>)}
        {!flows.length && <p className="empty-state">No workflows match these filters.</p>}
      </section>
      <aside className="agent-inspector">{interaction ? <InteractionInspector onClear={restoreFocus} /> : <p>Select a workflow step to inspect its participants and timeline evidence.</p>}</aside>
    </div>
  </>;
}
