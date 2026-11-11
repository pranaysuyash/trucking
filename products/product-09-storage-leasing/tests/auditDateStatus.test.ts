import { describe, expect, it } from 'vitest';
import { calendarDateLocal, dateShort } from '../src/ui/format';
import { paymentStatusAsOf } from '../src/engine/leaseEngine';
import { computeReceivablesAging } from '../src/engine/analytics';
import type { RentLedgerEntry } from '../src/engine/types';

const entry = { totalDue: 1000, amountPaid: 300, dueDate: '2026-01-10', paymentStatus: 'partial' } as RentLedgerEntry;

describe('calendar dates and derived payment state', () => {
  it('formats the browser local calendar day without converting to UTC first', () => {
    expect(calendarDateLocal(new Date(2026, 0, 2, 0, 30))).toBe('2026-01-02');
    expect(dateShort('2026-01-02')).toBe('02 Jan 2026');
  });
  it('derives overdue, partial and paid from the selected day and balance', () => {
    expect(paymentStatusAsOf(entry, '2026-01-09')).toBe('partial');
    expect(paymentStatusAsOf(entry, '2026-01-10')).toBe('partial');
    expect(paymentStatusAsOf(entry, '2026-01-11')).toBe('overdue');
    expect(paymentStatusAsOf({ ...entry, amountPaid: 1000 }, '2026-01-11')).toBe('paid');
    expect(paymentStatusAsOf({ ...entry, dueDate: 'bad' }, '2026-01-11')).toBe('unknown');
  });
  it('keeps an invalid due date out of both current and late aging buckets', () => {
    const aging = computeReceivablesAging([{ ...entry, dueDate: 'bad' }], '2026-01-11');
    expect(aging.buckets.find(b => b.label === 'unknown')?.amount).toBe(700);
    expect(aging.buckets.find(b => b.label === 'current')?.amount).toBe(0);
    expect(aging.totalOverdue).toBe(0);
  });
});
