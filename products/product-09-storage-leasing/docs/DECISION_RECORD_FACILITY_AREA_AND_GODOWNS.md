# Decision Record — Facility Totals, Area Transparency, and Godowns (P09)

**Date:** 2026-11-05  
**Scope:** Facility registration totals vs modeled spaces; multiple godowns/buildings at the same location; P09 Storage & Leasing Core.  
**Status:** Implemented (additive, non-breaking); **genuine decisions pending user input**.

## Context / Evidence (first-principles)

- **Observed state (pre-change):** `Facility` stores property-level `totalAreaSqFt`/`usableAreaSqFt` (manual). `RentableSpace` stores per-space `areaSqFt` (from dimensions). `computeFacilityMetrics` computed leased/vacant/blocked/repair areas from spaces and **occupancy % from `leasedArea / facility.usableAreaSqFt`** (property-level denominator). `SpaceType` had no `godown`/`shed`. `RentableSpace` had no building/godown grouping field. UI registration labeled totals as “Total sq ft / Usable sq ft” without clarifying they are property-level and may differ from sum of modeled spaces. Spaces table showed no building/godown grouping.
- **Persistence contract:** Frozen (`p09-state-v2`, `schemaVersion: 1`). Changes must be additive/backward-compatible; no schema migration implemented here.
- **Product contract (existing):** `ARCHITECTURE_AND_STORAGE_CORE_CONTRACT.md` states “Facility: building with total/usable area, floors, electricity meter, refrigeration plant status.” It does not explicitly model multiple separate facility entities per site or a property→building→space hierarchy.

## Implemented (additive)

1. **Types/engine**
   - `SpaceType` adds `godown` and `shed` (additive; existing values unchanged).
   - `RentableSpace.buildingName?: string` — optional grouping label for multiple godowns/buildings/blocks at the same facility/location.
   - `FacilityMetrics.modeledSpaceAreaSqFt` — sum of all modeled `space.areaSqFt` values; independent of property `usableAreaSqFt`/`totalAreaSqFt`.
   - `computeFacilityMetrics` returns `modeledSpaceAreaSqFt` and **preserves occupancy semantics**: `occupancyPercent = round(leasedArea / facility.usableAreaSqFt * 100)` when usable > 0. This avoids silently changing existing behavior.
   - `FacilityMetrics.monthlyRentDue/monthlyRentOverdue` made optional with documentation (not produced by `computeFacilityMetrics`; rent due/overdue remain sourced from rent-summary selectors). Non-breaking cleanup of a pre-existing shape mismatch.

2. **UI**
   - Registration copy clarifies property-level totals and that multiple godowns/buildings at the same location can be modeled as spaces with a building/godown name.
   - Registration inputs labeled “Total sq ft (property)” / “Usable sq ft (property)” with explanatory text.
   - Add Space supports Godown/Shed and optional “Building/Godown” name; spaces table shows Building/Godown column.
   - Overview shows “Facility usable (property)”, “Sum of modeled spaces”, and occupied/occupancy; when usable ≠ modeled sum, shows an explicit warning and an **explicit user action** “Set usable = sum of modeled spaces” (reviews first; common/circulation areas may mean property usable should not equal modeled sum). No silent auto-overwrite.

3. **Tests (regression)**
   - `tests/facilityModel.test.ts`: verifies `modeledSpaceAreaSqFt`, preserved occupancy denominator/rounding, `godown`/`shed` + `buildingName` preservation, and alignment case where modeled sum equals usable.
   - Validation (2026-11-05, `products/product-09-storage-leasing`): `npm run typecheck` PASS; `npm test` PASS (**10 files, 85 tests**).

## Supersession / Removal Check

No deletion or removal performed. Existing behavior preserved (occupancy denominator, registration flow, space add/status/metrics). New fields/UI are additive. Any future removal (e.g., replacing single-facility model) must check supersession and original intent; interrupted/unfinished work may exist.

## 2026-11-05 Addendum — Admin/Analytics view + vacancy tracking + alert UX fix

**Implemented (additive):**
- New **Analytics** tab (admin/analysis view) computed from existing facility/leases/ledger/tenant data:
  - Utilization: total/leased/vacant spaces and leased/vacant/blocked+repair area.
  - Currently vacant spaces: code/name/building/type/area and **vacant duration** when tracked; legacy records show `unknown (not tracked for legacy record)` because historical status timestamps do not exist.
  - Renter payment behavior: per tenant, entries, paid-late count, overdue-now count, avg/max days late (paid late = `paidDate > dueDate`), late-paid amount, outstanding. **Transparent heuristic** for “regularly delays”: `>=2` late-paid entries, or `(late + overdue) / entries >= 0.5` with `>=2` entries. Days/amounts are computed, not inferred.
- **Vacancy tracking (additive, backward-compatible, schema v1 preserved):** `RentableSpace.statusChangedAt?` and `vacantSince?` (ISO). `addSpace` initializes based on status; `setSpaceStatus`/`allocateSpace`/`releaseSpace`/`allocateSpaceAndLease` (facilityModel) and `activateLease`/`terminateLease` (leaseEngine) maintain them. Legacy spaces without `vacantSince` remain valid; duration becomes available after future status changes.
- **UX fix (per feedback):** removed the noisy “Area figures differ…” alert in the confusing case where property `usableAreaSqFt` is `0`/unconfigured while modeled spaces exist. When property usable is configured (`> 0`) and differs from modeled sum, show a compact, non-alarmist note plus an explicit “Align usable to modeled” action (no auto-overwrite).
- **Tests:** added `tests/analytics.test.ts`; extended facility/engine coverage via new cases. Validation (2026-11-05): `npm run typecheck` PASS, `npm test` PASS (**11 files, 91 tests**), `npm run build` PASS.

**Evidence/notes:** Persistence `isPersistedState` validates top-level shape only; optional nested fields are backward-compatible. No git commit/push performed.

## 2026-11-05 Addendum — Admin analytics redesigned as a first-principles projection layer

**Why redesigned (responding to "not a long-term 1st-principles approach"):** The initial analytics implementation computed the requested metrics but embedded policy/definitions in ad-hoc code and UI text. The redesign makes analytics a **deterministic, pure projection layer** (`src/engine/analytics.ts`) with:

1. **Explicit `asOfDate`** (day-granular, passed in) — no hidden clock; testable/deterministic.
2. **Policy as configuration, not magic** — `PaymentDelayPolicy` (`minEntries`, `latePaidCountThreshold`, `problemRatioThreshold`) with `DEFAULT_PAYMENT_DELAY_POLICY`; results include the policy and a per-tenant `delayReason`. UI can evolve to admin-configurable policy without rewriting metric logic.
3. **Stable metric definitions** — `ANALYTICS_METRIC_DEFINITIONS` returned with results and rendered in UI; definitions/state the honest semantics (occupancy denominator preserved; vacancy duration unknown for legacy records; paid-late/overdue computed from dates).
4. **Long-term admin dimensions (computed from existing data, no schema break)** — utilization by building/godown (`space.buildingName`), receivables aging buckets (`current/1-30/31-60/61-90/90+`), per-tenant payment behavior with amounts/days/outstanding, vacancy snapshots with `durationKnown` flag.
5. **Honest unknowns** — legacy vacant spaces without `vacantSince` are reported as `unknown (legacy)`/`durationKnown=false`, never estimated.
6. **Evolvability path** — current implementation projects from entities + ledger (schema v1 compatible). Future evolution: persist `StorageEvent`/space-status events (`types.ts` already defines `StorageEvent`), backfill or derive `vacantSince` from events, add facility/entity dimensions when true multi-facility lands, and optionally store admin policy. The consumer-facing metric contracts (`AdminAnalytics`, definitions, policy shape) are designed to remain stable while the data source becomes event-backed.

**Limitations / genuine decisions still open:** no persisted event log yet (status timestamps are denormalized projections); policy is not yet admin-editable in UI/persistence; true multi-facility entities/selection not implemented; facility usable-area derivation and occupancy denominator policy remain explicit product decisions (see above).

**Validation (2026-11-05, redesign):** `npm run typecheck` PASS, `npm test` PASS (**11 files, 94 tests**), `npm run build` PASS.

## Genuine Decisions Required (do not choose arbitrarily)

### 1) Multi-facility support (separate managed entities)
- **Current model:** single `facility: Facility | null` in persisted state; UI registers/edits one facility; spaces belong to that facility. “Multiple godowns at same location” is currently supported as **multiple spaces under one facility** with `type=godown/shed` and `buildingName` grouping.
- **If required:** “separate godown buildings/sites as separate managed entities” (each with own totals, leases context, lifecycle, reporting) likely needs `facilities[]`/selection, IDs, persistence/schema evolution, and UI navigation. This is a product/data-model change, not a silent refactor.
- **Decision needed:** Is grouping spaces under one facility sufficient for “same location, separate godowns”, or do you need true multi-facility records now?

### 2) Auto-derive facility usable area from spaces
- **Current:** property `usableAreaSqFt` remains manual; UI surfaces delta and offers explicit action to align.
- **Options:** (a) keep manual + transparency (current), (b) default `usableAreaSqFt = sum(modeled leasable space areas)` on add/update with override, (c) configurable. Must define counting rule: all spaces vs `for_lease` only; include/exclude `under_repair/blocked/temporarily_reserved`; how to represent common/circulation areas not modeled as rentable spaces.
- **Decision needed:** Which default and counting rule?

### 3) Occupancy denominator policy
- **Current (preserved):** occupancy uses property `facility.usableAreaSqFt`.
- **Alternatives:** use `modeledSpaceAreaSqFt` (or sum of leasable-status spaces) as denominator, or make configurable. Each changes reported KPIs and downstream expectations.
- **Decision needed:** Keep property-level denominator, switch to modeled denominator, or support both with explicit labeling?

## 2026-11-05 Addendum — CA/Audit trail foundation (first-principles, additive)

**Scope/investigation:** Implemented the audit tasks that can be completed without arbitrary product decisions, aligned with P09 doctrines/AGENTS, CA persona `docs/personas/PER-RT-0210-Chartered-Accountant-Audit.md`, and the frozen persistence contract (`p09-state-v2`, schema v1, additive only).

**Findings/evidence (CA acceptance criteria vs implementation):**

| CA criterion | Evidence | Status |
|---|---|---|
| Agreement/possession/billing/start/end dates distinct and auditable | `Lease` has `agreementDate`, `depositDate`, `startDate`, `possessionDate`, `billingStartDate`, `endDate`; `createLease` preserves them; UI capture exists; lease/activation events now record these dates in payload. | Satisfied (types+engine+UI+events) |
| Indefinite leases still need monthly revenue recognition entries | `generateMonthlyRentLedgers` handles `lease.endDate` undefined and overlap/proration; active indefinite leases generate period entries. | Satisfied (engine); operator generates periods as needed |
| Proration must be documented with day counts | `RentLedgerEntry` now has additive `billedDayCount`, `fullPeriodDayCount?`, `prorationBasis?`; `generateMonthlyRentLedgers`/`generateRentLedgerEntry` populate when prorated (billing start/end boundaries, termination building block). | Satisfied (additive metadata); **note:** base rent calculation remains the existing month-based model (behavior preserved) — a day-rate proration formula change would alter amounts and is a separate product/accounting decision. |
| Deposit is a liability until adjusted/returned; must not be revenue | `Lease.depositAmount` is tracked on lease; rent calculation/ledger `totalDue` excludes deposit; no deposit revenue ledger entry is generated. | Satisfied (by design); explicit liability/adjustment workflow remains future work |
| Terminations produce a final prorated ledger entry up to termination date | `terminateLease` updates lease/space status+dates but **does not** auto-create a final ledger entry (behavior preserved; auto-generation would be arbitrary without policy). Added explicit pure building block `createTerminationFinalLedgerEntry(...)` with day-count/proration basis. | **Genuine decision required before auto-wiring** (see below) |
| No revenue recognized before billing start date | `generateMonthlyRentLedgers` uses `billingStartDate ?? startDate`, skips/clamps periods before bill start, and sets `effectiveStart`/proration basis. Regression test added. | Satisfied |

**Implemented (additive, schema-v1 compatible):**
- `StorageEvent` was already typed but unused; now an **append-only audit trail foundation** is wired: `PersistedState.events?: StorageEvent[]` (default `[]`), `storageClient` normalization/load/save preserves frozen contract keys and adds events; `useFacilityStore` hydrates/persists events; `createStorageEvent` helper (`src/engine/auditEvents.ts`).
- Key UI transitions emit events (observed, operator actor): `facility.created`, `space.created`, `tenant.created`, `lease.created`, `lease.activated`, `ledger.entry_created` (includes proration fields), `ledger.batch_generated`, `payment.recorded`, `receipt.issued`. Foundation is minimal/testable; more transitions (maintenance, space status edits, termination UI, meter readings) can be added incrementally without contract breaks.
- `packages/storage-server/server.mjs` updated additively to preserve `events` (local loopback only; deployment decisions deferred).
- `RentLedgerEntry` additive audit fields: `billedDayCount?`, `fullPeriodDayCount?`, `prorationBasis?`.
- Explicit CA building block: `createTerminationFinalLedgerEntry` (pure, no auto-generation).
- Tests added: `tests/auditEvents.test.ts`, `tests/caAudit.test.ts`. **Validation (2026-11-05):** `npx tsc --noEmit` PASS, `npx vitest run` PASS (**13 files, 100 tests**), `npm run build` PASS.

**Supersession/removal check:** No deletions. `StorageEvent` type existed (previously unused) — integrated rather than removed. Modified `DECISION_RECORD_UI_OVERHAUL.md` and unrelated P06/motto files were left untouched.

## Genuine Decisions Required (audit/CA — do not choose arbitrarily)

### 4) Termination final prorated ledger (CA criterion 15)
- **Current:** `terminateLease` sets status/end date and frees space; it does **not** create a final ledger entry. `createTerminationFinalLedgerEntry` exists as an explicit helper.
- **Decision needed before behavior change:** Should termination auto-generate a final prorated ledger entry? If yes: (a) period start (last billed period end+1 vs cycle start), (b) due date policy, (c) proration calculation basis for `baseRent` (current engine is month-based; CA proration may require day-rate — behavior change), (d) idempotency/duplicate prevention, (e) handling existing overlapping unpaid entries, (f) UI confirmation/operator override, (g) audit event payload and GST/tax treatment.
- **Recommendation (for discussion):** make it an explicit operator-confirmed action in UI using the helper, with idempotency key and clear preview; do not silently mutate financial records.

### 5) Proration *calculation* policy (amounts)
- **Current:** amounts use existing `monthsBetween`/rate model (preserved). Day-count/basis metadata is now recorded.
- **Decision needed:** If CA requires day-rate prorated amounts (not just documented day counts), define formula (actual/actual, 30-day month, per-billing-cycle), rounding, and migration/communication for existing behavior.

### 6) Audit event coverage / export / retention
- **Current:** key transitions emitted; events persisted locally/loopback; no export, no UI log, no tamper-evidence, no retention policy.
- **Decision needed (deferred with deployment):** event completeness policy, UI audit log, export (CSV/JSON), retention/compaction, and whether to use signed/hash-chained events for stronger auditability.

## Follow-ups (only after decisions / with scoped design)

- If multi-facility chosen: design schema migration, store shape, selection UX, and backward compatibility for existing single-facility `p09-state-v2` data.
- Consider exposing `buildingName` in lease/allocation views and filters; consider facility “buildings/blocks” as first-class entities without breaking single-facility users.
- Revisit `FacilityMetrics` interface vs actual producers if rent/overdue should be unified (separate concern).
- After decision 4: wire operator-confirmed termination final ledger flow (preview, idempotency, event). After decision 5: implement agreed proration amount formula with regression fixtures and migration notes. After decision 6: add audit log UI/export and retention policy (coordinate with backend/deployment decisions).
