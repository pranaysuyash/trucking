/**
 * Typed, cross-window/cross-tab Event Bus for the TRUCKING Platform Suite.
 * Utilizes standard Web BroadcastChannel ('trucking_platform_event_bus') with
 * automatic fallback to window storage events for maximum compatibility.
 */

export type PlatformEventType =
  | 'CARRIER_VETTED'
  | 'LOAD_SOLVED'
  | 'RATE_CONFIRMED'
  | 'HOS_ROUTE_PLANNED'
  | 'TELEMATICS_ALERT'
  | 'PUTAWAY_ASSIGNED'
  | 'YARD_SPOT_ASSIGNED'
  | 'TENANT_CHANGED';

export interface BaseEvent<T extends PlatformEventType, P> {
  type: T;
  sourceProductId: string;
  timestamp: string;
  payload: P;
}

export type CarrierVettedEvent = BaseEvent<
  'CARRIER_VETTED',
  {
    dotNumber: string;
    legalName: string;
    safetyRating: 'SATISFACTORY' | 'CONDITIONAL' | 'UNSATISFACTORY' | 'NONE';
    eligibility: 'APPROVED' | 'CONDITIONAL_REVIEW' | 'BLOCKED_DO_NOT_DISPATCH';
    autoLiabilityUsd: number;
    chameleonRisk: 'low' | 'moderate' | 'high';
  }
>;

export type LoadSolvedEvent = BaseEvent<
  'LOAD_SOLVED',
  {
    loadId: string;
    vehicleCode: string;
    totalWeightLbs: number;
    utilizationPct: number;
    axleStatus: 'COMPLIANT' | 'OVERWEIGHT';
    itemCount: number;
  }
>;

export type RateConfirmedEvent = BaseEvent<
  'RATE_CONFIRMED',
  {
    rateConId: string;
    origin: string;
    destination: string;
    linehaulUsd: number;
    fuelSurchargeUsd: number;
    totalCarrierPayUsd: number;
    operatingRatio: number;
  }
>;

export type HOSRoutePlannedEvent = BaseEvent<
  'HOS_ROUTE_PLANNED',
  {
    routeId: string;
    origin: string;
    destination: string;
    totalDistanceMiles: number;
    pureDrivingHours: number;
    mandatorySleeperCount: number;
    isLegallyCompliant: boolean;
  }
>;

export type TelematicsAlertEvent = BaseEvent<
  'TELEMATICS_ALERT',
  {
    truckId: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    dtcCode?: string;
    reeferTempF?: number;
    location: string;
    speedMph: number;
  }
>;

export type PutawayAssignedEvent = BaseEvent<
  'PUTAWAY_ASSIGNED',
  {
    entityId: string;
    slotId: string;
    zoneCode: string;
    velocityClass: 'A' | 'B' | 'C';
    weightLbs: number;
  }
>;

export type YardSpotAssignedEvent = BaseEvent<
  'YARD_SPOT_ASSIGNED',
  {
    spotId: string;
    trailerId: string;
    status: 'OCCUPIED_INBOUND' | 'STAGED_FOR_DOCK' | 'EMPTY_STORAGE' | 'OUTBOUND_READY';
    dwellMinutes: number;
    detentionOwedUsd: number;
  }
>;

export type TenantChangedEvent = BaseEvent<
  'TENANT_CHANGED',
  {
    tenantId: string;
    tenantName: string;
    mode: 'standalone' | 'suite';
    licensedProducts: string[];
    userRole: string;
  }
>;

export type PlatformEvent =
  | CarrierVettedEvent
  | LoadSolvedEvent
  | RateConfirmedEvent
  | HOSRoutePlannedEvent
  | TelematicsAlertEvent
  | PutawayAssignedEvent
  | YardSpotAssignedEvent
  | TenantChangedEvent;

export type PlatformEventListener<E extends PlatformEvent = PlatformEvent> = (event: E) => void;

class PlatformEventBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<PlatformEventListener<any>>> = new Map();
  private memoryRingBuffer: PlatformEvent[] = [];
  private readonly CHANNEL_NAME = 'trucking_platform_event_bus';
  private readonly STORAGE_EVENT_KEY = 'trucking_bus_event_dispatched';
  private readonly RING_BUFFER_KEY = 'trucking_platform_suite_dock_ring_buffer_v1';
  private readonly MAX_RING_BUFFER = 50;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(this.CHANNEL_NAME);
          this.channel.onmessage = (msg: MessageEvent<PlatformEvent>) => {
            this.notifyListeners(msg.data);
          };
        }
      } catch (err) {
        console.warn('BroadcastChannel not available, falling back to storage listener', err);
      }

      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === this.STORAGE_EVENT_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as PlatformEvent;
            this.notifyListeners(parsed);
          } catch (error) {
            console.warn('Ignored malformed cross-tab platform event payload.', error);
          }
        }
      });
    }
  }

  public publish(event: PlatformEvent): void {
    // 1. Save to ring buffer
    this.memoryRingBuffer.unshift(event);
    if (this.memoryRingBuffer.length > this.MAX_RING_BUFFER) {
      this.memoryRingBuffer.length = this.MAX_RING_BUFFER;
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.RING_BUFFER_KEY, JSON.stringify(this.memoryRingBuffer));
      } catch (error) {
        console.warn('Unable to persist event ring buffer to localStorage.', error);
      }
    }

    // 2. Notify local in-memory listeners
    this.notifyListeners(event);

    // 3. Broadcast across tabs
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.warn('Failed to broadcast event via channel', err);
      }
    }

    // 4. Storage event fallback
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_EVENT_KEY, JSON.stringify(event));
      } catch (error) {
        console.warn('Unable to write fallback storage event trigger.', error);
      }
    }
  }

  public getRecentEvents(limit: number = 20): PlatformEvent[] {
    if (this.memoryRingBuffer.length > 0) {
      return this.memoryRingBuffer.slice(0, limit);
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.RING_BUFFER_KEY);
        if (!raw) return [];
        const buffer = JSON.parse(raw);
        return Array.isArray(buffer) ? buffer.slice(0, limit) : [];
      } catch (error) {
        console.warn('Unable to parse recent platform events from localStorage.', error);
        return [];
      }
    }
    return [];
  }

  public clearRecentEvents(): void {
    this.memoryRingBuffer = [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.RING_BUFFER_KEY);
        localStorage.removeItem(this.STORAGE_EVENT_KEY);
      } catch (error) {
        console.warn('Unable to clear stored platform events from localStorage.', error);
      }
    }
  }

  public subscribe<E extends PlatformEvent>(
    eventType: E['type'] | '*',
    callback: PlatformEventListener<E>
  ): () => void {
    const key = eventType as string;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback as PlatformEventListener<any>);

    return () => {
      this.listeners.get(key)?.delete(callback as PlatformEventListener<any>);
    };
  }

  private notifyListeners(event: PlatformEvent): void {
    const specific = this.listeners.get(event.type);
    if (specific) {
      specific.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`Error in event listener for ${event.type}:`, err);
        }
      });
    }

    const universal = this.listeners.get('*');
    if (universal) {
      universal.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error('Error in universal event listener:', err);
        }
      });
    }
  }
}

export const platformEventBus = new PlatformEventBus();
