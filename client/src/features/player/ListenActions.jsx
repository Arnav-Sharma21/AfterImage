import { useEffect, useState } from 'react';
import { SaveTrackDialog } from '../music/SaveTrackDialog.jsx';
import { api } from '../../services/api.js';
import { ErrorMessage } from '../../components/Feedback.jsx';
import { Button } from '../../components/Button.jsx';
import { Icon } from '../../components/Icon.jsx';
import { usePlayerUI } from './playerUIContext.js';

export function ListenActions({ track }) {
  const { openQueue } = usePlayerUI();
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
    {track.sourceSpaceId ? <Button variant="secondary" onClick={like} disabled={busy} aria-pressed={reaction === 'like'}><Icon name="heart" />{reaction === 'like' ? 'Liked' : 'Like'}</Button> : null}
    <Button variant="text" onClick={openQueue}><Icon name="queue" />View queue</Button>
    <Button onClick={() => setDialog(true)}><Icon name={savedSpace ? 'check' : 'save'} />{savedSpace ? 'Saved · choose another space' : 'Save to Space'}</Button>
  </div>{savedSpace ? <p className="fine-print">Saved to your space.</p> : null}<ErrorMessage message={error} />{notice ? <p role="status" className="success-message">{notice}</p> : null}
    {dialog ? <SaveTrackDialog track={track} defaultSpaceId={track.sourceSpaceId} onClose={() => setDialog(false)} onSaved={(message, id) => { setSavedSpace(id); setNotice(message); }} /> : null}
  </div>;
}
