# AFTERIMAGE

An original music-first application that maps personal visual moodspaces to music discovery and listening.

## Current implementation

The first working slice includes email/password accounts, MongoDB-backed sessions, and private moodspaces with a title, description, and 1–5 mood tags. Create, retrieve, edit, and delete spaces through the React UI. Edits use revisions to prevent stale tabs from overwriting newer changes. Failed saves retain the draft; session expiry offers reauthentication.

Milestone 2 adds real Jamendo search, artwork/metadata, direct audio playback, a shared queue, and saved tracks inside owned moodspaces. Playback continues across Discover, Compose, and Listen. Play/pause, previous/next, seeking, volume/mute, buffering, retries, and track-ended advance use one real HTML audio element.

Milestone 3 adds **Find my sound**: deterministic mood profiles, real-catalog candidate ranking, truthful explanations, and persistent likes/dislikes. Mood tags, recognized words, optional quote/note/manual-caption fragments, saved music, and recent likes influence the selection. No raw image analysis or AI service is used. Image uploads and advanced visual effects remain future work.

The final UI implementation adds an editorial Discover, an artwork-led Listen with focus mode and a queue drawer, a persistent compact player, and real image moodboards. Compose supports up to 12 ordered public HTTPS image references with descriptions and captions, alongside quotes, notes and saved Mood DNA targets. Captions participate in the existing text rules; images are never analyzed. There is no file-upload storage or new credential. See [implementation and visual QA](docs/FINAL_UI_IMPLEMENTATION.md) and [Milestone 3.1](docs/MILESTONE_3_1.md) for preserved recommendation/session behavior.

## Local setup

Use Node.js 24 LTS (`.nvmrc`) and npm. The current dependency set requires Node 22.12 or newer. This workspace was verified on Node 26.11.1; Node 24 itself has not been tested here.

```bash
npm ci
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` before starting:

- `MONGODB_URI`: your own MongoDB Atlas connection string, including a database name such as `afterimage`, or an actual running local MongoDB URI. For Atlas, create a database user with read/write access to this database, URL-encode its password in the URI, and add your development machine's IP to the Atlas network access list. Example shape: `mongodb+srv://<user>:<encoded-password>@<cluster>/afterimage?retryWrites=true&w=majority`.
- `SESSION_SECRET`: a unique random value with at least 32 characters. Generate one locally with the command below. The placeholder is deliberately rejected at startup.
- `APP_ORIGIN`: keep `http://127.0.0.1:5173` for the default development setup. Origin matching is exact: use this address in your browser, rather than switching between it and `localhost`.
- `JAMENDO_CLIENT_ID`: your own client ID from the [Jamendo developer portal](https://devportal.jamendo.com/), stored on the backend only. If absent, accounts and moodspaces still work and music requests return a clear configuration error.

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
npm run dev
```

Open **http://127.0.0.1:5173**. Vite proxies `/api` to Express at `http://127.0.0.1:3001`; the browser uses relative API URLs and a necessary HttpOnly session cookie. No CORS configuration or browser-side secret is needed. `client/.env` is optional unless you change the API target.

No credentials are bundled, and no database or music catalog is simulated when configuration is missing. Keep real `.env` files private; they are ignored by Git. Existing local environment files should be edited rather than overwritten with the example.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Vite and the Node watch server together |
| `npm run lint` | Lint client, server, shared code, and tests |
| `npm test` | Configuration, provider contract, queue/race logic, and real MongoDB HTTP tests |
| `npm run test:watch` | Watch the same test suite |
| `npm run build` | Build the Vite frontend into `client/dist` |
| `npm start` | Start Express and serve the built frontend on one origin |
| `npm run test:e2e` | Browser workflows against an isolated MongoDB-backed test server; build first |

For a local **built-app** check, run `npm run build`, set `APP_ORIGIN=http://127.0.0.1:3001` in `server/.env`, keep `NODE_ENV=development`, and run `npm start`. Open port 3001. Restore the Vite origin before returning to `npm run dev`.

For production, configure environment variables on the host, set `NODE_ENV=production`, use an exact HTTPS `APP_ORIGIN`, and set `TRUST_PROXY_HOPS=1` only behind one trusted reverse proxy. Secure session cookies require HTTPS. The host supplies `PORT`; Express serves both the built app and API. Deployment has not been performed. See the implementation plan for the proposed Render/Atlas setup and deployment approval requirements.

## Tests and verification

The integration suite starts an actual MongoDB 7.0.24 process using `mongodb-memory-server`. It tests the real Mongoose models, Express routes, Argon2, CSRF, persistent sessions, two-user isolation, revision conflicts, validation, and pagination. The first run downloads an official MongoDB binary (about 82 MB) into `/tmp/afterimage-mongodb-binaries`. Linux needs a compatible glibc/OpenSSL 3 environment. Network access and permission to open local ports are required.

If a binary cannot run on your platform, set `TEST_MONGODB_URI` to a MongoDB server you control. Tests create and drop only a randomly named `afterimage_test_*` database; use a dedicated test server/account with permission to do that. Never use production database credentials for testing. No tests silently fall back to mocked persistence.

Browser tests need Chromium. With Playwright's browser installed:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

Or use an existing system Chromium on this machine:

```bash
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright starts a built-app server on port 4173 with a fresh test database. It exercises desktop/mobile signup, creation, refresh persistence, editing, relogin, deletion, keyboard mood selection, save failure, expired-session recovery, and unsaved-edit guards. Its screenshots/traces are ignored by Git. Test accounts and short-lived test secrets are confined to the disposable database/server.

The default browser run explicitly skips the live music journey. To verify real catalog results, artwork, playback controls, queue/ended behavior, route continuity, saved-track persistence, and failure recovery, enable the external integration test:

```bash
npm run build
RUN_LIVE_MUSIC_TESTS=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

This reads only the Jamendo key from `server/.env` for music access; its accounts and saved tracks use a disposable test database, never the configured application database. It depends on current provider responses and external media access. It uses no fake catalog or audio. Synthetic provider fixtures in unit/HTTP tests are explicitly test-only and test error/security behavior.

The smaller standalone feasibility probe uses the actual application adapter and checks Chromium audio decoding/progress, pause, seek, and volume:

```bash
CHROMIUM_PATH=/usr/bin/chromium node server/scripts/verify-provider.js
# Also play a short eligible result from start to finish, if one is <=30 seconds:
MUSIC_VERIFY_FULL_TRACK=1 CHROMIUM_PATH=/usr/bin/chromium node server/scripts/verify-provider.js
```

Run live probes sequentially. Jamendo has returned intermittent empty responses during verification. The adapter retries an empty/transient response once within one eight-second deadline; final empty/error responses remain visible. Stream URLs rotate, so tracks are identified by provider/ID and resolved again for playback.

See [Milestone 1](docs/MILESTONE_1.md), [Milestone 2 verification](docs/MILESTONE_2.md), and [Milestone 3 formula/verification](docs/MILESTONE_3.md) for actual results and limitations. Real hosting, HTTPS cookies/media policy on the deployed origin, Firefox/Safari, and human assessment of audible output still need environment-specific checks.

## Try mood-driven recommendations

1. Save a space with moods and descriptive words. Optionally use **Add text fragment** in Compose for a quote, personal thought, or manually written image caption.
2. Choose **Find my sound** in the saved editor/space. In Discover, use the same action beside a personal space.
3. Inspect **Your music direction** and each track's explanation; play, queue, or save results to the current space.
4. Like a track or choose **Less like this**, then **Refresh my sound**. Your feedback persists across refresh/login and affects your own spaces; exact dislikes are excluded.
5. Compare Quiet/rainy and Intense/energetic spaces. Their query tags, estimated features, and rankings should differ. A refresh may still repeat good matches when the catalog is small.

The pure extraction/ranking code is separate from controllers and provider code. The documented formula combines mood overlap (.45), feature similarity (.20), genre compatibility (.20), and preference (.15), with missing-evidence coverage and saved/recent repetition penalties. See `docs/MILESTONE_3.md` for the full definitions and limits. Only derived catalog tags go to Jamendo; private text is not sent upstream.

The live preflight `node server/scripts/verify-recommendations.js` compares actual Jamendo results for three explicit verification profiles. The opt-in browser suite includes recommendation persistence, playback/saving, feedback, dislike exclusion, and Discover integration. Synthetic unit/HTTP fixtures remain test-only.

## Compose a visual moodspace

1. Open Compose. Enter a title/description and choose 1–5 moods.
2. Choose **Add image** and paste a direct public HTTPS image URL you have permission to display. Enter its accessible description and optional caption. Up to 12 images are supported; local/private addresses, credentials, custom ports and non-HTTPS URLs are rejected.
3. Use the image arrows to reorder; open **Edit image** to revise its URL, description or caption. Remove an image with its labeled action. Changes persist only after **Save space** or **Save changes** succeeds.
4. Add a quote, note or text caption. Open **Mood DNA** to enable manual targets, then save before **Find my sound / Refresh my sound**. Mobile tuning is collapsed initially to keep the image composition accessible.
5. Return to the space to see its saved collage and music. Play a track and expand Listen; the compact player retains pause/resume, skip and queue access elsewhere. **Focus mode** hides secondary navigation; **Exit focus** restores it.

External image hosts receive browser requests without a referrer. The app stores URL references and captions, not image files. Hosts can remove images or block embedding; the canvas keeps its text and a visual fallback. Protected/private URLs and local uploads are unsupported. No reference-board imagery is bundled in the frontend.

## Try the music workflow locally

1. Configure MongoDB, the session secret, exact app origin, and `JAMENDO_CLIENT_ID`; run `npm run dev`.
2. Sign in and create a moodspace in Compose.
3. In Discover, search `ambient` or a Jamendo artist/title. Inspect real artwork, duration, and source/license links.
4. Play a result, queue another, and open Listen. Exercise pause/resume, seek, volume/mute, previous/next, and queue reordering/removal. Previous restarts a track after three seconds; otherwise it moves back.
5. Navigate to Compose and back while listening; the active stream should continue without restarting.
6. Choose Save to space on a search result and select your existing moodspace. Repeated saves add one reference only.
7. Open that space, refresh, play or queue its saved music, and remove a track. Refresh again to verify removal.
8. Refresh Listen: the queue is restored paused within this tab. Sign out: playback stops and that user's queue is cleared.

Saved-track mutations increment the space revision, so an older open editor reports a conflict instead of overwriting newer state. Removing a saved track does not remove an independently queued copy. Queues and saved tracks are each capped at 50. No audio files or persistent stream URLs are stored.

## Music source and licensing

Jamendo is the only implemented provider. [Official track documentation](https://developer.jamendo.com/v3.0/tracks) defines the search/metadata and direct stream fields. The application queries its independent catalog; mainstream releases are not guaranteed. Metadata can be missing and streams can be withdrawn.

This project is noncommercial. Artist name, Jamendo source link, and track license link appear in results, saved music, the queue, and Listen. Unknown licenses and NoDerivatives tracks are not eligible for playback in this implementation. Each recording's license still governs its reuse; no download, offline, remix, or synchronized-video feature is provided. [Jamendo API terms](https://devportal.jamendo.com/api_terms_of_use).

## Architecture and request flow

- `client/src/`: React routes and components, shared UI primitives, Tailwind tokens/CSS, API wrapper, Zustand session/editor/player stores. Private draft content stays in the editor's memory. One app-level `PlayerHost` owns the audio element and cleans up its handlers.
- `server/src/`: routes → validation/security middleware → controllers → services → Mongoose models; configuration and startup are separate from app construction.
- `shared/moods.js`: one canonical mood vocabulary for the frontend and backend.
- `server/tests/`: real database HTTP tests and validation/configuration tests.
- `tests/e2e/`: browser journeys and the isolated test server.

**Accounts:** request → JSON/origin/CSRF checks and auth throttling → auth controller → service hashes/verifies password → User and Mongo session store → safe user object, rotated CSRF token, and HttpOnly cookie. Sessions expire after at most seven days. No password/hash is returned.

**Moodspaces:** request → session and owner authentication, CSRF for mutations, strict schema validation → space controller → service queries by both resource ID and session user → MongoDB atomic create/read/update/delete → safe space response. Updates and deletes match the expected revision. Another user's ID returns 404; a conflicting owned revision returns 409.

**Music search/playback:** authenticated request → bounded input validation and per-user music limiter → music controller → provider-independent service → Jamendo adapter → normalized metadata/direct stream response. Audio goes from Jamendo to the browser, never through an audio proxy. Search queries, rather than private moodspace descriptions, go to Jamendo.

**Saved music:** session/CSRF + validated space/provider IDs → controller → owned-space service → provider verification → `Track` metadata upsert + conditional `Moodspace.savedTracks` append → confirmation. Concurrent duplicate saves are idempotent. Removal uses an owner-scoped atomic pull. Saved-list reads return ordered references/metadata without stream URLs; Play resolves a fresh URL. Existing space edits cannot accept or replace saved-track fields.

For a just-generated recommendation, saving can use server-verified metadata up to five minutes old without refreshing its timestamp; this tolerates a transient second lookup failure. Audio playback still resolves a fresh eligible stream.

**Recommendations:** owned saved space + recent private reactions and saved metadata → deterministic profile → real provider candidates → separate pure ranker → bounded revision-checked snapshot → current feedback-filtered response. Feedback stores one reaction per user/track; generation never trusts a client-supplied profile or fabricated song metadata.

`GET /api/health` checks process liveness; `GET /api/ready` performs a bounded database ping. API responses are JSON, and private responses use `Cache-Control: no-store`. Database/session errors never become successful saves.

Fonts are self-hosted from the Fontsource packages under the SIL Open Font License; see [third-party notices](docs/THIRD_PARTY_NOTICES.md). Inspiration screenshots remain local-only.

## Planning
- [Product brief](docs/PRODUCT_BRIEF.md)
- [Visual reference guide](design/REFERENCES.md)
- [Submission checklist](docs/SUBMISSION_CHECKLIST.md)

**Deadline:** October 27, 2026 at 11:59 PM IST.

> Design reference screenshots are intentionally local-only and ignored by Git, because they include third-party artwork and UI references.
