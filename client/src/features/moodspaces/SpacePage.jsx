import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Arrow } from '../../components/Arrow.jsx';
import { Button } from '../../components/Button.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { api } from '../../services/api.js';
import { useSpace } from './useSpace.js';

export function SpacePage() {
  const { id } = useParams();
  const { space, loading, error, reload } = useSpace(id);
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
      navigate('/discover', { replace: true });
    } catch (failure) {
      if (failure.name !== 'AbortError') setDeleteError(failure.message);
    } finally { setBusy(false); }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  if (!space || space.id !== id) return <Loading />;
  return <article className="space-detail">
    <Link className="text-link" to="/discover">Back to your spaces</Link>
    <div className="space-detail-heading"><h1>{space.title}</h1><Link className="button button--secondary" to={`/compose/${id}`}>Edit space <Arrow diagonal /></Link></div>
    <div className="space-detail-body"><div><p className="space-description">{space.description || 'There is room for a thought here. Edit this space to add one.'}</p><div className="tag-list tag-list--large">{space.moods.map(mood => <span key={mood}>{mood}</span>)}</div></div><div className="detail-impression" aria-hidden="true"><span>{space.title}</span></div></div>
    <footer className="space-footer"><p>Private space · Updated {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(space.updatedAt))}</p><Button variant="text-danger" onClick={() => setDeleting(true)}>Delete space</Button></footer>
    {deleting ? <ConfirmDialog title={`Delete “${space.title}”?`} confirmLabel="Delete space" destructive busy={busy} error={deleteError} onCancel={() => { setDeleting(false); setDeleteError(''); }} onConfirm={remove}><p>This permanently removes the space and its saved details. This action cannot be undone.</p></ConfirmDialog> : null}
  </article>;
}
