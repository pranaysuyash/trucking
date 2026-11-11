export type ProductId =
  | 'command-center-portal'
  | 'product-01-cargo-fit'
  | 'product-02-freight-pricing'
  | 'product-03-hos-planner'
  | 'product-04-asset-studio'
  | 'product-05-fleet-telematics'
  | 'product-06-warehouse-space-flow'
  | 'product-07-yard-dock'
  | 'product-08-carrier-trust'
  | 'product-09-storage-leasing'
  | string;

export interface SubproductManifest {
  id: ProductId;
  name: string;
  shortName: string;
  code: string;
  version: string;
  port: number;
  icon: string;
  description: string;
  category: 'optimization' | 'pricing' | 'compliance' | 'assets' | 'telematics' | 'operations' | string;
  entitlementKey: string;
  routes: {
    dev: string;
    cloud: string;
    standalone?: string;
  };
  pricingTier?: {
    tierName: string;
    monthlyPriceUsd: number;
    description: string;
  };
}

export type SuiteMode = 'standalone' | 'suite';

export interface TenantProfile {
  tenantId: string;
  tenantName: string;
  mode: SuiteMode;
  licensedProducts: ProductId[];
  userRole: 'owner_operator' | 'fleet_manager' | 'dispatcher' | 'admin';
  userName: string;
}

export interface UpsellModalProps {
  product: SubproductManifest;
  isOpen: boolean;
  onClose: () => void;
  onUpgradeRequest?: (productId: ProductId) => void;
}
