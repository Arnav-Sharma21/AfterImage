// Color direction is an editorial fallback. A blurred real image supplies its
// own projected colors without canvas access, CORS sampling or pixel inference.
export function spaceAtmosphere(space) {
  const moods = space?.moods || [];
  if (space?.soundTuning?.warmth > .7 || moods.includes('Warm')) return { '--space-glow': '#9f632f', '--space-ink': '#20150f' };
  if (space?.soundTuning?.melancholy > .7 || space?.soundTuning?.nostalgia > .7 || moods.includes('Melancholic')) return { '--space-glow': '#805277', '--space-ink': '#241825' };
  if (space?.soundTuning?.intensity > .7 || moods.includes('Intense') || (moods.includes('Restless') && !moods.includes('Quiet'))) return { '--space-glow': '#c34b3b', '--space-ink': '#30171b' };
  if (moods.includes('Quiet') || moods.includes('Focused')) return { '--space-glow': '#356873', '--space-ink': '#101d22' };
  if (moods.includes('Dreamlike')) return { '--space-glow': '#6c548b', '--space-ink': '#20172d' };
  return { '--space-glow': '#b82e53', '--space-ink': '#2b111a' };
}

