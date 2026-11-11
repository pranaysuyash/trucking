import { describe, it, expect } from 'vitest';
import { createStorageEvent } from '../src/engine/auditEvents';
import { emptyState } from '../src/engine/storageClient';

describe('audit events (additive, schema-v1 compatible)', () => {
  it('creates a storage event with required audit fields', () => {
    const e = createStorageEvent({
      eventType: 'lease.activated',
      facilityId: 'F1',
      spaceId: 'S1',
      tenantId: 'T1',
      leaseId: 'L1',
      payload: { status: 'active' },
    });
    expect(e.eventType).toBe('lease.activated');
    expect(e.facilityId).toBe('F1');
    expect(e.verificationStatus).toBe('reported');
    expect(e.actor).toBe('Not supplied');
    expect(e.eventId).toMatch(/^evt-/);
    expect(e.payload).toEqual({ status: 'active' });
  });

  it('emptyState includes events array for additive audit trail', () => {
    const s = emptyState();
    expect(s.schemaVersion).toBe(1);
    expect(s.events).toEqual([]);
  });
});
