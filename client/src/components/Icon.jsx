const paths = {
  play: 'm9 5 11 7-11 7V5Z', pause: 'M8 5v14M16 5v14',
  next: 'm5 5 10 7-10 7V5ZM19 5v14', previous: 'm19 5-10 7 10 7V5ZM5 5v14',
  queue: 'M4 6h16M4 12h11M4 18h11M20 14v8M16 18h8',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  save: 'M6 3h12v18l-6-4-6 4V3Z', expand: 'M14 3h7v7M21 3l-8 8M10 21H3v-7M3 21l8-8',
  close: 'm6 6 12 12M6 18 18 6', arrow: 'M4 12h16m-6-6 6 6-6 6',
  volume: 'm11 4-6 5H2v6h3l6 5V4ZM15 8c3 2 3 6 0 8M18 4c6 4 6 12 0 16',
  mute: 'm11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6',
  focus: 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5',
  image: 'M3 3h18v18H3V3Zm0 14 6-6 4 4 3-3 5 5M16 7h.01',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  plus: 'M12 4v16M4 12h16', check: 'm4 12 5 5L20 6'
};
export function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.arrow} /></svg>;
}
