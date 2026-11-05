import { describe, it, expect } from 'vitest';
import { simulateTemporalDynamics } from '../src/engine/temporal';
import { STANDARD_VEHICLES } from '../src/engine/catalog';

describe('P04 Asset Studio Temporal Fuel Burn & Range Simulation Engine', () => {
  const dryVan53 = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;
  const reefer53 = STANDARD_VEHICLES.find((v) => v.id === 'refrigerated-reefer-53')!;
  const teslaSemi = STANDARD_VEHICLES.find((v) => v.id === 'electric-class8-semi')!;

  it('calculates driving time, fuel burn, and turnaround for diesel dry van trip', () => {
    // 300 miles at 65 mph with 35,000 lbs payload
    const sim = simulateTemporalDynamics(dryVan53, 35000, 300, 65, 24, 'pallet');

    expect(sim.distanceMiles).toBe(300);
    expect(sim.speedMph).toBe(65);
    expect(sim.drivingTimeHours).toBeCloseTo(4.6, 1);
    expect(sim.effectiveMpg).toBeGreaterThan(5.0);
    expect(sim.effectiveMpg).toBeLessThan(7.5);
    expect(sim.fuelBurned).toBeGreaterThan(40);
    expect(sim.fuelBurned).toBeLessThan(65);
    expect(sim.totalFuelCostEst).toBeGreaterThan(150);
    expect(sim.co2EmittedLbs).toBeGreaterThan(800);
    expect(sim.totalTurnaroundHours).toBeGreaterThan(sim.drivingTimeHours);
  });

  it('triggers refueling stop warning when distance exceeds single-tank range', () => {
    // 1,800 miles exceeds single tank range of standard 200-gal Class 8 diesel (~1,300 miles)
    const longHaul = simulateTemporalDynamics(dryVan53, 40000, 1800, 65, 26, 'pallet');

    expect(longHaul.requiresRefuelStop).toBe(true);
    expect(longHaul.refuelStopsCount).toBeGreaterThanOrEqual(1);
    expect(longHaul.refuelDwellHours).toBeGreaterThanOrEqual(0.7);
    expect(longHaul.fuelDepletionWarning).toBeDefined();
    expect(longHaul.fuelDepletionWarning).toContain('Requires');
  });

  it('calculates auxiliary reefer fuel burn for temperature-controlled freight', () => {
    if (reefer53) {
      const sim = simulateTemporalDynamics(reefer53, 38000, 500, 60, 24, 'pallet');
      expect(sim.reeferFuelBurnedGal).toBeGreaterThan(0);
      expect(sim.totalFuelCostEst).toBeGreaterThan(sim.fuelBurned * 3.85);
    }
  });

  it('evaluates electric commercial vehicle kWh energy rates and zero direct tailpipe CO2', () => {
    if (teslaSemi) {
      const bevSim = simulateTemporalDynamics(teslaSemi, 35000, 200, 60, 24, 'pallet');
      expect(bevSim.co2EmittedLbs).toBe(0);
      expect(bevSim.totalFuelCostEst).toBeLessThan(100); // Cheaper electricity vs diesel
    }
  });
});
