import { TICK_MS } from '../simulation/model';
import { activityOrder, definitions } from './model';
import type { Metrics } from './model';
export function createReport(metrics: Metrics, comparison: readonly Metrics[]) {
  if (comparison.some((item) => item.seed !== metrics.seed || item.tick !== comparison[0].tick || JSON.stringify(item.agentIds) !== JSON.stringify(metrics.agentIds))) throw new Error('Incomparable report inputs');
  return { schemaVersion: 1, kind: 'nexora-synthetic-simulation-analytics', scenario: metrics.scenario, seed: metrics.seed,
    horizon: { tick: metrics.tick, tickMs: TICK_MS, virtualMs: metrics.virtualMs }, scope: { agentIds: metrics.agentIds },
    definitions, metrics, comparison };
}
export const reportJson = (report: ReturnType<typeof createReport>): string => JSON.stringify(report, null, 2) + '\n';
export function csvCell(value: string | number | null): string {
  let text = value === null ? '' : String(value);
  if (typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
export function reportCsv(report: ReturnType<typeof createReport>): string {
  const headers = ['schema_version', 'record', 'scenario', 'seed', 'horizon_ticks', 'tick_ms', 'scope_agent_ids', 'agent_id', 'name', 'activity', 'zone_id', 'events', 'duration_ms', 'active_ms', 'eligible_ms', 'utilization_bps', 'share_bps', 'completed_tasks', 'task_count', 'completion_bps', 'progress_bps', 'definition', 'value'] as const;
  type Row = Partial<Record<typeof headers[number], string | number | null>>;
  const rows: Row[] = [];
  const append = (metrics: Metrics, comparison: boolean) => {
    const base = { schema_version: 1, scenario: metrics.scenario, seed: metrics.seed, horizon_ticks: metrics.tick, tick_ms: TICK_MS, scope_agent_ids: metrics.agentIds.join('|') };
    rows.push({ ...base, record: comparison ? 'comparison' : 'summary', events: metrics.totalEvents, active_ms: metrics.activeMs, eligible_ms: metrics.eligibleAgentMs,
      utilization_bps: metrics.utilizationBps, completed_tasks: metrics.completedTasks, task_count: metrics.taskCount, completion_bps: metrics.completionBps, progress_bps: metrics.progressBps,
      definition: 'history_complete', value: String(metrics.historyComplete) });
    if (!comparison) for (const agent of metrics.agents) {
      rows.push({ ...base, record: 'agent', agent_id: agent.id, name: agent.name, events: agent.events, active_ms: agent.activeMs, eligible_ms: agent.eligibleMs, utilization_bps: agent.utilizationBps });
      for (const activity of activityOrder) rows.push({ ...base, record: 'activity', agent_id: agent.id, name: agent.name, activity, duration_ms: agent.durationMs?.[activity] ?? null });
    }
    for (const zone of metrics.zones) rows.push({ ...base, record: comparison ? 'comparison_zone' : 'zone', zone_id: zone.id, name: zone.name, events: zone.events, duration_ms: zone.durationMs, share_bps: zone.shareBps });
    if (!comparison) for (const task of metrics.tasks) rows.push({ ...base, record: 'task', name: task.title, definition: task.id, value: task.status });
  };
  append(report.metrics, false);
  for (const metrics of report.comparison) append(metrics, true);
  for (const definition of definitions) rows.push({ schema_version: 1, record: 'definition', definition: definition.id, value: definition.text });
  return [headers.join(','), ...rows.map((row) => headers.map((key) => csvCell(row[key] ?? null)).join(','))].join('\r\n') + '\r\n';
}
