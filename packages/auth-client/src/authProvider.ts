import type { UserSession, ProductId, UserRole } from './types';

const STORAGE_KEY = 'trucking_tenant_profile';

const DEFAULT_LICENSED_PRODUCTS: ProductId[] = [
  'product-01-cargo-fit',
  'product-02-freight-pricing',
  'product-04-asset-studio',
];

function createDefaultSession(): UserSession {
  return {
    userId: 'usr_dev_101',
    email: 'alex@apexfreight.io',
    displayName: 'Alex Chen',
    tenantId: 'tenant_apex_freight',
    tenantName: 'Apex Logistics & Freight',
    role: 'fleet_manager',
    licensedProducts: [...DEFAULT_LICENSED_PRODUCTS],
    mode: 'suite',
  };
}

export class TruckingAuthClient {
  private currentSession: UserSession;

  constructor() {
    this.currentSession = this.loadFromStorage();
  }

  private loadFromStorage(): UserSession {
    const fallback = createDefaultSession();
    if (typeof localStorage === 'undefined') {
      return fallback;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const p = JSON.parse(raw);
      return {
        userId: p.userId || fallback.userId,
        email: p.email || fallback.email,
        displayName: p.userName || fallback.displayName,
        tenantId: p.tenantId || fallback.tenantId,
        tenantName: p.tenantName || fallback.tenantName,
        role: (p.userRole as UserRole) || fallback.role,
        licensedProducts: p.licensedProducts || fallback.licensedProducts,
        mode: p.mode || fallback.mode,
      };
    } catch (error) {
      console.warn('Unable to restore auth session from localStorage; using default profile.', error);
      return fallback;
    }
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
    const data = {
      tenantId: this.currentSession.tenantId,
      tenantName: this.currentSession.tenantName,
      mode: this.currentSession.mode,
      licensedProducts: this.currentSession.licensedProducts,
      userRole: this.currentSession.role,
      userName: this.currentSession.displayName,
    };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.warn('Unable to persist auth session to localStorage.', error);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trucking_profile_changed', { detail: data }));
    }
  }
}

export const authClient = new TruckingAuthClient();
