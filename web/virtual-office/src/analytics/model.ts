import type { Activity, ScenarioId } from '../simulation/model';
export const activityOrder: readonly Activity[] = ['idle', 'moving', 'working', 'collaborating', 'reviewing', 'completed'];
export interface AgentMetrics {
  readonly id: string; readonly name: string; readonly events: number; readonly status: Activity | null;
  readonly durationMs: Readonly<Record<Activity, number>> | null;
  readonly activeMs: number | null; readonly eligibleMs: number; readonly utilizationBps: number | null;
}
export interface Metrics {
  readonly scenario: ScenarioId; readonly seed: number; readonly tick: number; readonly virtualMs: number;
  readonly agentIds: readonly string[]; readonly historyComplete: boolean; readonly totalEvents: number;
  readonly agents: readonly AgentMetrics[]; readonly activeMs: number | null; readonly inactiveMs: number | null;
  readonly eligibleAgentMs: number; readonly utilizationBps: number | null;
  readonly statusCounts: Readonly<Record<Activity, number>>;
  readonly zones: readonly { id: string; name: string; durationMs: number | null; events: number; shareBps: number | null }[];
  readonly tasks: readonly { id: string; title: string; status: string }[];
  readonly completedTasks: number; readonly taskCount: number; readonly completionBps: number | null;
  readonly progressBps: number;
}
export const definitions = [
  { id: 'time', text: 'Integer milliseconds. State at tick k governs [k×500, (k+1)×500). The current tick is right-censored; no paused wall time is counted.' },
  { id: 'eligible', text: 'Observed virtual milliseconds × number of selected fixture agents. At zero horizon, utilization and zone shares are unavailable.' },
  { id: 'active', text: 'Moving + working + collaborating + reviewing durations. Idle and completed durations are inactive. These are synthetic activity labels, not employee productivity.' },
  { id: 'utilization', text: 'Active agent-ms / eligible agent-ms. Percentages are nearest integer basis points (half up), displayed with two decimal places.' },
  { id: 'completion', text: 'Done task states / distinct fixture tasks linked to selected agents. All-agent scope includes all eight fixture tasks, including unassigned examples.' },
  { id: 'zone', text: 'Agent-ms attributed to logical zoneId, not interpolated GPU coordinates; moving time belongs to the last authoritative zone until arrival.' },
  { id: 'events', text: 'Retained synthetic activity-change records for the selected agents. Incomplete history is flagged; durations are unavailable rather than inferred.' },
  { id: 'progress', text: 'Current tick / 32. Comparison scenarios use the same seed, selected agents and explicit horizon, never the live controller.' },
] as const;
