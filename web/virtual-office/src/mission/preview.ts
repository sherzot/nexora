import { tasks as fixtures } from '../demo/fixtures';
import { evaluatePlan } from './plan';
import type { MissionPlan } from './plan';

const catalog = fixtures.map(({ id }) => id);
type Status = 'Ready' | 'Blocked' | 'Active' | 'Completed' | 'Assumed complete';

interface PreviewTask {
  readonly id: string;
  readonly status: Status;
  readonly unmet: readonly string[];
}

interface PreviewEvent {
  readonly step: number;
  readonly taskId: string;
  readonly agentId: string;
  readonly type: 'started' | 'completed';
  readonly provenance: 'hypothetical';
}

export interface MissionPreviewState {
  readonly input: {
    readonly plan: MissionPlan;
    readonly assumptions: readonly string[];
    readonly assignments: Readonly<Record<string, string>>;
  };
  readonly tasks: readonly PreviewTask[];
  readonly events: readonly PreviewEvent[];
  readonly terminal: boolean;
}

const complete = (status: Status) => status === 'Completed' || status === 'Assumed complete';

export function createMissionPreview(plan: MissionPlan, assumptions: readonly string[], assignments: Readonly<Record<string, string>>): MissionPreviewState {
  if (!plan.taskIds.length) throw new Error('Select at least one task before starting the preview.');
  const evaluation = evaluatePlan(plan, assumptions, catalog);
  if (evaluation.error) throw new Error(evaluation.error);
  for (const [id, agent] of Object.entries(assignments)) {
    const fixture = fixtures.find((task) => task.id === id);
    if (!fixture || !plan.taskIds.includes(id)) throw new Error('Assignments must refer to selected tasks.');
    if (!fixture.agentIds.some((eligible) => eligible === agent)) {
      throw new Error(`Select an eligible proposed agent for ${fixture.title}.`);
    }
  }
  for (const id of plan.taskIds) {
    if (!assumptions.includes(id) && !Object.hasOwn(assignments, id)) {
      throw new Error(`Choose a proposed agent for ${fixtures.find((task) => task.id === id)!.title}.`);
    }
  }
  const states: PreviewTask[] = evaluation.tasks.map(({ id, status, unmet }) => ({
    id, status: status === 'Assumed complete' ? status : unmet.length ? 'Blocked' : 'Ready', unmet,
  }));
  return {
    input: {
      plan: { taskIds: [...plan.taskIds], edges: plan.edges.map((edge) => ({ ...edge })) },
      assumptions: [...assumptions], assignments: { ...assignments },
    },
    tasks: states,
    events: [],
    terminal: states.every(({ status }) => complete(status)),
  };
}

export function stepMissionPreview(state: MissionPreviewState): MissionPreviewState {
  if (state.terminal) return state;
  const task = state.tasks.find(({ status }) => status === 'Active')
    ?? state.tasks.find(({ status }) => status === 'Ready');
  if (!task) throw new Error('A non-terminal mission preview must have an active or ready task.');
  const completing = task.status === 'Active';
  const advanced: PreviewTask[] = state.tasks.map((current) => current.id === task.id
    ? { ...current, status: completing ? 'Completed' : 'Active' } : current);
  const completed = new Set(advanced.filter(({ status }) => complete(status)).map(({ id }) => id));
  const next = completing ? advanced.map((current): PreviewTask => {
    if (current.status !== 'Blocked') return current;
    const unmet = current.unmet.filter((id) => !completed.has(id));
    return { ...current, unmet, status: unmet.length ? 'Blocked' : 'Ready' };
  }) : advanced;
  return {
    ...state,
    tasks: next,
    terminal: next.every(({ status }) => complete(status)),
    events: [...state.events, {
      step: state.events.length + 1, taskId: task.id, agentId: state.input.assignments[task.id],
      type: completing ? 'completed' : 'started', provenance: 'hypothetical',
    }],
  };
}

export function resetMissionPreview(state: MissionPreviewState): MissionPreviewState {
  return createMissionPreview(state.input.plan, state.input.assumptions, state.input.assignments);
}
