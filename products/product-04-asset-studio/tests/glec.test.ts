import { describe, it, expect } from 'vitest';
import {
  calculateCarbonFootprint,
  type CarbonTripInput,
} from '../src/engine/glec';

describe('GLEC Framework v3.0 & EPA SmartWay Carbon Insetting Engine', () => {
  const standardTrip: CarbonTripInput = {
    loadedMiles: 800,
    emptyDeadheadMiles: 100,
    cargoPayloadTons: 22, // 44,000 lbs
    fuelEconomyMpg: 6.5,
    selectedFuel: 'diesel_ulsd',
  };

  it('calculates accurate Well-to-Wheel (WTW) emissions for standard fossil diesel', () => {
    const result = calculateCarbonFootprint(standardTrip);

    expect(result.totalMiles).toBe(900);
    expect(result.fuelConsumedTotal).toBeCloseTo(900 / 6.5, 1);
    expect(result.wtwKgCO2e).toBeGreaterThan(1700);
    expect(result.avoidedScope3KgCO2e).toBe(0);
    expect(result.insettingReductionPct).toBe(0);
    expect(result.gramsCO2ePerTonMile).toBeGreaterThan(90);
  });

  it('proves >85% Scope 3 carbon reduction when switching to HVO 100 Renewable Diesel', () => {
    const hvoTrip: CarbonTripInput = {
      ...standardTrip,
      selectedFuel: 'hvo100',
    };
    const result = calculateCarbonFootprint(hvoTrip);

    expect(result.ttwKgCO2e).toBe(0); // 0 tailpipe biogenic emissions
    expect(result.insettingReductionPct).toBeGreaterThanOrEqual(85);
    expect(result.avoidedScope3KgCO2e).toBeGreaterThan(1400);
    expect(result.indicativeScenarioCategory).toBe('Substantial Decarbonization Scenario (≥50%)');
  });

  it('computes Class 8 Battery Electric (BEV) upstream grid emissions and savings using multiplication (miles * kWh/mi)', () => {
    const bevTrip: CarbonTripInput = {
      ...standardTrip,
      kwhPerMile: 2.1, // 2.1 kWh/mi consumption
      selectedFuel: 'battery_electric',
    };
    const result = calculateCarbonFootprint(bevTrip);

    expect(result.fuelUnit).toBe('kWh');
    expect(result.fuelConsumedTotal).toBe(900 * 2.1); // 1,890 kWh total consumption
    expect(result.ttwKgCO2e).toBe(0);
    expect(result.wttKgCO2e).toBeCloseTo((1890 * 380) / 1000, 0); // ~718 kg CO2e
    expect(result.insettingReductionPct).toBeGreaterThan(50);
    expect(result.verificationStandard).toContain('Scenario Estimator');
  });

  it('accurately accounts for auxiliary reefer fuel consumption and deadhead miles', () => {
    const reeferTrip: CarbonTripInput = {
      ...standardTrip,
      isReeferActive: true,
      reeferHours: 15,
    };
    const result = calculateCarbonFootprint(reeferTrip);

    // 15 hours * 0.6 gal/hr = 9 extra gallons
    const expectedFuel = Number(((900 / 6.5) + 9).toFixed(2));
    expect(result.fuelConsumedTotal).toBe(expectedFuel);
    expect(result.wtwKgCO2e).toBeGreaterThan(standardTrip.loadedMiles);
  });
});
