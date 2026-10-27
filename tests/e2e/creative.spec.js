import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

// Real app and isolated MongoDB. Only the HTTPS hosting of original project art
// is mapped locally; no provider responses or audio are fabricated.
test.use({ launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--enable-unsafe-swiftshader'] } });
test('creative layouts, real WebGL interaction, reduced motion and journal persistence', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Explicitly covers four viewport sizes.');
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__drawCalls = 0;
    for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
      for (const method of ['drawArrays', 'drawElements']) {
        const original = type.prototype[method];
        type.prototype[method] = function (...args) { window.__drawCalls++; return original.apply(this, args); };
      }
    }
  });
  await page.route('https://afterimage-art.example/**', route => route.fulfill({ contentType: 'image/webp', path: `client/public/images/${new URL(route.request().url()).pathname.split('/').pop()}` }));
  const origin = 'http://127.0.0.1:4173';
  const csrf = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  const account = await page.request.post('/api/auth/register', { headers: { Origin: origin, 'X-CSRF-Token': csrf }, data: { email: `creative-${Date.now()}@example.com`, displayName: 'A night listener', password: 'a memorable cinematic verification phrase' } });
  expect(account.status()).toBe(201);
  const token = (await account.json()).data.csrfToken;
  const create = await page.request.post('/api/spaces', { headers: { Origin: origin, 'X-CSRF-Token': token }, data: {
    title: 'The hours between.', description: 'Rain on the last train home. A little restless, a little far away.', moods: ['Quiet', 'Restless'], soundTuning: { energy: .2, warmth: .35, nostalgia: .8 },
    images: [{ id: randomUUID(), url: 'https://afterimage-art.example/night-listener.webp', alt: 'A listener beside a rain-lit train window', caption: 'The city keeps moving. For a moment, I do not.' }, { id: randomUUID(), url: 'https://afterimage-art.example/after-rain.webp', alt: 'A lone figure in a rain-soaked night passage', caption: 'Somewhere between midnight and memory.' }],
    fragments: [{ id: randomUUID(), type: 'quote', text: 'Not every place we return to is a place.' }]
  } });
  expect(create.status()).toBe(201);
  const space = (await create.json()).data;
  await page.goto('/discover');
  await expect(page.locator('.opening-copy h1')).toHaveCSS('opacity', '1');
  await expect(page.locator('.echo-viewport canvas')).toBeVisible({ timeout: 20000 });
  await expect.poll(() => page.evaluate(() => window.__drawCalls)).toBeGreaterThan(0);
  const canvas = page.locator('.echo-viewport canvas');
  await canvas.hover({ position: { x: 150, y: 120 } });
  const before = await page.evaluate(() => window.__drawCalls);
  await page.getByRole('button', { name: 'Change sculpture atmosphere' }).click();
  await expect(page.locator('.echo-artifact')).toHaveAttribute('data-phase', '1');
  await expect.poll(() => page.evaluate(() => window.__drawCalls)).toBeGreaterThan(before);
  // Demand rendering should settle: count actual GL draws, not requested frames.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  const idle = await page.evaluate(() => window.__drawCalls);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__drawCalls)).toBe(idle);
  await page.locator('.afterglow-spread').scrollIntoViewIfNeeded();
  await expect(page.locator('.afterglow-copy')).toHaveCSS('opacity', '1');
  await expect(page.locator('.echo-viewport canvas')).toHaveCount(0);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('.echo-viewport canvas')).toBeVisible();
  for (const [width, height] of [[1440,900],[1280,800],[390,844],[360,740]]) {
    await page.setViewportSize({ width, height });
    for (const [name, route] of [['discover', '/discover'], ['compose', `/compose/${space.id}`], ['space', `/spaces/${space.id}`], ['listen-empty', '/listen']]) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (name === 'discover') {
        await expect(page.locator('.opening-copy h1')).toHaveCSS('opacity', '1');
        await expect(page.locator('.echo-viewport canvas')).toBeVisible();
        await page.locator('.afterglow-spread').scrollIntoViewIfNeeded();
        await expect(page.locator('.afterglow-copy')).toHaveCSS('opacity', '1');
        await page.evaluate(() => scrollTo(0, 0));
      }
      if (name === 'compose') await expect(page.locator('.journal-title')).toHaveCSS('opacity', '1');
      if (name === 'space') await expect.poll(() => page.locator('.canvas-image img').first().evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
      // Reveal entrance timelines and image decoding are complete before capture.
      await page.waitForTimeout(900);
      const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.right > innerWidth + 2 && getComputedStyle(el).position !== 'absolute'; }).slice(0, 6).map(el => el.className) }));
      expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `design/creative-verification/${name}-${width}x${height}.png` });
      await page.screenshot({ path: `design/creative-verification/${name}-${width}x${height}-full.png`, fullPage: true });
    }
  }
  await page.goto(`/compose/${space.id}#mood-dna`);
  await expect(page.getByRole('tab', { name: 'Mood DNA', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByLabel('Energy', { exact: true }).fill('0.3');
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  expect((await (await page.request.get(`/api/spaces/${space.id}`)).json()).data.soundTuning.energy).toBe(.3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/discover');
  await expect(page.locator('.opening-copy h1')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: 'Change sculpture atmosphere' }).click();
  await expect(page.locator('.echo-artifact')).toHaveAttribute('data-phase', '1');
  // Actual context loss must leave an honest static fallback and usable search.
  await page.locator('.echo-viewport canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('.echo-viewport .graphics-fallback')).toBeVisible();
  await expect(page.getByLabel('Search by song title or artist')).toBeVisible();
  expect(errors).toEqual([]);
});
