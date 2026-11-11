import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { agents } from '../demo/fixtures';
import { createController } from './controller';
import type { Playback } from './controller';
import { projectCollaboration } from '../collaboration/projection';
import type { Interaction } from '../collaboration/projection';
interface SimulationContext { controller: ReturnType<typeof createController>; view: Playback; selectedId: string; select(id: string): void; collaboration: ReturnType<typeof projectCollaboration>; interaction?: Interaction; selectInteraction(id?: string): void }
const Context = createContext<SimulationContext | null>(null);
export function SimulationProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(() => createController());
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [selectedId, setSelectedId] = useState<string>(agents[0].id);
  const collaboration = useMemo(() => projectCollaboration(view.snapshot), [view.snapshot]);
  const [selection, setSelection] = useState<{ id: string; epoch: number }>();
  const interaction = selection?.epoch === view.epoch
    ? collaboration.flows.flatMap((flow) => flow.interactions).find((item) => item.id === selection.id)
    : undefined;
  useEffect(() => { setSelectedId(agents[0].id); }, [view.epoch]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) controller.pause(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { document.removeEventListener('visibilitychange', hidden); controller.pause(); };
  }, [controller]);
  return <Context.Provider value={{ controller, view, selectedId, collaboration, interaction,
    selectInteraction(id) {
      const item = collaboration.flows.flatMap((flow) => flow.interactions).find((step) => step.id === id);
      setSelection(item ? { id: item.id, epoch: view.epoch } : undefined);
      if (item) setSelectedId(item.source);
    },
    select: (id) => { if (agents.some((agent) => agent.id === id)) setSelectedId(id); } }}>{children}</Context.Provider>;
}
export function useSimulation() { const value = useContext(Context); if (!value) throw new Error('Simulation provider missing'); return value; }
