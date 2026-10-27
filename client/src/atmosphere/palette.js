// Small bounded quantization, independent of React and the audio engine.
export const NEUTRAL = { background: '#130d12', surface: '#251521', foreground: '#f5edf2', muted: '#c9b5c1', accent: '#ff5c8a', secondary: '#71314f', method: 'neutral' };
const clamp = (n, a = 0, b = 255) => Math.min(b, Math.max(a, n));
const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
const hex = rgb => `#${rgb.map(v => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('')}`;
export function luminance(rgb) {
  const linear = rgb.map(v => { const s = v / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; });
  return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
}
export function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
export function paletteFromPixels(pixels) {
  const bins = new Map();
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 180) continue;
    const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const key = rgb.map(v => Math.floor(v / 32)).join(',');
    const bin = bins.get(key) || { count: 0, sum: [0, 0, 0] };
    bin.count++; rgb.forEach((v, j) => { bin.sum[j] += v; }); bins.set(key, bin);
  }
  const samples = [...bins.values()].map(bin => ({ count: bin.count, rgb: bin.sum.map(v => v / bin.count) })).sort((a, b) => b.count - a.count);
  if (!samples.length) return { ...NEUTRAL, method: 'image-wash' };
  const primary = samples[0].rgb;
  const ranked = samples.filter(s => luminance(s.rgb) > .015 && luminance(s.rgb) < .9).sort((a, b) => {
    const score = s => Math.sqrt(s.count) * (.25 + (Math.max(...s.rgb) - Math.min(...s.rgb)) / 255);
    return score(b) - score(a);
  });
  const vivid = ranked[0]?.rgb || primary;
  const secondary = ranked.find(s => s.rgb.reduce((sum, v, i) => sum + Math.abs(v - vivid[i]), 0) > 140)?.rgb || mix(primary, [170, 180, 190], .3);
  const background = mix(primary, [9, 12, 17], .68);
  const surface = mix(vivid, [18, 22, 28], .76);
  let accent = mix(vivid, [245, 242, 233], .48);
  while (contrast(accent, surface) < 4.5) accent = mix(accent, [255, 255, 255], .12);
  let muted = mix(vivid, [231, 232, 230], .78);
  while (contrast(muted, background) < 4.5) muted = mix(muted, [255, 255, 255], .12);
  return { background: hex(background), surface: hex(surface), foreground: '#f6f4ee', muted: hex(muted), accent: hex(accent), secondary: hex(secondary), method: 'pixels' };
}
const cache = new Map();
export function extractPalette(url) {
  if (!url) return Promise.resolve(NEUTRAL);
  if (cache.has(url)) return cache.get(url);
  const promise = new Promise(resolve => {
    const image = new Image();
    let done = false;
    const finish = value => { if (done) return; done = true; clearTimeout(timeout); image.onload = image.onerror = null; resolve(value); };
    const timeout = setTimeout(() => finish({ ...NEUTRAL, method: 'image-wash' }), 6000);
    image.crossOrigin = 'anonymous'; image.referrerPolicy = 'no-referrer';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 48;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, 48, 48);
        finish(paletteFromPixels(context.getImageData(0, 0, 48, 48).data));
      } catch { finish({ ...NEUTRAL, method: 'image-wash' }); }
    };
    image.onerror = () => finish({ ...NEUTRAL, method: 'image-wash' });
    image.src = url;
  });
  cache.set(url, promise);
  if (cache.size > 128) cache.delete(cache.keys().next().value);
  return promise;
}
