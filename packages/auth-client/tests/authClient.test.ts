import { describe, it, expect, beforeEach } from 'vitest';
import { TruckingAuthClient } from '../src/authProvider';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MockStorage();
}

describe('TruckingAuthClient Sovereign Client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default multi-product suite session when storage is empty', () => {
    const client = new TruckingAuthClient();
    const session = client.getSession();

    expect(session.userId).toBe('usr_dev_101');
    expect(session.tenantName).toBe('Apex Logistics & Freight');
    expect(session.role).toBe('fleet_manager');
    expect(session.mode).toBe('suite');
    expect(session.licensedProducts).toContain('product-01-cargo-fit');
    expect(session.licensedProducts).toContain('product-02-freight-pricing');
  });

  it('correctly reports product licensing status', () => {
    const client = new TruckingAuthClient();

    expect(client.isLicensed('product-01-cargo-fit')).toBe(true);
    expect(client.isLicensed('product-02-freight-pricing')).toBe(true);
    expect(client.isLicensed('product-08-carrier-trust')).toBe(false);
  });

  it('updates licensed products and persists to storage', () => {
    const client = new TruckingAuthClient();

    client.updateLicensedProducts([
      'product-01-cargo-fit',
      'product-06-warehouse-space-flow',
      'product-07-yard-dock',
      'product-08-carrier-trust',
    ]);

    expect(client.isLicensed('product-08-carrier-trust')).toBe(true);
    expect(client.isLicensed('product-02-freight-pricing')).toBe(false);

    // Verify persistence across new client instance
    const newClient = new TruckingAuthClient();
    expect(newClient.isLicensed('product-08-carrier-trust')).toBe(true);
    expect(newClient.isLicensed('product-07-yard-dock')).toBe(true);
  });

  it('toggles between standalone and suite tenant modes', () => {
    const client = new TruckingAuthClient();

    client.switchTenantMode('standalone');
    expect(client.getSession().mode).toBe('standalone');

    client.switchTenantMode('suite');
    expect(client.getSession().mode).toBe('suite');
  });

  it('updates tenant name and role', () => {
    const client = new TruckingAuthClient();

    client.updateTenantDetails('Miller Heavy Haul', 'owner_operator');
    const session = client.getSession();

    expect(session.tenantName).toBe('Miller Heavy Haul');
    expect(session.role).toBe('owner_operator');
  });
});
