import { MissionWorkspace } from './views/MissionWorkspace';
import { TaskWorkspace } from './views/TaskWorkspace';
import { CollaborationOverview } from './views/CollaborationOverview';
import { useEffect, useState } from 'react';
import { AnalyticsOverview } from './views/AnalyticsOverview';
import { SimulationTimeline } from './simulation/SimulationTimeline';
import { SimulationControls } from './simulation/SimulationControls';
import { useSimulation } from './simulation/SimulationProvider';
import { AppShell } from './components/AppShell';
import { OfficeOverview } from './views/OfficeOverview';
import { AgentDirectory } from './views/AgentDirectory';
import { AgentDetail } from './views/AgentDetail';
import { TaskBoard } from './views/TaskBoard';
import { ActivityTimeline } from './views/ActivityTimeline';
import { WorkspaceOverview } from './views/WorkspaceOverview';

type Route = { view: 'office' | 'agents' | 'agent' | 'tasks' | 'task' | 'mission' | 'activity' | 'workspace' | 'analytics' | 'collaboration' | 'unknown'; agentId?: string; taskId?: string; interactionId?: string };
function routeFromHash(hash: string): Route {
  const [path, query = ''] = (hash.replace(/^#/, '') || '/office').split('?');
  if (path === '/office') return { view: 'office' };
  if (path === '/agents') return { view: 'agents' };
  if (path === '/tasks') return { view: 'tasks', taskId: new URLSearchParams(query).get('task') ?? '' };
  if (/^\/tasks\/[^/]+$/.test(path)) {
    try { return { view: 'task', taskId: decodeURIComponent(path.slice(7)) }; }
    catch { return { view: 'task' }; }
  }
  if (path === '/mission') return { view: 'mission' };
  if (path === '/activity') return { view: 'activity', interactionId: new URLSearchParams(query).get('interaction') ?? undefined };
  if (path === '/collaboration') return { view: 'collaboration' };
  if (path === '/analytics') return { view: 'analytics' };
  if (path === '/workspace') return { view: 'workspace' };
  if (path.startsWith('/agents/') && path.slice(8) && !path.slice(8).includes('/')) {
    try { return { view: 'agent', agentId: decodeURIComponent(path.slice(8)) }; }
    catch { return { view: 'unknown' }; }
  }
  return { view: 'unknown' };
}

export default function App() {
  const { view: simulation, controller } = useSimulation();
  const [hash, setHash] = useState(() => window.location.hash);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const route = routeFromHash(hash);
  useEffect(() => {
    const changed = () => setHash(window.location.hash);
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    document.getElementById('page-title')?.focus({ preventScroll: true });
  }, [hash, resetVersion]);
  const reset = () => {
    controller.reset(); setTheme('light'); setReducedMotion(false); setResetVersion((value) => value + 1);
    window.location.hash = '/office';
  };
  const active = route.view === 'agent' ? 'agents' : route.view === 'task' ? 'tasks' : route.view;
  let content;
  switch (route.view) {
    case 'office': content = <OfficeOverview dark={theme === 'dark'} reducedMotion={reducedMotion} />; break;
    case 'agents': content = <AgentDirectory />; break;
    case 'agent': content = <AgentDetail id={route.agentId ?? ''} />; break;
    case 'mission': content = <MissionWorkspace dark={theme === 'dark'} reducedMotion={reducedMotion} />; break;
    case 'task': content = <TaskWorkspace id={route.taskId ?? ''} />; break;
    case 'tasks': content = <TaskBoard focusedId={route.taskId} />; break;
    case 'activity': content = route.interactionId ? <SimulationTimeline interactionId={route.interactionId} /> : <ActivityTimeline />; break;
    case 'collaboration': content = <CollaborationOverview />; break;
    case 'analytics': content = <AnalyticsOverview />; break;
    case 'workspace': content = <WorkspaceOverview theme={theme} onTheme={setTheme} reducedMotion={reducedMotion} onMotion={setReducedMotion} onReset={reset} />; break;
    default: content = <section className="empty-state"><p className="eyebrow">UNKNOWN LOCAL ROUTE</p><h1 id="page-title" tabIndex={-1}>This room is not on the map</h1><p>No demo view matches this address.</p><a className="primary-link" href="#/office">Return to the office</a></section>;
  }
  return <AppShell key={resetVersion} active={active} theme={theme} reducedMotion={reducedMotion}><SimulationControls /><div key={`${route.view === 'office' || route.view === 'task' || route.view === 'mission' ? route.view : simulation.epoch}:${route.view}:${route.agentId ?? ''}:${route.taskId ?? ''}:${route.interactionId ?? ''}:${resetVersion}`} className="view-content">{content}</div></AppShell>;
}
