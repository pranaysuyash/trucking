/**
 * Facility & Space Model for Storage & Leasing Core.
 * Indian-warehouse oriented: sq ft, rooms, chambers, meters, usable vs unusable.
 */

import { Facility, RentableSpace, SpaceStatus, Dimensions2D } from './types';

export function createFacility(input: {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  totalAreaSqFt: number;
  usableAreaSqFt: number;
  floors: number;
  hasElectricityMeter?: boolean;
  hasRefrigerationPlant?: boolean;
  refrigerationOperational?: boolean;
  ownershipType?: 'owned' | 'leased_in' | 'managed' | 'sub_leased' | 'government' | 'cooperative' | 'franchise';
  landlordName?: string;
  landlordContact?: string;
  gstin?: string;
}): Facility {
  if (input.usableAreaSqFt > input.totalAreaSqFt) {
    throw new Error('Usable area cannot exceed total area.');
  }
  if (input.floors < 1) {
    throw new Error('Facility must have at least one floor.');
  }
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    address: input.address,
    city: input.city,
    state: input.state,
    country: 'IN',
    totalAreaSqFt: input.totalAreaSqFt,
    usableAreaSqFt: input.usableAreaSqFt,
    floors: input.floors,
    hasElectricityMeter: input.hasElectricityMeter ?? true,
    hasRefrigerationPlant: input.hasRefrigerationPlant ?? false,
    refrigerationOperational: input.refrigerationOperational ?? false,
    ownershipType: input.ownershipType ?? 'owned',
    landlordName: input.landlordName,
    landlordContact: input.landlordContact,
    gstin: input.gstin || undefined,
    spaces: [],
    createdAt: new Date().toISOString(),
  };
}

function applySpaceStatus(space: RentableSpace, status: SpaceStatus, atIso = new Date().toISOString()): void {
  const prev = space.status;
  space.status = status;
  space.statusChangedAt = atIso;
  if (status === 'vacant') {
    if (prev !== 'vacant' || !space.vacantSince) space.vacantSince = atIso;
  } else {
    delete space.vacantSince;
  }
}

export function addSpace(facility: Facility, space: Omit<RentableSpace, 'facilityId' | 'areaSqFt'> & { areaSqFt?: number }): RentableSpace {
  const area = space.areaSqFt ?? computeAreaSqFt(space.dimensions);
  if (area <= 0) throw new Error('Space area must be positive.');
  if (facility.spaces.some(s => s.id === space.id)) throw new Error(`Space id ${space.id} already exists.`);
  if (facility.spaces.some(s => s.code === space.code)) throw new Error(`Space code ${space.code} already exists.`);

  const newSpace: RentableSpace = {
    ...space,
    facilityId: facility.id,
    areaSqFt: area,
    spacePurpose: space.spacePurpose ?? 'for_lease',
  };
  // Additive vacancy tracking (backward-compatible): initialize timestamps for current status.
  applySpaceStatus(newSpace, newSpace.status);
  facility.spaces.push(newSpace);
  return newSpace;
}

export function computeAreaSqFt(dims: Dimensions2D): number {
  return Math.round(dims.lengthFt * dims.widthFt);
}

export function findSpaceById(facility: Facility, spaceId: string): RentableSpace | undefined {
  return facility.spaces.find(s => s.id === spaceId);
}

export function findSpaceByCode(facility: Facility, code: string): RentableSpace | undefined {
  return facility.spaces.find(s => s.code === code);
}

export function setSpaceStatus(facility: Facility, spaceId: string, status: SpaceStatus): RentableSpace {
  const space = findSpaceById(facility, spaceId);
  if (!space) throw new Error(`Space ${spaceId} not found.`);
  applySpaceStatus(space, status);
  return space;
}

export function computeFacilityMetrics(
  facility: Facility,
  leases: { spaceId: string; status: string }[] = []
): {
  totalAreaSqFt: number;
  usableAreaSqFt: number;
  leasedAreaSqFt: number;
  vacantAreaSqFt: number;
  blockedAreaSqFt: number;
  underRepairAreaSqFt: number;
  occupancyPercent: number;
  modeledSpaceAreaSqFt: number;
  activeLeases: number;
  vacantSpaces: number;
} {
  const leasedSpaceIds = new Set(leases.filter(l => l.status === 'active').map(l => l.spaceId));
  let leasedArea = 0, vacantArea = 0, blockedArea = 0, repairArea = 0, modeledSpaceArea = 0;
  for (const space of facility.spaces) {
    modeledSpaceArea += space.areaSqFt;
    switch (space.status) {
      case 'leased':
        leasedArea += space.areaSqFt;
        break;
      case 'vacant':
        vacantArea += space.areaSqFt;
        break;
      case 'blocked':
      case 'temporarily_reserved':
        blockedArea += space.areaSqFt;
        break;
      case 'under_repair':
        repairArea += space.areaSqFt;
        break;
    }
  }
  // Occupancy uses facility-level usable capacity (property-level, manual) to preserve
  // existing semantics. UI surfaces modeledSpaceAreaSqFt and any delta for transparency.
  const occupancyPercent = facility.usableAreaSqFt > 0
    ? Math.round((leasedArea / facility.usableAreaSqFt) * 100)
    : 0;
  return {
    totalAreaSqFt: facility.totalAreaSqFt,
    usableAreaSqFt: facility.usableAreaSqFt,
    leasedAreaSqFt: leasedArea,
    vacantAreaSqFt: vacantArea,
    blockedAreaSqFt: blockedArea,
    underRepairAreaSqFt: repairArea,
    occupancyPercent,
    modeledSpaceAreaSqFt: modeledSpaceArea,
    activeLeases: leasedSpaceIds.size,
    vacantSpaces: facility.spaces.filter(s => s.status === 'vacant').length,
  };
}

export function createIndianWarehouseExample(): Facility {
  // Old cold storage converted to general warehouse: multiple chambers, loading area,
  // electricity meter, refrigeration plant no longer operational.
  const facility = createFacility({
    id: 'FAC-IN-001',
    code: 'WH-AHM-01',
    name: 'Ahmedabad Converted Cold Storage & General Warehouse',
    address: 'Plot 14, GIDC Estate, Naroda',
    city: 'Ahmedabad',
    state: 'Gujarat',
    totalAreaSqFt: 24000,
    usableAreaSqFt: 20000,
    floors: 1,
    hasElectricityMeter: true,
    hasRefrigerationPlant: true,
    refrigerationOperational: false,
  });

  // Chamber A (former cold room, now dry storage)
  addSpace(facility, {
    id: 'SP-A',
    code: 'CH-A',
    name: 'Chamber A (former cold room, now dry)',
    type: 'chamber',
    floor: 1,
    dimensions: { lengthFt: 60, widthFt: 40 },
    environmentalClass: 'ambient',
    status: 'vacant',
    notes: 'Refrigeration plant decommissioned 2024; now dry storage. Historical refrigeration assets retained.',
  });

  // Chamber B (still operational cold)
  addSpace(facility, {
    id: 'SP-B',
    code: 'CH-B',
    name: 'Chamber B (active cold storage 2-8C)',
    type: 'cold_chamber',
    floor: 1,
    dimensions: { lengthFt: 50, widthFt: 35 },
    environmentalClass: 'chilled',
    status: 'vacant',
    notes: 'Active refrigeration. Compressor #2 serviced 2026-09.',
  });

  // Loading area
  addSpace(facility, {
    id: 'SP-LOAD',
    code: 'LOAD-01',
    name: 'Loading / Unloading Bay',
    type: 'bay',
    floor: 1,
    dimensions: { lengthFt: 40, widthFt: 30 },
    environmentalClass: 'ambient',
    status: 'vacant',
  });

  // Open yard
  addSpace(facility, {
    id: 'SP-YARD',
    code: 'YARD-01',
    name: 'Open Storage Yard',
    type: 'open_yard',
    floor: 0,
    dimensions: { lengthFt: 80, widthFt: 50 },
    environmentalClass: 'ambient',
    status: 'vacant',
  });

  return facility;
}


export interface SpaceAllocation {
  spaceId: string;
  tenantId: string;
  leaseId: string;
  possessionDate: string;
  allocatedAt: string;
}

export function allocateSpace(facility: Facility, spaceId: string, tenantId: string, leaseId: string, possessionDate: string): SpaceAllocation {
  const space = findSpaceById(facility, spaceId);
  if (!space) throw new Error(`Space ${spaceId} not found.`);
  if (space.status !== 'vacant' && space.status !== 'temporarily_reserved') {
    throw new Error(`Space ${space.code} is not available for allocation (status: ${space.status}).`);
  }
  applySpaceStatus(space, 'leased');
  return { spaceId, tenantId, leaseId, possessionDate, allocatedAt: new Date().toISOString() };
}

export function releaseSpace(facility: Facility, spaceId: string): void {
  const space = findSpaceById(facility, spaceId);
  if (!space) throw new Error(`Space ${spaceId} not found.`);
  applySpaceStatus(space, 'vacant');
}

export function getSpacesByStatus(facility: Facility, status: import('./types').SpaceStatus): RentableSpace[] {
  return facility.spaces.filter(s => s.status === status);
}

export function recordMeterReading(reading: import('./types').MeterReading): import('./types').MeterReading {
  // Basic validation: reading must be non-negative
  if (reading.readingKwh < 0) throw new Error('Meter reading cannot be negative.');
  if (!reading.meterId.trim()) throw new Error('Meter ID is required.');
  return reading;
}

export function computeSpaceUtilization(facility: Facility): { total: number; leased: number; vacant: number; blocked: number; repair: number; percent: number } {
  const m = computeFacilityMetrics(facility, []);
  void facility;
  return {
    total: m.usableAreaSqFt,
    leased: m.leasedAreaSqFt,
    vacant: m.vacantAreaSqFt,
    blocked: m.blockedAreaSqFt,
    repair: m.underRepairAreaSqFt,
    percent: m.occupancyPercent,
  };
}

export interface AllocationResult {
  spaceId: string;
  tenantId: string;
  leaseId: string;
  possessionDate: string;
  allocatedAt: string;
}

export function allocateSpaceAndLease(
  facility: Facility,
  spaceId: string,
  tenantId: string,
  lease: import('./types').Lease,
  possessionDate: string
): AllocationResult {
  const space = findSpaceById(facility, spaceId);
  if (!space) throw new Error(`Space ${spaceId} not found.`);
  if (space.status !== 'vacant' && space.status !== 'temporarily_reserved') {
    throw new Error(`Space ${space.code} is not available (status: ${space.status}).`);
  }
  applySpaceStatus(space, 'leased');
  lease.status = 'active';
  lease.possessionDate = possessionDate;
  return { spaceId, tenantId, leaseId: lease.id, possessionDate, allocatedAt: new Date().toISOString() };
}

export function computeElectricityCharges(input: {
  subReadings: { spaceId: string; kwh: number }[];
  tariffPerKwh: number;
  dgChargePerKwh?: number;
  useDG?: boolean;
}): { spaceId: string; kwh: number; energyCharge: number; dgCharge: number; total: number }[] {
  const dgRate = input.useDG ? (input.dgChargePerKwh ?? 0) : 0;
  return input.subReadings.map(r => {
    const energyCharge = Math.round(r.kwh * input.tariffPerKwh * 100) / 100;
    const dgCharge = Math.round(r.kwh * dgRate * 100) / 100;
    return { spaceId: r.spaceId, kwh: r.kwh, energyCharge, dgCharge, total: Math.round((energyCharge + dgCharge) * 100) / 100 };
  });
}

export function allocateActualBill(input: {
  totalBill: number;
  subReadings: { spaceId: string; kwh: number }[];
  commonAreaKwh?: number;
  rounding?: 'floor' | 'round';
}): { spaceId: string; kwh: number; sharePct: number; allocated: number }[] {
  const totalSubKwh = input.subReadings.reduce((s, r) => s + r.kwh, 0);
  const common = input.commonAreaKwh ?? 0;
  const denominator = totalSubKwh + common;
  if (denominator <= 0) return input.subReadings.map(r => ({ spaceId: r.spaceId, kwh: r.kwh, sharePct: 0, allocated: 0 }));
  return input.subReadings.map(r => {
    const sharePct = Math.round((r.kwh / denominator) * 10000) / 100;
    const allocated = Math.round((input.totalBill * (r.kwh / denominator)) * 100) / 100;
    return { spaceId: r.spaceId, kwh: r.kwh, sharePct, allocated };
  });
}
