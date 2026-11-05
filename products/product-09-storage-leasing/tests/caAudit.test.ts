import { describe, it, expect } from 'vitest';
import { createFacility, addSpace } from '../src/engine/facilityModel';
import {
  createTenant,
  createLease,
  activateLease,
  generateMonthlyRentLedgers,
  createTerminationFinalLedgerEntry,
} from '../src/engine/leaseEngine';

describe('CA/audit acceptance criteria (PER-RT-0210)', () => {
  it('lease retains distinct agreement/possession/billing/start/end dates (auditable)', () => {
    const facility = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const space = addSpace(facility, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    const lease = createLease({
      id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1',
      agreementDate: '2026-01-01', depositDate: '2026-01-02', startDate: '2026-01-10',
      possessionDate: '2026-01-10', billingStartDate: '2026-01-15', endDate: '2026-12-31',
      billingUnit: 'sqft_month', rate: 10, escalationPercentPerYear: 0, depositAmount: 5000,
    }, space);
    expect(lease.agreementDate).toBe('2026-01-01');
    expect(lease.depositDate).toBe('2026-01-02');
    expect(lease.startDate).toBe('2026-01-10');
    expect(lease.possessionDate).toBe('2026-01-10');
    expect(lease.billingStartDate).toBe('2026-01-15');
    expect(lease.endDate).toBe('2026-12-31');
  });

  it('no revenue recognized before billing start date', () => {
    const facility = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const space = addSpace(facility, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    createTenant({ id: 'T1', name: 'T', contactPerson: 'C', phone: '9', email: 't@x.com' });
    const lease = createLease({
      id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1',
      startDate: '2026-01-01', billingStartDate: '2026-01-20', endDate: '2026-12-31',
      billingUnit: 'fixed', rate: 1000, escalationPercentPerYear: 0, depositAmount: 0,
    }, space);
    activateLease(lease, space);
    const entries = generateMonthlyRentLedgers({ leases: [lease], periodYear: 2026, periodMonth: 1 });
    expect(entries).toHaveLength(1);
    expect(entries[0].periodStart >= '2026-01-20').toBe(true);
    expect(entries[0].prorationBasis).toContain('billing starts');
    expect(entries[0].billedDayCount).toBeGreaterThan(0);
  });

  it('ledger entries record period dates and proration basis/day counts (additive auditability)', () => {
    const facility = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const space = addSpace(facility, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', billingStartDate: '2026-01-10', endDate: '2026-12-31', billingUnit: 'fixed', rate: 1000, escalationPercentPerYear: 0, depositAmount: 0 }, space);
    activateLease(lease, space);
    const [entry] = generateMonthlyRentLedgers({ leases: [lease], periodYear: 2026, periodMonth: 1 });
    expect(entry.periodStart).toBeTruthy();
    expect(entry.periodEnd).toBeTruthy();
    expect(entry.dueDate).toBeTruthy();
    expect(entry.billedDayCount).toBe(22); // 10..31 inclusive
    expect(entry.fullPeriodDayCount).toBe(31);
    expect(entry.prorationBasis).toBeTruthy();
  });

  it('provides explicit termination final prorated ledger building block (no auto-generation decision made)', () => {
    const facility = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const space = addSpace(facility, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'fixed', rate: 1000, escalationPercentPerYear: 0, depositAmount: 0 }, space);
    activateLease(lease, space);
    const finalEntry = createTerminationFinalLedgerEntry({
      id: 'RL-FINAL-L1',
      lease,
      terminationDate: '2026-06-15',
      periodStart: '2026-06-01',
      dueDate: '2026-06-16',
    });
    expect(finalEntry.periodEnd).toBe('2026-06-15');
    expect(finalEntry.billedDayCount).toBe(15);
    expect(finalEntry.prorationBasis).toContain('termination');
  });
});
