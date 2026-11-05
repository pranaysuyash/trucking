import { describe, it, expect } from 'vitest';
import { evaluateAeroEcoConfiguration } from '../src/engine/aeroEcoModeler';

describe('EPA SmartWay Aerodynamic Drag & Eco-Equipment Modeler', () => {
  it('returns baseline values when no eco packages are installed', () => {
    const evalResult = evaluateAeroEcoConfiguration([]);
    expect(evalResult.effectiveCd).toBe(0.62);
    expect(evalResult.effectiveMpg).toBe(6.5);
    expect(evalResult.mpgImprovementPct).toBe(0);
    expect(evalResult.annualFuelSavedGallons).toBe(0);
    expect(evalResult.annualCostSavingsUsd).toBe(0);
    expect(evalResult.smartWayCertifiedFleet).toBe(false);
  });

  it('calculates Cd reduction, MPG lift, and annual diesel savings for full aerodynamic package', () => {
    // Select Side Skirts + Boat Tail + Cab Extenders
    const evalResult = evaluateAeroEcoConfiguration([
      'AERO_SIDE_SKIRTS',
      'AERO_BOAT_TAIL',
      'AERO_CAB_EXTENDERS',
    ]);

    // Baseline 0.62 - (0.042 + 0.034 + 0.038 = 0.114) = ~0.506
    expect(evalResult.effectiveCd).toBeLessThan(0.55);
    expect(evalResult.effectiveMpg).toBeGreaterThan(7.2);
    expect(evalResult.mpgImprovementPct).toBeGreaterThan(12.0);
    expect(evalResult.annualFuelSavedGallons).toBeGreaterThan(1500);
    expect(evalResult.annualCostSavingsUsd).toBeGreaterThan(5000);
    expect(evalResult.annualGlecCo2ReductionTonnes).toBeGreaterThan(15);
    expect(evalResult.simplePaybackMonths).toBeLessThan(12); // Under 1 year payback!
    expect(evalResult.smartWayCertifiedFleet).toBe(true);
  });

  it('factors in weight reduction from wide-base super single tires', () => {
    const evalResult = evaluateAeroEcoConfiguration(['TIRE_SUPER_SINGLES']);
    expect(evalResult.netTareWeightChangeLb).toBe(-760); // Tare reduction
    expect(evalResult.effectiveMpg).toBeGreaterThan(6.5);
  });
});
