# AFTERIMAGE - Project instructions for Codex

## Read first
- Read `docs/PRODUCT_BRIEF.md` before planning or coding.
- Read `design/REFERENCES.md` for the intended aesthetic.
- Read `docs/IMPLEMENTATION_PLAN.md` once it exists and keep it updated after approved changes.

## Product
AFTERIMAGE is an original, music-first application. People create visual moodspaces using images, quotes, text, and mood tags, then discover, listen to, and save legally playable music aligned with the mood of each space. The moodspaces must affect actual music discovery, not merely decorate playlists.

## Deadline
End-term deadline: 2026-10-27 23:59 Asia/Kolkata. Optimize for a complete, deployed, reliable MVP with 3-5 working workflows, not the largest possible feature list.

## Stack
- Frontend: React, Vite, JavaScript, Tailwind CSS, Zustand.
- Backend: Node.js, Express, MongoDB Atlas, Mongoose.
- Music provider: an API providing authorized, playable audio (verify rights, API terms, and feasibility). Keep a provider adapter isolated from UI and recommendation logic.
- Choose a sensible hosting platform for frontend and backend.
- Avoid unnecessary frameworks, technologies, or services.

## MVP workflows
1. Authentication and user-specific persistence (if auth is implemented, check ownership on every personal resource).
2. Create, edit, view, and delete moodspaces with descriptions, images/references, quotes, and mood tags.
3. Generate relevant music recommendations from moodspace features with real application ranking logic, save resulting selections.
4. Play actual authorized audio, search/select tracks, and manage queue and favorites/saved tracks.
5. Immersive, accessible and responsive listening interface.

## Non-goals for the deadline
- Universal hum-to-search and full Shazam recognition.
- Copyrighted full-catalog streaming without licensed integration.
- Synchronized lyrics from unlicensed providers.
- Real-time collaboration, mobile-native apps, and complicated freeform canvas drag-and-drop.

## Design system
- Cinematic neo-brutalism; deep charcoal/black and bone text, with controlled crimson/oxblood accents.
- Grain, atmospheric imagery, typography hierarchy, subtle controlled motion, and strong whitespace.
- Distinct experiences: Discover, Compose, Listen. Don't reproduce Spotify's classic sidebar/content/side-panel/player layout.
- Desktop-first but responsive mobile; accessible keyboard focus, reduced-motion support, legible contrast.
- References are inspirational only. Do not copy copyrighted screens or use the screenshots directly as app assets.

## Engineering conventions
- Separate routes, controllers, services, models, validation, and middleware.
- Backend owns validation, auth, authorization, data operations, and recommendation ranking.
- UI owns presentation, loading and error states, and playback control state.
- Never pretend a third-party integration or music stream works; verify it end-to-end.
- No hardcoded fake results presented as real production data.
- No secrets in the code or commits; environment variables and example env templates only.
- Explain tradeoffs for external services and ask before paid or irreversible operations.
- Implement small vertical slices that work from UI to API to database.
- Run relevant lint/build/tests and report what actually passed or failed.
- Keep readable, beginner-understandable code and meaningful Git commits.

## Codex workflow
- For the first task, produce an implementation plan and risk report **before scaffolding code**.
- After the plan, implement one complete workflow at a time.
- Avoid changing unrelated files. Preserve working behavior.
- Explain the request -> controller -> service -> database -> response flow after each backend feature.
- Do not push, deploy, delete, or commit without explicit user request.
