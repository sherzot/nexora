import type { DemoId, TaskStatus } from '../demo/model';
export type Activity = 'idle' | 'moving' | 'working' | 'collaborating' | 'reviewing' | 'completed';
export type ScenarioId = 'day' | 'collaboration' | 'review';
export interface Position { readonly x: number; readonly z: number }
export interface SimAgent {
  readonly id: DemoId; readonly activity: Activity; readonly zoneId: DemoId;
  readonly taskId: DemoId; readonly position: Position;
}
export interface SimEvent {
  readonly id: string; readonly tick: number; readonly virtualMs: number; readonly sequence: number;
  readonly agentId: DemoId; readonly activity: Activity; readonly zoneId: DemoId; readonly taskId: DemoId;
}
export interface AgentPlan {
  readonly id: DemoId; readonly taskId: DemoId; readonly zoneId: DemoId;
  readonly start: number; readonly path: readonly Position[];
}
export interface Snapshot {
  readonly scenario: ScenarioId; readonly seed: number; readonly tick: number; readonly virtualMs: number;
  readonly active: boolean; readonly agents: readonly SimAgent[]; readonly plans: readonly AgentPlan[];
  readonly events: readonly SimEvent[]; readonly taskStates: Readonly<Record<string, TaskStatus>>;
}
export const TICK_MS = 500;
export const END_TICK = 32;
export const HISTORY_LIMIT = 128;
