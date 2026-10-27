import { useState } from 'react';

export function Artwork({ src, alt = '', className = '', priority = false }) {
  const [failed, setFailed] = useState(null);
  return src && failed !== src
    ? <img className={`artwork ${className}`} src={src} alt={alt} width="640" height="640" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} referrerPolicy="no-referrer" onError={() => setFailed(src)} />
    : <div className={`artwork artwork-fallback ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}><span>aftr.</span></div>;
}

export function Atmosphere({ src }) {
  return <div className="ambient-field" aria-hidden="true">{src ? <img src={src} alt="" width="80" height="80" referrerPolicy="no-referrer" /> : null}<div className="ambient-light" /><div className="film-grain" /></div>;
}
