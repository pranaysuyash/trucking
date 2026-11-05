// Browser verification for the isolated visual study, not the product suite.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const pages=['command','cargo','pricing','hos','assets','telematics','warehouse','yard','trust'];
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});const errors=[];const checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 mobile.on('pageerror',e=>errors.push(e.message));
 try{
  for(const key of pages){
   await page.goto(`http://127.0.0.1:5192/index.html?screen=${key}#${key}`,{waitUntil:'networkidle'});
   assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('nav[aria-label="Product pages"] a[aria-current="page"]').count(),1);
   await page.screenshot({path:path.join(__dirname,`captures/${key}-desktop.png`)});
   await page.getByRole('button',{name:'Shipment mode',exact:false}).click();
   assert.equal(await page.getByRole('button',{name:'Standalone mode',exact:false}).count(),1);
   assert.equal(await page.getByRole('region',{name:'Shipment context'}).count(),0);
   await page.getByRole('button',{name:'Standalone mode',exact:false}).click();
   if(key!=='command')assert.equal(await page.getByRole('region',{name:'Shipment context'}).count(),1);
   await mobile.goto(`http://127.0.0.1:5192/index.html?screen=${key}#${key}`,{waitUntil:'networkidle'});
   const bounds=await mobile.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert.ok(bounds.document<=bounds.viewport,`${key}: no page-level horizontal overflow`);
   await mobile.screenshot({path:path.join(__dirname,`captures/${key}-mobile.png`),fullPage:true});
   checks.push({page:key,desktopRendered:true,mobilePageOverflow:false,standaloneModeWorks:true});
  }
  await page.goto('http://127.0.0.1:5192/index.html#command',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Needs attention',exact:false}).click();assert.equal(await page.locator('tbody tr').count(),2);
  await page.getByRole('button',{name:'All shipments',exact:false}).click();await page.getByLabel('Search study shipments').fill('Milwaukee');assert.equal(await page.locator('tbody tr').count(),1);
  await page.getByLabel('Search study shipments').fill('');
  await page.getByRole('link',{name:'Cargo Fit',exact:true}).click();await page.getByRole('button',{name:'HU-02 / Replacement parts',exact:false}).click();assert.equal(await page.locator('.inspector-head h2').innerText(),'HU-02');
  await page.getByRole('button',{name:'Top',exact:true}).click();assert.equal(await page.locator('svg[aria-label="Top view of a trailer and two identified pallets"]').count(),1);
  await page.getByRole('button',{name:'Side',exact:true}).click();assert.equal(await page.locator('.scene svg').count(),1);
  await page.getByRole('link',{name:'Fleet Telematics',exact:true}).click();await page.getByRole('button',{name:'Preview arrival',exact:true}).click();assert.ok((await page.locator('main').innerText()).includes('Arrival preview'));
  await page.getByRole('button',{name:'Decision history',exact:true}).click();assert.equal(await page.locator('#record-drawer[open]').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
  await page.goto('http://127.0.0.1:5192/board.html',{waitUntil:'networkidle'});assert.equal(await page.locator('article').count(),9);await page.waitForFunction(()=>[...document.querySelectorAll('img')].every(x=>x.complete&&x.naturalWidth>0));
  await page.screenshot({path:path.join(__dirname,'captures/nine-page-board.png'),fullPage:true});
  assert.deepEqual(errors,[]);const receipt={checkedAt:new Date().toISOString(),scope:'Isolated UI visual study only',pages:checks,interactions:['product navigation','shipment/standalone mode','queue filter','shipment search','handling-unit selection','top/side projection','scenario arrival preview','review dialog and Escape close'],pageErrors:errors,evidenceTier:4,sensitivity:'S1',operationalWrites:false};
  fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
