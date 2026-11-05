# Product 04 — Fleet & Cargo Asset Studio

## 1. Instruction Hierarchy & Governance
This directory governs Product 04 (Asset Studio) of the TRUCKING platform.
Precedence:
1. `/Users/pranay/AGENTS.md`
2. `/Users/pranay/Projects/AGENTS.md`
3. `/Users/pranay/Projects/trucking/AGENTS.md`
4. This file (`products/product-04-asset-studio/AGENTS.md`)
5. Local `OPERATING_DOCTRINE.md`

Compatibility symlinks (`CLAUDE.md`, `GEMINI.md`, `QWEN.md`) must point directly to this file.

---

## 2. Product Identity & Domain Boundary
- **Port:** `5176`
- **Focus:** Commercial vehicle & packaging digital twin catalog (20 vehicles & 23 packaging types), 3D WebGL (Three.js), 2.5D Isometric SVG, 2D Orthographic CAD blueprints, dynamic CG & multi-stop sequential unload simulator, multi-vehicle fleet splitter heuristic, temporal dynamics (fuel burn, range countdown, refuel stop flags), and Open Logistics Asset Schema v1.0 standard export.
- **Tech Stack:** React 19, TypeScript, Three.js, Vite 7, Vitest 3.

---

## 3. Sovereign Verification Commands
```bash
npm test        # Run 19 Vitest tests
npm run build   # Typecheck and production bundle build
npm run dev     # Start local server on port 5176
```

---

## 4. Cross-Project Bridges
- **Produces:** Dimensional specs and split loads to Product 01 (Cargo Fit · Port 5173); carrier specs to Product 02 (Freight Pricing · Port 5174); range parameters to Product 03 (HOS Planner · Port 5175).
- **Consumes:** Live telematics twin links from Product 05 (Fleet Telematics · Port 5177).

---

## 5. Git & Mutation Policy
- Read-only inspection is permitted (`git status`, `git diff`, `git log`).
- Staging, commits, pushes, and branch changes require explicit user authorization.
