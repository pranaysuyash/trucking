/**
 * Storage & Leasing Core (Product 09)
 * Domain models for property owners/landlords: facilities, rentable spaces,
 * tenants, leases, rent ledger, meter readings, maintenance, documents, events.
 *
 * Architectural principle (from P06 audit): physical ownership (facility),
 * possession (lease/allocation), and custody (goods in storage) are modeled
 * separately. A landlord does not automatically need access to tenant SKUs.
 */

export type SpaceStatus =
  | 'vacant'
  | 'leased'
  | 'blocked'
  | 'under_repair'
  | 'temporarily_reserved';

export type SpaceType =
  | 'room'
  | 'chamber'
  | 'bay'
  | 'plot'
  | 'unit'
  | 'cold_chamber'
  | 'open_yard'
  | 'container'
  | 'silo'
  | 'tank'
  | 'rack'
  | 'locker'
  | 'parking_bay';

export type EnvironmentalClass = 'ambient' | 'chilled' | 'frozen' | 'hazmat';

export type BillingUnit =
  | 'sqft_month'
  | 'pallet_day'
  | 'tonne_month'
  | 'container_day'
  | 'unit_month'
  | 'bag_month'
  | 'container_day'
  | 'pallet_day'
  | 'tonne_month'
  | 'revenue_share'
  | 'fixed';

export type LeaseStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export type MaintenanceCategory =
  | 'roof'
  | 'flooring'
  | 'shutter'
  | 'electrical'
  | 'water'
  | 'fire_safety'
  | 'refrigeration'
  | 'other';

export interface Dimensions2D {
  lengthFt: number;
  widthFt: number;
  heightFt?: number;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: 'IN';
  totalAreaSqFt: number;
  usableAreaSqFt: number;
  floors: number;
  hasElectricityMeter: boolean;
  hasRefrigerationPlant: boolean;
  refrigerationOperational: boolean;
  ownershipType?: 'owned' | 'leased_in' | 'managed' | 'sub_leased' | 'government' | 'cooperative' | 'franchise';
  landlordName?: string; // if leased_in
  landlordContact?: string;
  spaces: RentableSpace[];
  createdAt: string;
}

export interface RentableSpace {
  id: string;
  facilityId: string;
  code: string;
  name: string;
  type: SpaceType;
  floor: number;
  dimensions: Dimensions2D;
  areaSqFt: number;
  environmentalClass: EnvironmentalClass;
  maxLoadKg?: number;
  status: SpaceStatus;
  spacePurpose?: 'for_lease' | 'for_own_use' | 'shared_storage' | 'cold_storage' | 'agricultural' | 'container_yard' | 'self_storage' | 'bonded';
  meterId?: string;
  notes?: string;
}

export type CommodityCategory =
  | 'ambient_goods'
  | 'perishable'
  | 'frozen'
  | 'hazmat'
  | 'documents'
  | 'equipment'
  | 'agri'
  | 'other';

export type LeaseType = 'fixed_term' | 'month_to_month' | 'indefinite';

export interface Tenant {
  id: string;
  name: string;
  gstin?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  intendedUse?: string; // free-text description of what the tenant stores/uses the space for
  commodityCategory?: CommodityCategory;
  createdAt: string;
}

export interface Lease {
  id: string;
  facilityId: string;
  spaceId: string;
  tenantId: string;
  leaseType: LeaseType;
  agreementDate?: string; // date the lease agreement was signed
  depositDate?: string; // date the deposit was received (may precede possession)
  startDate: string; // service/billing start (possession) ISO date
  possessionDate?: string; // physical handover date (defaults to startDate)
  billingStartDate?: string; // first billable day (defaults to startDate)
  endDate?: string; // ISO date; omitted for month_to_month/indefinite
  billingCycleDay?: number; // day of month rent is due (1-28)
  billingUnit: BillingUnit;
  rate: number; // per billing unit
  escalationPercentPerYear: number;
  depositAmount: number;
  status: LeaseStatus;
  renewalOfLeaseId?: string;
  intendedUse?: string;
  commodityCategory?: CommodityCategory;
  createdAt: string;
}

export interface RentLedgerEntry {
  id: string;
  leaseId: string;
  facilityId: string;
  spaceId: string;
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  baseRent: number;
  electricityCharge: number;
  maintenanceCharge: number;
  otherCharges: number;
  totalDue: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  dueDate: string;
  paidDate?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface RentPayableEntry {
  id: string;
  facilityId: string;
  landlordName: string;
  periodStart: string;
  periodEnd: string;
  baseRent: number;
  electricityCharge: number;
  maintenanceCharge: number;
  otherCharges: number;
  totalDue: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  dueDate: string;
  paidDate?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface MeterReading {
  id: string;
  facilityId: string;
  spaceId?: string; // null = main meter
  meterId: string;
  isMainMeter: boolean;
  readingKwh: number;
  readingDate: string;
  recordedBy: string;
  photoUrl?: string;
  tariffPerKwh?: number;
  notes?: string;
}

export interface MaintenanceTask {
  id: string;
  facilityId: string;
  spaceId?: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  status: MaintenanceStatus;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  contractor?: string;
  photos?: string[];
}

export interface TenantPortalAccess {
  tenantId: string;
  leaseId: string;
  canViewLedger: boolean;
  canReportMaintenance: boolean;
  canRequestDispatch: boolean;
  grantedAt: string;
}

export interface RentedFacilitySummary {
  facilityId: string;
  landlordName: string;
  monthlyRent: number;
  totalPaidYTD: number;
  totalDueYTD: number;
  overdueAmount: number;
  nextDueDate: string;
}

export interface StorageEvent {
  eventId: string;
  eventType: string;
  eventTime: string;
  facilityId: string;
  spaceId?: string;
  tenantId?: string;
  leaseId?: string;
  actor: string;
  payload: Record<string, unknown>;
  verificationStatus: 'simulated' | 'observed' | 'published';
}

export interface FacilityMetrics {
  totalAreaSqFt: number;
  usableAreaSqFt: number;
  leasedAreaSqFt: number;
  vacantAreaSqFt: number;
  blockedAreaSqFt: number;
  underRepairAreaSqFt: number;
  occupancyPercent: number;
  monthlyRentDue: number;
  monthlyRentOverdue: number;
  activeLeases: number;
  vacantSpaces: number;
}

export interface LeaseRentCalculation {
  baseRent: number;
  escalatedRate: number;
  periodMonths: number;
  totalBaseRent: number;
}
