# Local shipment flow

Status: implemented local scenario, 22 October 2026. This is a single-operator loopback workflow, not a production TMS, authenticated multi-tenant service, carrier booking, payment system, or evidence of a physical delivery.

## Purpose and scope

Keep all nine applications independently usable, while carrying one shipment through product-owned engines, dispatch prerequisites, simulated movement, manual receiving evidence and a reconciled invoice draft.

The supported connected slice is ambient general freight, one origin and destination, a declared fully rested solo driver, catalog equipment, a seeded carrier roster and USD scenario costing. Cold-chain qualification, hazmat, split-sleeper pairing, historical ELD data, real insurer/provider data and multi-stop execution are outside this slice. Standalone tools may expose additional exploratory capabilities; their existence does not extend the connected slice's guarantees.

The duty plan starts at the declared pickup origin after the declared full rest and models the loaded route. Quote deadhead miles are a cost allowance; they are not evidence of the driver's preceding duty history. Operational dispatch must eventually reconcile the entire actual duty timeline, approach travel, loading time, appointments and remaining clocks.

User authority: fix critical issues, connect one complete shipment flow, document and verify; no commits or pushes. Existing staged/unstaged/untracked work was preserved. No deployment, provider purchase, external message or real freight transaction was performed.

## Start locally

Use two terminals at `/Users/pranay/Projects/trucking`:

```sh
npm run dev:flow
```

```sh
npm run dev:all
```

Open `http://127.0.0.1:5170/`. The all-products launcher binds only to loopback and requires the configured ports to be free. It does not kill an existing listener or silently move a product to another port.

| Product | Local port |
|---|---:|
| Command Center | 5170 |
| Optional shipment service | 5171 |
| Cargo Fit | 5173 |
| Freight Pricing | 5174 |
| HOS Planner | 5175 |
| Asset Studio | 5176 |
| Fleet Telematics | 5177 |
| Warehouse Space & Flow | 5178 |
| Yard & Dock | 5179 |
| Carrier Trust | 5180 |

Each existing product can still run/build from its own directory. For a single local preview:

```sh
npm run dev -- --host 127.0.0.1 --strictPort
```

No shipment service is needed for standalone use. Selecting a shipment adds a persistent identity/route/revision strip; planning details start collapsed outside the portal, including when a shipment ID is present. A failed shared-service request does not prevent the native application from rendering. Hosted/static deployments leave the local scenario connection disabled. **Use standalone tools** detaches the retained native draft explicitly, without changing the saved shipment.

The existing local dependency symlinks remain in place. Product build checks establish buildability in this installed workspace; they do not establish a clean independent dependency installation on another machine.

## Walk one shipment through the products

1. In Command Center's **Connected shipment workspace**, enter a reference and choose **Create local shipment**. Creation is an explicit action; opening a page does not create a shipment.
2. Use the persistent **Command Center → Asset Studio → Cargo Fit → Freight Pricing** links. They retain the shipment UUID across actual product origins. **Planning status and shipment actions** exposes all seven prerequisites; **All products and shipment context** exposes the complete product navigation and saved shipment selection. Native what-if edits stay local until the product's explicit publish/accept action. Viewing a product does not satisfy a prerequisite.
3. In P04, select the actual native vehicle and choose **Publish reviewed equipment**. The atomic action saves the selected identity and exact declared catalog/custom specification, including interior, door, payload, fuel and source. An unresolved or malformed identity stays unresolved; it never falls back to a different vehicle. Changing equipment invalidates loading, receiving, dock and pricing. The package/axle/fleet simulators remain independent studies.
4. In P01, edit the native cargo draft, inspect the selected arrangement and choose **Publish reviewed loading plan**. The existing solver and independent validator must place every original handling unit. Publication atomically commits the reviewed cargo edits and that exact selected/manual arrangement. IDs and original barcodes survive even when descriptions repeat. Connected publication supports existing identified units, upright rotation and one destination; broader native import/edit capabilities remain usable independently.
5. In P06's native 2D planner, review the connected manifest, facility and proposed locations, then choose **Publish reviewed receiving plan**. This saves the exact reviewed result, declared facility/physical constraints, original identities, current loading-plan timestamp and reservation snapshot. The planner and publication validate aggregate bay capacity and charge unknown committed mass at the slot rating. The server rechecks the shared reservation snapshot inside its serialized commit, even if new reservations occupy different positions in the same bay. Refresh resources, re-solve and review after a conflict. The independent 3D study remains separate and switching views retains the working 2D draft.
6. In P07, choose the actual **Shipment dock door** and **Publish reviewed dock allocation** for the assigned trailer. The saved door and reservation snapshots bind to the current receiving plan; unavailable or incompatible doors block publication. Gate, yard and hostler simulations remain independently usable.
7. In P08, select an explicit roster carrier, inspect the timestamped policy outcome, and choose **Publish reviewed carrier policy**. The exact reviewed profile, policy, audit and 15-minute scenario observation expiry are retained. Blocked outcomes can be saved but cannot satisfy dispatch. All blocker/warning reasons remain in the detailed record; the summary stays bounded. Unknown or malformed observations remain unresolved. Use **Refresh scenario evidence** to create a fresh local review when needed. A carrier change requires pricing review. This is seeded evidence, without a live authority, insurer or fraud lookup.
8. In P03, review the native speed, full-rest declaration and solo itinerary, then **Publish reviewed duty plan**. The exact native inputs, itinerary and audit are saved. A changed route/rest declaration belongs to the canonical manifest; unsupported team/split-sleeper publication remains a local exploration. Invalid speed/clocks stop before planner iteration. **View / Print Duty Planning Report** opens a frozen modeled report with actual declared identities and computed status durations, without inventing a live ELD, signature, appointment or calendar schedule.
9. In P02, inspect or edit the native diesel, operating-ratio, profile and accessorial assumptions, then choose **Accept reviewed scenario estimate**. The existing quote/fuel engines produce the preview and accepted terms from the same inputs. A current complete fit is required, and its observation timestamp is retained with the quote. Amounts reconcile in integer cents with explicit fractional-cent allocation. Saved native assumptions reopen when valid. The optional vehicle HUD remains available through **Show Spatial 3D HUD** and loads separately from the pricing form. **Draft Freight Estimate** opens a printable, qualified estimate; undeclared broker/carrier/appointment details remain undeclared.
10. Return to the portal. **Approve scenario dispatch** is available only when all seven current planning decisions pass, carrier evidence has not expired and no open exception remains.
11. In P05's shipment movement task, choose **Record scenario departure**, then **Record scenario arrival**. The assigned tractor and ordered explicit events are retained. **Report shipment exception** requires an operator-entered reason. The animated CAN/GPS/cold-chain/DTC demonstration remains separately labeled and independently usable; its animation does not publish movement.
12. In P06's receiving task, enter **Receiver name**, each **Handling unit N barcode** and **Handling unit N location**, then **Confirm manual scenario receipt**. Visible discrepancies guide correction before submission. The service independently rejects wrong, missing, duplicate or mismatched original identities/locations. An accepted receipt is projected from the saved record. This is manually entered scenario evidence, not a physical scan receipt.
13. Resolve any open exception in the portal with a recovery note. Invoice readiness remains blocked while an exception is open.
14. In the portal, inspect **Receipt and invoice readiness**, its accepted line items, unit/barcode/location reconciliation and source events. Choose **Prepare reconciled invoice** after complete delivery and exception resolution. The service revalidates current accepted terms and exact integer-cent reconciliation. **Inspect receipt evidence**, **Inspect invoice record** and **Export invoice evidence JSON** retain separate access to the exact artifacts. Export produces an actual local download; no invoice is sent and no payment is issued.

The portal's earlier preset tour remains available as a standalone demonstration. With a connected shipment it is under **Independent preset lifecycle simulator**. Its viewed-tool state and sample ticker are not the shared shipment's dispatch or execution authority.

Use **Shipment details**, a named stage, a handling-unit button or a history event to open the live record inspector. **Details / Checks / History / Source** expose structured fields, exact retained payloads and complete selected-record JSON. The URL retains the shipment, record and selected section. Browser Back restores related record context; Escape closes the modal and returns focus. Missing record IDs show an explicit missing state. Wide tables scroll within their labeled region on mobile.

## Overview, spatial plan and timeline

In Command Center, expand **Shipment overview, spatial plan and timeline**. This is a read-only projection of the selected canonical shipment. **Overview** provides labeled decision relationships, all seven native tasks, freshness, execution and exceptions, with a structured dependency list beside the diagram. **Spatial** uses equal-scale millimetre geometry from a supported accepted native plan, original manifest-order unit numbers, searchable exact unit/barcode data, and planned receiving identifiers. Overlap, missing dimensions, unsupported legacy units or stale results prevent drawing an asserted arrangement. Receiving slots remain categorical without measured facility geometry or a live position.

**Timeline** searches/filters the retained ordered events and opens each exact payload. **Replay manifest here** reconstructs only complete retained input events and narrow amendments; missing history remains unknown. Replay is separate from today's units, arrangements, receipt and finance. Event timestamps are UTC, while vertical spacing indicates order rather than elapsed duration. The saved duty itinerary is shown separately as relative modeled offsets, never an ETA or observed trip. Every visual keeps a structured table/list and canonical inspector path. Wider spatial studies remain available under `docs/explorations/isometric-ui` with their individual decisions preserved.

## Amendments and recovery

Before dispatch, the portal can amend the route, mileage and first handling unit's weight. This generic manifest amendment increments the input revision and makes every existing prerequisite stale. Upstream result replacement also invalidates dependent packing, receiving, dock and quote decisions.

Cargo Fit has narrower authority: `cargo.amend` changes existing units; `cargo.publish` atomically changes those units and records the reviewed loading result. IDs/barcodes cannot be invented or replaced through this command. A unit-input change increments the input revision. Only an already-current observation of unchanged equipment can be carried forward, retaining its original timestamp with `reusedFromInputRevision` and `reusedAt` attribution. An already-stale asset result is never promoted. Quote, receiving and other earlier decisions still require review. Invalid loading publication leaves the original manifest, revision and history intact.

After dispatch, the planning editor refuses amendments. Execution changes require a separate, explicitly designed amendment/replanning flow; the current implementation does not silently rewrite an executing shipment.

Every successful command increments the record revision and appends its product, timestamp, input revision, human-readable note and command evidence payload. Creation preserves the original input; amendments and evaluations preserve their exact payloads. Earlier development scenarios created before full payload retention may contain summary-only historical events. Do not invent missing evidence for those records.

Writes use optimistic revision checks and stable operation IDs. A stale writer receives 409. Retrying the same operation does not append another event. Reusing an operation ID for different content is rejected. The UI offers a retry of an uncertain pending command using the same operation ID; review refreshed state before dismissing it and starting a different action.

Native publication uses the record revision the operator reviewed. Incoming changes preserve a dirty native draft in all integrated products and disable acceptance until **Load current shared inputs** explicitly replaces it. Loading a saved Cargo arrangement clears prior manual placements and selection, including when the cargo input hash is unchanged. Delayed polling cannot roll back a newer committed snapshot or replace a different selected shipment. Offline snapshots are labeled; shared saves are disabled while native editing/detaching remains available. A save acknowledges the value captured at submission, so edits made while its response is pending remain dirty. An older response cannot clear a newer incoming revision; explicit shared-input recovery remains available.

Older records remain inspectable without invented native inputs. A prior fit/quote that did not store a full native scenario, arrangement or pricing profile cannot establish those missing fields. Its exact retained historical payload remains available. Completed shipments show locked planning and saved evidence, without asking the operator to republish an impossible prerequisite.

The service persists before acknowledging success. A failed write leaves the prior committed in-memory/store state intact. A missing service yields a visible unavailable state, while standalone tools remain accessible.

## Canonical sources and standalone distribution

- Product manifests own product identity, routes and illustrative tier metadata.
- `scripts/sync-suite.mjs` validates unique IDs/ports and generates local registries and the optional workspace client into each product's `src/suite/`.
- `packages/shipment-flow/src/` owns the canonical workspace/session/record-inspector UI, types, hook templates and domain transition logic. UI templates deliberately import the product-local adapter after generation. The generator distributes 14 canonical client files, including the inspector, finance reconciliation, canvas/view-model and geometry helper; it remains the sole client distribution route. All nine Apps consume the same optional session through their common wrapper. Native editable values remain product-owned. The shared draft helper coordinates reviewed provenance and recovery; compatible legacy translation helpers are retained where independently useful.
- Each product's `src/engine/shipmentAdapter.ts` owns translation into its existing native engine. P01 and P06 share their translation helpers with their native views.
- `packages/shipment-flow/server.mjs` owns shared persistence, revision/operation checks, reservations and HTTP behavior.
- Existing browser event-bus modules remain for local/preset compatibility. The connected shipment workflow does not rely on BroadcastChannel crossing origins.

After editing a canonical template or manifest:

```sh
npm run sync:suite
npm run check:suite
```

Generated copies are distribution artifacts, not alternative editable authorities. They make product builds independent of runtime sibling-source imports. Do not edit them directly or introduce a second registry.

## Storage and trust boundary

The local store is `.local/shipment-flow/store.json`, excluded by the root ignore rules. Directories are created with mode 700 and the atomic replacement files with mode 600. Server-side operations are serialized, validate expected revisions, write a new file and rename it before acknowledging. No delete/reset endpoint exists.

Origin doors are released after scenario departure. Warehouse positions remain held after delivery, because receiving does not mean stock has left the warehouse. A complete outbound/release/stock-movement workflow is future work. Do not clear the store to make a capacity conflict disappear.

An unreadable or incompatible store prevents startup instead of silently replacing history. Preserve the exact file and error before a recovery or migration decision. Do not delete `.local/`, application profiles or saved scenarios as routine troubleshooting.

This service binds to `127.0.0.1:5171`, permits only the known loopback product origins for writes, checks the Host header, requires JSON and caps request bodies at 64 KiB. It has no real user/tenant authentication: a source-product field establishes local workflow ownership, not an authenticated security principal. Product-supplied result shapes and sequencing are checked; this is not a tamper-resistant independent calculation service. Use synthetic/redacted data only. Production use requires authentication, tenancy, authenticated result ingestion/recomputation, a production data store, operational backup/recovery, source evidence, deployment and separate release verification.

## Verification

```sh
npm run check:suite
npm run typecheck:all
npm run test:all
npm run build:all
```

`test:all` now executes each package's declared test script, including the Node HTTP/domain tests. `build:all` executes each product's declared build script, including its typecheck. The old root build runner only invoked Vite and could miss TypeScript errors.

The browser checks use an already installed Playwright module and Google Chrome. No browser is downloaded:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/installed/playwright node tools/verify-shipment-flow.cjs
PLAYWRIGHT_MODULE=/absolute/path/to/installed/playwright node scripts/verify-shipment-ui.cjs
PLAYWRIGHT_MODULE=/absolute/path/to/installed/playwright node scripts/verify-shipment-ui.cjs --visual-only
PLAYWRIGHT_MODULE=/absolute/path/to/installed/playwright node scripts/verify-cargo-draft-recovery.cjs
node scripts/verify-shipment-invariants.mjs
```

With the optional service stopped, and the product previews still running:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/installed/playwright node tools/verify-standalone-offline.cjs
```

The installed module used for this checkpoint was `/Users/pranay/Projects/pdf_editor/node_modules/playwright`; Chrome was `/Applications/Google Chrome.app`. These are verification prerequisites on this workstation, not new product dependencies.

The earlier critical-repair checkpoint is preserved under `docs/audits/visual-evidence/2026-10-22-shipment-flow/`:

- `browser-flow-receipt.json`: current browser-verified shipment ID, revisions, checks and amount.
- `standalone-offline-receipt.json`: all nine native applications rendering with the optional service stopped, plus Cargo Fit sample entry.
- `restart-receipt.json`: an already-completed shipment retained across service restart.
- `invoice-export-receipt.json` and `invoice-evidence-export.json`: an actual browser download matched to the shipment ID, amount, revision and retained original/amended manifest.
- `critical-regression-receipt.json`: six independent before/fixed engine boundary checks, S2.
- `mutation-receipt.json`: deliberate stale-write and dispatch-gate mutations detected by the domain tests, S3 for those invariants.
- `final-flow-test-receipt.json` and `final-flow-test-output.txt`: the final 11 domain/API tests, including the historical receiving retry guard, with source hashes.
- `retry-regression-receipt.json`: removing that guard in an isolated temporary copy makes its regression fail, S2.
- `verification-commands.json` and `verification-output.txt`: commands, exit codes and full output.
- `before-*`, `after-*`, connected-stage and invoice screenshots: actual local browser captures. Mobile checking here covers the shared workspace, not every native tool interaction.

The subsequent task review and native UI integration are documented in [SHIPMENT_UI_TASK_REVIEW_2026-10-22.md](../audits/SHIPMENT_UI_TASK_REVIEW_2026-10-22.md). Current evidence is under `docs/audits/visual-evidence/2026-10-22-shipment-ui/`: `browser-verification.json`, `visual-verification.json`, `invariant-verification.json`, the exact reviewed estimate PDF, comparable before/after captures, full test/build logs, source/index preservation receipts and timestamped Cargo recovery checks. `tools/verify-shipment-flow.cjs` now writes a fresh timestamped folder under `full-flow-regression/` instead of overwriting the earlier checkpoint. The complete nine-product regression reached invoice readiness with the exact accepted USD 287.87 quote and original received identities. These browser scripts create synthetic scenario records and intentionally retain them; do not reset the store after verification.

The recovery harness accepts `--baseline` only to label a deliberate pre-fix run; it does not modify source or reintroduce the defect. The invariant harness evaluates isolated module mutations in memory and leaves live source unchanged. See the audit for sensitivity boundaries and exact receipts.

Evidence boundaries: Tier 2 engine checks; Tier 3 local API and browser integration; Tier 4 browser rendering and interaction. No physical load, regulatory certification, actual driver history, live provider, insurer, customer, trading partner or production receipt is established.

## Remaining work

Extend the selected operating context deliberately: supported HOS histories and split-sleeper rules, real equipment/scale/restraint evidence, facility inventory and aggregate capacity, appointment scheduling, actual scans/POD, live carrier/telematics data and production auth/persistence. The optional workspace is not a complete replacement for a WMS, ELD, TMS, identity provider or accounting system. Existing tandem/hazmat engines and the native dynamic rate-card editor still need a separate review/integration beyond their use or availability in this bounded slice.

No commits or pushes were made. Preview/service processes started by the task may be stopped with Ctrl+C in their owning terminals; inspect listeners before starting a second instance. Existing unrelated processes must be preserved.
