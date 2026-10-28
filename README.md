<div align="center">

# AFTERIMAGE

### What if a photograph had a soundtrack?

**An audiovisual playground for the places, memories, and moods you can't quite put into words.**

Build a personal world from photographs, thoughts, and a five-dimensional mood profile. Find independent music that belongs in it. Stay for the atmosphere.

**[ENTER AFTERIMAGE ↗](https://afterimage-brown.vercel.app)** · **[SEE ITS WORKING-->](https://drive.google.com/file/d/1GBuHLFQaX0gg_Cv3kkmfzNs2FvmTr4IU/view?usp=sharing)**

</div>

---

## The idea

A photograph can feel like midnight. A sentence can feel like a particular season. A place can remind you of a song you haven't heard yet.

**AFTERIMAGE** explores the space between those things.

Instead of starting with a genre or playlist, you create a **world**—a personal collection of images, writing, and emotional cues—and use it to discover music.

It is an experimental full-stack project, not a replacement for a commercial streaming service.

## Inside AFTERIMAGE

| | Experience |
| --- | --- |
| **Worlds** | Build private audiovisual spaces with photographs, notes, captions, and personal fragments. |
| **Mood DNA** | Tune **Energy, Melancholy, Warmth, Intensity, and Nostalgia** to give a world its emotional direction. |
| **Find my sound** | Get explainable recommendations based on mood tags, written context, track metadata, and your feedback. |
| **Independent discovery** | Search and play music from the Jamendo catalog, with artist and license attribution. |
| **One continuous player** | Queue tracks, control playback, and move through the application without interrupting the music. |
| **Atmospheres** | Artwork-responsive color, motion, immersive player views, and optional Cloudinary image imports. |

> **A note on recommendations:** AFTERIMAGE uses a transparent, rule-based ranking system—not an AI model that claims to understand the emotional content of your photographs. Your selected moods, writing, and listening feedback guide the sound.

## How it works

```text
     PHOTOGRAPHS  +  WRITING  +  MOOD TAGS
                       │
                       ▼
                  YOUR WORLD
                       │
                       ▼
              FIVE-DIMENSION MOOD DNA
                       │
                       ▼
             EXPLAINABLE MUSIC MATCHES
                       │
                       ▼
                 LISTEN · SAVE · REFINE
```

## Built with

| Layer | Technologies |
| --- | --- |
| **Interface** | React 19, Vite 7, Tailwind CSS 4, Zustand |
| **Motion & visuals** | GSAP, Three.js, React Three Fiber |
| **API** | Node.js, Express 5 |
| **Data & sessions** | MongoDB, Mongoose, connect-mongo |
| **Authentication** | Argon2id, server-side sessions, CSRF and origin checks |
| **Music** | Jamendo API |
| **Images** | Sharp, Cloudinary (optional for managed uploads) |
| **Testing** | Vitest, Playwright |
| **Hosting** | Vercel (frontend), Render (API) |

### Architecture

```text
Browser
  │
  ▼
Vercel · React/Vite
  │
  └──── /api/* ────► Render · Express
                           ├── MongoDB · worlds, users, sessions
                           ├── Jamendo · catalog and audio
                           └── Cloudinary · uploaded images
```

Frontend requests use relative `/api` paths, forwarded by Vercel to the Render backend. API credentials and session secrets remain on the server.

## Run locally

**Requirements:** Node.js 24 (see `.nvmrc`), npm, and a reachable MongoDB database.

```bash
# Clone and install
git clone https://github.com/Arnav-Sharma21/AfterImage.git
cd AfterImage
npm ci

# Create your private server configuration
cp server/.env.example server/.env
```

Edit `server/.env` with your own values:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB database connection |
| `SESSION_SECRET` | Random server-side session signing secret (at least 32 characters) |
| `APP_ORIGIN` | `http://127.0.0.1:5173` during local development |
| `JAMENDO_CLIENT_ID` | Live music search and playback |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional managed image uploads |
| `NODE_ENV`, `PORT`, `TRUST_PROXY_HOPS` | Local defaults: `development`, `3001`, `0` |

Generate a new session secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Then start both applications from the repository root:

```bash
npm run dev
```

Open **http://127.0.0.1:5173**. The Vite development server forwards `/api` requests to Express on port `3001`.

**Never commit `server/.env` or put server credentials into `VITE_` variables.** If Cloudinary isn't configured, HTTPS image references remain available; managed uploads require valid write permissions.

## Verify the build

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

End-to-end browser tests require a Playwright-compatible browser setup. Some live music and media tests are opt-in because they depend on external services.

## Deployment

The repository includes a root-level [`render.yaml`](render.yaml) for the Express API and [`vercel.json`](vercel.json) for the Vite build, SPA routing, and `/api` reverse proxy. Because this is an npm workspace, build and install commands run from the **repository root**.

The deployed frontend is **[afterimage-brown.vercel.app](https://afterimage-brown.vercel.app)**. Its server-side `APP_ORIGIN` must match the actual frontend origin exactly.

## Credits & boundaries

- Music and cover artwork are provided at runtime by **Jamendo** and their respective creators. Track-specific Creative Commons terms still apply.
- Visual inspiration is not bundled from other products. Bundled editorial scenes are project-created artwork.
- Bundled fonts and other dependencies retain their original licenses. See [`docs/THIRD_PARTY_NOTICES.md`](docs/THIRD_PARTY_NOTICES.md).
- Managed image delivery URLs may be accessible to anyone who has the URL; account-level access controls protect editing and deletion, not possession of a public delivery URL.

---

<div align="center">

**Make a place. Find its sound.**

</div>
