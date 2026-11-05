import { describe, it, expect } from 'vitest';
import {
  calculateCargoFullness,
  evaluateBrakeStroke,
  buildTrailerTelemetrySnapshot,
} from '../src/engine/trailerIoTSensors';

describe('Smart Trailer IoT Sensor Topology & Fullness (T-034)', () => {
  it('computes cargo volume fullness and linear footage accurately', () => {
    // 110" ceiling height, sensors detect cargo at 22" from roof -> (110-22)/110 = 80% full
    const fullness = calculateCargoFullness(53.0, 110, 22, 22, 22);

    expect(fullness.percentCubeFilled).toBe(80);
    expect(fullness.linearFloorLengthUsedFt).toBe(42.4); // 80% of 53ft = 42.4ft
    expect(fullness.cargoState).toBe('PARTIALLY_LOADED');
  });

  it('audits air brake pushrod stroke against CVSA Out-of-Service statutory criteria', () => {
    // Standard Type 30 chamber: legal up to 2.0 inches
    const legalBrake = evaluateBrakeStroke('TYPE_30_STANDARD', 1.65);
    expect(legalBrake.cvsaCompliance).toBe('LEGAL_IN_SERVICE');

    // 2.15 inches exceeds 2.0" limit
    const oosBrake = evaluateBrakeStroke('TYPE_30_STANDARD', 2.15);
    expect(oosBrake.cvsaCompliance).toBe('CRITICAL_OUT_OF_SERVICE');
    expect(oosBrake.ratedMaxStrokeInches).toBe(2.0);
  });

  it('triggers UNAUTHORIZED_BREACH alert when doors open outside geofence', () => {
    // Door open (true), outside geofence (false)
    const snapshot = buildTrailerTelemetrySnapshot('TR-9042', 75, true, false, 1.7, 130);

    expect(snapshot.doorSecurity.rearDoorStatus).toBe('UNAUTHORIZED_BREACH');
    expect(snapshot.overallHealthStatus).toBe('CRITICAL_OOS');
    expect(snapshot.activeAlerts[0]).toContain('SECURITY BREACH');
  });

  it('detects wheel hub thermal runaway when bearing exceeds 185°F', () => {
    const snapshot = buildTrailerTelemetrySnapshot('TR-9042', 75, false, true, 1.7, 205);

    expect(snapshot.overallHealthStatus).toBe('CRITICAL_OOS');
    expect(snapshot.activeAlerts.some((a) => a.includes('HUB OVERHEAT'))).toBe(true);
  });
});
