import { describe, expect, it } from 'vitest';
import { INITIAL_CARRIERS } from '../src/engine/carriers';
import { carrierForShipment, resultForCarrier, reviewCarrier } from '../src/engine/shipmentAdapter';
import type { Shipment } from '../src/suite/types';

const at = '2026-10-23T00:00:00.000Z';
const dot = INITIAL_CARRIERS[0].dotNumber;
const shipment = (carrierDot = dot): Shipment => ({ id: 'shipment-carrier', inputRevision: 4, input: { carrierDot }, results: {} } as Shipment);

describe('Reviewed seeded carrier policy publication', () => {
  it('saves exactly the selected profile, timestamped audit, expiry and policy source', () => {
    const review = reviewCarrier(dot, at)!;
    const result = resultForCarrier(shipment(), { carrierDot: dot, review }, at);
    expect(result.details).toMatchObject({ dotNumber: dot, evaluatedAt: at, expiresAt: '2026-10-23T00:15:00.000Z', evidenceSource: 'seeded_scenario', nativeReview: review });
    expect(review.profile.insurancePolicies[0].daysUntilExpiration).toBe(70);
    review.audit.blockers.push('Local mutation');
    expect((result.details.nativeReview as typeof review).audit.blockers).not.toContain('Local mutation');
  });
  it('leaves unknown DOT unresolved and never approves a different profile', () => {
    expect(carrierForShipment(shipment('unknown'))).toEqual({ carrierDot: 'unknown', review: null });
    expect(() => resultForCarrier(shipment(), { carrierDot: 'unknown', review: reviewCarrier(dot, at) }, at)).toThrow(/explicit seeded/);
  });
  it('rejects expired, future and tampered observations', () => {
    const draft = { carrierDot: dot, review: reviewCarrier(dot, at)! };
    expect(() => resultForCarrier(shipment(), draft, '2026-10-23T00:15:00Z')).toThrow(/expired/);
    expect(() => resultForCarrier(shipment(), draft, '2026-10-22T23:59:59Z')).toThrow(/future/);
    draft.review.audit.dispatchEligibility = 'BLOCKED_DO_NOT_DISPATCH';
    expect(() => resultForCarrier(shipment(), draft, at)).toThrow(/differs/);
  });
  it('does not import malformed retained evidence into native carrier renderers', () => {
    const record = shipment();
    record.results.carrier = { ok: true, summary: 'Corrupt fixture', productId: 'product-08-carrier-trust', inputRevision: 4, recordedAt: at, details: { nativeReview: { profile: { dotNumber: dot }, audit: {}, evaluatedAt: at, expiresAt: '2026-10-23T00:15:00Z' } } };
    expect(carrierForShipment(record).review).toBeNull();
  });
  it('retains a blocked source decision instead of turning publication into approval', () => {
    const review = reviewCarrier(INITIAL_CARRIERS[2].dotNumber, at)!;
    const result = resultForCarrier(shipment(), { carrierDot: review.profile.dotNumber, review }, at);
    expect(result.ok).toBe(false);
    expect(result.details.eligibility).toBe('BLOCKED_DO_NOT_DISPATCH');
    expect(result.summary.length).toBeLessThanOrEqual(1000);
    expect(result.details.blockers).toEqual(review.audit.blockers);
    expect(result.details.warnings).toEqual(review.audit.warnings);
    expect((result.details.blockers as unknown[]).length).toBeGreaterThan(0);
  });
});
