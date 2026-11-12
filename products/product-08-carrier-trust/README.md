# Product 08: Carrier Trust Scenario Review

Port: 5180
Directory: `products/product-08-carrier-trust/`

## Overview

This product provides a local carrier-risk scenario evaluation interface. Roster, driver, policy, and risk inputs are seeded examples. Calculations and self-attested checkboxes do not verify identity, insurer records, government records, fraud, or dispatch authority; no operational lock or load authorization is performed.

## Core Capabilities

SMS BASIC Scoring Engine:
Evaluates seeded values for seven Behavior Analysis and Safety Improvement Categories (BASICs): Unsafe Driving, Crash Indicator, Hours-of-Service Compliance, Vehicle Maintenance, Controlled Substances and Alcohol, Hazardous Materials, and Driver Fitness. Compares example values against configured thresholds (65% for Unsafe Driving, Crash Indicator, HOS; 80% for Vehicle Maintenance, Controlled Substances and Alcohol).

Certificate of Insurance (COI) Scenario Checks:
Compares sample auto liability with a configured $1,000,000 customer-policy threshold, and cargo coverage with a configured $100,000 customer-policy threshold. Audits General Liability and evaluates underwriter A.M. Best ratings. Provides expiration warnings for policies nearing renewal and marks expired policy records.

Fraud and Double-Brokering Scenario Radar:
Models risk indicators, IP and dispatch nexuses, and re-brokering scenarios. Models chameleon-carrier indicators from sample data and surfaces mock report counts without live FreightGuard queries.

Scenario Policy Result:
Flags sample carriers with revoked or suspended authority as scenario blocked, and flags carriers with unsatisfactory safety ratings. Marks conditional scenario results for review; no authenticated sign-off is implemented.

Platform Integration and Event Bus:
Emits typed `CARRIER_SCENARIO_REVIEWED` and `CARRIER_SCENARIO_ATTESTED` events on the shared platform event bus without emitting carrier approvals or fabricated telematics alerts. Links carrier vetting parameters to the Command Center Portal (port 5170), Pricing HUD (port 5174), and HOS Planner (port 5175).

## Development and Verification

```bash
npm run dev
npm test
npm run build
```

## Audit Decisions and Boundaries

A step-up record is a self-attested local scenario with an identifier, not an authenticated signature or tamper-evident hash. It cannot change policy results or authorize tender. Existing stored history is retained. Malformed or unwritable history blocks a new save rather than discarding records. The application does not authenticate named people.

Scenario eligibility remains a three-state modeled outcome. Pricing handoff retains identity and scenario eligibility while operational flags remain false. The connected shipment stores modeled outcomes with seeded provenance, not operational permissions.

Driver records are sample data for their own DOT and are not asserted to belong to the carrier selected in the interface. The audit date is shown and initialized from the current date. Missing, invalid, future-dated, or pending checks cannot qualify a sample.

The response parser accepts only an explicitly injected transport; the default path makes no remote calls. Stored filings preserve provenance and never infer authority or compliance. The Vitest test suite stubs global fetch to prevent unexpected network requests.
