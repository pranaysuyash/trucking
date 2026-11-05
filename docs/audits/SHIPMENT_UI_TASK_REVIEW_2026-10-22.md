# Shipment task review and page structure

Date: 22 October 2026. Status: baseline review preserved; bounded local implementation and regression verification completed in the appended disposition. Canonical owner: this review record for the Command Center → Cargo Fit → Pricing task review. Product decisions: Pranay. Implementation and verification owner: parent shipment UI task.

This report preserves the review before implementation. Findings retain their original open-at-review status; the appended disposition records subsequent fixes and their evidence. Revisit when the connected input/draft/accepted-result contract or the page structure changes.

## Objective, scope and authority

The user authorized a shipment task review, overall page structure, then implementation of Command Center → Cargo Fit → Pricing. Details must remain accessible, each product must remain independently usable, and no commits or pushes are authorized. The review contribution inspected the three applications, canonical shipment UI/types/import hook, product adapters, native capability surfaces, current runbook and isolated density study. It first ran read-only; the parent subsequently authorized only creation of this report by this reviewer. No product code, services, Git state or external application was mutated by this contribution.

The user value is an understandable next action with inspectable supporting evidence. The operator value is continuity across product boundaries without accepting terms or plans different from those reviewed. Internal value is one canonical shared shipment contract and reusable disclosure behavior while retaining the native engines and tools.

Instruction basis: `/Users/pranay/AGENTS.md`, `/Users/pranay/Projects/AGENTS.md`, project and applicable product `AGENTS.md`, Operating Doctrine 8.2, and relevant Review 1.3, Architecture 1.1, Testing 1.1 and Documentation 1.1 doctrines. Existing generated context was read as derived context, not authority. Parent owns the wider exploration-map update and implementation sequencing.

## Evidence and provenance

Static findings are **Observed, Tier 1**. Consequences and design recommendations are **Inferred/Proposed**. No static source finding establishes actual accessibility, operator satisfaction or production readiness.

The baseline source is preserved in [before-source.zip](visual-evidence/2026-10-22-shipment-ui/before-source.zip), with the accompanying [before-source.json](visual-evidence/2026-10-22-shipment-ui/before-source.json). The archive contains 104 files and retains the original product-relative paths. Source line references below refer to the inspected baseline. Implementation may subsequently move those lines; use the preserved archive to recover the original evidence.

Browser provenance is the parent-produced [capture-before.cjs](visual-evidence/2026-10-22-shipment-ui/capture-before.cjs), [before-browser.json](visual-evidence/2026-10-22-shipment-ui/before-browser.json), timestamp `2026-10-22T16:54:04.470Z`, and [before-shipment.json](visual-evidence/2026-10-22-shipment-ui/before-shipment.json). The receipt is named `before-browser.json`, not `baseline-browser.json`.

The harness uses installed Playwright and Google Chrome, selects a saved local scenario with an asset result, opens the real three product origins, waits 2.2 seconds, measures `.shipment-workspace` height and document horizontal overflow, and captures 1440×1000 desktop and 390×844 mobile viewports. These are **Tier 4 local browser observations**, not a real operator study. The receipt has no regression sensitivity beyond baseline observation; S2 requires a post-change comparison against the demonstrated defect.

| Product | Desktop workspace height | Mobile workspace height | Desktop page overflow | Mobile page overflow | Page errors |
|---|---:|---:|---|---|---|
| Command Center | 920 px | 1,832 px | false | true | none recorded |
| Cargo Fit | 823 px | 1,735 px | false | true | none recorded |
| Pricing | 999 px | 2,070 px | false | true | none recorded |

Captures: [Command desktop](visual-evidence/2026-10-22-shipment-ui/before-command-desktop.png), [Command mobile](visual-evidence/2026-10-22-shipment-ui/before-command-mobile.png), [Cargo desktop](visual-evidence/2026-10-22-shipment-ui/before-cargo-desktop.png), [Cargo mobile](visual-evidence/2026-10-22-shipment-ui/before-cargo-mobile.png), [Pricing desktop](visual-evidence/2026-10-22-shipment-ui/before-pricing-desktop.png), [Pricing mobile](visual-evidence/2026-10-22-shipment-ui/before-pricing-mobile.png).

The measurements establish a large connected panel before the native tool and mobile horizontal overflow for these exact pages/scenario/viewports. They do not alone identify every overflow-producing element, establish task completion time, or prove behavior with assistive technology.

## Council contribution

This is a simulated expert review using canonical persona definitions, not interviews or real-user acceptance. No willingness-to-pay, satisfaction, preference or conversion result is asserted.

The parent freshly resolved `/Users/pranay/Downloads/Understanding_Personas_24sep` through the explicit current configuration pointer and valid index. Resolver fingerprint: `fc9aef4328a8fd8ab815786de4b83d82334c91fa57972a6e94d123f99f83b64a`. The reviewer read the complete current DOCX text for both assigned seats directly from the resolved canonical paths:

| Seat | Canonical definition | Applied inspection lens |
|---|---|---|
| PER-950374, Fleet Operations Manager | `/Users/pranay/Downloads/Understanding_Personas_24sep/01 Expanded Personas/01 Engineering & Architecture/PER-950374 - Fleet Operations Manager.docx` | Available and serviceable capacity, dispatch action, constraints, operational recovery and cost. A dashboard must lead to an operational decision rather than merely display telemetry or owned assets. |
| PER-0080, Accessibility for Spatial & Scientific Interfaces Specialist | `/Users/pranay/Downloads/Understanding_Personas_24sep/01 Expanded Personas/04 Visual, 3D & Creative/PER-0080 - Accessibility for Spatial & Scientific Interfaces Specialist.docx` | Structured information equivalent to spatial views, keyboard commands, selected entity versus focus, readable coordinates/dimensions, warnings beyond color, reduced motion and focus recovery. A summary alone is not an equivalent alternate operating path. |

The parent orchestrates the wider council, including PER-0395 architecture. This reviewer does not claim to have independently read that third seat's definition or to have performed its complete mandate. The older 21 October persona simulation is historical context, not a substitute for current definitions or evidence.

## First-principles task model

The objects are a shipment, its declared inputs, candidate plans/terms, accepted evidence tied to a revision, and the operator's local draft. The critical invariants are:

1. Identity survives every handoff: shipment UUID, input revision, handling-unit IDs/barcodes and selected equipment remain attributable.
2. What the operator accepts matches the reviewed preview. A hidden independent default calculation cannot become the accepted terms of an edited native quote.
3. Shared accepted state and local exploration have explicit ownership. Remote changes do not silently erase a local draft, and local edits do not silently mutate the shared shipment.
4. Stale, unavailable, rejected and missing evidence remain distinguishable. Navigation or viewing a tool is not operational completion.
5. Detail remains reachable in structured form, including constraints, exact terms, source and history. Density reduces repeated layout, not information fidelity.
6. Every product retains its native standalone workflow without the optional service or a Command Center session.

| Task | Immediate answer | Deep inspection | Success condition |
|---|---|---|---|
| Choose shipment | Which shipment, route, input revision and blocker? | Manifest, assignments, prior decisions and exact history | Open Cargo with the same identity and a clear purpose. |
| Review Cargo | Does the current declared load fit the selected equipment? | Units, dimensions, mass, orientations, stacking, placements, modeled checks and unknown physical evidence | Publish or inspect a current fit result while retaining all native tools. |
| Move to Pricing | Which load and fit revision are being priced? | Equipment/profile assumptions and relevant upstream evidence | Continue with the same shipment, rather than unintentionally starting a separate preset. |
| Review/accept Pricing | What is the exact proposed rate, and what drives it? | Linehaul, fuel rounding, accessorials, profile, OR, warnings and accepted-versus-draft comparison | Saved terms equal reviewed terms; earlier evidence remains retained. |
| Amend/recover | What changed and what must be reevaluated? | Original/amended payload, invalidated decisions and retained local draft | No silent overwrite, false current status or duplicate save. |
| Work independently | What can I do without a shared shipment/service? | Native imports, plans, calculations, versions and exports | Native functionality remains available with explicit local attribution. |

## Findings

### UI-01: Reviewed native quote and accepted shipment quote can diverge

**Priority P1. Observed, Tier 1. Status: open at review.** Pricing `src/ui/App.tsx:102-113` derives a quote from editable lane/profile/accessorial/OR state. `packages/shipment-flow/src/ShipmentWorkspace.tsx:42-46` independently evaluates the shared shipment and publishes that preview at `:130`. Pricing `src/engine/shipmentAdapter.ts:20-28` constructs its own profile and zero accessorial inputs. Changing native diesel, accessorials or OR therefore need not change the terms accepted by the connected action. The workspace's local-exploration note at `:120` discloses the boundary, but the two presentations still create a plausible acceptance error.

Proposed: one attributable reviewed/accepted snapshot. Publish the validated native draft through the canonical adapter, or clearly separate local exploration from shared evaluation and prevent an ambiguous acceptance. Acceptance check: modify a native input, inspect exact terms, accept, reload, and independently reconcile saved profile/line items/integer-cent total with the reviewed preview.

### UI-02: Pricing document claims authority and supplies undeclared operational facts

**Priority P1. Observed, Tier 1. Status: open at review.** Pricing `src/ui/App.tsx:495-496` offers an official agreement. `src/ui/RateConfirmationModal.tsx:76-77` claims standards conformance, `:103` supplies a fixed brokerage/MC/DOT, and `:116,121` supply fixed docks and pickup/delivery times. The separate copied text correctly says estimate only at `App.tsx:118-131`.

Proposed: preserve print/copy, use draft-estimate semantics, and retain missing or explicitly sample identity/schedule fields. A local-scenario acceptance is not a real freight contract. Acceptance check: every generated document matches its evidence and the same draft/accepted scope; no invented detail is presented as supplied or verified.

### UI-03: Command Center presents competing active-load contexts

**Priority P2. Observed, Tier 1. Status: open at review.** `command-center-portal/src/main.tsx:9` mounts workspace and App separately. The workspace uses a service shipment selected by UUID. `src/ui/App.tsx:35-38` separately loads the preset order/lifecycle, changes it at `:94-115`, displays preset dossier values at `:229-354`, and builds native iframe links from that preset at `:75,383-408`.

Proposed: the connected shipment is primary when selected. Preserve the preset tour through an explicitly labeled sample/demo entry. Acceptance check: identity and continuation agree across the visible dossier, navigation and target product, while the sample tour remains independently discoverable.

### UI-04: Connected panel precedes and crowds native work

**Priority P2. Observed, Tier 1 plus Tier 4 baseline measurement. Status: open at review.** The three entry points mount workspace before App. The workspace repeats identity, all product links and seven stage cards at `ShipmentWorkspace.tsx:118-130`, then the native application adds its own header and navigation. The baseline dimensions and overflow receipt above establish the visible cost for the sampled scenario.

Proposed: compact shipment strip, contextual next action and named access to planning status/details. Acceptance check: decisive context remains visible and full detail accessible, with materially smaller connected-panel height and no page-level mobile overflow in the same scenario/viewports. Do not claim success solely from reduced pixels.

### UI-05: Exact retained evidence is not inspectable throughout the real UI

**Priority P2. Observed, Tier 1. Status: open at review.** `packages/shipment-flow/src/types.ts:45-52` retains event payloads, but workspace `:147` renders only event type/product/time/note. Unit display at `:129` omits declared dimensions, stacking and temperature. Complete export at `:136-138` is available only after invoice preparation.

Proposed: Details/Checks/History/Source over actual shared/native data, with structured fields and optional raw JSON. Acceptance check: inspect original IDs/barcodes, every declared unit field, native result details, exact original/amended payload and provenance before invoice readiness. Do not copy the study fixture into production state.

### UI-06: Detaching leaves connected attribution in the native tool

**Priority P2. Observed, Tier 1. Status: open at review.** Workspace `select('')` clears workspace and URL at `:48-53`, while context dispatch at `:38-40` only emits non-null shipments. Pricing sets a connected-shipment banner at `App.tsx:103-108`, without a detach update. Cargo retains the imported scenario, which can be valuable local work but needs attribution.

Proposed: retain data as a visibly detached local copy. Acceptance check: after switching to standalone, local data remains, connection wording changes, and edits produce no shared writes.

### UI-07: Incoming shared revision can replace a local draft

**Priority P2. Observed, Tier 1. Status: open at review.** `useShipmentContext.ts:12-14` applies new input revisions or asset timestamps. Cargo `App.tsx:117-120` replaces scenario and navigates to cargo. Pricing `App.tsx:103-108` resets lane/profile/OR/accessorials. Cargo's unload warning at `:163-168` does not cover that incoming replacement.

Proposed: distinguish shared snapshot, imported baseline and local draft. Announce incoming relevant changes and retain the draft for review/reload recovery. Acceptance check: an amendment from another tab cannot silently erase an edited local proposal or make stale data look current.

### UI-08: Native Cargo-to-Pricing handoff drops shipment identity

**Priority P2. Observed, Tier 1. Status: open at review.** Cargo `VersionsStep.tsx:159-178` opens `buildFreightQuoteUrl(plan)` behind the existing illustrative license check. `quoteBridge.ts:45-58` passes plan summary parameters without shipment UUID/revision. The workspace link separately retains UUID at `ShipmentWorkspace.tsx:121-124`.

Proposed: a connected continuation preserving UUID/revision, alongside the existing standalone plan bridge and JSON fallback. Acceptance check: both modes are understandable and retain their supported behavior. Changing commercial entitlement policy is outside this UI correction and must not be done silently.

### UI-09: Existing pricing document dialog has incomplete focus behavior

**Priority P2. Observed, Tier 1. Status: open at review.** `RateConfirmationModal.tsx:19-26` handles Escape and `:38-43` declares a modal, but the component lacks initial focus placement, focus containment/background inertness and return-to-opener behavior.

Proposed: an appropriate native dialog or canonical dialog primitive, preserving print behavior. Acceptance check: keyboard entry, Tab/Shift+Tab containment, Escape, return focus and background interaction are correct for both document dialog and new detail drawer. Source inspection is not an assistive-technology pass.

## Proposed page structure

1. **Shared context strip:** product title; shipment or standalone mode; reference, route, input revision, saved/stale state, source freshness and named shipment-details access.
2. **Product-native navigation:** Cargo's five routes remain; Pricing keeps its native calculation surface; connected continuation is an explicit task action.
3. **Native working area:** decisive facts, current blockers and actual supported editing/inspection. Avoid embedding a whole second product workspace to simulate integration.
4. **Record drawer:** Details, Checks, History and Source over canonical live/local data, with named record links, related records, direct URLs and focus recovery. Raw JSON supplements structured fields.
5. **Contextual acceptance/action area:** what is saved, current revision, pending/error/retry state, accepted versus exploratory result and next product.
6. **Responsive linear path:** full-width mobile details, labeled internal table scroll and structured alternatives to the drawing. Status meaning must not rely on color or animation.

The isolated study's disclosure contract in [DENSITY_REFINEMENT.md](../design/page-ui-study/DENSITY_REFINEMENT.md) is salvageable interaction work. Its fixture, illustrative queue and selected catalog records are not a production feature inventory or shared data store. Original study, native engines, existing saved data and spatial exploration remain preserved.

## Feature-preservation inventory

| Product/surface | Valuable existing behavior to retain | Baseline source anchors |
|---|---|---|
| Command Center connected workflow | Create/select saved shipment, UUID/revisions, planning status, manifest amendment, dispatch blockers, exceptions, receiving/invoice evidence and stable retry | `packages/shipment-flow/src/ShipmentWorkspace.tsx:48-150`; [shipment runbook](../runbooks/SHIPMENT_FLOW.md) |
| Command Center sample workflow | Preset order selection, product tour/iframe, dossier, sample ticker, EDI/manifest exports | `command-center-portal/src/ui/App.tsx:34-124,159-425`; `src/engine/lifecycle.ts` |
| Cargo entry and imports | Landing/sample/blank/saved entry; CSV, Excel multi-sheet, EDI 204, append/replace and repair review; mixed units and unknown-value semantics | `product-01-cargo-fit/src/ui/App.tsx:243-249`; `CargoStep.tsx:38-100,117-123,137-223` |
| Cargo input and decision | Editable unit quantities/dimensions/mass/orientations/stacking/stops; equipment limits; comparison, reasons, what-if and baseline | `CargoStep.tsx:243-269`; `EquipmentStep.tsx`; `DecisionStep.tsx:64-198` |
| Cargo plan | Solver cancellation/staleness, alternate arrangements, selected-unit inspector, manual placement/numeric manipulation, barcode/dock operation, projection/visibility controls and reduced-motion sequence alternatives | `App.tsx:151-171,260-267`; `PlanStep.tsx:285-658,704-758` |
| Cargo linear equivalent | Searchable placement table with coordinates, dimensions, warnings and keyboard-selectable unit buttons | `PlanStep.tsx:665-699` |
| Cargo versions and delivery | Revision save/restore/compare, read-only plan import/revalidation/editable copy, CSV/JSON/HTML/interactive 3D/glTF/work-order/EDI/BOL exports and declared-field safeguards | `App.tsx:191-240`; `VersionsStep.tsx:55-99,122-237` |
| Cargo standalone bridge | Quote-in-Pricing plan handoff, entitlement gate and existing JSON fallback | `VersionsStep.tsx:159-178`; `engine/quoteBridge.ts` |
| Pricing inputs | Lane, loaded/deadhead miles, equipment, dated diesel benchmark, peg, loaded/empty MPG, all accessorial controls and target OR | `product-02-freight-pricing/src/ui/App.tsx:66-113,209-464` |
| Pricing evidence/output | Recommendation, breakeven/profit, precise waterfall, margin signals, source date, copy and printable estimate | `App.tsx:116-135,319-358,469-559`; `RateConfirmationModal.tsx` |
| Pricing optional visualization | Show/hide vehicle HUD, telemetry and cold-chain panel without requiring canvas use for calculation | `App.tsx:137,156-159,189-207`; `Realtime3DVehicle.tsx`; `TacticalHud.tsx`; `ColdChainTelematicsPanel.tsx` |
| Standalone resilience | Native application usable without local service, retaining existing imports, saved revisions and local calculations | Three `main.tsx` entry points; `ShipmentWorkspace.tsx:72,104-116`; runbook lines 42-50 |

Retain does not mean preserve misleading claims or defective focus behavior. Qualify the meaning and improve the implementation while preserving the useful operation and data. Do not delete apparently unused work without supersession/original-intent review.

## Research informing the structure

Primary sources were opened on 22 October 2026. These sources inform implementation patterns; they do not establish that this application conforms to a standard or that the proposed UX is accepted by real operators.

- [React: Sharing State Between Components](https://react.dev/learn/sharing-state-between-components) explains assigning an owner for each shared state and coordinating components through their common parent. Application inference: reviewed draft/result/action should share attributable state rather than calculate unrelated hidden terms. This does not require moving all product state into one global store.
- [W3C APG: Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) describes focus entering the dialog, contained Tab/Shift+Tab navigation, Escape, return focus and inert background. Application: verify these behaviors for details and document overlays; `aria-modal` alone does not implement them.
- [W3C APG: Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) describes a keyboard-operable show/hide control with an exposed expanded state. Application: use named disclosures for secondary facts while leaving decisive status and evidence limits visible.

## Acceptance and regression plan

The parent implementation must attach results to these tasks; this review does not record them as passed.

| ID | Acceptance task | Independent observable oracle |
|---|---|---|
| A01 | Create/select shipment; identify route, units, revision, prerequisite and next action | Visible identity matches service record; creation is explicit. |
| A02 | Command → Cargo → Pricing → back | Same UUID, input revision, equipment and original unit identities survive; no new shipment is silently created. |
| A03 | Cargo record drill-down | All declared unit fields, IDs/barcodes, placements, checks and source remain inspectable before invoice readiness. |
| A04 | Inspect original/amended history | Exact retained payloads and old decisions remain accessible, with stale state tied to the current input revision. |
| A05 | Edit native quote and accept | Reviewed versus saved profile, inputs, line items and cent total reconcile; no independent hidden default becomes accepted. |
| A06 | Amend shared cargo; reevaluate | Old fit/quote visibly stale; acceptance cannot masquerade as current until relevant prerequisites are reevaluated. |
| A07 | Receive remote amendment during local editing | Draft survives or an explicit recovery decision occurs; stale source is visibly distinguished. |
| A08 | Unavailable service and detach | Native tools still operate, retained copy is labeled local/stale and no shared save is falsely reported. |
| A09 | Error/conflict/uncertain retry | Visible failure, revision conflict and stable-operation retry do not create duplicate events or claim unsaved success. |
| A10 | Desktop/mobile comparison | Same 1440×1000 and 390×844 scenario; no page-level overflow; actions, IDs and details remain accessible; panel reduction does not hide decisive information. |
| A11 | Keyboard-only disclosure/dialog | Named opening control, visible focus, contained modal Tab/Shift+Tab, correct tabs/disclosures, Escape and return focus; browser Back recovers prior record context. |
| A12 | Native regression paths | Cargo import/repair, equipment/decision, manual/linear plan, versions/read-only/export and standalone quote bridge; Pricing inputs/waterfall/document/optional HUD remain available. |
| A13 | Print/copy estimate | Printed/copied terms match reviewed data and qualified draft/scope; undeclared operational facts stay undeclared. |
| A14 | Reload/direct URL | Selected shipment and record remain attributable; unavailable record/evidence does not fall back to an unrelated record. |

Use focused engine/contract tests for payload conversion and accepted result invariants, integration tests for revisions/idempotency, and actual browser tasks for presentation/navigation/focus. Defect closures should reach S2 against the saved baseline or a targeted failing check. Important load-bearing stale/identity invariants warrant S3 where practical. Existing earlier suite passes do not establish the changed UI behavior.

## Alternatives, decisions and exploration handoff

**Proposed:** extend the canonical shared UI templates and product adapters, distribute through the existing `scripts/sync-suite.mjs`, and retain native application ownership. The shared shipment service owns committed shipment history; each native tool owns its local draft and calculation; the UI explicitly connects them.

**Rejected for this slice:** replace native applications with study pages, copy the reference fixture into operational state, create another shipment store, infer completion from tool views, or embed the entire native product as the connected UI. These approaches risk lost capabilities, duplicate truth or competing active contexts. Reopen only with a documented migration and preservation inventory.

**Deferred with reason:** overall spatial/temporal canvas redesign, real provider/ELD/scale/insurance evidence, production tenancy/authentication and broader cold-chain/hazmat/multi-stop execution. They are distinct domains and evidence boundaries, not discarded features. Keep the existing spatial exploration and its history intact.

No new owner decision blocks the proposed UI slice. Changing commercial entitlement policy, widening the connected scenario or claiming a binding agreement requires separate discussion. The parent should update the existing exploration map with relationships from identity/draft/accepted evidence → page structure → deep inspection → connected browser tasks, and preserve these findings as the baseline rather than treating proposals as implemented truth.

## Completeness and remaining uncertainty

**Reviewed:** source and retained local browser baseline for the three entry points; native Apps; Cargo capability steps/quote bridge; pricing adapter/document; shared workspace/types/import hook; shipment runbook; density detail implementation; current canonical definitions for the assigned two council seats; three cited primary research sources.

**Not reviewed:** physical truck/loading conditions, actual driver history, live provider/insurer evidence, production deployment, every engine rule, real-user acceptance or complete assistive-technology/device coverage. The reviewer inspected the baseline receipt and harness; the parent ran the browser capture.

**Evidence tier achieved:** Tier 1 for source chains; parent-produced Tier 4 browser observations for measured baseline rendering. No implementation regression proof is claimed in this report.

**Known blind spots:** the screenshot/measurement scenario is bounded, desktop overflow absence does not prove every control is usable, and a modal/source audit does not replace screen-reader and task testing. Exact draft recovery, acceptance architecture and field coverage require verification against the eventual implementation.

**Next evidence:** parent attaches changed-source disposition, checks and actual connected task receipts, then performs correctness, architecture/preservation and instruction/evidence review. All work remains uncommitted. No staging, commits or pushes were made by this contribution.


## Implementation disposition, 22 October 2026

**GO for the bounded local UI integration.** Command Center, Cargo Fit and Pricing now share an attributable shipment session while retaining native draft ownership. The connected action records the exact reviewed native calculation. This disposition supersedes the baseline's implementation-pending status, not its observations or evidence. It is not a production release or real-user acceptance decision.

### Architecture and source ownership

The derivation is shipment identity and declared inputs → native local draft → reviewed calculation → explicit revision-checked publication → retained accepted evidence/history. Navigation, draft and accepted artifact have different owners. This prevents a second default calculator or a selected preset from quietly becoming operational truth.

| Concern | Canonical owner and implemented behavior |
|---|---|
| Shared transport and selection | `packages/shipment-flow/src/ShipmentSession.tsx` and `ShipmentWorkspace.tsx`; monotonic snapshot merge, reviewed record revision, stable-operation retry, visible failures/offline state and UUID-preserving links. |
| Committed shipment and transitions | Existing `domain.mjs` and service/store. New narrow `cargo.amend` / atomic `cargo.publish` reuse the same command pipeline and persistence. The server implementation and store format were retained. |
| Cargo draft and result | P01 native App/solver/validator own units, settings and the selected/manual arrangement. Adapter validates exact physical identity, full coverage, finite geometry and equipment compatibility. Saved native result/arrangement is revalidated on reopen. |
| Pricing draft and result | P02 native App/calculator own lane, profile, diesel, accessorials and target OR. Adapter serializes those exact reviewed terms, cent reconciliation, fuel provenance, margin warnings and current fit reference. Valid saved native assumptions reopen exactly. |
| Deep inspection | Canonical `ShipmentInspector.tsx` / `inspector.css`; actual selected shipment, unit, stage or event, all structured fields and raw JSON, related records, exact event payloads, direct URL and missing-record abstention. |
| Standalone distribution | Existing `scripts/sync-suite.mjs` distributes seven canonical client files to all nine products. Only the three target Apps adopt context wrapping; the six other products retain compatible event import. Generated files are not editable authorities. |

A narrow cargo amendment can retain an already-current observation of unchanged equipment, with its original timestamp and explicit reuse provenance. It cannot promote stale equipment or alter assignments, route, identity or barcodes. Unit edits increment input revision; prior receiving/quote and other affected decisions remain stale. Generic portal amendments remain conservative and stale all prerequisites. Failed cargo publication commits neither input changes nor a partial fit. Dispatch, warehouse reservations, receipt validation, exceptions and exact invoice reconciliation remain on the existing domain path.

Preservation inventory above was used before implementation. No native steps, imports/repair, saved revisions, manual/linear plans, export formats, quote bridge/fallback, pricing cost inputs or optional HUD were deleted. The portal preset lifecycle remains under an explicitly named independent simulator when connected. Illustrative commercial entitlement behavior was not changed. The old document's fabricated broker/MC/DOT, dock and appointment assertions were superseded by explicit undeclared fields and qualified draft-estimate semantics while retaining print/copy value.

### Finding closure and acceptance coverage

| Finding | Disposition and principal evidence |
|---|---|
| UI-01 | Closed for supported connected inputs. Native preview and acceptance use the same state/result. Pricing adapter tests, exact edited-diesel/OR/accessorial browser acceptance, cent total and reload assertions. |
| UI-02 | Closed in generated estimate. Qualified local draft, undeclared operational identity/schedule, all native accessorial items, actual print PDF. No contract/provider receipt claim. |
| UI-03 | Closed. Connected identity/next actions are primary; preserved preset simulator is explicitly separate and collapsed. Source and actual portal captures. |
| UI-04 | Closed for measured pages/viewports. Compact persistent context, secondary planning disclosure, reduced repeated navigation and no page-level mobile overflow. Before/after table below. |
| UI-05 | Closed for retained record data. Details/Checks/History/Source inspect live records, exact original barcode and event payloads before invoice readiness; direct URL, Back and unknown-record behavior verified. Missing legacy payloads are not fabricated. |
| UI-06 | Closed. Explicit detachment retains an editable local copy with updated attribution and no shared save claim. Browser service-loss/detach check. |
| UI-07 | Closed for inspected revision/recovery paths. Dirty native draft survives another writer. Explicit load replaces it. Same-input-hash Cargo overlay defect was reproduced and fixed separately, S2. |
| UI-08 | Closed. Connected continuation and existing native licensed bridge preserve shipment UUID; standalone plan/JSON fallback remains. Native bridge source inspection plus actual connected handoff. |
| UI-09 | Closed for tested keyboard behavior. Native dialog, initial focus, modal containment, Escape and return focus; actual detail and estimate browser checks. Complete assistive-technology acceptance remains unknown. |

A01-A11 and A13-A14 have focused browser/contract evidence in the receipts below. A12 has source preservation, 83 Cargo tests, 62 Pricing tests, standalone native input checks and optional renderer verification. Every individual pre-existing import/export format, camera device and manual manipulation was not separately replayed in the browser; do not elevate that coverage into exhaustive native acceptance. No known regression remains in the inspected supported slice.

### Measured UI and performance comparison

Same saved shipment `f2a004ea-b919-45ff-9494-5432628e4b72`, desktop 1440×1000 and mobile 390×844, Chrome, reduced-motion preference. Metric is the connected `.shipment-workspace` height before the native tool, not the whole application height or operator task time. Portal planning remains expanded; Cargo/Pricing secondary planning starts collapsed.

| Surface | Before desktop | Final desktop | Before mobile | Final mobile |
|---|---:|---:|---:|---:|
| Command Center | 920 px | 788 px | 1,832 px | 1,454 px |
| Cargo Fit | 823 px | 203 px | 1,735 px | 321 px |
| Pricing | 999 px | 203 px | 2,070 px | 353 px |

All three baseline mobile pages overflowed horizontally. Final document width equals viewport width for the three pages and three mobile inspectors. Wide native/record tables retain internal scrolling rather than clipping page content. The targeted fixes include Cargo's intrinsic grid minimum and tenant-bar wrapping in the canonical SuiteDock and the three existing local dock implementations. This is a targeted layout correction, not an unreviewed dock migration. Full field fidelity is independently checked through selected-record JSON and native publication assertions.

Pricing's optional Three.js renderer now loads on demand with `React.lazy`/`Suspense`. The inspected build's entry JavaScript fell from 885.13 kB to approximately 348 kB minified, with roughly 536 kB in the optional renderer chunk. This is a bundle-size observation, not a measured hardware startup-time claim. The toggle, vehicle renderer, HUD and cold-chain panel remain available. Large-chunk warnings in Cargo, optional Pricing, HOS and Assets remain a bounded performance hardening item.

### Verification receipts and sensitivity

Evidence directory: [2026-10-22-shipment-ui](visual-evidence/2026-10-22-shipment-ui/). Installed Playwright/Chrome only; no dependencies or browsers were downloaded.

| Verification | Outcome | Evidence and boundary |
|---|---|---|
| Canonical client/registry | 9/9 verified | `npm run check:suite`; generated distribution matches canonical files. |
| All workspace tests | 280 pass across nine Apps and two packages | `test-all.log`; Cargo 83, Pricing 62, domain/API 18. Normal assertion coverage is S1 unless separately strengthened. |
| All product builds | 9/9 pass, including declared TypeScript checks | `build-all.log`; existing bundle warnings retained. |
| Actual native UI flow | 12 check groups pass; no page errors | `browser-verification.json` and log, final shipment `5aeab0f2-c705-4b5d-b407-7a9dabda7f9b`; Tier 4/S1. Native edits, exact saves/reopen, details/history/source, direct URLs, focus, concurrent draft, stale quote, offline/detach and standalone workbenches. |
| Layout and optional renderer | Pass | `visual-verification.json`, final before/after PNGs; Tier 4. Mobile before-fail/final-pass comparison is S2 for the measured overflow defect. |
| Same-hash Cargo replacement | Before FAIL, fixed PASS | `cargo-recovery-before-2026-10-22T17-41-27-186Z/receipt.json` vs `cargo-recovery-fixed-2026-10-22T17-42-38-387Z/receipt.json`; actual two tabs, expected X 20, before X 10, fixed X 20, no page errors. Together Tier 4/S2; individual receipts label S1. |
| Transport/quote mutation checks | Both deliberate mutations detected | `invariant-verification.json`; Tier 2/S3 for monotonic merge and missing-fit quote guard, isolated modules only, no live source mutation. |
| Exact estimate print | Actual browser-generated PDF | `reviewed-estimate.pdf`; qualified reviewed native values, no provider/commercial proof. |
| Complete retained nine-product journey | Pass | Timestamped `full-flow-regression/*/browser-flow-receipt.json`; all nine standalone renders, seven evaluations, amend/reevaluate, stale CAS, dispatch/movement, wrong barcode, exception/receipt/reconciled invoice, reload and mobile. Tier 4/S1. |
| Storage/Git preservation | Pass | `preservation-verification.json`; original baseline shipment unchanged, all eight index contents unchanged, all 104 baseline files retained, no whitespace errors in worktree/staged diffs. |

The earlier completed full-flow receipt at `full-flow-regression/run-2026-10-22T17-32-25.764Z-89145/` reached `invoice_ready`, input revision 2, record revision 23, 23 retained events and USD 287.87. The final repeated flow at [run-2026-10-22T17-44-49.873Z-6012/browser-flow-receipt.json](visual-evidence/2026-10-22-shipment-ui/full-flow-regression/run-2026-10-22T17-44-49.873Z-6012/browser-flow-receipt.json) passed all 17 groups against final code: shipment `05c03ee5-2cae-47e6-a631-e9a1171885cc`, the same revisions/event count/amount, no page errors. Initial passes, intentional defect reproduction, failed captures and diagnostic screenshots are retained rather than cleaned away. Synthetic verification records remain in the local store.

### Council, doctrine and final review

The current council used three freshly resolved definitions: PER-950374 Fleet Operations Manager, PER-0395 Logistics & Supply Chain Systems Architect and PER-0080 Accessibility for Spatial & Scientific Interfaces Specialist. No important missing lens required a new persona. These are simulated expert perspectives, not real operator research. The task/UX review preceded implementation; the independent architecture seat then challenged native publication ownership, physical identity, prerequisite integrity, late responses, stale writes, StrictMode dialog behavior, repeat publication and same-hash draft recovery.

The final independent architecture disposition is **GO for the bounded local slice**, with no remaining blocker found in inspected scope. The last P2 was closed only after the explicit failing/passing browser pair above. The reviewer checked that fix and both receipts; it did not independently rerun the parent's full workspace commands. Relevant canonical doctrine and skill hashes, resolver fingerprint, ownership and recovery notes are retained in `task-ledger.json`. The canonical doctrine-family generator produced `doctrine-routing.md` with explicit task intent and source/version provenance; earlier no-task startup context is historical derived output.

Three final passes were completed:

1. **Correctness:** exact units/barcodes, selected plan, current complete fit prerequisite, native quote assumptions/cent reconciliation, atomic invalid publication, concurrency, monotonic updates, explicit dirty-draft replacement and full retained dispatch-to-invoice sequence.
2. **Architecture/preservation:** one canonical service/store, native calculation owners, canonical generated clients, no study-fixture promotion, preset/native capabilities retained, additive legacy inspection and no invented missing source.
3. **Rules/evidence:** current user scope, doctrine/skill/persona provenance, local synthetic limits, no external contact/provider/payment, no deletion, no Git staging/commit/push, all existing indexes preserved and claim strength matched to receipts.

Observed failures/recovery: sandbox loopback EPERM was resolved using authorized escalation; the browser harness import used the installed `playwright/test`; mobile overflow prompted measured grid/dock changes; StrictMode/late-response and manual-overlay risks were corrected; a full-flow invocation missing `PLAYWRIGHT_MODULE` was retried with the runbook's installed module. Global startup hook/guard warnings were recorded and not repaired outside scope. None of these were hidden as a successful run.

### Remaining risks, decisions and revisit triggers

No product-owner choice blocks this completed local slice. Keep these separate for discussion:

- **Connected domain expansion:** which real operator/customer context and next unsupported use case to support, such as adding/removing identified units, multi-stop, non-upright cargo, cold chain or hazmat. Current explicit limits preserve broader native standalone tools rather than infer unimplemented orchestration.
- **Commercial policy:** entitlement policy and whether/when a qualified estimate becomes a real carrier agreement. Existing behavior was preserved; this task adds no booking or contract authority.
- **Evidence expansion:** real operator task review, screen reader/device coverage, actual scales/restraints/scans/driver history and provider/insurer data. Keyboard/Chrome/mobile-width evidence does not establish these outcomes.

Operational limits remain the existing single-operator local store, 64 KiB command bodies and bounded shipment/unit counts. Very large reviewed native plans can exceed that body limit; failed publication must retain the draft and report failure. Existing history without native assumptions cannot be silently rehydrated as if it contained them. Authentication/tenancy, scalable persistence, real evidence ingestion and operational execution amendments require a separately designed scope.

Next natural UI unit is applying the same attributable record/draft/action structure to the remaining products, then evaluating the overall spatial/temporal canvas against these canonical records and a structured linear equivalent. Existing 120-case spatial studies remain independent, preserved and pending human design decisions. Reopen this review if source ownership changes, accepted terms differ from reviewed terms, a dirty draft is overwritten, mobile controls escape the viewport or a real operator task exposes missing decisive information.

All work is uncommitted. No staging, commit, push, fetch, checkout, branch/worktree change or deletion was performed. Review previews remain loopback only. Recovery is to inspect preserved evidence/source snapshots and retained history, not reset storage or overwrite another product's dirty work.

Final wording recheck: the planning header now calls unmet conditions “dispatch blockers.” The complete browser regression was rerun after distributing this label to all nine clients: [run-2026-10-22T17-53-16.060Z-25807/browser-flow-receipt.json](visual-evidence/2026-10-22-shipment-ui/full-flow-regression/run-2026-10-22T17-53-16.060Z-25807/browser-flow-receipt.json), shipment `70f8260d-d243-42c3-86b2-25ed91f78f79`, all 17 groups, `invoice_ready`, USD 287.87, record revision 23, no page errors. Earlier receipts remain preserved.

## Full suite and derived canvas continuation, 23 October 2026

This continuation implements Pranay's subsequent **do it all** instruction: native equipment selection through loading/pricing; dispatch readiness across carrier, duty, receiving and dock; ordered movement and manual receipt; exceptions and exact invoice evidence; and a derived overview/spatial/timeline. It supersedes the preceding section's next-work recommendation for this bounded local slice. Earlier findings, measurements, alternatives and receipts remain historical evidence. It does not imply approval of the 120 individual spatial studies or a production/physical outcome.

### Method, ownership and first-principles derivation

The actor remains a local dispatcher/receiver handling identified ambient freight to one destination. Each decision needs its real native inputs, selected result, source, reviewed revision, consequences and recovery path. The design therefore extends the same service/store and generated client, rather than constructing another application model. Products own editable drafts and calculations; the session owns transport; the domain owns allowed commands and dependencies; the portal owns the derived combined view. The source snapshot and 476-file hash baseline are retained in `visual-evidence/2026-10-22-suite-completion/before-source.zip` and `before-source.json`, with all eight product Git indexes and 13 original shipment hashes.

Current source, dirty state, applicable product AGENTS and the warehouse spatial contract were inspected before editing. Operating Doctrine 8.2 and materially relevant specialist doctrines were applied. Explicit-task routing provenance, generator, versions and canonical hashes are retained in that evidence folder's `doctrine-routing.md`; the canonical router was used without rerunning the startup script's unrelated hook installation. The control-plane SHA remains `e14bab7b1964d8b755c9e6c7f5b1c2b44e1d726033fa23aeaee6ce921e271a75`.

The council-orchestrator and accessibility-review skills were used. The persona source was resolved afresh to `/Users/pranay/Downloads/Understanding_Personas_24sep`, fingerprint `fc9aef4328a8fd8ab815786de4b83d82334c91fa57972a6e94d123f99f83b64a`; active definitions were read for PER-950374 Fleet Operations Manager, PER-0395 Logistics & Supply Chain Systems Architect and PER-0080 Accessibility for Spatial & Scientific Interfaces Specialist. These are simulated analytical perspectives, not operator interviews. No missing perspective required a new persona. Delegated native ownership was split between planning and execution, with canonical domain/UI and final integration owned by the parent. Interrupted files were inspected and completed in place.

Primary reference refresh used [W3C complex-image guidance](https://www.w3.org/WAI/tutorials/images/complex/) for equivalent structured detail and [ARIA disclosure guidance](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) for optional detail behavior. The [FMCSA HOS summary](https://www.fmcsa.dot.gov/regulations/hours-service/summary-hours-service-regulations) informed the explicit full-rest/model boundary; no new statutory certification or real duty-history support is inferred. The static visual-first [shipment operations study](../design/shipment-operations-study/README.md), captured at desktop and 390px, preceded product integration. Its extracted synthetic snapshot remains isolated and attributed. All alternatives and historical studies remain available.

### Native product dispositions

The detailed before/falsifier/change/test records are in [native planning review](SUITE_PLANNING_REVIEW_2026-10-22.md) and [native execution review](SUITE_EXECUTION_REVIEW_2026-10-22.md). These are task dossiers, not competing instruction or state authorities.

| Product/task | New behavior and retained detail | Preserved independent value |
|---|---|---|
| Asset Studio | Exact chosen vehicle and full declared snapshot publish atomically through `asset.publish`. Unknown/malformed identity abstains; valid saved custom specifications survive catalog drift. A changed envelope invalidates loading, receiving, dock and quote. | Vehicle/package catalogs, custom authoring, view modes, fit, temporal/axle/unload/carbon and fleet-split studies. |
| Cargo Fit | Existing reviewed native selected/manual arrangement remains the loading authority. The canonical acceptance boundary now also checks exact identified coverage, declared upright dimensions, finite coordinates, bounds and positive-volume overlap. | Full standalone solver, independent validator, imports, exports, manual arrangements and broader native studies. |
| Freight Pricing | Accepted native terms remain exact integer cents. Connected equipment category must be declared or a known legacy identity; unsupported category/electric equipment cannot silently become a diesel van quote. | Native operating profile, rate/accessorial inputs, independent scenarios and optional HUD. |
| HOS Planner | Exact reviewed speed, full-rest solo inputs, itinerary and audit are saved. Invalid/nonprogressing clocks or speed stop before iteration. Existing report completed as a frozen modeled report with complete itinerary and computed durations. | Presets, editable routes/team exploration, logbook/corridor views and qualified print. |
| Carrier Trust | Exact timestamped selected seeded profile, policy, audit and expiry are saved, including blocked outcomes. Unknown, malformed, future, expired or tampered observations abstain or require refresh. Concise summary retains every detailed blocker/warning separately. | Search/roster, BASIC/insurance/risk studies and bridges. No live verification is asserted. |
| Warehouse | Publishes the actual reviewed native facility, manifest, recommendations/result and reservation snapshot, with fit binding. Aggregate bay mass is rechecked at solve, publication and putaway; unknown committed mass consumes slot rating. Explicit receipt task preserves original units/barcodes/locations and shows corrections. | 2D/3D, containment/entities, native putaway and independent EPCIS/scanner demonstration. Switching views retains the 2D draft. |
| Yard & Dock | Actual selected compatible available door, its snapshot, current receiving binding and shared reservations are saved. | Gate, yard occupancy, hostler and detention demonstrations. |
| Telematics | Operator declares ordered departure/arrival for the assigned tractor and an explicit exception reason. Saved movement is separate from animated sensor state. | CAN/GPS/cold-chain/DTC/fleet simulations. |
| Command Center | Seven-stage readiness with freshness, explicit exceptions, receipt/quote reconciliation, separate receipt/invoice inspection and actual evidence download. | Existing independent preset lifecycle and all product navigation. |

The native HOS report formerly supplied invented operational identities, fixed status durations and certification language; it now prints the supported modeled facts only. The corridor zero-speed probe found a prior solo `NaN`/legal result and a nonprogressing team branch; both now reject invalid inputs. Warehouse execution probes reproduced bay overcommit and lost occupied mass before correction. The carrier rejected-decision browser test also exposed a summary longer than the service's 1,000-character limit; summarization now retains outcome/counts while the full reasons remain in structured evidence. These changes preserve useful functions while repairing their acceptance boundaries.

### Canonical overview, spatial plan and timeline

`ShipmentCanvas.tsx` and `shipmentViewModel.ts` are read-only projections of `Shipment`. Component state is limited to view, search/filter and replay selection. `ShipmentFinance.tsx` reconciles already accepted terms and receipt evidence; it never runs a second pricing model. Native edits still open the owning product with the same UUID. The existing generator distributes the 14 canonical client files to all nine independent builds.

Overview exposes labeled decision relationships, current/stale/rejected/expired/missing states, all seven native actions, execution, exceptions and a complete structured relationship list. Spatial draws only supported current native millimetre geometry at equal scale, labels HU numbers by canonical manifest order, and provides searchable original IDs/barcodes, dimensions, mass, placement and receiving identifiers in a table. It abstains on unsupported legacy units, incomplete coverage, invalid dimensions, overlap or stale observations. Receiving locations are categorical; no measured rack/yard geometry, route or GPS fix is fabricated. Timeline filters retained event payloads and timestamps, with ordinal spacing and an independently labeled relative duty model. Historical input replay requires complete retained events and narrow amendment fields; missing history stays unknown. Replay does not replace today's unit table, arrangement, receipt or invoice.

The shared source inspector now uses that same reconstruction to show the complete manifest source-event chain after cargo/equipment/carrier amendments. Delivery and invoice have their own record selections and source event attribution. Structured/raw record detail remains accessible without relying on the canvas.

### Adversarial review corrections and recovery

| Finding | Correction and decisive invariant |
|---|---|
| A delayed native save could mark an edit made during the request as already reviewed. | `acknowledge(next, submittedValue)` fingerprints the captured submitted value. Newer local edits remain dirty. All six new producers use this same helper. |
| An older response could clear a newer polled incoming revision. | Acknowledgement checks the latest selected session/revision and retains newer incoming state. Publication remains disabled until explicit recovery. |
| A historical replay selection could feed the current spatial table. | Current units always derive from `shipment.input`; historical units have a separately labeled replay table. |
| An asserted native plan could carry overlapping boxes. | One reusable `reviewedGeometry` sanity check guards canonical acceptance and drawing, in addition to native Cargo validation. Deliberate guard removal permits the bad fixture and is detected. |
| Another shipment could reserve different positions in a shared bay during review. | The server compares exact shared reservation snapshots inside its serialized write, then checks individual collisions. A rejected write leaves the store/history unchanged; refresh and replan restores a valid route. |
| Invoice preparation could rely on malformed or stale retained terms. | Revalidate current accepted quote, fit binding and integer-cent line reconciliation before exact amount acceptance. |

The shared draft helper has no product calculation logic. Saved plans and generic amendments retain their earlier conservative dependency policy. Narrow asset/carrier changes carry forward only already-current unaffected observations, preserving original timestamp plus reuse attribution; no stale observation is promoted. Error, offline and concurrent-change paths keep the native draft and provide explicit load/retry/detach actions. A retry uses its original operation ID and cannot repeat history or reservations. No store reset, schema shadow or migration is introduced.

### Verification record

Current command outcomes, browser receipts, inspected screenshots and preservation receipt are appended below after final runtime verification. Historical failed attempts remain in the evidence folders. The suite run affected local source, build outputs, local preview processes and explicitly created synthetic scenarios only. No physical equipment, live carrier/ELD/scanner, provider, customer, production or payment action follows from this work.
