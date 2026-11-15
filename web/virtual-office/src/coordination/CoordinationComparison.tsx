import { useRef, useState } from 'react';
import { interactionLabels } from '../collaboration/projection';
import { findAgent } from '../demo/selectors';
import type { Snapshot } from '../simulation/model';
import { scenarios } from '../simulation/scenarios';
import { virtualTime } from '../simulation/selectors';
import { compareCoordination } from './preview';

export function CoordinationComparison({ snapshot, taskId }: { snapshot: Snapshot; taskId: string }) {
  const [result, setResult] = useState<ReturnType<typeof compareCoordination>>();
  const chooser = useRef<HTMLSelectElement>(null);
  const name = (id: string) => scenarios.find((scenario) => scenario.id === id)?.name;
  const participants = (ids: readonly string[]) => ids.map((id) => findAgent(id)?.name).join(', ') || 'No planned participants';
  return <section className="content-section" aria-labelledby="coordination-title">
    <h2 id="coordination-title">Compare coordination scenarios</h2>
    <p>Compare predefined scenarios at the current tick. Preview results stay separate from playback.</p>
    <div className="filter-bar">
      <label>Alternative scenario<select ref={chooser} value={result?.alternative ?? ''} onChange={(event) => {
        const scenario = scenarios.find(({ id }) => id === event.target.value);
        setResult(scenario ? compareCoordination(snapshot, taskId, scenario.id) : undefined);
      }}>
        <option value="">Choose an alternative</option>
        {scenarios.filter(({ id }) => id !== snapshot.scenario).map(({ id, name: label }) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <button type="button" className="text-button" disabled={!result} onClick={() => {
        chooser.current?.focus();
        setResult(undefined);
      }}>Reset preview</button>
    </div>
    <p role="status">{result ? `Comparison captured at tick ${result.tick}, seed ${result.seed}.` : 'No preview selected.'}</p>
    {result && <>
      {result.equal && <p>Both scenarios show the same task outcome at this tick.</p>}
      <div className="analytics-charts">
        <section aria-label="Observed playback">
          <h3>Observed playback · {name(result.scenario)}</h3>
          <p>{result.observed.status} · {participants(result.observed.participants)}</p>
          {result.observed.interactions.length ? <ol>{result.observed.interactions.map((item) => <li key={item.id}>
            <a href={`#/activity?interaction=${encodeURIComponent(item.id)}`}>{interactionLabels[item.type]} at {virtualTime(item.evidence!.virtualMs)}</a>
            {' · '}{findAgent(item.source)?.name} → {findAgent(item.target)?.name}
          </li>)}</ol> : <p>No observed interactions at this tick.</p>}
        </section>
        <section aria-label="Hypothetical preview">
          <h3>Hypothetical preview · {name(result.alternative)}</h3>
          <p>{result.hypothetical.status} · {participants(result.hypothetical.participants)}</p>
          {result.hypothetical.interactions.length ? <ol>{result.hypothetical.interactions.map((item) => <li key={item.id}>
            {interactionLabels[item.type]} at {virtualTime(item.virtualMs)} · {findAgent(item.source)?.name} → {findAgent(item.target)?.name}
          </li>)}</ol> : <p>No hypothetical interactions at this tick.</p>}
        </section>
      </div>
    </>}
  </section>;
}
