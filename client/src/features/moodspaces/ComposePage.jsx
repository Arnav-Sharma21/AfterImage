import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { Field } from '../../components/Field.jsx';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';
import { api } from '../../services/api.js';
import { useSessionStore } from '../../stores/sessionStore.js';
import { useEditorStore } from '../../stores/editorStore.js';
import { AuthForm } from '../auth/AuthForm.jsx';
import { MoodPicker } from './MoodPicker.jsx';
import { useSpace } from './useSpace.js';
import { FragmentEditor } from './FragmentEditor.jsx';
import { RecommendationPanel } from '../recommendations/RecommendationPanel.jsx';

const EMPTY_SPACE = { title: '', description: '', moods: [], fragments: [] };

function SpaceEditor({ initialSpace }) {
  const [draft, setDraft] = useState(() => ({ title: initialSpace.title, description: initialSpace.description, moods: initialSpace.moods, fragments: initialSpace.fragments || [] }));
  const [saved, setSaved] = useState(initialSpace);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);
  const dirty = draft.title !== saved.title || draft.description !== saved.description || draft.moods.join('|') !== saved.moods.join('|') || JSON.stringify(draft.fragments) !== JSON.stringify(saved.fragments || []);
  const blocker = useBlocker(dirty && !busy);
  const expired = useSessionStore(state => state.expired);
  useLayoutEffect(() => {
    useEditorStore.setState({ dirty, saving: busy });
    return () => useEditorStore.setState({ dirty: false, saving: false });
  }, [dirty, busy]);
  useBeforeUnload(event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

  function change(field, value) {
    setDraft(current => ({ ...current, [field]: value }));
    setNotice('');
    setFieldErrors(current => ({ ...current, [field]: undefined }));
  }

  async function save(event) {
    event.preventDefault();
    if (busy || conflict) return;
    if (!draft.moods.length) { setFieldErrors({ moods: 'Choose at least one mood.' }); formRef.current?.querySelector('.mood-chip')?.focus(); return; }
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      const { data } = await api(saved.id ? `/spaces/${saved.id}` : '/spaces', {
        method: saved.id ? 'PATCH' : 'POST', body: { ...draft, ...(saved.id ? { revision: saved.revision } : {}) }
      });
      setSaved(data);
      setDraft({ title: data.title, description: data.description, moods: data.moods, fragments: data.fragments || [] });
      setNotice('Saved to your private library.');
      if (!saved.id) navigate(`/compose/${data.id}`, { replace: true });
    } catch (failure) {
      if (failure.name !== 'AbortError') {
        setError(failure.message);
        setFieldErrors(failure.fieldErrors || {});
        setConflict(failure.code === 'REVISION_CONFLICT');
        formRef.current?.elements.namedItem(Object.keys(failure.fieldErrors || {})[0])?.focus();
      }
    } finally { setBusy(false); }
  }

  return <>
    <header className="compose-heading"><div><h1>{saved.id ? 'Shape the feeling.' : 'Make a little room.'}</h1><p>Give your space a name and an atmosphere.</p></div><span className="save-indicator" role="status">{busy ? 'Saving…' : dirty ? 'Unsaved changes' : saved.id ? 'All changes saved' : 'New space'}</span></header>
    <form ref={formRef} onSubmit={save} className="compose-layout" aria-busy={busy}>
      <div className="compose-main">
        <Field label="Space title" id="title" error={fieldErrors.title}>
          <input className="title-input" id="title" name="title" placeholder="A feeling, a place, a moment…" value={draft.title} onChange={event => change('title', event.target.value)} maxLength={80} required disabled={busy} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? 'title-error' : undefined} />
        </Field>
        <Field label="Description" id="description" error={fieldErrors.description} hint="What do you want to hold onto?">
          <textarea id="description" name="description" placeholder="Put the atmosphere into words." value={draft.description} onChange={event => change('description', event.target.value)} rows={7} maxLength={1000} disabled={busy} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={`description-hint${fieldErrors.description ? ' description-error' : ''}`} />
        </Field>
        <p className="character-count">{draft.description.length} / 1,000</p>
        <FragmentEditor fragments={draft.fragments} onChange={value => change('fragments', value)} disabled={busy} error={fieldErrors.fragments} />
      </div>
      <aside className="compose-inspector" aria-label="Space atmosphere">
        <MoodPicker value={draft.moods} onChange={value => change('moods', value)} error={fieldErrors.moods} disabled={busy} />
        <div className="space-preview" aria-hidden="true"><span>{draft.title || 'Your space, taking shape.'}</span><p>{draft.moods.length ? draft.moods.join(' / ') : 'A mood is a beginning.'}</p></div>
        <p className="fine-print">Only you can see this space. Mood tags, matched words, and saved songs guide its music.</p>
      </aside>
      <div className="compose-actions">
        <div><ErrorMessage message={error} />{notice ? <p className="success-message" role="status">{notice}</p> : null}</div>
        <div className="action-group"><Link className="text-link" to={saved.id ? `/spaces/${saved.id}` : '/discover'}>Back to {saved.id ? 'space' : 'Discover'}</Link><Button type="submit" disabled={busy || conflict || expired || (!dirty && Boolean(saved.id))}>{busy ? 'Saving…' : 'Save space'}</Button></div>
        {conflict ? <Link className="text-link" to={`/spaces/${saved.id}`}>Open the current saved version</Link> : null}
      </div>
    </form>
    {saved.id ? <RecommendationPanel spaceId={saved.id} revision={saved.revision} disabled={dirty || busy || expired} onSpaceChanged={async () => { const { data } = await api(`/spaces/${saved.id}`); setSaved(data); }} /> : <p className="fine-print recommendation-intro">Save this space to find music from its moods and words.</p>}
    {blocker.state === 'blocked' ? <ConfirmDialog title="Leave your changes behind?" confirmLabel="Discard and leave" onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()}><p>Your latest edits have not been saved. Stay here to keep working, or discard them.</p></ConfirmDialog> : null}
    {expired ? <section className="reauth-panel" aria-labelledby="reauth-title"><h2 id="reauth-title">Your session has expired.</h2><AuthForm reauthenticate onSuccess={() => setError('You are signed in again. Save your space when ready.')} /></section> : null}
  </>;
}

export function ComposePage() {
  const { id } = useParams();
  const { space, loading, error, reload } = useSpace(id);
  if (!id) return <SpaceEditor key="new" initialSpace={EMPTY_SPACE} />;
  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  if (!space || space.id !== id) return <Loading />;
  return <SpaceEditor key={space.id} initialSpace={space} />;
}
