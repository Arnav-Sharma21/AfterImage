import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Moodspace } from '../src/models/Moodspace.js';
import { Track } from '../src/models/Track.js';
import { AppError } from '../src/middleware/errors.js';
import { normalizeJamendoTrack } from '../src/providers/jamendo.js';
import { testDatabase } from './helpers/database.js';

const origin = 'http://127.0.0.1:5173';
const config = { nodeEnv: 'test', appOrigin: origin, sessionSecret: 'music-integration-test-only-secret-at-least-thirty-two', authLimit: 100 };
const track = normalizeJamendoTrack({ id: '123', name: 'Contract test recording', artist_name: 'Test artist', duration: 120, audio: 'https://prod-1.storage.jamendo.com/?trackid=123', license_ccurl: 'https://creativecommons.org/licenses/by/3.0/' });
let database;
let app;
let getTrackCalls = 0;
beforeAll(async () => {
  database = await testDatabase();
  app = createApp(config, database.store, { musicProvider: {
    name: 'jamendo', search: async () => ({ tracks: [track], hasMore: false }),
    getTrack: async id => { getTrackCalls++; if (id === '999') throw new AppError(502, 'MUSIC_PROVIDER_UNAVAILABLE', 'Provider unavailable.'); return { ...track, id: `jamendo:${id}`, providerTrackId: id }; }
  } });
});
afterAll(async () => { await database?.close(); });
async function account(email) {
  const agent = request.agent(app);
  const token = (await agent.get('/api/auth/csrf')).body.data.csrfToken;
  const result = await agent.post('/api/auth/register').set('Origin', origin).set('X-CSRF-Token', token).send({ email, displayName: 'Music listener', password: 'a secure music testing phrase' }).expect(201);
  return { agent, token: result.body.data.csrfToken };
}
function mutation(client, method, path, body = {}) { return client.agent[method](path).set('Origin', origin).set('X-CSRF-Token', client.token).send(body); }

describe('music routes with real MongoDB and an explicitly test-only provider contract', () => {
  it('validates search and playback and returns normalized metadata', async () => {
    await request(app).get('/api/music/search?q=ambient').expect(401);
    const client = await account('search@example.com');
    for (const query of ['', '?q=x', '?q=ambient&limit=1000', '?q=ambient&provider=evil']) await client.agent.get(`/api/music/search${query}`).expect(422);
    const result = await client.agent.get('/api/music/search?q=ambient').expect(200);
    expect(result.body.data[0]).toMatchObject({ title: track.title, provider: 'jamendo' });
    await client.agent.get('/api/music/tracks/jamendo/not-a-number/playback').expect(422);
    const playback = await client.agent.get('/api/music/tracks/jamendo/123/playback').expect(200);
    expect(playback.body.data.streamUrl).toBe(track.streamUrl);
    await client.agent.get('/api/music/tracks/jamendo/999/playback').expect(502);
    await client.agent.get('/api/health').expect(200);
  });
  it('gives a clear missing-credentials response without breaking spaces', async () => {
    const missingApp = createApp(config, database.store);
    const agent = request.agent(missingApp);
    const token = (await agent.get('/api/auth/csrf')).body.data.csrfToken;
    await agent.post('/api/auth/register').set('Origin', origin).set('X-CSRF-Token', token).send({ email: 'missing-key@example.com', displayName: 'No key', password: 'another secure testing phrase' }).expect(201);
    const response = await agent.get('/api/music/search?q=ambient').expect(503);
    expect(response.body.error.code).toBe('MUSIC_NOT_CONFIGURED');
    expect(response.body.error.message).toContain('JAMENDO_CLIENT_ID');
    await agent.get('/api/spaces').expect(200);
  });
  it('saves once atomically, persists metadata without URLs, and preserves existing CRUD', async () => {
    const client = await account('saved-music@example.com');
    const space = (await mutation(client, 'post', '/api/spaces', { title: 'Night', moods: ['Quiet'] }).expect(201)).body.data;
    const path = `/api/spaces/${space.id}/tracks/jamendo/123`;
    await Promise.all([mutation(client, 'put', path).expect(200), mutation(client, 'put', path).expect(200)]);
    const stored = await Moodspace.findById(space.id).lean();
    expect(stored.savedTracks).toHaveLength(1);
    expect(stored.revision).toBe(1);
    const metadata = await Track.findById('jamendo:123').lean();
    expect(metadata.title).toBe(track.title);
    expect(metadata).not.toHaveProperty('streamUrl');
    const saved = await client.agent.get(`/api/spaces/${space.id}/tracks`).expect(200);
    expect(saved.body.data[0]).toMatchObject({ id: 'jamendo:123', streamUrl: null });
    await mutation(client, 'patch', `/api/spaces/${space.id}`, { title: 'Night revised', revision: 1 }).expect(200);
    expect((await client.agent.get(`/api/spaces/${space.id}/tracks`)).body.data).toHaveLength(1);
    await mutation(client, 'delete', path).expect(200);
    await mutation(client, 'delete', path).expect(200);
    expect((await client.agent.get(`/api/spaces/${space.id}/tracks`)).body.data).toEqual([]);
    await mutation(client, 'delete', `/api/spaces/${space.id}`, { revision: 3 }).expect(200);
  });
  it('saves freshly played metadata without another provider call, and expires that cache', async () => {
    const client = await account('listen-save-cache@example.com');
    const owned = (await mutation(client, 'post', '/api/spaces', { title: 'Listen saves', moods: ['Quiet'] }).expect(201)).body.data;
    await client.agent.get('/api/music/tracks/jamendo/456/playback').expect(200);
    const before = getTrackCalls;
    const metadata = await Track.findById('jamendo:456').lean();
    const path = `/api/spaces/${owned.id}/tracks/jamendo/456`;
    await mutation(client, 'put', path).expect(200);
    await mutation(client, 'put', path).expect(200);
    expect(getTrackCalls).toBe(before);
    expect((await Track.findById('jamendo:456').lean()).verifiedAt).toEqual(metadata.verifiedAt);
    expect((await Moodspace.findById(owned.id).lean()).savedTracks).toHaveLength(1);
    expect(metadata).not.toHaveProperty('streamUrl');
    await mutation(client, 'delete', path).expect(200);
    await Track.updateOne({ _id: 'jamendo:456' }, { $set: { verifiedAt: new Date(Date.now() - 6 * 60 * 1000) } });
    await mutation(client, 'put', path).expect(200);
    expect(getTrackCalls).toBe(before + 1);
  });
  it('enforces ownership before provider access and rejects supplied metadata', async () => {
    const owner = await account('track-owner@example.com');
    const outsider = await account('track-outsider@example.com');
    const space = (await mutation(owner, 'post', '/api/spaces', { title: 'Private', moods: ['Warm'] })).body.data;
    const path = `/api/spaces/${space.id}/tracks/jamendo/123`;
    const before = getTrackCalls;
    await mutation(outsider, 'put', path).expect(404);
    await mutation(outsider, 'delete', path).expect(404);
    await outsider.agent.get(`/api/spaces/${space.id}/tracks`).expect(404);
    expect(getTrackCalls).toBe(before);
    await mutation(owner, 'put', path, { title: 'Forged', streamUrl: 'https://evil.example' }).expect(422);
    await mutation(owner, 'put', `/api/spaces/${space.id}/tracks/jamendo/999`).expect(502);
    expect((await Moodspace.findById(space.id)).savedTracks).toHaveLength(0);
  });
});
