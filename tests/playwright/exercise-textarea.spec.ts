import { test, expect } from '@playwright/test';

// This test assumes dev server is running at http://localhost:5174
// and that course with id 3 exists and has lessons and an unlocked exercise for testing.
// It opens the lesson exercise, types into the textarea and verifies the value persists and focus remains.

test('exercise textarea keeps focus and accepts typing', async ({ page }) => {
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });

  // Pre-seed localStorage with a fake authenticated session so the demo app
  // won't redirect to login. Adjust tokens if your dev backend requires valid JWTs.
  await page.addInitScript(() => {
    try {
      // Minimal artlearn_user used by legacy UI components
      localStorage.setItem('artlearn_user', JSON.stringify({ id: '1', name: 'Playwright User', email: 'pw@example.com', role: 'student', tokens: 100 }));
      // If your app reads tokens from localStorage keys used by AuthContext, set them too.
      localStorage.setItem('artlearn_tokens', JSON.stringify({ access: 'dev-access-token', refresh: 'dev-refresh-token' }));
    } catch (e) {
      // ignore
    }
  });

  await page.goto('http://localhost:5174/learn/3');
  // wait for lesson list
  await page.waitForSelector('button:has-text("Select a Lesson")', { timeout: 2000 }).catch(() => {});

  // try to click the first unlocked lesson button
  const lessonButton = await page.locator('button').filter({ hasText: 'Exercise' }).first();
  await lessonButton.click().catch(() => {});

  // open exercise tab
  const openExercise = page.locator('button:has-text("Open Exercise")').first();
  await openExercise.click().catch(() => {});

  // focus textarea
  const textarea = page.locator('textarea[data-slot="textarea"]').first();
  await textarea.waitFor({ state: 'visible' });
  await textarea.click();

  // type multiple characters
  await textarea.type('Hello world');

  // read back value
  const value = await textarea.inputValue();
  console.log('Textarea value after typing:', value);
  expect(value).toBe('Hello world');

  // ensure textarea still focused
  const active = await page.evaluate(() => document.activeElement?.tagName);
  console.log('Active element tag:', active);
  expect(active).toBe('TEXTAREA');
});
