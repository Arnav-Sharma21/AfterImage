import { useEffect, useState } from 'react';
import { extractPalette, NEUTRAL } from './palette.js';

export function useAtmosphere(url) {
  const [result, setResult] = useState({ url: null, palette: NEUTRAL });
  useEffect(() => {
    let active = true;
    extractPalette(url).then(palette => { if (active) setResult({ url, palette }); });
    return () => { active = false; };
  }, [url]);
  const palette = url ? result.palette : NEUTRAL;
  return { palette, method: result.url === url ? palette.method : url ? 'loading' : 'neutral', style: { '--atmos-bg': palette.background, '--atmos-surface': palette.surface, '--atmos-text': palette.foreground, '--atmos-muted': palette.muted, '--atmos-accent': palette.accent, '--atmos-secondary': palette.secondary, '--space-ink': palette.background, '--space-glow': palette.secondary } };
}
