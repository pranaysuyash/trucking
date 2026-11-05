import type {
  VehicleSpec,
  TemporalSimulation,
} from './types';

export function simulateTemporalDynamics(
  vehicle: VehicleSpec,
  payloadWeightLbs: number,
  distanceMiles: number,
  speedMph: number = 65,
  totalPackageUnits: number = 24,
  pkgCategory: string = 'pallet'
): TemporalSimulation {
  const safeDistance = Math.max(1, distanceMiles);
  const safeSpeed = Math.max(25, Math.min(85, speedMph));
  const drivingTimeHours = safeDistance / safeSpeed;

  // Weight ratio between 0 (empty) and 1 (fully loaded)
  const maxPayload = Math.max(1, vehicle.weight.maxPayloadLbs);
  const payloadRatio = Math.min(1.2, Math.max(0, payloadWeightLbs / maxPayload));

  // Fuel economy interpolation between empty and loaded MPG
  const emptyMpg = vehicle.fuelEnergy.emptyMpg;
  const loadedMpg = vehicle.fuelEnergy.loadedMpg;
  let baseMpg = emptyMpg - (emptyMpg - loadedMpg) * payloadRatio;

  // Aerodynamic speed penalty (over 60 mph, air resistance burns ~1.2% more fuel per mph)
  const speedPenalty = safeSpeed > 60 ? 1 + (safeSpeed - 60) * 0.012 : 1.0;
  const effectiveMpg = Math.max(0.5, baseMpg / speedPenalty);

  // Fuel burned
  const fuelBurned = safeDistance / effectiveMpg;
  const capacity = vehicle.fuelEnergy.capacity;
  const remainingFuel = Math.max(0, capacity - fuelBurned);
  const fuelPercent = capacity > 0 ? (remainingFuel / capacity) * 100 : 0;
  const estimatedRangeRemaining = remainingFuel * effectiveMpg;
  const singleTankRange = capacity * effectiveMpg;

  // Refueling stops calculation if trip exceeds usable fuel capacity (assuming 15% reserve buffer)
  const usableCapacity = capacity * 0.85;
  let refuelStopsCount = 0;
  let refuelDwellHours = 0;
  let fuelDepletionWarning: string | undefined = undefined;

  if (fuelBurned > usableCapacity && capacity > 0) {
    const fuelDeficit = fuelBurned - usableCapacity;
    refuelStopsCount = Math.ceil(fuelDeficit / (capacity * 0.75));
    refuelDwellHours = refuelStopsCount * 0.75; // 45 minutes per commercial truck stop
    fuelDepletionWarning = `Trip distance (${Math.round(safeDistance)} mi) exceeds single-tank range (~${Math.round(singleTankRange)} mi). Requires ${refuelStopsCount} en-route refueling stop(s) adding ${(refuelDwellHours * 60).toFixed(0)} min dwell.`;
  }
  const requiresRefuelStop = refuelStopsCount > 0 || fuelPercent < 15.0;

  // Reefer auxiliary fuel
  let reeferFuelBurnedGal = 0;
  if (vehicle.regulatory.tempControl) {
    reeferFuelBurnedGal = drivingTimeHours * vehicle.regulatory.tempControl.burnGalPerHour;
  }

  // Cost estimates based on fuel type
  let unitFuelCost = 3.85; // $3.85 / gal diesel default
  if (vehicle.fuelEnergy.fuelType === 'electric') {
    unitFuelCost = 0.16; // $0.16 / kWh commercial industrial rate
  } else if (vehicle.fuelEnergy.fuelType === 'hydrogen') {
    unitFuelCost = 14.50; // $14.50 / kg green hydrogen
  } else if (vehicle.fuelEnergy.fuelType === 'cng') {
    unitFuelCost = 2.45; // $2.45 / DGE
  }

  const totalFuelCostEst = fuelBurned * unitFuelCost + reeferFuelBurnedGal * 3.85;

  // CO2 Emitted in lbs
  const co2Grams = safeDistance * vehicle.fuelEnergy.co2GramsPerMile;
  const co2EmittedLbs = co2Grams / 453.592;

  // Operational Loading / Unloading Dock Time
  // Estimates minutes per unit based on standard material handling equipment
  let minutesPerUnit = 2.5; // standard forklift pallet
  if (pkgCategory === 'carton_box') {
    minutesPerUnit = 0.4; // conveyor / parcel hand-carry
  } else if (pkgCategory === 'drum_tote') {
    minutesPerUnit = 3.0; // drum clamp truck / hazardous check
  } else if (pkgCategory === 'intermodal_container') {
    minutesPerUnit = 15.0; // container crane / top-pick hoist
  } else if (pkgCategory === 'industrial_crate') {
    minutesPerUnit = 6.0; // rigging / crane straps
  }

  const loadingMinutes = Math.min(240, Math.max(15, totalPackageUnits * minutesPerUnit));
  const loadingDockTimeHours = loadingMinutes / 60;
  const unloadingDockTimeHours = loadingMinutes / 60;
  const totalTurnaroundHours = drivingTimeHours + loadingDockTimeHours + unloadingDockTimeHours + refuelDwellHours;

  return {
    distanceMiles: Math.round(safeDistance),
    speedMph: Math.round(safeSpeed),
    drivingTimeHours: Math.round(drivingTimeHours * 10) / 10,
    effectiveMpg: Math.round(effectiveMpg * 10) / 10,
    fuelBurned: Math.round(fuelBurned * 10) / 10,
    remainingFuel: Math.round(remainingFuel * 10) / 10,
    fuelPercent: Math.round(fuelPercent),
    estimatedRangeRemaining: Math.round(estimatedRangeRemaining),
    requiresRefuelStop,
    refuelStopsCount,
    refuelDwellHours: Math.round(refuelDwellHours * 10) / 10,
    fuelDepletionWarning,
    reeferFuelBurnedGal: Math.round(reeferFuelBurnedGal * 10) / 10,
    totalFuelCostEst: Math.round(totalFuelCostEst),
    co2EmittedLbs: Math.round(co2EmittedLbs),
    loadingDockTimeHours: Math.round(loadingDockTimeHours * 10) / 10,
    unloadingDockTimeHours: Math.round(unloadingDockTimeHours * 10) / 10,
    totalTurnaroundHours: Math.round(totalTurnaroundHours * 10) / 10,
  };
}
