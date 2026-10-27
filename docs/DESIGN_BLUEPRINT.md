# AFTERIMAGE — Experience Design Blueprint

Prepared October 26, 2026. A research and implementation brief for the existing AFTERIMAGE React/Vite/Express application. References are for study, NOT automatically licensed for copying or redistribution.

## North star

**AFTERIMAGE is a personal visual world that becomes music.** Not a Spotify clone, not a Pinterest clone, not a marketing landing page. Design an expressive product around three modes: DISCOVER (find a sound), COMPOSE (build a personal visual space), LISTEN (be inside a sound).

Brand direction: **Cinematic Acid Noir × Editorial Neo-Brutalism × Analog Digital Dreaming**.

**Non-negotiables:** retain working auth, MongoDB CRUD, Jamendo playback, queue, saved tracks, recommendations, feedback and session continuity. Treat current implementations as the source of truth and test them. Do not fake song metadata, lyrics, audio-responsive effects, or visual AI.

## Image and layout references (source links)

1. Original local design screenshots already in `design/references/` — the user's top priority, source of grayscale angel image, black/red immersive music, lyrics and Spicetify directions. Do not copy as production UI assets.
2. Monolith — raw editorial grid, visceral black/pink contrast, photographic layers: https://dribbble.com/shots/27514720-Monolith-Dark-Bold-Brutalist-Music-Record-Label-Website-Design
3. Tradebox Acid Noir — black, oxblood, procedural grain, oversized typography: https://dribbble.com/shots/26890627-tradebox-Acid-Noir-music-website
4. Music Grunge Website Header — club-poster geometry and hard-grid composition: https://dribbble.com/shots/15072193-Music-Grunge-Website-Header
5. Melodious Interface — atmospheric blurred artwork with readable player controls: https://www.behance.net/gallery/194448783/Melodious-Interface-Music-Player-UI-Cards
6. Last of a Dying Breed — lyric-forward red visual storytelling: https://www.behance.net/gallery/248426381/Last-of-a-Dying-Breed
7. VOID FORM — dark negative space, art collage and high-fashion typography: https://www.behance.net/gallery/247308681/VOID-FORM-AI-Fashion-Lookbook
8. Apple Music lyrics UI — reference for composition and background harmonization only; do not implement unlicensed lyrics: https://support.apple.com/ja-jp/guide/music/musf438ffc97/mac
9. Spicetify Dribbblish — compact playlist/player hierarchy: https://github.com/spicetify/spicetify-themes/blob/master/Dribbblish/README.md
10. Pinterest red collage moodboard (research only): https://www.pinterest.com/pin/red-collage-moodboard-in-2025--960744533009855188/
11. Pinterest dark red collage inspiration (research only): https://in.pinterest.com/pin/dark-red-aesthetic-collage--26880929020169387/
12. React Bits visual demo gallery: https://reactbits.dev/backgrounds/soft-aurora
13. Codrops Creative Hub: https://tympanus.net/codrops/hub/
14. Codrops April 2026 Music Player interactive demo listing: https://tympanus.net/codrops/hub/all/
15. Cinematic audio+WebGL case study: https://tympanus.net/codrops/2025/08/06/building-aether-1-sound-without-boundaries/

### Allowed and disallowed uses

References convey artistic direction; they are not automatically reusable art, albums, photographs, fonts or UI code. Use licensed or original project media (user-provided, authorized music-provider artwork according to terms, original CSS gradients/noise, suitable open-license textures, or assets generated specifically with rights to use). Check third-party attribution and licenses; never hotlink screenshots as hero assets.

## Visual language

Primary: near-black #09090B; secondary #141216; oxblood #39151E; deep wine #591C2B; signal crimson #D42E48; paper/bone #ECE6E0; muted gray #A9A0A5. Per-space atmosphere changes hue within constrained palettes (amber, cobalt, violet, crimson), while UI controls remain readable.

Type: one striking condensed grotesk for display; one clean highly readable sans for UI; optional literary italic/serif for quotes; restrained monospaced metadata. Avoid heavy fonts for long body text. Use locally or legally licensed fonts only. Large heading scale with fluid clamp(), precise line heights, strongly contrasted hierarchy.

Texture: subtle 2–4% grain or SVG turbulence / small repeat tile, photographic halftone or duotone only in selected areas; do not blur functional text. Explicit hard structural edges/lines contrast with softer artwork and atmosphere. Aim 75% calm, 20% high-impact artistic direction, 5% accent spectacle.

Navigation: avoid conventional Spotify columns; preserve accessible, understandable Discover / Compose / Listen destinations. Build a persistent compact player at the edge of the screen (dock/ribbon/rail), with always-visible primary controls during playback, current track, and easy queue access. Expanded immersive Listen mode must have a visible, obvious exit/back affordance. Mobile variant uses native-feeling bottom player/action sheet.

## Screen specifications

### Discover — ‘Enter a feeling’
- First viewport should immediately express *music discovery*, not a static landing page after login.
- Featured personal moodspace or current recommendation with one editorial hero artwork and a decisive action; search discoverable within first viewport; search results should be real Jamendo songs.
- Current moodspace session entry resumes the existing recommendations instead of duplicating the recommendation list from Compose.
- Browse art direction by moods and personal spaces; no made-up catalogs.
- A persistent compact player appears once music has started, with play/pause, title, progress, queue, save.

### Compose — ‘Make a world’
- Personal moodspaces are visual collections, not just CRUD forms. Image and quote modules compose into an intentional collage/editorial canvas. Existing stored images/captions/quotes must remain editable and accessible.
- If missing, propose one minimal image-and-quote creation flow; don't fake uploads or deploy third-party imagery as user data. For deadline safety, use a grid-based modular canvas with reorderable cards rather than an unbounded freeform editor.
- Mood DNA view (energy, melancholy, nostalgia, warmth, intensity) is a real user control ONLY if backend recommendation inputs update and persist.
- Recommendations live here on a space, along with play/queue/save, explanation and feedback; navigation to Listen and back preserves results.
- Empty, loading, update, error states are designed as high-quality first-class screens.

### Listen — ‘Be here, now’
- A true immersive full viewport with artwork as primary focal object, atmospheric secondary image/blur/noise, typography and minimal real controls.
- Player continues seamlessly across routes; no new audio instance per page; use existing Zustand/audio controller.
- Compact mode and full mode share one player state; source moodspace context persists.
- Expandable queue sheet/drawer that doesn't force giant page scroll; keyboard support; save to current space / choose different space; like/dislike and playlist actions remain distinct.
- Optional shader/3D sculptural field behind controls; do NOT block interactivity, drain mobile battery, or obscure album content. Background stops/reduces motion when tab is hidden / `prefers-reduced-motion`.
- No synchronized lyrics unless legally sourced and synchronized; fallback to user-authored note or mood descriptors instead.

## Interaction moments

1. Cover artwork transitions into fullscreen player (Motion shared layout or FLIP), not a loading page.
2. Discover→Compose navigation a brief mask/fade, with route changes not restarting audio.
3. Hover on moodspace tiles: restrained perspective tilt, image reveal or masked image shift (desktop only), disabled reduced-motion.
4. Like/save micro-feedback: 120–240 ms, crisp, no playful bounce explosion.
5. Queue drawer: 220–350 ms transition; always clear focus and Escape behavior.
6. Mood DNA slider adjustment: gentle atmospheric hue and recommended-track changes only after an explicit apply/generate or debounced and cancellable fetch.
7. Visualizer: *only call it audio-reactive if audio analysis is truly available*. If Jamendo CORS blocks analyser wiring, show a deliberately decorative generative motion, not a deceptive audio spectrum.

## Tooling decision matrix

**Recommended for the deadline**
- CSS transforms, layered gradients, masks, grain/noise and `backdrop-filter` sparingly: highest visual impact/lowest risk.
- Motion for React (`motion`) for shared element transitions and player/queue state transitions: https://motion.dev/docs/react-layout-animations
- GSAP + `@gsap/react` only for a few coordinated editorial entrances/reveals: https://gsap.com/resources/React/ ; avoid mixing GSAP/Motion on the same DOM property.
- Playwright/browser screenshots for iterative pixel-level checks.
- `web-design-guidelines` and `vercel-react-best-practices` already installed as agent skills.

**Optional showcase additions**
- React Bits (one adapted grain/aurora/plasma background, not a grab bag): https://reactbits.dev/
- React Three Fiber + Three.js, if there is time for one *optional* background effect only: https://github.com/pmndrs/react-three-fiber
- Spline scene if a licensed/exported scene exists and performance is measured: https://github.com/splinetool/react-spline
- Codrops effects as learning references; reimplement with care, respect license and dependencies: https://tympanus.net/codrops/hub/

**Not recommended as default**
- Installing Spline + R3F + multiple shader/background packages all at once.
- Lenis scrolling throughout a complex editor/player UI; can break nested scrollers. Only selectively add if testing proves the experience improves.
- GPU-heavy full-screen WebGL on every route, oversized WebGL canvases or fake audio analysis.

## Design acceptance checklist

- Real navigation and search, real song stream, real queue, moodspace CRUD, persisted recommendations, feedback and save remain working.
- Discover/Compose/Listen each read as distinct experiences but share typography, tokens, icon language, motion grammar and player identity.
- Prominent album artwork, clear names and song source/license links.
- All required functions accessible from keyboard; screen reader labels, visible focus, disabled/reduced motion, 44px tap targets and sufficient contrast.
- Looks intentional at 1440×900, 1280×800, 390×844 and 360×740; avoid scroll traps, cropped actions, oversized padding.
- Lazy load optional 3D/WebGL; graceful fallback on weak/mobile devices. Test browser tab visibility, background playback, network failure.
- No imported third-party screenshots used as production media without permission.
- No feature regression; lint/tests/build/Playwright browser smoke checks green.

## Codex execution rules

1. First create `docs/DESIGN_SPEC.md` and a complete screen-by-screen inventory of hierarchy, content, interactions, states and assets. Include at least desktop and mobile proposals. No code in this pass.
2. Once design spec is acceptable, code in vertical slices: global shell+compact player → Listen → Compose → Discover → motion/texture → responsive and QA.
3. Use browser screenshots and automated tests after every slice; write before/after comparison notes.
4. Do not rewrite backend algorithms, migrate the database or replace the audio state. Do not reset local user data.
5. Keep changes in focused commits; never claim unsupported browsers or providers tested.
6. Preserve a minimum 2–3 hours for manual verification, deployment and the end-term demo before the hard deadline.
