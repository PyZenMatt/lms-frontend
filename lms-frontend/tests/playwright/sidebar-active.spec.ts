import { test, expect } from '@playwright/test';

// Short visual test: capture expanded and collapsed active states for Sidebar
// Assumes dev server running at http://localhost:5173

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';

test('sidebar active states screenshots', async ({ page }) => {
  await page.goto(BASE + '/courses');
  await page.setViewportSize({ width: 1280, height: 900 });

  // wait for sidebar
  await page.waitForSelector('#site-sidebar');

  // ensure expanded (default)
  const expanded = await page.$('#site-sidebar');
  expect(expanded).toBeTruthy();

  // take expanded screenshot focused on sidebar
  await page.screenshot({ path: 'playwright-sidebar-active-expanded.png', fullPage: false });

  // click toggle button to collapse
  const toggle = await page.$('button[aria-label="Toggle sidebar"]');
  if (toggle) {
    await toggle.click();
    await page.waitForTimeout(250);
  }

  // take collapsed screenshot
  await page.screenshot({ path: 'playwright-sidebar-active-collapsed.png', fullPage: false });

  // done
});
