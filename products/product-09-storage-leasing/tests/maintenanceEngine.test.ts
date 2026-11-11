import { describe, it, expect } from 'vitest';
import {
  createMaintenanceTask, startMaintenance, resolveMaintenance, cancelMaintenance,
  computeMaintenanceSummary, getOpenTasksForSpace, getTasksByStatus, costVariance,
} from '../src/engine/maintenanceEngine';
import { createFacility, addSpace } from '../src/engine/facilityModel';

describe('P09 Maintenance Engine', () => {
  function makeFacility() {
    const f = createFacility({ id: 'F1', code: 'WH1', name: 'W', address: 'A', city: 'C', state: 'S', totalAreaSqFt: 10000, usableAreaSqFt: 9000, floors: 1 });
    addSpace(f, { id: 'S1', code: 'R1', name: 'Room', type: 'room', floor: 1, dimensions: { lengthFt: 30, widthFt: 20 }, environmentalClass: 'ambient', status: 'vacant' });
    return f;
  }

  it('creates an open maintenance task', () => {
    const t = createMaintenanceTask({ id: 'M1', facilityId: 'F1', spaceId: 'S1', category: 'roof', title: 'Roof leak', description: 'Leak in corner', estimatedCost: 5000, reportedBy: 'owner' });
    expect(t.status).toBe('open');
  });

  it('rejects empty title', () => {
    expect(() => createMaintenanceTask({ id: 'M2', facilityId: 'F1', category: 'roof', title: '  ', description: 'x', estimatedCost: 100, reportedBy: 'o' })).toThrow();
  });

  it('rejects negative cost', () => {
    expect(() => createMaintenanceTask({ id: 'M3', facilityId: 'F1', category: 'roof', title: 't', description: 'x', estimatedCost: -1, reportedBy: 'o' })).toThrow();
  });

  it('starts maintenance and marks space under_repair', () => {
    const f = makeFacility();
    const t = createMaintenanceTask({ id: 'M4', facilityId: 'F1', spaceId: 'S1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    startMaintenance(t, f);
    expect(t.status).toBe('in_progress');
    expect(f.spaces[0].status).toBe('under_repair');
  });

  it('cannot start non-open task', () => {
    const f = makeFacility();
    const t = createMaintenanceTask({ id: 'M5', facilityId: 'F1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    startMaintenance(t, f);
    expect(() => startMaintenance(t, f)).toThrow();
  });

  it('resolves maintenance and restores previous space status (vacant -> vacant)', () => {
    const f = makeFacility();
    const t = createMaintenanceTask({ id: 'M6', facilityId: 'F1', spaceId: 'S1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    startMaintenance(t, f);
    expect(t.spaceStatusBeforeRepair).toBe('vacant');
    resolveMaintenance(t, f, 120);
    expect(t.status).toBe('resolved');
    expect(t.actualCost).toBe(120);
    expect(f.spaces[0].status).toBe('vacant');
  });

  it('restores leased status after repair (does not free commercially leased space)', () => {
    const f = makeFacility();
    f.spaces[0].status = 'leased';
    const t = createMaintenanceTask({ id: 'M6L', facilityId: 'F1', spaceId: 'S1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    startMaintenance(t, f);
    expect(f.spaces[0].status).toBe('under_repair');
    resolveMaintenance(t, f, 120);
    expect(f.spaces[0].status).toBe('leased');
  });

  it('resolves open task directly', () => {
    const f = makeFacility();
    const t = createMaintenanceTask({ id: 'M7', facilityId: 'F1', spaceId: 'S1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    resolveMaintenance(t, f, 90);
    expect(t.status).toBe('resolved');
  });

  it('cancels maintenance and frees space', () => {
    const f = makeFacility();
    const t = createMaintenanceTask({ id: 'M8', facilityId: 'F1', spaceId: 'S1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    startMaintenance(t, f);
    cancelMaintenance(t, f);
    expect(t.status).toBe('cancelled');
    expect(f.spaces[0].status).toBe('vacant');
  });

  it('cannot cancel resolved task', () => {
    const f = makeFacility();
    const t = createMaintenanceTask({ id: 'M9', facilityId: 'F1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    resolveMaintenance(t, f, 90);
    expect(() => cancelMaintenance(t, f)).toThrow();
  });

  it('computes maintenance summary', () => {
    const f = makeFacility();
    const t1 = createMaintenanceTask({ id: 'M10', facilityId: 'F1', category: 'roof', title: 't1', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    const t2 = createMaintenanceTask({ id: 'M11', facilityId: 'F1', category: 'electrical', title: 't2', description: 'x', estimatedCost: 200, reportedBy: 'o' });
    resolveMaintenance(t2, f, 180);
    const summary = computeMaintenanceSummary([t1, t2]);
    expect(summary.openCount).toBe(1);
    expect(summary.resolvedCount).toBe(1);
    expect(summary.totalEstimatedCost).toBe(300);
    expect(summary.totalActualCost).toBe(180);
    expect(summary.byCategory['roof']).toBe(1);
    expect(summary.byCategory['electrical']).toBe(1);
  });

  it('filters open tasks by space', () => {
    const t1 = createMaintenanceTask({ id: 'M12', facilityId: 'F1', spaceId: 'S1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    const t2 = createMaintenanceTask({ id: 'M13', facilityId: 'F1', spaceId: 'S2', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    const open = getOpenTasksForSpace([t1, t2], 'S1');
    expect(open.length).toBe(1);
    expect(open[0].id).toBe('M12');
  });
});

describe('P09 Maintenance Helpers', () => {
  it('filters tasks by status', () => {
    const t1 = createMaintenanceTask({ id: 'A', facilityId: 'F1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    const t2 = createMaintenanceTask({ id: 'B', facilityId: 'F1', category: 'roof', title: 't2', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    resolveMaintenance(t2, { id:'F1', code:'W', name:'W', address:'A', city:'C', state:'S', totalAreaSqFt:1000, usableAreaSqFt:900, floors:1, hasElectricityMeter:true, hasRefrigerationPlant:false, refrigerationOperational:false, spaces:[], createdAt:'x' } as any, 90);
    const open = getTasksByStatus([t1, t2], 'open');
    expect(open.length).toBe(1);
  });

  it('computes cost variance', () => {
    const t = createMaintenanceTask({ id: 'C', facilityId: 'F1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    t.actualCost = 120;
    expect(costVariance(t)).toBe(20);
    const t2b = createMaintenanceTask({ id: 'D', facilityId: 'F1', category: 'roof', title: 't', description: 'x', estimatedCost: 100, reportedBy: 'o' });
    expect(costVariance(t2b)).toBeNull();
  });
});
