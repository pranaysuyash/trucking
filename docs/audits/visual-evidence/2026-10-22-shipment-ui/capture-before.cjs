const { chromium } = require('/Users/pranay/Projects/pdf_editor/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
(async () => {
  const shipments = await (await fetch('http://127.0.0.1:5171/shipments')).json();
  let selected;
  for (const item of shipments) {
    const record = await (await fetch(`http://127.0.0.1:5171/shipments/${item.id}`)).json();
    if (record.results.asset?.ok) { selected = record; break; }
  }
  fs.writeFileSync(path.join(root, 'before-shipment.json'), JSON.stringify(selected ?? null, null, 2));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const observations = [];
  for (const [product, port, hash] of [['command',5170,''],['cargo',5173,'#/app/cargo'],['pricing',5174,'']]) {
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    for (const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
      await page.setViewportSize({width,height});
      await page.goto(`http://127.0.0.1:${port}/${selected ? `?shipment=${selected.id}` : ''}${hash}`);
      await page.waitForTimeout(2200);
      await page.screenshot({path:path.join(root,`before-${product}-${size}.png`)});
      observations.push({product,size,errors:[...errors],pageOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),workspaceHeight:await page.locator('.shipment-workspace').evaluate(el=>Math.round(el.getBoundingClientRect().height))});
    }
    await page.close();
  }
  fs.writeFileSync(path.join(root,'before-browser.json'),JSON.stringify({at:new Date().toISOString(),observations},null,2));
  await browser.close();
  console.log(JSON.stringify(observations));
})().catch(e=>{console.error(e);process.exitCode=1;});
