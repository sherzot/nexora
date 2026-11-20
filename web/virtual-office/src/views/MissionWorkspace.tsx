import { useRef, useState } from 'react';
import { MissionReadiness } from '../mission/MissionReadiness';
import { createDecisionSummary } from '../mission/readiness';
import { MissionDiagnostics } from '../mission/MissionDiagnostics';
import { MissionDecision } from '../mission/MissionDecision';
import { captureScenario, emptyScenarioCollection, prepareScenarioDraft, removeScenario } from '../mission/scenarios';
import type { DecisionRecord, PlanningCriterion, ScenarioSlot } from '../mission/scenarios';
import { MissionPreview } from '../mission/MissionPreview';
import { createMissionPreview, resetMissionPreview, stepMissionPreview } from '../mission/preview';
import type { MissionPreviewState } from '../mission/preview';
import { findAgent } from '../demo/selectors';
import { tasks } from '../demo/fixtures';
import { comparePlans, evaluatePlan, validatePlan } from '../mission/plan';
import type { MissionPlan } from '../mission/plan';

const catalog: readonly string[] = tasks.map(({ id }) => id);
const empty: MissionPlan = { taskIds: [], edges: [] };
const title = (id: string) => tasks.find((task) => task.id === id)?.title ?? id;

function Prerequisites({ plan }: { plan: MissionPlan }) {
  const edges = catalog.flatMap((dependentId) => catalog.flatMap((prerequisiteId) =>
    plan.edges.filter((edge) => edge.dependentId === dependentId && edge.prerequisiteId === prerequisiteId)));
  return edges.length ? <ul>{edges.map(({ dependentId, prerequisiteId }) =>
    <li key={dependentId + ':' + prerequisiteId}>{title(dependentId)} requires {title(prerequisiteId)}</li>)}</ul>
    : <p>No prerequisites.</p>;
}

function Readiness({ result }: { result: ReturnType<typeof evaluatePlan> }) {
  if (result.error) return <p>{result.error}</p>;
  return result.tasks.length ? <ul>{result.tasks.map(({ id, status, unmet }) =>
    <li key={id}><strong>{title(id)}</strong> · {status}{unmet.length > 0 && ` · Requires ${unmet.map(title).join(', ')}`}</li>)}</ul>
    : <p>No selected tasks.</p>;
}

export function MissionWorkspace() {
  const [draft, setDraft] = useState<MissionPlan>(empty);
  const [assumptions, setAssumptions] = useState<readonly string[]>([]);
  const [reference, setReference] = useState<MissionPlan>();
  const [dependentId, setDependent] = useState('');
  const [prerequisiteId, setPrerequisite] = useState('');
  const [assignments, setAssignments] = useState<Readonly<Record<string, string>>>({});
  const [preview, setPreview] = useState<MissionPreviewState>();
  const [diagnosticTask, setDiagnosticTask] = useState('');
  const [scenarios, setScenarios] = useState(emptyScenarioCollection);
  const [criteria, setCriteria] = useState<readonly PlanningCriterion[]>([]);
  const [preference, setPreference] = useState<DecisionRecord>();
  const applicableAssumptions = assumptions.filter((id) => draft.taskIds.includes(id));
  const input = { plan: draft, assumptions: applicableAssumptions, assignments };
  const decision = createDecisionSummary(input, scenarios.slots.A?.input, scenarios.slots.B?.input);
  const [notice, setNotice] = useState('');
  const chooser = useRef<HTMLInputElement>(null);
  const dependent = useRef<HTMLSelectElement>(null);
  const selected = tasks.filter(({ id }) => draft.taskIds.includes(id));
  const assumptionTasks = tasks.filter(({ id }) => draft.taskIds.includes(id) || reference?.taskIds.includes(id));
  const evaluation = evaluatePlan(draft, assumptions.filter((id) => draft.taskIds.includes(id)), catalog);
  const comparison = reference && comparePlans(reference, draft, assumptions, catalog);

  function navigateMission(id: string) {
    const destination = document.getElementById(id);
    destination?.focus({ preventScroll: true });
    destination?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  function clearPreference(message: string) {
    setPreference(undefined);
    setNotice(preference ? message + ' Local preference cleared because its evidence changed.' : message);
  }

  function capture(slot: ScenarioSlot) {
    const result = captureScenario(scenarios, slot, scenarios.lastRevision + 1, input);
    if (!result.ok) {
      setNotice(result.issues[0]?.message ?? 'Cannot capture this scenario.');
      return;
    }
    setScenarios(result.collection);
    clearPreference(`Captured Scenario ${slot} from editable Plan B at step zero.`);
  }

  function invalidatePreview(message = '') {
    if (preview) setPreview(undefined);
    setNotice([message, preview ? 'Preview cleared because Plan B changed.' : ''].filter(Boolean).join(' '));
  }

  function toggleTask(id: string, checked: boolean) {
    if (checked) {
      setDraft({ ...draft, taskIds: [...draft.taskIds, id] });
      invalidatePreview();
      return;
    }
    const edges = draft.edges.filter((edge) => edge.dependentId !== id && edge.prerequisiteId !== id);
    setDraft({ taskIds: draft.taskIds.filter((taskId) => taskId !== id), edges });
    setAssignments(Object.fromEntries(Object.entries(assignments).filter(([taskId]) => taskId !== id)));
    const retainedByReference = reference?.taskIds.includes(id);
    if (!retainedByReference) setAssumptions(assumptions.filter((taskId) => taskId !== id));
    if (dependentId === id) setDependent('');
    if (prerequisiteId === id) setPrerequisite('');
    invalidatePreview(`Removed ${title(id)}, ${draft.edges.length - edges.length} prerequisites from Plan B.${retainedByReference ? ' Its assumption remains editable for Plan A.' : ''}`);
  }

  return <>
    <section className="page-heading"><div>
      <p className="eyebrow">HYPOTHETICAL PLANNING</p>
      <h1 id="page-title" tabIndex={-1}>Mission Planning</h1>
      <p>Readiness reflects your assumptions. The draft is cleared when you leave or reload this view.</p>
    </div></section>
    <p><a href="#/office">Return to Office</a></p>
    <nav aria-label="Mission sections" className="filter-bar">
      {([
        ['Configure', 'mission-configure'],
        ['Readiness', 'mission-readiness'],
        ['Preview & Diagnostics', 'mission-preview-diagnostics'],
        ['Decision', 'mission-decision-title'],
      ] as const).map(([label, id]) => <button key={id} type="button" className="text-button"
        onClick={() => navigateMission(id)}>{label}</button>)}
    </nav>
    <p>Plan B is your editable draft. Plan A is its captured structural reference. Variant A and Variant B fill Scenario A and Scenario B in the same three-slot collection.</p>
    <p>{draft.taskIds.length} draft tasks · {Object.keys(scenarios.slots).length} captured scenarios · {preview ? `Preview step ${preview.events.length}` : 'Preview not started'}</p>
    <p>{preference
      ? `Local preference: Scenario ${preference.preferred.ref.slot}, revision ${preference.preferred.ref.revision}.`
      : 'No local preference recorded.'}</p>
    {preference && <button type="button" className="text-button"
      onClick={() => navigateMission('mission-recorded-evidence')}>View recorded evidence</button>}
    <h2 id="mission-configure" tabIndex={-1}>Configure</h2>
    <fieldset className="content-section"><legend>Select mission tasks</legend>
      {tasks.map(({ id, title: name }, index) => <p key={id}><label>
        <input ref={index === 0 ? chooser : undefined} type="checkbox" checked={draft.taskIds.includes(id)}
          onChange={(event) => toggleTask(id, event.target.checked)} /> {name}
      </label></p>)}
    </fieldset>
    <section className="content-section" aria-labelledby="mission-dependencies">
      <h2 id="mission-dependencies">Prerequisites</h2>
      <form className="filter-bar" onSubmit={(event) => {
        event.preventDefault();
        const next = { ...draft, edges: [...draft.edges, { prerequisiteId, dependentId }] };
        const error = validatePlan(next, catalog);
        if (error) { setNotice(error); return; }
        setDraft(next);
        invalidatePreview(`${title(dependentId)} requires ${title(prerequisiteId)}.`);
      }}>
        <label>Dependent task<select ref={dependent} value={dependentId} onChange={(event) => setDependent(event.target.value)}>
          <option value="">Choose task</option>{selected.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
        </select></label>
        <label>Required task<select value={prerequisiteId} onChange={(event) => setPrerequisite(event.target.value)}>
          <option value="">Choose prerequisite</option>{selected.map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
        </select></label>
        <button className="text-button" disabled={!dependentId || !prerequisiteId}>Add prerequisite</button>
      </form>
      <ul>{draft.edges.map((edge) => {
        const description = `${title(edge.dependentId)} requires ${title(edge.prerequisiteId)}`;
        return <li key={edge.dependentId + ':' + edge.prerequisiteId}>{description}{' '}
          <button type="button" className="text-button" aria-label={`Remove prerequisite: ${description}`} onClick={() => {
            dependent.current?.focus();
            setDraft({ ...draft, edges: draft.edges.filter((item) => item !== edge) });
            invalidatePreview(`Removed prerequisite: ${description}.`);
          }}>Remove</button>
        </li>;
      })}</ul>
    </section>
    <fieldset className="content-section"><legend>Hypothetical completion assumptions</legend>
      {assumptionTasks.map(({ id, title }) => <p key={id}><label>
        <input type="checkbox" checked={assumptions.includes(id)} onChange={(event) => {
          const next = event.target.checked ? [...assumptions, id] : assumptions.filter((item) => item !== id);
          const check = reference && comparePlans(reference, draft, next, catalog);
          const draftError = evaluatePlan(draft, next.filter((taskId) => draft.taskIds.includes(taskId)), catalog).error;
          const error = check?.reference.error ? `Plan A: ${check.reference.error}` : draftError && `Plan B: ${draftError}`;
          if (event.target.checked && error) { setNotice(error); return; }
          setAssumptions(next);
          if (draft.taskIds.includes(id)) invalidatePreview();
          else setNotice('');
        }} /> Assume complete: {title}{reference && (reference.taskIds.includes(id)
          ? draft.taskIds.includes(id) ? ' (Plan A and Plan B)' : ' (Plan A only)'
          : ' (Plan B only)')}
      </label></p>)}
    </fieldset>
    <p role="status">{notice}</p>
    <section className="content-section" aria-label="Plan B readiness">
      <h2>Plan B readiness</h2><Readiness result={evaluation} />
    </section>
    <div className="filter-bar">
      <button type="button" className="text-button" onClick={() => {
        setAssumptions(assumptions.filter((id) => draft.taskIds.includes(id)));
        setReference({ taskIds: [...draft.taskIds], edges: draft.edges.map((edge) => ({ ...edge })) });
        setNotice('Captured Plan A. Continue editing Plan B.');
      }}>Capture Plan A</button>
      <button type="button" className="text-button" onClick={() => {
        chooser.current?.focus();
        setDraft(empty); setAssumptions([]); setReference(undefined);
        setAssignments({}); setPreview(undefined);
        setDiagnosticTask(''); setScenarios(emptyScenarioCollection); setCriteria([]); setPreference(undefined);
        setDependent(''); setPrerequisite(''); setNotice('Mission reset.');
      }}>Reset mission</button>
    </div>
    {reference && comparison && <section className="content-section" aria-label="Plan comparison">
      <h2>Plan comparison</h2>
      <p>Both plans use the current completion assumptions for tasks they contain.</p>
      {comparison.equal && <p>Both plans have the same tasks, prerequisites and readiness.</p>}
      {(comparison.reference.error || comparison.draft.error) && <p role="status">Readiness comparison unavailable. {comparison.reference.error && `Plan A: ${comparison.reference.error}`} {comparison.draft.error && `Plan B: ${comparison.draft.error}`}</p>}
      <div className="analytics-charts">
        {([{ name: 'Plan A', plan: reference, other: draft, result: comparison.reference },
          { name: 'Plan B', plan: draft, other: reference, result: comparison.draft }]).map(({ name, plan, other, result }) =>
          <section key={name} aria-label={name}>
            <h3>{name}</h3>
            <p>Only in {name}: {catalog.filter((id) => plan.taskIds.includes(id) && !other.taskIds.includes(id)).map(title).join(', ') || 'None'}</p>
            <Prerequisites plan={plan} />
            {!comparison.reference.error && !comparison.draft.error && <Readiness result={result} />}
          </section>)}
      </div>
    </section>}
    <fieldset className="content-section"><legend>Proposed agent assignments</legend>
      <p>Choose one eligible fixture agent per task that needs simulated work.</p>
      <div className="filter-bar">{selected.map(({ id, title: name, agentIds }) => <label key={id}>
        Proposed agent for {name}<select value={assignments[id] ?? ''} onChange={(event) => {
          const agentId = event.target.value;
          if (agentId && !agentIds.some((eligible) => eligible === agentId)) return;
          if (agentId === (assignments[id] ?? '')) return;
          const next = { ...assignments };
          if (agentId) next[id] = agentId;
          else delete next[id];
          setAssignments(next);
          invalidatePreview();
        }}>
          <option value="">Choose agent</option>
          {agentIds.map((agentId) => <option key={agentId} value={agentId}>{findAgent(agentId)?.name}</option>)}
        </select>
      </label>)}</div>
      <button type="button" className="text-button" onClick={() => {
        try {
          setPreview(createMissionPreview(draft, applicableAssumptions, assignments));
          setNotice('Hypothetical mission preview started at step zero.');
        } catch (error) {
          setNotice(error instanceof Error ? error.message : 'Cannot start mission preview.');
        }
      }}>Start preview</button>
    </fieldset>
    <h2 id="mission-preview-diagnostics" tabIndex={-1}>Preview &amp; Diagnostics</h2>
    <p>Preview steps use a captured Plan B input. Editing Plan B clears this preview while keeping captured scenarios.</p>
    {preview && <MissionPreview state={preview}
      onStep={() => setPreview((state) => state && stepMissionPreview(state))}
      onReset={() => {
        setPreview((state) => state && resetMissionPreview(state));
        setNotice('Mission preview reset to step zero.');
      }} />}
    <section aria-labelledby="mission-readiness">
      <h2 id="mission-readiness" tabIndex={-1}>Readiness</h2>
      <MissionReadiness report={decision.draft} limitations={decision.limitations} />
    </section>
    <MissionDiagnostics
      input={input}
      comparison={decision.comparison}
      preview={preview}
      selectedId={diagnosticTask}
      onSelect={setDiagnosticTask}
      variantA={scenarios.slots.A?.input}
      variantB={scenarios.slots.B?.input}
      onCapture={capture} />
    <MissionDecision collection={scenarios} criteria={criteria} decision={preference}
      onCapture={capture}
      onLoad={(ref) => {
        const result = prepareScenarioDraft(scenarios, ref, reference, assumptions);
        if (!result.ok) { setNotice(result.message); return; }
        setDraft(result.input.plan);
        setAssignments(result.input.assignments);
        setAssumptions(result.assumptions);
        setPreview(undefined);
        setDependent(''); setPrerequisite('');
        setNotice(`Loaded Scenario ${ref.slot}, revision ${ref.revision}, into Plan B. Captures and local preference preserved.`);
        navigateMission('mission-configure');
      }}
      onRemove={(slot) => {
        setScenarios(removeScenario(scenarios, slot));
        clearPreference(`Removed Scenario ${slot}.`);
      }}
      onCriteria={(next) => {
        setCriteria(next);
        clearPreference('Planning criteria updated.');
      }}
      onRecord={(record) => {
        setPreference(record);
        setNotice(`Recorded local preference for Scenario ${record.preferred.ref.slot}.`);
      }} />
  </>;
}
