const playwrightModule=process.env.PLAYWRIGHT_MODULE || '/Users/pranay/Projects/pdf_editor/node_modules/playwright';
const { chromium } = require(playwrightModule);
const { expect } = require(`${playwrightModule}/test`);
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const out = process.env.SHIPMENT_UI_EVIDENCE_DIR || path.resolve(__dirname,'../docs/audits/visual-evidence/2026-10-22-shipment-ui');
fs.mkdirSync(out, { recursive: true });
const baselineFile = path.resolve(__dirname,'../docs/audits/visual-evidence/2026-10-22-shipment-ui/before-shipment.json');
const api = 'http://127.0.0.1:5171';
const receipt = { checkedAt:new Date().toISOString(), scope:'Local native shipment UI slice', checks:[], observations:[], pageErrors:[], evidenceTier:4, sensitivity:'S1', externalProviderCalls:false };
let browser, context, page;
const check = name => { receipt.checks.push(name); console.log('PASS',name); };
async function get(id) { const r=await fetch(`${api}/shipments/${id}`);assert.equal(r.status,200);return r.json(); }
async function post(id,type,payload,productId) {
  const current=await get(id);
  const r=await fetch(`${api}/shipments/${id}/commands`,{method:'POST',headers:{Origin:'http://127.0.0.1:5170','Content-Type':'application/json'},body:JSON.stringify({type,payload,productId,expectedRevision:current.revision,operationId:randomUUID()})});
  const body=await r.json();assert.equal(r.status,200,JSON.stringify(body));return body;
}
async function settle() { await page.waitForTimeout(350); }
async function noOverflow(label) {
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+2&&getComputedStyle(el).position!=='fixed';}).slice(0,12).map(el=>({tag:el.tagName,class:el.className,right:Math.round(el.getBoundingClientRect().right)}))}));
  receipt.observations.push({label,...dimensions});assert.ok(dimensions.scroll<=dimensions.width,`${label}: ${JSON.stringify(dimensions)}`);
}
async function inspect(record,tab='details') {
  const url=new URL(page.url());url.searchParams.set('record',record);url.searchParams.set('inspectorTab',tab);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });await expect(page.locator('dialog.shipment-inspector')).toBeVisible();await settle();
}
async function capturePages(baseline) {
  for(const [product,port,hash] of [['command',5170,''],['cargo',5173,'#/app/cargo'],['pricing',5174,'']]) {
    const baselineUrl=`http://127.0.0.1:${port}/?shipment=${baseline.id}${hash}`;
    for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
      await page.setViewportSize({width,height});await page.goto(baselineUrl, { waitUntil: 'domcontentloaded' });await page.waitForTimeout(1800);
      await noOverflow(`${product}-${size}`);
      receipt.observations.push({product,size,workspaceHeight:await page.locator('.shipment-workspace').evaluate(el=>Math.round(el.getBoundingClientRect().height))});
      await page.screenshot({path:path.join(out,`after-${product}-${size}.png`)});
      if(size==='mobile') {
        await page.getByRole('button',{name:'Shipment details',exact:true}).click();await expect(page.locator('dialog.shipment-inspector')).toBeVisible();await noOverflow(`${product}-mobile-inspector`);
        await page.screenshot({path:path.join(out,`after-${product}-mobile-inspector.png`)});await page.keyboard.press('Escape');
      }
    }
    await page.goto(`http://127.0.0.1:${port}/${hash}`, { waitUntil: 'domcontentloaded' });await settle();
    await expect(page.locator('.shipment-strip')).toHaveCount(0);
    if(product==='cargo') { await expect(page.getByRole('table',{name:'Cargo manifest'})).toBeVisible();await page.getByLabel('Row 1 weight each').fill('1300'); }
    if(product==='pricing') { await expect(page.getByLabel('Loaded Miles',{exact:true})).toHaveValue('920');await page.getByLabel('Current Retail Diesel Price per Gallon').fill('4.4'); }
  }
}
(async()=>{
  browser=await chromium.launch({channel:'chrome',headless:true});
  context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page=await context.newPage();
  page.on('pageerror',error=>receipt.pageErrors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  if(process.argv.includes('--visual-only')) {
    const baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
    await capturePages(baseline);
    await page.goto(`http://127.0.0.1:5174/?shipment=${baseline.id}`, { waitUntil: 'domcontentloaded' });
    const show=page.getByRole('button',{name:/Show Spatial 3D HUD/});
    await expect(page.getByText('Saved scenario estimate and local calculation',{exact:true})).toBeVisible();
    await expect(page.getByText('The saved record remains available in quote details and history. A local calculation does not replace accepted terms.',{exact:true})).toBeVisible();
    await expect(page.getByText(/Publish a current complete, independently checked loading plan/)).toHaveCount(0);
    await show.click();await expect(page.locator('canvas').first()).toBeVisible({timeout:15000});
    await page.waitForTimeout(700);await page.screenshot({path:path.join(out,'optional-pricing-view.png')});
    await page.getByRole('button',{name:/Hide Spatial 3D HUD/}).click();await expect(page.locator('canvas')).toHaveCount(0);
    check('optional Pricing renderer loads and toggles without replacing native inputs');
    check('completed legacy record keeps saved evidence without an impossible republish instruction');
    assert.deepEqual(receipt.pageErrors,[]);receipt.result='PASS';
    fs.writeFileSync(path.join(out,'visual-verification.json'),JSON.stringify(receipt,null,2));
    await browser.close();console.log(JSON.stringify(receipt.observations.filter(item=>item.workspaceHeight!==undefined)));return;
  }
  await page.goto('http://127.0.0.1:5170/', { waitUntil: 'domcontentloaded' });
  const reference=`UI acceptance ${new Date().toISOString()}`;
  await page.getByLabel('Scenario reference').fill(reference);
  await page.getByRole('button',{name:'Create local shipment',exact:true}).click();
  await expect(page.locator('.shipment-strip strong')).toHaveText(reference);
  const id=new URL(page.url()).searchParams.get('shipment');assert.ok(id);receipt.shipmentId=id;
  const initial=await get(id);
  const baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
  assert.ok(baseline?.results.asset?.ok,'Saved native asset snapshot required for test setup');
  await post(id,'evaluate',{stage:'asset',result:{ok:true,summary:'Saved native equipment snapshot for local UI acceptance fixture',details:baseline.results.asset.details}},'product-04-asset-studio');
  check('create shipment in real Command Center; seed only the native equipment prerequisite');
  await page.reload();await expect(page.locator('.shipment-strip strong')).toHaveText(reference);
  await page.getByRole('navigation',{name:'Connected shipment tasks'}).getByRole('link',{name:/Cargo/i}).click();
  await expect(page.getByLabel('Row 1 weight each')).toHaveValue('1200');
  await page.getByLabel('Row 1 weight each').fill('1250');
  await page.getByLabel('Row 2 identifier').fill(initial.input.units[0].description);
  const cargoPublish=page.getByRole('button',{name:'Publish reviewed loading plan',exact:true});
  await expect(cargoPublish).toBeEnabled({timeout:20000});await cargoPublish.click();
  await expect(page.getByText('Reviewed cargo and loading plan saved to the shipment. Continue to Pricing.',{exact:true})).toBeVisible();
  let saved=await get(id);
  assert.equal(saved.input.units[0].weightLbs,1250);assert.equal(saved.inputRevision,2);
  assert.equal(saved.input.units[1].description,initial.input.units[0].description);
  assert.deepEqual(saved.input.units.map(u=>[u.id,u.barcode]),initial.input.units.map(u=>[u.id,u.barcode]));
  assert.deepEqual(saved.results.fit.details.unitIds.slice().sort(),initial.input.units.map(u=>u.id).sort());
  assert.equal(saved.results.asset.reusedFromInputRevision,1);assert.ok(saved.results.fit.ok);
  check('native Cargo changes, repeated descriptions and original identities publish atomically');
  await page.goto(`http://127.0.0.1:5173/?shipment=${id}#/app/plan`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button',{name:'Publish reviewed loading plan',exact:true})).toBeEnabled({timeout:20000});
  assert.ok(await page.locator('body').textContent().then(text=>text.includes('Saved reviewed shipment arrangement')));
  check('reopen accepted native loading arrangement');
  await page.getByRole('link',{name:'Continue to Pricing',exact:true}).click();
  await expect(page.getByLabel('Loaded Miles',{exact:true})).toHaveValue('95');
  await page.getByLabel('Current Retail Diesel Price per Gallon').fill('5.2');
  await page.getByLabel('Billable Detention Hours').fill('1.5');
  const ratio=page.getByLabel('Target Operating Ratio Slider');await ratio.focus();await ratio.press('ArrowLeft');await ratio.press('ArrowLeft');await ratio.press('ArrowLeft');
  const reviewedOR=Number(await ratio.inputValue());
  const visibleReview=await page.getByRole('region',{name:'Connected quote acceptance'}).textContent().catch(()=>page.locator('[aria-label="Connected quote acceptance"]').textContent());
  const displayedTotal=Number(visibleReview.match(/USD ([\d.]+)/)[1]);
  await page.getByRole('button',{name:'Accept reviewed scenario estimate',exact:true}).click();
  await expect(page.getByText(/Accepted USD .*Exact inputs and terms are saved/)).toBeVisible();
  saved=await get(id);const q=saved.results.quote.details;
  assert.equal(q.totalCents,Math.round(displayedTotal*100));assert.equal(q.pricingInputs.profile.currentDieselPricePerGallon,5.2);assert.equal(q.pricingInputs.acc.detentionHours,1.5);assert.equal(q.pricingInputs.operatingRatio,reviewedOR);
  assert.equal(q.lines.reduce((sum,line)=>sum+line.cents,0),q.totalCents);assert.equal(q.fitRecordedAt,saved.results.fit.recordedAt);
  check('native Pricing diesel, OR and accessorials equal reviewed and accepted cents');
  await page.reload();await expect(page.getByLabel('Current Retail Diesel Price per Gallon')).toHaveValue('5.2');await expect(page.getByLabel('Billable Detention Hours')).toHaveValue('1.5');
  check('accepted Pricing assumptions reopen exactly');
  const opener=page.getByRole('button',{name:'Saved quote details',exact:true});await opener.click();
  await settle();await expect(page.locator('dialog.shipment-inspector')).toBeVisible();
  for(const tab of ['details','checks','history','source']) { await page.locator('.shipment-inspector-tabs').getByRole('button',{name:new RegExp(`^${tab}`,'i')}).click();await expect(page.locator('.shipment-inspector-content')).toBeVisible(); }
  await page.getByText('Complete selected record JSON',{exact:true}).click();
  const raw=JSON.parse(await page.getByLabel('Complete selected record JSON',{exact:true}).textContent());assert.deepEqual(raw,saved.results.quote);
  await page.getByRole('button',{name:`Shipment ${reference}`,exact:true}).click();await page.goBack();await expect(page.locator('.shipment-inspector-record-key')).toHaveText('stage:quote');
  await page.keyboard.press('Escape');await expect(page.locator('dialog.shipment-inspector')).toHaveCount(0);await expect(opener).toBeFocused();
  check('live record sections, lossless source, related Back, sustained StrictMode dialog and focus restoration');
  await inspect(`unit:${saved.input.units[0].id}`,'source');
  await page.getByText('Complete selected record JSON',{exact:true}).click();assert.deepEqual(JSON.parse(await page.getByLabel('Complete selected record JSON',{exact:true}).textContent()),saved.input.units[0]);
  await page.reload();await expect(page.locator('dialog.shipment-inspector')).toBeVisible();await expect(page.locator('.shipment-inspector-tabs button[aria-pressed=true]')).toHaveText(/source/i);
  await page.keyboard.press('Escape');
  await inspect('unit:unknown');await expect(page.getByText('This exact record was not found in the current shipment.',{exact:true})).toBeVisible();await page.keyboard.press('Escape');
  check('original barcode/source deep link and unknown-record abstention');
  const estimate=page.getByRole('button',{name:/Draft Freight Estimate/i}).first();
  await estimate.click();await expect(page.locator('dialog.freight-estimate-dialog')).toBeVisible();await settle();
  await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>Boolean(document.activeElement?.closest('dialog.freight-estimate-dialog'))));
  await page.emulateMedia({media:'print'});await page.pdf({path:path.join(out,'reviewed-estimate.pdf'),format:'A4',printBackground:true});await page.emulateMedia({media:'screen'});
  await page.keyboard.press('Escape');await expect(estimate).toBeFocused();
  check('draft estimate native modal, focus and printable document');
  // Another writer changes only a planning record while this operator has a draft.
  await page.getByLabel('Current Retail Diesel Price per Gallon').fill('5.9');
  await post(id,'evaluate',{stage:'quote',result:{ok:true,summary:saved.results.quote.summary,details:saved.results.quote.details}},'product-02-freight-pricing');
  await expect(page.getByText('Shared inputs changed while you were editing. Your draft is retained until you explicitly load the current shipment.',{exact:true})).toBeVisible({timeout:10000});
  await expect(page.getByLabel('Current Retail Diesel Price per Gallon')).toHaveValue('5.9');await expect(page.getByRole('button',{name:'Accept reviewed scenario estimate',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Load current shared inputs',exact:true}).click();await expect(page.getByLabel('Current Retail Diesel Price per Gallon')).toHaveValue('5.2');
  check('concurrent saved decision preserves dirty native draft and requires explicit recovery');
  // A saved cargo amendment invalidates previously accepted quote without erasing history.
  const previous=await get(id);await post(id,'cargo.amend',{units:previous.input.units.map((u,i)=>({...u,weightLbs:u.weightLbs+(i===0?25:0)}))},'product-01-cargo-fit');
  await expect(page.getByRole('button',{name:'Accept reviewed scenario estimate',exact:true})).toBeDisabled({timeout:10000});
  const amended=await get(id);assert.notEqual(amended.results.quote.inputRevision,amended.inputRevision);assert.ok(amended.events.some(e=>e.payload?.result?.details?.totalCents===q.totalCents));
  check('cargo amendment makes prior terms stale while exact accepted history survives');
  // Local service loss is isolated at the browser request boundary, not a server shutdown.
  await page.route(`${api}/**`,route=>route.abort());await page.waitForTimeout(2600);await expect(page.locator('.shipment-strip')).toContainText('Offline snapshot');
  await expect(page.getByRole('button',{name:'Accept reviewed scenario estimate',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Use standalone tools',exact:true}).first().click();
  await expect(page.getByText(/Detached local estimate/)).toBeVisible();await page.getByLabel('Current Retail Diesel Price per Gallon').fill('6.1');await expect(page.getByLabel('Current Retail Diesel Price per Gallon')).toHaveValue('6.1');
  await page.unroute(`${api}/**`);check('offline snapshot, disabled shared save and editable detached local estimate');
  await capturePages(baseline);
  check('same-record before/after desktop and mobile, all three standalone native workbenches');
  assert.deepEqual(receipt.pageErrors,[]);
  receipt.result='PASS';fs.writeFileSync(path.join(out,'browser-verification.json'),JSON.stringify(receipt,null,2));
  await browser.close();console.log(JSON.stringify(receipt,null,2));
})().catch(async error=>{
  receipt.result='FAIL';receipt.failure=error.stack;fs.writeFileSync(path.join(out,'browser-verification.json'),JSON.stringify(receipt,null,2));
  if(page)await page.screenshot({path:path.join(out,'verification-failure.png')}).catch(()=>{});
  if(browser)await browser.close();console.error(error);process.exitCode=1;
});
