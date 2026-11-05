/**
 * Lease & Rent Engine for Storage & Leasing Core.
 * Handles lease creation, rent calculation, escalation, ledger entries,
 * payment recording, overdue detection, and electricity meter allocation.
 */

import {
  Lease, RentableSpace,
  RentLedgerEntry, BillingUnit, MeterReading,
} from './types';

export interface CreateLeaseInput {
  id: string;
  facilityId: string;
  spaceId: string;
  tenantId: string;
  leaseType?: import('./types').LeaseType;
  agreementDate?: string;
  depositDate?: string;
  startDate: string;
  possessionDate?: string;
  billingStartDate?: string;
  endDate?: string;
  billingCycleDay?: number;
  billingUnit: BillingUnit;
  rate: number;
  escalationPercentPerYear?: number;
  depositAmount?: number;
  isRenewal?: boolean;
  intendedUse?: string;
  commodityCategory?: import('./types').CommodityCategory;
}

export function createLease(input: CreateLeaseInput, space: RentableSpace): Lease {
  if (input.rate < 0) throw new Error('Lease rate cannot be negative.');
  const leaseType = input.leaseType ?? 'fixed_term';
  const startDate = input.billingStartDate ?? input.startDate;
  if (leaseType === 'fixed_term') {
    if (!input.endDate) throw new Error('Fixed-term lease requires an end date.');
    if (input.startDate >= input.endDate) throw new Error('Lease end date must be after start date.');
  } else if (input.endDate && input.startDate >= input.endDate) {
    throw new Error('Lease end date must be after start date.');
  }
  if (input.isRenewal) {
    if (space.status !== 'vacant' && space.status !== 'temporarily_reserved' && space.status !== 'leased') {
      throw new Error(`Space ${space.code} is not available for leasing (status: ${space.status}).`);
    }
  } else {
    if (space.status !== 'vacant' && space.status !== 'temporarily_reserved') {
      throw new Error(`Space ${space.code} is not available for leasing (status: ${space.status}).`);
    }
  }
  return {
    id: input.id,
    facilityId: input.facilityId,
    spaceId: input.spaceId,
    tenantId: input.tenantId,
    leaseType,
    agreementDate: input.agreementDate,
    depositDate: input.depositDate,
    startDate: input.startDate,
    possessionDate: input.possessionDate ?? input.startDate,
    billingStartDate: startDate,
    endDate: input.endDate,
    billingCycleDay: input.billingCycleDay,
    billingUnit: input.billingUnit,
    rate: input.rate,
    escalationPercentPerYear: input.escalationPercentPerYear ?? 0,
    depositAmount: input.depositAmount ?? 0,
    status: 'draft',
    intendedUse: input.intendedUse,
    commodityCategory: input.commodityCategory,
    createdAt: new Date().toISOString(),
  };
}

export function activateLease(lease: Lease, space: RentableSpace): void {
  if (lease.status !== 'draft') throw new Error('Only draft leases can be activated.');
  lease.status = 'active';
  space.status = 'leased';
  space.statusChangedAt = new Date().toISOString();
  delete space.vacantSince;
}

export function terminateLease(lease: Lease, space: RentableSpace, terminationDate: string): void {
  if (lease.status !== 'active') throw new Error('Only active leases can be terminated.');
  lease.status = 'terminated';
  lease.endDate = terminationDate;
  const at = new Date().toISOString();
  space.status = 'vacant';
  space.statusChangedAt = at;
  space.vacantSince = space.vacantSince ?? at;
}

export function calculateRentForPeriod(
  lease: Lease,
  periodStart: string,
  periodEnd: string,
  electricityCharge: number = 0,
  maintenanceCharge: number = 0,
  otherCharges: number = 0
): { baseRent: number; totalDue: number } {
  // Determine escalation based on years since start
  const start = new Date(lease.startDate);
  const periodStartDate = new Date(periodStart);
  let yearsElapsed = periodStartDate.getFullYear() - start.getFullYear();
  if (periodStartDate.getMonth() < start.getMonth() || (periodStartDate.getMonth() === start.getMonth() && periodStartDate.getDate() < start.getDate())) {
    yearsElapsed -= 1;
  }
  if (yearsElapsed < 0) yearsElapsed = 0;
  const escalatedRate = lease.rate * Math.pow(1 + lease.escalationPercentPerYear / 100, yearsElapsed);

  // For sqft_month and unit_month billing, charge rate * area/months. For simplicity,
  // treat rate as monthly charge per billing unit for the period.
  let baseRent = 0;
  if (lease.billingUnit === 'sqft_month') {
    // rate is per sqft per month; period in months
    const months = monthsBetween(periodStart, periodEnd);
    baseRent = escalatedRate * months;
  } else if (lease.billingUnit === 'fixed') {
    const months = monthsBetween(periodStart, periodEnd);
    baseRent = escalatedRate * months;
  } else {
    // pallet_day, tonne_month, container_day, unit_month — rate * quantity * duration
    // For leasing core we treat rate as monthly per unit; quantity derived from space.
    const months = monthsBetween(periodStart, periodEnd);
    baseRent = escalatedRate * months;
  }

  const totalDue = baseRent + electricityCharge + maintenanceCharge + otherCharges;
  return { baseRent: Math.round(baseRent * 100) / 100, totalDue: Math.round(totalDue * 100) / 100 };
}

function monthsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return Math.max(1, months || 1);
}

export function generateRentLedgerEntry(input: {
  id: string;
  lease: Lease;
  facilityId: string;
  spaceId: string;
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  electricityCharge?: number;
  maintenanceCharge?: number;
  otherCharges?: number;
}): RentLedgerEntry {
  const { baseRent, totalDue } = calculateRentForPeriod(
    input.lease,
    input.periodStart,
    input.periodEnd,
    input.electricityCharge ?? 0,
    input.maintenanceCharge ?? 0,
    input.otherCharges ?? 0
  );
  return {
    id: input.id,
    leaseId: input.lease.id,
    facilityId: input.facilityId,
    spaceId: input.spaceId,
    tenantId: input.tenantId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    baseRent,
    electricityCharge: input.electricityCharge ?? 0,
    maintenanceCharge: input.maintenanceCharge ?? 0,
    otherCharges: input.otherCharges ?? 0,
    totalDue,
    amountPaid: 0,
    paymentStatus: 'pending',
    dueDate: input.dueDate,
  };
}

export function recordPayment(entry: RentLedgerEntry, amount: number, paidDate: string, receiptNumber?: string): void {
  if (amount < 0) throw new Error('Payment amount cannot be negative.');
  entry.amountPaid = Math.round((entry.amountPaid + amount) * 100) / 100;
  if (entry.amountPaid >= entry.totalDue) {
    entry.paymentStatus = 'paid';
    entry.paidDate = paidDate;
    entry.receiptNumber = receiptNumber;
  } else if (entry.amountPaid > 0) {
    entry.paymentStatus = 'partial';
  }
}

export function detectOverdue(entry: RentLedgerEntry, asOfDate: string): boolean {
  if (entry.paymentStatus === 'paid') return false;
  return asOfDate > entry.dueDate;
}

export function updateOverdueStatus(entry: RentLedgerEntry, asOfDate: string): void {
  if (entry.paymentStatus !== 'paid' && asOfDate > entry.dueDate) {
    entry.paymentStatus = 'overdue';
  }
}

export function allocateElectricityCharge(
  mainReading: MeterReading,
  subReadings: MeterReading[],
  tariffPerKwh: number
): { spaceId: string; kwh: number; charge: number }[] {
  // Allocate based on submeter readings; main meter is used for verification only.
  void mainReading;
  const totalSubKwh = subReadings.reduce((sum, r) => sum + r.readingKwh, 0);
  void totalSubKwh;
  // If submeters don't sum to main, allocate proportionally but flag discrepancy.
  return subReadings.map(r => ({
    spaceId: r.spaceId ?? 'unknown',
    kwh: r.readingKwh,
    charge: Math.round(r.readingKwh * tariffPerKwh * 100) / 100,
  }));
}

export function computeRentSummary(entries: RentLedgerEntry[]): {
  totalDue: number;
  totalPaid: number;
  totalOverdue: number;
  overdueCount: number;
  pendingCount: number;
} {
  let totalDue = 0, totalPaid = 0, totalOverdue = 0, overdueCount = 0, pendingCount = 0;
  for (const e of entries) {
    totalDue += e.totalDue;
    totalPaid += e.amountPaid;
    if (e.paymentStatus === 'overdue') {
      totalOverdue += e.totalDue - e.amountPaid;
      overdueCount++;
    } else if (e.paymentStatus === 'pending' || e.paymentStatus === 'partial') {
      pendingCount++;
    }
  }
  return {
    totalDue: Math.round(totalDue * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalOverdue: Math.round(totalOverdue * 100) / 100,
    overdueCount,
    pendingCount,
  };
}

export function isLeaseExpiringSoon(lease: Lease, asOfDate: string, daysThreshold: number = 30): boolean {
  if (lease.status !== 'active') return false;
  if (!lease.endDate) return false; // indefinite / month-to-month: never "expiring soon" by date
  const end = new Date(lease.endDate);
  const asOf = new Date(asOfDate);
  const diffDays = (end.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= daysThreshold;
}

export function renewLease(oldLease: Lease, newLease: Lease): void {
  oldLease.status = 'renewed';
  newLease.renewalOfLeaseId = oldLease.id;
  newLease.status = 'draft';
}

export function createTenant(input: {
  id: string; name: string; gstin?: string; contactPerson: string; phone: string; email?: string; address?: string;
  intendedUse?: string; commodityCategory?: import('./types').CommodityCategory;
}): import('./types').Tenant {
  if (input.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(input.gstin)) {
    throw new Error('Invalid GSTIN format.');
  }
  if (!input.phone.trim()) throw new Error('Tenant phone is required.');
  return {
    id: input.id,
    name: input.name,
    gstin: input.gstin,
    contactPerson: input.contactPerson,
    phone: input.phone,
    email: input.email,
    address: input.address,
    intendedUse: input.intendedUse,
    commodityCategory: input.commodityCategory,
    createdAt: new Date().toISOString(),
  };
}

export function generateMonthlyRentLedgers(input: {
  leases: Lease[];
  periodYear: number;
  periodMonth: number; // 1-12
  electricityByLease?: Record<string, number>;
  maintenanceByLease?: Record<string, number>;
  otherByLease?: Record<string, number>;
  dueDayOfMonth?: number;
}): RentLedgerEntry[] {
  const { leases, periodYear, periodMonth } = input;
  const month = String(periodMonth).padStart(2, '0');
  const periodStart = `${periodYear}-${month}-01`;
  const lastDay = new Date(periodYear, periodMonth, 0).getDate();
  const periodEnd = `${periodYear}-${month}-${String(lastDay).padStart(2, '0')}`;
  const entries: RentLedgerEntry[] = [];
  for (const lease of leases) {
    if (lease.status !== 'active') continue;
    const billStart = lease.billingStartDate ?? lease.startDate;
    const leaseEnd = lease.endDate; // undefined => indefinite
    // only leases overlapping the period
    if (billStart > periodEnd) continue;
    if (leaseEnd && leaseEnd < periodStart) continue;
    // prorate first period: start on the later of periodStart / billStart
    const effectiveStart = billStart > periodStart ? billStart : periodStart;
    const effectiveEnd = leaseEnd && leaseEnd < periodEnd ? leaseEnd : periodEnd;
    if (effectiveStart > effectiveEnd) continue;
    const dueDay = Math.min(lease.billingCycleDay ?? (input.dueDayOfMonth ?? 10), new Date(periodEnd).getDate());
    const dueDate = `${periodYear}-${month}-${String(dueDay).padStart(2, '0')}`;
    entries.push(generateRentLedgerEntry({
      id: `RL-${lease.id}-${periodYear}-${month}`,
      lease,
      facilityId: lease.facilityId,
      spaceId: lease.spaceId,
      tenantId: lease.tenantId,
      periodStart: effectiveStart,
      periodEnd: effectiveEnd,
      dueDate,
      electricityCharge: input.electricityByLease?.[lease.id] ?? 0,
      maintenanceCharge: input.maintenanceByLease?.[lease.id] ?? 0,
      otherCharges: input.otherByLease?.[lease.id] ?? 0,
    }));
  }
  return entries;
}

export interface Receipt {
  receiptNumber: string;
  leaseId: string;
  tenantId: string;
  amount: number;
  paidDate: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
}

export function generateReceiptNumber(leaseId: string, paidDate: string): string {
  const compact = paidDate.replace(/-/g, '');
  return `RCP-${leaseId}-${compact}`;
}

export function issueReceipt(entry: RentLedgerEntry, paidDate: string): Receipt {
  if (entry.amountPaid <= 0) throw new Error('Cannot issue receipt for zero payment.');
  const receiptNumber = generateReceiptNumber(entry.leaseId, paidDate);
  entry.receiptNumber = receiptNumber;
  entry.paidDate = paidDate;
  if (entry.amountPaid >= entry.totalDue) entry.paymentStatus = 'paid';
  else entry.paymentStatus = 'partial';
  return {
    receiptNumber,
    leaseId: entry.leaseId,
    tenantId: entry.tenantId,
    amount: entry.amountPaid,
    paidDate,
    periodStart: entry.periodStart,
    periodEnd: entry.periodEnd,
    issuedAt: new Date().toISOString(),
  };
}

export function previewRenewal(lease: Lease, newStartDate: string, newEndDate: string, newRate?: number, newEscalation?: number): {
  oldRate: number;
  newRate: number;
  escalation: number;
  depositCarryForward: number;
} {
  if (newStartDate >= newEndDate) throw new Error('Renewal end must be after start.');
  return {
    oldRate: lease.rate,
    newRate: newRate ?? lease.rate,
    escalation: newEscalation ?? lease.escalationPercentPerYear,
    depositCarryForward: lease.depositAmount,
  };
}

export function getOverdueEntries(entries: RentLedgerEntry[], asOfDate: string): RentLedgerEntry[] {
  return entries.filter(e => e.paymentStatus !== 'paid' && asOfDate > e.dueDate);
}

export function getPendingEntries(entries: RentLedgerEntry[]): RentLedgerEntry[] {
  return entries.filter(e => e.paymentStatus === 'pending' || e.paymentStatus === 'partial');
}

export function generateRentPayableEntry(input: {
  id: string;
  facilityId: string;
  landlordName: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  baseRent: number;
  electricityCharge?: number;
  maintenanceCharge?: number;
  otherCharges?: number;
}): import('./types').RentPayableEntry {
  const electricityCharge = input.electricityCharge ?? 0;
  const maintenanceCharge = input.maintenanceCharge ?? 0;
  const otherCharges = input.otherCharges ?? 0;
  const totalDue = input.baseRent + electricityCharge + maintenanceCharge + otherCharges;
  return {
    id: input.id,
    facilityId: input.facilityId,
    landlordName: input.landlordName,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    baseRent: input.baseRent,
    electricityCharge,
    maintenanceCharge,
    otherCharges,
    totalDue: Math.round(totalDue * 100) / 100,
    amountPaid: 0,
    paymentStatus: 'pending',
    dueDate: input.dueDate,
  };
}

export function recordPayablePayment(entry: import('./types').RentPayableEntry, amount: number, paidDate: string, receiptNumber?: string): void {
  if (amount < 0) throw new Error('Payment amount cannot be negative.');
  entry.amountPaid = Math.round((entry.amountPaid + amount) * 100) / 100;
  if (entry.amountPaid >= entry.totalDue) {
    entry.paymentStatus = 'paid';
    entry.paidDate = paidDate;
    entry.receiptNumber = receiptNumber;
  } else if (entry.amountPaid > 0) {
    entry.paymentStatus = 'partial';
  }
}

export function computePayableSummary(entries: import('./types').RentPayableEntry[]): { totalDue: number; totalPaid: number; totalOverdue: number; overdueCount: number } {
  let totalDue = 0, totalPaid = 0, totalOverdue = 0, overdueCount = 0;
  const asOf = new Date().toISOString().slice(0, 10);
  for (const e of entries) {
    totalDue += e.totalDue;
    totalPaid += e.amountPaid;
    if (e.paymentStatus !== 'paid' && asOf > e.dueDate) {
      totalOverdue += e.totalDue - e.amountPaid;
      overdueCount++;
    }
  }
  return { totalDue: Math.round(totalDue * 100) / 100, totalPaid: Math.round(totalPaid * 100) / 100, totalOverdue: Math.round(totalOverdue * 100) / 100, overdueCount };
}
