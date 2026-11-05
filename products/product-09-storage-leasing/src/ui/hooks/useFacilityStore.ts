import { useState, useEffect, useCallback, useRef } from 'react';
import type { Facility, Tenant, Lease, RentLedgerEntry, MaintenanceTask, StorageEvent } from '../../engine/types';
import type { MeterSubReading } from '../../engine/storageClient';
import { loadState as loadStateAsync, saveState as saveStateAsync, resetState } from '../../engine/storageClient';

export type Tab =
  | 'overview'
  | 'spaces'
  | 'leases'
  | 'ledger'
  | 'maintenance'
  | 'meters'
  | 'analytics';

export type MeterReading = MeterSubReading;

export interface FacilityStore {
  facility: Facility | null;
  tenants: Tenant[];
  leases: Lease[];
  ledgerEntries: RentLedgerEntry[];
  maintenanceTasks: MaintenanceTask[];
  meterReadings: MeterReading[];
  receipts: string[];
  /** Append-only audit events (additive, schema-v1 compatible). */
  events: StorageEvent[];
  loading: boolean;
  flashMsg: string | null;
  tab: Tab;
  setTab: (t: Tab) => void;
  flash: (msg: string) => void;
  setFacility: React.Dispatch<React.SetStateAction<Facility | null>>;
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  setLeases: React.Dispatch<React.SetStateAction<Lease[]>>;
  setLedgerEntries: React.Dispatch<React.SetStateAction<RentLedgerEntry[]>>;
  setMaintenanceTasks: React.Dispatch<React.SetStateAction<MaintenanceTask[]>>;
  setMeterReadings: React.Dispatch<React.SetStateAction<MeterReading[]>>;
  setReceipts: React.Dispatch<React.SetStateAction<string[]>>;
  setEvents: React.Dispatch<React.SetStateAction<StorageEvent[]>>;
  reset: () => Promise<void>;
}

export function useFacilityStore(): FacilityStore {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<RentLedgerEntry[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [receipts, setReceipts] = useState<string[]>([]);
  const [events, setEvents] = useState<StorageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadStateAsync().then((s) => {
      if (cancelled) return;
      if (s && s.facility) {
        setFacility(s.facility);
        setTenants(s.tenants ?? []);
        setLeases(s.leases ?? []);
        setLedgerEntries(s.ledger ?? []);
        setMaintenanceTasks(s.maintenance ?? []);
        setMeterReadings(s.meterReadings ?? []);
        setReceipts(s.receipts ?? []);
        setEvents(s.events ?? []);
      } else if (s) {
        // Valid empty canonical state (facility null) — still hydrate additive collections if present.
        setEvents(s.events ?? []);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    saveStateAsync({
      facility,
      tenants,
      leases,
      ledger: ledgerEntries,
      maintenance: maintenanceTasks,
      meterReadings,
      receipts,
      events,
    });
  }, [facility, tenants, leases, ledgerEntries, maintenanceTasks, meterReadings, receipts, events, loading]);

  const flash = useCallback((msg: string) => {
    setFlashMsg(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashMsg(null), 4000);
  }, []);

  const reset = useCallback(async () => {
    await resetState();
    setFacility(null);
    setTenants([]);
    setLeases([]);
    setLedgerEntries([]);
    setMaintenanceTasks([]);
    setMeterReadings([]);
    setReceipts([]);
    setEvents([]);
    setTab('overview');
  }, []);

  return {
    facility,
    tenants,
    leases,
    ledgerEntries,
    maintenanceTasks,
    meterReadings,
    receipts,
    events,
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
    setEvents,
    reset,
  };
}