import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase } from '../../src/config/database.js';
import { User } from '../../src/models/User.js';
import { Moodspace } from '../../src/models/Moodspace.js';
import { Track } from '../../src/models/Track.js';
import { MediaAsset } from '../../src/models/MediaAsset.js';
import { UserFeedback } from '../../src/models/UserFeedback.js';

export async function testDatabase() {
  // This starts a genuine MongoDB daemon, not a mocked Mongoose implementation.
  // Only the randomly named test database is ever dropped.
  let mongod;
  const dbName = `afterimage_test_${randomUUID().replaceAll('-', '')}`;
  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.24', downloadDir: '/tmp/afterimage-mongodb-binaries', os: { os: 'linux', dist: 'ubuntu', release: '22.04' } },
      instance: { dbName }
    });
    uri = mongod.getUri();
  }
  try {
    await connectDatabase(uri, { dbName });
    const models = [User, Moodspace, Track, UserFeedback, MediaAsset];
    await Promise.all(models.map(model => model.createCollection()));
    await Promise.all(models.map(model => model.createIndexes()));
    const store = MongoStore.create({ client: mongoose.connection.getClient(), dbName: mongoose.connection.name, collectionName: 'sessions' });
    return {
      store,
      async close() {
        await mongoose.connection.dropDatabase().catch(() => {});
        await store.close().catch(() => {});
        await mongoose.disconnect().catch(() => {});
        await mongod?.stop({ doCleanup: true, force: true });
      }
    };
  } catch (error) {
    await mongoose.disconnect().catch(() => {});
    await mongod?.stop({ doCleanup: true, force: true });
    throw error;
  }
}
