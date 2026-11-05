import type { VehicleSpec } from './types';

export interface StopCargoGroup {
  stopNumber: number;
  stopName: string;
  itemCount: number;
  totalWeightLbs: number;
  zCenterInches: number; // distance from front trailer bulkhead (0 = nose, 630 = rear of 53ft trailer)
}

export interface AxleWeightDistribution {
  steerLbs: number;
  driveTandemLbs: number;
  trailerTandemLbs: number;
  totalGrossLbs: number;
  cgInchesFromNose: number;
  cgPercentFromNose: number;
  isLegal: boolean;
  violations: string[];
}

export interface MultiStopSimulationStage {
  stageIndex: number;
  stageName: string;
  activeStopsRemaining: number[];
  unloadedStopNumbers: number[];
  activePayloadLbs: number;
  distribution: AxleWeightDistribution;
  hazardDetected: boolean;
  hazardDescription: string | null;
}

/**
 * Calculates axle weight distribution using static moments for Class 8 tractor-trailers.
 * Based on 49 CFR § 393 and standard 53ft dry van geometry with sliding tandem at 41ft.
 */
export function calculateAxleDistribution(
  vehicle: VehicleSpec,
  activeGroups: StopCargoGroup[]
): AxleWeightDistribution {
  // Empty tare weights
  const curbTotal = vehicle.weight.curbWeightLbs;
  // Baseline tare distribution for conventional tractor + 53' van:
  // Steer: ~10,200 lbs, Drive tandem: ~13,800 lbs, Trailer tandem: ~9,500 lbs
  const baseSteer = Math.round(curbTotal * 0.31);
  const baseDrive = Math.round(curbTotal * 0.41);
  const baseTrailer = Math.round(curbTotal * 0.28);

  const trailerLengthIn = (vehicle.interior.lengthFt || 53) * 12; // e.g. 630 in
  const kingpinFromNoseIn = 36; // 36" standard kingpin set-back
  const bogieCenterFromKingpinIn = Math.max(120, trailerLengthIn - kingpinFromNoseIn - 100); // ~494 in to tandem center

  let totalCargoWeight = 0;
  let totalMomentFromKingpin = 0;

  for (const g of activeGroups) {
    totalCargoWeight += g.totalWeightLbs;
    const distFromKingpin = Math.max(0, g.zCenterInches - kingpinFromNoseIn);
    totalMomentFromKingpin += g.totalWeightLbs * distFromKingpin;
  }

  if (totalCargoWeight === 0) {
    return {
      steerLbs: baseSteer,
      driveTandemLbs: baseDrive,
      trailerTandemLbs: baseTrailer,
      totalGrossLbs: curbTotal,
      cgInchesFromNose: trailerLengthIn / 2,
      cgPercentFromNose: 50,
      isLegal: true,
      violations: [],
    };
  }

  // Cargo Center of Gravity from kingpin
  const cgFromKingpin = totalMomentFromKingpin / totalCargoWeight;
  const cgInchesFromNose = cgFromKingpin + kingpinFromNoseIn;
  const cgPercentFromNose = Math.round((cgInchesFromNose / trailerLengthIn) * 100);

  // Weight transferred to trailer tandem bogie
  const cargoOnTrailerTandem = totalCargoWeight * (cgFromKingpin / bogieCenterFromKingpinIn);
  // Weight transferred to kingpin (5th wheel plate)
  const cargoOnKingpin = totalCargoWeight - cargoOnTrailerTandem;

  // 5th wheel transfers ~95% of kingpin payload to tractor drive tandem and ~5% to steer
  const steerLbs = Math.round(baseSteer + (cargoOnKingpin * 0.05));
  const trailerTandemLbs = Math.round(baseTrailer + cargoOnTrailerTandem);
  const totalGrossLbs = Math.round(curbTotal + totalCargoWeight);
  const driveTandemLbs = totalGrossLbs - steerLbs - trailerTandemLbs;

  const limits = vehicle.regulatory.bridgeLawAxleLimits;
  const violations: string[] = [];

  if (steerLbs > limits.steerLbs) {
    violations.push(`Steer Axle (${steerLbs.toLocaleString()} lbs) exceeds ${limits.steerLbs.toLocaleString()} lbs legal limit`);
  }
  if (driveTandemLbs > limits.driveTandemLbs) {
    violations.push(`Tractor Drive Tandem (${driveTandemLbs.toLocaleString()} lbs) exceeds ${limits.driveTandemLbs.toLocaleString()} lbs legal limit`);
  }
  if (trailerTandemLbs > limits.trailerTandemLbs) {
    violations.push(`Trailer Tandem (${trailerTandemLbs.toLocaleString()} lbs) exceeds ${limits.trailerTandemLbs.toLocaleString()} lbs legal limit`);
  }
  if (totalGrossLbs > vehicle.weight.gvwrLbs) {
    violations.push(`Gross Vehicle Weight (${totalGrossLbs.toLocaleString()} lbs) exceeds GVWR (${vehicle.weight.gvwrLbs.toLocaleString()} lbs)`);
  }

  return {
    steerLbs,
    driveTandemLbs,
    trailerTandemLbs,
    totalGrossLbs,
    cgInchesFromNose: Math.round(cgInchesFromNose),
    cgPercentFromNose,
    isLegal: violations.length === 0,
    violations,
  };
}

/**
 * Simulates progressive sequential unloading across multi-stop drops.
 * Evaluates the dynamic CG shift and checks whether partially unloaded
 * states cause forward drive-tandem axle overload.
 */
export function simulateMultiStopUnload(
  vehicle: VehicleSpec,
  allGroups: StopCargoGroup[]
): MultiStopSimulationStage[] {
  const sortedStops = [...new Set(allGroups.map((g) => g.stopNumber))].sort((a, b) => a - b);
  const stages: MultiStopSimulationStage[] = [];

  // Stage 0: All stops loaded
  const initialDist = calculateAxleDistribution(vehicle, allGroups);
  stages.push({
    stageIndex: 0,
    stageName: 'Initial Loadout (Departing Terminal — All Stops)',
    activeStopsRemaining: sortedStops,
    unloadedStopNumbers: [],
    activePayloadLbs: allGroups.reduce((acc, g) => acc + g.totalWeightLbs, 0),
    distribution: initialDist,
    hazardDetected: !initialDist.isLegal,
    hazardDescription: initialDist.violations.length ? initialDist.violations.join('; ') : null,
  });

  // Intermediate Stages: Unloading Stop 1, Stop 2, etc.
  const unloadedStops: number[] = [];
  for (let i = 0; i < sortedStops.length; i++) {
    const currentUnloadStop = sortedStops[i];
    unloadedStops.push(currentUnloadStop);

    const remainingStops = sortedStops.filter((s) => !unloadedStops.includes(s));
    const remainingGroups = allGroups.filter((g) => remainingStops.includes(g.stopNumber));

    const stageDist = calculateAxleDistribution(vehicle, remainingGroups);
    const hasViolation = !stageDist.isLegal;

    let hazardNote: string | null = null;
    if (hasViolation) {
      hazardNote = `CRITICAL AXLE OVERLOAD at Stop ${currentUnloadStop} Post-Drop: ${stageDist.violations.join('; ')}`;
    } else if (stageDist.driveTandemLbs > vehicle.regulatory.bridgeLawAxleLimits.driveTandemLbs * 0.95) {
      hazardNote = `WARNING: Drive tandem near 95% legal limit (${stageDist.driveTandemLbs.toLocaleString()} lbs) due to nose-heavy CG shift.`;
    }

    stages.push({
      stageIndex: i + 1,
      stageName: remainingStops.length
        ? `Post-Delivery Stop ${currentUnloadStop} (En Route to Stop ${remainingStops[0]})`
        : `Final Consignee Stop ${currentUnloadStop} (Empty Return / Deadhead)`,
      activeStopsRemaining: remainingStops,
      unloadedStopNumbers: [...unloadedStops],
      activePayloadLbs: remainingGroups.reduce((acc, g) => acc + g.totalWeightLbs, 0),
      distribution: stageDist,
      hazardDetected: hasViolation,
      hazardDescription: hazardNote,
    });
  }

  return stages;
}
