# Suite navigation and command destinations

Product manifests own product IDs, ports and routes. `scripts/sync-suite.mjs` generates `src/productRegistry.json`; do not edit that generated registry independently. The canonical registry currently includes the command center and Products 01 through 09. Warehouse Space is P06 on port 5178, Yard & Dock is P07 on port 5179, and Carrier Trust is P08 on port 5180.

The shared `CommandPalette` routes actions through registry IDs. Its carrier-review shortcuts open Carrier Trust without selecting an invented carrier or adding an unsupported query parameter; the vehicle shortcut opens Asset Studio without claiming an unverified asset selection. Product labels and carrier evidence remain subject to the destination product's current data and permissions.

The shared package and its command palette are not automatically mounted by every product: existing product-local `src/ui/SuiteDock.tsx` implementations are separate, and `sync-suite.mjs` distributes the registry and shipment clients rather than this component. Package unit tests prove the catalog's routing callbacks and registry mapping, not cross-product browser mounting or navigation. Consolidating those dock implementations requires a separately tested migration that preserves their existing behavior.

Run `npm test` and `npm run typecheck` from this package. The 2026-11-06 focused check passed seven tests across the registry/event bus and command catalog, followed by typecheck. No deployment, live carrier lookup or browser acceptance is implied.
