# Milestone 3 — mood-to-music intelligence

Follow-up: [Milestone 3.1](MILESTONE_3_1.md) supersedes the UX, empty-refresh behavior, and algorithm changes documented there. This file records the original milestone.

Implemented locally on October 26, 2026. This milestone adds deterministic recommendations and private preference feedback to the existing authentication, moodspace, Jamendo search, playback, and saved-track workflows. No AI service, pixel analysis, paid integration, commit, push, or deployment is involved.

## Implemented experience

- Open a saved moodspace or Compose editor and choose **Find my sound**. Discover exposes the same workflow through **Find my sound** next to each personal space.
- Generate up to 12 ranked, playable Jamendo candidates with actual metadata, artwork, artist/source/license attribution, and evidence-based explanations.
- Inspect **Your music direction** to see estimated energy, melancholy, warmth, intensity, nostalgia, and the inputs that contributed.
- Add optional text fragments in Compose: personal thoughts, quotes, or manually written image captions. Save them before generating. Caption words contribute; raw image files/URLs/pixels do not.
- Play or queue a recommendation through the existing single audio element. Save it directly to the current space and revisit it in Saved music.
- Like or dislike recommendations. Feedback persists and influences future rankings across the same user's spaces. A dislike immediately hides the recommendation and excludes its exact ID in future generations. Undo the latest dislike in the panel; toggle a like back to neutral.
- Refresh the selection. The engine changes its candidate window and penalizes tracks shown in the previous selection, while keeping deterministic scoring.
- Handle unsaved edits, stale selections, failed/partial queries, empty matches, unavailable streams, and missing credentials without fabricated fallback results.

## Architecture

| Layer | Responsibility |
| --- | --- |
| `server/src/recommendation/vocabulary.js` | Versioned mood vectors, text vocabulary, canonical tag aliases, metadata-to-feature rules |
| `recommendation/profile.js` | Pure text extraction, profile construction, track feature interpretation, candidate query planning |
| `recommendation/rank.js` | Pure smoothed preference affinity, eligibility/deduplication, scoring, explanations, artist diversity |
| `services/recommendationService.js` | Owned data loading, real provider retrieval, metadata persistence, revision-safe snapshots |
| `services/feedbackService.js` | Authenticated feedback membership checks and idempotent per-user/track reactions |
| `providers/jamendo.js` | Provider-specific fuzzy-tag/speed parameters and normalized metadata; unchanged direct-audio boundary |
| `controllers/recommendationController.js` | HTTP translation only; no scoring rules |
| `models/UserFeedback.js` | One current reaction per user/track, protected by a unique compound index |
| `features/recommendations/RecommendationPanel.jsx` | Shared UI for generation, profile inspection, playback/save actions, and feedback |

**Generation flow:** request → session/CSRF and strict validation → owned-space service → saved music/recent feedback/profile extraction → bounded Jamendo candidate requests → pure ranker → canonical `Track` metadata and a conditional `Moodspace.recommendation` write → owned ranked response.

**Feedback flow:** request → authenticated owner and validated reaction → verify track belongs to the space's selection/saved music or this user's existing feedback → one `UserFeedback` upsert → user's preference revision increment → response. Rankings are recomputed from distinct reaction records, not incrementing like counters.

**Read flow:** owned-space lookup → current track metadata and this user's reactions → exclude current dislikes → return the stored ranking, profile, and stale indicator. No other user's private space/profile/reactions are queried.

### Persistence and concurrency

`Moodspace.fragments` stores at most 10 `{id, type, text}` fragments, each up to 1,000 characters. Existing spaces default to an empty list. Partial edits preserve omitted fragments.

`Moodspace.recommendation` stores one bounded latest snapshot: algorithm version, generation counter, source space revision, preference revision, profile, warnings, timestamp, and up to 12 track references with scores/reasons/evidence. The snapshot does not contain audio bytes or stream URLs. Individual selected tracks use the existing Saved music workflow; generated music does not silently become saved music.

Generation matches the original space revision and previous generation counter when writing. An intervening edit, saved-track mutation, deletion, or newer generation prevents an old result from replacing current state and returns 409. Failed provider requests preserve the previous snapshot. A successful but empty catalog result is stored as an honest empty selection, without deleting saved music.

Feedback is global only within its owner's account. Recent 200 non-neutral reactions contribute tag affinity and the recent-like profile source. Exact candidate dislikes and saved-track dislikes are checked separately, so older dislikes are still excluded even outside that learning window. Reads filter current dislikes immediately. A preference change marks older snapshots stale; refreshing rebuilds their profile/ranking. A preference change during a request may leave an older preference snapshot, which is marked stale on read and still filters current dislikes.

Existing `Track` records gain optional `musicFeatures` metadata and old records fall back to tag-derived estimates. `User` gains a preference revision; old users default to zero. Backend startup creates the new collection/index. No destructive migration is required.

## Deterministic mood interpretation

### Sources and weights

| Source group | Base weight | Rule |
| --- | --- | --- |
| Explicit mood tags | .60 | Equal contribution from distinct selected moods |
| Recognized words | .20 | Title, description, quotes, notes and manual image captions; terms deduplicated across documents |
| Music saved to this space | .15 | Recognized catalog tags/features of saved tracks, excluding this user's dislikes |
| Recent likes | .05 | Recognized metadata of liked tracks in the recent feedback window |

Absent groups are omitted and remaining weights normalize to one. With mood tags and words only, their shares are .75 and .25. Sources are averaged within a group, so adding many saved songs or fragments cannot exceed that group's budget. Each feature averages only known values; missing metadata is never treated as evidence of a zero feature.

Text is normalized with NFKC/lowercase, split into punctuation-delimited clauses, and matched using a documented English word dictionary. Immediate negators (`not`, `no`, `without`, `never`) suppress a match within the preceding two words in the same clause. At most 20 distinct matched words contribute across all text documents. Repeated words/fragments do not accumulate extra weight. Unknown words/languages are neutral.

This is a limited lexicon, not general sentiment or emotional understanding. For example, `memories` activates the Nostalgic vector, `rainy` the Melancholic vector, and `warm` the Warm vector. A caption “warm memories by a rainy window” supplies those explicit text signals. The engine never reads an image URL, filename, or pixels to infer mood.

### Editorial mood vectors

All dimensions are estimates in `[0,1]`; these values are product rules, not measured human emotions.

| Mood | Main retrieval tags | Energy | Melancholy | Warmth | Intensity | Nostalgia |
| --- | --- | --- | --- | --- | --- | --- |
| Quiet | ambient, relaxing, chillout | .15 | .35 | .50 | .10 | .40 |
| Restless | energetic, electronic, rock | .85 | .40 | .25 | .80 | .20 |
| Melancholic | sad, melancholic, piano | .25 | .95 | .30 | .30 | .70 |
| Warm | acoustic, folk, soul | .40 | .20 | .95 | .25 | .60 |
| Dreamlike | ambient, dream, soundtrack | .25 | .40 | .50 | .20 | .65 |
| Focused | instrumental, chillout, ambient | .30 | .20 | .45 | .20 | .30 |
| Intense | rock, metal, energetic | .95 | .45 | .20 | .95 | .20 |
| Uplifting | happy, pop, dance | .80 | .05 | .80 | .65 | .25 |
| Nostalgic (text-derived) | nostalgic, vintage, jazz | .35 | .60 | .70 | .25 | .95 |

Canonical aliases handle catalog variants such as `chill`→`chillout` and `dreamy`→`dream`. Some mappings, such as `newage`→`ambient`, are editorial grouping decisions and are documented in the vocabulary file. Explanations identify **normalized** catalog tags rather than claiming the raw provider label was identical.

Track features come from the explicit `TAG_FEATURES` map and optional Jamendo metadata. Jamendo speed values map to energy `.1/.3/.5/.7/.9` for verylow/low/medium/high/veryhigh; a known speed overrides tag-derived energy. This is a categorical estimate, not BPM analysis. Unknown feature values remain null. Instruments are not assumed to imply all emotions: piano, for example, supplies energy/warmth/intensity estimates but no automatic sadness.

No private title, description, fragment, quote, or full caption is sent to Jamendo. Only mapped catalog tags/speed filters go to the provider.

## Candidate retrieval and fallbacks

1. Build the weighted tag/genre profile and select its top three retrieval tags.
2. Request real candidates using Jamendo fuzzy tags (OR semantics), provider relevance order, and optional low/high speed bands derived from energy.
3. Make a second bounded query with speed relaxed. If there was no speed restriction, use a different nearby candidate window instead.
4. Each query returns at most 40 tracks. A generation sees at most 80 raw candidates, then deduplicates by provider/track ID.
5. Candidate windows rotate through offsets 0, 40, 80 based on the generation counter. This is deterministic retrieval variation, not random scoring.
6. Filter ineligible streams/licenses, exact dislikes, and tracks with no positive normalized tag/genre overlap. No metadata match means no claimed mood match.

The provider adapter gives each candidate request at most five seconds inside a shared ten-second generation signal. The existing bounded retry can make at most two HTTP attempts per query within that deadline. Invalid credentials/rate limits fail explicitly; one successful query can produce an honestly labeled partial selection if the other fails. There is no generic trending/fake/alternate-provider fallback. If no eligible evidence-backed tracks remain, return fewer or zero tracks with guidance to edit the space.

Generation is limited to five calls per minute per user. The UI allows 20 seconds for generation to accommodate database work around the bounded provider calls; ordinary API calls retain their existing timeout.

Jamendo's [official tracks documentation](https://developer.jamendo.com/v3.0/tracks) specifies fuzzy tags, categorical speed, music metadata, and support for both singles and album tracks. Exact lookups explicitly include both track types. The existing license/attribution/direct-stream policy from Milestone 2 remains in force.

## Ranking formula

For an eligible candidate define:

- `M`: sum of the profile tag weights matched by its distinct normalized catalog tags/genres.
- For each known feature `d`, `s_d = 1 - abs(profile_d - track_d)`.
- Dimension weights `w_d`: energy .35, melancholy .20, warmth .15, intensity .20, nostalgia .10.
- `K`: sum of dimension weights with known profile and track values; `F = sum(w_d * s_d)` over those dimensions. Unknown dimensions contribute neither evidence nor coverage.
- `G`: sum of matching target genre weights, used only when both profile and candidate have genre information. Let `I_G` be 1 when that component is available, otherwise 0.
- `A`: mean affinity of the candidate's known catalog tags. Each tag affinity is `(likes - dislikes) / (likes + dislikes + 4)` from distinct current reaction records.
- `P = min(1, .5 + .5*A + .1*exactLike)`. Cold-start preference is .5. Disliked exact tracks have already been removed.

```text
coverage C = .45 + .20*K + .20*I_G + .15
numerator N = .45*M + .20*F + .20*I_G*G + .15*P
score = max(0, 100 * (N/C) * (.75 + .25*C)
               - 18*alreadySavedHere - 10*shownInPreviousSelection)
```

Thus mood-tag relevance has .45 weight, feature compatibility up to .20, genre compatibility .20, and user preference .15. Renormalization uses only available evidence, then the coverage factor reduces confidence for sparse metadata. Scores are internal ranking values and are not displayed as scientific match percentages.

Finally sort by score descending and stable canonical track ID for ties. Select at most two tracks per normalized artist name and at most 12 in total. Unknown artist names share the same cap. The engine can return fewer tracks rather than padding the list.

Explanations cite the strongest matched normalized tag and a real profile source (explicit mood, matched word, saved music, or recent likes). A second reason can describe close **estimated** energy or positive feedback affinity. Saved/repeated items disclose their penalties. The explanation never invents pixels, BPM, genre, artist intent, or a provider feature that was absent.

This formula extends the initial plan's simple tag/energy sketch to the user's explicit Milestone 3 requirements for genre compatibility, five interpretable dimensions, saved-song signals, and repetition penalties. No external machine learning is implied.

## Feedback and saving

One MongoDB feedback row exists per `(userId, trackId)`, with reaction `like`, `dislike`, or `neutral`. Repeated requests do not amplify preference weights. A lightweight preference revision invalidates snapshots; repeated writes can increment that revision but never create multiple votes. Global exact dislike exclusion is independent of the bounded recent-affinity window.

Feedback is not shared across accounts. It affects recommendations, not literal music-search results or already queued audio. Removing a saved track does not erase an explicit preference. Disliking a track does not silently remove a user's existing saved music.

Saving a just-generated recommendation can reuse its server-verified metadata for five minutes, without extending the original verification timestamp. This prevents a transient second provider lookup from blocking a reference save after generation/playback succeeded. Other saves use normal provider verification. Playback always resolves a fresh stream and can still report later unavailability. No stream URL is persisted by this cache.

## API

| Endpoint | Behavior |
| --- | --- |
| `GET /api/spaces/:id/recommendations` | Owned snapshot, current reactions/dislike filtering, stale status |
| `POST /api/spaces/:id/recommendations` with `{revision}` | Derive profile, retrieve/rank real candidates, persist conditionally |
| `PUT /api/spaces/:id/recommendations/:provider/:trackId/feedback` with `{reaction}` | Owned, membership-checked preference upsert |

Existing space CRUD, saved-track endpoints, search, playback, and session contracts remain available. Clients cannot post a fabricated profile or trusted track metadata. All mutations retain CSRF/origin checks and strict schema validation. Ownership is checked before provider access.

## Tests and verification

Unit/database and live-provider verification are separate:

- **Unit fixtures:** synthetic tracks test profile sensitivity, text/caption inputs, source bounds, repetition/negation, missing metadata, saved-song/like influence, score changes, deterministic ties, artist diversity, duplicate/unavailable/dislike filtering, and feedback affinity.
- **HTTP/database:** real isolated MongoDB plus a synthetic provider contract tests snapshot/fragment persistence, stream-URL omission, feedback idempotence and undo, dislike exclusion across spaces, owner isolation, validation, empty/provider-failed results, missing credentials, stale-generation races, and saving recent verified recommendations during provider failure.
- **Live preflight:** `node server/scripts/verify-recommendations.js` calls actual Jamendo with Quiet, Warm, and Intense verification profiles. It returned 80 raw candidates and 12 ranked recommendations for each profile, with different leading tracks. These are verification observations, never production fixtures.
- **Live browser journey:** the opt-in recommendation scenario creates a real test account/space, writes a manual caption, generates real Jamendo recommendations, inspects explanations/profile, persists a like through reload, plays/saves a recommendation, dislikes it, refreshes and checks exclusion, and opens the workflow in Discover. The same run includes Milestone 1/2 regressions at desktop/mobile sizes.

Final verification results:

| Command/check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm test` | **38 passed** across 7 files, including existing regressions and deterministic provider fixtures |
| `npm run build` | Passed; approximately 116 KB gzip application JS and 6.1 KB gzip CSS |
| `RUN_LIVE_MUSIC_TESTS=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` | **8 passed**: account/space resilience, live music, and live recommendations at desktop and mobile widths |
| `node server/scripts/verify-recommendations.js` | Real Quiet/Warm/Intense retrieval: 80 raw candidates and 12 ranked results per profile, different leading selections |
| Captured UI / design detector | Desktop/mobile recommendation panel inspected; no deterministic detector findings |
| Frontend credential check | Configured Jamendo client ID absent from built JS/CSS |

The first browser pass exposed upstream empty exact-ID lookups; the subsequent complete pass succeeded after explicit both-track-type lookup and recent recommendation-save handling. This does not guarantee future provider uptime. Skipped live cases are not counted as live passes. Tests use disposable MongoDB databases and do not write test accounts into the configured application/Atlas database. Source/CSS and privacy documentation use the existing design system.

## Manual verification

1. Run `npm run dev`; open `http://127.0.0.1:5173` with the existing backend/MongoDB/Jamendo configuration. No new credentials are required.
2. Create two spaces: Quiet with calm/rain/night words, and Intense with storm/energetic words. Save each.
3. Optionally add a quote, personal thought, or image-caption fragment in Compose. Save; refresh the page to check persistence.
4. Choose Find my sound. Inspect Your music direction and the explanation below each recommendation. Compare the two spaces' profiles, retrieval direction, and results.
5. Play and queue recommendations. Navigate to Listen/Compose and confirm the single audio element continues working.
6. Save one recommendation to its space. Open the space and refresh; confirm it appears in Saved music.
7. Like a recommendation, refresh the page to see Liked, then Refresh my sound to rebuild ranking. Dislike a recommendation; confirm it disappears and remains excluded after generation and in another space. Try Undo dislike.
8. In Discover, choose Find my sound beside an owned space. Confirm the same stored profile and current reactions appear.
9. Edit while an older tab exists; old revisions should produce a conflict, not overwrite newer data. Unsaved Compose edits disable generation/selection mutations until saved.
10. To exercise failures, temporarily remove the backend Jamendo key in a separate test environment, or block provider requests. Confirm clear errors and preservation of the prior snapshot/saved songs. Do not overwrite the working local environment file for this check.

```bash
npm run lint
npm test
npm run build
RUN_LIVE_MUSIC_TESTS=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
# Optional live metadata-only comparison; run separately from browser checks:
node server/scripts/verify-recommendations.js
```

## Known limitations

- English dictionary rules are limited and culturally subjective. Sarcasm, complex negation, nuanced phrases, and unknown languages are not understood. Image pixels are never analyzed.
- Metadata-derived musical/emotional features are editorial estimates, not audio measurements. Catalog tags can be incomplete or wrong. Track availability can change after generation; Play re-resolves it.
- Recent learning uses 200 reactions; repetition memory uses only the latest selection. Suitable tracks may reappear after multiple refreshes or in a small catalog, while exact dislikes remain excluded.
- Personalization uses this user's explicit feedback and saved songs, not cross-user collaborative filtering. There is no general preferences-management page; the panel provides like toggling and the latest dislike undo, with neutral feedback also supported by the authenticated API.
- Jamendo sometimes returns empty exact-ID responses for previously playable tracks. Bounded retries, both-type lookups, recent metadata saves, and honest errors mitigate this; they do not guarantee provider uptime.
- No image uploads/freeform canvas, paid AI, humming recognition, synchronized lyrics, or final frontend redesign is included.
- Chromium desktop/mobile viewport verification does not replace human listening, screen-reader checks, real Safari/iOS/Firefox devices, production HTTPS/media-CSP verification, or Atlas/hosting verification. No deployment is claimed.
