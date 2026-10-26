import { createApp } from '../../server/src/app.js';
import { testDatabase } from '../../server/tests/helpers/database.js';

const database = await testDatabase();
const app = createApp({ nodeEnv: 'test', appOrigin: 'http://127.0.0.1:4173', sessionSecret: 'temporary-browser-test-secret-over-thirty-two-characters', authLimit: 100 }, database.store);
const server = app.listen(4173, '127.0.0.1');
let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  server.close(async () => { await database.close(); process.exit(0); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
