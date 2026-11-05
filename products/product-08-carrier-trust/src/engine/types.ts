/**
 * Domain types for Product 06: Carrier Safety & Compliance HUD.
 * Models FMCSA Safety Measurement System (SMS) BASIC percentiles,
 * Certificate of Insurance (COI) policy verification, and automated
 * Carrier Onboarding & "Do Not Dispatch" (DND) fraud lockout rules.
 */

export type OperatingAuthorityStatus = 'AUTHORIZED_FOR_HIRE' | 'NOT_AUTHORIZED' | 'SUSPENDED' | 'REVOKED';
export type SafetyRating = 'SATISFACTORY' | 'CONDITIONAL' | 'UNSATISFACTORY' | 'NONE';
export type DispatchEligibility = 'APPROVED' | 'CONDITIONAL_REVIEW' | 'BLOCKED_DO_NOT_DISPATCH';

export interface BasicScore {
  name: string;
  code: 'unsafe_driving' | 'crash_indicator' | 'hos_compliance' | 'vehicle_maint' | 'drugs_alcohol' | 'hazmat' | 'driver_fitness';
  percentile: number; // 0 - 100% (higher is worse in FMCSA SMS)
  interventionThreshold: number; // typically 65% for general freight, 60% for hazmat
  exceedsThreshold: boolean;
  totalViolations: number;
  seriousViolations: number;
}

export interface InsurancePolicy {
  type: 'commercial_auto' | 'motor_truck_cargo' | 'general_liability' | 'workers_comp';
  producer: string;
  underwriter: string;
  amBestRating: string; // e.g. "A+ Superior"
  policyNumber: string;
  effectiveDate: string;
  expirationDate: string;
  coverageLimitUsd: number;
  requiredMinimumUsd: number;
  isCompliant: boolean;
  daysUntilExpiration: number;
}

export interface SaferAuthorityFiling {
  authorityType: 'COMMON_CARRIER' | 'CONTRACT_CARRIER' | 'BROKER' | 'FREIGHT_FORWARDER';
  formType: 'BMC-91X' | 'BMC-34' | 'BMC-84' | 'BMC-85';
  filingStatus: 'ACTIVE' | 'REVOKED' | 'PENDING_CANCELLATION';
  effectiveDate: string;
  coverageLimitUsd: number;
  insuranceCompany: string;
}

export interface ContactSecurityProfile {
  phoneLineType: 'LANDLINE' | 'CELLULAR' | 'VOIP_VIRTUAL';
  telecomCarrier: string;
  voipRiskLevel: 'LOW' | 'SUSPICIOUS' | 'CRITICAL';
  emailDomain: string;
  emailDomainType: 'CORPORATE_MATCH' | 'FREE_WEBMAIL' | 'DISPOSABLE';
  domainAgeDays: number;
  ipOriginCountry: string;
  ipCity: string;
  isVpnOrProxy: boolean;
  ipGeolocationMismatch: boolean;
}

export interface FraudRiskIndicators {
  chameleonCarrierRisk: 'low' | 'moderate' | 'high';
  doubleBrokeringRisk: 'low' | 'moderate' | 'high';
  recentOwnershipChange: boolean;
  freightGuardReportsCount: number;
  unauthorizedContactEmailDomain: boolean;
  contactSecurity?: ContactSecurityProfile;
}

export interface CarrierProfile {
  dotNumber: string;
  mcNumber: string;
  legalName: string;
  dbaName?: string;
  physicalAddress: string;
  city: string;
  state: string;
  zip: string;
  operatingAuthority: OperatingAuthorityStatus;
  safetyRating: SafetyRating;
  safetyRatingDate?: string;
  powerUnitCount: number;
  driverCount: number;
  mcs150Date: string;
  basics: BasicScore[];
  insurancePolicies: InsurancePolicy[];
  fraudIndicators: FraudRiskIndicators;
  dispatchEligibility: DispatchEligibility;
  compositeSafetyScore: number; // 0 - 100 (100 is best)
  blockers: string[];
  warnings: string[];
  authorityFilings?: SaferAuthorityFiling[];
  isDndLocked?: boolean;
  dndReason?: string;
}
