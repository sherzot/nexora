import { agents, rooms, tasks } from '../demo/fixtures';
import { END_TICK, TICK_MS } from '../simulation/model';
import type { Activity, Snapshot } from '../simulation/model';
import { activityOrder } from './model';
import type { Metrics } from './model';
export const basisPoints = (value: number, total: number): number | null => total > 0 ? Math.floor((value * 10000 + Math.floor(total / 2)) / total) : null;
export const percent = (bps: number | null): string => bps === null ? '—' : `${Math.floor(bps / 100)}.${String(bps % 100).padStart(2, '0')}%`;
const emptyDurations = (): Record<Activity, number> => ({ idle: 0, moving: 0, working: 0, collaborating: 0, reviewing: 0, completed: 0 });
export function deriveMetrics(snapshot: Snapshot, agentId = ''): Metrics {
  if (!Number.isInteger(snapshot.tick) || snapshot.tick < 0 || snapshot.tick > END_TICK || snapshot.virtualMs !== snapshot.tick * TICK_MS) throw new Error('Invalid analytics virtual clock');
  const selected = agents.filter((agent) => !agentId || agent.id === agentId);
  const ids = new Set<string>(selected.map((agent) => agent.id));
  const events = [...snapshot.events].sort((a, b) => a.tick - b.tick || a.sequence - b.sequence || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const historyComplete = snapshot.agents.length === agents.length && new Set(snapshot.agents.map((agent) => agent.id)).size === agents.length && events.every((event, i) => event.sequence === i + 1 && activityOrder.includes(event.activity) && event.tick >= 0 && event.tick <= snapshot.tick && Number.isInteger(event.tick) && event.virtualMs === event.tick * TICK_MS && agents.some((agent) => agent.id === event.agentId) && rooms.some((room) => room.id === event.zoneId))
    && snapshot.agents.every((agent) => {
      const last = events.filter((event) => event.agentId === agent.id).at(-1);
      return (last?.activity ?? 'idle') === agent.activity && (last?.zoneId ?? agents.find((item) => item.id === agent.id)?.roomId) === agent.zoneId;
    });
  const zoneTotals = new Map(rooms.map((room) => [room.id, 0]));
  const durationByAgent = selected.map((fixture) => {
    const durations = emptyDurations(); let activity: Activity = 'idle', zone = fixture.roomId, tick = 0;
    const own = events.filter((event) => event.agentId === fixture.id);
    const accumulate = (end: number) => { const ms = (end - tick) * TICK_MS; durations[activity] += ms; zoneTotals.set(zone, (zoneTotals.get(zone) ?? 0) + ms); };
    if (historyComplete) {
      for (const event of own) { accumulate(event.tick); tick = event.tick; activity = event.activity; zone = event.zoneId; }
      accumulate(snapshot.tick);
    }
    const activeMs = historyComplete ? durations.moving + durations.working + durations.collaborating + durations.reviewing : null;
    return { id: fixture.id, name: fixture.name, events: own.length, status: snapshot.agents.find((agent) => agent.id === fixture.id)?.activity ?? null,
      durationMs: historyComplete ? durations : null, activeMs, eligibleMs: snapshot.tick * TICK_MS, utilizationBps: activeMs === null ? null : basisPoints(activeMs, snapshot.tick * TICK_MS) };
  });
  const activeMs = historyComplete ? durationByAgent.reduce((sum, agent) => sum + (agent.activeMs ?? 0), 0) : null;
  const eligibleAgentMs = selected.length * snapshot.tick * TICK_MS;
  const scopedTasks = tasks.filter((task) => task.agentIds.some((id) => ids.has(id))).map((task) => ({ id: task.id, title: task.title, status: String(snapshot.taskStates[task.id] ?? 'Unknown') }));
  const statusCounts = emptyDurations(); for (const agent of durationByAgent) if (agent.status) statusCounts[agent.status]++;
  const completedTasks = scopedTasks.filter((task) => task.status === 'Done').length;
  return { scenario: snapshot.scenario, seed: snapshot.seed, tick: snapshot.tick, virtualMs: snapshot.tick * TICK_MS,
    agentIds: selected.map((agent) => agent.id), historyComplete, totalEvents: events.filter((event) => ids.has(event.agentId)).length,
    agents: durationByAgent, activeMs, inactiveMs: activeMs === null ? null : eligibleAgentMs - activeMs, eligibleAgentMs,
    utilizationBps: activeMs === null ? null : basisPoints(activeMs, eligibleAgentMs), statusCounts,
    zones: rooms.map((room) => ({ id: room.id, name: room.name, durationMs: historyComplete ? zoneTotals.get(room.id)! : null,
      events: events.filter((event) => ids.has(event.agentId) && event.zoneId === room.id).length,
      shareBps: historyComplete ? basisPoints(zoneTotals.get(room.id)!, eligibleAgentMs) : null })),
    tasks: scopedTasks, completedTasks, taskCount: scopedTasks.length, completionBps: scopedTasks.some((task) => task.status === 'Unknown') ? null : basisPoints(completedTasks, scopedTasks.length), progressBps: basisPoints(snapshot.tick, END_TICK)!,
  };
}
