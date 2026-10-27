import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { api } from '../../services/api.js';
import { TrackRow } from './TrackRow.jsx';
import { SaveTrackDialog } from './SaveTrackDialog.jsx';
import { Icon } from '../../components/Icon.jsx';

export function MusicSearch() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const requestedPage = Number(params.get('page'));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100 ? requestedPage : 1;
  const [input, setInput] = useState(query);
  const [result, setResult] = useState({ tracks: [], loading: Boolean(query), error: '', hasMore: false });
  const [attempt, setAttempt] = useState(0);
  const [savingTrack, setSavingTrack] = useState(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    api(`/music/search?${new URLSearchParams({ q: query, page: String(page) })}`, { signal: controller.signal }).then(({ data, meta }) => {
      setResult({ tracks: data, hasMore: meta.hasMore, loading: false, error: '' });
    }).catch(error => { if (error.name !== 'AbortError') setResult({ tracks: [], hasMore: false, loading: false, error: error.message }); });
    return () => controller.abort();
  }, [query, page, attempt]);
  function search(event) {
    event.preventDefault();
    const q = input.trim();
    if (q.length < 2 || q.length > 100) { setResult(current => ({ ...current, error: 'Enter 2–100 characters to search.' })); return; }
    setResult(current => ({ ...current, loading: true, error: '' }));
    setParams({ q });
    setAttempt(value => value + 1);
  }
  return <section className="music-search" aria-labelledby="music-search-title">
    <div className="search-surface" data-reveal><div className="search-heading"><h2 id="music-search-title">Find your next sound.</h2><p className="eyebrow">STREAMING FROM JAMENDO</p></div>
    <form className="music-search-form" onSubmit={search}><label htmlFor="music-query"><span className="sr-only">Search by song title or artist</span><Icon name="search" size={25} /><input id="music-query" name="q" type="search" value={input} onChange={event => setInput(event.target.value)} minLength={2} maxLength={100} required autoComplete="off" placeholder="Search a song or an artist…" /></label><Button type="submit">Search music <Icon name="arrow" /></Button></form><p className="search-caption">Independent music from Jamendo. Search, play, make it yours.</p></div><div className="search-outcome">
    {notice ? <p className="success-message" role="status">{notice}</p> : null}
    {result.loading ? <Loading>Searching Jamendo…</Loading> : result.error ? <ErrorMessage message={result.error} onRetry={() => { setResult(current => ({ ...current, loading: true })); setAttempt(value => value + 1); }} /> : query ? result.tracks.length ? <><ul className="track-list" aria-label="Music search results">{result.tracks.map((track, index) => <TrackRow key={track.id} featured={index < 3} track={track} onSave={setSavingTrack} />)}</ul>{page > 1 || result.hasMore ? <div className="pagination"><Button variant="secondary" disabled={page === 1} onClick={() => { setResult(current => ({ ...current, loading: true })); setParams({ q: query, page: String(page - 1) }); }}>Previous results</Button><span>Page {page}</span><Button variant="secondary" disabled={!result.hasMore || page >= 100} onClick={() => { setResult(current => ({ ...current, loading: true })); setParams({ q: query, page: String(page + 1) }); }}>Next results</Button></div> : null}</> : <p className="loading-state">No tracks found. Try a different title or artist.</p> : <p className="search-hint">Search Jamendo’s independent catalog, play a track, and keep it in one of your spaces. Mainstream releases may not be available.</p>}
    </div>
    {savingTrack ? <SaveTrackDialog track={savingTrack} onClose={() => setSavingTrack(null)} onSaved={setNotice} /> : null}
  </section>;
}
