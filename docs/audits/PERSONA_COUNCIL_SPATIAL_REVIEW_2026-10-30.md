# TRUCKING Platform: Persona Council Review & Spatial Exploration Decisions

**Date:** 2026-10-30 · Asia/Kolkata  
**Governing Doctrine:** `OPERATING_DOCTRINE.md` (v8.2), `AGENTS.md`, `INQUIRY_ANALYSIS_DOCTRINE.md`, `EXPLORATION_DOCTRINE.md`  
**Purpose:** Formal multi-perspective evaluation of the 120 spatial review cases (`cases.json`) and domain engine linkages across 5 key industry personas.

---

## 1. Persona Council Roster & Mandates

| Persona | Role & Organization | Primary Focus & Evaluation Lens | Key Regulatory / Technical Touchstone |
| :--- | :--- | :--- | :--- |
| **Marcus Vance** | VP of Fleet & Terminal Operations, NorthLine Logistics | Facility throughput, gate-to-dock dwell times, hostler anti-deadhead moves, equipment turnaround | Terminal KPI metrics, hostler asset utilization, detention mitigation ($85/hr cost avoidance) |
| **Inspector Dale Bradley** | Senior Commercial Vehicle Safety Officer, FMCSA / CVSA | Federal safety enforcement, geometric cargo containment, axle weight compliance | 49 CFR Part 393 (Parts & Accessories for Safe Operation), 23 U.S.C. § 127 (Bridge Formula B), CVSA Out-of-Service Criteria |
| **Elena Rostova** | Director of Carrier Risk & Cyber-Fraud Intelligence | Chameleon carrier detection, double-brokering prevention, digital identity verification | 49 U.S.C. § 13906 (BMC-91X/84 statutory security), IP geolocation, VOIP line identification, FreightGuard nexus |
| **Hank Reynolds** | Independent OTR Owner-Operator (25 Yrs Experience) | Practical cab usability, HOS duty clock flexibility, weigh station bypass, honest net profit per mile | FMCSA 49 CFR Part 395 (Hours of Service & Split-Sleeper), EIA diesel index fuel pass-through, CAT Scale certified weights |
| **Javier Ortiz** | Distribution Center Flow Master & Yard Lead | Cross-dock layout, drop lot staging, cold-chain reefer thermal monitoring, door reservations | GS1 EPCIS standards, RFID gate OCR, reefer temperature setpoint logging, staging lane buffer limits |

---

## 2. Persona Council Review of the 120 Spatial Exploration Cases

### Group 1: Cargo Fit (`CF-01` to `CF-12`)
- **Inspector Dale Bradley's Assessment:**
  - *Cases `CF-01` (Mixed manifest fit), `CF-03` (Heavy machinery tie-downs), `CF-07` (HazMat segregation):* The spatial isometric view must clearly distinguish between physical freight boundaries and required void clearances. In `CF-03`, tie-down angle vectors (direct vs. indirect) must show their WLL (Working Load Limit) aggregate rating ($\ge 50\%$ cargo weight).
  - *Recommendation:* Link `dunnageVoidCalculator.ts` outputs directly to `CF-02` and `CF-05` to render inflatable dunnage airbags in voids $> 6\text{ inches}$.
- **Hank Reynolds's Assessment:**
  - *Case `CF-06` (Axle load balancing):* Showing steer (12,000 lbs), drive (34,000 lbs), and trailer tandem (34,000 lbs) as simple numbers is insufficient when pulling onto a state weigh scale. The isometric chassis model must show dynamic color-coded weight bars linked to `tandemSlider.ts`.
  - *Decision Boundary:* Tandem sliding must allow manual pin selection (holes 1–12) alongside automated one-click legal balancing.

### Group 2: Freight Pricing (`PR-01` to `PR-12`)
- **Hank Reynolds's Assessment:**
  - *Cases `PR-01` (Carrier cost waterfall), `PR-04` (Fuel surcharge indexing), `PR-08` (Backhaul deadhead reduction):* The pricing HUD must clearly separate base linehaul from the DOE/EIA fuel surcharge escalator. When deadhead miles exceed 15% of loaded miles, `triangulationBackhaul.ts` should proactively suggest 3-leg triangle lanes.
- **Marcus Vance's Assessment:**
  - *Case `PR-06` (Broker gross margin):* Visual transparency on brokerage margin (e.g. 15% target) is critical to prevent dispatching loads below operating cost. Factoring QuickPay fees (1.5% to 3.0%) must be explicitly deducted from carrier net settlement.

### Group 3: HOS Planner (`HOS-01` to `HOS-12`)
- **Hank Reynolds's Assessment:**
  - *Cases `HOS-02` (Split sleeper berth), `HOS-05` (Corridor rest stops), `HOS-09` (Adverse weather exception):* Drivers will not adopt an ELD interface that strictly locks them into rigid 10-hour blocks. The 8/2 and 7/3 split-sleeper pause rules must be visually demonstrated on the 24-hr chart with rolling 14-hour clock recalculations.
- **Inspector Dale Bradley's Assessment:**
  - *Case `HOS-07` (Agricultural exemption 150-air-mile radius):* When ag exemption is selected, the ELD log must record "Exempt Agricultural Commodity" and freeze the driving clock until the truck crosses the 150-air-mile boundary.

### Group 4: Asset Studio (`AS-01` to `AS-12`)
- **Marcus Vance's Assessment:**
  - *Cases `AS-01` (Class 8 Day Cab / Sleeper), `AS-06` (Multi-stop axle shift), `AS-10` (Heavy BEV Class 8):* Asset Studio's 3D digital twins must reflect real equipment physics. The Tesla Semi and Freightliner eCascadia profiles must accurately apply the FAST Act 2,000 lb federal gross weight allowance (82,000 lbs GVW).

### Group 5: Telematics & Fleet Tracking (`TEL-01` to `TEL-12`)
- **Javier Ortiz's Assessment:**
  - *Cases `TEL-03` (Cold-chain thermal excursions), `TEL-06` (CAN bus J1939 faults), `TEL-09` (IFTA mileage tracking):* Cold-chain cargo (ice cream at -10°F vs produce at 34°F) requires continuous return-air sensor monitoring. Excursions lasting $> 15\text{ minutes}$ must trigger high-priority alerts with bidirectional remote setpoint command capabilities.
  - *Hank Reynolds:* State line crossings must automatically log odometer readings for quarterly IFTA tax reporting without requiring driver paperwork.

### Group 6: Warehouse Space & Flow (`WM-01` to `WM-12`)
- **Javier Ortiz's Assessment:**
  - *Cases `WM-01` (Inbound putaway planning), `WM-04` (Moveable container assets), `WM-08` (Bay capacity limits):* Dual-role containers (e.g. roll cages containing totes) must track hierarchical GS1 SSCC barcodes. Over-stacking pallet racks beyond rated beam capacity must be blocked at the planning layer.

### Group 7: Yard & Dock Management (`YD-01` to `YD-12`)
- **Marcus Vance & Javier Ortiz Joint Assessment:**
  - *Cases `YD-01` (Dock door allocation), `YD-04` (Drop lot dwell times), `YD-07` (Hostler jockey dispatch):* The 2D SVG Blueprint must display active carrier detention clocks. At 15 minutes before the 2-hour free time window expires, the trailer slot must turn amber, and at 120 minutes it must flash red with accumulated detention billing ($85/hr). Hostlers must receive auto-batched moves that eliminate empty travel (anti-deadhead pairing).

### Group 8: Carrier Trust & Anti-Fraud Shield (`TR-01` to `TR-12`)
- **Elena Rostova's Assessment:**
  - *Cases `TR-01` (SMS BASIC scoring), `TR-05` (COI verification), `TR-08` (Chameleon carrier & double-brokering):* A carrier with an active DOT number is not necessarily safe to dispatch. Criminal syndicates register shell companies using virtual VOIP numbers (Bandwidth.com/Twilio) and newly created email domains (<90 days old) with overseas VPN IPs.
  - *Recommendation:* Automated Do Not Dispatch (DND) locks must engage whenever:
    1. Operating authority is Revoked or Suspended in SAFER.
    2. BMC-91X primary public liability insurance has lapsed.
    3. Critical VOIP + overseas IP mismatch score exceeds 70/100.
    4. Unresolved FreightGuard hostage-load reports $\ge 2$.

### Group 9: Command Center Portal (`CC-01` to `CC-12`)
- **Council Consensus:**
  - The Portal must serve as the single pane of glass. Rather than a static dashboard, it must feature an active **Exception Control Tower** aggregating critical cross-suite alerts (overweight axles, underwater margins, HOS violations, reefer temperature excursions, detention expirations, and fraud flags) with one-click navigation directly to the responsible subproduct.

---

## 3. Explicit Operator Decision Boundaries (For User Alignment)

Per `OPERATING_DOCTRINE.md` §6 and the substantial-task gate, genuine design choices that dictate operational tradeoffs are documented here for human alignment rather than making arbitrary choices:

1. **Decision Architecture 1: Three-Tier Carrier Risk & Step-Up Governance (P08):**
   - *Tier 1 (Statutory Invariants):* Inviolable federal statutory block under 49 U.S.C. § 13906 & 49 CFR Part 387 (Revoked/Suspended authority, lapsed BMC-91X, FMCSA Unsatisfactory rating). Zero override permitted by law.
   - *Tier 2 (Multi-Factor Cyber-Risk Scoring):* Weighted score (0–100) analyzing VOIP line detection (+25–45), domain registration age <90 days (+35), VPN/datacenter proxy (+30), and overseas IP geolocation mismatch (+35).
   - *Tier 3 (Step-Up Verification & Dual-Custody Governance):* For elevated/high risk scores (20–69) or contested critical flags, single-click bypasses are prohibited. Requires out-of-band telephone call to official SAFER registry contact, direct underwriter Certificate of Insurance verification, and dual-party cryptographic sign-off (Assigned Dispatcher + Safety Director) writing to an immutable audit ledger (`trucking-carrier-step-up-audits-v1`). Implemented in `StepUpVerificationModal.tsx`.
2. **Decision Architecture 2: Multi-Stop Progressive Axle Shift & Dynamic Tandem Re-Balancing (P01):**
   - *First-Principles Mechanical Solution:* Rather than an artificial solver hard-block or unassisted warning banner, intermediate delivery drop legs (e.g. Post-Stop 1) that shift the Center of Gravity forward onto tractor drive axles are flagged with precise bridge weight moment calculations and provide a direct 1-click "Slide Tandem to Re-Balance ⚙️" bridge opening `TandemSliderModal` parameterized for that specific intermediate leg payload and CG. Implemented in `PlanStep.tsx`.
3. **Decision Architecture 3: Yard Map Visualization Dual-Mode (P07):**
   - *Operational Consensus:* Dual-mode UI supporting both high-fidelity 2D Architectural SVG Blueprint (doors 1–12, drop lots A/B, live hostler anti-deadhead paths, detention alert rings) and dense Modular Tile Grid, defaulting to the architectural blueprint with active 30-second detention fee accrual ($85/hr after 2-hour free time). Implemented in `App.tsx` and `YardMapCanvas.tsx`.
