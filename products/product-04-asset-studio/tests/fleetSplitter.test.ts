import { describe, it, expect } from 'vitest';
import {
  splitCargoDemandAcrossFleet,
  type SplitterInput,
} from '../src/engine/fleetSplitter';

describe('P04 Asset Studio Fleet Splitter & Demand Partitioning Heuristic', () => {
  it('allocates small freight demand into a single appropriately sized vehicle', () => {
    const input: SplitterInput = {
      items: [
        {
          packageId: 'pallet-gma-48x40',
          quantity: 8,
          customWeightLbs: 1200,
        },
      ],
      allowedVehicleIds: ['box-truck-26', 'dry-van-53', 'sprinter-van'],
    };

    const result = splitCargoDemandAcrossFleet(input);
    expect(result.totalDemandItems).toBe(8);
    expect(result.totalDemandWeightLbs).toBe(9600);
    expect(result.partitions.length).toBe(1);
    expect(result.unassignedItems).toHaveLength(0);
    expect(result.partitions[0].isOverweight).toBe(false);
  });

  it('partitions oversized manifest exceeding single-trailer legal limits into multiple vehicles', () => {
    // 50 GMA pallets at 1,800 lbs = 90,000 lbs (exceeds single dry van 45,000 lb limit)
    const input: SplitterInput = {
      items: [
        {
          packageId: 'pallet-gma-48x40',
          quantity: 50,
          customWeightLbs: 1800,
        },
      ],
      allowedVehicleIds: ['dry-van-53'],
    };

    const result = splitCargoDemandAcrossFleet(input);
    expect(result.totalDemandItems).toBe(50);
    expect(result.totalDemandWeightLbs).toBe(90000);
    // 53ft dry van holds max 26 pallets on floor or 45,000 lbs
    // So 50 pallets must require at least 2 or 3 vehicles
    expect(result.partitions.length).toBeGreaterThanOrEqual(2);
    for (const part of result.partitions) {
      expect(part.totalWeightLbs).toBeLessThanOrEqual(part.vehicle.weight.maxPayloadLbs);
      expect(part.isOverweight).toBe(false);
      expect(part.cargoFitBridgeUrl).toContain('vehicleId=dry-van-53');
    }
  });

  it('computes accurate utilization percentages across partitioned fleet', () => {
    const input: SplitterInput = {
      items: [
        {
          packageId: 'pallet-gma-48x40',
          quantity: 26, // One full standard floor load
          customWeightLbs: 1500, // 39,000 lbs
        },
      ],
      allowedVehicleIds: ['dry-van-53'],
    };

    const result = splitCargoDemandAcrossFleet(input);
    expect(result.partitions).toHaveLength(1);
    const p = result.partitions[0];
    expect(p.totalPalletEquivalent).toBe(26);
    expect(p.palletUtilizationPct).toBeGreaterThanOrEqual(85);
    expect(p.weightUtilizationPct).toBeGreaterThan(80);
    expect(p.isOvercube).toBe(false);
    expect(p.isOverweight).toBe(false);
  });
});
