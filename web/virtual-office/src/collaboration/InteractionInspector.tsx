import { agentHref, findAgent, findTask } from '../demo/selectors';
import { useSimulation } from '../simulation/SimulationProvider';
import { scenarios } from '../simulation/scenarios';
import { virtualTime } from '../simulation/selectors';
import { interactionLabels } from './projection';

export function InteractionInspector({ onClear }: { onClear?: () => void }) {
  const { interaction, selectInteraction } = useSimulation();
  if (!interaction) return null;
  const { id, scenario, type, source, target, taskId, status, evidence, predecessor } = interaction;
  return <section className="interaction-details" aria-label="Interaction Inspector">
    <div className="section-heading"><h2>{interactionLabels[type]}</h2><button type="button" className="text-button" onClick={() => { onClear?.(); selectInteraction(); }}>Clear interaction</button></div>
    <p><a href={agentHref(source)}>{findAgent(source)?.name}</a> <span aria-hidden="true">→</span><span className="sr-only"> to </span> <a href={agentHref(target)}>{findAgent(target)?.name}</a></p>
    <p><a href={`#/tasks?task=${encodeURIComponent(taskId)}`}>{findTask(taskId)?.title}</a></p>
    <dl className="detail-facts">
      <div><dt>Scenario</dt><dd>{scenarios.find((item) => item.id === scenario)?.name}</dd></div>
      <div><dt>Synthetic status</dt><dd>{status === 'pending' ? 'Planned' : status}</dd></div>
      <div><dt>Virtual time</dt><dd>{evidence ? virtualTime(evidence.virtualMs) : 'Pending playback'}</dd></div>
      <div><dt>Interaction ID</dt><dd>{id}</dd></div>
      <div><dt>Predecessor</dt><dd>{predecessor ?? 'First step'}</dd></div>
      <div><dt>Timeline event</dt><dd>{evidence ? <a href={`#/activity?interaction=${encodeURIComponent(id)}`}>{evidence.id}</a> : 'Awaiting simulation evidence'}</dd></div>
    </dl>
    {type === 'approval' && <p className="inspector-note">Demo Approval is a fictional review outcome and grants no authority.</p>}
    {evidence && <a className="primary-link" href="#/office">Inspect in Office <span aria-hidden="true">↗</span></a>}
  </section>;
}
