import { describe, it, expect } from 'vitest';
import { createFacility, addSpace, setSpaceStatus } from '../src/engine/facilityModel';
import { createTenant, createLease, activateLease, generateRentLedgerEntry, recordPayment, terminateLease } from '../src/engine/leaseEngine';
import { computeTenantPaymentBehavior, computeVacantNow, computeAdminAnalytics } from '../src/engine/analytics';

describe('P09 Analytics (admin/analysis view)', () => {
  it('computes vacant spaces with daysVacant when vacantSince is known', () => {
    const f = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const s = addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    // simulate vacancy started 10 days before asOf
    s.vacantSince = '2026-10-20T00:00:00.000Z';
    const rows = computeVacantNow(f, '2026-10-30');
    expect(rows).toHaveLength(1);
    expect(rows[0].daysVacant).toBe(10);
  });

  it('returns daysVacant null for legacy vacant spaces without vacantSince', () => {
    const f = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const s = addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    delete s.vacantSince;
    const rows = computeVacantNow(f, '2026-10-30');
    expect(rows[0].daysVacant).toBeNull();
  });

  it('identifies renters who delay payments regularly with amounts/days', () => {
    const tenant = createTenant({ id: 'T1', name: 'Late Payer', contactPerson: 'LP', phone: '9', email: 't@x.com' });
    const f = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const space = addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'godown', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant', buildingName: 'B1' });
    const lease = createLease({
      id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1',
      startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'sqft_month', rate: 10, escalationPercentPerYear: 0, depositAmount: 0,
    }, space);
    activateLease(lease, space);

    const e1 = generateRentLedgerEntry({ id: 'E1', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-02-05' });
    const e2 = generateRentLedgerEntry({ id: 'E2', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-02-01', periodEnd: '2026-02-28', dueDate: '2026-03-05' });
    const paid1 = e1.totalDue;
    const paid2 = e2.totalDue;
    recordPayment(e1, paid1, '2026-02-15'); // 10 days late
    recordPayment(e2, paid2, '2026-03-20'); // 15 days late

    const behavior = computeTenantPaymentBehavior({
      tenants: [tenant],
      leases: [lease],
      ledgerEntries: [e1, e2],
      asOfDate: '2026-03-30',
    });
    expect(behavior).toHaveLength(1);
    expect(behavior[0].regularlyDelays).toBe(true);
    expect(behavior[0].latePaidEntries).toBe(2);
    expect(behavior[0].maxDaysLate).toBe(15);
    expect(behavior[0].totalLatePaidAmount).toBe(paid1 + paid2);
  });

  it('tracks status changes to update vacantSince (additive)', () => {
    const f = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const space = addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    expect(space.status).toBe('vacant');
    expect(space.vacantSince).toBeTruthy();
    setSpaceStatus(f, 'S1', 'leased');
    expect(space.vacantSince).toBeUndefined();
    setSpaceStatus(f, 'S1', 'vacant');
    expect(space.vacantSince).toBeTruthy();
  });

  it('terminateLease marks space vacant with vacancy tracking', () => {
    createTenant({ id: 'T1', name: 'T', contactPerson: 'C', phone: '9', email: 't@x.com' });
    const f = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const space = addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'sqft_month', rate: 10, escalationPercentPerYear: 0, depositAmount: 0 }, space);
    activateLease(lease, space);
    terminateLease(lease, space, '2026-06-01');
    expect(space.status).toBe('vacant');
    expect(space.vacantSince).toBeTruthy();
  });

  it('computeAdminAnalytics aggregates utilization and payment signals', () => {
    const f = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    const analytics = computeAdminAnalytics({
      facility: f,
      tenants: [],
      leases: [],
      ledgerEntries: [],
      metrics: { usableAreaSqFt: 4000, modeledSpaceAreaSqFt: 400, leasedAreaSqFt: 0, vacantAreaSqFt: 400, blockedAreaSqFt: 0, underRepairAreaSqFt: 0, occupancyPercent: 0 },
      asOfDate: '2026-10-30',
    });
    expect(analytics.vacantNow).toHaveLength(1);
    expect(analytics.utilization.vacantSpaces).toBe(1);
  });
});
