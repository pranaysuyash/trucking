# Decision Record — Product 09 UI Overhaul (Mantine v9)

**Date:** 2026-11-05
**Scope:** `products/product-09-storage-leasing` UI layer only. Engine, persistence contract, and domain types untouched.

## Decision
Replace the hand-rolled CSS + inline-styled monolith (`App.tsx`, 491 lines) with a componentized Mantine v9 interface driven by a single-source token palette.

## Stack chosen
- `@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/charts`, `@mantine/dates` @ 9.7.5 (peer React ^19.2.0; resolved React is 19.3.1).
- `recharts` 3.10.1, `dayjs` 1.11.23, `postcss-preset-mantine` 1.18.0.
- Reused existing `src/ui/icons.tsx` (44 icons) instead of adding `lucide-react` (avoids a two-icon-system split with `SuiteDock.tsx`).

## Palette
Teal primary `#14B8A6` / ink `#01211D` / text `#2DD4BF`; brass reserved for money figures `#D99A2B` / `#E8B455` / ink `#1A1206`; status = green/amber/red. Warm-neutral dark surfaces (`#0B0D0C` … `#2E332F`). Raw values live only in `src/ui/tokens.ts`; exposed to CSS via `createTheme` + `cssVariablesResolver`; `src/styles.css` contains no hex literals (enforced by `tests/no-hex-css.test.ts`).

## Architecture
- `src/ui/tokens.ts` — single source of truth for raw palette + contrast-critical pairs.
- `src/ui/color.ts` — WCAG relative-luminance/contrast helpers.
- `src/theme.ts` — Mantine theme + `cssVariablesResolver`.
- `src/ui/format.ts` — pure formatting helpers.
- `src/ui/selectors.ts` — pure derivations (testable without DOM).
- `src/ui/hooks/useFacilityStore.ts` — persistence + form-agnostic state (preserves `p09-state-v2` / `schemaVersion: 1`).
- `src/ui/components/*` — `StatCard`, `SectionCard`, `StatusBadge`, `Money`, `EmptyState`, `ErrorBoundary`.
- `src/ui/App.tsx` — shell over Mantine `Tabs`.
- `src/main.tsx` — `MantineProvider` + `Notifications` + `ErrorBoundary`.

## Persistence contract (frozen)
`storageClient.ts` untouched: `STORAGE_KEY = 'p09-state-v2'`, `schemaVersion: 1`, `loadState`/`saveState`/`resetState` semantics preserved, including `facility: null` as explicit empty state.

## Evidence
- BEFORE: `docs/evidence/before/` (6 tabs @ 1440×1000 + `overview-1440.png` @ 1440×2600 + `meta.json`).
- AFTER: `docs/evidence/after/` (6 tabs @ 1440×1000 + `meta.json`).
- Contrast: every palette pair ≥ 4.5:1 (encoded in `contrastPairs`, asserted by `tests/color.test.ts`); regression test documents the old `#1e40af` on `#181818` = 2.04:1 failure.

## Validation
- `npm run typecheck` — pass.
- `npm run build` — pass (927 modules).
- `npm test` — 71 tests pass (8 files), including 4 new regression files (format, color, selectors, no-hex-css).

## Notes / deferred decisions
- `RentPayableEntry` / `TenantPortalAccess` engine surfaces remain unexposed (out of scope).
- `calculateRentForPeriod` ignoring area/quantity for per-unit billing models is a pre-existing engine issue, not changed here.
- `SuiteDock.tsx` retains its own sky-blue palette (`#38bdf8`); convergence with `packages/suite-dock` is a separate, cross-product decision.
- Electricity tariff (`₹8`/`₹12`) remains hardcoded in `selectors.ELECTRICITY_CONFIG` (changing it implies a `schemaVersion` bump + migration).
- P09 now has its own real `node_modules` (isolated from the shared P01 symlink store) to avoid polluting other products.