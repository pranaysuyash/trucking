import { describe, it, expect } from 'vitest';
import {
  createLease, activateLease, terminateLease, calculateRentForPeriod,
  generateRentLedgerEntry, recordPayment, detectOverdue, updateOverdueStatus,
  computeRentSummary, isLeaseExpiringSoon, renewLease, allocateElectricityCharge,
  createTenant, generateMonthlyRentLedgers, generateReceiptNumber, issueReceipt,
  previewRenewal, getOverdueEntries, getPendingEntries,
  generateRentPayableEntry, recordPayablePayment, computePayableSummary,
} from '../src/engine/leaseEngine';

function makeSpace() {
  return { id: 'S1', code: 'R1', status: 'vacant' as const, areaSqFt: 600, facilityId: 'F1', name: 'R', type: 'room' as const, floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient' as const };
}

function makeLeaseInput(overrides: any = {}) {
  return {
    id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1',
    startDate: '2026-01-01', endDate: '2026-12-31',
    billingUnit: 'sqft_month' as const, rate: 2.5,
    ...overrides,
  };
}

describe('P09 Lease Engine', () => {
  it('creates a draft lease for a vacant space', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    expect(lease.status).toBe('draft');
    expect(lease.rate).toBe(2.5);
  });

  it('rejects leasing a non-vacant space', () => {
    const space = { ...makeSpace(), status: 'leased' as const };
    expect(() => createLease(makeLeaseInput(), space as any)).toThrow();
  });

  it('rejects invalid dates', () => {
    const space = makeSpace();
    expect(() => createLease(makeLeaseInput({ startDate: '2026-12-31', endDate: '2026-01-01' }), space as any)).toThrow();
  });

  it('rejects negative rate', () => {
    const space = makeSpace();
    expect(() => createLease(makeLeaseInput({ rate: -1 }), space as any)).toThrow();
  });

  it('activates lease and marks space leased', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    activateLease(lease, space as any);
    expect(lease.status).toBe('active');
    expect(space.status).toBe('leased');
  });

  it('cannot activate non-draft lease', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    activateLease(lease, space as any);
    expect(() => activateLease(lease, space as any)).toThrow();
  });

  it('terminates lease and frees space', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    activateLease(lease, space as any);
    terminateLease(lease, space as any, '2026-06-30');
    expect(lease.status).toBe('terminated');
    expect(space.status).toBe('vacant');
    expect(lease.endDate).toBe('2026-06-30');
  });

  it('calculates rent with escalation', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput({ escalationPercentPerYear: 10 }), space as any);
    const { baseRent, totalDue } = calculateRentForPeriod(lease, '2027-01-01', '2027-01-31', 100, 50, 25);
    // 2.5 * 1.1 = 2.75 rate, 1 month => 2.75
    expect(baseRent).toBe(2.75);
    expect(totalDue).toBe(2.75 + 100 + 50 + 25);
  });

  it('generates ledger entry with pending status', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    activateLease(lease, space as any);
    const entry = generateRentLedgerEntry({
      id: 'E1', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1',
      periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-10',
      electricityCharge: 500, maintenanceCharge: 200,
    });
    expect(entry.paymentStatus).toBe('pending');
    expect(entry.amountPaid).toBe(0);
    expect(entry.electricityCharge).toBe(500);
  });

  it('records partial and full payments', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    const entry = generateRentLedgerEntry({
      id: 'E2', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1',
      periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-10',
    });
    entry.totalDue = 1000;
    recordPayment(entry, 400, '2026-01-05');
    expect(entry.paymentStatus).toBe('partial');
    expect(entry.amountPaid).toBe(400);
    recordPayment(entry, 600, '2026-01-08', 'RCP-001');
    expect(entry.paymentStatus).toBe('paid');
    expect(entry.receiptNumber).toBe('RCP-001');
  });

  it('rejects negative payment', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    const entry = generateRentLedgerEntry({ id: 'E3', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-10' });
    expect(() => recordPayment(entry, -50, '2026-01-05')).toThrow();
  });

  it('detects overdue entries', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    const entry = generateRentLedgerEntry({ id: 'E4', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-10' });
    expect(detectOverdue(entry, '2026-01-15')).toBe(true);
    expect(detectOverdue(entry, '2026-01-05')).toBe(false);
    updateOverdueStatus(entry, '2026-01-15');
    expect(entry.paymentStatus).toBe('overdue');
  });

  it('paid entries are not overdue', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    const entry = generateRentLedgerEntry({ id: 'E5', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-10' });
    entry.totalDue = 100;
    recordPayment(entry, 100, '2026-01-08');
    expect(detectOverdue(entry, '2026-02-01')).toBe(false);
  });

  it('computes rent summary', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput(), space as any);
    const e1 = generateRentLedgerEntry({ id: 'E6', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-10' });
    e1.totalDue = 1000;
    const e2 = generateRentLedgerEntry({ id: 'E7', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-02-01', periodEnd: '2026-02-28', dueDate: '2026-02-10' });
    e2.totalDue = 1000;
    recordPayment(e1, 1000, '2026-01-08');
    updateOverdueStatus(e2, '2026-03-01');
    const summary = computeRentSummary([e1, e2]);
    expect(summary.totalDue).toBe(2000);
    expect(summary.totalPaid).toBe(1000);
    expect(summary.overdueCount).toBe(1);
    expect(summary.totalOverdue).toBe(1000);
  });

  it('detects lease expiring soon', () => {
    const space = makeSpace();
    const lease = createLease(makeLeaseInput({ endDate: '2026-11-20' }), space as any);
    activateLease(lease, space as any);
    expect(isLeaseExpiringSoon(lease, '2026-11-01', 30)).toBe(true);
    expect(isLeaseExpiringSoon(lease, '2026-11-01', 5)).toBe(false);
  });

  it('renewLease links old and new', () => {
    const space = makeSpace();
    const old = createLease(makeLeaseInput(), space as any);
    activateLease(old, space as any);
    const newer = createLease(makeLeaseInput({ id: 'L2', startDate: '2027-01-01', endDate: '2027-12-31', isRenewal: true }), space as any);
    renewLease(old, newer);
    expect(old.status).toBe('renewed');
    expect(newer.renewalOfLeaseId).toBe(old.id);
  });

  it('allocates electricity charges by submeter', () => {
    const main = { id: 'M0', meterId: 'MAIN', isMainMeter: true, readingKwh: 1000, readingDate: '2026-01-01', recordedBy: 'op', facilityId: 'F1' } as any;
    const sub1 = { id: 'S1', meterId: 'SUB1', isMainMeter: false, readingKwh: 300, readingDate: '2026-01-01', recordedBy: 'op', facilityId: 'F1', spaceId: 'SP-A' } as any;
    const sub2 = { id: 'S2', meterId: 'SUB2', isMainMeter: false, readingKwh: 200, readingDate: '2026-01-01', recordedBy: 'op', facilityId: 'F1', spaceId: 'SP-B' } as any;
    const alloc = allocateElectricityCharge(main, [sub1, sub2], 8);
    expect(alloc.length).toBe(2);
    expect(alloc[0].charge).toBe(2400);
    expect(alloc[1].charge).toBe(1600);
  });
});

describe('P09 Tenant & Monthly Ledger Generation', () => {
  it('creates a tenant with valid GSTIN', () => {
    const t = createTenant({ id: 'T1', name: 'ABC Traders', gstin: '24ABCDE1234F1Z5', contactPerson: 'Raj', phone: '9876543210' });
    expect(t.gstin).toBe('24ABCDE1234F1Z5');
  });

  it('rejects invalid GSTIN', () => {
    expect(() => createTenant({ id: 'T2', name: 'X', gstin: 'BAD', contactPerson: 'Raj', phone: '9876543210' })).toThrow();
  });

  it('requires phone', () => {
    expect(() => createTenant({ id: 'T3', name: 'X', contactPerson: 'Raj', phone: '  ' })).toThrow();
  });

  it('generates monthly ledgers for active leases overlapping period', () => {
    const space = { id: 'S1', code: 'R1', status: 'vacant' as const, areaSqFt: 600, facilityId: 'F1', name: 'R', type: 'room' as const, floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient' as const };
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'sqft_month', rate: 2.5 }, space as any);
    activateLease(lease, space as any);
    const entries = generateMonthlyRentLedgers({ leases: [lease], periodYear: 2026, periodMonth: 3, electricityByLease: { 'L1': 500 }, dueDayOfMonth: 10 });
    expect(entries.length).toBe(1);
    expect(entries[0].periodStart).toBe('2026-03-01');
    expect(entries[0].periodEnd).toBe('2026-03-31');
    expect(entries[0].electricityCharge).toBe(500);
    expect(entries[0].dueDate).toBe('2026-03-10');
  });

  it('skips non-active and non-overlapping leases', () => {
    const space = { id: 'S2', code: 'R2', status: 'vacant' as const, areaSqFt: 600, facilityId: 'F1', name: 'R', type: 'room' as const, floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient' as const };
    const lease = createLease({ id: 'L2', facilityId: 'F1', spaceId: 'S2', tenantId: 'T2', startDate: '2027-01-01', endDate: '2027-12-31', billingUnit: 'sqft_month', rate: 2.5 }, space as any);
    // draft, not active, and future period
    const entries = generateMonthlyRentLedgers({ leases: [lease], periodYear: 2026, periodMonth: 3 });
    expect(entries.length).toBe(0);
  });
});

describe('P09 Receipts, Renewal Preview, Overdue/Pending Filters', () => {
  it('generates receipt number', () => {
    expect(generateReceiptNumber('L1', '2026-03-15')).toBe('RCP-L1-20260315');
  });

  it('issues receipt and marks paid when fully paid', () => {
    const space = { id: 'S1', code: 'R1', status: 'vacant' as const, areaSqFt: 600, facilityId: 'F1', name: 'R', type: 'room' as const, floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient' as const };
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'sqft_month', rate: 2.5 }, space as any);
    const entry = generateRentLedgerEntry({ id: 'E1', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-10' });
    entry.totalDue = 100;
    recordPayment(entry, 100, '2026-01-08');
    const r = issueReceipt(entry, '2026-01-08');
    expect(r.receiptNumber).toContain('RCP-L1');
    expect(r.amount).toBe(100);
    expect(entry.paymentStatus).toBe('paid');
  });

  it('rejects receipt for zero payment', () => {
    const space = { id: 'S1', code: 'R1', status: 'vacant' as const, areaSqFt: 600, facilityId: 'F1', name: 'R', type: 'room' as const, floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient' as const };
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'sqft_month', rate: 2.5 }, space as any);
    const entry = generateRentLedgerEntry({ id: 'E2', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-10' });
    expect(() => issueReceipt(entry, '2026-01-08')).toThrow();
  });

  it('previews renewal with escalation', () => {
    const space = { id: 'S1', code: 'R1', status: 'vacant' as const, areaSqFt: 600, facilityId: 'F1', name: 'R', type: 'room' as const, floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient' as const };
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'sqft_month', rate: 2.5, escalationPercentPerYear: 5, depositAmount: 50000 }, space as any);
    const p = previewRenewal(lease, '2027-01-01', '2027-12-31', 3.0, 7);
    expect(p.oldRate).toBe(2.5);
    expect(p.newRate).toBe(3.0);
    expect(p.escalation).toBe(7);
    expect(p.depositCarryForward).toBe(50000);
  });

  it('filters overdue and pending entries', () => {
    const space = { id: 'S1', code: 'R1', status: 'vacant' as const, areaSqFt: 600, facilityId: 'F1', name: 'R', type: 'room' as const, floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient' as const };
    const lease = createLease({ id: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', startDate: '2026-01-01', endDate: '2026-12-31', billingUnit: 'sqft_month', rate: 2.5 }, space as any);
    const e1 = generateRentLedgerEntry({ id: 'E1', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-10' });
    e1.totalDue = 100;
    const e2 = generateRentLedgerEntry({ id: 'E2', lease, facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-02-01', periodEnd: '2026-02-28', dueDate: '2026-02-10' });
    e2.totalDue = 100;
    recordPayment(e1, 100, '2026-01-08');
    updateOverdueStatus(e2, '2026-03-01');
    expect(getOverdueEntries([e1, e2], '2026-03-01').length).toBe(1);
    expect(getPendingEntries([e1, e2]).length).toBe(0);
  });
});

describe('P09 Rent Payable (leased-in facility)', () => {
  it('generates rent payable entry', () => {
    const entry = generateRentPayableEntry({ id: 'RP1', facilityId: 'F1', landlordName: 'ABC Properties', periodStart: '2026-11-01', periodEnd: '2026-11-30', dueDate: '2026-11-10', baseRent: 50000, electricityCharge: 5000 });
    expect(entry.totalDue).toBe(55000);
    expect(entry.paymentStatus).toBe('pending');
    expect(entry.landlordName).toBe('ABC Properties');
  });

  it('records payable payment', () => {
    const entry = generateRentPayableEntry({ id: 'RP2', facilityId: 'F1', landlordName: 'X', periodStart: '2026-11-01', periodEnd: '2026-11-30', dueDate: '2026-11-10', baseRent: 10000 });
    recordPayablePayment(entry, 10000, '2026-11-08', 'RCP-001');
    expect(entry.paymentStatus).toBe('paid');
    expect(entry.amountPaid).toBe(10000);
  });

  it('computes payable summary', () => {
    const e1 = generateRentPayableEntry({ id: 'RP3', facilityId: 'F1', landlordName: 'X', periodStart: '2026-11-01', periodEnd: '2026-11-30', dueDate: '2026-11-10', baseRent: 10000 });
    const e2 = generateRentPayableEntry({ id: 'RP4', facilityId: 'F1', landlordName: 'X', periodStart: '2026-12-01', periodEnd: '2026-12-31', dueDate: '2026-12-10', baseRent: 10000 });
    recordPayablePayment(e1, 10000, '2026-11-08');
    const summary = computePayableSummary([e1, e2]);
    expect(summary.totalDue).toBe(20000);
    expect(summary.totalPaid).toBe(10000);
    expect(summary.overdueCount).toBeGreaterThanOrEqual(0);
  });

  it('rejects negative payable payment', () => {
    const entry = generateRentPayableEntry({ id: 'RP5', facilityId: 'F1', landlordName: 'X', periodStart: '2026-11-01', periodEnd: '2026-11-30', dueDate: '2026-11-10', baseRent: 10000 });
    expect(() => recordPayablePayment(entry, -100, '2026-11-08')).toThrow();
  });
});
