import { AmbientLight, BoxGeometry, Color, CylinderGeometry, DirectionalLight, Group, Mesh, MeshStandardMaterial, PCFShadowMap, PerspectiveCamera, Raycaster, Scene, SphereGeometry, TorusGeometry, Vector2, WebGLRenderer } from 'three';
import type { DemoAgent, DemoRoom } from '../../demo/model';
import { createLifetime, initialOrbit, navigate, selectAgent, zoom } from './runtime';

export interface OfficeRenderer {
  setSelection(id: string): void;
  reset(): void;
  dispose(): void;
}
export function createOfficeRenderer(host: HTMLElement, agents: readonly DemoAgent[], rooms: readonly DemoRoom[], selectedId: string, dark: boolean, onSelect: (id: string) => void, onUnavailable: (reason: string) => void): OfficeRenderer {
  const life = createLifetime();
  try {
    const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    life.own(() => { renderer.dispose(); renderer.forceContextLoss(); });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-label', 'Interactive synthetic office. Drag to orbit, Shift-drag to pan, scroll to zoom. Use agent buttons below for keyboard selection.');
    canvas.tabIndex = 0;
    host.append(canvas);
    life.own(() => canvas.remove());
    const scene = new Scene();
    scene.background = new Color(dark ? '#141c29' : '#edf1f5');
    const camera = new PerspectiveCamera(42, 1, 0.1, 150);
    const box = new BoxGeometry(1, 1, 1);
    const sphere = new SphereGeometry(1, 16, 12);
    const cylinder = new CylinderGeometry(1, 1, 1, 16);
    const ring = new TorusGeometry(0.68, 0.045, 6, 32);
    for (const geometry of [box, sphere, cylinder, ring]) life.own(() => geometry.dispose());
    const material = (color: string, metalness = 0) => {
      const value = new MeshStandardMaterial({ color, roughness: 0.8, metalness });
      life.own(() => value.dispose()); return value;
    };
    const floorMat = material(dark ? '#293241' : '#dce0df');
    const wallMat = material(dark ? '#445167' : '#f8f7f1');
    const wood = material(dark ? '#776751' : '#c5a77d');
    const frame = material(dark ? '#202939' : '#4e5a65');
    const screen = material('#29465c');
    const foliage = material('#547765');
    const pot = material('#b7a597');
    const head = material('#d9b99c');
    const zoneMats = ['#c9d9e9', '#c9dbd4', '#e4d7b9', '#d6cfe4'].map((c) => {
      const m = material(c); if (dark) m.color.multiplyScalar(0.42); return m;
    });
    const tones = { blue: material('#407bd0'), sage: material('#538b78'), amber: material('#c19341'), lavender: material('#9381bd') };
    const selection = material('#3177df');
    const hoverMat = material('#f4c56d');
    const mesh = (geometry: BoxGeometry | SphereGeometry | CylinderGeometry | TorusGeometry, mat: MeshStandardMaterial, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, parent: Scene | Group = scene) => {
      const item = new Mesh(geometry, mat); item.position.set(x, y, z); item.scale.set(sx, sy, sz);
      item.castShadow = true; item.receiveShadow = true; parent.add(item); return item;
    };
    mesh(box, floorMat, 0, -0.2, 0, 24, 0.4, 18);
    // Rear cutaway walls leave all four fixture-owned zones visible.
    mesh(box, wallMat, 0, 1.3, -9, 24, 2.6, 0.16);
    mesh(box, wallMat, -12, 1.3, 0, 0.16, 2.6, 18);
    for (const room of rooms) {
      const x = 2.4 * (room.x + room.width / 2) - 12;
      const z = 2.4 * (room.y + room.depth / 2) - 8.4;
      mesh(box, zoneMats[(room.order - 1) % 4], x, 0.025, z, room.width * 2.4, 0.05, room.depth * 2.4);
    }
    // Low dividers, not full-height front walls, preserve overview selection.
    mesh(box, wallMat, -0.5, 0.55, -4, 0.12, 1.1, 7);
    mesh(box, wallMat, 6, 0.55, 0.35, 10, 1.1, 0.12);
    const pickables: Mesh[] = [];
    const highlights = new Map<string, Mesh>();
    const validIds = new Set<string>(agents.map((agent) => agent.id));
    for (const agent of agents) {
      const x = 2.4 * (agent.desk.x + 0.6) - 12;
      const z = 2.4 * (agent.desk.y + 0.4) - 8.4;
      mesh(box, wood, x, 1, z, 2.65, 0.16, 1.65);
      for (const dx of [-1.05, 1.05]) mesh(box, frame, x + dx, 0.48, z, 0.12, 0.96, 1.2);
      mesh(box, frame, x, 1.48, z - 0.36, 1.15, 0.7, 0.1);
      mesh(box, screen, x, 1.48, z - 0.295, 0.98, 0.53, 0.03);
      mesh(box, frame, x, 1.15, z - 0.36, 0.12, 0.3, 0.12);
      const avatar = new Group(); avatar.position.set(x, 0, z + 1.5); scene.add(avatar);
      const body = mesh(cylinder, tones[agent.tone], 0, 0.8, 0, 0.35, 0.85, 0.35, avatar);
      const face = mesh(sphere, head, 0, 1.5, 0, 0.3, 0.33, 0.3, avatar);
      // Broad invisible-free selection surface consists of the actual avatar.
      for (const part of [body, face]) { part.userData.agentId = agent.id; pickables.push(part); }
      mesh(box, frame, 0, 0.35, 0, 0.65, 0.15, 0.65, avatar);
      const halo = mesh(ring, selection, 0, 0.1, 0, 1, 1, 1, avatar); halo.rotation.x = -Math.PI / 2;
      highlights.set(agent.id, halo);
    }
    for (const [x, z] of [[-11, 0.3], [10.8, -7.8], [10.8, 7.6]]) {
      mesh(cylinder, pot, x, 0.35, z, 0.42, 0.7, 0.42);
      mesh(sphere, foliage, x, 1, z, 0.65, 0.8, 0.65);
    }
    scene.add(new AmbientLight('#ffffff', 2));
    const sun = new DirectionalLight('#fff2dc', 3.5);
    sun.position.set(4, 18, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 0.1, far: 55 });
    sun.shadow.normalBias = 0.04; scene.add(sun);
    life.own(() => sun.shadow.dispose());
    let orbit = initialOrbit();
    let selected = selectedId;
    let hovered: string | undefined;
    let frameId = 0;
    const updateHighlights = () => {
      for (const [id, halo] of highlights) {
        halo.visible = id === selected || id === hovered;
        halo.material = id === selected ? selection : hoverMat;
      }
    };
    const fail = () => { if (!life.disposed) onUnavailable('3D view unavailable. The 2D office remains fully usable.'); };
    const render = () => {
      frameId = 0;
      if (life.disposed || document.hidden) return;
      const horizontal = Math.cos(orbit.pitch) * orbit.distance;
      camera.position.set(orbit.x + Math.sin(orbit.yaw) * horizontal, Math.sin(orbit.pitch) * orbit.distance, orbit.z + Math.cos(orbit.yaw) * horizontal);
      camera.lookAt(orbit.x, 0, orbit.z); camera.updateMatrixWorld();
      try { renderer.render(scene, camera); } catch { fail(); }
    };
    const invalidate = () => { if (!life.disposed && !frameId && !document.hidden) frameId = requestAnimationFrame(render); };
    life.own(() => cancelAnimationFrame(frameId));
    const listen = <K extends keyof HTMLElementEventMap>(target: HTMLElement, event: K, fn: (e: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions) => {
      target.addEventListener(event, fn, options); life.own(() => target.removeEventListener(event, fn, options));
    };
    const observer = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      if (width <= 0 || height <= 0 || life.disposed) return;
      camera.aspect = width / height; camera.updateProjectionMatrix();
      renderer.setSize(width, height, false); invalidate();
    });
    life.own(() => observer.disconnect()); observer.observe(host);
    const raycaster = new Raycaster();
    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return undefined;
      raycaster.setFromCamera(new Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
      const id: unknown = raycaster.intersectObjects(pickables, false)[0]?.object.userData.agentId;
      return typeof id === 'string' && validIds.has(id) ? id : undefined;
    };
    let drag: { id: number; x: number; y: number; moved: number; pan: boolean } | undefined;
    const release = () => {
      if (drag && canvas.hasPointerCapture(drag.id)) canvas.releasePointerCapture(drag.id);
      drag = undefined;
    };
    life.own(release);
    listen(canvas, 'pointerdown', (event) => {
      if (drag || (event.button !== 0 && event.button !== 2)) return;
      canvas.focus({ preventScroll: true });
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0, pan: event.shiftKey || event.button === 2 };
      canvas.setPointerCapture(event.pointerId);
    });
    listen(canvas, 'pointermove', (event) => {
      if (drag && drag.id === event.pointerId) {
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        orbit = navigate(orbit, dx, dy, drag.pan);
        drag.x = event.clientX; drag.y = event.clientY;
      } else { hovered = pick(event); canvas.style.cursor = hovered ? 'pointer' : 'grab'; updateHighlights(); }
      invalidate();
    });
    listen(canvas, 'pointerup', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const click = drag.moved < 5; release();
      if (click) selectAgent(pick(event), validIds, onSelect);
    });
    listen(canvas, 'pointercancel', release);
    listen(canvas, 'lostpointercapture', () => { drag = undefined; });
    listen(canvas, 'pointerleave', () => { hovered = undefined; updateHighlights(); invalidate(); });
    listen(canvas, 'contextmenu', (event) => event.preventDefault());
    listen(canvas, 'wheel', (event) => { event.preventDefault(); orbit = zoom(orbit, event.deltaY); invalidate(); }, { passive: false });
    listen(canvas, 'keydown', (event) => {
      if (event.key === 'Home') orbit = initialOrbit();
      else if (event.key === '+' || event.key === '=') orbit = zoom(orbit, -80);
      else if (event.key === '-') orbit = zoom(orbit, 80);
      else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) orbit = navigate(orbit, event.key === 'ArrowLeft' ? -20 : event.key === 'ArrowRight' ? 20 : 0, event.key === 'ArrowUp' ? -20 : event.key === 'ArrowDown' ? 20 : 0, event.shiftKey);
      else return;
      event.preventDefault(); invalidate();
    });
    listen(canvas, 'blur', release);
    const contextLost = (event: Event) => { event.preventDefault(); fail(); };
    canvas.addEventListener('webglcontextlost', contextLost);
    life.own(() => canvas.removeEventListener('webglcontextlost', contextLost));
    const visibility = () => { release(); if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; } else invalidate(); };
    document.addEventListener('visibilitychange', visibility);
    life.own(() => document.removeEventListener('visibilitychange', visibility));
    updateHighlights(); invalidate();
    return {
      setSelection(id) { if (life.disposed || !validIds.has(id)) return; selected = id; updateHighlights(); invalidate(); },
      reset() { if (life.disposed) return; orbit = initialOrbit(); invalidate(); },
      dispose: () => life.dispose(),
    };
  } catch (error) {
    try { life.dispose(); } catch (cleanupError) { console.error('Office partial cleanup failed', cleanupError); }
    throw error;
  }
}
