# Spatial workbench integration proposal

Prepared 2026-10-23, Asia/Kolkata. Owner: Pranay for visual and integration decisions.
Status: concrete proposal only. No product implementation is selected or applied by this document.

## Intended outcome and sequence

Carry the approved spatial studies into existing product tasks while retaining their canonical records, units, revisions and independent workbenches. Start with a cargo-row inspection/editor pilot, then transfer its tested viewport/selection/measurement contract to assets and warehouse. Routes, financial encodings, telemetry and evidence follow their own domain adapters. Creative approval of one case is not approval of the remaining cases or the full suite.

The first bounded pilot is CF-02 within Cargo Fit's existing cargo inspection panel. It is a suitable first boundary because a single identified row already owns dimensions, unit, weight, rotation and stacking flags. It does not require changing the packing solver, dispatch rules or shipment store to make the spatial editor useful.

## Inspected current source and exact proposed boundary

| Existing owner | Current behavior or contract | Proposed pilot change |
| --- | --- | --- |
| `products/product-01-cargo-fit/src/ui/CargoStep.tsx:13` | Native manifest task, `update(uid,patch)` through `p.setScenario`; row edits preserve UID. | Retain this task and setter. Replace or augment only its `3D Cargo Inspection` presentation, starting around line 315. |
| `products/product-01-cargo-fit/src/ui/CargoStep.tsx:281` | Selected row, allowed orientations, mm conversion, volume and current SVG renderer. | Adapt the selected row and orientation into a renderer-neutral object. Keep the existing SVG as an explicit simple view during the pilot. |
| `products/product-01-cargo-fit/src/ui/App.tsx:209` | `setScenarioSafe` enforces read-only state. Existing scenario/hash/result ownership remains here. | Route an explicit Apply action through that setter. Never write a second scenario or a mesh-derived record. |
| `products/product-01-cargo-fit/src/engine/types.ts:13` | `CargoRow`: entered dimensions/units, nullable mass/dimensions, UID, optional physicalUnitId and barcode. | Preserve every identity and declared/unknown field. One row can represent multiple physical units; do not silently treat quantity as a single unit. |
| `products/product-01-cargo-fit/src/engine/units.ts:1` | Canonical mm/kg conversions and entered-unit round trips. | Import these converters into the product adapter. Gallery metre/lb convenience values must not become a second conversion authority. |
| `products/product-01-cargo-fit/src/engine/normalize.ts` | Canonical row validation and quantity expansion. | Continue to own validation. The scene displays its issues and never certifies fit, payload, axle reactions or loading legality. |
| `products/product-01-cargo-fit/src/engine/viz.ts:435` | Existing `Cargo3DCtx` and `renderCargo3D`. | Retain as fallback and compare against the same asymmetric fixture; no SVG retirement without explicit adoption and preserved unique behavior. |

These paths were inspected on 2026-10-23. Product files are concurrently owned and uncommitted; re-open them and inspect their product-level Git diff immediately before implementation. This proposal grants no Git mutation authority.

## Renderer-neutral data contract

The product adapter should produce one identified render subject with these fields, using existing product types where available:

- `rowUid`, optional `physicalUnitId`, optional barcode, and an independently named scene instance ID.
- `dimensionsMm: [length,width,height] | null`, the entered unit and entered values, plus the selected allowed orientation.
- `weightKg: number | null`, entered mass/unit, quantity, rotation and stackability.
- Source scenario/input revision or hash, field-level issues and explicit unknowns.
- Separate view state: camera, selection, annotation visibility, rendering quality and temporary edit preview.

The renderer converts mm to metres once at its boundary. It does not change the product's mm/kg arithmetic. A 1,219.2 × 1,016 × 1,300 mm envelope is 1.61031936 m³; zero mass is distinct from missing mass. The current inspector's truthiness-based mass branch deserves a focused zero/unknown regression during integration. It has not been changed by this exploration.

Physical transforms and display transforms must remain separate. Exploded presentation offsets cannot feed packing, occupancy or axle calculations. A visual subject ID is not proof of canonical entity identity.

## Editing and recovery contract

1. Select a native cargo row by UID. The table, model and detail panel resolve the same row.
2. Dragging or exact entry updates a temporary draft only. One drag is one undo step; Escape restores its starting draft.
3. Show entered and normalized units together. Missing dimensions show a repair state rather than an invented cube.
4. Apply explicitly names the affected row and before/after values. Re-check the source hash/read-only state before calling the existing product setter once.
5. If another writer changes the row or scenario, retain the preview, explain the conflict and require a fresh comparison before Apply. Never overwrite a newer draft silently.
6. Existing native validation determines issues; existing scenario/hash logic determines stale calculations and publication readiness.
7. Cancel, view changes and renderer failure preserve the canonical draft. The simple view and linear measurements remain usable.

A product implementation must decide how this preview history relates to the native editor's broader history. The gallery's local gesture history alone is not a transaction system.

## Six workflow adoption boundaries

| Candidate | Canonical domain boundary | Additional evidence before adoption |
| --- | --- | --- |
| CF-02 cargo | `CargoStep`, `CargoRow`, canonical units/normalization and native scenario setter | Unknown/zero fields, asymmetric rotations, read-only behavior, stale row conflict, undo/cancel, exact Apply and simple-view equivalence. |
| AS-05 assets | P04 catalog/custom asset and spatial engine contracts | Interior versus exterior/door dimensions, wheelbase reference, axle locations, approved parameter limits, source axes and cross-renderer calibration. |
| WH-04 putaway | P06 facility, slot, moveable-entity and receiving state | Exact facility/slot revision, unit identity, candidate reason, reservation conflict and scan mismatch. A visual placement is not a reservation or verified putaway. |
| HS-04 routes | P03 itinerary/HOS results and their recorded assumptions | Geographic versus schematic mode, real polyline when supplied, stationary-duty-aware time mapping, time zone, uncertainty and explicit rule provenance. |
| PR-02 pricing | P02 native cost/quote result and accepted-term revisions | Exact cents reconciliation, signed/zero values, missing inputs, unit scale, quote versus accepted terms and independent financial calculation. |
| TM-03 / TR-12 | P05 observed sensor snapshots / P08 evidence records | Actual anchors and timestamps, stale/missing sensors, source scope, expiry and uncertainty. A rendered heat field or evidence node does not verify a physical or carrier condition. |

The full 120-case inventory and M01-M30 boundaries stay canonical in `EXPLORATION_MAP.md` and `MODULES_AND_CONTRACTS.md`. This table selects reviewable integration boundaries without pruning other hypotheses.

## Preservation, implementation and evidence plan

Before implementation: record product-level status/diff, identify concurrent owners, preserve current fallback behavior, name the approved visual revision and exact target files. Reuse the existing native route and state owner. A future React spatial component and typed adapter should be introduced within the Cargo Fit product only after that scope is selected; gallery `buildStudy` and synthetic fixtures must not be imported into the product.

Focused checks must cover unit round trips; non-symmetric dimensions; all permitted orientations; unknown and zero mass; UID/barcode custody; failed/stale Apply; read-only mode; pointer/keyboard cancel and history; resize; renderer loss; simple/Studio parity; and no duplicate scenario store. Browser proof must show the actual product row before and after Apply and the expected stale-result behavior. Tests cannot establish physical loading safety or real-world compliance.

Recovery should be a reversible feature choice retaining the current inspector and canonical data. No deletion, reset, migration, deployment or Git operation is part of this proposal.

## Decision requested after visual review

Select the named case/revision, the Cargo Fit pilot boundary, whether inspection-only or draft editing is desired, and the validation/acceptance scope. No integration approval is inferred from "do it all" authorizing this refinement-and-proposal unit. Human visual decisions remain in the separate append-only review ledger.
