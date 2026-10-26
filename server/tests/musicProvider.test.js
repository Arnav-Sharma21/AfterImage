import { describe, expect, it } from 'vitest';
import { createJamendoProvider, normalizeJamendoTrack } from '../src/providers/jamendo.js';

// Synthetic provider contract fixtures are test-only. Live checks use Jamendo.
const raw = { id: '123', name: 'A &amp; B', artist_name: 'Artist', album_name: '', audio: 'https://prod-1.storage.jamendo.com/?trackid=123', image: 'https://usercontent.jamendo.com/?type=album&id=123', duration: 120, license_ccurl: 'http://creativecommons.org/licenses/by/3.0/', musicinfo: { tags: { genres: ['ambient'], vartags: ['quiet'] } } };
const ok = results => new Response(JSON.stringify({ headers: { code: 0, status: 'success' }, results }), { status: 200 });

describe('Jamendo provider boundary', () => {
  it('normalizes real-response fields without inventing missing metadata', () => {
    const track = normalizeJamendoTrack(raw);
    expect(track).toMatchObject({ id: 'jamendo:123', providerTrackId: '123', title: 'A & B', albumName: '', durationSeconds: 120, genres: ['ambient'], tags: ['quiet'], isPlayable: true });
    expect(normalizeJamendoTrack({ id: '1' })).toMatchObject({ durationSeconds: null, artworkUrl: null, streamUrl: null, licenseUrl: null, isPlayable: false });
    expect(normalizeJamendoTrack({ ...raw, audio: 'https://evil.example/song.mp3' }).isPlayable).toBe(false);
    expect(normalizeJamendoTrack({ ...raw, license_ccurl: 'https://creativecommons.org/licenses/by-nc-nd/3.0/' }).isPlayable).toBe(false);
    expect(normalizeJamendoTrack({ ...raw, audio: `${raw.audio}&client_id=private-key` }, 'private-key').streamUrl).toBeNull();
  });
  it('does not call the network when credentials are absent', async () => {
    let called = false;
    const provider = createJamendoProvider({ fetchImpl: () => { called = true; } });
    await expect(provider.search({ q: 'ambient', page: 1, limit: 20 })).rejects.toMatchObject({ status: 503, code: 'MUSIC_NOT_CONFIGURED' });
    expect(called).toBe(false);
  });
  it('encodes search terms and preserves provider relevance', async () => {
    let requestUrl;
    const provider = createJamendoProvider({ clientId: 'private-key', fetchImpl: async url => { requestUrl = url; return ok([raw]); } });
    const result = await provider.search({ q: 'a & b', page: 2, limit: 10 });
    expect(requestUrl.searchParams.get('search')).toBe('a & b');
    expect(requestUrl.searchParams.get('offset')).toBe('10');
    expect(requestUrl.searchParams.get('order')).toBe('relevance');
    expect(JSON.stringify(result)).not.toContain('private-key');
  });
  it('handles HTTP-200 credential/rate errors without echoing private upstream messages', async () => {
    for (const [code, expected] of [[5, 'MUSIC_CREDENTIALS_INVALID'], [6, 'MUSIC_RATE_LIMITED'], [1, 'MUSIC_PROVIDER_ERROR']]) {
      const provider = createJamendoProvider({ clientId: 'private-key', fetchImpl: async () => new Response(JSON.stringify({ headers: { status: 'failed', code, error_message: 'private-key' } })) });
      await expect(provider.getTrack('123')).rejects.toMatchObject({ code: expected });
      await provider.getTrack('123').catch(error => expect(error.message).not.toContain('private-key'));
    }
  });
  it('handles unavailable, malformed and timed-out responses', async () => {
    const unavailable = createJamendoProvider({ clientId: 'x', fetchImpl: async () => ok([]) });
    await expect(unavailable.getTrack('123')).rejects.toMatchObject({ code: 'TRACK_UNAVAILABLE' });
    const malformed = createJamendoProvider({ clientId: 'x', fetchImpl: async () => new Response('invalid json') });
    await expect(malformed.getTrack('123')).rejects.toMatchObject({ code: 'MUSIC_PROVIDER_UNAVAILABLE' });
    const timeout = createJamendoProvider({ clientId: 'x', fetchImpl: async () => { throw new DOMException('timeout', 'TimeoutError'); } });
    await expect(timeout.getTrack('123')).rejects.toMatchObject({ code: 'MUSIC_TIMEOUT', status: 504 });
    const failure = createJamendoProvider({ clientId: 'x', fetchImpl: async () => new Response('', { status: 503 }) });
    await expect(failure.getTrack('123')).rejects.toMatchObject({ code: 'MUSIC_PROVIDER_UNAVAILABLE' });
  });
  it('rechecks an empty response once using the same overall deadline', async () => {
    const signals = [];
    const provider = createJamendoProvider({ clientId: 'private-key', fetchImpl: async (_url, options) => {
      signals.push(options.signal);
      return signals.length === 1 ? ok([]) : ok([raw]);
    } });
    expect((await provider.getTrack('123')).id).toBe('jamendo:123');
    expect(signals).toHaveLength(2);
    expect(signals[0]).toBe(signals[1]);
  });
});
