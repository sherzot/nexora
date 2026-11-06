import { useEffect, useRef, useState } from 'react';
import { agents, rooms } from '../demo/fixtures';
import { OfficeScene } from './OfficeScene';
import type { OfficeRenderer } from './three/renderer';

export function OfficeViewport({ selectedId, onSelect, dark }: { selectedId: string; onSelect: (id: string) => void; dark: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<OfficeRenderer | null>(null);
  const selection = useRef(selectedId);
  selection.current = selectedId;
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const [twoD, setTwoD] = useState(() => window.matchMedia('(max-width: 700px), (pointer: coarse)').matches);
  const [failure, setFailure] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (twoD || !host.current) return;
    let cancelled = false;
    let instance: OfficeRenderer | undefined;
    setReady(false);
    import('./three/renderer').then(({ createOfficeRenderer }) => {
      if (cancelled || !host.current) return;
      instance = createOfficeRenderer(host.current, agents, rooms, selection.current, dark, (id) => callback.current(id), (reason) => { if (!cancelled) { setFailure(reason); setTwoD(true); } });
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
  useEffect(() => { renderer.current?.setSelection(selectedId); }, [selectedId]);
  return <>
    <div className="office-view-controls" role="group" aria-label="Office view">
      <button type="button" aria-pressed={!twoD} onClick={() => { setFailure(''); setTwoD(false); }}>3D office</button>
      <button type="button" aria-pressed={twoD} onClick={() => setTwoD(true)}>2D floor plan</button>
      {!twoD && <button type="button" onClick={() => renderer.current?.reset()}>Reset camera</button>}
    </div>
    {twoD ? <OfficeScene selectedId={selectedId} onSelect={onSelect} /> : <div ref={host} className="office-webgl" aria-busy={!ready} />}
    <p className="office-view-help" role="status">{failure || (twoD ? '2D floor plan · Select an agent in the scene or list.' : ready ? 'Drag to orbit · Shift-drag to pan · Scroll to zoom. Keyboard: arrows, Shift + arrows, + / −, Home.' : 'Preparing 3D office…')}</p>
    <div className="office-zone-key" aria-label="Office zones">{rooms.map((room) => <span key={room.id} data-zone={room.order}>{room.name}</span>)}</div>
  </>;
}
