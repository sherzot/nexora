import { END_TICK } from './model';
import { scenarios } from './scenarios';
import type { ScenarioId } from './model';
import { virtualTime } from './selectors';
import { useSimulation } from './SimulationProvider';
export function SimulationControls() {
  const { controller, view } = useSimulation();
  const scenario = scenarios.find(({ id }) => id === view.snapshot.scenario);
  const guidance = view.mode === 'inactive' ? 'Choose a scenario, then Start to watch the team move and work.'
    : view.mode === 'playing' ? 'Playback is running. Select an agent to inspect its current task.'
    : view.mode === 'paused' ? 'Playback paused. Resume or Step forward to inspect the next moment.'
    : 'Playback finished. Inspect the results, or Reset simulation to replay.';
  return <section className="simulation-controls" aria-label="Synthetic simulation controls">
    <div className="simulation-heading"><strong>Synthetic simulation</strong><span>No operations · <span role="status">{view.mode}</span> · <time>{virtualTime(view.snapshot.virtualMs)}</time></span></div>
    <label>Scenario<select value={view.snapshot.scenario} onChange={(event) => controller.reset(event.target.value as ScenarioId)}>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</select></label>
    <label>Speed<select value={view.speed} onChange={(event) => controller.setSpeed(Number(event.target.value))}>{[1, 2, 4].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
    <div className="simulation-actions"><button className="simulation-primary" disabled={view.mode !== 'inactive'} onClick={() => controller.start()}>Start</button><button disabled={view.mode !== 'playing'} onClick={() => controller.pause()}>Pause</button><button disabled={view.mode !== 'paused'} onClick={() => controller.start()}>Resume</button><button disabled={view.mode === 'playing' || view.mode === 'finished'} onClick={() => controller.step()}>Step forward</button><button onClick={() => controller.reset()}>Reset simulation</button></div>
    <div className="simulation-progress"><progress aria-label="Demo playback progress" value={view.snapshot.tick} max={END_TICK} />
      <span>Step {view.snapshot.tick} of {END_TICK}</span></div>
    <p className="simulation-guidance">{guidance} {scenario?.description}</p>
    <p>Seed {view.snapshot.seed} · 500 ms virtual ticks · pauses when this tab is hidden. Mission Planning has its own hypothetical preview; it does not drive this playback.</p>
  </section>;
}
