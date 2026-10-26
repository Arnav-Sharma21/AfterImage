# Milestone 3.1 — recommendation UX and quality

Implemented locally on October 26–27, 2026. No commit, deployment, new dependency, provider change, or paid integration. This document supersedes the recommendation UX, empty-refresh behavior, and algorithm details changed below from Milestone 3.

## Delivered changes

- Listen offers **Save to Space**, using the existing authenticated track-save API. Playback from recommendations or Saved music carries its originating space; the save dialog defaults to that owned space even if it is outside the first page of the library. Search-origin playback lets the user choose a space. The dialog supports paginated libraries, errors, and success feedback. Listen immediately displays the confirmed saved state and permits choosing another space.
- Fresh successful playback lookups cache only server-verified metadata for five minutes, extending the existing recommendation-save policy to search-origin Listen saves. A save does not extend verification time; expired metadata requires provider verification again. This avoids a fragile redundant lookup immediately after playback.
- Duplicate writes remain idempotent through the existing atomic server-side save operation; concurrent saves cannot append the same canonical track ID twice. A duplicate save does not advance the space revision.
- Like is a separate action for space-origin playback, through the existing owner/membership-checked feedback endpoint. Search-only tracks have no recommendation membership, so they do not acquire a fabricated Like action. Queue navigation remains separate; the current track is already queued, and **View queue** opens its controls.
- Listen has **Back to originating space**. Source context travels with each queue entry, survives fresh playback-metadata lookup, follows queue navigation, and restores paused after tab refresh. It is cleared with the existing user-scoped player session on sign-out.
- Discover contains real search and links to owned spaces, with no duplicated recommendation panel. **Find my sound** beside a space navigates to its detail page. Its detail page retains generation/results; Compose retains the same context-specific panel while editing that space.
- Compose adds optional, functional **Tune your sound** overrides for energy, melancholy, nostalgia, warmth, and intensity. Check a dimension, adjust it, save the space, and refresh its music. Unchecking restores automatic interpretation. These are persisted, validated targets, not cosmetic sliders.

## Recommendation sessions and navigation

MongoDB's existing `Moodspace.recommendation` remains the sole durable selection source. No second Zustand/localStorage recommendation cache was introduced. React holds only the currently rendered response; mounting reads the owned snapshot with GET, without requesting Jamendo or generating new music. The panel is keyed by account ID and space ID, so local results cannot carry over to another account or space. Existing session cleanup aborts outstanding API requests.

The panel aborts an older snapshot read when manual generation starts, preventing an older GET from replacing a newer POST result. Generation cleanup follows actual panel unmount, rather than every revision-effect cleanup. Existing results remain rendered throughout a manual refresh.

A failed refresh preserves the persisted selection. A successful provider response that ranks no eligible tracks also preserves an existing useful snapshot and returns an explicit “Keeping your previous selection” warning; a first empty generation remains an honest empty selection. Current dislikes are still removed when reading that old snapshot. The empty-refresh warning belongs to that response, not a new successful generation timestamp; revisiting restores the previous successful snapshot.

Space revision, preference revision, or algorithm-version mismatch marks a selection stale. It stays visible with a refresh instruction; it is not silently regenerated. Editing/tuning/saving tracks therefore does not spend provider calls on navigation. An identical repeated reaction now returns without advancing preference revision. Actual changed feedback invalidates ranking as before. Existing conditional revision/generation checks protect successful snapshot writes from concurrent edits/generations.

Only metadata, reference IDs, profile, explanations, and ranking evidence persist. No recommendation or queue storage persists stream URLs. Every Play resolves a fresh authorized URL through the existing player service; saved metadata is never a guarantee that a recording is still available.

## Audit and algorithm changes

The code audit identified two concrete weaknesses in `mood-rules-1`:

1. Quiet `[.15,.35,.50,.10,.40]` and Restless `[.85,.40,.25,.80,.20]` were averaged into energy `.50`, melancholy `.375`, warmth `.375`, intensity `.45`, nostalgia `.30` before other signals. “Midnight” was not a matched word. The intended mixed atmosphere therefore produced mostly moderate estimates.
2. Retrieval took only three highest-weight tags, breaking equal weights alphabetically. Explicitly selected mood evidence could be omitted simply because its catalog tags sorted later. Both requests largely explored those same tags.

A read-only audit of the configured database found no title exactly matching “Midnight Thoughts”; no private space was edited. The reported title/tag combination was reproduced as an explicit verification input, not represented as a fetched user record.

### Version `mood-rules-2`

- **Documented conjunction:** Quiet + Restless is interpreted as a quiet setting with internal tension. These two explicit signals become one combined signal with features energy `.28`, melancholy `.65`, warmth `.30`, intensity `.50`, nostalgia `.60`; tags `ambient, melancholic, electronic, relaxing, chillout, soundtrack`; genres `ambient, electronic, soundtrack`. Other selected moods still contribute. This is an editorial product rule, not inferred psychological truth. The profile explains this interpretation and invites tuning if it differs from the user's intent. It does not change Restless on its own or claim to resolve every possible conflicting mood combination.
- **Text coverage:** `midnight` and `nocturnal` join the Dreamlike lexicon. Deduplication, bounded text weights, and simple negation are preserved. For title “Midnight Thoughts” with Quiet + Restless and no other signals, the resulting vector is energy `.2725`, melancholy `.5875`, warmth `.35`, intensity `.425`, nostalgia `.6125`.
- **Retrieval coverage:** take up to six weighted catalog tags, retaining semantic insertion order for ties. Query the first three with the energy speed band; query the next three with speed relaxed. If fewer tags exist, reuse them with relaxed speed/a different window. Still at most two 40-track requests and the existing bounded provider deadline. No private free text is sent to Jamendo.
- **Persisted tuning:** each supplied dimension in `soundTuning` is an exact final profile target in `[0,1]`; omitted dimensions retain inferred estimates. Energy also changes provider speed bands. Every dimension changes scoring when candidate evidence for it exists. Tuning does not invent absent track features or guarantee that the catalog contains the requested atmosphere.
- **Contradiction penalty:** known dimensions that strongly disagree with the target reduce ranking, with stronger respect for a manually tuned target. Missing dimensions receive no mismatch penalty.
- **Conservative feedback:** tag affinity changes from `(likes-dislikes)/(likes+dislikes+4)` to `(likes-dislikes)/(likes+dislikes+8)`. A single like therefore contributes `1/9` rather than `1/5` tag affinity. Likes remain a small profile source; exact dislikes remain excluded across the account. Artist cap, canonical ID deduplication, saved-track penalty, and previous-selection penalty remain intact.
- **Truthful explanations:** retain matched normalized catalog tag and actual input source; disclose mismatch penalties and saved tuning when used. Do not imply audio analysis, pixel analysis, BPM measurement, or scientific match percentages.

### Formula

Source-group base weights remain moods `.60`, matched words `.20`, space's saved music `.15`, recent likes `.05`, normalized over groups present. Source groups average distinct signals, so repeated text/likes do not create unlimited influence. Optional tuning applies after that average.

The existing Milestone 3 components remain: `M` matched target tag-weight sum; `F = sum(w_d * (1 - abs(track_d-target_d)))` over known dimensions; `K` their weight sum; `G` genre overlap; `I_G` whether both sides have genre evidence. Dimension weights are energy `.35`, melancholy `.20`, warmth `.15`, intensity `.20`, nostalgia `.10`.

```text
A = mean smoothed tag affinity of candidate tags
P = min(1, .5 + .5*A + .1*exactLike)
C = .45 + .20*K + .20*I_G + .15
N = .45*M + .20*F + .20*I_G*G + .15*P
D = sum over known dimensions:
      w_d * max(0, abs(track_d-target_d) - .35)
          * (2 if this dimension was manually tuned, otherwise 1)
score = max(0, 100*(N/C)*(.75+.25*C)
               - 18*savedHere - 10*shownLastTime - 40*D)
```

Unknown features contribute neither agreement nor contradiction. Eligibility still requires a real stream/license and some matching normalized catalog evidence. Scores sort deterministically, at most two tracks per artist and twelve overall. Refreshes rotate candidate windows; they can repeat suitable music in a small catalog.

## Backend flow and compatibility

**Save:** request → existing session/CSRF/validation → controller → `spaceTrackService` checks ownership and canonical provider metadata → atomic unique bounded reference update in MongoDB → success → Listen saved feedback. No client-supplied title, owner, or audio URL is trusted.

**Tuning:** POST/PATCH space request → existing authentication/strict schema validation → space controller/service → owner-and-revision-scoped Mongoose write → serialized `soundTuning` → Compose saved state. Generation reads those stored targets in the pure profile/ranking modules. Unauthorized tuning gets 404; out-of-range/unknown keys get 422. Existing spaces default to `{}`; no destructive migration is needed. Partial edits preserve omitted tuning; `{}` explicitly clears overrides.

**Generation/read/feedback:** retain the Milestone 3 routes/controllers/services/models. Only profile/retrieval/ranking rules, stale-version detection, repeated-feedback invalidation, and empty-refresh preservation change. Authentication, literal search, provider adapter, single-origin deployment, and audio lifecycle are preserved.

## Verification

- `npm run lint`: passed.
- `npm test`: **49 passed**, seven files. Database tests run against a genuine isolated MongoDB 7.0.24 process, not mocked Mongoose. Test provider data/media events are explicitly synthetic contract/unit fixtures, not live provider verification.
- `npm run build`: passed; approximately 117.1 KB JS gzip and 6.2 KB CSS gzip.
- `RUN_LIVE_MUSIC_TESTS=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: latest complete run **7 passed, 1 failed**. Both desktop/mobile recommendation scenarios, all auth/CRUD scenarios, and mobile music passed. Desktop queue navigation stopped on a real Jamendo exact-track lookup returning empty (404), not a browser crash. Targeted rerun `... npm run test:e2e -- --project=desktop tests/e2e/music.spec.js`: **1 passed**. Thus all eight scenarios passed on the final code across the full run and targeted retry; the live suite remains externally flaky and is not reported as an uninterrupted 8/8 green run.
- Earlier runs also exposed and corrected an ambiguous navigation test locator and the redundant provider lookup during search-origin Listen saves. Other real empty-ID responses occurred on mobile; the recommendation browser scenario allows one actual user retry and still requires real audio progress.
- Sandbox MongoDB port binding initially failed with EPERM; database/browser checks were rerun successfully with permission outside the sandbox. No app database was used for test writes.
- `node server/scripts/verify-recommendations.js`: passed live Jamendo verification for Quiet, Warm, Intense, and Quiet + Restless. Each returned 80 raw candidates and 12 ranked tracks with distinct evidence. The mixed profile's highest-ranked result was real track `jamendo:1591141`, “A song about the forest” by Doppelganger, with actual `sad`/`dark` catalog tags. This verifies retrieval/evidence, not a human listening judgement.

The live probe also counted known **rule-derived** dimensions, including provider speed/tag/genre estimates. In the mixed profile's 80 raw candidates, energy/intensity were available for 80, melancholy for 17, warmth for 20, nostalgia for 8. Those counts include duplicate raw candidates and are not a claim that Jamendo supplies measured emotional features.

Regression coverage includes mixed intent and distinct rankings, tuning-driven ranking/query changes, metadata mismatch handling, exact dislikes/affinity, duplicate/unavailable filtering, owner-scoped snapshots and writes, snapshot reads with zero additional provider calls, empty/failed refresh preservation, preference persistence/idempotence, tuning validation/revisions, URL-free user-scoped queue restoration and source retention through fresh playback responses. Existing auth/search/save/queue/media-error tests continue to run.

Browser scenarios use real registration, isolated database persistence, Jamendo metadata and actual HTML audio progress. They cover Listen saves from search and a recommendation, source defaults, duplicate save idempotence, refresh/route return with identical selection/timestamp and no generation calls, no Discover list duplication, tuning input/save, feedback persistence/exclusion, and preservation of results while a manually delayed outgoing refresh awaits continuation. The delay does not fabricate its response. A bounded real user retry handles an intermittent empty exact-track lookup; playback assertions still require actual audio progress.

## Manual verification

Use the existing local configuration; no new credential or env variable is required. Backend still requires `MONGODB_URI`, `SESSION_SECRET`, `APP_ORIGIN`, and backend-only `JAMENDO_CLIENT_ID` as documented in Milestones 1–2.

```bash
npm run dev
npm run lint
npm test
npm run build
RUN_LIVE_MUSIC_TESTS=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
node server/scripts/verify-recommendations.js
```

1. Open Discover. Search and play music, then open Listen. Save to a chosen personal space; confirm success and revisit that space's saved music. Save it again and confirm only one entry exists. Try an account with no spaces and check the guidance.
2. Open a space through Discover's Find my sound link. Generate music, inspect direction/explanations, play a recommendation, then open Listen. Confirm the return link and default save destination belong to that space. Toggle Like separately from saving; check that the preference survives reload.
3. Return to the originating space, and refresh the browser. Confirm the same successful ordered selection remains. Navigation should only GET the snapshot; only pressing Find/Refresh should POST generation. Test a second space and a second account; neither should inherit that selection or queue.
4. Refresh manually and confirm the existing list remains while loading. Simulate a provider failure or empty response in an isolated test environment; confirm prior results remain with appropriate feedback, without fabricated new tracks.
5. Compose a space named Midnight Thoughts with Quiet and Restless. Inspect the disclosed conjunction rule and restrained energy after generation. Compare Quiet-only, Warm, and Intense. These rules should affect candidate queries and ranking, not promise subjective perfection.
6. In Compose enable each desired tuning dimension. Save, reload to check persistence, then refresh music. Compare low/high energy and inspect provider filters/evidence; uncheck overrides and save to return to automatic interpretation. Add text/captions and verify unsaved changes disable mutations.
7. Like/dislike, return from Listen, and refresh. Check like persistence and exact dislike exclusion. Try changing another account's space ID in save/tuning/feedback requests; expect 404, with no change to the owner's data.

## Remaining limitations

- Everything remains deterministic, English lexicon/editorial metadata based. The conjunction is deliberately narrow; other conflicting combinations can still average to moderate values. Tune controls provide an explicit override rather than pretending to understand all emotional nuance.
- Missing emotional metadata limits relevance and the effect of a tuning dimension. No embeddings, image pixels, audio analysis, general AI inference, or new provider was added. Human judgement of recommendation quality is still required.
- Jamendo can return empty exact-ID responses for tracks it just listed. This was observed during live mobile testing and produces a recoverable unavailable-track error. Fresh lookups, bounded retries, and existing metadata-only saves mitigate it; no recording is guaranteed playable forever.
- Only the last successful selection is retained, not a full history. A stale selection remains labeled until explicit refresh. Empty-refresh warnings are transient response feedback; selection metadata/timestamp remain durable.
- Origin is retained per unique queued track; a new explicit play from another space updates that origin. User queue storage remains per browser tab, not cross-device. An origin that was deleted will correctly fail its owned-resource lookup; Listen still offers Discover and other owned save destinations.
- Listen's confirmed saved indication is local to the current track view or reloaded from the origin. It is not a real-time subscription to changes made in other tabs/spaces. Saving remains idempotent server-side.
- Chromium desktop/mobile viewport automation does not replace human listening, screen-reader validation, Safari/iOS/Firefox devices, or production HTTPS testing. No production deployment is claimed.
