import { Button } from '../../components/Button.jsx';

export function FragmentEditor({ fragments, onChange, disabled, error }) {
  function update(id, fields) { onChange(fragments.map(fragment => fragment.id === id ? { ...fragment, ...fields } : fragment)); }
  return <section className="fragment-editor" aria-labelledby="fragment-title"><h2 id="fragment-title">Words and references</h2><p className="fine-print">Optional quotes, thoughts, or your own image captions can influence music through recognized words. No image is analyzed.</p>
    <div className="fragment-edit-grid">{fragments.map((fragment, index) => <div key={fragment.id} className={`fragment-row fragment-${fragment.type}`}><label htmlFor={`fragment-type-${fragment.id}`}>Fragment type {index + 1}<select id={`fragment-type-${fragment.id}`} value={fragment.type} disabled={disabled} onChange={event => update(fragment.id, { type: event.target.value })}><option value="note">Personal thought</option><option value="quote">Quote</option><option value="image-caption">Image caption</option></select></label><label htmlFor={`fragment-text-${fragment.id}`}>Text fragment {index + 1}<textarea id={`fragment-text-${fragment.id}`} value={fragment.text} onChange={event => update(fragment.id, { text: event.target.value })} maxLength={1000} rows={3} disabled={disabled} placeholder="Keep a thought here…" /></label><Button variant="text-danger" disabled={disabled} onClick={() => onChange(fragments.filter(item => item.id !== fragment.id))}>Remove fragment {index + 1}</Button></div>)}</div>
    {error ? <p className="field-error">{error}</p> : null}
    <Button variant="secondary" disabled={disabled || fragments.length >= 10} onClick={() => onChange([...fragments, { id: crypto.randomUUID(), type: 'note', text: '' }])}>Add text fragment</Button>
  </section>;
}
