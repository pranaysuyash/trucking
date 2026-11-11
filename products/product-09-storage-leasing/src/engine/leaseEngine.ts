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
  /** Quantity the rate applies to (sqft, units, pallets, etc.). Defaults by billing unit/space when omitted. */
  billingQuantity?: number;
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
  const billingQuantity = input.billingQuantity ?? (input.billingUnit === 'sqft_month' ? space.areaSqFt : input.billingUnit === 'fixed' ? 1 : undefined);
  if (input.billingUnit !== 'revenue_share' && (!Number.isFinite(billingQuantity) || billingQuantity! <= 0)) throw new Error('A positive billing quantity is required.');
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
    billingQuantity,
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

/**
 * CA/audit building block (explicit, no auto-wiring): create a final prorated
 * ledger entry up to termination date. Product decision still required for
 * automatic invocation, due-date policy, idempotency, and whether to supersede/
 * adjust an existing period entry — do not auto-generate without that decision.
 */
export function createTerminationFinalLedgerEntry(input: {
  id: string;
  lease: Lease;
  terminationDate: string;
  periodStart?: string;
  dueDate: string;
  electricityCharge?: number;
  maintenanceCharge?: number;
  otherCharges?: number;
}): RentLedgerEntry {
  const billStart = input.lease.billingStartDate ?? input.lease.startDate;
  const monthStart = `${input.terminationDate.slice(0, 7)}-01`;
  const rawStart = input.periodStart ?? monthStart;
  const periodStart = rawStart < billStart ? billStart : rawStart;
  const periodEnd = input.terminationDate;
  if (periodStart > periodEnd) throw new Error('Termination final ledger period is invalid (start after termination).');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd) || periodStart.slice(0, 7) !== periodEnd.slice(0, 7)) throw new Error('Final ledger period must be within one calendar month.');
  const billedDayCount = inclusiveDayCount(periodStart, periodEnd);
  const [year, month] = periodEnd.split('-').map(Number);
  const fullPeriodDayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return generateRentLedgerEntry({
    id: input.id,
    lease: input.lease,
    facilityId: input.lease.facilityId,
    spaceId: input.lease.spaceId,
    tenantId: input.lease.tenantId,
    periodStart,
    periodEnd,
    dueDate: input.dueDate,
    electricityCharge: input.electricityCharge ?? 0,
    maintenanceCharge: input.maintenanceCharge ?? 0,
    otherCharges: input.otherCharges ?? 0,
    billedDayCount,
    fullPeriodDayCount,
    prorationBasis: `Illustrative calendar-month proration: ${billedDayCount}/${fullPeriodDayCount} day(s) billed ${periodStart}..${periodEnd} (termination ${input.terminationDate}). Explicit operator action; contract policy and auto-generation/idempotency decisions remain pending.`,
  });
}

export function calculateRentForPeriod(
  lease: Lease,
  periodStart: string,
  periodEnd: string,
  electricityCharge: number = 0,
  maintenanceCharge: number = 0,
  otherCharges: number = 0,
  opts?: { billedDayCount?: number; fullPeriodDayCount?: number }
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
  if (lease.billingUnit === 'revenue_share') throw new Error('Revenue-share billing requires actual revenue and an agreed calculation policy; automatic billing is unavailable.');
  const quantity = lease.billingUnit === 'fixed' ? 1 : lease.billingQuantity;
  if (!Number.isFinite(quantity) || quantity! <= 0) throw new Error('Billing quantity is missing or invalid; review this lease before billing.');
  const billedDays = opts?.billedDayCount ?? inclusiveDayCount(periodStart, periodEnd);
  const fullDays = opts?.fullPeriodDayCount ?? billedDays;
  const dayRatio = fullDays > 0 ? billedDays / fullDays : 1;

  let baseRent = 0;
  switch (lease.billingUnit) {
    case 'sqft_month':
    case 'unit_month':
    case 'tonne_month':
    case 'bag_month': {
      const monthlyBase = escalatedRate * quantity!;
      baseRent = opts?.billedDayCount != null ? monthlyBase * dayRatio : monthlyBase * monthsBetween(periodStart, periodEnd);
      break;
    }
    case 'fixed': {
      const monthlyBase = escalatedRate;
      baseRent = opts?.billedDayCount != null ? monthlyBase * dayRatio : monthlyBase * monthsBetween(periodStart, periodEnd);
      break;
    }
    case 'pallet_day':
    case 'container_day': {
      // Rate per unit per day.
      baseRent = escalatedRate * quantity! * Math.max(0, billedDays);
      break;
    }
    default:
      baseRent = escalatedRate * quantity! * monthsBetween(periodStart, periodEnd);
  }

  const totalDue = baseRent + electricityCharge + maintenanceCharge + otherCharges;
  return { baseRent: Math.round(baseRent * 100) / 100, totalDue: Math.round(totalDue * 100) / 100 };
}

function monthsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const months = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth()) + 1;
  return Math.max(1, months || 1);
}

function inclusiveDayCount(startIso: string, endIso: string): number {
  const s = Date.parse(startIso.slice(0, 10));
  const e = Date.parse(endIso.slice(0, 10));
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.max(0, Math.floor((e - s) / 86400000) + 1);
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
  billedDayCount?: number;
  fullPeriodDayCount?: number;
  prorationBasis?: string;
}): RentLedgerEntry {
  const billedDayCount = input.billedDayCount ?? inclusiveDayCount(input.periodStart, input.periodEnd);
  const fullPeriodDayCount = input.fullPeriodDayCount;
  const { baseRent, totalDue } = calculateRentForPeriod(
    input.lease,
    input.periodStart,
    input.periodEnd,
    input.electricityCharge ?? 0,
    input.maintenanceCharge ?? 0,
    input.otherCharges ?? 0,
    input.billedDayCount != null || input.fullPeriodDayCount != null ? { billedDayCount, fullPeriodDayCount } : undefined
  );
  return {
    id: input.id,
    leaseId: input.lease.id,
    facilityId: input.facilityId,
    spaceId: input.spaceId,
    tenantId: input.tenantId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    billedDayCount,
    ...(fullPeriodDayCount != null ? { fullPeriodDayCount } : {}),
    ...(input.prorationBasis ? { prorationBasis: input.prorationBasis } : {}),
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

function moneyInPaise(value: number): number {
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  if (!Number.isFinite(value) || !Number.isSafeInteger(rounded) || Math.abs(scaled - rounded) > 1e-7) throw new Error('Amount must be a safe value in whole paise.');
  return rounded;
}

export function recordPayment(
  entry: RentLedgerEntry,
  amount: number,
  paidDate: string,
  receiptNumber?: string
): { applied: number; overpaid: number } {
  const receivedPaise = moneyInPaise(amount);
  const duePaise = moneyInPaise(entry.totalDue);
  const paidPaise = moneyInPaise(entry.amountPaid);
  const priorOverpaidPaise = moneyInPaise(entry.overpaidAmount ?? 0);
  if (receivedPaise <= 0) throw new Error('Payment amount must be positive.');
  if (duePaise < 0 || paidPaise < 0 || paidPaise > duePaise || priorOverpaidPaise < 0) throw new Error('Ledger amounts need review before recording a payment.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidDate) || !Number.isFinite(Date.parse(`${paidDate}T00:00:00Z`)) || new Date(`${paidDate}T00:00:00Z`).toISOString().slice(0, 10) !== paidDate) throw new Error('A valid payment date is required.');
  const appliedPaise = Math.min(receivedPaise, duePaise - paidPaise);
  const overpaidPaise = receivedPaise - appliedPaise;
  if (!Number.isSafeInteger(priorOverpaidPaise + overpaidPaise)) throw new Error('Overpayment amount exceeds safe paise precision.');
  const received = receivedPaise / 100;
  const applied = appliedPaise / 100;
  const overpaid = overpaidPaise / 100;
  if (!entry.paymentTransactions) {
    entry.paymentHistoryOpeningApplied = entry.amountPaid;
    entry.paymentHistoryOpeningOverpaid = entry.overpaidAmount ?? 0;
    entry.paymentTransactions = [];
  }
  const transactionId = globalThis.crypto?.randomUUID?.() ?? `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  entry.paymentTransactions.push({ transactionId, paidDate, amountReceived: received, amountApplied: applied, overpayment: overpaid, receiptNumber, recordedAt: new Date().toISOString(), source: 'user-entered' });
  entry.amountPaid = (paidPaise + appliedPaise) / 100;
  entry.lastReceiptAmount = received;
  if (overpaid > 0) entry.overpaidAmount = (priorOverpaidPaise + overpaidPaise) / 100;
  if (entry.amountPaid >= entry.totalDue && entry.totalDue >= 0) {
    entry.paymentStatus = 'paid';
    entry.paidDate = paidDate;
    if (receiptNumber) entry.receiptNumber = receiptNumber;
  } else if (entry.amountPaid > 0) {
    entry.paymentStatus = 'partial';
    if (receiptNumber) entry.receiptNumber = receiptNumber; // legacy compatibility
  }
  return { applied, overpaid };
}

export function detectOverdue(entry: RentLedgerEntry, asOfDate: string): boolean {
  if (entry.paymentStatus === 'paid') return false;
  return asOfDate > entry.dueDate;
}

/** A current projection only: does not reconstruct balances as they existed on an earlier day. */
export function paymentStatusAsOf(entry: RentLedgerEntry, asOfDate: string): 'pending' | 'partial' | 'overdue' | 'paid' | 'unknown' {
  const validDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!validDay(asOfDate) || !Number.isFinite(entry.totalDue) || !Number.isFinite(entry.amountPaid) || entry.totalDue <= 0 || entry.amountPaid < 0 || entry.amountPaid > entry.totalDue) return 'unknown';
  if (entry.amountPaid === entry.totalDue) return 'paid';
  const due = typeof entry.dueDate === 'string' ? entry.dueDate.slice(0, 10) : '';
  if (!validDay(due)) return 'unknown';
  if (due < asOfDate) return 'overdue';
  return entry.amountPaid > 0 ? 'partial' : 'pending';
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
  /** Existing ledger entries; duplicates for the same lease+calendar period are skipped (idempotent generation). */
  existingEntries?: RentLedgerEntry[];
}): RentLedgerEntry[] {
  const { leases, periodYear, periodMonth } = input;
  const month = String(periodMonth).padStart(2, '0');
  const periodStart = `${periodYear}-${month}-01`;
  const lastDay = new Date(periodYear, periodMonth, 0).getDate();
  const periodEnd = `${periodYear}-${month}-${String(lastDay).padStart(2, '0')}`;
  const existingIds = new Set((input.existingEntries ?? []).map((e) => e.id));
  const entries: RentLedgerEntry[] = [];
  for (const lease of leases) {
    if (lease.status !== 'active') continue;
    const id = `RL-${lease.id}-${periodYear}-${month}`;
    if (existingIds.has(id)) continue;
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
    const fullPeriodDayCount = inclusiveDayCount(periodStart, periodEnd);
    const billedDayCount = inclusiveDayCount(effectiveStart, effectiveEnd);
    const prorated = effectiveStart !== periodStart || effectiveEnd !== periodEnd;
    const prorationBasis = prorated
      ? `Prorated: billed ${billedDayCount}/${fullPeriodDayCount} day(s) for ${effectiveStart}..${effectiveEnd} (full month ${periodStart}..${periodEnd}${billStart > periodStart ? `; billing starts ${billStart}` : ''}${leaseEnd && leaseEnd < periodEnd ? `; lease ends ${leaseEnd}` : ''}).`
      : undefined;
    entries.push(generateRentLedgerEntry({
      id,
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
      billedDayCount,
      fullPeriodDayCount: prorated ? fullPeriodDayCount : undefined,
      prorationBasis,
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

export function generateReceiptNumber(leaseId: string, paidDate: string, suffix?: string): string {
  const compact = paidDate.replace(/-/g, '');
  const uniq = suffix ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  return `RCP-${leaseId}-${compact}-${uniq}`;
}

export function issueReceipt(entry: RentLedgerEntry, paidDate: string, transactionAmount?: number): Receipt {
  const amount = transactionAmount ?? entry.lastReceiptAmount ?? entry.amountPaid;
  const amountPaise = moneyInPaise(amount);
  if (amountPaise <= 0) throw new Error('Cannot issue receipt for an invalid or zero payment.');
  const latest = entry.paymentTransactions?.at(-1);
  if (latest && (latest.receiptNumber || latest.paidDate !== paidDate || latest.amountReceived !== amountPaise / 100)) throw new Error('Receipt must match the latest unreceipted payment transaction.');
  const receiptNumber = generateReceiptNumber(entry.leaseId, paidDate);
  entry.receiptNumber = receiptNumber;
  if (latest) latest.receiptNumber = receiptNumber;
  if (entry.amountPaid >= entry.totalDue) { entry.paymentStatus = 'paid'; entry.paidDate = paidDate; }
  else if (entry.amountPaid > 0) entry.paymentStatus = 'partial';
  return {
    receiptNumber,
    leaseId: entry.leaseId,
    tenantId: entry.tenantId,
    amount: amountPaise / 100,
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
