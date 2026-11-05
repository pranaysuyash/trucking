# Architecture & Storage Core Contract
## Product 09 — Storage & Leasing Core

### 1. Executive Summary
Storage & Leasing Core is the landlord/property-owner module of the shared storage platform. It models physical facilities, rentable spaces, tenants, leases, rent ledgers, electricity meter readings, maintenance tasks, and audit events. It is deliberately separate from P06 (goods/capacity/movements) and from specialized storage (cold, grain, yard).

### 2. Core Architectural Invariant: Ownership vs Possession vs Custody
Three distinct relationships, all referring to the same physical facility:
- **Ownership**: who owns the building/land (landlord).
- **Possession**: who leases/controls a space, for what period, at what price (tenant).
- **Custody**: whose goods are stored where, in what quantity and condition (operator/tenant goods).

A landlord does not automatically need access to tenant SKUs. Permissions and data ownership differ.

### 3. Domain Models
- `Facility`: building with total/usable area, floors, electricity meter, refrigeration plant status.
- `RentableSpace`: a rentable unit (room, chamber, bay, plot, unit, cold_chamber, open_yard) with area, environmental class, status.
- `Tenant`: customer with GSTIN, contact details.
- `Lease`: agreement linking space + tenant + period + billing unit + rate + escalation + deposit.
- `RentLedgerEntry`: monthly rent invoice/payment with base rent, electricity, maintenance, other charges, payment status.
- `MeterReading`: electricity submeter/main meter readings.
- `MaintenanceTask`: repair/maintenance with category, cost, status.
- `StorageEvent`: audit event with verification status (simulated/observed/published).

### 4. Billing Units
Configurable per lease: sqft_month, pallet_day, tonne_month, container_day, unit_month, fixed. Do not assume one charging unit fits all facilities.

### 5. Indian Warehouse Considerations
- sq ft (not sq m) as primary unit for Indian market.
- GSTIN on tenant records.
- Electricity main meter + submeters with tariff allocation.
- Maintenance categories: roof, flooring, shutter, electrical, water, fire_safety, refrigeration.
- Old cold storage converted to dry warehouse: model as ambient with historical refrigeration assets, not active certified cold chamber.
- Section 35(2) CGST Act / Rule 58 record obligations: applicability depends on business arrangement (owner leases premises vs operator stores goods).

### 6. Verification Status Discipline
Events distinguish simulated (local), observed (verified), and published (external). Never describe a simulated confirmation as published.

### 7. Mobile-First Considerations
- Owner mobile: record rent, photograph meter, review dues, open/close maintenance tasks.
- Task-specific phone layouts, not shrunken desktop dashboards.
- Offline: pending observations reconciled server-side on reconnect.
