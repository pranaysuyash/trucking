# Trucking spatial and 3D exploration map

Date: 2026-10-22, Asia/Kolkata. Owner and human reviewer: Pranay.

## Objective and authorization boundary

Document every meaningful spatial/3D opportunity first, then produce a distinct review visual for every manifest entry, obtain Pranay's explicit approval, and decide adoption later. The current authorization covers local exploration documentation and isolated review visuals. It does not authorize product integration, canonical product-state changes, Git changes, deployment, external messages, or automatic approval.

The canonical inventory is `cases.json`: 120 cases, twelve per product group. It includes financial, insurance, evidence, status, ELD, route, dimensional-container, volume, weight, physical-layout, and operational workflows. No category is dismissed as 2D-only. Every case receives a genuine 3D-first study with exact labels and linked companion details so that its usefulness can be reviewed. A visual study does not pre-decide whether the final product should use 3D, isometric, 2D, or a hybrid.

## Truth and evidence boundary

### Audit follow-through, 2026-11-06

The current cross-product work is tracked in [the audit task register](../../audits/AUDIT_TASK_LIST_AND_PLAN_2026-10-30.md), especially A18, A34 and A41. The warehouse 3D surface previously combined a rated-capacity sum described as stored mass with illustrative beam, dock and handling-equipment values. These are distinct quantities and evidence types: a visualization cannot establish actual inventory weight, rack safety or equipment availability from geometry. Source changes that label a scenario do not establish the physical condition of an imported facility; compare standalone and connected scenes, keyboard/touch/mobile access and before/after captures before accepting a visual. Preserve the existing 120 studies and their separate approval history. No adoption decision for those studies is implied by the current audit work.

All case entries describe proposed exploration surfaces. A source pointer identifies existing code or a domain contract that motivates the study; it is not evidence that the proposed interaction is implemented. All numeric values in `cases.json` are synthetic review fixtures, including money, percentages, insurance coverage, duty times, temperatures, capacity, dimensions, axle loads and scores. Every rendered route and PNG labels the scene `SYNTHETIC FIXTURE`; these are synthetic review scenarios. These values make no legal, regulatory, safety, provider, physical-condition, payment, or commercial-validity claim.

The existing-product inventory uses Tier 1 source inspection. The isolated gallery now has direct browser captures and focused construction checks, recorded in VERIFICATION.md. Those observations do not establish product runtime, device, physical, provider, or production validity. Product sources were changing in parallel during inspection. The new shared shipment workspace and per-product adapters are present in current source; mounted imports are not proof of runtime behavior.

### Existing implementation and proposed work

| Group | Observed source basis | Exploration boundary |
| --- | --- | --- |
| Cargo Fit | Solver/validator placements, cargo/equipment data, plan UI, axle, securement, hazmat, tandem and version modules exist. | Each case is a separately reviewed design, not a change to the solver or its proof claims. |
| Assets | Catalog, real-time model, teardown, 2.5D, blueprint, dimensions, spatial/temporal studies, multi-stop and fleet splitter exist. | Container containment, sensor topology and unified overlays require explicit adapters and additional data. |
| Warehouse | Facility spatial model, isometric/2D views, putaway, moveable entities and receiving verification exist. | Travel, hold, cross-dock and complete transaction semantics must not be inferred from rendered geometry. |
| Yard | Door/spot/button-grid UI, first-compatible-door assignment, gate form, detention and jockey-task models exist. | No measured yard coordinates or swept paths are supplied. Task completion alone is not an atomic trailer move. |
| Telematics | Seeded vehicle snapshots, timer simulation, scalar sensors, DTC cards and linear corridor schematic exist. | Technical component anchors, observed time series, live sensors and physical heat fields require additional data. |
| Pricing | Mounted orthographic truck, cost/quote state, simulated thermal/shock/seal table and financial engines exist. SVG truck alternative and route-compliance engine are source capabilities outside the mounted truck path. | All financial and evidence surfaces receive spatial studies; exact arithmetic and provenance remain visible. |
| HOS | Mounted synthetic corridor, waypoint model, ELD grid, duty audit and day navigation exist. | Fixed curve and uniform time progress must not be interpreted as real geography or stationary-duty-aware movement. |
| Trust | Seeded identity, policy, BASIC, score, reasons and risk-input cards exist. | Relationship graphs and verified evidence must not be invented from summary risk flags. |
| Command | Legacy preset dossier/iframe workflow and new shared local-scenario workspace source exist. | Scene states should compose canonical shipment results rather than add another editable shipment store. |
| Platform | Existing suite package, generated client synchronization and revisioned shipment contracts exist. | Shared spatial modules below are proposals for semantic reuse after design review. |

## Required reference research

Inspect [sael.net](https://sael.net/) and relevant X posts/media before claiming visual reference fidelity. Record exact source URLs, author/publication information where available, observation date, useful camera/material/annotation principles, and what was actually inspected. Distinguish inspected rendered evidence from text-only discovery. Do not copy a visual surface without adapting it to Trucking's technical models, precise values, object identity and workflow. Inspected sources, direct browser captures and the X access limitation are recorded in `REFERENCES_AND_LOCAL_REUSE.md`. Case PF-11 provides a dedicated comparison surface for this research. Research is not approval of a product direction.

## Canonical case contract

`cases.json` is an array. Every object has these canonical fields: `id`, `product`, `title`, `intent`, `family`, `focus`, `state`, `labels`, `metrics`, `interaction`, `source`, `modules`, `prerequisite`, `status`, `visual`. `labels` contains three to five specific annotations. `metrics` contains three or four `{label,value,unit}` objects. `focus` is a machine-readable descriptive name. Every current preparation `status` is `visual_ready_for_review`. The `visual` object records route, capture, thumbnail and `humanDecision: pending`; preparation status is separate from human approval.

Each case requires its own review route and its own PNG. Intended route contract: `review.html?case=<ID>`. Intended capture contract: `captures/<ID>.png`. All 120 routes and named captures are prepared. `captures/capture-results.json` is the per-case revision authority; all 120 now match `f0e21e664830ec47` after the 2026-10-23 interaction refresh. The isolated review implementation may use a different entrypoint only if it updates this contract and preserves stable case IDs and individual deep links. Every route must expose its case ID, title, synthetic marker, 3D model, meaningful annotations, exact metrics, interaction and prerequisite.

## Thirty shared module candidates

These are candidate capability boundaries, not a new adopted package architecture. Preserve current ownership and generator boundaries. Share stable domain concepts rather than copied appearance. No module is adopted by this inventory.

| ID | Candidate | Responsibility | Implemented Production Engine Cross-Reference |
| --- | --- | --- | --- |
| M01 | `spatial-viewport` | Renderer camera resize fit zoom scene lifecycle and context recovery. | `Realtime3DCanvas.tsx` (P04), `Realtime3DVehicle.tsx` (P02), `Realtime3DCorridor.tsx` (P03). |
| M02 | `identity-and-selection` | Stable object identity selection linked details and focus recovery. | `selectedVehicleId` (P05), `selectedDoorId` (P07), `physicalUnitId` (P01), `entityId` (P06). |
| M03 | `technical-models` | Canonical parametric vehicle cargo container and packaging model adapters. | `STANDARD_VEHICLES` (20 digital twins in P04), `STANDARD_PACKAGES` (23 assets in P04). |
| M04 | `units-and-coordinate-system` | Axes origins dimensions transforms units and physical scale. | `tandemSlider.ts` (KPRA 40ft & 5th wheel slider in P01), `units.ts` (mm/kg normalization in P01). |
| M05 | `annotations-and-legends` | Labels leader lines rulers numeric values and explicit legends. | `dunnageVoidCalculator.ts` (lateral & longitudinal void callouts in P01), `Blueprint2DView.tsx` (P04). |
| M06 | `corridor-and-paths` | Route polylines schematic paths stop markers and distance mapping. | `corridors.ts` (I-80 Midwest-Intermountain waypoints in P05), `corridor.ts` (popular corridor presets in P03). |
| M07 | `constraint-explanation` | Violation geometry reason links warnings and unknown states. | `hazmatSegregation.ts` (49 CFR § 177.848 in P01), `hosExemptions.ts` (49 CFR § 395.1 in P03), `crossBorderHos.ts` (USMCA Canada SOR & Mexico NOM-087 in P03), `bridge.ts` (Formula B in P01/P02), `driverQualification.ts` (49 CFR Part 391 DQF & Part 382 Clearinghouse in P08), `freightGuardIncident.ts` (Carrier411 double-brokering & hostage load embargo in P08). |
| M08 | `cutaway-and-clearance` | Clipping cutaway aperture reachability and occlusion controls. | `Interactive3DTeardown.tsx` (exploded spatial view in P04), `SpatialCapacityPanel.tsx` (P04). |
| M09 | `direct-manipulation` | Constrained handles numeric editing and drag preview interactions. | `TandemSliderModal.tsx` (interactive tandem pin slider in P01), `DialKitTuner.tsx` (P04). |
| M10 | `containment-and-capacity` | Nested containers external envelope usable volume tare gross and payload budgets. | `cartonCompression.ts` (McKee BCT compressive strength & ASTM D4169 crush limits in P01), `multiTempBulkhead.ts` (53ft multi-zone R-14 thermal bulkhead in P01), `warehouseEngine.ts` (P06 dual-role containers), `solve` (3D bin packing heuristic in P01), `spatial.ts` (concentrated contact patch floor pressure in P04). |
| M11 | `semantic-timeline` | Time-to-event mapping replay stationary periods and sequence synchronization. | `hosRecap.ts` (8-day rolling duty cycle recap & corridor truck parking in P03), `crossBorderHos.ts` (USMCA international border crossing in P03), `TemporalSimulatorPanel.tsx` (temporal fuel burn & single-tank exhaustion dwell in P04), `LogbookGrid.tsx` (24-hr statutory ELD grid & team dual-log in P03). |
| M12 | `handling-unit-placement` | Placements stacking support access barcode and slot references. | `wavePickingTsp.ts` (outbound wave picking & 2-Opt TSP pick path in P06), `putaway.ts` (velocity ABC slotting in P06), `validator.ts` (support & stability in P01). |
| M13 | `facility-topology-and-moves` | Yard aisle graph reservations source target occupancy and atomic move rules. | `crossDockMatching.ts` (inbound-to-outbound direct cross-dock matching & labor savings in P06), `guardShackKiosk.ts` (automated kiosk check-in, seal check & digital gate pass in P07), `YardMapCanvas.tsx` (doors, drop lots, hostler moves in P07), `warehouseEngine.ts` (racks, aisles, staging in P06). |
| M14 | `equipment-and-sensor-anchors` | Axles center of gravity doors tanks faults sensors and accessorial anchors. | `trailerIoTSensors.ts` (ultrasonic cube fullness, door reed & brake chamber stroke in P04), `aiDashcamSafety.ts` (in-cab DMS & forward ADAS computer vision in P05), `tpmsReeferControl.ts` (18-wheel TPMS & bidirectional remote reefer in P05), `telematics.ts` (SAE J1939 CAN bus in P05), `ColdChainLogger.tsx` (dual-zone reefer telemetry in P05). |
| M15 | `scenario-comparison` | Common-scale before after alternatives and difference overlays. | `laneBenchmark.ts` (DAT iQ & FreightWaves SONAR rate bands & market density in P02), `triangulationBackhaul.ts` (headhaul vs deadhead vs 3-leg triangle in P02). |
| M16 | `camera-and-lighting-presets` | Documented projection orientation light material and background presets. | `vectorIsometric.ts` (orthographic axonometric projections in P04). |
| M17 | `exact-quantity-encoding` | Financial temporal volume mass and scalar scales with exact numeric companions. | `accessorialRateCard.ts` (pro-rated detention increments in P02), `brokerMargin.ts` (P02). |
| M18 | `evidence-and-history` | Typed evidence artifacts events observation scope and inspectable provenance. | `epcis.ts` (GS1 EPCIS 2.0 XML/JSON events in P06), `vicsBol.ts` (VICS BOL in P01). |
| M19 | `spatial-finance-and-charts` | 3D-first waterfalls columns budgets coverage score and ELD experiments. | `laneBenchmark.ts` (30-day rate band spectrum visualizer in P02), `aeroEcoModeler.ts` (SmartWay aerodynamic drag, fuel/carbon ROI & eAPU payback in P04), `costs.ts` (waterfall cost breakdown in P02), `iftaCompliance.ts` (IFTA-100 tax schedule in P05). |
| M20 | `workflow-actions-and-recovery` | Preview confirm retry exception ownership and action boundary presentation. | `PersonaCockpitSwitcher.tsx` (role-tailored cockpits & quick actions in Portal), `ExceptionControlTower.tsx` (cross-product exception routing in Portal), `lifecycle.ts` (transactional stage decisions in Portal). |
| M21 | `hierarchy-and-semantic-zoom` | Portfolio facility vehicle container unit clustering and progressive disclosure. | `fleetSplitter.ts` (multi-vehicle capacity splitting in P04). |
| M22 | `deterministic-export` | Versioned scene snapshots image export documents and reproducible metadata. | `ediGenerator.ts` (ANSI X12 204/990/214/210 in Portal), `edi204.ts` (P01). |
| M23 | `shipment-result-adapters` | Canonical revisioned shipment stage results cross-product handoffs and invalidation. | `shipmentAdapter.ts` (implemented uniformly across all 9 subproducts). |
| M24 | `accessibility-and-input` | Keyboard touch pointer focus readable companions and reduced motion. | WCAG 2.5.5 minimum 44×44px interactive targets across all modals and inputs. |
| M25 | `performance-and-render-policy` | On-demand render visibility pause instancing quality budget and disposal. | On-demand render loop and worker threads (`worker.ts` in P01). |
| M26 | `spatial-design-tokens` | Typography contrast materials state patterns spacing density and responsive composition. | Swiss technical drafting aesthetic (`oklch(0.972 0.008 85)`, JetBrains Mono). |
| M27 | `provenance-and-freshness` | Synthetic manual observed unknown stale source timestamp and uncertainty semantics. | `dieselBenchmark.ts` (EIA weekly retail diesel index tracking with stale age warnings in P02). |
| M28 | `visual-review-capture` | Per-case review route PNG rendered inspection and before-after custody. | `tools/capture_visual_pass.mjs` Playwright visual regression receipts. |
| M29 | `reference-research` | sael.net and X reference collection source attribution and translated design principles. | SAE J1939, 49 CFR Part 395, 49 CFR § 177.848, 23 CFR § 658.17, GS1 EPCIS 2.0. |
| M30 | `approval-and-decision-ledger` | Case visual choice human approval revision and later integration disposition. | `AUDIT_FINDINGS_FIRST_PRINCIPLES_SYNTHESIS_2026-10-30.md` & `AUDIT_TASK_LIST_AND_PLAN_2026-10-30.md`. |

## Exploration and approval sequence

1. Inventory first: all 120 cases and 30 module candidates are recorded here before visual implementation.
2. Research references and record actual inspection evidence.
3. Render each manifest entry as an isolated, individual 3D-first visual with case-specific geometry, labels, values and companion details.
4. Capture each case to its own PNG and inspect it. Rendering or file existence is not acceptance.
5. Show Pranay the complete browsable gallery and individual deep links/captures. Record feedback per case.
6. Only Pranay can approve a case, request revisions, reject it or defer it. No timeout, model rating or agent conclusion counts as approval.
7. After explicit review, compare approved studies, choose product placement and decide integration scope separately. Preserve alternatives and decision reasons.

## Inventory and per-case visual obligations

Every row below has a prepared interactive visual and saved capture. Every proposal remains pending human review. Existing source bases are described above; every individual source pointer is in `cases.json`.

| ID | Product | Review case | Family | State | Review route | PNG obligation |
| --- | --- | --- | --- | --- | --- | --- |
| CF-01 | cargo | Mixed manifest fit | cargo | normal | `review.html?case=CF-01` | `captures/CF-01.png` prepared |
| CF-02 | cargo | Cargo dimensions and weight editor | cargo | selected | `review.html?case=CF-02` | `captures/CF-02.png` prepared |
| CF-03 | cargo | Irregular cargo envelope | cargo | inspection | `review.html?case=CF-03` | `captures/CF-03.png` prepared |
| CF-04 | cargo | Stacking and support | cargo | warning | `review.html?case=CF-04` | `captures/CF-04.png` prepared |
| CF-05 | cargo | Door passage and maneuver | cargo | inspection | `review.html?case=CF-05` | `captures/CF-05.png` prepared |
| CF-06 | cargo | Manual repack preview | cargo | selected | `review.html?case=CF-06` | `captures/CF-06.png` prepared |
| CF-07 | cargo | Stop sequence accessibility | cargo | sequence | `review.html?case=CF-07` | `captures/CF-07.png` prepared |
| CF-08 | cargo | Axle and center of gravity | vehicle | inspection | `review.html?case=CF-08` | `captures/CF-08.png` prepared |
| CF-09 | cargo | Tandem slider comparison | vehicle | comparison | `review.html?case=CF-09` | `captures/CF-09.png` prepared |
| CF-10 | cargo | Securement arrangement | cargo | inspection | `review.html?case=CF-10` | `captures/CF-10.png` prepared |
| CF-11 | cargo | Hazardous cargo separation | cargo | warning | `review.html?case=CF-11` | `captures/CF-11.png` prepared |
| CF-12 | cargo | Plan version comparison | cargo | comparison | `review.html?case=CF-12` | `captures/CF-12.png` prepared |
| AS-01 | assets | Equipment catalog comparison | vehicle | comparison | `review.html?case=AS-01` | `captures/AS-01.png` prepared |
| AS-02 | assets | Vehicle interior cutaway | vehicle | inspection | `review.html?case=AS-02` | `captures/AS-02.png` prepared |
| AS-03 | assets | Packaging asset twin | cargo | selected | `review.html?case=AS-03` | `captures/AS-03.png` prepared |
| AS-04 | assets | Custom asset forge | vehicle | selected | `review.html?case=AS-04` | `captures/AS-04.png` prepared |
| AS-05 | assets | Dimension tuner | vehicle | selected | `review.html?case=AS-05` | `captures/AS-05.png` prepared |
| AS-06 | assets | Container volume and mass budget | cargo | inspection | `review.html?case=AS-06` | `captures/AS-06.png` prepared |
| AS-07 | assets | Spatial capacity study | cargo | comparison | `review.html?case=AS-07` | `captures/AS-07.png` prepared |
| AS-08 | assets | Trip fuel time and range | route | sequence | `review.html?case=AS-08` | `captures/AS-08.png` prepared |
| AS-09 | assets | Carbon and energy study | finance | comparison | `review.html?case=AS-09` | `captures/AS-09.png` prepared |
| AS-10 | assets | Multi-stop axle evolution | vehicle | sequence | `review.html?case=AS-10` | `captures/AS-10.png` prepared |
| AS-11 | assets | Fleet split alternatives | vehicle | comparison | `review.html?case=AS-11` | `captures/AS-11.png` prepared |
| AS-12 | assets | Sensor topology study | vehicle | inspection | `review.html?case=AS-12` | `captures/AS-12.png` prepared |
| WH-01 | warehouse | Facility spatial overview | facility | normal | `review.html?case=WH-01` | `captures/WH-01.png` prepared |
| WH-02 | warehouse | Rack cell dimensional fit | facility | inspection | `review.html?case=WH-02` | `captures/WH-02.png` prepared |
| WH-03 | warehouse | Environmental zone allocation | facility | warning | `review.html?case=WH-03` | `captures/WH-03.png` prepared |
| WH-04 | warehouse | Inbound putaway recommendation | facility | selected | `review.html?case=WH-04` | `captures/WH-04.png` prepared |
| WH-05 | warehouse | Nested moveable containers | cargo | inspection | `review.html?case=WH-05` | `captures/WH-05.png` prepared |
| WH-06 | warehouse | Receiving scan verification | facility | inspection | `review.html?case=WH-06` | `captures/WH-06.png` prepared |
| WH-07 | warehouse | Forklift travel preview | facility | sequence | `review.html?case=WH-07` | `captures/WH-07.png` prepared |
| WH-08 | warehouse | Inventory hold and quarantine | facility | warning | `review.html?case=WH-08` | `captures/WH-08.png` prepared |
| WH-09 | warehouse | Capacity and occupancy layers | facility | comparison | `review.html?case=WH-09` | `captures/WH-09.png` prepared |
| WH-10 | warehouse | Dock-to-rack receiving sequence | facility | sequence | `review.html?case=WH-10` | `captures/WH-10.png` prepared |
| WH-11 | warehouse | Cross-dock staging experiment | facility | sequence | `review.html?case=WH-11` | `captures/WH-11.png` prepared |
| WH-12 | warehouse | Receipt discrepancy and evidence | evidence | warning | `review.html?case=WH-12` | `captures/WH-12.png` prepared |
| YD-01 | yard | Yard and dock overview | facility | normal | `review.html?case=YD-01` | `captures/YD-01.png` prepared |
| YD-02 | yard | Door compatibility and occupancy | facility | selected | `review.html?case=YD-02` | `captures/YD-02.png` prepared |
| YD-03 | yard | Drop-lot trailer locator | vehicle | selected | `review.html?case=YD-03` | `captures/YD-03.png` prepared |
| YD-04 | yard | Gate check-in destination | facility | sequence | `review.html?case=YD-04` | `captures/YD-04.png` prepared |
| YD-05 | yard | Hostler move preview | vehicle | selected | `review.html?case=YD-05` | `captures/YD-05.png` prepared |
| YD-06 | yard | Hostler move execution replay | vehicle | sequence | `review.html?case=YD-06` | `captures/YD-06.png` prepared |
| YD-07 | yard | Detention urgency on location | finance | warning | `review.html?case=YD-07` | `captures/YD-07.png` prepared |
| YD-08 | yard | Reefer parking and condition | vehicle | inspection | `review.html?case=YD-08` | `captures/YD-08.png` prepared |
| YD-09 | yard | Inspection and hold bay | facility | warning | `review.html?case=YD-09` | `captures/YD-09.png` prepared |
| YD-10 | yard | Appointment capacity over time | facility | sequence | `review.html?case=YD-10` | `captures/YD-10.png` prepared |
| YD-11 | yard | Full-yard recovery | facility | warning | `review.html?case=YD-11` | `captures/YD-11.png` prepared |
| YD-12 | yard | Yard-to-warehouse handoff | facility | sequence | `review.html?case=YD-12` | `captures/YD-12.png` prepared |
| TM-01 | telematics | Selected vehicle telemetry twin | vehicle | normal | `review.html?case=TM-01` | `captures/TM-01.png` prepared |
| TM-02 | telematics | Diagnostic fault localization | vehicle | warning | `review.html?case=TM-02` | `captures/TM-02.png` prepared |
| TM-03 | telematics | Reefer zone cutaway | vehicle | inspection | `review.html?case=TM-03` | `captures/TM-03.png` prepared |
| TM-04 | telematics | Door-open thermal sequence | vehicle | sequence | `review.html?case=TM-04` | `captures/TM-04.png` prepared |
| TM-05 | telematics | Fleet on corridor | route | normal | `review.html?case=TM-05` | `captures/TM-05.png` prepared |
| TM-06 | telematics | Geofence approach and arrival | route | sequence | `review.html?case=TM-06` | `captures/TM-06.png` prepared |
| TM-07 | telematics | Engine and fuel circuit | vehicle | inspection | `review.html?case=TM-07` | `captures/TM-07.png` prepared |
| TM-08 | telematics | Driver safety event replay | vehicle | sequence | `review.html?case=TM-08` | `captures/TM-08.png` prepared |
| TM-09 | telematics | Planned versus reported vehicle | vehicle | comparison | `review.html?case=TM-09` | `captures/TM-09.png` prepared |
| TM-10 | telematics | Sensor freshness and dropout | vehicle | warning | `review.html?case=TM-10` | `captures/TM-10.png` prepared |
| TM-11 | telematics | Elevation load and range | route | inspection | `review.html?case=TM-11` | `captures/TM-11.png` prepared |
| TM-12 | telematics | Telemetry-to-yard arrival | facility | sequence | `review.html?case=TM-12` | `captures/TM-12.png` prepared |
| PR-01 | pricing | Equipment-linked quote | finance | inspection | `review.html?case=PR-01` | `captures/PR-01.png` prepared |
| PR-02 | pricing | Three-dimensional cost waterfall | finance | normal | `review.html?case=PR-02` | `captures/PR-02.png` prepared |
| PR-03 | pricing | Margin and operating-ratio landscape | finance | comparison | `review.html?case=PR-03` | `captures/PR-03.png` prepared |
| PR-04 | pricing | Loaded and deadhead economics | route | sequence | `review.html?case=PR-04` | `captures/PR-04.png` prepared |
| PR-05 | pricing | Fuel index sensitivity | finance | comparison | `review.html?case=PR-05` | `captures/PR-05.png` prepared |
| PR-06 | pricing | Accessorial action anchors | finance | selected | `review.html?case=PR-06` | `captures/PR-06.png` prepared |
| PR-07 | pricing | Payload fuel sensitivity | vehicle | comparison | `review.html?case=PR-07` | `captures/PR-07.png` prepared |
| PR-08 | pricing | Cold-chain shock and seal route | route | sequence | `review.html?case=PR-08` | `captures/PR-08.png` prepared |
| PR-09 | pricing | Fuel mass and axle evolution | vehicle | sequence | `review.html?case=PR-09` | `captures/PR-09.png` prepared |
| PR-10 | pricing | Broker buy sell margin study | finance | comparison | `review.html?case=PR-10` | `captures/PR-10.png` prepared |
| PR-11 | pricing | Rate confirmation evidence stack | evidence | inspection | `review.html?case=PR-11` | `captures/PR-11.png` prepared |
| PR-12 | pricing | Quote scenario comparison | finance | comparison | `review.html?case=PR-12` | `captures/PR-12.png` prepared |
| HS-01 | hos | Semantic corridor itinerary | route | sequence | `review.html?case=HS-01` | `captures/HS-01.png` prepared |
| HS-02 | hos | Three-dimensional ELD logbook | evidence | inspection | `review.html?case=HS-02` | `captures/HS-02.png` prepared |
| HS-03 | hos | Remaining-duty clock volumes | finance | normal | `review.html?case=HS-03` | `captures/HS-03.png` prepared |
| HS-04 | hos | Stop reachability envelope | route | warning | `review.html?case=HS-04` | `captures/HS-04.png` prepared |
| HS-05 | hos | Solo and team comparison | route | comparison | `review.html?case=HS-05` | `captures/HS-05.png` prepared |
| HS-06 | hos | Sleeper and driver handoff | vehicle | sequence | `review.html?case=HS-06` | `captures/HS-06.png` prepared |
| HS-07 | hos | Duty violation and remedy focus | route | warning | `review.html?case=HS-07` | `captures/HS-07.png` prepared |
| HS-08 | hos | Detention schedule impact | facility | comparison | `review.html?case=HS-08` | `captures/HS-08.png` prepared |
| HS-09 | hos | Multi-day recap experiment | evidence | sequence | `review.html?case=HS-09` | `captures/HS-09.png` prepared |
| HS-10 | hos | Departure speed sensitivity | route | comparison | `review.html?case=HS-10` | `captures/HS-10.png` prepared |
| HS-11 | hos | Audit evidence and exception layers | evidence | inspection | `review.html?case=HS-11` | `captures/HS-11.png` prepared |
| HS-12 | hos | Rest-site parking study | facility | inspection | `review.html?case=HS-12` | `captures/HS-12.png` prepared |
| TR-01 | trust | Carrier identity spatial dossier | network | inspection | `review.html?case=TR-01` | `captures/TR-01.png` prepared |
| TR-02 | trust | Assigned fleet eligibility scene | vehicle | warning | `review.html?case=TR-02` | `captures/TR-02.png` prepared |
| TR-03 | trust | Insurance coverage volumes | finance | comparison | `review.html?case=TR-03` | `captures/TR-03.png` prepared |
| TR-04 | trust | Policy expiry timeline | evidence | sequence | `review.html?case=TR-04` | `captures/TR-04.png` prepared |
| TR-05 | trust | BASIC percentile comparison | finance | comparison | `review.html?case=TR-05` | `captures/TR-05.png` prepared |
| TR-06 | trust | Composite score explanation | finance | inspection | `review.html?case=TR-06` | `captures/TR-06.png` prepared |
| TR-07 | trust | Fraud relationship evidence graph | network | warning | `review.html?case=TR-07` | `captures/TR-07.png` prepared |
| TR-08 | trust | Authority and policy gate structure | evidence | warning | `review.html?case=TR-08` | `captures/TR-08.png` prepared |
| TR-09 | trust | Carrier comparison workspace | network | comparison | `review.html?case=TR-09` | `captures/TR-09.png` prepared |
| TR-10 | trust | Review decision and recovery | evidence | sequence | `review.html?case=TR-10` | `captures/TR-10.png` prepared |
| TR-11 | trust | Carrier event propagation | network | sequence | `review.html?case=TR-11` | `captures/TR-11.png` prepared |
| TR-12 | trust | Evidence provenance inspection | evidence | inspection | `review.html?case=TR-12` | `captures/TR-12.png` prepared |
| CC-01 | command | End-to-end shipment world | network | normal | `review.html?case=CC-01` | `captures/CC-01.png` prepared |
| CC-02 | command | Spatial lifecycle status | network | inspection | `review.html?case=CC-02` | `captures/CC-02.png` prepared |
| CC-03 | command | Master manifest dimensional view | cargo | inspection | `review.html?case=CC-03` | `captures/CC-03.png` prepared |
| CC-04 | command | Dispatch prerequisite scene | network | warning | `review.html?case=CC-04` | `captures/CC-04.png` prepared |
| CC-05 | command | Amendment before and after | cargo | comparison | `review.html?case=CC-05` | `captures/CC-05.png` prepared |
| CC-06 | command | Exception focus and recovery | network | warning | `review.html?case=CC-06` | `captures/CC-06.png` prepared |
| CC-07 | command | EDI transaction evidence flow | evidence | sequence | `review.html?case=CC-07` | `captures/CC-07.png` prepared |
| CC-08 | command | Dispatch packet and BOL scene | evidence | inspection | `review.html?case=CC-08` | `captures/CC-08.png` prepared |
| CC-09 | command | Invoice reconciliation landscape | finance | inspection | `review.html?case=CC-09` | `captures/CC-09.png` prepared |
| CC-10 | command | Fleet and shipment portfolio | network | normal | `review.html?case=CC-10` | `captures/CC-10.png` prepared |
| CC-11 | command | Evidence revision replay | evidence | sequence | `review.html?case=CC-11` | `captures/CC-11.png` prepared |
| CC-12 | command | Role-specific spatial workspace | network | comparison | `review.html?case=CC-12` | `captures/CC-12.png` prepared |
| PF-01 | platform | Canonical spatial identity | network | inspection | `review.html?case=PF-01` | `captures/PF-01.png` prepared |
| PF-02 | platform | Projection and unit calibration | vehicle | comparison | `review.html?case=PF-02` | `captures/PF-02.png` prepared |
| PF-03 | platform | Multi-scale semantic zoom | network | sequence | `review.html?case=PF-03` | `captures/PF-03.png` prepared |
| PF-04 | platform | Selection focus and linked details | cargo | selected | `review.html?case=PF-04` | `captures/PF-04.png` prepared |
| PF-05 | platform | Annotation density and occlusion | facility | inspection | `review.html?case=PF-05` | `captures/PF-05.png` prepared |
| PF-06 | platform | State and provenance grammar | evidence | comparison | `review.html?case=PF-06` | `captures/PF-06.png` prepared |
| PF-07 | platform | Thermal mass volume layer composition | cargo | comparison | `review.html?case=PF-07` | `captures/PF-07.png` prepared |
| PF-08 | platform | Spatial command preview | cargo | selected | `review.html?case=PF-08` | `captures/PF-08.png` prepared |
| PF-09 | platform | Deterministic review snapshot | evidence | inspection | `review.html?case=PF-09` | `captures/PF-09.png` prepared |
| PF-10 | platform | Responsive spatial workspace | network | comparison | `review.html?case=PF-10` | `captures/PF-10.png` prepared |
| PF-11 | platform | Reference-driven visual language | vehicle | comparison | `review.html?case=PF-11` | `captures/PF-11.png` prepared |
| PF-12 | platform | Cross-product model reuse study | vehicle | comparison | `review.html?case=PF-12` | `captures/PF-12.png` prepared |

## Dependencies and decisions retained

Measured yard/facility geometry, actual sensor topology, route polylines, operational reservation/move semantics, relationship evidence, evidence sources, current timestamps and supported domain rules are explicit prerequisites, not reasons to omit their exploration. Synthetic review models can demonstrate a design while exposing the missing data honestly. Every existing source capability remains preserved. No alternative is retired by this map.

Before any integration, review correctness and arithmetic, canonical ownership and semantic salvage, then instruction/authorization/evidence compliance. Review touchscreen, keyboard, narrow layouts, reduced motion, performance, context loss and readable exports in proportion to the chosen product surface. Those are later implementation obligations and are not claimed complete here.

## Change record

2026-10-22: Initial canonical 120-case inventory written after Pranay expanded the request to include every relevant workflow and asked for documentation before visuals. All cases await visuals and all decisions await Pranay. No integration is authorized by this record.

## Prepared visual collection

All 120 manifest cases now have individual interactive routes, saved review PNGs and scene-only thumbnails. Open `index.html` for the visual atlas, `review.html?case=ID` for an individual study, and `captures/capture-results.json` for the exact captured revision. All 120 human decisions remain pending. Six generated art-direction concepts are separately identified in the atlas; their annotations are illustrative rather than operational claims.

2026-10-22 continuation: Reconciled twelve semantic scene mismatches and replaced PF-10 with actual responsive captures. Corrected annotation clipping, recaptured all 120 at revision `db5b828dd82f6f74`, preserved original browser bytes and earlier passes, and verified artifact coverage/hashes. See `QUALITY_REVIEW.md` for the two unresolved fixture inputs and the design-review boundary.

2026-10-23 continuation: Added direct dimension manipulation, keyboard increments and reversible gesture history for CF-02/AS-05. Bound visual decisions to fixture/layer context and guarded delayed save responses by case/revision. Corrected empty-input recovery and numeric camera preservation. Recovered an interrupted capture run, refreshed all 120 at `f0e21e664830ec47`, regenerated derivatives and passed the strict integrity/currency check. Earlier complete source/captures remain preserved. See `INTERACTION_REFINEMENT.md`; no human visual decision or product integration follows from these checks.

2026-10-30 continuation: First-principles audit remediation and domain engine convergence pass. Rescued, completed, and surfaced all orphaned domain engines into accessible, high-contrast, doctrine-aligned UI components across P01, P02, P03, P04, P05, P07, P08, and Command Center Portal. Fully implemented and validated tasks T-001 through T-019 in `AUDIT_TASK_LIST_AND_PLAN_2026-10-30.md`: wired Tandem & NMFC to VICS BOL, reactive Portal 6-stage lifecycle stepper, circular localStorage ring-buffer event bus, multi-stop drop axle weight redistribution, 49 CFR § 393.106 void detection & inflatable dunnage airbags, FMCSA statutory HOS exemptions, EIA diesel escalator & 3-leg backhaul triangulation, IFTA state-line mileage aggregator, Heavy BEV Class 8 profiles, interactive 2D architectural SVG yard map (doors 1–12, drop lots A/B, hostler moves, detention alert rings), SAFER/L&I operating authority & VOIP fraud detection with automated DND locks, Portal Exception Control Tower, 49 CFR § 393.100–136 cargo securement & WLL calculator, multi-stop axle CG moment shift engine, multi-vehicle fleet splitter heuristic, and temporal fuel dynamics/refueling dwell simulator. Eliminated artificial dark mode / "AI slop" in Cargo Fit and Portal, reinstating the intentional Swiss technical drafting aesthetic (`oklch(0.972 0.008 85)` in Instrument Sans and JetBrains Mono). Upgraded SuiteDock and modals to WCAG 2.5.5 minimum 44×44px interactive targets. 36 screenshot visual receipts (18 desktop 1440×900 and 18 mobile 390×844) captured via Playwright Chromium and synced to `docs/audits/visual-evidence/2026-10-24-post-remediation/` and brain artifacts. All 415 unit/integration vitest tests passing (100% green across subproducts); 0 TypeScript compile errors across 9 sovereign subproducts; 9 of 9 production bundle builds succeeded. See [Audit Synthesis 2026-10-30](../../audits/AUDIT_FINDINGS_FIRST_PRINCIPLES_SYNTHESIS_2026-10-30.md), [Living Task Matrix](../../audits/AUDIT_TASK_LIST_AND_PLAN_2026-10-30.md), and [UI/UX Visual Pass Before/After](../../../.gemini/antigravity/brain/cd3c1b26-5602-45d3-a649-2939a3bf7f41/UI_UX_VISUAL_PASS_BEFORE_AFTER.md).


## Connected shipment task branch, 22 October 2026

This is an additive linear UI integration branch authorized by Pranay after the visual/density study and shipment task review. It does not approve, replace or retire any of the 120 spatial cases above. Their human design decisions remain pending. Canonical findings, source inventory, persona/research provenance and implementation disposition live in [Shipment task review](../../audits/SHIPMENT_UI_TASK_REVIEW_2026-10-22.md); operational instructions live in the [shipment runbook](../../runbooks/SHIPMENT_FLOW.md).

**Question and use:** Can an operator identify one shipment, review a native loading draft, accept exactly the reviewed pricing terms, and inspect the retained evidence across products without losing the independent workbenches? The actor is a local single operator using synthetic ambient, one-destination freight. The decision is the page/record ownership contract for Command Center → Cargo Fit → Pricing before extending the spatial/temporal canvas. Physical operations, real providers and commercial acceptance remain unknown.

| Primitive/frontier | Relationship and implementation | Evidence, falsifier and next boundary |
|---|---|---|
| Identity → selection → context | One UUID/input revision across actual product origins; compact persistent strip. Connects PF-01, PF-04, PF-06 and CC-03. | Verified local browser navigation and exact ID/barcode records. Falsifier: unrelated or invented record shown after navigation or missing ID. |
| Native draft → reviewed artifact | Each product owns calculation inputs and selected arrangement; explicit publication, no hidden default acceptance. Connects CF-01/CF-02 and PR-01/PR-05/PR-06. | Native edited cargo, diesel/OR/accessorials and accepted cents match. Falsifier: preview differs from committed artifact or a visual scene supplies unsourced operational truth. |
| Revision → dependencies → recovery | Reviewed revision checks, monotonic transport, atomic cargo command, explicit dirty-draft replacement. Connects CC-04/CC-05/CC-11 and PF-06/PF-09. | Tests, S3 transport/prerequisite mutations, S2 same-hash two-tab recovery and full-flow stale CAS. Falsifier: stale result passes dispatch or delayed response/another writer erases a draft. |
| Summary → detail → source/history | Actual record inspector, structured nested data/raw JSON, named controls, URL/Back/focus. Connects PF-03/PF-04/PF-09/PF-10 and PR-11. | Actual Details/Checks/History/Source, unknown-record abstention, keyboard and mobile Chrome checks. Falsifier: decisive detail available only in art, a clipped label, unavailable export or fabricated fixture. Full assistive-technology acceptance still unknown. |
| Context → task → optional visualization | Portal owns lifecycle status; native Cargo/Pricing tasks remain primary. Independent preset tour and optional pricing vehicle HUD preserved. Connects CC-01/CC-02/CC-12, PF-10 and PR-02/PR-03. | Same-scenario before/after panel measurements and mobile-width pass; optional renderer toggle verified. Falsifier: standalone use depends on service or the canvas blocks calculations. |
| Accepted terms → execution → invoice | Existing seven-stage prerequisites, dispatch, movement, barcode/location receipt, exceptions and exact invoice share the same record. Connects CC-06/CC-09/CC-11. | Complete nine-product browser regression, exact USD 287.87 invoice. This is local scenario evidence; physical/provider receipt remains a separate frontier. |

**Hypothesis, now locally supported:** progressive disclosure can reduce repeated chrome without losing record fidelity, provided summary, native draft, accepted evidence and source/history remain independently attributable. Same-record connected-panel heights fell from 920/823/999 px to 788/203/203 px for desktop Command/Cargo/Pricing, and from 1832/1735/2070 px to 1454/321/353 px on mobile. All three page-level mobile overflow defects were absent in final captures. This measures layout and field fidelity, not operator speed or preference. Evidence: [before receipt](../../audits/visual-evidence/2026-10-22-shipment-ui/before-browser.json), [final visual receipt](../../audits/visual-evidence/2026-10-22-shipment-ui/visual-verification.json) and [native browser task receipt](../../audits/visual-evidence/2026-10-22-shipment-ui/browser-verification.json).

**Selected architecture:** extend the canonical shared client and product adapters, keep the existing service/store, preserve native draft owners, use explicit reviewed publication and one reusable live-record inspector. The narrow Cargo command carries forward only already-current unchanged equipment evidence with original observation provenance; generic manifest amendments remain conservative. Older payloads remain inspectable without invented native assumptions.

**Rejected for this branch:** promoting the study fixture into a second application store; replacing full native products with study pages; treating a tool view as task completion; retaining two apparently active portal shipments; accepting a second hidden default quote. These alternatives add ambiguous truth or lose native capability. No historical artifact was deleted or silently declared abandoned. Reopen an alternative only with a preservation inventory, migration/ownership plan and evidence that it improves the task.

**Negative space retained:** operational execution amendments; warehouse outbound/release semantics; real equipment/scale/restraint evidence; actual duty history; real sensor/insurance/carrier identity; cold-chain/hazmat/multi-stop connected execution; large-plan transport/scalable storage; production authentication/tenancy. The current bounded workflow does not answer these by analogy or by a more elaborate canvas. Existing native experiments remain available.

**Owner discussions, nonblocking:** select the next real operator context and unsupported connected task; determine commercial entitlement/agreement policy only in its own scope; validate representative operator and assistive-technology/device tasks. No new persona was needed: current canonical Fleet Operations Manager, Logistics Systems Architect and Accessibility for Spatial/Scientific Interfaces seats covered this branch. Their simulated review is not user research.

**Disposition and next edge:** linear three-product branch implemented and locally verified, with source/index preservation and full-nine-product regression. Spatial case adoption remains pending. Apply this record/draft/action contract to another native product only after its own task audit, then test whether spatial/temporal representation improves an observed operational decision beyond the retained linear path. Preserve the canonical record and evidence limits in every representation.

---

## 2026-11-05 Update — Warehouse & Storage Audit Addendum

New engines and modules added in this audit cycle:

| Engine/Module | Product | Purpose | Status |
|---|---|---|---|
| `hazmatCompatibility.ts` | P06 | DOT 49 CFR 177.848 segregation, site policy | Implemented + tested (5 tests) |
| `defaultTempRangeForClass` + temp overlap check | P06 | Reject frozen cargo in chilled rooms | Implemented + tested (4 tests) |
| `verificationStatus` on EpcisEvent | P06 | simulated/observed/published truth level | Implemented |
| OBSERVE for routine putaway (ADD for commissioning) | P06 | EPCIS semantics correction | Implemented + test updated |
| P09 Storage & Leasing Core | P09 | Landlord module (facility, space, lease, rent, maintenance) | Implemented + 39 tests |
| `createIndianWarehouseExample` | P09 | Converted cold storage → dry warehouse example | Implemented + tested |

New personas: PER-RT-0201 (Indian warehouse owner/landlord), PER-RT-0202 (floor operator), PER-RT-0203 (cold storage specialist), PER-RT-0204 (agricultural godown operator).

Open decisions requiring user discussion: P06 fixes vs P09 expansion ordering; specialized storage timing; mobile platform; WDRA/eNWR; Sheet Bharat; auth/infra timing.

## 2026-11-06 follow-through: receiving, inventory and facility custody

The prior “temperature overlap” row is historical. Current P06 uses containment for declared intervals, and class-only or missing intervals remain indicative/unknown; a configured interval is not a measured temperature or physical compliance claim. See [P06 audit remediation](../../../products/product-06-warehouse-space-flow/docs/reviews/AUDIT_REMEDIATION_2026-11-06.md) for source, FDA research, test scope and limitations.

The canonical local shipment contract (`packages/shipment-flow/src/types.ts`) contains a manually entered receipt with receiver, time and unit/barcode/slot. P06 projects that record read-only in its goods-ledger view; it does not convert it into stock or evidence of a scan. Its shipment adapter uses the local scenario facility `LOCAL-RECEIVING-01` and slot assignments. P09's facility model instead owns landlord facilities, rentable spaces and lease allocations. No authoritative mapping, shared stock owner, SKU, quantity, lot, outbound movement or cross-product permission contract was established. The P06 session ledger is a separate exploratory tool, not the inventory authority.

For future studies, compare (1) shipment receipt linked to a separately owned inventory ledger, (2) an inventory authority receiving a versioned shipment event, and (3) a unified authority with explicit tenant and custody boundaries. Each option must specify identity mapping, who may see tenant/cargo data, revision/idempotency, offline conflicts, corrections and outbound release. The current read-only projection preserves the existing receipt without selecting an authority or inventing a second writable store. Decisions and implementation are tracked as A17/A31/A38 in the [audit task register](../../audits/AUDIT_TASK_LIST_AND_PLAN_2026-10-30.md); no physical, customer or production validation follows from this source trace.
