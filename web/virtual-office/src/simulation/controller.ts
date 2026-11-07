import { initialSnapshot, stepSnapshot } from './engine';
import { END_TICK, TICK_MS } from './model';
import type { ScenarioId, Snapshot } from './model';
export interface Playback { readonly snapshot: Snapshot; readonly mode: 'inactive' | 'playing' | 'paused' | 'finished'; readonly speed: 1 | 2 | 4; readonly epoch: number }
export interface Scheduler { schedule(callback: () => void, delay: number): unknown; cancel(handle: unknown): void }
const browserScheduler: Scheduler = { schedule: (fn, delay) => setTimeout(fn, delay), cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>) };
export function createController(scheduler: Scheduler = browserScheduler) {
  let view: Playback = { snapshot: initialSnapshot(), mode: 'inactive', speed: 1, epoch: 0 };
  let timer: unknown;
  let generation = 0;
  const listeners = new Set<() => void>();
  const publish = (value: Playback) => { view = value; for (const listener of [...listeners]) listener(); };
  const clear = () => { generation++; if (timer !== undefined) scheduler.cancel(timer); timer = undefined; };
  const schedule = () => {
    if (view.mode !== 'playing') return;
    const token = generation;
    timer = scheduler.schedule(() => {
      if (token !== generation || view.mode !== 'playing') return;
      timer = undefined;
      const snapshot = stepSnapshot(view.snapshot);
      publish({ ...view, snapshot, mode: snapshot.tick === END_TICK ? 'finished' : 'playing' });
      if (token === generation) schedule();
    }, TICK_MS / view.speed);
  };
  const pause = () => { clear(); if (view.mode === 'playing') publish({ ...view, mode: 'paused' }); };
  return {
    getSnapshot: () => view,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() { if (view.mode === 'playing' || view.mode === 'finished') return; clear(); const token = generation; publish({ ...view, snapshot: { ...view.snapshot, active: true }, mode: 'playing' }); if (token === generation) schedule(); },
    pause,
    step() { if (view.mode === 'playing' || view.mode === 'finished') return; clear(); const snapshot = stepSnapshot(view.snapshot); publish({ ...view, snapshot, mode: snapshot.tick === END_TICK ? 'finished' : 'paused' }); },
    setSpeed(speed: number) { if (speed !== 1 && speed !== 2 && speed !== 4) throw new Error('Unsupported playback speed'); clear(); const token = generation; publish({ ...view, speed }); if (token === generation) schedule(); },
    reset(scenario: ScenarioId = view.snapshot.scenario, seed = view.snapshot.seed) { const snapshot = initialSnapshot(scenario, seed); clear(); publish({ snapshot, mode: 'inactive', speed: view.speed, epoch: view.epoch + 1 }); },
    dispose() { pause(); listeners.clear(); },
  };
}
