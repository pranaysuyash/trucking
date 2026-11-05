import type { UserSession, ProductId, UserRole } from './types';

const STORAGE_KEY = 'trucking_tenant_profile';

export class TruckingAuthClient {
  private currentSession: UserSession;

  constructor() {
    this.currentSession = this.loadFromStorage();
  }

  private loadFromStorage(): UserSession {
    if (typeof window !== 'undefined' || typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          return {
            userId: p.userId || 'usr_dev_101',
            email: p.email || 'alex@apexfreight.io',
            displayName: p.userName || 'Alex Chen',
            tenantId: p.tenantId || 'tenant_apex_freight',
            tenantName: p.tenantName || 'Apex Logistics & Freight',
            role: (p.userRole as UserRole) || 'fleet_manager',
            licensedProducts: p.licensedProducts || [
              'product-01-cargo-fit',
              'product-02-freight-pricing',
              'product-04-asset-studio',
            ],
            mode: p.mode || 'suite',
          };
        }
      } catch {}
    }

    return {
      userId: 'usr_dev_101',
      email: 'alex@apexfreight.io',
      displayName: 'Alex Chen',
      tenantId: 'tenant_apex_freight',
      tenantName: 'Apex Logistics & Freight',
      role: 'fleet_manager',
      licensedProducts: [
        'product-01-cargo-fit',
        'product-02-freight-pricing',
        'product-04-asset-studio',
      ],
      mode: 'suite',
    };
  }

  public getSession(): UserSession {
    return { ...this.currentSession };
  }

  public isLicensed(productId: ProductId): boolean {
    return this.currentSession.licensedProducts.includes(productId);
  }

  public switchTenantMode(mode: 'standalone' | 'suite'): void {
    this.currentSession.mode = mode;
    this.persist();
  }

  public updateLicensedProducts(products: ProductId[]): void {
    this.currentSession.licensedProducts = products;
    this.persist();
  }

  public updateTenantDetails(name: string, role: UserRole): void {
    this.currentSession.tenantName = name;
    this.currentSession.role = role;
    this.persist();
  }

  private persist(): void {
    if (typeof window !== 'undefined' || typeof localStorage !== 'undefined') {
      const data = {
        tenantId: this.currentSession.tenantId,
        tenantName: this.currentSession.tenantName,
        mode: this.currentSession.mode,
        licensedProducts: this.currentSession.licensedProducts,
        userRole: this.currentSession.role,
        userName: this.currentSession.displayName,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trucking_profile_changed', { detail: data }));
      }
    }
  }
}

export const authClient = new TruckingAuthClient();
