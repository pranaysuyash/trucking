# Product 08 — Carrier Trust Scenario Review

**Active Port:** `5180`
**Sovereign Directory:** `products/product-08-carrier-trust/`

---

## Overview
This product is a local carrier-risk scenario. Roster, driver, policy and risk inputs are seeded examples. Calculations and self-attested checkboxes do not verify identity, insurer records, government records, fraud or dispatch authority; no operational lock or load authorization is performed.

---

## Core Capabilities

1. **Sample SMS BASIC Scoring Engine:**
   - Evaluates seeded values for seven Behavior Analysis and Safety Improvement Categories (BASICs): Unsafe Driving, Crash Indicator, Hours-of-Service Compliance, Vehicle Maintenance, Controlled Substances/Alcohol, Hazardous Materials, and Driver Fitness.
   - Compares example values against configured thresholds (65% for Unsafe Driving / Crash Indicator / HOS; 80% for Vehicle Maintenance / Drugs & Alcohol).

2. **Certificate of Insurance (COI) Scenario Checks:**
   - Compares sample auto liability with a configured $1,000,000 customer-policy threshold.
   - Compares sample cargo coverage with a configured $100,000 customer-policy threshold.
   - Audits General Liability and evaluates underwriter A.M. Best ratings.
   - Automated expiration warnings (≤ 30 days) and expired policy lockout.

3. **Fraud & Double-Brokering Scenario Radar:**
   - Models high-risk indicators, IP and dispatch nexuses, and re-brokering scenarios.
   - Models possible chameleon-carrier indicators from sample data.
   - Displays sample report counts, without querying FreightGuard.

4. **Scenario "Do Not Dispatch" (DND) Policy Result:**
   - Flags sample carriers with revoked or suspended authority as scenario blocked.
   - Flags sample carriers with unsatisfactory ratings as scenario blocked.
   - Marks conditional scenario results for review; no authenticated sign-off is implemented.

5. **Cross-Project Platform Integration & Event Bus:**
   - Emits explicitly typed `CARRIER_SCENARIO_REVIEWED` and `CARRIER_SCENARIO_ATTESTED` events; it does not emit a carrier approval or a fabricated telematics alert.
   - Deep links carrier vetting parameters into Command Center Portal (`5170`), Pricing HUD (`5174`), and HOS Planner (`5175`).

---

## Development & Testing

```bash
# Start local development server on port 5180
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build
```

## Audit decisions and remaining evidence (2026-11-06)

- A step-up record is a self-attested local scenario with an identifier, not a signature or tamper-evident hash. It cannot change the policy result or authorize a tender. Existing stored history is retained, including older records with misleading labels. Malformed or unwritable history blocks a new save rather than discarding records. The app does not authenticate the named people; no PIN should be entered.
- Scenario eligibility remains a three-state modeled outcome. Pricing handoff retains identity and scenario eligibility while `dispatchAllowed` and `insuranceVerified` remain false. The connected shipment stores the modeled outcome with seeded provenance, not an operational permission. The scenario event types preserve the category and provenance and do not masquerade as telematics.
- Driver records are sample data for their own DOT and are not asserted to belong to the carrier selected in the interface. The audit date is shown and initialized from today's UTC date. Missing, invalid, future-dated or pending checks cannot qualify a sample. The current screen has no assignment integration. No medical registry, Clearinghouse or identity query is made.
- The optional response parser accepts only an explicitly injected transport; the default path makes no remote calls. Its source is `INJECTED_RESPONSE`, receipt time is not source freshness, filings are never invented, and neither authority nor compliance is inferred. Older cache entries are preserved but ignored because their provenance and invented fields cannot be trusted. Unknown is not a negative registry finding. The whole Vitest suite stubs global fetch to prevent accidental provider requests.
- FMCSA's [QCMobile API documentation](https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi) says calls require an API key, and its [field documentation](https://mobile.fmcsa.dot.gov/QCDevsite/docs/apiElements) documents reported fields. The agency says [L&I is historical only as of May 14, 2026](https://www.fmcsa.dot.gov/registration/ask-fmcsa?topic=23021), with Motus filings not reflected there. These references do not establish a working provider integration. A future integration needs an owner-selected source, credentials custody, field semantics, freshness, failure policy, authentication and independent legal/insurance review.
- S2 tests first reproduced the implicit fetch, invented filing, conditional permission and overclaimed driver result; focused and full offline tests subsequently passed. Browser keyboard focus, actual clipboard/device behavior, real carrier/insurer verification and operational dispatch remain untested.
