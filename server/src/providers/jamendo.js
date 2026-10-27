import { AppError } from '../middleware/errors.js';

export const JAMENDO_MEDIA_ORIGINS = ['https://*.storage.jamendo.com'];
export const JAMENDO_IMAGE_ORIGINS = ['https://usercontent.jamendo.com', 'https://*.jamendo.com'];

function httpsUrl(value, allowed) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || !allowed(url)) return null;
    return url.href;
  } catch { return null; }
}

function text(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const entities = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>' };
  return value.replace(/&amp;|&quot;|&#39;|&lt;|&gt;/g, match => entities[match]).trim();
}

export function normalizeJamendoTrack(raw, clientId = '') {
  if (!raw || !/^\d+$/.test(String(raw.id))) return null;
  const licenseUrl = httpsUrl(typeof raw.license_ccurl === 'string' ? raw.license_ccurl.replace(/^http:/, 'https:') : '',
    url => url.hostname === 'creativecommons.org' && /^\/licenses\/(by|by-sa|by-nc|by-nc-sa)\/[1-4]\.\d\/$/.test(url.pathname));
  const streamUrl = httpsUrl(raw.audio, url => url.hostname.endsWith('.storage.jamendo.com'));
  // Provider credentials must never be returned, even inside an upstream URL.
  const safeStream = streamUrl && (!clientId || !streamUrl.includes(clientId)) ? streamUrl : null;
  const metadataTags = raw.musicinfo?.tags;
  const cleanTags = values => Array.isArray(values) ? [...new Set(values.filter(value => typeof value === 'string').map(value => text(value).slice(0, 80)))].slice(0, 30) : [];
  return {
    id: `jamendo:${raw.id}`, provider: 'jamendo', providerTrackId: String(raw.id),
    title: text(raw.name, 'Untitled track').slice(0, 200) || 'Untitled track',
    artistName: text(raw.artist_name, 'Unknown artist').slice(0, 160) || 'Unknown artist',
    albumName: text(raw.album_name).slice(0, 200),
    artworkUrl: httpsUrl(raw.image || raw.album_image, url => url.hostname === 'usercontent.jamendo.com' || url.hostname.endsWith('.jamendo.com')),
    streamUrl: licenseUrl ? safeStream : null,
    durationSeconds: Number.isFinite(Number(raw.duration)) && Number(raw.duration) > 0 ? Number(raw.duration) : null,
    genres: cleanTags(metadataTags?.genres),
    tags: cleanTags([...(Array.isArray(metadataTags?.vartags) ? metadataTags.vartags : []), ...(Array.isArray(metadataTags?.instruments) ? metadataTags.instruments : [])]),
    licenseUrl,
    sourceUrl: `https://www.jamendo.com/track/${raw.id}`,
    isPlayable: Boolean(licenseUrl && safeStream),
    musicFeatures: {
      energy: ({ verylow: .1, low: .3, medium: .5, high: .7, veryhigh: .9 })[raw.musicinfo?.speed] ?? null,
      vocal: ['vocal', 'instrumental'].includes(raw.musicinfo?.vocalinstrumental) ? raw.musicinfo.vocalinstrumental : null
    }
  };
}

export function createJamendoProvider({ clientId, fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  async function request(parameters, externalSignal, deadlineMs = timeoutMs) {
    if (!clientId) throw new AppError(503, 'MUSIC_NOT_CONFIGURED', 'Music search is not configured. Set JAMENDO_CLIENT_ID in server/.env and restart the backend.');
    const url = new URL('https://api.jamendo.com/v3.0/tracks/');
    url.search = new URLSearchParams({ client_id: clientId, format: 'json', audioformat: 'mp31', include: 'musicinfo', type: 'single albumtrack', ...(parameters.id ? {} : { ccnd: 'false' }), ...parameters });
    try {
      const timeout = AbortSignal.timeout(deadlineMs);
      const signal = externalSignal ? AbortSignal.any([timeout, externalSignal]) : timeout;
      // Up to 3 attempts with progressive delay for transient empty cluster responses.
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 350));
        const response = await fetchImpl(url, { signal, redirect: 'error' });
        if (response.status === 429) throw new AppError(429, 'MUSIC_RATE_LIMITED', 'Jamendo is receiving too many requests. Wait a moment and try again.');
        if (response.status === 401 || response.status === 403) throw new AppError(503, 'MUSIC_CREDENTIALS_INVALID', 'Jamendo rejected the server credentials. Check JAMENDO_CLIENT_ID.');
        if (response.status >= 500 && attempt < 2) continue;
        if (!response.ok) throw new AppError(502, 'MUSIC_PROVIDER_UNAVAILABLE', 'Jamendo is unavailable. Please try again shortly.');
        const body = await response.json();
        if (Number(body.headers?.code) !== 0 || !['success', 'succeed'].includes(body.headers?.status)) {
          // Do not echo upstream error messages: they can contain request credentials.
          const code = Number(body.headers?.code);
          if (code === 1 && attempt < 2) continue;
          if (code === 6) throw new AppError(429, 'MUSIC_RATE_LIMITED', 'Jamendo is receiving too many requests. Wait a moment and try again.');
          if ([4, 5].includes(code)) throw new AppError(503, 'MUSIC_CREDENTIALS_INVALID', 'Jamendo rejected the server credentials. Check JAMENDO_CLIENT_ID.');
          throw new AppError(502, 'MUSIC_PROVIDER_ERROR', 'Jamendo could not complete this request. Please try again.');
        }
        if (!Array.isArray(body.results)) throw new Error('Malformed provider response');
        if (!body.results.length && attempt < 2) continue;
        return body.results.map(raw => normalizeJamendoTrack(raw, clientId)).filter(Boolean);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new AppError(504, 'MUSIC_TIMEOUT', 'Jamendo took too long to respond. Please try again.');
      throw new AppError(502, 'MUSIC_PROVIDER_UNAVAILABLE', 'Cannot reach Jamendo right now. Please try again shortly.');
    }
  }
  return {
    name: 'jamendo',
    async search({ q, page, limit }) {
      const tracks = await request({ search: q, offset: String((page - 1) * limit), limit: String(limit), order: 'relevance' });
      return { tracks, hasMore: tracks.length === limit };
    },
    async getCandidates({ tags, speed, offset, limit, signal }) {
      return request({ fuzzytags: tags.join('+'), ...(speed.length ? { speed: speed.join('+') } : {}), offset: String(offset), limit: String(limit), order: 'relevance' }, signal, 5000);
    },
    async getTrack(id) {
      const tracks = await request({ id, limit: '1' });
      const track = tracks.find(item => item.providerTrackId === id);
      if (!track) throw new AppError(404, 'TRACK_UNAVAILABLE', 'This track is no longer available from Jamendo.');
      return track;
    }
  };
}
