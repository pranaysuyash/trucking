import { useEffect, useRef, useState } from 'react';
import { Tabs, Button, Group, Stack, Text, Title, TextInput, NumberInput, Select, Badge, Table, ScrollArea } from '@mantine/core';
import { SuiteDock } from './SuiteDock';
import { useFacilityStore } from './hooks/useFacilityStore';
import { selectMetrics, selectRentSummary, selectMaintSummary, selectCharges } from './selectors';
import { computeAdminAnalytics } from '../engine/analytics';
import { EmptyState } from './components/EmptyState';
import { StatCard } from './components/StatCard';
import { SectionCard } from './components/SectionCard';
import { Money } from './components/Money';
import { StatusBadge } from './components/StatusBadge';
import { inr, sqft, pct, dateShort, calendarDateLocal } from './format';
import {
  createFacility,
  addSpace,
  allocateSpaceAndLease,
} from '../engine/facilityModel';
import { addMeterConsumption, allocateBillForPeriod } from '../engine/meterConsumption';
import {
  createTenant,
  createLease,
  generateMonthlyRentLedgers,
  paymentStatusAsOf,
  previewRenewal,
} from '../engine/leaseEngine';
import { generateGstInvoice, calculateLateFee } from '../engine/gstInvoice';
import {
  createMaintenanceTask,
  startMaintenance,
  resolveMaintenance,
  cancelMaintenance,
  costVariance,
} from '../engine/maintenanceEngine';
import type { RentableSpace, Lease, MaintenanceTask, CommodityCategory, Tenant } from '../engine/types';

const OWNERSHIP_OPTIONS = [
  { value: 'owned', label: 'Owned (I own this building)' },
  { value: 'leased_in', label: 'Leased (I rent this building)' },
  { value: 'managed', label: 'Managed (I manage for owner)' },
  { value: 'sub_leased', label: 'Sub-leased (I sub-let part of a rented building)' },
  { value: 'government', label: 'Government-owned facility' },
  { value: 'cooperative', label: 'Cooperative / shared ownership' },
  { value: 'franchise', label: 'Franchised facility' },
];

const SPACE_TYPE_OPTIONS = [
  { value: 'room', label: 'Room' },
  { value: 'chamber', label: 'Chamber' },
  { value: 'godown', label: 'Godown' },
  { value: 'shed', label: 'Shed' },
  { value: 'bay', label: 'Bay' },
  { value: 'plot', label: 'Plot' },
  { value: 'unit', label: 'Unit' },
  { value: 'cold_chamber', label: 'Cold Chamber' },
  { value: 'open_yard', label: 'Open Yard' },
  { value: 'container', label: 'Container' },
  { value: 'silo', label: 'Silo' },
  { value: 'tank', label: 'Tank' },
  { value: 'rack', label: 'Rack' },
  { value: 'locker', label: 'Locker' },
  { value: 'parking_bay', label: 'Parking Bay' },
];

const ENV_OPTIONS = [
  { value: 'ambient', label: 'Ambient' },
  { value: 'chilled', label: 'Chilled' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'hazmat', label: 'Hazmat' },
];

const COMMODITY_OPTIONS = [
  { value: 'ambient_goods', label: 'Ambient goods' },
  { value: 'perishable', label: 'Perishable' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'hazmat', label: 'Hazmat' },
  { value: 'documents', label: 'Documents' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'agri', label: 'Agri' },
  { value: 'other', label: 'Other' },
];

const BILLING_OPTIONS = [
  { value: 'sqft_month', label: '₹/sqft/month' },
  { value: 'pallet_day', label: '₹/pallet/day' },
  { value: 'tonne_month', label: '₹/tonne/month' },
  { value: 'container_day', label: '₹/container/day' },
  { value: 'unit_month', label: '₹/unit/month' },
  { value: 'bag_month', label: '₹/bag/month (agri)' },
  { value: 'revenue_share', label: '% of revenue' },
  { value: 'fixed', label: 'Fixed monthly' },
];

const MAINT_CATEGORY_OPTIONS = [
  { value: 'roof', label: 'Roof' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'shutter', label: 'Shutter' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'water', label: 'Water' },
  { value: 'fire_safety', label: 'Fire Safety' },
  { value: 'refrigeration', label: 'Refrigeration' },
  { value: 'other', label: 'Other' },
];

export function App() {
  const store = useFacilityStore();
  const {
    facility,
    tenants,
    leases,
    ledgerEntries,
    maintenanceTasks,
    meterReadings,
    receipts,
    events,
    loading,
    resetting,
    storageError,
    storageSaveStatus,
    flashMsg,
    tab,
    setTab,
    flash,
    setFacility,
    setTenants,
    setLeases,
    setLedgerEntries,
    setMaintenanceTasks,
    setMeterReadings,
    recordPaymentAndReceipt,
    reset,
  } = store;

  // GST invoice (local UI)
  const [invoiceEntryId, setInvoiceEntryId] = useState<string>('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierState, setSupplierState] = useState('');
  const [recipientState, setRecipientState] = useState('');

  // Form state (local UI, not persisted).
  const [reg, setReg] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
    totalArea: 0,
    usableArea: 0,
    floors: 1,
    ownershipType: 'owned' as 'owned' | 'leased_in' | 'managed' | 'sub_leased' | 'government' | 'cooperative' | 'franchise',
    landlordName: '',
    landlordContact: '',
  });
  const [newSpace, setNewSpace] = useState({
    code: '',
    name: '',
    buildingName: '',
    type: 'room' as RentableSpace['type'],
    floor: 1,
    lengthFt: 0,
    widthFt: 0,
    env: 'ambient' as RentableSpace['environmentalClass'],
  });
  const [newTenant, setNewTenant] = useState({ name: '', gstin: '', contactPerson: '', phone: '', address: '', intendedUse: '', commodityCategory: 'ambient_goods' as CommodityCategory });
  const [newLease, setNewLease] = useState({
    leaseType: 'fixed_term' as Lease['leaseType'],
    agreementDate: '',
    depositDate: '',
    spaceId: '',
    tenantId: '',
    start: '',
    billingStart: '',
    end: '',
    rate: 0,
    billing: 'sqft_month' as Lease['billingUnit'],
    billingQuantity: null as number | null,
    intendedUse: '',
    commodityCategory: '' as CommodityCategory | '',
    deposit: 0,
    escalation: 0,
    billingCycleDay: 10,
  });
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editTenantUse, setEditTenantUse] = useState('');
  const [editTenantCommodity, setEditTenantCommodity] = useState<CommodityCategory>('ambient_goods');
  const [newMaint, setNewMaint] = useState({
    spaceId: '',
    category: 'roof' as MaintenanceTask['category'],
    title: '',
    description: '',
    cost: 0,
  });
  const [newMeter, setNewMeter] = useState<{ spaceId: string; kwh: number | null; periodStart: string; periodEnd: string }>({ spaceId: '', kwh: null, periodStart: '', periodEnd: '' });
  const [billPeriod, setBillPeriod] = useState({ start: '', end: '' });
  const [actualBill, setActualBill] = useState<number | null>(null);
  const [billAllocation, setBillAllocation] = useState<{ spaceId: string; kwh: number; sharePct: number; allocated: number }[] | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const paymentActionPending = useRef(false);
  useEffect(() => { paymentActionPending.current = false; }, [ledgerEntries]);
  const [paymentDate, setPaymentDate] = useState(() => calendarDateLocal());
  const [paymentEntryId, setPaymentEntryId] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'pending' | 'overdue' | 'partial' | 'paid' | 'unknown'>('all');
  const [spaceSearch, setSpaceSearch] = useState('');
  const [spaceStatusFilter, setSpaceStatusFilter] = useState<string>('all');
  const [spaceBuildingFilter, setSpaceBuildingFilter] = useState<string>('all');
  const [leaseStatusFilter, setLeaseStatusFilter] = useState<string>('all');
  void spaceSearch; void setSpaceSearch; void spaceStatusFilter; void setSpaceStatusFilter; void spaceBuildingFilter; void setSpaceBuildingFilter; void leaseStatusFilter; void setLeaseStatusFilter;
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  const asOfDate = calendarDateLocal();
  const asOfMonth = asOfDate.slice(0, 7); // YYYY-MM
  const metrics = selectMetrics(facility, leases);
  // All-recorded totals (legacy aggregate) — clearly labeled where shown; not "monthly rent due".
  const rentSummaryAll = selectRentSummary(ledgerEntries);
  // Period/as-of dashboard metrics (honest labels): billed for periods starting in as-of month; outstanding/overdue as-of date.
  const billedInAsOfMonth = ledgerEntries
    .filter((e) => e.periodStart.slice(0, 7) === asOfMonth)
    .reduce((s, e) => s + e.totalDue, 0);
  const overdueAsOf = ledgerEntries.reduce((s, e) => {
    if (paymentStatusAsOf(e, asOfDate) !== 'overdue') return s;
    const out = Math.max(0, e.totalDue - e.amountPaid);
    if (out <= 0) return s;
    return e.dueDate.slice(0, 10) < asOfDate.slice(0, 10) ? s + out : s;
  }, 0);
  const overdueCountAsOf = ledgerEntries.filter((e) => {
    if (paymentStatusAsOf(e, asOfDate) !== 'overdue') return false;
    const out = Math.max(0, e.totalDue - e.amountPaid);
    return out > 0 && e.dueDate.slice(0, 10) < asOfDate.slice(0, 10);
  }).length;
  const analytics = computeAdminAnalytics({
    facility,
    tenants,
    leases,
    ledgerEntries,
    metrics: metrics
      ? {
          usableAreaSqFt: metrics.usableAreaSqFt,
          modeledSpaceAreaSqFt: metrics.modeledSpaceAreaSqFt,
          leasedAreaSqFt: metrics.leasedAreaSqFt,
          vacantAreaSqFt: metrics.vacantAreaSqFt,
          blockedAreaSqFt: metrics.blockedAreaSqFt,
          underRepairAreaSqFt: metrics.underRepairAreaSqFt,
          occupancyPercent: metrics.occupancyPercent,
        }
      : null,
    asOfDate,
  });
  const maintSummary = selectMaintSummary(maintenanceTasks);
  const charges = selectCharges(meterReadings);

  // Handlers
  const handleRegisterFacility = () => {
    try {
      const f = createFacility({
        id: `FAC-${Date.now()}`,
        code: reg.code || 'WH-1',
        name: reg.name,
        address: reg.address,
        city: reg.city,
        state: reg.state,
        gstin: reg.gstin || undefined,
        totalAreaSqFt: reg.totalArea,
        usableAreaSqFt: reg.usableArea,
        floors: reg.floors,
        ownershipType: reg.ownershipType,
        landlordName: reg.landlordName || undefined,
        landlordContact: reg.landlordContact || undefined,
      });
      setFacility(f);
      setTab('spaces');
      flash('Facility registered.');
    } catch (e) {
      flash((e as Error).message);
    }
  };

  const handleAddSpace = () => {
    if (!facility) {
      flash('Register a facility first.');
      return;
    }
    try {
      addSpace(facility, {
        id: `SP-${Date.now()}`,
        code: newSpace.code || `SP-${facility.spaces.length + 1}`,
        name: newSpace.name || newSpace.code,
        type: newSpace.type,
        floor: newSpace.floor,
        dimensions: { lengthFt: newSpace.lengthFt, widthFt: newSpace.widthFt },
        environmentalClass: newSpace.env,
        status: 'vacant',
        buildingName: newSpace.buildingName.trim() || undefined,
      });
      setFacility({ ...facility, spaces: [...facility.spaces] });
      setNewSpace({ code: '', name: '', buildingName: '', type: 'room', floor: 1, lengthFt: 0, widthFt: 0, env: 'ambient' });
      flash('Space added.');
    } catch (e) {
      flash((e as Error).message);
    }
  };

  const handleOnboardTenant = () => {
    if (!facility) {
      flash('Register a facility first.');
      return;
    }
    try {
      if (!newLease.spaceId) throw new Error('Select a space.');
      if (!newLease.start) throw new Error('Start date is required.');
      if (newLease.leaseType === 'fixed_term' && !newLease.end) throw new Error('End date is required for fixed-term leases.');
      if (newLease.end && newLease.start >= newLease.end) throw new Error('End date must be after start date.');
      if (newLease.rate <= 0) throw new Error('Rate must be positive.');
      let tenant: Tenant;
      if (newLease.tenantId) {
        const existing = tenants.find((t) => t.id === newLease.tenantId);
        if (!existing) throw new Error('Selected tenant not found.');
        tenant = existing;
      } else {
        if (!newTenant.name.trim()) throw new Error('Tenant name is required.');
        if (!newTenant.contactPerson.trim()) throw new Error('Contact person is required.');
        if (!newTenant.phone.trim()) throw new Error('Phone is required.');
        tenant = createTenant({
          id: `T-${Date.now()}`,
          name: newTenant.name,
          gstin: newTenant.gstin || undefined,
          contactPerson: newTenant.contactPerson,
          phone: newTenant.phone,
          address: newTenant.address,
          intendedUse: newTenant.intendedUse || undefined,
          commodityCategory: newTenant.commodityCategory,
        });
      }
      const space = facility.spaces.find((s) => s.id === newLease.spaceId);
      if (!space) throw new Error('Select a valid space.');
      // Soft compliance check: warn (do not block) if intended commodity needs a colder/hazmat class than the space provides.
      const commodity = newLease.commodityCategory || undefined;
      const spaceEnv = space.environmentalClass;
      const needsCold = commodity === 'frozen' || commodity === 'perishable';
      const needsHazmat = commodity === 'hazmat';
      let usageWarning = '';
      if (needsHazmat && spaceEnv !== 'hazmat') usageWarning = ' Warning: hazmat commodity in a non-hazmat space — verify compliance.';
      else if (needsCold && spaceEnv === 'ambient') usageWarning = ' Warning: cold commodity in an ambient space — verify temperature control.';
      const lease = createLease(
        {
          id: `LEASE-${Date.now()}`,
          facilityId: facility.id,
          spaceId: space.id,
          tenantId: tenant.id,
          leaseType: newLease.leaseType,
          agreementDate: newLease.agreementDate || undefined,
          depositDate: newLease.depositDate || undefined,
          startDate: newLease.start,
          billingStartDate: newLease.billingStart || undefined,
          endDate: newLease.end || undefined,
          billingCycleDay: newLease.billingCycleDay,
          billingUnit: newLease.billing,
          billingQuantity: newLease.billingQuantity ?? undefined,
          rate: newLease.rate,
          escalationPercentPerYear: newLease.escalation,
          depositAmount: newLease.deposit,
          intendedUse: newLease.intendedUse.trim() || undefined,
          commodityCategory: commodity,
        },
        space,
      );
      const billStart = lease.billingStartDate ?? lease.startDate;
      const billDate = new Date(billStart);
      const initialEntries = generateMonthlyRentLedgers({
        leases: [{ ...lease, status: 'active' }],
        periodYear: billDate.getFullYear(),
        periodMonth: billDate.getMonth() + 1,
        dueDayOfMonth: lease.billingCycleDay ?? 10,
      });
      allocateSpaceAndLease(facility, space.id, tenant.id, lease, newLease.start);
      if (!newLease.tenantId) setTenants((prev) => [...prev, tenant]);
      setLeases((prev) => [...prev, lease]);
      setLedgerEntries((prev) => [...prev, ...initialEntries]);
      setFacility({ ...facility, spaces: [...facility.spaces] });
      const wasExisting = !!newLease.tenantId;
      flash((wasExisting ? 'Additional space leased for existing tenant.' : 'Tenant onboarded and lease activated.') + usageWarning);
      setNewLease({ spaceId: '', tenantId: '', start: '', end: '', rate: 0, billing: 'sqft_month', billingQuantity: null, intendedUse: '', commodityCategory: '', deposit: 0, escalation: 0, leaseType: 'fixed_term', agreementDate: '', depositDate: '', billingStart: '', billingCycleDay: 10 });
      setNewTenant({ name: '', gstin: '', contactPerson: '', phone: '', address: '', intendedUse: '', commodityCategory: 'ambient_goods' });
    } catch (e) {
      flash((e as Error).message);
    }
  };

  const handleGenerateMonthly = () => {
    try {
      const newEntries = generateMonthlyRentLedgers({
        leases,
        periodYear: monthlyYear,
        periodMonth: monthlyMonth,
        dueDayOfMonth: 10,
        existingEntries: ledgerEntries,
      });
      if (newEntries.length === 0) {
        flash('No new ledger entries for that period (active leases may already be billed).');
        return;
      }
      setLedgerEntries((prev) => {
        const ids = new Set(prev.map((e) => e.id));
        return [...prev, ...newEntries.filter((e) => !ids.has(e.id))];
      });
      flash(`Generated ${newEntries.length} ledger entr${newEntries.length === 1 ? 'y' : 'ies'}.`);
    } catch (e) {
      flash((e as Error).message);
    }
  };

  const handleRecordPayment = () => {
    if (paymentActionPending.current) return;
    paymentActionPending.current = true;
    try {
      const entry = paymentEntryId ? ledgerEntries.find((e) => e.id === paymentEntryId) : undefined;
      if (!entry) {
        flash('Select a ledger entry to pay.');
        paymentActionPending.current = false;
        return;
      }
      const outstanding = Math.max(0, entry.totalDue - entry.amountPaid);
      const amt = paymentAmount;
      if (!Number.isFinite(amt) || amt <= 0 || outstanding <= 0) {
        flash('Enter a positive amount for an entry with an outstanding balance.');
        paymentActionPending.current = false;
        return;
      }
      const paidDate = paymentDate;
      const { result, receipt } = recordPaymentAndReceipt(entry.id, amt, paidDate);
      setPaymentAmount(0);
      flash(`Payment entered in this session (₹${result.applied} applied${result.overpaid > 0 ? `, ₹${result.overpaid} overpaid recorded` : ''}). Receipt ${receipt.receiptNumber}; check storage status.`);
    } catch (e) {
      paymentActionPending.current = false;
      flash((e as Error).message);
    }
  };

  const handleMaintenanceOpen = () => {
    if (!facility) {
      flash('Register a facility first.');
      return;
    }
    try {
      const t = createMaintenanceTask({
        id: `MT-${Date.now()}`,
        facilityId: facility.id,
        spaceId: newMaint.spaceId || undefined,
        category: newMaint.category,
        title: newMaint.title,
        description: newMaint.description,
        estimatedCost: newMaint.cost,
        reportedBy: 'owner',
      });
      setMaintenanceTasks((prev) => [...prev, t]);
      setNewMaint({ spaceId: '', category: 'roof', title: '', description: '', cost: 0 });
      flash('Maintenance task created.');
    } catch (e) {
      flash((e as Error).message);
    }
  };

  const handleMaintenanceStart = (id: string) => {
    const t = maintenanceTasks.find((m) => m.id === id);
    if (t && facility) {
      try {
        startMaintenance(t, facility);
        setFacility({ ...facility, spaces: [...facility.spaces] });
        setMaintenanceTasks((prev) => prev.map((m) => (m.id === t.id ? { ...t } : m)));
      } catch (e) {
        flash((e as Error).message);
      }
    }
  };

  const handleMaintenanceResolve = (id: string) => {
    const t = maintenanceTasks.find((m) => m.id === id);
    if (t && facility) {
      try {
        resolveMaintenance(t, facility, t.estimatedCost);
        setFacility({ ...facility, spaces: [...facility.spaces] });
        setMaintenanceTasks((prev) => [...prev]);
        flash('Resolved.');
      } catch (e) {
        flash((e as Error).message);
      }
    }
  };

  const handleMaintenanceCancel = (id: string) => {
    const t = maintenanceTasks.find((m) => m.id === id);
    if (t && facility) {
      try {
        cancelMaintenance(t, facility);
        setFacility({ ...facility, spaces: [...facility.spaces] });
        setMaintenanceTasks((prev) => prev.map((m) => (m.id === t.id ? { ...t } : m)));
      } catch (e) {
        flash((e as Error).message);
      }
    }
  };

  const handleMeterReading = () => {
    if (!newMeter.spaceId) {
      flash('Select a space.');
      return;
    }
    try {
      if (newMeter.kwh === null) throw new Error('Enter consumption in kWh.');
      const next = addMeterConsumption(meterReadings, { ...newMeter, kwh: newMeter.kwh });
      setMeterReadings(next);
      setNewMeter({ spaceId: '', kwh: null, periodStart: '', periodEnd: '' });
      setBillAllocation(null);
      flash('Period consumption recorded.');
    } catch (error) { flash((error as Error).message); }
  };

  const handleReset = async () => {
    const hasOperatingRecords = ledgerEntries.length > 0 || receipts.length > 0 || leases.length > 0 || tenants.length > 0;
    const confirmMsg = hasOperatingRecords
      ? 'Reset LOCAL P09 data on this device/browser? Operating records (tenants/leases/ledger/receipts) may be present. This cannot be undone here and does not replace an authorized backup/audit process. Continue?'
      : 'Reset local P09 data on this device/browser? This cannot be undone.';
    if (!window.confirm(confirmMsg)) return;
    const result = await reset();
    if (result.warnings.length > 0) {
      flash(`Reset incomplete: ${result.warnings.join(' ')}`);
    } else if (!result.localDeleted) {
      flash('Reset failed: local data could not be cleared.');
    } else {
      const serverNote = result.serverDeleted === true ? ' Server data cleared.' : result.serverDeleted === false ? ' Server data may remain (see warning).' : ' No server connection; server-side data not verified.';
      flash(`Local P09 data cleared.${serverNote}`);
    }
  };

  if (storageError) {
    return <div className="subproduct-root"><SuiteDock currentProductId="product-09-storage-leasing" /><main role="alert"><h1>Stored data needs review</h1><p>{storageError}</p><p>Both copies remain in place. Do not reset or replace either copy. Retry after the storage issue is resolved.</p><button type="button" onClick={() => window.location.reload()}>Retry reading</button></main></div>;
  }

  if (loading) {
    return (
      <div className="subproduct-root">
        <SuiteDock currentProductId="product-09-storage-leasing" />
        <div className="app-shell">
          <Text c="dimmed">Loading…</Text>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="subproduct-root">
        <SuiteDock currentProductId="product-09-storage-leasing" />
        <div className="app-shell">
          {storageSaveStatus && <p role="alert">{storageSaveStatus}</p>}
          <header className="app-header">
            <div className="app-header__title">
              <Title order={2}>Storage &amp; Leasing Core</Title>
              <Text size="sm" c="dimmed">Register your warehouse facility to begin.</Text>
            </div>
          </header>
          {flashMsg && (
            <div className="notice notice--info" role="status" aria-live="polite">
              {flashMsg}
            </div>
          )}
          <SectionCard title="Register Facility" subtitle="Property-level registration. Enter whole-site totals (usable sq ft is used for occupancy). Add individual rentable spaces (rooms/godowns/sheds/units) on the Spaces tab — you can model multiple godowns or buildings at the same location by adding separate spaces and setting a building/godown name on each.">
            <Stack gap="sm">
              <Group gap="sm" wrap="wrap">
                <TextInput
                  aria-label="Facility code"
                  placeholder="Code (e.g. WH-01)"
                  value={reg.code}
                  onChange={(e) => setReg({ ...reg, code: e.currentTarget.value })}
                />
                <TextInput
                  aria-label="Facility name"
                  placeholder="Facility name"
                  value={reg.name}
                  onChange={(e) => setReg({ ...reg, name: e.currentTarget.value })}
                />
                <TextInput
                  aria-label="Address"
                  placeholder="Address"
                  value={reg.address}
                  onChange={(e) => setReg({ ...reg, address: e.currentTarget.value })}
                />
                <TextInput
                  aria-label="City"
                  placeholder="City"
                  value={reg.city}
                  onChange={(e) => setReg({ ...reg, city: e.currentTarget.value })}
                />
                <TextInput
                  aria-label="State"
                  placeholder="State"
                  value={reg.state}
                  onChange={(e) => setReg({ ...reg, state: e.currentTarget.value })}
                />
                <TextInput
                  aria-label="Facility GSTIN (optional)"
                  placeholder="GSTIN (optional)"
                  value={reg.gstin}
                  onChange={(e) => setReg({ ...reg, gstin: e.currentTarget.value })}
                />
                <Select
                  aria-label="Ownership type"
                  data={OWNERSHIP_OPTIONS}
                  value={reg.ownershipType}
                  onChange={(v) => setReg({ ...reg, ownershipType: (v ?? 'owned') as 'owned' | 'leased_in' | 'managed' | 'sub_leased' | 'government' | 'cooperative' | 'franchise' })}
                />
              </Group>
              {reg.ownershipType === 'leased_in' && (
                <Group gap="sm" wrap="wrap">
                  <TextInput
                    aria-label="Landlord name"
                    placeholder="Landlord name"
                    value={reg.landlordName}
                    onChange={(e) => setReg({ ...reg, landlordName: e.currentTarget.value })}
                  />
                  <TextInput
                    aria-label="Landlord contact"
                    placeholder="Landlord contact"
                    value={reg.landlordContact}
                    onChange={(e) => setReg({ ...reg, landlordContact: e.currentTarget.value })}
                  />
                </Group>
              )}
              <Text size="xs" c="dimmed">
                Property totals are independent of individual spaces. After registration, compare them with the sum of modeled spaces in Overview; if they differ, adjust totals or add/update spaces so occupancy is meaningful.
              </Text>
              <Group gap="sm" wrap="wrap" align="flex-end">
                <NumberInput
                  aria-label="Total square feet (property)"
                  label="Total sq ft (property)"
                  placeholder="Total sq ft"
                  value={reg.totalArea}
                  onChange={(v) => setReg({ ...reg, totalArea: Number(v) || 0 })}
                  min={0}
                  w={160}
                />
                <NumberInput
                  aria-label="Usable square feet (property)"
                  label="Usable sq ft (property)"
                  placeholder="Usable sq ft"
                  value={reg.usableArea}
                  onChange={(v) => setReg({ ...reg, usableArea: Number(v) || 0 })}
                  min={0}
                  w={160}
                />
                <NumberInput
                  aria-label="Number of floors"
                  label="Floors"
                  placeholder="Floors"
                  value={reg.floors}
                  onChange={(v) => setReg({ ...reg, floors: Number(v) || 1 })}
                  min={1}
                  w={90}
                />
                <Button color="teal" onClick={handleRegisterFacility}>
                  Register
                </Button>
              </Group>
            </Stack>
          </SectionCard>
        </div>
      </div>
    );
  }

  const overdueEntries = ledgerEntries.filter((e) => {
    if (paymentStatusAsOf(e, asOfDate) !== 'overdue') return false;
    const out = Math.max(0, e.totalDue - e.amountPaid);
    return out > 0 && e.dueDate.slice(0, 10) < asOfDate.slice(0, 10);
  });
  const vacantSpaces = facility?.spaces.filter((s) => s.status === 'vacant') ?? [];
  const openMaintTasks = maintenanceTasks.filter((t) => t.status === 'open' || t.status === 'in_progress');
  const expiringLeases = leases.filter((l) => {
    if (l.status !== 'active' || !l.endDate) return false;
    const days = Math.floor((Date.parse(l.endDate.slice(0, 10)) - Date.parse(asOfDate)) / 86400000);
    return days >= 0 && days <= 30;
  });
  const recentEvents = [...events].slice(-5).reverse();
  const tenantNameById = new Map(tenants.map((t) => [t.id, t.name]));
  const spaceCodeById = new Map((facility?.spaces ?? []).map((s) => [s.id, s.code]));
  const actionableLedgerEntries = ledgerEntries.filter((e) => paymentStatusAsOf(e, asOfDate) !== 'unknown' && Math.max(0, e.totalDue - e.amountPaid) > 0);
  const selectedPaymentEntry = paymentEntryId ? ledgerEntries.find((e) => e.id === paymentEntryId) ?? null : null;
  const selectedPaymentOutstanding = selectedPaymentEntry ? Math.max(0, selectedPaymentEntry.totalDue - selectedPaymentEntry.amountPaid) : 0;
  const filteredLedgerEntries = ledgerEntries.filter((e) => {
    if (ledgerFilter === 'all') return true;
    return paymentStatusAsOf(e, asOfDate) === ledgerFilter;
  });
  const agingAmount = (label: typeof analytics.receivablesAging.buckets[number]['label']) => analytics.receivablesAging.buckets.find(bucket => bucket.label === label)?.amount ?? 0;

  return (
    <div className="subproduct-root">
      <SuiteDock currentProductId="product-09-storage-leasing" />
      {resetting && <p role="status">Reset in progress. Editing is temporarily unavailable.</p>}
      <div className="app-shell" inert={resetting || undefined} aria-busy={resetting}>
        {storageSaveStatus && <p role="alert">{storageSaveStatus}</p>}
        <header className="app-header">
          <div className="app-header__title">
            <div className="brand-mark">P09 · Storage &amp; Leasing</div>
            <Title order={2}>Storage &amp; Leasing Core</Title>
            <Text size="sm" c="dimmed">
              {facility.name} · {facility.city}, {facility.state} · {facility.spaces.length} spaces
            </Text>
          </div>
          <Group className="app-header__actions" gap="sm">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={handleReset}
            >
              Reset data
            </Button>
          </Group>
        </header>

        {flashMsg && (
          <div className="notice notice--info" role="status" aria-live="polite">
            {flashMsg}
          </div>
        )}

        <Tabs value={tab} onChange={(v) => setTab((v ?? 'overview') as typeof tab)}>
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="spaces">Spaces</Tabs.Tab>
            <Tabs.Tab value="leases">Leases</Tabs.Tab>
            <Tabs.Tab value="ledger">Ledger</Tabs.Tab>
            <Tabs.Tab value="maintenance">Maintenance</Tabs.Tab>
            <Tabs.Tab value="meters">Meters</Tabs.Tab>
            <Tabs.Tab value="analytics">Analytics</Tabs.Tab>
            <Tabs.Tab value="audit">Audit log</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Stack gap="md">
              <div className="kpi-row">
                <StatCard label="Facility usable (property)" value={sqft(metrics?.usableAreaSqFt ?? 0)} />
                <StatCard label="Sum of modeled spaces" value={sqft(metrics?.modeledSpaceAreaSqFt ?? 0)} />
                <StatCard label="Occupied sq ft" value={sqft(metrics?.leasedAreaSqFt ?? 0)} />
                <StatCard
                  label="Occupancy"
                  value={
                    facility.usableAreaSqFt <= 0
                      ? 'Unavailable'
                      : pct(metrics?.occupancyPercent ?? 0)
                  }
                  hint={
                    facility.usableAreaSqFt <= 0
                      ? 'Configure facility usable area'
                      : undefined
                  }
                />
                <StatCard
                  label={`Billed (periods starting ${asOfMonth})`}
                  value={<Money value={Math.round(billedInAsOfMonth * 100) / 100} />}
                  tone="money"
                  hint="Sum of ledger totalDue for entries whose period starts in as-of month"
                />
                <StatCard
                  label={`Overdue outstanding (as of ${dateShort(asOfDate)})`}
                  value={<Money value={Math.round(overdueAsOf * 100) / 100} />}
                  tone="danger"
                  hint="Past-due unpaid balance by date (not persisted status alone)"
                />
              </div>
              {metrics && facility.usableAreaSqFt > 0 && metrics.usableAreaSqFt !== metrics.modeledSpaceAreaSqFt && (
                <Group gap="xs" align="center" wrap="wrap">
                  <Text size="xs" c="dimmed">
                    Property usable {sqft(facility.usableAreaSqFt)} differs from modeled spaces {sqft(metrics.modeledSpaceAreaSqFt)} (occupancy uses property usable).
                  </Text>
                  {metrics.modeledSpaceAreaSqFt > 0 && (
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="gray"
                      onClick={() => {
                        const newUsable = metrics.modeledSpaceAreaSqFt;
                        const newTotal = Math.max(facility.totalAreaSqFt, newUsable);
                        setFacility({ ...facility, usableAreaSqFt: newUsable, totalAreaSqFt: newTotal });
                        flash('Facility usable updated to sum of modeled spaces.');
                      }}
                    >
                      Align usable to modeled
                    </Button>
                  )}
                </Group>
              )}

              <SectionCard
                title="Operations cockpit"
                subtitle={`As-of ${dateShort(asOfDate)}. Actionable queues derived from current leases, ledger, maintenance, and audit events (read-only navigation).`}
              >
                <div className="kpi-row">
                  <StatCard label="Overdue entries (as of)" value={overdueCountAsOf} tone={overdueCountAsOf > 0 ? 'danger' : 'default'} />
                  <StatCard label="Vacant spaces" value={vacantSpaces.length} />
                  <StatCard label="Open/in-progress maintenance" value={openMaintTasks.length} />
                  <StatCard label="Leases expiring (30d)" value={expiringLeases.length} />
                </div>
                <Group mt="md" gap="sm" wrap="wrap">
                  <Button size="xs" variant="light" onClick={() => setTab('ledger')} disabled={ledgerEntries.length === 0}>Go to Ledger</Button>
                  <Button size="xs" variant="light" onClick={() => setTab('spaces')}>Go to Spaces</Button>
                  <Button size="xs" variant="light" onClick={() => setTab('maintenance')} disabled={maintenanceTasks.length === 0 && !facility}>Go to Maintenance</Button>
                  <Button size="xs" variant="light" onClick={() => setTab('leases')} disabled={leases.length === 0}>Go to Leases</Button>
                  <Button size="xs" variant="light" onClick={() => setTab('audit')}>Go to Audit log</Button>
                </Group>

                {overdueEntries.length > 0 && (
                  <Stack gap={4} mt="md">
                    <Text size="sm" fw={600}>Overdue queue (top 5)</Text>
                    {overdueEntries.slice(0, 5).map((e) => (
                      <Text key={e.id} size="sm">
                        <strong>{spaceCodeById.get(e.spaceId) ?? e.spaceId}</strong> · {tenantNameById.get(e.tenantId) ?? e.tenantId} · due {dateShort(e.dueDate)} · <Money value={Math.max(0, e.totalDue - e.amountPaid)} /> outstanding
                      </Text>
                    ))}
                    {overdueEntries.length > 5 && <Text size="xs" c="dimmed">+{overdueEntries.length - 5} more in Ledger.</Text>}
                  </Stack>
                )}

                {vacantSpaces.length > 0 && (
                  <Stack gap={4} mt="md">
                    <Text size="sm" fw={600}>Vacant spaces (top 5)</Text>
                    <Text size="sm" c="dimmed">
                      {vacantSpaces.slice(0, 5).map((s) => `${s.code}${s.buildingName ? ` (${s.buildingName})` : ''}`).join(' · ')}
                      {vacantSpaces.length > 5 ? ` · +${vacantSpaces.length - 5} more` : ''}
                    </Text>
                  </Stack>
                )}

                {expiringLeases.length > 0 && (
                  <Stack gap={4} mt="md">
                    <Text size="sm" fw={600}>Leases ending within 30 days</Text>
                    {expiringLeases.slice(0, 5).map((l) => (
                      <Text key={l.id} size="sm">
                        {spaceCodeById.get(l.spaceId) ?? l.spaceId} · {tenantNameById.get(l.tenantId) ?? l.tenantId} · ends {l.endDate ? dateShort(l.endDate) : '—'}
                      </Text>
                    ))}
                  </Stack>
                )}

                {recentEvents.length > 0 && (
                  <Stack gap={4} mt="md">
                    <Text size="sm" fw={600}>Recent audit events</Text>
                    {recentEvents.map((ev) => (
                      <Text key={ev.eventId} size="xs" c="dimmed">{new Date(ev.eventTime).toLocaleString()} · {ev.eventType}</Text>
                    ))}
                  </Stack>
                )}
              </SectionCard>

              {receipts.length > 0 && (
                <SectionCard title="Receipts Issued">
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {receipts.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {facility.spaces.length === 0 && (
                <EmptyState
                  title="No spaces yet"
                  hint="Add your first rentable space on the Spaces tab. Spaces drive occupancy, leasing, and electricity charges."
                  action="Go to Spaces"
                  onAction={() => setTab('spaces')}
                />
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="spaces" pt="md">
            <Stack gap="md">
              <SectionCard title="Add Space" subtitle="Define a rentable space in the facility. To model separate godowns/buildings at the same location, add spaces with type Godown/Shed and set a Building/Godown name for grouping.">
                <Stack gap="sm">
                  <Group gap="sm" wrap="wrap">
                    <TextInput
                      aria-label="Space code"
                      placeholder="Code"
                      value={newSpace.code}
                      onChange={(e) => setNewSpace({ ...newSpace, code: e.currentTarget.value })}
                    />
                    <TextInput
                      aria-label="Space name"
                      placeholder="Name"
                      value={newSpace.name}
                      onChange={(e) => setNewSpace({ ...newSpace, name: e.currentTarget.value })}
                    />
                    <TextInput
                      aria-label="Building or godown name (optional)"
                      placeholder="Building/Godown (optional)"
                      value={newSpace.buildingName}
                      onChange={(e) => setNewSpace({ ...newSpace, buildingName: e.currentTarget.value })}
                    />
                    <Select
                      aria-label="Space type"
                      data={SPACE_TYPE_OPTIONS}
                      value={newSpace.type}
                      onChange={(v) => setNewSpace({ ...newSpace, type: (v ?? 'room') as RentableSpace['type'] })}
                    />
                    <NumberInput
                      aria-label="Length in feet"
                      placeholder="L (ft)"
                      value={newSpace.lengthFt || ''}
                      onChange={(v) => setNewSpace({ ...newSpace, lengthFt: Number(v) || 0 })}
                      min={0}
                      w={80}
                    />
                    <NumberInput
                      aria-label="Width in feet"
                      placeholder="W (ft)"
                      value={newSpace.widthFt || ''}
                      onChange={(v) => setNewSpace({ ...newSpace, widthFt: Number(v) || 0 })}
                      min={0}
                      w={80}
                    />
                    <Select
                      aria-label="Environmental class"
                      data={ENV_OPTIONS}
                      value={newSpace.env}
                      onChange={(v) => setNewSpace({ ...newSpace, env: (v ?? 'ambient') as RentableSpace['environmentalClass'] })}
                    />
                    <Button color="teal" onClick={handleAddSpace}>
                      Add Space
                    </Button>
                  </Group>
                </Stack>
              </SectionCard>

              <SectionCard
                title="Facility Spaces"
                subtitle={
                  metrics
                    ? facility.usableAreaSqFt <= 0
                      ? 'Occupancy unavailable: facility usable area not configured (see Overview).'
                      : `Utilization: ${metrics.occupancyPercent ?? 0}% leased (property usable area basis).`
                    : undefined
                }
              >
                {facility.spaces.length === 0 ? (
                  <EmptyState title="No spaces yet" hint="Define your first rentable space above. Spaces drive occupancy, leasing, and electricity charges." />
                ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Name</th>
                        <th scope="col">Building/Godown</th>
                        <th scope="col">Type</th>
                        <th scope="col" style={{ textAlign: 'right' }}>Area</th>
                        <th scope="col">Status</th>
                        <th scope="col">Tenant</th>
                        <th scope="col">Env</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facility.spaces.map((s: RentableSpace) => (
                        <tr key={s.id}>
                          <td className="mono">{s.code}</td>
                          <td>{s.name}</td>
                          <td>{s.buildingName || '—'}</td>
                          <td>{s.type}</td>
                          <td style={{ textAlign: 'right' }} className="num">{s.areaSqFt}</td>
                          <td>
                            <StatusBadge
                              tone={
                                s.status === 'leased'
                                  ? 'info'
                                  : s.status === 'vacant'
                                  ? 'success'
                                  : s.status === 'blocked'
                                  ? 'danger'
                                  : 'neutral'
                              }
                            >
                              {s.status}
                            </StatusBadge>
                          </td>
                          <td>
                            {(() => {
                              const l = leases.find((x) => x.spaceId === s.id && (x.status === 'active' || x.status === 'draft'));
                              const t = l ? tenants.find((x) => x.id === l.tenantId) : undefined;
                              return t ? t.name : '—';
                            })()}
                          </td>
                          <td>{s.environmentalClass}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="leases" pt="md">
            <Stack gap="md">
              <SectionCard title="Onboard Tenant &amp; Create Lease">
                <Stack gap="sm">
                  <Group gap="sm" wrap="wrap">
                    <Select
                      aria-label="Tenant"
                      placeholder="New tenant, or pick existing"
                      data={[
                        { value: '', label: '— New tenant —' },
                        ...tenants.map((t) => ({ value: t.id, label: `${t.name}${t.gstin ? ` (${t.gstin})` : ''}` })),
                      ]}
                      value={newLease.tenantId || null}
                      onChange={(v) => setNewLease({ ...newLease, tenantId: v ?? '' })}
                    />
                  </Group>
                  {newLease.tenantId === '' && (
                  <Group gap="sm" wrap="wrap">
                    <TextInput
                      aria-label="Tenant name"
                      placeholder="Tenant name"
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({ ...newTenant, name: e.currentTarget.value })}
                    />
                    <TextInput
                      aria-label="GSTIN (optional)"
                      placeholder="GSTIN (optional)"
                      value={newTenant.gstin}
                      onChange={(e) => setNewTenant({ ...newTenant, gstin: e.currentTarget.value })}
                    />
                    <TextInput
                      aria-label="Contact person"
                      placeholder="Contact person"
                      value={newTenant.contactPerson}
                      onChange={(e) => setNewTenant({ ...newTenant, contactPerson: e.currentTarget.value })}
                    />
                    <TextInput
                      aria-label="Phone number"
                      placeholder="Phone"
                      value={newTenant.phone}
                      onChange={(e) => setNewTenant({ ...newTenant, phone: e.currentTarget.value })}
                    />
                    <TextInput
                      aria-label="Address"
                      placeholder="Address"
                      value={newTenant.address}
                      onChange={(e) => setNewTenant({ ...newTenant, address: e.currentTarget.value })}
                    />
                    <TextInput
                      aria-label="Intended use"
                      placeholder="What will tenant store/use?"
                      value={newTenant.intendedUse}
                      onChange={(e) => setNewTenant({ ...newTenant, intendedUse: e.currentTarget.value })}
                    />
                    <Select
                      aria-label="Commodity category"
                      data={COMMODITY_OPTIONS}
                      value={newTenant.commodityCategory}
                      onChange={(v) => setNewTenant({ ...newTenant, commodityCategory: (v ?? 'other') as CommodityCategory })}
                    />
                  </Group>
                  )}
                  <Group gap="sm" wrap="wrap">
                    <Select
                      aria-label="Select vacant space"
                      placeholder="Select vacant space"
                      data={facility.spaces
                        .filter((s) => s.status === 'vacant' || s.status === 'temporarily_reserved')
                        .map((s) => ({ value: s.id, label: `${s.code} (${s.areaSqFt} sq ft)` }))}
                      value={newLease.spaceId || null}
                      onChange={(v) => setNewLease({ ...newLease, spaceId: v ?? '' })}
                    />
                    <Select
                      aria-label="Lease type"
                      data={[
                        { value: 'fixed_term', label: 'Fixed term' },
                        { value: 'month_to_month', label: 'Month-to-month' },
                        { value: 'indefinite', label: 'Indefinite' },
                      ]}
                      value={newLease.leaseType}
                      onChange={(v) => setNewLease({ ...newLease, leaseType: (v ?? 'fixed_term') as Lease['leaseType'] })}
                    />
                    <TextInput
                      type="date"
                      aria-label="Agreement date"
                      placeholder="Agreement date"
                      value={newLease.agreementDate}
                      onChange={(e) => setNewLease({ ...newLease, agreementDate: e.currentTarget.value })}
                    />
                    <TextInput
                      type="date"
                      aria-label="Deposit date"
                      placeholder="Deposit date"
                      value={newLease.depositDate}
                      onChange={(e) => setNewLease({ ...newLease, depositDate: e.currentTarget.value })}
                    />
                    <TextInput
                      type="date"
                      aria-label="Lease start"
                      value={newLease.start}
                      onChange={(e) => setNewLease({ ...newLease, start: e.currentTarget.value })}
                    />
                    <TextInput
                      type="date"
                      aria-label="Billing start"
                      placeholder="Billing start"
                      value={newLease.billingStart}
                      onChange={(e) => setNewLease({ ...newLease, billingStart: e.currentTarget.value })}
                    />
                    <TextInput
                      type="date"
                      aria-label="Lease end"
                      value={newLease.end}
                      onChange={(e) => setNewLease({ ...newLease, end: e.currentTarget.value })}
                    />
                    <NumberInput
                      aria-label="Lease rate"
                      placeholder="Rate"
                      value={newLease.rate || ''}
                      onChange={(v) => setNewLease({ ...newLease, rate: Number(v) || 0 })}
                      min={0}
                      w={90}
                    />
                    <Select
                      aria-label="Billing unit"
                      data={BILLING_OPTIONS}
                      value={newLease.billing}
                      onChange={(v) => setNewLease({ ...newLease, billing: (v ?? 'sqft_month') as Lease['billingUnit'] })}
                    />
                    {newLease.billing !== 'sqft_month' && newLease.billing !== 'fixed' && newLease.billing !== 'revenue_share' && <NumberInput
                      aria-label="Billing quantity"
                      placeholder="Billing quantity"
                      value={newLease.billingQuantity ?? ''}
                      onChange={(v) => setNewLease({ ...newLease, billingQuantity: v === '' ? null : Number(v) })}
                      min={0}
                    />}
                    <TextInput aria-label="Lease intended use" placeholder="Use for this lease (optional)" value={newLease.intendedUse} onChange={(e) => setNewLease({ ...newLease, intendedUse: e.currentTarget.value })} />
                    <Select aria-label="Lease commodity category" placeholder="Commodity unknown" clearable data={COMMODITY_OPTIONS} value={newLease.commodityCategory || null} onChange={(v) => setNewLease({ ...newLease, commodityCategory: (v ?? '') as CommodityCategory | '' })} />
                    {newLease.billing === 'revenue_share' && <Text size="sm">Revenue-share billing needs actual revenue and an agreed calculation policy. Automatic ledger generation is unavailable.</Text>}
                    <NumberInput
                      aria-label="Security deposit"
                      placeholder="Deposit"
                      value={newLease.deposit || ''}
                      onChange={(v) => setNewLease({ ...newLease, deposit: Number(v) || 0 })}
                      min={0}
                      w={100}
                    />
                    <NumberInput
                      aria-label="Escalation percentage"
                      placeholder="Escalation %"
                      value={newLease.escalation || ''}
                      onChange={(v) => setNewLease({ ...newLease, escalation: Number(v) || 0 })}
                      min={0}
                      w={100}
                    />
                    <Button color="teal" onClick={handleOnboardTenant}>
                      Onboard &amp; Lease
                    </Button>
                  </Group>
                  {(newLease.agreementDate || newLease.start || newLease.billingStart || newLease.end) && (
                    <SectionCard title="Lease lifecycle preview (review before creating)" subtitle="Dates and billing terms as entered. No ledger proration amount is computed here because the proration formula is a deferred decision.">
                      <Stack gap={4}>
                        <Text size="sm"><strong>Agreement:</strong> {newLease.agreementDate ? dateShort(newLease.agreementDate) : '—'} · <strong>Possession/start:</strong> {newLease.start ? dateShort(newLease.start) : '—'} · <strong>Billing starts:</strong> {(newLease.billingStart || newLease.start) ? dateShort(newLease.billingStart || newLease.start) : '—'}{newLease.billingStart && newLease.start && newLease.billingStart !== newLease.start ? ' (differs from start)' : ''}</Text>
                        <Text size="sm"><strong>End:</strong> {newLease.leaseType === 'indefinite' ? 'Indefinite (no fixed end)' : (newLease.end ? dateShort(newLease.end) : '—')} · <strong>Type:</strong> {newLease.leaseType} · <strong>Billing cycle day:</strong> {newLease.billingCycleDay}</Text>
                        <Text size="sm"><strong>Rate:</strong> <Money value={newLease.rate || 0} /> / {BILLING_OPTIONS.find((o) => o.value === newLease.billing)?.label ?? newLease.billing} · <strong>Deposit:</strong> <Money value={newLease.deposit || 0} /> (liability until refunded/adjusted) · <strong>Escalation:</strong> {newLease.escalation || 0}%/yr</Text>
                        {newLease.billingStart && newLease.start && newLease.billingStart !== newLease.start ? (
                          <Text size="xs" c="dimmed">Billing start differs from possession/start. Any partial-period treatment requires an explicit proration formula decision; this preview does not calculate a prorated amount.</Text>
                        ) : null}
                      </Stack>
                    </SectionCard>
                  )}
                </Stack>
              </SectionCard>

              <SectionCard title={`Tenants (${tenants.length})`}>
                {tenants.length === 0 ? (
                  <EmptyState title="No tenants yet" hint="Onboard one above." />
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {tenants.map((t) => (
                      <li key={t.id} style={{ marginBottom: 4 }}>
                        {t.name} {t.gstin ? `(${t.gstin})` : ''} — {t.phone} {t.address ? `· ${t.address}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title={`Leases (${leases.length})`}>
                {leases.length === 0 ? (
                  <EmptyState title="No leases yet" hint="Create one above." />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th scope="col">Lease</th>
                          <th scope="col">Tenant</th>
                          <th scope="col">Space</th>
                          <th scope="col">Period</th>
                          <th scope="col">Status</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Rate</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Deposit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leases.map((l) => (
                          <tr key={l.id}>
                            <td className="mono">{l.id.slice(0, 14)}</td>
                            <td>{tenants.find((t) => t.id === l.tenantId)?.name ?? l.tenantId}</td>
                            <td>{l.spaceId}</td>
                            <td>
                              {dateShort(l.startDate)} → {l.endDate ? dateShort(l.endDate) : 'Indefinite'}
                            </td>
                            <td>
                              <StatusBadge tone={l.status === 'active' ? 'success' : l.status === 'expired' ? 'danger' : 'neutral'}>
                                {l.status}
                              </StatusBadge>
                            </td>
                            <td style={{ textAlign: 'right' }} className="money">
                              ₹{l.rate}/{l.billingUnit}
                            </td>
                            <td style={{ textAlign: 'right' }} className="money">
                              ₹{l.depositAmount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {leases.length > 0 && (
                  <Text size="sm" c="dimmed" mt="sm">
                    Renewal preview:{' '}
                    {(() => {
                      try {
                        const p = previewRenewal(leases[0], '2027-11-01', '2028-10-31', leases[0].rate * 1.05, leases[0].escalationPercentPerYear + 1);
                        return `new rate ₹${p.newRate}, escalation ${p.escalation}%`;
                      } catch {
                        return 'n/a';
                      }
                    })()}
                  </Text>
                )}
              </SectionCard>

              {tenants.length > 0 && (
                <SectionCard title={`Tenants & their spaces (${tenants.length})`}>
                  <Stack gap="sm">
                    {tenants.map((t) => {
                      const tLeases = leases.filter((l) => l.tenantId === t.id);
                      const totalRent = tLeases.reduce((s, l) => s + (l.rate || 0), 0);
                      const isEditing = editingTenantId === t.id;
                      const commodityLabel = COMMODITY_OPTIONS.find((o) => o.value === (t.commodityCategory ?? 'other'))?.label ?? t.commodityCategory ?? 'Other';
                      return (
                        <div
                          key={t.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            border: '1px solid var(--p09-border)',
                            background: 'var(--p09-bg-1)',
                          }}
                        >
                          <Group justify="space-between" wrap="wrap" align="flex-start">
                            <div style={{ flex: 1, minWidth: 220 }}>
                              <Text fw={600} size="sm">
                                {t.name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {t.contactPerson} · {t.phone}
                                {t.gstin ? ` · GSTIN ${t.gstin}` : ''}
                              </Text>
                              {!isEditing && (
                                <Text size="xs" c="dimmed" mt={4}>
                                  Using for: {t.intendedUse || '—'} · Stored: {commodityLabel}
                                </Text>
                              )}
                            </div>
                            <Group gap="xs">
                              <StatusBadge tone="info">{tLeases.length} space{tLeases.length === 1 ? '' : 's'}</StatusBadge>
                              {totalRent > 0 && <Money value={totalRent} />}
                              {!isEditing ? (
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => {
                                    setEditingTenantId(t.id);
                                    setEditTenantUse(t.intendedUse ?? '');
                                    setEditTenantCommodity(t.commodityCategory ?? 'ambient_goods');
                                  }}
                                >
                                  Edit usage
                                </Button>
                              ) : null}
                            </Group>
                          </Group>
                          {isEditing && (
                            <Stack gap="xs" mt="sm">
                              <Group gap="sm" wrap="wrap" align="flex-end">
                                <TextInput
                                  label="What's being stored / used for"
                                  placeholder="e.g. FMCG cartons, auto parts, documents"
                                  value={editTenantUse}
                                  onChange={(e) => setEditTenantUse(e.currentTarget.value)}
                                  style={{ flex: 1, minWidth: 220 }}
                                />
                                <Select
                                  label="Commodity category"
                                  data={COMMODITY_OPTIONS}
                                  value={editTenantCommodity}
                                  onChange={(v) => setEditTenantCommodity((v ?? 'other') as CommodityCategory)}
                                  style={{ minWidth: 180 }}
                                />
                              </Group>
                              <Group gap="xs">
                                <Button
                                  size="xs"
                                  onClick={() => {
                                    setTenants((prev) =>
                                      prev.map((x) =>
                                        x.id === t.id
                                          ? { ...x, intendedUse: editTenantUse.trim() || undefined, commodityCategory: editTenantCommodity }
                                          : x,
                                      ),
                                    );
                                    setEditingTenantId(null);
                                    flash('Tenant usage updated.');
                                  }}
                                >
                                  Save
                                </Button>
                                <Button size="xs" variant="default" onClick={() => setEditingTenantId(null)}>
                                  Cancel
                                </Button>
                              </Group>
                            </Stack>
                          )}
                          {tLeases.length > 0 ? (
                            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12 }}>
                              {tLeases.map((l) => {
                                const space = facility.spaces.find((s) => s.id === l.spaceId);
                                return (
                                  <li key={l.id}>
                                    {space ? `${space.code} (${space.areaSqFt} sq ft)` : l.spaceId} · {l.billingUnit} · ₹{l.rate} ·{' '}
                                    <StatusBadge tone={l.status === 'active' ? 'success' : l.status === 'expired' ? 'danger' : 'neutral'}>
                                      {l.status}
                                    </StatusBadge>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <Text size="xs" c="dimmed" mt={6}>
                              No spaces leased yet.
                            </Text>
                          )}
                        </div>
                      );
                    })}
                  </Stack>
                </SectionCard>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="ledger" pt="md">
            <Stack gap="md">
              <SectionCard
                title="Rent Ledger / Receivables"
                subtitle={`All recorded ledger entries (all periods): billed ${inr(rentSummaryAll.totalDue)} · paid ${inr(rentSummaryAll.totalPaid)} · outstanding ${inr(Math.max(0, rentSummaryAll.totalDue - rentSummaryAll.totalPaid))} · overdue count ${overdueCountAsOf}. Status uses current balances and browser-local date ${asOfDate}; it is not a historical balance reconstruction.`}
              >
                <Stack gap="sm">
                  <Group gap="sm" wrap="wrap">
                    <Badge variant="light" color="gray">Not yet due (outstanding): <Money value={agingAmount('current')} /></Badge>
                    <Badge variant="light" color="yellow">1–30d: <Money value={agingAmount('1-30')} /></Badge>
                    <Badge variant="light" color="orange">31–60d: <Money value={agingAmount('31-60')} /></Badge>
                    <Badge variant="light" color="red">61–90d: <Money value={agingAmount('61-90')} /></Badge>
                    <Badge variant="light" color="red">90+d: <Money value={agingAmount('90+')} /></Badge>
                    <Badge variant="light" color="gray">Needs review: <Money value={agingAmount('unknown')} /></Badge>
                  </Group>
                  <Group gap="sm" wrap="wrap" align="flex-end">
                    <NumberInput aria-label="Year" placeholder="Year" value={monthlyYear} onChange={(v) => setMonthlyYear(Number(v) || monthlyYear)} w={80} />
                    <NumberInput aria-label="Month" placeholder="Month" value={monthlyMonth} onChange={(v) => setMonthlyMonth(Number(v) || monthlyMonth)} w={70} />
                    <Button variant="default" onClick={handleGenerateMonthly}>Generate Monthly</Button>
                    <Select
                      aria-label="Ledger filter"
                      placeholder="Filter entries"
                      data={[
                        { value: 'all', label: 'All entries' },
                        { value: 'overdue', label: 'Overdue' },
                        { value: 'partial', label: 'Partial' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'paid', label: 'Paid' },
                        { value: 'unknown', label: 'Needs review' },
                      ]}
                      value={ledgerFilter}
                      onChange={(v) => setLedgerFilter((v as typeof ledgerFilter) ?? 'all')}
                      w={150}
                    />
                  </Group>
                  <Group gap="sm" wrap="wrap" align="flex-end">
                    <Select
                      aria-label="Select ledger entry to pay"
                      placeholder="Select entry (actionable)"
                      data={actionableLedgerEntries.map((e) => ({
                        value: e.id,
                        label: `${spaceCodeById.get(e.spaceId) ?? e.spaceId.slice(0, 8)} · ${tenantNameById.get(e.tenantId) ?? e.tenantId.slice(0, 8)} · ₹${Math.max(0, e.totalDue - e.amountPaid)} due`,
                      }))}
                      value={paymentEntryId || null}
                      onChange={(v) => {
                        const id = v ?? '';
                        setPaymentEntryId(id);
                        const entry = id ? ledgerEntries.find((x) => x.id === id) : null;
                        if (entry && paymentAmount <= 0) setPaymentAmount(Math.max(0, entry.totalDue - entry.amountPaid));
                      }}
                      w={320}
                    />
                    <NumberInput aria-label="Payment amount" placeholder="Amount" value={paymentAmount || ''} onChange={(v) => setPaymentAmount(Number(v) || 0)} w={120} min={0} />
                    <TextInput type="date" label="Payment date" description="Defaults to browser-local date; verify before recording." value={paymentDate} onChange={(e) => setPaymentDate(e.currentTarget.value)} />
                    <Button variant="light" onClick={() => selectedPaymentEntry && setPaymentAmount(selectedPaymentOutstanding)} disabled={!selectedPaymentEntry}>
                      Fill remaining {selectedPaymentEntry ? `(₹${selectedPaymentOutstanding})` : ''}
                    </Button>
                    <Button color="green" onClick={handleRecordPayment}>Record Payment + Receipt</Button>
                  </Group>
                  {selectedPaymentEntry && (
                    <Text size="xs" c="dimmed">
                      Selected: {selectedPaymentEntry.id.slice(0, 14)} · due {dateShort(selectedPaymentEntry.dueDate)} · total ₹{selectedPaymentEntry.totalDue} · paid ₹{selectedPaymentEntry.amountPaid} · outstanding ₹{selectedPaymentOutstanding}
                    </Text>
                  )}
                </Stack>
              </SectionCard>

              <SectionCard title={`Entries (${filteredLedgerEntries.length}${ledgerFilter !== 'all' ? ` of ${ledgerEntries.length}` : ''})`}>
                {ledgerEntries.length === 0 ? (
                  <EmptyState title="No ledger entries" hint="Onboard a tenant on the Leases tab or generate monthly." />
                ) : filteredLedgerEntries.length === 0 ? (
                  <EmptyState title="No entries for this filter" hint="Change the filter to view other ledger entries." />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th scope="col">ID</th>
                          <th scope="col">Tenant/Space</th>
                          <th scope="col">Period</th>
                          <th scope="col">Due date</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Base</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Elec</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Total</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Paid</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Outstanding</th>
                          <th scope="col">Status</th>
                          <th scope="col">Action</th>
                          <th scope="col">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLedgerEntries.map((e) => {
                          const outstanding = Math.max(0, e.totalDue - e.amountPaid);
                          const currentStatus = paymentStatusAsOf(e, asOfDate);
                          const daysOver = Math.floor((Date.parse(asOfDate) - Date.parse(e.dueDate.slice(0, 10))) / 86400000);
                          return (
                          <tr key={e.id}>
                            <td className="mono">{e.id.slice(0, 14)}</td>
                            <td>
                              <div>{tenantNameById.get(e.tenantId) ?? e.tenantId.slice(0, 8)}</div>
                              <Text size="xs" c="dimmed">{spaceCodeById.get(e.spaceId) ?? e.spaceId.slice(0, 8)}</Text>
                            </td>
                            <td>{e.periodStart}→{e.periodEnd}</td>
                            <td>{dateShort(e.dueDate)}{daysOver > 0 && outstanding > 0 ? <Text span size="xs" c="red"> ({daysOver}d)</Text> : null}</td>
                            <td style={{ textAlign: 'right' }} className="money">₹{e.baseRent}</td>
                            <td style={{ textAlign: 'right' }} className="money">₹{e.electricityCharge}</td>
                            <td style={{ textAlign: 'right' }} className="money">₹{e.totalDue}</td>
                            <td style={{ textAlign: 'right' }} className="money">₹{e.amountPaid}</td>
                            <td style={{ textAlign: 'right' }} className="money">₹{outstanding}</td>
                            <td>
                              <StatusBadge tone={currentStatus === 'paid' ? 'success' : currentStatus === 'overdue' ? 'danger' : currentStatus === 'partial' ? 'warn' : 'neutral'}>
                                {currentStatus}
                              </StatusBadge>
                            </td>
                            <td>
                              {outstanding > 0 ? (
                                <Button size="compact-xs" variant="subtle" onClick={() => { setPaymentEntryId(e.id); setPaymentAmount(outstanding); }}>
                                  Collect
                                </Button>
                              ) : '—'}
                            </td>
                            <td className="mono">{e.receiptNumber ?? '—'}</td>
                          </tr>
                        );})}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Draft GST estimate (NOT a tax invoice)"
                subtitle="Generates a draft tax estimate from a ledger entry for review only. It does not determine place of supply, tax liability, TDS, e-invoicing, or invoice issuance compliance. For immovable-property renting, place of supply/property location and registration context must be reviewed by a qualified CA/tax professional before issuing any document."
              >
                <Stack gap="sm">
                  <Group gap="sm" wrap="wrap" align="flex-end">
                    <Select
                      aria-label="Invoice ledger entry"
                      placeholder="Select entry for invoice"
                      data={ledgerEntries.map((e) => ({ value: e.id, label: `${e.id.slice(0, 12)} · ${e.periodStart}` }))}
                      value={invoiceEntryId || null}
                      onChange={(v) => setInvoiceEntryId(v ?? '')}
                    />
                    <TextInput aria-label="Supplier GSTIN" placeholder="Supplier GSTIN" value={supplierGstin || facility?.gstin || ''} onChange={(e) => setSupplierGstin(e.currentTarget.value)} />
                    <TextInput aria-label="Supplier state" placeholder="Supplier state" value={supplierState || facility?.state || ''} onChange={(e) => setSupplierState(e.currentTarget.value)} />
                    <TextInput aria-label="Recipient state" placeholder="Recipient/billing state (not place-of-supply determination)" value={recipientState} onChange={(e) => setRecipientState(e.currentTarget.value)} />
                    <Text size="xs" c="dimmed">Property state used for estimate context: {facility?.state || '—'} (verify immovable-property place of supply with CA).</Text>
                  </Group>
                  {(() => {
                    const entry = ledgerEntries.find((e) => e.id === invoiceEntryId);
                    if (!entry) return <Text size="sm" c="dimmed">Select a ledger entry to generate a draft estimate.</Text>;
                    const tenant = tenants.find((t) => t.id === entry.tenantId);
                    const sState = supplierState || facility?.state || '';
                    const rState = recipientState || sState;
                    if (!sState) return <Text size="sm" c="dimmed">Enter supplier state to compute a draft GST estimate. Do not issue as a tax invoice without professional review.</Text>;
                    const asOf = asOfDate;
                    const potentialLate = calculateLateFee({ dueDate: entry.dueDate, asOfDate: asOf, principal: entry.totalDue });
                    // Do not auto-impose late fees; contract/policy must be confirmed.
                    const inv = generateGstInvoice({
                      invoiceNumber: `DRAFT-${entry.id.slice(-8)}`,
                      invoiceDate: asOf,
                      supplierGstin: supplierGstin || facility?.gstin || '',
                      recipientGstin: tenant?.gstin,
                      supplierState: sState,
                      recipientState: rState,
                      propertyState: facility?.state,
                      description: `Storage rent ${entry.periodStart} to ${entry.periodEnd}`,
                      taxableValue: entry.baseRent + entry.electricityCharge + entry.otherCharges,
                    });
                    return (
                      <div style={{ overflowX: 'auto' }}>
                        <Text size="sm" fw={700} c="red">DRAFT GST ESTIMATE — NOT A TAX INVOICE / NOT LEGAL OR TAX ADVICE</Text>
                        <table className="data-table" style={{ marginTop: 8 }}>
                          <thead><tr><th scope="col">Reference</th><th scope="col">Place of supply (estimate)</th><th scope="col" style={{ textAlign:'right' }}>Taxable</th><th scope="col" style={{ textAlign:'right' }}>CGST</th><th scope="col" style={{ textAlign:'right' }}>SGST</th><th scope="col" style={{ textAlign:'right' }}>IGST</th><th scope="col" style={{ textAlign:'right' }}>Total (estimate)</th></tr></thead>
                          <tbody><tr><td className="mono">{inv.invoiceNumber}</td><td>{inv.placeOfSupply} ({inv.intraState ? 'intra' : 'inter'}-state, estimate)</td><td style={{ textAlign:'right' }}>₹{inv.totalTaxable}</td><td style={{ textAlign:'right' }}>₹{inv.totalCgst}</td><td style={{ textAlign:'right' }}>₹{inv.totalSgst}</td><td style={{ textAlign:'right' }}>₹{inv.totalIgst}</td><td style={{ textAlign:'right' }}><strong>₹{inv.grandTotal}</strong></td></tr></tbody>
                        </table>
                        {potentialLate > 0 && <Text size="xs" c="orange" mt={6}>Potential late-fee estimate (not included; contractual basis/tax treatment not verified): ₹{potentialLate}</Text>}
                        {(inv.warnings ?? []).length > 0 && (
                          <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12 }}>
                            {(inv.warnings ?? []).map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
                </Stack>
              </SectionCard>

              {receipts.length > 0 && (
                <SectionCard title="Receipts Issued">
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {receipts.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="maintenance" pt="md">
            <Stack gap="md">
              <SectionCard title="Maintenance Tasks" subtitle={`Open ${maintSummary.openCount} · In progress ${maintSummary.inProgressCount} · Resolved ${maintSummary.resolvedCount} · Est. ${inr(maintSummary.totalEstimatedCost)} · Actual ${inr(maintSummary.totalActualCost)}`}>
                <Stack gap="sm">
                  <Group gap="sm" wrap="wrap">
                    <Select
                      aria-label="Space (optional)"
                      placeholder="Space (optional)"
                      data={facility.spaces.map((s) => ({ value: s.id, label: s.code }))}
                      value={newMaint.spaceId || null}
                      onChange={(v) => setNewMaint({ ...newMaint, spaceId: v ?? '' })}
                    />
                    <Select
                      aria-label="Maintenance category"
                      data={MAINT_CATEGORY_OPTIONS}
                      value={newMaint.category}
                      onChange={(v) => setNewMaint({ ...newMaint, category: (v ?? 'roof') as MaintenanceTask['category'] })}
                    />
                    <TextInput
                      aria-label="Maintenance title"
                      placeholder="Title"
                      value={newMaint.title}
                      onChange={(e) => setNewMaint({ ...newMaint, title: e.currentTarget.value })}
                    />
                    <TextInput
                      aria-label="Maintenance description"
                      placeholder="Description"
                      value={newMaint.description}
                      onChange={(e) => setNewMaint({ ...newMaint, description: e.currentTarget.value })}
                    />
                    <NumberInput
                      aria-label="Estimated cost"
                      placeholder="Est. cost"
                      value={newMaint.cost || ''}
                      onChange={(v) => setNewMaint({ ...newMaint, cost: Number(v) || 0 })}
                      min={0}
                      w={100}
                    />
                    <Button color="orange" onClick={handleMaintenanceOpen}>
                      Report
                    </Button>
                  </Group>
                </Stack>
              </SectionCard>

              {maintenanceTasks.length === 0 ? (
                <EmptyState title="No maintenance tasks" hint="Report one above." />
              ) : (
                <SectionCard title={`Tasks (${maintenanceTasks.length})`}>
                  <Stack gap="sm">
                    {maintenanceTasks.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          border: '1px solid var(--p09-border)',
                          background: 'var(--p09-bg-1)',
                        }}
                      >
                        <Group justify="space-between" wrap="wrap">
                          <Text fw={600} size="sm">
                            {t.title}
                          </Text>
                          <StatusBadge
                            tone={
                              t.status === 'resolved'
                                ? 'success'
                                : t.status === 'in_progress'
                                ? 'info'
                                : t.status === 'cancelled'
                                ? 'neutral'
                                : 'warn'
                            }
                          >
                            {t.status}
                          </StatusBadge>
                        </Group>
                        <Text size="xs" c="dimmed" mt={4}>
                          {t.category} · est. {inr(t.estimatedCost)}
                          {t.actualCost !== undefined ? ` / actual ${inr(t.actualCost)} (variance ${inr(costVariance(t) ?? 0)})` : ''}
                        </Text>
                        <Group gap="xs" mt="xs">
                          {t.status === 'open' && (
                            <Button size="xs" color="teal" onClick={() => handleMaintenanceStart(t.id)}>
                              Start
                            </Button>
                          )}
                          {(t.status === 'open' || t.status === 'in_progress') && (
                            <Button size="xs" color="green" onClick={() => handleMaintenanceResolve(t.id)}>
                              Resolve
                            </Button>
                          )}
                          {t.status === 'open' && (
                            <Button size="xs" variant="default" onClick={() => handleMaintenanceCancel(t.id)}>
                              Cancel
                            </Button>
                          )}
                        </Group>
                      </div>
                    ))}
                  </Stack>
                </SectionCard>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="meters" pt="md">
            <Stack gap="md">
              <SectionCard title="Meter Consumption &amp; Illustrative Charges" subtitle="Enter consumption for an explicit period, not cumulative meter readings. Example tariff ₹8/kWh; DG ₹12/kWh (off by default).">
                <Stack gap="sm">
                  <Group gap="sm" wrap="wrap">
                    <Select
                      aria-label="Space"
                      placeholder="Space"
                      data={facility.spaces.map((s) => ({ value: s.id, label: s.code }))}
                      value={newMeter.spaceId || null}
                      onChange={(v) => setNewMeter({ ...newMeter, spaceId: v ?? '' })}
                    />
                    <NumberInput
                      aria-label="Kilowatt hours consumed in period"
                      placeholder="kWh consumed"
                      value={newMeter.kwh ?? ''}
                      onChange={(v) => setNewMeter({ ...newMeter, kwh: v === '' ? null : Number(v) })}
                      min={0}
                      w={90}
                    />
                    <TextInput type="date" aria-label="Consumption period start" value={newMeter.periodStart} onChange={(e) => setNewMeter({ ...newMeter, periodStart: e.currentTarget.value })} />
                    <TextInput type="date" aria-label="Consumption period end" value={newMeter.periodEnd} onChange={(e) => setNewMeter({ ...newMeter, periodEnd: e.currentTarget.value })} />
                    <Button color="cyan" onClick={handleMeterReading}>
                      Record Reading
                    </Button>
                  </Group>
                </Stack>
              </SectionCard>

              <SectionCard title="Allocate Utility Bill" subtitle="Select the exact consumption period. Only matching records are included; check that all relevant meters are present. Undated legacy records and other periods are excluded. This is a preview, not a posted charge.">
                <Stack gap="sm">
                  <Group gap="sm" wrap="wrap">
                    <NumberInput
                      aria-label="Actual bill amount"
                      placeholder="Total bill ₹"
                      value={actualBill ?? ''}
                      onChange={(v) => { setActualBill(v === '' ? null : Number(v)); setBillAllocation(null); }}
                      min={0}
                      w={140}
                    />
                    <TextInput type="date" aria-label="Bill period start" value={billPeriod.start} onChange={(e) => { setBillPeriod({ ...billPeriod, start: e.currentTarget.value }); setBillAllocation(null); }} />
                    <TextInput type="date" aria-label="Bill period end" value={billPeriod.end} onChange={(e) => { setBillPeriod({ ...billPeriod, end: e.currentTarget.value }); setBillAllocation(null); }} />
                    <Button color="teal" onClick={() => {
                      try { if (actualBill === null) throw new Error('Enter the bill amount.'); setBillAllocation(allocateBillForPeriod(meterReadings, billPeriod.start, billPeriod.end, actualBill)); }
                      catch (error) { setBillAllocation(null); flash((error as Error).message); }
                    }}>
                      Allocate
                    </Button>
                  </Group>
                  {billAllocation && (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead><tr><th scope="col">Space</th><th scope="col" style={{ textAlign: 'right' }}>kWh</th><th scope="col" style={{ textAlign: 'right' }}>Share %</th><th scope="col" style={{ textAlign: 'right' }}>Allocated ₹</th></tr></thead>
                        <tbody>
                          {billAllocation.map((a) => (
                            <tr key={a.spaceId}><td>{a.spaceId}</td><td style={{ textAlign: 'right' }}>{a.kwh}</td><td style={{ textAlign: 'right' }}>{a.sharePct}</td><td style={{ textAlign: 'right' }}>{a.allocated}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Stack>
              </SectionCard>

              <SectionCard title={`Readings (${meterReadings.length})`}>
                {meterReadings.length === 0 ? (
                  <EmptyState title="No meter readings" hint="Record one above." />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th scope="col">Space</th>
                          <th scope="col">Period</th>
                          <th scope="col" style={{ textAlign: 'right' }}>kWh</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Energy ₹</th>
                          <th scope="col" style={{ textAlign: 'right' }}>DG ₹</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Total ₹</th>
                        </tr>
                      </thead>
                      <tbody>
                        {charges.map((c: { spaceId: string; kwh: number; energyCharge: number; dgCharge: number; total: number }, i: number) => (
                          <tr key={i}>
                            <td className="mono">{c.spaceId}</td>
                            <td>{meterReadings[i].periodStart && meterReadings[i].periodEnd ? `${meterReadings[i].periodStart} to ${meterReadings[i].periodEnd}` : 'Unknown (legacy)'}</td>
                            <td style={{ textAlign: 'right' }} className="num">{c.kwh}</td>
                            <td style={{ textAlign: 'right' }} className="money">₹{c.energyCharge}</td>
                            <td style={{ textAlign: 'right' }} className="money">₹{c.dgCharge}</td>
                            <td style={{ textAlign: 'right' }} className="money">₹{c.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="analytics" pt="md">
            <Stack gap="md">
              <SectionCard
                title="Admin / Analysis"
                subtitle={`As-of ${dateShort(analytics.asOfDate)}. Deterministic projection over current facility, leases, ledger, and tenant records. Vacancy duration is exact only when \`vacantSince\` is recorded on status transitions; legacy vacant spaces without timestamps are reported as unknown (no false precision).`}
              >
                <Group gap="sm" wrap="wrap" mb="sm">
                  <StatCard label="Modeled spaces" value={analytics.utilization.totalSpaces} />
                  <StatCard label="Leased spaces" value={analytics.utilization.leasedSpaces} />
                  <StatCard label="Vacant spaces" value={analytics.utilization.vacantSpaces} />
                  <StatCard label="Leased area" value={sqft(analytics.utilization.leasedAreaSqFt)} />
                  <StatCard label="Vacant area" value={sqft(analytics.utilization.vacantAreaSqFt)} />
                  <StatCard label="Blocked/repair area" value={sqft(analytics.utilization.blockedAreaSqFt + analytics.utilization.underRepairAreaSqFt)} />
                </Group>
                <Text size="xs" c="dimmed">
                  Payment-delay policy (explicit): min entries {analytics.policy.paymentDelay.minEntries}, late-paid count ≥ {analytics.policy.paymentDelay.latePaidCountThreshold}, or problem ratio ≥ {(analytics.policy.paymentDelay.problemRatioThreshold * 100).toFixed(0)}%. Metric definitions are stable; policy is configurable in the analytics layer.
                </Text>
              </SectionCard>

              {analytics.utilizationByBuilding.length > 0 && (
                <SectionCard title="Utilization by building / godown" subtitle="Derived from space.buildingName (additive grouping). Supports multiple godowns/buildings at the same facility location.">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th scope="col">Building/Godown</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Spaces</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Leased</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Vacant</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Modeled area</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Leased area</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Vacant area</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.utilizationByBuilding.map((b) => (
                          <tr key={b.buildingName}>
                            <td>{b.buildingName}</td>
                            <td style={{ textAlign: 'right' }} className="num">{b.totalSpaces}</td>
                            <td style={{ textAlign: 'right' }} className="num">{b.leasedSpaces}</td>
                            <td style={{ textAlign: 'right' }} className="num">{b.vacantSpaces}</td>
                            <td style={{ textAlign: 'right' }} className="num">{sqft(b.modeledAreaSqFt)}</td>
                            <td style={{ textAlign: 'right' }} className="num">{sqft(b.leasedAreaSqFt)}</td>
                            <td style={{ textAlign: 'right' }} className="num">{sqft(b.vacantAreaSqFt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}

              <SectionCard title="Receivables aging" subtitle="Outstanding amounts bucketed by days past due as of the analysis date. Computed from ledger due dates, payments, and overdue status.">
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Bucket</th>
                        <th scope="col" style={{ textAlign: 'right' }}>Entries</th>
                        <th scope="col" style={{ textAlign: 'right' }}>Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.receivablesAging.buckets.map((b) => (
                        <tr key={b.label}>
                          <td>{b.label}</td>
                          <td style={{ textAlign: 'right' }} className="num">{b.entryCount}</td>
                          <td style={{ textAlign: 'right' }} className="num">{inr(b.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Text size="sm" c="dimmed" mt="xs">Total outstanding {inr(analytics.receivablesAging.totalOutstanding)} · Overdue {inr(analytics.receivablesAging.totalOverdue)}</Text>
              </SectionCard>

              <SectionCard title="Currently vacant spaces" subtitle="Unused now. Duration is known only when status-transition timestamps were recorded; legacy unknowns are honest gaps, not estimates.">
                {analytics.vacantNow.length === 0 ? (
                  <EmptyState title="No vacant spaces" hint="All modeled spaces are leased, blocked, reserved, or under repair." />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th scope="col">Code</th>
                          <th scope="col">Name</th>
                          <th scope="col">Building/Godown</th>
                          <th scope="col">Type</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Area</th>
                          <th scope="col">Vacant since</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Days vacant</th>
                          <th scope="col">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.vacantNow.map((s) => (
                          <tr key={s.spaceId}>
                            <td className="mono">{s.code}</td>
                            <td>{s.name}</td>
                            <td>{s.buildingName || '—'}</td>
                            <td>{s.type}</td>
                            <td style={{ textAlign: 'right' }} className="num">{s.areaSqFt}</td>
                            <td>{s.vacantSince ? dateShort(s.vacantSince) : '—'}</td>
                            <td style={{ textAlign: 'right' }} className="num">{s.daysVacant == null ? '—' : s.daysVacant}</td>
                            <td>{s.durationKnown ? <StatusBadge tone="info">Tracked</StatusBadge> : <StatusBadge tone="neutral">Unknown (legacy)</StatusBadge>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Renters delaying payments" subtitle="Days late computed from due date vs paid date; overdue-now increases risk. 'Regularly delays' is a transparent, policy-driven heuristic — see reason per renter.">
                {analytics.tenantPaymentBehavior.length === 0 ? (
                  <EmptyState title="No payment behavior data" hint="Add tenants, leases, and ledger entries to analyze payment delays." />
                ) : (
                  <>
                    <Text size="sm" c="dimmed" mb="xs">
                      Tracked tenants: {analytics.totals.tenantsTracked} · Regular delayers (policy): {analytics.regularDelayers.length} · Overdue entries (as of {dateShort(analytics.asOfDate)}): {analytics.totals.overdueEntryCount} totaling <Money value={analytics.totals.overdueAmount} />
                    </Text>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th scope="col">Renter</th>
                            <th scope="col" style={{ textAlign: 'right' }}>Entries</th>
                            <th scope="col" style={{ textAlign: 'right' }}>Paid late</th>
                            <th scope="col" style={{ textAlign: 'right' }}>Overdue now</th>
                            <th scope="col" style={{ textAlign: 'right' }}>Avg days late</th>
                            <th scope="col" style={{ textAlign: 'right' }}>Max days late</th>
                            <th scope="col" style={{ textAlign: 'right' }}>Late-paid amount</th>
                            <th scope="col" style={{ textAlign: 'right' }}>Outstanding</th>
                            <th scope="col">Flag</th>
                            <th scope="col">Reason (policy)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.tenantPaymentBehavior.map((t) => (
                            <tr key={t.tenantId}>
                              <td>{t.tenantName}</td>
                              <td style={{ textAlign: 'right' }} className="num">{t.ledgerEntries}</td>
                              <td style={{ textAlign: 'right' }} className="num">{t.latePaidEntries}</td>
                              <td style={{ textAlign: 'right' }} className="num">{t.overdueEntries}</td>
                              <td style={{ textAlign: 'right' }} className="num">{t.avgDaysLateWhenPaid == null ? '—' : t.avgDaysLateWhenPaid}</td>
                              <td style={{ textAlign: 'right' }} className="num">{t.maxDaysLate || '—'}</td>
                              <td style={{ textAlign: 'right' }} className="num">{inr(t.totalLatePaidAmount)}</td>
                              <td style={{ textAlign: 'right' }} className="num">{inr(t.totalOutstanding)}</td>
                              <td>{t.regularlyDelays ? <StatusBadge tone="danger">Regularly delays</StatusBadge> : t.overdueEntries > 0 || t.latePaidEntries > 0 ? <StatusBadge tone="warn">Some delay</StatusBadge> : <StatusBadge tone="success">On track</StatusBadge>}</td>
                              <td><Text size="xs" c="dimmed">{t.delayReason}</Text></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </SectionCard>

              <SectionCard title="Metric definitions" subtitle="Stable definitions for admin analysis; implementation is a pure projection over current records.">
                <Stack gap={4}>
                  {analytics.definitions.map((d) => (
                    <Text key={d.id} size="sm"><strong>{d.label}:</strong> {d.definition}</Text>
                  ))}
                </Stack>
              </SectionCard>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="audit" pt="md">
            <Stack gap="md">
              <SectionCard
                title="Audit log (foundation)"
                subtitle="Append-only operational events persisted in the schema-v1 state (additive). Read-only view; use for CA/audit traceability. Export, tamper-evidence, and retention policy are deferred decisions."
              >
                {events.length === 0 ? (
                  <EmptyState
                    title="No audit events yet"
                    hint="Events appear as you register facilities/spaces, create leases, generate ledger entries, and record payments/receipts."
                  />
                ) : (
                  <ScrollArea h={520}>
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Time</Table.Th>
                          <Table.Th>Event</Table.Th>
                          <Table.Th>Entity refs</Table.Th>
                          <Table.Th>Actor</Table.Th>
                          <Table.Th>Verification</Table.Th>
                          <Table.Th>Payload</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {[...events].reverse().map((ev) => {
                          const refs = [
                            ev.spaceId ? `space:${ev.spaceId}` : null,
                            ev.tenantId ? `tenant:${ev.tenantId}` : null,
                            ev.leaseId ? `lease:${ev.leaseId}` : null,
                          ].filter(Boolean).join(' · ');
                          let payload = '';
                          try {
                            payload = JSON.stringify(ev.payload ?? {});
                          } catch {
                            payload = String(ev.payload ?? '');
                          }
                          if (payload.length > 180) payload = `${payload.slice(0, 177)}…`;
                          return (
                            <Table.Tr key={ev.eventId}>
                              <Table.Td><Text size="xs">{new Date(ev.eventTime).toLocaleString()}</Text></Table.Td>
                              <Table.Td><Badge variant="light">{ev.eventType}</Badge></Table.Td>
                              <Table.Td><Text size="xs" c="dimmed">{refs || '—'}</Text></Table.Td>
                              <Table.Td><Text size="xs">{ev.actor ?? '—'}</Text></Table.Td>
                              <Table.Td><Text size="xs">{ev.verificationStatus ?? '—'}</Text></Table.Td>
                              <Table.Td><Text size="xs" ff="monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{payload || '{}'}</Text></Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                )}
              </SectionCard>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
}
