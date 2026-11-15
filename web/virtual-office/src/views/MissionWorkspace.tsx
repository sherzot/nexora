import { useRef, useState } from 'react';
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
  const [notice, setNotice] = useState('');
  const chooser = useRef<HTMLInputElement>(null);
  const dependent = useRef<HTMLSelectElement>(null);
  const selected = tasks.filter(({ id }) => draft.taskIds.includes(id));
  const evaluation = evaluatePlan(draft, assumptions, catalog);
  const comparison = reference && comparePlans(reference, draft, assumptions, catalog);

  function toggleTask(id: string, checked: boolean) {
    if (checked) {
      setDraft({ ...draft, taskIds: [...draft.taskIds, id] });
      setNotice('');
      return;
    }
    const edges = draft.edges.filter((edge) => edge.dependentId !== id && edge.prerequisiteId !== id);
    setDraft({ taskIds: draft.taskIds.filter((taskId) => taskId !== id), edges });
    setAssumptions(assumptions.filter((taskId) => taskId !== id));
    if (dependentId === id) setDependent('');
    if (prerequisiteId === id) setPrerequisite('');
    setNotice(`Removed ${title(id)}, ${draft.edges.length - edges.length} prerequisites and its completion assumption if set.`);
  }

  return <>
    <section className="page-heading"><div>
      <p className="eyebrow">HYPOTHETICAL PLANNING</p>
      <h1 id="page-title" tabIndex={-1}>Mission Planning</h1>
      <p>Readiness reflects your assumptions. The draft is cleared when you leave or reload this view.</p>
    </div></section>
    <p><a href="#/office">Return to Office</a></p>
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
        setNotice(`${title(dependentId)} requires ${title(prerequisiteId)}.`);
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
            setNotice(`Removed prerequisite: ${description}.`);
          }}>Remove</button>
        </li>;
      })}</ul>
    </section>
    <fieldset className="content-section"><legend>Hypothetical completion assumptions</legend>
      {selected.map(({ id, title }) => <p key={id}><label>
        <input type="checkbox" checked={assumptions.includes(id)} onChange={(event) => {
          const next = event.target.checked ? [...assumptions, id] : assumptions.filter((item) => item !== id);
          const result = evaluatePlan(draft, next, catalog);
          if (event.target.checked && result.error) { setNotice(result.error); return; }
          setAssumptions(next);
          setNotice('');
        }} /> Assume complete: {title}
      </label></p>)}
    </fieldset>
    <p role="status">{notice}</p>
    <section className="content-section" aria-label="Plan B readiness">
      <h2>Plan B readiness</h2><Readiness result={evaluation} />
    </section>
    <div className="filter-bar">
      <button type="button" className="text-button" onClick={() => {
        setReference({ taskIds: [...draft.taskIds], edges: draft.edges.map((edge) => ({ ...edge })) });
        setNotice('Captured Plan A. Continue editing Plan B.');
      }}>Capture Plan A</button>
      <button type="button" className="text-button" onClick={() => {
        chooser.current?.focus();
        setDraft(empty); setAssumptions([]); setReference(undefined);
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
  </>;
}
