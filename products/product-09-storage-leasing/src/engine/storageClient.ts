/**
 * Storage Client — P09
 *
 * One state shape, two transports:
 *   1. The loopback storage server (`packages/storage-server`, port 5182).
 *   2. `localStorage`, used only when the server is unreachable.
 *
 * An offline branch stays local for the session. A later startup compares both
 * copies and blocks on divergence instead of choosing one automatically.
 */

import type {
  Facility,
  Lease,
  MaintenanceTask,
  RentLedgerEntry,
  StorageEvent,
  Tenant,
} from './types';

const SERVER_URL = 'http://127.0.0.1:5182';
const STORAGE_KEY = 'p09-state-v2';
let sessionTransport: 'blocked' | 'server' | 'local' = 'blocked';
let sessionRevision: string | null = null;
let retainedUnknownFields: Record<string, unknown> = {};
let expectedLocalRaw: string | null = null;
let pendingWrite: Promise<void> = Promise.resolve();
let resetInProgress = false;

/**
 * Electricity sub-meter consumption, the exact projection
 * `computeElectricityCharges({ subReadings })` consumes.
 */
export interface MeterSubReading {
  spaceId: string;
  kwh: number;
  /** Absent on legacy readings whose period was not recorded. */
  periodStart?: string;
  periodEnd?: string;
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
  /** Locally stored events; append-only integrity or publication is not established. */
  events?: StorageEvent[];
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
    events: [],
  };
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.schemaVersion !== 1) return false;
  if (!('facility' in candidate)) return false;
  if (candidate.facility !== null && typeof candidate.facility !== 'object') return false;
  const requiredArraysOk = ['tenants', 'leases', 'ledger', 'maintenance', 'meterReadings', 'receipts'].every(
    key => Array.isArray(candidate[key]),
  );
  if (!requiredArraysOk) return false;
  // events is additive/optional for schema-v1 compatibility; if present it must be an array.
  if ('events' in candidate && candidate.events !== undefined && !Array.isArray(candidate.events)) return false;
  return true;
}

function normalizeState(state: PersistedState): PersistedState {
  return {
    ...state,
    events: Array.isArray(state.events) ? state.events : [],
  };
}

/** Retain same-version fields that this client does not own or understand. */
function unknownFields(state: PersistedState | null): Record<string, unknown> {
  if (!state) return {};
  const known = new Set(Object.keys(emptyState()));
  return Object.fromEntries(Object.entries(state).filter(([key]) => !known.has(key)));
}

function readLocal(): PersistedState | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    throw new Error('Local stored data could not be read. No automatic save was started.');
  }
  expectedLocalRaw = raw;
  if (raw === null) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Local stored data is unreadable. The original is preserved.'); }
  if (!isPersistedState(parsed)) throw new Error('Local stored data has an unrecognized format. The original is preserved.');
  return normalizeState(parsed);
}

export async function loadState(): Promise<PersistedState | null> {
  sessionTransport = 'blocked';
  sessionRevision = null;
  retainedUnknownFields = {};
  expectedLocalRaw = null;
  const local = readLocal();
  let res: Response;
  try {
    res = await fetch(`${SERVER_URL}/data`, { method: 'GET' });
  } catch {
    retainedUnknownFields = unknownFields(local);
    sessionTransport = 'local';
    return local;
  }
  if (!res.ok) throw new Error(`Storage server could not provide state (HTTP ${res.status}). Existing data is preserved.`);
  let data: unknown;
  try { data = await res.json(); } catch { throw new Error('Storage server returned unreadable data. Existing data is preserved.'); }
  if (!isPersistedState(data)) throw new Error('Storage server returned an unrecognized state. Existing data is preserved.');
  const server = normalizeState(data);
  if (local && JSON.stringify(local) !== JSON.stringify(server)) {
    throw new Error('Local and server data differ. Automatic writes are blocked until the conflict is reviewed; both copies are preserved.');
  }
  retainedUnknownFields = unknownFields(local ?? server);
  sessionRevision = res.headers?.get('etag') ?? null;
  // Older servers without conditional-write support are safe to read, not write.
  sessionTransport = sessionRevision ? 'server' : 'local';
  return server;
}

export async function saveState(state: Omit<PersistedState, 'schemaVersion'>): Promise<'server' | 'local'> {
  if (resetInProgress) throw new Error('Data was not saved: reset is in progress. Review changes after reset finishes.');
  const payload: PersistedState = { ...emptyState(), ...state, ...retainedUnknownFields, schemaVersion: 1 };
  const currentWrite = pendingWrite.then(() => persistState(payload));
  pendingWrite = currentWrite.then(() => undefined, () => undefined);
  return currentWrite;
}

async function persistState(payload: PersistedState): Promise<'server' | 'local'> {
  if (sessionTransport === 'blocked') throw new Error('Data was not saved: storage has not been safely loaded or needs review.');
  assertLocalUnchanged(false);
  if (sessionTransport === 'server') {
    let res: Response | null = null;
    try {
      res = await fetch(`${SERVER_URL}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'If-Match': sessionRevision! },
        body: JSON.stringify(payload),
      });
    } catch {
      // The request may have reached the server. Preserve the local branch and
      // require a fresh comparison before any later server write.
    }
    if (res?.ok) {
      assertLocalUnchanged(true);
      sessionRevision = res.headers?.get('etag') ?? null;
      if (sessionRevision) return 'server';
    }
    sessionTransport = 'local';
  }
  assertLocalUnchanged(false);
  try {
    const nextRaw = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, nextRaw);
    expectedLocalRaw = nextRaw;
    return 'local';
  } catch {
    throw new Error('Data was not saved: local storage is full or unavailable. Keep this page open and recover your changes before reloading.');
  }
}

function assertLocalUnchanged(serverMayHaveSaved: boolean): void {
  let currentRaw: string | null;
  try { currentRaw = localStorage.getItem(STORAGE_KEY); } catch {
    sessionTransport = 'blocked';
    throw new Error(`${serverMayHaveSaved ? 'The server may have saved. ' : ''}Local storage could not be read; keep this page open and review the stored copy.`);
  }
  if (currentRaw !== expectedLocalRaw) {
    sessionTransport = 'blocked';
    throw new Error(`${serverMayHaveSaved ? 'The server may have saved. ' : 'Data was not saved: '}Local storage changed since this session last read or saved it. Keep this page open and review both copies.`);
  }
}

/** Clear both transports so a reset is a real reset, not an overwrite. */
export interface ResetStateResult {
  /** true = server acknowledged delete; false = server responded with error; null = server unreachable/unavailable. */
  serverDeleted: boolean | null;
  localDeleted: boolean;
  warnings: string[];
}

/**
 * Attempts to clear persisted P09 state. Reports outcomes honestly; callers must not claim success
 * without checking this result. This is a destructive local/dev convenience — hosted multi-user
 * production would require authorized, audited deletion boundaries.
 */
export async function resetState(): Promise<ResetStateResult> {
  if (resetInProgress) return { serverDeleted: null, localDeleted: false, warnings: ['A reset is already in progress.'] };
  resetInProgress = true;
  const reset = pendingWrite.then(() => resetPersistedState());
  pendingWrite = reset.then(() => undefined, () => undefined);
  try { return await reset; } finally { resetInProgress = false; }
}

async function resetPersistedState(): Promise<ResetStateResult> {
  const warnings: string[] = [];
  let serverDeleted: boolean | null = null;
  if (sessionTransport === 'blocked') return { serverDeleted: null, localDeleted: false, warnings: ['Storage needs review before any reset.'] };
  if (Object.keys(retainedUnknownFields).length) return { serverDeleted: null, localDeleted: false, warnings: ['Unrecognized stored fields require review before reset; data was preserved.'] };
  try {
    if (localStorage.getItem(STORAGE_KEY) !== expectedLocalRaw) {
      sessionTransport = 'blocked';
      return { serverDeleted: null, localDeleted: false, warnings: ['Local storage changed since this session last read or saved it; review both copies before reset.'] };
    }
  } catch {
    sessionTransport = 'blocked';
    return { serverDeleted: null, localDeleted: false, warnings: ['Local storage could not be read; data was preserved for review.'] };
  }
  if (sessionTransport === 'server') {
    try {
      const res = await fetch(`${SERVER_URL}/data`, { method: 'DELETE', headers: { 'If-Match': sessionRevision! } });
      if (res.ok) {
        serverDeleted = true;
        sessionRevision = res.headers?.get('etag') ?? null;
        if (!sessionRevision) sessionTransport = 'local';
      }
      else {
        serverDeleted = false;
        sessionTransport = 'blocked';
        warnings.push(`Server reset failed (HTTP ${res.status}). Local data was preserved; review both copies before further writes.`);
        return { serverDeleted, localDeleted: false, warnings };
      }
    } catch {
      sessionTransport = 'blocked';
      warnings.push('The server reset outcome is unknown. Local data was preserved; review both copies before further writes.');
      return { serverDeleted: null, localDeleted: false, warnings };
    }
  } else {
    warnings.push('Offline session: server data was not contacted or cleared.');
  }
  try {
    if (localStorage.getItem(STORAGE_KEY) !== expectedLocalRaw) {
      sessionTransport = 'blocked';
      warnings.push(`${serverDeleted ? 'The server reset was acknowledged, but ' : ''}local storage changed during reset and was preserved; review both copies.`);
      return { serverDeleted, localDeleted: false, warnings };
    }
  } catch {
    sessionTransport = 'blocked';
    warnings.push(`${serverDeleted ? 'The server reset was acknowledged, but ' : ''}local storage could not be read and was preserved; review both copies.`);
    return { serverDeleted, localDeleted: false, warnings };
  }
  let localDeleted = false;
  try {
    localStorage.removeItem(STORAGE_KEY);
    expectedLocalRaw = null;
    localDeleted = true;
  } catch {
    sessionTransport = 'blocked';
    warnings.push('Could not clear local browser storage.');
  }
  return { serverDeleted, localDeleted, warnings };
}

export const storageConfig = { SERVER_URL, STORAGE_KEY } as const;
