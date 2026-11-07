import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { OfficeOverview } from './views/OfficeOverview';
import { AgentDirectory } from './views/AgentDirectory';
import { AgentDetail } from './views/AgentDetail';
import { TaskBoard } from './views/TaskBoard';
import { ActivityTimeline } from './views/ActivityTimeline';
import { WorkspaceOverview } from './views/WorkspaceOverview';

type Route = { view: 'office' | 'agents' | 'agent' | 'tasks' | 'activity' | 'workspace' | 'unknown'; agentId?: string; taskId?: string };
function routeFromHash(hash: string): Route {
  const [path, query = ''] = (hash.replace(/^#/, '') || '/office').split('?');
  if (path === '/office') return { view: 'office' };
  if (path === '/agents') return { view: 'agents' };
  if (path === '/tasks') return { view: 'tasks', taskId: new URLSearchParams(query).get('task') ?? '' };
  if (path === '/activity') return { view: 'activity' };
  if (path === '/workspace') return { view: 'workspace' };
  if (path.startsWith('/agents/') && path.slice(8) && !path.slice(8).includes('/')) {
    try { return { view: 'agent', agentId: decodeURIComponent(path.slice(8)) }; }
    catch { return { view: 'unknown' }; }
  }
  return { view: 'unknown' };
}

export default function App() {
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
    setTheme('light'); setReducedMotion(false); setResetVersion((value) => value + 1);
    window.location.hash = '/office';
  };
  const active = route.view === 'agent' ? 'agents' : route.view;
  let content;
  switch (route.view) {
    case 'office': content = <OfficeOverview />; break;
    case 'agents': content = <AgentDirectory />; break;
    case 'agent': content = <AgentDetail id={route.agentId ?? ''} />; break;
    case 'tasks': content = <TaskBoard focusedId={route.taskId} />; break;
    case 'activity': content = <ActivityTimeline />; break;
    case 'workspace': content = <WorkspaceOverview theme={theme} onTheme={setTheme} reducedMotion={reducedMotion} onMotion={setReducedMotion} onReset={reset} />; break;
    default: content = <section className="empty-state"><p className="eyebrow">UNKNOWN LOCAL ROUTE</p><h1 id="page-title" tabIndex={-1}>This room is not on the map</h1><p>No demo view matches this address.</p><a className="primary-link" href="#/office">Return to the office</a></section>;
  }
  return <AppShell key={resetVersion} active={active} theme={theme} reducedMotion={reducedMotion}><div key={`${route.view}:${route.agentId ?? ''}:${route.taskId ?? ''}:${resetVersion}`} className="view-content">{content}</div></AppShell>;
}
