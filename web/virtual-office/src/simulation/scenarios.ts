import { agents, rooms, tasks } from '../demo/fixtures';
import type { DemoAgent } from '../demo/model';
import type { AgentPlan, Position, ScenarioId } from './model';
export const scenarios: readonly { id: ScenarioId; name: string; description: string }[] = [
  { id: 'day', name: 'Normal Office Day', description: 'Move to a work area, work, review and complete demo tasks.' },
  { id: 'collaboration', name: 'Team Collaboration', description: 'Meet in Product studio, collaborate and finish a shared exercise.' },
  { id: 'review', name: 'Review Workflow Demonstration', description: 'Prepare, review and complete synthetic task examples.' },
];
export const homePosition = (agent: DemoAgent): Position => ({ x: 2.4 * (agent.desk.x + 0.6) - 12, z: 2.4 * (agent.desk.y + 0.4) - 8.4 + 1.5 });
export function createPlans(scenario: ScenarioId, seed: number): readonly AgentPlan[] {
  let random = seed >>> 0;
  const next = () => { random = (Math.imul(random, 1664525) + 1013904223) >>> 0; return random; };
  return agents.map((agent, index) => {
    const room = rooms.find((item) => item.id === agent.roomId)!;
    const destination = scenario === 'collaboration' ? rooms[0] : scenario === 'review' ? rooms[2] : room;
    const linkedTasks = tasks.filter((task) => task.agentIds.includes(agent.id));
    const start = 1 + next() % 4;
    const taskId = linkedTasks[next() % linkedTasks.length].id;
    const x = scenario === 'day' ? 2.4 * (destination.x + 1 + index % 2 * 2) - 12 : -10 + index * 1.1;
    const z = 2.4 * (destination.y + destination.depth) - 8.4 - 0.6;
    const exitX = 2.4 * (room.x + room.width) - 12 - 0.35;
    const entryX = 2.4 * (destination.x + destination.width) - 12 - 0.35;
    const home = homePosition(agent);
    return { id: agent.id, taskId, zoneId: destination.id, start,
      path: [home, { x: exitX, z: home.z }, { x: exitX, z: 0.36 }, { x: entryX, z: 0.36 }, { x: entryX, z }, { x, z }] };
  });
}
