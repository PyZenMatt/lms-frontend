import { test, expect } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:4174';

test('dropdown keyboard smoke', async ({ page }) => {
  // Seed localStorage with dummy tokens so the demo AuthProvider considers the user authenticated.
  // The app expects access_token and refresh_token keys; we'll create a fake JWT with payload {"role":"student","name":"Test User","email":"test@example.com"}
  // Seed the demo's mock session key used by the figma demo AuthProvider
  const demoUser = {
    id: '1',
    name: 'Maya Chen',
    email: 'maya@example.com',
    role: 'student',
    tokens: 247,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face'
  };

  await page.addInitScript((user) => {
    // demo session used by figma demo components (harmless if not used)
    localStorage.setItem('artlearn_user', JSON.stringify(user));
  }, demoUser);

  // Also seed production auth tokens so the real AuthProvider considers the user authenticated.
  const payload = Buffer.from(JSON.stringify({ role: 'student', name: 'Test User', email: 'test@example.com' })).toString('base64');
  const fakeJwt = `header.${payload}.signature`;
  await page.addInitScript((token: string) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', 'refresh-placeholder');
  }, fakeJwt);

  await page.goto(BASE, { waitUntil: 'load' });

  // wait for demo app to mount and render the avatar trigger
  await page.waitForSelector('[data-slot="dropdown-menu-trigger"]', { timeout: 10000 });

  // open via Enter on the trigger
  const trigger = await page.locator('[data-slot="dropdown-menu-trigger"]').first();
  await trigger.focus();
  await trigger.press('Enter');

  const content = page.locator('[data-slot="dropdown-menu-content"]');
  await expect(content).toBeVisible();

  // arrow down a couple times and activate an item
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  // after activation, menu should close
  await expect(content).toBeHidden();
});
