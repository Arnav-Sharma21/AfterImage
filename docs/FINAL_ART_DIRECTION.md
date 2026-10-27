# AFTERIMAGE — FINAL ART DIRECTION (approved by user)

## Conflict-resolution authority
This document **supersedes the aesthetic guidance, example wireframes and visual mockups** in `docs/DESIGN_SPEC.md` and earlier concept work. Retain technical, data, navigation, accessibility and functional requirements from earlier specs, but do not reproduce their visual layouts.

**REJECTED**: four generated `01-discover-desktop`, `02-compose-desktop`, `03-listen-desktop`, `04-listen-mobile` concepts. The user specifically dislikes their dense lines, cold desktop UI, rigid 01/02/03 navigation, conventional two-column playback page, lime accents and technical dashboard feel. Do not treat any of them as design authority.

**APPROVED SOURCE**: Every image in `design/approved-references/`. Inspect all eleven. The aim is to create original creative compositions derived from the visual language, NOT pixel-perfect copies.

## Visual thesis
A cinematic, intimate, visually rich personal world for music. Combine analog photo grain, emotional close-up imagery, liquid atmospheric lighting, arresting monumental editorial typography, punk/neo-brutalist graphic control, immersive artwork and carefully placed abstract generative accents. Sophisticated UX must remain clear and discoverable.

**Avoid** ordinary SaaS dashboard grids, excessive dividing lines, overuse of acid green, sterile black-and-white sections, bland stock imagery, a Spotify replica, featureless empty space, generic pill components, and a wall of heavy animations.

## Product translation
- Discover: editorial zine / record gallery; working song search remains first-class; moodspace covers and real returned album art become compositional material; distinct sections with hierarchy; always-visible playback affordance.
- Compose: Pinterest-meets-contact-sheet canvas for actual saved photos (HTTPS image URLs minimum), quotes, notes, music and editable Mood DNA. Allow add/edit/delete/reorder media. No fake image upload or fake pixel understanding. Dense emotion, uncluttered controls.
- Listen: genuinely immersive artwork and softly projected colors; player transport and save/like/queue front and center; optional user notes/quote; focus mode and queue drawer; no fake lyrics, no playback interruption.
- Navigation: rethink layout, don't reproduce 01/02/03 navbar. Labels remain immediately understandable. Compact player always reachable when a track exists.

## Ambient visual rule
Make strong still compositions **before** adding motion. CSS gradients/filters/textures and high-quality imagery first; Motion for React for layout and drawer transitions; GSAP only for carefully scoped choreographed sequences. An optional lazy-loaded R3F/Spline shader accent can follow after functional and performance tests. No continuous GPU animations required for normal use.

## Interaction and validation
Maintain existing Express/MongoDB/Jamendo/state architecture, authentication, authorization, search, recommendation snapshots, persisted preferences, actual playback, queue, Save to Space, feedback, and unsaved draft protections. Test desktop and mobile, keyboard and reduced-motion modes. Real browser screenshot reviews are required; implementation source code alone is not visual verification.

## Licenses
Images in reference folder are inspiration-only. Production visuals must come from actual permitted Jamendo covers, user-provided/rights-cleared media, original generated artwork, or properly licensed assets. Do not redistribute the reference JPEGs in production.
