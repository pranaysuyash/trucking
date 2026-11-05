const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/pranay/Projects/pdf_editor/node_modules/playwright');
const { expect } = require(`${process.env.PLAYWRIGHT_MODULE || '/Users/pranay/Projects/pdf_editor/node_modules/playwright'}/test`);
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '../docs/audits/visual-evidence/2026-10-22-shipment-ui');
const label = process.argv.includes('--baseline') ? 'before' : 'fixed';
const folder = path.join(root, `cargo-recovery-${label}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
fs.mkdirSync(folder, { recursive: true });
const receipt = { checkedAt: new Date().toISOString(), label, evidenceTier: 4, sensitivity: 'S1', pageErrors: [] };
let browser, first;
async function get(id) { return (await fetch(`http://127.0.0.1:5171/shipments/${id}`)).json(); }
async function command(id, payload) {
  const shipment = await get(id);
  const response = await fetch(`http://127.0.0.1:5171/shipments/${id}/commands`, {
    method: 'POST', headers: { Origin: 'http://127.0.0.1:5170', 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'evaluate', payload, productId: 'product-04-asset-studio', expectedRevision: shipment.revision, operationId: randomUUID() })
  });
  assert.equal(response.status, 200, await response.text());
}
async function selectUnit(page, id) {
  await page.getByRole('table', { name: 'Placements', exact: true }).getByRole('button', { name: id, exact: true }).click();
  return page.getByLabel(`${id} x position`, { exact: true });
}
(async () => {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  first = await context.newPage();
  const second = await context.newPage();
  for (const page of [first, second]) { page.on('pageerror', error => receipt.pageErrors.push(error.message)); page.on('dialog', dialog => dialog.accept()); }
  await first.goto('http://127.0.0.1:5170/');
  await first.getByLabel('Scenario reference').fill(`Cargo arrangement recovery ${receipt.checkedAt}`);
  await first.getByRole('button', { name: 'Create local shipment', exact: true }).click();
  await expect(first.locator('.shipment-strip')).toBeVisible();
  const id = new URL(first.url()).searchParams.get('shipment');
  receipt.shipmentId = id;
  const baseline = JSON.parse(fs.readFileSync(path.join(root, 'before-shipment.json'), 'utf8'));
  await command(id, { stage: 'asset', result: { ok: true, summary: 'Saved native equipment fixture for two-tab draft recovery', details: baseline.results.asset.details } });
  const url = `http://127.0.0.1:5173/?shipment=${id}#/app/plan`;
  await first.goto(url);
  const publish = first.getByRole('button', { name: 'Publish reviewed loading plan', exact: true });
  await expect(publish).toBeEnabled({ timeout: 20000 }); await publish.click();
  await expect(first.getByText('Reviewed cargo and loading plan saved to the shipment. Continue to Pricing.', { exact: true })).toBeVisible();
  const saved = await get(id);
  const placements = saved.results.fit.details.placements;
  const unit = placements.reduce((furthest, item) => item.x > furthest.x ? item : furthest);
  await second.goto(url);
  await expect(second.getByRole('button', { name: 'Publish reviewed loading plan', exact: true })).toBeEnabled({ timeout: 20000 });
  const dirty = await selectUnit(first, unit.unitId);
  const baseX = Number(await dirty.inputValue());
  await dirty.fill(String(baseX + 10)); await dirty.blur();
  const remote = await selectUnit(second, unit.unitId);
  await remote.fill(String(baseX + 20)); await remote.blur();
  await second.getByRole('button', { name: 'Publish reviewed loading plan', exact: true }).click();
  await expect(second.getByText('Reviewed cargo and loading plan saved to the shipment. Continue to Pricing.', { exact: true })).toBeVisible();
  await expect(first.getByText('Shared inputs changed while you were editing. Your draft is retained. Review the incoming record, then explicitly load it to replace this working draft.', { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(dirty).toHaveValue(String(baseX + 10));
  await first.getByRole('button', { name: 'Load current shared inputs', exact: true }).click();
  const loaded = await selectUnit(first, unit.unitId);
  receipt.expectedX = baseX + 20; receipt.actualX = Number(await loaded.inputValue());
  await first.screenshot({ path: path.join(folder, 'explicit-draft-replacement.png') });
  assert.equal(receipt.actualX, receipt.expectedX, 'Explicit load must replace manual edits even when the input/solver hash is unchanged');
  await expect(first.getByRole('button', { name: 'Reset to solver plan', exact: true })).toHaveCount(0);
  assert.deepEqual(receipt.pageErrors, []);
  receipt.result = 'PASS';
})().catch(error => { receipt.result = 'FAIL'; receipt.failure = error.stack; process.exitCode = 1; }).finally(async () => {
  fs.writeFileSync(path.join(folder, 'receipt.json'), JSON.stringify(receipt, null, 2));
  if (browser) await browser.close();
  console.log(JSON.stringify(receipt, null, 2));
});
