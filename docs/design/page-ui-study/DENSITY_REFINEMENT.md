# Information-density refinement

Date: 22 October 2026. Status: implemented in the isolated visual study; human review pending. Owner: Pranay for design decisions. The first layout is preserved in `revisions/initial-layout.zip` with a SHA record.

## User instruction and boundary

Pranay selected information density and asked that details remain available, including through clicks. Overall visual direction and spatial/temporal canvases are explicitly deferred. The later instruction to retry continued the same task.

The scope is the existing read-only page study. No product application, shared shipment service, source engine, saved shipment, Git index, branch, commit or external provider was changed. The spatial exploration's case inventory and creative decisions remain separate and preserved.

## Disclosure pattern

| Level | Visible information | Access |
|---|---|---|
| Scan | Identity, route/context, essential facts, current study state, evidence limits and task action | Compact rows and the existing inspector |
| Inspect | Full selected-record identity, dimensions, terms, assignments and other fields | Named record links, not a generic More button |
| Explain | Checks and constraints with explicit unknowns, supporting record links | Checks tab and inline check links |
| Trace | Original and amended input, product event, exact payload and source | History and Source tabs |

Compact mode reduces padding, repeated explanations and duplicate facts while preserving the existing text sizes and canvas dimensions. Comfortable mode remains available as an in-memory spacing toggle. Longer explanations and additional facts use labeled disclosure controls. Known evidence limits remain visible outside the disclosures.

The right-side detail drawer retains the page underneath, selected record identity, check/field/event counts and shipment context. Closing it restores focus to the opening control. Tabs support keyboard arrows, Home and End; Escape closes the native dialog. On mobile it becomes a full-width drawer with internal scrolling.

Record, tab and expanded event have direct URLs and survive reload. Related records can be traversed inside the drawer; browser Back returns to the previous record. Underlying page selection/filter state is preserved during the open/close interaction, but is not persisted across a complete reload. Later integration should extend the existing application's URL/state contract rather than introduce a second store.

## Detail coverage

| Page | First-view change | Available drill-down |
|---|---|---|
| Command Center | Tighter queue rows; separate duty and quote access; named shipment link | Original identity, route, assignments, both units, planning references, full 23-event reference history, original export |
| Cargo Fit | Manifest record links; compact inspector; visible scale/securement limit | Original IDs/barcodes, dimensions, volume, mass, stacking, orientation, receiving assignment, model result, placements/checks and history |
| Freight Pricing | Exact line items remain visible and clickable | Full profile, operating cost/target ratio, linehaul breakdown, fuel formula/rounding, accessorial inputs, separate broker-margin policy and native quote |
| HOS | Compact driver facts; full-rest/missing-history limit stays visible | Declared rest/driver, route, every reference waypoint/violation, supported scope and unavailable prior-duty/approach/ELD evidence |
| Asset Studio | Selected-catalog summaries align with the detailed record | Complete selected vehicle identity, exterior/interior, weight, volume, powertrain, fuel/energy and regulatory template fields |
| Telematics | Key identity/source facts stay visible | Tractor/driver, simulated values, absent live freshness, ordered movement scope and saved activity |
| Warehouse | Unit/location links; receipt/source-warning limit stays visible | Original unit/barcode, assigned slot, recommendation reasons/alternatives/warnings, slot dimensions/mass/environment/state and facility metadata |
| Yard | Selected-door record and source link | Study versus separately labeled seeded occupancy, full door fields, trailer/appointment/hostler reference records, seal/capacity limits |
| Carrier Trust | Named evidence links and persistent live-source limit | Seeded identity, all three policies, dates/numbers/limits, BASIC metrics, fraud indicators, customer-policy scope, freshness and history |

The record index searches available titles and raw content, including original barcodes and all 101 seeded facility locations. Unknown records and unmatched schematic locations are explicitly unavailable. Additional illustrative queue rows retain their own identity and missing-evidence state rather than borrowing TRK-1042's evidence.

Nested arrays use expandable field groups, including waypoints, placements, alternatives and warnings. Source also retains the complete raw record and provenance. Full-record JSON was compared with the fixture for each of the nine primary entry points.

## Data semantics

`fixture.js` is generated by `build-fixture.cjs` from the saved shipment export and seeded native templates. It contains the original reference, four relevant vehicle specifications, the selected seeded carrier, 101 facility slots, facility metadata, seeded yard records and a native quote calculation under the saved assumptions. The builder reads pure modules with the installed TypeScript compiler, installs no dependency and performs no network/provider operation.

The study's preview state is independent of the completed reference. History labels that distinction and does not pretend the preview executed those events. Native source warnings and the zero-margin policy output are retained rather than filtered away to make the summary look favorable.

Fuel detail preserves the source rounding: `(6.276 − 1.20)` rounds to a delta of `5.08`; `95 × (5.08 / 6.8)` rounds to USD `70.97`. Linehaul USD `216.90` plus fuel USD `70.97` and zero accessorials reconciles to USD `287.87`.

Equipment summaries now match the selected native catalog. The base dry-van schematic remains an illustration; selecting another record does not imply its geometry has been rendered. Existing canvas drawings, projection definitions and temporal scenes were not redesigned.

This covers the current study fixture, not every production workflow or spatial exploration case. Before adoption, map the design to the full existing feature/field inventory and preserve supported operations, validation, identity, provenance and standalone contracts.

## Verification and preservation

```sh
node --check docs/design/page-ui-study/details.js
node --check docs/design/page-ui-study/study.js
PLAYWRIGHT_MODULE=/Users/pranay/Projects/pdf_editor/node_modules/playwright node docs/design/page-ui-study/verify-density.cjs
PLAYWRIGHT_MODULE=/Users/pranay/Projects/pdf_editor/node_modules/playwright node docs/design/page-ui-study/verify.cjs
```

The focused browser run passed all nine primary records and nine mobile drawers with no page errors or operational requests. It checked Details/Checks/History/Source, JSON retention, unknown data, amendment payloads, reload, nested navigation/Back, search, fuel math, keyboard close, focus restoration and mobile overflow. These are Tier 4 observations with S1 sensitivity for the study, not operator acceptance or product integration.

The broader check refreshes page captures and retains standalone navigation, selection and projection checks; use `verification.json` for its latest completed outcome. Earlier layout/captures and the generated direction remain in the initial revision archive.

`density-scope-check.json` verifies unchanged canvas-function source and original stylesheet. `source-preservation.json` checks the prior product checkpoint against its SHA manifest. Correctness review covered identity, sums, unknown evidence and history; architecture review covered the read-only fixture and reusable drawer; instruction review covered deferred styling/canvases, preservation and no Git/external mutations.

Remaining review: density/discoverability with Pranay, full production field/feature mapping before adoption, assistive-technology review beyond the tested keyboard paths, and underlying page context across complete reloads. Overall styling and spatial/temporal canvas review remain deferred.
