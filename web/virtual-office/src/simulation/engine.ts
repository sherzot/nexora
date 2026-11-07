import { agents, tasks } from '../demo/fixtures';
import type { TaskStatus } from '../demo/model';
import { createPlans, homePosition } from './scenarios';
import { END_TICK, HISTORY_LIMIT, TICK_MS } from './model';
import type { Activity, Position, ScenarioId, SimEvent, Snapshot } from './model';
const allowed: Record<Activity, readonly Activity[]> = {
  idle: ['moving'], moving: ['working', 'collaborating'], working: ['reviewing', 'completed'],
  collaborating: ['working'], reviewing: ['completed'], completed: [],
};
export function validateTransition(from: Activity, to: Activity): void {
  if (from !== to && !allowed[from].includes(to)) throw new Error(`Invalid synthetic transition: ${from} → ${to}`);
}
export function positionOnPath(path: readonly Position[], progress: number): Position {
  if (!path.length || !Number.isFinite(progress)) throw new Error('Invalid synthetic path');
  const lengths = path.slice(1).map((point, i) => Math.hypot(point.x - path[i].x, point.z - path[i].z));
  const total = lengths.reduce((sum, n) => sum + n, 0);
  let remaining = Math.min(1, Math.max(0, progress)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i] > 0) {
      const t = remaining / lengths[i];
      return { x: path[i].x + (path[i + 1].x - path[i].x) * t, z: path[i].z + (path[i + 1].z - path[i].z) * t };
    }
    remaining -= lengths[i];
  }
  return { ...path[path.length - 1] };
}
export function initialSnapshot(scenario: ScenarioId = 'day', seed = 42): Snapshot {
  if (!['day', 'collaboration', 'review'].includes(scenario) || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid synthetic scenario or seed');
  const plans = createPlans(scenario, seed);
  return { scenario, seed, tick: 0, virtualMs: 0, active: false, plans, events: [],
    agents: agents.map((agent, index) => ({ id: agent.id, activity: 'idle', zoneId: agent.roomId, taskId: plans[index].taskId, position: homePosition(agent) })),
    taskStates: Object.fromEntries(tasks.map((task) => [task.id, 'Planned'])) };
}
export function stepSnapshot(previous: Snapshot): Snapshot {
  if (previous.tick >= END_TICK) return previous;
  const tick = previous.tick + 1;
  const pending: SimEvent[] = [];
  const nextAgents = previous.agents.map((agent, index) => {
    const plan = previous.plans[index];
    const elapsed = tick - plan.start;
    let activity: Activity = 'idle';
    if (elapsed >= 0) {
      if (elapsed < 8) activity = 'moving';
      else if (elapsed < (previous.scenario === 'review' ? 12 : 16)) activity = previous.scenario === 'collaboration' ? 'collaborating' : 'working';
      else if (elapsed < 20) activity = previous.scenario === 'collaboration' ? 'working' : 'reviewing';
      else activity = 'completed';
    }
    validateTransition(agent.activity, activity);
    const zoneId = elapsed >= 8 ? plan.zoneId : agent.zoneId;
    if (activity !== agent.activity) pending.push({ id: `sim-${previous.scenario}-${previous.seed}-${tick}-${agent.id}-${activity}`, tick,
      virtualMs: tick * TICK_MS, sequence: 0, agentId: agent.id, activity, zoneId, taskId: agent.taskId });
    return { ...agent, activity, zoneId, position: elapsed < 0 ? agent.position : positionOnPath(plan.path, Math.min(1, (elapsed + 1) / 8)) };
  });
  const events = [...previous.events, ...pending.map((event, index) => ({ ...event, sequence: (previous.events.at(-1)?.sequence ?? 0) + index + 1 }))].slice(-HISTORY_LIMIT);
  const taskStates: Record<string, TaskStatus> = {};
  for (const task of tasks) {
    const participants = nextAgents.filter((agent) => agent.taskId === task.id);
    taskStates[task.id] = participants.length && participants.every((agent) => agent.activity === 'completed') ? 'Done'
      : participants.some((agent) => agent.activity === 'reviewing') ? 'In review'
      : participants.some((agent) => ['working', 'collaborating', 'completed'].includes(agent.activity)) ? 'In progress' : 'Planned';
  }
  return { ...previous, active: true, tick, virtualMs: tick * TICK_MS, agents: nextAgents, events, taskStates };
}
