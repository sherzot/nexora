import { AmbientLight, BoxGeometry, Color, CylinderGeometry, DirectionalLight, Group, InstancedMesh, Mesh, MeshStandardMaterial, PCFShadowMap, PerspectiveCamera, Raycaster, Scene, SphereGeometry, TorusGeometry, Vector2, WebGLRenderer } from 'three';
import type { Snapshot } from '../../simulation/model';
import type { OrbitState } from './runtime';
import type { DemoAgent, DemoRoom } from '../../demo/model';
import { createLifetime, focusPoint, initialOrbit, navigate, overviewForAspect, selectAgent, transitionOrbit, zoom } from './runtime';

export interface OfficeRenderer {
  setSimulation(snapshot: Snapshot | undefined, playing: boolean, speed: number): void;
  setCollaboration(source?: string, target?: string): void;
  setSelection(id: string): void;
  zoomBy(delta: number): void;
  focusAgent(id: string): void;
  focusZone(id: string): void;
  setReducedMotion(reduced: boolean): void;
  reset(): void;
  dispose(): void;
}
export function createOfficeRenderer(host: HTMLElement, agents: readonly DemoAgent[], rooms: readonly DemoRoom[], selectedId: string, dark: boolean, onSelect: (id: string) => void, onUnavailable: (reason: string, canvasHadFocus: boolean) => void, onHover: (id: string | undefined) => void = () => {}, reducedMotion = false): OfficeRenderer {
  const life = createLifetime();
  try {
    const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    life.own(() => renderer.forceContextLoss());
    life.own(() => renderer.dispose());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    // Architecture, furniture and lights are static; camera/selection do not invalidate shadows.
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
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
    const floorMat = material(dark ? '#243142' : '#d9d1c1');
    const wallMat = material(dark ? '#445167' : '#f8f7f1');
    const wood = material(dark ? '#776751' : '#c5a77d');
    const frame = material(dark ? '#202939' : '#4e5a65');
    const screen = material(dark ? '#365a78' : '#334c60');
    screen.emissive.set('#19364a'); screen.emissiveIntensity = 0.35;
    const foliage = material('#547765');
    const pot = material('#b7a597');
    const head = material('#d9b99c');
    const glass = material(dark ? '#506f84' : '#95b5c1'); glass.transparent = true; glass.opacity = 0.3; glass.depthWrite = false;
    const trim = material(dark ? '#344659' : '#e9e4d9');
    const paper = material(dark ? '#b4b7ab' : '#f7f4e8');
    const statusMats = { Focused: material('#487bd0'), Available: material('#4b956e'), Reviewing: material('#b4863e'), Away: material('#818b9c') };
    const zoneMats = ['#a4bed4', '#a4c4b5', '#d4bc8f', '#bcb0d0'].map((c) => {
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
    // Raised plinth and restrained floor seams articulate a single continuous floor.
    mesh(box, frame, 0, -0.38, 0, 24.25, 0.12, 18.25);
    for (let z = -8; z < 9; z += 1.5) mesh(box, trim, 0, 0.006, z, 24, 0.008, 0.025);
    // Rear cutaway walls leave all four fixture-owned zones visible.
    mesh(box, wallMat, 0, 1.3, -9, 24, 2.6, 0.16);
    mesh(box, wallMat, -12, 1.3, 0, 0.16, 2.6, 18);
    mesh(box, frame, 0, 0.16, -8.88, 24, 0.25, 0.08);
    mesh(box, frame, -11.88, 0.16, 0, 0.08, 0.25, 18);
    for (const x of [-9, -5, 1, 5, 9]) {
      mesh(box, frame, x, 1.6, -8.88, 2.8, 1.55, 0.08);
      mesh(box, glass, x, 1.6, -8.81, 2.6, 1.35, 0.04).castShadow = false;
      mesh(box, trim, x, 1.6, -8.76, 0.045, 1.35, 0.04);
    }
    for (const room of rooms) {
      const x = 2.4 * (room.x + room.width / 2) - 12;
      const z = 2.4 * (room.y + room.depth / 2) - 8.4;
      mesh(box, zoneMats[(room.order - 1) % 4], x, 0.025, z, room.width * 2.4, 0.05, room.depth * 2.4);
      // A low utility wall gives each zone a distinct purpose without hiding agents.
      const edgeZ = 2.4 * room.y - 8.4 + 0.25;
      if (room.order === 1) {
        mesh(box, frame, x, 0.8, edgeZ, 3.8, 1.6, 0.16);
        mesh(box, paper, x, 0.85, edgeZ + 0.1, 3.5, 1.25, 0.03);
        for (let i = 0; i < 4; i++) mesh(box, tones[i % 2 ? 'amber' : 'blue'], x - 1.1 + i * 0.7, 0.9, edgeZ + 0.13, 0.42, 0.45, 0.02);
      } else if (room.order === 2) {
        for (let i = 0; i < 3; i++) {
          mesh(box, frame, x - 1.5 + i * 1.5, 0.5, edgeZ, 1.15, 1, 0.55);
          mesh(box, screen, x - 1.5 + i * 1.5, 0.76, edgeZ + 0.29, 0.65, 0.05, 0.02);
        }
      } else if (room.order === 3) {
        mesh(box, wood, x, 0.45, edgeZ, 4, 0.9, 0.6);
        mesh(box, paper, x, 0.91, edgeZ, 3.8, 0.06, 0.65);
        for (let i = 0; i < 3; i++) mesh(cylinder, tones.amber, x - 1.2 + i * 1.2, 1.1, edgeZ, 0.17, 0.32, 0.17);
      } else {
        mesh(box, wood, x, 0.75, edgeZ, 4.8, 1.5, 0.5);
        for (let i = 0; i < 9; i++) mesh(box, i % 2 ? tones.lavender : paper, x - 2 + i * 0.48, 1.05, edgeZ + 0.28, 0.27, 0.6, 0.3);
      }
    }
    // Low dividers, not full-height front walls, preserve overview selection.
    mesh(box, wallMat, -0.5, 0.55, -4, 0.12, 1.1, 7);
    mesh(box, wallMat, 6, 0.55, 0.35, 10, 1.1, 0.12);
    const pickables: Mesh[] = [];
    const highlights = new Map<string, Mesh>();
    const avatars = new Map<string, Group>();
    const badges = new Map<string, Mesh>();
    const staticBadgeMaterials = new Map<string, MeshStandardMaterial>();
    const agentPositions = new Map<string, { x: number; z: number }>();
    const validIds = new Set<string>(agents.map((agent) => agent.id));
    for (const agent of agents) {
      const x = 2.4 * (agent.desk.x + 0.6) - 12;
      const z = 2.4 * (agent.desk.y + 0.4) - 8.4;
      mesh(box, wood, x, 1, z, 2.65, 0.16, 1.65);
      mesh(box, frame, x, 1.095, z + 0.27, 0.8, 0.025, 0.3);
      mesh(box, paper, x + 0.95, 1.1, z + 0.2, 0.36, 0.035, 0.45);
      mesh(cylinder, pot, x - 0.95, 1.21, z + 0.3, 0.1, 0.24, 0.1);
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
      mesh(box, frame, 0, 0.7, 0.28, 0.64, 0.6, 0.09, avatar);
      const badge = mesh(sphere, statusMats[agent.status], 0.38, 1.9, 0, 0.12, 0.12, 0.12, avatar);
      badge.userData.agentId = agent.id; pickables.push(badge);
      agentPositions.set(agent.id, { x, z: z + 1.5 });
      avatars.set(agent.id, avatar); badges.set(agent.id, badge); staticBadgeMaterials.set(agent.id, statusMats[agent.status]);
      // Avatar movement is presentation-only; static architecture shadows remain cached.
      for (const child of avatar.children) if (child instanceof Mesh) child.castShadow = false;
      const halo = mesh(ring, selection, 0, 0.1, 0, 1, 1, 1, avatar); halo.rotation.x = -Math.PI / 2; halo.castShadow = false;
      highlights.set(agent.id, halo);
    }
    for (const [x, z] of [[-11, 0.3], [10.8, -7.8], [10.8, 7.6]]) {
      mesh(cylinder, pot, x, 0.35, z, 0.42, 0.7, 0.42);
      mesh(sphere, foliage, x, 1, z, 0.65, 0.8, 0.65);
    }
    // Batch repeated static furniture by shared geometry/material, preserving avatar hit meshes.
    const batches = new Map<string, Mesh[]>();
    for (const item of [...scene.children]) {
      if (!(item instanceof Mesh) || !item.castShadow || !(item.material instanceof MeshStandardMaterial)) continue;
      const key = `${item.geometry.uuid}:${item.material.uuid}`;
      const list = batches.get(key) ?? []; list.push(item); batches.set(key, list);
    }
    for (const items of batches.values()) {
      if (items.length < 3) continue;
      const batch = new InstancedMesh(items[0].geometry, items[0].material, items.length);
      items.forEach((item, index) => { item.updateMatrix(); batch.setMatrixAt(index, item.matrix); scene.remove(item); });
      batch.castShadow = true; batch.receiveShadow = true; scene.add(batch);
      life.own(() => batch.dispose());
    }
    scene.add(new AmbientLight(dark ? '#b1c7e6' : '#ffffff', dark ? 1.4 : 1.8));
    const sun = new DirectionalLight('#fff0d6', dark ? 2.4 : 2.8);
    sun.position.set(4, 18, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 0.1, far: 55 });
    sun.shadow.normalBias = 0.04; scene.add(sun);
    life.own(() => sun.shadow.dispose());
    let orbit = initialOrbit();
    let selected = selectedId;
    let transition: { from: OrbitState; to: OrbitState; start: number } | undefined;
    let reduced = reducedMotion;
    let overview = true;
    let simulated: Snapshot | undefined;
    let motionStart = 0, motionDuration = 500, movement = false;
    let lastSpeed = 1;
    const targets = new Map<string, { fromX: number; fromZ: number; x: number; z: number }>();
    const snapPositions = () => {
      for (const agent of agents) {
        const position = simulated?.agents.find((item) => item.id === agent.id)?.position ?? agentPositions.get(agent.id)!;
        avatars.get(agent.id)?.position.set(position.x, 0, position.z);
      }
      movement = false; targets.clear();
    };
    let collaborationSource: string | undefined, collaborationTarget: string | undefined;
    let hovered: string | undefined;
    let frameId = 0;
    let hoverPoint: { x: number; y: number } | undefined;
    const updateHighlights = () => {
      for (const [id, halo] of highlights) {
        const participant = id === collaborationSource || id === collaborationTarget;
        halo.visible = id === selected || id === hovered || participant;
        halo.material = id === selected ? selection : participant ? statusMats.Reviewing : hoverMat;
        const scale = id === selected ? 1.2 : 1;
        halo.scale.setScalar(scale);
      }
    };
    const clearHover = () => {
      hoverPoint = undefined;
      if (hovered) { hovered = undefined; onHover(undefined); updateHighlights(); }
      canvas.style.cursor = 'grab';
    };
    const fail = () => {
      if (life.disposed) return;
      const canvasHadFocus = document.activeElement === canvas;
      try { life.dispose(); }
      catch (error) { console.error('Office cleanup failed', error); }
      onUnavailable('3D view unavailable. The 2D office remains fully usable.', canvasHadFocus);
    };
    const render = (time: number) => {
      frameId = 0;
      if (life.disposed || document.hidden) return;
      const animated = Boolean(transition || movement);
      if (transition) {
        const progress = (time - transition.start) / 480;
        orbit = transitionOrbit(transition.from, transition.to, progress);
        if (progress >= 1) transition = undefined;
      }
      if (movement) {
        const progress = Math.min(1, Math.max(0, (time - motionStart) / motionDuration));
        for (const [id, target] of targets) avatars.get(id)?.position.set(target.fromX + (target.x - target.fromX) * progress, 0, target.fromZ + (target.z - target.fromZ) * progress);
        if (progress >= 1) { movement = false; targets.clear(); }
      }
      const horizontal = Math.cos(orbit.pitch) * orbit.distance;
      camera.position.set(orbit.x + Math.sin(orbit.yaw) * horizontal, Math.sin(orbit.pitch) * orbit.distance, orbit.z + Math.cos(orbit.yaw) * horizontal);
      camera.lookAt(orbit.x, 0, orbit.z); camera.updateMatrixWorld();
      if (hoverPoint) {
        const next = pick(hoverPoint.x, hoverPoint.y);
        hoverPoint = undefined;
        if (next !== hovered) {
          hovered = next;
          onHover(hovered);
          canvas.style.cursor = hovered ? 'pointer' : 'grab';
          updateHighlights();
        } else if (!animated && !dirty) {
          return;
        }
      }
      dirty = false;
      try { renderer.render(scene, camera); }
      catch (error) { console.warn('Office rendering failed', error); fail(); return; }
      if (transition || movement) invalidate();
    };
    let dirty = true;
    const scheduleFrame = () => {
      if (!life.disposed && !frameId && !document.hidden) frameId = requestAnimationFrame(render);
    };
    const invalidate = () => { dirty = true; scheduleFrame(); };
    const moveTo = (target: OrbitState) => {
      release(); clearHover();
      transition = reduced ? undefined : { from: { ...orbit }, to: target, start: performance.now() };
      if (reduced) orbit = target;
      invalidate();
    };
    const cancelTransition = () => { transition = undefined; overview = false; clearHover(); };
    life.own(() => {
      transition = undefined;
      movement = false;
      hoverPoint = undefined;
      targets.clear();
      cancelAnimationFrame(frameId);
      frameId = 0;
    });
    const listen = <K extends keyof HTMLElementEventMap>(target: HTMLElement, event: K, fn: (e: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions) => {
      target.addEventListener(event, fn, options); life.own(() => target.removeEventListener(event, fn, options));
    };
    let width = 0, height = 0, ratio = 1;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || life.disposed) return;
      const nextWidth = entry.contentRect.width, nextHeight = entry.contentRect.height;
      if (nextWidth <= 0 || nextHeight <= 0) return;
      const nextRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      if (width === nextWidth && height === nextHeight && ratio === nextRatio) return;
      const aspect = nextWidth / nextHeight;
      if (!width || camera.aspect !== aspect) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        if (overview) { orbit = overviewForAspect(aspect); transition = undefined; }
      }
      renderer.setDrawingBufferSize(nextWidth, nextHeight, nextRatio);
      width = nextWidth; height = nextHeight; ratio = nextRatio;
      invalidate();
    });
    life.own(() => observer.disconnect()); observer.observe(host);
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const hits: ReturnType<Raycaster['intersectObjects']> = [];
    const pick = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return undefined;
      pointer.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
      for (const avatar of avatars.values()) avatar.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      hits.length = 0;
      const id: unknown = raycaster.intersectObjects(pickables, false, hits)[0]?.object.userData.agentId;
      hits.length = 0;
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
      cancelTransition();
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
        invalidate();
      } else if (!drag && event.isPrimary) {
        hoverPoint = { x: event.clientX, y: event.clientY };
        scheduleFrame();
      }
    });
    listen(canvas, 'pointerup', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const click = drag.moved < 5; release();
      if (click) selectAgent(pick(event.clientX, event.clientY), validIds, onSelect);
    });
    listen(canvas, 'pointercancel', release);
    listen(canvas, 'lostpointercapture', () => { drag = undefined; });
    listen(canvas, 'pointerleave', () => { clearHover(); invalidate(); });
    listen(canvas, 'contextmenu', (event) => event.preventDefault());
    listen(canvas, 'wheel', (event) => { event.preventDefault(); cancelTransition(); orbit = zoom(orbit, event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1)); invalidate(); }, { passive: false });
    listen(canvas, 'keydown', (event) => {
      if (event.key === 'Home') { overview = true; moveTo(overviewForAspect(camera.aspect)); }
      else if (event.key === '+' || event.key === '=') orbit = zoom(orbit, -80);
      else if (event.key === '-') orbit = zoom(orbit, 80);
      else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) orbit = navigate(orbit, event.key === 'ArrowLeft' ? -20 : event.key === 'ArrowRight' ? 20 : 0, event.key === 'ArrowUp' ? -20 : event.key === 'ArrowDown' ? 20 : 0, event.shiftKey);
      else return;
      if (event.key !== 'Home') cancelTransition();
      event.preventDefault(); invalidate();
    });
    listen(canvas, 'blur', release);
    const contextLost = (event: Event) => { event.preventDefault(); fail(); };
    canvas.addEventListener('webglcontextlost', contextLost);
    life.own(() => canvas.removeEventListener('webglcontextlost', contextLost));
    const visibility = () => { release(); if (document.hidden && transition) { orbit = transition.to; transition = undefined; } if (document.hidden) { clearHover(); cancelAnimationFrame(frameId); frameId = 0; } else invalidate(); };
    document.addEventListener('visibilitychange', visibility);
    life.own(() => document.removeEventListener('visibilitychange', visibility));
    updateHighlights(); invalidate();
    return {
      setSimulation(snapshot, playing, speed) {
        if (life.disposed) return;
        const sameTick = simulated?.tick === snapshot?.tick && simulated?.scenario === snapshot?.scenario && simulated?.seed === snapshot?.seed;
        simulated = snapshot;
        let changed = false;
        const activities = { idle: statusMats.Away, moving: statusMats.Focused, working: statusMats.Focused, collaborating: statusMats.Available, reviewing: statusMats.Reviewing, completed: statusMats.Available };
        for (const agent of agents) {
          const badge = badges.get(agent.id)!;
          const activity = snapshot?.agents.find((item) => item.id === agent.id)?.activity;
          const material = activity ? activities[activity] : staticBadgeMaterials.get(agent.id)!;
          if (badge.material !== material) { badge.material = material; changed = true; }
        }
        if (!snapshot) { snapPositions(); changed = true; }
        else if (!sameTick) {
          if (reduced || !playing) { snapPositions(); changed = true; }
          else {
            targets.clear();
            for (const agent of snapshot.agents) {
              const position = avatars.get(agent.id)!.position;
              if (position.x !== agent.position.x || position.z !== agent.position.z) targets.set(agent.id, { fromX: position.x, fromZ: position.z, x: agent.position.x, z: agent.position.z });
            }
            motionStart = performance.now(); motionDuration = 500 / speed; movement = targets.size > 0;
          }
        } else if (!playing && movement) { snapPositions(); changed = true; }
        else if (movement && lastSpeed !== speed) {
          for (const [id, target] of targets) { const position = avatars.get(id)!.position; target.fromX = position.x; target.fromZ = position.z; }
          motionStart = performance.now(); motionDuration = 500 / speed;
        }
        lastSpeed = speed;
        if (changed || movement) invalidate();
      },
      setCollaboration(source, target) {
        if (life.disposed || (collaborationSource === source && collaborationTarget === target)) return;
        collaborationSource = source; collaborationTarget = target; updateHighlights(); invalidate();
      },
      setSelection(id) { if (life.disposed || selected === id || !validIds.has(id)) return; selected = id; updateHighlights(); invalidate(); },
      zoomBy(delta) { if (life.disposed) return; cancelTransition(); orbit = zoom(orbit, delta); invalidate(); },
      focusAgent(id) {
        const point = avatars.get(id)?.position; if (life.disposed || !point) return;
        overview = false; moveTo(focusPoint(orbit, point.x, point.z));
      },
      focusZone(id) {
        const room = rooms.find((item) => item.id === id); if (life.disposed || !room) return;
        overview = false; moveTo(focusPoint(orbit, 2.4 * (room.x + room.width / 2) - 12, 2.4 * (room.y + room.depth / 2) - 8.4, 27));
      },
      setReducedMotion(value) { reduced = value; if (reduced && movement) { snapPositions(); invalidate(); } if (reduced && transition) { orbit = transition.to; transition = undefined; invalidate(); } },
      reset() { if (life.disposed) return; overview = true; moveTo(overviewForAspect(camera.aspect)); },
      dispose: () => life.dispose(),
    };
  } catch (error) {
    try { life.dispose(); } catch (cleanupError) { console.error('Office partial cleanup failed', cleanupError); }
    throw error;
  }
}
