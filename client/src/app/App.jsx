import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { ErrorMessage, Loading } from '../components/Feedback.jsx';
import { useSessionStore } from '../stores/sessionStore.js';
import { useEditorStore } from '../stores/editorStore.js';

export function App() {
  const status = useSessionStore(state => state.status);
  const error = useSessionStore(state => state.error);
  const bootstrap = useSessionStore(state => state.bootstrap);
  useEffect(() => { void bootstrap(); }, [bootstrap]);
  return <div className="app-frame"><a className="skip-link" href="#main">Skip to content</a><ShellHeader /><main id="main" className="page-shell" tabIndex={-1}>{status === 'loading' ? <Loading>Connecting to your private world…</Loading> : status === 'error' ? <section className="connection-error"><h1>We couldn’t connect.</h1><ErrorMessage message={error} onRetry={bootstrap} /><p className="muted">Your saved spaces stay in your account. Please try again shortly.</p></section> : <Outlet />}</main><footer className="site-footer"><span>AFTERIMAGE</span><Link to="/about">About & privacy</Link><span>A feeling leaves a trace.</span></footer></div>;
}

function ShellHeader() {
  const user = useSessionStore(state => state.user);
  const logout = useSessionStore(state => state.logout);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dirty = useEditorStore(state => state.dirty);
  const saving = useEditorStore(state => state.saving);
  const navigate = useNavigate();
  async function signOut() {
    setBusy(true);
    setError('');
    try { await logout(); setConfirmLogout(false); navigate('/auth', { replace: true }); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <header className="masthead">
    <Link className="wordmark" to={user ? '/discover' : '/auth'} aria-label="AFTERIMAGE home">AFTERIMAGE</Link>
    <nav aria-label="Main navigation"><NavLink to="/discover">Discover</NavLink><NavLink to="/compose/new" className={({ isActive }) => isActive ? 'active' : undefined}>Compose</NavLink><span className="nav-future" aria-disabled="true" title="Listening arrives in a later milestone">Listen <span>Soon</span></span></nav>
    <div className="account-actions">{user ? <><span className="account-name">{user.displayName}</span><Button variant="text" disabled={busy || saving} onClick={() => dirty ? setConfirmLogout(true) : signOut()}>{busy ? 'Signing out…' : 'Sign out'}</Button></> : <span className="private-label">A space of your own.</span>}</div>
    {error ? <div className="header-error"><ErrorMessage message={error} /></div> : null}
    {confirmLogout ? <ConfirmDialog title="Sign out and discard your edits?" confirmLabel="Discard and sign out" busy={busy} error={error} onCancel={() => setConfirmLogout(false)} onConfirm={signOut}><p>Your unsaved changes will be cleared when you sign out.</p></ConfirmDialog> : null}
  </header>;
}

export function RequireAuth() {
  const user = useSessionStore(state => state.user);
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/auth" state={{ from: location.pathname }} replace />;
}

export function AboutPage() {
  return <article className="prose-page"><h1>A place for<br />your atmosphere.</h1><p>AFTERIMAGE is a personal, music-first project connecting visual moodspaces with listening. This first version lets you create a private account and save spaces with a title, description, and mood tags.</p><h2>What is available</h2><p>Account access and moodspace editing are working features. Music discovery, image blocks, recommendations, and playback are planned for later milestones and are not available yet.</p><h2>Your privacy</h2><p>Your email, display name, password hash, and spaces are stored in MongoDB. Your password is hashed with Argon2id. A necessary session cookie keeps you signed in for up to seven days. We use no analytics or third-party music services in this version.</p><p>Only your account can retrieve or change your spaces. You can delete a space at any time. Self-service account deletion and recovery are not available yet; avoid storing sensitive personal information in this early project.</p><h2>Credits</h2><p>Typography: Barlow Condensed and Source Sans 3, distributed under the SIL Open Font License. The atmospheric compositions are made with CSS. Inspiration screenshots are not shipped as assets.</p><Link className="text-link" to="/discover">Return to Discover</Link></article>;
}

export function NotFoundPage() {
  return <section className="empty-space"><h1>This space isn’t here.</h1><p>The link may have changed, or the page may not exist.</p><Link className="button button--primary" to="/discover">Return to Discover</Link></section>;
}
