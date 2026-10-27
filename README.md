# AFTERIMAGE

> An immersive audiovisual world connecting personal photographic moodspaces to independent music discovery and continuous listening.

AFTERIMAGE maps personal aesthetic spaces to real, independent sound. Rather than relying on generic genre tags or commercial algorithmic feeds, users construct private audiovisual worlds combining photography, descriptive prose, 5-dimensional acoustic Mood DNA, and personal fragments to discover explainable music from Jamendo.

---

## The Problem

Music streaming services present discovery through impersonal algorithmic feeds, playlist homogeny, and commercial charts. Personal visual aesthetic—the photographs we take, the atmospheres we inhabit, the memories and words that resonate with us—has no bridge to how we find and experience sound.

## The Solution

AFTERIMAGE introduces **audiovisual worlds**: private, expressive digital spaces that unite tactile visual collage with independent sound. Users tune 5-dimensional Mood DNA (Energy, Melancholy, Warmth, Intensity, Nostalgia), attach photography and personal writing, and receive explainable music recommendations derived from real catalog metadata—played through a continuous, single-engine audio system that never interrupts across navigation.

---

## Application Architecture

```text
User Browser
    │
    │ (Same-Origin Requests to https://<app>.vercel.app)
    ▼
Vercel (React 19 + Vite 7 SPA)
    │
    ├── Static Assets & SPA Routes (client/dist)
    └── Rewrites: /api/(.*) ─────────► Render Web Service (Express 5 API)
                                          │
                                          ├──► MongoDB Atlas (Data & Persistent Sessions)
                                          ├──► Cloudinary (Managed Media Storage)
                                          └──► Jamendo API v3.0 (Music Catalog & Streams)
```

- **Frontend:** React 19, Vite 7, Tailwind CSS v4, GSAP 3 with `@gsap/react`, Three.js with `@react-three/fiber` / `@react-three/drei`, Zustand stores.
- **Audio Host:** Authoritative root-level HTML5 `<audio>` engine maintaining unbroken playback across route changes.
- **Backend API:** Express 5 on Node.js 22+, Helmet CSP, strict CSRF protection, Argon2id password hashing, and Mongoose 9 models.
- **Persistence:** MongoDB Atlas for user accounts, moodspaces, cached track metadata, and `connect-mongo` session storage.
- **Media Storage:** Sharp image normalization (WebP quality 85%, 2400×2400 max, 25 MP limit) with Cloudinary SDK delivery.
- **Music Provider:** Jamendo API v3.0 direct stream resolution with Creative Commons licensing enforcement.

---

## Key Features

1. **Private Account Authentication:** Secure registration and login backed by Argon2id password hashing, 64-hex CSRF handshake tokens, and HttpOnly session cookies.
2. **Personal Audiovisual Worlds:** Create and curate worlds with custom titles, descriptions, up to 12 ordered photographs, personal text fragments (quotes, notes, captions), and optimistic revision tracking preventing multi-tab save collisions.
3. **5-Dimensional Mood DNA:** Direct acoustic tuning sliders controlling Energy, Melancholy, Warmth, Intensity, and Nostalgia.
4. **"Find My Sound" Explainable Recommendations:** Deterministic ranking combining mood tag overlap (45%), acoustic feature similarity (20%), genre compatibility (20%), and user feedback (15%). Displays transparent, truthful explanations without fabricating AI rationales.
5. **Continuous Audio Transport & Queue:** Uninterrupted audio playback across all navigation (`/atlas`, `/signals`, `/worlds/:id`, `/player`), with seeking, volume, mute/unmute, queue reordering, and track saving into owned spaces.
6. **Focus & Atmospheric Immersion:** Dynamic color palettes extracted from album artwork, ambient canvas lighting, and full-screen focus modes.
7. **Adaptive Media Support:** Direct public HTTPS image reference embedding and managed Cloudinary media imports with reference-pinning deletion safeguards.

---

## Core User Workflows

### 1. Account & Session
Register a private account, sign in, and maintain a secure 7-day session. Session expiration preserves in-memory editor drafts and prompts re-authentication without loss of work.

### 2. World Atelier & Mood DNA
Navigate to **New world** (`/worlds/new`). Enter a title, descriptive thoughts, add quotes or notes, and configure 1–5 mood tags and Mood DNA sliders. Add photography via direct HTTPS links or managed imports. Save to persist atomically to MongoDB.

### 3. Independent Music Discovery
Search Jamendo's independent catalog (`/signals`) by song title or artist. Inspect real album artwork, Creative Commons licenses, creator attributions, and track durations. Play results immediately or append them to the listening queue.

### 4. Explainable Soundtracks
Open any saved world and trigger **Find my sound**. The recommendation engine analyzes the world's Mood DNA, tags, and descriptive keywords, queries candidate tracks, and presents scored recommendations with complete explanation cards ("Why this track"). Like or dislike tracks to personalize future generations.

### 5. Immersion & Listening
Expand the **Player** (`/player`) to view the active track sleeve, scrub through audio, manage the shared queue, or enter **Focus mode** for a distraction-free visual environment. Active streams continue seamlessly when navigating back to Worlds.

---

## Local Setup & Installation

### Prerequisites
- Node.js 22.12 or newer (Node 24 LTS recommended, verified on Node 26)
- npm 10+
- Running MongoDB instance (local or MongoDB Atlas connection string)
- Jamendo Client ID ([Jamendo Developer Portal](https://devportal.jamendo.com/))
- *(Optional)* Cloudinary Account ([Cloudinary Console](https://cloudinary.com/))

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/Arnav-Sharma21/AfterImage.git
cd AfterImage

# 2. Install dependencies across workspaces
npm ci

# 3. Configure backend environment
cp server/.env.example server/.env
```

Edit `server/.env` with your values:
- `MONGODB_URI`: Your MongoDB Atlas or local connection string (`mongodb://127.0.0.1:27017/afterimage`)
- `SESSION_SECRET`: Random 64-character hex string:
  ```bash
  node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
  ```
- `APP_ORIGIN`: `http://127.0.0.1:5173` (Vite default dev origin)
- `JAMENDO_CLIENT_ID`: Your Jamendo developer API key
- *(Optional)* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

```bash
# 4. Start local development server (Vite + Express API)
npm run dev
```

Open **http://127.0.0.1:5173** in your browser. Vite proxies `/api` to Express on port 3001.

---

## Environment Variables Reference

### Backend (`server/.env` / Render)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | Yes | API server port (default: `3001` local, `10000` on Render) |
| `APP_ORIGIN` | Yes | Exact frontend origin without trailing slash (e.g. `http://127.0.0.1:5173` locally, `https://<app>.vercel.app` in production) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string with database name |
| `SESSION_SECRET` | Yes | High-entropy secret (≥32 chars) for session signing |
| `TRUST_PROXY_HOPS` | Yes | `0` locally; `1` in production behind reverse proxy (Render) |
| `JAMENDO_CLIENT_ID` | Optional | Jamendo API client ID for live music search and streams |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name for managed image storage |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API Key (requires write/create permissions) |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API Secret |

### Frontend (`client/.env.example` / Vercel)
- No credentials or secrets belong in the frontend.
- `API_PROXY_TARGET=http://127.0.0.1:3001` (used only by Vite dev proxy).

---

## Development & Testing Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start both Vite frontend and Express server concurrently |
| `npm run lint` | Run ESLint across client, server, and test suites |
| `npm test` | Run Vitest unit, API, recommendation, and database integration tests |
| `npm run build` | Build production client bundle into `client/dist` |
| `npm start` | Start production Express server (serves API and static client build) |
| `npm run test:e2e` | Run Playwright E2E browser tests against isolated test server |

### Advanced Test Scenarios

```bash
# Run full E2E suite with real Jamendo audio playback & recommendation checks:
RUN_LIVE_MUSIC_TESTS=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e

# Run managed media import and storage tests:
E2E_MEDIA_FIXTURE=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e tests/e2e/uploads.spec.js

# Standalone live audio decode, seek, and stream verification probe:
CHROMIUM_PATH=/usr/bin/chromium node server/scripts/verify-provider.js
```

---

## Production Deployment Guide

AFTERIMAGE is configured for split deployment: **Vercel** for the React SPA and **Render** for the Express API.

### 1. Backend on Render
1. Create a new **Web Service** on Render connected to this repository.
2. Select **Node** runtime.
3. Build Command: `npm ci`
4. Start Command: `npm run start -w server`
5. Health Check Path: `/api/health`
6. Add the production environment variables listed above (`NODE_ENV=production`, `TRUST_PROXY_HOPS=1`, `APP_ORIGIN=https://<your-vercel-domain>.vercel.app`, MongoDB Atlas URI, Jamendo, Cloudinary).

### 2. Frontend on Vercel
1. Create a new **Project** on Vercel connected to this repository.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `client/dist`
5. Update `vercel.json` in the repository with your Render backend URL:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://<your-render-service>.onrender.com/api/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
6. Deploy. Vercel automatically proxies `/api` calls to Render, preserving same-origin session cookies and avoiding Safari ITP / 3rd-party cookie blocking.

---

## Known Limitations

- **Cloudinary Key Permissions:** Managed image uploads require an API Access Key with write/create permissions enabled in Cloudinary Console (Settings → API Keys). If the key is restricted, the UI displays an informative status banner and HTTPS external image references continue working normally.
- **Jamendo Catalog Scope:** Music search queries independent artists on Jamendo. Tracks are subject to artist licensing terms; recordings under NoDerivatives licenses are excluded from playback.
- **Noncommercial Audio:** All audio streaming is streamed directly from Jamendo for noncommercial project demonstration. No audio files are downloaded, stored, or resold.

---

## Documentation Roadmap

- [`docs/PRE_DEPLOYMENT_AUDIT.md`](docs/PRE_DEPLOYMENT_AUDIT.md) — Comprehensive pre-deployment audit report and test results.
- [`docs/EXPERIENCE_SPEC.md`](docs/EXPERIENCE_SPEC.md) — Visual experience and interaction architecture.
- [`docs/LOCAL_CONFIGURATION.md`](docs/LOCAL_CONFIGURATION.md) — Step-by-step local credential configuration guide.
- [`docs/PRODUCT_BRIEF.md`](docs/PRODUCT_BRIEF.md) — High-level product requirements and problem definition.
- [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md) — End-term evaluation submission checklist.
- [`docs/THIRD_PARTY_NOTICES.md`](docs/THIRD_PARTY_NOTICES.md) — Open source font and library licenses.

---

## License & Attribution

- **Typography:** Barlow Condensed, Manrope, and IBM Plex Mono are distributed under the SIL Open Font License.
- **Editorial Imagery:** Night-listener and rain-passage photographs are original AI-generated editorial artwork created specifically for AFTERIMAGE.
- **Music:** Provided by [Jamendo](https://www.jamendo.com) and licensed under various Creative Commons licenses (CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA).
