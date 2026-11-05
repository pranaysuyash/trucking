# PER-RT-0210 — Chartered Accountant (Audit & GST)

**Role:** CA reviewing lease accounting and GST.
**Lens:** Audit trail, GST timing, revenue recognition.

## Key concerns
- Agreement date vs possession date vs billing start date must be distinct and auditable.
- Indefinite leases still need monthly revenue recognition entries.
- Proration must be documented with day counts.
- Deposit is a liability until adjusted/returned; must not be revenue.

## Acceptance criteria
- Each ledger entry records periodStart/periodEnd/dueDate and proration basis.
- Lease record retains agreementDate, depositDate, possessionDate, billingStartDate, endDate (if any).
- Terminations produce a final prorated ledger entry up to termination date.
- No revenue recognized before billing start date.