import { describe, it, expect } from 'vitest';
import {
  auditDriverQualificationFile,
  SAMPLE_DRIVER_ROSTER,
} from '../src/engine/driverQualification';

describe('Driver Qualification File (DQF) & Clearinghouse Auditor', () => {
  it('approves fully qualified senior driver with 100/100 score', () => {
    const drv1 = SAMPLE_DRIVER_ROSTER[0];
    const audit = auditDriverQualificationFile(drv1, '2026-10-30');

    expect(audit.isQualifiedForDispatch).toBe(true);
    expect(audit.dispatchLockoutActive).toBe(false);
    expect(audit.overallDqfScore).toBe(100);
    expect(audit.violations.length).toBe(0);
  });

  it('triggers mandatory dispatch lockout when DOT medical certificate has expired', () => {
    const drv2 = SAMPLE_DRIVER_ROSTER[1]; // Med card expired 2026-10-15
    const audit = auditDriverQualificationFile(drv2, '2026-10-30');

    expect(audit.isQualifiedForDispatch).toBe(false);
    expect(audit.dispatchLockoutActive).toBe(true);
    expect(audit.violations.some((v) => v.code === 'MEDICAL_EXPIRED')).toBe(true);
    expect(audit.violations.some((v) => v.code === 'MVR_OVERDUE')).toBe(true);
    expect(audit.overallDqfScore).toBeLessThan(70);
  });

  it('triggers mandatory dispatch lockout when driver is marked PROHIBITED in Drug & Alcohol Clearinghouse', () => {
    const drv3 = SAMPLE_DRIVER_ROSTER[2]; // Clearinghouse PROHIBITED
    const audit = auditDriverQualificationFile(drv3, '2026-10-30');

    expect(audit.isQualifiedForDispatch).toBe(false);
    expect(audit.dispatchLockoutActive).toBe(true);
    expect(audit.violations.some((v) => v.code === 'CLEARINGHOUSE_PROHIBITED')).toBe(true);
  });
});
