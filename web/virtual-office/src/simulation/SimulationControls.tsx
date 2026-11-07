import { scenarios } from './scenarios';
import type { ScenarioId } from './model';
import { virtualTime } from './selectors';
import { useSimulation } from './SimulationProvider';
export function SimulationControls() {
  const { controller, view } = useSimulation();
  return <section className="simulation-controls" aria-label="Synthetic simulation controls">
    <div><strong>Synthetic simulation</strong><span>No operations · {view.mode} · <time>{virtualTime(view.snapshot.virtualMs)}</time></span></div>
    <label>Scenario<select value={view.snapshot.scenario} onChange={(event) => controller.reset(event.target.value as ScenarioId)}>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</select></label>
    <label>Speed<select value={view.speed} onChange={(event) => controller.setSpeed(Number(event.target.value))}>{[1, 2, 4].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
    <div className="simulation-actions"><button disabled={view.mode !== 'inactive'} onClick={() => controller.start()}>Start</button><button disabled={view.mode !== 'playing'} onClick={() => controller.pause()}>Pause</button><button disabled={view.mode !== 'paused'} onClick={() => controller.start()}>Resume</button><button disabled={view.mode === 'playing' || view.mode === 'finished'} onClick={() => controller.step()}>Step forward</button><button onClick={() => controller.reset()}>Reset simulation</button></div>
    <p>Seed {view.snapshot.seed} · 500 ms virtual ticks · pauses when this tab is hidden.</p>
  </section>;
}
