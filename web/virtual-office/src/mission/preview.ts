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

export interface PreviewEvent {
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

export function diagnoseAssignments(plan: MissionPlan, assumptions: readonly string[], assignments: Readonly<Record<string, string>>) {
  return fixtures.filter(({ id }) => plan.taskIds.includes(id)).map(({ id, agentIds }) => {
    const assigned = Object.hasOwn(assignments, id);
    const agentId = assigned ? assignments[id] : undefined;
    const status = !assigned
      ? assumptions.includes(id) ? 'not-required' : 'missing'
      : agentIds.some((eligible) => eligible === agentId) ? 'eligible' : 'invalid';
    return { taskId: id, agentId, eligibleAgentIds: agentIds, status } as const;
  });
}

export function nextMissionTransition(state: MissionPreviewState) {
  if (state.terminal) return undefined;
  const task = state.tasks.find(({ status }) => status === 'Active')
    ?? state.tasks.find(({ status }) => status === 'Ready');
  if (!task) throw new Error('A non-terminal mission preview must have an active or ready task.');
  return task.status === 'Active'
    ? { taskId: task.id, type: 'completed', reason: 'active' } as const
    : { taskId: task.id, type: 'started', reason: 'fixture-order' } as const;
}

export function createMissionPreview(plan: MissionPlan, assumptions: readonly string[], assignments: Readonly<Record<string, string>>): MissionPreviewState {
  if (!plan.taskIds.length) throw new Error('Select at least one task before starting the preview.');
  const evaluation = evaluatePlan(plan, assumptions, catalog);
  if (evaluation.error) throw new Error(evaluation.error);
  const diagnostics = diagnoseAssignments(plan, assumptions, assignments);
  for (const id of Object.keys(assignments)) {
    const assignment = diagnostics.find(({ taskId }) => taskId === id);
    if (!assignment) throw new Error('Assignments must refer to selected tasks.');
    if (assignment.status === 'invalid') {
      throw new Error(`Select an eligible proposed agent for ${fixtures.find((task) => task.id === id)!.title}.`);
    }
  }
  for (const id of plan.taskIds) {
    if (diagnostics.find(({ taskId }) => taskId === id)?.status === 'missing') {
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
  const transition = nextMissionTransition(state);
  if (!transition) return state;
  const { taskId, type } = transition;
  const completing = type === 'completed';
  const advanced: PreviewTask[] = state.tasks.map((current) => current.id === taskId
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
      step: state.events.length + 1, taskId, agentId: state.input.assignments[taskId],
      type, provenance: 'hypothetical',
    }],
  };
}

export function resetMissionPreview(state: MissionPreviewState): MissionPreviewState {
  return createMissionPreview(state.input.plan, state.input.assumptions, state.input.assignments);
}
