import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
const root=new URL('../',import.meta.url);
const require=createRequire(new URL('products/product-01-cargo-fit/package.json',root));
const ts=require('typescript');
const load=source=>import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const sessionSource=fs.readFileSync(new URL('packages/shipment-flow/src/ShipmentSession.tsx',root),'utf8');
const mergeSource=ts.transpileModule(sessionSource.slice(sessionSource.indexOf('export function mergeShipmentSnapshot')),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {mergeShipmentSnapshot:merge}=await load(mergeSource);
const newer={id:'shipment-a',revision:8};const older={id:'shipment-a',revision:7};
assert.equal(merge(newer,older,'shipment-a'),newer);
assert.equal(merge(newer,{id:'shipment-b',revision:20},'shipment-a'),newer);
assert.equal(merge(newer,{id:'shipment-a',revision:9},'shipment-a').revision,9);
const mutatedMergeSource=mergeSource.replace('previous.revision >= next.revision','previous.revision === next.revision');
assert.notEqual(mutatedMergeSource,mergeSource);
const {mergeShipmentSnapshot:mutatedMerge}=await load(mutatedMergeSource);
assert.throws(()=>assert.equal(mutatedMerge(newer,older,'shipment-a'),newer));
const domainSource=fs.readFileSync(new URL('packages/shipment-flow/src/domain.mjs',root),'utf8').replace("'./reviewedGeometry.mjs'", JSON.stringify(new URL('packages/shipment-flow/src/reviewedGeometry.mjs',root).href));
function quoteWithoutFit(domain) {
  const s=domain.createShipment('Mutation fixture');
  return domain.applyCommand(s,{type:'evaluate',productId:'product-02-freight-pricing',expectedRevision:s.revision,operationId:randomUUID(),payload:{stage:'quote',result:{ok:true,summary:'Quote',details:{accepted:true,currency:'USD',totalCents:10000,lines:[{label:'Linehaul',cents:10000}]}}}});
}
const domain=await load(domainSource);assert.throws(()=>quoteWithoutFit(domain),/current loading plan/);
const mutatedDomainSource=domainSource.replace('shipment.results.fit?.ok && shipment.results.fit.inputRevision === shipment.inputRevision','true');
assert.notEqual(mutatedDomainSource,domainSource);
const mutatedDomain=await load(mutatedDomainSource);
assert.doesNotThrow(()=>quoteWithoutFit(mutatedDomain));
function overlappingReviewedPlan(domain) {
  let s=domain.createShipment('Overlapping geometry mutation fixture');
  const send=(type,payload,productId)=>domain.applyCommand(s,{type,payload,productId,expectedRevision:s.revision,operationId:randomUUID()});
  s=send('evaluate',{stage:'asset',result:{ok:true,summary:'Declared fixture envelope',details:{equipmentId:s.input.equipmentId,lengthIn:630,widthIn:100,heightIn:100,doorWidthIn:96,doorHeightIn:98,payloadLbs:45000}}},'product-04-asset-studio');
  return send('cargo.publish',{units:s.input.units,result:{ok:true,summary:'Deliberate overlap fixture',details:{geometryFeasible:true,violations:0,unitIds:s.input.units.map(u=>u.id),provenance:{source:'reviewed_native_arrangement'},equipmentSnapshot:{L:16002,W:2540,H:2540},placements:s.input.units.map(u=>({unitId:u.id,x:0,y:0,z:0,dx:u.lengthIn*25.4,dy:u.widthIn*25.4,dz:u.heightIn*25.4}))}}},'product-01-cargo-fit');
}
assert.throws(()=>overlappingReviewedPlan(domain),/overlap/);
const weakenedGeometry=domainSource.replace('requireThat(!geometryIssue,','requireThat(true,');
assert.notEqual(weakenedGeometry,domainSource);
const weakenedGeometryDomain=await load(weakenedGeometry);
assert.doesNotThrow(()=>overlappingReviewedPlan(weakenedGeometryDomain));
const receipt={checkedAt:new Date().toISOString(),result:'PASS',evidenceTier:2,sensitivity:'S3',sourceMutationsPerformed:false,checks:['late poll cannot roll back newer command','response for another selection ignored','newer response accepted','rollback mutation detected in isolated module','quote without current fit rejected','missing-fit guard mutation detected in isolated module','overlapping reviewed geometry rejected','removed geometry guard detected in isolated module']};
const output=process.env.SHIPMENT_INVARIANT_EVIDENCE_FILE || new URL('docs/audits/visual-evidence/2026-10-22-shipment-ui/invariant-verification.json',root);
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
