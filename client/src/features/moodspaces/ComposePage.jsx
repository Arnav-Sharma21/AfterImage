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
import { SoundTuning } from './SoundTuning.jsx';
import { RecommendationPanel } from '../recommendations/RecommendationPanel.jsx';
import { ImageEditor } from './ImageEditor.jsx';
import { spaceAtmosphere } from '../../components/spaceAtmosphere.js';
import { MoodCanvas } from './MoodCanvas.jsx';
import { useEditorialMotion } from '../../motion/useEditorialMotion.js';
import { SavedTracks } from '../music/SavedTracks.jsx';

const EMPTY_SPACE = { title: '', description: '', moods: [], fragments: [], images: [] };

function SpaceEditor({ initialSpace }) {
  const [draft, setDraft] = useState(() => ({ title: initialSpace.title, description: initialSpace.description, moods: initialSpace.moods, fragments: initialSpace.fragments || [], images: initialSpace.images || [], soundTuning: initialSpace.soundTuning || {} }));
  const [saved, setSaved] = useState(initialSpace);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const [tool, setTool] = useState(() => window.location.hash === '#mood-dna' ? 'mood' : 'story');
  const root = useEditorialMotion();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const dirty = draft.title !== saved.title || draft.description !== saved.description || draft.moods.join('|') !== saved.moods.join('|') || JSON.stringify(draft.fragments) !== JSON.stringify(saved.fragments || []) || JSON.stringify(draft.images) !== JSON.stringify(saved.images || []) || JSON.stringify(draft.soundTuning) !== JSON.stringify(saved.soundTuning || {});
  const blocker = useBlocker(dirty && !busy);
  const expired = useSessionStore(state => state.expired);
  useLayoutEffect(() => {
    useEditorStore.setState({ dirty, saving: busy });
    return () => useEditorStore.setState({ dirty: false, saving: false });
  }, [dirty, busy]);
  useBeforeUnload(event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  useLayoutEffect(() => {
    if (window.location.hash === '#mood-dna') document.getElementById('mood-dna')?.scrollIntoView();
  }, []);

  function change(field, value) {
    setDraft(current => ({ ...current, [field]: value }));
    setNotice('');
    setFieldErrors(current => ({ ...current, [field]: undefined }));
  }

  async function save(event) {
    event.preventDefault();
    if (busy || conflict) return;
    if (!draft.moods.length) { setFieldErrors({ moods: 'Choose at least one mood.' }); setTool('mood'); requestAnimationFrame(() => formRef.current?.querySelector('.mood-chip')?.focus()); return; }
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      const { data } = await api(saved.id ? `/spaces/${saved.id}` : '/spaces', {
        method: saved.id ? 'PATCH' : 'POST', body: { ...draft, ...(saved.id ? { revision: saved.revision } : {}) }
      });
      setSaved(data);
      setDraft({ title: data.title, description: data.description, moods: data.moods, fragments: data.fragments || [], images: data.images || [], soundTuning: data.soundTuning || {} });
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

  function selectTool(next) {
    setTool(next);
    requestAnimationFrame(() => document.getElementById('journal-tools')?.scrollIntoView({ block: 'start' }));
  }
  return <div ref={root} className="compose-world" style={spaceAtmosphere(draft)}>
    <header className="journal-topline"><div><p className="eyebrow">COMPOSE / PRIVATE JOURNAL</p><span>{saved.id ? 'A world in the making.' : 'Begin with a feeling.'}</span></div><div className="compose-save"><span className="save-indicator" role="status">{busy ? 'Saving…' : dirty ? 'Unsaved changes' : saved.id ? 'All changes saved' : 'New space'}</span><Button type="submit" form="space-editor" disabled={busy || conflict || expired || (!dirty && Boolean(saved.id))}>{busy ? 'Saving…' : 'Save space'}</Button></div></header>
    <form id="space-editor" ref={formRef} onSubmit={save} className="journal-workspace" aria-busy={busy} onInvalid={event => { const name = event.target.name || ''; setTool(name.startsWith('image-') ? 'images' : 'story'); requestAnimationFrame(() => event.target.focus()); }}>
      <section className="journal-stage" aria-label="Live moodspace preview">
        <div className="journal-title" data-reveal><span className="eyebrow">COLLECT / REMEMBER / LISTEN</span><h1>{draft.title || 'An unwritten world.'}</h1><p>{draft.description || 'A place for a photograph, a thought, a song.'}</p></div>
        <MoodCanvas space={draft} editing onEditImage={() => selectTool('images')} />
        <div className="journal-toolbar" aria-label="Canvas tools"><Button variant="secondary" onClick={() => selectTool('images')}>＋ Images</Button><Button variant="secondary" onClick={() => selectTool('story')}>✎ Words & story</Button><Button variant="secondary" onClick={() => selectTool('mood')}>◈ Mood DNA</Button></div>
      </section>
      <section id="journal-tools" className="journal-tools" aria-label="Edit your journal">
        <div className="tool-tabs" role="tablist" aria-label="Journal editing tools">{[['story', 'Story'], ['images', 'Images'], ['mood', 'Mood DNA']].map(([id, label]) => <button key={id} type="button" role="tab" id={`tool-${id}`} aria-selected={tool === id} aria-controls={`panel-${id}`} tabIndex={tool === id ? 0 : -1} onKeyDown={event => { const ids = ['story', 'images', 'mood']; let next; if (event.key === 'ArrowRight') next = ids[(ids.indexOf(id) + 1) % 3]; if (event.key === 'ArrowLeft') next = ids[(ids.indexOf(id) + 2) % 3]; if (event.key === 'Home') next = ids[0]; if (event.key === 'End') next = ids[2]; if (next) { event.preventDefault(); setTool(next); document.getElementById(`tool-${next}`)?.focus(); } }} onClick={() => setTool(id)}>{label}</button>)}</div>
        <div id="panel-story" role="tabpanel" aria-labelledby="tool-story" hidden={tool !== 'story'}>
          <div className="story-fields"><Field label="Space title" id="title" error={fieldErrors.title}><input className="title-input" id="title" name="title" placeholder="A feeling, a place, a moment…" value={draft.title} onChange={event => change('title', event.target.value)} maxLength={80} required disabled={busy} aria-invalid={Boolean(fieldErrors.title)} /></Field>
          <Field label="Description" id="description" error={fieldErrors.description}><textarea id="description" name="description" placeholder="Put the atmosphere into words…" value={draft.description} onChange={event => change('description', event.target.value)} rows={3} maxLength={1000} disabled={busy} aria-invalid={Boolean(fieldErrors.description)} /></Field></div>
          <FragmentEditor fragments={draft.fragments} onChange={value => change('fragments', value)} disabled={busy} error={fieldErrors.fragments} />
        </div>
        <div id="panel-images" role="tabpanel" aria-labelledby="tool-images" hidden={tool !== 'images'}><ImageEditor images={draft.images} onChange={value => change('images', value)} disabled={busy} error={fieldErrors.images} /></div>
        <div id="panel-mood" role="tabpanel" aria-labelledby="tool-mood" hidden={tool !== 'mood'}><div className="mood-laboratory"><MoodPicker value={draft.moods} onChange={value => change('moods', value)} error={fieldErrors.moods} disabled={busy} /><SoundTuning value={draft.soundTuning} onChange={value => change('soundTuning', value)} disabled={busy} /></div><p className="fine-print">A direction you choose, not an emotion we measure. Save your changes before finding music.</p></div>
        <div className="compose-actions"><div><ErrorMessage message={error} />{notice ? <p className="success-message" role="status">{notice}</p> : null}</div><div className="action-group"><Link className="text-link" to={saved.id ? `/spaces/${saved.id}` : '/discover'}>Back to {saved.id ? 'space' : 'Discover'}</Link><Button type="submit" disabled={busy || conflict || expired || (!dirty && Boolean(saved.id))}>{busy ? 'Saving…' : 'Save changes'}</Button></div>{conflict ? <Link className="text-link" to={`/spaces/${saved.id}`}>Open the current saved version</Link> : null}</div>
      </section>
    </form>
    {saved.id ? <><RecommendationPanel spaceId={saved.id} revision={saved.revision} disabled={dirty || busy || expired} onSpaceChanged={async () => { const { data } = await api(`/spaces/${saved.id}`); setSaved(data); }} /><SavedTracks key={`${saved.id}:${saved.revision}`} spaceId={saved.id} disabled={dirty || busy || expired} onChanged={async () => { const { data } = await api(`/spaces/${saved.id}`); setSaved(data); }} /></> : <p className="fine-print recommendation-intro">Save this space to find music from its moods and words.</p>}
    {blocker.state === 'blocked' ? <ConfirmDialog title="Leave your changes behind?" confirmLabel="Discard and leave" onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()}><p>Your latest edits have not been saved. Stay here to keep working, or discard them.</p></ConfirmDialog> : null}
    {expired ? <section className="reauth-panel" aria-labelledby="reauth-title"><h2 id="reauth-title">Your session has expired.</h2><AuthForm reauthenticate onSuccess={() => setError('You are signed in again. Save your space when ready.')} /></section> : null}
  </div>;
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
