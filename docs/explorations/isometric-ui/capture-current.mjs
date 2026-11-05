// Local synthetic review capture; existing screenshots and decisions are retained.
import { chromium } from '/Users/pranay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const revision = (await (await fetch('http://127.0.0.1:5195/api/revision')).json()).revision;
const cases = JSON.parse(await fs.readFile(path.join(root, 'cases.json'), 'utf8'));
const dir = path.join(root, 'captures/iterations', `browser-${revision}`);
await fs.mkdir(dir, {recursive:true});
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page = await browser.newPage({viewport:{width:1440,height:1024},deviceScaleFactor:1,reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:5195/review.html?case=CF-02', {waitUntil:'domcontentloaded'});
  for (const c of cases) {
    const recordPath=path.join(dir, `${c.id}.json`), imagePath=path.join(dir, `${c.id}.png`);
    try { const saved=JSON.parse(await fs.readFile(recordPath,'utf8')); if(saved.revision===revision && (await fs.stat(imagePath)).size>0) continue; } catch {}
    await page.locator(`a[data-case="${c.id}"]`).evaluate(el=>el.click());
    await page.waitForFunction(id=>document.querySelector('#stage')?.dataset.painted===id,c.id,{timeout:30000});
    const record=await page.evaluate(id=>{const stage=document.querySelector('#stage'), b=stage.getBoundingClientRect();return {...stage.dataset,id,title:document.querySelector('h1').textContent,review:document.querySelector('#decision-state').textContent,viewport:{width:innerWidth,height:innerHeight},top:scrollY,clip:{left:Math.round(b.left),top:Math.round(b.top),width:Math.round(b.width),height:Math.round(b.height)},error:document.querySelector('.study-error')?.textContent||null,pageWidth:document.documentElement.scrollWidth};},c.id);
    if(record.revision!==revision || record.ready!==c.id || record.painted!==c.id || record.review!=='AWAITING YOUR REVIEW' || record.quality!=='studio' || record.pageWidth!==1440 || record.error) throw Error(`Invalid state: ${JSON.stringify(record)}`);
    await page.screenshot({path:imagePath});
    record.browserOriginal={path:`captures/iterations/browser-${revision}/${c.id}.png`,format:'png'};
    record.capturedAt=new Date().toISOString();
    await fs.writeFile(recordPath,JSON.stringify(record,null,2)+'\n');
    console.log(c.id);
  }
} finally { await browser.close(); }
