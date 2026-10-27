# AFTERIMAGE — FINAL MASTER CODEX PROMPT

You are the lead creative frontend engineer, experienced product designer, motion director, and careful full-stack maintainer for AFTERIMAGE, a *working* React/Vite + Express + MongoDB music application. The current product already has real Jamendo music search, working playback/queue, authentication, persistent moodspaces, recommendation snapshots, Tune Your Sound, feedback and Save to Space. This task is **a major real UI/UX transformation**, not a fresh app or another concept exercise.

## 0 — Resolve design conflicts before doing anything

The user has explicitly **REJECTED** the four previously generated mockups (Discover desktop, Compose desktop, Listen desktop, Listen mobile). They are NOT references for visual composition, typography, navbar, accent use, or layout. If their files are still in `design/concepts/`, ignore them. **Never imitate these rejected mockups.**

The **ONLY APPROVED DESIGN INSPIRATION** is the 11 actual reference images in `design/approved-references/` with their README, and the instruction file `docs/FINAL_ART_DIRECTION.md`. Inspect each actual image visually. If any image is missing, report that and do not claim you saw it.

Older `docs/DESIGN_SPEC.md`, `docs/DESIGN_BLUEPRINT.md` and prior plans contain useful behavior/accessibility/architecture requirements, but their visual mockups or aesthetic prescriptions are OVERRIDDEN by `docs/FINAL_ART_DIRECTION.md` and the approved images. Do not recreate the older wireframes.

## 1 — Understand product, preserve its engineering

Read `AGENTS.md`, `docs/FINAL_ART_DIRECTION.md`, `design/approved-references/README.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/MILESTONE_2.md`, `docs/MILESTONE_3.md`, `docs/MILESTONE_3_1.md`, the current React routing/component tree, CSS, state stores and API contracts. Identify only the files you must change. Use the installed `frontend-design` and `vercel-react-best-practices` skills; use `web-design-guidelines` as a final audit. If skill names differ in the environment, locate installed equivalents rather than pretending they ran.

Preserve **every verified workflow**: sign up/in/out; existing ownership/security checks; create/edit/delete spaces; quote/note fragments; music search; real provider results; play/pause/seek/volume; persistent queue through navigation; recommendations, snapshots, refresh and feedback; Tune Your Sound; Save to Space; revision/unsaved-change safeguards; mobile routes. Reuse the existing audio engine and Zustand stores. Do not fork playback state, introduce second audio instances, rewrite the backend, or expose credentials.

## 2 — Mandatory visual thesis

Make AFTERIMAGE feel like **a cinematic digital record sleeve inhabited by a personal moodboard**: underground zine meets luxury editorial, neo-brutalist tension meets soft analog dream. Use striking typographic scale changes, photographic hierarchy, grainy texture, unconventional compositions, dark negative space, art-directed color spills, selective collage, high contrast, disciplined microtype, and purposeful animation. The app should have charisma even in a static screenshot.

Default foundation: near-black, bone white, oxblood/crimson, occasional hot pink and context-sensitive color from user imagery/artwork. Do **not** use acid lime as the recurring app identity. Reflect different user moods with different atmospheres: peaceful spaces need not be red; sad spaces need not be black. Creative freedom is encouraged inside a consistent brand grammar.

Do not create generic SaaS cards, flat text lists, overly sterile aligned grids, huge empty blocks, uniform square rectangles, relentless thin divider lines, artificial neon cyberpunk, a pseudo-scientific analytics dashboard, overwhelming 3D, or a Spotify clone. Avoid both chaos without usable navigation and polished-but-boring boilerplate.

## 3 — Redesign functional experiences

**Discover — immersive editorial music discovery:** Search, playback and queue must remain easy to find. Use meaningful album art, expressive type, asymmetric composition, visual mood prompts and personal space entry points. Product-driven, not a scrolling promotional website. Return actual Jamendo data; no fabricated titles or covers. Avoid recreating the rejected Discover mockup.

**Compose — a genuine visual memory space:** Replace ordinary form/list presentation with a collage/editorial contact-sheet world. First-class support for user-image REFERENCES (minimum: persistent validated HTTPS image URL, optional caption/alt text, edit/remove/reorder, ownership checks) must exist and be visually usable; if absent, implement the smallest safe Express/Mongoose/API extension. Upload from computer is OPTIONAL unless reliably implemented using an appropriate storage provider; do not display fake uploads. Combine images, quotes, notes, moods, Mood DNA controls, saved tracks, and recommendations with one coherent information hierarchy. Keep forms accessible and unsaved edits safe. Keep actual music recommendations in the moodspace, not duplicated on Discover.

**Listen — cinematic focus mode:** One visual focal point: current artwork or authorized moodspace imagery, immersive background illumination/grain, title/artist, visible transport/seeking/volume, Like/Save to Space/Queue and source/license. Expand/collapse between compact accessible persistent player and full experience WITHOUT remounting audio or losing queue/current position. Queue in drawer/sheet, not a giant page list. Optional personal quotes, NOT pretend synchronized lyrics. Distinct desktop + mobile composition. Do not mimic the rejected Listen mockups.

**App shell/navigation:** An unconventional but efficient navigation and useful return paths. Do not use the rejected mockups' numbered 01/02/03 navbar as the default. Small accessible chrome; play controls must not require navigating to Listen just to pause. Support mobile bottom controls only where ergonomically appropriate.

## 4 — Motion, shaders and 3D: restraint with impact

First prove excellent typography/imagery/layout at rest. Use CSS for gradients and grain, `motion/react` where it meaningfully improves React layout/player/drawer transitions. Add GSAP ONLY if there is a concrete independent choreographed sequence (and proper cleanup). Optional one lightweight lazy-loaded ambient WebGL/R3F or Spline signature—choose a small orb/particle treatment informed by approved references 09/10 ONLY when FPS, load time and reduced-motion fallbacks pass. Don't import or bundle every library. Never imply visuals are audio-reactive unless actual sound analysis is supported and legally/technically feasible. No fake lyric sync.

## 5 — Quality gates and exact working process

Create a Git safety checkpoint if the tree is clean and user permits; otherwise report the status without destructive actions. DO NOT push or deploy. Work in reviewed slices, making actual code edits:
A. audit current code/asset availability and define concrete file-level change map (short, not another broad proposal);
B. global art direction tokens + shell and compact player;
C. immersive Listen screen and queue;
D. genuine Compose media/quote canvas and persistent image references;
E. Discover;
F. motion, mobile, accessibility and integration polish.

After each slice, run relevant checks and open the actual app. Capture and **visually inspect screenshots** at 1440x900, 1280x800, 390x844, 360x740. Compare screenshots with approved reference *qualities*, not rejected mockups; fix aesthetic and usability gaps. Measure no horizontal overflow, controls reachable, text readable, correct contrast, keyboard focus and reduced-motion behavior. Verify sign in, saved content, recommendation continuity, music playback, queue, dialogs and refresh on real pages. Keep external provider failures identifiable, not disguised as completed local tests. Run lint, unit/database tests, browser checks, production build and report exact results.

Use production-ready original or appropriately licensed artwork. The reference JPEGs are NOT production assets; don't place them in `client/public` or bundle them into the live site. Use returned legally permitted cover URLs, user-authorized uploads/URLs, CSS procedural art, and original licensed/generated assets. Credit artwork as needed.

## 6 — Deliverables

Implement code, not new image concepts or unexecuted ideas. Update `docs/DESIGN_SPEC.md` so it does not contradict the new approved aesthetics; record implementation details and the image-reference feature. Provide: changed files, functional checklist, representative browser screenshots, automated verification, performance/accessibility notes, actual remaining limitations and exact local testing commands. Work through the slices in order, making real progress, not stopping after another plan. Stop for user decision only if a costly third-party service, new credential, or destructive migration is unavoidable; otherwise make sound, reversible choices. **Do not commit, push or deploy automatically.**

**Begin now by visually inspecting the eleven approved images and auditing the current app. Then implement slice B immediately after the short audit.**
