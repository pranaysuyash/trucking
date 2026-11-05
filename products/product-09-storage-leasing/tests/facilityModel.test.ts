import { describe, it, expect } from 'vitest';
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

  it('computes facility metrics correctly', () => {
    const f = createFacility({ id: 'F8', code: 'WH8', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 10000, usableAreaSqFt: 9000, floors: 1 });
    addSpace(f, { id: 'S1', code: 'R1', name: 'Room1', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient', status: 'leased' });
    addSpace(f, { id: 'S2', code: 'R2', name: 'Room2', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    addSpace(f, { id: 'S3', code: 'R3', name: 'Room3', type: 'room', floor: 1, dimensions: { lengthFt: 20, widthFt: 20 }, environmentalClass: 'ambient', status: 'under_repair' });
    const m = computeFacilityMetrics(f, [{ spaceId: 'S1', status: 'active' }]);
    expect(m.leasedAreaSqFt).toBe(600);
    expect(m.vacantAreaSqFt).toBe(600);
    expect(m.underRepairAreaSqFt).toBe(400);
    expect(m.activeLeases).toBe(1);
    expect(m.vacantSpaces).toBe(1);
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
