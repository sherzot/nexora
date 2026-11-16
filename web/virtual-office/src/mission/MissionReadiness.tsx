import { findAgent, findTask } from '../demo/selectors';
import type { ReadinessReport } from './readiness';

const taskName = (id: string) => findTask(id)?.title ?? id;
const agentName = (id: string) => findAgent(id)?.name ?? id;
const names = (ids: readonly string[]) => ids.map(taskName).join(', ') || 'None';

const labels = {
  incomplete: 'Configuration incomplete',
  invalid: 'Configuration invalid',
  'valid-for-hypothetical-preview': 'Valid for hypothetical preview',
};

export function ReadinessDetails({ report }: { report: ReadinessReport }) {
  return <>
    <p role="status">{labels[report.status]} · {report.taskCount} selected tasks</p>
    {report.issues.length > 0 && <ul aria-label="Configuration issues">
      {report.issues.map(({ code, taskId, message }) =>
        <li key={code + (taskId ?? '')}>{taskId && <strong>{taskName(taskId)} · </strong>}{message}</li>)}
    </ul>}
    {report.initial ? <>
      <p>Initially ready ({report.initial.ready.length}): {names(report.initial.ready)}</p>
      <p>Initially blocked ({report.initial.blocked.length})</p>
      {report.initial.blocked.length > 0 && <ul aria-label="Initial blockers">
        {report.initial.blocked.map(({ taskId, unmet }) =>
          <li key={taskId}>{taskName(taskId)} requires {names(unmet)} before it becomes ready.</li>)}
      </ul>}
      <p>Assumed complete: {names(report.initial.assumedComplete)}</p>
      {report.initial.assumedComplete.length > 0 && <p>Assumed-complete tasks omit hypothetical start and completion transitions.</p>}
    </> : <p>Initial readiness is unavailable until the plan inputs are corrected.</p>}
  </>;
}

export function MissionReadiness({ report, limitations }: { report: ReadinessReport; limitations: readonly string[] }) {
  return <section className="content-section" aria-labelledby="planning-readiness-title">
    <h2 id="planning-readiness-title">Synthetic Planning Readiness</h2>
    <ReadinessDetails report={report} />
    {report.edges.length > 0 && <ul aria-label="Direct prerequisites">
      {report.edges.map(({ dependentId, prerequisiteId }) =>
        <li key={JSON.stringify([dependentId, prerequisiteId])}>{taskName(dependentId)} requires {taskName(prerequisiteId)}.</li>)}
    </ul>}
    {report.assignments.length > 0 && <ul aria-label="Fixture assignment eligibility">
      {report.assignments.map(({ taskId, agentId, status }) => <li key={taskId}>
        {taskName(taskId)} · {agentId ? agentName(agentId) : 'No proposed agent'} · {{
          missing: 'Missing required assignment',
          invalid: 'Ineligible fixture assignment',
          eligible: 'Eligible fixture assignment',
          'not-required': 'Assignment optional for assumed completion',
        }[status]}
      </li>)}
    </ul>}
    <h3>Model limitations</h3>
    <ul>{limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
  </section>;
}
