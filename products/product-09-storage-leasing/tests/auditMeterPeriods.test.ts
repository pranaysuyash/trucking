import { describe, expect, it } from 'vitest';
import { addMeterConsumption, allocateBillForPeriod } from '../src/engine/meterConsumption';

describe('meter period reconciliation', () => {
  it('allocates only the selected period, preserving legacy and other-period readings', () => {
    const readings = [
      { spaceId: 'A', kwh: 20 },
      { spaceId: 'A', kwh: 30, periodStart: '2026-01-01', periodEnd: '2026-01-31' },
      { spaceId: 'B', kwh: 70, periodStart: '2026-01-01', periodEnd: '2026-01-31' },
      { spaceId: 'A', kwh: 500, periodStart: '2026-02-01', periodEnd: '2026-02-28' },
    ];
    const result = allocateBillForPeriod(readings, '2026-01-01', '2026-01-31', 1000);
    expect(result.map(row => [row.spaceId, row.allocated])).toEqual([['A', 300], ['B', 700]]);
    expect(readings).toHaveLength(4);
  });
  it('rejects overlapping readings for one space and invalid periods or values', () => {
    const existing = [{ spaceId: 'A', kwh: 30, periodStart: '2026-01-01', periodEnd: '2026-01-31' }];
    expect(() => addMeterConsumption(existing, { spaceId: 'A', kwh: 5, periodStart: '2026-01-31', periodEnd: '2026-02-28' })).toThrow(/overlap/i);
    expect(() => addMeterConsumption(existing, { spaceId: 'A', kwh: NaN, periodStart: '2026-02-01', periodEnd: '2026-02-28' })).toThrow(/finite/i);
    expect(() => addMeterConsumption(existing, { spaceId: 'A', kwh: 5, periodStart: '2026-02-30', periodEnd: '2026-03-01' })).toThrow(/date/i);
    expect(() => allocateBillForPeriod(existing, '', '', 1000)).toThrow(/date/i);
    expect(() => allocateBillForPeriod(existing, '2026-02-01', '2026-02-28', 1000)).toThrow(/no.*reading/i);
  });
  it('conserves bill cents and refuses overlapping imported periods', () => {
    const period = { periodStart: '2026-01-01', periodEnd: '2026-01-31' };
    const readings = ['A', 'B', 'C'].map(spaceId => ({ spaceId, kwh: 1, ...period }));
    expect(allocateBillForPeriod(readings, period.periodStart, period.periodEnd, 1).map(r => r.allocated)).toEqual([0.34, 0.33, 0.33]);
    expect(() => allocateBillForPeriod([...readings, { spaceId: 'A', kwh: 5, periodStart: '2026-01-15', periodEnd: '2026-02-15' }], period.periodStart, period.periodEnd, 1)).toThrow(/overlap/i);
  });
});
