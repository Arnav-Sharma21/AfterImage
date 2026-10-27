import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Artwork } from '../../components/Artwork.jsx';
import { usePlayerStore } from '../../stores/playerStore.js';
import { usePlayerUI } from './playerUIContext.js';
import { formatTime } from '../music/formatTime.js';

export function PlayerSummary() {
  const track = usePlayerStore(state => state.queue.find(item => item.id === state.currentId));
  const playing = usePlayerStore(state => state.desiredPlaying);
  const status = usePlayerStore(state => state.status);
  const { openQueue } = usePlayerUI();
  const location = useLocation();
  const root = useRef(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (root.current) gsap.from(root.current, { y: 24, opacity: 0, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
    });
    return () => media.revert();
  }, { scope: root, dependencies: [Boolean(track), location.pathname === '/listen'], revertOnUpdate: true });
  if (!track || location.pathname === '/listen') return null;
  return <aside ref={root} className="compact-player" aria-label="Music player">
    <Link className="compact-track" to="/listen" state={{ from: location.pathname + location.search }} aria-label={`Open Listen: ${track.title}`}><Artwork src={track.artworkUrl} /><span><strong>{track.title}</strong><small>{['loading', 'buffering'].includes(status) ? 'Loading audio…' : track.artistName}</small></span></Link>
    <div className="compact-transport"><Button variant="text" onClick={() => usePlayerStore.getState().previous()} aria-label="Previous track"><Icon name="previous" /></Button><Button className="compact-toggle" variant="secondary" onClick={() => usePlayerStore.getState().toggle()} aria-label={playing ? 'Pause music' : 'Resume music'}><Icon name={playing ? 'pause' : 'play'} /></Button><Button variant="text" onClick={() => usePlayerStore.getState().next()} aria-label="Next track"><Icon name="next" /></Button></div>
    <Button variant="text" onClick={openQueue} aria-label="Open queue"><Icon name="queue" /></Button><Link className="compact-expand" to="/listen" state={{ from: location.pathname + location.search }} aria-label="Expand player"><Icon name="expand" /></Link>
    <CompactProgress />
  </aside>;
}
function CompactProgress() {
  const position = usePlayerStore(state => state.position);
  const duration = usePlayerStore(state => state.duration);
  return <div className="compact-progress" aria-hidden="true"><span style={{ transform: `scaleX(${duration ? Math.min(position / duration, 1) : 0})` }} /></div>;
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
  const volume = usePlayerStore(state => state.volume);
  const muted = usePlayerStore(state => state.muted);
  const error = usePlayerStore(state => state.error);
  return <section className="player-controls" aria-label="Playback controls">
    <TrackProgress />
    <div className="transport"><Button variant="text" disabled={!currentId} onClick={() => usePlayerStore.getState().previous()} aria-label="Previous"><Icon name="previous" size={25} /></Button><Button className="main-play" disabled={!currentId} onClick={() => usePlayerStore.getState().toggle()} aria-label={status === 'error' ? 'Retry playback' : desiredPlaying ? 'Pause' : 'Play'}><Icon name={desiredPlaying && status !== 'error' ? 'pause' : 'play'} size={28} /></Button><Button variant="text" disabled={!currentId} onClick={() => usePlayerStore.getState().next()} aria-label="Next"><Icon name="next" size={25} /></Button></div>
    <div className="volume-control"><Button variant="text" onClick={() => usePlayerStore.getState().toggleMute()} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}><Icon name={muted ? 'mute' : 'volume'} /></Button><label><span className="sr-only">Volume</span><input type="range" min="0" max="1" step="0.01" value={volume} onInput={event => usePlayerStore.getState().setVolume(Number(event.target.value))} aria-valuetext={`${Math.round(volume * 100)} percent`} /></label></div>
    <p className="playback-status" role="status">{status === 'loading' ? 'Loading track…' : status === 'buffering' ? 'Buffering audio…' : status === 'playing' ? 'Playing' : status === 'ended' ? 'Queue finished' : status === 'paused' ? 'Paused' : ''}</p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
  </section>;
}
function TrackProgress() {
  const currentId = usePlayerStore(state => state.currentId);
  const position = usePlayerStore(state => state.position);
  const duration = usePlayerStore(state => state.duration);
  return <div className="track-progress"><label className="seek-control"><span className="sr-only">Track position</span><input type="range" min="0" max={duration || 1} step="0.1" value={Math.min(position, duration || 1)} disabled={!duration || !currentId} onInput={event => usePlayerStore.getState().seek(Number(event.target.value))} aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`} /></label><div className="time-display"><span>{formatTime(position)}</span><span>{duration ? formatTime(duration) : 'Duration unavailable'}</span></div></div>;
}
