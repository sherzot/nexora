import type { Snapshot } from '../simulation/model';
import { agents, rooms } from '../demo/fixtures';
import { boxFaces, floorPoints, points, project } from './geometry';

function Plant({ x, y }: { x: number; y: number }) {
  const [px, py] = project(x, y);
  return <g aria-hidden="true" className="office-plant"><ellipse cx={px} cy={py + 1} rx="15" ry="7" className="scene-shadow" /><path d={`M${px - 10},${py - 20}h20l-3,20h-14Z`} fill="var(--plant-pot)" /><ellipse cx={px} cy={py - 20} rx="10" ry="4" fill="var(--plant-pot-top)" /><path d={`M${px},${py - 20}v-35m0,20q-25,-25 -15,-30q22,8 15,30m0,-5q28,-25 20,-32q-24,5 -20,32`} fill="var(--plant-leaf)" stroke="var(--plant-stem)" strokeWidth="2" /></g>;
}

export function OfficeScene({ selectedId, onSelect, simulation }: { selectedId: string; onSelect: (id: string) => void; simulation?: Snapshot }) {
  return <svg className="office-scene" viewBox="0 0 930 570" role="group" aria-label="Synthetic isometric office. Select an agent here or use the equivalent list below.">
    <defs><pattern id="office-dot-grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--scene-dot)" /></pattern></defs>
    <g aria-hidden="true">
      <rect width="930" height="570" fill="url(#office-dot-grid)" />
      <ellipse cx="450" cy="420" rx="350" ry="100" className="scene-shadow" />
      <polygon points={floorPoints(0, 0, 10, 7)} fill="var(--floor-edge)" transform="translate(0 12)" />
      <polygon points={points([project(0, 0), project(10, 0), project(10, 0, 78), project(0, 0, 78)])} fill="var(--wall-right)" />
      <polygon points={points([project(0, 0), project(0, 7), project(0, 7, 78), project(0, 0, 78)])} fill="var(--wall-left)" />
      {[1, 3, 5].map((y) => <polygon key={y} points={points([project(0, y, 30), project(0, y + 1.3, 30), project(0, y + 1.3, 65), project(0, y, 65)])} fill="var(--window)" stroke="var(--window-frame)" strokeWidth="4" />)}
      <polygon points={floorPoints(0, 0, 10, 7)} fill="var(--floor)" />
      {rooms.map((room) => <g key={room.id}><polygon points={floorPoints(room.x, room.y, room.width, room.depth)} className="room-rug" data-room={room.order} /><text {...{ x: project(room.x + room.width / 2, room.y + room.depth - 0.18)[0], y: project(room.x + room.width / 2, room.y + room.depth - 0.18)[1] }} className="room-caption" textAnchor="middle">{room.name.toUpperCase()}</text></g>)}
      <polygon points={floorPoints(4.65, 0.4, 0.18, 2.7, 30)} fill="var(--partition)" />
      <polygon points={floorPoints(5.1, 3.45, 4.3, 0.16, 28)} fill="var(--partition)" />
      <Plant x={0.5} y={3.55} /><Plant x={9.45} y={0.5} /><Plant x={9.35} y={6.4} />
    </g>
    {agents.map((agent) => {
      const { x, y } = agent.desk;
      const desk = boxFaces(x, y, 1.2, 0.8, 34);
      const [mx, my] = project(x + 0.55, y + 0.12, 49);
      const simulated = simulation?.agents.find((item) => item.id === agent.id);
      const activity = simulated?.activity ?? agent.status;
      const [ax, ay] = simulated ? project((simulated.position.x + 12) / 2.4, (simulated.position.z + 8.4) / 2.4, 70) : project(x + 0.65, y + 0.75, 70);
      const selected = selectedId === agent.id;
      return <g key={agent.id} className="office-agent" data-tone={agent.tone}>
        <g aria-hidden="true"><polygon points={floorPoints(x - 0.1, y - 0.1, 1.45, 1.05)} className="desk-shadow" /><polygon points={desk.left} fill="var(--desk-left)" /><polygon points={desk.right} fill="var(--desk-right)" /><polygon points={desk.top} fill="var(--desk-top)" stroke="var(--desk-outline)" /><path d={`M${mx - 13},${my - 11}l23,11v15l-23,-11Z`} fill="var(--monitor)" stroke="var(--monitor-edge)" strokeWidth="2" /><path d={`M${mx - 8},${my - 5}l13,6`} stroke="var(--monitor-line)" strokeWidth="2" /><ellipse cx={ax} cy={ay + 52} rx="15" ry="7" fill="var(--chair)" /></g>
        <g role="button" tabIndex={0} aria-label={`Select ${agent.name}, ${agent.role}, ${activity}, synthetic agent`} aria-pressed={selected} className={selected ? 'scene-marker is-selected' : 'scene-marker'} onClick={() => onSelect(agent.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(agent.id); } }}>
          <title>{agent.name} · {agent.role} · {agent.status} — demo</title>
          <circle cx={ax} cy={ay} r="24" className="marker-halo" /><circle cx={ax} cy={ay} r="18" className="marker-body" />
          <text x={ax} y={ay + 4} textAnchor="middle" className="marker-initials" aria-hidden="true">{agent.initials}</text>
          <circle cx={ax + 14} cy={ay + 14} r="5" className="scene-status" data-status={activity} aria-hidden="true" />
          <rect x={ax - 29} y={ay + 26} width="58" height="21" rx="6" className="marker-name-bg" /><text x={ax} y={ay + 40} textAnchor="middle" className="marker-name" aria-hidden="true">{agent.name}</text>
        </g>
      </g>;
    })}
    <g aria-hidden="true"><text x="40" y="535" className="scene-footnote">NEXORA / FLOOR 01</text><path d="M840 510l14,-8l14,8l-14,8Z" fill="none" stroke="var(--text-muted)" /><path d="M854 502v-18m-4,5l4,-5l4,5" stroke="var(--text-muted)" fill="none" /><text x="854" y="478" textAnchor="middle" className="scene-footnote">N</text></g>
  </svg>;
}
