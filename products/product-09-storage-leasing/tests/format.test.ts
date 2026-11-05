import { describe, it, expect } from 'vitest';
import { inr, sqft, pct, dateShort, monthLabel, num } from '../src/ui/format';

describe('format', () => {
  it('inr formats with Indian grouping', () => {
    expect(inr(1234567)).toBe('₹12,34,567');
    expect(inr(0)).toBe('₹0');
    expect(inr(NaN)).toBe('₹0');
  });
  it('inr compact uses lakhs', () => {
    expect(inr(150000, { compact: true })).toBe('₹1.5L');
  });
  it('sqft appends unit', () => {
    expect(sqft(1200)).toBe('1,200 sqft');
  });
  it('pct formats', () => {
    expect(pct(42.5, 1)).toBe('42.5%');
  });
  it('dateShort handles invalid', () => {
    expect(dateShort('')).toBe('—');
    expect(dateShort('not-a-date')).toBe('not-a-date');
  });
  it('monthLabel', () => {
    expect(monthLabel(2026, 11)).toContain('November');
    expect(monthLabel(2026, 11)).toContain('2026');
  });
  it('num respects digits', () => {
    expect(num(1234.5, 2)).toBe('1,234.50');
  });
});