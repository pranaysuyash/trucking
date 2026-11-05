import {
  computeFacilityMetrics,
  computeSpaceUtilization,
} from '../engine/facilityModel';
import { computeRentSummary } from '../engine/leaseEngine';
import { computeMaintenanceSummary } from '../engine/maintenanceEngine';
import { computeElectricityCharges } from '../engine/facilityModel';
import type { Facility, Lease, RentLedgerEntry, MaintenanceTask } from '../engine/types';
import type { MeterSubReading } from '../engine/storageClient';

// Re-export the engine's MeterSubReading under the name the UI uses.
export type MeterReading = MeterSubReading;

export const ELECTRICITY_CONFIG = {
  tariffPerKwh: 8,
  dgChargePerKwh: 12,
  useDG: false,
} as const;

export function selectMetrics(facility: Facility | null, leases: Lease[] = []) {
  return facility
    ? computeFacilityMetrics(facility, leases.map((l) => ({ spaceId: l.spaceId, status: l.status })))
    : null;
}

export function selectUtilization(facility: Facility | null) {
  return facility ? computeSpaceUtilization(facility) : null;
}

export function selectRentSummary(entries: RentLedgerEntry[]) {
  return computeRentSummary(entries);
}

export function selectMaintSummary(tasks: MaintenanceTask[]) {
  return computeMaintenanceSummary(tasks);
}

export function selectCharges(readings: { spaceId: string; kwh: number }[]) {
  return computeElectricityCharges({
    subReadings: readings,
    tariffPerKwh: ELECTRICITY_CONFIG.tariffPerKwh,
    dgChargePerKwh: ELECTRICITY_CONFIG.dgChargePerKwh,
    useDG: ELECTRICITY_CONFIG.useDG,
  });
}