import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Moodspace } from '../src/models/Moodspace.js';
import { randomUUID } from 'node:crypto';
import { testDatabase } from './helpers/database.js';

const origin = 'http://127.0.0.1:5173';
const password = 'a sufficiently long test phrase';
let database;
let app;

beforeAll(async () => {
  database = await testDatabase();
  app = createApp({ nodeEnv: 'test', appOrigin: origin, sessionSecret: 'test-only-session-secret-at-least-thirty-two-characters', authLimit: 100 }, database.store);
});
afterAll(async () => { await database?.close(); });

async function anonymous() {
  const agent = request.agent(app);
  const response = await agent.get('/api/auth/csrf').expect(200);
  return { agent, token: response.body.data.csrfToken };
}
function mutate(client, method, path, body, token = client.token) {
  return client.agent[method](path).set('Origin', origin).set('X-CSRF-Token', token).send(body);
}
async function account(email) {
  const client = await anonymous();
  const response = await mutate(client, 'post', '/api/auth/register', { email, password, displayName: 'A listener' }).expect(201);
  client.token = response.body.data.csrfToken;
  return client;
}

describe('real MongoDB account and moodspace flow', () => {
  it('persists, edits, reorders and removes validated owned image references', async () => {
    const owner = await account('image-owner@example.com');
    const other = await account('image-other@example.com');
    const images = [
      { id: randomUUID(), url: 'https://images.example.com/rain.jpg', alt: 'Rain on a window', caption: 'Quiet midnight rain' },
      { id: randomUUID(), url: 'https://images.example.com/sun.jpg', alt: 'Late sunlight', caption: 'Warm memories' }
    ];
    const created = await mutate(owner, 'post', '/api/spaces', { title: 'Image world', moods: ['Quiet'], images }).expect(201);
    const id = created.body.data.id;
    expect(created.body.data.images).toEqual(images);
    expect((await owner.agent.get(`/api/spaces/${id}`).expect(200)).body.data.images).toEqual(images);
    await mutate(other, 'patch', `/api/spaces/${id}`, { revision: 0, images: [] }).expect(404);
    const reordered = [{ ...images[1], caption: 'Warm sunset' }, images[0]];
    await mutate(owner, 'patch', `/api/spaces/${id}`, { revision: 0, images: reordered }).expect(200);
    expect((await Moodspace.findById(id).lean()).images.map(image => image.id)).toEqual(reordered.map(image => image.id));
    await mutate(owner, 'patch', `/api/spaces/${id}`, { revision: 0, images: [] }).expect(409);
    await mutate(owner, 'patch', `/api/spaces/${id}`, { revision: 1, title: 'Preserved images' }).expect(200);
    expect((await owner.agent.get(`/api/spaces/${id}`)).body.data.images).toEqual(reordered);
    for (const url of ['http://example.com/a.jpg', 'javascript:alert(1)', 'data:image/svg+xml,test', 'https://localhost/a', 'https://127.0.0.1/a', 'https://10.0.0.1/a', 'https://[::1]/a', 'https://user:password@example.com/a', 'https://example.com:8443/a']) {
      await mutate(owner, 'patch', `/api/spaces/${id}`, { revision: 2, images: [{ ...images[0], url }] }).expect(422);
    }
    await mutate(owner, 'patch', `/api/spaces/${id}`, { revision: 2, images: [images[0], images[0]] }).expect(422);
    await mutate(owner, 'patch', `/api/spaces/${id}`, { revision: 2, images: [{ ...images[0], alt: '' }] }).expect(422);
    await mutate(owner, 'patch', `/api/spaces/${id}`, { revision: 2, images: Array.from({ length: 13 }, () => ({ ...images[0], id: randomUUID() })) }).expect(422);
    const removed = await mutate(owner, 'patch', `/api/spaces/${id}`, { revision: 2, images: [] }).expect(200);
    expect(removed.body.data.images).toEqual([]);
  });
  it('provides liveness/readiness and requires authentication', async () => {
    await request(app).get('/api/health').expect(200);
    await request(app).get('/api/ready').expect(200);
    await request(app).get('/api/spaces').expect(401);
    await request(app).get('/api/does-not-exist').expect(404).expect('Content-Type', /json/);
  });

  it('validates credentials, stores a hash, rotates CSRF, and persists sessions', async () => {
    const client = await anonymous();
    const previous = client.token;
    await mutate(client, 'post', '/api/auth/register', { email: 'bad', password: 'short', displayName: '' }).expect(422);
    const registered = await mutate(client, 'post', '/api/auth/register', { email: '  FIRST@example.com  ', password, displayName: ' First ' }).expect(201);
    expect(registered.body.data.user.email).toBe('first@example.com');
    expect(registered.body.data.user).not.toHaveProperty('passwordHash');
    expect(registered.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(registered.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
    client.token = registered.body.data.csrfToken;
    expect(client.token).not.toBe(previous);
    const stored = await User.findOne({ email: 'first@example.com' }).select('+passwordHash');
    expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
    const me = await client.agent.get('/api/auth/me').expect(200);
    expect(me.body.data.user.id).toBe(stored.id);
    expect(await User.db.collection('sessions').countDocuments({})).toBeGreaterThan(0);
    await mutate(client, 'post', '/api/spaces', { title: 'Rain', moods: ['Quiet'] }, previous).expect(403);
    await mutate(client, 'post', '/api/auth/logout', {}).expect(200);
    await client.agent.get('/api/auth/me').expect(401);
    const csrf = await client.agent.get('/api/auth/csrf').expect(200);
    client.token = csrf.body.data.csrfToken;
    await mutate(client, 'post', '/api/auth/login', { email: 'first@example.com', password: 'wrong' }).expect(401);
    const signedIn = await mutate(client, 'post', '/api/auth/login', { email: 'first@example.com', password }).expect(200);
    expect(signedIn.body.data.user.id).toBe(stored.id);
    const other = await anonymous();
    await mutate(other, 'post', '/api/auth/register', { email: 'first@example.com', password, displayName: 'Duplicate' }).expect(409);
    await mutate(other, 'post', '/api/auth/login', { email: 'absent@example.com', password }).expect(401);
  });

  it('persists create/read/update/delete and rejects stale edits and deletes', async () => {
    const client = await account('owner@example.com');
    const fields = { title: 'After the rain', description: 'A quiet evening.', moods: ['Quiet', 'Dreamlike'] };
    const created = await mutate(client, 'post', '/api/spaces', fields).expect(201);
    const space = created.body.data;
    expect(space).toMatchObject({ ...fields, revision: 0 });
    expect(await Moodspace.findById(space.id).lean()).toMatchObject({ title: fields.title });
    const fetched = await client.agent.get(`/api/spaces/${space.id}`).expect(200);
    expect(fetched.body.data).toEqual(space);
    const changed = await mutate(client, 'patch', `/api/spaces/${space.id}`, { title: 'A different evening', revision: 0 }).expect(200);
    expect(changed.body.data.revision).toBe(1);
    expect(changed.body.data.description).toBe(fields.description);
    await mutate(client, 'patch', `/api/spaces/${space.id}`, { title: 'Outdated tab', revision: 0 }).expect(409);
    await mutate(client, 'delete', `/api/spaces/${space.id}`, { revision: 0 }).expect(409);
    const listed = await client.agent.get('/api/spaces').expect(200);
    expect(listed.body.data).toHaveLength(1);
    expect(listed.body.data[0].title).toBe('A different evening');
    await mutate(client, 'post', '/api/auth/logout', {}).expect(200);
    const csrf = await client.agent.get('/api/auth/csrf');
    client.token = csrf.body.data.csrfToken;
    const login = await mutate(client, 'post', '/api/auth/login', { email: 'owner@example.com', password }).expect(200);
    client.token = login.body.data.csrfToken;
    await client.agent.get(`/api/spaces/${space.id}`).expect(200);
    await mutate(client, 'delete', `/api/spaces/${space.id}`, { revision: 1 }).expect(200);
    expect(await Moodspace.findById(space.id)).toBeNull();
    await client.agent.get(`/api/spaces/${space.id}`).expect(404);
  });

  it('isolates two users across list, detail, update, and delete', async () => {
    const a = await account('isolation-a@example.com');
    const b = await account('isolation-b@example.com');
    const created = await mutate(a, 'post', '/api/spaces', { title: 'Private', moods: ['Warm'] }).expect(201);
    const id = created.body.data.id;
    expect((await b.agent.get('/api/spaces').expect(200)).body.data).toEqual([]);
    await b.agent.get(`/api/spaces/${id}`).expect(404);
    await mutate(b, 'patch', `/api/spaces/${id}`, { title: 'Intrusion', revision: 0 }).expect(404);
    await mutate(b, 'delete', `/api/spaces/${id}`, { revision: 0 }).expect(404);
    expect((await a.agent.get(`/api/spaces/${id}`)).body.data.title).toBe('Private');
  });

  it('rejects forged origins/tokens, malformed requests, and ownership injection', async () => {
    const client = await account('validation@example.com');
    const valid = { title: 'Quiet', moods: ['Quiet'] };
    await client.agent.post('/api/spaces').send(valid).expect(403);
    await client.agent.post('/api/spaces').set('Origin', 'https://evil.example').set('X-CSRF-Token', client.token).send(valid).expect(403);
    await mutate(client, 'post', '/api/spaces', valid, 'é'.repeat(64)).expect(403);
    await client.agent.post('/api/spaces').set('Origin', origin).set('X-CSRF-Token', client.token).set('Content-Type', 'text/plain').send('text').expect(415);
    await client.agent.post('/api/spaces').set('Origin', origin).set('X-CSRF-Token', client.token).set('Content-Type', 'application/json').send('{broken').expect(400);
    await mutate(client, 'post', '/api/spaces', { ...valid, ownerId: 'another-user' }).expect(422);
    await mutate(client, 'post', '/api/spaces', { title: { $gt: '' }, moods: ['Quiet'] }).expect(422);
    await mutate(client, 'post', '/api/spaces', { ...valid, moods: ['Unknown'] }).expect(422);
    await mutate(client, 'post', '/api/spaces', { ...valid, title: 'x'.repeat(81) }).expect(422);
    await client.agent.get('/api/spaces/not-an-id').expect(422);
    await client.agent.get('/api/spaces?limit=1000').expect(422);
  });

  it('paginates only the requesting user’s records', async () => {
    const client = await account('pages@example.com');
    for (const title of ['One', 'Two', 'Three']) await mutate(client, 'post', '/api/spaces', { title, moods: ['Focused'] }).expect(201);
    const first = await client.agent.get('/api/spaces?limit=2').expect(200);
    const second = await client.agent.get('/api/spaces?limit=2&page=2').expect(200);
    expect(first.body.data).toHaveLength(2);
    expect(first.body.meta.hasMore).toBe(true);
    expect(second.body.data).toHaveLength(1);
    expect(second.body.meta.hasMore).toBe(false);
    expect(new Set([...first.body.data, ...second.body.data].map(space => space.id)).size).toBe(3);
  });
});
