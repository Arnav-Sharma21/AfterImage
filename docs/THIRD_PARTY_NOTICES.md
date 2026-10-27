# Third-party notices

The application bundles the Latin font subsets needed for its current interface:

- **Barlow Condensed**, weight 600, via `@fontsource/barlow-condensed`. [Fontsource package and upstream information](https://fontsource.org/fonts/barlow-condensed).
- **Source Sans 3**, weights 400 and 600, via `@fontsource/source-sans-3`. [Fontsource package and upstream information](https://fontsource.org/fonts/source-sans-3).

Both font packages include the SIL Open Font License. The exact license files are copied into `client/public/licenses/` and are included in the production build at `/licenses/`. The font names and files are not modified. Retain these notices and licenses when redistributing the bundled fonts.

The atmospheric visuals are CSS compositions. Reference screenshots and lyrics are not shipped. Music and album artwork displayed in Milestone 2 are obtained at runtime from Jamendo; audio files are not bundled or persisted. Each recording displays its artist, source, and Creative Commons license link. Jamendo is the provider, not the author of those recordings. The project is noncommercial and follows the [Jamendo API terms](https://devportal.jamendo.com/api_terms_of_use); track-specific licenses remain applicable. Streaming permission does not imply permission to use a recording in the demo video or redistribute it.

Application dependencies retain their own package license files in the npm installation/lockfile graph; this page is not a replacement for those licenses.

## Current definitive frontend

The current UI imports **Barlow Condensed 600**, **Manrope 400/600**, and **IBM Plex Mono 400** from their already installed Fontsource packages. All are SIL Open Font License fonts; full license texts remain in `client/public/licenses/`. The latest neon-pink update removes Archivo Black and Cormorant imports from the running frontend. Historical packages/licenses can remain in the repository, but those fonts are not requested by the application.

`client/public/images/night-listener*.webp` and `after-rain*.webp` are original AI-generated editorial assets created for AFTERIMAGE using the built-in image generation tool during the earlier creative implementation on October 27, 2026. They are fictional photographic scenes, not credited to a real photographer or represented as documentary photography. The briefs were an intimate headphone listener beside a rain-streaked night-train window, and a solitary figure in a rain-lit city passage. Optimized 768/1536-pixel WebP variants are bundled locally. No reference image was copied into these files. The original parametric echo ribbon and fallback line composition are application-authored code.

GSAP and its React integration retain their distributed licenses; Three.js, React Three Fiber and Drei retain theirs. No code, screenshots, lyrics or proprietary artwork from Dribbblish, Spicy Lyrics, Beautiful Lyrics or BitChord is bundled. Those projects were studied for interaction principles only.

User-uploaded images are supplied under the user's own rights and stored in the configured Cloudinary account. Public delivery URLs are not private access controls. The UI discloses this, and the backend prevents other accounts from modifying or deleting the asset record. URL-based images remain the user's responsibility. Jamendo artwork is fetched at runtime with its track/source attribution; a recording's Creative Commons license does not automatically establish a separate redistribution license for its cover. Local QA captures containing provider artwork remain ignored by Git.
