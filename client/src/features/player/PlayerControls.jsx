import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { usePlayerStore } from '../../stores/playerStore.js';
import { formatTime } from '../music/formatTime.js';

export function PlayerSummary() {
  const track = usePlayerStore(state => state.queue.find(item => item.id === state.currentId));
  const playing = usePlayerStore(state => state.desiredPlaying);
  if (!track) return null;
  return <div className="player-summary"><Link to="/listen" title={track.title}>{track.title}</Link><Button variant="text" onClick={() => usePlayerStore.getState().toggle()} aria-label={playing ? 'Pause music' : 'Resume music'}>{playing ? 'Pause' : 'Play'}</Button></div>;
}

export function PlayerNotice() {
  const error = usePlayerStore(state => state.error);
  const status = usePlayerStore(state => state.status);
  const location = useLocation();
  if (location.pathname === '/listen' || (!error && !['loading', 'buffering'].includes(status))) return null;
  return <div className="player-notice">{error ? <><p className="field-error" role="alert">{error}</p><Link className="text-link" to="/listen">Open playback controls</Link></> : <p role="status">{status === 'loading' ? 'Loading track…' : 'Buffering audio…'}</p>}</div>;
}

export function PlayerControls() {
  const status = usePlayerStore(state => state.status);
  const desiredPlaying = usePlayerStore(state => state.desiredPlaying);
  const currentId = usePlayerStore(state => state.currentId);
  const position = usePlayerStore(state => state.position);
  const duration = usePlayerStore(state => state.duration);
  const volume = usePlayerStore(state => state.volume);
  const muted = usePlayerStore(state => state.muted);
  const error = usePlayerStore(state => state.error);
  return <section className="player-controls" aria-label="Playback controls">
    <div className="transport"><Button variant="secondary" disabled={!currentId} onClick={() => usePlayerStore.getState().previous()}>Previous</Button><Button disabled={!currentId} onClick={() => usePlayerStore.getState().toggle()}>{status === 'error' ? 'Retry playback' : desiredPlaying ? 'Pause' : 'Play'}</Button><Button variant="secondary" disabled={!currentId} onClick={() => usePlayerStore.getState().next()}>Next</Button></div>
    <label className="seek-control">Track position<input type="range" min="0" max={duration || 1} step="0.1" value={Math.min(position, duration || 1)} disabled={!duration || !currentId} onInput={event => usePlayerStore.getState().seek(Number(event.target.value))} aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`} /></label>
    <div className="time-display"><span>{formatTime(position)}</span><span>{duration ? formatTime(duration) : 'Duration unavailable'}</span></div>
    <div className="volume-control"><Button variant="text" onClick={() => usePlayerStore.getState().toggleMute()} aria-pressed={muted}>{muted ? 'Unmute' : 'Mute'}</Button><label>Volume<input type="range" min="0" max="1" step="0.01" value={volume} onInput={event => usePlayerStore.getState().setVolume(Number(event.target.value))} aria-valuetext={`${Math.round(volume * 100)} percent`} /></label></div>
    <p className="playback-status" role="status">{status === 'loading' ? 'Loading track…' : status === 'buffering' ? 'Buffering audio…' : status === 'playing' ? 'Playing' : status === 'ended' ? 'Queue finished' : status === 'paused' ? 'Paused' : ''}</p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
  </section>;
}
