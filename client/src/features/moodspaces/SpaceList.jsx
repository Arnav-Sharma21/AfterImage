import { spaceAtmosphere } from '../../components/spaceAtmosphere.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Arrow } from '../../components/Arrow.jsx';
import { Button } from '../../components/Button.jsx';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { api } from '../../services/api.js';
import { TracePrint } from '../../components/TracePrint.jsx';
import { Artwork } from '../../components/Artwork.jsx';

export function SpaceList() {
  const [state, setState] = useState({ spaces: [], loading: true, error: '', hasMore: false });
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api(`/spaces?page=${page}`, { signal: controller.signal }).then(({ data, meta }) => {
      setState({ spaces: data, loading: false, error: '', hasMore: meta.hasMore });
    }).catch(error => {
      if (error.name !== 'AbortError') setState(current => ({ ...current, loading: false, error: error.message }));
    });
    return () => controller.abort();
  }, [page, attempt]);

  function changePage(next) {
    setState(current => ({ ...current, loading: true, error: '' }));
    setPage(next);
  }

  return <section className="spaces-section" aria-labelledby="spaces-title">
    <div className="section-heading"><div><p className="eyebrow">AN ATLAS OF YOUR INNER WORLD</p><h2 id="spaces-title">Your spaces</h2></div><Link className="text-link" to="/compose/new">Create a space <Arrow /></Link></div>
    {state.loading ? <Loading>Retrieving your spaces…</Loading> : state.error ? <ErrorMessage message={state.error} onRetry={() => { setState(current => ({ ...current, loading: true })); setAttempt(value => value + 1); }} /> : state.spaces.length === 0 ? <div className="empty-space">
      <h3>A place for what stays with you.</h3>
      <p>A late night, a half-remembered summer, a clear head. Give it a title and a few moods.</p>
      <Link className="button button--primary" to="/compose/new">Compose your first space <Arrow /></Link>
    </div> : <>
      <ol className="space-list">
        {state.spaces.map((space, index) => <li key={space.id} style={spaceAtmosphere(space)}>
          <div className="space-row"><Link to={`/spaces/${space.id}`} className="space-row-main">
            <div className="space-cover">{space.images?.[0] ? <Artwork src={space.images[0].url} /> : <TracePrint seed={space.title} />}{space.images?.[1] ? <Artwork className="space-cover-inset" src={space.images[1].url} /> : null}<span className="space-cover-type" aria-hidden="true">PRIVATE<br />ATMOSPHERE</span></div>
            <span className="space-index" aria-hidden="true">{String((page - 1) * 20 + index + 1).padStart(2, '0')}</span>
            <div className="space-row-content"><h3>{space.title}</h3><p>{space.description || 'A feeling taking shape.'}</p><div className="tag-list">{space.moods.map(mood => <span key={mood}>{mood}</span>)}</div></div>
            <Arrow diagonal />
          </Link><Link className="text-link" to={`/spaces/${space.id}#sound`} aria-label={`Find my sound for ${space.title}`}>Find my sound</Link></div>
        </li>)}
      </ol>
      {page > 1 || state.hasMore ? <div className="pagination"><Button variant="secondary" disabled={page === 1} onClick={() => changePage(page - 1)}>Previous page</Button><span>Page {page}</span><Button variant="secondary" disabled={!state.hasMore} onClick={() => changePage(page + 1)}>Next page</Button></div> : null}
    </>}
  </section>;
}
