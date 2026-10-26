import dotenv from 'dotenv';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { readConfig } from './config/env.js';
import { User } from './models/User.js';
import { Moodspace } from './models/Moodspace.js';
import { Track } from './models/Track.js';
import { UserFeedback } from './models/UserFeedback.js';

dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });

async function start() {
  const config = readConfig();
  await connectDatabase(config.mongoUri);
  const models = [User, Moodspace, Track, UserFeedback];
  await Promise.all(models.map(model => model.createCollection()));
  await Promise.all(models.map(model => model.createIndexes()));
  const store = MongoStore.create({ client: mongoose.connection.getClient(), dbName: mongoose.connection.name, collectionName: 'sessions' });
  store.on('error', () => console.error('Session storage is unavailable.'));
  const app = createApp(config, store);
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.info(`AFTERIMAGE API listening on port ${config.port} (${config.nodeEnv}).`);
  });
  let stopping = false;
  async function shutdown(exitCode = 0) {
    if (stopping) return;
    stopping = true;
    const timer = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      await store.close();
      await mongoose.disconnect();
      clearTimeout(timer);
      process.exit(exitCode);
    });
  }
  process.on('SIGTERM', () => { void shutdown(); });
  process.on('SIGINT', () => { void shutdown(); });
  server.on('error', () => {
    console.error('Unable to start the HTTP server. Check PORT and whether it is already in use.');
    void shutdown(1);
  });
}

start().catch(async error => {
  console.error(error.message.startsWith('Invalid configuration:') || error.message.startsWith('APP_ORIGIN')
    ? error.message
    : 'Startup failed. Check MongoDB credentials, network access, database permissions, and server/.env.');
  await mongoose.disconnect();
  process.exitCode = 1;
});
