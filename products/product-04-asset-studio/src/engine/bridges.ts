import type {
  VehicleSpec,
  CargoPackageSpec,
  SpatialFitResult,
  TemporalSimulation,
} from './types';

export function getProductBaseUrl(port: number, cloudName: string): string {
  if (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev')) {
    return `https://${cloudName}.pages.dev`;
  }
  return `http://localhost:${port}`;
}

/**
 * 1-Click Bridge: Product 04 → Product 01 (Cargo Fit 3D Optimizer)
 * Launches Product 01 with the selected vehicle's interior dimensions and package rows.
 */
export function buildCargoFitBridgeUrl(
  vehicle: VehicleSpec,
  pkg: CargoPackageSpec,
  quantity: number,
  baseUrl?: string
): string {
  const target = baseUrl || getProductBaseUrl(5173, 'cargofit');

  // Convert vehicle interior dimensions to millimeters
  const eqLengthMm = Math.round(vehicle.interior.lengthFt * 304.8);
  const eqWidthMm = Math.round(vehicle.interior.widthFt * 304.8);
  const eqHeightMm = Math.round(vehicle.interior.heightFt * 304.8);
  const maxPayloadKg = Math.round(vehicle.weight.maxPayloadLbs * 0.453592);

  // Convert package dimensions to millimeters and kilograms
  const pkgLengthMm = Math.round(pkg.dims.lengthIn * 25.4);
  const pkgWidthMm = Math.round(pkg.dims.widthIn * 25.4);
  const pkgHeightMm = Math.round(pkg.dims.heightIn * 25.4);
  const pkgWeightKg = Math.round(pkg.weight.grossWeightLbs * 0.453592);

  const params = new URLSearchParams({
    source: 'asset_studio_p04',
    eqName: vehicle.name,
    eqCode: vehicle.code,
    eqL: String(eqLengthMm),
    eqW: String(eqWidthMm),
    eqH: String(eqHeightMm),
    eqPayloadKg: String(maxPayloadKg),
    pkgName: pkg.name,
    pkgQty: String(quantity),
    pkgL: String(pkgLengthMm),
    pkgW: String(pkgWidthMm),
    pkgH: String(pkgHeightMm),
    pkgKg: String(pkgWeightKg),
    pkgCategory: pkg.category,
    hazmat: pkg.hazmatClass ? '1' : '0',
    reefer: vehicle.regulatory.tempControl ? '1' : '0',
  });

  return `${target}/?${params.toString()}`;
}

/**
 * 1-Click Bridge: Product 04 → Product 02 (Freight Pricing & Dispatch HUD)
 * Feeds equipment category, loaded weight, deadhead/loaded distance, and diesel specs.
 */
export function buildFreightPricingBridgeUrl(
  vehicle: VehicleSpec,
  payloadWeightLbs: number,
  distanceMiles: number,
  isHazmat: boolean,
  baseUrl?: string
): string {
  const target = baseUrl || getProductBaseUrl(5174, 'freightpricing');

  let equipmentCategory = 'dry_van';
  const sub = vehicle.subtype;
  if (sub.includes('reefer')) {
    equipmentCategory = 'reefer';
  } else if (sub.includes('flatbed')) {
    equipmentCategory = 'flatbed';
  } else if (sub.includes('step_deck') || sub.includes('lowboy')) {
    equipmentCategory = 'step_deck';
  }

  const deadheadMiles = Math.round(distanceMiles * 0.12); // standard 12% empty repositioning
  const loadedKg = Math.round(payloadWeightLbs * 0.453592);

  const params = new URLSearchParams({
    source: 'cargofit', // Compatible with Product 02's existing intake handler
    scenario: `${vehicle.name} Spec Dispatch`,
    equipment: equipmentCategory,
    loadedKg: String(loadedKg),
    loadedLbs: String(Math.round(payloadWeightLbs)),
    placedUnits: '24',
    extraStops: '0',
    hazmat: isHazmat ? '1' : '0',
    reefer: vehicle.regulatory.tempControl ? '1' : '0',
    loadedMiles: String(Math.round(distanceMiles)),
    deadheadMiles: String(deadheadMiles),
    mpg: String(vehicle.fuelEnergy.loadedMpg),
  });

  return `${target}/?${params.toString()}`;
}

/**
 * 1-Click Bridge: Product 04 → Product 03 (HOS Corridor Planner)
 * Feeds corridor miles, vehicle driving speed profile, and range stop intervals.
 */
export function buildHosPlannerBridgeUrl(
  vehicle: VehicleSpec,
  distanceMiles: number,
  speedMph: number,
  baseUrl?: string
): string {
  const target = baseUrl || getProductBaseUrl(5175, 'hosdispatch');

  const params = new URLSearchParams({
    source: 'asset_studio_p04',
    vehicleName: vehicle.name,
    miles: String(Math.round(distanceMiles)),
    speed: String(Math.round(speedMph)),
    fuelType: vehicle.fuelEnergy.fuelType,
    rangeMiles: String(vehicle.fuelEnergy.loadedRangeMiles),
  });

  return `${target}/?${params.toString()}`;
}

/**
 * Open Logistics Asset Schema v1.0 standard JSON export.
 */
export function exportOpenLogisticsAssetJson(
  vehicle: VehicleSpec,
  pkg: CargoPackageSpec,
  fit: SpatialFitResult,
  sim: TemporalSimulation
): string {
  const schema = {
    $schema: 'https://trucking.platform.io/schemas/asset-v1.json',
    generator: 'Product-04: Fleet & Cargo Asset Studio',
    exportedAt: new Date().toISOString(),
    vehicle: {
      id: vehicle.id,
      name: vehicle.name,
      code: vehicle.code,
      category: vehicle.category,
      subtype: vehicle.subtype,
      exteriorDimensionsFt: vehicle.exterior,
      interiorCavityFt: vehicle.interior,
      weightRatingsLbs: vehicle.weight,
      volumetricCapacities: vehicle.volumetric,
      powertrain: vehicle.powertrain,
      fuelAndEnergy: vehicle.fuelEnergy,
      regulatoryAndSafety: vehicle.regulatory,
    },
    cargoPackage: {
      id: pkg.id,
      name: pkg.name,
      category: pkg.category,
      shape: pkg.shape,
      dimensionsIn: pkg.dims,
      weightLbs: pkg.weight,
      volumetricCuFt: pkg.volumetricCuFt,
      maxStackTiers: pkg.maxStackTiers,
      hazmatClass: pkg.hazmatClass,
      tempRequirement: pkg.tempRequirement,
    },
    spatialAnalysis: {
      placedUnits: fit.placedUnits,
      maxFloorUnits: fit.maxFloorUnits,
      maxStackedUnits: fit.maxStackedUnits,
      limitingFactor: fit.limitingFactor,
      volumeUtilizationPct: fit.volumeUtilizationPct,
      weightUtilizationPct: fit.weightUtilizationPct,
      doorClearance: fit.doorClearance,
      floorLoadRatingCheck: fit.floorLoad,
    },
    temporalSimulation: {
      distanceMiles: sim.distanceMiles,
      speedMph: sim.speedMph,
      transitDrivingHours: sim.drivingTimeHours,
      effectiveMpg: sim.effectiveMpg,
      fuelBurnedUnits: sim.fuelBurned,
      remainingRangeMiles: sim.estimatedRangeRemaining,
      requiresRefuelStop: sim.requiresRefuelStop,
      loadingDockTimeHours: sim.loadingDockTimeHours,
      unloadingDockTimeHours: sim.unloadingDockTimeHours,
      totalTurnaroundHours: sim.totalTurnaroundHours,
      co2EmittedLbs: sim.co2EmittedLbs,
    },
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * Clean tabular CSV export of vehicle specifications.
 */
export function exportSpecCsv(vehicle: VehicleSpec): string {
  const rows = [
    ['Specification Field', 'Value', 'Unit / Metric'],
    ['Vehicle Name', vehicle.name, ''],
    ['Model Code', vehicle.code, ''],
    ['Vehicle Category', vehicle.category, ''],
    ['Vehicle Subtype', vehicle.subtype, ''],
    ['Overall Length', vehicle.exterior.lengthFt.toString(), 'feet'],
    ['Overall Width', vehicle.exterior.widthFt.toString(), 'feet'],
    ['Overall Height', vehicle.exterior.heightFt.toString(), 'feet'],
    ['Wheelbase', vehicle.exterior.wheelbaseIn.toString(), 'inches'],
    ['Interior Length', vehicle.interior.lengthFt.toString(), 'feet'],
    ['Interior Width', vehicle.interior.widthFt.toString(), 'feet'],
    ['Interior Height', vehicle.interior.heightFt.toString(), 'feet'],
    ['Door Aperture Width', vehicle.interior.doorWidthFt.toString(), 'feet'],
    ['Door Aperture Height', vehicle.interior.doorHeightFt.toString(), 'feet'],
    ['Curb Weight', vehicle.weight.curbWeightLbs.toString(), 'lbs'],
    ['Gross Vehicle Weight (GVWR)', vehicle.weight.gvwrLbs.toString(), 'lbs'],
    ['Max Payload Capacity', vehicle.weight.maxPayloadLbs.toString(), 'lbs'],
    ['Interior Cargo Volume', vehicle.volumetric.cubicFt.toString(), 'cubic feet'],
    ['GMA Pallet Floor Capacity', vehicle.volumetric.standardGmaPalletFloorCap.toString(), 'pallets single-tier'],
    ['Double-Stack Pallet Capacity', vehicle.volumetric.doubleStackPalletCap.toString(), 'pallets double-tier'],
    ['Engine / Powertrain', vehicle.powertrain.engineType, ''],
    ['Horsepower', vehicle.powertrain.horsepower.toString(), 'HP'],
    ['Torque', vehicle.powertrain.torqueLbFt.toString(), 'lb-ft'],
    ['Axle Configuration', vehicle.powertrain.axles, ''],
    ['Fuel / Energy Type', vehicle.fuelEnergy.fuelType, ''],
    ['Tank / Battery Capacity', `${vehicle.fuelEnergy.capacity} ${vehicle.fuelEnergy.capacityUnit}`, ''],
    ['Loaded Fuel Economy', vehicle.fuelEnergy.loadedMpg.toString(), 'MPG or mi/unit'],
    ['Empty Fuel Economy', vehicle.fuelEnergy.emptyMpg.toString(), 'MPG or mi/unit'],
    ['Loaded Driving Range', vehicle.fuelEnergy.loadedRangeMiles.toString(), 'miles'],
    ['Steer Axle Limit', vehicle.regulatory.bridgeLawAxleLimits.steerLbs.toString(), 'lbs'],
    ['Drive Tandem Limit', vehicle.regulatory.bridgeLawAxleLimits.driveTandemLbs.toString(), 'lbs'],
    ['Trailer Tandem Limit', vehicle.regulatory.bridgeLawAxleLimits.trailerTandemLbs.toString(), 'lbs'],
    ['Floor Load Rating', vehicle.regulatory.floorRatingLbsPerSqFt.toString(), 'lbs/sq ft'],
  ];

  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}
