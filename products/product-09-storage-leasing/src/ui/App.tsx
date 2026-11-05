import { useState } from 'react';
import { Tabs, Button, Group, Stack, Text, Title, TextInput, NumberInput, Select } from '@mantine/core';
import { SuiteDock } from './SuiteDock';
import { useFacilityStore } from './hooks/useFacilityStore';
import { selectMetrics, selectRentSummary, selectMaintSummary, selectCharges } from './selectors';
import { EmptyState } from './components/EmptyState';
import { StatCard } from './components/StatCard';
import { SectionCard } from './components/SectionCard';
import { Money } from './components/Money';
import { StatusBadge } from './components/StatusBadge';
import { inr, sqft, pct, dateShort } from './format';
import {
  createFacility,
  addSpace,
  allocateSpaceAndLease,
  allocateActualBill,
} from '../engine/facilityModel';
import {
  createTenant,
  createLease,
  generateRentLedgerEntry,
  generateMonthlyRentLedgers,
  recordPayment,
  issueReceipt,
  previewRenewal,
  getOverdueEntries,
  getPendingEntries,
} from '../engine/leaseEngine';
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
    loading,
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
    setReceipts,
    reset,
  } = store;

  // Form state (local UI, not persisted).
  const [reg, setReg] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    state: '',
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
    deposit: 0,
    escalation: 0,
    billingCycleDay: 10,
  });
  const [newMaint, setNewMaint] = useState({
    spaceId: '',
    category: 'roof' as MaintenanceTask['category'],
    title: '',
    description: '',
    cost: 0,
  });
  const [newMeter, setNewMeter] = useState({ spaceId: '', kwh: 0 });
  const [actualBill, setActualBill] = useState(0);
  const [billAllocation, setBillAllocation] = useState<{ spaceId: string; kwh: number; sharePct: number; allocated: number }[] | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentEntryId, setPaymentEntryId] = useState('');
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  const metrics = selectMetrics(facility, leases);
  const rentSummary = selectRentSummary(ledgerEntries);
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
      });
      setFacility({ ...facility, spaces: [...facility.spaces] });
      setNewSpace({ code: '', name: '', type: 'room', floor: 1, lengthFt: 0, widthFt: 0, env: 'ambient' });
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
      const commodity = newTenant.commodityCategory;
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
          rate: newLease.rate,
          escalationPercentPerYear: newLease.escalation,
          depositAmount: newLease.deposit,
          intendedUse: newTenant.intendedUse || undefined,
          commodityCategory: newTenant.commodityCategory,
        },
        space,
      );
      allocateSpaceAndLease(facility, space.id, tenant.id, lease, newLease.start);
      const entry = generateRentLedgerEntry({
        id: `RL-${Date.now()}`,
        lease,
        facilityId: facility.id,
        spaceId: space.id,
        tenantId: tenant.id,
        periodStart: newLease.start.slice(0, 7) + '-01',
        periodEnd: newLease.start.slice(0, 7) + '-28',
        dueDate: newLease.start.slice(0, 7) + '-10',
        electricityCharge: 0,
      });
      if (!newLease.tenantId) setTenants((prev) => [...prev, tenant]);
      setLeases((prev) => [...prev, lease]);
      setLedgerEntries((prev) => [...prev, entry]);
      setFacility({ ...facility, spaces: [...facility.spaces] });
      const wasExisting = !!newLease.tenantId;
      flash((wasExisting ? 'Additional space leased for existing tenant.' : 'Tenant onboarded and lease activated.') + usageWarning);
      setNewLease({ spaceId: '', tenantId: '', start: '', end: '', rate: 0, billing: 'sqft_month', deposit: 0, escalation: 0, leaseType: 'fixed_term', agreementDate: '', depositDate: '', billingStart: '', billingCycleDay: 10 });
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
      });
      if (newEntries.length === 0) {
        flash('No active leases for that period.');
        return;
      }
      setLedgerEntries((prev) => [...prev, ...newEntries]);
      flash(`Generated ${newEntries.length} ledger entries.`);
    } catch (e) {
      flash((e as Error).message);
    }
  };

  const handleRecordPayment = () => {
    try {
      const entry = paymentEntryId ? ledgerEntries.find((e) => e.id === paymentEntryId) : undefined;
      if (!entry) {
        flash('Select a ledger entry to pay.');
        return;
      }
      const amt = paymentAmount > 0 ? paymentAmount : entry.totalDue;
      recordPayment(entry, amt, new Date().toISOString().slice(0, 10));
      const r = issueReceipt(entry, new Date().toISOString().slice(0, 10));
      setReceipts((prev) => [...prev, r.receiptNumber]);
      setLedgerEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...entry } : e)));
      flash(`Payment recorded. Receipt ${r.receiptNumber}`);
    } catch (e) {
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
    setMeterReadings((prev) => [...prev, { spaceId: newMeter.spaceId, kwh: newMeter.kwh }]);
    setNewMeter({ spaceId: '', kwh: 0 });
    flash('Meter reading recorded.');
  };

  const handleReset = () => {
    if (!window.confirm('Reset all data? This cannot be undone.')) return;
    void reset();
    flash('Reset complete.');
  };

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
          <SectionCard title="Register Facility" subtitle="No demo data is seeded. All figures come from your inputs. Records persist to your local storage service and stay available across reloads.">
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
              <Group gap="sm" wrap="wrap">
                <NumberInput
                  aria-label="Total square feet"
                  placeholder="Total sq ft"
                  value={reg.totalArea}
                  onChange={(v) => setReg({ ...reg, totalArea: Number(v) || 0 })}
                  min={0}
                  w={120}
                />
                <NumberInput
                  aria-label="Usable square feet"
                  placeholder="Usable sq ft"
                  value={reg.usableArea}
                  onChange={(v) => setReg({ ...reg, usableArea: Number(v) || 0 })}
                  min={0}
                  w={120}
                />
                <NumberInput
                  aria-label="Number of floors"
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

  const overdueCount = getOverdueEntries(ledgerEntries, new Date().toISOString().slice(0, 10)).length;

  return (
    <div className="subproduct-root">
      <SuiteDock currentProductId="product-09-storage-leasing" />
      <div className="app-shell">
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
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Stack gap="md">
              <div className="kpi-row">
                <StatCard label="Leasable sq ft" value={sqft(metrics?.usableAreaSqFt ?? 0)} />
                <StatCard label="Occupied sq ft" value={sqft(metrics?.leasedAreaSqFt ?? 0)} />
                <StatCard label="Occupancy" value={pct(metrics?.occupancyPercent ?? 0)} />
                <StatCard label="Monthly rent due" value={<Money value={rentSummary.totalDue} />} tone="money" />
                <StatCard
                  label="Overdue"
                  value={<Money value={rentSummary.totalOverdue} />}
                  tone="danger"
                />
                <StatCard label="Open maintenance" value={maintSummary.openCount + maintSummary.inProgressCount} />
              </div>

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

              {overdueCount > 0 && (
                <div className="notice notice--danger">
                  <strong>Overdue Entries ({overdueCount})</strong>
                </div>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="spaces" pt="md">
            <Stack gap="md">
              <SectionCard title="Add Space" subtitle="Define a rentable space in the facility.">
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

              <SectionCard title="Facility Spaces" subtitle={metrics ? `Utilization: ${metrics.occupancyPercent}% leased` : undefined}>
                {facility.spaces.length === 0 ? (
                  <EmptyState title="No spaces yet" hint="Define your first rentable space above. Spaces drive occupancy, leasing, and electricity charges." />
                ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Name</th>
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
                      data={[
                        { value: 'ambient_goods', label: 'Ambient goods' },
                        { value: 'perishable', label: 'Perishable' },
                        { value: 'frozen', label: 'Frozen' },
                        { value: 'hazmat', label: 'Hazmat' },
                        { value: 'documents', label: 'Documents' },
                        { value: 'equipment', label: 'Equipment' },
                        { value: 'agri', label: 'Agri' },
                        { value: 'other', label: 'Other' },
                      ]}
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
                              {dateShort(l.startDate)} → {dateShort(l.endDate)}
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
                <SectionCard title={`Tenants &amp; their spaces (${tenants.length})`}>
                  <Stack gap="sm">
                    {tenants.map((t) => {
                      const tLeases = leases.filter((l) => l.tenantId === t.id);
                      const totalRent = tLeases.reduce((s, l) => s + (l.rate || 0), 0);
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
                          <Group justify="space-between" wrap="wrap">
                            <div>
                              <Text fw={600} size="sm">
                                {t.name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {t.contactPerson} · {t.phone}
                                {t.gstin ? ` · GSTIN ${t.gstin}` : ''}
                                {t.intendedUse ? ` · ${t.intendedUse}` : ''}
                              </Text>
                            </div>
                            <Group gap="xs">
                              <StatusBadge tone="info">{tLeases.length} space{tLeases.length === 1 ? '' : 's'}</StatusBadge>
                              {totalRent > 0 && <Money value={totalRent} />}
                            </Group>
                          </Group>
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
              <SectionCard title="Rent Ledger" subtitle={`Total due ${inr(rentSummary.totalDue)} · Paid ${inr(rentSummary.totalPaid)} · Overdue ${inr(rentSummary.totalOverdue)} (${rentSummary.overdueCount}) · Pending ${rentSummary.pendingCount}`}>
                <Stack gap="sm">
                  <Group gap="sm" wrap="wrap" align="flex-end">
                    <NumberInput
                      aria-label="Year"
                      placeholder="Year"
                      value={monthlyYear}
                      onChange={(v) => setMonthlyYear(Number(v) || monthlyYear)}
                      w={80}
                    />
                    <NumberInput
                      aria-label="Month"
                      placeholder="Month"
                      value={monthlyMonth}
                      onChange={(v) => setMonthlyMonth(Number(v) || monthlyMonth)}
                      w={70}
                    />
                    <Button variant="default" onClick={handleGenerateMonthly}>
                      Generate Monthly
                    </Button>
                    <Select
                      aria-label="Select ledger entry"
                      placeholder="Select entry"
                      data={getPendingEntries(ledgerEntries).map((e) => ({
                        value: e.id,
                        label: `${e.id.slice(0, 12)} (₹${e.totalDue - e.amountPaid})`,
                      }))}
                      value={paymentEntryId || null}
                      onChange={(v) => setPaymentEntryId(v ?? '')}
                    />
                    <NumberInput
                      aria-label="Payment amount"
                      placeholder="Amount"
                      value={paymentAmount || ''}
                      onChange={(v) => setPaymentAmount(Number(v) || 0)}
                      w={100}
                    />
                    <Button color="green" onClick={handleRecordPayment}>
                      Record Payment + Receipt
                    </Button>
                  </Group>
                </Stack>
              </SectionCard>

              <SectionCard title={`Entries (${ledgerEntries.length})`}>
                {ledgerEntries.length === 0 ? (
                  <EmptyState title="No ledger entries" hint="Onboard a tenant on the Leases tab or generate monthly." />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th scope="col">ID</th>
                          <th scope="col">Tenant</th>
                          <th scope="col">Period</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Base</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Elec</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Total</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Paid</th>
                          <th scope="col">Status</th>
                          <th scope="col">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerEntries.map((e) => (
                          <tr key={e.id}>
                            <td className="mono">{e.id.slice(0, 14)}</td>
                            <td>{tenants.find((t) => t.id === e.tenantId)?.name ?? e.tenantId.slice(0, 8)}</td>
                            <td>
                              {e.periodStart}→{e.periodEnd}
                            </td>
                            <td style={{ textAlign: 'right' }} className="money">
                              ₹{e.baseRent}
                            </td>
                            <td style={{ textAlign: 'right' }} className="money">
                              ₹{e.electricityCharge}
                            </td>
                            <td style={{ textAlign: 'right' }} className="money">
                              ₹{e.totalDue}
                            </td>
                            <td style={{ textAlign: 'right' }} className="money">
                              ₹{e.amountPaid}
                            </td>
                            <td>
                              <StatusBadge
                                tone={
                                  e.paymentStatus === 'paid'
                                    ? 'success'
                                    : e.paymentStatus === 'overdue'
                                    ? 'danger'
                                    : e.paymentStatus === 'partial'
                                    ? 'warn'
                                    : 'neutral'
                                }
                              >
                                {e.paymentStatus}
                              </StatusBadge>
                            </td>
                            <td className="mono">{e.receiptNumber ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
              <SectionCard title="Meter Readings &amp; Electricity Charges" subtitle="Tariff ₹8/kWh · DG ₹12/kWh (off by default)">
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
                      aria-label="Kilowatt hours"
                      placeholder="kWh"
                      value={newMeter.kwh || ''}
                      onChange={(v) => setNewMeter({ ...newMeter, kwh: Number(v) || 0 })}
                      min={0}
                      w={90}
                    />
                    <Button color="cyan" onClick={handleMeterReading}>
                      Record Reading
                    </Button>
                  </Group>
                </Stack>
              </SectionCard>

              <SectionCard title="Allocate Actual Utility Bill" subtitle="Split the real bill across tenants by sub-meter kWh (not a flat per-sqft rate).">
                <Stack gap="sm">
                  <Group gap="sm" wrap="wrap">
                    <NumberInput
                      aria-label="Actual bill amount"
                      placeholder="Total bill ₹"
                      value={actualBill || ''}
                      onChange={(v) => setActualBill(Number(v) || 0)}
                      min={0}
                      w={140}
                    />
                    <Button color="teal" onClick={() => {
                      const subs = meterReadings.map((m) => ({ spaceId: m.spaceId, kwh: m.kwh }));
                      setBillAllocation(allocateActualBill({ totalBill: actualBill, subReadings: subs }));
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
        </Tabs>
      </div>
    </div>
  );
}