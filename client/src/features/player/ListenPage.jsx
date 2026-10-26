import { useEffect, useState } from 'react';
import { SaveTrackDialog } from '../music/SaveTrackDialog.jsx';
import { api } from '../../services/api.js';
import { ErrorMessage } from '../../components/Feedback.jsx';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { usePlayerStore } from '../../stores/playerStore.js';
import { PlayerControls } from './PlayerControls.jsx';

export function ListenPage() {
  const track = usePlayerStore(state => state.queue.find(item => item.id === state.currentId));
  return <div className="listen-page"><div className="section-heading"><h1>Stay with the sound.</h1><Link className="text-link" to={track?.sourceSpaceId ? `/spaces/${track.sourceSpaceId}#sound` : "/discover"}>{track?.sourceSpaceId ? "Back to originating space" : "Back to Discover"}</Link></div>{track ? <section className="listening-stage"><div><h2 aria-live="polite">{track.title}</h2><p>{track.artistName}</p><div className="track-attribution"><a href={track.sourceUrl} target="_blank" rel="noreferrer">Music from Jamendo</a>{track.licenseUrl ? <a href={track.licenseUrl} target="_blank" rel="noreferrer">Track license</a> : null}</div><ListenActions key={`${track.id}:${track.sourceSpaceId || "search"}`} track={track} /></div><PlayerControls /></section> : <div className="empty-space"><p>Play a track from Discover or choose one from your queue.</p><Link className="button button--primary" to="/discover">Find music</Link></div>}<Queue /></div>;
}

function Queue() {
  const queue = usePlayerStore(state => state.queue);
  const currentId = usePlayerStore(state => state.currentId);
  return <section id="listening-queue" className="queue-section" aria-labelledby="queue-title"><h2 id="queue-title">Listening queue</h2><p className="fine-print">Up to 50 tracks. Restored paused after a refresh in this tab; cleared when you sign out.</p>{queue.length ? <ol className="queue-list">{queue.map((track, index) => <li key={track.id} aria-current={track.id === currentId ? 'true' : undefined}><div><h3>{track.title}{track.id === currentId ? ' · Current' : ''}</h3><p>{track.artistName}</p><div className="track-attribution"><a href={track.sourceUrl} target="_blank" rel="noreferrer">Jamendo</a>{track.licenseUrl ? <a href={track.licenseUrl} target="_blank" rel="noreferrer">License</a> : null}</div></div><div className="queue-actions"><Button variant="text" onClick={() => usePlayerStore.getState().playTrack(track)} aria-label={`Play queued ${track.title}`}>Play</Button><Button variant="text" disabled={index === 0} onClick={() => usePlayerStore.getState().moveInQueue(track.id, -1)} aria-label={`Move ${track.title} up`}>Up</Button><Button variant="text" disabled={index === queue.length - 1} onClick={() => usePlayerStore.getState().moveInQueue(track.id, 1)} aria-label={`Move ${track.title} down`}>Down</Button><Button variant="text-danger" onClick={() => usePlayerStore.getState().removeFromQueue(track.id)} aria-label={`Remove ${track.title} from queue`}>Remove</Button></div></li>)}</ol> : <p className="loading-state">Your queue is empty.</p>}</section>;
}

function ListenActions({ track }) {
  const [dialog, setDialog] = useState(false);
  const [savedSpace, setSavedSpace] = useState(null);
  const [reaction, setReaction] = useState('neutral');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!track.sourceSpaceId) return;
    const controller = new AbortController();
    Promise.all([
      api(`/spaces/${track.sourceSpaceId}/tracks`, { signal: controller.signal }),
      api(`/spaces/${track.sourceSpaceId}/recommendations`, { signal: controller.signal })
    ]).then(([{ data: saved }, { data: selection }]) => {
      if (saved.some(item => item.id === track.id)) setSavedSpace(track.sourceSpaceId);
      setReaction(selection.tracks.find(item => item.id === track.id)?.reaction || 'neutral');
    }).catch(failure => { if (failure.name !== 'AbortError') setError(failure.message); });
    return () => controller.abort();
  }, [track.id, track.sourceSpaceId]);
  async function like() {
    setBusy(true); setError('');
    try {
      const { data } = await api(`/spaces/${track.sourceSpaceId}/recommendations/${track.provider}/${track.providerTrackId}/feedback`, { method: 'PUT', body: { reaction: reaction === 'like' ? 'neutral' : 'like' } });
      setReaction(data.reaction); setNotice(data.reaction === 'like' ? 'Like saved. Refresh your space to use this preference.' : 'Like removed.');
    } catch (failure) { if (failure.name !== 'AbortError') setError(failure.message); }
    finally { setBusy(false); }
  }
  return <div className="listen-actions"><div className="action-group">
    {track.sourceSpaceId ? <Button variant="secondary" onClick={like} disabled={busy} aria-pressed={reaction === 'like'}>{reaction === 'like' ? 'Liked' : 'Like'}</Button> : null}
    <a className="text-link" href="#listening-queue">View queue</a>
    <Button onClick={() => setDialog(true)}>{savedSpace ? 'Saved · choose another space' : 'Save to Space'}</Button>
  </div>{savedSpace ? <p className="fine-print">Saved to your space.</p> : null}<ErrorMessage message={error} />{notice ? <p role="status" className="success-message">{notice}</p> : null}
    {dialog ? <SaveTrackDialog track={track} defaultSpaceId={track.sourceSpaceId} onClose={() => setDialog(false)} onSaved={(message, id) => { setSavedSpace(id); setNotice(message); }} /> : null}
  </div>;
}
