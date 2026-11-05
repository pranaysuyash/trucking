import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const root=path.dirname(fileURLToPath(import.meta.url));
const sharp=createRequire(import.meta.url)(process.env.SPATIAL_REVIEW_SHARP||'/Users/pranay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const revision=(await (await fetch('http://127.0.0.1:5195/api/revision')).json()).revision;
const cases=JSON.parse(await fs.readFile(path.join(root,'cases.json'),'utf8'));
const source=path.join(root,'captures/iterations',`browser-${revision}`),records=[];
for(const c of cases){
  const rec=JSON.parse(await fs.readFile(path.join(source,`${c.id}.json`),'utf8'));
  const original=path.join(root,rec.browserOriginal.path),bytes=await fs.readFile(original),meta=await sharp(bytes).metadata();
  if(rec.id!==c.id||rec.ready!==c.id||rec.painted!==c.id||rec.revision!==revision||rec.review!=='AWAITING YOUR REVIEW'||rec.error||meta.width!==1440||meta.height!==1024||!['jpeg','png'].includes(meta.format))throw Error(`Invalid capture ${c.id}`);
  rec.browserOriginal.sha256=crypto.createHash('sha256').update(bytes).digest('hex');
  rec.deliveredEncoding=meta.format==='png'?'Original PNG; no resize or composition change':'PNG conversion of preserved JPEG original; no resize or composition change';
  records.push({rec,bytes,format:meta.format});
}
if(records.length!==120)throw Error('Expected 120 verified originals');
for(const {rec,bytes,format} of records){
  const destination=path.join(root,'captures',`${rec.id}.png`);
  if(format==='png')await fs.writeFile(destination,bytes);else await sharp(bytes).png().toFile(destination);
}
await fs.writeFile(path.join(root,'captures/capture-results.json'),JSON.stringify({capturedAt:new Date().toISOString(),viewport:{width:1440,height:1024},revision,captureMethod:'Browser originals retained with SHA-256; JPEG originals converted to PNG without resize',cases:records.map(r=>r.rec)},null,2)+'\n');
console.log(`Promoted ${records.length} verified captures at ${revision}`);
