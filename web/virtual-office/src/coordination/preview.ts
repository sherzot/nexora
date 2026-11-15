import { projectCollaboration } from '../collaboration/projection';
import { findTask } from '../demo/selectors';
import { initialSnapshot, stepSnapshot } from '../simulation/engine';
import { END_TICK } from '../simulation/model';
import type { ScenarioId, Snapshot } from '../simulation/model';
import { scenarios } from '../simulation/scenarios';

export function taskFacts(snapshot: Snapshot, taskId: string) {
  const task = findTask(taskId);
  if (!task) throw new Error('Unknown synthetic task');
  return {
    status: snapshot.active ? snapshot.taskStates[task.id] ?? task.status : task.status,
    participants: snapshot.plans.filter((plan) => plan.taskId === taskId).map((plan) => plan.id),
    interactions: projectCollaboration(snapshot).observed.filter((item) => item.taskId === taskId),
  };
}

export function compareCoordination(baseline: Snapshot, taskId: string, alternative: ScenarioId) {
  if (!scenarios.some(({ id }) => id === baseline.scenario)
    || !scenarios.some(({ id }) => id === alternative) || alternative === baseline.scenario
    || !Number.isInteger(baseline.tick) || baseline.tick < 0 || baseline.tick > END_TICK) {
    throw new Error('Invalid synthetic comparison');
  }
  const observed = taskFacts(baseline, taskId);
  let replay = initialSnapshot(alternative, baseline.seed);
  for (let tick = 0; tick < baseline.tick; tick++) replay = stepSnapshot(replay);
  const facts = taskFacts(replay, taskId);
  const hypothetical = {
    provenance: 'hypothetical' as const,
    status: facts.status,
    participants: facts.participants,
    interactions: facts.interactions.map((item, index) => ({
      id: `preview-${taskId}-${alternative}-${baseline.seed}-${baseline.tick}-${index}`,
      type: item.type, source: item.source, target: item.target, virtualMs: item.evidence!.virtualMs,
    })),
  };
  const signature = (items: readonly { type: string; source: string; target: string; virtualMs: number }[]) =>
    JSON.stringify(items.map(({ type, source, target, virtualMs }) => [type, source, target, virtualMs]));
  const equal = observed.status === hypothetical.status
    && observed.participants.join() === hypothetical.participants.join()
    && signature(observed.interactions.map((item) => ({ ...item, virtualMs: item.evidence!.virtualMs }))) === signature(hypothetical.interactions);
  return { scenario: baseline.scenario, alternative, seed: baseline.seed, tick: baseline.tick, observed, hypothetical, equal };
}
