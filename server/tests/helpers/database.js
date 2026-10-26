import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase } from '../../src/config/database.js';
import { User } from '../../src/models/User.js';
import { Moodspace } from '../../src/models/Moodspace.js';

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
    await Promise.all([User.createCollection(), Moodspace.createCollection()]);
    await Promise.all([User.createIndexes(), Moodspace.createIndexes()]);
    const store = MongoStore.create({ client: mongoose.connection.getClient(), dbName: mongoose.connection.name, collectionName: 'sessions' });
    return {
      store,
      async close() {
        await mongoose.connection.dropDatabase();
        await store.close();
        await mongoose.disconnect();
        await mongod?.stop();
      }
    };
  } catch (error) {
    await mongoose.disconnect();
    await mongod?.stop();
    throw error;
  }
}
