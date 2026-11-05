import type { Facility, Lease, RentLedgerEntry, Tenant } from './types';

export interface TenantPaymentBehavior {
  tenantId: string;
  tenantName: string;
  leaseCount: number;
  ledgerEntries: number;
  paidEntries: number;
  latePaidEntries: number;
  overdueEntries: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalLatePaidAmount: number;
  avgDaysLateWhenPaid: number | null;
  maxDaysLate: number;
  /** Transparent heuristic: >=2 late-paid entries, or (late+overdue)/entries >= 0.5 with >=2 entries. */
  regularlyDelays: boolean;
}

export interface VacancySnapshot {
  spaceId: string;
  code: string;
  name: string;
  buildingName?: string;
  areaSqFt: number;
  type: string;
  vacantSince?: string;
  daysVacant: number | null;
}

export interface AdminAnalytics {
  asOfDate: string;
  utilization: {
    usableAreaSqFt: number;
    modeledSpaceAreaSqFt: number;
    leasedAreaSqFt: number;
    vacantAreaSqFt: number;
    blockedAreaSqFt: number;
    underRepairAreaSqFt: number;
    occupancyPercent: number;
    totalSpaces: number;
    leasedSpaces: number;
    vacantSpaces: number;
  };
  vacantNow: VacancySnapshot[];
  tenantPaymentBehavior: TenantPaymentBehavior[];
  regularDelayers: TenantPaymentBehavior[];
  totals: {
    overdueAmount: number;
    overdueEntryCount: number;
    tenantsTracked: number;
  };
}

function daysBetween(fromIsoDate: string, toIsoDate: string): number | null {
  const from = Date.parse(fromIsoDate);
  const to = Date.parse(toIsoDate);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.floor((to - from) / 86400000);
}

function leaseTenantIds(leases: Lease[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const l of leases) m.set(l.id, l.tenantId);
  return m;
}

export function computeTenantPaymentBehavior(input: {
  tenants: Tenant[];
  leases: Lease[];
  ledgerEntries: RentLedgerEntry[];
  asOfDate: string;
}): TenantPaymentBehavior[] {
  const { tenants, leases, ledgerEntries, asOfDate } = input;
  const tenantById = new Map(tenants.map((t) => [t.id, t]));
  const leaseById = new Map(leases.map((l) => [l.id, l]));
  const leaseToTenant = leaseTenantIds(leases);

  const byTenant = new Map<string, RentLedgerEntry[]>();
  for (const e of ledgerEntries) {
    const tid = e.tenantId || leaseToTenant.get(e.leaseId);
    if (!tid) continue;
    const arr = byTenant.get(tid) ?? [];
    arr.push(e);
    byTenant.set(tid, arr);
  }

  const rows: TenantPaymentBehavior[] = [];
  for (const [tenantId, entries] of byTenant.entries()) {
    const tenant = tenantById.get(tenantId);
    const tenantLeaseCount = leases.filter((l) => l.tenantId === tenantId).length;
    let paidEntries = 0;
    let latePaidEntries = 0;
    let overdueEntries = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalLatePaidAmount = 0;
    let daysLateSum = 0;
    let daysLateN = 0;
    let maxDaysLate = 0;

    for (const e of entries) {
      totalInvoiced += e.totalDue;
      totalPaid += e.amountPaid;
      const outstanding = Math.max(0, e.totalDue - e.amountPaid);
      totalOutstanding += outstanding;

      if (e.paidDate) {
        paidEntries++;
        const d = daysBetween(e.dueDate, e.paidDate);
        if (d !== null && d > 0) {
          latePaidEntries++;
          totalLatePaidAmount += e.amountPaid || e.totalDue;
          daysLateSum += d;
          daysLateN++;
          if (d > maxDaysLate) maxDaysLate = d;
        }
      }
      if (e.paymentStatus === 'overdue' || (!e.paidDate && outstanding > 0 && daysBetween(e.dueDate, asOfDate) !== null && (daysBetween(e.dueDate, asOfDate) as number) > 0)) {
        overdueEntries++;
        const d = daysBetween(e.dueDate, asOfDate);
        if (d !== null && d > maxDaysLate) maxDaysLate = d;
      }
    }

    const denom = entries.length;
    const problemCount = latePaidEntries + overdueEntries;
    const regularlyDelays = denom >= 2 && (latePaidEntries >= 2 || problemCount / denom >= 0.5);

    rows.push({
      tenantId,
      tenantName: tenant?.name ?? `Tenant ${tenantId}`,
      leaseCount: tenantLeaseCount,
      ledgerEntries: denom,
      paidEntries,
      latePaidEntries,
      overdueEntries,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalLatePaidAmount,
      avgDaysLateWhenPaid: daysLateN > 0 ? Math.round((daysLateSum / daysLateN) * 10) / 10 : null,
      maxDaysLate,
      regularlyDelays,
    });
  }

  // Ensure leases without ledger entries don't create noise; include tenants with leases but no behavior issues only if desired — omit for focus.
  void leaseById;
  return rows.sort((a, b) => (b.regularlyDelays === a.regularlyDelays ? b.totalOutstanding - a.totalOutstanding : b.regularlyDelays ? 1 : -1));
}

export function computeVacantNow(facility: Facility | null, asOfDate: string): VacancySnapshot[] {
  if (!facility) return [];
  return facility.spaces
    .filter((s) => s.status === 'vacant')
    .map((s) => ({
      spaceId: s.id,
      code: s.code,
      name: s.name,
      buildingName: s.buildingName,
      areaSqFt: s.areaSqFt,
      type: s.type,
      vacantSince: s.vacantSince,
      daysVacant: s.vacantSince ? daysBetween(s.vacantSince.slice(0, 10), asOfDate) : null,
    }))
    .sort((a, b) => (b.daysVacant ?? -1) - (a.daysVacant ?? -1));
}

export function computeAdminAnalytics(input: {
  facility: Facility | null;
  tenants: Tenant[];
  leases: Lease[];
  ledgerEntries: RentLedgerEntry[];
  metrics: {
    usableAreaSqFt: number;
    modeledSpaceAreaSqFt: number;
    leasedAreaSqFt: number;
    vacantAreaSqFt: number;
    blockedAreaSqFt: number;
    underRepairAreaSqFt: number;
    occupancyPercent: number;
  } | null;
  asOfDate?: string;
}): AdminAnalytics {
  const asOfDate = input.asOfDate ?? new Date().toISOString().slice(0, 10);
  const tenantPaymentBehavior = computeTenantPaymentBehavior({
    tenants: input.tenants,
    leases: input.leases,
    ledgerEntries: input.ledgerEntries,
    asOfDate,
  });
  const vacantNow = computeVacantNow(input.facility, asOfDate);
  const regularDelayers = tenantPaymentBehavior.filter((t) => t.regularlyDelays);
  const overdueEntries = input.ledgerEntries.filter((e) => e.paymentStatus === 'overdue' || (Math.max(0, e.totalDue - e.amountPaid) > 0 && (daysBetween(e.dueDate, asOfDate) ?? 0) > 0));
  const m = input.metrics;
  return {
    asOfDate,
    utilization: {
      usableAreaSqFt: m?.usableAreaSqFt ?? 0,
      modeledSpaceAreaSqFt: m?.modeledSpaceAreaSqFt ?? 0,
      leasedAreaSqFt: m?.leasedAreaSqFt ?? 0,
      vacantAreaSqFt: m?.vacantAreaSqFt ?? 0,
      blockedAreaSqFt: m?.blockedAreaSqFt ?? 0,
      underRepairAreaSqFt: m?.underRepairAreaSqFt ?? 0,
      occupancyPercent: m?.occupancyPercent ?? 0,
      totalSpaces: input.facility?.spaces.length ?? 0,
      leasedSpaces: input.facility?.spaces.filter((s) => s.status === 'leased').length ?? 0,
      vacantSpaces: input.facility?.spaces.filter((s) => s.status === 'vacant').length ?? 0,
    },
    vacantNow,
    tenantPaymentBehavior,
    regularDelayers,
    totals: {
      overdueAmount: overdueEntries.reduce((sum, e) => sum + Math.max(0, e.totalDue - e.amountPaid), 0),
      overdueEntryCount: overdueEntries.length,
      tenantsTracked: tenantPaymentBehavior.length,
    },
  };
}
