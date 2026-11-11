/**
 * @trucking/storage-core, shared storage core types and helpers.
 *
 * Foundation package extracting the common domain model shared by:
 *   - product-06-warehouse-space-flow (goods/capacity/movements)
 *   - product-09-storage-leasing (space/rent/maintenance)
 *   - future specialized storage modules (cold, grain, yard, container, self-storage)
 *
 * Consumers currently maintain local type copies; consolidating imports onto
 * this package is tracked as follow-up work (I4) with regression coverage.
 * This package is the canonical target for new shared types.
 */

export type EnvironmentalClass = 'ambient' | 'chilled' | 'frozen' | 'hazmat';

export interface Dimensions2D { lengthFt: number; widthFt: number; heightFt?: number; }
export interface Dimensions3D { lengthIn: number; widthIn: number; heightIn: number; }
export interface Coordinates2D { x: number; y: number; width: number; height: number; }

export type SpaceStatus = 'vacant' | 'leased' | 'blocked' | 'under_repair' | 'temporarily_reserved';
export type SpaceType = 'room' | 'chamber' | 'bay' | 'plot' | 'unit' | 'cold_chamber' | 'open_yard';

export interface FacilityBase {
  id: string;
  code: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  country: string;
  totalAreaSqFt: number;
  usableAreaSqFt: number;
  floors: number;
}

export type VerificationStatus = 'simulated' | 'observed' | 'published';

export interface StorageEventBase {
  eventId: string;
  eventType: string;
  eventTime: string;
  facilityId: string;
  spaceId?: string;
  actor: string;
  verificationStatus: VerificationStatus;
  payload: Record<string, unknown>;
}
