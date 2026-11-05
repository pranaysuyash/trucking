# TRUCKING — Workspace Control Plane & Architecture

## 1. Instruction Hierarchy & Governance
This directory governs the TRUCKING project on Pranay's Mac. The canonical instruction stack precedence is:
1. `/Users/pranay/AGENTS.md`
2. `/Users/pranay/Projects/AGENTS.md`
3. This file (`/Users/pranay/Projects/trucking/AGENTS.md`)
4. Subproduct-specific `AGENTS.md` and documentation

Compatibility symlinks (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`, etc.) must point directly to this file.

---

## 2. Product Portfolio & Structure
Trucking is organized into modular, independently testable products under `products/`:

- **Product 01 — Cargo Fit & Load Planning:**  
  Path: `products/product-01-cargo-fit/` (Port 5173)  
  Purpose: Explainable cargo-to-equipment decision support, mixed freight packing heuristics, independent geometric validation, and verified loading plan deliverables.

- **Product 02 — Freight Pricing & Tactical Dispatch HUD:**  
  Path: `products/product-02-freight-pricing/` (Port 5174)  
  Purpose: Carrier cost waterfall calculation, diesel index pegging, 3D digital twins, and broker rate confirmation generation.

- **Product 03 — HOS Compliance & Interstate Corridor Legality Planner:**  
  Path: `products/product-03-hos-planner/` (Port 5175)  
  Purpose: FMCSA Part 395 statutory hours of service engine, interactive 24-hr ELD chart, and corridor waypoint itinerary simulation.

- **Product 04 — Fleet & Cargo Asset Studio:**  
  Path: `products/product-04-asset-studio/` (Port 5176)  
  Purpose: Digital twin catalog of 20 cargo carrying vehicles & 23 packaging assets, Three.js 3D/2.5D Isometric/2D CAD blueprint views, spatial clearance & temporal fuel burn engine, multi-stop drop dynamic CG axle distribution simulator, multi-vehicle fleet splitter heuristic, and cross-project integration bridges.

- **Product 05 — Telematics & Real-Time Fleet Tracking HUD:**  
  Path: `products/product-05-fleet-telematics/` (Port 5177)  
  Purpose: SAE J1939 CAN bus OBD-II telemetry simulator, cold-chain reefer thermal excursion logger, GPS interstate corridor waypoint geofencing, Diagnostic Trouble Code (DTC) alert engine, and cross-project platform integration bridges.

- **Product 08 — Carrier Trust & Anti-Fraud Shield:**  
  Path: `products/product-08-carrier-trust/` (Port 5180)  
  Purpose: FMCSA Safety Measurement System (SMS) BASIC percentile scoring, Certificate of Insurance (COI) verification, chameleon carrier & double-brokering fraud prevention radar, automated "Do Not Dispatch" (DND) lockout rules, and cross-platform safety event broadcasting.

- **Product 09 — Storage & Leasing Core:**  
  Path: `products/product-09-storage-leasing/` (Port 5181)  
  Purpose: Property owner/landlord storage & leasing operations — facility registration, rentable spaces, tenants, leases, rent ledger, electricity meter readings, maintenance tasks, documents, audit events. Indian-warehouse oriented. Shared storage core landlord module.

- **Warehouse Space & Flow Planner:**  
  Path: `products/product-06-warehouse-space-flow/` (Port 5178)  
  Purpose: Multi-constraint inbound space planning, dual-role moveable container tracking (assets that contain assets), 2D/3D facility digital twin layouts, GS1 EPCIS 2.0 audit streams, barcode-verified putaway execution, and cross-project integration bridges with Cargo Fit (P01) and Command Center Portal.

- **Product 07 — Yard & Dock Management:**  
  Path: `products/product-07-yard-dock/` (Port 5179)  
  Purpose: Scenario gate/door allocation, yard occupancy, detention estimates, and hostler work demonstrations.

- **Unified Command Center Portal:**  
  Path: `products/command-center-portal/` (Port 5170)  
  Purpose: Top-level unified freight command center and multi-product portal bringing all subproducts under a single pane of glass with an interactive lifecycle stepper, cross-tab platform event bus (`trucking-platform-bus`), and ANSI X12 EDI hub.

---

## 3. Git & Mutation Policy
- Read-only inspection is permitted (`git status`, `git diff`, `git log`).
- Staging, commits, pushes, branch creations, and worktree modifications require explicit user authorization.
- Never use destructive broad cleanup commands.

## Local shipment workflow

The optional loopback shipment service uses port 5171. Product manifests own current identity and port metadata; `scripts/sync-suite.mjs` generates local client/registry distribution artifacts. Follow `docs/runbooks/SHIPMENT_FLOW.md` for the implemented scenario, standalone behavior, verification, storage preservation and production boundaries. No live compliance/device/insurer claim follows from local scenario output.
