import { useMemo, useRef, useState } from 'react';
import { MissionReadiness } from '../mission/MissionReadiness';
import { createDecisionSummary } from '../mission/readiness';
import { MissionDiagnostics } from '../mission/MissionDiagnostics';
import { MissionDecision } from '../mission/MissionDecision';
import { captureScenario, emptyScenarioCollection, prepareSampleMission, prepareScenarioDraft, removeScenario, sampleMission } from '../mission/scenarios';
import type { DecisionRecord, PlanningCriterion, ScenarioRef, ScenarioSlot } from '../mission/scenarios';
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

export function MissionWorkspace({ dark = false, reducedMotion = false }: { dark?: boolean; reducedMotion?: boolean }) {
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
  const [scenarioNames, setScenarioNames] = useState<Partial<Record<ScenarioSlot, { revision: number; name: string }>>>({});
  const [preference, setPreference] = useState<DecisionRecord>();
  const applicableAssumptions = assumptions.filter((id) => draft.taskIds.includes(id));
  const input = { plan: draft, assumptions: applicableAssumptions, assignments };
  const decision = useMemo(() => createDecisionSummary(
    { plan: draft, assumptions: assumptions.filter((id) => draft.taskIds.includes(id)), assignments },
    scenarios.slots.A?.input, scenarios.slots.B?.input),
  [draft, assumptions, assignments, scenarios]);
  const [notice, setNotice] = useState('');
  const [confirmSample, setConfirmSample] = useState(false);
  const sampleLoader = useRef<HTMLButtonElement>(null);
  const chooser = useRef<HTMLInputElement>(null);
  const dependent = useRef<HTMLSelectElement>(null);
  const selected = tasks.filter(({ id }) => draft.taskIds.includes(id));
  const assumptionTasks = tasks.filter(({ id }) => draft.taskIds.includes(id) || reference?.taskIds.includes(id));
  const evaluation = evaluatePlan(draft, assumptions.filter((id) => draft.taskIds.includes(id)), catalog);
  const comparison = useMemo(() => reference && comparePlans(reference, draft, assumptions, catalog),
    [reference, draft, assumptions]);

  function clearScenarioName(slot: ScenarioSlot) {
    setScenarioNames((previous) => {
      const next = { ...previous };
      delete next[slot];
      return next;
    });
  }

  function saveScenarioName(ref: ScenarioRef, text: string) {
    if (scenarios.slots[ref.slot]?.ref.revision !== ref.revision) {
      setNotice('This scenario revision changed. Name the current capture.');
      return;
    }
    const name = text.trim();
    if (name.length > 60) {
      setNotice('Scenario name must be 60 characters or fewer. The saved name was preserved.');
      return;
    }
    if (name) setScenarioNames((previous) => ({ ...previous, [ref.slot]: { revision: ref.revision, name } }));
    else clearScenarioName(ref.slot);
    setNotice(name ? `Saved name for Scenario ${ref.slot}, revision ${ref.revision}.`
      : `Cleared name for Scenario ${ref.slot}, revision ${ref.revision}.`);
  }

  function navigateMission(id: string) {
    const destination = document.getElementById(id);
    destination?.focus({ preventScroll: true });
    destination?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  function loadSample() {
    const prepared = prepareSampleMission(reference, assumptions);
    if (!prepared.ok) { setNotice(prepared.message); return; }
    setDraft(prepared.input.plan);
    setAssignments(prepared.input.assignments);
    setAssumptions(prepared.assumptions);
    setPreview(undefined);
    setDependent(''); setPrerequisite(''); setDiagnosticTask('');
    setConfirmSample(false);
    setNotice('Sample mission loaded into editable Plan B. Review Configure, then start a hypothetical preview and capture a scenario. Existing Plan A, captures and local preference were preserved.');
    navigateMission('mission-configure');
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
    clearScenarioName(slot);
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
    <section className="content-section" aria-labelledby="mission-sample-title">
      <h2 id="mission-sample-title">Try a sample mission</h2>
      <p>Explore a synthetic workspace planning example. Nothing is executed or saved outside this view.</p>
      <ul>{sampleMission.plan.taskIds.map((id) => <li key={id}>
        {title(id)} · {findAgent(sampleMission.assignments[id])?.name}
      </li>)}</ul>
      <p>Map rooms to team context requires Shape the workspace layout. Trace keyboard navigation is independent. No tasks are assumed complete.</p>
      <p>Load into Configure → Start preview → Capture Variant A or B → Compare in Decision. You can edit the sample before capturing.</p>
      <button ref={sampleLoader} type="button" className="text-button" aria-expanded={confirmSample}
        aria-controls="mission-sample-confirm" onClick={() => {
          if (draft.taskIds.length || draft.edges.length || Object.keys(assignments).length) setConfirmSample(true);
          else loadSample();
        }}>Load sample mission</button>
      <div hidden={!confirmSample} id="mission-sample-confirm" role="group" aria-labelledby="mission-sample-confirm-title">
        <h3 id="mission-sample-confirm-title">Replace editable Plan B?</h3>
        <p>This replaces draft tasks, prerequisites, assignments and shared completion assumptions, and clears the current preview. Plan A, captured scenarios, their names, criteria and recorded preference stay unchanged. Conflicting Plan A assumptions will prevent loading.</p>
        <button type="button" className="text-button" onClick={loadSample}>Replace Plan B with sample</button>{' '}
        <button type="button" className="text-button" onClick={() => {
          setConfirmSample(false); sampleLoader.current?.focus();
        }}>Cancel sample replacement</button>
      </div>
    </section>
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
        setDiagnosticTask(''); setScenarioNames({}); setScenarios(emptyScenarioCollection); setCriteria([]); setPreference(undefined);
        setDependent(''); setPrerequisite(''); setConfirmSample(false); setNotice('Mission reset.');
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
    {preview && <MissionPreview state={preview} dark={dark} reducedMotion={reducedMotion}
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
      scenarioNames={scenarioNames} onSaveName={saveScenarioName}
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
        clearScenarioName(slot);
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
