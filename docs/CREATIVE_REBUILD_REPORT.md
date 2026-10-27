# AFTERIMAGE — definitive creative rebuild report

**Latest presentation:** the user's subsequent neon-pink approval is implemented in [NEON_PINK_UPDATE.md](NEON_PINK_UPDATE.md). It replaces this report's earlier serif/blue-grey choices and narrow editor console with a shared pink identity, live personal-space rail, photographic account entry, home search and full-width editing desk. Earlier verification below remains historical evidence; the latest complete-suite result is recorded separately.

Latest neon verification: lint/build passed; 59 unit/database tests passed. The full browser run had 17 passes, one empty-Jamendo-search failure and four intentional duplicate skips; the single failed artwork scenario passed on a targeted live retry with unchanged assertions. Desktop/mobile rail mutation, dirty-navigation and account-isolation checks passed. See the neon report for exact limits and the retained failure trace.

## Scope and recovered baseline

This implementation follows the latest definitive user instructions, including the Cloudinary enhancement. `docs/EXPERIENCE_SPEC.md` supersedes the earlier proposal. All fifteen images in `design/references/` were inspected directly: eight experimental editorial references and seven immersive player references. Their composition/material/interaction principles informed the implementation; none is bundled as a production asset.

The recovered branch contained an earlier three-destination frontend, GSAP hooks, a parametric sculpture, image references and the functioning application. `design/creative-verification/` was absent in that checkout, so a new actual-browser gallery was produced. Existing user modifications to AGENTS.md and deletions of older design documents were preserved. The dedicated branch is `feature/definitive-atmospheres-media`; a source archive and user-diff checkpoint were saved under `/tmp/afterimage-definitive-*`. No commits, pushes or deployments were made.

## Before / after experience architecture

### Latest reference-composition pass

The user's subsequent request to follow the twelve attached references more directly supersedes the earlier restrained archive/type composition described below. This pass changes presentation without changing backend services, upload authorization, recommendation logic or the audio engine:

- Poster/underground references: a full photographic opening with enormous cropped condensed type, offset photo strips, a grain layer and a sharp pink editorial interruption. Barlow Condensed is now imported from the already installed, licensed package.
- Discography reference: a broad catalog masthead and three large record fields, with practical secondary rows and the original search/save/queue actions.
- Centered artwork references: a cover-centered room with metadata at the lower left and transport/progress along the bottom. The large bordered console is removed.
- Artwork-wash/reading references: stronger real artwork projection and large upright sans-serif personal writing, rather than a serif quotation card. Text is still explicitly personal writing, never fabricated lyrics.
- Neon glass reference: a real **Scene** presentation puts the working player in a frosted window over the originating world's first photograph, or original rain-passage photography when none is attached. Scene, Artwork, Your writing and Focus share the same audio source/queue.
- The atelier's images lose the heavy Polaroid frames; personal writing becomes a bold graphic interruption within the photographic canvas. Account entry adopts the same poster typography.

The screenshots' recordings, copyrighted lyrics and branded artwork were not copied into production. Runtime provider covers, original project photographs and actual user writing supply equivalent content. These are implemented composition matches across different application states, not a claim of pixel-identical copies of twelve unrelated source screenshots.

The reported `layout-transition` finding was an unused legacy `.dna-spectrum i` height animation. Its four obsolete spectrum rules were removed; the actual persistent dial controls remain intact. **Fixed: one; suppressed: none; left standing from that finding: none.**

| Baseline | Current implementation |
| --- | --- |
| Discover → Compose → Listen navigation | Worlds, Search, contextual World atelier and expanded Player |
| Photographic promotional opening followed by search and library | Reference-led photographic poster leads into private collections; catalog search has its own discography workspace |
| Editor canvas above a long tool form | Artifact and contextual scrollable tool console coexist on desktop; tools follow the canvas on narrow screens |
| Recommendations beneath both editing and viewing compositions | Generation/results belong to the world's Soundtrack view; the editor links to that saved context |
| Fixed theme plus blurred artwork | Bounded real pixel extraction, contrast-controlled colors, smooth atmosphere changes and a disclosed CORS fallback |
| Photograph room plus record sleeve and large rectangular transport | Artwork-centered stage, reading presentation, focus, real fullscreen and anchored glass transport |
| HTTPS image links only | Device selection, drag/drop, progress, server-validated Cloudinary imports, responsive delivery and owned media management |

Canonical routes are `/atlas`, `/signals`, `/worlds/new`, `/worlds/:id`, `/worlds/:id/edit`, `/player` and `/auth`. The original `/discover`, `/compose`, `/compose/new`, `/compose/:id`, `/spaces/:id` and `/listen` routes still work as aliases. Existing IDs, queries, source-space metadata and recommendation snapshots remain valid. API paths retain `/api/spaces`; route renaming does not change the backend contract.

## Component structure and functional boundaries

- `DiscoverPage` renders the private archive, real `SpaceList`, original photographic interlude and echo sculpture. It no longer owns search or recommendations.
- `SearchPage` owns the photographic catalog workspace and existing `MusicSearch`, real track actions, source/license links and pagination.
- `ComposePage` retains draft, validation, unsaved navigation, revision conflicts and session recovery. Its live `MoodCanvas` is paired with Story, Images and Mood DNA tools. Required controls in hidden panels are revealed/focused before validation feedback.
- `SpacePage` presents Collection and Soundtrack states. `RecommendationPanel` and `SavedTracks` retain their existing provider/persistence/feedback behavior and are mounted in the soundtrack context. `#sound` opens that state directly.
- `ListenPage` presents Artwork, Your writing, Scene and Focus without creating audio. Fullscreen uses `requestFullscreen`, listens to actual `fullscreenchange`, supports exit, and reports rejection. Personal fragments are manually navigated and explicitly distinguished from lyrics. Missing writing is an honest state.
- `PlayerSummary`, `PlayerUI` and the existing native queue dialog provide shared compact/expanded/queue access. Queue controls preserve play/remove/up/down. Escape closes the modal and returns focus.
- `PlayerHost`, `audioController` and the Zustand player store are unchanged. There remains one authoritative HTML audio element. Navigation, visuals and palette extraction do not control its lifecycle.

## Typography, composition and materials

Neutral graphite, silver and warm paper form the foundation, interrupted by pink poster/catalog typography in the latest reference-led pass. Colors of actual music and personal imagery supply contextual atmosphere. Player/world environments are not locked to pink/crimson. Barlow Condensed supplies poster/catalog weight; Archivo Black supplies selected functional headings; Manrope supplies the player reading stage and readable controls; Cormorant italic supplies quieter editorial annotations; IBM Plex Mono supplies technical details. The existing properly licensed fonts were reused deliberately; no new font collection was installed for this stage.

The archive combines a typographic poster, large irregular photo fields, a displaced secondary image, personal quotations and collection numbers. Image-free worlds receive an original seeded line composition, not fabricated photos. The atelier separates the artifact from its editing console. The player gives the album a centered stage and stable bottom transport; reading has a separate asymmetric arrangement. Glass is used on the Scene window, compact player, queue and tools. Opaque surfaces support forms/errors. Backdrop-filter and forced-color fallbacks are provided.

Original production photography remains locally bundled in optimized 768/1536 WebP variants: fictional night-train listener and rain-lit passage assets created during the earlier implementation. The current task generated no new concept boards or imagery. Provenance and font licenses are recorded in `THIRD_PARTY_NOTICES.md` and `client/public/licenses/`.

## Artwork atmosphere engine

`client/src/atmosphere/palette.js` implements a deterministic visual-color pipeline, independent of recommendations and audio:

1. Load the real artwork with anonymous CORS, without a referrer. Downsample to 48×48.
2. Ignore sufficiently transparent pixels; group RGB channels into 32-value bins and average each bin. The most populated bin supplies the background anchor.
3. Rank non-extreme-luminance bins using `sqrt(population) × (.25 + RGB range / 255)` to favor useful color evidence. Select a distant secondary color where available.
4. Mix anchors into dark backgrounds/surfaces and a light accent. Measure WCAG relative-luminance contrast; brighten the accent against its control surface and muted text against the background until at least 4.5:1. Main text remains light on constrained dark surfaces; accent controls use dark ink.
5. Apply scoped CSS variables to the player, compact transport, world or atelier. Registered color properties interpolate over .9 seconds where supported; reduced-motion changes are immediate. Backdrop images supply the actual artwork wash as well.

A bounded 128-URL in-memory promise cache deduplicates sampling. There is no localStorage palette database, backend image proxy or arbitrary server URL fetch. Sampling has a six-second bound. CORS denial, image failure, unsupported canvas or empty pixels return `image-wash`; no successful extraction is claimed. The real image still loads without the sampling CORS mode. A visible caption and `data-palette-method` disclose the chosen path.

Context rules: the current recording dominates expanded and compact playback. A world's first image dominates that world/editor. Browsing defaults to neutral. Mood DNA continues affecting actual music matching; palette extraction does not interpret emotions or acoustic features. The quantizer uses inexpensive RGB mixing, not perceptually uniform OKLCH or AI. A white-heavy cover can yield a conservative neutral base with a colored accent/wash.

Live verification rendered amber, blue and near-monochrome covers selected from real Jamendo results, not hardcoded catalog entries:

| Actual recording | Observed background | Observed accent |
| --- | --- | --- |
| ambient loop — afarisano, Jamendo 1497826 | rgb(87,57,12) | rgb(248,195,113) |
| Smart Solutions - Clean Corporate Ambient — Tina Ambient, Jamendo 2306455 | rgb(83,88,92) | rgb(176,221,240) |
| Ambient C [11.00] — MFTM, Jamendo 98935 | rgb(6,8,12) | rgb(132,135,137) |

These are observed outputs, not production constants. The browser also deliberately denies the sampling origin while retaining actual image bytes, verifying neutral controls and a visible cover. Recording/source/license links remain in the UI and gallery credits.

## Cloudinary imports and security

Server dependencies added: official `cloudinary`, `multer` and `sharp`. The upload is server-mediated; no unsigned public upload preset or frontend secret is needed.

Required server configuration:

```dotenv
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

All three are absent in the inspected local configuration. Actual Cloudinary upload/deletion therefore remains a credential-dependent manual check. Ordinary tests use explicit external-operation fixtures and never require real credentials. Missing configuration returns `MEDIA_NOT_CONFIGURED`; HTTPS links remain functional.

**Upload flow:** device/file drop → sequential XHR multipart upload with actual byte progress → existing origin/session/CSRF protection (multipart allowed only for POST `/api/media`) → authenticated per-account rate limiter → bounded in-memory parser → Sharp actual decoding → format/page/pixel validation → orientation correction, maximum 2400 px resize, EXIF stripping and WebP conversion → official signed Cloudinary upload stream → owned `MediaAsset` MongoDB record → canonical asset ID/delivery URL → draft alt/caption/order → normal validated world save.

Limits: one file/request; 8 MB incoming bytes; still JPEG/PNG/WebP/AVIF only; 25 megapixels; twelve references per world; 100 non-deleted managed assets/account; twenty uploads/ten minutes; one active upload per account and two normalization/upload operations per process. The single-instance rate/concurrency controls are not a distributed queue. A claimed MIME type/extension is never sufficient. SVG, animated/corrupt files and oversized inputs are rejected. No raw binary is stored in MongoDB or written to application disk.

`Moodspace.images` gains only optional `assetId`. Existing references remain compatible. A separate `MediaAsset` holds owner, server-generated public ID, Cloudinary asset ID, delivery URL, dimensions/bytes, status, pins and cleanup-retry state. During saves, owned ready assets are pinned before the space write, and server URLs replace client claims. Pins release in finally. Other accounts cannot attach or delete the record. Existing revision/ownership queries remain authoritative.

**Cleanup flow:** remove/replace an image and save, or delete a world → committed MongoDB mutation → background cleanup attempt → atomically mark unpinned asset deleting → recheck *all* saved references by asset ID and exact URL, including legacy/shared references → destroy only the server-recorded Cloudinary public ID → mark deleted. Shared/legacy external references are never themselves passed to Cloudinary deletion. Cleanup failure does not invalidate a committed save. It retains a retryable record. An interrupted deleting record can be retried after five minutes. A process crash while a save pin is held conservatively retains that asset; automated pin expiry is deliberately not used to risk deleting data.

Manage uploads supports reuse and explicit cleanup of discarded draft imports. Unattached uploads are not silently deleted on navigation; another tab may still be using a draft. There is no scheduled deletion of all old uploads. Operators can inspect retained records, and users can remove unneeded imports. Public delivery URLs are disclosed as public-to-the-holder; this is not private document storage.

Managed images use Cloudinary `f_auto,q_auto,c_limit` responsive 320/640/1200 delivery variants, with fallback to the original delivery URL if transformation is unavailable. External HTTPS references are not rewritten.

## GSAP, ScrollTrigger and graphics

The installed official GSAP React, timeline, ScrollTrigger and performance skills were read and applied. `useEditorialMotion` scopes entrance timelines, archive reveals and photographic parallax. Two archive editorial sections use actual ScrollTrigger behavior; no pinning or scroll hijacking is used. Resize observation refreshes measurements after real content changes and is cleaned up on unmount. Player track/presentation changes, recommendation arrivals, compact-player arrival and queue entrance/exit use scoped timelines with reduced-motion conditions. Transforms and opacity are the principal animated properties. Native scrolling was retained; Lenis and an overlapping animation library were unnecessary.

`EchoScene` renders an original parametrically folded ribbon and nested band with real physical metallic materials, procedural environment lightformers and pointer interaction. Its first light follows the available artwork accent; two explicit light studies can be selected by button/keyboard. It does not claim audio reactivity. It is lazy-loaded at visibility, uses `frameloop="demand"`, caps DPR to 1.5, uses reduced geometry/environment resolution for its small viewport, and unmounts off-screen/background. Geometry and listeners are disposed. Reduced motion disables pointer motion; explicit selection remains available. Unsupported WebGL, initialization errors and actual context loss show an original static fallback.

No custom shader or simulated audio-frequency system was added. The physical Three.js materials are real GPU-rendered materials. Additional shader experiments, video environments, multiple scenes, lyrics integration and custom scrolling remain deferred.

## Responsive and accessibility behavior

Actual Chromium captures cover 1440×900, 1280×800, 390×844, 360×740 and 820×1000. Desktop uses an archive spread, independent catalog margin and canvas/tool workbench. Mobile uses adapted image crops, native bottom navigation, a compact player above it, stacked editing tools, single-column import controls and an artwork-first player. The queue becomes a bottom glass sheet. Narrow/short player layouts reduce cover size to keep transport and save actions reachable. Horizontal overflow is asserted.

Keyboard checks include native moods/ranges, roving editor tabs with arrows/Home/End, revealing a hidden invalid required field, unsaved-change dialogs, queue Escape and focus return. Native dialogs retain focus trapping. Visible focus, form labels, image alt, live loading/error/success feedback, reduced motion and forced-color fallbacks are present. This is not a certified WCAG audit or a substitute for physical iOS/Safari/Firefox and screen-reader review.

## Verification results

| Check | Actual result |
| --- | --- |
| `npm run lint` | Passed, no warnings |
| `npm test` | 59 passed across 10 files; real isolated MongoDB, with Cloudinary operations explicitly mocked |
| `npm run build` | Passed; Vite reported the existing large lazy Three.js chunk warning |
| Latest complete reference-led Chromium suite with live Jamendo and the explicit managed-media fixture | 16 passed, 4 intentional skips, 5.1 minutes |
| Final Scene animation/mobile sizing/adaptive-color visual, playback and state regressions | 5 passed, 1 intentional duplicate skip, 2.8 minutes |
| Additional personal-writing regression/captures | 2 passed (desktop and mobile) |
| Additional live WebGL/fallback captures | 1 passed, covering five viewport sizes |
| Final affected desktop playback/palette checks after contrast correction | 2 passed, including three real artwork palettes, fullscreen and CORS fallback |

The four skips are mobile duplicates of artwork/palette and visual scenarios that already capture desktop **and** mobile widths. They are not suppressed failures. The complete suite verifies account CRUD/session recovery; actual search/audio controls/seek/volume/queue/end handling; route continuity; saving/removal; recommendation snapshots/feedback; real artwork colors; fullscreen; CORS fallback; upload UI/persistence/ordering/deletion; keyboard validation; provider error/loading states; and actual WebGL draws/idle/offscreen/context-loss behavior. Unit/database tests additionally cover media content validation, account isolation, reference protection, failed cleanup and configuration failures. All four advertised still-image formats are decoded in tests: Sharp reports AVIF as `heif` with `av1` compression, which is explicitly allowed without permitting unrelated HEIF codecs. Follow-up targeted captures verify personal writing and the rendered sculpture.

Real provider requests and audio were used for live music tests. Browser assertions verify advancing HTMLAudioElement playback and controls; no human listening assessment was performed. Media tests exercise real decoding, routes and MongoDB, while **only Cloudinary upload/destroy operations and their test delivery host are fixtures**. Creative world photography uses original bundled assets hosted through an explicit test URL mapping. Failure scenarios deliberately inject errors and CORS denial; none is represented as successful live integration.

Earlier failures were investigated rather than deleted: a route-migration API typo and mobile featured-result wrapping were fixed. Failure-injection setup was corrected to deny pixel sampling while retaining actual artwork. Background cleanup required an eventual-state assertion instead of incorrectly expecting synchronous provider completion. A previous live playback retry encountered Jamendo's actual unavailable-track response; the complete run subsequently passed with live responses. After a final contrast correction, a targeted run had **3 passed, 2 failed, 1 skipped**: desktop search-dependent checks received an empty catalog, while recommendation playback on both viewports and mobile playback passed. The failed traces are preserved in the gallery. A separate direct redacted Jamendo probe then returned HTTP 200, provider code 0 and 20 actual/playable tracks. The two affected desktop tests were rerun with no mocks, assertion changes or query substitutions and **both passed** (54.4 seconds). Provider availability remains external; live suites are not claimed deterministic.

Local performance observations from the latest poster-archive probe: DOMContentLoaded around **196–201 ms**, with two observed startup long tasks in the **62–76 ms** range, and no Three.js scene chunk loaded before the sculpture became visible. The earlier simpler archive measured about 70 ms without recorded long tasks; that earlier figure is not used to characterize the richer poster. WebGL draw instrumentation observed **zero extra draws during a 600 ms idle interval**, actual draws after interaction, and canvas unmount after scrolling away. These are local test-server/software-renderer observations, not production Lighthouse results or integrated-GPU guarantees. The production index script is about 428 kB (143 kB gzip); the separately loaded Three.js scene is about 986 kB (268 kB gzip). Further graphics chunk reduction is deferred, not claimed complete.

Actual rendered captures and provenance are indexed in `design/creative-verification/README.md`. Manual image inspection found and corrected the mobile result overlap, excessive search spacing, tag spacing and contrast over bright artwork. The new archive, contextual atelier and centered/reading player differ structurally from the previous search-and-sidebar/editor/player compositions. Photography, layered personal imagery and artwork washes now provide the visual content rather than empty themed sections. This is an implementation assessment, not a claim of user creative approval.

The first reference-layout run had 11 passes, 5 failures and 4 intentional skips. Three failures exposed genuine poster overflow during the entrance scale animation; the poster now uses bounded grid tracks and clips its own artwork/type composition. Two were actual Jamendo unavailable/empty responses. Failure traces were retained under `design/creative-verification/reference-pass-failures/`. The unchanged complete suite then passed 16 tests with 4 intentional skips. The new Scene regression also asserts one audio element and an unchanged source when switching presentations.

### Reproduce locally

```bash
npm run dev
```

With the existing MongoDB/session/Jamendo values in `server/.env`, run:

```bash
npm run lint
npm test
npm run build
E2E_MEDIA_FIXTURE=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
RUN_LIVE_MUSIC_TESTS=1 E2E_MEDIA_FIXTURE=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

The first browser command runs offline-capable application tests and explicitly skips live music checks. The second enables them using the configured Jamendo credential; neither changes the application database. Change `CHROMIUM_PATH` to a local browser path or omit it when Playwright Chromium is installed. These test-only fixture switches are not needed for normal application startup. All browser tests use their disposable API/database harness.

## Remaining manual / deployment work

1. Supply the three Cloudinary server credentials, restart the API and verify upload, optimized delivery and deletion in the intended account. Confirm usage quotas and any strict transformation policy. No new storage account was created by the agent.
2. Run production with the existing MongoDB/session/Jamendo configuration, exact HTTPS origin and trusted-proxy setting. Verify secure cookies, media CSP, deep links and actual browser fullscreen on that origin. The single-origin Express deployment architecture is unchanged.
3. Perform real-device Safari/Firefox, screen-reader, zoom/reflow, speaker/headphone and integrated-GPU testing. Chromium software WebGL results are not a hardware frame-rate guarantee.
4. Review subjective music relevance and final visual direction with the user. Rule-based matching is preserved; no emotion/pixel/audio intelligence is claimed beyond the documented inputs and color styling.

No production deployment, commit or push was performed.
