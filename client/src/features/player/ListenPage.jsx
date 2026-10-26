import { Link } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { usePlayerStore } from '../../stores/playerStore.js';
import { PlayerControls } from './PlayerControls.jsx';

export function ListenPage() {
  const track = usePlayerStore(state => state.queue.find(item => item.id === state.currentId));
  return <div className="listen-page"><div className="section-heading"><h1>Stay with the sound.</h1><Link className="text-link" to="/discover">Back to Discover</Link></div>{track ? <section className="listening-stage"><div><h2 aria-live="polite">{track.title}</h2><p>{track.artistName}</p><div className="track-attribution"><a href={track.sourceUrl} target="_blank" rel="noreferrer">Music from Jamendo</a>{track.licenseUrl ? <a href={track.licenseUrl} target="_blank" rel="noreferrer">Track license</a> : null}</div></div><PlayerControls /></section> : <div className="empty-space"><p>Play a track from Discover or choose one from your queue.</p><Link className="button button--primary" to="/discover">Find music</Link></div>}<Queue /></div>;
}

function Queue() {
  const queue = usePlayerStore(state => state.queue);
  const currentId = usePlayerStore(state => state.currentId);
  return <section className="queue-section" aria-labelledby="queue-title"><h2 id="queue-title">Listening queue</h2><p className="fine-print">Up to 50 tracks. Restored paused after a refresh in this tab; cleared when you sign out.</p>{queue.length ? <ol className="queue-list">{queue.map((track, index) => <li key={track.id} aria-current={track.id === currentId ? 'true' : undefined}><div><h3>{track.title}{track.id === currentId ? ' · Current' : ''}</h3><p>{track.artistName}</p><div className="track-attribution"><a href={track.sourceUrl} target="_blank" rel="noreferrer">Jamendo</a>{track.licenseUrl ? <a href={track.licenseUrl} target="_blank" rel="noreferrer">License</a> : null}</div></div><div className="queue-actions"><Button variant="text" onClick={() => usePlayerStore.getState().playTrack(track)} aria-label={`Play queued ${track.title}`}>Play</Button><Button variant="text" disabled={index === 0} onClick={() => usePlayerStore.getState().moveInQueue(track.id, -1)} aria-label={`Move ${track.title} up`}>Up</Button><Button variant="text" disabled={index === queue.length - 1} onClick={() => usePlayerStore.getState().moveInQueue(track.id, 1)} aria-label={`Move ${track.title} down`}>Down</Button><Button variant="text-danger" onClick={() => usePlayerStore.getState().removeFromQueue(track.id)} aria-label={`Remove ${track.title} from queue`}>Remove</Button></div></li>)}</ol> : <p className="loading-state">Your queue is empty.</p>}</section>;
}
