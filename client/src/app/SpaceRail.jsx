import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import { Artwork } from '../components/Artwork.jsx';

export function SpaceRail() {
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ spaces: [], loading: true, error: '', hasMore: false });
  const location = useLocation();
  const activeId = location.pathname.match(/^\/(?:worlds|spaces|compose)\/([a-f\d]{24})(?:\/edit)?$/)?.[1];
  useEffect(() => {
    const controller = new AbortController();
    api(`/spaces?page=${page}&limit=50`, { signal: controller.signal }).then(({ data, meta }) => {
      setState(current => ({ spaces: page === 1 ? data : [...new Map([...current.spaces, ...data].map(space => [space.id, space])).values()], loading: false, error: '', hasMore: meta.hasMore }));
    }).catch(error => { if (error.name !== 'AbortError') setState(current => ({ ...current, loading: false, error: error.message })); });
    return () => controller.abort();
  }, [page, attempt]);
  useEffect(() => {
    const changed = event => {
      const { space, deletedId } = event.detail;
      setState(current => ({ ...current, spaces: deletedId ? current.spaces.filter(item => item.id !== deletedId) : current.spaces.some(item => item.id === space.id) ? current.spaces.map(item => item.id === space.id ? space : item) : [space, ...current.spaces] }));
      setAttempt(value => value + 1);
    };
    window.addEventListener('afterimage:spaces-changed', changed);
    return () => window.removeEventListener('afterimage:spaces-changed', changed);
  }, []);
  return <aside className="space-rail" aria-label="Your space library">
    <Link className="rail-home" to="/atlas" aria-label="Your spaces" title="Your spaces">AI<span aria-hidden="true">✳</span></Link>
    <Link className="rail-create" to="/worlds/new" aria-label="Create a space" title="Create a space">＋</Link>
    <nav aria-label="Saved spaces" aria-busy={state.loading}><ol>{state.spaces.map(space => <li key={space.id}><Link className="rail-space" to={`/worlds/${space.id}`} aria-label={`Open space: ${space.title}`} aria-current={activeId === space.id ? 'page' : undefined} title={space.title}>
      {space.images?.[0] ? <Artwork sizeHint="48px" src={space.images[0].url} managed={Boolean(space.images[0].assetId)} /> : <span className="rail-monogram" aria-hidden="true">{space.title.slice(0, 2)}</span>}<span className="rail-space-title">{space.title}</span>
    </Link></li>)}</ol>
    {!state.spaces.length && state.loading ? <p className="rail-status" role="status">Loading spaces…</p> : null}
    {!state.spaces.length && !state.loading && !state.error ? <p className="rail-status">Your spaces<br />start here ↑</p> : null}
    {state.error ? <button className="rail-more" onClick={() => { setState(current => ({ ...current, loading: true, error: '' })); setAttempt(value => value + 1); }} title={state.error}>Retry library</button> : null}
    {state.hasMore && !state.error ? <button className="rail-more" disabled={state.loading} onClick={() => { setState(current => ({ ...current, loading: true })); setPage(value => value + 1); }}>{state.loading ? 'Loading…' : 'More spaces ↓'}</button> : null}</nav>
  </aside>;
}
