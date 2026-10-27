import { ALGORITHM_VERSION, canonicalTag, DIMENSIONS, GENRES, MOOD_RULES, RETRIEVAL_TAGS, TAG_FEATURES, TEXT_RULES } from './vocabulary.js';

export function trackSignals(track) {
  const tags = [...new Set([...(track.tags || []), ...(track.genres || [])].map(canonicalTag))];
  const features = {};
  for (const key of DIMENSIONS) {
    const values = tags.map(tag => TAG_FEATURES[tag]?.[key]).filter(Number.isFinite);
    features[key] = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }
  if (Number.isFinite(track.musicFeatures?.energy)) features.energy = track.musicFeatures.energy;
  return { tags, genres: [...new Set((track.genres || []).map(canonicalTag))], features };
}

function normalized(weights) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  return total ? Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, value / total])) : {};
}

export function textSignals(value) {
  const matches = new Map();
  const clauses = String(value || '').normalize('NFKC').toLowerCase().split(/[.!?;,\n]+/);
  for (const clause of clauses) {
    const words = clause.match(/[a-z]+/g) || [];
    for (let index = 0; index < words.length; index++) {
      const word = words[index];
      const rule = TEXT_RULES.get(word);
      if (!rule || words.slice(Math.max(0, index - 2), index).some(previous => ['not', 'no', 'without', 'never'].includes(previous))) continue;
      matches.set(word, rule);
      if (matches.size >= 20) return [...matches].map(([word, name]) => ({ word, name }));
    }
  }
  return [...matches].map(([word, name]) => ({ word, name }));
}

export function buildMoodProfile(space, savedTracks = [], likedTracks = []) {
  const explicit = [...new Set(space.moods || [])].filter(name => MOOD_RULES[name]).map(name => ({ ...MOOD_RULES[name], source: `mood “${name}”`, label: name }));
  const interpretations = [];
  if (space.moods?.includes('Quiet') && space.moods?.includes('Restless')) {
    // An editorial conjunction rule: a quiet setting with internal tension,
    // rather than the neutral arithmetic midpoint of quiet and energetic rock.
    const combined = { tags: ['ambient', 'melancholic', 'electronic', 'relaxing', 'chillout', 'soundtrack'], genres: ['ambient', 'electronic', 'soundtrack'],
      features: { energy: .28, melancholy: .65, warmth: .3, intensity: .5, nostalgia: .6 }, source: 'mixed moods “Quiet + Restless”', label: 'Quiet + Restless' };
    explicit.splice(0, explicit.length, ...explicit.filter(signal => !['Quiet', 'Restless'].includes(signal.label)), combined);
    interpretations.push('Quiet + Restless is interpreted as restrained energy with internal tension, not energetic rock. Tune the dimensions if you mean something else.');
  }
  const documents = [
    { text: space.title, label: 'title' }, { text: space.description, label: 'description' },
    ...(space.fragments || []).map(fragment => ({ text: fragment.text, label: fragment.type === 'image-caption' ? 'image caption' : fragment.type })),
    ...(space.images || []).map(image => ({ text: image.caption, label: 'image caption' }))
  ];
  // A term repeated across fragments contributes only once to the text group.
  const seenWords = new Set();
  const words = [];
  for (const document of documents) {
    for (const match of textSignals(document.text)) {
      if (seenWords.has(match.word) || words.length >= 20) continue;
      seenWords.add(match.word);
      words.push({ ...MOOD_RULES[match.name], source: `${document.label} word “${match.word}”`, label: match.word });
    }
  }
  const fromTracks = (tracks, source) => tracks.map(track => {
    const signals = trackSignals(track);
    return { tags: signals.tags.filter(tag => RETRIEVAL_TAGS.has(tag)), genres: signals.genres.filter(tag => GENRES.has(tag)), features: signals.features, source, label: track.title };
  }).filter(signal => signal.tags.length);
  const groups = [
    { key: 'moods', weight: .6, signals: explicit },
    { key: 'words', weight: .2, signals: words },
    { key: 'savedMusic', weight: .15, signals: fromTracks(savedTracks, 'saved music') },
    { key: 'likes', weight: .05, signals: fromTracks(likedTracks, 'recent likes') }
  ].filter(group => group.signals.length);
  const sourceTotal = groups.reduce((sum, group) => sum + group.weight, 0);
  const tagWeights = {};
  const genreWeights = {};
  const featureTotals = Object.fromEntries(DIMENSIONS.map(key => [key, { sum: 0, weight: 0 }]));
  const tagSources = {};
  for (const group of groups) {
    const signalWeight = group.weight / (sourceTotal || 1) / group.signals.length;
    for (const signal of group.signals) {
      for (const tag of signal.tags) {
        tagWeights[tag] = (tagWeights[tag] || 0) + signalWeight / signal.tags.length;
        tagSources[tag] ||= [];
        if (!tagSources[tag].includes(signal.source)) tagSources[tag].push(signal.source);
      }
      for (const genre of signal.genres) genreWeights[genre] = (genreWeights[genre] || 0) + signalWeight / signal.genres.length;
      for (const key of DIMENSIONS) {
        if (!Number.isFinite(signal.features[key])) continue;
        featureTotals[key].sum += signal.features[key] * signalWeight;
        featureTotals[key].weight += signalWeight;
      }
    }
  }
  const features = Object.fromEntries(DIMENSIONS.map(key => [key, featureTotals[key].weight ? featureTotals[key].sum / featureTotals[key].weight : null]));
  const tuning = Object.fromEntries(DIMENSIONS.filter(key => Number.isFinite(space.soundTuning?.[key])).map(key => [key, space.soundTuning[key]]));
  Object.assign(features, tuning);
  return {
    interpretations, tuning,
    algorithmVersion: ALGORITHM_VERSION,
    features,
    tagWeights: normalized(tagWeights), genreWeights: normalized(genreWeights), tagSources,
    sources: groups.map(group => ({ kind: group.key, weight: group.weight / (sourceTotal || 1), matches: [...new Set(group.signals.map(signal => signal.label))].slice(0, 20) })),
    limitations: ['Rule-based English word matching and editorial metadata estimates.', 'Image captions are text inputs; raw image pixels are not analyzed.']
  };
}

export function buildCandidateQueries(profile, generation = 0) {
  const tags = Object.entries(profile.tagWeights).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag]) => tag);
  if (!tags.length) return [];
  const energy = profile.features.energy;
  const speed = energy !== null && energy < .35 ? ['verylow', 'low'] : energy !== null && energy > .7 ? ['high', 'veryhigh'] : [];
  const offset = generation % 3 * 40;
  return [{ tags: tags.slice(0, 3), speed, limit: 40, offset }, { tags: tags.length > 3 ? tags.slice(3, 6) : tags, speed: [], limit: 40, offset: speed.length || tags.length > 3 ? offset : (offset + 40) % 120 }];
}
