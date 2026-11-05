# TRUCKING — Modular Freight Logistics Platform

> **Current local implementation, 22 October 2026:** Critical regressions are repaired and an optional, persistent local shipment workspace connects all nine applications. Start `npm run dev:flow` and `npm run dev:all`, then open `http://127.0.0.1:5170/`. Each native product remains independently usable when the shipment service is stopped.
>
> Read [the shipment-flow runbook](docs/runbooks/SHIPMENT_FLOW.md) for the exact flow, canonical sources, evidence and limits. The connected slice uses explicit scenario data and manual evidence; it does not provide production authentication, live device/insurer verification or payments. Product manifests and the generated registry own current ports: Warehouse 5178, Yard 5179, Carrier Trust 5180.
>
> The older portfolio description below is retained as historical context. Its earlier test counts, carrier-safety numbering, SSO/licensing claims and cross-origin event-bus claims are superseded by the runbook and the current implementation checkpoint in the industry audit.

This workspace hosts independent, sovereign SaaS subproducts and tools for commercial freight, logistics, and supply chain operations. Each subproduct operates with its own sovereign Git repository, isolated build pipeline, and dedicated test suite under `products/`.

---

## Portfolio of Subproducts

### 1. [Product 01: Cargo Fit & 3D Load Optimization](file:///Users/pranay/Projects/trucking/products/product-01-cargo-fit)
- **Active Port:** [http://localhost:5173/](http://localhost:5173/)
- **Repository:** Sovereign Git (`products/product-01-cargo-fit`) on `main`
- **Capabilities:**
  - Deterministic 3D heuristic packing algorithm & independent validator.
  - Interactive 3D spatial loading dock viewer & rotation tool.
  - Real-time optical camera barcode & QR scanner via native `BarcodeDetector` API.
  - Multi-stop drop-sequence sequencing & Federal Bridge Law axle weight distribution checks.
  - FMCSA cargo restraint & tie-down requirement calculator (49 CFR § 393.102).
  - VICS-standard Bill of Lading (BOL) generation & EDI 204/214 document engine.
  - Reverse bridge intake for equipment specs and multi-vehicle loads from Product 04.
- **Tests:** 42 passing unit, performance & EDI integration tests (`npm test`).

### 2. [Product 02: Freight Pricing & Tactical Dispatch HUD](file:///Users/pranay/Projects/trucking/products/product-02-freight-pricing)
- **Active Port:** [http://localhost:5174/](http://localhost:5174/)
- **Repository:** Sovereign Git (`products/product-02-freight-pricing`) on `main`
- **Capabilities:**
  - Interactive 3D Isometric Commercial Vehicle Digital Twin (Dry Van, Reefer with -10°F status, Flatbed with winch straps, Heavy Tarp, DOT Hazmat placards).
  - Tactical Dispatch Telemetry HUD with Operating Ratio (OR) speedometer, EIA diesel escalation, and margin rate spectrum.
  - Direct import intake banner for load configurations sent from Product 01.
  - Automated carrier cost waterfall calculation & 1-click broker rate confirmation generator.
- **Tests:** 12 passing unit tests (`npm test`).

### 3. [Product 03: HOS Compliance & Interstate Corridor Legality Planner](file:///Users/pranay/Projects/trucking/products/product-03-hos-planner)
- **Active Port:** [http://localhost:5175/](http://localhost:5175/)
- **Repository:** Sovereign Git (`products/product-03-hos-planner`) on `main`
- **Capabilities:**
  - FMCSA Part 395 statutory hours of service engine (11-hr driving cap, 14-hr duty window, 8-hr break requirement, 70-hr rolling cycle).
  - Interstate corridor itinerary planning (Chicago-Dallas, LA-Atlanta, Seattle-Denver, NYC-Miami presets).
  - Visual FMCSA 24-Hour ELD Record of Duty Status chart with stepped timeline and hourly duty tally.
  - Solo driver vs. team driving expedited transit simulation with automated sleeper layovers.
- **Tests:** 6 passing unit tests (`npm test`).

### 4. [Product 04: Fleet & Cargo Asset Studio](file:///Users/pranay/Projects/trucking/products/product-04-asset-studio)
- **Active Port:** [http://localhost:5176/](http://localhost:5176/)
- **Repository:** Sovereign Git (`products/product-04-asset-studio`) on `main`
- **Capabilities:**
  - Complete digital twin catalog mapping 20 commercial cargo vehicles across 5 categories (Class 8 combos, straight trucks, light commercial vans, specialized tankers/hoppers, and zero-emission electric/hydrogen).
  - Comprehensive packaging & container taxonomy (23 assets: ISO containers, pallets, drums, IBC totes, crates, Gaylords, coils).
  - Real-time 3D WebGL (Three.js) viewer with 360° orbit, cutaway/x-ray mode, CAD wireframe, door open/close animations, and nested 3D cargo loading.
  - 2.5D Isometric SVG technical projection with leader lines, axle limits, and dimension callouts.
  - 2D Orthographic CAD blueprints (3-view standard: Top Plan, Side Elevation, and Rear Door Aperture).
  - Dynamic Center of Gravity (CG) & Multi-Stop Sequential Unload Simulator with axle moment calculations (steer, tractor drive tandem, trailer tandem) across drop stages.
  - Multi-Vehicle Fleet Splitter heuristic partitioning oversized manifests (>45k lbs or >26 GMA pallets) into optimal combinations from the 20-vehicle catalog.
  - Temporal dynamics simulator (fuel burn curve, speed-drag penalties, remaining range, refuel stops).
  - 1-Click bridges to Product 01 (Cargo Fit), Product 02 (Freight Pricing HUD), and Product 03 (HOS Planner).
  - Open Logistics Asset Schema v1.0 standard JSON export & tabular CSV export.
- **Tests:** 19 passing unit tests (`npm test`).

### 5. [Product 05: Fleet Telematics & Real-Time Tracking HUD](file:///Users/pranay/Projects/trucking/products/product-05-fleet-telematics)
- **Active Port:** [http://localhost:5177/](http://localhost:5177/)
- **Repository:** Sovereign Git (`products/product-05-fleet-telematics`) on `main`
- **Capabilities:**
  - SAE J1939 CAN Bus OBD-II telemetry simulation (engine RPM, road speed, coolant temp, oil pressure, DEF level, fuel level, instantaneous MPG).
  - Cold-Chain Reefer Data Logger with FSMA temperature excursion tracking (+0.15°F/sec door-open thermal dissipation and critical alarm thresholds).
  - GPS Interstate Corridor & Waypoint Geofencing Canvas (I-80 Midwest-Intermountain corridor with mile markers, weigh stations, and rest stops).
  - Active Diagnostic Trouble Code (DTC) management (SPN 111 Low Coolant, SPN 100 Stop Engine Oil Pressure) and harsh braking/acceleration safety counters.
  - Dynamic fleet health scoring (0-100) and driver safety scoring.
  - Cross-project deep links to Product 01 (axle load verification), Product 02 (pricing fuel burn feed), Product 03 (ELD duty status sync), and Product 04 (asset digital twin).
- **Tests:** 6 passing unit tests (`npm test`).

### 6. [Product 06: Carrier Safety & Compliance HUD](file:///Users/pranay/Projects/trucking/products/product-06-carrier-safety)
- **Active Port:** [http://localhost:5178/](http://localhost:5178/)
- **Repository:** Sovereign Git (`products/product-06-carrier-safety`) on `main`
- **Capabilities:**
  - FMCSA Safety Measurement System (SMS) BASIC percentile scoring across all 7 statutory categories (Unsafe Driving, Crash Indicator, HOS, Vehicle Maint, Drugs/Alcohol, Hazmat, Driver Fitness) with statutory intervention threshold enforcement (65% / 80%).
  - Certificate of Insurance (COI) verification engine checking statutory $1,000,000 auto liability, $100,000 cargo limits, and A.M. Best underwriter solvency.
  - Fraud prevention & double-brokering radar detecting IP dispatch nexuses, unauthorized re-brokering, and chameleon carrier identity matches.
  - Automated "Do Not Dispatch" (DND) hard lockout on revoked authority or unsatisfactory safety ratings.
  - Platform state bus integration broadcasting `CARRIER_VETTED` and `SAFETY_ALERT` events across tabs.
- **Tests:** 12 passing unit tests (`npm test`).

### 7. [Warehouse Space & Flow Planner](file:///Users/pranay/Projects/trucking/products/product-06-warehouse-space-flow)
- **Active Port:** [http://localhost:5179/](http://localhost:5179/)
- **Repository:** Sovereign Git (`products/product-06-warehouse-space-flow`) on `main`
- **Capabilities:**
  - Axonometric pure-vector SVG 3D facility digital twin layout with ABC velocity slotting.
  - Multi-constraint spatial operations and dual-role moveable container tracking.
  - Inbound putaway allocation, GS1 EPCIS 2.0 scan verification, and Cargo Fit manifest bridges.
- **Tests:** 21 passing unit tests (`npm test`).

---

## Unified Deliverables & Enterprise Platform Capabilities

1. **Cross-Tab Platform Event Bus (`trucking-platform-bus`):**
   - Native browser `BroadcastChannel` reactive state bus with automatic Node.js/memory fallback.
   - Synchronizes order selections, carrier vetting, vehicle modifications, and real-time safety alerts across distinct subproduct browser tabs without backend polling.

2. **Official Freight Deliverables & Export Engine:**
   - **Product 01:** Printable VICS Bill of Lading (BOL) with real GS1-128 shipping container barcodes.
   - **Product 02:** Official Carrier-Broker Rate Confirmation Agreement with TIA/FMCSA commercial contracting terms.
   - **Product 03:** Official FMCSA 49 CFR § 395.8 24-Hour ELD Driver Daily Log Sheet with duty status totals.
   - **Command Center Portal:** ANSI X12 EDI Transaction Hub generating verified EDI 204 (Motor Carrier Load Tender), EDI 214 (Transportation Carrier Shipment Status), and EDI 210 (Freight Details & Invoice).

---

## Multi-Product Orchestration

From the workspace root `/Users/pranay/Projects/trucking`:

```bash
# Launch all subproducts simultaneously in dev mode
npm run dev:all

# Run all 166 unit and specification tests across all 8 subproducts
npm run test:all

# Build production bundles across all 8 subproducts
npm run build:all

# Run full TypeScript typecheck across all 8 subproducts (Zero errors)
npm run typecheck:all
```

---

## Platform Port Mapping Matrix

| Product | Port | Purpose | Sovereign Path | Tests |
|---|---|---|---|---|
| **Command Center Portal** | `5170` | Unified Freight Lifecycle Orchestrator & EDI Hub | `products/command-center-portal` | 11 |
| **Product 01: Cargo Fit** | `5173` | 3D Packing, Axle Laws & VICS BOL | `products/product-01-cargo-fit` | 55 |
| **Product 02: Freight Pricing** | `5174` | Carrier Cost Waterfall & Rate Confirmation | `products/product-02-freight-pricing` | 19 |
| **Product 03: HOS Planner** | `5175` | FMCSA Part 395 Statutory Legality & ELD Logs | `products/product-03-hos-planner` | 8 |
| **Product 04: Asset Studio** | `5176` | 3D/2.5D/2D Vehicle Catalog & Fleet Splitter | `products/product-04-asset-studio` | 34 |
| **Product 05: Fleet Telematics** | `5177` | SAE J1939 CAN Telemetry & Real-Time HUD | `products/product-05-fleet-telematics` | 6 |
| **Product 06: Carrier Safety** | `5178` | FMCSA SMS BASIC Scoring & DND Lockout | `products/product-06-carrier-safety` | 12 |
| **Warehouse Space & Flow** | `5179` | Spatial Inbound Putaway & Facility Twin | `products/product-06-warehouse-space-flow` | 21 |
| **Product 05: Fleet Telematics** | `5177` | SAE J1939 CAN Telemetry & Real-Time HUD | `products/product-05-fleet-telematics` |

---

## Hybrid Sovereign Architecture: Standalone SaaS & Mixed Suite

Every product in the Trucking platform is built with **Sovereign Independence** and **Federated Suite Interoperability**:

1. **Independent Sovereign Operation**:
   - Each product has its own self-sufficient `package.json`, build pipeline, and tests.
   - A single-tool customer (e.g., an independent owner-operator purchasing only Product 01 or Product 02) signs up, logs in, and uses their licensed product with zero dependency on sibling projects.
   - Products can be cloned, branched, and deployed independently without monorepo hoisting.

2. **Unified Mix-and-Match Suite ("The Dock")**:
   - Every product header embeds `<SuiteDock />`, featuring a 9-dots App Switcher and active client entitlement context.
   - Multi-product customers seamlessly switch between licensed products with 1-click single sign-on handoffs.
   - Unlicensed products display an **Upsell Gateway** with tier pricing ($129–$299/mo) and an instant 14-day trial activation simulation.

3. **Pluggable Extensibility for Future Products**:
   - Scaffolding a compliant subproduct is 1-click via the CLI:
     ```bash
     npm run create:product product-06-yard-dock "Yard & Dock Management" 5178 🏭
     ```
   - Automatically generates the sovereign Vite/React/TypeScript project, `product.manifest.json`, test suite, and Suite Dock integration.
   - `npm run dev:all`, `npm run test:all`, `npm run build:all`, and `npm run typecheck:all` dynamically discover and execute across all manifest-backed subproducts.
