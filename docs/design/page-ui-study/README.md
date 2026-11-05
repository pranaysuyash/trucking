# Trucking page UI study

Date: 22 October 2026. Status: visual proposal, pending Pranay's review. This folder owns one isolated page-composition study. It is not the application shell and has no connection to the shipment service.

Current refinement: information density, following Pranay's instruction to retain detail through clicks and defer overall styling and spatial/temporal canvas review. See [DENSITY_REFINEMENT.md](DENSITY_REFINEMENT.md). The first layout is preserved in `revisions/initial-layout.zip`; the active HTML and current captures show the density refinement.

## Review the visual first

- Board: `http://127.0.0.1:5192/board.html`
- Clickable pages: `http://127.0.0.1:5192/index.html#command`
- Saved board: `captures/nine-page-board.png`
- Each product has an individual `captures/<page>-desktop.png` and `captures/<page>-mobile.png`.

To serve it separately from the products:

```sh
python3 -m http.server 5192 --bind 127.0.0.1 --directory docs/design/page-ui-study
```

Inspect the listener before starting another instance. Do not stop or replace a product preview to serve this study. The server started for this task remains local to port 5192.

## Brief and ownership

Pranay asked to work on the UI and create a visual first showing how the pages should look. The scope here is visual exploration, an isolated mock-data prototype, browser review and documentation. Product implementation, behavior, source, saved shipments, Git state and external services remain outside this visual pass. No commits or pushes were made.

The current applications repeat headers, navigation and large connected-shipment panels. That leaves too little initial viewport for the actual loading, quoting or receiving task. This study proposes a coherent frame while keeping each specialist workspace distinct.

The existing spatial exploration at `docs/explorations/isometric-ui/` remains canonical for its 120-case inventory and review ledger. Its files and approval states were not changed. This page study does not approve any spatial case, replace that inventory, decide a production renderer or exclude spatial exploration from a product. Its diagrams explore composition and linked detail, including money, duty time and evidence relationships.

## Proposed visual language

| Element | Proposed treatment | Reason |
|---|---|---|
| Global navigation | Graphite left rail with one active product | Keep product identity consistent without nested suite headers |
| Work surface | Cool white and pale gray, thin dividers, 4 px corners | Support long reading sessions and distinguish selection without glow |
| Primary action | One task-specific cobalt action in the inspector | Put the action beside the evidence it depends on |
| Status | Explicit words plus restrained blue/amber/green | A color or check mark alone cannot explain current/stale/missing evidence |
| Shipment context | Compact route/identity strip | Preserve context without duplicating the product interface |
| Standalone mode | Same work area, shipment strip removed | Preserve independent product usefulness |
| Spatial canvas | Large schematic with linked inspector and exact companion values | Make relationships visible without replacing source quantities |
| Typography | System sans, tabular monospace for IDs and quantities | Keep labels practical and comparisons aligned |
| Mobile | Scrollable product navigation, stacked work areas, contained table/canvas scroll | Preserve access without forcing a desktop-wide page |

Palette: ink `#172536`, rail `#172330`, base `#f4f6f9`, white `#ffffff`, action `#1664e8`, warning `#a65c10`. These are proposed study tokens, not adopted production tokens.

## Page coverage

| Page route | Main composition | Important proposed interaction |
|---|---|---|
| `#command` | Shipment queue and a selected shipment's route/checklist | Filter/search, inspect a row, open receiving |
| `#cargo` | Open loading cutaway, identified-unit inspector, manifest table | Select a handling unit; switch spatial/top/side view |
| `#pricing` | Quote waterfall, exact line items and visible assumptions | Inspect terms beside the acceptance preview |
| `#hos` | Semantic duty/time scene, itinerary and driver assumptions | Review planning scope beside the decision |
| `#assets` | Catalog list, cutaway envelope and dimension inspector | Inspect the selected catalog record |
| `#telematics` | Corridor trace, assigned tractor and activity | Switch scenario driving/arrival preview |
| `#warehouse` | Inbound queue, rack/location canvas and receiving task | Select a unit or bay; inspect barcode/location context |
| `#yard` | Door/yard scene, arrival queue and selected door | Select a door and inspect its state |
| `#trust` | Carrier evidence relationships, source rows and policy inspector | Keep provenance, scope and freshness beside the review |

Operational preview dialogs describe the eventual action but do not execute it. Search and filter work on the study's illustrative queue. **Find details** now searches the read-only record index. Named links open actual study records with Details, Checks, History and Source views. **Decision history** now shows retained reference events and expandable payloads. Asset alternatives expose their own catalog specifications; their canvas remains the dry-van schematic with a visible scope notice. The prototype does not implement equipment-dependent canvas geometry, orbit controls, live calculations, scans or operational actions.

## Data and honesty boundary

The UI uses a mock `TRK-1042` shipment, two handling units totaling 2,750 lb, Chicago to Milwaukee, 95 loaded miles and the saved scenario quote components: $216.90 linehaul plus $70.97 fuel equals $287.87. The queue and its attention states are illustrative. They are not a live view of the previously completed shipment.

The duty times are illustration fixtures and not a regenerated legal audit. Spatial diagrams use projected SVG and explicitly schematic geometry. The cargo envelope and exact unit labels support layout review; the drawings are not validated packing output or a physical/engineering measurement. The enlarged cargo detail is labeled. Route geometry is schematic, not navigation. Monetary depth represents the labeled USD values; evidence scene distance does not encode proof strength. Mock barcodes are decorative, not valid scannable labels.

No insurance, authority, telemetry, compliance, receipt, booking or payment verification occurs here. Product policy and scenario labels remain visible in the proposed interface. No `fetch`, local storage, provider request or shipment write is present in `study.js`.

`fixture.js` is the generated, read-only snapshot for the detail views. `build-fixture.cjs` reads the saved scenario and pure seeded product modules, preserves source hashes, and regenerates it. It does not fetch live data, change product files or mutate the original shipment. `details.js` renders the disclosure layer; `density.css` changes spacing and disclosure without modifying the original stylesheet or canvas functions.

## Image generation and provenance

The built-in image-generation tool produced the initial Command Center art-direction image using two inspected local product captures as content references. It was copied into `assets/command-center-direction.png`; the original generated file was preserved. The exact prompt and reference paths are in `IMAGE_PROMPT.md`.

The generated image is a direction reference. It contains illustrative text/date inconsistencies and extra navigation affordances that should not be copied as operational requirements. The rendered HTML study uses 22 October 2026 with the correct Thursday label and defines the exact reviewable layout and interactions. This is not a pixel-fidelity clone claim.

## Browser evidence

Verification command:

```sh
PLAYWRIGHT_MODULE=/Users/pranay/Projects/pdf_editor/node_modules/playwright node docs/design/page-ui-study/verify.cjs
```

No browser or dependency was installed. The check uses the existing Playwright module and installed Google Chrome in isolated browser contexts.

`verification.json` records all nine desktop renders at 1440 × 1000, mobile captures at 390 × 844, no page-level horizontal overflow, shipment/standalone mode, navigation, filtering/search, unit selection, top/side projection, scenario arrival preview, and dialog/Escape behavior. No page errors were observed. These are Tier 4 browser observations with S1 sensitivity for the study interactions; they are not product integration or operator acceptance.

`density-verification.json` separately records the density checks: all nine detail entry points and four views, lossless full-record JSON against the fixture, visible unknown evidence, original/amended history payloads, reloadable record/tab/event links, related records and browser Back, record search, distinct queue identity, unknown-record handling, exact fuel formula/rounding, focus restoration, unchanged font/canvas dimensions between density modes, nine mobile drawers and no non-GET requests. Its final run passed after transient automatic approval-routing timeouts and correction of a related-record test label. These are verification history, not outstanding user gates.

`density-scope-check.json` records an exact match for the original canvas-function block and original stylesheet. `DENSITY_REFINEMENT.md` documents field coverage and remaining limits.

The initial mobile run caught intrinsic grid width expanding the horizontal navigation and was corrected. Visual review then caught a cropped chart base, overlapping annotations and viewport-resize capture artifacts. Chart/annotation framing was repaired; separate desktop and mobile pages now avoid the capture artifact. Earlier exploratory captures remain preserved where named separately.

Fresh current-application desktop baselines are `captures/current-command-desktop.png`, `current-cargo-desktop.png` and `current-warehouse-desktop.png`, at the same 1440 × 1000 viewport. Compare these with the proposed captures as layout studies, not an in-place before/after product release. Other pages are grounded in the current product source and the prior shipment-flow captures.

Source preservation was checked against the prior checkpoint's SHA-256 source manifest. `source-preservation.json` records whether any of those product/source files drifted. Correctness review covered fixture sums and labels; architecture review confirmed isolation and independent mode; rule review confirmed scenario labeling, preserved prior work and the no-Git boundary.

## Adoption boundary

Creative review remains pending. A rendered image or passing browser check does not approve this direction. The next decision is whether this page hierarchy, palette, density and spatial/inspector arrangement are useful, and which details should be revised. Review each product's composition at full size, particularly the financial, duty and evidence scenes.

After visual direction is selected, a later implementation can reuse the real product engines and shared shipment client. It should consolidate the repeated shell, migrate the large connected-workspace panel into compact context plus a decision/history surface, preserve standalone operation, retain all dispatch/receipt/evidence guards, and validate the actual integrated flow again. This study does not silently perform that migration.
