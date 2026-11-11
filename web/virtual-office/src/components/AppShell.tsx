import { useState } from 'react';
import type { ReactNode } from 'react';
import { DemoNotice } from './DemoNotice';

const navigation = [
  { key: 'office', href: '#/office', label: 'Virtual Office', mark: '01' },
  { key: 'agents', href: '#/agents', label: 'Agent Directory', mark: '02' },
  { key: 'tasks', href: '#/tasks', label: 'Task Board', mark: '03' },
  { key: 'activity', href: '#/activity', label: 'Activity Timeline', mark: '04' },
  { key: 'workspace', href: '#/workspace', label: 'Workspace', mark: '05' },
  { key: 'collaboration', href: '#/collaboration', label: 'Collaboration', mark: '07' },
  { key: 'analytics', href: '#/analytics', label: 'Simulation Analytics', mark: '06' },
];

export function AppShell({ active, theme, reducedMotion, children }: {
  active: string; theme: 'light' | 'dark'; reducedMotion: boolean; children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell" data-theme={theme} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
    <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to workspace</a>
    <aside className="sidebar">
      <a className="brand" href="#/office" aria-label="NEXORA demo office" onClick={() => setMenuOpen(false)}>
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M3 23V5h6l10 14V5h6v18h-6L9 9v14Z" fill="currentColor" /></svg>
        <span>NEXORA<span className="brand-caption">VIRTUAL OFFICE</span></span>
      </a>
      <button className="menu-toggle" aria-controls="workspace-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>Navigation <span aria-hidden="true">{menuOpen ? '−' : '+'}</span></button>
      <nav id="workspace-navigation" className={menuOpen ? 'navigation is-open' : 'navigation'} aria-label="Main navigation">
        <p className="nav-heading">WORKSPACE</p>
        {navigation.map((item) => <a key={item.key} href={item.href} aria-current={active === item.key ? 'page' : undefined} onClick={() => setMenuOpen(false)}><span className="nav-mark" aria-hidden="true">{item.mark}</span>{item.label}</a>)}
      </nav>
      <div className="sidebar-footer"><span className="workspace-monogram">N</span><div><strong>Design workspace</strong><span>Local demonstration</span></div></div>
    </aside>
    <div className="workspace-shell">
      <header className="topbar"><div className="breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>{navigation.find((item) => item.key === active)?.label ?? 'Page not found'}</strong></div><span className="workspace-tag">FIXTURE 01</span></header>
      <DemoNotice />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="page-footer"><span>NEXORA · Local concept workspace</span><span>No backend connected</span></footer>
    </div>
  </div>;
}
