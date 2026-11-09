import { findAgent, findRoom, findTask } from '../demo/selectors';
import type { SimEvent } from '../simulation/model';
export interface EventFilter { agentId?: string; activity?: string; zoneId?: string; fromTick?: number; toTick?: number; search?: string }
export const describeEvent = (event: SimEvent): string => `${findAgent(event.agentId)?.name ?? event.agentId} · ${event.activity} · ${findRoom(event.zoneId)?.name ?? event.zoneId} · ${findTask(event.taskId)?.title ?? event.taskId}`;
export function filterEvents(events: readonly SimEvent[], filter: EventFilter): readonly SimEvent[] {
  const search = (filter.search ?? '').trim().toLowerCase();
  return events.filter((event) => (!filter.agentId || event.agentId === filter.agentId) && (!filter.activity || event.activity === filter.activity)
    && (!filter.zoneId || event.zoneId === filter.zoneId) && (filter.fromTick === undefined || event.tick >= filter.fromTick)
    && (filter.toTick === undefined || event.tick <= filter.toTick) && (!search || describeEvent(event).toLowerCase().includes(search)))
    .sort((a, b) => a.tick - b.tick || a.sequence - b.sequence || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
