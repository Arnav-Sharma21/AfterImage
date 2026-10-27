# AFTERIMAGE — neon identity and personal-space rail

This update implements the user's approval of the neon-pink poster direction and request to apply it throughout the actual product. It supersedes the earlier serif, blue-grey and adaptive-control styling described in older visual reports. Backend contracts, recommendation ranking, persistent data and the single audio engine are preserved.

## Implemented experience

- **Global identity:** neon pink `#ff5c8a`, near-black and rose-black surfaces; condensed Barlow headings, Manrope body/control text and IBM Plex Mono metadata. Archivo Black and Cormorant are no longer imported. All serif/italic display declarations were removed from the running frontend. Focus, navigation, selected moods, progress/volume controls, playback buttons, the compact player and account controls now share the pink identity. Actual images can still supply colors to atmospheric backgrounds; brand controls remain pink.
- **Personal-space rail:** actual authenticated spaces appear as photograph thumbnails or title monograms down the desktop edge. Each has an accessible title, active marker and real world link. The create control starts the existing editor. Fifty entries are requested per page, with a More action when needed. There are no fabricated playlists or public collections.
- **Mobile library:** the rail becomes a horizontal, scrollable shelf below the header. Expanded listening hides this shelf; Focus and actual browser fullscreen remain immersive. The existing bottom navigation and compact audio controls continue working.
- **Home:** the photographic poster now includes an account-specific caption and real catalog search. Submitting it uses client-side routing to `/signals?q=…`, preserving the audio host. Personal collections and creation remain available below the poster and in the rail.
- **Account entry:** a continuous photographic poster and dedicated account desk replace the detached image/form layout. Both signup and login have their own heading/copy. Password visibility is functional. Native validation, autocomplete, CSRF, errors, loading/disabled states and existing sessions remain intact. Guest navigation no longer displays authenticated destinations.
- **World atelier:** a wide canvas sits above an open editing desk. The former narrow, independently scrolling inspector is removed. Story, image imports and real Mood DNA remain contextual tabs. An empty canvas provides working Add photographs/Add words controls, replacing the earlier decorative ribbon placeholder. Tool shortcuts move to the editor, including on desktop.
- **Motion:** essential text remains visible during entrances. GSAP moves text rather than starting it at zero opacity; photography still has a restrained reveal and ScrollTrigger parallax. This corrects blank text captures during viewport refreshes. Reduced motion and actual WebGL/context-loss fallbacks remain supported.

## Rail synchronization and privacy

`SpaceRail.jsx` is mounted with the authenticated account ID and removed on sign-out/session expiry. Requests abort on unmount. There is no persistent rail cache in local/session storage.

After successful create/update/delete requests to the existing space endpoints, the API wrapper emits a local `afterimage:spaces-changed` event containing only the committed response or deleted ID. The rail updates immediately and revalidates its current page. Track saving and recommendation endpoints do not trigger this event, avoiding extra recommendation/provider requests. Server ownership checks remain authoritative. Ordinary links preserve the editor's unsaved-change guard.

Managed rail thumbnails use an explicit 48 px delivery hint and 80/160 px responsive Cloudinary variants rather than requesting large canvas images. Existing HTTPS references retain their original hosts and error fallbacks.

## Verification

- `npm run lint`: passed.
- `npm test`: 59 passed across 10 files, using isolated MongoDB and explicit Cloudinary boundary fixtures.
- `npm run build`: passed. The existing lazy Three.js chunk still raises Vite's size advisory; it is not included in the initial scene download.
- New browser regression: passed on desktop and mobile for account entry, password visibility, rail creation/rename/image updates/deletion, active state, unsaved-navigation protection, real home-query routing and same-tab account isolation. The query error test deliberately injects a provider failure rather than fabricating successful music.
- The initial new test used an ambiguous New world locator, matching the header and archive actions. It was scoped to the real rail's Create a space control; business assertions were retained.

The final complete Chromium run had **17 passed, 1 failed and 4 intentionally skipped** across 22 scenarios in 5.1 minutes. The only failure was the three-artwork scenario receiving an empty live Jamendo search result. Its trace/context are retained in `design/creative-verification/neon-provider-failure/`. Rerunning only that scenario, with unchanged assertions and real provider responses, **passed** in 27.5 seconds. All 18 applicable scenarios therefore passed across the complete run and targeted retry; a single entirely green full run is not claimed. The four skipped mobile duplicates are covered by the desktop visual scenarios, which explicitly capture all four required sizes and an intermediate width.

Actual playback, seeking, volume, queue/navigation continuity, saved music, recommendations/feedback, image persistence, uploads, owner/session boundaries, reduced motion and real WebGL/fallback checks remain covered. In the new local archive probe, DOMContentLoaded was about 175.5 ms with one observed 65 ms startup long task; the Three.js scene was not downloaded before visibility and produced no extra draws during its idle measurement. These are local Chromium/software-renderer observations, not production/device guarantees.

Live Jamendo checks use real provider responses and media; they can fail when the upstream catalog or an exact track disappears. Cloudinary live account operations still require the three server credentials; ordinary tests mock those external operations explicitly. No real Cloudinary upload/deletion or production deployment is claimed.

Actual Chromium captures are in `design/creative-verification/`, including `neon-signup-*`, `neon-login-*`, `neon-home-*`, the updated world/editor/player states and the interactive sculpture. Desktop/mobile renders are inspected rather than inferred from a passing build. The full-page captures can place fixed navigation at the original viewport boundary; viewport captures accompany them.

## Local verification

### Search follow-up

The reported clipped INDEX heading was caused by a fixed-height masthead and an oversized wrapping flex heading. It now has two explicit text lines, automatic height, smaller responsive type, and a contained photograph. Ambient/Electronic/Jazz/Piano shortcuts submit real search queries through the same validated workflow; no successful provider results are mocked in production. The redundant initial hint was replaced with this functional entry point.

A regression checks heading bounds and page overflow at 1920×1080, 1440×900, 1280×800, 820×1000, 390×844 and 360×740, then exercises both shortcut and typed submission with an explicitly injected provider error. Its first run exposed a six-pixel shortcut overflow at 360 px; sizing/wrapping was corrected without weakening the assertions. Final targeted browser results: **5 passed, 1 intentional mobile duplicate skipped** (1.6 minutes), including real search/playback/queue/save/navigation on desktop and mobile, loading/error states, and the six-width layout check. Lint, production build and all 59 unit/database tests also passed. Actual screenshots were inspected.

The missing Cloudinary values and remaining user setup are documented in [LOCAL_CONFIGURATION.md](LOCAL_CONFIGURATION.md). Only presence flags were inspected; no secret values were printed or changed.

```bash
npm run dev
```

```bash
npm run lint
npm test
npm run build
E2E_MEDIA_FIXTURE=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- tests/e2e/neon-library.spec.js
RUN_LIVE_MUSIC_TESTS=1 E2E_MEDIA_FIXTURE=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

Use the existing MongoDB/session/Jamendo configuration. Change or omit `CHROMIUM_PATH` for your installed browser. The browser harness uses its own disposable database. No commits, pushes or deployments were performed.
