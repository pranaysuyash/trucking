# Warehouse & Storage Research Findings

**Date:** 2026-11-05
**Note:** Live web verification was unavailable (tool rate limit exhausted until 2026-11-06). Findings below are synthesized from the audit citations and established domain knowledge. Live verification is a pending research task.

## G1 — CGST Act §35(2) / Rule 58 (warehouse/godown records)
- **Citation:** taxinformation.cbic.gov.in (per audit).
- **Summary:** Section 35(2) of the CGST Act and Rule 58 address records maintained by warehouse/godown owners and operators, including movement and item-wise, owner-wise identification.
- **Applicability depends on business arrangement:** Where an owner merely leases premises and the tenant controls inventory, the owner's record obligations differ from an operator who takes custody of goods. Must be established for the actual business arrangement before implementing compliance features.
- **Task:** Legal review of applicability for each P09 customer configuration. Do not auto-impose CGST record obligations on pure landlords.
- **Status:** Pending live verification + legal review.

## G2 — WDRA / eNWR (negotiable warehouse receipts)
- **Summary:** Warehousing Development and Regulatory Authority (WDRA) registration allows issuance of electronic Negotiable Warehouse Receipts (eNWR). Only registered warehouses may issue eNWR. Not every godown qualifies.
- **Implication:** WDRA/eNWR support should be an opt-in module for registered warehouses, not a default for all P09 facilities. Do not impose on every godown.
- **Status:** Pending live verification.

## G3 — FSSAI cold storage licensing
- **Summary:** FSSAI differentiates cold/refrigerated and controlled-atmosphere storage activities. Licensing obligations depend on the actual operator and activity (storage vs processing).
- **Implication:** P09/P06 must model licensing as activity-specific and operator-specific, not as a facility-wide flag. An old refrigeration room used as dry storage must be modeled as dry storage with historical refrigeration assets, not an active certified cold chamber.
- **Status:** Pending live verification.

## G4 — GS1 EPCIS 2.0 validation
- **Summary:** EPCIS 2.0 uses ObjectEvent with actions ADD/OBSERVE/DELETE. ADD represents commissioning (first observation of an EPC); OBSERVE represents a subsequent location observation. Routine putaway should use OBSERVE, not ADD.
- **Implemented:** P06 routine putaway now uses OBSERVE; ADD reserved for commissioning. Need a commissioning path for new EPCs. Full standard validation (identifiers, readPoint/bizLocation SGLN format) pending.
- **Status:** Partially implemented; full validation pending.

## G5 — Indian GST invoicing for rent (§194I TDS)
- **Summary:** Rent paid to a warehouse owner is subject to TDS under Section 194I (10% for land/building if PAN available; 20% if not). GST applies to commercial rent. Tenant pays TDS; owner claims credit.
- **Implication:** P09 rent ledger should track TDS deducted by tenant, GST on rent, and net receivable. Receipt/invoice generation must include GSTIN, TDS, and net amount.
- **Status:** Pending implementation (linked to C3 agreement/invoice generation, C11 receipts).

## G6 — Sheet Bharat portal
- **Summary:** National Centre for Cold-chain Development (NCCD) describes Sheet Bharat portal for discovering and booking cold-storage facilities and reefer vehicles.
- **Implication:** Do not build another generic cold-storage marketplace. Entry point is software that makes an existing storage business easier to run, with marketplace integrations later.
- **Status:** Defer marketplace; software-first.

## G7 — Indian warehouse receipt act / negotiable instruments
- **Summary:** Negotiable warehouse receipts are governed by the Warehousing (Development and Regulation) Act 2007 and related rules. Only registered warehouses issue negotiable receipts.
- **Implication:** Aligns with G2; eNWR is opt-in for registered warehouses only.
- **Status:** Pending live verification.

## G8 — Federal Bridge Formula (P01, reference only)
- **Summary:** Already implemented in P01 (bridge.ts). P06 should not duplicate; it consumes P01 manifests via OLLP-v1.
- **Status:** Already handled; no action.

## Research tasks still pending (live verification)
- [ ] G1 live CBIC verification
- [ ] G2 WDRA registration process details
- [ ] G3 FSSAI licensing application flow
- [ ] G4 Full GS1 EPCIS 2.0 identifier validation
- [ ] G5 TDS/GST invoice template compliance
- [ ] G6 Sheet Bharat API/integration possibilities
