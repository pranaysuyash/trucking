# Warehouse & Storage Audit — Built vs Missing vs India Expansion

**Date:** 2026-11-05 · Asia/Kolkata
**Governing Doctrine:** OPERATING_DOCTRINE.md (v8.2), AGENTS.md
**Scope:** Product 06 (Warehouse Space & Flow Planner) + new Product 09 (Storage & Leasing Core)
**Source:** Warehouse product audit (GitHub review 2 Nov 2026) + first-principles code inspection

---

## 1. Executive Summary

P06 provides a credible spatial foundation (facility model, putaway solver, GS1 EPCIS events, dual-role containers) but is not a complete warehouse management product. It is oriented toward US distribution centres. The Indian market and other storage businesses require a shared storage core with three distinct business modules: (1) Storage & Leasing (landlord), (2) Space & Flow (P06 operator), (3) Specialized Storage (cold, grain, yard, containers). A new Product 09 (Storage & Leasing Core) has been created as the first landlord module, following the sovereign subproduct pattern.

---

## 2. What Is Already Built (P06)

| Capability | State | Notes |
|---|---|---|
| 2D warehouse layout | Implemented | Interactive facility, zones, slots |
| Isometric 3D visualization | Implemented independently | Visual geometry study, not live occupancy |
| Location hierarchy | Implemented | Zones, aisles, racks, bays, levels, slots |
| Capacity & utilization | Partial | Slot counts and weight ratings, not commercial occupancy |
| Putaway optimization | Implemented | Dimensions, weights, bay loads, storage classes |
| Inbound cargo manifests | Implemented | Seed manifests + shipment adapter |
| Space reservations | Partial | Local reservations + shared-shipment scenario |
| Container holding cargo | Demonstrated | Dual-role asset/container model |
| Barcode verification | Simulated/manual | No connected device scanner |
| Discrepancy detection | Partial | Wrong-location and receipt mismatch |
| Event/audit history | Partial | Generated EPCIS-style events |
| Shared trucking platform | Partial | Interfaces + shared-shipment path, not fully proven E2E |
| Multi-customer operations | Missing | No complete customer stock ledger |
| Rent/invoicing/expenses | Missing | No landlord/property management workflows (now P09) |
| India-specific operations | Missing | US units, sample facility (now P09 foundation) |
| Dedicated mobile app | Missing | Responsive CSS only |

## 3. P0 Correctness Findings (from audit)

1. **34°F chilled room eligible for frozen cargo** — `checkSlotSuitability` allows any item whose environmentalClass is in slot.allowedClasses; cold vault allows ['chilled','frozen'] but a 34°F (1°C) room cannot hold frozen (-20°C) cargo. Need commodity temperature requirements vs room ranges.
2. **HazMat checking relies on broad storage class** — only `allowedClasses` includes 'hazmat'; no chemical compatibility, segregation, or site policies.
3. **Simulated confirmation described as published** — `executeScanVerification` returns message "GS1 EPCIS event published" but event is generated locally. Need verification status: simulated/observed/published.
4. **Putaway emits EPCIS ADD (commissioning) for routine location observation** — should be OBSERVE for routine moves; ADD only for commissioning.
5. **Shared shipment integration requires fixed canonical facility** — need user-created facilities/spaces/capabilities.
6. **3D shows fixed KPIs including 100% occupancy** — connect to operational 2D state.
7. **Mobile uses fixed desktop three-column grid** — task-specific phone layouts.
8. **Reservations/events in React state** — persistent records with revision/conflict handling.
9. **Shared shipment service points to 127.0.0.1:5171** — deployed authenticated service.
10. **Solver ranks by heuristics only** — add travel distance, handling cost, throughput, accessibility, lifecycle.

Preserved: conservative treatment of unknown rack weight (consumes full rating, never zero).

## 4. Indian Warehouse Operations (P09 foundation)

P09 (Storage & Leasing Core) implements: facility registration, rentable spaces, tenants, leases, rent ledger, electricity meter readings, maintenance tasks, audit events. Indian-warehouse oriented (sq ft, GSTIN, meters, monsoon repairs, old cold storage converted to dry warehouse modeled as ambient with historical refrigeration assets).

### Two ledgers
- **Space ledger**: who rents/controls which space, for what period, at what price.
- **Goods ledger**: whose goods stored where, quantity, condition (P06, separate).

### Three high-potential expansions
- Agricultural/commodity godowns (bag counts, weight, moisture, grading, fumigation, WDRA/eNWR for registered warehouses only).
- Cold storage/multi-chamber (chamber-wise inventory, temp/humidity, power failure, commodity rules, FSSAI licensing depends on operator).
- Open storage/industrial yards (polygon plots, stacking limits, crane access, weather, gate movements, billing by area/duration).

### Commercial caution
National Centre for Cold-chain Development already has Sheet Bharat portal for discovering/booking cold storage. Entry point should be software making existing storage business easier to run, with marketplace integrations later.

## 5. Other Storage Businesses

| Storage type | Priority | Notes |
|---|---|---|
| Leased dry warehouse/godown | 1 (build first) | Space leases, rent, meters, repairs, tenant possession |
| Shared commercial warehouse/3PL | 2 | Customer-wise stock, receiving, putaway, picking, billing per pallet/day |
| Agricultural godown | 3 | Farmer/trader lots, bag counts, weight, moisture, grading, fumigation |
| Cold storage | 3 | Chamber-wise inventory, temp/humidity, power failure, commodity rules |
| Open storage/industrial yard | 3 | Polygon plots, stacking limits, crane access, weather |
| Container depot/trailer parking | 4 | Container ID, gate in/out, seals, dwell, stack positions |
| Self-storage/mini-storage | 4 | Units, recurring bookings, tenant access, deposits |
| Pharma/regulated | Later | Batch, expiry, quality hold, validated conditions |
| Bonded/ICD | Later | Customs custody, document controls, reconciliation |

## 6. Mobile-Based Controls

Current: browser interactions + responsive CSS. No genuine mobile operating flow, camera barcode capture, or offline sync.

### Role-based mobile
- Owner: rent due, vacant space, expenses, alerts; record rent, upload meter photo, approve repair, inspect lease, share receipt.
- Manager: arrivals, space availability, pending movements; assign space, approve putaway, authorize dispatch, resolve exceptions.
- Floor worker: my next task; scan item, scan location, confirm quantity, photograph damage, complete move.
- Security guard: expected vehicles/visitors; gate in/out, capture plate, seal, driver evidence.
- Tenant: my space, dues, requests; view rent ledger, receipts, booking, report issues, request dispatch.

### Offline reconciliation
Received item initially recorded as pending observation, not authoritative occupancy change. On reconnect, server checks identity, slot availability, revisions, then accepts or flags conflicts. Prevents two disconnected workers silently allocating same space.

### Physical equipment controls (later)
Stage 1: temperature, electricity, door-state, meter, equipment-status monitoring.
Stage 2: alerts for power outage, abnormal temp, door open, DG observation.
Stage 3: authorized equipment commands (with acknowledgement, audit, interlocks).
Not initially: unrestricted remote control of safety-critical plant.

## 7. Recommended Architecture

Shared Storage Core with distinct modules:
- Storage & Leasing (P09): space, rent, bills, maintenance
- P06 Space & Flow: goods, capacity, movements
- Specialized Storage: cold, grain, yard, containers

Shared permissions and event-driven integrations with existing trucking suite.

## 8. Implementation Roadmap

P0: Fix physical truth and facility modeling (custom Indian facility, real dimensions, no unsafe chilled/frozen allocation)
P1: Storage owner operations (tenant onboarding, space allocation, agreements, rent ledger, meter readings, maintenance, expense history)
P1: Owner mobile interface (record rent, photograph meter, review dues, open/close maintenance)
P2: Shared warehouse operations (customer-wise goods ledger, inward/outward, scan-backed receiving, putaway, dispatch, physical counts)
P2: Reliable operational infrastructure (auth, roles, durable events, server-side reservations, offline outbox reconciliation)
P3: Specialized storage packages (cold chambers + alerts; agricultural lots; yard/container workflows)
P3: Unified visual representation (operational 2D and optional 3D use same occupancy/facility data)
Later: Sensor and physical-control integrations

## 9. What Was Built in This Pass

- Created Product 09 (Storage & Leasing Core) at port 5181, following sovereign subproduct pattern.
- Implemented engine: facilityModel (facility/space creation, Indian warehouse example), leaseEngine (lease creation, activation, termination, rent calculation with escalation, ledger entries, payment recording, overdue detection, rent summary, lease renewal, electricity allocation), maintenanceEngine (task creation, start/resolve/cancel, summary, filtering).
- Tests: 39 passing (facility 10, lease 17, maintenance 11, spec 1).
- Typecheck and build pass.
- UI dashboard demonstrating facility spaces, metrics, rent ledger, maintenance tasks, demo lease/maintenance actions.
- Documentation: AGENTS.md, architecture contract, this audit doc.

## 10. Open Items Requiring Decision

- Whether to build P06 correctness fixes (chilled/frozen, hazmat, EPCIS semantics) before or after P09 expansion.
- Whether to create additional specialized storage subproducts (cold storage, agricultural godown, open yard) now or after P09 proves the core.
- Mobile platform choice: PWA first vs native Android when hardware workflows justify.
- Whether to integrate WDRA/eNWR support or defer.


## 11. Completed in This Pass (Implementation)

- P06: Temperature overlap check (chilled room no longer accepts frozen cargo). Added `temperatureRangeF` to LocationSlot and cold-vault slots. New `defaultTempRangeForClass`.
- P06: HazMat compatibility/segregation/site-policy engine (`hazmatCompatibility.ts`) with 5 tests.
- P06: EPCIS truth level — `verificationStatus` (simulated/observed/published) on EpcisEvent; routine putaway uses OBSERVE (ADD reserved for commissioning); seed event + message updated.
- P09: Storage & Leasing Core subproduct (port 5181) with facility/space/lease/rent/maintenance engines, 39 tests, dashboard UI, Indian warehouse example.
- Personas: Indian warehouse owner/landlord persona added.
- Tests: P06 60 passing (was 51), P09 39 passing.
