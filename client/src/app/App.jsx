import { Suspense, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { ErrorMessage, Loading } from '../components/Feedback.jsx';
import { useSessionStore } from '../stores/sessionStore.js';
import { useEditorStore } from '../stores/editorStore.js';
import { PlayerHost } from '../features/player/PlayerHost.jsx';
import { PlayerNotice, PlayerSummary } from '../features/player/PlayerControls.jsx';
import { PlayerUIProvider } from '../features/player/PlayerUI.jsx';

export function App() {
  const status = useSessionStore(state => state.status);
  const error = useSessionStore(state => state.error);
  const bootstrap = useSessionStore(state => state.bootstrap);
  const userId = useSessionStore(state => state.user?.id);
  const location = useLocation();
  useEffect(() => { void bootstrap(); }, [bootstrap]);
  useEffect(() => {
    if (status === 'ready') document.getElementById('main')?.focus({ preventScroll: true });
  }, [location.pathname, status]);
  return <PlayerUIProvider key={userId || 'anonymous'}><div className={`app-frame view-${location.pathname.split('/')[1] || 'discover'}`}><PlayerHost /><a className="skip-link" href="#main">Skip to content</a><ShellHeader /><PlayerNotice /><main id="main" className="page-shell" tabIndex={-1}>{status === 'loading' ? <Loading>Connecting to your private world…</Loading> : status === 'error' ? <section className="connection-error"><h1>We couldn’t connect.</h1><ErrorMessage message={error} onRetry={bootstrap} /><p className="muted">Your saved spaces stay in your account. Please try again shortly.</p></section> : <Suspense fallback={<Loading>Opening your space…</Loading>}><Outlet /></Suspense>}</main><footer className="site-footer"><span>AFTERIMAGE — A feeling leaves a trace.</span><Link to="/about">About & privacy</Link><span>Independent sound. Personal worlds.</span></footer>{userId ? <PlayerSummary /> : null}</div></PlayerUIProvider>;
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
  const location = useLocation();
  const composing = /^\/(?:compose|spaces)(?:\/|$)/.test(location.pathname);
  async function signOut() {
    setBusy(true);
    setError('');
    try { await logout(); setConfirmLogout(false); navigate('/auth', { replace: true }); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <header className="masthead">
    <Link className="wordmark" to={user ? '/discover' : '/auth'} aria-label="AFTERIMAGE home"><span className="brand-symbol" aria-hidden="true">a.</span><span>AFTERIMAGE<small>Music as an environment</small></span></Link>
    <nav className="editorial-nav" aria-label="Main navigation"><NavLink to="/discover"><span className="nav-mark" aria-hidden="true">↗</span>Discover</NavLink><Link to="/compose/new" className={composing ? 'active' : undefined} aria-current={composing ? 'page' : undefined}><span className="nav-mark" aria-hidden="true">＋</span>Compose</Link><NavLink to="/listen"><span className="nav-mark" aria-hidden="true">◉</span>Listen</NavLink></nav>
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
  return <article className="prose-page"><h1>A place for<br />your atmosphere.</h1><p>AFTERIMAGE is a personal, music-first project connecting visual moodspaces with listening. Create a private account, compose moodspaces, and keep real music from Jamendo inside them.</p><h2>What is available</h2><p>Search by title or artist, play tracks, manage a listening queue, and save music to your spaces. Find my sound turns saved mood tags, words, manual captions, and music preferences into explainable recommendations. Add, edit and reorder image references, quotes and thoughts in a private collage, then listen in an artwork-led focus view. Images use HTTPS URLs; file uploads are not available.</p><h2>Your privacy</h2><p>Your email, display name, password hash, and spaces are stored in MongoDB. Your password is hashed with Argon2id. A necessary session cookie keeps you signed in for up to seven days. Search queries, derived catalog tags, and selected track IDs are sent to Jamendo. Your raw descriptions, quotes, and captions stay on our backend; likes and dislikes are stored privately to personalize your own recommendations. Audio and album artwork load directly from the provider. Your chosen images load directly from their external HTTPS hosts, which receive your network request. The image URL, description, caption and order are stored with your private space; image captions can guide text matching. We do not proxy images or analyze pixels. We use no analytics. Audio files are not stored on our server.</p><p>Only your account can retrieve or change your spaces. You can delete a space at any time. Self-service account deletion and recovery are not available yet; avoid storing sensitive personal information in this early project.</p><h2>Music credits</h2><p>Music is provided by Jamendo and its artists for this noncommercial project. Each track includes creator credit, a source link, and its Creative Commons license. Only eligible streams are offered. Licensing differs by recording; a stream is not permission to reuse music in a video or download it.</p><h2>Credits</h2><p>Typography: Archivo Black, Manrope, Cormorant Garamond, and IBM Plex Mono, distributed under the SIL Open Font License. The night-listener and rain-passage images are original AI-generated editorial artwork made for AFTERIMAGE. The interactive echo ribbon is original parametric 3D geometry. Motion and imagery are presentation, not audio analysis. Inspiration screenshots are not shipped as assets.</p><Link className="text-link" to="/discover">Return to Discover</Link></article>;
}

export function NotFoundPage() {
  return <section className="empty-space"><h1>This space isn’t here.</h1><p>The link may have changed, or the page may not exist.</p><Link className="button button--primary" to="/discover">Return to Discover</Link></section>;
}
