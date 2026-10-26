# AFTERIMAGE — MVP product brief

## One-line product pitch
A music-first personal space where your photos, quotes, and moods become listening experiences.

## Users and problem
People often collect atmosphere and memories in images and words, but traditional music apps don't connect those personal fragments to discovery. AFTERIMAGE lets users build a visual moodspace and discover legally playable music around it.

## Core experience
Discover -> Compose a Moodspace -> Generate a music selection -> Listen -> Save or reject songs -> Return to saved space.

## Five workflows for end-term MVP
1. **Account and saved library:** Users can authenticate and retrieve only their own moodspaces and saved tracks. If implementation speed is threatened, discuss the tradeoff with the user before changing scope.
2. **Moodspace editing:** Create/rename/edit/delete personal spaces; add a description, quotes, images (or image URLs as an initial implementation), and multiple predefined mood tags.
3. **Mood-aware music selection:** Derive a structured mood profile, query playable catalog tracks, rank results using explicit business logic, reject duplicates and disliked tracks, and persist results.
4. **Listen and react:** Play/seek/pause/next/previous, handle unavailable streams, save/favorite tracks, and support a queue.
5. **Immersive focus UI:** Discover, Compose, and Listen each have a distinct, intuitive layout with accessible navigation and polished empty/loading/error states.

## Product distinction
Visual inputs actually influence recommendation retrieval/ranking; the recommendation algorithm gives users intelligible reasons and learns modest preference signals (e.g., liked tracks or selected tags). A conventional playlist clone with only a moodboard side feature is not sufficient.

## Recommendation approach for MVP
Start with transparent rule-based tags/feature mapping and candidate ranking from an authorized music provider. Define normalized feature values and explicit weights, plus fallback if the provider is unavailable. Add machine-learning/image embeddings only after the core loop works.

## Audio constraints
Spotify Web Playback SDK is not a free generic full-track source and typically requires Premium and permitted app access. YouTube embeds cannot be treated as invisible background audio. Avoid scraping or proxying copyrighted recordings. Evaluate Jamendo or properly licensed demo audio; report actual API/playback and license conditions before building deeply around it.

## Out of scope
Universal hummed melody search; record-to-record Shazam identification; synchronized copyrighted lyrics; real-time collaborative spaces; complex animated shaders; payments.

## Required artifacts
Source code + meaningful Git history, deployed app, accessible repo, README/setup instructions/env var documentation, short demo, tests and error-state verification, submission form.

## Demo story
Sign in -> create a moody board -> add image/quote/mood -> generate matching tracks -> play music -> save track -> revisit to see persisted changes.
