import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('device file import, managed image persistence, ordering and safe deletion', async ({ page }, info) => {
  test.skip(process.env.E2E_MEDIA_FIXTURE !== '1', 'Uses the explicitly enabled Cloudinary boundary fixture, never real credentials.');
  test.setTimeout(60000);
  // These are the actual original project photographs selected below. External
  // Cloudinary delivery is the only browser image-host fixture.
  await page.route('https://res.cloudinary.com/afterimage-e2e/**', route => route.fulfill({ contentType: 'image/webp', headers: { 'Access-Control-Allow-Origin': '*' }, path: 'client/public/images/night-listener.webp' }));
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  const account = await page.request.post('/api/auth/register', { headers: { Origin: 'http://127.0.0.1:4173', 'X-CSRF-Token': token }, data: { email: `upload-${info.project.name}-${Date.now()}@example.com`, displayName: 'A photographic world', password: 'a memorable upload testing phrase' } });
  expect(account.status()).toBe(201);
  await page.goto('/worlds/new');
  await page.getByLabel('Space title').fill('Photographs we keep');
  await page.getByRole('tab', { name: 'Mood DNA', exact: true }).click();
  await page.getByRole('button', { name: 'Quiet', exact: true }).click();
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByLabel('Choose image files').setInputFiles('client/public/images/night-listener.webp');
  await expect(page.getByText('Stored · add an image description below, then save your world.')).toHaveCount(1, { timeout: 20000 });
  const bytes = [...await readFile('client/public/images/after-rain.webp')];
  const transfer = await page.evaluateHandle(bytes => { const transfer = new DataTransfer(); transfer.items.add(new File([new Uint8Array(bytes)], 'after-rain.webp', { type: 'image/webp' })); return transfer; }, bytes);
  await page.locator('.media-import').dispatchEvent('drop', { dataTransfer: transfer });
  await expect(page.getByText('Stored · add an image description below, then save your world.')).toHaveCount(1, { timeout: 20000 });
  await expect(page.locator('.image-edit-card')).toHaveCount(2, { timeout: 20000 });
  await page.getByLabel('Image description 1', { exact: true }).fill('A person listening on a night train');
  await page.getByLabel('Image caption 1', { exact: true }).fill('Quiet thoughts at midnight');
  await page.getByLabel('Image description 2', { exact: true }).fill('A person walking through rain');
  await page.getByRole('button', { name: 'Move image 2 earlier', exact: true }).click();
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  const id = page.url().match(/worlds\/([a-f\d]{24})/)[1];
  const world = (await (await page.request.get(`/api/spaces/${id}`)).json()).data;
  expect(world.images).toHaveLength(2);
  expect(world.images.every(image => image.assetId && image.url.startsWith('https://res.cloudinary.com/'))).toBe(true);
  expect(world.images[1].caption).toBe('Quiet thoughts at midnight');
  await page.reload();
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByRole('button', { name: 'Manage uploads', exact: true }).click();
  await expect(page.getByText('In a saved world')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Delete upload' }).first()).toBeDisabled();
  await page.screenshot({ path: `design/creative-verification/imports-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Remove image 1', exact: true }).click();
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  await expect.poll(async () => (await (await page.request.get('/api/media')).json()).data.length).toBe(1);
  const remaining = (await (await page.request.get('/api/media')).json()).data;
  expect(remaining).toHaveLength(1);
  expect(remaining[0].inUse).toBe(true);
});
