import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createShipment, applyCommand, dispatchBlockers, STAGE_PRODUCTS } from '../src/domain.mjs';

const now = '2026-10-22T14:00:00.000Z';
const command = (s, type, payload = {}, productId = 'command-center-portal') => ({ type, payload, productId, expectedRevision: s.revision, operationId: randomUUID() });

test('indeterminate duty review is retained without satisfying the HOS prerequisite', () => {
  const s = createShipment('Indeterminate review', now);
  const review = { ok: false, summary: 'Cycle history unavailable', details: { assessmentVersion: 1, assessment: 'indeterminate', assessmentReasons: ['Prior duty history unavailable'], driverId: s.input.driverId, priorRestHours: s.input.priorRestHours, isLegal: false } };
  const saved = applyCommand(s, command(s, 'evaluate', { stage: 'hos', result: review }, STAGE_PRODUCTS.hos), now);
  assert.deepEqual(saved.results.hos.details, review.details);
  assert.deepEqual(saved.events.at(-1).payload.result, review);
  assert.ok(dispatchBlockers(saved, now).some(reason => reason.startsWith('hos:')));
  assert.throws(() => applyCommand(saved, command(saved, 'dispatch'), now), /Dispatch blocked/);
  for (const details of [{ ...review.details, assessmentVersion: 2 }, { ...review.details, driverId: 'different driver' }, { ...review.details, assessmentReasons: [] }, { ...review.details, isLegal: true }]) {
    assert.throws(() => applyCommand(s, command(s, 'evaluate', { stage: 'hos', result: { ...review, details } }, STAGE_PRODUCTS.hos), now), /indeterminate duty review/i);
  }
});

test('legacy and forged HOS positive records cannot authorize scenario dispatch', () => {
  const s = createShipment('Unverified legacy duty', now);
  const legacy = { ok: true, summary: 'Prior full rest model', details: { driverId: s.input.driverId, priorRestHours: s.input.priorRestHours, isLegal: true, ruleScope: 'full_rest_only' } };
  for (const details of [legacy.details, { ...legacy.details, assessment: 'verified', cycleVerified: true, historyVerified: true }]) {
    assert.throws(() => applyCommand(s, command(s, 'evaluate', { stage: 'hos', result: { ...legacy, details } }, STAGE_PRODUCTS.hos), now), /cycle.*not supported/i);
    const persisted = structuredClone(s);
    persisted.results.hos = { ...legacy, details, inputRevision: persisted.inputRevision, recordedAt: now, productId: STAGE_PRODUCTS.hos };
    assert.ok(dispatchBlockers(persisted, now).some(reason => reason.startsWith('hos:')));
    assert.throws(() => applyCommand(persisted, command(persisted, 'dispatch'), now), /Dispatch blocked/);
    assert.equal(persisted.results.hos.details.isLegal, true, 'Legacy evidence stays intact.');
  }
});

test('missing, malformed, expired and current carrier freshness are distinguished at dispatch', () => {
  const s = createShipment('Carrier freshness', now);
  for (const stage of Object.keys(STAGE_PRODUCTS)) s.results[stage] = { ok: true, inputRevision: s.inputRevision, details: {} };
  // A forged positive HOS record stays blocked independently of carrier state.
  s.results.hos.details = { isLegal: true, assessment: 'verified', cycleVerified: true };
  for (const [expiry, expected] of [[undefined, /carrier:.*missing/i], ['', /carrier:.*missing/i], ['not-a-date', /carrier:.*invalid/i], [now, /carrier:.*expired/i]]) {
    s.results.carrier.details.expiresAt = expiry;
    assert.ok(dispatchBlockers(s, now).some(reason => expected.test(reason)), String(expiry));
    assert.throws(() => applyCommand(s, command(s, 'dispatch'), now), expected);
  }
  s.results.carrier.details.expiresAt = '2026-10-22T14:15:00.000Z';
  assert.equal(dispatchBlockers(s, now).some(reason => reason.startsWith('carrier:')), false);
  assert.ok(dispatchBlockers(s, now).some(reason => reason.startsWith('hos:')));
  assert.throws(() => applyCommand(s, command(s, 'dispatch'), now), /hos:.*unverified/i);
  assert.ok(dispatchBlockers(s, 'invalid-now').some(reason => /carrier:.*invalid/i.test(reason)));
});
export function readyShipment() {
  let s = createShipment('Domain contract fixture', now);
  const ids = s.input.units.map(u => u.id);
  const results = {
    asset: { equipmentId: s.input.equipmentId, lengthIn: 630, widthIn: 100, heightIn: 100, doorWidthIn: 96, doorHeightIn: 98, payloadLbs: 45000 },
    fit: { geometryFeasible: true, violations: 0, unitIds: ids, placements: ids.map(id => ({ unitId: id })) },
    warehouse: { assignments: s.input.units.map((u, i) => ({ unitId: u.id, barcode: u.barcode, slotCode: `R-${i}`, slotId: `S-${i}` })) },
    yard: { doorId: 'D-1', trailerId: s.input.trailerId, available: true },
    carrier: { dotNumber: s.input.carrierDot, eligibility: 'APPROVED', evidenceSource: 'seeded_scenario', expiresAt: '2026-10-22T14:15:00Z' },
    quote: { currency: 'USD', lines: [{ label: 'Linehaul', cents: 15000 }, { label: 'Fuel', cents: 5000 }], totalCents: 20000, accepted: true },
    hos: { driverId: s.input.driverId, isLegal: false, assessmentVersion: 1, assessment: 'indeterminate', assessmentReasons: ['Cycle history unavailable'], ruleScope: 'full_rest_only', priorRestHours: 10 },
  };
  for (const [stage, details] of Object.entries(results)) s = applyCommand(s, command(s, 'evaluate', { stage, result: { ok: stage !== 'hos', summary: 'Independent fixture result', details } }, STAGE_PRODUCTS[stage]), now);
  return s;
}

test('dispatch is blocked before every current specialist decision exists', () => {
  const s = createShipment('Blocked fixture', now);
  assert.throws(() => applyCommand(s, command(s, 'dispatch'), now), /Dispatch blocked/);
  assert.equal(s.status, 'draft');
});
test('an amended manifest preserves history and invalidates all prior approvals', () => {
  let s = readyShipment();
  s = applyCommand(s, command(s, 'amend', { input: { ...s.input, units: s.input.units.map((u, i) => ({ ...u, weightLbs: u.weightLbs + (i === 0 ? 100 : 0) })) } }), now);
  assert.equal(s.inputRevision, 2); assert.equal(s.results.fit.inputRevision, 1);
  assert.equal(s.events[0].payload.input.units[0].weightLbs, 1200);
  assert.equal(s.events.at(-1).payload.input.units[0].weightLbs, 1300);
  assert.equal(s.events.find(e => e.type === 'evaluate' && e.payload.stage === 'fit').payload.result.details.unitIds.length, 2);
  assert.equal(dispatchBlockers(s, now).length, 7);
  assert.throws(() => applyCommand(s, command(s, 'dispatch'), now), /Dispatch blocked/);
});
test('stale writers and mismatched operation reuse are rejected', () => {
  const s = readyShipment(); const c = command(s, 'evaluate', { stage: 'asset', result: s.results.asset }, STAGE_PRODUCTS.asset); const next = applyCommand(s, c, now);
  assert.equal(applyCommand(next, c, now), next);
  assert.throws(() => applyCommand(next, { ...c, type: 'amend' }, now), /reused/);
  assert.throws(() => applyCommand(next, command(s, 'dispatch'), now), /changed/);
});
test('expired carrier decision and open exceptions prevent dispatch', () => {
  const s = readyShipment(); assert.throws(() => applyCommand(s, command(s, 'dispatch'), '2026-10-22T14:16:00Z'), /expired/);
  const next = applyCommand(s, command(s, 'exception.open', { message: 'Delay needs review' }), now);
  assert.throws(() => applyCommand(next, command(next, 'dispatch'), now), /exception/);
});
test('upstream reevaluation invalidates downstream receiving and yard decisions', () => {
  const s = readyShipment(); const result = s.results.asset;
  const next = applyCommand(s, command(s, 'evaluate', { stage: 'asset', result }, STAGE_PRODUCTS.asset), now);
  assert.equal(next.results.fit, undefined); assert.equal(next.results.warehouse, undefined); assert.equal(next.results.yard, undefined);
});
test('handling-unit loss or duplication cannot become a successful fit', () => {
  const s = readyShipment();
  const result = { ...s.results.fit, details: { ...s.results.fit.details, unitIds: [s.input.units[0].id, s.input.units[0].id] } };
  assert.throws(() => applyCommand(s, command(s, 'evaluate', { stage: 'fit', result }, STAGE_PRODUCTS.fit), now), /Every handling unit/);
});
test('a retained previously-dispatched scenario still requires ordered events and matching receipt', () => {
  let s = readyShipment();
  assert.throws(() => applyCommand(s, command(s, 'arrive', { tractorId: s.input.tractorId }, 'product-05-fleet-telematics'), now), /departure/);
  assert.throws(() => applyCommand(s, command(s, 'dispatch'), now), /Dispatch blocked/);
  // Legacy record fixture: exercise historical post-dispatch transitions without authorizing a new dispatch.
  s.status = 'dispatched';
  assert.throws(() => applyCommand(s, command(s, 'amend', { input: s.input }), now), /executing/);
  s = applyCommand(s, command(s, 'depart', { tractorId: s.input.tractorId }, 'product-05-fleet-telematics'), now);
  s = applyCommand(s, command(s, 'arrive', { tractorId: s.input.tractorId }, 'product-05-fleet-telematics'), now);
  const units = s.results.warehouse.details.assignments.map(a => ({ id: a.unitId, barcode: a.barcode, slotCode: a.slotCode }));
  assert.throws(() => applyCommand(s, command(s, 'deliver', { receiver: 'Scenario receiver', units: units.map((u, i) => ({ ...u, barcode: i === 0 ? 'WRONG' : u.barcode })) }, 'product-06-warehouse-space-flow'), now), /Scanned unit/);
  s = applyCommand(s, command(s, 'deliver', { receiver: 'Scenario receiver', units }, 'product-06-warehouse-space-flow'), now);
  assert.throws(() => applyCommand(s, command(s, 'invoice', { totalCents: 20001 }), now), /differs/);
  s = applyCommand(s, command(s, 'invoice', { totalCents: 20000 }), now);
  assert.equal(s.status, 'invoice_ready'); assert.equal(s.invoice.totalCents, 20000);
  assert.equal(s.delivery.units.length, 2); assert.ok(s.invoice.evidenceEventIds.length > 7);
});

test('invoice preparation revalidates current accepted terms and their integer-cent reconciliation', () => {
  const delivered = readyShipment(); delivered.status = 'delivered';
  delivered.delivery = { receiver: 'Retained fixture receiver', receivedAt: now, units: delivered.input.units.map((u, i) => ({ id: u.id, barcode: u.barcode, slotCode: `R-${i}` })) };
  const stale = structuredClone(delivered); stale.results.quote.inputRevision = 0;
  assert.throws(() => applyCommand(stale, command(stale, 'invoice', { totalCents: 20000 }), now), /Current accepted quote/);
  const malformed = structuredClone(delivered); malformed.results.quote.details.lines[0].cents++;
  assert.throws(() => applyCommand(malformed, command(malformed, 'invoice', { totalCents: 20000 }), now), /reconcile exactly/);
  assert.equal(delivered.invoice, undefined); assert.equal(delivered.status, 'delivered');
  const next = applyCommand(delivered, command(delivered, 'invoice', { totalCents: 20000 }), now);
  assert.equal(next.invoice.totalCents, 20000);
});
