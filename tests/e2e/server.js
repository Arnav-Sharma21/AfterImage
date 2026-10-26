import { createApp } from '../../server/src/app.js';
import { testDatabase } from '../../server/tests/helpers/database.js';
import dotenv from 'dotenv';

// Only the optional live music test uses this key. Database/session config below
// always stays isolated from the user's development or Atlas database.
if (process.env.RUN_LIVE_MUSIC_TESTS === '1') dotenv.config({ path: 'server/.env', quiet: true });

const database = await testDatabase();
const app = createApp({ nodeEnv: 'test', appOrigin: 'http://127.0.0.1:4173', sessionSecret: 'temporary-browser-test-secret-over-thirty-two-characters', authLimit: 100, jamendoClientId: process.env.JAMENDO_CLIENT_ID }, database.store);
const server = app.listen(4173, '127.0.0.1');
let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  server.close(async () => { await database.close(); process.exit(0); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
