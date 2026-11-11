import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createShipment } from '../src/domain.mjs';
import { filterEvents, filterUnits, inputAtEvent, modeledWaypoints, scenarioLocation, spatialModel, stageState } from '../src/shipmentViewModel.ts';
const at = '2026-10-22T14:00:00.000Z';
const fixture = () => createShipment('Canvas invariant fixture', at);
const event = (s, type, payload, inputRevision = s.inputRevision) => ({ id: `event-${s.events.length}`, type, payload, productId: 'fixture', note: type, inputRevision, at });
const result = (details, inputRevision = 1) => ({ ok: true, summary: 'Recorded fixture', details, recordedAt: at, productId: 'fixture', inputRevision });
function withPlan() {
  const s = fixture();
  s.results.fit = result({ equipmentSnapshot: { L: 16002, W: 2540, H: 2800 }, provenance: { source: 'reviewed_native_arrangement' }, placements: s.input.units.map((u, i) => ({ unitId: u.id, x: i * 1300, y: 0, z: 0, dx: 1219.2, dy: 1016, dz: u.heightIn * 25.4 })) });
  return s;
}
test('historical creation reconstructs exact fields, barcode and mass without using current mutable input', () => {
  const s = fixture(), original = structuredClone(s.input); s.input.units[0].weightLbs = 9000;
  const replay = inputAtEvent(s, s.events[0].id); assert.deepEqual(replay.input, original); assert.equal(replay.input.units[0].weightLbs, 1200);
  replay.input.units[0].weightLbs = 1; assert.equal(s.events[0].payload.input.units[0].weightLbs, 1200);
});
test('cargo, equipment and carrier publication replay uses exact retained input fields', () => {
  const s = fixture(); const units = s.input.units.map((u,i) => ({...u, weightLbs: u.weightLbs + (i===0 ? 50 : 0)}));
  s.events.push(event(s, 'cargo.publish', { units, result: { ok: true } }, 2));
  s.events.push(event(s, 'asset.publish', { equipmentId: 'declared-trailer', result: { ok: true } }, 3));
  s.events.push(event(s, 'carrier.publish', { carrierDot: '000123', result: { ok: true } }, 4));
  const replay=inputAtEvent(s,s.events.at(-1).id); assert.equal(replay.inputRevision,4); assert.equal(replay.input.units[0].weightLbs,1250); assert.equal(replay.input.units[0].barcode,s.input.units[0].barcode); assert.equal(replay.input.equipmentId,'declared-trailer'); assert.equal(replay.input.carrierDot,'000123'); assert.equal(replay.sourceEventIds.length,4);
});
test('same input revision publication is supported without a fabricated revision increment', () => {
  const s=fixture(); s.events.push(event(s,'asset.publish',{equipmentId:s.input.equipmentId,result:{ok:true}},1));
  assert.deepEqual(inputAtEvent(s,s.events.at(-1).id).input,s.input);
});
test('full amendment resets replay basis and current records never leak into the past', () => {
  const s=fixture(); const amended={...structuredClone(s.input),loadedMiles:300,units:s.input.units.map(u=>({...u,description:'Amended '+u.description}))};
  s.events.push(event(s,'amend',{input:amended},2)); const replay=inputAtEvent(s,s.events.at(-1).id);
  assert.deepEqual(replay.input,amended); assert.equal(replay.sourceEventIds.length,1); assert.equal(inputAtEvent(s,s.events[0].id).input.loadedMiles,95);
});
test('legacy missing full manifest explicitly abstains, and a later complete amendment restores a basis', () => {
  const s=fixture(); delete s.events[0].payload.input; assert.equal(inputAtEvent(s,s.events[0].id).input,null);
  s.events.push(event(s,'evaluate',{stage:'asset',result:{}},1)); assert.equal(inputAtEvent(s,s.events.at(-1).id).input,null);
  s.events.push(event(s,'amend',{input:s.input},2)); assert.deepEqual(inputAtEvent(s,s.events.at(-1).id).input,s.input);
});
test('missing incremental payload, unexplained revision and unknown event all abstain', () => {
  for (const [type,payload,revision] of [['cargo.publish',{result:{}},2],['asset.publish',{result:{}},2],['carrier.publish',{result:{}},2],['evaluate',{stage:'fit'},8]]) {
    const s=fixture(); s.events.push(event(s,type,payload,revision)); assert.equal(inputAtEvent(s,s.events.at(-1).id).input,null,type);
  }
  assert.equal(inputAtEvent(fixture(),'absent').input,null);
});
test('replayed duplicate identities and incomplete units cannot become exact historical facts', () => {
  const s=fixture(), bad=structuredClone(s.input); bad.units[1].id=bad.units[0].id; s.events.push(event(s,'amend',{input:bad},2));
  assert.equal(inputAtEvent(s,s.events.at(-1).id).input,null);
});
test('spatial projection preserves exact millimetres and canonical numbering when placement order differs', () => {
  const s=withPlan(); s.results.fit.details.placements.reverse(); const model=spatialModel(s);
  assert.equal(model.available,true); assert.equal(model.envelope.length,16002); assert.equal(model.placements[0].ordinal,2); assert.equal(model.placements[0].unitId,s.input.units[1].id); assert.equal(model.placements[0].dx,1219.2);
});
test('spatial view abstains on stale plan, unsupported unit provenance, incomplete and duplicate coverage', () => {
  const stale=withPlan(); stale.inputRevision=2; assert.equal(spatialModel(stale).available,false);
  const legacy=withPlan(); delete legacy.results.fit.details.provenance; assert.equal(spatialModel(legacy).available,false);
  const partial=withPlan(); partial.results.fit.details.placements.pop(); assert.equal(spatialModel(partial).available,false);
  const duplicate=withPlan(); duplicate.results.fit.details.placements[1].unitId=duplicate.input.units[0].id; assert.equal(spatialModel(duplicate).available,false);
});
test('invalid, negative and outside-envelope coordinates are never drawn as accepted geometry', () => {
  for(const [key,value] of [['x',-1],['x',Infinity],['dx',0],['z',2800],['dy',NaN]]) { const s=withPlan(); s.results.fit.details.placements[0][key]=value; assert.equal(spatialModel(s).available,false,`${key}=${value}`); }
});
test('spatial view refuses overlapping boxes and unsupported declared dimensions', () => {
  const overlap = withPlan(); overlap.results.fit.details.placements[1].x = 0;
  assert.equal(spatialModel(overlap).available, false);
  assert.match(spatialModel(overlap).reason, /overlap/);
  const wrongSize = withPlan(); wrongSize.results.fit.details.placements[0].dx = 100;
  assert.equal(spatialModel(wrongSize).available, false);
  assert.match(spatialModel(wrongSize).reason, /dimensions/);
});
test('HOS views distinguish indeterminate review and unverified legacy success from rejection', () => {
  const s = fixture();
  s.results.hos = { ...result({ assessment: 'indeterminate' }), ok: false };
  assert.equal(stageState(s, 'hos', at), 'indeterminate');
  s.results.hos = result({ isLegal: true });
  assert.equal(stageState(s, 'hos', at), 'unverified');
  s.inputRevision++;
  assert.equal(stageState(s, 'hos', at), 'stale');
});

test('carrier freshness handles exact expiry and malformed dates conservatively', () => {
  const s=fixture(); s.results.carrier=result({expiresAt:at}); assert.equal(stageState(s,'carrier',at),'expired');
  s.results.carrier.details.expiresAt='2026-10-22T15:00:00Z'; assert.equal(stageState(s,'carrier',at),'current');
  s.results.carrier.details.expiresAt='not a date'; assert.equal(stageState(s,'carrier',at),'unknown freshness');
  assert.equal(stageState(s,'fit',at),'missing'); s.results.fit=result({}); s.inputRevision=2; assert.equal(stageState(s,'fit',at),'stale');
  s.inputRevision=1; s.results.fit.ok=false; assert.equal(stageState(s,'fit',at),'rejected');
});
test('search finds original IDs, exact barcode text and event payloads without mutating records', () => {
  const s=fixture(); s.input.units[0].barcode='000-AbC-001'; const original=structuredClone(s.input.units);
  assert.equal(filterUnits(s.input.units,'000-abc-001')[0].id,s.input.units[0].id); assert.deepEqual(filterUnits(s.input.units,'not found'),[]); assert.deepEqual(s.input.units,original);
  s.events.push(event(s,'deliver',{barcode:'000-AbC-001'},1)); assert.equal(filterEvents(s.events,'000-abc-001','deliver').length,1); assert.equal(filterEvents(s.events,'','arrive').length,0);
});
test('duty model exposes only complete retained relative values and never computes an ETA', () => {
  const value=result({waypoints:[{id:'wp1',title:'Drive',durationMinutes:104,cumulativeTimeMinutes:119,dutyStatus:'DRIVING',location:'Corridor mile95'}]});
  assert.equal(modeledWaypoints(value)[0].cumulativeTimeMinutes,119); assert.equal('eta' in modeledWaypoints(value)[0],false);
  value.details.waypoints[0].durationMinutes=NaN; assert.deepEqual(modeledWaypoints(value),[]);
});
test('location statements distinguish planning, scenario departure and manually entered receipt from live GPS', () => {
  const s=fixture(); assert.match(scenarioLocation(s),/Physical loading.*not recorded/); s.status='in_transit'; assert.match(scenarioLocation(s),/Current position and ETA are not recorded/); s.status='delivered'; s.delivery={units:[],receiver:'Fixture',receivedAt:at}; assert.match(scenarioLocation(s),/manually entered receipt.*No live position/);
});
test('S3: current-revision and missing-history invariants detect deliberate isolated mutations', async () => {
  const source=readFileSync(new URL('../src/shipmentViewModel.ts',import.meta.url),'utf8');
  const load=async text=>import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(text.replace("'./reviewedGeometry.mjs'", JSON.stringify(new URL('../src/reviewedGeometry.mjs',import.meta.url).href)).replace("'./carrierFreshness.mjs'", JSON.stringify(new URL('../src/carrierFreshness.mjs',import.meta.url).href)),{mode:'strip'})).toString('base64'));
  const staleMutation=await load(source.replace('if (result.inputRevision !== shipment.inputRevision)', 'if (false)'));
  const s=fixture();s.results.fit=result({});s.inputRevision=2;assert.throws(()=>assert.equal(staleMutation.stageState(s,'fit',at),'stale'),assert.AssertionError);
  const historyMutation=await load(source.replace('input = null; revision = event.inputRevision; sources = []; reason =', 'input = structuredClone(shipment.input); revision = event.inputRevision; sources = []; reason ='));
  const legacy=fixture();delete legacy.events[0].payload.input;assert.throws(()=>assert.equal(historyMutation.inputAtEvent(legacy,legacy.events[0].id).input,null),assert.AssertionError);
});
