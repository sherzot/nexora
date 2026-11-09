import { initialSnapshot, stepSnapshot } from '../simulation/engine';
import { END_TICK } from '../simulation/model';
import { scenarios } from '../simulation/scenarios';
import { deriveMetrics } from './metrics';
export function compareScenarios(seed: number, horizon: number, agentId = '') {
  if (!Number.isInteger(horizon) || horizon < 0 || horizon > END_TICK) throw new Error('Invalid comparison horizon');
  return scenarios.map((scenario) => {
    let snapshot = initialSnapshot(scenario.id, seed);
    for (let i = 0; i < horizon; i++) snapshot = stepSnapshot(snapshot);
    return { name: scenario.name, ...deriveMetrics(snapshot, agentId) };
  });
}
