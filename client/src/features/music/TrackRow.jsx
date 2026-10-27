import { useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { usePlayerStore } from '../../stores/playerStore.js';
import { formatTime } from './formatTime.js';
import { Icon } from '../../components/Icon.jsx';

export function TrackRow({ track, onSave, onRemove, removing = false, removeDisabled = false, saveDisabled = false, saveLabel = 'Save to space', children, sourceSpaceId, featured = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const queued = usePlayerStore(state => state.queue.some(item => item.id === track.id));
  return <li className={`track-row ${featured ? 'track-row--featured' : ''}`}>
    {track.artworkUrl && !imageFailed ? <img className="track-art" src={track.artworkUrl} alt="" width="80" height="80" loading={featured ? 'eager' : 'lazy'} referrerPolicy="no-referrer" onError={() => setImageFailed(true)} /> : <div className="track-art track-art--empty" aria-hidden="true">a/</div>}
    <div className="track-info"><h3>{track.title}</h3><p>{track.artistName}{track.albumName ? ` · ${track.albumName}` : ''}</p><div className="track-attribution"><span>{formatTime(track.durationSeconds)}</span><a href={track.sourceUrl} target="_blank" rel="noreferrer">Jamendo</a>{track.licenseUrl ? <a href={track.licenseUrl} target="_blank" rel="noreferrer">License</a> : <span>License unavailable</span>}</div>{!track.isPlayable ? <p className="fine-print">Stream unavailable</p> : null}</div>
    <div className="track-actions">
      <Button variant="secondary" className="track-play" disabled={!track.isPlayable} onClick={() => usePlayerStore.getState().playTrack({ ...track, sourceSpaceId })} aria-label={`Play ${track.title}`}><Icon name="play" />Play</Button>
      <Button variant="text" disabled={!track.isPlayable || queued} onClick={() => usePlayerStore.getState().addToQueue({ ...track, sourceSpaceId })} aria-label={`Queue ${track.title}`}>{queued ? 'Queued' : 'Queue'}</Button>
      {onSave ? <Button variant="text" onClick={() => onSave(track)} disabled={!track.isPlayable || saveDisabled} aria-label={`Save ${track.title} to a space`}><Icon name="save" />{saveLabel}</Button> : null}
      {onRemove ? <Button variant="text-danger" disabled={removing || removeDisabled} onClick={() => onRemove(track)} aria-label={`Remove ${track.title} from this space`}>{removing ? 'Removing…' : 'Remove'}</Button> : null}
    </div>
    {children}
  </li>;
}
