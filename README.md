# Trucking: modular freight and warehouse platform

Trucking is a portfolio of independently usable products for freight planning, pricing, carrier review, warehouse operations and property management. The Command Center and Products 01 through 08 also have an optional local shipment workspace. Product 09 operates separately today; a shared facility and inventory authority has not yet been established.

Product manifests are the canonical source for identity, ports and routes. The local shipment service uses port 5171; the optional storage server uses port 5182. See [Shipment Flow](docs/runbooks/SHIPMENT_FLOW.md) for the implemented workflow, storage boundaries, recovery and current acceptance evidence. In particular, new connected dispatch is currently blocked until the service can validate the driver's cycle and duty history; saving a duty review does not grant dispatch authority.

## Product portfolio

| Product | Local port | Product directory | Purpose |
| --- | --- | --- | --- |
| Command Center | 5170 | [command-center-portal](products/command-center-portal) | Shipment workflow, exception review and EDI document preparation. |
| P01 Cargo Fit | 5173 | [product-01-cargo-fit](products/product-01-cargo-fit) | Cargo arrangement, independent geometric checks, loading views, barcodes, reports and BOL preparation. |
| P02 Freight Pricing | 5174 | [product-02-freight-pricing](products/product-02-freight-pricing) | Carrier cost waterfall, fuel surcharge, accessorials, quote and margin calculations. |
| P03 HOS Planner | 5175 | [product-03-hos-planner](products/product-03-hos-planner) | Driver duty planning, corridor itinerary, rest calculations and modeled duty timeline. |
| P04 Asset Studio | 5176 | [product-04-asset-studio](products/product-04-asset-studio) | Vehicle and packaging catalog, 3D/2D equipment views, dimensions, axle models and fleet allocation. |
| P05 Fleet Telematics | 5177 | [product-05-fleet-telematics](products/product-05-fleet-telematics) | Fleet, reefer, tire and diagnostic telemetry interfaces and simulation. |
| P06 Warehouse Space & Flow | 5178 | [product-06-warehouse-space-flow](products/product-06-warehouse-space-flow) | Facility layout, inbound space planning, receiving, cycle count and warehouse workflow tools. |
| P07 Yard & Dock | 5179 | [product-07-yard-dock](products/product-07-yard-dock) | Yard and door allocation, gate workflows, detention estimates and hostler work. |
| P08 Carrier Trust | 5180 | [product-08-carrier-trust](products/product-08-carrier-trust) | Carrier identity, insurance and authority information, risk review and dispatch-policy evaluation. |
| P09 Storage & Leasing | 5181 | [product-09-storage-leasing](products/product-09-storage-leasing) | Facilities, rentable spaces, tenants, leases, rent, meters, maintenance and documents. |

The former `product-06-carrier-safety` identity is retired. Its current successor is P08 Carrier Trust; P06 identifies Warehouse Space & Flow. Historical audit records retain the old terminology where needed to explain prior work.

## Key capabilities and evidence

- Cargo Fit provides heuristic arrangement generation, independent placement validation, multi-stop and axle estimates, loading views, optional camera/barcode input, and printable/exportable documents. Geometric fit and an estimated axle or restraint calculation do not certify a safe or legal load.
- Freight Pricing combines fixed and variable costs, fuel and accessorial assumptions, and broker margin calculations. The default diesel benchmark is dated; market benchmarks and cold-chain examples are not live provider feeds. A draft estimate does not establish an accepted contract.
- HOS Planner models trip intervals and full-rest assumptions. Actual remaining duty and cycle status require the driver's preceding records, carrier rule and day boundary. The timeline and planning report are not an ELD record or regulatory determination.
- Asset Studio includes commercial equipment and packaging catalogs, 3D, isometric and orthographic views, and axle, fuel and allocation models. Telematics includes signal, reefer, tire and diagnostic interfaces; physical sensor readings or device command acknowledgements require an actual supported source.
- Warehouse Space & Flow provides facility layouts and inbound receiving tools. A saved local shipment receipt can be displayed without treating it as an authoritative stock movement. Durable shared inventory, outbound custody and physical scanner verification need further implementation and validation.
- Yard & Dock supports local allocation and gate workflows. Carrier Trust can review available carrier data and policy results, but self-attestation or a local record is not authenticated authority, insurance verification or a real dispatch approval.
- Storage & Leasing covers landlord and lease operations, including rent, meters, maintenance and supporting records. Accounting policy, tenant permissions, multi-process storage safety and recovery must be validated for the intended deployment.

The shared browser event bus and connected shipment service have different roles. Browser events are local notifications and do not establish a verified cross-origin, authenticated or real-time operational record. The shipment service records revisioned local workflow data; it does not provide production authentication, a live insurer or carrier lookup, device verification, payment execution, or proof of physical delivery. Product exports and EDI content require appropriate operator review and, where applicable, external partner validation before operational use.

## Local development and verification

From the workspace root:

```sh
# Start the product development servers on their manifest ports
npm run dev:all

# Optional local services for the connected shipment and storage workflows
npm run dev:flow
npm run dev:storage

# Execute declared product/package test and typecheck scripts
npm run test:all
npm run typecheck:all

# Build declared product/package bundles
npm run build:all

# Regenerate or check registry and optional shipment client distribution
npm run sync:suite
npm run check:suite
```

Each product also has its own `package.json` and test commands. Test totals and outcomes change with the checkout; use the current command output and the [audit task register](docs/audits/AUDIT_TASK_LIST_AND_PLAN_2026-10-30.md) rather than historical fixed counts. Local unit, integration or browser checks do not by themselves establish hosted readiness, live-provider behavior, real-device operation or customer acceptance.

## Shared navigation

Product manifests drive the generated product registry. The shared [`@trucking/suite-dock`](packages/suite-dock) package includes a product switcher and command palette; existing product-local dock implementations are separate and do not all mount that shared palette. An inspected, tested migration is required before treating shared palette changes as present in every product. Subscription profiles and upgrade controls in the local interface are not proof of deployed entitlements, billing or single sign-on.
