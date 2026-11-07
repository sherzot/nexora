import type { Snapshot } from './model';
export const eventsForAgent = (snapshot: Snapshot, id: string) => snapshot.events.filter((event) => event.agentId === id);
export const virtualTime = (ms: number) => `T+${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
