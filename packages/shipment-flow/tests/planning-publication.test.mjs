import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createShipment, applyCommand } from '../src/domain.mjs';
const at = '2026-10-22T18:00:00.000Z';
const command = (s, type, payload, productId) => ({ type, payload, productId, operationId: randomUUID(), expectedRevision: s.revision });
const asset = id => ({ ok: true, summary: 'Reviewed equipment', details: { equipmentId: id, lengthIn: 630, widthIn: 100, heightIn: 100, doorWidthIn: 98, doorHeightIn: 98, payloadLbs: 45000 } });
const carrier = dot => ({ ok: true, summary: 'Seeded policy', details: { dotNumber: dot, eligibility: 'APPROVED', evidenceSource: 'seeded_scenario', expiresAt: '2026-10-22T18:15:00.000Z' } });
function planned() {
  const s = createShipment('Publication contracts', at);
  const results = { asset: asset(s.input.equipmentId), carrier: carrier(s.input.carrierDot), fit: { ok: true, summary: 'Fit', details: { unitIds: s.input.units.map(u => u.id), placements: s.input.units.map(u => ({ unitId: u.id })), geometryFeasible: true, violations: 0 } }, warehouse: { ok: true, summary: 'Receiving', details: { assignments: s.input.units.map((u,i) => ({ unitId: u.id, barcode: u.barcode, slotId: 'slot'+i, slotCode: 'A'+i })) } }, yard: { ok: true, summary: 'Dock', details: { available: true, trailerId: s.input.trailerId, doorId: 'door1' } }, hos: { ok: true, summary: 'Duty', details: { driverId: s.input.driverId, priorRestHours: 10, ruleScope: 'full_rest_only', isLegal: true } }, quote: { ok: true, summary: 'Accepted estimate', details: { accepted: true, currency: 'USD', lines: [{ label: 'Linehaul', cents: 10000 }], totalCents: 10000 } } };
  for (const [stage, result] of Object.entries(results)) s.results[stage] = { ...result, inputRevision: 1, recordedAt: at, productId: {asset:'product-04-asset-studio',carrier:'product-08-carrier-trust',fit:'product-01-cargo-fit',warehouse:'product-06-warehouse-space-flow',yard:'product-07-yard-dock',hos:'product-03-hos-planner',quote:'product-02-freight-pricing'}[stage] };
  return s;
}
test('reviewed equipment choice is atomic and invalidates its dependent decisions', () => {
  const s = planned(); const before = structuredClone(s);
  const next = applyCommand(s, command(s, 'asset.publish', { equipmentId: 'reviewed-box', result: asset('reviewed-box') }, 'product-04-asset-studio'), at);
  assert.equal(next.input.equipmentId, 'reviewed-box'); assert.equal(next.inputRevision, 2);
  for (const stage of ['fit','warehouse','yard','quote']) assert.equal(next.results[stage], undefined);
  for (const stage of ['carrier','hos']) { assert.equal(next.results[stage].inputRevision, 2); assert.equal(next.results[stage].recordedAt, at); assert.equal(next.results[stage].reusedFromInputRevision, 1); }
  assert.deepEqual(s, before); assert.deepEqual(next.events.at(-1).payload.result, asset('reviewed-box'));
});
test('malformed or conflicting equipment publication cannot partially amend inputs', () => {
  const s = planned(); const before = structuredClone(s);
  for (const result of [asset('wrong'), { ...asset('new'), details: { equipmentId: 'new' } }]) assert.throws(() => applyCommand(s, command(s, 'asset.publish', { equipmentId: 'new', result }, 'product-04-asset-studio'), at));
  assert.deepEqual(s, before);
  assert.throws(() => applyCommand(s, { ...command(s, 'asset.publish', { equipmentId: 'new', result: asset('new') }, 'product-04-asset-studio'), expectedRevision: 0 }, at), /changed/);
});
test('narrow publication cannot change unrelated fields or claim another product authority', () => {
  const s = planned();
  assert.throws(() => applyCommand(s, command(s, 'asset.publish', { equipmentId: 'new', result: asset('new'), units: [] }, 'product-04-asset-studio'), at), /only/);
  assert.throws(() => applyCommand(s, command(s, 'carrier.publish', { carrierDot: 'new', result: carrier('new') }, 'product-04-asset-studio'), at), /another product/);
});
test('carrier assignment preserves only already-current unchanged evidence and exact observation time', () => {
  const s = planned(); s.results.hos.inputRevision = 0;
  const next = applyCommand(s, command(s, 'carrier.publish', { carrierDot: 'new-dot', result: carrier('new-dot') }, 'product-08-carrier-trust'), at);
  assert.equal(next.input.carrierDot, 'new-dot'); assert.equal(next.inputRevision, 2); assert.equal(next.results.quote, undefined);
  for (const stage of ['asset','fit','warehouse','yard']) { assert.equal(next.results[stage].inputRevision, 2); assert.deepEqual(next.results[stage].details, s.results[stage].details); assert.equal(next.results[stage].recordedAt, at); }
  assert.equal(next.results.hos.inputRevision, 0); assert.deepEqual(next.input.units, s.input.units);
});
test('rejected carrier evidence is attributable and never becomes approval', () => {
  const s = planned(); const result = { ...carrier('blocked-dot'), ok: false, details: { dotNumber: 'blocked-dot', eligibility: 'REJECTED' } };
  const next = applyCommand(s, command(s, 'carrier.publish', { carrierDot: 'blocked-dot', result }, 'product-08-carrier-trust'), at);
  assert.equal(next.results.carrier.ok, false); assert.equal(next.results.quote, undefined);
  assert.throws(() => applyCommand(next, command(next, 'dispatch', {}, 'command-center-portal'), at), /Dispatch blocked/);
});
test('same operation is idempotent and planning remains locked after dispatch', () => {
  const s = planned(); const c = command(s, 'asset.publish', { equipmentId: s.input.equipmentId, result: asset(s.input.equipmentId) }, 'product-04-asset-studio');
  const next = applyCommand(s, c, at); assert.equal(next.inputRevision, 1); assert.equal(applyCommand(next, c, at), next);
  s.status = 'dispatched'; assert.throws(() => applyCommand(s, command(s, 'carrier.publish', { carrierDot: 'new', result: carrier('new') }, 'product-08-carrier-trust'), at), /locked/);
});
test('receiving and dock artifacts cannot bind to a replaced upstream observation', () => {
  const s = planned();
  assert.throws(() => applyCommand(s, command(s, 'evaluate', { stage: 'warehouse', result: { ...s.results.warehouse, details: { ...s.results.warehouse.details, fitRecordedAt: 'other' } } }, 'product-06-warehouse-space-flow'), at), /different loading plan/);
  assert.throws(() => applyCommand(s, command(s, 'evaluate', { stage: 'yard', result: { ...s.results.yard, details: { ...s.results.yard.details, warehouseRecordedAt: 'other' } } }, 'product-07-yard-dock'), at), /different receiving plan/);
});
