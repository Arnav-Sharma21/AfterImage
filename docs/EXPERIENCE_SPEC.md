# AFTERIMAGE — Definitive experience specification

This specification implements the user's latest explicit approval. It supersedes the layout, naming, fixed-palette and implementation guidance in `design/NEW_DESIGN_PROPOSAL.md` and historical visual plans. The fifteen directly inspected images in `design/references/` are the visual authority. Product/security contracts in milestone documentation remain valid.

The latest user-approved brand is neon pink and near-black throughout the product. See `NEON_PINK_UPDATE.md` for the subsequent shared-library and account-entry implementation. This replaces the older neutral/serif direction.

## Experience architecture

- **Worlds `/atlas`**: authenticated entry into a private photographic archive. The latest reference-led opening is a condensed-type photographic poster; personal worlds follow as a private collection. Offset photographs, a sculptural light study and catalog-search access share the experience. No invented community/trending content. Empty archives offer a clear first-world action.
- **Search `/signals`**: a dedicated catalog workspace, with a broad photographic discography masthead and practical real search/results. Large first results and compact secondary records balance browsing with speed. Search state stays in URL parameters.
- **World `/worlds/:id`**: the user's artifact, combining images and writing with a contextual soundtrack. Its editor `/worlds/:id/edit` places the visual canvas above an open editing desk, replacing the narrow, independently scrolling inspector. `/worlds/new` starts a draft. Story, image import and emotional tuning are contextual tools, not top-level product destinations. Recommendations belong to the world and remain persisted by the existing backend.
- **Player `/player`**: an expanded artwork environment available from persistent playback controls. Artwork, Your writing, Scene and Focus are visual presentations of the same audio state. Fullscreen is a separate actual browser capability. Queue is a modal glass layer with native focus management.

Legacy `/discover`, `/compose[/new/:id]`, `/spaces/:id` and `/listen` remain functional aliases. Existing bookmarks and origin metadata work. New navigation uses Worlds, Search and New world; playback expansion supplies Player context. Authentication remains `/auth`.

## Visual system

Neon pink `#ff5c8a` is the persistent brand accent, used for headings, controls, selected moods, focus, navigation and playback chrome. Near-black and rose-black surfaces replace blue/grey panels. Barlow Condensed supplies display typography across all experiences; Manrope supplies readable body text and controls; IBM Plex Mono supplies compact metadata. Archivo Black/Cormorant imports and all serif/italic display styling have been removed from the running frontend.

Actual artwork can still influence atmospheric backgrounds through the existing bounded pixel extractor and disclosed CORS fallback. Brand controls stay pink when songs change. This separates the user's newly chosen site identity from visual color present in real artwork; no acoustic or emotional analysis is implied.

An authenticated space rail runs along the desktop edge, using actual owned images or title monograms, with an active marker and create action. On phones it becomes a horizontally scrolling shelf and is omitted from expanded listening. Focus/fullscreen remain distraction free. The rail updates after successful space mutations and is mounted by account ID, removed on logout/session expiry, and never persisted in browser storage.

Account entry is a photographic poster and a focused account desk; guest navigation avoids authenticated links. The home poster includes working catalog search, a personalized caption and creation access.

## Media imports

An image-import tray accepts files, drag/drop and HTTPS references. Server-mediated Cloudinary uploads use session/CSRF, bounded multipart parsing, actual Sharp decoding and metadata stripping, then the official SDK. MongoDB holds asset ownership and Cloudinary identifiers. Personal images retain order/caption/alt. Reference URLs remain backwards compatible. Save pins protect assets from concurrent cleanup; deletion rechecks all references and cannot delete another account's asset. Cleanup failures retain retryable records. No unrestricted remote fetch or binary storage in MongoDB.

## Motion and graphics

Scoped GSAP timelines choreograph artwork, writing and floating controls. ScrollTrigger reveals the archive and photo annotations without pinning or scroll hijacking. Original parametric chrome geometry uses demand rendering, off-screen suspension, reduced detail, a static fallback and explicit context-loss handling. Motion is independent of the single audio host. Reduced-motion users receive stable compositions and immediate palette changes.

## Acceptance gates

Real auth/CRUD/images/tuning/recommendations/search/save/queue/audio must pass regression checks. Verify three different live artwork palettes, CORS/image failure, real fullscreen, native modal focus/Escape, hidden-panel validation, upload ownership/content/limits and orphan cleanup. Inspect actual browser renders at 1440×900, 1280×800, 390×844, 360×740 and an intermediate width. Report provider-dependent failures and missing Cloudinary credentials honestly.
