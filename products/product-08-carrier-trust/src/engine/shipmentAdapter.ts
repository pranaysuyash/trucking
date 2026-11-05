import { INITIAL_CARRIERS } from './carriers';
import { auditCarrierCompliance, CUSTOMER_INSURANCE_REQUIREMENTS, type AuditResult } from './scoring';
import type { CarrierProfile } from './types';
import type { Shipment, ShipmentAdapter, StageResult } from '../suite/types';

export interface CarrierReview {
  profile: CarrierProfile; audit: AuditResult; evaluatedAt: string; expiresAt: string;
}
export interface CarrierDraft { carrierDot: string; review: CarrierReview | null }

/** Refresh relative dates once per review, so the displayed and saved audit agree. */
export function reviewCarrier(carrierDot: string, at = new Date().toISOString()): CarrierReview | null {
  const carrier = INITIAL_CARRIERS.find(c => c.dotNumber === carrierDot);
  if (!carrier) return null;
  const now = Date.parse(at);
  if (!Number.isFinite(now)) throw new Error('A finite carrier review timestamp is required.');
  const profile = structuredClone(carrier);
  const extraBlockers: string[] = [];
  profile.insurancePolicies = profile.insurancePolicies.map(policy => {
    const expiration = Date.parse(policy.expirationDate);
    const effective = Date.parse(policy.effectiveDate);
    const daysUntilExpiration = Number.isFinite(expiration) ? Math.ceil((expiration - now) / 86400000) : 0;
    if (!Number.isFinite(expiration) || !Number.isFinite(effective) || effective > now) extraBlockers.push(`Policy ${policy.policyNumber} has an invalid or future effective period.`);
    return { ...policy, daysUntilExpiration, isCompliant: Number.isFinite(effective) && effective <= now && daysUntilExpiration > 0 && policy.coverageLimitUsd >= policy.requiredMinimumUsd };
  });
  const audit = auditCarrierCompliance(profile);
  audit.blockers.push(...extraBlockers);
  if (extraBlockers.length) { audit.dispatchEligibility = 'BLOCKED_DO_NOT_DISPATCH'; audit.compositeSafetyScore = Math.min(45, audit.compositeSafetyScore); }
  Object.assign(profile, audit);
  return { profile, audit, evaluatedAt: new Date(now).toISOString(), expiresAt: new Date(now + 15 * 60 * 1000).toISOString() };
}

export function carrierForShipment(shipment: Shipment): CarrierDraft {
  const saved = shipment.results.carrier;
  const review = saved?.details.nativeReview as CarrierReview | undefined;
  const selectedSavedReview = saved?.inputRevision === shipment.inputRevision && review?.profile?.dotNumber === shipment.input.carrierDot;
  const expected = selectedSavedReview && Number.isFinite(Date.parse(review.evaluatedAt)) ? reviewCarrier(shipment.input.carrierDot, review.evaluatedAt) : null;
  const native = selectedSavedReview
    ? expected && JSON.stringify(review) === JSON.stringify(expected) ? structuredClone(review) : null
    : reviewCarrier(shipment.input.carrierDot);
  return { carrierDot: shipment.input.carrierDot, review: native };
}

export function resultForCarrier(shipment: Shipment, draft: CarrierDraft, at = new Date().toISOString()): StageResult {
  const { review } = draft;
  if (!review || review.profile.dotNumber !== draft.carrierDot || !INITIAL_CARRIERS.some(c => c.dotNumber === draft.carrierDot)) throw new Error('Select an explicit seeded carrier profile. Unknown does not mean approved.');
  const now = Date.parse(at);
  if (!Number.isFinite(now) || Date.parse(review.expiresAt) <= now) throw new Error('This reviewed carrier observation expired. Refresh the scenario evidence and review it before publication.');
  if (Date.parse(review.evaluatedAt) > now) throw new Error('The reviewed carrier observation is dated in the future. Refresh the scenario evidence before publication.');
  const expected = reviewCarrier(draft.carrierDot, review.evaluatedAt);
  if (!expected || JSON.stringify(review) !== JSON.stringify(expected)) throw new Error('Carrier evidence differs from its reviewed seeded source. Refresh the scenario evidence before publication.');
  return {
    ok: review.audit.dispatchEligibility === 'APPROVED',
    summary: `${review.profile.legalName}: ${review.audit.dispatchEligibility} under configured customer policy. ${review.audit.blockers.length} blockers and ${review.audit.warnings.length} warnings retained in the seeded scenario record.`,
    details: {
      dotNumber: draft.carrierDot, eligibility: review.audit.dispatchEligibility, evidenceSource: 'seeded_scenario',
      evaluatedAt: review.evaluatedAt, expiresAt: review.expiresAt,
      blockers: [...review.audit.blockers], warnings: [...review.audit.warnings],
      nativeReview: structuredClone(review), customerInsuranceRequirements: { ...CUSTOMER_INSURANCE_REQUIREMENTS },
      source: 'Explicit local scenario roster. No live authority, insurer, identity or independent fraud verification.',
      reviewedShipmentId: shipment.id, reviewedBaseInputRevision: shipment.inputRevision,
    },
  };
}

export const shipmentAdapter: ShipmentAdapter = {
  stage: 'carrier', evaluate(shipment) {
    const draft = { carrierDot: shipment.input.carrierDot, review: reviewCarrier(shipment.input.carrierDot) };
    return resultForCarrier(shipment, draft);
  },
};
