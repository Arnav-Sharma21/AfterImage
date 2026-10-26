import { DIMENSIONS, DIMENSION_WEIGHTS } from './vocabulary.js';
import { trackSignals } from './profile.js';

export function buildAffinities(feedback, tracks) {
  const byId = new Map(tracks.map(track => [track.id || String(track._id), track]));
  const counts = new Map();
  for (const entry of feedback) {
    if (!['like', 'dislike'].includes(entry.reaction)) continue;
    const track = byId.get(entry.trackId);
    if (!track) continue;
    for (const tag of trackSignals(track).tags) {
      const current = counts.get(tag) || { positive: 0, negative: 0 };
      if (entry.reaction === 'like') current.positive++;
      else current.negative++;
      counts.set(tag, current);
    }
  }
  return Object.fromEntries([...counts].map(([tag, count]) => [tag, (count.positive - count.negative) / (count.positive + count.negative + 4)]));
}

export function rankCandidates(candidates, profile, { dislikedIds = [], likedIds = [], savedIds = [], previousIds = [], affinities = {}, limit = 12 } = {}) {
  const disliked = new Set(dislikedIds);
  const liked = new Set(likedIds);
  const saved = new Set(savedIds);
  const previous = new Set(previousIds);
  const unique = new Map();
  for (const track of candidates) {
    if (!track?.id || !track.isPlayable || !track.streamUrl || !track.licenseUrl || disliked.has(track.id) || unique.has(track.id)) continue;
    unique.set(track.id, track);
  }
  const scored = [];
  for (const track of unique.values()) {
    const signals = trackSignals(track);
    const matches = signals.tags.filter(tag => profile.tagWeights[tag] > 0).sort((a, b) => profile.tagWeights[b] - profile.tagWeights[a] || a.localeCompare(b));
    if (!matches.length) continue; // Unknown metadata is not proof of a mood match.
    const mood = matches.reduce((sum, tag) => sum + profile.tagWeights[tag], 0);
    let featureWeight = 0;
    let featureSum = 0;
    for (const key of DIMENSIONS) {
      if (!Number.isFinite(signals.features[key]) || !Number.isFinite(profile.features[key])) continue;
      featureWeight += DIMENSION_WEIGHTS[key];
      featureSum += DIMENSION_WEIGHTS[key] * (1 - Math.abs(signals.features[key] - profile.features[key]));
    }
    const genre = signals.genres.reduce((sum, tag) => sum + (profile.genreWeights[tag] || 0), 0);
    const hasGenre = signals.genres.length > 0 && Object.keys(profile.genreWeights).length > 0;
    const affinity = signals.tags.length ? signals.tags.reduce((sum, tag) => sum + (affinities[tag] || 0), 0) / signals.tags.length : 0;
    const preference = Math.min(1, .5 + .5 * affinity + (liked.has(track.id) ? .1 : 0));
    const coverage = .45 + .2 * featureWeight + (hasGenre ? .2 : 0) + .15;
    const numerator = .45 * mood + .2 * featureSum + (hasGenre ? .2 * genre : 0) + .15 * preference;
    const repetition = (saved.has(track.id) ? .18 : 0) + (previous.has(track.id) ? .1 : 0);
    const score = Math.max(0, 100 * (numerator / coverage) * (.75 + .25 * coverage) - 100 * repetition);
    const bestTag = matches[0];
    const origin = profile.tagSources[bestTag]?.[0] || 'your space';
    const reasons = [`Normalized catalog tag “${bestTag}” matches ${origin}.`];
    if (Number.isFinite(signals.features.energy) && Math.abs(signals.features.energy - profile.features.energy) <= .2) reasons.push('Its estimated energy is close to your space’s direction.');
    else if (affinity > 0) reasons.push('Its catalog tags align with music you have liked.');
    if (saved.has(track.id)) reasons.push('Already saved here; ranked lower to leave room for new music.');
    if (previous.has(track.id)) reasons.push('Shown last time; a repetition penalty was applied.');
    scored.push({ track, score: Math.round(score * 100) / 100, reasons, evidence: { matchedTags: matches, mood, features: featureWeight ? featureSum / featureWeight : null, genre: hasGenre ? genre : null, preference, coverage, repetition } });
  }
  scored.sort((a, b) => b.score - a.score || (a.track.id < b.track.id ? -1 : a.track.id > b.track.id ? 1 : 0));
  const artists = new Map();
  return scored.filter(item => {
    const artist = (item.track.artistName || item.track.id).toLowerCase();
    const count = artists.get(artist) || 0;
    if (count >= 2) return false;
    artists.set(artist, count + 1);
    return true;
  }).slice(0, limit);
}
