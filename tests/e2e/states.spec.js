import { expect, test } from '@playwright/test';

test('keyboard validation, honest missing-upload configuration, loading and provider errors', async ({ page }, info) => {
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  const account = await page.request.post('/api/auth/register', { headers: { Origin: 'http://127.0.0.1:4173', 'X-CSRF-Token': token }, data: { email: `states-${info.project.name}-${Date.now()}@example.com`, displayName: 'State verification', password: 'a memorable interface testing phrase' } });
  expect(account.status()).toBe(201);
  // Test-only configuration failure, matching the actual unconfigured backend
  // response verified by media.test.js. No upload or catalog success is mocked.
  await page.route('**/api/media/config', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { configured: false, maxBytes: 8388608, maxImages: 12 } }) }));
  await page.goto('/worlds/new');
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await expect(page.getByText(/Image uploads are not configured yet/)).toBeVisible();
  await page.screenshot({ path: `design/creative-verification/uploads-unconfigured-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByLabel('Space title')).toBeFocused();
  await page.getByRole('tab', { name: 'Story', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Images', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Mood DNA', exact: true })).toBeFocused();
  await page.goto('/signals');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/music/search?**', async route => { await gate; await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'MUSIC_PROVIDER_UNAVAILABLE', message: 'The music provider is temporarily unavailable. Please try again.' } }) }); });
  await page.getByLabel('Search by song title or artist').fill('ambient');
  await page.getByRole('button', { name: 'Search music', exact: true }).click();
  await expect(page.getByText('Searching Jamendo…')).toBeVisible();
  await page.screenshot({ path: `design/creative-verification/search-loading-${info.project.name}.png` });
  release();
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
  await page.screenshot({ path: `design/creative-verification/search-error-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Email address')).toBeVisible();
  await page.screenshot({ path: `design/creative-verification/account-${info.project.name}.png`, fullPage: true });
});
