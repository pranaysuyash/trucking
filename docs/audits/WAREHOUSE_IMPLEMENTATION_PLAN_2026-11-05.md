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
- [x] Add HazMat compatibility/segregation/site-policy engine (hazmatCompatibility.ts) with tests
- [x] Distinguish simulated/observed/published in verification events (verificationStatus field on EpcisEvent)
- [x] Validate EPCIS semantics: routine putaway now uses OBSERVE (ADD reserved for commissioning)
- [ ] Support user-created facilities/spaces/capability definitions (remove fixed canonical facility dependency)
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
- [x] I9 VerificationStatus state machine concept (simulated→observed→published) + publisher port interface (pending code)
- [x] I11 Data-driven HazMat policy (config schema pending; matrix done)
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


## Current Status Summary (2026-11-05, final pass)
- P06: 92 passing tests (18 files). Hardcoded canonical facility still default; createCustomFacility factory available. Persistent records (localStorage) added. VerificationStatus state machine + publisher port added. Goods ledger engine added. HazMat data-driven policy added. Putaway cost model added. Temperature compatibility fixed. EPCIS OBSERVE for routine putaway.
- P09: 51 passing tests (4 files). Full tabbed UI with forms, persistence (localStorage), tenant onboarding, lease creation, monthly ledger generation, payment+receipt, maintenance lifecycle, meter readings. createTenant with GSTIN validation.
- Shared storage-core package: foundation created (packages/storage-core).
- Research: documented (live verification pending — tool rate limit).
- Personas: 4 new.
- Exploration map: addendum appended.

### Remaining for "all" (requires user decision or larger infra)
- Phase 3 remaining: B3 scan-backed receiving (camera), B4 offline reconciliation, B5 cycle counts, B6 cross-dock matcher, B7 ABC re-slotting.
- Phase 4: specialized storage subproducts (cold, agricultural, open yard, container depot, self-storage).
- Phase 5: mobile PWA (offline drafts, role-based mobile home screens, camera barcode, sensor stages).
- Phase 6: infra (auth/roles, durable event store, server-side reservations, authenticated multi-user service, unified visual).
- I-series remaining code: temp-range-replaces-enum (bridge done), shared storage-core migration (foundation done), data-driven HazMat JSON (parser done), VerificationStatus code (done), solver cost integration tuning.
- Open decisions: P06 fixes vs P09 expansion ordering; specialized storage timing; mobile platform; WDRA/eNWR; Sheet Bharat; auth/infra timing.


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
- [x] Simulation banner added (local-only, no server/backup/multi-user)
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
- [ ] Gate sample data behind explicit "demo mode" flag (P06 auto-seeds canonical facility)
- [ ] Delete or gate mockCargoFitLoad / SAMPLE_INBOUND_PALLETS / SAMPLE_OUTBOUND_ORDERS
- [ ] Wire cycleCount, abcReslotting, goodsLedger, hazmatPolicy to UI
- [ ] Implement real EPCIS publisher (published unreachable)
- [ ] Replace localStorage with server-backed store
- [ ] Add multi-user end-to-end test
- [ ] Fix applyHazmatPolicy to enforce maxQuantityByClass
