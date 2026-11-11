import { agents, tasks } from '../demo/fixtures';
import type { DemoId } from '../demo/model';
import type { Activity, ScenarioId, SimEvent, Snapshot } from '../simulation/model';

export const interactionLabels = {
  assignment: 'Task assignment',
  handoff: 'Task handoff',
  collaboration: 'Collaboration request',
  review: 'Synthetic Review requested',
  response: 'Synthetic Review demonstrated',
  approval: 'Demo Approval',
  completion: 'Completion notification',
} as const;

export type InteractionType = keyof typeof interactionLabels;
type Step = readonly [InteractionType, Activity, boolean?];

export interface Interaction {
  readonly id: string;
  readonly scenario: ScenarioId;
  readonly taskId: DemoId;
  readonly source: DemoId;
  readonly target: DemoId;
  readonly type: InteractionType;
  readonly predecessor?: string;
  readonly evidence?: SimEvent;
  readonly status: 'pending' | 'active' | 'completed';
}

const reviewSteps: readonly Step[] = [
  ['assignment', 'moving', true], ['handoff', 'working'], ['review', 'reviewing'],
  ['response', 'completed', true], ['approval', 'completed', true], ['completion', 'completed'],
];
const collaborationSteps: readonly Step[] = [
  ['assignment', 'moving', true], ['collaboration', 'collaborating'], ['handoff', 'working'], ['completion', 'completed'],
];

export function projectCollaboration(snapshot: Snapshot) {
  const steps = snapshot.scenario === 'collaboration' ? collaborationSteps : reviewSteps;
  const evidence = new Map(snapshot.events
    .filter((event) => event.tick <= snapshot.tick && event.virtualMs <= snapshot.virtualMs)
    .map((event) => [`${event.agentId}/${event.taskId}/${event.activity}`, event]));
  const flows = snapshot.plans.map((plan, index) => {
    const task = tasks.find((item) => item.id === plan.taskId);
    if (!task?.agentIds.includes(plan.id) || !agents.some((agent) => agent.id === plan.id)) {
      throw new Error('Invalid synthetic collaboration plan');
    }
    // Prefer a fixture teammate. Single-agent tasks use the next fixture agent as a demo peer.
    const peer = task.agentIds.find((id) => id !== plan.id) ?? agents[(index + 1) % agents.length].id;
    const prefix = `collab-${snapshot.scenario}-${snapshot.seed}-${plan.id}-${plan.taskId}`;
    let previous: Interaction | undefined;
    const interactions = steps.map(([type, activity, reverse], step): Interaction => {
      const event = step === 0 || previous?.evidence ? evidence.get(`${plan.id}/${plan.taskId}/${activity}`) : undefined;
      const interaction: Interaction = {
        id: `${prefix}-${type}`, scenario: snapshot.scenario, taskId: plan.taskId,
        source: reverse ? peer : plan.id, target: reverse ? plan.id : peer,
        type, predecessor: previous?.id, evidence: event,
        status: event ? 'completed' : 'pending',
      };
      previous = interaction;
      return interaction;
    });
    const pending = interactions.findIndex((item) => !item.evidence);
    if (pending > 0) interactions[pending - 1] = { ...interactions[pending - 1], status: 'active' };
    return { agentId: plan.id, taskId: plan.taskId, interactions };
  });
  const observed = flows.flatMap((flow) => flow.interactions)
    .filter((item) => item.evidence)
    .sort((a, b) => a.evidence!.sequence - b.evidence!.sequence);
  return { flows, observed };
}
