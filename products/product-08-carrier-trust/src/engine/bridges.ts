/**
 * Cross-Project Bridges for Product 08: Carrier Trust & Anti-Fraud Shield.
 */

import { CarrierProfile } from './types';

export function buildPricingSafetyBridgeUrl(carrier: CarrierProfile): string {
  const params = new URLSearchParams({
    source: 'product-08-carrier-trust',
    dotNumber: carrier.dotNumber,
    carrierName: carrier.legalName,
    safetyTier: carrier.compositeSafetyScore >= 90 ? 'preferred' : carrier.compositeSafetyScore >= 75 ? 'standard' : 'high_risk',
    insuranceVerified: 'false',
    dispatchAllowed: 'false',
    eligibility: carrier.dispatchEligibility,
    evidenceSource: 'seeded_scenario',
  });
  return `http://localhost:5174/?${params.toString()}`;
}

export function buildHosSafetyBridgeUrl(carrier: CarrierProfile): string {
  const params = new URLSearchParams({
    source: 'product-08-carrier-trust',
    dotNumber: carrier.dotNumber,
    carrierName: carrier.legalName,
    evidenceSource: 'seeded_scenario',
    hosBasicPercentile: String(carrier.basics.find((b) => b.code === 'hos_compliance')?.percentile || 0),
    driverCount: String(carrier.driverCount),
  });
  return `http://localhost:5175/?${params.toString()}`;
}

export function buildCommandCenterSafetyBridgeUrl(carrier: CarrierProfile): string {
  const params = new URLSearchParams({
    source: 'product-08-carrier-trust',
    carrierDot: carrier.dotNumber,
    carrierMc: carrier.mcNumber,
    carrierName: carrier.legalName,
    eligibility: carrier.dispatchEligibility,
    evidenceSource: 'seeded_scenario',
    safetyScore: String(carrier.compositeSafetyScore),
  });
  return `http://localhost:5170/?${params.toString()}`;
}
