const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  await assert.rejects(fetch('http://127.0.0.1:5171/health'), 'Run this check with the optional service stopped.');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = []; const products = [];
  try {
    for (const port of [5170,5173,5174,5175,5176,5177,5178,5179,5180]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      page.on('pageerror', e => errors.push({ port, error: e.message }));
      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
      assert.ok((await page.locator('#root').innerText()).length > 500, `Product ${port} renders its native standalone content.`);
      if (port === 5173) {
        await page.getByRole('button', {name: 'Open sample job', exact: true}).click();
        await page.waitForURL(/app/);
      }
      products.push({ port, title: await page.title(), hasStandaloneHeading: true });
      await page.close();
    }
    assert.deepEqual(errors, []);
    const receipt = { optionalServiceOffline: true, products, pageErrors: errors };
    const file = path.resolve(__dirname, '../docs/audits/visual-evidence/2026-10-22-shipment-flow/standalone-offline-receipt.json');
    fs.writeFileSync(file, JSON.stringify(receipt, null, 2)); console.log(JSON.stringify(receipt, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
