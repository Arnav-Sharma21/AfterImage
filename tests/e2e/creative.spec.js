import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test.use({ launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--enable-unsafe-swiftshader'] } });
test('new archive/search/world architecture, real WebGL and responsive visual verification', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'This scenario explicitly renders all four target sizes and an intermediate width.');
  test.setTimeout(150000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__drawCalls = 0;
    window.__longTasks = [];
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) new PerformanceObserver(list => window.__longTasks.push(...list.getEntries().map(entry => entry.duration))).observe({ type: 'longtask', buffered: true });
    for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) for (const method of ['drawArrays', 'drawElements']) {
      const original = type.prototype[method];
      type.prototype[method] = function (...args) { window.__drawCalls++; return original.apply(this, args); };
    }
  });
  // Only hosting of original production photographs is mapped. No music results
  // or audio are supplied by this fixture; MongoDB and all app requests are real.
  await page.route('https://afterimage-art.example/**', route => route.fulfill({ contentType: 'image/webp', headers: { 'Access-Control-Allow-Origin': '*' }, path: `client/public/images/${new URL(route.request().url()).pathname.split('/').pop()}` }));
  const origin = 'http://127.0.0.1:4173';
  const csrf = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  const registered = await page.request.post('/api/auth/register', { headers: { Origin: origin, 'X-CSRF-Token': csrf }, data: { email: `creative-${Date.now()}@example.com`, displayName: 'A night listener', password: 'a memorable creative testing phrase' } });
  expect(registered.status()).toBe(201);
  const token = (await registered.json()).data.csrfToken;
  const created = await page.request.post('/api/spaces', { headers: { Origin: origin, 'X-CSRF-Token': token }, data: {
    title: 'The hours between.', description: 'Rain on the last train home. A little restless, a little far away.', moods: ['Quiet', 'Restless'], soundTuning: { energy: .2, nostalgia: .8 },
    images: [{ id: randomUUID(), url: 'https://afterimage-art.example/night-listener.webp', alt: 'A listener beside a rain-lit train window', caption: 'The city keeps moving. For a moment, I do not.' }, { id: randomUUID(), url: 'https://afterimage-art.example/after-rain.webp', alt: 'A lone figure in a rain-soaked passage', caption: 'Somewhere between midnight and memory.' }],
    fragments: [{ id: randomUUID(), type: 'quote', text: 'Not every place we return to is a place.' }]
  } });
  expect(created.status()).toBe(201);
  const world = (await created.json()).data;
  await page.goto('/atlas');
  console.log('Local archive performance', await page.evaluate(() => ({ domContentLoadedMs: performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd, longTasks: window.__longTasks, threeLoadedBeforeScroll: performance.getEntriesByType('resource').some(entry => /EchoScene/.test(entry.name)) })));
  await page.locator('.light-study').scrollIntoViewIfNeeded();
  await expect(page.locator('.echo-viewport canvas')).toBeVisible({ timeout: 20000 });
  await expect.poll(() => page.evaluate(() => window.__drawCalls)).toBeGreaterThan(0);
  const before = await page.evaluate(() => window.__drawCalls);
  await page.getByRole('button', { name: 'Change sculpture atmosphere' }).click();
  await expect(page.locator('.echo-artifact')).toHaveAttribute('data-phase', '1');
  await expect.poll(() => page.evaluate(() => window.__drawCalls)).toBeGreaterThan(before);
  await page.screenshot({ path: 'design/creative-verification/sculpture-webgl.png' });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  const idle = await page.evaluate(() => window.__drawCalls);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__drawCalls)).toBe(idle);
  console.log('WebGL idle draw delta:', await page.evaluate(value => window.__drawCalls - value, idle));
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('.echo-viewport canvas')).toHaveCount(0);
  for (const [width, height] of [[1440,900],[1280,800],[390,844],[360,740],[820,1000]]) {
    await page.setViewportSize({ width, height });
    for (const [name, route] of [['worlds', '/atlas'], ['search', '/signals'], ['editor', `/worlds/${world.id}/edit`], ['world', `/worlds/${world.id}`], ['player-empty', '/player']]) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (name === 'worlds') { await page.locator('.light-study').scrollIntoViewIfNeeded(); await expect(page.locator('.study-writing')).toHaveCSS('opacity', '1'); await page.evaluate(() => scrollTo(0, 0)); }
      if (name === 'editor') await expect(page.locator('.journal-title')).toHaveCSS('opacity', '1');
      if (name === 'world') await expect(page.locator('.space-detail')).toHaveAttribute('data-palette-method', 'pixels');
      await page.waitForTimeout(850);
      const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll('body *')].filter(el => { const rect = el.getBoundingClientRect(); return rect.right > innerWidth + 2 && getComputedStyle(el).position !== 'absolute'; }).slice(0, 8).map(el => el.className) }));
      expect(layout.scroll, JSON.stringify(layout)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `design/creative-verification/${name}-${width}x${height}.png` });
      await page.screenshot({ path: `design/creative-verification/${name}-${width}x${height}-full.png`, fullPage: true });
    }
  }
  await page.goto(`/worlds/${world.id}/edit#mood-dna`);
  await expect(page.getByRole('tab', { name: 'Mood DNA', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByLabel('Energy', { exact: true }).fill('0.3');
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  expect((await (await page.request.get(`/api/spaces/${world.id}`)).json()).data.soundTuning.energy).toBe(.3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/atlas');
  await page.locator('.light-study').scrollIntoViewIfNeeded();
  await expect(page.locator('.echo-viewport canvas')).toBeVisible();
  await page.locator('.echo-viewport canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('.graphics-fallback')).toBeVisible();
  await page.screenshot({ path: 'design/creative-verification/sculpture-context-loss.png' });
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await expect(page.getByLabel('Search by song title or artist')).toBeVisible();
  expect(errors).toEqual([]);
});
