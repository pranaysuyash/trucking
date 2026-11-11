import { describe, it, expect } from 'vitest';
import {
  auditCarrierIncidents,
  SAMPLE_FREIGHTGUARD_REPORTS,
  FreightGuardReport,
} from '../src/engine/freightGuardIncident';

describe('FreightGuard Incident Exchange & Blacklist Engine (T-037)', () => {
  it('passes clear carriers with zero incident reports', () => {
    const summary = auditCarrierIncidents('1234567', 'Clean Trucking LLC', []);

    expect(summary.totalReportsCount).toBe(0);
    expect(summary.networkTrustScore).toBe(100);
    expect(summary.embargoStatus).toBe('CLEAR_TO_DISPATCH');
    expect(summary.embargoReasons.length).toBe(0);
  });

  it('correctly audits sample carrier incident reports and computes trust score', () => {
    const summary = auditCarrierIncidents('3948210', 'AeroTrans Logistics Inc', SAMPLE_FREIGHTGUARD_REPORTS);

    expect(summary.totalReportsCount).toBe(2);
    expect(summary.unresolvedCount).toBe(2);
    expect(summary.networkTrustScore).toBe(64); // 100 - (2 * 18) = 64
    expect(summary.embargoStatus).toBe('CLEAR_TO_DISPATCH'); // < 2 rebrokerings, no hostage loads
  });

  it('engages EMBARGO_LOCK_DND when a hostage load or fraudulent COI report is present', () => {
    const severeReports: FreightGuardReport[] = [
      ...SAMPLE_FREIGHTGUARD_REPORTS,
      {
        reportId: 'FG-9901',
        dotNumber: '3948210',
        carrierLegalName: 'AeroTrans Logistics Inc',
        reportingBrokerName: 'Freight Shield Brokerage',
        reportingBrokerMc: 'MC-110293',
        incidentDate: '2026-10-01',
        reportedDate: '2026-10-02',
        category: 'HOSTAGE_LOAD_EXTORTION',
        loadReferenceNumber: 'LD-9921',
        originCity: 'Dallas, TX',
        destinationCity: 'Atlanta, GA',
        disputedAmountDollars: 4500,
        incidentDescription: 'Carrier locked trailer and demanded $4,500 cash wire before releasing pharmaceuticals.',
        status: 'UNRESOLVED',
        hasPoliceReport: true,
      },
    ];

    const summary = auditCarrierIncidents('3948210', 'AeroTrans Logistics Inc', severeReports);

    expect(summary.embargoStatus).toBe('EMBARGO_LOCK_DND');
    expect(summary.highSeverityCount).toBe(1);
    expect(summary.embargoReasons[0]).toContain('hostage-load or fraudulent COI');
  });

  it('engages EMBARGO_LOCK_DND on double-brokering pattern (>= 2 reports)', () => {
    const doubleBrokerReports: FreightGuardReport[] = [
      SAMPLE_FREIGHTGUARD_REPORTS[0],
      {
        ...SAMPLE_FREIGHTGUARD_REPORTS[0],
        reportId: 'FG-8809',
        reportingBrokerName: 'Another Broker LLC',
        loadReferenceNumber: 'LD-1022',
      },
    ];

    const summary = auditCarrierIncidents('3948210', 'AeroTrans Logistics Inc', doubleBrokerReports);

    expect(summary.embargoStatus).toBe('EMBARGO_LOCK_DND');
    expect(summary.embargoReasons[0]).toContain('Double-brokering pattern');
  });
});
