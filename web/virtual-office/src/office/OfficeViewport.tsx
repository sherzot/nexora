import { useSimulation } from '../simulation/SimulationProvider';
import { useEffect, useRef, useState } from 'react';
import { interactionLabels } from '../collaboration/projection';
import { agents, rooms } from '../demo/fixtures';
import { OfficeScene } from './OfficeScene';
import type { OfficePresentation } from './presentation';
import type { OfficeRenderer } from './three/renderer';

export function OfficeViewport({ selectedId, onSelect, dark, reducedMotion = false, presentation, followSelection }: { selectedId: string; onSelect: (id: string) => void; dark: boolean; reducedMotion?: boolean; presentation?: OfficePresentation; followSelection?: boolean }) {
  const { view, interaction } = useSimulation();
  const simulation = !presentation && view.snapshot.active ? view.snapshot : undefined;
  const playing = !presentation && view.mode === 'playing';
  const speed = presentation ? 1 : view.speed;
  const host = useRef<HTMLDivElement>(null);
  const fallbackButton = useRef<HTMLButtonElement>(null);
  const renderer = useRef<OfficeRenderer | null>(null);
  const selection = useRef(selectedId);
  selection.current = selectedId;
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const [twoD, setTwoD] = useState(() => window.matchMedia('(max-width: 700px), (pointer: coarse)').matches);
  const [failure, setFailure] = useState('');
  const [ready, setReady] = useState(false);
  const [hoveredId, setHoveredId] = useState<string>();
  const [zoneId, setZoneId] = useState<string>();
  const [follow, setFollow] = useState(false);
  const following = followSelection ?? follow;
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const motion = useRef(reducedMotion || systemReduced);
  motion.current = reducedMotion || systemReduced;
  const selected = agents.find((agent) => agent.id === selectedId);
  const hovered = agents.find((agent) => agent.id === hoveredId);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setSystemReduced(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    setReady(false); setHoveredId(undefined); setZoneId(undefined);
    if (twoD || !host.current) return;
    let cancelled = false;
    let instance: OfficeRenderer | undefined;
    import('./three/renderer').then(({ createOfficeRenderer }) => {
      if (cancelled || !host.current) return;
      instance = createOfficeRenderer(host.current, agents, rooms, selection.current, dark, (id) => callback.current(id), (reason, canvasHadFocus) => {
        if (cancelled) return;
        setFailure(reason);
        setTwoD(true);
        if (canvasHadFocus) fallbackButton.current?.focus({ preventScroll: true });
      }, (id) => { if (!cancelled) setHoveredId(id); }, motion.current);
      renderer.current = instance;
      setReady(true);
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.warn('Office WebGL initialization failed', error);
      setFailure('3D view unavailable. You can select every agent in the 2D office or list.'); setTwoD(true);
    });
    return () => {
      cancelled = true;
      if (renderer.current === instance) renderer.current = null;
      try { instance?.dispose(); } catch (error) { console.error('Office cleanup failed', error); }
    };
  }, [twoD, dark]);
  useEffect(() => {
    renderer.current?.setSelection(selectedId);
    if (following && renderer.current) { renderer.current.focusAgent(selectedId); setZoneId(undefined); }
  }, [selectedId, following, ready]);
  useEffect(() => { renderer.current?.setReducedMotion(reducedMotion || systemReduced); }, [reducedMotion, systemReduced, ready]);
  useEffect(() => { renderer.current?.setSimulation(simulation, playing, speed); }, [simulation, playing, speed, ready]);
  useEffect(() => { renderer.current?.setPresentation(presentation); }, [presentation, ready]);
  const cue = !presentation && interaction?.evidence ? interaction : undefined;
  const source = cue?.source, target = cue?.target;
  useEffect(() => { renderer.current?.setCollaboration(source, target); }, [source, target, ready]);
  const captionAgent = hovered ?? selected;
  const captionActivity = presentation?.agents.find((agent) => agent.id === captionAgent?.id)?.label ?? simulation?.agents.find((agent) => agent.id === captionAgent?.id)?.activity ?? captionAgent?.status;
  return <>
    <div className="office-view-controls" role="group" aria-label="Office view">
      <button type="button" aria-pressed={!twoD} onClick={() => { setFailure(''); setTwoD(false); }}>3D office</button>
      <button ref={fallbackButton} type="button" aria-pressed={twoD} onClick={() => setTwoD(true)}>2D floor plan</button>
      {!twoD && <>
        <button type="button" disabled={!ready} onClick={() => { renderer.current?.reset(); setZoneId(undefined); }}>Reset camera</button>
        <button type="button" disabled={!ready || !selected} onClick={() => { renderer.current?.focusAgent(selectedId); setZoneId(undefined); }}>Focus {selected?.name ?? 'agent'}</button>
        <button type="button" disabled={!ready} aria-label="Zoom in" onClick={() => renderer.current?.zoomBy(-100)}>＋</button>
        <button type="button" disabled={!ready} aria-label="Zoom out" onClick={() => renderer.current?.zoomBy(100)}>−</button>
        {followSelection === undefined && <label className="office-follow"><input type="checkbox" checked={follow} onChange={(event) => setFollow(event.target.checked)} />Follow selection</label>}
      </>}
    </div>
    {twoD ? <OfficeScene selectedId={selectedId} onSelect={onSelect} simulation={simulation} presentation={presentation} source={source} target={target} /> : <div className="office-stage"><div ref={host} className="office-webgl" aria-busy={!ready} />
      {!ready && <div className="office-loading" role="status">Preparing your workspace…</div>}
      {ready && <div className="office-scene-caption" aria-hidden="true"><span>{hovered ? 'HOVERING' : 'SELECTED'}</span><strong>{(hovered ?? selected)?.name}</strong><span>{captionActivity} · Synthetic profile</span></div>}
    </div>}
    {cue && <p className="office-view-help" data-office-interaction={cue.id}>{interactionLabels[cue.type]} · {agents.find((agent) => agent.id === source)?.name} → {agents.find((agent) => agent.id === target)?.name}</p>}
    <p className="office-view-help" role="status">{failure || (twoD ? '2D floor plan · Select an agent in the scene or list.' : ready ? 'Drag to orbit · Shift-drag to pan · Scroll to zoom. Keyboard: arrows, Shift + arrows, + / −, Home.' : 'Preparing 3D office…')}</p>
    <div className="office-zone-key" aria-label="Office zones">{rooms.map((room) => <button type="button" key={room.id} data-zone={room.order} aria-pressed={zoneId === room.id} disabled={!twoD && !ready} onClick={() => {
      setZoneId(room.id);
      if (twoD) { const agent = agents.find((item) => item.roomId === room.id); if (agent) onSelect(agent.id); }
      else renderer.current?.focusZone(room.id);
    }}><span>{String(room.order).padStart(2, '0')}</span>{room.name}<span aria-hidden="true">↗</span></button>)}</div>
  </>;
}
