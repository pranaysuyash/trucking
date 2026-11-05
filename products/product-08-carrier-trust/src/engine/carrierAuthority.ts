/**
 * SAFER / L&I Operating Authority & Contact Security Risk Heuristics Engine.
 * Implements FMCSA BMC-91X/BMC-34 filings evaluation, VOIP telecom risk scoring,
 * IP geolocation cross-checks, and automated Do Not Dispatch (DND) lockouts.
 */

import { SaferAuthorityFiling, ContactSecurityProfile, CarrierProfile } from './types';

export interface AuthorityEvaluationResult {
  isLegallyAuthorized: boolean;
  activeAuthorities: string[];
  hasActiveBmc91AutoLiability: boolean;
  hasActiveBmc84SuretyBond: boolean;
  blockers: string[];
  warnings: string[];
}

export interface ContactRiskEvaluationResult {
  riskScore: number; // 0 - 100 (100 is maximum fraud risk)
  riskCategory: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL_FRAUD';
  reasons: string[];
  requiresManualVerification: boolean;
}

export interface AutomatedDndResult {
  isDndLocked: boolean;
  lockType?: 'STATUTORY_REVOCATION' | 'FRAUD_NEXUS' | 'INSURANCE_LAPSE' | 'SAFETY_HAZARD';
  reasons: string[];
}

/**
 * Evaluates FMCSA SAFER & Licensing and Insurance (L&I) public filings.
 * Under 49 U.S.C. § 13906, for-hire motor carriers must maintain active BMC-91/91X on file.
 */
export function evaluateOperatingAuthority(filings: SaferAuthorityFiling[]): AuthorityEvaluationResult {
  const activeAuthorities = filings
    .filter((f) => f.filingStatus === 'ACTIVE')
    .map((f) => f.authorityType);

  const hasActiveBmc91 = filings.some(
    (f) => f.formType === 'BMC-91X' && f.filingStatus === 'ACTIVE' && f.coverageLimitUsd >= 750000
  );

  const hasActiveBmc84 = filings.some(
    (f) => (f.formType === 'BMC-84' || f.formType === 'BMC-85') && f.filingStatus === 'ACTIVE' && f.coverageLimitUsd >= 75000
  );

  const blockers: string[] = [];
  const warnings: string[] = [];

  const revokedFilings = filings.filter((f) => f.filingStatus === 'REVOKED');
  if (revokedFilings.length > 0) {
    blockers.push(`FMCSA L&I shows ${revokedFilings.length} revoked regulatory filing(s) on record.`);
  }

  const pendingCancellation = filings.filter((f) => f.filingStatus === 'PENDING_CANCELLATION');
  if (pendingCancellation.length > 0) {
    warnings.push(`Notice of Cancellation pending for ${pendingCancellation.map((p) => p.formType).join(', ')}.`);
  }

  if (!hasActiveBmc91) {
    blockers.push('Missing active BMC-91/BMC-91X statutory liability filing with FMCSA.');
  }

  const isLegallyAuthorized = activeAuthorities.length > 0 && hasActiveBmc91 && blockers.length === 0;

  return {
    isLegallyAuthorized,
    activeAuthorities,
    hasActiveBmc91AutoLiability: hasActiveBmc91,
    hasActiveBmc84SuretyBond: hasActiveBmc84,
    blockers,
    warnings,
  };
}

/**
 * Analyzes contact intelligence (VOIP telecom carriers, domain age, IP origin).
 * Criminal double-brokering syndicates routinely utilize virtual VOIP numbers (Bandwidth/Twilio)
 * and newly registered web domains coupled with overseas VPN exit nodes.
 */
export function evaluateContactSecurity(contact: ContactSecurityProfile): ContactRiskEvaluationResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. VOIP / Virtual Number Risk
  if (contact.phoneLineType === 'VOIP_VIRTUAL') {
    if (contact.voipRiskLevel === 'CRITICAL') {
      score += 45;
      reasons.push(`Virtual VOIP phone line identified on high-risk telecom carrier (${contact.telecomCarrier}).`);
    } else {
      score += 25;
      reasons.push(`Unverified VOIP virtual number line (${contact.telecomCarrier}).`);
    }
  }

  // 2. Email Domain Age & Provider
  if (contact.emailDomainType === 'DISPOSABLE') {
    score += 50;
    reasons.push(`Disposable temporary email provider used (@${contact.emailDomain}).`);
  } else if (contact.emailDomainType === 'FREE_WEBMAIL') {
    score += 20;
    reasons.push(`Generic public webmail used instead of corporate domain (@${contact.emailDomain}).`);
  }

  if (contact.domainAgeDays < 90) {
    score += 35;
    reasons.push(`Email domain is newly created (${contact.domainAgeDays} days old; <90 days threshold).`);
  } else if (contact.domainAgeDays < 180) {
    score += 15;
    reasons.push(`Domain is less than 6 months old (${contact.domainAgeDays} days).`);
  }

  // 3. Geolocation & VPN / Proxy Detection
  if (contact.isVpnOrProxy) {
    score += 30;
    reasons.push('Dispatcher connection originating from commercial anonymizing VPN/datacenter proxy.');
  }

  if (contact.ipGeolocationMismatch) {
    score += 35;
    reasons.push(`Severe IP geographic mismatch: Session located in ${contact.ipCity}, ${contact.ipOriginCountry} vs registered US corporate office.`);
  }

  score = Math.min(100, score);

  let riskCategory: ContactRiskEvaluationResult['riskCategory'] = 'LOW';
  if (score >= 70) riskCategory = 'CRITICAL_FRAUD';
  else if (score >= 45) riskCategory = 'HIGH';
  else if (score >= 20) riskCategory = 'ELEVATED';

  return {
    riskScore: score,
    riskCategory,
    reasons,
    requiresManualVerification: score >= 45,
  };
}

/**
 * Automated Do Not Dispatch (DND) Lockout Rule Engine.
 * Automatically halts load booking and dispatch if any statutory safety,
 * authority revocation, or critical double-brokering risk trigger fires.
 */
export function evaluateAutomatedDnd(carrier: Partial<CarrierProfile>): AutomatedDndResult {
  const reasons: string[] = [];
  let lockType: AutomatedDndResult['lockType'];

  // Statutory Authority Revocation
  if (carrier.operatingAuthority === 'REVOKED' || carrier.operatingAuthority === 'SUSPENDED') {
    reasons.push(`FMCSA operating authority is ${carrier.operatingAuthority}. Immediate dispatch prohibited.`);
    lockType = 'STATUTORY_REVOCATION';
  }

  // Safety Rating
  if (carrier.safetyRating === 'UNSATISFACTORY') {
    reasons.push('FMCSA Safety Rating is UNSATISFACTORY (Federal Out-of-Service order).');
    lockType = 'SAFETY_HAZARD';
  }

  // Insurance Lapse
  const expiredInsurance = carrier.insurancePolicies?.filter((p) => p.daysUntilExpiration <= 0);
  if (expiredInsurance && expiredInsurance.length > 0) {
    reasons.push(`Certificate of Insurance expired for: ${expiredInsurance.map((p) => p.type).join(', ')}.`);
    lockType = lockType || 'INSURANCE_LAPSE';
  }

  // High Double Brokering / Fraud Nexus
  if (carrier.fraudIndicators?.doubleBrokeringRisk === 'high') {
    reasons.push('High double-brokering freight nexus reported.');
    lockType = lockType || 'FRAUD_NEXUS';
  }

  if (carrier.fraudIndicators?.freightGuardReportsCount && carrier.fraudIndicators.freightGuardReportsCount >= 2) {
    reasons.push(`${carrier.fraudIndicators.freightGuardReportsCount} unresolved FreightGuard reports (Unlawful Brokerage / Hostage Freight).`);
    lockType = lockType || 'FRAUD_NEXUS';
  }

  // Contact intelligence critical score
  if (carrier.fraudIndicators?.contactSecurity) {
    const contactRisk = evaluateContactSecurity(carrier.fraudIndicators.contactSecurity);
    if (contactRisk.riskCategory === 'CRITICAL_FRAUD') {
      reasons.push(`Critical Contact Cyber-Risk score (${contactRisk.riskScore}/100): ${contactRisk.reasons.join('; ')}`);
      lockType = lockType || 'FRAUD_NEXUS';
    }
  }

  const isDndLocked = reasons.length > 0;

  return {
    isDndLocked,
    lockType,
    reasons,
  };
}
