import { describe, expect, it } from 'vitest';
import { contrast, paletteFromPixels } from '../../client/src/atmosphere/palette.js';
const rgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
const pixels = color => new Uint8ClampedArray(Array.from({ length: 100 }, () => [...color, 255]).flat());
describe('artwork palette rules using explicit synthetic pixel fixtures', () => {
  it('produces different harmonious environments and readable controls from different colors', () => {
    const palettes = [[20, 90, 195], [225, 126, 30], [110, 110, 110]].map(color => paletteFromPixels(pixels(color)));
    expect(new Set(palettes.map(palette => palette.background)).size).toBe(3);
    for (const palette of palettes) {
      expect(palette.method).toBe('pixels');
      expect(contrast(rgb(palette.foreground), rgb(palette.background))).toBeGreaterThan(4.5);
      expect(contrast(rgb(palette.accent), rgb(palette.surface))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('ignores transparent content and reports a fallback without claiming extraction', () => {
    expect(paletteFromPixels(new Uint8ClampedArray(400)).method).toBe('image-wash');
  });
});
