import { createApp } from '../../server/src/app.js';
import { testDatabase } from '../../server/tests/helpers/database.js';
import dotenv from 'dotenv';

// Only the optional live music test uses this key. Database/session config below
// always stays isolated from the user's development or Atlas database.
if (process.env.RUN_LIVE_MUSIC_TESTS === '1') dotenv.config({ path: 'server/.env', quiet: true });

// Explicitly opt-in external-storage fixture. All validation/auth/database work
// remains real; only the Cloudinary network boundary is replaced in this harness.
const mediaProvider = process.env.E2E_MEDIA_FIXTURE === '1' ? {
  configured: true,
  async upload(buffer, publicId) { return { url: `https://res.cloudinary.com/afterimage-e2e/image/upload/${publicId}.webp`, assetId: publicId, width: 1536, height: 1024, bytes: buffer.length }; },
  async destroy() {}
} : undefined;
const database = await testDatabase();
const app = createApp({ nodeEnv: 'test', appOrigin: 'http://127.0.0.1:4173', sessionSecret: 'temporary-browser-test-secret-over-thirty-two-characters', authLimit: 100, jamendoClientId: process.env.JAMENDO_CLIENT_ID }, database.store, { mediaProvider });
const server = app.listen(4173, '127.0.0.1');
let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  server.close(async () => { await database.close(); process.exit(0); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
