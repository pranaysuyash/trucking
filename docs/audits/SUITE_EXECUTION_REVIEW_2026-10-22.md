# Native movement, receiving and dock task review

Last materially reviewed: 23 October 2026, Asia/Kolkata. This document continues the authorized suite implementation begun on 22 October. Scope: Product 05 Fleet Telematics, Product 06 Warehouse Space & Flow Planner and Product 07 Yard & Dock. It records native execution findings and disposition. The parent task owns the canonical shipment service/domain, generated clients, shared styles, visual study, exploration map and browser evidence.

## Outcome, ownership and authorization

The dispatcher and receiver can publish the receiving solution and door they actually reviewed, declare ordered scenario movement for the assigned tractor, and enter receipt evidence using the original physical-unit identities and barcodes. The business value is an explainable plan-to-receipt chain with explicit discrepancies. The internal value is one shared shipment record with native product-owned working drafts, current resource checks and reviewed record revisions.

The user authorized the whole named local suite task and its ordinary implementation, testing, documentation and recovery. No Git staging, commit, push, branch/worktree operation, deletion, provider call or production effect is authorized or performed in this lane. Dirty and untracked source is preserved. The interrupted `MovementTask`, `ReceivingTask`, `DockAllocationTask`, native planner integration and capacity work were inspected and completed rather than replaced or removed. No additional editable shipment store, client distribution path or facility registration was introduced.

Applicable control plane: Operating Doctrine 8.2, Architecture 1.1, Testing 1.1 and Documentation 1.1; root/product AGENTS and P06's [spatial contract](../../products/product-06-warehouse-space-flow/docs/ARCHITECTURE_AND_SPATIAL_CONTRACT.md). Simulated fleet-operator, systems-architect and accessibility perspectives follow the parent's current canonical persona resolution. They are analytical lenses, not interviews, live warehouse inspection or operator acceptance.

## Findings and falsifiers

| ID | Observed before state and consequence | Implemented disposition | Falsifier/check |
|---|---|---|---|
| EXEC-01 | Shared warehouse evaluation independently solved default native inputs. A native facility/manifest/recommendation could differ from the published decision. | Publish the exact reviewed manifest, recommendation/result and facility snapshot with current fit binding, reservation snapshot and reviewed record revision. Independently revalidate every selected location; never silently re-solve during publication. | Change a recommendation or external reservation after review; publication must reject the mismatch. |
| EXEC-02 | Existing bridge translation fabricated an ETA, order number and dock. | Connected intake replaces those demonstration values with the shipment reference and explicit undeclared schedule/door/staging text. Physical identities, leading-zero/case-sensitive barcodes, measurements and stackability survive translation. Standalone demonstration remains. | Compare connected manifest to original shipment and inspect all metadata. |
| EXEC-03 | Individually eligible rack slots could collectively exceed their bay rating. Unknown pre-stock/reserved/blocked mass could be treated optimistically. | Enforce aggregate bay ratings during solving, native publication and standalone execution. Unknown committed rack mass consumes the full individual position rating. No invented 900 lb or zero-mass default is used. | The four-by-2,000 lb fixture must allocate at most 6,000 lb; deliberate removal of the aggregate guard must violate this invariant. |
| EXEC-04 | Flexible cargo could take the only usable position for constrained cargo. | Allocate fewest-compatible-position items first, then ground-only/heavier ties. Restore recommendation display to original manifest order. This remains a bounded heuristic, not a claim of global optimality. | Two floor positions, one larger-only item and a flexible earlier item must both be allocated. |
| EXEC-05 | A putaway generated before another occupancy could still succeed after bay overcommit. Successful standalone putaway lost the declared occupied mass. | Recheck physical suitability and current bay commitment before occupancy. Move declared reservation mass to actual occupancy and clear reservation mass. | New tests failed first (`success=true` for an overcommitted bay; `currentWeightLbs=undefined` after putaway), then passed after correction. |
| EXEC-06 | Receipt could be auto-filled or confused with a physical scanner result. | Explicit manual scenario form requires receiver, original barcode and accepted location for every unit. Local validation failures remain in the working draft and can be corrected. They do not automatically assert physical damage or create a shared exception. | Wrong-case/leading-zero barcode, wrong location, omitted/duplicate unit and blank receiver must be rejected. Correcting the entry must succeed without changing identities. |
| EXEC-07 | Shared dock publication could choose a default door unrelated to the native reviewed selection. | Publish the exact selected current native door. Require native availability, correct commodity type, current receiving result and no other-shipment reservation. Save full door snapshot, reservation snapshot and receiving dependency. Derive selected door details from its ID so native gate updates cannot leave a stale selected object. | Select a different compatible door; saved ID/snapshot must match. Occupied, unknown, incompatible and externally reserved doors must fail. |
| EXEC-08 | Animated fleet sensors could be confused with movement of the assigned shipment tractor. | Separate explicit local-scenario departure and arrival from the animated sensor demo. Enforce dispatched → in-transit → arrived order and assigned tractor identity. Accept a user-defined exception reason with scenario provenance. | Another demo tractor, arrival before departure and departure before dispatch must fail; animation alone creates no shipment event. |
| EXEC-09 | Polling or an in-flight save could overwrite or falsely acknowledge a later local edit. | Use canonical `useShipmentDraft`, reviewed record revision and explicit load-current action. Each native handler acknowledges its captured submitted value rather than the latest edited value after awaiting a response. | Dirty remote updates and edits made while a request is pending must remain local and require review. Parent owns shared-hook regression evidence. |
| EXEC-10 | A reservation retained in a saved facility snapshot could remain blocked after the owning shipment released it. | Distinguish the stored reservation snapshot from native facility occupancy. Restore released reservation overlays to the declared canonical baseline and apply current overlays. New external reservations clear old mass declarations and consume full position rating when mass is unknown. | A previously blocked reservation becomes available only when current shared resources release it; native occupied/blocked baseline status is preserved. |

## Canonical contracts and operating structure

P05, P06 and P07 render their existing native `App` inside the existing `ShipmentWorkspace` session provider. `useShipmentDraft` coordinates provenance and recovery; each product retains ownership of its native values. Shared execution uses `canSubmit`; planning uses the stricter draft-status `canPublish`. No service or resource connection means no shared planning save. Independent native tools remain available without a shipment selection.

Warehouse publication uses `evaluate { stage: 'warehouse', result }`. It requires current successful fit evidence, the complete deterministic connected manifest, exactly one recommendation per original unit, reconciled summary totals, unchanged canonical facility geometry, unique available storage positions, matching barcode/physical constraints, and both individual and aggregate capacity. Conflicting/unassigned units remain inspectable but cannot produce a successful receiving stage. The saved `details` retain:

- `facilityId`, full `facilitySnapshot`, `nativeManifest` and `nativeResult`;
- exact `recommendations` and `assignments`, `computedAt` and `fitRecordedAt`;
- `reviewedRecordRevision`, `reservationSnapshot`, `unknownMassSlots`, `capacityBasis` and explicit local-scenario source.

Shared resource arrays describe current local shipment-service exclusions. They contain no measured occupied weights or physical observation time. The client does not invent either. The service performs its own current reservation collision and reviewed-revision checks at commit. A known snapshot is not a lease guaranteeing future availability.

Connected facility geometry is the declared canonical local facility. Custom geometry registration is not silently inferred from the standalone planner. Saved older recommendation records without newly retained `packageType` and `groundOnly` remain inspectable; a new publication requires re-solving to recover these physical requirements. Existing records are not rewritten, deleted or assigned invented assumptions.

Dock publication uses `evaluate { stage: 'yard', result }`, binding `warehouseRecordedAt` to the accepted receiving result. Equipment type and declared thermal class determine door compatibility. The shared result does not fabricate gate-in, seal or detention facts. Native gate check-in, hostler, seal and detention tools remain separate scenario demonstrations.

Movement uses explicit `depart`, `arrive` and `exception.open` commands with `source: manual_scenario_entry`. It retains declared origin/destination and assigned tractor. There is no declared planned departure/arrival time, live ETA, live GPS or ELD device. The page says so. The native animated sensor, cold-chain and diagnostic demonstrations remain independently usable.

Receipt uses `deliver { receiver, units, source: manual_scenario_entry }`. The receiver must enter the original barcodes exactly, including case and leading zeros. Location comparison permits existing trim/case normalization while retaining the entered evidence in the immutable event. Complete unique original unit coverage is required. Successful commitment displays the receiver, recorded time, original barcodes and accepted locations. Local entry errors are distinct from a separately reported shared exception; Command Center owns exception resolution and invoice readiness.

## Exact UI controls and deep inspection

| Product | Primary controls | Detail/recovery routes |
|---|---|---|
| Warehouse planning | **Review receiving space**, **Re-solve Putaway**, **Publish reviewed receiving plan** | **Inspect saved receiving plan**, **Inspect shipment and units**, **Load current shipment**, map/slot details, native recommendation reasons and complete shared-record inspector |
| Yard/Dock | **Review dock allocation**, **Shipment dock door**, **Publish reviewed dock allocation** | **Selected door capacity and source**, **Inspect saved dock allocation**, **Load current shipment**, existing native facility map |
| Fleet movement | **Record shipment movement**, **Record scenario departure**, **Record scenario arrival**, **Exception reason**, **Report shipment exception** | **Planned route and recorded movement**, per-event inspector, **Dispatch and exception recovery**, **Open receiving task**, **Load current shipment** |
| Warehouse receipt | **Receive identified handling units**, **Receiver name**, **Handling unit N barcode**, **Handling unit N location**, **Confirm manual scenario receipt** | **Expected barcode and receiving location**, **Inspect handling unit N**, **Inspect accepted receiving plan**, **Entry discrepancies**, **Load current shipment** |

## Files and valuable behavior retained

Native task integration: each product's `src/main.tsx`, `src/ui/App.tsx`, `src/engine/shipmentAdapter.ts`; P05 `src/ui/MovementTask.tsx`; P06 `src/ui/ReceivingTask.tsx` and `Warehouse2DPlanner.tsx`; P07 `src/ui/DockAllocationTask.tsx`. Capacity/physical provenance: P06 `src/engine/{types,putawayEngine,verificationEngine,cargoFitBridge}.ts`. Regression coverage: P05 `tests/shipmentMovement.test.ts`; P06 `tests/{shipmentExecution,bayCapacity,putawayEngine,cargoFitBridge}.test.ts`; P07 `tests/shipmentDock.test.ts`.

The existing animated CAN/GPS/cold-chain/DTC controls, fleet roster, native warehouse 2D map and 3D study, containment/entities, native EPCIS demonstration, standalone import, native putaway reservation/verification, yard gate check-in, jockey work, detention and standalone bridge URLs are retained. The warehouse 2D component remains mounted when the independent 3D study is shown, preserving its working draft. The connected interface qualifies manual scenario entry before action; it does not promote existing demonstration EPCIS/scanner formatting to physical-device proof.

Generated `src/suite` clients, shared task styles, SuiteDock, parent domain/service, study and browser harnesses are outside this lane's ownership. No lane edits were made there.

## Verification and sensitivity

Targeted commands, run from each product directory on 23 October 2026:

| Command | Outcome | Evidence |
|---|---|---|
| P05 `npm test` | 20 tests passed, including 13 new movement/exception cases | Tier 2 / S1 |
| P05 `npm run typecheck` | Passed | Tier 2 / S1 |
| P06 `npm test` | 45 tests passed, including 21 new reviewed-plan/receipt/capacity cases | Tier 2 / S1 overall; stale-execution and occupied-mass continuity are S2 |
| P06 `npm run typecheck` | Passed | Tier 2 / S1 |
| P07 `npm test` | 20 tests passed, including five new selected-door cases | Tier 2 / S1 |
| P07 `npm run typecheck` | Passed | Tier 2 / S1 |
| P05/P06 `git diff --check` | Passed; read-only Git inspection | Tier 1; untracked source requires parent final manifest |

The initial P06 run observed the legacy bridge assertion `proposedCount === 3` fail with `2`. All three units still receive compatible unique locations; one now takes a safe alternative because the rack bay's unknown committed mass is conservatively charged. The revised bridge check asserts exact identity order, complete compatible coverage and unique receiving locations, preserving the actual bridge contract. It does not relax the bay rating to preserve an optimistic category count.

Fresh execution S2 observations were recorded before correction at local 00:08 on 23 October: stale-bay test expected `success=false` but received `true`; occupancy-mass test expected `1250` but received `undefined`. Both pass after physical revalidation and mass continuity corrections.

At `2026-10-22T18:42:10.838Z` (23 October locally), two isolated in-memory TypeScript module probes passed the real implementation and detected deliberate mutations: disabling the aggregate bay rejection and replacing the unknown-mass slot-rating charge with zero. Both have `baselinePass=true`, `mutationDetected=true`, Tier 2/S3. The probes read and transpile source in memory; no canonical source, fixture, Git state or service data was mutated. An initial probe could not resolve TypeScript from the root's absent `node_modules`; resolving the already installed P06 dependency succeeded without installation.

Browser/mobile/focus, complete cross-product dispatch-to-invoice and actual visual before/after evidence are parent-owned and must be assessed from the current timestamped [suite completion evidence](visual-evidence/2026-10-22-suite-completion/). This lane's passing tests and typechecks do not themselves establish Tier 4, physical scanner, live device, real freight, certified capacity, operator acceptance or production readiness.

## Three review passes and remaining boundaries

1. **Correctness and completeness:** exact reviewed native solutions, selected door, ordered assigned-tractor movement and explicit original-unit receipt are represented. Targeted failure/recovery checks cover unavailable resources, stale fit, changed native manifest, duplicate locations, wrong identity, external reservation, aggregate mass, malformed input, execution overcommit and correction of receipt errors. Parent browser verification remains the next evidence gate for runtime integration.
2. **Architecture and salvage:** one session/store/generator remains canonical. Native tools keep their drafts and independently useful functions. Interrupted native task work was salvaged, physical requirements are retained rather than reconstructed optimistically, and temporary service reservations do not become permanent native occupancy. The solver preserves scarce compatible positions but makes no optimality guarantee.
3. **Doctrine and evidence:** local implementation/testing/documentation stay in the authorized scope. No deletion, external provider/device claim, financial approval, Git mutation or unrelated product edit occurs in this lane. The new review is a specialist disposition linked to the parent runbook/map, not a second instruction or shipment schema.

No product-owner choice blocks this bounded local scenario. Wider custom-facility registration, measured stock-weight capture, physical scanners/ELD/GPS and representative receiver/operator acceptance need a separately bounded contract and evidence plan. Existing simulated hazard/cold-chain and facility-policy assumptions are not certified legal or engineering determinations.
