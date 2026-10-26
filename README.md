# AFTERIMAGE

An original music-first application that maps personal visual moodspaces to music discovery and listening.

## Current implementation

The first working slice includes email/password accounts, MongoDB-backed sessions, and private moodspaces with a title, description, and 1–5 mood tags. Create, retrieve, edit, and delete spaces through the React UI. Edits use revisions to prevent stale tabs from overwriting newer changes. Failed saves retain the draft; session expiry offers reauthentication.

Music search, recommendations, playback, image/quote blocks, and advanced effects are later milestones. The interface labels listening as unavailable and contains no fabricated music results.

## Local setup

Use Node.js 24 LTS (`.nvmrc`) and npm. The current dependency set requires Node 22.12 or newer. This workspace was verified on Node 26.11.1; Node 24 itself has not been tested here.

```bash
npm ci
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` before starting:

- `MONGODB_URI`: your own MongoDB Atlas connection string, including a database name such as `afterimage`, or an actual running local MongoDB URI. For Atlas, create a database user with read/write access to this database, URL-encode its password in the URI, and add your development machine's IP to the Atlas network access list. Example shape: `mongodb+srv://<user>:<encoded-password>@<cluster>/afterimage?retryWrites=true&w=majority`.
- `SESSION_SECRET`: a unique random value with at least 32 characters. Generate one locally with the command below. The placeholder is deliberately rejected at startup.
- `APP_ORIGIN`: keep `http://127.0.0.1:5173` for the default development setup. Origin matching is exact: use this address in your browser, rather than switching between it and `localhost`.

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
npm run dev
```

Open **http://127.0.0.1:5173**. Vite proxies `/api` to Express at `http://127.0.0.1:3001`; the browser uses relative API URLs and a necessary HttpOnly session cookie. No CORS configuration or browser-side secret is needed. `client/.env` is optional unless you change the API target.

No Atlas credentials are bundled, and no database is simulated when configuration is missing. The backend fails with an actionable setup error. Keep real `.env` files private; they are ignored by Git. This milestone needs no music-provider key.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Vite and the Node watch server together |
| `npm run lint` | Lint client, server, shared code, and tests |
| `npm test` | Configuration/validation and real MongoDB HTTP integration tests |
| `npm run test:watch` | Watch the same test suite |
| `npm run build` | Build the Vite frontend into `client/dist` |
| `npm start` | Start Express and serve the built frontend on one origin |
| `npm run test:e2e` | Browser workflows against an isolated MongoDB-backed test server; build first |

For a local **built-app** check, run `npm run build`, set `APP_ORIGIN=http://127.0.0.1:3001` in `server/.env`, keep `NODE_ENV=development`, and run `npm start`. Open port 3001. Restore the Vite origin before returning to `npm run dev`.

For production, configure environment variables on the host, set `NODE_ENV=production`, use an exact HTTPS `APP_ORIGIN`, and set `TRUST_PROXY_HOPS=1` only behind one trusted reverse proxy. Secure session cookies require HTTPS. The host supplies `PORT`; Express serves both the built app and API. Deployment has not been performed. See the implementation plan for the proposed Render/Atlas setup and deployment approval requirements.

## Tests and verification

The integration suite starts an actual MongoDB 7.0.24 process using `mongodb-memory-server`. It tests the real Mongoose models, Express routes, Argon2, CSRF, persistent sessions, two-user isolation, revision conflicts, validation, and pagination. The first run downloads an official MongoDB binary (about 82 MB) into `/tmp/afterimage-mongodb-binaries`. Linux needs a compatible glibc/OpenSSL 3 environment. Network access and permission to open local ports are required.

If a binary cannot run on your platform, set `TEST_MONGODB_URI` to a MongoDB server you control. Tests create and drop only a randomly named `afterimage_test_*` database; use a dedicated test server/account with permission to do that. Never use production database credentials for testing. No tests silently fall back to mocked persistence.

Browser tests need Chromium. With Playwright's browser installed:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

Or use an existing system Chromium on this machine:

```bash
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright starts a built-app server on port 4173 with a fresh test database. It exercises desktop/mobile signup, creation, refresh persistence, editing, relogin, deletion, keyboard mood selection, save failure, expired-session recovery, and unsaved-edit guards. Its screenshots/traces are ignored by Git. Test accounts and short-lived test secrets are confined to the disposable database/server.

Current verification and exact limitations are recorded in [the milestone handoff](docs/MILESTONE_1.md). Atlas connectivity, real hosting, HTTPS cookies behind the production proxy, and other browser engines still require environment-specific verification.

## Architecture and request flow

- `client/src/`: React routes and components, shared UI primitives, Tailwind tokens/CSS, API wrapper, Zustand session/editor-status stores. Private draft content stays in the editor's memory.
- `server/src/`: routes → validation/security middleware → controllers → services → Mongoose models; configuration and startup are separate from app construction.
- `shared/moods.js`: one canonical mood vocabulary for the frontend and backend.
- `server/tests/`: real database HTTP tests and validation/configuration tests.
- `tests/e2e/`: browser journeys and the isolated test server.

**Accounts:** request → JSON/origin/CSRF checks and auth throttling → auth controller → service hashes/verifies password → User and Mongo session store → safe user object, rotated CSRF token, and HttpOnly cookie. Sessions expire after at most seven days. No password/hash is returned.

**Moodspaces:** request → session and owner authentication, CSRF for mutations, strict schema validation → space controller → service queries by both resource ID and session user → MongoDB atomic create/read/update/delete → safe space response. Updates and deletes match the expected revision. Another user's ID returns 404; a conflicting owned revision returns 409.

`GET /api/health` checks process liveness; `GET /api/ready` performs a bounded database ping. API responses are JSON, and private responses use `Cache-Control: no-store`. Database/session errors never become successful saves.

Fonts are self-hosted from the Fontsource packages under the SIL Open Font License; see [third-party notices](docs/THIRD_PARTY_NOTICES.md). Inspiration screenshots remain local-only.

## Planning
- [Product brief](docs/PRODUCT_BRIEF.md)
- [Visual reference guide](design/REFERENCES.md)
- [Submission checklist](docs/SUBMISSION_CHECKLIST.md)

**Deadline:** October 27, 2026 at 11:59 PM IST.

> Design reference screenshots are intentionally local-only and ignored by Git, because they include third-party artwork and UI references.
