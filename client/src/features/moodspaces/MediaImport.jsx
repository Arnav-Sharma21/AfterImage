import { useEffect, useRef, useState } from 'react';
import { api, uploadImage } from '../../services/api.js';
import { Button } from '../../components/Button.jsx';
import { Artwork } from '../../components/Artwork.jsx';

export function MediaImport({ remaining, onAdd, disabled, onUploadingChange }) {
  const [config, setConfig] = useState(null);
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [library, setLibrary] = useState(null);
  const fileInput = useRef(null);
  const controller = useRef(null);
  const previews = useRef([]);
  const latest = useRef(onAdd);
  useEffect(() => { latest.current = onAdd; }, [onAdd]);
  useEffect(() => {
    const abort = new AbortController();
    const urls = previews.current;
    api('/media/config', { signal: abort.signal }).then(({ data }) => setConfig(data)).catch(failure => { if (failure.name !== 'AbortError') setError(failure.message); });
    return () => { abort.abort(); controller.current?.abort(); urls.forEach(URL.revokeObjectURL); };
  }, []);
  async function filesSelected(files) {
    if (busy || disabled) return;
    setError('');
    const chosen = [...files];
    if (chosen.length > remaining) { setError(`There is room for ${remaining} more image${remaining === 1 ? '' : 's'}. A world holds twelve.`); return; }
    if (!config?.configured) { setError('Uploads need Cloudinary configuration on the server. You can still add HTTPS image links.'); return; }
    if (chosen.some(file => file.size > config.maxBytes)) { setError('Choose files smaller than 8 MB each.'); return; }
    const items = chosen.map(file => { const url = URL.createObjectURL(file); previews.current.push(url); return { id: crypto.randomUUID(), file, preview: url, progress: 0, state: 'waiting' }; });
    setQueue(items); setBusy(true); onUploadingChange?.(true);
    controller.current = new AbortController();
    for (const item of items) {
      if (controller.current.signal.aborted) break;
      const update = fields => setQueue(current => current.map(row => row.id === item.id ? { ...row, ...fields } : row));
      update({ state: 'uploading' });
      try {
        const data = await uploadImage(item.file, { signal: controller.current.signal, onProgress: progress => update({ progress, state: progress === 100 ? 'processing' : 'uploading' }) });
        if (controller.current.signal.aborted) break;
        latest.current({ id: crypto.randomUUID(), url: data.url, assetId: data.assetId, alt: '', caption: '' });
        update({ state: 'ready', progress: 100 });
      } catch (failure) {
        update({ state: failure.name === 'AbortError' ? 'cancelled' : 'failed', message: failure.name === 'AbortError' ? 'Cancelled. Check unused uploads if storage already received it.' : failure.message });
      }
    }
    setBusy(false); onUploadingChange?.(false);
    if (fileInput.current) fileInput.current.value = '';
  }
  async function showLibrary() {
    try { const { data } = await api('/media'); setLibrary(data); } catch (failure) { setError(failure.message); }
  }
  async function removeAsset(assetId) {
    try { await api(`/media/${assetId}`, { method: 'DELETE', body: {} }); setLibrary(current => current.filter(asset => asset.assetId !== assetId)); }
    catch (failure) { setError(failure.message); }
  }
  return <section className={`media-import ${dragging ? 'is-dragging' : ''}`} aria-label="Import photographs" onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); void filesSelected(event.dataTransfer.files); }}>
    <div className="import-head"><span className="eyebrow">FROM YOUR CAMERA ROLL / INTO YOUR WORLD</span><h3>Bring a piece<br />of <em>your life.</em></h3><p>Drop photographs here, or choose from your device. JPEG, PNG, WebP and AVIF · 8 MB each.</p></div>
    <div className="import-actions"><input ref={fileInput} className="sr-only" id="photo-files" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={disabled || busy || remaining === 0} onChange={event => void filesSelected(event.target.files)} aria-label="Choose image files" /><Button variant="secondary" disabled={disabled || busy || !remaining} onClick={() => fileInput.current?.click()}>Choose photographs ↗</Button><Button variant="text" disabled={disabled || busy} onClick={showLibrary}>Manage uploads</Button>{busy ? <Button variant="text" onClick={() => controller.current?.abort()}>Cancel uploads</Button> : null}</div>
    {config && !config.configured ? <p className="fine-print">Image uploads are not configured yet. Add the three Cloudinary server credentials to enable them. Image links remain available below.</p> : null}
    <p className="fine-print">Uploaded images use Cloudinary delivery URLs. Only your account can manage them here; the delivery URL is accessible to anyone who has it. Do not upload sensitive documents.</p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    {queue.length ? <ol className="upload-progress" aria-live="polite">{queue.map(item => <li key={item.id}><img src={item.preview} alt="Upload preview" width="64" height="64" /><div><strong>{item.file.name}</strong><span>{item.state === 'processing' ? 'Received · validating and storing…' : item.state === 'ready' ? 'Stored · add an image description below, then save your world.' : item.state === 'uploading' ? `Uploading ${item.progress}%` : item.message || item.state}</span>{['uploading', 'processing'].includes(item.state) ? <progress max="100" value={item.progress} aria-label={`Upload progress for ${item.file.name}`} /> : null}</div></li>)}</ol> : null}
    {library ? <div className="upload-library"><h4>Your stored photographs</h4><p className="fine-print">Saved images are protected. Unsaved imports stay available here after a cancelled draft. Remove only the ones you no longer want.</p>{library.length ? library.map(asset => <div className="stored-image" key={asset.assetId}><Artwork src={asset.url} /><span>{asset.inUse ? 'In a saved world' : asset.cleanupFailed ? 'Cleanup needs retry' : 'Available import'}</span>{asset.url && asset.status === 'ready' ? <Button variant="text" disabled={!remaining || busy || disabled} onClick={() => latest.current({ id: crypto.randomUUID(), assetId: asset.assetId, url: asset.url, alt: '', caption: '' })}>Use image</Button> : null}<Button variant="text-danger" disabled={asset.inUse || busy} onClick={() => removeAsset(asset.assetId)}>Delete upload</Button></div>) : <p>No stored uploads yet.</p>}<Button variant="text" onClick={() => setLibrary(null)}>Close uploads</Button></div> : null}
  </section>;
}
