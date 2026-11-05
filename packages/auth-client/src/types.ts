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
  | string;

export type UserRole =
  | 'owner_operator'
  | 'dispatcher'
  | 'safety_officer'
  | 'fleet_manager'
  | 'enterprise_admin';

export interface UserSession {
  userId: string;
  email: string;
  displayName: string;
  tenantId: string;
  tenantName: string;
  role: UserRole;
  licensedProducts: ProductId[];
  mode: 'standalone' | 'suite';
  authToken?: string;
  expiresAtEpoch?: number;
}

export interface AuthClientConfig {
  provider: 'mock_local' | 'supabase' | 'clerk' | 'firebase';
  apiEndpoint?: string;
  apiKey?: string;
}
