import { useState, useEffect, useCallback, useRef } from 'react';
import type { Facility, Tenant, Lease, RentLedgerEntry, MaintenanceTask, StorageEvent } from '../../engine/types';
import type { MeterSubReading } from '../../engine/storageClient';
import { loadState as loadStateAsync, saveState as saveStateAsync, resetState } from '../../engine/storageClient';
import { preparePayment, type FinancialState } from '../../engine/paymentTransaction';

export type Tab =
  | 'overview'
  | 'spaces'
  | 'leases'
  | 'ledger'
  | 'maintenance'
  | 'meters'
  | 'analytics'
  | 'audit';

export type MeterReading = MeterSubReading;

export interface FacilityStore {
  facility: Facility | null;
  tenants: Tenant[];
  leases: Lease[];
  ledgerEntries: RentLedgerEntry[];
  maintenanceTasks: MaintenanceTask[];
  meterReadings: MeterReading[];
  receipts: string[];
  /** Locally stored events; append-only integrity is not established. */
  events: StorageEvent[];
  loading: boolean;
  resetting: boolean;
  storageError: string | null;
  storageSaveStatus: string | null;
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
  recordPaymentAndReceipt: (entryId: string, amount: number, paidDate: string) => ReturnType<typeof preparePayment>;
  reset: () => Promise<import('../../engine/storageClient').ResetStateResult>;
}

export function useFacilityStore(): FacilityStore {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [financial, setFinancial] = useState<FinancialState>({ ledgerEntries: [], receipts: [] });
  const financialRef = useRef(financial);
  const replaceFinancial = useCallback((next: FinancialState) => { financialRef.current = next; setFinancial(next); }, []);
  const setLedgerEntries: React.Dispatch<React.SetStateAction<RentLedgerEntry[]>> = useCallback((next) => {
    const current = financialRef.current;
    replaceFinancial({ ...current, ledgerEntries: typeof next === 'function' ? next(current.ledgerEntries) : next });
  }, [replaceFinancial]);
  const setReceipts: React.Dispatch<React.SetStateAction<string[]>> = useCallback((next) => {
    const current = financialRef.current;
    replaceFinancial({ ...current, receipts: typeof next === 'function' ? next(current.receipts) : next });
  }, [replaceFinancial]);
  const { ledgerEntries, receipts } = financial;
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [events, setEvents] = useState<StorageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const resettingRef = useRef(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageSaveStatus, setStorageSaveStatus] = useState<string | null>(null);
  const saveSequence = useRef(0);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadStateAsync().then((s) => {
      if (cancelled) return;
      if (s) {
        setFacility(s.facility);
        setTenants(s.tenants ?? []);
        setLeases(s.leases ?? []);
        replaceFinancial({ ledgerEntries: s.ledger ?? [], receipts: s.receipts ?? [] });
        setMaintenanceTasks(s.maintenance ?? []);
        setMeterReadings(s.meterReadings ?? []);
        setEvents(s.events ?? []);
      }
      setLoading(false);
    }).catch((e) => {
      if (cancelled) return;
      setStorageError((e as Error).message);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [replaceFinancial]);

  useEffect(() => {
    if (loading || storageError) return;
    const sequence = ++saveSequence.current;
    saveStateAsync({
      facility,
      tenants,
      leases,
      ledger: ledgerEntries,
      maintenance: maintenanceTasks,
      meterReadings,
      receipts,
      events,
    }).then((transport) => {
      if (sequence === saveSequence.current) setStorageSaveStatus(transport === 'local' ? 'Changes are saved only in this browser. They will not automatically sync with the storage server; review both copies before reconciling.' : null);
    }).catch((error: unknown) => {
      if (sequence === saveSequence.current) setStorageSaveStatus(error instanceof Error ? error.message : 'Data was not saved. Keep this page open to preserve the current session.');
    });
  }, [facility, tenants, leases, ledgerEntries, maintenanceTasks, meterReadings, receipts, events, loading, storageError]);

  const flash = useCallback((msg: string) => {
    setFlashMsg(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashMsg(null), 4000);
  }, []);

  const recordPaymentAndReceipt = useCallback((entryId: string, amount: number, paidDate: string) => {
    if (resettingRef.current) throw new Error('Reset is in progress; payment was not recorded.');
    const prepared = preparePayment(financialRef.current, entryId, amount, paidDate);
    replaceFinancial(prepared.state);
    return prepared;
  }, [replaceFinancial]);

  const reset = useCallback(async () => {
    if (resettingRef.current) return { serverDeleted: null, localDeleted: false, warnings: ['A reset is already in progress.'] };
    resettingRef.current = true;
    setResetting(true);
    try {
    const result = await resetState();
    if (result.warnings.length) setStorageSaveStatus(result.warnings.join(' '));
    // Only clear in-memory state when local state was actually cleared; keep UI honest if deletion failed.
    if (result.localDeleted) {
      setFacility(null);
      setTenants([]);
      setLeases([]);
      replaceFinancial({ ledgerEntries: [], receipts: [] });
      setMaintenanceTasks([]);
      setMeterReadings([]);
      setEvents([]);
      setTab('overview');
    }
    return result;
    } finally { resettingRef.current = false; setResetting(false); }
  }, [replaceFinancial]);

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
    setReceipts,
    setEvents,
    recordPaymentAndReceipt,
    reset,
  };
}
