import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('three live artwork palettes, actual fullscreen, writing fallback and CORS failure', async ({ page }, info) => {
  test.skip(process.env.RUN_LIVE_MUSIC_TESTS !== '1' || info.project.name !== 'desktop', 'Opt-in live provider verification; desktop scenario also captures mobile.');
  test.setTimeout(180000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  const account = await page.request.post('/api/auth/register', { headers: { Origin: 'http://127.0.0.1:4173', 'X-CSRF-Token': token }, data: { email: `palette-${Date.now()}@example.com`, displayName: 'Atmosphere verification', password: 'a memorable atmosphere testing phrase' } });
  expect(account.status()).toBe(201);
  const searchResponse = page.waitForResponse(response => response.url().includes('/api/music/search?'));
  await page.goto('/signals?q=ambient');
  await expect(page.getByRole('list', { name: 'Music search results' })).toBeVisible({ timeout: 20000 });
  const search = await searchResponse;
  expect(search.status()).toBe(200);
  const tracks = (await search.json()).data.filter(track => track.artworkUrl);
  console.log('Live palette candidate count:', tracks.length);
  const sampled = await page.evaluate(async tracks => Promise.all(tracks.map(track => new Promise(resolve => {
    const image = new Image(); image.crossOrigin = 'anonymous'; image.referrerPolicy = 'no-referrer';
    const timer = setTimeout(() => resolve(null), 7000);
    image.onerror = () => { clearTimeout(timer); console.log('Artwork sampling load failed:', track.artworkUrl); resolve(null); };
    image.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 24;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, 24, 24);
        const data = ctx.getImageData(0, 0, 24, 24).data; const mean = [0, 0, 0];
        for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) mean[c] += data[i + c] / 576;
        resolve({ ...track, mean });
      } catch { resolve(null); }
    };
    image.src = track.artworkUrl;
  }))), tracks);
  const candidates = sampled.filter(Boolean);
  expect(candidates.length, 'Real artwork must permit browser pixel sampling for this live verification').toBeGreaterThanOrEqual(3);
  const distance = (a, b) => Math.hypot(...a.mean.map((value, index) => value - b.mean[index]));
  let best = [], separation = 0;
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) for (let k = j + 1; k < candidates.length; k++) {
    const delta = Math.min(distance(candidates[i], candidates[j]), distance(candidates[i], candidates[k]), distance(candidates[j], candidates[k]));
    if (delta > separation) { separation = delta; best = [candidates[i], candidates[j], candidates[k]]; }
  }
  expect(separation, 'Three covers must have substantially different actual colors').toBeGreaterThan(65);
  const palettes = [], evidence = [];
  for (const [index, track] of best.entries()) {
    await page.goto('/signals?q=ambient');
    const row = page.getByRole('list', { name: 'Music search results' }).locator('li').filter({ has: page.getByRole('heading', { name: track.title, exact: true }) });
    await row.getByRole('button', { name: `Play ${track.title}`, exact: true }).click();
    await page.getByRole('link', { name: 'Player', exact: true }).click();
    await expect(page.locator('.listen-page')).toHaveAttribute('data-palette-method', 'pixels', { timeout: 15000 });
    await expect(page.locator('.record-sleeve')).toHaveCSS('opacity', '1');
    await page.waitForTimeout(1100);
    const palette = await page.locator('.listen-page').evaluate(el => ({ background: getComputedStyle(el).getPropertyValue('--atmos-bg').trim(), accent: getComputedStyle(el).getPropertyValue('--atmos-accent').trim() }));
    palettes.push(palette);
    evidence.push({ title: track.title, artistName: track.artistName, artworkUrl: track.artworkUrl, sourceUrl: track.sourceUrl, licenseUrl: track.licenseUrl, palette });
    console.log('Live palette:', JSON.stringify({ title: track.title, artistName: track.artistName, artworkUrl: track.artworkUrl, sourceUrl: track.sourceUrl, licenseUrl: track.licenseUrl, mean: track.mean, palette }));
    await page.screenshot({ path: `design/creative-verification/palette-${index + 1}-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `design/creative-verification/palette-${index + 1}-mobile.png` });
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  expect(new Set(palettes.map(palette => palette.background)).size).toBe(3);
  await writeFile('design/creative-verification/palette-evidence.json', JSON.stringify(evidence, null, 2) + '\n');
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.screenshot({ path: 'design/creative-verification/fullscreen.png' });
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  await page.getByRole('button', { name: 'Your writing', exact: true }).click();
  await expect(page.getByText('This recording has no personal writing attached.')).toBeVisible();
  await page.screenshot({ path: 'design/creative-verification/writing-empty.png' });
  await page.route(url => url.origin === 'https://usercontent.jamendo.com', async route => {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    headers['access-control-allow-origin'] = 'https://sampling-blocked.example';
    await route.fulfill({ response, headers });
  });
  await page.reload();
  await expect(page.locator('.listen-page')).toHaveAttribute('data-palette-method', 'image-wash', { timeout: 15000 });
  await expect.poll(() => page.locator('.record-sleeve img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByLabel('Volume', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'design/creative-verification/palette-cors-fallback.png' });
  expect(errors).toEqual([]);
});
