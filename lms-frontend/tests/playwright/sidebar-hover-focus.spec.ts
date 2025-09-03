import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';

// Capture hover + focus visuals for sidebar items in expanded and collapsed modes
test('sidebar hover and focus visuals', async ({ page }) => {
  await page.goto(BASE + '/courses');
  await page.setViewportSize({ width: 1280, height: 900 });

  // wait for sidebar
  await page.waitForSelector('#site-sidebar');

  const firstLink = await page.$('#site-sidebar nav a[href]');
  if (!firstLink) {
    throw new Error('No nav link found to test');
  }

  // Hover state (expanded)
  await firstLink.hover();
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'playwright-sidebar-hover-expanded.png', fullPage: false });

  // Focus via keyboard (expanded)
  await page.keyboard.press('Tab');
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'playwright-sidebar-focus-expanded.png', fullPage: false });

  // Collapse the sidebar
  const toggle = await page.$('button[aria-label="Toggle sidebar"]');
  if (toggle) {
    await toggle.click();
    await page.waitForTimeout(250);
  }

  const firstIcon = await page.$('#site-sidebar nav a[href] > span');
  if (!firstIcon) {
    // fallback: try the first button in collapsed
    const firstBtn = await page.$('#site-sidebar nav button');
    if (firstBtn) {
      await firstBtn.hover();
      await page.waitForTimeout(120);
      await page.screenshot({ path: 'playwright-sidebar-hover-collapsed.png', fullPage: false });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(120);
      await page.screenshot({ path: 'playwright-sidebar-focus-collapsed.png', fullPage: false });
      return;
    }
    throw new Error('No collapsed item found to test');
  }

  // Hover collapsed icon
  await firstIcon.hover();
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'playwright-sidebar-hover-collapsed.png', fullPage: false });

  // Focus collapsed via Tab
  await page.keyboard.press('Tab');
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'playwright-sidebar-focus-collapsed.png', fullPage: false });
});
