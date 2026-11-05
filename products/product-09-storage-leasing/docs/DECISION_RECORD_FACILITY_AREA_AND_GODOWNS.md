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

## Follow-ups (only after decisions / with scoped design)

- If multi-facility chosen: design schema migration, store shape, selection UX, and backward compatibility for existing single-facility `p09-state-v2` data.
- Consider exposing `buildingName` in lease/allocation views and filters; consider facility “buildings/blocks” as first-class entities without breaking single-facility users.
- Revisit `FacilityMetrics` interface vs actual producers if rent/overdue should be unified (separate concern).
