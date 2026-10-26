import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

export async function connectDatabase(uri, options = {}) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    maxPoolSize: 10,
    ...options
  });
  return mongoose.connection;
}

export async function databaseReady() {
  if (mongoose.connection.readyState !== 1) return false;
  try {
    await mongoose.connection.db.admin().command({ ping: 1 }, { timeoutMS: 2000 });
    return true;
  } catch {
    return false;
  }
}
