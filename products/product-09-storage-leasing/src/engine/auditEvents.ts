import type { StorageEvent } from './types';

export function createStorageEvent(input: {
  eventId?: string;
  eventType: string;
  eventTime?: string;
  facilityId: string;
  spaceId?: string;
  tenantId?: string;
  leaseId?: string;
  actor?: string;
  payload?: Record<string, unknown>;
  verificationStatus?: StorageEvent['verificationStatus'];
}): StorageEvent {
  return {
    eventId: input.eventId ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    eventType: input.eventType,
    eventTime: input.eventTime ?? new Date().toISOString(),
    facilityId: input.facilityId,
    spaceId: input.spaceId,
    tenantId: input.tenantId,
    leaseId: input.leaseId,
    actor: input.actor ?? 'Not supplied',
    payload: input.payload ?? {},
    verificationStatus: input.verificationStatus ?? 'reported',
  };
}
