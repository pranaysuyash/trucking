# Product 06 — Carrier Safety & Compliance HUD

**Active Port:** `5178`  
**Sovereign Directory:** `products/product-06-carrier-safety/`

---

## Overview
Product 06 is an enterprise carrier compliance, safety intelligence, and fraud prevention HUD for freight brokers, 3PL dispatchers, and motor carrier safety directors. It models FMCSA Safety Measurement System (SMS) BASIC percentiles, Certificate of Insurance (COI) verification, and automated "Do Not Dispatch" (DND) fraud lockout rules to eliminate double-brokering and catastrophic risk.

---

## Core Capabilities

1. **FMCSA SMS BASIC Scoring Engine:**
   - Evaluates all 7 statutory Behavior Analysis and Safety Improvement Categories (BASICs): Unsafe Driving, Crash Indicator, Hours-of-Service Compliance, Vehicle Maintenance, Controlled Substances/Alcohol, Hazardous Materials, and Driver Fitness.
   - Enforces FMCSA intervention thresholds (65% for Unsafe Driving / Crash Indicator / HOS; 80% for Vehicle Maintenance / Drugs & Alcohol).

2. **Certificate of Insurance (COI) Verification:**
   - Audits Commercial Auto Liability against the statutory $1,000,000 minimum.
   - Audits Motor Truck Cargo insurance against standard $100,000 minimums.
   - Audits General Liability and evaluates underwriter A.M. Best ratings.
   - Automated expiration warnings (≤ 30 days) and expired policy lockout.

3. **Fraud & Double-Brokering Prevention Radar:**
   - Detects high double-brokering risk, IP / dispatch nexuses, and re-brokering schemes.
   - Identifies chameleon carriers (identity matches with previously revoked DOT entities).
   - Tracks unresolved FreightGuard and industry fraud reports.

4. **Automated "Do Not Dispatch" (DND) Lockout:**
   - Instantly blocks non-authorized carriers (REVOKED or SUSPENDED operating authority).
   - Blocks carriers with FMCSA UNSATISFACTORY safety ratings.
   - Issues conditional review gates requiring safety director sign-off.

5. **Cross-Project Platform Integration & Event Bus:**
   - Integrates with the platform `trucking-platform-bus` via `CARRIER_VETTED` and `SAFETY_ALERT` events.
   - Deep links carrier vetting parameters into Command Center Portal (`5170`), Pricing HUD (`5174`), and HOS Planner (`5175`).

---

## Development & Testing

```bash
# Start local development server on port 5178
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build
```
