import { useMemo, useRef } from 'react';
import { findAgent, findTask } from '../demo/selectors';
import { compareScenarios, evaluateScenario, recommendCollection, recordPreference, scenarioLimitations, scenarioSlots } from './scenarios';
import type { DecisionRecord, PlanningCriterion, ScenarioCollection, ScenarioSlot } from './scenarios';

const criteriaLabels = {
  'fewer-initial-blockers': 'Fewer initially blocked tasks',
  'fewer-prerequisite-edges': 'Fewer direct prerequisite relationships',
} as const;
const withheld = {
  invalid: 'Invalid scenario inputs.',
  'different-membership': 'The scenarios include different tasks.',
  'different-assumptions': 'The completion assumptions differ.',
  'all-assumed-mismatch': 'Only one scenario assumes all tasks complete.',
  'insufficient-evidence': 'Choose a planning criterion.',
};
const name = (id: string) => findTask(id)?.title ?? id;

export function MissionDecision({ collection, criteria, decision, onCriteria, onCapture, onRemove, onRecord }: {
  collection: ScenarioCollection;
  criteria: readonly PlanningCriterion[];
  decision?: DecisionRecord;
  onCriteria: (criteria: readonly PlanningCriterion[]) => void;
  onCapture: (slot: ScenarioSlot) => void;
  onRemove: (slot: ScenarioSlot) => void;
  onRecord: (decision: DecisionRecord) => void;
}) {
  const capture = useRef<HTMLButtonElement>(null);
  const scenarios = useMemo(() => scenarioSlots.flatMap((slot) => collection.slots[slot] ?? []), [collection]);
  const evaluations = useMemo(() => scenarios.map(evaluateScenario), [scenarios]);
  const pairs = evaluations.flatMap((left, index) => evaluations.slice(index + 1)
    .map((right) => compareScenarios(left, right, criteria)));
  const winner = recommendCollection(pairs, collection, criteria);

  return <section className="content-section" aria-labelledby="mission-decision-title">
    <h2 id="mission-decision-title" tabIndex={-1}>Mission Decision</h2>
    <p>Compare hypothetical captures of Plan B and record a local planning preference. Logical steps count hypothetical transitions. Operational approval, agent availability, cost, duration and safety are outside this model.</p>
    <p>Plan B edits and Reset Preview preserve scenarios and your local preference. Adding, replacing or removing a scenario, or changing criteria, clears the recorded preference.</p>
    <button type="button" className="text-button" onClick={() => {
      const control = document.getElementById('capture-scenario-a');
      control?.focus({ preventScroll: true });
      control?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }}>Go to A/B capture controls</button>
    {!decision && <p>No local preference recorded. Choose a captured scenario and a criterion to record one.</p>}
    <p>Use Capture Variant A and Capture Variant B above to fill scenarios A and B.</p>
    <button type="button" className="text-button" ref={capture} onClick={() => onCapture('C')}>Capture Scenario C</button>
    <ul aria-label="Scenario collection">
      {evaluations.map((result) => <li key={result.ref.slot}>
        <strong>Scenario {result.ref.slot} · Revision {result.ref.revision}</strong>
        <p>{result.readiness.status === 'valid-for-hypothetical-preview' ? 'Valid for hypothetical preview' : 'Invalid scenario'} · {result.readiness.taskCount} tasks</p>
        <p>Tasks: {result.readiness.selectedTaskIds.map(name).join(', ')}</p>
        {result.kind === 'valid' && <p>{result.readiness.initial.blocked.length} initially blocked · {result.readiness.initial.assumedComplete.length} assumed complete · {result.terminal.events.length} logical steps</p>}
        {result.kind === 'valid' && <details>
          <summary>Inspect Scenario {result.ref.slot} evidence</summary>
          <p>Assumed completions: {result.readiness.initial.assumedComplete.map(name).join(', ') || 'None'}</p>
          <ul aria-label="Prerequisite relationships">{result.readiness.edges.map(({ dependentId, prerequisiteId }) =>
            <li key={dependentId + ':' + prerequisiteId}>{name(dependentId)} requires {name(prerequisiteId)}.</li>)}</ul>
          <ul aria-label="Terminal task states">{result.terminal.tasks.map(({ id, status }) =>
            <li key={id}>{name(id)} · {status}</li>)}</ul>
          <ol aria-label="Hypothetical events">{result.terminal.events.map(({ step, taskId, agentId, type }) =>
            <li key={step}>Step {step} · {name(taskId)} · {findAgent(agentId)?.name ?? agentId} · {type} · hypothetical</li>)}</ol>
        </details>}
        <button type="button" className="text-button" onClick={() => {
          const target = result.ref.slot === 'C' ? capture.current
            : document.getElementById('capture-scenario-' + result.ref.slot.toLowerCase());
          target?.focus();
          onRemove(result.ref.slot);
        }}>Remove Scenario {result.ref.slot}</button>
      </li>)}
    </ul>
    <fieldset><legend>Planning criteria</legend>
      {(Object.keys(criteriaLabels) as PlanningCriterion[]).map((criterion) => <label key={criterion}>
        <input type="checkbox" checked={criteria.includes(criterion)} onChange={(event) =>
          onCriteria(event.target.checked ? [...criteria, criterion] : criteria.filter((value) => value !== criterion))} />
        {criteriaLabels[criterion]}
      </label>)}
    </fieldset>
    <h3>Hypothetical recommendations</h3>
    <p role="status">{winner ? `Scenario ${winner.slot} is favored under the selected criteria.` : 'No collection recommendation.'}</p>
    {scenarios.length < 2 && <p>Capture at least two scenarios to compare.</p>}
    <div className="analytics-charts">
      {pairs.map((pair) => {
        const [left, right] = pair.evidence.compared;
        return <section key={left.slot + right.slot} aria-label={`Scenarios ${left.slot} and ${right.slot}`}>
          <h4>Scenario {left.slot} and Scenario {right.slot}</h4>
          <p>{pair.kind === 'favored' ? `Scenario ${pair.scenario.slot} is conditionally favored.`
            : pair.kind === 'withheld' ? withheld[pair.reason]
            : pair.kind === 'tie' ? 'Tie under the selected criteria.' : 'Trade-off between the selected criteria.'}</p>
          {pair.evidence.outcome && <p>
            Hypothetical differences: {[
              pair.evidence.outcome.membershipChanged && 'task membership',
              pair.evidence.outcome.dependenciesChanged && 'prerequisites',
              pair.evidence.outcome.assignmentsChanged && 'assignments',
              pair.evidence.outcome.assumptionsChanged && 'completion assumptions',
              pair.evidence.outcome.eventOrderChanged && 'event order',
              pair.evidence.outcome.eventAttributionChanged && 'event attribution',
              pair.evidence.outcome.stepCountChanged && 'logical step count',
              pair.evidence.outcome.terminalStatesChanged && 'terminal states',
            ].filter(Boolean).join(', ') || 'None'}.
          </p>}
          <ul>{pair.evidence.observations.map(({ criterion, left: a, right: b }) =>
            <li key={criterion}>{criteriaLabels[criterion]} · {left.slot}: {a} · {right.slot}: {b}</li>)}</ul>
        </section>;
      })}
    </div>
    <ul>{scenarioLimitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
    {scenarios.length > 0 && <form key={scenarios.map(({ ref }) => ref.revision).join(',')} onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const selected = scenarios.find(({ ref }) => String(ref.revision) === data.get('preferred'));
      if (!selected) return;
      const result = recordPreference(collection, selected.ref, criteria, String(data.get('rationale') ?? ''));
      if (result.ok) onRecord(result.record);
    }}>
      <p>Capture at least two scenarios and select a criterion to record a preference.</p>
      <div className="filter-bar">
        <label>Preferred scenario<select name="preferred" required defaultValue="">
          <option value="" disabled>Choose scenario</option>
          {scenarios.map(({ ref }) => <option key={ref.revision} value={ref.revision}>Scenario {ref.slot}</option>)}
        </select></label>
        <label>Rationale<input name="rationale" type="text" maxLength={240} /></label>
        <button type="submit" className="text-button" disabled={scenarios.length < 2 || criteria.length === 0}>Record local preference</button>
      </div>
    </form>}
    {decision && <section aria-label="Recorded local preference">
      <h3>Recorded local preference</h3>
      <p>Your chosen hypothetical scenario is recorded below with the evidence and criteria used for that choice. Human Approval and Runtime admission require separate authority.</p>
      <p>Scenario {decision.preferred.ref.slot} · Revision {decision.preferred.ref.revision} · hypothetical</p>
      <p>Compared: {decision.compared.map(({ slot, revision }) => `${slot} (revision ${revision})`).join(', ')}</p>
      <p>Criteria: {decision.criteria.map((criterion) => criteriaLabels[criterion]).join(', ') || 'None'}</p>
      {decision.rationale && <p>Rationale: {decision.rationale}</p>}
      <h4 id="mission-recorded-evidence" tabIndex={-1}>Recorded comparison evidence</h4>
      <ul>{decision.evidence.map((pair) => {
        const [left, right] = pair.evidence.compared;
        return <li key={left.revision + ':' + right.revision}>
          {left.slot} and {right.slot} · {pair.kind === 'favored' ? `Scenario ${pair.scenario.slot} conditionally favored`
            : pair.kind === 'withheld' ? withheld[pair.reason] : pair.kind === 'tie' ? 'Tie' : 'Trade-off'}
          {pair.evidence.observations.map(({ criterion, left: a, right: b }) =>
            <p key={criterion}>{criteriaLabels[criterion]} · {left.slot}: {a} · {right.slot}: {b}</p>)}
        </li>;
      })}</ul>
      <ul>{decision.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
    </section>}
  </section>;
}
