# AFTERIMAGE — experience and visual design specification

**Status: proposed for approval. Design only; not implemented.** 27 October 2026.

Art direction: **Cinematic Acid Noir × Editorial Neo-Brutalism × Analog Digital Dreaming.**

This specification translates the [design blueprint](DESIGN_BLUEPRINT.md) into changes to the existing product. It preserves the [implementation architecture](IMPLEMENTATION_PLAN.md), [real music integration](MILESTONE_2.md), [recommendation system](MILESTONE_3.md), and [Milestone 3.1 behavior](MILESTONE_3_1.md). Where older planning documents describe unbuilt capabilities, the actual implementation and latest milestone take precedence. The requested expandable player supersedes earlier visual proposals that avoided a bottom player; it does not change audio ownership.

## 1. Direction: a record sleeve you can inhabit

AFTERIMAGE should feel like opening a personal photographic contact sheet and finding its soundtrack. Its distinguishing gesture is an **offset exposure seam**: a crisp rectangular image, a displaced oxblood edge, and a small acid position marker. This motif connects artwork, the active navigation mode, selected fragments, and playback position. It is a compositional device, never a fake waveform or an indication of analysis.

Three distinct rhythms share one identity:

- **Discover — editorial index:** efficient search, aligned track information, a personal-space invitation. Music appears before introductory prose.
- **Compose — annotated contact sheet:** photographs/artwork, a literary quote, personal notes, and an honest account of the space's musical direction. A structured composition with editable parts.
- **Listen — inhabited sleeve:** the recording's artwork occupies the scene; title, transport, and saving are the only competing focal points.

Use roughly 75% calm surface, 20% expressive composition, 5% accent and motion. Black establishes silence; bone carries information; oxblood provides depth; acid marks the current position. Hard alignment and large type create editorial force. Photography and a single italic quote soften it. No large promotional slogan before the task, scrolling lyric simulation, persistent side navigation, decorative metrics, glass panels, cursor replacement, or repeated cards of equal importance.

The product promise remains concrete: **build a space, find music from its contents, listen, and keep what belongs.** Do not imply psychological measurement, image recognition, or audio feature extraction.

## 2. Audit before redesign

### Inputs inspected

Read AGENTS, PRODUCT_BRIEF, DESIGN_BLUEPRINT, IMPLEMENTATION_PLAN, MILESTONE_2, MILESTONE_3, and MILESTONE_3_1. Inspected the routing tree, app shell, auth, space editor/detail/list, search, recommendations, save dialog, player UI, audio host/controller, stores, and global CSS. All five reference images and all thirteen current UI screenshots were viewed individually.

| Local visual reference | Direction retained | Boundary |
| --- | --- | --- |
| `01-lockscreen-monochrome.png` | Monumental image, quiet monochrome space, scale contrast | No copied statue, clock, or waveform |
| `02-lyrics-black.png` | Isolation, confident asymmetry, restrained controls | No copied cover or lyrics |
| `03-lyrics-oxblood.png` | Warm red atmospheric depth | Keep text on a protected readable surface |
| `04-music-library-red.png` | Aligned metadata and controlled crimson | Reject its sidebar/multi-panel music-library arrangement |
| `05-immersive-lyrics.png` | Immersive image field | Transport stays visible; lyrics are outside scope |

Reference files are in [design/references](../design/references/). They are inspiration, not production assets.

The [current UI captures](../design/current-ui/) use prefix `2026_10_26_` and suffix `_screenshot.png`:

| Captures | Observed issue | Design decision |
| --- | --- | --- |
| `11_16_57` | Discover hero and gradient slogan precede real search | Complete layout redesign: search first, personal-space index second |
| `11_17_03`, `11_18_37`, `16_48_20` | Listen emphasizes generic headings and a control box; artwork absent | Complete stage redesign with existing real artwork metadata |
| `11_18_41`, `18_59_34` | Queue rows consume excessive vertical space | Move to a compact accessible drawer, preserve all queue operations |
| `11_29_42` | Space title repeated in a gradient placeholder; music appended below | Shared compositional canvas for detail and edit |
| `16_41_31`, `16_45_22` | Large recommendation/profile panels dominate | Compact rows and progressive explanation; first image predates 3.1, so its Discover duplication must not return |
| `18_58_24`, `18_58_48` | Compose is a long form; fragments/tuning/save feel disconnected | Inline editing within a grid, visible save status/action, integrated music section |
| `18_59_23` | Latest Listen already has origin navigation, Like and Save | Preserve these exact workflows while changing their presentation |
| `18_59_55` | Auth is functional and coherent but visually separate | Token/typography reskin only; retain fields, validation and tabs |

### Code disposition

| Existing implementation | Treatment |
| --- | --- |
| `app/App.jsx` / `ShellHeader`, `.page-shell`, footer | Redesign shell geometry, labeled mode navigation, route-specific spacing and player placement |
| `features/player/ListenPage.jsx` | Complete visual recomposition; extract current `Queue` and `ListenActions` for reuse |
| `features/player/PlayerControls.jsx` | Reskin native controls; replace header summary with compact sleeve; preserve action bindings and actual playback states |
| `features/moodspaces/SpacePage.jsx`, `ComposePage.jsx` | Complete layout redesign; share presentation primitives, retain route/data/draft ownership |
| `FragmentEditor.jsx`, `MoodPicker.jsx`, `SoundTuning.jsx` | Recompose controls with the same persisted fields and validation |
| `features/discover/DiscoverPage.jsx`, `SpaceList.jsx` | Replace hero/card hierarchy with search and editorial index |
| `MusicSearch.jsx`, `TrackRow.jsx`, `SavedTracks.jsx`, `RecommendationPanel.jsx` | Restructure presentation; preserve search, save, feedback and snapshot lifecycle |
| `SaveTrackDialog.jsx`, `ConfirmDialog.jsx`, `Field.jsx`, `Feedback.jsx`, `Button.jsx`, auth | Reskin and improve focus/status placement; retain working behavioral contracts |
| `PlayerHost.jsx`, `audioController.js`, `playerStore.js`, `sessionStore.js`, `services/api.js` | Preserve audio, session, queue and request architecture; no redesign-driven rewrite |
| Express services, models, recommendation rules and provider adapter | No changes in this design scope |

### Capability boundaries that affect the visuals

Current spaces persist title, description, 1–5 mood tags, up to ten quote/note/image-caption fragments, five optional tuning targets, saved tracks, and the last successful recommendation snapshot. **There is no image URL field, image attachment, upload storage, or image analysis.** An image caption is text, not a saved picture.

The immediate canvas therefore uses **actual saved-track artwork**, quotes, notes and captions. Caption artwork clearly as “From saved music,” with its track/source. An empty canvas uses a clearly decorative CSS exposure field. Do not show an enabled upload control or imply that a locally previewed file has been persisted. Personal images remain an explicitly scoped follow-up in section 14.

Other absent capabilities must stay absent: synchronized lyrics, independent global favorites, a trending feed, shuffle/repeat modes, freeform canvas coordinates, theme persistence, and bulk playlist operations. Do not draw controls that suggest they work.

## 3. Information architecture and navigation

Keep current routes and React Router ownership:

| Route | Navigation mode | Screen purpose |
| --- | --- | --- |
| `/` → `/discover` | Discover | Existing default destination; no authenticated marketing homepage |
| `/discover?q=…&page=…` | Discover | Literal provider search and personal-space navigation |
| `/compose` → `/compose/new` | Compose | Start a space |
| `/compose/new`, `/compose/:id` | Compose | Create/edit persisted space fields |
| `/spaces/:id`, optionally `#sound` | Compose | View the same composition, generate/revisit music, edit/delete |
| `/listen` | Listen | Expanded presentation of the existing player |
| `/auth` | Account | Existing registration/login/reauthentication |
| `/about`, unmatched path | Utility | Credits/information and useful 404 |

**Desktop:** slim 64px top header, wordmark left, `01 Discover / 02 Compose / 03 Listen` centered, account action right. Active label plus acid notch/underline; numbers are decorative, labels remain readable. The Compose tab creates a new space as today; an open space's title/breadcrumb identifies the current context. No hover-only navigation.

**Mobile under 768px:** 56px wordmark/account header; three labeled 52px bottom navigation cells plus safe-area inset. An existing current track adds a 72px compact player above this navigation outside Listen. Reserve equivalent document padding; never cover form actions or results. On Listen only the full controls render, with bottom mode navigation still reachable.

**Return behavior:** Listen retains the explicit originating-space link from `sourceSpaceId`. Expansion also records the current local route/query/scroll position in router/UI state, so “Collapse player” returns to the previous page without replaying the song. Direct entry falls back to an accessible origin or Discover. Browser Back behaves normally. A deleted origin produces a useful unavailable-space state and Discover/other save destinations, not a broken player.

All navigation continues through the existing unsaved-editor blocker. Opening the queue or Save dialog does not navigate. Expanding Listen from an unsaved draft must not bypass its leave confirmation. Route changes focus the new heading and announce the page; collapsing restores the launcher where possible without unexpected scroll jumps.

## 4. Screen concept: Listen

### Desktop composition

At 1440×900, use 48px gutters and a 12-column grid. A 480–560px artwork square occupies approximately six columns, offset slightly above the right-hand information block. The right five columns contain a small listening label, the **track title as the primary heading**, artist/album, progress, transport, and separate Like / Save to Space / Queue actions. One column's worth of breathing room gives the composition its tension.

```text
AFTERIMAGE                 01 Discover   02 Compose   03 Listen        Account
← Midnight thoughts                                      Collapse player

┌───────────────────────────────┐       NOW LISTENING
│                               │       Mist
│       ACTUAL TRACK ART        │       Jupiter Makes Me Scream
│                               │       ━━━━━●━━━━━━━━━━━━  1:24 / 3:31
│     fine offset exposure      │           Previous   Pause   Next
└───────────────────────────────┘       Mute ━━━●━━━━ Volume
Source · License                       Like   Save to Space   Queue (4)
Optional note FROM YOUR SPACE           Saved to Midnight thoughts
```

Display the primary cover in its original aspect ratio, contained inside the artwork area. Do not recolor/crop the identifiable cover to fit the brand. The surrounding exposure frame and CSS light field carry AFTERIMAGE's identity. Secondary decorative fields must not obscure attribution or look like analyzed artwork colors. No browser-canvas color extraction is required.

Keep titles complete and allow wrapping. Long titles reduce display size before pushing controls into normal vertical scrolling. Artwork must yield space on short viewports. A caption/quote from the originating space is optional, clearly labeled, and loaded only from that owned space; it is never presented as a lyric. If unavailable, leave space rather than invent text.

### Controls and context

- Bind Play/Pause, Previous, Next, seek, volume, mute and retry to the existing store/controller. Show the actual loading/buffering/error state, never a decorative equalizer.
- Native range input for seeking: actual current position/duration, 44px interaction area, formatted value for assistive technology. Unknown duration disables seeking without a misleading `0:00` claim. No control restarts playback merely by expanding the view.
- **Like** remains space-context feedback. Do not introduce global Likes for search-only tracks or promise feedback acceptance when membership/ownership checks fail.
- **Save to Space** uses the existing dialog, authenticated save endpoint, origin default, pagination, duplicate protection and confirmed success. An existing save shows “Saved to …” plus “Choose another space.” Save does not imply Like.
- The current track is already queued. Its action is **Queue (n)**, not a redundant Add to Queue. Add to Queue remains available on other track rows.
- Attribution stays one step away at most: source/provider and license links in the stage or an accessible details disclosure. Unknown license information is labeled unknown, not licensed by assumption.

### Queue drawer

Extract the current queue list into one reusable drawer. Desktop: right-aligned modal panel approximately 440px wide; mobile: bottom sheet up to 85dvh with a visible Close button. Header contains count and current-track indication. Rows use 48px artwork, title/artist, Play, Up, Down, Remove, and source/license details. Preserve the 50-track cap, canonical deduplication, reorder semantics and paused restoration notice.

Use approximately 88–112px rows, expanding when text or details need room. No drag-only reordering. Current state uses text/icon plus color. Removing the current item follows existing store behavior; focus moves predictably to a neighboring item or header. Escape/backdrop/Close dismiss without affecting audio. Trap focus while open and restore the invoker. Do not stack a Save modal over an open queue: close the drawer before opening the save flow.

### Mobile Listen

Order: header → origin link → artwork → title/artist → seek/time → transport → volume → contextual actions → credits → navigation. Target artwork about 300px at 390px width, reducing toward 240px on a 360×740 viewport. Transport targets are at least 48px, primary Play/Pause 64px. At 200% text zoom, permit scrolling; never clip controls to enforce a full-height poster. No duplicate compact player on this route.

**Acceptance:** navigate while audio plays; position must continue. Origin, Like, Save, queue management, retry, volume, keyboard seek and source links remain functional. A failed artwork request cannot prevent playback or saving.

## 5. Persistent compact and expanded player

The compact player is a small **playback sleeve**, not a full-width music-service toolbar. Desktop: anchored bottom-right, roughly 560–640px wide and 80–88px high, 24px from the viewport edge. It contains 48px artwork, title/artist, Play/Pause, Next, Queue, Save, and Expand. Secondary buttons may use labeled icons with tooltips; accessible names are mandatory. Truncate only compact metadata, with the full title available on expansion. Use the real playback position as a thin progress indication. Reserve lower content space even when the sleeve occupies only part of the width.

Mobile: 72px sleeve above mode navigation; artwork/title area and explicit Expand control open Listen, alongside a generous Play/Pause target. Queue/Save/volume remain in expanded Listen rather than squeezing six tiny buttons into 390px. A noninteractive progress line is announced through the expanded controls, not treated as a tiny seek target.

| Event/state | Required behavior |
| --- | --- |
| No current track | No empty player bar; Listen has a useful discovery/queue empty state |
| Play from any valid result | Sleeve appears; playback is requested from that user gesture |
| Expand/collapse/route navigation | Presentation changes; same audio instance, queue, position and origin |
| Pause | Sleeve remains visible; no false “playing” animation |
| Buffer/error | Compact status and retry/expand affordance; do not lose track metadata |
| Refresh browser | Existing metadata-only queue restores paused; explicit Play resolves a fresh URL |
| Sign out/account change | Existing cleanup clears scoped queue and transient player dialogs |

**Architecture:** keep `PlayerHost` mounted at App level outside route animation. Never key it by pathname or mount it inside Listen. Extract shared presentation/actions from `ListenPage`, use one `QueueDrawer` and existing `SaveTrackDialog`, and keep overlay-open state local to a persistent UI wrapper. Existing Zustand player state remains the only transport/queue truth. Do not add a second audio element, playback timer, persisted stream URL, or recommendation cache. Scope any shared saved-state UI by account, track and destination; display server confirmation rather than an optimistic permanent badge.

## 6. Screen concept: Compose and space detail

### A coherent moodspace, with edit and view modes

`SpacePage` and `ComposePage` share visual building blocks but retain their routes and existing data responsibilities. The title is the header; remove generic oversized instructions and the redundant gradient title preview. A small header status/action row stays visible: **Saved / Unsaved changes / Saving / Save space**, alongside Back or Edit. Put the Save button at the top, associated with the real form, rather than requiring a long scroll.

Desktop ≥1100px: eight columns of composition and four columns of Mood DNA inspector, with a full-width music section below. This is a page composition, not a freeform canvas engine.

```text
Midnight thoughts        Quiet  Restless                   Saved  [Edit space]

┌───────────────────┐  ┌─────────────────────┐  MOOD DNA
│ Saved-track art   │  │ User quote          │  Energy       Auto / Manual
│ unmodified cover  │  │ on bone paper       │  Melancholy   Auto / Manual
│ + source caption  │  └─────────────────────┘  Nostalgia    Auto / Manual
│                   │  Personal note            Warmth       Auto / Manual
└───────────────────┘  Image caption (text)      Intensity    Auto / Manual
Add quote / note / caption (edit mode only)      Interpretation details

YOUR SOUND                     SAVED MUSIC (actual count)       [Find my sound]
Recommendations with short evidence / explicit refresh / playback and saving
```

Use the first available saved-track artwork as the lead; up to three additional available covers may form a small contact strip. These are music images, not uploaded personal images. Empty artwork is an original abstract CSS exposure with an honest invitation to save music. Keep the actual cover clean; grain belongs around it. Quote uses a bone panel and italic type; notes remain on dark surface. Their varying scale creates rhythm without random positioning. DOM order follows reading order.

### Editing

- Title remains a labeled native input (80 characters); description remains a textarea (1,000). Inline composition does not mean fragile `contenteditable` fields.
- Mood chips retain 1–5 selection behavior and clear pressed/selected state.
- Add Quote / Add Note / Add Image Caption creates the existing fragment types. Each fragment retains its ID, type, text field, count and remove action; maximum ten, each up to 1,000 characters.
- Long content expands naturally. A collapsed view has an explicit Read more, never hidden personal content with no recovery.
- Optional Move up/down acts on the existing ordered array; no new coordinate storage or drag library. Do not add an attribution field without schema support; attribution can remain part of the entered quote text.
- Keep dirty checks, unload/navigation guard, validation, revision-conflict handling and inline reauthentication. A failed save retains the draft. Do not reset the form when playback position updates.
- When adding Saved music to the editor, preserve the existing rule that mutations wait until draft changes are saved. Refresh the stored revision after track mutations so the next edit does not overwrite newer data.

### Mood DNA and tuning

Mood DNA means **rule-derived direction**, not a psychological or acoustic measurement. Five simple labeled horizontal scales: Energy, Melancholy, Nostalgia, Warmth, Intensity. No radar polygon, precision confidence score or scientific-looking match percentage.

In view mode, show the last generated profile with its timestamp and a link to Tune in edit mode. In edit mode, each dimension has its existing independent Manual checkbox/toggle and native 0–1, step .05 range. Omitted targets remain Auto. Do not add a global Auto/Manual switch that obscures per-dimension overrides.

An inferred value comes only from an actual returned profile. Before first generation show “Generate music to see the interpreted direction,” not invented midpoints labeled as analysis. Distinguish **saved target**, **draft adjustment**, and **last generated direction**. Moving a slider changes the draft only. Saving persists it; explicit Find/Refresh requests new music. Old results stay labeled as based on the previous saved direction. Use qualitative endpoints and optional numeric value; percentages are target positions, never confidence.

The explanatory disclosure states that selected tags, matched English words, captions, saved music and feedback contribute through documented rules; missing catalog metadata limits matching. Preserve 3.1's explicit Quiet + Restless interpretation and tuning behavior without changing the algorithm.

### Music presentation

“Your sound” and “Saved music” are distinct labeled sections or tabs with actual counts. Desktop may show both in sequence; mobile uses accessible tabs when this avoids a long duplicated surface. Keep data owners mounted or share their loaded view state so tab changes do not trigger generation or reset a session. `#sound` activates/focuses recommendations.

Recommendations use compact editorial rows: 64–80px cover, title/artist/duration, one short evidence sentence, Why this track disclosure, and separate Play / Queue / Save / Like / Less like this. Source/license remain reachable. Do not squeeze six labeled buttons into one mobile line; use a second action row or labeled menu for secondary actions. Play and Save stay directly visible.

Only server-returned explanations may be displayed as reasons. Do not translate a tag into invented listening judgments such as “warm analog bass” unless the returned evidence actually supports it. Saved state and feedback state use different icons and labels. A dislike follows existing removal/Undo behavior, not an unexplained disappearing row.

MongoDB's last successful snapshot remains the sole durable recommendation source. Mount/return performs the owned snapshot GET. User-and-space keys, abort handling, staleness notices and explicit generation remain intact. During refresh, retain previous rows, timestamp and scroll; show “Updating your selection…” near the button. Failed/empty refresh retains the prior useful selection with the existing truthful warning. No autoplay, background generation, hidden provider calls on slider movement, or duplicate list on Discover.

### Mobile Compose

Order: compact title/save status → title/description and mood chips → lead artwork → quote/notes/captions → Mood DNA disclosure → music tabs. The Save action sticks below the header only while editing and leaves room for bottom navigation/player. Default-open tuning when reached via Tune; otherwise the summary can collapse. One column, intentional alternating dark/bone blocks, no horizontal canvas scrolling. The music heading is a clear destination, not a distant footer.

**Acceptance:** edit/save/reload preserves every supported field; old recommendations survive navigation to Listen and back; adjustment/save/refresh uses existing persisted targets; unsaved edits cannot be silently discarded by player expansion. New spaces do not imply nonexistent artwork or recommendations.

## 7. Screen concept: Discover

Search is the first substantive interaction. Replace the tall promotional hero with a small editorial label, a 64–88px “Find a sound” heading and a wide labeled input/button. At 1440×900 the input and several results are visible without scrolling.

The active search occupies about eight columns. A four-column personal-space feature provides “Return to your space,” its actual title/moods, Open space and Find my sound. This is navigation, not a duplicate recommendation surface. Below, an editorial index of owned spaces uses numbers, titles, short descriptions and staggered widths; avoid identical image cards for everything.

```text
Find a sound.                                    RETURN TO YOUR SPACE
[ Song or artist …                       Search ] Midnight thoughts
SEARCH RESULTS / JAMENDO                          Quiet / Restless
01 cover  Title · Artist · duration  Play Queue Save  Open / Find my sound
02 cover  Title · Artist · duration  Play Queue Save
03 cover  Title · Artist · duration  Play Queue Save
Previous / Next
YOUR SPACES       01 Midnight thoughts      02 Slow mornings     Create space
                                                   [compact playback sleeve]
```

Keep actual provider result order and existing pagination. Display returned artwork/title/artist/album/duration and handle missing fields explicitly. Search remains submitted, validated literal title/artist search; optional “Search ambient” suggestions only prefill/submit existing search and must not masquerade as personalized mood recommendations.

Before a query, show the user's existing current track if present and useful owned-space navigation, or a concise search invitation. Do not fabricate featured releases, listening statistics or trending playlists. Space-list responses do not supply full cover collections: use title/mood-derived decorative treatments from existing data, not one extra tracks request per card. A featured space may fetch its owned saved music once if justified, with honest empty/loading states; this is optional, not required to make the screen attractive.

On mobile: heading/input → results → space index. Keep search button reachable when the keyboard is open. Result rows have 56px artwork, wrapping title, artist/duration and a separate action line. Preserve query/page URL state and restore scroll after Listen; there is no recommendation POST on return.

**Acceptance:** actual search, empty/error/pagination, valid playback, queue and saving continue working. Search-only songs do not acquire unsupported Likes. Each Find my sound goes to its owned space's `#sound` section, without duplicating or regenerating that selection.

## 8. Visual system

### Typography

Retain the already self-hosted **Barlow Condensed 600** for wordmark, major titles and small indexed mode labels; use it with restraint so meaningful titles replace repeated giant slogans. Retain **Source Sans 3 400/600** for UI, metadata and prose. Use tabular numerals for times and counts. Optional **Instrument Serif Italic** is reserved for user quotes, not controls; self-host one needed face and retain its [SIL OFL license](https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/OFL.txt). No font dependency is installed in this task.

| Role | Desktop | Mobile | Rules |
| --- | --- | --- | --- |
| Listening track title | 64–96px / 0.98 | 36–48px / 1.02 | Wrap; shrink for long titles |
| Discover heading / space title | 56–88px / 1.0 | 36–48px / 1.05 | One dominant heading per screen |
| Quote | 28–40px / 1.2 | 24–30px / 1.25 | Italic literary voice, no tight tracking |
| Section heading | 24–32px / 1.1 | 22–28px / 1.15 | Condensed display or readable sans |
| Body/control | 16px / 1.5 | 16px / 1.5 | No undersized text inputs |
| Metadata | 14px / 1.4 | 14px / 1.4 | Muted, never illegible |
| Overline | 12–13px / 1.4 | 12px / 1.4 | Short, spaced uppercase; not long prose |

Use fluid clamps, not viewport-only text. Keep body measures around 55–70 characters. Long song titles, URLs and unbroken user input must wrap safely. Default text remains selectable.

### Color tokens and contrast

| Proposed semantic token | Value | Use |
| --- | --- | --- |
| Background | `#09090B` | Main field |
| Surface | `#141216` | Protected UI and drawer surfaces |
| Oxblood | `#39151E` | Atmospheric depth, subdued selected fill |
| Deep wine | `#591C2B` | Decorative exposure layers |
| Primary action | `#B92D40` | Bone-text primary button, inherited crimson |
| Signal crimson | `#D42E48` | Decorative accent/large signal, not small body text |
| Foreground | `#ECE6E0` | Bone text and paper quotation field |
| Secondary text | `#A9A0A5` | Metadata |
| Acid / focus | `#D6FF4C` | Focus outline, active marker, actual progress, small success icon |
| Control outline | `#777078` | Input/control boundary on dark surface |

Calculated opaque sRGB pairs: bone/background **16.07:1**; secondary/surface **7.32:1**; bone/primary action **4.83:1**; acid/background **17.31:1**; control outline/surface **3.88:1**. Signal crimson/background is only **4.06:1**, so do not use it for small text. These calculations are token checks, not a completed rendered accessibility audit. Gradients, opacity, focus placement and all interaction states still require browser verification.

Acid occupies very little area; do not turn every primary button neon. Errors use icon plus bone text and crimson border; success uses a check plus text. No color-only meaning. Bone panels use dark text, with a dark inner focus ring plus an outer contrasting ring as necessary.

### Spacing, surfaces, imagery and icons

- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px. Desktop gutters 48px (32 at narrower widths), mobile 20px (16 at 360px). Main maximum approximately 1600px; Listen remains deliberately bounded.
- Desktop grid: 12 columns / 24px gaps. Tablet: 8 / 20. Mobile: 4 / 16, usually rendered as one reading column. Use whitespace and rules instead of wrapping every group in a panel.
- Corners 0–4px except round transport and selected mood chips. Opaque surfaces, 1px rules, restrained shadows only for overlay separation. Texture never defines an input boundary.
- Static original grain at 2–4% opacity on decorative areas. Do not animate noise continuously or put it over readable fields. No imported copyrighted reference screenshots, celebrity portraits or fake album covers.
- Artwork: stable aspect ratio and dimensions to prevent shifts, lazy-load list images, prioritize only current/lead artwork, graceful failure fallback using title/artist. Preserve source/license links. Do not download/proxy media to create background textures.
- Icons: small consistent 20–24px inline SVG set, roughly 1.5–2px strokes. Heart = Like; bookmark = Save; list-plus = Add to Queue; list = View queue; diagonal arrows = Expand. Never use heart for Save, even where a generated study does. No icon package is necessary for this limited set.
- All interactive targets ≥44×44px, primary touch targets 48px. Native input/range semantics, visible labels, consistent focus/disabled/pending states. Button text remains stable during loading to avoid layout jumps.

## 9. State and interaction specification

| Context/state | Presentation and recovery |
| --- | --- |
| Initial app/session check | Quiet loading surface within shell; no flash of another account's space or queue |
| No spaces | “Make room for a feeling” with Create a space; explain title/moods briefly, no fictitious sample records |
| New empty canvas | Decorative exposure field and Add quote/note/caption; no disabled fake upload tile |
| Search idle / no matches | Search guidance / explicit query with “Try another title or artist”; no fallback fabricated songs |
| Search pending | Fixed-height row placeholders labeled Searching; keep input usable and honor existing request cancellation |
| Missing provider configuration | Existing useful configuration message, no simulated successful result; explanatory Retry only where meaningful |
| First recommendations pending | Reserved rows and “Finding music from this space”; no fake percentages/progress |
| Refresh pending | Previous successful rows remain usable; pending button/status, no full-page skeleton |
| Stale selection | “Your space has changed. Refresh to use its latest direction”; explicit button, no automatic generation |
| Empty/failed refresh | Preserve prior selection with truthful warning; first empty result offers tune/search/retry |
| Image missing/loading | Stable artwork frame, then typography fallback; no broken-image icon or false cover |
| Playback resolving/buffering | Actual status beside transport; seek disabled until available; retain title/artwork |
| Stream unavailable | Inline reason and Retry / Next; failure cannot crash the screen or erase queue |
| Save pending/success/duplicate | Prevent duplicate clicks; confirm only after API response; existing save remains success without a second item |
| Save has no destinations | Create a space link; acknowledge that the user can return to save; do not pretend a space was created |
| Feedback saved | Pressed Like or disclosed dislike/Undo; short status explaining next refresh uses preference |
| Space save failure/conflict | Preserve draft; inline error, field focus, existing conflict link to current saved version |
| Session expires while editing | Existing inline reauthentication; preserve draft and explain save is required afterward |
| Delete space | Existing explicit confirmation; no accidental destructive icon-only click |
| Forbidden/deleted resource | Existing owner-safe response; useful return link, no disclosure of another user's details |
| Route not found | Product shell, concise 404, Discover link; no unrelated marketing page |

Use `role=status` for occasional save/queue notices and `role=alert` for actionable errors. Do not announce playback seconds on every update. Keep status close to the action, not only in a transient toast. Queue additions announce the actual result without unexpectedly opening a modal. Buttons must work equally by keyboard and touch; hover merely clarifies.

## 10. Motion and one optional signature effect

**Recommended baseline: CSS + Motion for React, if approved for implementation. Do not install GSAP or WebGL merely to satisfy a stack list.** No animation packages are currently in the frontend manifest and none are added by this task.

| Interaction | Technique / timing | Reduced-motion version |
| --- | --- | --- |
| Button/focus/selected state | CSS color/opacity, 120–160ms | Instant or brief opacity |
| Queue opening | Motion translate + opacity, 180–240ms | Immediate panel, same focus behavior |
| Compact ↔ Listen | Motion shared artwork layout, 320–380ms; information opacity | Immediate position change, ≤100ms fade |
| Small section/status appearance | CSS or Motion opacity, 120–160ms | No positional motion |
| Route presentation | At most 8px/160ms on decorative/content wrapper | No translation; no delayed controls |
| New result set | Short opacity only after real response | Immediate replacement; preserve focus |

Motion's `layout`/`layoutId` support shared-element presentation; use one identity for the current artwork, not the same ID on every result thumbnail. Keep `PlayerHost` outside any animated route subtree and avoid exit sequencing that holds up navigation. The existing media events remain authoritative. [Motion layout documentation](https://motion.dev/docs/react-layout-animations).

Apply the live system preference through `useReducedMotion`; remove translations, background motion and parallax rather than merely shortening them. The choice must update if the OS setting changes. [Motion reduced-motion documentation](https://motion.dev/docs/react-use-reduced-motion).

**GSAP evaluation:** useful only if a later approved art-direction pass needs a single carefully timed exposure-mask reveal on Listen. Scope a short timeline to its decorative wrapper, clean up via `useGSAP`, use `matchMedia` for motion preferences, and revert on unmount. Do not let GSAP and Motion animate the same properties. No ScrollTrigger/pinning is needed for this product. CSS plus Motion already handles the proposed essential interactions, so **defer GSAP installation**. [GSAP React guidance](https://gsap.com/resources/React/), [matchMedia documentation](https://www.gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/).

### Optional effect: chemical light leak

Evaluate **one original Three.js fullscreen-quad shader**, confined behind the Listen stage: an extremely slow oxblood exposure drifting along the artwork's outer edge. No 3D scene, Spline embed, additional React Three Fiber layer, or React Bits effect stack. This is the only optional WebGL candidate in this specification.

It is decorative and time-driven, explicitly **not audio-reactive**. This avoids coupling to the audio controller or suggesting analysis. The static CSS radial/exposure field must look complete without it. If later prototyped: lazy-load after essential UI, cap at 30fps and DPR 1, use a low-resolution render target, pause while hidden, disable by default on reduced-motion, data-saving or mobile/coarse-pointer contexts, and provide an Atmosphere motion off switch. Do not depend on unreliable device-memory detection as the only safeguard.

Proposed acceptance budgets: no visible control latency, ≤3ms measured render work per effect frame on the test desktop, ≤8MB effect textures, no layout shifts or new network requests during playback. These are targets, not measured results. Context loss, unsupported WebGL and loading failure fall back to CSS. Dispose all geometry/material/texture resources and the renderer on teardown; Three.js requires explicit resource cleanup. [Official cleanup guide](https://threejs.org/manual/pages/cleanup.html).

**Deadline recommendation: ship the CSS atmosphere first.** Only try the optional shader after functional and responsive gates pass; cap the experiment at 45 minutes and remove it if it fails the budgets. Motion should convey continuity; effects must not become the critical path.

## 11. Accessibility and responsive rules

Target WCAG 2.2 AA behavior and test it; do not claim compliance from a palette alone. Maintain landmarks, one screen heading, skip link, logical heading order, visible focus, descriptive controls and text errors. Native dialogs retain focus trapping/restoration and Escape. If using a sheet animation, the underlying modal semantics do not change.

| Width | Layout behavior |
| --- | --- |
| ≥1100px | Three-mode top navigation; Listen split composition; Compose 8+4; Discover 8+4 |
| 768–1099px | Top navigation with compact labels; Compose inspector below canvas; Listen reduces artwork or stacks before controls become cramped |
| <768px | Single reading column; bottom mode navigation; compact player above it; drawers become sheets |
| 360px / short viewport | Smaller artwork and gaps, wrapping action rows, natural vertical scrolling |

Use `dvh` cautiously for overlays, not fixed content height. Account for `env(safe-area-inset-bottom)`, browser chrome, keyboard and zoom. Do not place Save behind a sticky player. At 200% text zoom all functions remain reachable; check reflow at 320 CSS pixels without horizontal page scrolling.

Range inputs need names, keyboard operation and readable values. Disable global single-letter shortcuts unless explicitly designed with text-field guards; no new shortcut system is needed. Time updates should not flood a screen reader. Decorative duplicates and atmosphere layers are `aria-hidden` and ignore pointer events. Cover alt text is concise and avoids repeating adjacent metadata unnecessarily. Forced-colors mode removes decorative fills and retains system borders/focus.

Persistent navigation/player/drawer ordering must be deliberate: content < sticky header/player < modal backdrop < active dialog. Only one modal is interactive at once. Reduced-motion means static atmosphere, no shared-size travel, no scrolling/parallax effects. System cursors and native scrolling remain intact.

## 12. Component inventory and concrete implementation seams

These are proposed component names, not files created in this task. Extract only where reuse or behavioral isolation justifies it.

| Screen/area | Existing seam → proposed change | Data/behavior to preserve |
| --- | --- | --- |
| Shell | `App.jsx` → `ModeNavigation`, route-specific shell classes, `PlayerChrome` | Auth guard, Outlet, sign-out cleanup, PlayerHost lifetime |
| Compact player | `PlayerSummary` → `CompactPlayer` with `TrackArtwork` | Zustand selectors; existing status/transport actions |
| Expanded Listen | `ListenPage` → `ListeningStage`, reusable `ListenActions`, `QueueDrawer` | Current queue item, sourceSpaceId, confirmed save/feedback flows |
| Transport | `PlayerControls` → presentational compact/full variants | Same seek/volume/mute/previous/next semantics and real events |
| Save | `SaveTrackDialog` → new visual layout, same native dialog | Owned-space pagination, origin pinning, idempotence, onSaved |
| Canvas | `SpacePage` + `ComposePage` → `MoodspaceComposition`, `SpaceHeader`, `FragmentBlock` | Existing useSpace, local draft, form submit, revision, owned tracks |
| Editing | `FragmentEditor`, `MoodPicker` → inline controls within composition | IDs, limits, validation, dirty state and navigation blocker |
| Mood DNA | `SoundTuning` + existing profile display → coordinated view/edit presentation | Actual profile vs saved/draft overrides, no client inference |
| Space music | `RecommendationPanel`, `SavedTracks` → `SpaceMusicSection` presentation | Snapshot GET/explicit POST, aborts, user+space key, stale and error behavior |
| Track rows | `TrackRow` → consistent artwork/metadata/action slots | Provider ID, source attribution, origin, Play/Queue/Save/Remove |
| Discovery | `DiscoverPage`, `MusicSearch`, `SpaceList` → editorial search/index composition | Query URL, validation, pagination, no duplicate recommendations |
| Account/utility | `AuthPage`, `AuthForm`, About/404, shared feedback | Existing forms, reauth, errors, links; visual reskin only |

Keep full-page components from subscribing to position changes. Put frequently updating progress/time rendering inside transport; select only required Zustand fields elsewhere. Image/layout transitions must not create extra API effects. Reuse existing request ownership rather than mounting duplicate RecommendationPanels for desktop/mobile variants; responsive CSS should change layout, not duplicate interactive trees. No new global state library or broad component framework is needed.

## 13. Dependency-ordered visual implementation plan

Approval of this document precedes implementation. No production files or package manifests were changed to create it. During implementation, use the installed React best-practices skill alongside frontend-design.

| Order | Work / priority | Concrete completion gate |
| --- | --- | --- |
| 0 | Capture functional baseline, screenshots and route/player assertions | Existing checks recorded; recognize live-provider failures separately |
| 1 | **P0 tokens + shell:** `app.css`, Button/Field/Feedback, App navigation and responsive spacing | Keyboard focus, labels and safe-area clearance at all target sizes; no auth regression |
| 2 | **P0 player foundation:** extract Queue/ListenActions; compact sleeve and shared dialogs | Single audio instance; save/queue work from sleeve; expand/collapse never resets time |
| 3 | **P0 Listen:** actual artwork, hierarchy, controls, origin link, responsive drawer | Real playback, seek, volume, queue and source-default Save pass on desktop/mobile |
| 4 | **P0 Compose/detail:** shared canvas presentation, inline editing, visible Save, Mood DNA and music sections | CRUD/draft guards/tuning persist; same snapshot after Listen and browser refresh |
| 5 | **P0 Discover:** search-first layout, result rows, personal-space index | Search/page/queue/save work; no full recommendation list or new generation calls |
| 6 | **P1 states + account/utility reskin:** empty/errors/conflicts, missing covers, long text, attribution | No hidden controls, fabricated content or erased drafts |
| 7 | **P1 restrained motion:** CSS then only justified Motion interactions | Reduced-motion, modal focus and audio-continuity checks pass |
| 8 | **P0 release QA:** responsive/browser/accessibility and regression sweep | Checklist below complete; unresolved defects documented |
| 9 | **P2 optional shader / GSAP exploration** | Only if time remains after gate 8; otherwise omit entirely |

Finish and verify each vertical presentation slice before starting another. The architecture stays single-origin React/Express/MongoDB/Jamendo. No backend migration or new credentials are needed for the baseline visual pass. Keep working layouts available in Git history; do not mix provider/ranking refactors into visual changes.

Given the 27 October 23:59 IST deadline, reserve at least the final three hours for QA, deployment review and demo preparation. Stop optional visual work by 20:59 IST at the latest, or earlier if less time remains. Reassess remaining time before implementation; do not promise all aesthetic extras. Cut WebGL, GSAP, optional serif, secondary transitions and image attachment first. Preserve the five priority experiences and working controls.

### Verification gates for the later implementation

- Run `npm run lint`, `npm test`, `npm run build`, and available `npm run test:e2e`. Run live music tests with the documented environment only; no mock result may be reported as real provider playback.
- Play a real result, navigate Discover → Compose → Listen → originating space, expand/collapse and open/close queue. Confirm uninterrupted position, one audio element and no duplicate listeners.
- Verify seek, volume/mute, pause/resume, previous/next/ended, unavailable-track retry, reorder/removal and paused refresh restoration.
- Save from Listen with/without origin, a destination beyond the first page, a duplicate save and an empty library. Keep Like separate; confirm feedback survives reload and ownership restrictions remain.
- Revisit recommendations by navigation and refresh; compare track IDs/timestamp; only explicit Refresh may generate. Previous results remain during pending/failed/empty refresh. Switch accounts and spaces to check isolation.
- Edit every space field/tuning dimension; save/reload, test unsaved navigation, conflict and expired session. Save music without losing draft/revision state.
- Test missing artwork, no tracks/spaces/results, long titles, ten long fragments, fifty queued tracks, slow provider, network failure and deleted origin.
- Screenshots at 1440×900, 1280×800, 390×844 and 360×740; also 320px reflow and 200% text zoom. Keyboard-only, screen-reader smoke test, forced colors and reduced motion. Check Safari/iOS where available; Chromium viewport simulation is not a substitute.
- Confirm source/license links, final asset provenance and no concept images used as functional page backgrounds.

This design task does not rerun application tests because it changes no executable code. The previous results in MILESTONE_3_1 (49 unit/database tests, lint/build passing; live browser run with a provider failure and targeted successful retry) remain historical evidence, not verification of the proposed redesign.

## 14. Assets, feasibility and review artifacts

### Asset manifest for implementation

| Asset | Source / work needed | Priority and limitation |
| --- | --- | --- |
| Real track covers | Existing normalized `artworkUrl`; provider/source links | P0; runtime content, never substitute generated art as the real cover |
| AFTERIMAGE wordmark | Existing name set in Barlow Condensed with custom spacing | P0; keep text/accessible name, no raster logo required |
| Exposure seam and atmosphere | Original CSS borders/gradients | P0; works without external media or WebGL |
| Static grain | Create an original small seamless texture, or a lightweight static SVG filter if performance permits | P1; no reference screenshot crop; optional if it harms clarity |
| UI icons | Small original SVG set with consistent geometry | P0; accessible labels are real DOM text/attributes |
| Display/UI fonts | Existing self-hosted Barlow Condensed and Source Sans 3 | P0; preserve notices |
| Literary quote face | Optional Instrument Serif Italic + license | P1; fallback to existing typography if time/budget constrained |
| Editorial photography | Original owned or commissioned/licensed photographs, or clearly decorative original generated assets | P1; retain origin/license records; no fake artist/album associations |
| User content | Existing saved text and track art | P0; no seeded personal records represented as real user data |
| Optional shader | Original small effect, no downloaded Spline scene | P2; CSS fallback is the shipping default |

Do not add arbitrary photos simply to fill every space. Silence and typography are valid empty-state materials. Third-party asset notices belong in the existing notices document during implementation; concept-generation provenance belongs with the studies.

### Explicit follow-up: personal image attachment

The desired long-term visual moodspace includes personal pictures. The current backend cannot persist them. A minimal future capability would add owned image-reference records with HTTPS URL, alt text/caption and optional source credit, validated lengths/counts and existing revision control. It would require image-host/CSP/privacy decisions, broken-link handling, authorization tests and an honest external-host notice. File uploads additionally require storage, size/type validation and lifecycle handling. A caption may contribute to existing text interpretation; raw pixels still do not.

That is a separate functional scope requiring explicit approval because this task prohibits backend changes. **Baseline redesign approval does not silently authorize image storage work.** Until then, compose with saved music artwork and persisted text. No disabled upload theatre, unsaved blob URLs presented as persistent assets, or client-only fake image library.

### Concept artifacts and their authority

See [concept gallery and caveats](../design/concepts/README.md), with exact [generation prompts](../design/concepts/PROMPTS.md). Four original studies cover complete desktop Discover, Compose and Listen, plus mobile Listen. They are coordinated art-direction illustrations, not interactive prototypes or measured responsive screenshots. All functional text, inputs, transport and navigation must be rebuilt as real frontend elements.

**This written specification governs implementation when a generated image differs.** In particular: no invented metadata/credits/counts; bookmark for Save, heart only for Like; no global tuning switch; view mode does not expose unsaved active sliders; desktop compact player is a bounded sleeve, not a full-width bar. Generated atmospheric artwork is illustrative and must never be attributed to the displayed musician as their actual cover.

Skills used for this stage: installed `frontend-design` and built-in imagegen workflow. `frontend-app-builder` was not found in the available local skills; it was not installed or needed. No production code, dependencies, backend logic, audio architecture, commits or deployment are part of this deliverable.

**Review scope:** approve or revise the record-sleeve direction, three screen compositions, navigation/player behavior, and the saved-artwork-first canvas boundary. The next authorized task can implement the approved slices in the order above.
