import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { Button } from '../../components/Button.jsx';
import { Loading } from '../../components/Feedback.jsx';
import { api } from '../../services/api.js';

export function SaveTrackDialog({ track, onClose, onSaved, defaultSpaceId }) {
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState(defaultSpaceId || '');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api(`/spaces?limit=50&page=${page}`, { signal: controller.signal }),
      defaultSpaceId ? api(`/spaces/${defaultSpaceId}`, { signal: controller.signal }).catch(failure => { if (failure.name === 'AbortError') throw failure; return { data: null }; }) : Promise.resolve({ data: null })
    ]).then(([{ data, meta }, { data: origin }]) => {
      if (origin && !data.some(space => space.id === origin.id)) data = [origin, ...data];
      setSpaces(data); setSpaceId(current => data.some(space => space.id === current) ? current : data[0]?.id || ''); setHasMore(meta.hasMore); setLoading(false);
    }).catch(failure => { if (failure.name !== 'AbortError') { setError(failure.message); setLoading(false); } });
    return () => controller.abort();
  }, [page, defaultSpaceId]);
  async function save() {
    if (!spaceId || busy) return;
    setBusy(true); setError('');
    try {
      await api(`/spaces/${spaceId}/tracks/${track.provider}/${track.providerTrackId}`, { method: 'PUT', body: {} });
      onSaved(`“${track.title}” is saved to your space.`, spaceId);
      onClose();
    } catch (failure) { if (failure.name !== 'AbortError') setError(failure.message); }
    finally { setBusy(false); }
  }
  return <ConfirmDialog title="Keep this track in a space" confirmLabel="Save track" busy={busy} confirmDisabled={!spaceId || loading} error={error} onCancel={onClose} onConfirm={save}>
    <p>{track.title} · {track.artistName}</p>
    {loading ? <Loading>Retrieving your spaces…</Loading> : spaces.length ? <><label className="space-select-label" htmlFor="track-space">Choose your space<select id="track-space" value={spaceId} onChange={event => setSpaceId(event.target.value)} disabled={busy}>{spaces.map(space => <option key={space.id} value={space.id}>{space.title}</option>)}</select></label>{page > 1 || hasMore ? <div className="pagination"><Button variant="text" disabled={page === 1 || busy} onClick={() => { setLoading(true); setPage(page - 1); }}>Previous spaces</Button><Button variant="text" disabled={!hasMore || busy} onClick={() => { setLoading(true); setPage(page + 1); }}>More spaces</Button></div> : null}</> : <p>Create a moodspace in Compose first, then return here to save the track.</p>}
  </ConfirmDialog>;
}
