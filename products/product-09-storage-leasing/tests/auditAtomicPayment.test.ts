import { describe, expect, it } from 'vitest';
import { preparePayment } from '../src/engine/paymentTransaction';
import type { RentLedgerEntry } from '../src/engine/types';

const entry = (): RentLedgerEntry => ({ id: 'E1', leaseId: 'L1', facilityId: 'F1', spaceId: 'S1', tenantId: 'T1', periodStart: '2026-01-01', periodEnd: '2026-01-31', baseRent: 1000, electricityCharge: 0, maintenanceCharge: 0, otherCharges: 0, totalDue: 1000, amountPaid: 0, paymentStatus: 'pending', dueDate: '2026-01-10' });

describe('atomic payment preparation', () => {
  it('updates the ledger and matching receipt together without mutating the input', () => {
    const original = { ledgerEntries: [entry()], receipts: ['legacy'] };
    const first = preparePayment(original, 'E1', 300, '2026-01-05');
    const second = preparePayment(first.state, 'E1', 200, '2026-01-06');
    expect(original.ledgerEntries[0].amountPaid).toBe(0);
    expect(second.state.ledgerEntries[0].amountPaid).toBe(500);
    expect(second.state.ledgerEntries[0].paymentTransactions?.map(t => t.receiptNumber)).toEqual(second.state.receipts.slice(1));
  });
  it('leaves both collections unchanged when a payment is invalid', () => {
    const original = { ledgerEntries: [entry()], receipts: ['legacy'] };
    expect(() => preparePayment(original, 'E1', 1e308, '2026-01-05')).toThrow();
    expect(original.ledgerEntries[0].paymentTransactions).toBeUndefined();
    expect(original.receipts).toEqual(['legacy']);
  });
});
