export const ALGORITHM_VERSION = 'mood-rules-2';
export const DIMENSIONS = ['energy', 'melancholy', 'warmth', 'intensity', 'nostalgia'];
export const DIMENSION_WEIGHTS = { energy: .35, melancholy: .2, warmth: .15, intensity: .2, nostalgia: .1 };

// Editorial estimates, not measured emotions or audio analysis.
const mood = (tags, genres, vector) => ({ tags, genres, features: Object.fromEntries(DIMENSIONS.map((key, i) => [key, vector[i]])) });
export const MOOD_RULES = {
  Quiet: mood(['ambient', 'relaxing', 'chillout'], ['ambient', 'classical'], [.15, .35, .5, .1, .4]),
  Restless: mood(['energetic', 'electronic', 'rock'], ['electronic', 'rock'], [.85, .4, .25, .8, .2]),
  Melancholic: mood(['sad', 'melancholic', 'piano'], ['ambient', 'classical'], [.25, .95, .3, .3, .7]),
  Warm: mood(['acoustic', 'folk', 'soul'], ['folk', 'soul', 'acoustic'], [.4, .2, .95, .25, .6]),
  Dreamlike: mood(['ambient', 'dream', 'soundtrack'], ['ambient', 'soundtrack'], [.25, .4, .5, .2, .65]),
  Focused: mood(['instrumental', 'chillout', 'ambient'], ['ambient', 'classical'], [.3, .2, .45, .2, .3]),
  Intense: mood(['rock', 'metal', 'energetic'], ['rock', 'metal', 'electronic'], [.95, .45, .2, .95, .2]),
  Uplifting: mood(['happy', 'pop', 'dance'], ['pop', 'dance'], [.8, .05, .8, .65, .25]),
  Nostalgic: mood(['nostalgic', 'vintage', 'jazz'], ['jazz', 'folk'], [.35, .6, .7, .25, .95])
};

const wordGroups = {
  Quiet: ['quiet', 'calm', 'calming', 'peaceful', 'relax', 'relaxing', 'stillness', 'serene', 'soft'],
  Restless: ['restless', 'restlessness', 'anxious', 'racing', 'agitated'],
  Melancholic: ['melancholic', 'melancholy', 'sad', 'sadness', 'lonely', 'loneliness', 'rain', 'rainy', 'grief', 'sorrow'],
  Warm: ['warm', 'warmth', 'cozy', 'cosy', 'sunshine', 'tender', 'acoustic', 'home'],
  Dreamlike: ['dream', 'dreams', 'dreamlike', 'dreamy', 'floating', 'haze', 'hazy', 'night', 'midnight', 'nocturnal', 'ethereal'],
  Focused: ['focus', 'focused', 'study', 'studying', 'reading', 'concentrate', 'concentration'],
  Intense: ['intense', 'intensity', 'angry', 'anger', 'fierce', 'powerful', 'storm', 'stormy', 'explosive'],
  Uplifting: ['uplifting', 'happy', 'happiness', 'joy', 'joyful', 'bright', 'celebrate', 'celebration', 'hope', 'hopeful'],
  Nostalgic: ['nostalgia', 'nostalgic', 'memory', 'memories', 'remember', 'childhood', 'vintage', 'yesterday']
};
export const TEXT_RULES = new Map(Object.entries(wordGroups).flatMap(([name, words]) => words.map(word => [word, name])));
const aliases = {
  chill: 'chillout', 'chill-out': 'chillout', lofi: 'chillout', 'lo-fi': 'chillout',
  relaxation: 'relaxing', calm: 'relaxing', dreamy: 'dream', dreams: 'dream',
  melancholy: 'melancholic', dark: 'melancholic', upbeat: 'happy', epic: 'energetic',
  'hip-hop': 'hiphop', 'new-age': 'ambient', newage: 'ambient', orchestral: 'classical',
  alternative: 'rock', downtempo: 'chillout', 'singer-songwriter': 'folk', rnb: 'soul'
};
export function canonicalTag(value) {
  const tag = String(value).normalize('NFKC').toLowerCase().trim();
  return aliases[tag] || tag;
}

export const GENRES = new Set(['ambient', 'classical', 'electronic', 'rock', 'metal', 'folk', 'soul', 'acoustic', 'soundtrack', 'pop', 'dance', 'jazz', 'blues', 'hiphop', 'reggae', 'world', 'country']);
export const TAG_FEATURES = {
  ambient: { energy: .2, intensity: .1 }, relaxing: { energy: .15, intensity: .1 },
  chillout: { energy: .3, intensity: .2 }, instrumental: { intensity: .25 },
  energetic: { energy: .9, intensity: .85 }, electronic: { energy: .7, intensity: .6 },
  rock: { energy: .8, intensity: .8 }, metal: { energy: .95, intensity: .95 },
  sad: { melancholy: .95, warmth: .25 }, melancholic: { melancholy: .9, nostalgia: .65 },
  piano: { energy: .3, warmth: .55, intensity: .2 }, acoustic: { energy: .4, warmth: .8 },
  guitar: { warmth: .65 }, folk: { warmth: .8, nostalgia: .65 }, soul: { warmth: .85, nostalgia: .5 },
  dream: { energy: .25, intensity: .2, nostalgia: .6 }, soundtrack: { nostalgia: .5 },
  happy: { melancholy: .05, warmth: .8, energy: .75 }, pop: { energy: .7, warmth: .65 },
  dance: { energy: .85, intensity: .7 }, nostalgic: { nostalgia: .95, melancholy: .6 },
  vintage: { nostalgia: .9, warmth: .7 }, jazz: { energy: .4, warmth: .75, nostalgia: .6 },
  classical: { energy: .35, intensity: .3 }, blues: { melancholy: .7, warmth: .6 },
  hiphop: { energy: .75, intensity: .7 }, reggae: { energy: .5, warmth: .8 },
  country: { warmth: .7, nostalgia: .65 }
};
export const RETRIEVAL_TAGS = new Set([...Object.keys(TAG_FEATURES), ...GENRES]);
