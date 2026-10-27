# Local configuration — what to supply yourself

Edit the **existing** `server/.env`, not the frontend environment file. Do not copy the example over a working `.env`.

The inspected local file has MongoDB, session-secret and Jamendo values present. This is a presence check, not a new network-validation claim. All three Cloudinary values are absent.

## Cloudinary

1. Sign into your Cloudinary product environment.
2. Open **Settings → API Keys** for its API key/secret. The cloud name is also available on the product-environment Dashboard. Copy the three values from the same environment. [Official credential instructions](https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials).
3. Add these individual values to `server/.env`:

```dotenv
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The application reads those three variables; it does not read a combined `CLOUDINARY_URL`. No unsigned upload preset or manually created folder is needed. Upload signing and storage requests are implemented on the server. Never place the secret in `client/.env`, a `VITE_` variable, source code or chat.

Stop the current development command with Ctrl+C, then run `npm run dev` again. Environment changes require restarting the API.

While signed in, opening `http://127.0.0.1:5173/api/media/config` should return `configured: true`. That confirms all three variables are present; an actual upload is still needed to verify the credentials. In a world, choose Images → Choose photographs, import an image, add alt text/caption, and save. Reload to verify persistence. Removing an uploaded reference and saving requests safe cleanup when the asset is no longer referenced. Signed delivery URLs are public to anyone who possesses them.

Limits: still JPEG/PNG/WebP/AVIF, 8 MB/file, twelve images/world. Existing HTTPS image links work without Cloudinary.

## Other local values

| Variable | Required value / action |
| --- | --- |
| `MONGODB_URI` | Your running local MongoDB or Atlas connection string. Already present locally; retain the working value. Atlas needs a database user and suitable network access. |
| `SESSION_SECRET` | A private random secret, at least 32 characters. Already present; keep it stable to preserve sessions. For a fresh install only, generate with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. |
| `JAMENDO_CLIENT_ID` | Your Jamendo developer client ID. Already present locally. It is backend-only. No Spotify key is used. |
| `APP_ORIGIN` | `http://127.0.0.1:5173` for the current Vite workflow. The exact browser origin matters for CSRF. |
| `PORT` | `3001` for the local Express API. |
| `NODE_ENV` | `development` locally. |
| `TRUST_PROXY_HOPS` | `0` locally. |

No new AI key, lyrics key, frontend credential, image-upload preset, or payment configuration is needed. Production photography/fonts are bundled; you do not need to source assets to run the app.

`client/.env` is optional. Its only existing setting is `API_PROXY_TARGET=http://127.0.0.1:3001`; Vite already defaults to that target.

## When deploying later

Set the server variables in the host's environment settings, use `NODE_ENV=production` and the actual HTTPS `APP_ORIGIN`, retain MongoDB/session/Jamendo/Cloudinary values, and use the host-assigned port. Set `TRUST_PROXY_HOPS=1` only behind one trusted reverse proxy. Verify database network access and HTTPS cookies on that host. Run `npm run build` before `npm start`. No deployment was performed by this update.
