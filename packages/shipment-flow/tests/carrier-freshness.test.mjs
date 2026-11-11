import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carrierFreshness } from '../src/carrierFreshness.mjs';
import { createShipment, applyCommand, dispatchBlockers } from '../src/domain.mjs';
import { stageState } from '../src/shipmentViewModel.ts';

const now = '2026-11-06T12:00:00.000Z';

test('expiry accepts exact ISO instants with UTC and explicit offsets', () => {
  for (const expiry of ['2026-11-06T12:15:00.000Z', '2026-11-06T12:15:00Z', '2026-11-06T17:45:00+05:30', '2026-11-06T07:15:00-05:00', '2028-02-29T00:00:00Z']) {
    assert.equal(carrierFreshness(expiry, now), 'current', expiry);
  }
  assert.equal(carrierFreshness('2026-11-06T17:30:00+05:30', now), 'expired');
  assert.equal(carrierFreshness('2026-11-06T11:59:59.999Z', now), 'expired');
});

test('expiry rejects ambiguous, normalized and unzoned dates without rewriting them', () => {
  for (const expiry of ['2999', '2026-11-06', '2026-11-06T12:15:00', '2026-02-30T12:00:00Z', '2025-02-29T12:00:00Z', '2026-13-01T00:00:00Z', '2026-01-01T24:00:00Z', '2026-01-01T00:00:60Z', '2026-11-06T12:15:00-00:00', 'not-a-date', 123]) {
    assert.equal(carrierFreshness(expiry, now), 'invalid', String(expiry));
  }
  for (const expiry of [null, undefined, '']) assert.equal(carrierFreshness(expiry, now), 'missing');
  assert.equal(carrierFreshness('2026-11-06T12:15:00Z', '2026-11-06'), 'invalid');
});

test('server and UI reject the same legacy expiry without mutating its evidence', () => {
  const s = createShipment('Carrier expiry regression', now);
  const legacy = { ok: true, summary: 'Legacy scenario carrier', inputRevision: s.inputRevision, recordedAt: now, productId: 'product-08-carrier-trust', details: { dotNumber: s.input.carrierDot, eligibility: 'APPROVED', evidenceSource: 'seeded_scenario', expiresAt: '2999' } };
  s.results.carrier = legacy;
  assert.equal(stageState(s, 'carrier', now), 'unknown freshness');
  assert.ok(dispatchBlockers(s, now).some(reason => /carrier:.*invalid/i.test(reason)));
  assert.throws(() => applyCommand(s, { type: 'evaluate', productId: 'product-08-carrier-trust', operationId: 'invalid-carrier', expectedRevision: s.revision, payload: { stage: 'carrier', result: legacy } }, now), /current approved scenario carrier/i);
  assert.equal(s.results.carrier.details.expiresAt, '2999');
});
