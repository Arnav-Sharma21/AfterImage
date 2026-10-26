import { useEffect, useState } from 'react';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { api } from '../../services/api.js';
import { TrackRow } from './TrackRow.jsx';

export function SavedTracks({ spaceId, onChanged }) {
  const [state, setState] = useState({ tracks: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [removingId, setRemovingId] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    api(`/spaces/${spaceId}/tracks`, { signal: controller.signal }).then(({ data }) => setState({ tracks: data, loading: false, error: '' }))
      .catch(error => { if (error.name !== 'AbortError') setState(current => ({ ...current, loading: false, error: error.message })); });
    return () => controller.abort();
  }, [spaceId, attempt]);
  async function remove(track) {
    if (removingId) return;
    setRemovingId(track.id);
    try {
      await api(`/spaces/${spaceId}/tracks/${track.provider}/${track.providerTrackId}`, { method: 'DELETE', body: {} });
      setState(current => ({ ...current, tracks: current.tracks.filter(item => item.id !== track.id), error: '' }));
      onChanged();
    } catch (error) { if (error.name !== 'AbortError') setState(current => ({ ...current, error: error.message })); }
    finally { setRemovingId(null); }
  }
  return <section className="saved-tracks" aria-labelledby="saved-tracks-title"><h2 id="saved-tracks-title">The sound of this space.</h2><p className="fine-print">Saved tracks · up to 50 per space</p>{state.loading ? <Loading>Retrieving saved tracks…</Loading> : <><ErrorMessage message={state.error} onRetry={() => setAttempt(value => value + 1)} />{state.tracks.length ? <ul className="track-list" aria-label="Saved music">{state.tracks.map(track => <TrackRow key={track.id} track={track} sourceSpaceId={spaceId} onRemove={remove} removing={removingId === track.id} />)}</ul> : !state.error ? <p className="loading-state">No music saved here yet. Find a track in Discover and choose Save to space.</p> : null}</>}</section>;
}
