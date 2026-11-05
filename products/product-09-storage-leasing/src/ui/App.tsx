import { useState, useMemo, useEffect } from 'react';
import { SuiteDock } from './SuiteDock';
import {
  createFacility,
  addSpace,
  computeFacilityMetrics,
  computeSpaceUtilization,
  computeElectricityCharges,
  allocateSpaceAndLease,
} from '../engine/facilityModel';
import {
  createTenant,
  createLease,
  generateRentLedgerEntry,
  generateMonthlyRentLedgers,
  computeRentSummary,
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
  computeMaintenanceSummary,
  costVariance,
} from '../engine/maintenanceEngine';
import type { Facility, Lease, RentLedgerEntry, MaintenanceTask, Tenant, RentableSpace } from '../engine/types';
import { loadState as loadStateAsync, saveState as saveStateAsync, resetState } from '../engine/storageClient';

type Tab = 'overview' | 'facility' | 'spaces' | 'leases' | 'ledger' | 'maintenance' | 'meters';

export function App() {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [ledger, setLedger] = useState<RentLedgerEntry[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([]);
  const [meterReadings, setMeterReadings] = useState<{ spaceId: string; kwh: number }[]>([]);
  const [receipts, setReceipts] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('overview');

  // Facility registration form
  const [reg, setReg] = useState({ code: '', name: '', address: '', city: '', state: '', totalArea: 0, usableArea: 0, floors: 1, ownershipType: 'owned' as 'owned' | 'leased_in' | 'managed' | 'sub_leased' | 'government' | 'cooperative' | 'franchise', landlordName: '', landlordContact: '' });

  // Space form
  const [newSpace, setNewSpace] = useState({ code: '', name: '', type: 'room' as RentableSpace['type'], floor: 1, lengthFt: 0, widthFt: 0, env: 'ambient' as RentableSpace['environmentalClass'] });

  // Tenant + lease form
  const [newTenant, setNewTenant] = useState({ name: '', gstin: '', contactPerson: '', phone: '', address: '' });
  const [newLease, setNewLease] = useState({ spaceId: '', tenantId: '', start: '', end: '', rate: 0, billing: 'sqft_month' as Lease['billingUnit'], deposit: 0, escalation: 0 });

  // Maintenance form
  const [newMaint, setNewMaint] = useState({ spaceId: '', category: 'roof' as MaintenanceTask['category'], title: '', description: '', cost: 0 });

  // Meter form
  const [newMeter, setNewMeter] = useState({ spaceId: '', kwh: 0 });

  // Payment
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentEntryId, setPaymentEntryId] = useState('');

  // Monthly generation
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);

  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStateAsync().then((data) => {
      if (data) {
        setFacility(data.facility ?? null);
        setTenants(data.tenants ?? []);
        setLeases(data.leases ?? []);
        setLedger(data.ledger ?? []);
        setMaintenance(data.maintenance ?? []);
        setMeterReadings(data.meterReadings ?? []);
        setReceipts(data.receipts ?? []);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    saveStateAsync({ facility, tenants, leases, ledger, maintenance, meterReadings, receipts });
  }, [facility, tenants, leases, ledger, maintenance, meterReadings, receipts, loading]);

  const metrics = useMemo(() => facility ? computeFacilityMetrics(facility, leases.map(l => ({ spaceId: l.spaceId, status: l.status }))) : null, [facility, leases]);
  const rentSummary = useMemo(() => computeRentSummary(ledger), [ledger]);
  const maintSummary = useMemo(() => computeMaintenanceSummary(maintenance), [maintenance]);
  const util = useMemo(() => facility ? computeSpaceUtilization(facility) : null, [facility, leases]);
  const charges = useMemo(() => computeElectricityCharges({ subReadings: meterReadings, tariffPerKwh: 8, dgChargePerKwh: 12, useDG: false }), [meterReadings]);

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(null), 4000); };

  const handleRegisterFacility = () => {
    try {
      const f = createFacility({ id: `FAC-${Date.now()}`, code: reg.code || 'WH-1', name: reg.name, address: reg.address, city: reg.city, state: reg.state, totalAreaSqFt: reg.totalArea, usableAreaSqFt: reg.usableArea, floors: reg.floors, ownershipType: reg.ownershipType, landlordName: reg.landlordName || undefined, landlordContact: reg.landlordContact || undefined });
      setFacility(f);
      setTab('spaces');
      flash('Facility registered.');
    } catch (e) { flash((e as Error).message); }
  };

  const handleAddSpace = () => {
    if (!facility) { flash('Register a facility first.'); return; }
    try {
      addSpace(facility, { id: `SP-${Date.now()}`, code: newSpace.code || `SP-${facility.spaces.length + 1}`, name: newSpace.name || newSpace.code, type: newSpace.type, floor: newSpace.floor, dimensions: { lengthFt: newSpace.lengthFt, widthFt: newSpace.widthFt }, environmentalClass: newSpace.env, status: 'vacant' });
      setFacility({ ...facility, spaces: [...facility.spaces] });
      setNewSpace({ code: '', name: '', type: 'room', floor: 1, lengthFt: 0, widthFt: 0, env: 'ambient' });
      flash('Space added.');
    } catch (e) { flash((e as Error).message); }
  };

  const handleOnboardTenant = () => {
    if (!facility) { flash('Register a facility first.'); return; }
    try {
      if (!newTenant.name.trim()) throw new Error('Tenant name is required.');
      if (!newTenant.contactPerson.trim()) throw new Error('Contact person is required.');
      if (!newTenant.phone.trim()) throw new Error('Phone is required.');
      if (!newLease.spaceId) throw new Error('Select a space.');
      if (!newLease.start || !newLease.end) throw new Error('Start and end dates are required.');
      if (newLease.start >= newLease.end) throw new Error('End date must be after start date.');
      if (newLease.rate <= 0) throw new Error('Rate must be positive.');
      const tenant = createTenant({ id: `T-${Date.now()}`, name: newTenant.name, gstin: newTenant.gstin || undefined, contactPerson: newTenant.contactPerson, phone: newTenant.phone, address: newTenant.address });
      const space = facility.spaces.find(s => s.id === newLease.spaceId);
      if (!space) throw new Error('Select a valid space.');
      const lease = createLease({ id: `LEASE-${Date.now()}`, facilityId: facility.id, spaceId: space.id, tenantId: tenant.id, startDate: newLease.start, endDate: newLease.end, billingUnit: newLease.billing, rate: newLease.rate, escalationPercentPerYear: newLease.escalation, depositAmount: newLease.deposit }, space);
      allocateSpaceAndLease(facility, space.id, tenant.id, lease, newLease.start);
      const entry = generateRentLedgerEntry({ id: `RL-${Date.now()}`, lease, facilityId: facility.id, spaceId: space.id, tenantId: tenant.id, periodStart: newLease.start.slice(0, 7) + '-01', periodEnd: newLease.start.slice(0, 7) + '-28', dueDate: newLease.start.slice(0, 7) + '-10', electricityCharge: 0 });
      setTenants(prev => [...prev, tenant]);
      setLeases(prev => [...prev, lease]);
      setLedger(prev => [...prev, entry]);
      setFacility({ ...facility, spaces: [...facility.spaces] });
      flash('Tenant onboarded and lease activated.');
    } catch (e) { flash((e as Error).message); }
  };

  const handleGenerateMonthly = () => {
    try {
      const newEntries = generateMonthlyRentLedgers({ leases, periodYear: monthlyYear, periodMonth: monthlyMonth, dueDayOfMonth: 10 });
      if (newEntries.length === 0) { flash('No active leases for that period.'); return; }
      setLedger(prev => [...prev, ...newEntries]);
      flash(`Generated ${newEntries.length} ledger entries.`);
    } catch (e) { flash((e as Error).message); }
  };

  const handleRecordPayment = () => {
    try {
      const entry = paymentEntryId ? ledger.find(e => e.id === paymentEntryId) : undefined;
      if (!entry) { flash('Select a ledger entry to pay.'); return; }
      const amt = paymentAmount > 0 ? paymentAmount : entry.totalDue;
      recordPayment(entry, amt, new Date().toISOString().slice(0, 10));
      const r = issueReceipt(entry, new Date().toISOString().slice(0, 10));
      setReceipts(prev => [...prev, r.receiptNumber]);
      setLedger(prev => prev.map(e => e.id === entry.id ? { ...entry } : e));
      flash(`Payment recorded. Receipt ${r.receiptNumber}`);
    } catch (e) { flash((e as Error).message); }
  };

  const handleMaintenanceOpen = () => {
    if (!facility) { flash('Register a facility first.'); return; }
    try {
      const t = createMaintenanceTask({ id: `MT-${Date.now()}`, facilityId: facility.id, spaceId: newMaint.spaceId || undefined, category: newMaint.category, title: newMaint.title, description: newMaint.description, estimatedCost: newMaint.cost, reportedBy: 'owner' });
      setMaintenance(prev => [...prev, t]);
      setNewMaint({ spaceId: '', category: 'roof', title: '', description: '', cost: 0 });
      flash('Maintenance task created.');
    } catch (e) { flash((e as Error).message); }
  };

  const handleMaintenanceStart = (id: string) => {
    const t = maintenance.find(m => m.id === id);
    if (t && facility) { try { startMaintenance(t, facility); setFacility({ ...facility, spaces: [...facility.spaces] }); setMaintenance(prev => prev.map(m => m.id === t.id ? { ...t } : m)); } catch (e) { flash((e as Error).message); } }
  };

  const handleMaintenanceResolve = (id: string) => {
    const t = maintenance.find(m => m.id === id);
    if (t && facility) { try { resolveMaintenance(t, facility, t.estimatedCost); setFacility({ ...facility, spaces: [...facility.spaces] }); setMaintenance(prev => [...prev]); flash('Resolved.'); } catch (e) { flash((e as Error).message); } }
  };

  const handleMaintenanceCancel = (id: string) => {
    const t = maintenance.find(m => m.id === id);
    if (t && facility) { try { cancelMaintenance(t, facility); setFacility({ ...facility, spaces: [...facility.spaces] }); setMaintenance(prev => prev.map(m => m.id === t.id ? { ...t } : m)); } catch (e) { flash((e as Error).message); } }
  };

  const handleMeterReading = () => {
    if (!newMeter.spaceId) { flash('Select a space.'); return; }
    setMeterReadings(prev => [...prev, { spaceId: newMeter.spaceId, kwh: newMeter.kwh }]);
    setNewMeter({ spaceId: '', kwh: 0 });
    flash('Meter reading recorded.');
  };

  const handleReset = () => {
    if (!confirm('Reset all data? This cannot be undone.')) return;
    void resetState();
    setFacility(null); setTenants([]); setLeases([]); setLedger([]); setMaintenance([]); setMeterReadings([]); setReceipts([]);
    flash('Reset complete.');
  };

  const inputStyle: React.CSSProperties = { padding: '6px 8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 4, fontSize: 13 };

  // No facility registered yet — show registration form (production entry point, no hardcoded seed)
  if (loading) {
    return (
      <div className="subproduct-root">
        <SuiteDock currentProductId="product-09-storage-leasing" />
        <div className="app-container"><main><p className="muted">Loading...</p></main></div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="subproduct-root">
        <SuiteDock currentProductId="product-09-storage-leasing" />
        <div className="app-container"><main>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div>
              <h1 style={{ fontSize: 22, color: '#fff' }}>Storage &amp; Leasing Core</h1>
              <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Register your warehouse facility to begin.</p>
            </div>
          </header>
          {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: "var(--s-2)" }}>Register Facility</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <input aria-label="Facility code" placeholder="Code (e.g. WH-01)" value={reg.code} onChange={e => setReg({ ...reg, code: e.target.value })} style={inputStyle} />
              <input aria-label="Facility name" placeholder="Facility name" value={reg.name} onChange={e => setReg({ ...reg, name: e.target.value })} style={inputStyle} />
              <input aria-label="Address" placeholder="Address" value={reg.address} onChange={e => setReg({ ...reg, address: e.target.value })} style={inputStyle} />
              <input aria-label="City" placeholder="City" value={reg.city} onChange={e => setReg({ ...reg, city: e.target.value })} style={inputStyle} />
              <input aria-label="State" placeholder="State" value={reg.state} onChange={e => setReg({ ...reg, state: e.target.value })} style={inputStyle} />
              <select value={reg.ownershipType} onChange={e => setReg({ ...reg, ownershipType: e.target.value as any })} style={inputStyle}>
                <option value="owned">Owned (I own this building)</option>
                <option value="leased_in">Leased (I rent this building)</option>
                <option value="managed">Managed (I manage for owner)</option>
                <option value="sub_leased">Sub-leased (I sub-let part of a rented building)</option>
                <option value="government">Government-owned facility</option>
                <option value="cooperative">Cooperative / shared ownership</option>
                <option value="franchise">Franchised facility</option>
              </select>
              {reg.ownershipType === 'leased_in' && (
                <>
                  <input aria-label="Landlord name" placeholder="Landlord name" value={reg.landlordName} onChange={e => setReg({ ...reg, landlordName: e.target.value })} style={inputStyle} />
                  <input aria-label="Landlord contact" placeholder="Landlord contact" value={reg.landlordContact} onChange={e => setReg({ ...reg, landlordContact: e.target.value })} style={inputStyle} />
                </>
              )}
              <input type="number" aria-label="Total square feet" placeholder="Total sq ft" value={reg.totalArea} onChange={e => setReg({ ...reg, totalArea: Number(e.target.value) })} style={{ ...inputStyle, width: 100 }} />
              <input type="number" aria-label="Usable square feet" placeholder="Usable sq ft" value={reg.usableArea} onChange={e => setReg({ ...reg, usableArea: Number(e.target.value) })} style={{ ...inputStyle, width: 100 }} />
              <input type="number" aria-label="Number of floors" placeholder="Floors" value={reg.floors} onChange={e => setReg({ ...reg, floors: Number(e.target.value) })} style={{ ...inputStyle, width: 70 }} />
              <button onClick={handleRegisterFacility} style={{ padding: '6px 12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Register</button>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 8 }}>No demo data is seeded. All figures come from your inputs. Records persist to your local storage service and stay available across reloads.</p>
          </div>
        </main>
        </div>
      </div>
    );
  }

  return (
    <div className="subproduct-root">
      <SuiteDock currentProductId="product-09-storage-leasing" />
      <div className="app-container"><main>
        <header className="header">
                    <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, color: '#fff' }}>Storage &amp; Leasing Core</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>{facility.name} · {facility.city}, {facility.state} · {facility.spaces.length} spaces</p>
          </div>
          <button onClick={handleReset} className="btn-sm" style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-3)' }}>Reset data</button>
        </header>

        {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}

        <div className="tab-bar" role="tablist" aria-label="Main navigation">
          {(['overview','spaces','leases','ledger','maintenance','meters'] as Tab[]).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div className="card"><div style={{ color: 'var(--text-2)', fontSize: 12 }}>Leasable sq ft</div><div style={{ fontSize: 24, fontWeight: 700 }}>{metrics?.usableAreaSqFt.toLocaleString() ?? 0}</div></div>
              <div className="card"><div style={{ color: 'var(--text-2)', fontSize: 12 }}>Occupied sq ft</div><div style={{ fontSize: 24, fontWeight: 700 }}>{metrics?.leasedAreaSqFt.toLocaleString() ?? 0}</div></div>
              <div className="card"><div style={{ color: 'var(--text-2)', fontSize: 12 }}>Occupancy</div><div style={{ fontSize: 24, fontWeight: 700 }}>{metrics?.occupancyPercent ?? 0}%</div></div>
              <div className="card"><div style={{ color: 'var(--text-2)', fontSize: 12 }}>Monthly rent due</div><div style={{ fontSize: 24, fontWeight: 700 }}>₹{rentSummary.totalDue.toLocaleString()}</div></div>
              <div className="card"><div style={{ color: 'var(--text-2)', fontSize: 12 }}>Overdue</div><div style={{ fontSize: 24, fontWeight: 700, color: '#f87171' }}>₹{rentSummary.totalOverdue.toLocaleString()}</div></div>
              <div className="card"><div style={{ color: 'var(--text-2)', fontSize: 12 }}>Open maintenance</div><div style={{ fontSize: 24, fontWeight: 700 }}>{maintSummary.openCount + maintSummary.inProgressCount}</div></div>
            </div>
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: "var(--s-2)" }}>Add Space</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                <input aria-label="Space code" placeholder="Code" value={newSpace.code} onChange={e => setNewSpace({ ...newSpace, code: e.target.value })} style={inputStyle} />
                <input aria-label="Space name" placeholder="Name" value={newSpace.name} onChange={e => setNewSpace({ ...newSpace, name: e.target.value })} style={inputStyle} />
                <select value={newSpace.type} onChange={e => setNewSpace({ ...newSpace, type: e.target.value as RentableSpace['type'] })} style={inputStyle}>
                  <option value="room">Room</option><option value="chamber">Chamber</option><option value="bay">Bay</option><option value="plot">Plot</option><option value="unit">Unit</option><option value="cold_chamber">Cold Chamber</option><option value="open_yard">Open Yard</option>
                </select>
                <input type="number" aria-label="Length in feet" placeholder="L (ft)" value={newSpace.lengthFt || ''} onChange={e => setNewSpace({ ...newSpace, lengthFt: Number(e.target.value) })} style={{ ...inputStyle, width: 70 }} />
                <input type="number" aria-label="Width in feet" placeholder="W (ft)" value={newSpace.widthFt || ''} onChange={e => setNewSpace({ ...newSpace, widthFt: Number(e.target.value) })} style={{ ...inputStyle, width: 70 }} />
                <select value={newSpace.env} onChange={e => setNewSpace({ ...newSpace, env: e.target.value as RentableSpace['environmentalClass'] })} style={inputStyle}>
                  <option value="ambient">Ambient</option><option value="chilled">Chilled</option><option value="frozen">Frozen</option><option value="hazmat">Hazmat</option>
                </select>
                <button onClick={handleAddSpace} style={{ padding: '6px 12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add Space</button>
              </div>
            </div>
            {receipts.length > 0 && <div className="card"><h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: "var(--s-2)" }}>Receipts Issued</h2><ul style={{ marginTop: 8, fontSize: 13 }}>{receipts.map(r => <li key={r}>{r}</li>)}</ul></div>}
            {getOverdueEntries(ledger, new Date().toISOString().slice(0, 10)).length > 0 && <div className="card"><h2 style={{ fontSize: 15, fontWeight: 600, color: "#f87171", marginBottom: "var(--s-2)" }}>Overdue Entries ({getOverdueEntries(ledger, new Date().toISOString().slice(0, 10)).length})</h2></div>}
          </>
        )}

        {tab === 'spaces' && (
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: "var(--s-2)" }}>Facility Spaces</h2>
            {util && <p style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 4 }}>Utilization: {util.percent}% leased · {util.vacant} sq ft vacant · {util.repair} sq ft under repair · {util.blocked} sq ft blocked</p>}
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  <th scope="col" style={{ textAlign: 'left', padding: 6 }}>Code</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Name</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Type</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>Area</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Status</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Env</th>
                </tr></thead>
                <tbody>{facility.spaces.map((s: RentableSpace) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 6 }}>{s.code}</td><td style={{ padding: 6 }}>{s.name}</td><td style={{ padding: 6 }}>{s.type}</td><td style={{ padding: 6, textAlign: 'right' }}>{s.areaSqFt}</td><td style={{ padding: 6 }}>{s.status}</td><td style={{ padding: 6 }}>{s.environmentalClass}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {facility.spaces.length === 0 && <p className="muted" style={{ marginTop: 8 }}>No spaces yet. Add one above.</p>}
          </div>
        )}

        {tab === 'leases' && (
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: "var(--s-2)" }}>Onboard Tenant &amp; Create Lease</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <input aria-label="Tenant name" placeholder="Tenant name" value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })} style={inputStyle} />
              <input aria-label="GSTIN (optional)" placeholder="GSTIN (optional)" value={newTenant.gstin} onChange={e => setNewTenant({ ...newTenant, gstin: e.target.value })} style={inputStyle} />
              <input aria-label="Contact person" placeholder="Contact person" value={newTenant.contactPerson} onChange={e => setNewTenant({ ...newTenant, contactPerson: e.target.value })} style={inputStyle} />
              <input aria-label="Phone number" placeholder="Phone" value={newTenant.phone} onChange={e => setNewTenant({ ...newTenant, phone: e.target.value })} style={inputStyle} />
              <input aria-label="Address" placeholder="Address" value={newTenant.address} onChange={e => setNewTenant({ ...newTenant, address: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <select value={newLease.spaceId} onChange={e => setNewLease({ ...newLease, spaceId: e.target.value })} style={inputStyle}>
                <option value="">Select vacant space</option>
                {facility.spaces.filter(s => s.status === 'vacant' || s.status === 'temporarily_reserved').map(s => <option key={s.id} value={s.id}>{s.code} ({s.areaSqFt} sq ft)</option>)}
              </select>
              <input type="date" value={newLease.start} onChange={e => setNewLease({ ...newLease, start: e.target.value })} style={inputStyle} />
              <input type="date" value={newLease.end} onChange={e => setNewLease({ ...newLease, end: e.target.value })} style={inputStyle} />
              <input type="number" aria-label="Lease rate" placeholder="Rate" value={newLease.rate || ''} onChange={e => setNewLease({ ...newLease, rate: Number(e.target.value) })} style={{ ...inputStyle, width: 80 }} />
              <select value={newLease.billing} onChange={e => setNewLease({ ...newLease, billing: e.target.value as Lease['billingUnit'] })} style={inputStyle}>
                <option value="sqft_month">₹/sqft/month</option>
                <option value="pallet_day">₹/pallet/day</option>
                <option value="tonne_month">₹/tonne/month</option>
                <option value="container_day">₹/container/day</option>
                <option value="unit_month">₹/unit/month</option>
                <option value="bag_month">₹/bag/month (agri)</option>
                <option value="revenue_share">% of revenue</option>
                <option value="fixed">Fixed monthly</option>
              </select>
              <input type="number" aria-label="Security deposit" placeholder="Deposit" value={newLease.deposit || ''} onChange={e => setNewLease({ ...newLease, deposit: Number(e.target.value) })} style={{ ...inputStyle, width: 90 }} />
              <input type="number" aria-label="Escalation percentage" placeholder="Escalation %" value={newLease.escalation || ''} onChange={e => setNewLease({ ...newLease, escalation: Number(e.target.value) })} style={{ ...inputStyle, width: 90 }} />
              <button onClick={handleOnboardTenant} style={{ padding: '6px 12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Onboard &amp; Lease</button>
            </div>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: 'var(--text-2)', fontSize: 13 }}>Tenants ({tenants.length})</h3>
              <ul style={{ marginTop: 4, fontSize: 13, paddingLeft: 18 }}>{tenants.map(t => <li key={t.id}>{t.name} {t.gstin ? `(${t.gstin})` : ''} — {t.phone} {t.address ? `· ${t.address}` : ''}</li>)}</ul>
            </div>
            <div style={{ marginTop: 12 }}>
              <h3 style={{ color: 'var(--text-2)', fontSize: 13 }}>Leases ({leases.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
                    <th scope="col" style={{ textAlign: 'left', padding: 6 }}>Lease</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Tenant</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Space</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Period</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Status</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>Rate</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>Deposit</th>
                  </tr></thead>
                  <tbody>{leases.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 6 }}>{l.id.slice(0, 14)}</td><td style={{ padding: 6 }}>{tenants.find(t => t.id === l.tenantId)?.name ?? l.tenantId}</td><td style={{ padding: 6 }}>{l.spaceId}</td><td style={{ padding: 6 }}>{l.startDate} → {l.endDate}</td><td style={{ padding: 6 }}>{l.status}</td><td style={{ padding: 6, textAlign: 'right' }}>₹{l.rate}/{l.billingUnit}</td><td style={{ padding: 6, textAlign: 'right' }}>₹{l.depositAmount}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            {leases.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)' }}>
                Renewal preview: {(() => { try { const p = previewRenewal(leases[0], '2027-11-01', '2028-10-31', leases[0].rate * 1.05, leases[0].escalationPercentPerYear + 1); return `new rate ₹${p.newRate}, escalation ${p.escalation}%`; } catch { return 'n/a'; } })()}
              </div>
            )}
          </div>
        )}

        {tab === 'ledger' && (
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: "var(--s-2)" }}>Rent Ledger</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 4 }}>Total due ₹{rentSummary.totalDue} · Paid ₹{rentSummary.totalPaid} · Overdue ₹{rentSummary.totalOverdue} ({rentSummary.overdueCount}) · Pending {rentSummary.pendingCount}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <input type="number" value={monthlyYear} onChange={e => setMonthlyYear(Number(e.target.value))} style={{ ...inputStyle, width: 70 }} aria-label="Year" placeholder="Year" />
              <input type="number" value={monthlyMonth} onChange={e => setMonthlyMonth(Number(e.target.value))} style={{ ...inputStyle, width: 60 }} aria-label="Month" placeholder="Month" />
              <button onClick={handleGenerateMonthly} style={{ padding: '6px 12px', background: 'var(--bg-4)', color: 'var(--text-1)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Generate Monthly</button>
              <select value={paymentEntryId} onChange={e => setPaymentEntryId(e.target.value)} style={inputStyle}>
                <option value="">Select entry</option>
                {getPendingEntries(ledger).map(e => <option key={e.id} value={e.id}>{e.id.slice(0, 12)} (₹{e.totalDue - e.amountPaid})</option>)}
              </select>
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} aria-label="Payment amount" placeholder="Amount" />
              <button onClick={handleRecordPayment} style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Record Payment + Receipt</button>
            </div>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  <th scope="col" style={{ textAlign: 'left', padding: 6 }}>ID</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Period</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>Base</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>Elec</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>Total</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>Paid</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Status</th><th scope="col" style={{ textAlign: 'left', padding: 6 }}>Receipt</th>
                </tr></thead>
                <tbody>{ledger.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 6 }}>{e.id.slice(0, 14)}</td><td style={{ padding: 6 }}>{e.periodStart}→{e.periodEnd}</td><td style={{ padding: 6, textAlign: 'right' }}>₹{e.baseRent}</td><td style={{ padding: 6, textAlign: 'right' }}>₹{e.electricityCharge}</td><td style={{ padding: 6, textAlign: 'right' }}>₹{e.totalDue}</td><td style={{ padding: 6, textAlign: 'right' }}>₹{e.amountPaid}</td><td style={{ padding: 6 }}>{e.paymentStatus}</td><td style={{ padding: 6 }}>{e.receiptNumber ?? '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {ledger.length === 0 && <p className="muted" style={{ marginTop: 8 }}>No ledger entries. Onboard a tenant on the Leases tab or generate monthly.</p>}
            {receipts.length > 0 && <div style={{ marginTop: 12 }}><h3 style={{ color: 'var(--text-2)', fontSize: 13 }}>Receipts Issued</h3><ul style={{ marginTop: 4, fontSize: 13, paddingLeft: 18 }}>{receipts.map(r => <li key={r}>{r}</li>)}</ul></div>}
          </div>
        )}

        {tab === 'maintenance' && (
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: "var(--s-2)" }}>Maintenance Tasks</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 4 }}>Open {maintSummary.openCount} · In progress {maintSummary.inProgressCount} · Resolved {maintSummary.resolvedCount} · Est. ₹{maintSummary.totalEstimatedCost} · Actual ₹{maintSummary.totalActualCost}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <select value={newMaint.spaceId} onChange={e => setNewMaint({ ...newMaint, spaceId: e.target.value })} style={inputStyle}>
                <option value="">Space (optional)</option>
                {facility.spaces.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
              </select>
              <select value={newMaint.category} onChange={e => setNewMaint({ ...newMaint, category: e.target.value as MaintenanceTask['category'] })} style={inputStyle}>
                <option value="roof">Roof</option><option value="flooring">Flooring</option><option value="shutter">Shutter</option><option value="electrical">Electrical</option><option value="water">Water</option><option value="fire_safety">Fire Safety</option><option value="refrigeration">Refrigeration</option><option value="other">Other</option>
              </select>
              <input aria-label="Maintenance title" placeholder="Title" value={newMaint.title} onChange={e => setNewMaint({ ...newMaint, title: e.target.value })} style={inputStyle} />
              <input aria-label="Maintenance description" placeholder="Description" value={newMaint.description} onChange={e => setNewMaint({ ...newMaint, description: e.target.value })} style={inputStyle} />
              <input type="number" aria-label="Estimated cost" placeholder="Est. cost" value={newMaint.cost || ''} onChange={e => setNewMaint({ ...newMaint, cost: Number(e.target.value) })} style={{ ...inputStyle, width: 90 }} />
              <button onClick={handleMaintenanceOpen} style={{ padding: '6px 12px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Report</button>
            </div>
            <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 13 }}>
              {maintenance.map(t => (
                <li key={t.id} style={{ marginBottom: 8 }}>
                  <strong>{t.title}</strong> — {t.category} — est. ₹{t.estimatedCost}{t.actualCost !== undefined ? ` / actual ₹${t.actualCost} (variance ₹${costVariance(t)})` : ''} — {t.status}
                  <div style={{ marginTop: 4 }}>
                    {t.status === 'open' && <button onClick={() => handleMaintenanceStart(t.id)} style={{ padding: '4px 8px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 4, fontSize: 12 }}>Start</button>}
                    {(t.status === 'open' || t.status === 'in_progress') && <button onClick={() => handleMaintenanceResolve(t.id)} style={{ padding: '4px 8px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Resolve</button>}
                    {t.status === 'open' && <button onClick={() => handleMaintenanceCancel(t.id)} style={{ padding: '4px 8px', background: 'var(--bg-4)', color: 'var(--text-1)', border: 'none', borderRadius: 4, cursor: 'pointer', marginLeft: 4, fontSize: 12 }}>Cancel</button>}
                  </div>
                </li>
              ))}
            </ul>
            {maintenance.length === 0 && <p className="muted">No maintenance tasks. Report one above.</p>}
          </div>
        )}

        {tab === 'meters' && (
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: "var(--s-2)" }}>Meter Readings &amp; Electricity Charges</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 4 }}>Tariff ₹8/kWh · DG ₹12/kWh (off by default)</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <select value={newMeter.spaceId} onChange={e => setNewMeter({ ...newMeter, spaceId: e.target.value })} style={inputStyle}>
                <option value="">Space</option>
                {facility.spaces.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
              </select>
              <input type="number" aria-label="Kilowatt hours" placeholder="kWh" value={newMeter.kwh || ''} onChange={e => setNewMeter({ ...newMeter, kwh: Number(e.target.value) })} style={{ ...inputStyle, width: 80 }} />
              <button onClick={handleMeterReading} style={{ padding: '6px 12px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Record Reading</button>
            </div>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 400 }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  <th scope="col" style={{ textAlign: 'left', padding: 6 }}>Space</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>kWh</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>Energy ₹</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>DG ₹</th><th scope="col" style={{ textAlign: 'right', padding: 6 }}>Total ₹</th>
                </tr></thead>
                <tbody>{charges.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 6 }}>{c.spaceId}</td><td style={{ padding: 6, textAlign: 'right' }}>{c.kwh}</td><td style={{ padding: 6, textAlign: 'right' }}>₹{c.energyCharge}</td><td style={{ padding: 6, textAlign: 'right' }}>₹{c.dgCharge}</td><td style={{ padding: 6, textAlign: 'right' }}>₹{c.total}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {meterReadings.length === 0 && <p className="muted" style={{ marginTop: 8 }}>No meter readings. Record one above.</p>}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
