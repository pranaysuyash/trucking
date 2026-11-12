# Product 07: Yard & Dock Management System

Local dev URL: `http://localhost:5179/`

Source directory: `products/product-07-yard-dock/`

## Overview

Product 07 is the Yard Management System (YMS) for the Trucking suite. It models gate check-in, dock door scheduling, drop lot spot allocation, carrier detention fee tracking, and yard jockey spotter moves.

## Core Capabilities

1. Facility Dock and Yard Layout
   - Interactive 2D Blueprint SVG and modular grid views.
   - Real-time status for refrigerated, dry van, and flatbed dock doors.
   - Drop lot staging spaces with trailer assignment and detention tracking.

2. Guard Shack Kiosk
   - Automated driver gate check-in with tractor plate and trailer validation.
   - ISO 17712 high-security bolt seal integrity check.
   - Digital gate pass generation with assigned door and yard routing instructions.

3. Live Carrier Detention Radar
   - Real-time tracking against the standard two-hour free time window.
   - Automated detention fee calculation at standard industry rates.
   - Overdue truck alerts and prioritize-unload dispatch recommendations.

4. Yard Jockey Spotter Work Orders
   - Queue management for yard hostler trailer relocation tasks.
   - Move dispatch from drop lot spots to available dock doors.
   - Turn-by-turn completion status logging.

5. Suite Interoperability
   - Direct bridges to Product 06 (Warehouse Putaway) and Product 08 (Carrier Trust).

## Development & Testing

```bash
# Start local development server on port 5179
npm run dev

# Run unit tests
npm test

# Build production bundle
npm run build

# Run typecheck
npm run typecheck
```
