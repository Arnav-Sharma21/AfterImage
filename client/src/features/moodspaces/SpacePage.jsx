import { useEditorialMotion } from '../../motion/useEditorialMotion.js';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Arrow } from '../../components/Arrow.jsx';
import { Button } from '../../components/Button.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { api } from '../../services/api.js';
import { useSpace } from './useSpace.js';
import { SavedTracks } from '../music/SavedTracks.jsx';
import { RecommendationPanel } from '../recommendations/RecommendationPanel.jsx';
import { MoodCanvas } from './MoodCanvas.jsx';
import { useAtmosphere } from '../../atmosphere/useAtmosphere.js';

export function SpacePage() {
  const { id } = useParams();
  const root = useEditorialMotion(id);
  const { space, loading, error, reload } = useSpace(id);
  const atmosphere = useAtmosphere(space?.images?.[0]?.url);
  const [soundOpen, setSoundOpen] = useState(() => window.location.hash === '#sound');
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();

  async function remove() {
    if (busy) return;
    setBusy(true);
    setDeleteError('');
    try {
      await api(`/spaces/${id}`, { method: 'DELETE', body: { revision: space.revision } });
      navigate('/atlas', { replace: true });
    } catch (failure) {
      if (failure.name !== 'AbortError') setDeleteError(failure.message);
    } finally { setBusy(false); }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  if (!space || space.id !== id) return <Loading />;
  return <article ref={root} className="space-detail" style={atmosphere.style} data-palette-method={atmosphere.method}>
    <Link className="text-link" to="/atlas">Back to your worlds</Link>
    <div className="space-detail-heading" data-reveal><div><p className="eyebrow">YOUR WORLD / AN AUDIOVISUAL MEMORY</p><h1>{space.title}</h1></div><Link className="button button--secondary" to={`/worlds/${id}/edit`}>Edit space <Arrow diagonal /></Link></div>
    <div className="space-detail-body"><p className="space-description">{space.description || 'There is room for a thought here. Edit this space to add one.'}</p><div className="tag-list tag-list--large">{space.moods.map(mood => <span key={mood}>{mood}</span>)}</div><Link className="text-link" to={`/worlds/${id}/edit#mood-dna`}>Tune your Mood DNA <Arrow /></Link></div>
    <div className="world-view-controls" aria-label="World presentation"><button type="button" aria-pressed={!soundOpen} onClick={() => { setSoundOpen(false); history.replaceState(history.state, '', location.pathname); }}>The collection</button><button type="button" aria-pressed={soundOpen} onClick={() => { setSoundOpen(true); history.replaceState(history.state, '', '#sound'); }}>The soundtrack</button></div>
    {soundOpen ? <div className="world-soundtrack"><div className="soundtrack-context"><span className="eyebrow">MUSIC BELONGING TO THIS WORLD</span><p>{space.title}</p></div><RecommendationPanel spaceId={id} revision={space.revision} onSpaceChanged={reload} /><SavedTracks key={`${id}:${space.revision}`} spaceId={id} onChanged={reload} /></div> : <><MoodCanvas space={space} /><div className="sound-bridge"><span className="eyebrow">A WORLD OF IMAGES, WORDS & SOUND</span><p>Stay with<br /><em>the feeling.</em></p><Button variant="secondary" onClick={() => { setSoundOpen(true); history.replaceState(history.state, '', '#sound'); }}>Open soundtrack ↗</Button></div></>}
    <footer className="space-footer"><p>Private space · Updated {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(space.updatedAt))}</p><Button variant="text-danger" onClick={() => setDeleting(true)}>Delete space</Button></footer>
    {deleting ? <ConfirmDialog title={`Delete “${space.title}”?`} confirmLabel="Delete space" destructive busy={busy} error={deleteError} onCancel={() => { setDeleting(false); setDeleteError(''); }} onConfirm={remove}><p>This permanently removes the space and its saved details. This action cannot be undone.</p></ConfirmDialog> : null}
  </article>;
}
