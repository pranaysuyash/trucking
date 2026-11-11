# Fleet splitter and equipment provenance review, 2026-11-06

## Findings and decisions

The fleet splitter previously omitted unknown package IDs, accepted non-integral or unbounded quantities, and used aggregate weight and volume as though they established dimensional fit. It is a first-fit heuristic, not an optimizer or a mixed-load packing, securement, axle, or legal assessment. The current implementation retains unknown units as unassigned, rejects invalid quantities and weights, caps local demand at 10,000 units, and checks each unit against its candidate vehicle's aperture and interior envelope. Known-specification weight and volume totals exclude unknown specifications. Simultaneous mixed geometry and stackability remain unverified and require a separate loading plan.

The custom authoring form previously hardcoded `dry_van_53`, even for a straight truck. New custom records contain an explicit operator-declared subtype or unknown. Legacy custom subtype fields cannot be presumed deliberate: publication retains the original record separately while presenting an unknown subtype to downstream consumers. Existing records and local storage are not modified. Catalog subtype records remain catalog declarations. The P07 `requiredDoorType` contract was tested with a declared reefer and legacy unknown. Current saved shipment results produced before this correction still need re-review and republication; no old persisted result was rewritten.

## Evidence and limits

P04 `npm test`: 9 files, 66 tests pass; `npm run typecheck`: pass. Regression fixtures cover unknown mixed demand, fractional/negative/nonfinite quantities, an individually oversized unit, legacy custom identity and P07's real compatibility function. The initial fleet test containing infinite quantity failed to complete in its bounded execution before validation was added; the legacy subtype test reproduced an incorrect dry-van category before correction. Tests are local software evidence, not measured freight, a verified packing plan, browser acceptance or a release claim.

Open: a facility policy for more equipment subtypes, a workflow for re-declaring legacy custom records, mixed-unit geometry and realistic stacking/securement constraints, and browser/mobile review. The numeric 10,000-unit bound is an explicit implementation capacity, not a logistics limit.
