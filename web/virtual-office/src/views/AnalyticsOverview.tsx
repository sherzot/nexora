import { useEffect, useMemo, useRef, useState } from 'react';
import { agents } from '../demo/fixtures';
import { useSimulation } from '../simulation/SimulationProvider';
import { virtualTime } from '../simulation/selectors';
import { activityOrder, definitions } from '../analytics/model';
import { deriveMetrics, percent } from '../analytics/metrics';
import { compareScenarios } from '../analytics/comparison';
import { createReport, reportCsv, reportJson } from '../analytics/export';

export function AnalyticsOverview() {
  const { view, selectedId } = useSimulation();
  const [agentId, setAgentId] = useState('');
  const [horizon, setHorizon] = useState('current');
  const [notice, setNotice] = useState('');
  const url = useRef<string | undefined>(undefined);
  useEffect(() => () => { if (url.current) URL.revokeObjectURL(url.current); }, []);
  const metrics = useMemo(() => deriveMetrics(view.snapshot, agentId), [view.snapshot, agentId]);
  const ticks = horizon === 'current' ? view.snapshot.tick : Number(horizon);
  const comparison = useMemo(() => compareScenarios(view.snapshot.seed, ticks, agentId), [view.snapshot.seed, ticks, agentId]);
  const download = (format: 'json' | 'csv') => {
    const report = createReport(metrics, comparison);
    const contents = format === 'json' ? reportJson(report) : reportCsv(report);
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = URL.createObjectURL(new Blob([contents], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url.current; link.download = `nexora-synthetic-analytics.${format}`; link.click();
    setNotice(`${format.toUpperCase()} report prepared at ${virtualTime(metrics.virtualMs)}. Comparison horizon: ${ticks} ticks.`);
  };
  return <>
    <section className="page-heading"><div><p className="eyebrow">READ-ONLY / VIRTUAL TIME</p><h1 id="page-title" tabIndex={-1}>Simulation Analytics</h1><p className="page-description">Synthetic scenario metrics, not employee productivity or operational telemetry.</p></div><span className="quiet-label">Seed {metrics.seed} · {virtualTime(metrics.virtualMs)}</span></section>
    <div className="filter-bar"><label>Analytics agent<select value={agentId} onChange={(event) => setAgentId(event.target.value)}><option value="">All eight synthetic agents</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label><button className="text-button" onClick={() => setAgentId(selectedId)}>Use selected agent</button><button className="secondary-button" onClick={() => download('json')}>Export JSON</button><button className="secondary-button" onClick={() => download('csv')}>Export CSV</button></div>
    <p role="status" className="scope-note">{notice || (!metrics.virtualMs ? 'No virtual time observed yet. Start or step the simulation; comparison is available independently.' : `Observed ${metrics.virtualMs} ms per agent. Filters affect analytics only.`)}</p>
    {!metrics.historyComplete && <p role="alert">Incomplete event history: retained event counts are available; duration and utilization estimates are not.</p>}
    <div className="analytics-kpis" aria-label="Synthetic simulation summary">
      {[[metrics.historyComplete ? 'Simulated events' : 'Retained events', metrics.totalEvents], ['Active / eligible agent-ms', `${metrics.activeMs ?? '—'} / ${metrics.eligibleAgentMs}`], ['Synthetic utilization', percent(metrics.utilizationBps)], ['Task completion', `${metrics.completedTasks} / ${metrics.taskCount} · ${percent(metrics.completionBps)}`], ['Scenario progress', percent(metrics.progressBps)], ['Inactive agent-ms', metrics.inactiveMs ?? '—']].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
    </div>
    <div className="analytics-charts">
      <section aria-labelledby="analytics-status"><h2 id="analytics-status">Current activity distribution</h2><svg viewBox="0 0 360 190" role="img" aria-label={activityOrder.map((activity) => `${activity}: ${metrics.statusCounts[activity]}`).join(', ')}>{activityOrder.map((activity, index) => <g key={activity}><text x="0" y={index * 30 + 18}>{activity}</text><rect x="115" y={index * 30 + 5} width={metrics.agentIds.length ? metrics.statusCounts[activity] / metrics.agentIds.length * 190 : 0} height="17" rx="3" className={`analytics-bar ${activity}`} /><text x="325" y={index * 30 + 18}>{metrics.statusCounts[activity]}</text></g>)}</svg></section>
      <section aria-labelledby="analytics-zones"><h2 id="analytics-zones">Logical zone attribution</h2><ul className="analytics-zones">{metrics.zones.map((zone) => <li key={zone.id}><span>{zone.name}</span><strong>{percent(zone.shareBps)}</strong>{zone.shareBps === null ? <small>Time share unavailable</small> : <meter min="0" max="10000" value={zone.shareBps} aria-label={`${zone.name} share of eligible agent time`} />}<small>{zone.durationMs ?? '—'} agent-ms · {zone.events} events</small></li>)}</ul></section>
    </div>
    <section className="content-section"><h2>Agent activity breakdown</h2><div className="analytics-table-wrap"><table className="analytics-table"><caption>Durations are virtual milliseconds; utilization uses the full observed horizon.</caption><thead><tr><th scope="col">Agent</th><th scope="col">Events</th><th scope="col">Active ms</th><th scope="col">Eligible ms</th><th scope="col">Utilization</th><th scope="col">Time by activity</th></tr></thead><tbody>{metrics.agents.map((agent) => <tr key={agent.id}><th scope="row">{agent.name}</th><td>{agent.events}</td><td>{agent.activeMs ?? '—'}</td><td>{agent.eligibleMs}</td><td>{percent(agent.utilizationBps)}</td><td><details><summary>Activity times</summary><dl>{activityOrder.map((activity) => <div key={activity}><dt>{activity}</dt><dd>{agent.durationMs?.[activity] ?? '—'} ms</dd></div>)}</dl></details></td></tr>)}</tbody></table></div></section>
    <section className="content-section"><h2>Synthetic task statistics</h2><p className="section-description">Distinct fixture tasks linked to the selected agents. Unassigned examples remain in the denominator.</p><ul className="analytics-tasks">{metrics.tasks.map((task) => <li key={task.id}><span>{task.title}</span><strong>{task.status}</strong></li>)}</ul></section>
    <section className="content-section" aria-labelledby="comparison-title"><div className="section-heading"><h2 id="comparison-title">Scenario comparison</h2><label>Comparison horizon<select value={horizon} onChange={(event) => setHorizon(event.target.value)}><option value="current">Current virtual tick</option>{[0, 8, 16, 24, 32].map((tick) => <option key={tick} value={tick}>{tick} ticks · {tick * 500} ms</option>)}</select></label></div><p className="section-description">Same seed {metrics.seed}, agent scope and {ticks}-tick horizon. Independent local evaluation; current playback is not changed. Equal totals are expected where scenarios share durations.</p><div className="analytics-comparison">{comparison.map((item) => <article key={item.scenario}><h3>{item.name}</h3><dl><div><dt>Events</dt><dd>{item.totalEvents}</dd></div><div><dt>Utilization</dt><dd>{percent(item.utilizationBps)}</dd></div><div><dt>Task completion</dt><dd>{item.completedTasks}/{item.taskCount} · {percent(item.completionBps)}</dd></div>{item.zones.map((zone) => <div key={zone.id}><dt>{zone.name}</dt><dd>{percent(zone.shareBps)}</dd></div>)}</dl></article>)}</div></section>
    <details className="analytics-definitions"><summary>Metric definitions and comparability</summary><dl>{definitions.map((definition) => <div key={definition.id}><dt>{definition.id}</dt><dd>{definition.text}</dd></div>)}</dl><p>No observed horizon or incomplete history means utilization is unavailable (—), not zero. Zone shares may sum to slightly different than 100% after independent rounding. No paused wall-clock time is counted.</p></details>
  </>;
}
