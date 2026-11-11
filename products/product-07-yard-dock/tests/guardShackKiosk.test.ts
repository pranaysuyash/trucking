import { describe, it, expect } from 'vitest';
import {
  processKioskCheckIn,
  KioskCheckInRequest,
  PRESEEDED_SCHEDULED_APPOINTMENTS,
  scenarioGateInEvent,
} from '../src/engine/guardShackKiosk';

describe('Digital Guard Shack & Kiosk Check-In Engine', () => {
  it('has preseeded scheduled appointments for quick driver check-in', () => {
    expect(PRESEEDED_SCHEDULED_APPOINTMENTS.length).toBeGreaterThan(0);
    const apt = PRESEEDED_SCHEDULED_APPOINTMENTS[0];
    expect(apt.confirmationNumber).toBe('APT-9042-IL');
    expect(apt.equipmentType).toBe('REEFER');
  });

  it('successfully processes valid check-in and assigns an available dock door', () => {
    const req: KioskCheckInRequest = {
      confirmationNumber: 'APT-9042-IL',
      tractorPlate: 'IL-90210',
      trailerNumber: 'TLR-8819',
      carrierName: 'Summit Peak Logistics',
      carrierDot: '3819401',
      driverName: 'Dave Miller',
      driverPhone: '312-555-0199',
      sealNumber: 'SEAL-49102',
      isSealIntact: true,
      equipmentType: 'REEFER',
      isLoadedInbound: true,
    };

    const res = processKioskCheckIn(req);
    expect(res.success).toBe(true);
    expect(res.gatePass).toBeDefined();
    expect(res.gatePass?.assignedLocationType).toBe('DOCK_DOOR');
    expect(res.gatePass?.freeTimeMinutes).toBe(120);
    expect(res.gatePass?.detentionRatePerHour).toBe(85);
    expect(res.gatePass?.securityHash).toMatch(/^SCENARIO-CHECKSUM:/);
    expect(res.gatePass?.carrierDot).toBe('3819401');
  });

  it('rejects check-in with broken seal on loaded inbound freight', () => {
    const badSealReq: KioskCheckInRequest = {
      confirmationNumber: 'APT-9042-IL',
      tractorPlate: 'IL-90210',
      trailerNumber: 'TLR-8819',
      carrierName: 'Summit Peak Logistics',
      carrierDot: '3819401',
      driverName: 'Dave Miller',
      driverPhone: '312-555-0199',
      sealNumber: 'SEAL-BROKEN-01',
      isSealIntact: false, // Compromised seal!
      equipmentType: 'REEFER',
      isLoadedInbound: true,
    };

    const res = processKioskCheckIn(badSealReq);
    expect(res.success).toBe(false);
    expect(res.rejectionReason).toContain('BROKEN SEAL ALERT');
  });

  it('propagates each scenario carrier and marks the resulting event as simulated', () => {
    for (const carrierDot of ['3819401', '2941088']) {
      const request: KioskCheckInRequest = { confirmationNumber: 'sample', tractorPlate: 'ABC-123', trailerNumber: 'TLR-123', carrierName: 'Example', carrierDot, driverName: 'Driver', driverPhone: '000', sealNumber: 'SEAL-123', isSealIntact: true, equipmentType: 'REEFER', isLoadedInbound: true };
      const pass = processKioskCheckIn(request).gatePass!;
      const payload = scenarioGateInEvent(pass);
      expect(payload.carrierDot).toBe(carrierDot);
      expect(payload.evidenceStatus).toBe('simulated');
      expect(payload.trailerNumber).toBe(pass.trailerNumber);
    }
  });

  it('rejects check-in with missing license plate', () => {
    const noPlateReq: KioskCheckInRequest = {
      confirmationNumber: 'APT-9042-IL',
      tractorPlate: '',
      trailerNumber: 'TLR-8819',
      carrierName: 'Summit Peak Logistics',
      carrierDot: '3819401',
      driverName: 'Dave Miller',
      driverPhone: '312-555-0199',
      sealNumber: 'SEAL-49102',
      isSealIntact: true,
      equipmentType: 'REEFER',
      isLoadedInbound: true,
    };

    const res = processKioskCheckIn(noPlateReq);
    expect(res.success).toBe(false);
    expect(res.rejectionReason).toContain('license plate is required');
  });
});
