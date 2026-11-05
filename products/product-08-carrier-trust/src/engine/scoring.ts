/**
 * FMCSA Safety Measurement System (SMS) scoring and carrier dispatch eligibility engine.
 */

import {
  CarrierProfile,
  DispatchEligibility,
} from './types';
import { evaluateContactSecurity, evaluateOperatingAuthority } from './carrierAuthority';

export const CUSTOMER_INSURANCE_REQUIREMENTS = {
  commercial_auto: 1000000,
  motor_truck_cargo: 100000,
  general_liability: 1000000,
};

export const BASIC_DEFINITIONS = [
  { code: 'unsafe_driving', name: 'Unsafe Driving', interventionThreshold: 65 },
  { code: 'crash_indicator', name: 'Crash Indicator', interventionThreshold: 65 },
  { code: 'hos_compliance', name: 'Hours-of-Service', interventionThreshold: 65 },
  { code: 'vehicle_maint', name: 'Vehicle Maint.', interventionThreshold: 80 },
  { code: 'drugs_alcohol', name: 'Drugs & Alcohol', interventionThreshold: 80 },
  { code: 'hazmat', name: 'Hazardous Materials', interventionThreshold: 80 },
  { code: 'driver_fitness', name: 'Driver Fitness', interventionThreshold: 80 },
];

export interface AuditResult {
  compositeSafetyScore: number;
  dispatchEligibility: DispatchEligibility;
  blockers: string[];
  warnings: string[];
}

/**
 * Evaluates declared carrier data against authority facts and configured customer policy,
 * and supplied risk indicators. This is not independent carrier or fraud verification.
 */
export function auditCarrierCompliance(
  profile: Omit<CarrierProfile, 'dispatchEligibility' | 'compositeSafetyScore' | 'blockers' | 'warnings'>
): AuditResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 1. Operating Authority Check
  if (profile.operatingAuthority !== 'AUTHORIZED_FOR_HIRE') {
    blockers.push(`Operating Authority is ${profile.operatingAuthority} (Must be AUTHORIZED_FOR_HIRE).`);
  }

  // 2. FMCSA Safety Rating
  if (profile.safetyRating === 'UNSATISFACTORY') {
    blockers.push('Carrier has an FMCSA UNSATISFACTORY safety rating (Out of Service hazard).');
  } else if (profile.safetyRating === 'CONDITIONAL') {
    warnings.push('Carrier has an FMCSA CONDITIONAL safety rating (Requires management approval).');
  }

  // 3. Insurance Minimum Requirements
  const autoPolicy = profile.insurancePolicies.find((p) => p.type === 'commercial_auto');
  if (!autoPolicy) {
    blockers.push('Missing Commercial Auto Liability policy on file.');
  } else {
    if (autoPolicy.coverageLimitUsd < 1000000) {
      blockers.push(`Auto Liability ($${autoPolicy.coverageLimitUsd.toLocaleString()}) is below configured customer policy minimum of $1,000,000.`);
    }
    if (autoPolicy.daysUntilExpiration <= 0) {
      blockers.push(`Auto Liability insurance expired on ${autoPolicy.expirationDate}.`);
    } else if (autoPolicy.daysUntilExpiration <= 15) {
      warnings.push(`Auto Liability insurance expires in ${autoPolicy.daysUntilExpiration} days (${autoPolicy.expirationDate}).`);
    }
  }

  const cargoPolicy = profile.insurancePolicies.find((p) => p.type === 'motor_truck_cargo');
  if (!cargoPolicy) {
    blockers.push('Missing Motor Truck Cargo policy on file.');
  } else {
    if (cargoPolicy.coverageLimitUsd < 100000) {
      blockers.push(`Cargo insurance ($${cargoPolicy.coverageLimitUsd.toLocaleString()}) is below configured customer policy minimum of $100,000.`);
    }
    if (cargoPolicy.daysUntilExpiration <= 0) {
      blockers.push(`Cargo insurance expired on ${cargoPolicy.expirationDate}.`);
    } else if (cargoPolicy.daysUntilExpiration <= 15) {
      warnings.push(`Cargo insurance expires in ${cargoPolicy.daysUntilExpiration} days (${cargoPolicy.expirationDate}).`);
    }
  }

  // 4. SMS BASIC Percentiles & Intervention Thresholds
  let basicPenalty = 0;
  for (const b of profile.basics) {
    if (b.exceedsThreshold) {
      warnings.push(`BASIC '${b.name}' (${b.percentile}%) exceeds FMCSA intervention threshold (${b.interventionThreshold}%).`);
      basicPenalty += (b.percentile - b.interventionThreshold) * 0.8;
    }
  }

  // 5. Fraud & Double Brokering Risk
  if (profile.fraudIndicators.doubleBrokeringRisk === 'high') {
    blockers.push('High double-brokering risk detected (Known freight theft / unauthorized broker nexus).');
  } else if (profile.fraudIndicators.doubleBrokeringRisk === 'moderate') {
    warnings.push('Moderate double-brokering risk detected.');
  }

  if (profile.fraudIndicators.chameleonCarrierRisk === 'high') {
    blockers.push('High chameleon carrier risk (Identity match with prior revoked DOT entity).');
  }

  if (profile.fraudIndicators.freightGuardReportsCount > 0) {
    warnings.push(`Carrier has ${profile.fraudIndicators.freightGuardReportsCount} unresolved FreightGuard reports.`);
  }

  // 6. Contact Intelligence & Cybersecurity Verification
  if (profile.fraudIndicators.contactSecurity) {
    const contactAudit = evaluateContactSecurity(profile.fraudIndicators.contactSecurity);
    if (contactAudit.riskCategory === 'CRITICAL_FRAUD') {
      blockers.push(`Critical Contact Cyber-Risk (${contactAudit.riskScore}/100): ${contactAudit.reasons.join(', ')}`);
    } else if (contactAudit.riskCategory === 'HIGH' || contactAudit.riskCategory === 'ELEVATED') {
      warnings.push(`Elevated Contact Security Risk (${contactAudit.riskScore}/100): ${contactAudit.reasons.join(', ')}`);
    }
  }

  // 7. SAFER / L&I Filings Check (if provided)
  if (profile.authorityFilings && profile.authorityFilings.length > 0) {
    const authAudit = evaluateOperatingAuthority(profile.authorityFilings);
    if (!authAudit.isLegallyAuthorized) {
      authAudit.blockers.forEach((b) => {
        if (!blockers.includes(b)) blockers.push(b);
      });
    }
    authAudit.warnings.forEach((w) => {
      if (!warnings.includes(w)) warnings.push(w);
    });
  }

  // Composite Score Calculation (0 - 100)
  let score = 100;
  if (profile.safetyRating === 'CONDITIONAL') score -= 15;
  if (profile.safetyRating === 'UNSATISFACTORY') score -= 50;
  score -= Math.min(40, basicPenalty);
  score -= profile.fraudIndicators.freightGuardReportsCount * 5;
  if (blockers.length > 0) score = Math.min(score, 45);

  const compositeSafetyScore = Math.max(0, Math.round(score));

  let dispatchEligibility: DispatchEligibility = 'APPROVED';
  if (blockers.length > 0) {
    dispatchEligibility = 'BLOCKED_DO_NOT_DISPATCH';
  } else if (warnings.length > 0 || compositeSafetyScore < 75) {
    dispatchEligibility = 'CONDITIONAL_REVIEW';
  }

  return {
    compositeSafetyScore,
    dispatchEligibility,
    blockers,
    warnings,
  };
}

/**
 * Calculates days remaining until policy expiration.
 */
export function getDaysUntilExpiration(expirationDateStr: string): number {
  const exp = new Date(expirationDateStr).getTime();
  const now = Date.now();
  const diffMs = exp - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
