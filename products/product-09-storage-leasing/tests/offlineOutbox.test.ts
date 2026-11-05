import { describe, it, expect, beforeEach } from 'vitest';
import { OfflineOutbox } from '../src/engine/offlineOutbox';

describe('OfflineOutbox', () => {
  let storage: Storage;
  beforeEach(() => {
    const mem: Record<string, string> = {};
    storage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; }, clear: () => {}, key: () => null, length: 0 } as Storage;
  });
  it('enqueues and lists', () => {
    const o = new OfflineOutbox(storage);
    o.enqueue({ id: '1', kind: 'meter_reading', payload: { kwh: 5 } });
    expect(o.size()).toBe(1);
    expect(o.list()[0].id).toBe('1');
  });
  it('dedupes by id', () => {
    const o = new OfflineOutbox(storage);
    o.enqueue({ id: '1', kind: 'meter_reading', payload: { kwh: 5 } });
    o.enqueue({ id: '1', kind: 'meter_reading', payload: { kwh: 9 } });
    expect(o.size()).toBe(1);
  });
  it('replays and clears successful', async () => {
    const o = new OfflineOutbox(storage);
    o.enqueue({ id: '1', kind: 'meter_reading', payload: { kwh: 5 } });
    o.enqueue({ id: '2', kind: 'meter_reading', payload: { kwh: 7 } });
    const res = await o.replay(async () => {});
    expect(res.ok).toBe(2);
    expect(res.failed).toBe(0);
    expect(o.size()).toBe(0);
  });
  it('keeps failed entries', async () => {
    const o = new OfflineOutbox(storage);
    o.enqueue({ id: '1', kind: 'meter_reading', payload: { kwh: 5 } });
    const res = await o.replay(async () => { throw new Error('boom'); });
    expect(res.ok).toBe(0);
    expect(res.failed).toBe(1);
    expect(o.list()[0].lastError).toBe('boom');
  });
});