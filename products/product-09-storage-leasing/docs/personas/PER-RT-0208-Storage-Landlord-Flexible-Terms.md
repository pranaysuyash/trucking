# PER-RT-0208 — Storage Landlord (Flexible Terms)

**Role:** Property owner leasing warehouse/storage space.
**Lens:** Simplicity, cash flow, occupancy.

## Key concerns
- Renters often don't know their end date (month-to-month is common).
- Deposit may be collected weeks before possession; billing must start on possession, not deposit.
- Proration for partial first month is expected but must be unambiguous.
- Indefinite leases need a clear termination notice period, not a hard end date.

## Acceptance criteria
- Lease can be created with no end date (month_to_month / indefinite).
- Deposit date and billing start date are distinct from start/possession.
- First-period ledger prorates from billing start to month end.
- Termination requires notice date; space frees on termination date.