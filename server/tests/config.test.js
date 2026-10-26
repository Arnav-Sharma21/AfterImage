import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config/env.js';
import { createSpaceSchema, updateSpaceSchema } from '../src/validation/spaces.js';

const valid = {
  APP_ORIGIN: 'http://127.0.0.1:5173',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/afterimage_test',
  SESSION_SECRET: 'a-test-only-secret-longer-than-thirty-two-characters'
};

describe('configuration and validation', () => {
  it('rejects missing credentials without printing their values', () => {
    expect(() => readConfig({ ...valid, SESSION_SECRET: '' })).toThrow('SESSION_SECRET');
    expect(() => readConfig({ ...valid, MONGODB_URI: 'secret-invalid-uri' })).toThrow('MONGODB_URI');
    expect(() => readConfig({ ...valid, MONGODB_URI: 'secret-invalid-uri' })).not.toThrow('secret-invalid-uri');
  });
  it('requires an exact HTTPS origin in production', () => {
    expect(() => readConfig({ ...valid, APP_ORIGIN: `${valid.APP_ORIGIN}/` })).toThrow('APP_ORIGIN');
    expect(() => readConfig({ ...valid, NODE_ENV: 'production' })).toThrow('HTTPS');
    expect(readConfig({ ...valid, NODE_ENV: 'production', APP_ORIGIN: 'https://afterimage.example' }).nodeEnv).toBe('production');
  });
  it('rejects duplicate moods, unknown fields and empty updates', () => {
    expect(createSpaceSchema.safeParse({ title: 'Rain', moods: ['Quiet', 'Quiet'] }).success).toBe(false);
    expect(createSpaceSchema.safeParse({ title: 'Rain', moods: ['Quiet'], ownerId: 'other' }).success).toBe(false);
    expect(updateSpaceSchema.safeParse({ revision: 0 }).success).toBe(false);
    expect(updateSpaceSchema.parse({ revision: 0, title: 'New title' })).toEqual({ revision: 0, title: 'New title' });
  });
});
