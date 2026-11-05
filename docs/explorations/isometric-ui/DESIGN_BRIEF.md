# 3D Logistics Workbench: Exploration Design Brief

Status: Proposed exploration direction; no product integration approved.  
Owner: Pranay for creative and per-case approval; current chat for bounded exploration.  
Last reviewed: 2026-10-22, Asia/Kolkata.  
Canonical location: `docs/explorations/isometric-ui/DESIGN_BRIEF.md`.  
Related records: `cases.json` owns the case inventory and proposed interactions; `EXPLORATION_MAP.md` defines the canonical M01-M30 identities; `MODULES_AND_CONTRACTS.md` adds evidence and contracts for those same modules. `APPROVALS.md` and explicit human decision records preserve creative decisions separately from visual preparation. Existing product architecture and operational records retain their ownership.

## Purpose and authorization

Explore the full useful application space for three-dimensional, isometric, axonometric, and spatial interfaces across the trucking suite. Document all candidate applications first, then create a separate review visual for every retained case. The intended output is a reviewable body of options from which Pranay can approve specific case IDs.

The current scope is documentation, isolated scene drawings, synthetic fixtures, and a local review gallery. It does not select an implementation roadmap, integrate a renderer into any product, change product runtime, replace canonical records, alter safety or financial decisions, or authorize Git/external mutations. Prototype code, if separately produced inside this exploration, serves review only. Product files, running services, and unrelated dirty work remain outside this document's ownership.

The inventory is broad by design. Pricing, trust, timelines, documents, route planning, and orchestration remain eligible for meaningful 3D exploration. Evaluate their visual hypotheses rather than dismissing them because a conventional interface uses tables or charts. Each case still needs exact labels, a defensible spatial encoding, and an equivalent way to inspect its source values.

## Evidence and reference boundary

Current repository inspection is Tier 1 static evidence. Existing screenshots and older audit reports are historical context until matched to the current source and environment. A generated scene image establishes a visual option; an interactive prototype establishes only the interactions actually observed in that prototype. Neither establishes production, provider, real-user, physical, legal, financial, or safety proof.

The requested Sael-inspired direction is treated as a creative reference supplied by the operator: strong dimensional composition, deliberate forms, disciplined lighting, and object-centered explanation. This brief makes no claim that a particular external reference was inspected, licensed, or reproduced. The work should form a distinctive logistics visual language from that direction rather than imitate a site's identifiable composition.

The operator also identified prior local 3D work. Source was inspected read-only in `/Users/pranay/Projects/opus5.5-experiments/set-the-light`, its room-v2 port under `/Users/pranay/Projects/abhishek_bhaiya/room-frontend`, and `/Users/pranay/Projects/opus5.5-experiments/visit-diorama-v2`. Reusable mechanics include parameterized layout/assemblies, bounded camera fitting, materials/textures, deliberate lighting, editable-object history, batched contact shadows, transition interruption, and constrained-device fallback. Exact source provenance and transfer caveats are in `MODULES_AND_CONTRACTS.md`. These are existing implementation references, not evidence that their present visuals are accepted or that their code has been integrated here.

## Visual thesis

A logistics workbench should make the current question legible in one composed scene: what is here, what fits, where it goes, what changes, what is uncertain, and what requires a decision. Geometry gives the answer structure. Precise object-attached information makes it usable.

Use a cool white and slate canvas, strong industrial forms, cobalt selection and operational emphasis, and orange for the active movement or exception being examined. Preserve generous negative space. A selected pallet, trailer, rack, route segment, money stack, or evidence node should become the visual anchor. Supporting information belongs near its object or in a small aligned inspector, with readable leader lines when necessary.

This is a proposed theme for the isolated review study. It does not change any existing product theme or imply acceptance of a suite-wide redesign.

| Role | Proposed token or rule | Purpose |
|---|---|---|
| Canvas | `#F4F6F8` with white drawing surfaces | Cool, neutral working field |
| Primary ink | `#172332` | Crisp labels and structural edges |
| Secondary ink | `#596A7D` | Supporting values and provenance |
| Structural slate | `#B6C2CE`, `#718397`, `#33475B` | Distinguish top, side, underside, and frame |
| Industrial cobalt | `#175CDE` | Selection, primary path, active comparison |
| Signal orange | `#F0782C` | Active movement, constraint witness, focused exception |
| Confirmed state | Muted green plus explicit text/icon | Source-backed success or completion |
| Unknown state | Slate hatch plus explicit label | Missing data without implying failure |
| Critical state | Restrained red plus shape/text | Actual case-defined violation or blocked condition |
| Type | Clear sans serif; tabular numerals for measurements | Readable labels and stable comparisons |

Avoid generic dashboard card grids as the dominant composition, glass panels, decorative purple gradients, sparkle symbols, excessive glow, and floating labels with no clear attachment. Do not encode every operational status by a new saturated color. Color supports a visible hierarchy; it does not replace text, line style, shape, or source status.

## Composition and rendering

The default camera is orthographic with a deliberately composed three-quarter view. A true isometric preset may use equal axis foreshortening; other useful axonometric presets are allowed when labeled accurately. Perspective is a separate proposed view mode for inspection or route immersion. Do not call all three-dimensional scenes mathematically isometric.

Use one broad key light, soft fill, bounded contact shadows, and restrained ambient occlusion. Shapes should remain distinct when flattened to grayscale. Ground contact, elevation, wall thickness, load-bearing surfaces, door openings, and parent-child containment should be evident. Lighting must support dimensional reading rather than obscure exact boundaries.

Each scene has a primary story and an ordered hierarchy:

1. The object, relationship, or state transition under review.
2. The exact measure or decision affected by it.
3. The few constraints or comparisons that explain the result.
4. Source, freshness, approximation, and uncertainty.

Use cutaway, x-ray, isolation, exploded views, sequence controls, and linked detail only where they reveal the story. Exploded offsets are display transforms. They do not change physical placement, route length, financial totals, or operational state.

## Scale and semantic encoding

### Cargo, equipment, containers, and facilities

Render physical dimensions to a documented world scale. Always expose length, width, height, units, origin, usable interior, and relevant clearance. For containers show volume, loaded mass, remaining capacity, and the active capacity mode. A volume view and a weight view may tell different stories; the selected mode must be visible and the other constraint must remain inspectable.

Differentiate outer shell, usable interior, door aperture, ground clearance, rack/bin envelope, and occupied bounds. Preserve effective packed dimensions and orientation. A cylinder may have a true shape and a separate conservative packing envelope. Show an unknown measurement as unknown rather than assigning a plausible default.

For operational cases retain unit, barcode, container, slot, vehicle, order, and shipment identity through selection and transitions. A pallet moving from trailer to dock to staging to rack should remain the same canonical entity in the proposal. Prototype fixture IDs demonstrate this relationship without claiming a live integration.

### Routes, corridors, time, and motion

Explicitly choose geographic, schematic, or spatialized timeline mode per case. Geographic mode requires appropriate coordinate and distance provenance. Schematic mode can rearrange layout for readability but must say that distances are schematic. A time axis requires units, time zone, origin, and a scale distinct from map distance.

Use route ribbons, stop volumes, queue lengths, permitted windows, duty/rest intervals, and actual versus planned traces when relevant. Labels should identify miles, duration, arrival, dwell, fuel, and the evidence status of predictions. A motion preview is a simulation unless its source is a recorded trace. Pausing must expose exact state and values.

### Financial and capacity scenes

Explore dimensional stacks, cost components, capacity towers, margin gaps, scenario assemblies, settlement flows, and exception amounts. Give every encoding an explicit scale and exact amount. If stack height encodes USD, width/depth must be fixed or have separately named meanings. If volume encodes amount, all dimensions must follow that declared mapping. Do not let a decorative object suggest a second numerical quantity.

Show currency, sign, decimal precision, category, time basis, and source. Exact labeled totals remain visible; component sums must reconcile. Negative values, zero, missing rate, partial payment, and disputed quantities deserve explicit cases. A visual quotation or settlement proposal is not an accepted rate, issued invoice, payment, or commercial outcome.

### Carrier trust, evidence, documents, and policy

Explore spatial evidence relationships, entity networks, expiry horizons, evidence bundles, document chains, source freshness, and the path from a flag to its supporting record. Nodes need stable entity IDs and labeled relationships. Evidence strength is not physical distance unless that mapping is declared. Separate a suspicious pattern from a verified conclusion and a policy recommendation from an authorized operational decision.

An expiry scene can use time depth, clearly dated evidence planes, and an explicit as-of time. Trust scenes must support source inspection and uncertainty without implying that a polished 3D model has verified a carrier, policy, document, or legal status.

## Application coverage requirement

`cases.json` is the canonical individual inventory. Do not maintain a second competing case list here. The inventory should cover these families, including their important empty, conflicting, uncertain, and recovery states:

| Family | Applications to include in the inventory |
|---|---|
| Cargo Fit | Mixed cargo arrangements, orientation, space/weight mode, doors and clearance, support, stacking, stop access, CoG/axle explanation, securement, editing, sequence, comparison, scans, portable plan/report |
| Asset Studio | Vehicle/package catalog, real bounds and variants, interior/exterior, shape envelopes, parts and assembly, cutaway, teardown, capacity, split loads, multistop, temporal/fuel/energy, carbon assumptions, cross-product assets |
| Warehouse | Facility and zones, rack/level/bin, docks and staging, occupancy/reservations, putaway alternatives, constraint witness, environmental/hazmat zones, containment, scan mismatch, movement and audit history |
| Yard and dock | Gate arrival, appointments, yard allocation, trailer/container state, hostler path/task, dock fit, dwell/detention, departure readiness, congestion and exception recovery |
| Pricing and settlement | Cost waterfall, fuel and energy, empty/loaded miles, equipment/scenario comparison, quote components, break-even, operating ratio, accessorials, detention amounts, invoice evidence and reconciliation |
| HOS and corridor | Geographic/schematic route, duty/rest time, stops, driver/team scenarios, remaining budget, arrival windows, constraints, alternate itinerary and exception explanation |
| Telematics | Position/trace, truck systems, DTC attachment, thermal history, reefer compartments, geofences, fuel/energy, stale/disconnected data, replay and planned/actual comparison |
| Carrier trust | Carrier/asset/evidence relations, policy expiry, screening factors, anomalous links, document provenance, missing/conflicting sources, eligibility explanation, human review context |
| Command Center and shipment | Shared shipment journey, physical handoffs, product context, evidence continuity, exception ownership, before/after scenarios, revisions, receipt and financial reconciliation |
| Shared interaction and communication | Search/selection, inspectors, legend and scale, camera/orientation, accessible linear view, reduced motion, mobile composition, comparative scenes, annotations and export |

Do not silently prune ideas because they are less physical. Record a weak or uncertain hypothesis with a clear visual test. Merge genuine duplicates while preserving their source context. A case is a concrete question and visual experiment, not merely a menu item or a generic scene reused under multiple titles.

## Per-case review contract

Each inventory case needs a stable ID and its own visual route and PNG reference. Exact key names follow the canonical `cases.json` schema. Semantically each record must preserve:

- Product or cross-product context, current source reference, current/proposed status, intended user, and the question the visual answers.
- Scene mode, spatial encoding, visible objects, exact quantities, selected entity, fixture provenance, source/freshness label, and material unknowns.
- Proposed interactions and resulting inspectable state; module dependencies and prerequisite contracts.
- A unique visual route, saved PNG, visual revision, review status, and human decision provenance when supplied.
- Acceptance checks, known limitations, and the next discriminating check for any hypothesis.

Default all cases to pending review. Explicit human approval of a named case ID is the only source of that case's approval. A thumbs-up for a general theme, an agent recommendation, an automatically generated screenshot, or a successful gallery check does not approve every case. Record requests to revise or defer without deleting the case or its earlier evidence. Approval applies to the reviewed visual revision and scope; material changes return it to review. Creative approval does not itself authorize product integration.

## Current isolated gallery and interaction scope

The gallery is a visual review implementation, with generalized camera, selection/inspection, data-layer, sequence and separation controls. Each scene defines which visible properties those controls affect. A control or scene present in source is not proof that the corresponding browser behavior has been observed. The per-case `interaction` field is an intended exploration interaction, including behavior that may remain proposed.

CF-02 and AS-05 now implement temporary fixture dimension handles, exact fields, keyboard increments, undo/redo, Escape cancellation and reset. Their observed interactions and limits are recorded in `INTERACTION_REFINEMENT.md`. A visual decision records the fixture and layer/sequence context; camera orbit remains an inspection control. These mechanics do not edit canonical product assets.

Camera movement, a ghost placement, a displayed quote, an animated duty track, an evidence stack or a locally saved visual decision does not execute its analogous business workflow. The gallery does not reserve locations, move canonical inventory, accept rates, verify policies, record physical scans, approve operational dispatch, issue invoices or payments, or integrate into products. Capture/rendering progress and observed prototype interactions must be recorded independently of Pranay's pending creative decisions.

The exact values visible in a scene describe that authored synthetic fixture. The manifest's example scenario inputs are separately labeled where they differ. Numerical encoding must be judged against the fixture actually drawn. Preserve this distinction when deciding whether the visual hypothesis answers the case's question.

## Acceptance for every case

1. **Purpose:** The selected case ID, user question, and expected decision are obvious from its visual and caption.
2. **Distinctness:** Its scene demonstrates its own question, encoding, data, and composition. A different title over an unchanged generic scene is insufficient.
3. **Dimensional truth:** Declared dimensions, units, orientation, bounds, totals, and scale mapping agree with the fixture. Display transformations are labeled.
4. **Hierarchy:** The primary object and important quantity dominate; supporting labels attach clearly and remain legible.
5. **State truth:** Planned, proposed, reserved, verified, simulated, stale, missing, and actual states are distinguishable where relevant.
6. **Evidence:** Synthetic fixtures are visibly labeled. Source/time/provenance are available. No visual asserts a stronger legal, physical, financial, or operational conclusion than its inputs.
7. **Interaction:** For interactive studies, selection, camera, time, comparison, and inspection work as described; static studies label those interactions as proposed.
8. **Accessibility:** Meaning survives color changes and reduced motion. A text/table equivalent exposes exact source values. Focus and touch behavior must be evaluated before any eventual product use.
9. **Reviewability:** A per-ID route and PNG exist for the same visual revision; omitted or failed captures remain visible as gaps.
10. **Approval:** Status remains pending until a human decision is explicitly recorded for that ID and revision.

Review all retained cases before integration choices. The gallery may use family grouping and filters, but every case needs a direct route and individual decision surface. Show progress honestly: documented, visual prepared, visually inspected, interactive checks completed, human reviewed, human approved. These are separate milestones.

## Alternatives and open questions

Three backends remain eligible: projected SVG for crisp inspectable geometry and portable reports; real 3D orthographic rendering for lighting, depth, and larger composed scenes; perspective inspection for detailed assemblies or route immersion. A hybrid may share semantic scene records while choosing the renderer per case. This brief selects no backend for production.

Exact physical scale can conflict with label readability, especially when comparing a full yard and one barcode. Resolve this through explicit level of detail and linked close-ups rather than quietly enlarging physical cargo. Financial and trust scenes require their own declared semantic scales rather than pretending to be measured facility geometry.

Empirical unknowns include case usefulness, label density, mobile interaction, scene performance, visual parity across backends, and operator comprehension. The immediate falsifier is a case whose scene hides the exact answer or creates a misleading relationship compared with its labeled source values. Preserve that result as a revision/defer decision rather than treating visual polish as acceptance.

## Handoff and recovery

Complete documentation and canonical inventory before producing the visuals. Preserve this brief, module contracts, case records, earlier visual revisions, source fixtures, and capture results. Revisit this document when user direction, canonical contracts, scene scale, source integration, or approval scope changes.

The next authorized work unit is isolated per-case scene preparation and visual review under the current chat's scope. Any later product integration plan must name approved case IDs, exact target files, canonical adapters, preservation checks, runtime/test evidence, and migration boundaries. No such integration is selected by this brief.
