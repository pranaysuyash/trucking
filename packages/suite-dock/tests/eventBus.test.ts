import { describe, it, expect } from 'vitest';
import { platformEventBus } from '../src/eventBus';
import { CANONICAL_PRODUCTS, resolveProductUrl } from '../src/registry';

describe('SuiteDock Event Bus & Canonical Registry', () => {
  it('registers all 9 canonical platform subproducts with distinct ports', () => {
    expect(CANONICAL_PRODUCTS.length).toBe(9);

    const ports = CANONICAL_PRODUCTS.map((p) => p.port);
    const uniquePorts = new Set(ports);
    expect(uniquePorts.size).toBe(9);

    // Verify all ports are properly mapped
    expect(ports).toContain(5170); // Command Center Portal
    expect(ports).toContain(5173); // Cargo Fit
    expect(ports).toContain(5174); // Freight Pricing
    expect(ports).toContain(5175); // HOS Planner
    expect(ports).toContain(5176); // Asset Studio
    expect(ports).toContain(5177); // Fleet Telematics
    expect(ports).toContain(5178); // Carrier Safety
    expect(ports).toContain(5179); // Warehouse Space Flow
    expect(ports).toContain(5180); // Dynamic Yard & Dock
  });

  it('correctly resolves development vs cloud routes', () => {
    const p01 = CANONICAL_PRODUCTS.find((p) => p.id === 'product-01-cargo-fit')!;
    expect(resolveProductUrl(p01)).toBe('http://localhost:5173');
  });

  it('publishes and receives CARRIER_VETTED events across the event bus', () => {
    let receivedEvent: any = null;

    const unsubscribe = platformEventBus.subscribe('CARRIER_VETTED', (evt) => {
      receivedEvent = evt;
    });

    platformEventBus.publish({
      type: 'CARRIER_VETTED',
      sourceProductId: 'product-06-carrier-safety',
      timestamp: '2026-10-22T12:00:00Z',
      payload: {
        dotNumber: '2849102',
        legalName: 'Apex Freight Lines',
        safetyRating: 'SATISFACTORY',
        eligibility: 'APPROVED',
        autoLiabilityUsd: 1000000,
        chameleonRisk: 'low',
      },
    });

    expect(receivedEvent).not.toBeNull();
    expect(receivedEvent.payload.dotNumber).toBe('2849102');
    expect(receivedEvent.payload.eligibility).toBe('APPROVED');

    unsubscribe();
  });

  it('publishes and receives TENANT_CHANGED events for multi-tab sync', () => {
    let tenantEvent: any = null;

    const unsubscribe = platformEventBus.subscribe('TENANT_CHANGED', (evt) => {
      tenantEvent = evt;
    });

    platformEventBus.publish({
      type: 'TENANT_CHANGED',
      sourceProductId: 'product-01-cargo-fit',
      timestamp: '2026-10-22T12:05:00Z',
      payload: {
        tenantId: 'tenant-test-123',
        tenantName: 'Keystone Logistics',
        mode: 'suite',
        licensedProducts: ['product-01-cargo-fit', 'product-02-freight-pricing'],
        userRole: 'dispatcher',
      },
    });

    expect(tenantEvent).not.toBeNull();
    expect(tenantEvent.payload.tenantName).toBe('Keystone Logistics');
    expect(tenantEvent.payload.mode).toBe('suite');

    unsubscribe();
  });
});
