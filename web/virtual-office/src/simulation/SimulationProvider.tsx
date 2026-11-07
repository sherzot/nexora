import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { agents } from '../demo/fixtures';
import { createController } from './controller';
import type { Playback } from './controller';
interface SimulationContext { controller: ReturnType<typeof createController>; view: Playback; selectedId: string; select(id: string): void }
const Context = createContext<SimulationContext | null>(null);
export function SimulationProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(() => createController());
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [selectedId, setSelectedId] = useState<string>(agents[0].id);
  useEffect(() => { setSelectedId(agents[0].id); }, [view.epoch]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) controller.pause(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { document.removeEventListener('visibilitychange', hidden); controller.pause(); };
  }, [controller]);
  return <Context.Provider value={{ controller, view, selectedId, select: (id) => { if (agents.some((agent) => agent.id === id)) setSelectedId(id); } }}>{children}</Context.Provider>;
}
export function useSimulation() { const value = useContext(Context); if (!value) throw new Error('Simulation provider missing'); return value; }
