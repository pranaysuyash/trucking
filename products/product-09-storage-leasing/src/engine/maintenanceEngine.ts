/**
 * Maintenance & Repair Engine for Storage & Leasing Core.
 */

import { MaintenanceTask, MaintenanceCategory, MaintenanceStatus, Facility } from './types';
import { findSpaceById } from './facilityModel';

export interface CreateMaintenanceInput {
  id: string;
  facilityId: string;
  spaceId?: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  estimatedCost: number;
  reportedBy: string;
  contractor?: string;
}

export function createMaintenanceTask(input: CreateMaintenanceInput): MaintenanceTask {
  if (input.estimatedCost < 0) throw new Error('Estimated cost cannot be negative.');
  if (!input.title.trim()) throw new Error('Maintenance title is required.');
  return {
    id: input.id,
    facilityId: input.facilityId,
    spaceId: input.spaceId,
    category: input.category,
    title: input.title,
    description: input.description,
    estimatedCost: input.estimatedCost,
    status: 'open',
    reportedBy: input.reportedBy,
    reportedAt: new Date().toISOString(),
    contractor: input.contractor,
  };
}

export function startMaintenance(task: MaintenanceTask, facility: Facility): void {
  if (task.status !== 'open') throw new Error('Only open tasks can be started.');
  task.status = 'in_progress';
  if (task.spaceId) {
    const space = findSpaceById(facility, task.spaceId);
    if (space) {
      task.spaceStatusBeforeRepair = space.status;
      space.status = 'under_repair';
    }
  }
}

export function resolveMaintenance(task: MaintenanceTask, facility: Facility, actualCost: number, resolvedAt?: string): void {
  if (task.status !== 'in_progress' && task.status !== 'open') throw new Error('Task must be open or in progress to resolve.');
  task.status = 'resolved';
  task.actualCost = actualCost;
  task.resolvedAt = resolvedAt ?? new Date().toISOString();
  if (task.spaceId) {
    const space = findSpaceById(facility, task.spaceId);
    if (space && space.status === 'under_repair') {
      space.status = task.spaceStatusBeforeRepair ?? 'vacant';
    }
  }
}

export function cancelMaintenance(task: MaintenanceTask, facility: Facility): void {
  if (task.status === 'resolved') throw new Error('Resolved tasks cannot be cancelled.');
  task.status = 'cancelled';
  if (task.spaceId) {
    const space = findSpaceById(facility, task.spaceId);
    if (space && space.status === 'under_repair') {
      space.status = task.spaceStatusBeforeRepair ?? 'vacant';
    }
  }
}

export function computeMaintenanceSummary(tasks: MaintenanceTask[]): {
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  byCategory: Record<string, number>;
} {
  const byCategory: Record<string, number> = {};
  let openCount = 0, inProgressCount = 0, resolvedCount = 0, totalEstimated = 0, totalActual = 0;
  for (const t of tasks) {
    if (t.status === 'open') openCount++;
    else if (t.status === 'in_progress') inProgressCount++;
    else if (t.status === 'resolved') resolvedCount++;
    totalEstimated += t.estimatedCost;
    totalActual += t.actualCost ?? 0;
    byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
  }
  return {
    openCount,
    inProgressCount,
    resolvedCount,
    totalEstimatedCost: Math.round(totalEstimated * 100) / 100,
    totalActualCost: Math.round(totalActual * 100) / 100,
    byCategory,
  };
}

export function getOpenTasksForSpace(tasks: MaintenanceTask[], spaceId: string): MaintenanceTask[] {
  return tasks.filter(t => t.spaceId === spaceId && (t.status === 'open' || t.status === 'in_progress'));
}

export function getTasksByStatus(tasks: MaintenanceTask[], status: MaintenanceStatus): MaintenanceTask[] {
  return tasks.filter(t => t.status === status);
}

export function costVariance(task: MaintenanceTask): number | null {
  if (task.actualCost === undefined) return null;
  return Math.round((task.actualCost - task.estimatedCost) * 100) / 100;
}

export function getTasksForFacility(tasks: MaintenanceTask[], facilityId: string): MaintenanceTask[] {
  return tasks.filter(t => t.facilityId === facilityId);
}
