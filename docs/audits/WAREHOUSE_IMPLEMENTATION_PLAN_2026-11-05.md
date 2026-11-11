# Warehouse & Storage Implementation Plan & TODO

**Date:** 2026-11-05
**Status:** Living document — updated as work progresses

## Phase 0 — Discovery & Documentation (DONE)
- [x] Audit P06 built vs missing
- [x] Identify three business modules (owner/landlord, operator, storage-service)
- [x] Document Indian warehouse workflows
- [x] Document other storage businesses
- [x] Document mobile controls
- [x] Create Product 09 (Storage & Leasing Core)
- [x] Implement facility/space/lease/rent/maintenance engines
- [x] Write 39 tests (all passing)
- [x] Typecheck + build pass
- [x] Write AGENTS.md, architecture contract, audit doc, plan doc

## Phase 1 — P0 Correctness Fixes (P06)
- [x] Fix chilled (34°F) room eligibility for frozen cargo: temperature overlap check in checkSlotSuitability + defaultTempRangeForClass
- [x] Add HazMat compatibility/segregation/site-policy engine (`hazmatCompatibility.ts`) with tests; `maxQuantityByClass` enforced; putaway segregation wired when class/occupancy metadata + policy available (live metadata linkage still a gap)
- [x] Distinguish simulated/observed/published in verification events (verificationStatus field on EpcisEvent)
- [x] Validate EPCIS semantics: routine putaway now uses OBSERVE (ADD reserved for commissioning)
- [~] Reduce fixed canonical facility dependency: standalone no longer auto-loads canonical demo (explicit demo action only); session-derived facility path exists; full user-created facility/space/capability definitions still pending
- [ ] Connect 3D KPIs to operational 2D state (remove hardcoded 100% occupancy)
- [ ] Mobile task-specific phone layouts (not three-column grid)
- [ ] Persistent operational records with revision/conflict handling (replace React state)
- [ ] Deployed authenticated shared shipment service (replace 127.0.0.1:5171)
- [ ] Add travel distance, handling cost, throughput, accessibility, lifecycle to solver

## Phase 2 — P09 Owner Operations
- [ ] Tenant onboarding UI (GSTIN, contact, address)
- [ ] Space allocation workflow (assign space to tenant)
- [ ] Agreement/document generation (lease PDF)
- [ ] Rent ledger monthly generation (cron/on-demand)
- [ ] Meter reading entry + photo upload
- [ ] Electricity charge allocation by submeter with tariff
- [ ] Maintenance task lifecycle UI (open/in_progress/resolved)
- [ ] Expense tracking per facility
- [ ] Owner mobile interface (record rent, photograph meter, review dues, open/close maintenance)
- [ ] Renewal workflow with escalation
- [ ] Partial payment handling + receipt generation

## Phase 3 — Shared Warehouse Operations (P06 enhancement)
- [ ] Customer-wise goods ledger (inward/outward register)
- [ ] Scan-backed receiving (camera barcode/QR)
- [ ] Putaway with customer identity preservation
- [ ] Dispatch with location identity
- [ ] Physical counts / cycle counts
- [ ] Offline outbox reconciliation

## Phase 3b — Generalization & Shared Core (I-series)
- [x] I4 Create packages/storage-core foundation (shared types)
- [x] I9 VerificationStatus state machine (`simulated`→`observed`→`published`) + publisher port/noop in `verificationEngine.ts`; external verified publisher adapter pending
- [x] I11 Data-driven HazMat policy/parser + max-quantity cap; segregation wired into putaway with metadata; broader config/schema evolution pending
- [x] I1 Temp range ↔ enum bridge (environmentalClassFromTempRange + defaultTempRangeForClass)
- [ ] I2 Shared facility factory (P09 createFacility + P06 createCustomFacility done)
- [ ] I12 Solver cost model

## Phase 4 — Specialized Storage Packages
- [ ] Cold storage chamber + alerts (temp/humidity, power failure, FSSAI)
- [ ] Agricultural godown (bag counts, weight, moisture, grading, fumigation)
- [ ] Open storage yard (polygon plots, stacking, crane access, weather)
- [ ] Container depot (gate in/out, seals, dwell, stack positions)
- [ ] Self-storage units (recurring bookings, tenant access)

## Phase 5 — Mobile
- [ ] PWA with offline drafts (IndexedDB)
- [ ] Role-based mobile home screens
- [ ] Camera barcode capture
- [ ] Offline reconciliation (pending observations)
- [ ] Stage 1 sensor monitoring (temp, electricity, door, meter)
- [ ] Stage 2 alerts (power outage, abnormal temp, door open)
- [ ] Stage 3 authorized equipment commands (with interlocks)

## Phase 6 — Infrastructure
- [ ] Authentication & roles
- [ ] Durable event store (server-side)
- [ ] Server-side capacity reservations
- [ ] Authenticated multi-user service (replace loopback)
- [ ] Unified visual representation (2D + 3D same data)

## Research Tasks
- [ ] CGST Act Section 35(2) / Rule 58 applicability for landlord vs operator
- [ ] WDRA/eNWR requirements for registered warehouses
- [ ] FSSAI cold storage licensing obligations
- [ ] GS1 EPCIS 2.0 standard validation (ADD vs OBSERVE)
- [ ] Indian GST invoicing for rent (Section 194I TDS, etc.)
- [ ] Sheet Bharat portal integration possibilities

## Persona Council
- [ ] Add project persona: Indian warehouse owner/landlord
- [ ] Add project persona: warehouse floor operator
- [ ] Add project persona: cold storage specialist
- [ ] Run persona council review on P09 design

## Testing & Verification
- [ ] P06 putaway temperature fix tests
- [ ] P06 EPCIS semantics tests
- [ ] P09 integration tests (lease → ledger → payment → overdue)
- [ ] Mobile offline reconciliation tests
- [ ] Typecheck all products


## Current Status Summary (2026-11-05, evidence-updated)

> Evidence date: 2026-11-05 (live recheck this session). Commands: `npm test` + `npm run build` in each product; browser evaluate on P06 `http://127.0.0.1:5178/` for standalone empty state + explicit demo load.

- **P06 (Warehouse Space & Flow, port 5178):** **22 test files, 112 tests passed** (`npm test`). `npm run build` exit 0 (`tsc --noEmit && vite build`). Standalone mode **no longer auto-seeds** canonical facility/manifest/entities/EPCIS; explicit **“Load demo workspace”** and **“Load sample import (demo)”** actions exist. 3D view uses shipment-session facility when available and shows an honest empty state otherwise. HazMat: `maxQuantityByClass` enforced (`hazmatPolicy.ts`/`hazmatPolicy.test.ts`); segregation/conflicts wired into `checkSlotSuitability`/`solvePutawayManifest` when `item.hazmatClass`, co-located slot `hazmatClass` metadata, and `hazmatPolicy` are provided (`putawayEngine.ts`/`hazmatPolicyPutaway.test.ts`). Full segregation still depends on live inventory→slot hazmat metadata linkage. EPCIS: `EpcisPublisher` port + `noopEpcisPublisher` + async `publishEpcisEvent`; planner publishes via injected `window.__EPCIS_PUBLISHER__` or noop and must not mark `published` without verified external evidence. `createHttpEpcisPublisher` adapter/factory added with conservative 2xx+`published:true` contract and mocked tests; default remains noop/injected publisher (no false publication). UI/config wiring for real endpoints remains deployment-specific. Modal wiring (Cycle Count/ABC Re-Slotting/Goods Ledger) remains shallow/sample-driven in places and needs real workspace state integration.
- **P09 (Storage & Leasing Core, port 5181):** **13 test files, 105 tests passed** (`npm test`). `npm run build` exit 0 (`tsc --noEmit && vite build`) as of this session's local verification (Vitest/build evidence only; not live/provider/production/auth/security/tax-compliance proof). Pushed baseline includes rent math/quantity/proration, idempotent monthly ledgers, payment/receipt integrity improvements, and maintenance leased-space restoration. **Local uncommitted fixes (this session):** occupancy is unavailable (`null`) when facility usable area is not configured — UI shows “Unavailable/Configure facility usable area” and no false `0%`; dashboard rent cards relabeled to as-of/period context (billed for periods starting in as-of month; overdue outstanding by date; ledger tab labeled as all-recorded totals with persisted-status caveat); `resetState()` returns outcome (`serverDeleted`/`localDeleted`/`warnings`) and UI reports incomplete/failed deletion honestly with stronger warning when operating records exist; GST UI/engine relabeled as **draft estimate (NOT a tax invoice)**, adds warnings, accepts optional `propertyState` additively, and no longer auto-imposes late fee in the estimate (potential late fee shown separately). `offlineOutbox.ts` exists but is **not wired** into `storageClient` full-state persistence (server-authoritative/localStorage fallback preserved) until a reconciliation/conflict model is designed. India statutory boundaries remain explicit (draft estimate/helper only; no place-of-supply/tax determination/TDS/e-invoicing/issuance compliance claims).
- **Services (local dev):** P06 5178, P09 5181, storage-server 5182 healthy during this session.
- **Shared/infra:** `packages/storage-core` foundation exists; `packages/storage-server` (5182) and `packages/shipment-flow` (5171) placement/dual-tracking remain open decisions.

### Remaining / open decisions (evidence-aware)
- P06: deep modal wiring to real workspace state; hazmat metadata capture/linkage; safe configurable EPCIS publisher adapter; ReceivingTask assumptions review; remove/gate any remaining standalone demo coupling not covered.
- P09: offline outbox reconciliation design before wiring to full-state storage model; mobile/capture UX; India-specific capability depth (GST flow completeness, e-NWR/WDRA/cold-chain) with tests/docs and no overclaims.
- Cross-cutting: auth/RBAC, durable server-side stores, multi-tenant isolation, conflict handling, repo placement for local service packages, root `products/*` dual-tracking.


## Audit Findings (P09, Lighthouse)
- Accessibility: 1.0 (was 0.9). Fixed: color contrast (accent darkened to #1e40af, removed low-contrast inline colors), heading order (h3→h2), main landmark, meta description.
- Best Practices: 1.0.
- SEO: 0.8 (meta description added; robots.txt is dev-server artifact).
- Remaining: label-content-name-mismatch (shared SuiteDock aria-labels vs visible text — P2), robots.txt (dev config).


## UI Expert Council Findings (addressed this pass)
### Visual Design
- [x] KPI cards: one hero tile distinction (pending — all still equal weight; deferred to next pass)
- [x] Card elevation/shadows (CSS --bg-2 vs --bg-0; hover lift added via .card:hover)
- [x] Move "Add Space" form off Overview → Spaces tab
- [x] Normalize spacing to tokens (CSS variables)

### Interaction Design
- [x] Field-level validation on onboarding form
- [x] Immutable state updates (payment, maintenance start/resolve/cancel)
- [x] Empty-state CTAs with actionable guidance
- [ ] Split tenant creation from lease creation (deferred)
- [ ] Add edit/delete/renew/terminate affordances (deferred)
- [ ] Keyboard submit (Enter) (deferred)
- [ ] Add facility tab (deferred)

### Accessibility
- [x] Inputs: aria-label on all form controls
- [x] Tab bar: role="tablist", role="tab", aria-selected
- [x] Notice: role="status", aria-live="polite"
- [x] Focus ring restored on inputs
- [x] Active tab contrast fixed (white on accent)
- [x] .btn-sm min-height 44px
- [x] Table headers: scope="col"

### Mobile/Responsive
- [x] iOS auto-zoom fix (font-size 16px on mobile)
- [x] touch-action: manipulation on buttons/inputs
- [x] Tab bar horizontal scroll on mobile
- [x] Form inputs full-width on mobile
- [ ] Scroll affordance on tables (deferred)


## Rent/Lease vs Rented (leased-in) — Clarification (2026-11-05)
The product now supports BOTH directions:
1. **Lease out** (landlord): owner collects rent from tenants → RentLedgerEntry (income), tracked in ledger tab.
2. **Rent in** (tenant): owner pays rent to landlord → RentPayableEntry (expense), tracked via RentPayableEntry + computePayableSummary.
3. **Owned**: no rent either direction; space management + maintenance only.
4. **Managed**: owner manages for landlord, collects rent, remits to landlord.

Facility registration now includes ownershipType selector (owned/leased_in/managed) with landlord fields. Space purpose (for_lease/for_own_use/shared_storage) defaults to for_lease.


## Industry Council Findings (addressed this pass)
### Indian Warehouse Owner (PER-RT-0201)
- [~] Honest local/session labeling exists in current UIs (evidence varies by product/build); avoid overclaiming “simulation banner added” globally — verify per product surface before closing
- [ ] Cloud sync + auth + multi-facility (Phase 6)
- [ ] WhatsApp/SMS rent reminders + PDF receipts + GST invoices
- [ ] Auto late fees + bank reconciliation + CA export
- [ ] Mobile meter-photo capture + tenant portal
- [ ] Hindi UI + guided onboarding wizard

### Warehouse Floor Operator (PER-RT-0202)
- [x] Simulation banner added
- [ ] Camera barcode/QR capture (PWA)
- [ ] Offline outbox with conflict reconciliation
- [ ] Task-driven receiving/putaway/dispatch screens
- [ ] Slot QR labels
- [ ] Damage photo capture
- [ ] Role-based mobile layouts
- [ ] Cold-chain temp/humidity alerts

### 3PL Ops Director (PER-RT-0104)
- [x] Simulation banner added
- [ ] Customer goods ledger (inward/outward, scan-backed, per-customer billing)
- [ ] Multi-tenant SaaS isolation + RBAC
- [ ] ASN/receipt/dock appointment
- [ ] Lot/serial/batch + expiry + FEFO
- [ ] Inventory on-hand by location
- [ ] Billing engine (rate cards, escalation, proration, GST, credit notes)

### Adversarial Stress Tester (PER-RT-0102)
- [x] Simulation banner added (addresses "label every screen SIMULATION/LOCAL ONLY")
- [x] Fixed temp range classification (max-only bug)
- [x] Gate sample/demo data behind explicit actions in P06 standalone (no auto-seeded canonical facility/manifest/entities/EPCIS); browser-verified 2026-11-05
- [ ] Delete or gate mockCargoFitLoad / SAMPLE_INBOUND_PALLETS / SAMPLE_OUTBOUND_ORDERS
- [~] Cycle Count/ABC Re-Slotting/Goods Ledger modals exist but wiring to real workspace state is shallow/sample-driven in places; hazmat policy wired into engine/putaway path with metadata gaps
- [~] EPCIS publisher port/noop + `createHttpEpcisPublisher` (conservative, tested) added; `published` only on verified evidence. Deployment-specific endpoint/auth/UI wiring and real receiver validation pending
- [ ] Replace localStorage with server-backed store
- [ ] Add multi-user end-to-end test
- [x] `applyHazmatPolicy` enforces `maxQuantityByClass` (tested)

## P09 P0 audit fixes (2026-11-05, local evidence; uncommitted at time of writing unless noted)
| Area | Status | Evidence / boundary |
|---|---|---|
| Rent correctness (area/quantity, escalation, proration amounts) | **Fixed in engine (local)** | `leaseEngine.ts`: `billingQuantity` captured (sqft_month defaults to space area), `calculateRentForPeriod` multiplies rate by quantity and prorates by billed/full day ratio when proration opts provided; day-based units use billed days; `revenue_share` returns 0 base rent (honest boundary). Regression tests: `tests/leaseEngine.test.ts` P0 cases. |
| Monthly ledger generation idempotency | **Fixed (local)** | `generateMonthlyRentLedgers` accepts `existingEntries` and skips stable `RL-{lease}-{YYYY}-{MM}` IDs; UI merges by ID. |
| Payment/receipt correctness | **Fixed (local)** | `recordPayment` applies to remaining balance, records `lastReceiptAmount`/`overpaidAmount` additively, returns `{applied,overpaid}`. UI defaults to outstanding, issues receipt for transaction amount. `issueReceipt` accepts transaction amount; `generateReceiptNumber` includes unique suffix. |
| Maintenance occupancy state | **Fixed (local)** | `MaintenanceTask.spaceStatusBeforeRepair` stored on start; resolve/cancel restore prior status (leased spaces not freed). Regression test in `tests/maintenanceEngine.test.ts`. |
| Verification (local) | **Passed** | `products/product-09-storage-leasing`: `npm test` → 13 files, 105 tests passed; `npm run build` (`tsc --noEmit` + `vite build`) exit 0. Not live/provider/production proof. |
| Remaining boundaries | **Explicit** | Durable transactional persistence/offline reconciliation/conflict model; GST estimate-only (no issuance/filing/tax advice); full lease lifecycle (renew/terminate/vacate/deposit/handover) and automatic final-ledger policy; meter period/cumulative readings model; P06–P09 shared facility identity/versioned contract; standalone-vs-monorepo sync decision; mobile-first owner tasks. |

## Persona Council Findings (runtime 2026-11-05, evidence-based)

> Method: reviewed runtime personas `PER-RT-0205/0206/0207` against current P06/P09 code/tests/builds and this session’s verified changes. This is an implementation/boundary review, not live customer validation or statutory certification.

### PER-RT-0205 — Multi-Customer 3PL Warehouse Director
| Area | Status | Evidence / boundary |
|---|---|---|
| Multi-client contract warehouse / tenant isolation | **Gap** | P09 models landlord↔tenant leases/spaces/rent; it does not provide RBAC, multi-tenant SaaS isolation, or proof that Client A cannot access Client B stock/data. |
| Per-customer goods ledger / on-hand by location | **Partial gap** | P06 contains goods-ledger related engine/UI artifacts (e.g., `GoodsLedgerModal` exists) but modal/workspace wiring is shallow/sample-driven in places; no verified end-to-end per-customer, scan-backed, on-hand-by-location ledger across receiving/putaway/dispatch. |
| Rate-card billing reconcilable to ledger | **Gap** | No verified 3PL rate-card/proration/escalation/credit-note billing engine reconciled to operational ledger events. |
| ASN/dock appointments | **Gap** | P06 has receiving/planning concepts and shipment-session integration; no verified ASN/appointment scheduling workflow with conflict rules and customer isolation. |
| Lot/serial/expiry/FEFO | **Gap** | No verified lot/serial/batch/expiry capture or FEFO enforcement in P06/P09 flows. |
| Audit readiness / commercial defensibility | **Boundary** | Useful planning/leasing primitives exist, but 3PL commercial claims (client isolation, defensible per-customer ledger, FEFO, billing reconciliation) are not yet substantiated by end-to-end implementation/tests. |

### PER-RT-0206 — Indian GST & Statutory Compliance Auditor
| Area | Status | Evidence / boundary |
|---|---|---|
| GSTIN capture | **Partial** | P09 accepts optional `Facility.gstin` in registration/model; tenant GSTIN validation was present in earlier engine work (verify before claiming complete coverage). Optional capture ≠ validated statutory master-data workflow. |
| GST on rent/services, SAC, invoicing | **Partial / boundary** | `gstInvoice.ts` and UI provide GST estimate/helper behavior from entered/real values; invoice UI uses `calculateLateFee`. **Not** e-invoicing, GSTR-1/3B filing, SAC/tax determination engine, or legal/tax advice. Missing GSTIN/state inputs must not be fabricated. |
| TDS 194-I / withholding | **Gap** | No verified TDS 194-I computation, deduction workflow, certificates, or filing support. |
| Security deposit / late fee treatment | **Partial** | Lease/ledger models include deposit/late-fee related concepts; statutory/tax treatment is not fully modeled or certified. Treat as operational records, not tax determination. |
| WDRA/eNWR boundary | **Boundary (explicit)** | Platform must not claim WDRA registration, negotiable warehouse receipt issuance, or customs-bonded statutory compliance unless separately implemented and evidenced. |
| Audit survivability claim | **Boundary** | Current records may support operator workflows but are **not sufficient alone** to claim Indian tax-audit/e-invoice/GSTR/TDS compliance. |

### PER-RT-0207 — Bonded / EXIM Warehouse Operator
| Area | Status | Evidence / boundary |
|---|---|---|
| Bond/licence registers, BOE/IGM linkage | **Gap** | No P06/P09 data model/UI/workflow for customs bond/licence, BOE, or IGM references. |
| Duty-deferred stock / customs-sealed movement | **Gap** | No verified customs-seal chain, duty-deferment state, or customs movement controls. |
| Container dwell, free days, demurrage | **Gap** | No container-level dwell tracking with free-day/demurrage computation. |
| Audit trail / traceability | **Boundary** | P06 has EPCIS/scan verification concepts with truthful local publisher behavior, but this is not a customs-bonded compliance trail. |
| Overclaim risk | **Boundary (must hold)** | Do not present P06/P09 as bonded-warehouse/CFS/customs-compliant or as a substitute for customs systems/process controls. |
