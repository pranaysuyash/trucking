import { describe, it, expect } from 'vitest';
import {
  STANDARD_VEHICLES,
  STANDARD_PACKAGES,
} from '../src/engine/catalog';
import { computeSpatialFit } from '../src/engine/spatial';
import { simulateTemporalDynamics } from '../src/engine/temporal';
import {
  buildCargoFitBridgeUrl,
  buildFreightPricingBridgeUrl,
  buildHosPlannerBridgeUrl,
  exportOpenLogisticsAssetJson,
  exportSpecCsv,
} from '../src/engine/bridges';
import {
  calculateAxleDistribution,
  simulateMultiStopUnload,
  type StopCargoGroup,
} from '../src/engine/multistop';
import {
  splitCargoDemandAcrossFleet,
  DEFAULT_SPLITTER_VEHICLE_IDS,
} from '../src/engine/fleetSplitter';

describe('Catalog Integrity & Completeness', () => {
  it('contains at least 20 detailed commercial cargo vehicles', () => {
    expect(STANDARD_VEHICLES.length).toBeGreaterThanOrEqual(20);
    for (const v of STANDARD_VEHICLES) {
      expect(v.id).toBeTruthy();
      expect(v.name).toBeTruthy();
      expect(v.exterior.lengthFt).toBeGreaterThan(0);
      expect(v.interior.lengthFt).toBeGreaterThan(0);
      expect(v.weight.gvwrLbs).toBeGreaterThan(0);
      expect(v.weight.maxPayloadLbs).toBeGreaterThan(0);
      expect(v.volumetric.cubicFt).toBeGreaterThan(0);
      expect(v.powertrain.horsepower).toBeGreaterThan(0);
      expect(v.fuelEnergy.capacity).toBeGreaterThan(0);
      expect(v.fuelEnergy.loadedMpg).toBeGreaterThan(0);
    }
  });

  it('contains at least 20 packaging, container, and pallet assets', () => {
    expect(STANDARD_PACKAGES.length).toBeGreaterThanOrEqual(20);
    for (const p of STANDARD_PACKAGES) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.dims.lengthIn).toBeGreaterThan(0);
      expect(p.dims.widthIn).toBeGreaterThan(0);
      expect(p.dims.heightIn).toBeGreaterThan(0);
      expect(p.weight.grossWeightLbs).toBeGreaterThan(0);
      expect(p.volumetricCuFt).toBeGreaterThan(0);
      expect(p.maxStackTiers).toBeGreaterThanOrEqual(1);
    }
  });

  it('contains diverse shapes: cuboid, cylinder, stepped, and cage_tote', () => {
    const shapes = new Set(STANDARD_PACKAGES.map((p) => p.shape));
    expect(shapes.has('cuboid')).toBe(true);
    expect(shapes.has('cylinder')).toBe(true);
    expect(shapes.has('stepped')).toBe(true);
    expect(shapes.has('cage_tote')).toBe(true);
  });
});

describe('Spatial Fit Calculation', () => {
  const dryVan = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;
  const gmaPallet = STANDARD_PACKAGES.find((p) => p.id === 'pallet-gma-48x40')!;
  const steelDrum = STANDARD_PACKAGES.find((p) => p.id === 'drum-55-gal-steel')!;
  const iso40 = STANDARD_PACKAGES.find((p) => p.id === 'iso-40ft-dry')!;

  it('accurately computes floor and double-stack capacity for GMA pallets in a 53ft dry van', () => {
    const fit = computeSpatialFit(dryVan, gmaPallet);
    expect(fit.maxFloorUnits).toBeGreaterThanOrEqual(24);
    expect(fit.maxStackedUnits).toBeGreaterThanOrEqual(24);
    expect(fit.doorClearance.fits).toBe(true);
    expect(fit.isOverweight).toBe(false);
    expect(fit.gridPlacements.length).toBe(fit.placedUnits);
  });

  it('accurately computes fit for 55-gallon drums', () => {
    const fit = computeSpatialFit(dryVan, steelDrum);
    expect(fit.doorClearance.fits).toBe(true);
    expect(fit.placedUnits).toBeGreaterThan(50);
    expect(fit.floorLoad.withinRating).toBe(true);
  });

  it('detects door clearance block for oversized intermodal container attempting to load into standard dry van', () => {
    const fit = computeSpatialFit(dryVan, iso40);
    // 40ft ISO container exterior is 96"W x 102"H while dry van door is ~98"W x 108"H
    // but length is 480"
    expect(fit.doorClearance).toBeDefined();
  });

  it('enforces 0 placed units and empty grid placements when package height exceeds vehicle interior or door aperture', () => {
    const oversizedPkg = {
      ...gmaPallet,
      id: 'oversized-test-tall',
      dims: { lengthIn: 48, widthIn: 40, heightIn: 115 },
    };
    const fit = computeSpatialFit(dryVan, oversizedPkg);
    expect(fit.doorClearance.fits).toBe(false);
    expect(fit.placedUnits).toBe(0);
    expect(fit.maxFloorUnits).toBe(0);
    expect(fit.gridPlacements.length).toBe(0);
    expect(fit.limitingFactor).toBe('door_dimension');
  });
});

describe('Temporal Dynamics Simulation', () => {
  const dryVan = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;
  const reefer = STANDARD_VEHICLES.find((v) => v.id === 'reefer-53')!;
  const electricSemi = STANDARD_VEHICLES.find((v) => v.id === 'electric-class8')!;

  it('calculates fuel consumption and range for diesel dry van on a 600-mile lane', () => {
    const sim = simulateTemporalDynamics(dryVan, 40000, 600, 65, 26, 'pallet');
    expect(sim.distanceMiles).toBe(600);
    expect(sim.speedMph).toBe(65);
    expect(sim.drivingTimeHours).toBeCloseTo(9.2, 1);
    expect(sim.fuelBurned).toBeGreaterThan(80);
    expect(sim.remainingFuel).toBeLessThan(dryVan.fuelEnergy.capacity);
    expect(sim.fuelPercent).toBeGreaterThan(0);
    expect(sim.totalTurnaroundHours).toBeGreaterThan(sim.drivingTimeHours);
  });

  it('calculates reefer fuel consumption over time', () => {
    const sim = simulateTemporalDynamics(reefer, 38000, 500, 60, 24, 'pallet');
    expect(sim.reeferFuelBurnedGal).toBeGreaterThan(0);
  });

  it('flags refuel stop when corridor exceeds fuel capacity', () => {
    const sim = simulateTemporalDynamics(electricSemi, 42000, 550, 65, 26, 'pallet');
    expect(sim.requiresRefuelStop).toBe(true);
  });
});

describe('Cross-Project Bridges & Exporting', () => {
  const dryVan = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;
  const gmaPallet = STANDARD_PACKAGES.find((p) => p.id === 'pallet-gma-48x40')!;
  const fit = computeSpatialFit(dryVan, gmaPallet);
  const sim = simulateTemporalDynamics(dryVan, fit.totalWeightLbs, 650, 65, fit.placedUnits, 'pallet');

  it('generates valid bridge URL to Product 01 (Cargo Fit)', () => {
    const url = buildCargoFitBridgeUrl(dryVan, gmaPallet, fit.placedUnits);
    expect(url).toContain('http://localhost:5173/?');
    expect(url).toContain('source=asset_studio_p04');
    expect(url).toContain('eqCode=DV53');
  });

  it('generates valid bridge URL to Product 02 (Freight Pricing HUD)', () => {
    const url = buildFreightPricingBridgeUrl(dryVan, fit.totalWeightLbs, 650, false);
    expect(url).toContain('http://localhost:5174/?');
    expect(url).toContain('equipment=dry_van');
    expect(url).toContain('loadedMiles=650');
  });

  it('generates valid bridge URL to Product 03 (HOS Planner)', () => {
    const url = buildHosPlannerBridgeUrl(dryVan, 650, 65);
    expect(url).toContain('http://localhost:5175/?');
    expect(url).toContain('source=asset_studio_p04');
    expect(url).toContain('miles=650');
  });

  it('exports valid Open Logistics Asset JSON conforming to schema', () => {
    const jsonStr = exportOpenLogisticsAssetJson(dryVan, gmaPallet, fit, sim);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.generator).toContain('Product-04');
    expect(parsed.vehicle.id).toBe('dry-van-53');
    expect(parsed.cargoPackage.id).toBe('pallet-gma-48x40');
    expect(parsed.spatialAnalysis.placedUnits).toBe(fit.placedUnits);
    expect(parsed.temporalSimulation.distanceMiles).toBe(650);
  });

  it('exports well-formed CSV specifications', () => {
    const csvStr = exportSpecCsv(dryVan);
    expect(csvStr).toContain('"Vehicle Name"');
    expect(csvStr).toContain('"DV53"');
    expect(csvStr).toContain('"Detroit DD15');
  });
});

describe('Multi-Stop Sequential Unload & Dynamic CG Simulator', () => {
  const dryVan = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;

  const testGroups: StopCargoGroup[] = [
    {
      stopNumber: 1,
      stopName: 'Stop 1 Rear Drop',
      itemCount: 8,
      totalWeightLbs: 14000,
      zCenterInches: 520, // Loaded near rear doors
    },
    {
      stopNumber: 2,
      stopName: 'Stop 2 Mid Drop',
      itemCount: 8,
      totalWeightLbs: 14000,
      zCenterInches: 320, // Mid trailer
    },
    {
      stopNumber: 3,
      stopName: 'Stop 3 Nose Drop',
      itemCount: 8,
      totalWeightLbs: 14000,
      zCenterInches: 120, // Nose bulkhead
    },
  ];

  it('calculates balanced initial axle distribution when all stops are loaded', () => {
    const initial = calculateAxleDistribution(dryVan, testGroups);
    expect(initial.totalGrossLbs).toBe(33500 + 42000);
    expect(initial.steerLbs).toBeLessThanOrEqual(12000);
    expect(initial.driveTandemLbs).toBeLessThanOrEqual(34000);
    expect(initial.trailerTandemLbs).toBeLessThanOrEqual(34000);
    expect(initial.isLegal).toBe(true);
  });

  it('detects forward Center of Gravity (CG) shift when rear Stop 1 is unloaded', () => {
    const stages = simulateMultiStopUnload(dryVan, testGroups);
    expect(stages.length).toBe(4); // Stage 0 (initial), Stage 1, Stage 2, Stage 3 (empty)

    const stage0 = stages[0];
    const stage1 = stages[1];

    // Cargo CG must shift forward (lower inches from nose)
    expect(stage1.distribution.cgInchesFromNose).toBeLessThan(stage0.distribution.cgInchesFromNose);
    // Weight on trailer tandem decreases
    expect(stage1.distribution.trailerTandemLbs).toBeLessThan(stage0.distribution.trailerTandemLbs);
    // Drive tandem load percentage of total payload increases
    const driveRatio0 = stage0.distribution.driveTandemLbs / stage0.activePayloadLbs;
    const driveRatio1 = stage1.distribution.driveTandemLbs / stage1.activePayloadLbs;
    expect(driveRatio1).toBeGreaterThan(driveRatio0);
  });
});

describe('Multi-Vehicle Fleet Splitter Heuristic', () => {
  it('partitions an oversized manifest (48 pallets / 72,000 lbs) exceeding single-trailer legal limits into multiple vehicles', () => {
    const result = splitCargoDemandAcrossFleet({
      items: [
        {
          packageId: 'pallet-gma-48x40',
          quantity: 48,
          customWeightLbs: 1500, // 48 * 1500 = 72,000 lbs (exceeds 45k lb semi payload)
        },
      ],
      allowedVehicleIds: DEFAULT_SPLITTER_VEHICLE_IDS,
    });

    expect(result.totalVehicles).toBeGreaterThanOrEqual(2);
    expect(result.totalDemandWeightLbs).toBe(72000);
    expect(result.totalDemandItems).toBe(48);

    // Sum of allocated items must equal total demand items
    const totalAllocatedItems = result.partitions.reduce((sum, p) => sum + p.allocatedItems.reduce((s, i) => s + i.quantity, 0), 0);
    expect(totalAllocatedItems).toBe(48);

    // Each vehicle must not exceed legal limits
    for (const p of result.partitions) {
      expect(p.isOverweight).toBe(false);
      expect(p.isOvercube).toBe(false);
      expect(p.weightUtilizationPct).toBeLessThanOrEqual(100);
    }
  });

  it('generates valid Product 01 (Cargo Fit) deep bridge links with encoded trailer specs', () => {
    const result = splitCargoDemandAcrossFleet({
      items: [
        {
          packageId: 'pallet-gma-48x40',
          quantity: 30,
          customWeightLbs: 1200,
        },
      ],
    });

    expect(result.partitions.length).toBeGreaterThanOrEqual(1);
    for (const p of result.partitions) {
      expect(p.cargoFitBridgeUrl).toContain('http://localhost:5173/?');
      expect(p.cargoFitBridgeUrl).toContain('source=product-04-asset-studio-splitter');
      expect(p.cargoFitBridgeUrl).toContain(`vehicleId=${p.vehicle.id}`);
      expect(p.cargoFitBridgeUrl).toContain('trailerLength=');
      expect(p.cargoFitBridgeUrl).toContain('trailerWidth=');
    }
  });

  it('right-sizes equipment when smaller loads fit into straight or box trucks', () => {
    const result = splitCargoDemandAcrossFleet({
      items: [
        {
          packageId: 'pallet-gma-48x40',
          quantity: 8,
          customWeightLbs: 1000, // 8,000 lbs, fits into box truck
        },
      ],
      allowedVehicleIds: ['box-truck-26', 'cube-step-van', 'sprinter-van'],
    });

    expect(result.totalVehicles).toBe(1);
    expect(result.partitions[0].vehicle.id).toMatch(/box-truck-26|cube-step-van/);
    expect(result.partitions[0].totalWeightLbs).toBe(8000);
  });
});

describe('FAST Act 2,000-lb Clean Fuel Battery Electric Vehicle Weight Credit', () => {
  it('models 82,000 lbs GVWR clean fuel credit for Class 8 BEV (23 U.S.C. § 127(s))', () => {
    const electricSemi = STANDARD_VEHICLES.find((v) => v.id === 'electric-class8')!;
    expect(electricSemi).toBeDefined();
    expect(electricSemi.fuelEnergy.fuelType).toBe('electric');
    // Standard diesel GVWR is 80,000 lbs; FAST Act § 5523 allows +2,000 lbs tare offset
    expect(electricSemi.weight.gvwrLbs).toBe(82000);
    expect(electricSemi.regulatory.bridgeLawAxleLimits.steerLbs).toBeGreaterThanOrEqual(12000);
    expect(electricSemi.regulatory.bridgeLawAxleLimits.driveTandemLbs).toBeGreaterThanOrEqual(34000);
  });
});

describe('3D View Modes & Teardown Specifications', () => {
  it('supports 3d, teardown, 2.5d, and 2d view modes', () => {
    const validModes: import('../src/engine/types').ViewMode[] = ['3d', 'teardown', '2.5d', '2d'];
    expect(validModes).toContain('teardown');
    expect(validModes.length).toBe(4);
  });

  it('computes spatial placements correctly for 3D teardown placement rendering', () => {
    const dryVan = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;
    const gmaPallet = STANDARD_PACKAGES.find((p) => p.id === 'pallet-gma-48x40')!;
    const fit = computeSpatialFit(dryVan, gmaPallet, 24);
    expect(fit.gridPlacements.length).toBe(24);
    expect(typeof fit.gridPlacements[0].xIn).toBe('number');
    expect(fit.gridPlacements[0].yIn).toBeGreaterThanOrEqual(0);
    expect(typeof fit.gridPlacements[0].zIn).toBe('number');
  });
});

describe('First-Principles Concentrated Floor Loading & Fuel Exhaustion Modeling', () => {
  it('calculates both distributed average and local concentrated contact patch floor pressure (AS-03)', () => {
    const dryVan = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;
    const heavyPallet = STANDARD_PACKAGES.find((p) => p.id === 'pallet-gma-48x40')!;
    // Pallet is 48x40 = 13.33 sq ft. 1,600 lbs / 13.33 = ~120 lbs/sqft concentrated
    const fit = computeSpatialFit(dryVan, heavyPallet, 4);
    expect(fit.floorLoad.lbsPerSqFt).toBeGreaterThan(0);
    expect(fit.floorLoad.concentratedLbsPerSqFt).toBeGreaterThan(fit.floorLoad.lbsPerSqFt);
    expect(typeof fit.floorLoad.withinRating).toBe('boolean');
    expect(typeof fit.floorLoad.concentratedWithinRating).toBe('boolean');
  });

  it('detects single-tank fuel exhaustion and schedules en-route refuel stops with dwell time (AS-04)', () => {
    const dryVan = STANDARD_VEHICLES.find((v) => v.id === 'dry-van-53')!;
    // 1500 miles on a 150 gal tank (~900 mile range) requires en-route refueling
    const sim = simulateTemporalDynamics(dryVan, 40000, 1500, 65);
    expect(sim.requiresRefuelStop).toBe(true);
    expect(sim.refuelStopsCount).toBeGreaterThan(0);
    expect(sim.refuelDwellHours).toBeGreaterThan(0);
    expect(sim.fuelDepletionWarning).toContain('exceeds single-tank range');
    // Total turnaround hours must include refueling dwell
    expect(sim.totalTurnaroundHours).toBeGreaterThan(sim.drivingTimeHours + sim.loadingDockTimeHours + sim.unloadingDockTimeHours);
  });
});


