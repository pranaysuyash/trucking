import { describe, expect, it } from 'vitest';
import { calculateRentForPeriod, createLease, createTerminationFinalLedgerEntry } from '../src/engine/leaseEngine';
import type { RentableSpace } from '../src/engine/types';

const space = { id: 'S1', code: 'S1', facilityId: 'F1', status: 'vacant', areaSqFt: 600 } as RentableSpace;
const lease = () => createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'fixed', rate: 3100 }, space);

describe('billing audit boundaries', () => {
  it('prorates a termination in the final calendar month using that full month', () => {
    const entry = createTerminationFinalLedgerEntry({ id: 'R1', lease: lease(), terminationDate: '2026-03-10', dueDate: '2026-03-10' });
    expect(entry.periodStart).toBe('2026-03-01');
    expect(entry.billedDayCount).toBe(10);
    expect(entry.fullPeriodDayCount).toBe(31);
    expect(entry.baseRent).toBe(1000);
  });
  it('does not invent a revenue-share amount', () => {
    expect(() => calculateRentForPeriod({ ...lease(), billingUnit: 'revenue_share' }, '2026-03-01', '2026-03-31')).toThrow(/revenue/i);
  });
  it('requires an explicit quantity for per-unit billing', () => {
    expect(() => createLease({ id: 'L2', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'pallet_day', rate: 2 }, space)).toThrow(/quantity/i);
  });
  it('counts both calendar months in a two-month period', () => {
    expect(calculateRentForPeriod(lease(), '2026-01-01', '2026-02-28').baseRent).toBe(6200);
  });
  it('uses leap February as the termination denominator and rejects multi-month helper inputs', () => {
    const l = { ...lease(), startDate: '2028-01-01', billingStartDate: '2028-01-01', endDate: '2028-12-31', rate: 2900 };
    expect(createTerminationFinalLedgerEntry({ id: 'R2', lease: l, terminationDate: '2028-02-10', dueDate: '2028-02-10' }).baseRent).toBe(1000);
    expect(() => createTerminationFinalLedgerEntry({ id: 'R3', lease: l, periodStart: '2028-01-01', terminationDate: '2028-02-10', dueDate: '2028-02-10' })).toThrow(/one calendar month/i);
  });
});
