import { expect, test } from '@playwright/test';

test('catalog heading stays inside its frame and starter searches use the actual query workflow', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'The scenario explicitly checks desktop, tablet and both phone sizes.');
  test.setTimeout(60000);
  const origin = 'http://127.0.0.1:4173';
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  await page.request.post('/api/auth/register', { headers: { Origin: origin, 'X-CSRF-Token': token }, data: { email: `catalog-layout-${Date.now()}@example.com`, displayName: 'A catalog listener', password: 'a private catalog verification phrase' } }).then(response => expect(response.status()).toBe(201));
  await page.goto('/signals');
  await page.evaluate(() => document.fonts.ready);
  for (const [width, height] of [[1920,1080],[1440,900],[1280,800],[820,1000],[390,844],[360,740]]) {
    await page.setViewportSize({ width, height });
    await page.locator('.signal-photograph').scrollIntoViewIfNeeded();
    const bounds = await page.locator('.signal-photograph').evaluate(header => {
      const frame = header.getBoundingClientRect();
      const heading = header.querySelector('h1').getBoundingClientRect();
      return { frameBottom: frame.bottom, frameRight: frame.right, textBottom: heading.bottom, textRight: heading.right, scroll: document.documentElement.scrollWidth, width: innerWidth };
    });
    expect(bounds.textBottom, JSON.stringify(bounds)).toBeLessThanOrEqual(bounds.frameBottom + 1);
    expect(bounds.textRight, JSON.stringify(bounds)).toBeLessThanOrEqual(bounds.frameRight + 1);
    expect(bounds.scroll).toBeLessThanOrEqual(width);
    await expect(page.getByRole('button', { name: 'Search jazz', exact: true })).toBeVisible();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `design/creative-verification/search-${width}x${height}.png` });
  }
  // Deliberate error fixture: assert real query/navigation behavior without
  // pretending to return successful catalog data in this layout test.
  await page.route('**/api/music/search?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'MUSIC_PROVIDER_UNAVAILABLE', message: 'Intentional provider failure for shortcut verification.' } }) }));
  await page.getByRole('button', { name: 'Search jazz', exact: true }).click();
  await expect(page).toHaveURL(/\/signals\?q=Jazz$/);
  await expect(page.getByLabel('Search by song title or artist')).toHaveValue('Jazz');
  await expect(page.getByRole('alert')).toContainText('shortcut verification');
  await page.getByLabel('Search by song title or artist').fill('Ambient');
  await page.getByRole('button', { name: 'Search music', exact: true }).click();
  await expect(page).toHaveURL(/\/signals\?q=Ambient$/);
  await expect(page.getByRole('alert')).toContainText('shortcut verification');
});
