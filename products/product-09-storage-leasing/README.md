# Product 09: Storage and Leasing Core

Port: 5181
Directory: `products/product-09-storage-leasing/`

## Overview

Storage and leasing management module for warehouse owners and operators. Covers Indian-warehouse-oriented multi-tenant property management, rentable unit allocation, GST-compliant rent ledgers, electricity submeter billing, preventative maintenance scheduling, and document management with audit integrity.

## Core Capabilities

Facility Registration:
Configures property metadata, total usable square footage, and rentable space boundaries with independent validation between property boundary areas and sum-of-spaces allocations.

Tenant and Lease Ledger:
Tracks tenant profiles, security deposits, lease terms, and recurring rental charges. Implements atomic payment recording with outbox persistence and offline fallback.

Submeter Utility Billing:
Records electricity meter readings across tariff slabs and computes tenant submeter consumption charges.

Maintenance and Inspection Engine:
Schedules preventative maintenance, logs work orders, records service tickets, and tracks resolution status across physical warehouse assets.

Platform Integration:
Emits ledger and facility events onto the platform bus and supports storage engine synchronization with `@trucking/storage-server` (port 5182) when active, falling back to local storage outbox queues.

## Development and Verification

```bash
npm run dev
npm test
npm run build
```

## Audit Decisions and Boundaries

Payment transactions require atomic ledger updates with monotonic timestamps. Offline queue operations preserve sequence order and prevent duplicate ledger posts upon reconnection.

Calculated occupancy metrics report both property boundary usable area and modeled spaces area transparently whenever discrepancies exist between modeled units and master property filings.
