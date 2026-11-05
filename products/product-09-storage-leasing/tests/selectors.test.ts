import { describe, it, expect } from 'vitest';
import { selectMetrics, selectCharges, ELECTRICITY_CONFIG } from '../src/ui/selectors';

describe('selectors', () => {
  it('selectMetrics returns null for null facility', () => {
    expect(selectMetrics(null)).toBeNull();
  });
  it('ELECTRICITY_CONFIG matches the original hardcoded values', () => {
    expect(ELECTRICITY_CONFIG.tariffPerKwh).toBe(8);
    expect(ELECTRICITY_CONFIG.dgChargePerKwh).toBe(12);
    expect(ELECTRICITY_CONFIG.useDG).toBe(false);
  });
  it('selectCharges computes per the config', () => {
    const out = selectCharges([{ spaceId: 'S1', kwh: 100 }]);
    expect(out).toHaveLength(1);
    expect(out[0].energyCharge).toBe(800);
    expect(out[0].dgCharge).toBe(0);
    expect(out[0].total).toBe(800);
  });
});