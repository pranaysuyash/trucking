import { describe, expect, it } from 'vitest';
import { issueReceipt, recordPayment } from '../src/engine/leaseEngine';
import type { RentLedgerEntry } from '../src/engine/types';

const ledger = (): RentLedgerEntry => ({
  id: 'E1', leaseId: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1',
  periodStart: '2026-01-01', periodEnd: '2026-01-31', baseRent: 1000,
  electricityCharge: 0, maintenanceCharge: 0, otherCharges: 0, totalDue: 1000,
  amountPaid: 0, paymentStatus: 'pending', dueDate: '2026-01-10',
});

describe('payment and receipt integrity', () => {
  it('retains independent partial payment transactions and does not mark a partial receipt fully paid', () => {
    const entry = ledger();
    recordPayment(entry, 300, '2026-01-05');
    const first = issueReceipt(entry, '2026-01-05', 300);
    expect(entry.paidDate).toBeUndefined();
    recordPayment(entry, 800, '2026-01-20');
    const second = issueReceipt(entry, '2026-01-20', 800);
    expect(entry.amountPaid).toBe(1000);
    expect(entry.overpaidAmount).toBe(100);
    expect(entry.paidDate).toBe('2026-01-20');
    expect(entry.paymentTransactions?.map(t => [t.amountReceived, t.amountApplied, t.overpayment, t.receiptNumber])).toEqual([
      [300, 300, 0, first.receiptNumber], [800, 700, 100, second.receiptNumber],
    ]);
    expect(entry.paymentHistoryOpeningApplied).toBe(0);
  });
  it('preserves an unexplained legacy opening balance rather than inventing earlier receipts', () => {
    const entry = { ...ledger(), amountPaid: 250, paymentStatus: 'partial' as const };
    recordPayment(entry, 100, '2026-01-06');
    expect(entry.paymentHistoryOpeningApplied).toBe(250);
    expect(entry.paymentTransactions).toHaveLength(1);
  });
  it.each([NaN, Infinity, 0, -1, 1e308, 0.001])('rejects an invalid payment amount %s without mutation', (amount) => {
    const entry = ledger();
    expect(() => recordPayment(entry, amount, '2026-01-05')).toThrow();
    expect(entry.amountPaid).toBe(0);
    expect(entry.paymentTransactions).toBeUndefined();
  });
  it('rejects an unsafe persisted balance without mutating its record', () => {
    const entry = { ...ledger(), totalDue: 1e308 };
    expect(() => recordPayment(entry, 100, '2026-01-05')).toThrow(/amount|paise|review/i);
    expect(entry.amountPaid).toBe(0);
    expect(entry.paymentTransactions).toBeUndefined();
  });
});
