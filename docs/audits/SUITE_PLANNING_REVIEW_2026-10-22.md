# Native equipment, duty and carrier task review

Date: 22 October 2026. Scope: Product 04 Asset Studio, Product 03 HOS Planner and Product 08 Carrier Trust. This review belongs to the authorized suite UI continuation. Parent owns the canonical shipment domain, generated clients, visual study, exploration map and overall browser evidence. This document owns the native planning findings and disposition only.

## Objective and boundaries

The dispatcher needs to publish the same equipment, duty assumptions and carrier evidence that they reviewed, inspect every retained field, and recover local drafts after a concurrent shipment change. Each native product must remain independently useful. Changes are reversible local source, tests and documentation. No Git mutation, deletion, provider call or production change is authorized here. Existing dirty, staged and untracked work is preserved. Stop only for contested ownership, a materially different domain contract, or an external/production effect.

The simulated expert lenses use the already resolved canonical PER-950374 Fleet Operations Manager, PER-0395 Logistics & Supply Chain Systems Architect and PER-0080 Accessibility for Spatial & Scientific Interfaces Specialist. These are analytical perspectives, not interviews or operator acceptance. The parent review preserves the current source resolution and provenance.

Applicable method: Operating Doctrine 8.2; Review 1.3; Architecture 1.1; Testing 1.1; Documentation 1.1. Source inspection is Tier 1. Test and browser claims are recorded separately when performed.

## Observed findings before implementation

| ID | Observation and consequence | Proposed correction | Falsifier |
|---|---|---|---|
| PLAN-01 | P04's native vehicle selection changes its views, but `shipmentAdapter.evaluate` reads only `shipment.input.equipmentId`. A different reviewed vehicle is not the saved decision. | Publish a validated full snapshot of the selected native vehicle through one atomic `asset.publish` command. | Selecting a different vehicle already saves its exact capacity and source without changing input separately. |
| PLAN-02 | P04 falls back to `vehicleCatalog[0]` for an absent selected ID. That can visually attach a different vehicle to unknown input. | Show unresolved identity explicitly and require deliberate selection. Rehydrate a valid saved custom snapshot without silently replacing the catalog. | An unknown ID visibly remains unknown before any correction. |
| PLAN-03 | P03's native controls offer speed, route and driver mode; its connected adapter forces 55 mph, canonical route and solo. | Save the exact reviewed solo itinerary, speed, full-rest declaration and audit. Reject connected route or team changes until a canonical wider contract exists; retain standalone controls. | Altering native speed already changes the saved exact plan. |
| PLAN-04 | Connected updates currently import directly through legacy callbacks in these products. There is no local-draft recovery boundary. | Use the canonical reusable draft/session helper, reviewed record revision and explicit Load shared inputs action. | A remote revision already leaves unsaved native edits intact and requires explicit reconciliation. |
| PLAN-05 | P08 falls back to the first carrier for an unknown DOT; its display uses seeded precomputed audit/expiry fields while publication recomputes later. | Explicit unknown state and one reviewed timestamped audit snapshot, saved with full profile, policy, audit, evaluated time and expiry. | Unknown never displays another legal identity and reviewed audit exactly matches saved evidence. |

## Retained value and ownership

P04 retains its 20-vehicle and 23-package catalogs, custom authoring, all four view modes, spatial fit, temporal simulation, axle/unload simulator, fleet splitter, carbon calculation and standalone bridges. The shipment asset observation describes declared catalog/custom geometry and payload; it does not claim the package simulator is a mixed-unit loading plan or a measured physical vehicle.

P03 retains presets, editable standalone routes, speed and team exploration, multi-day logbook, waypoints, 3D corridor and printable modeled audit. The connected scope stays the existing full-rest solo scenario. No statutory engine or live ELD claim is introduced by publication.

P08 retains search, explicit roster, safety dial, BASIC metrics, insurance card, risk radar and standalone bridge URLs. Seeded evidence remains seeded; audit expiry describes freshness of the scenario observation rather than an insurer or authority receipt. Unknown is an unresolved state, not approval.

## Proposed contracts and page structure

Each native tool receives the existing shipment session through the wrapper. A compact task panel states local/shared state, reviewed record revision, exact publication action, affected-result warning, saved-record inspection and a disclosure of the full native draft. The parent-owned inspector remains the canonical deep-record surface. Native inputs remain owned by the native product; there is no second shipment store.

`asset.publish { equipmentId, result }` atomically changes equipment and saves its observation. `carrier.publish { carrierDot, result }` atomically changes carrier and saves the selected policy observation. The parent owns invalidation and input revision semantics. `evaluate { stage: 'hos', result }` records exact supported native assumptions against the reviewed record revision. An unsupported connected route or team draft stays available locally and cannot be mistaken for the canonical saved duty plan.

## Implementation and evidence disposition

Pending the parent's visual-first release and canonical shared helper contract. Append final file, command, outcome, sensitivity and residual-risk records here; preserve the observations above as the before state.

Baseline commands before product edits: `npm test` in P04 passed 34 tests; P03 passed 11; P08 passed 12. These are Tier 2/S1 baseline observations and do not yet test the new native publication contract. Source review also found that P03 can invoke its non-progressing itinerary loop with zero speed; numeric draft validation must run before the planner. The P08 insurance card claims independent verification and statutory minima despite the seeded customer-policy evidence; its wording is included in the correction scope. The accessibility-review skill is used for labeled controls, keyboard access, visible focus, explicit errors and responsive containment; physical assistive-technology acceptance remains outside this evidence.

### Completed native implementation, 23 October 2026

Status: implemented locally and verified through targeted tests, type checks and production bundles. The parent-owned visual-first study at `docs/design/shipment-operations-study` preceded integration. The earlier pending line above records the interrupted baseline; it is superseded by this disposition. Parent-owned service/browser receipts establish the cross-product runtime claim separately.

| Finding | Disposition and preserved value | Evidence boundary |
|---|---|---|
| PLAN-01 | `resultForVehicle` publishes the exact chosen specification through `asset.publish`, including full native vehicle, source, units, MPG, prior equipment ID and reviewed revision. Pricing category is explicit for supported subtypes; other subtypes remain unclassified. Package, axle, unload, temporal, fleet and carbon studies remain independent. | Exact immutable snapshot and category-abstention tests; shared domain invalidation belongs to the parent. |
| PLAN-02 | Unknown equipment shows a resolver, without selecting a substitute. A valid saved custom snapshot remains available after an unrelated manifest amendment makes its observation stale. A malformed same-ID saved snapshot remains unresolved instead of silently becoming its catalog template. The selected saved custom identity also has an explicit native selector option after reloading on another browser. | Both stale-custom loss and incomplete-snapshot acceptance failed before correction and passed afterward, Tier 2/S2. |
| PLAN-03 | Exact native speed, itinerary, audit and declared driver are saved. Connected route, rest and team changes require the canonical manifest or remain local exploration. Invalid numeric inputs stop before rendering calculations; the canonical planner boundary now also rejects invalid/nonprogressing distance, speed and clocks. | Nine publication checks, including exact 48 mph versus the former 55 mph default, tampered itinerary/audit, solo/team invalid speed and accepted-input restoration. |
| PLAN-04 | All three native Apps use the same canonical draft/session helper, reviewed record revision and explicit recovery action. Acknowledgement fingerprints the submitted value captured by the click handler; edits made while its request is pending remain dirty. Connected native bridge controls preserve shipment identity; standalone bridges, exports and entitlement fallback remain available. | Static producer/consumer review of the current helper, Workspace submission and all three native call sites. Delayed-response/browser verification remains parent-owned. |
| PLAN-05 | The selected seeded carrier has one timestamped profile/audit review, refreshed explicitly, with a 15-minute scenario observation expiry. Publication retains that exact review and configured customer policy, including blocked outcomes. Unknown, future, expired, tampered and malformed saved observations are rejected or unresolved. Insurance wording describes declared scenario policies. | Future-observation acceptance and malformed retained-evidence import failed before correction and passed afterward, Tier 2/S2. No live authority, insurer or fraud verification follows. |

The HOS printable report previously invented a carrier, driver, equipment, bill of lading, midnight date, signature and certified ELD status. Its fixed on-duty amount and unconditional checklist could also disagree with the reviewed plan. The existing report component was completed in place as an immutable per-open duty planning report, preserving print, summary and scenario review while adding the complete itinerary. It now computes all four status durations from the actual waypoints, distinguishes elapsed modeled time from calendar time, shows only declared shipment identifiers, and lists actual model violations. It uses a native modal dialog with named heading, initial focus, Escape handling, opener focus restoration, responsive internal tables and scoped print styles. Browser focus/print/mobile proof is deliberately not inferred from its static source or successful bundle.

### Verification and sensitivity

The native lane ran `npm test` and `npm run build` within each product. The build command includes `tsc --noEmit`. Final lane totals: P04 39 passing tests, P03 20 passing tests, P08 17 passing tests, with all three bundles passing. These are Tier 2/S1 focused and regression checks, not operator acceptance. Existing P04 and P03 large Three.js bundle warnings remain; no measured startup-speed claim is made.

The new `tests/shipmentPublication.test.ts` in each product retains source-linked synthetic fixtures and independent expected values. P04 checks 47.125 ft converts to exactly 565.5 in, and retained payload remains 31,234 lb after mutating the original draft. P03 checks the saved 48 mph input, changed output versus 55 mph, exact itinerary/audit consistency, unsupported modes, invalid values and restoration rules. P08 freezes review time at `2026-10-23T00:00:00.000Z`, expects expiry at `00:15:00.000Z`, independently expects 70 days until 1 January 2027, and protects blocked decisions and exact review immutability.

Three isolated in-memory source mutations were rejected by those invariants: replacing the P04 `nativeVehicle` deep clone with an alias, changing stored P03 native speed to 55, and replacing P08 `nativeReview` deep clone with an alias. Current behavior passed all three oracles; every mutation failed its corresponding oracle, Tier 2/S3. The experiment transpiled the actual adapters and dependencies with the already installed product TypeScript runtime and executed them in memory. It wrote no production source or shipment state.

The zero-speed engine investigation refined the earlier non-progress hypothesis: the old solo branch returned `NaN` transit with `isLegal=true`; the old team branch did not progress and exceeded a bounded 100 ms VM timeout. The corrected engine rejects both before iteration with `RangeError`. This before/after reconstruction removed only the newly added guard in memory, leaving runtime files unchanged. The final regression covers both modes, Tier 2/S2, with a deliberate guard-removal comparison also demonstrating sensitivity. An initial experiment from the root could not resolve TypeScript; it was rerouted to the product's existing dependency runtime without installing anything.

### Files, review passes and recovery

Native ownership includes the three `src/engine/shipmentAdapter.ts`, three `src/ui/App.tsx`, three `src/main.tsx`, three native publication tests, P04 `src/ui/ProjectBridgeBar.tsx`, P03 `src/engine/corridor.ts`, P03 `src/ui/EldAuditModal.tsx` plus `duty-report.css`, and P08 `src/ui/CoiVerificationCard.tsx`. The interrupted native changes and styles were inspected and retained. No generated `src/suite`, SuiteDock, service, global instruction, index or external source was edited by this lane.

Three closing passes were performed: correctness against the reviewed native payload; architecture and semantic preservation across the canonical session, adapters, draft ownership and existing standalone controls; and authorization/evidence/documentation compliance. Parent review identified and corrected the pending-response acknowledgement contract; this lane updated all three call sites to submit their captured value. A subsequent read-only adversarial check found that latest-selection guards and newer-revision recovery preserve local drafts across delayed responses. Reconciliation can conservatively require loading current shared inputs again, which is visible and recoverable.

All work remains uncommitted. Original product features, staged/untracked work and generated-client ownership are preserved. Recovery uses the same native editor, current shared-input action, retained shipment history and independent local mode. No data deletion, service restart, provider access or Git mutation occurred in this lane.

### Remaining boundaries and owner discussion

Physical vehicle measurement, current insurer/authority receipts, real ELD history, representative operator acceptance, screen-reader/device validation and provider operations remain unknown. The bounded full-rest solo model is retained; this change does not introduce split-sleeper, team-driver publication or external compliance approval. Those are separate product scope decisions rather than arbitrary assumptions. The existing commercial entitlements continue to own standalone add-on exports; this lane did not change commercial policy. Parent-owned actual browser checks and the exploration map remain the next evidence surfaces for the complete suite.
