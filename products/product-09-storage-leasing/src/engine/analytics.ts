import type { Facility, Lease, RentLedgerEntry, Tenant, RentableSpace } from './types';
import { paymentStatusAsOf } from './leaseEngine';

/**
 * Admin analytics — first-principles projection layer (P09).
 *
 * Design:
 * - Pure, deterministic functions over current domain state (no I/O, no global clock except explicit `asOfDate`).
 * - Explicit metric definitions and policy (heuristics are configuration, not hidden magic).
 * - Schema/persistence-safe: computes from existing entities/ledger; no required new stored facts.
 * - Evolvable: building/facility dimensions included now; event-log/time-series projections can replace
 *   denormalized fields later without changing the consumer-facing metric contracts.
 *
 * Known limitation (honest): "vacant for how long" is exact only when `vacantSince` is recorded
 * (status transitions going forward). Legacy vacant spaces without timestamps report `unknown`.
 * A future event log / backfill workflow can close this gap; do not infer false precision.
 */

export interface PaymentDelayPolicy {
  /** Minimum ledger entries before classifying behavior. */
  minEntries: number;
  /** Flag if paid-late count >= this value. */
  latePaidCountThreshold: number;
  /** Flag if (latePaid + overdueNow) / entries >= this ratio (when entries >= minEntries). */
  problemRatioThreshold: number;
}

export const DEFAULT_PAYMENT_DELAY_POLICY: PaymentDelayPolicy = {
  minEntries: 2,
  latePaidCountThreshold: 2,
  problemRatioThreshold: 0.5,
};

export interface MetricDefinition {
  id: string;
  label: string;
  definition: string;
}

export const ANALYTICS_METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: 'occupancy',
    label: 'Occupancy %',
    definition:
      'Leased modeled area / facility usable area (property-level), as percentage when usable area is configured. If usable area is not configured, occupancy is unavailable (never reported as 0%). Modeled space sum is shown separately because usable may exclude common/circulation areas.',
  },
  {
    id: 'vacancy_duration',
    label: 'Vacancy duration',
    definition:
      'Days between space.vacantSince (start of current vacancy, recorded on status transitions) and asOfDate. Unknown for legacy vacant spaces without a recorded timestamp.',
  },
  {
    id: 'paid_late',
    label: 'Paid late',
    definition: 'Fully paid ledger entry has paidDate after dueDate (day granularity).',
  },
  {
    id: 'overdue_now',
    label: 'Overdue now',
    definition:
      'Entry has an outstanding amount and a valid due date before asOfDate (unpaid/partially unpaid).',
  },
  {
    id: 'regularly_delays',
    label: 'Regularly delays (heuristic)',
    definition:
      'Configurable policy applied per tenant over their ledger entries: flagged when entries >= minEntries and (latePaidCount >= threshold OR problem ratio >= threshold). Policy values are shown with results.',
  },
];

export interface AgingBucket {
  label: 'current' | '1-30' | '31-60' | '61-90' | '90+' | 'unknown';
  entryCount: number;
  amount: number;
}

export interface ReceivablesAging {
  asOfDate: string;
  buckets: AgingBucket[];
  totalOutstanding: number;
  totalOverdue: number;
}

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
  regularlyDelays: boolean;
  policy: PaymentDelayPolicy;
  delayReason: string;
}

export interface VacancySnapshot {
  spaceId: string;
  code: string;
  name: string;
  buildingName: string;
  areaSqFt: number;
  type: string;
  status: RentableSpace['status'];
  vacantSince?: string;
  daysVacant: number | null;
  durationKnown: boolean;
}

export interface BuildingUtilization {
  buildingName: string;
  totalSpaces: number;
  leasedSpaces: number;
  vacantSpaces: number;
  modeledAreaSqFt: number;
  leasedAreaSqFt: number;
  vacantAreaSqFt: number;
}

export interface AdminAnalytics {
  asOfDate: string;
  policy: { paymentDelay: PaymentDelayPolicy };
  definitions: MetricDefinition[];
  utilization: {
    usableAreaSqFt: number;
    modeledSpaceAreaSqFt: number;
    leasedAreaSqFt: number;
    vacantAreaSqFt: number;
    blockedAreaSqFt: number;
    underRepairAreaSqFt: number;
    /** null when facility usable area is not configured; never a false 0%. */
    occupancyPercent: number | null;
    totalSpaces: number;
    leasedSpaces: number;
    vacantSpaces: number;
  };
  utilizationByBuilding: BuildingUtilization[];
  vacantNow: VacancySnapshot[];
  tenantPaymentBehavior: TenantPaymentBehavior[];
  regularDelayers: TenantPaymentBehavior[];
  receivablesAging: ReceivablesAging;
  totals: {
    overdueAmount: number;
    overdueEntryCount: number;
    tenantsTracked: number;
  };
}

function toDay(iso: string): string {
  return iso.slice(0, 10);
}

function daysBetween(fromIsoDate: string, toIsoDate: string): number | null {
  const from = Date.parse(toDay(fromIsoDate));
  const to = Date.parse(toDay(toIsoDate));
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.floor((to - from) / 86400000);
}

function leaseTenantIds(leases: Lease[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const l of leases) m.set(l.id, l.tenantId);
  return m;
}

function isOverdueNow(e: RentLedgerEntry, asOfDate: string): boolean {
  return paymentStatusAsOf(e, asOfDate) === 'overdue';
}

export function computeReceivablesAging(ledgerEntries: RentLedgerEntry[], asOfDate: string): ReceivablesAging {
  const buckets: AgingBucket[] = [
    { label: 'current', entryCount: 0, amount: 0 },
    { label: '1-30', entryCount: 0, amount: 0 },
    { label: '31-60', entryCount: 0, amount: 0 },
    { label: '61-90', entryCount: 0, amount: 0 },
    { label: '90+', entryCount: 0, amount: 0 },
    { label: 'unknown', entryCount: 0, amount: 0 },
  ];
  const byLabel = new Map(buckets.map((b) => [b.label, b]));
  let totalOutstanding = 0;
  let totalOverdue = 0;
  for (const e of ledgerEntries) {
    const outstanding = Math.max(0, e.totalDue - e.amountPaid);
    if (outstanding <= 0) continue;
    totalOutstanding += outstanding;
    const d = daysBetween(e.dueDate, asOfDate);
    const overdue = isOverdueNow(e, asOfDate);
    if (overdue) totalOverdue += outstanding;
    let label: AgingBucket['label'] = paymentStatusAsOf(e, asOfDate) === 'unknown' ? 'unknown' : 'current';
    if (label !== 'unknown' && d !== null && d > 0) {
      if (d <= 30) label = '1-30';
      else if (d <= 60) label = '31-60';
      else if (d <= 90) label = '61-90';
      else label = '90+';
    }
    const b = byLabel.get(label)!;
    b.entryCount += 1;
    b.amount += outstanding;
  }
  return { asOfDate, buckets, totalOutstanding, totalOverdue };
}

export function computeTenantPaymentBehavior(input: {
  tenants: Tenant[];
  leases: Lease[];
  ledgerEntries: RentLedgerEntry[];
  asOfDate: string;
  policy?: PaymentDelayPolicy;
}): TenantPaymentBehavior[] {
  const { tenants, leases, ledgerEntries, asOfDate } = input;
  const policy = input.policy ?? DEFAULT_PAYMENT_DELAY_POLICY;
  const tenantById = new Map(tenants.map((t) => [t.id, t]));
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

      if (e.paidDate && e.paymentStatus === 'paid' && outstanding <= 0) {
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
      if (isOverdueNow(e, asOfDate)) {
        overdueEntries++;
        const d = daysBetween(e.dueDate, asOfDate);
        if (d !== null && d > maxDaysLate) maxDaysLate = d;
      }
    }

    const denom = entries.length;
    const problemRatio = denom > 0 ? (latePaidEntries + overdueEntries) / denom : 0;
    const regularlyDelays =
      denom >= policy.minEntries &&
      (latePaidEntries >= policy.latePaidCountThreshold || problemRatio >= policy.problemRatioThreshold);
    const delayReason = regularlyDelays
      ? latePaidEntries >= policy.latePaidCountThreshold
        ? `${latePaidEntries} late-paid entries (threshold ${policy.latePaidCountThreshold})`
        : `Problem ratio ${(problemRatio * 100).toFixed(0)}% (threshold ${(policy.problemRatioThreshold * 100).toFixed(0)}%)`
      : denom < policy.minEntries
        ? `Insufficient history (${denom}/${policy.minEntries} entries)`
        : 'Within policy thresholds';

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
      policy,
      delayReason,
    });
  }

  return rows.sort((a, b) =>
    b.regularlyDelays === a.regularlyDelays ? b.totalOutstanding - a.totalOutstanding : b.regularlyDelays ? 1 : -1,
  );
}

function buildingKey(name: string | undefined): string {
  const t = (name ?? '').trim();
  return t ? t : 'Unassigned / main site';
}

export function computeUtilizationByBuilding(facility: Facility | null): BuildingUtilization[] {
  if (!facility) return [];
  const map = new Map<string, BuildingUtilization>();
  for (const s of facility.spaces) {
    const key = buildingKey(s.buildingName);
    const row = map.get(key) ?? {
      buildingName: key,
      totalSpaces: 0,
      leasedSpaces: 0,
      vacantSpaces: 0,
      modeledAreaSqFt: 0,
      leasedAreaSqFt: 0,
      vacantAreaSqFt: 0,
    };
    row.totalSpaces += 1;
    row.modeledAreaSqFt += s.areaSqFt;
    if (s.status === 'leased') {
      row.leasedSpaces += 1;
      row.leasedAreaSqFt += s.areaSqFt;
    }
    if (s.status === 'vacant') {
      row.vacantSpaces += 1;
      row.vacantAreaSqFt += s.areaSqFt;
    }
    map.set(key, row);
  }
  return Array.from(map.values()).sort((a, b) => a.buildingName.localeCompare(b.buildingName));
}

export function computeVacantNow(facility: Facility | null, asOfDate: string): VacancySnapshot[] {
  if (!facility) return [];
  return facility.spaces
    .filter((s) => s.status === 'vacant')
    .map((s) => {
      const daysVacant = s.vacantSince ? daysBetween(s.vacantSince, asOfDate) : null;
      return {
        spaceId: s.id,
        code: s.code,
        name: s.name,
        buildingName: buildingKey(s.buildingName),
        areaSqFt: s.areaSqFt,
        type: s.type,
        status: s.status,
        vacantSince: s.vacantSince,
        daysVacant,
        durationKnown: daysVacant !== null,
      };
    })
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
    occupancyPercent: number | null;
  } | null;
  asOfDate?: string;
  policy?: { paymentDelay?: PaymentDelayPolicy };
}): AdminAnalytics {
  const asOfDate = toDay(input.asOfDate ?? new Date().toISOString());
  const paymentDelay = input.policy?.paymentDelay ?? DEFAULT_PAYMENT_DELAY_POLICY;
  const tenantPaymentBehavior = computeTenantPaymentBehavior({
    tenants: input.tenants,
    leases: input.leases,
    ledgerEntries: input.ledgerEntries,
    asOfDate,
    policy: paymentDelay,
  });
  const vacantNow = computeVacantNow(input.facility, asOfDate);
  const regularDelayers = tenantPaymentBehavior.filter((t) => t.regularlyDelays);
  const receivablesAging = computeReceivablesAging(input.ledgerEntries, asOfDate);
  const overdueEntries = input.ledgerEntries.filter((e) => isOverdueNow(e, asOfDate));
  const m = input.metrics;
  return {
    asOfDate,
    policy: { paymentDelay },
    definitions: ANALYTICS_METRIC_DEFINITIONS,
    utilization: {
      usableAreaSqFt: m?.usableAreaSqFt ?? 0,
      modeledSpaceAreaSqFt: m?.modeledSpaceAreaSqFt ?? 0,
      leasedAreaSqFt: m?.leasedAreaSqFt ?? 0,
      vacantAreaSqFt: m?.vacantAreaSqFt ?? 0,
      blockedAreaSqFt: m?.blockedAreaSqFt ?? 0,
      underRepairAreaSqFt: m?.underRepairAreaSqFt ?? 0,
      occupancyPercent: m?.occupancyPercent ?? null,
      totalSpaces: input.facility?.spaces.length ?? 0,
      leasedSpaces: input.facility?.spaces.filter((s) => s.status === 'leased').length ?? 0,
      vacantSpaces: input.facility?.spaces.filter((s) => s.status === 'vacant').length ?? 0,
    },
    utilizationByBuilding: computeUtilizationByBuilding(input.facility),
    vacantNow,
    tenantPaymentBehavior,
    regularDelayers,
    receivablesAging,
    totals: {
      overdueAmount: overdueEntries.reduce((sum, e) => sum + Math.max(0, e.totalDue - e.amountPaid), 0),
      overdueEntryCount: overdueEntries.length,
      tenantsTracked: tenantPaymentBehavior.length,
    },
  };
}
