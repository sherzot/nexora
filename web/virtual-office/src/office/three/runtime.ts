/** Presentation-only controls. No fixture mutation or execution authority. */
export interface OrbitState { yaw: number; pitch: number; distance: number; x: number; z: number }
export const initialOrbit = (): OrbitState => ({ yaw: Math.PI / 5, pitch: 0.82, distance: 38, x: 0, z: 0 });
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export function navigate(state: OrbitState, dx: number, dy: number, pan = false): OrbitState {
  if (![dx, dy].every(Number.isFinite)) return state;
  if (pan) {
    const scale = state.distance * 0.0015;
    return { ...state, x: clamp(state.x - (dx * Math.cos(state.yaw) + dy * Math.sin(state.yaw)) * scale, -6, 6), z: clamp(state.z + (dx * Math.sin(state.yaw) - dy * Math.cos(state.yaw)) * scale, -4, 4) };
  }
  return { ...state, yaw: (state.yaw - dx * 0.007) % (Math.PI * 2), pitch: clamp(state.pitch + dy * 0.005, 0.4, 1.35) };
}
export function zoom(state: OrbitState, delta: number): OrbitState {
  return Number.isFinite(delta) ? { ...state, distance: clamp(state.distance * Math.exp(clamp(delta, -200, 200) * 0.0015), 20, 48) } : state;
}
export function selectAgent(id: unknown, validIds: ReadonlySet<string>, onSelect: (id: string) => void): boolean {
  if (typeof id !== 'string' || !validIds.has(id)) return false;
  onSelect(id); return true;
}
/** LIFO cleanup also covers partially initialized renderers; every action runs. */
export function createLifetime() {
  let disposed = false;
  const actions: Array<() => void> = [];
  return {
    get disposed() { return disposed; },
    own(cleanup: () => void) { if (disposed) cleanup(); else actions.push(cleanup); },
    dispose() {
      if (disposed) return;
      disposed = true;
      const errors: unknown[] = [];
      for (const action of actions.reverse()) { try { action(); } catch (error) { errors.push(error); } }
      actions.length = 0;
      if (errors.length) throw new AggregateError(errors, 'Office cleanup failed');
    },
  };
}

export function focusPoint(state: OrbitState, x: number, z: number, distance = 23): OrbitState {
  if (![x, z, distance].every(Number.isFinite)) return state;
  return { ...state, x: clamp(x, -6, 6), z: clamp(z, -4, 4), pitch: 0.88, distance: clamp(distance, 20, 48) };
}
/** A bounded transition, not an idle animation; follows the shortest yaw arc. */
export function transitionOrbit(from: OrbitState, to: OrbitState, progress: number): OrbitState {
  const p = clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
  if (p === 1) return { ...to };
  const eased = 1 - (1 - p) ** 3;
  const yawDelta = Math.atan2(Math.sin(to.yaw - from.yaw), Math.cos(to.yaw - from.yaw));
  return { yaw: from.yaw + yawDelta * eased, pitch: from.pitch + (to.pitch - from.pitch) * eased,
    distance: from.distance + (to.distance - from.distance) * eased,
    x: from.x + (to.x - from.x) * eased, z: from.z + (to.z - from.z) * eased };
}
export function overviewForAspect(aspect: number): OrbitState {
  return { ...initialOrbit(), distance: clamp(38 * 1.4 / Math.max(0.5, aspect), 38, 48) };
}
