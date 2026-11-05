const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const runtime = process.env.PLAYWRIGHT_MODULE || '/Users/pranay/Projects/pdf_editor/node_modules/playwright';
const { chromium } = require(runtime);
const { expect } = require(`${runtime}/test`);
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'docs/audits/visual-evidence/2026-10-22-suite-completion');
const folder = path.join(base, `operations-${new Date().toISOString().replace(/[:.]/g, '-')}`);
fs.mkdirSync(folder, { recursive: true });
const receipt = { startedAt: new Date().toISOString(), checks: [], observations: [], pageErrors: [], evidenceTier: 4, sensitivity: 'S1', scope: 'Native suite decisions, recovery, mobile and canonical spatial/temporal views' };
const api = 'http://127.0.0.1:5171';
let browser, page, release;
const check = name => { receipt.checks.push(name); console.log('PASS', name); };
async function get(id) { const response = await fetch(`${api}/shipments/${id}`); assert.equal(response.status, 200); return response.json(); }
async function command(id, type, payload, productId = 'command-center-portal') {
  const s = await get(id);
  const response = await fetch(`${api}/shipments/${id}/commands`, { method: 'POST', headers: { Origin: 'http://127.0.0.1:5170', 'Content-Type': 'application/json' }, body: JSON.stringify({ type, payload, productId, expectedRevision: s.revision, operationId: randomUUID() }) });
  const result = await response.json(); assert.equal(response.status, 200, JSON.stringify(result)); return result;
}
async function width(label) {
  const observation = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, outside: [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 10).map(el => ({ tag: el.tagName, class: el.className, right: Math.round(el.getBoundingClientRect().right) })) }));
  receipt.observations.push({ label, ...observation }); assert.ok(observation.document <= observation.viewport, `${label}: ${JSON.stringify(observation)}`);
}
(async () => {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page = await context.newPage(); page.on('pageerror', error => receipt.pageErrors.push(error.message)); page.on('dialog', dialog => dialog.accept());
  const run = fs.readdirSync(path.join(base, 'full-flow')).sort().reverse().find(name => {
    const file = path.join(base, 'full-flow', name, 'browser-flow-receipt.json');
    return fs.existsSync(file) && JSON.parse(fs.readFileSync(file, 'utf8')).status === 'invoice_ready';
  });
  assert.ok(run, 'A retained successful full-flow fixture is required; failed attempts remain preserved.');
  const full = JSON.parse(fs.readFileSync(path.join(base, 'full-flow', run, 'browser-flow-receipt.json'), 'utf8'));
  assert.equal(full.status, 'invoice_ready'); receipt.completedShipmentId = full.shipmentId;
  await page.goto(`http://127.0.0.1:5170/?shipment=${full.shipmentId}`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Shipment overview, spatial plan and timeline', { exact: true }).click();
  await page.locator('.shipment-canvas').getByRole('button', { name: 'Timeline', exact: true }).click();
  await page.locator('.shipment-canvas').getByRole('button', { name: 'Replay manifest here', exact: true }).first().click();
  await expect(page.getByRole('region', { name: 'Historical manifest replay' })).toContainText('1,200 lb');
  await page.locator('.shipment-canvas').getByRole('button', { name: 'Spatial', exact: true }).click();
  await expect(page.locator('.shipment-canvas table')).toContainText('1,250 lb');
  assert.ok(!(await page.locator('.shipment-canvas table').textContent()).includes('1,200 lb'));
  await page.screenshot({ path: path.join(folder, 'spatial-current-after-replay.png') });
  await page.getByLabel('Find unit by description, original ID or barcode').fill(full.handlingUnitIds[0]);
  await expect(page.locator('.shipment-canvas table tbody tr')).toHaveCount(1);
  await page.getByLabel('Find unit by description, original ID or barcode').fill('');
  check('historical manifest replay stays separate from current spatial geometry, mass and unit search');
  await page.locator('.shipment-canvas').getByRole('button', { name: 'Timeline', exact: true }).click();
  await page.locator('.shipment-canvas').getByRole('combobox', { name: /Event type/ }).selectOption('deliver');
  await expect(page.locator('.shipment-canvas-timeline > li')).toHaveCount(1);
  await page.locator('.shipment-canvas-timeline').getByRole('button', { name: 'Inspect event payload', exact: true }).click();
  await expect(page.locator('dialog.shipment-inspector')).toBeVisible(); await page.keyboard.press('Escape');
  check('timeline filters retained events and opens the exact canonical event inspector');
  await page.getByRole('button', { name: 'Inspect invoice record', exact: true }).click();
  await expect(page.locator('dialog.shipment-inspector')).toContainText('Draft invoice evidence'); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Inspect receipt evidence', exact: true }).click();
  await expect(page.locator('dialog.shipment-inspector')).toContainText('Manual scenario receipt'); await page.keyboard.press('Escape');
  const downloadWait = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export invoice evidence JSON', exact: true }).click();
  const download = await downloadWait; const downloadPath = path.join(folder, download.suggestedFilename()); await download.saveAs(downloadPath);
  const exported = JSON.parse(fs.readFileSync(downloadPath, 'utf8')); assert.equal(exported.id, full.shipmentId); assert.equal(exported.invoice.totalCents, 28787); assert.equal(exported.delivery.units.length, exported.input.units.length);
  check('invoice and receipt inspect independently, and actual evidence download reconciles to accepted terms');
  // A fresh native fixture tests choice and concurrency, without changing old records.
  await page.goto('http://127.0.0.1:5170/', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Scenario reference', { exact: true }).fill(`Native choices and response race ${receipt.startedAt}`);
  await page.getByRole('button', { name: 'Create local shipment', exact: true }).click(); await expect(page.locator('.shipment-strip')).toBeVisible();
  const id = new URL(page.url()).searchParams.get('shipment'); receipt.draftShipmentId = id;
  await page.goto(`http://127.0.0.1:5176/?shipment=${id}`, { waitUntil: 'domcontentloaded' });
  const equipment = page.getByRole('combobox', { name: 'Select Commercial Cargo Vehicle', exact: true });
  await expect(equipment).toHaveValue('dry-van-53'); await equipment.selectOption('reefer-53');
  await page.getByRole('button', { name: 'Publish reviewed equipment', exact: true }).click();
  await expect(page.getByText('Reviewed equipment snapshot published. Continue to Cargo Fit to review the affected loading plan.', { exact: true })).toBeVisible();
  let s = await get(id); assert.equal(s.input.equipmentId, 'reefer-53'); assert.equal(s.results.asset.details.nativeVehicle.id, 'reefer-53'); assert.equal(s.inputRevision, 2);
  await equipment.selectOption('dry-van-53'); await page.getByRole('button', { name: 'Publish reviewed equipment', exact: true }).click();
  await expect(equipment).toHaveValue('dry-van-53');
  await expect(page.getByText('Reviewed equipment snapshot published. Continue to Cargo Fit to review the affected loading plan.', { exact: true })).toBeVisible();
  s = await get(id); assert.equal(s.inputRevision, 3); assert.equal(s.results.asset.details.nativeVehicle.id, 'dry-van-53');
  check('native equipment changes publish the selected exact snapshot and retained input revisions');
  await page.getByRole('button', { name: 'Shipment details', exact: true }).click();
  await page.locator('.shipment-inspector-tabs').getByRole('button', { name: 'source', exact: true }).click();
  const sourceField = page.locator('.shipment-inspector-fields > div').filter({ has: page.locator('dt code', { hasText: 'manifestSourceEventIds' }) });
  await sourceField.locator('summary').click();
  for (const event of s.events.filter(e => e.type === 'created' || e.type === 'asset.publish')) await expect(sourceField).toContainText(event.id);
  await page.keyboard.press('Escape'); check('manifest Source retains creation and narrow equipment amendment provenance');
  const malformed = { ok: true, summary: 'Deliberately overlapping reviewed plan', details: { provenance: { source: 'reviewed_native_arrangement' }, geometryFeasible: true, violations: 0, unitIds: s.input.units.map(u => u.id), equipmentSnapshot: { L: s.results.asset.details.lengthIn * 25.4, W: s.results.asset.details.widthIn * 25.4, H: s.results.asset.details.heightIn * 25.4 }, placements: s.input.units.map(u => ({ unitId: u.id, x: 0, y: 0, z: 0, dx: u.lengthIn * 25.4, dy: u.widthIn * 25.4, dz: u.heightIn * 25.4 })) } };
  const bad = await fetch(`${api}/shipments/${id}/commands`, { method: 'POST', headers: { Origin: 'http://127.0.0.1:5173', 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'cargo.publish', payload: { units: s.input.units, result: malformed }, productId: 'product-01-cargo-fit', expectedRevision: s.revision, operationId: randomUUID() }) });
  const badBody = await bad.json(); assert.equal(bad.status, 422, JSON.stringify(badBody)); assert.match(badBody.error, /overlap/); assert.equal((await get(id)).revision, s.revision);
  check('live API rejects overlapping reviewed geometry atomically');
  await page.goto(`http://127.0.0.1:5180/?shipment=${id}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Veloce Transit Solutions LLC/ }).click();
  await page.getByRole('button', { name: 'Publish reviewed carrier policy', exact: true }).click();
  await expect.poll(async () => (await get(id)).input.carrierDot).toBe('410928');
  s = await get(id); assert.equal(s.results.carrier.ok, false); assert.equal(s.results.carrier.details.dotNumber, '410928');
  await expect(page.locator('.shipment-native-panel')).toContainText('DO_NOT_DISPATCH');
  await page.getByRole('button', { name: /Apex Freight Lines LLC/ }).click();
  await page.getByRole('button', { name: 'Publish reviewed carrier policy', exact: true }).click();
  await expect.poll(async () => (await get(id)).input.carrierDot).toBe('389211');
  s = await get(id); assert.equal(s.results.carrier.ok, true); assert.equal(s.results.carrier.details.nativeReview.profile.dotNumber, '389211');
  check('native carrier choice preserves a blocked policy outcome and explicit approved recovery');
  // Hold the response after commit, edit locally and allow a newer write to be polled.
  await page.goto(`http://127.0.0.1:5175/?shipment=${id}`, { waitUntil: 'domcontentloaded' });
  const speed = page.getByRole('spinbutton', { name: 'Average Speed in Miles Per Hour', exact: true }); await expect(speed).toHaveValue('55'); await speed.fill('60');
  let committedResolve; const committed = new Promise(resolve => { committedResolve = resolve; });
  const held = new Promise(resolve => { release = resolve; });
  await page.route(`${api}/shipments/${id}/commands`, async route => {
    const body = route.request().postDataJSON();
    if (body.productId === 'product-03-hos-planner') { const response = await route.fetch(); receipt.submittedDutySpeed = body.payload.result.details.nativeInputs.avgSpeedMph; committedResolve(); await held; await route.fulfill({ response }); }
    else await route.continue();
  });
  const publishDuty = page.getByRole('button', { name: 'Publish reviewed duty plan', exact: true }); await expect(publishDuty).toBeEnabled(); await publishDuty.click(); await committed;
  await speed.fill('61'); const newer = await command(id, 'exception.open', { message: 'Independent writer advances revision during held response.' });
  await expect(page.getByText('The shipment changed. Your local duty draft is retained. Load current shared inputs before publishing.', { exact: true })).toBeVisible({ timeout: 10000 });
  release(); release = null; await page.waitForTimeout(600);
  await expect(speed).toHaveValue('61'); await expect(publishDuty).toBeDisabled();
  await expect(page.getByText('The shipment changed. Your local duty draft is retained. Load current shared inputs before publishing.', { exact: true })).toBeVisible();
  assert.equal((await get(id)).revision, newer.revision); assert.equal((await get(id)).results.hos.details.nativeInputs.avgSpeedMph, 60);
  await page.getByRole('button', { name: 'Load current shared inputs', exact: true }).click(); await expect(speed).toHaveValue('60');
  await page.unroute(`${api}/shipments/${id}/commands`);
  check('pending-save edits and newer polled revisions survive delayed older acknowledgement, with explicit recovery');
  const report = page.getByRole('button', { name: 'View / Print Duty Planning Report', exact: true }); await report.click();
  await expect(page.getByRole('dialog', { name: 'Modeled duty planning report' })).toBeVisible(); await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog'))));
  await page.emulateMedia({ media: 'print' }); await page.pdf({ path: path.join(folder, 'modeled-duty-report.pdf'), format: 'A4', printBackground: true }); await page.emulateMedia({ media: 'screen' });
  await page.keyboard.press('Escape'); await expect(report).toBeFocused(); check('modeled duty report has contained keyboard focus, Escape recovery and actual print output');
  await page.goto(`http://127.0.0.1:5170/?shipment=${full.shipmentId}`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Shipment overview, spatial plan and timeline', { exact: true }).click();
  for (const size of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    for (const mode of ['Overview', 'Spatial', 'Timeline']) {
      await page.locator('.shipment-canvas').getByRole('button', { name: mode, exact: true }).click();
      await width(`canvas-${mode.toLowerCase()}-${size.name}`);
      await page.locator('.shipment-canvas').screenshot({ path: path.join(folder, `canvas-${mode.toLowerCase()}-${size.name}.png`) });
    }
  }
  check('actual overview, accepted spatial arrangement and retained timeline fit desktop and390px with structured equivalents');
  // Same live records, nine product widths, details and native standalone fallback.
  for (const port of [5170, 5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://127.0.0.1:${port}/?shipment=${full.shipmentId}${port === 5173 ? '#/app/cargo' : ''}`, { waitUntil: 'domcontentloaded' }); await expect(page.locator('.shipment-strip')).toBeVisible({ timeout: 30000 }); await page.waitForTimeout(500);
    await width(`connected-${port}-mobile`); await page.screenshot({ path: path.join(folder, `connected-${port}-mobile.png`) });
    await page.getByRole('button', { name: 'Shipment details', exact: true }).click(); await expect(page.locator('dialog.shipment-inspector')).toBeVisible(); await width(`inspector-${port}-mobile`); await page.keyboard.press('Escape');
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(350); assert.ok((await page.locator('body').innerText()).length > 100); await expect(page.locator('.shipment-strip')).toHaveCount(0);
  }
  check('all nine native connected pages and inspectors fit390px and each product still renders independently');
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(`http://127.0.0.1:5176/?shipment=${id}`, { waitUntil: 'domcontentloaded' }); await expect(equipment).toHaveValue('dry-van-53');
  await page.route(`${api}/**`, route => route.abort()); await expect(page.locator('.shipment-strip')).toContainText('Offline snapshot', { timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Publish reviewed equipment', exact: true })).toBeDisabled(); await equipment.selectOption('reefer-53');
  await page.getByRole('button', { name: 'Use standalone tools', exact: true }).first().click(); await expect(page.locator('.shipment-strip')).toHaveCount(0); await expect(equipment).toHaveValue('reefer-53');
  await page.unroute(`${api}/**`); check('offline equipment draft remains editable and detaches without a shared save');
  assert.deepEqual(receipt.pageErrors, []); receipt.result = 'PASS';
})().catch(async error => { receipt.result = 'FAIL'; receipt.failure = error.stack; if (release) release(); if (page) await page.screenshot({ path: path.join(folder, 'failure.png') }).catch(() => {}); process.exitCode = 1; }).finally(async () => {
  receipt.completedAt = new Date().toISOString(); fs.writeFileSync(path.join(folder, 'receipt.json'), JSON.stringify(receipt, null, 2)); if (browser) await browser.close(); console.log(JSON.stringify(receipt, null, 2));
});
