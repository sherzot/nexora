import { agents } from '../demo/fixtures';
import type { OfficeTone } from '../office/presentation';
import type { MissionPreviewState } from './preview';

const tones = { Active: 'active', Blocked: 'blocked', Ready: 'ready', Completed: 'completed', 'Assumed complete': 'assumed' } as const;
const priority = ['Active', 'Blocked', 'Ready', 'Completed', 'Assumed complete'] as const;

export function projectMissionOffice(state: MissionPreviewState) {
  return {
    agents: agents.map((agent) => {
      const tasks = state.tasks.filter(({ id }) => state.input.assignments[id] === agent.id)
        .map((task) => ({ ...task, unmet: [...task.unmet] }));
      const status = priority.find((status) => tasks.some((task) => task.status === status));
      const tone: OfficeTone = status ? tones[status] : 'neutral';
      return { id: agent.id, label: status ?? 'Not assigned', tone, tasks };
    }),
    // Assumed-complete tasks need not have an agent; keep them visible without inventing one.
    unassigned: state.tasks.filter(({ id }) => !state.input.assignments[id])
      .map((task) => ({ ...task, unmet: [...task.unmet] })),
  };
}
