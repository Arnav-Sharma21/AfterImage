# Third-party notices

The application bundles the Latin font subsets needed for its current interface:

- **Barlow Condensed**, weight 600, via `@fontsource/barlow-condensed`. [Fontsource package and upstream information](https://fontsource.org/fonts/barlow-condensed).
- **Source Sans 3**, weights 400 and 600, via `@fontsource/source-sans-3`. [Fontsource package and upstream information](https://fontsource.org/fonts/source-sans-3).

Both font packages include the SIL Open Font License. The exact license files are copied into `client/public/licenses/` and are included in the production build at `/licenses/`. The font names and files are not modified. Retain these notices and licenses when redistributing the bundled fonts.

The atmospheric visuals are CSS compositions. Reference screenshots and lyrics are not shipped. Music and album artwork displayed in Milestone 2 are obtained at runtime from Jamendo; audio files are not bundled or persisted. Each recording displays its artist, source, and Creative Commons license link. Jamendo is the provider, not the author of those recordings. The project is noncommercial and follows the [Jamendo API terms](https://devportal.jamendo.com/api_terms_of_use); track-specific licenses remain applicable. Streaming permission does not imply permission to use a recording in the demo video or redistribute it.

Application dependencies retain their own package license files in the npm installation/lockfile graph; this page is not a replacement for those licenses.
