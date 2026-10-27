import { describe, expect, it } from 'vitest';
import { buildCandidateQueries, buildMoodProfile, textSignals, trackSignals } from '../src/recommendation/profile.js';
import { buildAffinities, rankCandidates } from '../src/recommendation/rank.js';

// Explicit synthetic unit fixtures. Live verification is separate.
const track = (id, tags, genres = ['ambient'], artist = `Artist ${id}`) => ({
  id: `jamendo:${id}`, provider: 'jamendo', providerTrackId: String(id), title: `Fixture ${id}`, artistName: artist,
  tags, genres, licenseUrl: 'https://creativecommons.org/licenses/by/3.0/', streamUrl: 'https://prod-1.storage.jamendo.com/test-only', isPlayable: true
});
const space = moods => ({ moods, title: '', description: '', fragments: [] });

describe('deterministic interpretation and ranking', () => {
  it('changes ranking and candidate queries for different explicit moods', () => {
    const quiet = buildMoodProfile(space(['Quiet']));
    const intense = buildMoodProfile(space(['Intense']));
    const candidates = [track(1, ['relaxing', 'chillout']), track(2, ['energetic', 'metal'], ['rock', 'metal'])];
    expect(rankCandidates(candidates, quiet)[0].track.id).toBe('jamendo:1');
    expect(rankCandidates(candidates, intense)[0].track.id).toBe('jamendo:2');
    expect(buildCandidateQueries(quiet)[0].tags).not.toEqual(buildCandidateQueries(intense)[0].tags);
    expect(quiet.features.energy).toBeLessThan(intense.features.energy);
    expect(buildCandidateQueries(quiet, 1)[0].offset).toBe(40);
  });
  it('uses recognized words, quotes and manual captions, never raw images', () => {
    const base = space(['Quiet']);
    const baseline = buildMoodProfile(base);
    const withWords = buildMoodProfile({ ...base, fragments: [{ type: 'quote', text: 'nostalgic memories' }, { type: 'image-caption', text: 'warm sunshine' }] });
    expect(withWords.features.nostalgia).toBeGreaterThan(baseline.features.nostalgia);
    expect(withWords.features.warmth).toBeGreaterThan(baseline.features.warmth);
    expect(withWords.tagSources.acoustic).toContain('image caption word “warm”');
    expect(buildMoodProfile({ ...base, imageUrl: 'https://example.test/angry-red.jpg' })).toEqual(baseline);
    expect(buildMoodProfile({ ...base, images: [{ url: 'https://images.example.com/red.jpg', alt: 'Angry red', caption: '' }] })).toEqual(baseline);
    const captioned = buildMoodProfile({ ...base, images: [{ caption: 'warm sunshine' }] });
    expect(captioned.tagSources.acoustic).toContain('image caption word “warm”');
    expect(buildMoodProfile({ ...base, description: 'unrecognized words xyz' })).toEqual(baseline);
  });
  it('bounds text influence, deduplicates repetitions and handles simple negation', () => {
    const base = space(['Quiet']);
    expect(textSignals('not happy, without sadness, warm')).toEqual([{ word: 'warm', name: 'Warm' }]);
    const once = buildMoodProfile({ ...base, description: 'warm' });
    const repeated = buildMoodProfile({ ...base, description: 'warm '.repeat(100), fragments: [{ type: 'quote', text: 'warm' }] });
    expect(repeated).toEqual(once);
    expect(once.sources.find(source => source.kind === 'words').weight).toBeCloseTo(.25);
  });
  it('uses saved music and likes as bounded secondary signals', () => {
    const base = space(['Quiet']);
    const baseline = buildMoodProfile(base);
    const loud = track(1, ['energetic'], ['rock']);
    expect(buildMoodProfile(base, [loud]).features.energy).toBeGreaterThan(baseline.features.energy);
    expect(buildMoodProfile(base, [], [loud]).features.energy).toBeGreaterThan(baseline.features.energy);
    expect(buildMoodProfile(base, [loud]).sources.find(source => source.kind === 'savedMusic').weight).toBeCloseTo(.2);
  });
  it('preserves mixed quiet/restless intent instead of averaging into neutral energy', () => {
    const mixed = buildMoodProfile({ ...space(['Quiet', 'Restless']), title: 'Midnight Thoughts' });
    expect(mixed.features.energy).toBeLessThan(.35);
    expect(mixed.features.melancholy).toBeGreaterThan(.5);
    expect(mixed.interpretations[0]).toContain('Quiet + Restless');
    expect(mixed.sources.find(source => source.kind === 'words').matches).toContain('midnight');
    const queries = buildCandidateQueries(mixed);
    expect(queries[0].speed).toEqual(['verylow', 'low']);
    expect(new Set(queries.flatMap(query => query.tags)).size).toBeGreaterThan(3);
    const candidates = [track(1, ['ambient', 'relaxing', 'melancholic']), track(2, ['electronic', 'energetic', 'happy'], ['electronic'])];
    expect(rankCandidates(candidates, mixed)[0].track.id).toBe('jamendo:1');
  });
  it('uses saved tuning as exact feature targets and changes ranking and retrieval', () => {
    const low = buildMoodProfile({ ...space(['Quiet']), soundTuning: { energy: .05, intensity: .1 } });
    const high = buildMoodProfile({ ...space(['Quiet']), soundTuning: { energy: .95, intensity: .9 } });
    expect(high.features.energy).toBe(.95);
    expect(buildCandidateQueries(low)[0].speed).not.toEqual(buildCandidateQueries(high)[0].speed);
    const a = { ...track(1, ['ambient']), musicFeatures: { energy: .1 } };
    const b = { ...track(2, ['ambient']), musicFeatures: { energy: .9 } };
    expect(rankCandidates([a, b], low)[0].track.id).toBe(a.id);
    expect(rankCandidates([a, b], high)[0].track.id).toBe(b.id);
    expect(rankCandidates([a, b], high)[0].reasons.join(' ')).toContain('saved sound tuning');
  });
  it.each([
    ['energy', ['ambient'], ['ambient'], .1, .9],
    ['melancholy', ['ambient', 'happy'], ['ambient', 'sad']],
    ['warmth', ['ambient', 'sad'], ['ambient', 'acoustic']],
    ['intensity', ['ambient', 'relaxing'], ['ambient', 'energetic']],
    ['nostalgia', ['ambient', 'dream'], ['ambient', 'vintage']]
  ])('makes %s tuning affect ranking when that metadata is known', (dimension, lowTags, highTags, lowEnergy, highEnergy) => {
    const a = { ...track(1, lowTags), ...(lowEnergy === undefined ? {} : { musicFeatures: { energy: lowEnergy } }) };
    const b = { ...track(2, highTags), ...(highEnergy === undefined ? {} : { musicFeatures: { energy: highEnergy } }) };
    const direction = target => ({ ...buildMoodProfile(space(['Quiet'])),
      // Isolate this dimension's effect; tag/genre evidence is equal.
      tagWeights: { ambient: 1 },
      features: { energy: null, melancholy: null, warmth: null, intensity: null, nostalgia: null, [dimension]: target },
      tuning: { [dimension]: target }
    });
    expect(rankCandidates([a, b], direction(.05))[0].track.id).toBe(a.id);
    expect(rankCandidates([a, b], direction(.95))[0].track.id).toBe(b.id);
  });
  it('removes duplicates, unavailable tracks, unknown matches and dislikes', () => {
    const profile = buildMoodProfile(space(['Quiet']));
    const valid = track(1, ['relaxing']);
    const candidates = [valid, valid, { ...track(2, ['relaxing']), isPlayable: false }, track(3, ['relaxing']), track(4, ['unknown'], ['unknown']), { ...track(5, ['relaxing']), streamUrl: null }];
    const result = rankCandidates(candidates, profile, { dislikedIds: ['jamendo:3'] });
    expect(result.map(item => item.track.id)).toEqual(['jamendo:1']);
    expect(result[0].reasons[0]).toMatch(/ambient|relaxing/);
  });
  it('reduces repetition and sparse metadata confidence without inventing evidence', () => {
    const profile = buildMoodProfile(space(['Quiet']));
    const a = track(1, ['relaxing']);
    const b = track(2, ['relaxing']);
    const plain = rankCandidates([a, b], profile);
    expect(rankCandidates([a, b], profile, { likedIds: [b.id] })[0].track.id).toBe(b.id);
    const repeated = rankCandidates([a, b], profile, { savedIds: [a.id], previousIds: [a.id] });
    expect(repeated[0].track.id).toBe(b.id);
    expect(repeated.find(item => item.track.id === a.id).score).toBeCloseTo(Math.max(0, plain[0].score - 28));
    expect(trackSignals(track(3, ['unknown'], ['unknown'])).features.energy).toBeNull();
  });
  it('learns smoothed tag affinity and caps artist repetition deterministically', () => {
    const tracks = [track(1, ['relaxing']), track(2, ['ambient'])];
    const affinity = buildAffinities([{ trackId: tracks[0].id, reaction: 'like' }, { trackId: tracks[1].id, reaction: 'neutral' }], tracks);
    expect(affinity.relaxing).toBeCloseTo(1 / 9);
    expect(buildAffinities([{ trackId: tracks[0].id, reaction: 'neutral' }], tracks)).toEqual({});
    const profile = buildMoodProfile(space(['Quiet']));
    const candidates = [track(3, ['relaxing'], ['ambient'], 'Same artist'), track(2, ['relaxing'], ['ambient'], 'Same artist'), track(1, ['relaxing'], ['ambient'], 'Same artist')];
    expect(rankCandidates(candidates, profile).map(item => item.track.id)).toEqual(['jamendo:1', 'jamendo:2']);
    const scored = rankCandidates(tracks, profile, { affinities: affinity, likedIds: [tracks[0].id] });
    expect(scored.find(item => item.track.id === tracks[0].id).evidence.preference).toBeGreaterThan(.5);
  });
});
