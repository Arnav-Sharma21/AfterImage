import dotenv from 'dotenv';
import { createJamendoProvider } from '../src/providers/jamendo.js';
import { buildCandidateQueries, buildMoodProfile, trackSignals } from '../src/recommendation/profile.js';
import { rankCandidates } from '../src/recommendation/rank.js';

dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });
const provider = createJamendoProvider({ clientId: process.env.JAMENDO_CLIENT_ID });
try {
  // Explicit verification inputs; every returned track comes from the live API.
  for (const mood of ['Quiet', 'Warm', 'Intense', 'Quiet + Restless']) {
    const profile = buildMoodProfile({ title: mood === 'Quiet + Restless' ? 'Midnight Thoughts' : '', description: '', moods: mood.split(' + ') });
    const candidates = [];
    for (const query of buildCandidateQueries(profile)) candidates.push(...await provider.getCandidates({ ...query, signal: AbortSignal.timeout(10000) }));
    const ranked = rankCandidates(candidates, profile);
    console.log(JSON.stringify({ mood, features: profile.features, candidateCount: candidates.length, knownFeatureCounts: Object.fromEntries(Object.keys(profile.features).map(key => [key, candidates.filter(track => Number.isFinite(trackSignals(track).features[key])).length])), rankedCount: ranked.length, samples: ranked.slice(0, 3).map(item => ({ id: item.track.id, title: item.track.title, artist: item.track.artistName, tags: item.track.tags, genres: item.track.genres, score: item.score, reasons: item.reasons })) }));
    if (!ranked.length) process.exitCode = 1;
  }
} catch (error) {
  console.error(JSON.stringify({ verification: 'failed', code: error.code || error.name }));
  process.exitCode = 1;
}
