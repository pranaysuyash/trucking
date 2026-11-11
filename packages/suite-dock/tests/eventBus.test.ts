import { describe, it, expect } from 'vitest';
import { platformEventBus } from '../src/eventBus';
import { CANONICAL_PRODUCTS, resolveProductUrl } from '../src/registry';

describe('SuiteDock Event Bus & Canonical Registry', () => {
  it('registers each product under its canonical identity, port and development route', () => {
    const expected: Record<string, number> = {
      'command-center-portal': 5170,
      'product-01-cargo-fit': 5173,
      'product-02-freight-pricing': 5174,
      'product-03-hos-planner': 5175,
      'product-04-asset-studio': 5176,
      'product-05-fleet-telematics': 5177,
      'product-06-warehouse-space-flow': 5178,
      'product-07-yard-dock': 5179,
      'product-08-carrier-trust': 5180,
      'product-09-storage-leasing': 5181,
    };
    expect(CANONICAL_PRODUCTS.length).toBe(Object.keys(expected).length);

    const ports = CANONICAL_PRODUCTS.map((p) => p.port);
    const uniquePorts = new Set(ports);
    expect(uniquePorts.size).toBe(Object.keys(expected).length);
    expect(Object.fromEntries(CANONICAL_PRODUCTS.map(p => [p.id, p.port]))).toEqual(expected);
    for (const product of CANONICAL_PRODUCTS) {
      expect(new URL(product.routes.dev).port).toBe(String(expected[product.id]));
    }
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
      sourceProductId: 'product-08-carrier-trust',
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
