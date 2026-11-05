import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

// Derivative crops and contact sheets only. Original browser captures are kept.
const root=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const sharp=require(process.env.SPATIAL_REVIEW_SHARP||'/Users/pranay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const cases=JSON.parse(await fs.readFile(path.join(root,'cases.json'),'utf8'));
const captured=JSON.parse(await fs.readFile(path.join(root,'captures','capture-results.json'),'utf8'));
const captureById=new Map(captured.cases.map(c=>[c.id,c]));
await fs.mkdir(path.join(root,'thumbnails'),{recursive:true});
await fs.mkdir(path.join(root,'contact-sheets'),{recursive:true});
const results=[];
for(const c of cases){
  const input=path.join(root,'captures',`${c.id}.png`);
  const bytes=await fs.readFile(input),meta=await sharp(bytes).metadata();
  // All source captures use the verified 1440 x 1024 desktop viewport. The crop
  // isolates the workbench, while the linked original retains review context.
  const region=captureById.get(c.id)?.clip||{left:270,top:215,width:Math.min(1130,meta.width-270),height:480};
  await sharp(bytes).extract(region).png().toFile(path.join(root,'thumbnails',`${c.id}.png`));
  results.push({id:c.id,capture:`captures/${c.id}.png`,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),width:meta.width,height:meta.height,thumbnailCrop:region});
}
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const group of [...new Set(cases.map(c=>c.product))]){
  const items=cases.filter(c=>c.product===group),layers=[];
  for(const [i,c] of items.entries()){
    const x=18+(i%3)*378,y=18+Math.floor(i/3)*205;
    const thumb=await sharp(path.join(root,'thumbnails',`${c.id}.png`)).resize(360,156,{fit:'contain',background:'#edf2f8'}).png().toBuffer();
    layers.push({input:thumb,left:x,top:y});
    const caption=Buffer.from(`<svg width="360" height="30"><rect width="360" height="30" fill="#ffffff"/><text x="9" y="19" font-family="Arial,sans-serif" font-size="11" fill="#214775">${escape(c.id+' / '+c.title)}</text></svg>`);
    layers.push({input:caption,left:x,top:y+156});
  }
  await sharp({create:{width:1152,height:840,channels:3,background:'#f6f9fd'}}).composite(layers).png().toFile(path.join(root,'contact-sheets',`${group}.png`));
}
await fs.writeFile(path.join(root,'captures','artifact-index.json'),JSON.stringify({generatedAt:new Date().toISOString(),count:results.length,artifacts:results},null,2)+'\n');
console.log(JSON.stringify({captures:results.length,thumbnails:results.length,contactSheets:10,uniqueImages:new Set(results.map(r=>r.sha256)).size}));
