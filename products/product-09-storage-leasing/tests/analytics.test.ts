import { describe, it, expect } from 'vitest';
import { createFacility, addSpace, setSpaceStatus } from '../src/engine/facilityModel';
import { createTenant, createLease, activateLease, generateRentLedgerEntry, recordPayment, terminateLease } from '../src/engine/leaseEngine';
import { computeTenantPaymentBehavior, computeVacantNow, computeAdminAnalytics } from '../src/engine/analytics';

describe('P09 Analytics (admin/analysis view)', () => {
  it('does not count a legacy partial receipt date as a fully paid entry', () => {
    const tenant = createTenant({ id: 'T1', name: 'Tenant', contactPerson: 'T', phone: '9', email: 't@x.com' });
    const entry = { id: 'E1', leaseId: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', baseRent: 1000, electricityCharge: 0, maintenanceCharge: 0, otherCharges: 0, totalDue: 1000, amountPaid: 300, paymentStatus: 'partial' as const, dueDate: '2026-01-10', paidDate: '2026-01-20' };
    const result = computeTenantPaymentBehavior({ tenants: [tenant], leases: [], ledgerEntries: [entry], asOfDate: '2026-01-25' });
    expect(result[0].paidEntries).toBe(0);
    expect(result[0].latePaidEntries).toBe(0);
    expect(result[0].overdueEntries).toBe(1);
  });
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

  it('exposes explicit policy and per-tenant delay reason (first-principles transparency)', () => {
    const tenant = createTenant({ id: 'T1', name: 'Late Payer', contactPerson: 'LP', phone: '9', email: 't@x.com' });
    const f = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const space = addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'godown', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant', buildingName: 'B1' });
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'sqft_month', rate: 10, escalationPercentPerYear: 0, depositAmount: 0 }, space);
    activateLease(lease, space);
    const e1 = generateRentLedgerEntry({ id: 'E1', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-02-05' });
    const e2 = generateRentLedgerEntry({ id: 'E2', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-02-01', periodEnd: '2026-02-28', dueDate: '2026-03-05' });
    recordPayment(e1, e1.totalDue, '2026-02-15');
    recordPayment(e2, e2.totalDue, '2026-03-20');
    const analytics = computeAdminAnalytics({ facility: f, tenants: [tenant], leases: [lease], ledgerEntries: [e1, e2], metrics: { usableAreaSqFt: 4000, modeledSpaceAreaSqFt: 400, leasedAreaSqFt: 400, vacantAreaSqFt: 0, blockedAreaSqFt: 0, underRepairAreaSqFt: 0, occupancyPercent: 10 }, asOfDate: '2026-03-30' });
    expect(analytics.policy.paymentDelay.minEntries).toBe(2);
    expect(analytics.definitions.length).toBeGreaterThan(0);
    expect(analytics.tenantPaymentBehavior[0].delayReason).toContain('late-paid');
    expect(analytics.tenantPaymentBehavior[0].policy.minEntries).toBe(2);
  });

  it('supports configurable payment-delay policy (long-term extensibility)', () => {
    const tenant = createTenant({ id: 'T1', name: 'T', contactPerson: 'C', phone: '9', email: 't@x.com' });
    const f = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    const space = addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'sqft_month', rate: 10, escalationPercentPerYear: 0, depositAmount: 0 }, space);
    activateLease(lease, space);
    const e1 = generateRentLedgerEntry({ id: 'E1', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-02-05' });
    recordPayment(e1, e1.totalDue, '2026-02-15');
    const strict = computeAdminAnalytics({ facility: f, tenants: [tenant], leases: [lease], ledgerEntries: [e1], metrics: null, asOfDate: '2026-03-30', policy: { paymentDelay: { minEntries: 1, latePaidCountThreshold: 1, problemRatioThreshold: 0.5 } } });
    expect(strict.tenantPaymentBehavior[0].regularlyDelays).toBe(true);
  });

  it('computes utilization by building/godown and receivables aging buckets', () => {
    const f = createFacility({ id: 'F1', code: 'WH', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 1 });
    addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'godown', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant', buildingName: 'Godown A' });
    addSpace(f, { id: 'S2', code: 'R2', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 10, widthFt: 10 }, environmentalClass: 'ambient', status: 'vacant', buildingName: 'Godown B' });
    const analytics = computeAdminAnalytics({ facility: f, tenants: [], leases: [], ledgerEntries: [{ id: 'E1', leaseId: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', baseRent: 1000, electricityCharge: 0, maintenanceCharge: 0, otherCharges: 0, totalDue: 1000, amountPaid: 0, paymentStatus: 'overdue', dueDate: '2026-01-05' }], metrics: null, asOfDate: '2026-03-30' });
    expect(analytics.utilizationByBuilding.find((b) => b.buildingName === 'Godown A')?.totalSpaces).toBe(1);
    expect(analytics.receivablesAging.buckets.some((b) => b.amount > 0)).toBe(true);
  });

});
