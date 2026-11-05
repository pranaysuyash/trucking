# Product 08 — Carrier Safety & Compliance HUD

## 1. Instruction Hierarchy & Governance
This directory governs Product 08 (Carrier Safety & Compliance HUD) of the TRUCKING platform.
Precedence:
1. `/Users/pranay/AGENTS.md`
2. `/Users/pranay/Projects/AGENTS.md`
3. `/Users/pranay/Projects/trucking/AGENTS.md`
4. This file (`products/product-08-carrier-trust/AGENTS.md`)
5. Local `OPERATING_DOCTRINE.md`

Compatibility symlinks (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`) must point directly to this file.

---

## 2. Product Identity & Domain Boundary
- **Port:** `5180`
- **Focus:** Carrier safety vetting, FMCSA SMS BASIC scoring & intervention threshold monitoring, Certificate of Insurance (COI) validation, chameleon carrier and double-brokering fraud detection, automated "Do Not Dispatch" (DND) lockout rules, and cross-platform safety event broadcasting.
- **Tech Stack:** React 19, TypeScript, Vite 7, Vitest 3.

---

## 3. Sovereign Verification Commands
```bash
npm test        # Run 12 Vitest tests
npm run build   # Typecheck and production bundle build
npm run dev     # Start local server on port 5180
```

---

## 4. Cross-Project Bridges
- **Produces:** Carrier vetting tiers and insurance verification to Product 02 (Freight Pricing · Port 5174); FMCSA HOS BASIC intervention status to Product 03 (HOS Planner · Port 5175); Do Not Dispatch (DND) lockout flags to Command Center Portal (Port 5170).
- **Consumes:** Order carrier assignments from Command Center Portal; live safety violations from HOS Planner (Port 5175) and Fleet Telematics (Port 5177).

---

## 5. Git & Mutation Policy
- Read-only inspection is permitted (`git status`, `git diff`, `git log`).
- Staging, commits, pushes, and branch changes require explicit user authorization.
