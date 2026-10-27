import { expect, test } from '@playwright/test';

test('real Jamendo search, audio controls, queue, route continuity and saved music', async ({ page }, testInfo) => {
  test.skip(process.env.RUN_LIVE_MUSIC_TESTS !== '1', 'Opt-in test requires real Jamendo credentials and external audio access.');
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  const registered = await page.request.post('/api/auth/register', { headers: { Origin: 'http://127.0.0.1:4173', 'X-CSRF-Token': token }, data: { email: `music-${testInfo.project.name}-${Date.now()}@example.com`, displayName: 'Music verification', password: 'a memorable live audio testing phrase' } });
  expect(registered.status()).toBe(201);
  const csrf = (await registered.json()).data.csrfToken;
  const created = await page.request.post('/api/spaces', { headers: { Origin: 'http://127.0.0.1:4173', 'X-CSRF-Token': csrf }, data: { title: 'Live music space', moods: ['Quiet'] } });
  expect(created.status()).toBe(201);
  const spaceId = (await created.json()).data.id;
  await page.goto('/discover');
  await page.getByLabel('Search by song title or artist').fill('ambient');
  await page.getByRole('button', { name: 'Search music', exact: true }).click();
  const rows = page.getByRole('list', { name: 'Music search results' }).locator('li');
  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  expect(await rows.count()).toBeGreaterThan(1);
  await expect.poll(() => rows.first().locator('img').evaluate(image => image.naturalWidth), { timeout: 15000 }).toBeGreaterThan(0);
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('music-search.png') });
  const title = await rows.first().locator('h3').innerText();
  const selectedArtwork = await rows.first().locator('img').getAttribute('src');
  const secondArtwork = await rows.nth(1).locator('img').getAttribute('src');
  const secondTrackId = new URL(await rows.nth(1).getByRole('link', { name: 'Jamendo', exact: true }).getAttribute('href')).pathname.split('/').pop();
  await rows.first().getByRole('button', { name: `Play ${title}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.querySelector('audio').currentTime), { timeout: 25000 }).toBeGreaterThan(1);
  await rows.nth(1).getByRole('button', { name: /^Queue / }).click();
  await page.getByRole('link', { name: 'Listen', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Back to Discover', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save to Space', exact: true }).click();
  await page.getByLabel('Choose your space').selectOption(spaceId);
  await page.getByRole('dialog').getByRole('button', { name: 'Save track', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('Saved to your space.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await page.evaluate(() => document.querySelector('audio').paused)).toBe(true);
  await page.getByLabel('Track position', { exact: true }).fill('10');
  await expect.poll(() => page.evaluate(() => document.querySelector('audio').currentTime)).toBeGreaterThanOrEqual(9);
  await page.getByLabel('Volume', { exact: true }).fill('0.3');
  expect(await page.evaluate(() => document.querySelector('audio').volume)).toBeCloseTo(.3);
  await page.getByRole('button', { name: 'Mute', exact: true }).click();
  expect(await page.evaluate(() => document.querySelector('audio').muted)).toBe(true);
  await page.getByRole('button', { name: 'Unmute', exact: true }).click();
  await expect(page.locator('.record-sleeve')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `design/creative-verification/listen-${testInfo.project.name}.png` });
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('listen.png') });
  await page.getByRole('button', { name: 'View queue', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Listening queue' })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('listitem')).toHaveCount(2);
  await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `design/creative-verification/queue-${testInfo.project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Focus mode', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Exit focus', exact: true })).toBeVisible();
  expect(await page.locator('audio').count()).toBe(1);
  await expect(page.locator('.room-story')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `design/creative-verification/focus-${testInfo.project.name}.png` });
  await page.getByRole('button', { name: 'Exit focus', exact: true }).click();
  if (testInfo.project.name === 'desktop') {
    for (const [width, height] of [[1440, 900], [1280, 800], [390, 844], [360, 740]]) {
      await page.setViewportSize({ width, height });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `design/creative-verification/listen-${width}x${height}.png` });
      await page.screenshot({ animations: 'disabled', path: testInfo.outputPath(`listen-${width}x${height}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.querySelector('audio').paused)).toBe(false);
  const source = await page.evaluate(() => document.querySelector('audio').currentSrc);
  const firstTrackId = new URL(source).searchParams.get('trackid');
  await page.getByRole('link', { name: 'Compose', exact: true }).click();
  expect(await page.locator('audio').count()).toBe(1);
  expect(await page.evaluate(() => document.querySelector('audio').currentSrc)).toBe(source);
  expect(await page.evaluate(() => document.querySelector('audio').currentTime)).toBeGreaterThan(9);
  await expect(page.locator('.compact-player')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `design/creative-verification/compact-player-${testInfo.project.name}.png` });
  await page.getByRole('link', { name: 'Listen', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expectLiveStream(page, secondTrackId);
  await expect.poll(() => page.evaluate(() => document.querySelector('audio').currentTime), { timeout: 20000 }).toBeGreaterThan(.2);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByLabel('Track position', { exact: true }).fill('0');
  await expect.poll(() => page.evaluate(() => document.querySelector('audio').currentTime)).toBeLessThan(1);
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expectLiveStream(page, firstTrackId);
  await expect.poll(() => page.evaluate(() => document.querySelector('audio').duration), { timeout: 15000 }).toBeGreaterThan(10);
  const duration = await page.evaluate(() => document.querySelector('audio').duration);
  await page.getByLabel('Track position', { exact: true }).fill(String(Math.floor((duration - .6) * 10) / 10));
  await expectLiveStream(page, secondTrackId);
  await page.goto(`/spaces/${spaceId}`);
  const saved = page.getByRole('list', { name: 'Saved music' });
  await expect(saved.getByRole('heading', { name: title })).toBeVisible();
  await page.reload();
  await expect(saved.getByRole('heading', { name: title })).toBeVisible();
  expect(await page.evaluate(() => document.querySelector('audio').paused)).toBe(true);
  await saved.getByRole('button', { name: `Play ${title}`, exact: true }).click();
  // One genuine user retry for Jamendo's intermittent empty exact-ID response.
  await expect.poll(async () => (await page.evaluate(() => document.querySelector('audio').currentTime)) > .5 || await page.getByRole('alert').count() > 0, { timeout: 25000 }).toBe(true);
  if (await page.getByRole('alert').count()) await saved.getByRole('button', { name: `Play ${title}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.querySelector('audio').currentTime), { timeout: 25000 }).toBeGreaterThan(.5);
  await saved.getByRole('button', { name: `Remove ${title} from this space` }).click();
  await expect(saved).not.toBeVisible();
  await page.reload();
  await expect(page.getByText(/No music saved here yet/)).toBeVisible();
  await page.getByRole('link', { name: 'Listen', exact: true }).click();
  // An explicit test-only upstream failure must be recoverable, not a crash.
  await page.route('**/api/music/tracks/*/*/playback', route => route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: { code: 'MUSIC_PROVIDER_UNAVAILABLE', message: 'Provider unavailable during this test.' } }) }), { times: 1 });
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Provider unavailable');
  await page.getByRole('button', { name: 'Retry playback', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.querySelector('audio').currentTime), { timeout: 25000 }).toBeGreaterThan(.2);
  // Real provider covers selected as image references in the isolated account.
  // No reference-board assets, generated covers or fake provider data are used.
  if (testInfo.project.name === 'desktop') {
    const currentSpace = (await (await page.request.get(`/api/spaces/${spaceId}`)).json()).data;
    const updated = await page.request.patch(`/api/spaces/${spaceId}`, { headers: { Origin: 'http://127.0.0.1:4173', 'X-CSRF-Token': csrf }, data: {
      revision: currentSpace.revision, title: 'Between the noise', description: 'A quiet place for the music and images that stay with you.',
      images: [selectedArtwork, secondArtwork].map((url, index) => ({ id: crypto.randomUUID(), url, alt: `Selected Jamendo album artwork ${index + 1}`, caption: index ? 'Warm memories after midnight.' : 'Quiet, a little restless.' })),
      fragments: [{ id: crypto.randomUUID(), type: 'quote', text: 'There is a whole world in the things we keep.' }]
    } });
    expect(updated.status()).toBe(200);
    for (const [width, height] of [[1440, 900], [1280, 800], [390, 844], [360, 740]]) {
      await page.setViewportSize({ width, height });
      for (const [name, route] of [['space-live', `/spaces/${spaceId}`], ['compose-live', `/compose/${spaceId}`], ['discover-live', '/discover']]) {
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        if (name === 'discover-live') await expect(page.getByRole('heading', { name: 'Between the noise', exact: true })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ animations: 'disabled', path: testInfo.outputPath(`${name}-${width}x${height}.png`), fullPage: true });
      }
    }
  }
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/auth$/);
  await expect.poll(() => page.evaluate(() => document.querySelector('audio').paused)).toBe(true);
  expect(await page.evaluate(() => document.querySelector('audio').getAttribute('src'))).toBeNull();
  expect(errors).toEqual([]);
});

// Real Jamendo sometimes withdraws an exact-ID response immediately after listing
// the track. Permit one visible Retry, then still require the actual target URL.
async function expectLiveStream(page, trackId) {
  const source = () => page.evaluate(() => {
    const src = document.querySelector('audio').currentSrc;
    return src ? new URL(src).searchParams.get('trackid') : null;
  });
  await expect.poll(async () => await source() === trackId || await page.getByRole('alert').count() > 0, { timeout: 15000 }).toBe(true);
  if (await page.getByRole('alert').count()) {
    await expect(page.getByRole('alert')).toContainText('no longer available');
    console.log('Live Jamendo empty exact-ID response: one actual user retry.');
    await page.getByRole('button', { name: 'Retry playback', exact: true }).click();
  }
  await expect.poll(source, { timeout: 15000 }).toBe(trackId);
}
