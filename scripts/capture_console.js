// scripts/capture_console.js
// Simple Playwright script to capture console logs and a screenshot from the dev server
// Usage: node scripts/capture_console.js

const { chromium } = require('playwright');

(async () => {
  const out = { console: [], errors: [] };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    try {
      out.console.push({ type: msg.type(), text: msg.text() });
    } catch (e) {
      out.console.push({ type: 'unknown', text: String(msg) });
    }
  });

  page.on('pageerror', err => {
    out.errors.push(String(err));
  });

  try {
    const url = process.argv[2] || 'http://localhost:5173/';
    console.log('Opening', url);
    await page.goto(url, { waitUntil: 'load', timeout: 15000 });
    // wait a bit for React to boot
    await page.waitForTimeout(1500);

    const html = await page.content();
    // save screenshot
    const screenshotPath = '/tmp/lms_frontend_screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log('\n=== Console messages ===');
    out.console.forEach((c, i) => console.log(`${i+1}. [${c.type}] ${c.text}`));
    if (out.errors.length) {
      console.log('\n=== Page errors ===');
      out.errors.forEach((e, i) => console.log(`${i+1}. ${e}`));
    }

    console.log('\nSaved screenshot to', screenshotPath);
    // optionally dump a small portion of the root element
    const rootExists = await page.$('#root') !== null;
    console.log('Has #root element:', rootExists);
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await browser.close();
  }
})();
