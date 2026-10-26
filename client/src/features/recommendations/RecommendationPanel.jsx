import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { api } from '../../services/api.js';
import { TrackRow } from '../music/TrackRow.jsx';

const EMPTY = { profile: null, tracks: [], warnings: [], stale: false };
const featureLabels = { energy: 'Energy', melancholy: 'Melancholy', warmth: 'Warmth', intensity: 'Intensity', nostalgia: 'Nostalgia' };

export function RecommendationPanel({ spaceId, revision, disabled = false, onSpaceChanged }) {
  const [result, setResult] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [undoTrack, setUndoTrack] = useState(null);
  const generationRequest = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    api(`/spaces/${spaceId}/recommendations`, { signal: controller.signal }).then(({ data }) => { setResult(data); setLoading(false); })
      .catch(failure => { if (failure.name !== 'AbortError') { setError(failure.message); setLoading(false); } });
    return () => { controller.abort(); generationRequest.current?.abort(); };
  }, [spaceId, revision]);

  async function generate() {
    if (busy || disabled) return;
    generationRequest.current?.abort();
    const controller = new AbortController();
    generationRequest.current = controller;
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api(`/spaces/${spaceId}/recommendations`, { method: 'POST', body: { revision }, signal: controller.signal, timeoutMs: 20000 });
      setResult(data); setLoading(false);
    } catch (failure) { if (failure.name !== 'AbortError') setError(failure.message); }
    finally { setBusy(false); }
  }

  async function save(track) {
    if (pendingId || disabled) return;
    setPendingId(track.id); setError('');
    try {
      await api(`/spaces/${spaceId}/tracks/${track.provider}/${track.providerTrackId}`, { method: 'PUT', body: {} });
      setResult(current => ({ ...current, stale: true, tracks: current.tracks.map(item => item.id === track.id ? { ...item, isSaved: true } : item) }));
      setNotice(`“${track.title}” is saved to this space.`);
      await onSpaceChanged?.();
    } catch (failure) { if (failure.name !== 'AbortError') setError(failure.message); }
    finally { setPendingId(null); }
  }

  async function react(track, reaction) {
    if (pendingId || disabled) return;
    setPendingId(track.id); setError('');
    try {
      await api(`/spaces/${spaceId}/recommendations/${track.provider}/${track.providerTrackId}/feedback`, { method: 'PUT', body: { reaction } });
      if (reaction === 'dislike') {
        setUndoTrack(track);
        setResult(current => ({ ...current, stale: true, tracks: current.tracks.filter(item => item.id !== track.id) }));
        setNotice(`“${track.title}” is hidden from recommendations across your spaces.`);
      } else if (undoTrack?.id === track.id) {
        const { data } = await api(`/spaces/${spaceId}/recommendations`);
        setResult(data); setUndoTrack(null); setNotice('Dislike removed. Future rankings can include this track again.');
      } else {
        setResult(current => ({ ...current, stale: true, tracks: current.tracks.map(item => item.id === track.id ? { ...item, reaction } : item) }));
        setNotice(reaction === 'like' ? 'Preference saved. Refresh to use it in your ranking.' : 'Like removed.');
      }
    } catch (failure) { if (failure.name !== 'AbortError') setError(failure.message); }
    finally { setPendingId(null); }
  }

  return <section className="recommendation-panel" aria-labelledby={`sound-${spaceId}`}>
    <div className="section-heading"><div><h2 id={`sound-${spaceId}`}>Find your sound.</h2><p className="fine-print">Your moods, words, saved music, and feedback shape this selection.</p></div><Button onClick={generate} disabled={busy || disabled || Boolean(pendingId)}>{busy ? 'Finding your sound…' : result.profile ? 'Refresh my sound' : 'Find my sound'}</Button></div>
    {disabled ? <p className="fine-print">Save your current edits before finding music or changing this selection.</p> : null}
    <ErrorMessage message={error} />
    {notice ? <p className="success-message" role="status">{notice}</p> : null}
    {undoTrack ? <Button variant="text" onClick={() => react(undoTrack, 'neutral')} disabled={Boolean(pendingId) || disabled}>Undo dislike</Button> : null}
    {loading ? <Loading>Retrieving your music direction…</Loading> : null}
    {result.profile ? <details className="mood-profile"><summary>Your music direction</summary><dl>{Object.entries(featureLabels).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{Number.isFinite(result.profile.features[key]) ? `${result.profile.features[key] < .35 ? 'Low' : result.profile.features[key] > .7 ? 'High' : 'Moderate'} · ${result.profile.features[key].toFixed(2)}` : 'Unknown'}</dd></div>)}</dl><p className="fine-print">Editorial estimates from explicit inputs and catalog metadata, not measured emotions.</p><ul>{result.profile.sources.map(source => <li key={source.kind}>{source.kind === 'moods' ? 'Mood tags' : source.kind === 'words' ? 'Matched words' : source.kind === 'savedMusic' ? 'Saved music' : 'Recent likes'}: {source.matches.join(', ')}</li>)}</ul><p className="fine-print">English word matching only. Captions are text; image pixels are not analyzed.</p></details> : !loading ? <p className="search-hint">Give your saved space a soundtrack. We will search the real Jamendo catalog and explain the matches.</p> : null}
    {result.stale ? <p className="recommendation-stale">Your space or preferences changed. Refresh to use the latest signals.</p> : null}
    {result.warnings?.length ? <ul className="recommendation-warnings">{result.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul> : null}
    {result.tracks.length ? <><ul className="track-list" aria-label="Moodspace recommendations">{result.tracks.map(track => <TrackRow key={track.id} track={track} onSave={save} saveDisabled={disabled || Boolean(pendingId) || track.isSaved} saveLabel={track.isSaved ? 'Saved to space' : 'Save to this space'}><div className="recommendation-context"><ul aria-label={`Why ${track.title}`}>{track.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul><div className="feedback-actions"><Button variant="secondary" aria-pressed={track.reaction === 'like'} aria-label={`Like ${track.title}`} onClick={() => react(track, track.reaction === 'like' ? 'neutral' : 'like')} disabled={Boolean(pendingId) || disabled}>{track.reaction === 'like' ? 'Liked' : 'Like'}</Button><Button variant="text" aria-label={`Dislike ${track.title}`} onClick={() => react(track, 'dislike')} disabled={Boolean(pendingId) || disabled}>Less like this</Button></div></div></TrackRow>)}</ul><p className="fine-print feedback-scope">Your feedback influences recommendations across all your spaces. Dislikes are excluded; refreshes can still repeat suitable tracks in a small catalog.</p></> : result.profile && !busy ? <p className="loading-state">No matching tracks to show. Try another mood or add a descriptive fragment, then refresh.</p> : null}
  </section>;
}
