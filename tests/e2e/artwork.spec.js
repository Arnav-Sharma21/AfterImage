import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('live provider artwork persists in real responsive moodboards', async ({ page }, testInfo) => {
  test.skip(process.env.RUN_LIVE_MUSIC_TESTS !== '1' || testInfo.project.name !== 'desktop', 'Opt-in live artwork scenario explicitly covers all four viewports.');
  test.setTimeout(60000);
  const origin = 'http://127.0.0.1:4173';
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  const registered = await page.request.post('/api/auth/register', { headers: { Origin: origin, 'X-CSRF-Token': token }, data: { email: `artwork-${Date.now()}@example.com`, displayName: 'Artwork verification', password: 'a memorable real artwork testing phrase' } });
  expect(registered.status()).toBe(201);
  const csrf = (await registered.json()).data.csrfToken;
  const search = await page.request.get('/api/music/search?q=ambient&page=1');
  expect(search.status()).toBe(200);
  const tracks = (await search.json()).data.filter(track => track.artworkUrl).slice(0, 2);
  expect(tracks).toHaveLength(2);
  const created = await page.request.post('/api/spaces', { headers: { Origin: origin, 'X-CSRF-Token': csrf }, data: {
    title: 'Between the noise', description: 'A quiet place for the music and images that stay with you.', moods: ['Quiet', 'Restless'], soundTuning: { energy: .2 },
    images: tracks.map((track, index) => ({ id: randomUUID(), url: track.artworkUrl, alt: `${track.title} album artwork by ${track.artistName}`, caption: index ? 'Warm memories after midnight.' : 'Quiet, a little restless.' })),
    fragments: [{ id: randomUUID(), type: 'quote', text: 'There is a whole world in the things we keep.' }]
  } });
  expect(created.status()).toBe(201);
  const space = (await created.json()).data;
  console.log('Live artwork credits:', JSON.stringify(tracks.map(({ title, artistName, sourceUrl, licenseUrl }) => ({ title, artistName, sourceUrl, licenseUrl }))));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const [width, height] of [[1440, 900], [1280, 800], [390, 844], [360, 740]]) {
    await page.setViewportSize({ width, height });
    for (const [name, route, image] of [['space-live', `/spaces/${space.id}`, '.canvas-image img'], ['compose-live', `/compose/${space.id}`, '.journal-stage .canvas-image img'], ['discover-live', '/discover', '.space-cover img']]) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect.poll(() => page.locator(image).first().evaluate(element => element.naturalWidth), { timeout: 15000 }).toBeGreaterThan(0);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ animations: 'disabled', path: testInfo.outputPath(`${name}-${width}x${height}.png`), fullPage: true });
      await page.screenshot({ animations: 'disabled', path: testInfo.outputPath(`${name}-${width}x${height}-viewport.png`) });
    }
  }
  expect((await (await page.request.get(`/api/spaces/${space.id}`)).json()).data.images).toEqual(space.images);
  expect(errors).toEqual([]);
});
