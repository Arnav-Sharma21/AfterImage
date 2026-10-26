import { expect, test } from '@playwright/test';

test('account → persisted moodspace → edit → re-login → delete', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const email = `browser-${testInfo.project.name}-${Date.now()}@example.com`;
  const password = 'a memorable browser testing phrase';
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Give a feelinga place.');
  await page.screenshot({ path: testInfo.outputPath('auth.png'), fullPage: true });
  await page.getByLabel('Your name').fill('A listener');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create your account' }).click();
  await expect(page.getByRole('heading', { name: 'Your spaces' })).toBeVisible();
  await page.getByRole('link', { name: 'Compose your first space' }).click();
  await page.getByLabel('Space title').fill('After the rain');
  await page.getByLabel('Description', { exact: true }).fill('The city is quiet again.');
  await page.getByRole('button', { name: 'Quiet', exact: true }).click();
  await page.getByRole('button', { name: 'Dreamlike', exact: true }).click();
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  await expect(page).toHaveURL(/\/compose\/[a-f0-9]{24}$/);
  await page.reload();
  await expect(page.getByLabel('Space title')).toHaveValue('After the rain');
  await expect(page.getByRole('button', { name: 'Quiet', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: testInfo.outputPath('compose.png'), fullPage: true });
  await page.getByLabel('Space title').fill('Unsaved thought');
  await page.getByRole('link', { name: 'Discover', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByLabel('Space title')).toHaveValue('Unsaved thought');
  await page.getByLabel('Space title').fill('Before the dawn');
  await expect(page.getByLabel('Space title')).toHaveValue('Before the dawn');
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('Saved to your private library.')).toBeVisible();
  await page.getByRole('link', { name: 'Discover', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Before the dawn' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('discover.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/auth$/);
  await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Before the dawn' })).toBeVisible();
  await page.getByRole('link').filter({ has: page.getByRole('heading', { name: 'Before the dawn', exact: true }) }).click();
  await expect(page.getByText('The city is quiet again.')).toBeVisible();
  await page.getByRole('button', { name: 'Delete space', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete space', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A place for what stays with you.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('failed saves and expired sessions keep the draft; sign-out asks before discarding', async ({ page }, testInfo) => {
  const email = `resilience-${testInfo.project.name}-${Date.now()}@example.com`;
  const password = 'another memorable testing phrase';
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrfToken;
  const registered = await page.request.post('/api/auth/register', {
    headers: { Origin: 'http://127.0.0.1:4173', 'X-CSRF-Token': token },
    data: { email, password, displayName: 'Resilience test' }
  });
  expect(registered.status()).toBe(201);
  const account = (await registered.json()).data;
  await page.goto('/compose/new');
  await page.getByLabel('Space title').fill('A thought worth keeping');
  await page.getByRole('button', { name: 'Warm', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Warm', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.route('**/api/spaces', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'DATABASE_UNAVAILABLE', message: 'The database is unavailable. Please try again shortly.' } }) }), { times: 1 });
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('database is unavailable');
  await expect(page.getByLabel('Space title')).toHaveValue('A thought worth keeping');
  const signedOut = await page.request.post('/api/auth/logout', {
    headers: { Origin: 'http://127.0.0.1:4173', 'X-CSRF-Token': account.csrfToken }, data: {}
  });
  expect(signedOut.status()).toBe(200);
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your session has expired.' })).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByLabel('Space title')).toHaveValue('A thought worth keeping');
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  await expect(page.getByText('All changes saved')).toBeVisible();
  await page.getByLabel('Space title').fill('An unsaved change');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByLabel('Space title')).toHaveValue('An unsaved change');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: 'Discard and sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/auth$/);
});
