import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Moodspace } from '../src/models/Moodspace.js';
import { UserFeedback } from '../src/models/UserFeedback.js';
import { Track } from '../src/models/Track.js';
import { AppError } from '../src/middleware/errors.js';
import { testDatabase } from './helpers/database.js';

const origin = 'http://127.0.0.1:5173';
const config = { nodeEnv: 'test', appOrigin: origin, sessionSecret: 'recommendation-contract-test-only-secret-over-thirty-two', authLimit: 100 };
const fixture = id => ({ id: `jamendo:${id}`, provider: 'jamendo', providerTrackId: String(id), title: `Recommendation fixture ${id}`, artistName: `Artist ${id}`, tags: ['relaxing'], genres: ['ambient'], streamUrl: 'https://prod-1.storage.jamendo.com/test-only', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/', sourceUrl: `https://www.jamendo.com/track/${id}`, isPlayable: true });
let database;
let app;
let calls = 0;
let mode = 'normal';
let pauseQuery;
let releaseQuery;
beforeAll(async () => {
  database = await testDatabase();
  app = createApp(config, database.store, { musicProvider: {
    name: 'jamendo',
    getTrack: async id => { if (mode === 'fail') throw new AppError(502, 'MUSIC_PROVIDER_UNAVAILABLE', 'Test provider unavailable.'); return fixture(id); },
    async getCandidates() {
      calls++;
      if (mode === 'fail') throw new AppError(502, 'MUSIC_PROVIDER_UNAVAILABLE', 'Test provider unavailable.');
      if (mode === 'empty') return [];
      if (mode === 'pause') { mode = 'normal'; pauseQuery(); await new Promise(resolve => { releaseQuery = resolve; }); }
      return [fixture(1), fixture(1), fixture(2), { ...fixture(3), isPlayable: false }];
    }
  } });
});
afterAll(async () => { await database?.close(); });
async function account(email, targetApp = app) {
  const agent = request.agent(targetApp);
  const token = (await agent.get('/api/auth/csrf')).body.data.csrfToken;
  const response = await agent.post('/api/auth/register').set('Origin', origin).set('X-CSRF-Token', token).send({ email, displayName: 'Recommendation test', password: 'a safe recommendation testing phrase' }).expect(201);
  return { agent, token: response.body.data.csrfToken };
}
function mutate(client, method, path, body = {}) { return client.agent[method](path).set('Origin', origin).set('X-CSRF-Token', client.token).send(body); }
async function space(client, title = 'Quiet night') { return (await mutate(client, 'post', '/api/spaces', { title, description: 'calm and peaceful', moods: ['Quiet'] }).expect(201)).body.data; }

describe('recommendation HTTP/database flow with synthetic provider contract fixtures', () => {
  it('persists a bounded, explainable real-model snapshot without stream URLs', async () => {
    const client = await account('reco-snapshot@example.com');
    const owned = await space(client);
    const path = `/api/spaces/${owned.id}/recommendations`;
    const result = await mutate(client, 'post', path, { revision: 0 }).expect(200);
    expect(result.body.data.tracks).toHaveLength(2);
    expect(result.body.data.profile.features.energy).toBeLessThan(.4);
    expect(result.body.data.tracks[0].reasons[0]).toContain('catalog tag');
    expect(result.body.data.tracks[0].streamUrl).toBeNull();
    expect(JSON.stringify((await Moodspace.findById(owned.id).lean()).recommendation)).not.toContain('streamUrl');
    expect(await Track.findById('jamendo:1')).not.toBeNull();
    const refreshed = await client.agent.get(path).expect(200);
    expect(refreshed.body.data.generatedAt).toBe(result.body.data.generatedAt);
    await mutate(client, 'patch', `/api/spaces/${owned.id}`, { revision: 0, description: 'warm and nostalgic' }).expect(200);
    expect((await client.agent.get(path)).body.data.stale).toBe(true);
    await mutate(client, 'post', path, { revision: 0 }).expect(409);
  });
  it('persists one preference, excludes dislikes across spaces, and supports undo', async () => {
    const client = await account('reco-feedback@example.com');
    const owned = await space(client);
    const path = `/api/spaces/${owned.id}/recommendations`;
    await mutate(client, 'post', path, { revision: 0 }).expect(200);
    const reaction = `${path}/jamendo/1/feedback`;
    await mutate(client, 'put', reaction, { reaction: 'like' }).expect(200);
    await mutate(client, 'put', reaction, { reaction: 'like' }).expect(200);
    expect(await UserFeedback.countDocuments({ trackId: 'jamendo:1' })).toBe(1);
    expect((await client.agent.get(path)).body.data.tracks.find(track => track.id === 'jamendo:1').reaction).toBe('like');
    await mutate(client, 'put', reaction, { reaction: 'dislike' }).expect(200);
    expect((await client.agent.get(path)).body.data.tracks.some(track => track.id === 'jamendo:1')).toBe(false);
    const second = await space(client, 'Another quiet place');
    const next = await mutate(client, 'post', `/api/spaces/${second.id}/recommendations`, { revision: 0 }).expect(200);
    expect(next.body.data.tracks.map(track => track.id)).not.toContain('jamendo:1');
    await mutate(client, 'put', reaction, { reaction: 'neutral' }).expect(200);
    expect((await client.agent.get(path)).body.data.tracks.some(track => track.id === 'jamendo:1')).toBe(true);
  });
  it('checks ownership before provider access and rejects forged feedback/data', async () => {
    const owner = await account('reco-owner@example.com');
    const outsider = await account('reco-other@example.com');
    const owned = await space(owner);
    const path = `/api/spaces/${owned.id}/recommendations`;
    await request(app).get(path).expect(401);
    const before = calls;
    await outsider.agent.get(path).expect(404);
    await mutate(outsider, 'post', path, { revision: 0 }).expect(404);
    await mutate(outsider, 'put', `${path}/jamendo/1/feedback`, { reaction: 'like' }).expect(404);
    expect(calls).toBe(before);
    await mutate(owner, 'post', path, { revision: 0, profile: { energy: 1 } }).expect(422);
    await mutate(owner, 'post', path, { revision: 0 }).expect(200);
    await mutate(owner, 'put', `${path}/jamendo/999/feedback`, { reaction: 'like' }).expect(404);
    await mutate(owner, 'put', `${path}/jamendo/1/feedback`, { reaction: 'like', userId: 'other' }).expect(422);
  });
  it('handles empty/provider-failed queries and preserves the last snapshot on failure', async () => {
    const client = await account('reco-failures@example.com');
    const owned = await space(client);
    const path = `/api/spaces/${owned.id}/recommendations`;
    const initial = await mutate(client, 'post', path, { revision: 0 }).expect(200);
    mode = 'fail';
    await mutate(client, 'post', path, { revision: 0 }).expect(502);
    expect((await client.agent.get(path)).body.data.generatedAt).toBe(initial.body.data.generatedAt);
    mode = 'empty';
    const empty = await mutate(client, 'post', path, { revision: 0 }).expect(200);
    expect(empty.body.data.tracks).toEqual([]);
    expect(empty.body.data.warnings.length).toBeGreaterThan(0);
    mode = 'normal';
    const missingApp = createApp(config, database.store);
    const noKey = await account('reco-no-key@example.com', missingApp);
    const noKeySpace = await space(noKey);
    const response = await mutate(noKey, 'post', `/api/spaces/${noKeySpace.id}/recommendations`, { revision: 0 }).expect(503);
    expect(response.body.error.code).toBe('MUSIC_NOT_CONFIGURED');
  });
  it('does not attach a generation after a conflicting edit', async () => {
    const client = await account('reco-race@example.com');
    const owned = await space(client);
    const path = `/api/spaces/${owned.id}/recommendations`;
    const started = new Promise(resolve => { pauseQuery = resolve; });
    mode = 'pause';
    const pending = mutate(client, 'post', path, { revision: 0 }).then(response => response);
    await started;
    await mutate(client, 'patch', `/api/spaces/${owned.id}`, { title: 'Changed during query', revision: 0 }).expect(200);
    releaseQuery();
    expect((await pending).status).toBe(409);
    expect((await client.agent.get(path)).body.data.profile).toBeNull();
  });
  it('validates and persists text fragments without clearing omitted fields', async () => {
    const client = await account('reco-fragments@example.com');
    const owned = await space(client);
    const fragments = [{ id: 'e223f030-456a-42d5-a561-1917c99efb53', type: 'image-caption', text: 'Warm memories' }];
    await mutate(client, 'patch', `/api/spaces/${owned.id}`, { revision: 0, fragments }).expect(200);
    await mutate(client, 'patch', `/api/spaces/${owned.id}`, { revision: 1, title: 'A remembered place' }).expect(200);
    expect((await client.agent.get(`/api/spaces/${owned.id}`)).body.data.fragments).toEqual(fragments);
    await mutate(client, 'patch', `/api/spaces/${owned.id}`, { revision: 2, fragments: [...fragments, ...fragments] }).expect(422);
  });
  it('saves recent server-verified recommendations during a transient lookup failure', async () => {
    const client = await account('reco-cached-save@example.com');
    const owned = await space(client);
    await mutate(client, 'post', `/api/spaces/${owned.id}/recommendations`, { revision: 0 }).expect(200);
    mode = 'fail';
    try {
      await mutate(client, 'put', `/api/spaces/${owned.id}/tracks/jamendo/1`).expect(200);
      expect((await client.agent.get(`/api/spaces/${owned.id}/tracks`)).body.data[0].id).toBe('jamendo:1');
      expect((await Track.findById('jamendo:1').lean()).streamUrl).toBeUndefined();
    } finally { mode = 'normal'; }
  });
});
