const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const entries=[['command','Open shipment record ↗','shipment'],['cargo','Unit details ↗','unit:1'],['pricing','Quote details ↗','quote'],['hos','Duty details ↗','hos'],['assets','Equipment details ↗','equipment:0'],['telematics','Vehicle details ↗','telematics'],['warehouse','Receiving details ↗','receiving:1'],['yard','Door details ↗','door:6'],['trust','Carrier details ↗','carrier']];
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();const errors=[],requests=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')requests.push({method:r.method(),url:r.url()});});
 const drawer=()=>page.locator('#record-drawer');
 const tab=async name=>page.getByRole('tab',{name:new RegExp('^'+name)}).click();
 const close=async()=>{await page.getByRole('button',{name:'Close record details',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#record-drawer').open&&!new URL(location.href).searchParams.has('detail'));};
 try{
  for(const [id,label,key] of entries){
   await page.goto(`http://127.0.0.1:5192/index.html?density=${id}#${id}`,{waitUntil:'networkidle'});
   assert.ok(await page.locator('body').evaluate(e=>e.classList.contains('density-compact')));
   const before=await page.evaluate(()=>({font:getComputedStyle(document.querySelector('.queue td,.kv,.subtitle')).fontSize,canvas:document.querySelector('.scene svg')?.getBoundingClientRect().height}));
   await page.getByRole('button',{name:'Compact density',exact:true}).click();
   const comfortable=await page.evaluate(()=>({font:getComputedStyle(document.querySelector('.queue td,.kv,.subtitle')).fontSize,canvas:document.querySelector('.scene svg')?.getBoundingClientRect().height}));
   assert.equal(before.font,comfortable.font);assert.equal(before.canvas,comfortable.canvas);
   await page.getByRole('button',{name:'Comfortable density',exact:true}).click();
   await page.getByRole('button',{name:label,exact:true}).click();
   assert.equal(await drawer().getAttribute('data-record'),key);assert.equal(new URL(page.url()).searchParams.get('detail'),key);
   await tab('Checks');assert.ok(await page.locator('.check-row').count()>0);assert.ok(await page.locator('.check-status.unknown').count()>0);
   await tab('History');assert.equal(await page.locator('.event-button').count(),await page.evaluate(k=>DensityStudy.record(k).history.length,key));
   await tab('Source');await page.getByText('Full record JSON / all retained fields',{exact:true}).click();
   const raw=JSON.parse(await page.locator('.raw-record').first().locator('pre').innerText()),expected=await page.evaluate(k=>DensityStudy.record(k).raw,key);assert.deepEqual(raw,expected);
   await close();assert.equal(await page.evaluate(l=>document.activeElement.textContent.trim()===l,label),true);
   const position=await page.evaluate(()=>({x:scrollX,y:scrollY}));
   await page.getByRole('button',{name:label,exact:true}).click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#record-drawer').open);assert.deepEqual(await page.evaluate(()=>({x:scrollX,y:scrollY})),position);
   results.push({page:id,record:key,details:true,checks:true,history:true,sourceJSONLossless:true,focusRestored:true,fontAndCanvasUnchanged:true});console.log('Verified density record:',id);
  }
  await page.goto('http://127.0.0.1:5192/index.html#cargo',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Decision history',exact:true}).click();
  await page.getByRole('button',{name:/^Amend \/ input revision changed/}).click();assert.ok((await page.locator('.event-payload').innerText()).includes('1,200 lb'));assert.ok((await page.locator('.event-payload').innerText()).includes('1,250 lb'));
  const link=page.url();await page.reload({waitUntil:'networkidle'});assert.equal(await drawer().getAttribute('data-record'),'unit:1');assert.ok(await page.locator('.event-payload').isVisible());assert.equal(page.url(),link);
  await page.getByRole('tab',{name:'Details',exact:true}).click();await page.getByRole('button',{name:'Receiving location ↗',exact:true}).click();assert.ok((await page.locator('#record-title').innerText()).includes('R01-B02-L1-A'));
  await page.goBack();await page.waitForFunction(()=>document.querySelector('#record-drawer').dataset.record==='unit:1');
  await close();await page.getByRole('button',{name:'Find details…',exact:true}).click();await page.getByLabel('Find any study record', {exact:true}).fill('HU-02');await page.locator('.record-results [data-record="unit:2"]').click();assert.ok((await page.locator('#record-title').innerText()).startsWith('HU-02'));
  await close();await page.goto('http://127.0.0.1:5192/index.html#command',{waitUntil:'networkidle'});await page.locator('button[data-record="queue:0"]').click();assert.ok((await page.locator('#record-title').innerText()).startsWith('TRK-1045'));assert.equal(await page.locator('.event-button').count(),0);
  await close();await page.goto('http://127.0.0.1:5192/index.html?detail=unit%3A999&detailTab=details#cargo',{waitUntil:'networkidle'});assert.equal(await page.locator('#record-title').innerText(),'Record unavailable');
  await close();await page.goto('http://127.0.0.1:5192/index.html#pricing',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Fuel surcharge ↗',exact:true}).click();assert.ok((await drawer().innerText()).includes('5.08 / 6.8'));assert.ok((await drawer().innerText()).includes('70.97'));await page.screenshot({path:path.join(__dirname,'captures/density-fuel-drilldown.png')});
  await close();await page.goto('http://127.0.0.1:5192/index.html#cargo',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Unit details ↗',exact:true}).click();await page.screenshot({path:path.join(__dirname,'captures/density-unit-drilldown.png')});
  await close();await page.setViewportSize({width:390,height:844});
  for(const [id,label,key]of entries){
   await page.goto(`http://127.0.0.1:5192/index.html?mobile=${id}#${id}`,{waitUntil:'networkidle'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.getByRole('button',{name:label,exact:true}).click();assert.ok(await page.evaluate(()=>document.querySelector('#record-drawer').scrollWidth<=innerWidth));await tab('Source');await page.getByText('Full record JSON / all retained fields',{exact:true}).click();assert.ok(await page.evaluate(()=>document.querySelector('#record-drawer').scrollWidth<=innerWidth));if(id==='cargo')await page.screenshot({path:path.join(__dirname,'captures/density-mobile-drilldown.png')});await close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const receipt={checkedAt:new Date().toISOString(),scope:'Information-density visual study only',pages:results,mobileDrawers:9,checks:['all nine detail entry points','Details Checks History Source','lossless full-record JSON','unknown evidence remains unknown','original and amended history payloads','reloadable record/tab/event deep link','related record and browser Back','global record search','queue record identity','unknown record handling','fuel formula and rounding','focus restoration and Escape','unchanged font and canvas dimensions','mobile overflow containment','no non-GET requests'],pageErrors:errors,operationalRequests:requests,evidenceTier:4,sensitivity:'S1'};
  fs.writeFileSync(path.join(__dirname,'density-verification.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
