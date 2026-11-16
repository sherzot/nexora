import type { MissionPlan } from './plan';
import { createMissionPreview, nextMissionTransition, stepMissionPreview } from './preview';
import type { MissionPreviewState } from './preview';

export { diagnoseAssignments } from './preview';

export function diagnoseMission(state: MissionPreviewState) {
  const completions = state.events.filter(({ type }) => type === 'completed').reverse();
  const tasks = state.tasks.map((task) => {
    const prerequisites = state.tasks.filter(({ id }) =>
      state.input.plan.edges.some(({ prerequisiteId, dependentId }) =>
        dependentId === task.id && prerequisiteId === id)).map(({ id }) => id);
    const unblockedBy = task.unmet.length === 0
      ? completions.find(({ taskId }) => prerequisites.includes(taskId))
      : undefined;
    return { ...task, prerequisites, unblockedBy, agentId: state.input.assignments[task.id] };
  });
  return {
    tasks,
    next: nextMissionTransition(state),
    terminal: state.terminal,
    allAssumed: state.tasks.length > 0 && state.tasks.every(({ status }) => status === 'Assumed complete'),
  };
}

type MissionVariant = MissionPreviewState['input'];

export function captureMissionVariant(plan: MissionPlan, assumptions: readonly string[], assignments: Readonly<Record<string, string>>): MissionVariant {
  return createMissionPreview(plan, assumptions, assignments).input;
}

function replayVariant(input: MissionVariant): MissionPreviewState {
  let state = createMissionPreview(input.plan, input.assumptions, input.assignments);
  while (!state.terminal) state = stepMissionPreview(state);
  return state;
}

function equalSet(left: readonly string[], right: readonly string[]): boolean {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return leftSet.size === rightSet.size && [...leftSet].every((value) => rightSet.has(value));
}

function equalSequence(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function compareMissionVariants(a: MissionVariant, b: MissionVariant) {
  const left = replayVariant(a);
  const right = replayVariant(b);
  const dependencies = ({ plan }: MissionVariant) => plan.edges.map(({ prerequisiteId, dependentId }) => JSON.stringify([prerequisiteId, dependentId]));
  const assignments = (input: MissionVariant) => Object.entries(input.assignments).map((assignment) => JSON.stringify(assignment));
  const eventOrder = ({ events }: MissionPreviewState) => events.map(({ taskId, type }) => JSON.stringify([taskId, type]));
  const attribution = ({ events }: MissionPreviewState) => events
    .filter(({ type }) => type === 'started').map(({ taskId, agentId }) => JSON.stringify([taskId, agentId]));
  const statuses = ({ tasks }: MissionPreviewState) => tasks.map(({ id, status }) => JSON.stringify([id, status]));

  return {
    left,
    right,
    membershipChanged: !equalSet(a.plan.taskIds, b.plan.taskIds),
    dependenciesChanged: !equalSet(dependencies(a), dependencies(b)),
    assignmentsChanged: !equalSet(assignments(a), assignments(b)),
    assumptionsChanged: !equalSet(a.assumptions, b.assumptions),
    eventOrderChanged: !equalSequence(eventOrder(left), eventOrder(right)),
    eventAttributionChanged: !equalSet(attribution(left), attribution(right)),
    stepCountChanged: left.events.length !== right.events.length,
    terminalStatesChanged: !equalSet(statuses(left), statuses(right)),
  };
}
