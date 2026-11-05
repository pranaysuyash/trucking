import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createShipment, applyCommand } from '../src/domain.mjs';
const at = '2026-10-22T14:00:00.000Z';
const cmd = (s,type,payload,productId) => ({type,payload,productId,operationId:randomUUID(),expectedRevision:s.revision});
function withAsset() {
  let s=createShipment('Native UI contract',at);
  const result={ok:true,summary:'Declared equipment snapshot',details:{equipmentId:s.input.equipmentId,lengthIn:630,widthIn:100,heightIn:100,doorWidthIn:98,doorHeightIn:98,payloadLbs:45000}};
  return applyCommand(s,cmd(s,'evaluate',{stage:'asset',result},'product-04-asset-studio'),at);
}
test('quote cannot be accepted before a current fit exists',()=>{
  const s=createShipment('No fit',at);
  const result={ok:true,summary:'Draft quote',details:{currency:'USD',accepted:true,lines:[{label:'Linehaul',cents:10000}],totalCents:10000}};
  assert.throws(()=>applyCommand(s,cmd(s,'evaluate',{stage:'quote',result},'product-02-freight-pricing'),at),/current loading plan/i);
});
test('cargo amendment preserves exact current asset evidence with explicit reuse provenance',()=>{
  const s=withAsset();
  const units=s.input.units.map((u,i)=>({...u,weightLbs:u.weightLbs+(i===0?50:0)}));
  const next=applyCommand(s,cmd(s,'cargo.amend',{units},'product-01-cargo-fit'),at);
  assert.equal(next.input.units[0].weightLbs,1250);
  assert.equal(next.inputRevision,2);
  assert.deepEqual(next.results.asset.details,s.results.asset.details);
  assert.equal(next.results.asset.inputRevision,2);
  assert.equal(next.results.asset.recordedAt,s.results.asset.recordedAt);
  assert.equal(next.results.asset.reusedFromInputRevision,1);
  assert.equal(next.events.at(-1).payload.units[0].barcode,s.input.units[0].barcode);
  assert.equal(s.input.units[0].weightLbs,1200);
});
test('cargo amendment cannot change identity, mint units, or amend another product fields',()=>{
  const s=withAsset();
  assert.throws(()=>applyCommand(s,cmd(s,'cargo.amend',{units:s.input.units.slice(1)},'product-01-cargo-fit'),at),/identified handling units/i);
  assert.throws(()=>applyCommand(s,cmd(s,'cargo.amend',{units:s.input.units.map((u,i)=>({...u,barcode:i===0?'other':u.barcode}))},'product-01-cargo-fit'),at),/barcode/i);
  assert.throws(()=>applyCommand(s,cmd(s,'cargo.amend',{units:s.input.units,input:{equipmentId:'other'}},'product-01-cargo-fit'),at),/only handling units/i);
  assert.throws(()=>applyCommand(s,cmd(s,'cargo.amend',{units:s.input.units},'product-02-freight-pricing'),at),/another product/i);
});
test('cargo amendment never promotes an already stale equipment snapshot',()=>{
  const s=withAsset(); s.results.asset.inputRevision=0;
  const next=applyCommand(s,cmd(s,'cargo.amend',{units:s.input.units},'product-01-cargo-fit'),at);
  assert.equal(next.results.asset.inputRevision,0);
});
test('stale cargo writer fails atomically',()=>{
  const s=withAsset();const command=cmd(s,'cargo.amend',{units:s.input.units},'product-01-cargo-fit');
  const next=applyCommand(s,cmd(s,'amend',{input:{...s.input,loadedMiles:100}},'command-center-portal'),at);
  assert.throws(()=>applyCommand(next,command,at),/changed/i);
  assert.equal(next.inputRevision,2);assert.equal(next.input.units[0].weightLbs,1200);
});
test('invalid reviewed plan cannot partially amend cargo and successful publication is idempotent',()=>{
  const s=withAsset();const original=structuredClone(s);
  const units=s.input.units.map((u,i)=>({...u,weightLbs:u.weightLbs+(i===0?50:0)}));
  const result={ok:true,summary:'Reviewed native plan',details:{geometryFeasible:true,violations:0,unitIds:units.map(u=>u.id),placements:units.map(u=>({unitId:u.id}))}};
  assert.throws(()=>applyCommand(s,cmd(s,'cargo.publish',{units,result:{...result,details:{...result.details,geometryFeasible:false}}},'product-01-cargo-fit'),at),/Every handling unit/);
  assert.deepEqual(s,original);
  const command=cmd(s,'cargo.publish',{units,result},'product-01-cargo-fit');
  const next=applyCommand(s,command,at);
  assert.equal(next.results.fit.inputRevision,2);assert.equal(next.results.fit.details.committedInputRevision,2);
  assert.equal(applyCommand(next,command,at),next);
  assert.equal(next.events.filter(e=>e.type==='cargo.publish').length,1);
});
test('quote bound to another fit artifact is rejected even at the same input revision',()=>{
  let s=withAsset();
  s=applyCommand(s,cmd(s,'evaluate',{stage:'fit',result:{ok:true,summary:'Fit',details:{geometryFeasible:true,violations:0,unitIds:s.input.units.map(u=>u.id),placements:s.input.units.map(u=>({unitId:u.id}))}}},'product-01-cargo-fit'),at);
  const result={ok:true,summary:'Quote',details:{fitRecordedAt:'2026-10-22T13:00:00Z',currency:'USD',lines:[{label:'Linehaul',cents:10000}],totalCents:10000,accepted:true}};
  assert.throws(()=>applyCommand(s,cmd(s,'evaluate',{stage:'quote',result},'product-02-freight-pricing'),at),/different loading plan/);
});
