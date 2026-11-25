export interface PreviewScheduler {
  schedule(callback: () => void, delay: number): unknown;
  cancel(handle: unknown): void;
}
const browserScheduler: PreviewScheduler = {
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};
export interface PreviewPlayback {
  readonly mode: 'idle' | 'playing' | 'paused';
  readonly speed: 1 | 2 | 4;
}

// Owns UI pacing only. The caller retains the captured input, tasks and events.
export function createPreviewPlayback(onStep: () => void, isTerminal: () => boolean, scheduler = browserScheduler) {
  let view: PreviewPlayback = { mode: 'idle', speed: 1 };
  let timer: unknown;
  let generation = 0;
  let disposed = false;
  const listeners = new Set<() => void>();
  const publish = (next: PreviewPlayback) => {
    if (next.mode === view.mode && next.speed === view.speed) return;
    view = next;
    for (const listener of [...listeners]) if (listeners.has(listener)) listener();
  };
  const clear = () => {
    generation++;
    const handle = timer; timer = undefined;
    if (handle !== undefined) scheduler.cancel(handle);
  };
  const pause = () => {
    try { clear(); }
    finally { if (view.mode === 'playing') publish({ ...view, mode: 'paused' }); }
  };
  const schedule = () => {
    if (disposed || view.mode !== 'playing') return;
    if (isTerminal()) { pause(); return; }
    const token = generation;
    let delivered = false;
    try {
      timer = scheduler.schedule(() => {
        if (delivered || disposed || token !== generation || view.mode !== 'playing') return;
        delivered = true; timer = undefined;
        if (isTerminal()) { pause(); return; }
        try { onStep(); }
        catch (error) { pause(); throw error; }
        if (token === generation) schedule();
      }, 1000 / view.speed);
    } catch (error) { pause(); throw error; }
  };
  return {
    getSnapshot: () => view,
    subscribe(listener: () => void) { if (!disposed) listeners.add(listener); return () => { listeners.delete(listener); }; },
    play() {
      if (disposed || view.mode === 'playing' || isTerminal()) return;
      clear(); const token = generation;
      publish({ ...view, mode: 'playing' });
      if (token === generation) schedule();
    },
    pause,
    step() {
      if (disposed || view.mode === 'playing' || isTerminal()) return;
      clear(); const token = generation;
      publish({ ...view, mode: 'paused' });
      if (token === generation && !disposed && !isTerminal()) onStep();
    },
    reset() { try { clear(); } finally { if (!disposed) publish({ ...view, mode: 'idle' }); } },
    setSpeed(speed: number) {
      if (disposed) return;
      if (speed !== 1 && speed !== 2 && speed !== 4) throw new Error('Unsupported preview playback speed');
      if (speed === view.speed) return;
      clear(); const token = generation;
      publish({ ...view, speed });
      if (token === generation) schedule();
    },
    dispose() { disposed = true; try { clear(); } finally { listeners.clear(); } },
  };
}
