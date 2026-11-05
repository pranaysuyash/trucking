import { describe, it, expect } from 'vitest';
import {
  calculateAxleDistribution,
  simulateMultiStopUnload,
  type StopCargoGroup,
} from '../src/engine/multistop';
import { STANDARD_VEHICLES } from '../src/engine/catalog';

describe('P04 Asset Studio Multi-Stop Dynamic Axle CG Shift Engine', () => {
  const dryVan53 = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;

  it('calculates legal baseline axle distribution for empty trailer', () => {
    const emptyDist = calculateAxleDistribution(dryVan53, []);
    expect(emptyDist.isLegal).toBe(true);
    expect(emptyDist.violations).toHaveLength(0);
    expect(emptyDist.totalGrossLbs).toBe(dryVan53.weight.curbWeightLbs);
    expect(emptyDist.steerLbs).toBeGreaterThan(9000);
    expect(emptyDist.driveTandemLbs).toBeGreaterThan(12000);
    expect(emptyDist.trailerTandemLbs).toBeGreaterThan(8000);
  });

  it('calculates balanced axle distribution for evenly distributed cargo', () => {
    const balancedGroups: StopCargoGroup[] = [
      {
        stopNumber: 1,
        stopName: 'Des Moines Regional Depot',
        itemCount: 10,
        totalWeightLbs: 16000,
        zCenterInches: 480, // near rear
      },
      {
        stopNumber: 2,
        stopName: 'Omaha Final Distribution',
        itemCount: 12,
        totalWeightLbs: 18000,
        zCenterInches: 180, // near nose
      },
    ];

    const dist = calculateAxleDistribution(dryVan53, balancedGroups);
    expect(dist.totalGrossLbs).toBe(dryVan53.weight.curbWeightLbs + 34000);
    expect(dist.totalGrossLbs).toBeLessThanOrEqual(80000);
    expect(dist.driveTandemLbs).toBeLessThanOrEqual(34000);
    expect(dist.trailerTandemLbs).toBeLessThanOrEqual(34000);
    expect(dist.steerLbs).toBeLessThanOrEqual(12000);
    expect(dist.isLegal).toBe(true);
  });

  it('detects dangerous drive-tandem overload in sequential multi-stop unload', () => {
    // If rear cargo (Stop 1) is unloaded, remaining heavy Stop 2 cargo at the nose
    // shifts the Center of Gravity violently forward onto the tractor drive axles.
    const dangerousGroups: StopCargoGroup[] = [
      {
        stopNumber: 1,
        stopName: 'Stop 1 (Rear)',
        itemCount: 8,
        totalWeightLbs: 15000,
        zCenterInches: 520, // rear
      },
      {
        stopNumber: 2,
        stopName: 'Stop 2 (Nose Overload)',
        itemCount: 16,
        totalWeightLbs: 26000,
        zCenterInches: 80, // extreme front nose
      },
    ];

    const stages = simulateMultiStopUnload(dryVan53, dangerousGroups);
    expect(stages).toHaveLength(3); // Stage 0 (initial), Stage 1 (post stop 1), Stage 2 (empty)

    // Stage 0: Initial loadout
    expect(stages[0].stageIndex).toBe(0);
    expect(stages[0].activePayloadLbs).toBe(41000);

    // Stage 1: Stop 1 has been dropped at the rear, 26,000 lbs remains at the nose
    const postStop1 = stages[1];
    expect(postStop1.unloadedStopNumbers).toContain(1);
    expect(postStop1.activeStopsRemaining).toEqual([2]);
    expect(postStop1.distribution.cgPercentFromNose).toBeLessThan(35); // CG shifted far forward
    // Drive tandem must exceed 34,000 lbs legal bridge limit or trigger warning
    expect(postStop1.hazardDetected || postStop1.hazardDescription !== null).toBe(true);
  });
});
