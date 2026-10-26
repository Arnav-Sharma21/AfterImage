import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errors.js';

const hashingOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
let dummyHash;

export function safeUser(user) {
  return { id: user._id.toString(), email: user.email, displayName: user.displayName };
}

export async function register({ email, password, displayName }) {
  const passwordHash = await argon2.hash(password, hashingOptions);
  const user = await User.create({ email, displayName, passwordHash });
  return safeUser(user);
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  // Verify a real hash even for unknown accounts to reduce timing differences.
  dummyHash ??= argon2.hash(randomBytes(32), hashingOptions);
  const hash = user?.passwordHash || await dummyHash;
  const valid = await argon2.verify(hash, password);
  if (!user || !valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  return safeUser(user);
}
