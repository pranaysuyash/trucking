# Product 09 — Storage & Leasing Core

## 1. Instruction Hierarchy & Governance
This directory governs Product 09 (Storage & Leasing Core) of the TRUCKING platform.
Precedence:
1. `/Users/pranay/AGENTS.md`
2. `/Users/pranay/Projects/AGENTS.md`
3. `/Users/pranay/Projects/trucking/AGENTS.md`
4. This file (`products/product-09-storage-leasing/AGENTS.md`)
5. Local `docs/ARCHITECTURE_AND_STORAGE_CORE_CONTRACT.md`

Compatibility symlinks (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`) must point directly to this file.

---

## 2. Product Identity & Domain Boundary
- **Port:** `5181`
- **Focus:** Property owner/landlord storage & leasing operations: facility registration, rentable spaces, tenants, leases, rent ledger, electricity meter readings, maintenance tasks, documents, and audit events. Indian-warehouse oriented (sq ft, GSTIN, meters, monsoon repairs).
- **Architectural principle:** Physical ownership (facility), possession (lease/allocation), and custody (goods in storage) are modeled separately. A landlord does not automatically need access to tenant SKUs.
- **Tech Stack:** React 19, TypeScript, Vite 7, Vitest 3.

---

## 3. Sovereign Verification Commands
```bash
npm test        # Run Vitest test suite
npm run build   # Typecheck and production bundle build
npm run dev     # Start local server on port 5181
```

---

## 4. Cross-Project Bridges
- **Consumes:**
  - `product-06-warehouse-space-flow` (Port 5178): spatial facility/space model and putaway engine (shared storage core).
- **Produces:**
  - `command-center-portal` (Port 5170): space occupancy, rent due, overdue, maintenance alerts.

---

## 5. Git & Mutation Policy
- Read-only inspection is permitted (`git status`, `git diff`, `git log`).
- Staging, commits, pushes, and branch changes require explicit user authorization.
