import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173/';

test.describe('Sidebar width checks', () => {
  test('desktop expanded & collapsed + mobile drawer screenshots', async ({ page }) => {
    // Desktop expanded (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Ensure expanded state (default). Measure aside width.
    const aside = await page.locator('aside#site-sidebar');
    await expect(aside).toBeVisible();
    const boxExp = await aside.boundingBox();
    if (boxExp) {
      console.log('desktop-expanded-width', Math.round(boxExp.width));
    }
    await page.screenshot({ path: 'playwright-sidebar-desktop-expanded.png', fullPage: false });

    // Click desktop toggle to collapse
    const toggle = await page.locator('button[aria-label="Toggle sidebar"]').first();
    await toggle.click();
    await page.waitForTimeout(250);
    const boxCol = await aside.boundingBox();
    if (boxCol) {
      console.log('desktop-collapsed-width', Math.round(boxCol.width));
    }
    await page.screenshot({ path: 'playwright-sidebar-desktop-collapsed.png', fullPage: false });

    // Mobile drawer (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Open mobile drawer using Menu button (visible on mobile)
    const menuBtn = await page.locator('button:has-text("Menu")').first();
    await menuBtn.click();
    await page.waitForTimeout(200);

    // Ensure overlay present and aside visible (fallback: if hidden, temporarily force it visible for measurement)
    const mobileAside = await page.locator('aside#site-sidebar');
    const isVisible = await mobileAside.isVisible();
    if (!isVisible) {
      // Force-show for measurement only
      await page.evaluate(() => {
        const a = document.querySelector('aside#site-sidebar') as HTMLElement | null;
        if (a) {
          a.style.display = 'block';
          a.style.position = 'fixed';
          a.style.left = '0';
          a.style.top = '0';
          a.style.zIndex = '9999';
        }
      });
      await page.waitForTimeout(120);
    }
    const boxMobile = await mobileAside.boundingBox();
    if (boxMobile) {
      console.log('mobile-drawer-width', Math.round(boxMobile.width));
    }
    await page.screenshot({ path: 'playwright-sidebar-mobile-drawer.png', fullPage: false });
  });
});
