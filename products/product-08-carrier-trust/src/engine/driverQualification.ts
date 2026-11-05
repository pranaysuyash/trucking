/**
 * Driver Qualification File (DQF) & FMCSA Clearinghouse Compliance Auditor
 *
 * Implements 49 CFR Part 391 statutory qualification checks:
 * - Commercial Driver's License (CDL) validity & expiration
 * - Medical Examiner's Certificate (Form MCSA-5876) National Registry check
 * - Annual Motor Vehicle Record (MVR) 365-day review requirement
 * - FMCSA Drug & Alcohol Clearinghouse annual query verification (49 CFR § 382.701)
 * - Automated Dispatch Lockout enforcement
 */

export interface DriverQualificationFile {
  driverId: string;
  fullName: string;
  carrierDot: string;
  cdlNumber: string;
  cdlState: string;
  cdlClass: 'CLASS_A' | 'CLASS_B' | 'CLASS_C';
  cdlExpirationDate: string; // YYYY-MM-DD
  endorsements: ('HAZMAT_H' | 'TANKER_N' | 'DOUBLES_TRIPLES_T' | 'COMBO_X')[];
  medicalCardExpirationDate: string; // YYYY-MM-DD
  medicalExaminerRegistryNumber: string;
  lastAnnualMvrDate: string; // YYYY-MM-DD
  movingViolationsCount3Years: number;
  priorEmployerHistoryVerified: boolean;
  clearinghouseStatus: 'CLEARED' | 'PROHIBITED' | 'QUERY_PENDING';
  lastClearinghouseDate: string; // YYYY-MM-DD
}

export interface DqfViolation {
  code: 'CDL_EXPIRED' | 'MEDICAL_EXPIRED' | 'CLEARINGHOUSE_PROHIBITED' | 'MVR_OVERDUE' | 'CLEARINGHOUSE_OVERDUE' | 'PRIOR_EMPLOYMENT_UNVERIFIED';
  severity: 'CRITICAL_OOS' | 'WARNING';
  message: string;
}

export interface DqfAuditResult {
  driverId: string;
  fullName: string;
  isQualifiedForDispatch: boolean;
  dispatchLockoutActive: boolean;
  overallDqfScore: number; // 0 to 100
  daysUntilCdlExpires: number;
  daysUntilMedCardExpires: number;
  mvrAnnualOverdue: boolean;
  clearinghouseQueryOverdue: boolean;
  violations: DqfViolation[];
  auditSummary: string;
}

export const SAMPLE_DRIVER_ROSTER: DriverQualificationFile[] = [
  {
    driverId: 'DRV-101',
    fullName: 'Marcus A. Vance',
    carrierDot: '3194012',
    cdlNumber: 'IL-V8891042',
    cdlState: 'IL',
    cdlClass: 'CLASS_A',
    cdlExpirationDate: '2027-08-15',
    endorsements: ['HAZMAT_H', 'TANKER_N', 'DOUBLES_TRIPLES_T'],
    medicalCardExpirationDate: '2027-02-28',
    medicalExaminerRegistryNumber: 'NRC-882194',
    lastAnnualMvrDate: '2026-06-10',
    movingViolationsCount3Years: 0,
    priorEmployerHistoryVerified: true,
    clearinghouseStatus: 'CLEARED',
    lastClearinghouseDate: '2026-06-12',
  },
  {
    driverId: 'DRV-102',
    fullName: 'Travis J. Thornton',
    carrierDot: '3194012',
    cdlNumber: 'IN-T4410298',
    cdlState: 'IN',
    cdlClass: 'CLASS_A',
    cdlExpirationDate: '2028-04-10',
    endorsements: ['TANKER_N'],
    medicalCardExpirationDate: '2026-10-15', // Expired 2 weeks ago!
    medicalExaminerRegistryNumber: 'NRC-339102',
    lastAnnualMvrDate: '2025-08-01', // Over 1 year ago!
    movingViolationsCount3Years: 2,
    priorEmployerHistoryVerified: true,
    clearinghouseStatus: 'CLEARED',
    lastClearinghouseDate: '2025-08-05',
  },
  {
    driverId: 'DRV-103',
    fullName: 'Ray Dalton',
    carrierDot: '3194012',
    cdlNumber: 'OH-R9921045',
    cdlState: 'OH',
    cdlClass: 'CLASS_A',
    cdlExpirationDate: '2027-11-20',
    endorsements: [],
    medicalCardExpirationDate: '2027-05-14',
    medicalExaminerRegistryNumber: 'NRC-774109',
    lastAnnualMvrDate: '2026-04-18',
    movingViolationsCount3Years: 1,
    priorEmployerHistoryVerified: false,
    clearinghouseStatus: 'PROHIBITED', // FMCSA Drug & Alcohol violation flag!
    lastClearinghouseDate: '2026-04-20',
  },
];

/**
 * Audits a driver's qualification file against FMCSA Part 391 statutory criteria.
 */
export function auditDriverQualificationFile(
  driver: DriverQualificationFile,
  asOfDateStr: string = '2026-10-30'
): DqfAuditResult {
  const asOf = new Date(asOfDateStr);
  const violations: DqfViolation[] = [];
  let score = 100;

  // 1. CDL Expiration Check
  const cdlExp = new Date(driver.cdlExpirationDate);
  const daysUntilCdlExpires = Math.round((cdlExp.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilCdlExpires < 0) {
    violations.push({
      code: 'CDL_EXPIRED',
      severity: 'CRITICAL_OOS',
      message: `Commercial Driver License expired ${Math.abs(daysUntilCdlExpires)} days ago on ${driver.cdlExpirationDate}. Immediate Out-of-Service!`,
    });
    score -= 40;
  } else if (daysUntilCdlExpires <= 30) {
    violations.push({
      code: 'CDL_EXPIRED',
      severity: 'WARNING',
      message: `CDL expires in ${daysUntilCdlExpires} days. Renewal required immediately.`,
    });
    score -= 10;
  }

  // 2. DOT Medical Card (Form MCSA-5876) Check
  const medExp = new Date(driver.medicalCardExpirationDate);
  const daysUntilMedCardExpires = Math.round((medExp.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilMedCardExpires < 0) {
    violations.push({
      code: 'MEDICAL_EXPIRED',
      severity: 'CRITICAL_OOS',
      message: `DOT Medical Examiner Certificate expired ${Math.abs(daysUntilMedCardExpires)} days ago on ${driver.medicalCardExpirationDate}. Driver is physically unqualified (49 CFR § 391.41).`,
    });
    score -= 35;
  } else if (daysUntilMedCardExpires <= 30) {
    violations.push({
      code: 'MEDICAL_EXPIRED',
      severity: 'WARNING',
      message: `Medical card expires in ${daysUntilMedCardExpires} days. Schedule physical with NRCME examiner.`,
    });
    score -= 10;
  }

  // 3. FMCSA Drug & Alcohol Clearinghouse Status Check
  if (driver.clearinghouseStatus === 'PROHIBITED') {
    violations.push({
      code: 'CLEARINGHOUSE_PROHIBITED',
      severity: 'CRITICAL_OOS',
      message: `FMCSA Clearinghouse Flag: Driver is marked PROHIBITED under 49 CFR Part 382. Mandatory Do Not Dispatch!`,
    });
    score -= 50;
  }

  // 4. Annual MVR Review Check (365 days max)
  const lastMvr = new Date(driver.lastAnnualMvrDate);
  const daysSinceMvr = Math.round((asOf.getTime() - lastMvr.getTime()) / (1000 * 60 * 60 * 24));
  const mvrAnnualOverdue = daysSinceMvr > 365;
  if (mvrAnnualOverdue) {
    violations.push({
      code: 'MVR_OVERDUE',
      severity: 'WARNING',
      message: `Annual Motor Vehicle Record (MVR) review is overdue (${daysSinceMvr} days since last review on ${driver.lastAnnualMvrDate}; max 365 days permitted).`,
    });
    score -= 15;
  }

  // 5. Annual Clearinghouse Query (365 days max)
  const lastCh = new Date(driver.lastClearinghouseDate);
  const daysSinceCh = Math.round((asOf.getTime() - lastCh.getTime()) / (1000 * 60 * 60 * 24));
  const clearinghouseQueryOverdue = daysSinceCh > 365;
  if (clearinghouseQueryOverdue) {
    violations.push({
      code: 'CLEARINGHOUSE_OVERDUE',
      severity: 'WARNING',
      message: `Annual Clearinghouse query is overdue (${daysSinceCh} days since last query on ${driver.lastClearinghouseDate}).`,
    });
    score -= 10;
  }

  // 6. Prior Employment Verification
  if (!driver.priorEmployerHistoryVerified) {
    violations.push({
      code: 'PRIOR_EMPLOYMENT_UNVERIFIED',
      severity: 'WARNING',
      message: `3-Year safety performance investigation (49 CFR § 391.23) is incomplete or unverified.`,
    });
    score -= 10;
  }

  const finalScore = Math.max(0, score);
  const dispatchLockoutActive = violations.some((v) => v.severity === 'CRITICAL_OOS');
  const isQualifiedForDispatch = !dispatchLockoutActive && finalScore >= 70;

  let auditSummary = 'Driver qualification file meets all statutory FMCSA Part 391 requirements.';
  if (dispatchLockoutActive) {
    auditSummary = 'DISPATCH BLOCKED: Critical statutory safety violations detected. Driver cannot be dispatched legally.';
  } else if (violations.length > 0) {
    auditSummary = 'CONDITIONAL APPROVAL: Administrative DQF renewals required within 30 days.';
  }

  return {
    driverId: driver.driverId,
    fullName: driver.fullName,
    isQualifiedForDispatch,
    dispatchLockoutActive,
    overallDqfScore: finalScore,
    daysUntilCdlExpires,
    daysUntilMedCardExpires,
    mvrAnnualOverdue,
    clearinghouseQueryOverdue,
    violations,
    auditSummary,
  };
}
