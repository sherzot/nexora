import { agents, fixtureRevision, rooms, tasks, workflows } from '../demo/fixtures';

export function WorkspaceOverview({ theme, onTheme, reducedMotion, onMotion, onReset }: {
  theme: 'light' | 'dark'; onTheme: (theme: 'light' | 'dark') => void;
  reducedMotion: boolean; onMotion: (reduced: boolean) => void; onReset: () => void;
}) {
  return <><section className="page-heading"><div><p className="eyebrow">YOUR LOCAL VIEW</p><h1 id="page-title" tabIndex={-1}>Workspace</h1><p className="page-description">Presentation preferences for this browser session. Nothing is saved or sent.</p></div></section>
    <div className="workspace-settings"><section className="settings-section"><p className="eyebrow">01 / THE FIXTURE</p><h2>A small, synthetic organization</h2><dl className="workspace-facts"><div><dt>Agents</dt><dd>{agents.length}</dd></div><div><dt>Rooms</dt><dd>{rooms.length}</dd></div><div><dt>Tasks</dt><dd>{tasks.length}</dd></div><div><dt>Workflow examples</dt><dd>{workflows.length}</dd></div></dl><p className="scope-note">Revision {fixtureRevision} · provenance: synthetic-demo</p></section>
      <section className="settings-section"><p className="eyebrow">02 / APPEARANCE</p><h2>Make the workspace comfortable</h2><label className="settings-row"><span><strong>Theme</strong><span>Light or dark, for this session only.</span></span><select value={theme} onChange={(event) => onTheme(event.target.value === 'dark' ? 'dark' : 'light')}><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="settings-row"><span><strong>Reduce motion</strong><span>Your system's reduced-motion preference is always respected.</span></span><input type="checkbox" checked={reducedMotion} onChange={(event) => onMotion(event.target.checked)} /></label></section>
      <section className="settings-section"><p className="eyebrow">03 / START FRESH</p><h2>Reset the local presentation</h2><p>Clear filters, selections and appearance preferences, then return to the office. Fixtures stay unchanged; no backend operation is performed.</p><button className="secondary-button" onClick={onReset}>Reset demo view</button></section>
      <section className="settings-section scope-panel"><p className="eyebrow">SCOPE, EXPLICITLY</p><h2>A visual foundation, not an operating system</h2><p>No backend is connected. Agent profiles, tasks, events and review labels are fictional. There is no real authorization, approval, Run creation, admission, dispatch or persistence.</p><p>D02 is NOT ACCEPTED. Normative obligations remain REVIEW ONLY. O1–O5 and GO-2026-5932 remain OPEN. Operational integration remains BLOCKED.</p></section>
    </div>
  </>;
}
