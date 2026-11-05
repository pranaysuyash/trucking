// Uses an already installed Playwright and Chrome; never installs a browser.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const evidenceRoot = process.env.SHIPMENT_FLOW_EVIDENCE_DIR || path.join(root, 'docs/audits/visual-evidence/2026-10-22-shipment-ui/full-flow-regression');
const startedAt = new Date().toISOString();
// Every attempt is preserved, including failures; earlier shipment-flow evidence stays intact.
const evidence = path.join(evidenceRoot, `run-${startedAt.replaceAll(':','-')}-${process.pid}`);
const api = 'http://127.0.0.1:5171';
const stages = [['asset',5176],['fit',5173],['warehouse',5178],['yard',5179],['carrier',5180],['hos',5175],['quote',5174]];
const workspace = page => page.getByRole('region', {name:'Connected shipment workspace'});
const errors = [];
let step = 'launch installed Chrome';
let shipmentId = null;
async function getShipment(id) { const r=await fetch(`${api}/shipments/${id}`); assert.equal(r.status,200); return r.json(); }
async function waitForShipment(id, predicate, description) {
  const deadline=Date.now()+30000;
  let saved;
  do {
    saved=await getShipment(id);
    if(predicate(saved)) return saved;
    await new Promise(resolve=>setTimeout(resolve,200));
  } while(Date.now()<deadline);
  assert.fail(`Shipment wait timed out: ${description}; current status ${saved?.status}, revision ${saved?.revision}`);
}
async function planningDetails(page) {
  const details=workspace(page).locator(':scope > details').first();
  await details.waitFor();
  if(await details.getAttribute('open')===null) await details.locator(':scope > summary').click();
}
async function enabled(button) {
  await button.waitFor({state:'visible'});
  const deadline=Date.now()+90000;
  while(await button.isDisabled()) {
    assert.ok(Date.now()<deadline,`Control never became enabled: ${await button.innerText()}`);
    await new Promise(resolve=>setTimeout(resolve,200));
  }
}
async function publishStage(page, portal, id, stage, port) {
  step=`publish ${stage} from product ${port}`;
  await page.goto(`http://127.0.0.1:${port}/?shipment=${id}${stage==='fit'?'#/app/cargo':''}`,{waitUntil:'domcontentloaded'});
  await planningDetails(page);
  const name={asset:'Publish reviewed equipment',fit:'Publish reviewed loading plan',warehouse:'Publish reviewed receiving plan',yard:'Publish reviewed dock allocation',carrier:'Publish reviewed carrier policy',hos:'Publish reviewed duty plan',quote:'Accept reviewed scenario estimate'}[stage];
  const button=page.getByRole('button',{name,exact:true});
  // Native publication is enabled only for the currently solved/reviewed draft.
  await enabled(button);
  await button.click();
  const saved=await waitForShipment(id,s=>s.results[stage]?.ok===true&&s.results[stage].inputRevision===s.inputRevision,`${stage} current accepted result`);
  await workspace(page).locator(`[data-stage="${stage}"]`).getByText('Recorded',{exact:true}).waitFor();
  await planningDetails(portal);
  await workspace(portal).locator(`[data-stage="${stage}"]`).getByText('Recorded',{exact:true}).waitFor();
  if(stage==='fit') {
    assert.ok(saved.results.fit.details.nativeScenario,'Reviewed native Cargo scenario retained');
    assert.ok(saved.results.fit.details.nativeResult,'Reviewed native solve retained');
    assert.deepEqual(saved.results.fit.details.placements.map(p=>p.unitId).sort(),saved.input.units.map(u=>u.id).sort());
  }
  if(stage==='quote') {
    const quote=saved.results.quote.details;
    assert.ok(quote.pricingInputs&&quote.nativeQuote,'Reviewed native quote and exact assumptions retained');
    assert.equal(quote.totalCents,Math.round(quote.nativeQuote.recommendedTotalRate*100));
    assert.equal(quote.totalCents,quote.lines.reduce((sum,line)=>sum+line.cents,0));
    assert.equal(quote.fitRecordedAt,saved.results.fit.recordedAt);
    assert.equal(quote.pricingInputs.lane.loadedMiles,saved.input.loadedMiles);
  }
  return saved;
}

(async () => {
  fs.mkdirSync(evidence,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
  const portal=await context.newPage(); portal.on('pageerror',e=>errors.push(e.message));
  try {
    for(const port of [5170,5173,5174,5175,5176,5177,5178,5179,5180]) {
      step=`standalone product ${port}`;
      await page.goto(`http://127.0.0.1:${port}`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(() => document.body.innerText.length > 100);
      assert.ok((await page.locator('body').innerText()).length>100,`Standalone product ${port} rendered`);
      await page.screenshot({path:path.join(evidence,`after-${port}-desktop.png`)});
    }
    await portal.goto('http://127.0.0.1:5170',{waitUntil:'domcontentloaded'});
    step='create local shipment through Command Center';
    await workspace(portal).getByLabel('Scenario reference').fill(`Browser verified shipment ${Date.now()}`);
    await workspace(portal).getByRole('button',{name:'Create local shipment',exact:true}).click();
    await portal.waitForURL(/shipment=/);
    const id=new URL(portal.url()).searchParams.get('shipment');
    shipmentId=id;
    await planningDetails(portal);
    assert.equal(await workspace(portal).getByRole('button',{name:'Approve scenario dispatch',exact:true}).isDisabled(),true);
    const initial=await getShipment(id); const unitIds=initial.input.units.map(u=>u.id);
    for(const [stage,port] of stages) {
      await publishStage(page,portal,id,stage,port);
      await page.screenshot({path:path.join(evidence,`connected-${stage}-desktop.png`)});
    }
    let s=await getShipment(id);
    assert.deepEqual(s.results.fit.details.unitIds.slice().sort(),unitIds.slice().sort());
    assert.deepEqual(s.results.warehouse.details.assignments.map(a=>a.unitId).slice().sort(),unitIds.slice().sort());
    step='full manifest amendment and stale decision gate';
    await workspace(portal).getByText('Amend shipment manifest',{exact:true}).click();
    await workspace(portal).getByLabel('First unit weight (lb)',{exact:true}).fill('1250');
    await workspace(portal).getByRole('button',{name:'Save manifest amendment',exact:true}).click();
    await workspace(portal).locator('[data-stage="fit"]').getByText('Stale',{exact:true}).waitFor();
    assert.equal(await workspace(portal).getByRole('button',{name:'Approve scenario dispatch',exact:true}).isDisabled(),true);
    for(const [stage,port] of stages) {
      await publishStage(page,portal,id,stage,port);
    }
    s=await getShipment(id); assert.equal(s.inputRevision,2); assert.equal(s.input.units[0].weightLbs,1250);
    assert.equal(s.events[0].payload.input.units[0].weightLbs,1200);
    assert.equal(s.events.find(e=>e.type==='amend').payload.input.units[0].weightLbs,1250);
    step='stale write rejection and dispatch';
    // Duplicate and stale writes are exercised against this same live scenario.
    const bad=await fetch(`${api}/shipments/${id}/commands`,{method:'POST',headers:{Origin:'http://127.0.0.1:5170','Content-Type':'application/json'},body:JSON.stringify({type:'dispatch',productId:'command-center-portal',operationId:crypto.randomUUID(),expectedRevision:1,payload:{}})});
    assert.equal(bad.status,409);
    const dispatch=workspace(portal).getByRole('button',{name:'Approve scenario dispatch',exact:true});
    await enabled(dispatch); await dispatch.click();
    await waitForShipment(id,s=>s.status==='dispatched','dispatched');
    await page.goto(`http://127.0.0.1:5177/?shipment=${id}`,{waitUntil:'domcontentloaded'});
    await planningDetails(page);
    step='ordered departure and arrival';
    const departure=page.getByRole('button',{name:'Record scenario departure',exact:true});
    await enabled(departure); await departure.click();
    await waitForShipment(id,s=>s.status==='in_transit','in_transit');
    const arrival=page.getByRole('button',{name:'Record scenario arrival',exact:true});
    await enabled(arrival); await arrival.click();
    await waitForShipment(id,s=>s.status==='arrived','arrived');
    await page.getByLabel('Exception reason',{exact:true}).fill('Scenario receiving delay requires review.');
    await page.getByRole('button',{name:'Report shipment exception',exact:true}).click();
    await page.getByText(/Scenario receiving delay requires review/).first().waitFor();
    await page.goto(`http://127.0.0.1:5178/?shipment=${id}`,{waitUntil:'domcontentloaded'});
    await planningDetails(page);
    step='manual receipt with wrong barcode rejection';
    s=await getShipment(id);
    await page.getByLabel('Receiver name',{exact:true}).fill('Local scenario receiver');
    const assignments=s.results.warehouse.details.assignments;
    for(const u of s.input.units) {
      await page.getByLabel(`Handling unit ${s.input.units.indexOf(u)+1} barcode`,{exact:true}).fill(u.barcode);
      await page.getByLabel(`Handling unit ${s.input.units.indexOf(u)+1} location`,{exact:true}).fill(assignments.find(a=>a.unitId===u.id).slotCode);
    }
    const first=s.input.units[0];
    await page.getByLabel('Handling unit 1 barcode',{exact:true}).fill('WRONG-BARCODE');
    await page.getByRole('button',{name:'Confirm manual scenario receipt',exact:true}).click();
    await page.getByText(/barcode does not match|barcode differs|barcode mismatch/i).first().waitFor();
    assert.equal((await getShipment(id)).status,'arrived');
    await page.getByLabel('Handling unit 1 barcode',{exact:true}).fill(first.barcode);
    await page.getByRole('button',{name:'Confirm manual scenario receipt',exact:true}).click();
    await waitForShipment(id,s=>s.status==='delivered','delivered');
    step='exception blocks invoice, explicit resolution and reconciled invoice';
    await workspace(portal).getByRole('button',{name:'Prepare reconciled invoice',exact:true}).waitFor();
    assert.equal(await workspace(portal).getByRole('button',{name:'Prepare reconciled invoice',exact:true}).isDisabled(),true);
    await workspace(portal).getByLabel('Exception resolution',{exact:true}).fill('Receiving completed; local scenario delay reviewed with no additional charge.');
    await workspace(portal).getByRole('button',{name:'Resolve exception',exact:true}).click();
    await portal.waitForFunction(()=>!document.querySelector('.shipment-exceptions button'));
    await workspace(portal).getByRole('button',{name:'Prepare reconciled invoice',exact:true}).click();
    await workspace(portal).getByText('Invoice ready for export',{exact:true}).waitFor();
    s=await getShipment(id);
    assert.equal(s.status,'invoice_ready'); assert.equal(s.invoice.totalCents,s.results.quote.details.totalCents);
    assert.deepEqual(s.delivery.units.map(u=>u.id).sort(),unitIds.slice().sort());
    assert.deepEqual(s.delivery.units.map(u=>({id:u.id,barcode:u.barcode,slotCode:u.slotCode})).sort((a,b)=>a.id.localeCompare(b.id)),assignments.map(a=>({id:a.unitId,barcode:a.barcode,slotCode:a.slotCode})).sort((a,b)=>a.id.localeCompare(b.id)));
    step='reload persistence and mobile workspace';
    await portal.reload({waitUntil:'domcontentloaded'});
    await planningDetails(portal);
    await workspace(portal).getByText('Invoice ready for export',{exact:true}).waitFor();
    await portal.screenshot({path:path.join(evidence,'invoice-ready-desktop.png')});
    await portal.setViewportSize({width:390,height:844});
    await portal.screenshot({path:path.join(evidence,'invoice-ready-mobile.png')});
    const bounds=await portal.locator('.shipment-workspace').boundingBox(); assert.ok(bounds.width<=390);
    const receipt={startedAt,completedAt:new Date().toISOString(),evidenceDirectory:evidence,evidenceTier:4,testSensitivity:'S1',shipmentId:id,status:s.status,inputRevision:s.inputRevision,recordRevision:s.revision,handlingUnitIds:unitIds,totalCents:s.invoice.totalCents,eventCount:s.events.length,pageErrors:errors,checks:['nine standalone renders','seven native engine adapters','native reviewed cargo publication and retained solve','native exact quote and assumptions retained','cross-origin portal updates','full manifest amendment invalidates decisions','all stages reevaluated at input revision 2','original and amended event payloads preserved','stale write rejected','dispatch gate','departure and arrival ordering','wrong barcode rejected','exact receipt IDs barcodes and assignments retained','exception blocks finance','resolution and exact invoice match','reload persistence','mobile workspace bounds']};
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(evidence,'browser-flow-receipt.json'),JSON.stringify(receipt,null,2));
    console.log(JSON.stringify(receipt,null,2));
  } catch(error) {
    await page.screenshot({path:path.join(evidence,'failure-product.png')}).catch(()=>{});
    await portal.screenshot({path:path.join(evidence,'failure-portal.png')}).catch(()=>{});
    throw error;
  } finally {await browser.close();}
})().catch(e=>{
  fs.mkdirSync(evidence,{recursive:true});
  fs.writeFileSync(path.join(evidence,'failed-attempt.json'),JSON.stringify({startedAt,failedAt:new Date().toISOString(),step,shipmentId,evidenceDirectory:evidence,error:e.stack||String(e),pageErrors:errors},null,2));
  console.error(e); console.error(`Attempt evidence preserved: ${evidence}`); process.exitCode=1;
});
