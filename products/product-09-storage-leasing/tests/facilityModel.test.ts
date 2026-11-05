import { describe, it, expect } from 'vitest';
import { allocateActualBill } from '../src/engine/facilityModel';
import {
  createFacility,
  addSpace,
  computeAreaSqFt,
  findSpaceById,
  findSpaceByCode,
  setSpaceStatus,
  computeFacilityMetrics,
  createIndianWarehouseExample,
} from '../src/engine/facilityModel';

describe('P09 Facility & Space Model', () => {
  it('creates a facility with valid dimensions', () => {
    const f = createFacility({
      id: 'F1', code: 'WH1', name: 'Test Warehouse', address: 'Addr', city: 'Mumbai', state: 'Maharashtra',
      totalAreaSqFt: 10000, usableAreaSqFt: 8000, floors: 2,
    });
    expect(f.id).toBe('F1');
    expect(f.country).toBe('IN');
    expect(f.spaces.length).toBe(0);
  });

  it('rejects usable area exceeding total area', () => {
    expect(() => createFacility({
      id: 'F2', code: 'WH2', name: 'Bad', address: 'A', city: 'C', state: 'S',
      totalAreaSqFt: 5000, usableAreaSqFt: 6000, floors: 1,
    })).toThrow();
  });

  it('rejects zero floors', () => {
    expect(() => createFacility({
      id: 'F3', code: 'WH3', name: 'Bad', address: 'A', city: 'C', state: 'S',
      totalAreaSqFt: 5000, usableAreaSqFt: 4000, floors: 0,
    })).toThrow();
  });

  it('computes area from dimensions', () => {
    expect(computeAreaSqFt({ lengthFt: 60, widthFt: 40 })).toBe(2400);
  });

  it('adds a space and prevents duplicate ids/codes', () => {
    const f = createFacility({ id: 'F4', code: 'WH4', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 10000, usableAreaSqFt: 9000, floors: 1 });
    const s = addSpace(f, { id: 'S1', code: 'R1', name: 'Room 1', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    expect(s.areaSqFt).toBe(600);
    expect(f.spaces.length).toBe(1);
    expect(() => addSpace(f, { id: 'S1', code: 'R2', name: 'Dup', type: 'room', floor: 1, dimensions: { lengthFt: 10, widthFt: 10 }, environmentalClass: 'ambient', status: 'vacant' })).toThrow();
    expect(() => addSpace(f, { id: 'S2', code: 'R1', name: 'DupCode', type: 'room', floor: 1, dimensions: { lengthFt: 10, widthFt: 10 }, environmentalClass: 'ambient', status: 'vacant' })).toThrow();
  });

  it('rejects zero/negative area spaces', () => {
    const f = createFacility({ id: 'F5', code: 'WH5', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 10000, usableAreaSqFt: 9000, floors: 1 });
    expect(() => addSpace(f, { id: 'S1', code: 'R1', name: 'Zero', type: 'room', floor: 1, dimensions: { lengthFt: 0, widthFt: 10 }, environmentalClass: 'ambient', status: 'vacant' })).toThrow();
  });

  it('finds space by id and code', () => {
    const f = createFacility({ id: 'F6', code: 'WH6', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 10000, usableAreaSqFt: 9000, floors: 1 });
    addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    expect(findSpaceById(f, 'S1')?.code).toBe('R1');
    expect(findSpaceByCode(f, 'R1')?.id).toBe('S1');
    expect(findSpaceById(f, 'NOPE')).toBeUndefined();
  });

  it('sets space status', () => {
    const f = createFacility({ id: 'F7', code: 'WH7', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 10000, usableAreaSqFt: 9000, floors: 1 });
    addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    const s = setSpaceStatus(f, 'S1', 'under_repair');
    expect(s.status).toBe('under_repair');
    expect(() => setSpaceStatus(f, 'NOPE', 'vacant')).toThrow();
  });

  it('stores optional GSTIN on facility', () => {
    const f = createFacility({
      id: 'FG', code: 'WHG', name: 'GST Warehouse', address: 'Addr', city: 'Bengaluru', state: 'Karnataka',
      totalAreaSqFt: 10000, usableAreaSqFt: 8000, floors: 1, gstin: '29ABCDE1234F1Z5',
    });
    expect(f.gstin).toBe('29ABCDE1234F1Z5');
  });

  it('computes facility metrics correctly and preserves occupancy/modeled-area semantics', () => {
    const f = createFacility({ id: 'F8', code: 'WH8', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 10000, usableAreaSqFt: 9000, floors: 1 });
    addSpace(f, { id: 'S1', code: 'R1', name: 'Room1', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient', status: 'leased' }); // 600
    addSpace(f, { id: 'S2', code: 'R2', name: 'Room2', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' }); // 600
    addSpace(f, { id: 'S3', code: 'R3', name: 'Room3', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'under_repair' }); // 400
    const m = computeFacilityMetrics(f, [{ spaceId: 'S1', status: 'active' }]);
    expect(m.leasedAreaSqFt).toBe(600);
    expect(m.vacantAreaSqFt).toBe(600);
    expect(m.underRepairAreaSqFt).toBe(400);
    expect(m.activeLeases).toBe(1);
    expect(m.vacantSpaces).toBe(1);
    // Regression: modeled area is the sum of all space areas (1600), independent of property-level usable (9000).
    expect(m.modeledSpaceAreaSqFt).toBe(1600);
    expect(m.usableAreaSqFt).toBe(9000);
    // Regression: occupancy % uses facility usable area (preserved behavior), rounded.
    expect(m.occupancyPercent).toBe(Math.round((600 / 9000) * 100));
  });

  it('supports godown/shed space types and preserves buildingName grouping metadata', () => {
    const f = createFacility({ id: 'F9', code: 'WH9', name: 'Yard', address: 'A', city: 'Pune', state: 'Maharashtra', totalAreaSqFt: 50000, usableAreaSqFt: 40000, floors: 1 });
    const g1 = addSpace(f, { id: 'G1', code: 'GD-1', name: 'Godown 1', type: 'godown', floor: 1, dimensions: { lengthFt: 100, widthFt: 50 }, environmentalClass: 'ambient', status: 'vacant', buildingName: 'North Compound' });
    const g2 = addSpace(f, { id: 'G2', code: 'GD-2', name: 'Shed 2', type: 'shed', floor: 1, dimensions: { lengthFt: 80, widthFt: 40 }, environmentalClass: 'ambient', status: 'vacant', buildingName: 'North Compound' });
    expect(g1.type).toBe('godown');
    expect(g1.buildingName).toBe('North Compound');
    expect(g2.type).toBe('shed');
    expect(g2.buildingName).toBe('North Compound');
    expect(f.spaces.filter((s) => s.buildingName === 'North Compound')).toHaveLength(2);
    const m = computeFacilityMetrics(f, []);
    expect(m.modeledSpaceAreaSqFt).toBe(5000 + 3200);
  });

  it('modeledSpaceAreaSqFt can equal usable when explicitly aligned (transparency case)', () => {
    const f = createFacility({ id: 'F10', code: 'WH10', name: 'Aligned', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 2000, usableAreaSqFt: 1500, floors: 1 });
    addSpace(f, { id: 'S1', code: 'R1', name: 'Room1', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 25 }, environmentalClass: 'ambient', status: 'leased' }); // 750
    addSpace(f, { id: 'S2', code: 'R2', name: 'Room2', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 25 }, environmentalClass: 'ambient', status: 'vacant' }); // 750
    const m = computeFacilityMetrics(f, [{ spaceId: 'S1', status: 'active' }]);
    expect(m.modeledSpaceAreaSqFt).toBe(1500);
    expect(m.usableAreaSqFt).toBe(1500);
    expect(m.occupancyPercent).toBe(50);
  });

  it('creates Indian warehouse example with decommissioned cold storage', () => {
    const f = createIndianWarehouseExample();
    expect(f.country).toBe('IN');
    expect(f.hasRefrigerationPlant).toBe(true);
    expect(f.refrigerationOperational).toBe(false);
    expect(f.spaces.length).toBe(4);
    const coldChamber = f.spaces.find(s => s.type === 'cold_chamber');
    expect(coldChamber).toBeDefined();
    const formerCold = f.spaces.find(s => s.id === 'SP-A');
    expect(formerCold?.environmentalClass).toBe('ambient');
    expect(formerCold?.notes).toContain('decommissioned');
  });
});

describe('allocateActualBill', () => {
  it('allocates proportionally by kWh', () => {
    const r = allocateActualBill({ totalBill: 1000, subReadings: [{ spaceId: 'A', kwh: 300 }, { spaceId: 'B', kwh: 700 }] });
    expect(r[0].allocated).toBe(300);
    expect(r[1].allocated).toBe(700);
  });
  it('handles zero consumption', () => {
    const r = allocateActualBill({ totalBill: 1000, subReadings: [{ spaceId: 'A', kwh: 0 }] });
    expect(r[0].allocated).toBe(0);
  });
});
