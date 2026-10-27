export function EditorialPhoto({ className = '', priority = false, scene = 'night-listener' }) {
  return <img className={`editorial-photo ${className}`} src={`/images/${scene}.webp`} srcSet={`/images/${scene}-small.webp 768w, /images/${scene}.webp 1536w`} sizes="100vw" width="1536" height="1024" alt={scene === 'after-rain' ? 'Original editorial artwork of a solitary figure in a rain-lit city passage' : 'An original editorial portrait of a listener beside a rain-streaked night train window'} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} />;
}
