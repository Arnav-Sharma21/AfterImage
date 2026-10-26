# Milestone 2 — real music discovery and playback

Implemented and verified locally on October 26, 2026. The existing authentication and moodspace CRUD workflows remain intact. No commits, pushes, or deployments were performed.

## Delivered behavior

- Real Jamendo title/artist search with artwork, title, artist, album, duration, source/license links, paging, and useful empty/loading/error states.
- A provider-independent service and Jamendo v3 adapter. Missing credentials, invalid inputs, upstream errors, rate limits, missing licenses/streams, and timeouts are handled explicitly.
- One persistent app-level HTMLAudioElement controlled through Zustand and a single event/controller lifecycle. No route creates a competing audio instance.
- Actual play/pause/resume, seek, current time and duration, previous/next, volume/mute, loading/buffering, track-ended advance, retryable errors, and autoplay rejection handling.
- A queue of up to 50 distinct tracks with play, remove, and move-up/down actions. It survives route navigation, restores paused after a same-tab refresh, and clears on sign-out. Previous restarts after three seconds; otherwise it moves to the preceding item. At the queue end, playback stops.
- Save a real selected track to an existing owned moodspace, retrieve it after refresh, play/queue it, and remove it. A space holds up to 50 tracks. Duplicate and concurrent saves are idempotent.
- Backend-owned metadata verification; clients cannot supply trusted song metadata or stream URLs for saving. MongoDB stores `Track` metadata and ordered `Moodspace.savedTracks` references. Raw audio and stream URLs are not persisted.
- Artist credit and Jamendo source/license links in search results, saved tracks, queue, and Listen. Existing visual tokens/layout remain in use; final cinematic design is deferred.

## Provider feasibility and rights

**Selected provider: Jamendo.** A backend-only client ID was already configured in the ignored local environment and was verified successfully. Its value was never printed, committed, or bundled into frontend assets.

Before the full player was implemented, a live request returned actual metadata and direct audio URLs, and Chromium decoded audio, advanced its position, paused, sought to six seconds, and changed volume. Subsequent live app browser journeys verified the full search/player/save path. The standalone probe uses the same adapter as the application.

Concrete recordings observed during verification:

| Jamendo track | Artist | License | Evidence |
| --- | --- | --- | --- |
| [Most — 1495504](https://www.jamendo.com/track/1495504) | Sirius Music&ArtVision | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | Actual UI playback, controls, and save/revisit checks |
| [Wanderer — 1538246](https://www.jamendo.com/track/1538246) | Andrew kn | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Real second queued track and navigation |
| [ambient loop — 1497826](https://www.jamendo.com/track/1497826) | afarisano | [CC BY-NC 3.0](https://creativecommons.org/licenses/by-nc/3.0/) | Complete 16-second recording played from position zero to native `ended` in Chromium |

These are verification observations, not hardcoded production catalog entries. The application always queries Jamendo. The probe's full-recording result also verified pause, seek to six seconds, volume .3, and media readiness 4. Browser decoding/progress is verified; a human listening assessment through speakers/headphones was not performed by the agent.

[Official tracks documentation](https://developer.jamendo.com/v3.0/tracks) supplies the metadata/stream contract. [Jamendo API terms](https://devportal.jamendo.com/api_terms_of_use) permit noncommercial API use subject to individual licenses and require creator/provider credit and track backlinks. The app remains noncommercial, exposes the individual license, and excludes unknown/NoDerivatives licenses from eligible playback. No offline/download/remix/synchronized-video feature is included. Demo-video reuse needs its own applicable rights check.

Jamendo worked, so Audius was not integrated. The [official Audius API](https://docs.audius.co/api/) documents search and stream endpoints and mostly credential-free read access; it remains a candidate if Jamendo access fails in a future slice. Switching would require verifying its access/rights, metadata mapping, stream redirects, browser playback, and CSP. The app does not silently substitute providers or fabricate results when credentials fail.

**Observed provider behavior:** stream URLs rotate, and some requests returned empty results even for previously observed tracks. Exact-ID lookups avoid search license filters and still enforce eligibility locally. The adapter rechecks an empty/transient response once inside a shared eight-second deadline. Final unavailable/error responses remain visible. Track identity is provider + providerTrackId, never a transient stream URL.

## Automatic verification

| Check | Result / scope |
| --- | --- |
| `npm run lint` | Passed |
| `npm run build` | Passed; approximately 114 KB gzip JS and 5.7 KB gzip CSS |
| `npm test` | **24 passed** across 5 files: configuration, original account/CRUD regression, provider normalization/errors/retry, saved-track persistence/ownership/idempotence, and player queue/race/media-error/autoplay behavior |
| `RUN_LIVE_MUSIC_TESTS=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e` | **6 passed**: existing flows and live music journey at desktop 1440×1000 and mobile 390×844 |
| `MUSIC_VERIFY_FULL_TRACK=1 CHROMIUM_PATH=/usr/bin/chromium node server/scripts/verify-provider.js` | Passed against real Jamendo; 20 eligible returned tracks, native audio controls verified, complete short recording verified |
| Frontend credential scan | Configured client ID absent from built JS/CSS |
| Visual/mechanical inspection | Desktop/mobile search/Listen screenshots inspected; design detector returned no deterministic findings |

The live journey verifies real search results and loaded artwork; actual audio progression; pause/resume; seek; volume/mute; queue next/previous and native track-ended advance; the same active source and one audio element across Compose navigation; saving/revisiting/removing in real MongoDB; restoration paused after refresh; recovery from one explicitly injected test-only provider failure; and clearing audio on sign-out. Stream URL comparisons use provider track identity after a fresh lookup, but require the exact same active URL across route navigation.

HTTP tests use a real temporary MongoDB process and an explicitly synthetic provider contract to deterministically verify validation, persistence, concurrent duplicate saves, preservation of space edits, ownership checks before provider access, and missing credentials. Provider unit tests inject responses for failure cases. Player unit tests simulate media events to verify race/error/autoplay handling. Those fixtures do not prove real audio; the separate live browser and standalone probe results above do.

The ordinary `npm run test:e2e` skips the two live music journeys unless `RUN_LIVE_MUSIC_TESTS=1`. Skips must not be reported as live-integration passes. Live verification reads the Jamendo key but always creates a disposable test database; it does not write test accounts into the configured Atlas/application database.

## Local configuration and testing

The existing local `JAMENDO_CLIENT_ID`, MongoDB URI, session secret, and app origin are configured. No additional credentials are needed on this machine. For another environment, set `JAMENDO_CLIENT_ID` only in `server/.env` or the backend host environment, alongside the existing `MONGODB_URI`, `SESSION_SECRET`, and exact `APP_ORIGIN`. Never copy it into a `VITE_` variable. Without it, music requests return `503 MUSIC_NOT_CONFIGURED`, while account/space functions remain usable.

1. Run `npm run dev` and open `http://127.0.0.1:5173`.
2. Sign in and create a personal moodspace.
3. Search `ambient` in Discover; inspect metadata, artwork, and license/source links.
4. Play a result and queue another. In Listen, test pause/resume, seek, volume/mute, previous/next, and queue ordering/removal.
5. Navigate to Compose and back while audio continues. Add an unsaved edit if testing the existing navigation guard, then keep or discard it explicitly.
6. In Discover, Save to space → choose your existing space. Repeat to check it stays a single save.
7. Open the moodspace, refresh, and play/queue its saved track. Remove it and refresh to verify removal.
8. Refresh Listen to confirm paused queue restoration; sign out to confirm audio and user queue cleanup.

Repeat automated checks with `npm run lint`, `npm test`, `npm run build`, then the live browser command above. Run provider probes sequentially to avoid overlapping external checks. `README.md` contains the full setup/test instructions.

## API and data flow

| Endpoint | Purpose |
| --- | --- |
| `GET /api/music/search?q=...&page=1&limit=20` | Authenticated validated provider search |
| `GET /api/music/tracks/:provider/:trackId/playback` | Fresh eligible normalized track and direct stream URL |
| `GET /api/spaces/:id/tracks` | Owned ordered saved-track metadata; no stream URLs |
| `PUT /api/spaces/:id/tracks/:provider/:trackId` with `{}` | Idempotent verified save into owned space |
| `DELETE /api/spaces/:id/tracks/:provider/:trackId` with `{}` | Idempotent owner-scoped removal |

**Search/playback:** request → authentication, strict validation, per-user limiter → music controller → provider-independent service → Jamendo adapter with bounded timeout → normalized response. Native media requests travel directly from the browser to approved Jamendo media origins. The backend is not an audio proxy.

**Saving:** request → CSRF/auth/validated IDs → music controller → space-track service verifies ownership first → provider verifies current metadata/eligibility → `Track` metadata upsert → atomic conditional append to `Moodspace.savedTracks` and revision increment → confirmation. A second concurrent save cannot append the same ID. Removing uses an owner-scoped atomic pull. Saved-track deltas increment the space revision, so an already-open older editor reports a conflict rather than overwriting new state.

## Files and architecture

- Backend additions: `providers/jamendo.js`, `services/musicService.js`, `services/spaceTrackService.js`, `models/Track.js`, `controllers/musicController.js`, `routes/musicRoutes.js`, `validation/music.js`, and `scripts/verify-provider.js` under `server/`.
- Backend updates: app routing/CSP, environment config/example, Moodspace saved references, space routes, startup/test collection initialization.
- Frontend additions: `features/music/` search, shared track rows, save dialog, saved-track list, time formatter; `features/player/` host/controller, controls, summary/notices and Listen; `stores/playerStore.js`.
- Frontend updates: Discover and space detail integration, route/shell navigation, logout cleanup, optional confirm-button disabling, existing CSS tokens/layout extensions, and truthful privacy/credits text.
- Tests/tooling: provider and music HTTP tests; player unit tests; opt-in live music browser journey; test server/env wiring; Vitest inclusion and lint globals.
- Documentation: README, implementation-plan milestone scope, third-party notices, and this handoff. Existing local environment files were not modified and remain ignored.

## Known limits and remaining checks

- The catalog contains independent Jamendo recordings; mainstream songs are not guaranteed. Metadata and stream availability depend on the provider. License decisions apply to the exact recording, not an artist's entire catalog.
- Playback and responsive checks were automated in Chromium, including a mobile viewport. Real Safari/iOS, Firefox, hardware media controls, changing audio devices, native mobile volume policy, and long unstable-network sessions still need manual testing.
- Media-error and autoplay rejection state transitions are covered with simulated events; the live browser journey injects a provider error. Physically disconnecting a device/network or forcing every codec failure was not performed.
- A human should confirm audible output and comfortable keyboard/screen-reader use. No production deployment, hosted-origin TLS/proxy/media-CSP validation, or Atlas write check was performed in this milestone. Database tests used isolated real MongoDB.
- Queue is per tab, not cross-device; volume/position do not persist across refresh. Removing a saved track does not remove an independently queued copy. Metadata is a saved snapshot; playback always resolves fresh metadata/availability.
- No mood ranking, feedback-learning engine, favorites outside spaces, humming, synchronized lyrics, image/quote editor, or final immersive redesign is included.

The requested local search/playback/save implementation is delivered. Environment-specific manual checks and production verification remain before claiming deployment readiness.
