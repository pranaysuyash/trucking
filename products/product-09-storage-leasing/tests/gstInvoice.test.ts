import { describe, it, expect } from 'vitest';
import { generateGstInvoice, calculateLateFee } from '../src/engine/gstInvoice';

describe('P09 GST Invoice', () => {
  it('intra-state splits into CGST+SGST', () => {
    const inv = generateGstInvoice({ invoiceNumber: 'INV-1', invoiceDate: '2026-11-05', supplierGstin: '27AAAAA0000A1Z5', recipientGstin: '27BBBBB0000B1Z5', supplierState: 'Maharashtra', recipientState: 'Maharashtra', description: 'Rent', taxableValue: 10000 });
    expect(inv.intraState).toBe(true);
    expect(inv.totalCgst).toBeGreaterThan(0);
    expect(inv.totalSgst).toBeGreaterThan(0);
    expect(inv.totalIgst).toBe(0);
    expect(inv.grandTotal).toBeGreaterThan(10000);
  });
  it('inter-state uses IGST', () => {
    const inv = generateGstInvoice({ invoiceNumber: 'INV-2', invoiceDate: '2026-11-05', supplierGstin: '27AAAAA0000A1Z5', recipientGstin: '07CCCCC0000C1Z5', supplierState: 'Maharashtra', recipientState: 'Delhi', description: 'Rent', taxableValue: 10000 });
    expect(inv.intraState).toBe(false);
    expect(inv.totalIgst).toBeGreaterThan(0);
    expect(inv.totalCgst).toBe(0);
    expect(inv.totalSgst).toBe(0);
  });
  it('includes late fee line', () => {
    const inv = generateGstInvoice({ invoiceNumber: 'INV-3', invoiceDate: '2026-11-05', supplierGstin: '27AAAAA0000A1Z5', recipientState: 'Maharashtra', supplierState: 'Maharashtra', description: 'Rent', taxableValue: 10000, lateFee: 500 });
    expect(inv.lines.length).toBe(2);
  });
});

describe('calculateLateFee', () => {
  it('zero within grace', () => {
    expect(calculateLateFee({ dueDate: '2026-11-01', asOfDate: '2026-11-05', principal: 10000, graceDays: 7 })).toBe(0);
  });
  it('charges after grace', () => {
    const f = calculateLateFee({ dueDate: '2026-11-01', asOfDate: '2026-12-01', principal: 10000, monthlyRatePercent: 2, graceDays: 0 });
    expect(f).toBeGreaterThan(0);
  });
});