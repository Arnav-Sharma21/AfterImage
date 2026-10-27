import { useState } from 'react';

export function Artwork({ src, alt = '', className = '', priority = false, managed = false, sizeHint = '(max-width: 767px) 90vw, 50vw' }) {
  const [optimizationFailed, setOptimizationFailed] = useState(null);
  const responsive = optimizationFailed !== src && managed && /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(src || '');
  const optimized = width => src.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
  const [failed, setFailed] = useState(null);
  return src && failed !== src
    ? <img className={`artwork ${className}`} src={responsive ? optimized(1200) : src} srcSet={responsive ? [80, 160, 320, 640, 1200].map(width => `${optimized(width)} ${width}w`).join(', ') : undefined} sizes={responsive ? sizeHint : undefined} alt={alt} width="640" height="640" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} referrerPolicy="no-referrer" onError={() => responsive ? setOptimizationFailed(src) : setFailed(src)} />
    : <div className={`artwork artwork-fallback ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}><span>aftr.</span></div>;
}

export function Atmosphere({ src }) {
  return <div className="ambient-field" aria-hidden="true">{src ? <img src={src} alt="" width="80" height="80" referrerPolicy="no-referrer" /> : null}<div className="ambient-light" /><div className="film-grain" /></div>;
}
