/**
 * Multi-Vehicle Fleet Splitter & Demand Partitioning Heuristic.
 * Decomposes oversized commercial freight manifests exceeding single-vehicle
 * legal payload (45,000 lbs) or volume (26 GMA pallets) into optimal
 * equipment combinations from the 20-vehicle Asset Studio catalog.
 */

import { STANDARD_VEHICLES, STANDARD_PACKAGES } from './catalog';
import type { VehicleSpec, CargoPackageSpec } from './types';
import { computeSpatialFit } from './spatial';

export interface CargoDemandItem {
  packageId: string;
  quantity: number;
  customWeightLbs?: number;
}

export interface SplitterInput {
  items: CargoDemandItem[];
  allowedVehicleIds?: string[];
  preferFewerVehicles?: boolean;
}

export interface AssignedVehiclePartition {
  vehicle: VehicleSpec;
  allocatedItems: {
    packageId: string;
    packageName: string;
    quantity: number;
    weightLbs: number;
    volumeCuFt: number;
  }[];
  totalWeightLbs: number;
  totalVolumeCuFt: number;
  totalPalletEquivalent: number;
  weightUtilizationPct: number;
  volumeUtilizationPct: number;
  palletUtilizationPct: number;
  isOverweight: boolean;
  isOvercube: boolean;
  cargoFitBridgeUrl: string;
}

export interface FleetSplitResult {
  totalDemandWeightLbs: number;
  totalDemandVolumeCuFt: number;
  totalDemandItems: number;
  partitions: AssignedVehiclePartition[];
  unassignedItems: {
    packageId: string;
    quantity: number;
    reason: string;
  }[];
  totalVehicles: number;
  summary: string;
}

/**
 * Standard candidate vehicle pool for general freight splitting.
 */
export const DEFAULT_SPLITTER_VEHICLE_IDS = [
  'dry-van-53',
  'flatbed-48',
  'box-truck-26',
  'cube-step-van',
  'sprinter-van',
];

/**
 * Partitions an oversized manifest into an optimal combination of commercial vehicles.
 */
export function splitCargoDemandAcrossFleet(input: SplitterInput): FleetSplitResult {
  const allowedIds = input.allowedVehicleIds && input.allowedVehicleIds.length > 0
    ? input.allowedVehicleIds
    : DEFAULT_SPLITTER_VEHICLE_IDS;

  const candidateVehicles = STANDARD_VEHICLES
    .filter((v) => allowedIds.includes(v.id))
    .sort((a, b) => b.weight.maxPayloadLbs - a.weight.maxPayloadLbs); // Largest payload first

  if (candidateVehicles.length === 0) {
    throw new Error('No valid candidate vehicles available for fleet splitting.');
  }

  // Flatten items into unit blocks for bin packing
  interface CargoUnit {
    packageId: string;
    spec: CargoPackageSpec;
    weightLbs: number;
    volumeCuFt: number;
    isPallet: boolean;
  }

  const cargoUnits: CargoUnit[] = [];
  let totalDemandWeightLbs = 0;
  let totalDemandVolumeCuFt = 0;
  let totalDemandItems = 0;

  for (const item of input.items) {
    const pkg = STANDARD_PACKAGES.find((p) => p.id === item.packageId);
    if (!pkg) continue;

    const unitWeight = item.customWeightLbs ?? pkg.weight.grossWeightLbs;
    const unitVol = pkg.volumetricCuFt > 0
      ? pkg.volumetricCuFt
      : (pkg.dims.lengthIn * pkg.dims.widthIn * pkg.dims.heightIn) / 1728;
    const isPallet = pkg.id.includes('pallet') || pkg.id.includes('gma') || pkg.category === 'pallet';

    for (let i = 0; i < item.quantity; i++) {
      cargoUnits.push({
        packageId: pkg.id,
        spec: pkg,
        weightLbs: unitWeight,
        volumeCuFt: unitVol,
        isPallet,
      });
      totalDemandWeightLbs += unitWeight;
      totalDemandVolumeCuFt += unitVol;
      totalDemandItems += 1;
    }
  }

  // Sort cargo units descending by weight (First-Fit Decreasing)
  cargoUnits.sort((a, b) => b.weightLbs - a.weightLbs);

  interface ActiveBin {
    vehicle: VehicleSpec;
    units: CargoUnit[];
    currentWeightLbs: number;
    currentVolumeCuFt: number;
    palletCount: number;
    maxPayloadLbs: number;
    maxVolumeCuFt: number;
    maxPallets: number;
  }

  const bins: ActiveBin[] = [];

  function createBin(vehicle: VehicleSpec): ActiveBin {
    const gmaSpec = STANDARD_PACKAGES.find((p) => p.id === 'pallet-gma-48x40')!;
    const fit = computeSpatialFit(vehicle, gmaSpec);
    return {
      vehicle,
      units: [],
      currentWeightLbs: 0,
      currentVolumeCuFt: 0,
      palletCount: 0,
      maxPayloadLbs: vehicle.weight.maxPayloadLbs,
      maxVolumeCuFt: vehicle.volumetric.cubicFt,
      maxPallets: fit.maxFloorUnits,
    };
  }

  function canFit(bin: ActiveBin, unit: CargoUnit): boolean {
    const nextWeight = bin.currentWeightLbs + unit.weightLbs;
    // 98% threshold for safety margin
    if (nextWeight > bin.maxPayloadLbs * 0.98) return false;

    // Volumetric clearance factor (85% packing efficiency)
    const nextVolume = bin.currentVolumeCuFt + unit.volumeCuFt;
    if (nextVolume > bin.maxVolumeCuFt * 0.85) return false;

    if (unit.isPallet && bin.palletCount + 1 > Math.max(1, bin.maxPallets * 2)) {
      // Exceeds double-stack floor capacity
      return false;
    }

    return true;
  }

  const unassignedUnits: CargoUnit[] = [];

  for (let unitIdx = 0; unitIdx < cargoUnits.length; unitIdx++) {
    const unit = cargoUnits[unitIdx];
    let placed = false;
    for (const bin of bins) {
      if (canFit(bin, unit)) {
        bin.units.push(unit);
        bin.currentWeightLbs += unit.weightLbs;
        bin.currentVolumeCuFt += unit.volumeCuFt;
        if (unit.isPallet) bin.palletCount += 1;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Calculate remaining demand of unplaced units
      const remainingUnits = cargoUnits.slice(unitIdx);
      const remainingWeight = remainingUnits.reduce((s, u) => s + u.weightLbs, 0);
      const remainingPallets = remainingUnits.filter((u) => u.isPallet).length;

      // Find the smallest vehicle that can accommodate the entire remaining demand
      const singleFitVehicle = candidateVehicles
        .slice()
        .reverse() // smallest to largest
        .find((v) => {
          const testBin = createBin(v);
          return v.weight.maxPayloadLbs * 0.98 >= remainingWeight &&
            (remainingPallets === 0 || testBin.maxPallets * 2 >= remainingPallets);
        });

      // If a single vehicle fits all remaining cargo, right-size to it; otherwise take largest
      const chosenVehicle = singleFitVehicle || candidateVehicles[0];

      const newBin = createBin(chosenVehicle);
      if (canFit(newBin, unit)) {
        newBin.units.push(unit);
        newBin.currentWeightLbs += unit.weightLbs;
        newBin.currentVolumeCuFt += unit.volumeCuFt;
        if (unit.isPallet) newBin.palletCount += 1;
        bins.push(newBin);
      } else {
        unassignedUnits.push(unit);
      }
    }
  }

  // Convert active bins to result partitions
  const partitions: AssignedVehiclePartition[] = bins.map((bin) => {
    // Group units by packageId
    const itemMap = new Map<string, { quantity: number; weightLbs: number; volumeCuFt: number; name: string }>();
    for (const u of bin.units) {
      const cur = itemMap.get(u.packageId) || { quantity: 0, weightLbs: 0, volumeCuFt: 0, name: u.spec.name };
      cur.quantity += 1;
      cur.weightLbs += u.weightLbs;
      cur.volumeCuFt += u.volumeCuFt;
      itemMap.set(u.packageId, cur);
    }

    const allocatedItems = Array.from(itemMap.entries()).map(([packageId, data]) => ({
      packageId,
      packageName: data.name,
      quantity: data.quantity,
      weightLbs: Math.round(data.weightLbs),
      volumeCuFt: Math.round(data.volumeCuFt * 10) / 10,
    }));

    const weightUtilizationPct = Math.round((bin.currentWeightLbs / bin.maxPayloadLbs) * 100);
    const volumeUtilizationPct = Math.round((bin.currentVolumeCuFt / bin.maxVolumeCuFt) * 100);
    const palletUtilizationPct = bin.maxPallets > 0 ? Math.round((bin.palletCount / bin.maxPallets) * 100) : 0;

    // Build Product 01 Cargo Fit bridge URL
    const bridgeParams = new URLSearchParams({
      source: 'product-04-asset-studio-splitter',
      vehicleId: bin.vehicle.id,
      vehicleName: bin.vehicle.name,
      trailerLength: String(bin.vehicle.interior.lengthFt),
      trailerWidth: String(bin.vehicle.interior.widthFt * 12),
      trailerHeight: String(bin.vehicle.interior.heightFt * 12),
      maxWeightLbs: String(bin.vehicle.weight.maxPayloadLbs),
      itemCount: String(bin.units.length),
    });
    const cargoFitBridgeUrl = `http://localhost:5173/?${bridgeParams.toString()}`;

    return {
      vehicle: bin.vehicle,
      allocatedItems,
      totalWeightLbs: Math.round(bin.currentWeightLbs),
      totalVolumeCuFt: Math.round(bin.currentVolumeCuFt * 10) / 10,
      totalPalletEquivalent: bin.palletCount,
      weightUtilizationPct,
      volumeUtilizationPct,
      palletUtilizationPct,
      isOverweight: bin.currentWeightLbs > bin.maxPayloadLbs,
      isOvercube: bin.currentVolumeCuFt > bin.maxVolumeCuFt,
      cargoFitBridgeUrl,
    };
  });

  // Group unassigned items
  const unassignedMap = new Map<string, number>();
  for (const u of unassignedUnits) {
    unassignedMap.set(u.packageId, (unassignedMap.get(u.packageId) || 0) + 1);
  }
  const unassignedItems = Array.from(unassignedMap.entries()).map(([packageId, quantity]) => ({
    packageId,
    quantity,
    reason: 'Exceeds single vehicle maximum dimensional or payload envelope',
  }));

  const partitionSummary = partitions.map((p) => `1× ${p.vehicle.name} (${p.totalWeightLbs.toLocaleString()} lbs, ${p.totalPalletEquivalent} pallets)`).join(' + ');

  return {
    totalDemandWeightLbs: Math.round(totalDemandWeightLbs),
    totalDemandVolumeCuFt: Math.round(totalDemandVolumeCuFt * 10) / 10,
    totalDemandItems,
    partitions,
    unassignedItems,
    totalVehicles: partitions.length,
    summary: `Partitioned ${totalDemandItems} items (${Math.round(totalDemandWeightLbs).toLocaleString()} lbs) across ${partitions.length} vehicle(s): ${partitionSummary}`,
  };
}
