import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { testDatabase } from './helpers/database.js';
import { MediaAsset } from '../src/models/MediaAsset.js';
import { withImageClaims } from '../src/media/mediaService.js';

const origin = 'http://127.0.0.1:5173';
let database, app;
const provider = { configured: true, upload: vi.fn(async (_bytes, id) => ({ url: `https://res.cloudinary.com/test/image/upload/${id}.webp`, assetId: randomUUID(), width: 20, height: 20, bytes: 300 })), destroy: vi.fn(async () => {}) };
beforeAll(async () => { database = await testDatabase(); app = createApp({ nodeEnv: 'test', appOrigin: origin, sessionSecret: 'test-only-secret-over-thirty-two-characters', authLimit: 100 }, database.store, { mediaProvider: provider }); });
afterAll(async () => { await database?.close(); });
async function account() {
  const agent = request.agent(app);
  const csrf = (await agent.get('/api/auth/csrf')).body.data.csrfToken;
  const response = await agent.post('/api/auth/register').set('Origin', origin).set('X-CSRF-Token', csrf).send({ email: `${randomUUID()}@example.com`, displayName: 'Media owner', password: 'a long and private testing phrase' });
  return { agent, token: response.body.data.csrfToken, userId: response.body.data.user.id };
}
const write = (user, method, path, body) => user.agent[method](path).set('Origin', origin).set('X-CSRF-Token', user.token).send(body);
const upload = (user, buffer, name = 'photo.png') => user.agent.post('/api/media').set('Origin', origin).set('X-CSRF-Token', user.token).attach('image', buffer, name);
const pixels = () => sharp({ create: { width: 20, height: 20, channels: 3, background: '#4466aa' } }).png().toBuffer();

describe('managed image imports with mocked external Cloudinary operations', () => {
  it('requires authentication, CSRF and configured storage', async () => {
    await request(app).get('/api/media').expect(401);
    const user = await account();
    await user.agent.post('/api/media').set('Origin', origin).attach('image', await pixels(), 'a.png').expect(403);
    const unconfigured = createApp({ nodeEnv: 'test', appOrigin: origin, sessionSecret: 'test-only-secret-over-thirty-two-characters' }, database.store);
    // A fresh session avoids relying on another app's session secret.
    const agent = request.agent(unconfigured);
    const csrf = (await agent.get('/api/auth/csrf')).body.data.csrfToken;
    const registered = await agent.post('/api/auth/register').set('Origin', origin).set('X-CSRF-Token', csrf).send({ email: `${randomUUID()}@example.com`, displayName: 'Missing media', password: 'a long and private testing phrase' });
    const response = await agent.post('/api/media').set('Origin', origin).set('X-CSRF-Token', registered.body.data.csrfToken).attach('image', await pixels(), 'a.png').expect(503);
    expect(response.body.error.code).toBe('MEDIA_NOT_CONFIGURED');
  });
  it('decodes real bytes, rejects masquerading files and enforces size/count limits', async () => {
    const user = await account();
    const before = provider.upload.mock.calls.length;
    await upload(user, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'photo.jpg').expect(422);
    await upload(user, Buffer.from('not a real image'), 'photo.png').expect(422);
    await upload(user, Buffer.alloc(8 * 1024 * 1024 + 1), 'photo.png').expect(413);
    expect(provider.upload.mock.calls.length).toBe(before);
    const response = await upload(user, await pixels(), 'untrusted.exe').expect(201);
    expect(response.body.data.assetId).toMatch(/^[a-f\d]{24}$/);
    expect((await sharp(provider.upload.mock.calls.at(-1)[0]).metadata()).format).toBe('webp');
    await MediaAsset.insertMany(Array.from({ length: 99 }, () => ({ ownerId: user.userId, publicId: randomUUID(), status: 'ready' })));
    await upload(user, await pixels()).expect(422);
  });
  it('accepts every advertised still-image format based on decoded content', async () => {
    const user = await account();
    for (const format of ['jpeg', 'png', 'webp', 'avif']) {
      const bytes = await sharp({ create: { width: 12, height: 12, channels: 3, background: '#5577aa' } }).toFormat(format).toBuffer();
      await upload(user, bytes, `photo.${format}`).expect(201);
      expect((await sharp(provider.upload.mock.calls.at(-1)[0]).metadata()).format).toBe('webp');
    }
  });
  it('persists uploaded references, prevents cross-owner deletion/attachment and safely removes images', async () => {
    const owner = await account(), other = await account();
    const media = (await upload(owner, await pixels()).expect(201)).body.data;
    const image = { id: randomUUID(), assetId: media.assetId, url: media.url, alt: 'Blue photographic study', caption: 'Quiet blue night' };
    await write(other, 'post', '/api/spaces', { title: 'Stolen', moods: ['Quiet'], images: [image] }).expect(422);
    await write(other, 'delete', `/api/media/${media.assetId}`, {}).expect(404);
    const space = (await write(owner, 'post', '/api/spaces', { title: 'A blue world', moods: ['Quiet'], images: [image] }).expect(201)).body.data;
    expect(space.images[0]).toEqual(image);
    await write(owner, 'delete', `/api/media/${media.assetId}`, {}).expect(409);
    // Two worlds can refer to one owned asset; removing one must retain it.
    const legacy = (await write(owner, 'post', '/api/spaces', { title: 'Legacy URL reference', moods: ['Quiet'], images: [{ id: randomUUID(), url: media.url, alt: 'Legacy image' }] }).expect(201)).body.data;
    const second = (await write(owner, 'post', '/api/spaces', { title: 'A shared memory', moods: ['Quiet'], images: [image] }).expect(201)).body.data;
    await write(owner, 'patch', `/api/spaces/${space.id}`, { revision: 0, images: [] }).expect(200);
    await expect.poll(async () => (await MediaAsset.findById(media.assetId)).status).toBe('ready');
    await write(owner, 'delete', `/api/spaces/${second.id}`, { revision: 0 }).expect(200);
    await expect.poll(async () => (await MediaAsset.findById(media.assetId)).status).toBe('ready');
    await write(owner, 'delete', `/api/media/${media.assetId}`, {}).expect(409);
    await write(owner, 'delete', `/api/spaces/${legacy.id}`, { revision: 0 }).expect(200);
    await write(owner, 'delete', `/api/media/${media.assetId}`, {}).expect(200);
    expect((await MediaAsset.findById(media.assetId)).status).toBe('deleted');
    expect(provider.destroy).toHaveBeenCalled();
  });
  it('pins writes against concurrent deletion, releases failed saves and retains failed cleanup for retry', async () => {
    const owner = await account();
    const media = (await upload(owner, await pixels()).expect(201)).body.data;
    const image = { id: randomUUID(), assetId: media.assetId, url: media.url, alt: 'An owned image' };
    await withImageClaims(owner.userId, [image], async () => {
      await write(owner, 'delete', `/api/media/${media.assetId}`, {}).expect(409);
    });
    expect((await MediaAsset.findById(media.assetId)).pins).toBe(0);
    await expect(withImageClaims(owner.userId, [image], () => { throw new Error('failed write'); })).rejects.toThrow('failed write');
    expect((await MediaAsset.findById(media.assetId)).pins).toBe(0);
    provider.destroy.mockRejectedValueOnce(new Error('external outage'));
    await write(owner, 'delete', `/api/media/${media.assetId}`, {}).expect(502);
    expect((await MediaAsset.findById(media.assetId)).cleanupFailed).toBe(true);
    await write(owner, 'delete', `/api/media/${media.assetId}`, {}).expect(200);
  });
});
