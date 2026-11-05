/**
 * Offline Outbox for Storage & Leasing Core.
 * Queues mutations (meter readings, ledger payments, maintenance tasks) in
 * localStorage when the network/storage server is unreachable, and replays them
 * in order when connectivity returns. Idempotent by client-generated id.
 */

export interface OutboxEntry {
  id: string;
  kind: 'meter_reading' | 'ledger_payment' | 'maintenance_task' | 'space_update';
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

const KEY = 'p09-offline-outbox';

export class OfflineOutbox {
  constructor(private storage: Storage | null = (typeof localStorage !== 'undefined' ? localStorage : null)) {}

  private read(): OutboxEntry[] {
    if (!this.storage) return [];
    try { return JSON.parse(this.storage.getItem(KEY) ?? '[]'); } catch { return []; }
  }
  private write(entries: OutboxEntry[]): void {
    if (!this.storage) return;
    this.storage.setItem(KEY, JSON.stringify(entries));
  }

  enqueue(entry: Omit<OutboxEntry, 'createdAt' | 'attempts'>): OutboxEntry {
    const full: OutboxEntry = { ...entry, createdAt: new Date().toISOString(), attempts: 0 };
    const entries = this.read();
    if (entries.some(e => e.id === full.id)) return entries.find(e => e.id === full.id)!;
    entries.push(full);
    this.write(entries);
    return full;
  }

  list(): OutboxEntry[] { return this.read(); }
  size(): number { return this.read().length; }

  async replay(handler: (e: OutboxEntry) => Promise<void>): Promise<{ ok: number; failed: number }> {
    const entries = this.read();
    let ok = 0, failed = 0;
    const remaining: OutboxEntry[] = [];
    for (const e of entries) {
      try {
        await handler(e);
        ok++;
      } catch (err) {
        failed++;
        remaining.push({ ...e, attempts: e.attempts + 1, lastError: (err as Error).message });
      }
    }
    this.write(remaining);
    return { ok, failed };
  }

  clear(): void { this.write([]); }
}