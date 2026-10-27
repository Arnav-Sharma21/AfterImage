import { Artwork } from '../../components/Artwork.jsx';

export function MoodCanvas({ space, editing = false, onEditImage, onEditStory }) {
  const images = space.images || [];
  const fragments = space.fragments || [];
  return <section className={`mood-canvas ${images.length === 1 ? 'single-image' : ''}`} data-images={images.length} aria-label="Moodspace canvas">
    {images.map((image, index) => <figure className={`canvas-image canvas-image-${index % 4}`} key={image.id}><Artwork managed={Boolean(image.assetId)} src={image.url} alt={image.alt} priority={index === 0} />{editing ? <button className="canvas-edit" type="button" onClick={onEditImage} aria-label={`Edit canvas image ${index + 1}`}>Edit ↗</button> : null}<figcaption><span className="eyebrow">STILL / {String(index + 1).padStart(2, '0')}</span>{image.caption ? <p>{image.caption}</p> : null}</figcaption></figure>)}
    {fragments.map(fragment => fragment.type === 'quote' ? <blockquote className="canvas-fragment canvas-quote" key={fragment.id}><span className="eyebrow">A LINE TO HOLD ONTO</span><p>{fragment.text}</p></blockquote> : <article className="canvas-fragment canvas-note" key={fragment.id}><span className="eyebrow">{fragment.type === 'image-caption' ? 'REFERENCE / CAPTION' : 'PERSONAL NOTE'}</span><p>{fragment.text}</p></article>)}
    {!images.length && !fragments.length ? <div className="canvas-empty"><div className="canvas-start-mark" aria-hidden="true">＋<span>YOUR SPACE / 01</span></div><div><span className="eyebrow">YOUR WORLD, TAKING SHAPE</span><p>Pictures. Words.<br />Your kind of noise.</p>{editing ? <div className="canvas-start-actions"><button type="button" onClick={onEditImage}>Add photographs ↗</button><button type="button" onClick={onEditStory}>Add words ↗</button></div> : <span>Add a photograph or a thought in Edit space.</span>}</div></div> : null}
  </section>;
}
