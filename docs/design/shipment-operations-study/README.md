# Shipment operations visual study

22 October2026. An additive, self-contained visual-first task study for Pranay's authorized equipment, dispatch, execution, finance and spatial/temporal continuation. Open `index.html` locally or serve this directory through an existing loopback preview. No shipment service connection, browser storage, provider request or operational write exists in the study.

The source snapshot is retained synthetic shipment `70f8260d-d243-42c3-86b2-25ed91f78f79`, record23/input2. `provenance.json` records its source-store hash at extraction. No previous study, original data or120-case decision record was modified or removed. This study does not imply creative approval of any historical case.

## Working views

1. Equipment choice shows the exact selected capacity/source and previews dependency consequences before publication. It does not invent catalog alternatives unavailable in the snapshot.
2. Dispatch readiness keeps all seven saved decisions and exceptions inspectable. It distinguishes historical carrier evidence from current eligibility.
3. Movement to invoice preserves the original tractor/event, exact unit/barcode/location receipt and USD287.87 invoice, with exception recovery visible.
4. The combined canvas provides an overview, scaled accepted top view and actual UTC event sequence with a separately labeled relative duty model. It never supplies a fabricated map, GPS fix, appointment or ETA.

Every record button opens retained structured JSON. Escape closes the native dialog. Controls are semantic HTML; there is no precision dragging, hover-only detail, motion or color-only result. The static study's sequential HU labels follow manifest identity order even when accepted placements are reordered.

## Verification

`node docs/design/shipment-operations-study/verify.cjs` uses installed Chrome and the preexisting Playwright module. It verifies four task views, record-dialog/Escape behavior, reduced motion and all four390px layouts without document-level horizontal overflow. `verification.json` and `spatial-desktop.png` / `spatial-mobile.png` are Tier4/S1 visual-study evidence. They do not establish native product integration, physical freight outcomes, actual assistive-technology use or operator preference.

The canonical implementation is `packages/shipment-flow/src/ShipmentCanvas.tsx`; its pure derived functions are in `shipmentViewModel.ts`. It receives a canonical `Shipment`, shared `inspect(record)` and shared `productUrl(id)`. It owns only view/filter/replay selection. Native products still own edits, calculations and publication; the existing shared service remains the sole shipment store.
