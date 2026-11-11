/**
 * FreightGuard Incident Exchange & Double-Brokering Blacklist Engine.
 * 
 * Modeled after Carrier411 FreightGuard and Highway.com crowd-sourced incident databases:
 * 1. Tracks unauthorized re-brokering (double brokering), hostage load extortion,
 *    back-solicitation, and fraudulent COI alterations.
 * 2. Manages structured incident reports, carrier rebuttals, and resolution states.
 * 3. Enforces automated Do Not Dispatch (DND) embargo locks based on industry incident severity.
 */

export type FreightGuardIncidentCategory =
  | 'UNAUTHORIZED_REBROKERING'
  | 'HOSTAGE_LOAD_EXTORTION'
  | 'BACK_SOLICITATION'
  | 'FRAUDULENT_COI'
  | 'MISSED_PICKUP_NO_CALL';

export type IncidentResolutionStatus =
  | 'UNRESOLVED'
  | 'CARRIER_DISPUTED'
  | 'REBUTTAL_FILED'
  | 'RESOLVED_SETTLED';

export interface FreightGuardReport {
  reportId: string;
  dotNumber: string;
  carrierLegalName: string;
  reportingBrokerName: string;
  reportingBrokerMc: string;
  incidentDate: string;
  reportedDate: string;
  category: FreightGuardIncidentCategory;
  loadReferenceNumber: string;
  originCity: string;
  destinationCity: string;
  disputedAmountDollars: number;
  incidentDescription: string;
  status: IncidentResolutionStatus;
  carrierRebuttalText?: string;
  hasPoliceReport: boolean;
}

export interface CarrierIncidentAuditSummary {
  dotNumber: string;
  carrierName: string;
  totalReportsCount: number;
  unresolvedCount: number;
  highSeverityCount: number; // Hostage load or Fraudulent COI
  networkTrustScore: number; // 0 to 100
  embargoStatus: 'CLEAR_TO_DISPATCH' | 'CAUTION_CONDITIONAL' | 'EMBARGO_LOCK_DND';
  embargoReasons: string[];
  reports: FreightGuardReport[];
}

export const SAMPLE_FREIGHTGUARD_REPORTS: FreightGuardReport[] = [
  {
    reportId: 'FG-8801',
    dotNumber: '3948210',
    carrierLegalName: 'AeroTrans Logistics Inc',
    reportingBrokerName: 'Summit Peak Logistics',
    reportingBrokerMc: 'MC-849102',
    incidentDate: '2026-09-14',
    reportedDate: '2026-09-16',
    category: 'UNAUTHORIZED_REBROKERING',
    loadReferenceNumber: 'LD-9042',
    originCity: 'Chicago, IL',
    destinationCity: 'Omaha, NE',
    disputedAmountDollars: 2450,
    incidentDescription: 'Carrier booked load claiming company asset. Re-posted to public loadboard at lower rate; unauthorized third-party pulled onto shipper dock.',
    status: 'UNRESOLVED',
    hasPoliceReport: false,
  },
  {
    reportId: 'FG-8802',
    dotNumber: '3948210',
    carrierLegalName: 'AeroTrans Logistics Inc',
    reportingBrokerName: 'Midwest Intermountain Freight',
    reportingBrokerMc: 'MC-610293',
    incidentDate: '2026-07-22',
    reportedDate: '2026-07-24',
    category: 'BACK_SOLICITATION',
    loadReferenceNumber: 'LD-7612',
    originCity: 'Des Moines, IA',
    destinationCity: 'Denver, CO',
    disputedAmountDollars: 0,
    incidentDescription: 'Driver delivered load and handed direct marketing material to shipper plant manager, violating contract non-solicitation covenant.',
    status: 'CARRIER_DISPUTED',
    carrierRebuttalText: 'Driver inadvertently left business card upon facility request; carrier management did not sanction direct bidding.',
    hasPoliceReport: false,
  },
];

/**
 * Audits FreightGuard incident history for a motor carrier and evaluates automated dispatch embargo locks.
 */
export function auditCarrierIncidents(
  dotNumber: string,
  carrierName: string,
  reports: FreightGuardReport[] = SAMPLE_FREIGHTGUARD_REPORTS
): CarrierIncidentAuditSummary {
  const carrierReports = reports.filter((r) => r.dotNumber === dotNumber);
  const unresolved = carrierReports.filter((r) => r.status === 'UNRESOLVED' || r.status === 'CARRIER_DISPUTED');
  const highSeverity = unresolved.filter(
    (r) => r.category === 'HOSTAGE_LOAD_EXTORTION' || r.category === 'FRAUDULENT_COI'
  );
  const reborkeringCount = unresolved.filter((r) => r.category === 'UNAUTHORIZED_REBROKERING').length;

  let trustScore = 100;
  trustScore -= unresolved.length * 18;
  trustScore -= highSeverity.length * 35;
  trustScore = Math.max(0, Math.min(100, trustScore));

  const embargoReasons: string[] = [];
  let embargoStatus: CarrierIncidentAuditSummary['embargoStatus'] = 'CLEAR_TO_DISPATCH';

  if (highSeverity.length > 0) {
    embargoStatus = 'EMBARGO_LOCK_DND';
    embargoReasons.push(
      `Critical safety violation: ${highSeverity.length} unresolved hostage-load or fraudulent COI incident report(s) on file.`
    );
  }

  if (reborkeringCount >= 2) {
    embargoStatus = 'EMBARGO_LOCK_DND';
    embargoReasons.push(
      `Double-brokering pattern: ${reborkeringCount} unresolved unauthorized re-brokering reports on file.`
    );
  }

  if (trustScore < 60 && embargoStatus !== 'EMBARGO_LOCK_DND') {
    embargoStatus = 'CAUTION_CONDITIONAL';
    embargoReasons.push(
      `Depressed network trust score (${trustScore}/100) due to multiple active carrier disputes.`
    );
  }

  return {
    dotNumber,
    carrierName,
    totalReportsCount: carrierReports.length,
    unresolvedCount: unresolved.length,
    highSeverityCount: highSeverity.length,
    networkTrustScore: trustScore,
    embargoStatus,
    embargoReasons,
    reports: carrierReports,
  };
}
