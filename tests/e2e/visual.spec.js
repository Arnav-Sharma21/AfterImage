import { expect, test } from '@playwright/test';

// Explicit original image fixtures exercise HTTPS image rendering/persistence.
// They are not provider results, album artwork or production seed content.
const image = color => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><defs><radialGradient id="g"><stop stop-color="${color}"/><stop offset="1" stop-color="#10131c"/></radialGradient></defs><path fill="url(#g)" d="M0 0h800v1000H0z"/><circle fill="#d8ccca" opacity=".6" cx="470" cy="290" r="130"/><path fill="#10131c" d="m0 850 200-430 180 240 240-420 180 610v150H0z"/></svg>`;

test('image collage persists edits/order/removal, keyboard guards and responsive layouts', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(10000);
  test.skip(testInfo.project.name !== 'desktop', 'This scenario explicitly exercises all four viewport sizes.');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://images.example.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: image(route.request().url().includes('second') ? '#87405a' : '#386b78') }));
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  const account = await page.request.post('/api/auth/register', { headers: { Origin: 'http://127.0.0.1:4173', 'X-CSRF-Token': token }, data: { email: `visual-${Date.now()}@example.com`, displayName: 'Visual verification', password: 'a memorable visual verification phrase' } });
  expect(account.status()).toBe(201);
  await page.goto('/compose/new');
  await page.getByRole('tab', { name: 'Story', exact: true }).click();
  await page.getByLabel('Space title').fill('When the city falls quiet');
  await page.getByRole('tab', { name: 'Story', exact: true }).click();
  await page.getByLabel('Description', { exact: true }).fill('A small world of moonlight, restless thoughts and warm memories.');
  await page.getByRole('tab', { name: 'Mood DNA', exact: true }).click();
  await page.getByRole('button', { name: 'Quiet', exact: true }).click();
  await page.getByRole('tab', { name: 'Mood DNA', exact: true }).click();
  await page.getByRole('button', { name: 'Restless', exact: true }).click();
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByRole('button', { name: 'Add image', exact: true }).click();
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByLabel('Image URL 1', { exact: true }).fill('https://images.example.com/first.svg');
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByLabel('Image description 1', { exact: true }).fill('A moon over blue mountain silhouettes');
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByLabel('Image caption 1', { exact: true }).fill('Quiet moonlight, somewhere far from here.');
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByRole('button', { name: 'Add image', exact: true }).click();
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByLabel('Image URL 2', { exact: true }).fill('https://images.example.com/second.svg');
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByLabel('Image description 2', { exact: true }).fill('A moon in a warm magenta sky');
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByLabel('Image caption 2', { exact: true }).fill('Warm memories after midnight.');
  await page.getByRole('tab', { name: 'Story', exact: true }).click();
  await page.getByRole('button', { name: 'Add text fragment', exact: true }).click();
  await page.getByRole('tab', { name: 'Story', exact: true }).click();
  await page.getByLabel('Fragment type 1').selectOption('quote');
  await page.getByRole('tab', { name: 'Story', exact: true }).click();
  await page.getByLabel('Text fragment 1').fill('There is a whole world in the things we keep.');
  await page.getByRole('tab', { name: 'Mood DNA', exact: true }).click();
  await page.getByLabel('Set energy', { exact: true }).check();
  await page.getByRole('tab', { name: 'Mood DNA', exact: true }).click();
  await page.getByLabel('Energy', { exact: true }).fill('0.2');
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByRole('button', { name: 'Move image 2 earlier', exact: true }).click();
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  await expect(page).toHaveURL(/\/worlds\/[a-f0-9]{24}\/edit$/);
  const id = page.url().match(/(?:compose|worlds)\/([a-f\d]{24})/)[1];
  await page.reload();
  // Existing image cards collapse after persistence; open the actual editor.
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByText('Edit image 1', { exact: true }).click();
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await expect(page.getByLabel('Image URL 1', { exact: true })).toHaveValue('https://images.example.com/second.svg');
  await page.getByRole('tab', { name: 'Mood DNA', exact: true }).click();
  await expect(page.getByLabel('Energy', { exact: true })).toHaveValue('0.2');
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByLabel('Image caption 1', { exact: true }).fill('A changed but unsaved caption');
  await page.getByRole('link', { name: 'Worlds', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await expect(page.getByLabel('Image caption 1', { exact: true })).toHaveValue('A changed but unsaved caption');
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  for (const [width, height] of [[1440, 900], [1280, 800], [390, 844], [360, 740]]) {
    await page.setViewportSize({ width, height });
    for (const [name, route] of [['compose', `/compose/${id}`], ['space', `/spaces/${id}`], ['discover', '/discover'], ['listen-empty', '/listen']]) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      if (name === 'discover') await expect(page.getByRole('heading', { name: 'When the city falls quiet', exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} ${width}: horizontal overflow`).toBe(true);
      await page.screenshot({ animations: 'disabled', path: testInfo.outputPath(`${name}-${width}x${height}.png`), fullPage: true });
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/compose/${id}`);
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.getByRole('button', { name: 'Remove image 1', exact: true }).click();
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  await page.reload();
  await expect(page.locator('.image-edit-card')).toHaveCount(1);
  const saved = (await (await page.request.get(`/api/spaces/${id}`)).json()).data;
  expect(saved.images).toHaveLength(1);
  expect(saved.images[0].url).toBe('https://images.example.com/first.svg');
  expect(saved.soundTuning.energy).toBe(.2);
  expect(errors).toEqual([]);
});
