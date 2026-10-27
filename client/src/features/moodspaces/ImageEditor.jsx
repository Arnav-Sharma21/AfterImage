import { Button } from '../../components/Button.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Artwork } from '../../components/Artwork.jsx';
import { isPublicImageUrl } from '../../../../shared/images.js';
import { useEffect, useRef, useState } from 'react';
import { MediaImport } from './MediaImport.jsx';

export function ImageEditor({ images, onChange, disabled, error, onUploadingChange }) {
  const [expanded, setExpanded] = useState(() => new Set(images.filter(item => !item.url).map(item => item.id)));
  const latest = useRef(images);
  useEffect(() => { latest.current = images; }, [images]);
  function append(image) {
    if (latest.current.length >= 12) return;
    setExpanded(current => new Set([...current, image.id]));
    latest.current = [...latest.current, image]; onChange(latest.current);
  }
  function add() {
    const id = crypto.randomUUID();
    setExpanded(current => new Set([...current, id]));
    onChange([...images, { id, url: '', alt: '', caption: '' }]);
  }
  function update(id, fields) { onChange(images.map(item => item.id === id ? { ...item, ...fields } : item)); }
  function move(index, direction) {
    const next = [...images];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  }
  return <section className="image-editor" aria-labelledby="image-editor-title"><div className="section-heading"><div><p className="eyebrow">COLLECT THE ATMOSPHERE</p><h2 id="image-editor-title">Your visual world.</h2></div><Button variant="secondary" disabled={disabled || images.length >= 12} onClick={add}><Icon name="plus" />Add image</Button></div>
    <MediaImport remaining={12 - images.length} onAdd={append} disabled={disabled} onUploadingChange={onUploadingChange} />
    <p className="fine-print">Use images you own or have permission to display. Paste a direct HTTPS image URL. Images load from their host, which receives your network request. You can also upload photographs above. Image captions guide matching; pixels do not infer emotion.</p>
    <div className="image-edit-grid">{images.map((item, index) => <article className="image-edit-card" key={item.id}>
      <Artwork managed={Boolean(item.assetId)} src={isPublicImageUrl(item.url) ? item.url : undefined} alt={item.alt} />
      <div className="image-order"><span>IMAGE {String(index + 1).padStart(2, '0')}</span><div><Button variant="text" disabled={disabled || index === 0} onClick={() => move(index, -1)} aria-label={`Move image ${index + 1} earlier`}>←</Button><Button variant="text" disabled={disabled || index === images.length - 1} onClick={() => move(index, 1)} aria-label={`Move image ${index + 1} later`}>→</Button></div></div>
      <details open={expanded.has(item.id)} onInvalid={event => { const target = event.target; setExpanded(current => new Set([...current, item.id])); requestAnimationFrame(() => target.focus()); }} onToggle={event => { const open = event.currentTarget.open; setExpanded(current => { if (current.has(item.id) === open) return current; const next = new Set(current); if (open) next.add(item.id); else next.delete(item.id); return next; }); }}><summary>Edit image {index + 1}</summary><label htmlFor={`image-url-${item.id}`}>Image URL {index + 1}<input id={`image-url-${item.id}`} name={`image-url-${item.id}`} type="url" readOnly={Boolean(item.assetId)} value={item.url} maxLength={2048} onChange={event => update(item.id, { url: event.target.value })} disabled={disabled} required autoComplete="off" placeholder="https://images.example.org/photo.jpg…" /></label>
        {item.url && !isPublicImageUrl(item.url) ? <p className="field-error">Use a public HTTPS URL without credentials or a custom port.</p> : null}
        <label htmlFor={`image-alt-${item.id}`}>Image description {index + 1}<input id={`image-alt-${item.id}`} name={`image-alt-${item.id}`} value={item.alt} maxLength={200} onChange={event => update(item.id, { alt: event.target.value })} disabled={disabled} required placeholder="What is visible in this image?…" /></label>
        <div className="image-caption-field"><label htmlFor={`image-caption-${item.id}`}>Image caption {index + 1}</label><textarea id={`image-caption-${item.id}`} name={`image-caption-${item.id}`} value={item.caption} maxLength={500} rows={2} onChange={event => update(item.id, { caption: event.target.value })} disabled={disabled} placeholder="The feeling you want to keep…" /></div>
      </details>{item.assetId ? <p className="fine-print image-managed">Cloudinary image · to replace, import a new photograph and remove this one. Storage is cleaned only after your world is saved.</p> : null}<Button variant="text-danger" disabled={disabled} onClick={() => onChange(images.filter(image => image.id !== item.id))}>Remove image {index + 1}</Button>
    </article>)}</div>
    {!images.length ? <div className="canvas-invitation"><Icon name="image" size={32} /><p>A photograph. A color. A place you keep returning to.</p><span>Add an image to begin your collage.</span></div> : null}
    {error ? <p className="field-error" role="alert">{error}</p> : null}
  </section>;
}
