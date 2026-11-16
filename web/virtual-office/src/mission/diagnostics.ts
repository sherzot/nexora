import type { MissionPlan } from './plan';
import { createMissionPreview, nextMissionTransition, resetMissionPreview, stepMissionPreview } from './preview';
import type { MissionPreviewState, PreviewEvent } from './preview';

export { diagnoseAssignments } from './preview';

export function diagnoseMission(state: MissionPreviewState) {
  const unblockedBy = new Map<string, PreviewEvent>();
  if (state.events.length > 0) {
    let before = resetMissionPreview(state);
    for (let step = 0; step < state.events.length; step++) {
      const after = stepMissionPreview(before);
      const event = after.events[step];
      if (event?.type === 'completed') {
        const blocked = new Set(before.tasks.filter(({ status }) => status === 'Blocked').map(({ id }) => id));
        for (const { id, status } of after.tasks) {
          if (status === 'Ready' && blocked.has(id)) unblockedBy.set(id, event);
        }
      }
      before = after;
    }
  }
  const tasks = state.tasks.map((task) => {
    const prerequisites = state.tasks.filter(({ id }) =>
      state.input.plan.edges.some(({ prerequisiteId, dependentId }) =>
        dependentId === task.id && prerequisiteId === id)).map(({ id }) => id);
    return { ...task, prerequisites, unblockedBy: unblockedBy.get(task.id), agentId: state.input.assignments[task.id] };
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
