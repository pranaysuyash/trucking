/**
 * Storage Client — P09
 *
 * One canonical state shape, two interchangeable transports:
 *   1. The loopback storage server (`packages/storage-server`, port 5182).
 *   2. `localStorage`, used only when the server is unreachable.
 *
 * The server is authoritative whenever it answers. Its `GET /data` always
 * returns a complete shape, so a valid response is never confused with
 * "nothing saved yet" — `facility: null` is the explicit empty state.
 */

import type {
  Facility,
  Lease,
  MaintenanceTask,
  RentLedgerEntry,
  Tenant,
} from './types';

const SERVER_URL = 'http://127.0.0.1:5182';
const STORAGE_KEY = 'p09-state-v2';

/**
 * Electricity sub-meter consumption, the exact projection
 * `computeElectricityCharges({ subReadings })` consumes.
 */
export interface MeterSubReading {
  spaceId: string;
  kwh: number;
}

export interface PersistedState {
  schemaVersion: 1;
  facility: Facility | null;
  tenants: Tenant[];
  leases: Lease[];
  ledger: RentLedgerEntry[];
  maintenance: MaintenanceTask[];
  meterReadings: MeterSubReading[];
  receipts: string[];
}

export function emptyState(): PersistedState {
  return {
    schemaVersion: 1,
    facility: null,
    tenants: [],
    leases: [],
    ledger: [],
    maintenance: [],
    meterReadings: [],
    receipts: [],
  };
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (!('facility' in candidate)) return false;
  if (candidate.facility !== null && typeof candidate.facility !== 'object') return false;
  return ['tenants', 'leases', 'ledger', 'maintenance', 'meterReadings', 'receipts'].every(
    key => Array.isArray(candidate[key]),
  );
}

function readLocal(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isPersistedState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function loadState(): Promise<PersistedState | null> {
  try {
    const res = await fetch(`${SERVER_URL}/data`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (isPersistedState(data)) return data;
    }
  } catch {
    /* server unavailable, fall through to local */
  }
  return readLocal();
}

export async function saveState(state: Omit<PersistedState, 'schemaVersion'>): Promise<void> {
  const payload: PersistedState = { ...emptyState(), ...state, schemaVersion: 1 };
  try {
    const res = await fetch(`${SERVER_URL}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return;
  } catch {
    /* server unavailable, fall through to local */
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* storage full or blocked; in-memory state still works for the session */
  }
}

/** Clear both transports so a reset is a real reset, not an overwrite. */
export async function resetState(): Promise<void> {
  try {
    await fetch(`${SERVER_URL}/data`, { method: 'DELETE' });
  } catch {
    /* server unavailable */
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const storageConfig = { SERVER_URL, STORAGE_KEY } as const;
