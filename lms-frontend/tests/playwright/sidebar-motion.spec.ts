import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';

// Capture a short sequence of screenshots to show color transitions
test('sidebar color transitions (expanded and collapsed)', async ({ page }) => {
  await page.goto(BASE + '/courses');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForSelector('#site-sidebar');

  const firstLink = page.locator('#site-sidebar nav a[href]').first();
  await expect(firstLink).toHaveCount(1);

  // idle
  await page.screenshot({ path: 'playwright-motion-expanded-idle.png' });

  // hover
  await firstLink.hover();
  await page.waitForTimeout(220); // wait slightly longer than transition
  await page.screenshot({ path: 'playwright-motion-expanded-hover.png' });

  // focus/active (click to activate)
  await firstLink.click();
  await page.waitForTimeout(220);
  await page.screenshot({ path: 'playwright-motion-expanded-active.png' });

  // collapse
  const toggle = await page.$('button[aria-label="Toggle sidebar"]');
  if (toggle) {
    await toggle.click();
    await page.waitForTimeout(300);
  }

  // find any interactive element in the first nav item (a, button, span)
  // After collapsing, find any interactive element under the nav (robust selectors)
  await page.waitForTimeout(120);
  // Use locator to find any interactive child in the first li after collapse
  const collapsedInteractive = page.locator('#site-sidebar nav li').first().locator('a, button, [role="button"], span, svg');
  await expect(collapsedInteractive.first()).toHaveCount(1);

  await page.screenshot({ path: 'playwright-motion-collapsed-idle.png' });
  await collapsedInteractive.first().hover();
  await page.waitForTimeout(220);
  await page.screenshot({ path: 'playwright-motion-collapsed-hover.png' });
  await collapsedInteractive.first().click();
  await page.waitForTimeout(220);
  await page.screenshot({ path: 'playwright-motion-collapsed-active.png' });
});
