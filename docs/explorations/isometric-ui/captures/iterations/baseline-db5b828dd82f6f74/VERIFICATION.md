# Spatial study verification and remaining boundaries

Date: 2026-10-22. Human reviewer: Pranay. Current visual revision: `db5b828dd82f6f74`. Human approvals: zero recorded.

## Prepared collection

- 120 unique manifest cases, twelve in each of ten product/platform groups.
- 120 individual interactive routes and matching 1440 × 1024 PNG captures at the current visual revision.
- 120 thumbnails and ten contact sheets derived from those final captures, with SHA-256 and crop provenance.
- Six generated art-direction concepts, explicitly separated from the working technical studies.
- Thirty canonical proposed module IDs, matched across the map, manifest, brief and contract document.
- Actual 1440/834/390 px browser layout captures of selected HU 01 for PF-10; original full pages and viewport crops retained.

## Checks and observed outcomes

| Check | Observed outcome | Evidence boundary |
| --- | --- | --- |
| Host, responsive study and scene factory syntax | `node --check` passed. | Tier 2 / S1; isolated exploration source. |
| Scene construction | Specialist ran 120 cases at two phase/explode states, 240 builds, with finite bounds/anchors and targeted semantic assertions. Command, script and transcribed output retained in `captures/scene-construction-checks.json`. No exact run timestamp or source hash was retained; this limitation is explicit. | Agent-run Tier 2 / S1 synthetic construction evidence; no product engine claim. |
| Final complete gallery browser pass | 120 matching ready/painted IDs; zero recorded study errors; all 120 pending human review; every capture has revision `db5b828dd82f6f74`. | Direct isolated browser observation, Tier 4; no operational validity. |
| Package integrity | `verify-package.py` passed: 120 unique IDs, ten groups, source paths, current revision, ready/painted state, actual PNG headers/dimensions, SHA-256 custody and pending baseline decisions.120 unique image hashes. | Tier 2; S2 for format validation, which first caught JPEG bytes under PNG filenames and passed after proper PNG conversion. |
| Broad independent critique | All ten contact sheets reviewed; thirteen corrected full captures inspected; five clipped annotation cases rechecked after the shared sizing fix. | Screenshot review. See `QUALITY_REVIEW.md` for corrections and remaining data gaps. |
| CF-02 exact fixture editing | Current browser inputs 2 × 1.1 × 1.6 m and1,500 lb produced 3.52m³. Selection showed HU 01; Solid/X-ray/Structure controls changed active state. Evidence saved under `captures/iterations/CF-02-edited-fixture-final.*`. | Tier 4 isolated UI interaction. Earlier input-event defect has before/after regression evidence; physical mass/fit validation is not implied. |
| AS-05 exact fixture editing | Current browser inputs 14 × 2.3 × 2.5 m,5.8 m wheelbase and17,000 lb changed scene dimensions, annotations and returned fixture values. Body height is distinct from ground-to-top height. | Tier 4 isolated UI interaction, with edited PNG/JSON preserved. |
| Responsive layout and navigation | Actual CSS widths 1440/834/390 verified; page width matched each. HU 01 remained selected in all three PF-10 captures. At390px, searching WH-04 exposed one visible matching link and opened that study without horizontal overflow. | Browser emulation only. No physical-device or complete accessibility/performance claim. |
| Atlas navigation | Live atlas exposed120 technical tiles and six concepts. Search WH-04 returned one matching study; clearing restored 120. Final atlas capture retained. | Direct browser observation of this review index. |
| Review endpoint negative checks | GET revision and decisions 200; invalid case 400, stale revision 409, foreign origin 403. Current decisions are empty and no journal was created. | Tier 3 local HTTP negative checks; no successful human decision fabricated. |
| Related local implementation | Current Set the Light, Room v2 and visit-diorama-v2 source inspected read-only; historical local render and fresh Sael reference captures inspected. | Source and dated reference evidence; no approved quality-parity claim. |

## Capture custody and recovery

Browser control stalled intermittently during refresh. Rebinding the intended in-app browser recovered control. The native screenshot wrapper returned 1440×810 despite a 1440×1024 CSS viewport; it was excluded from the final set. The final pass used the tab screenshot API with an exact 1440×1024 CSS clip, and each file's decoded dimensions were checked independently.

That API returned JPEG bytes regardless of the `.png` target filename. The integrity check caught this. Original bytes are preserved under `captures/iterations/final-browser-originals/`, with original format/path/hash in each capture record. Delivered images are genuine PNG conversions, without resize or composition change. The SHA-256 index describes the delivered files. Earlier complete passes, label-fix comparisons and focused interaction captures remain in `captures/iterations/`.

`captures/capture-results.json` is the per-case capture authority; `captures/artifact-index.json` records image hashes and thumbnail crop bounds. `captures/package-checks.json` records the latest automated package result. All 120 final images match the current source/asset revision. Temporary viewport emulation is cleared before handoff.

## Remaining review and implementation limits

- The technical studies are first review candidates. No claim is made that all 120 meet Pranay's intended creative finish or the six generated concepts. Generated concepts are fictional visual directions, not implemented screens or numerical evidence.
- PR-12 supplies a four-hour difference without its direction/absolute durations. TR-06 supplies an 18-point total without factor allocation. Both remain explicit unresolved inputs in `QUALITY_REVIEW.md`.
- Some studies share geometry while expressing different overlays, relationships or sequences. Their usefulness remains a per-case human decision.
- Numeric editing works in CF-02 and AS-05. Orange handles do not implement pointer drag editing. Business transactions, reservations, scan verification, legality, carrier decisions and finance acceptance remain proposals.
- `FIXTURE` values describe the authored scene and declared inputs. `EXAMPLE` values are independent scenario inputs, not validated geometric output. Synthetic duty, insurance, money, mass, temperature, score and route values are not real-world proof.
- Some dense scenes issue thousands of draw calls. This review package does not establish a production resource budget, constrained-device support, physical-device behavior, keyboard equivalence or full accessibility.
- The review endpoint binds human decisions to source and responsive-image bytes. The successful write path has not been exercised with a fabricated human approval. Only Pranay can supply a real visual decision.
- No existing product runtime, solver correctness, HOS legality, carrier eligibility, live telemetry, provider status, production readiness or commercial outcome is inferred.

## Ownership, value and next decision

Only `docs/explorations/isometric-ui/` was authored for this work. Concurrent product changes belong to their existing owners. Related clinic/experiment sources were read only. The loopback review server uses 5195 and the existing Three.js package. No dependency installs, staging, commits, pushes, branches, deployments, provider writes or external messages were performed. All work remains local and uncommitted.

For Pranay, the package provides a complete named review space. For Trucking users, it explores easier dimensional, temporal and relationship understanding. For later engineering, it records reusable module boundaries, coordinate/data discrepancies and explicit integration prerequisites. The next decision is visual review by case/revision, followed by a separately selected product integration scope.
