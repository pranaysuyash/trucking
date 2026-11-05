# Trucking spatial exploration review package

Owner and human reviewer: Pranay. Prepared 2026-10-22. All 120 human decisions remain pending.

Start with the [visual atlas](index.html), then open a named study in `review.html?case=CF-02`. The gallery must be served over local HTTP so it can load the existing Three.js runtime. The loopback preview for this session is `http://127.0.0.1:5195/index.html`.

```sh
python3 -u docs/explorations/isometric-ui/server.py --port 5195
```

Run from the Trucking workspace. The server reads the already installed Three.js package in Product 04. No dependency installation or product app change is required. It binds only to `127.0.0.1`.

## Review order and scope

1. Read the [complete opportunity map](EXPLORATION_MAP.md) and [canonical 120-case manifest](cases.json).
2. Scan the six separately identified generated art-direction concepts and the 120 authored technical studies in the atlas.
3. Open any study, inspect the model and its declared values, and read the proposed product interaction and source prerequisites.
4. Pranay can approve a visual, request revision or defer it, with a note. Saving writes an append-only local `review-decisions.jsonl` entry tied to the visual revision. Existing decisions become stale when the visual changes.
5. Decide product integration after visual review. No study is promoted automatically.

The generated concepts are visual direction candidates. They contain fictional brands, annotations and interface details and are not implemented screens or numerical evidence. The authored technical studies are interactive 3D drawings with synthetic fixtures, not integrated product workflows. `FIXTURE` quantities describe the authored scene, including declared inputs; `EXAMPLE` quantities are scenario inputs that the drawing does not derive or validate.

Working shared controls are Solid, X-ray, Structure, orbit, zoom, fit, isometric/top view and semantic object inspection where subjects are supplied. Sequence and layer separation appear only for relevant study groups. CF-02 and AS-05 also have functioning exact fixture inputs; changing values rebuilds the authored geometry and its declared metrics. CF-02 computes envelope volume, and AS-05 exposes wheelbase and body height. PF-10 compares actual captured browser layouts at 1440/834/390 px, with HU 01 selected in each. Other described editors, reservations, transactions, legality checks and operational actions are proposed product behavior.

## Files and evidence

| Artifact | Purpose |
| --- | --- |
| `EXPLORATION_MAP.md` | Full opportunity inventory, observed source and proposed scope. |
| `DESIGN_BRIEF.md` | Visual intent, case acceptance questions and review rules. |
| `MODULES_AND_CONTRACTS.md` | Thirty reusable module proposals, unit/identity contracts and source discrepancies. |
| `REFERENCES_AND_LOCAL_REUSE.md` | Live primary research and inspected related local work. |
| `APPROVALS.md` | Baseline pending ledger; explicit human decisions are separate. |
| `captures/ID.png` | Individual browser review images, one per case. |
| `captures/capture-results.json` | Per-case observed state and exact capture revision. |
| `captures/artifact-index.json` | Image SHA-256, dimensions and thumbnail crop provenance. |
| `contact-sheets/GROUP.png` | Twelve studies per group for scanning. |
| `captures/iterations/` | Earlier full passes, individual revisions and the edited/mobile checks. |
| `QUALITY_REVIEW.md` | Independent critique, corrected semantic gaps and explicit unresolved fixture inputs. |
| `VERIFICATION.md` | Checks, limitations, proof levels and uncommitted state. |

All 120 delivered captures match current visual revision `db5b828dd82f6f74` and use 1440 × 1024 pixels. `captures/capture-results.json` records each painted case, revision and original browser file. The capture API returned JPEG bytes; originals are preserved under `captures/iterations/final-browser-originals/`, and delivered PNGs are format conversions without resize or composition changes. Earlier complete passes and individual corrections remain under `captures/iterations/`. Human decisions bind to the current source and responsive-image revision.

The related Set the Light and clinic studies were inspected as capability references. They are not approved quality targets. Trucking's direction is judged on its own decision clarity, scene craft and usability.

## Regenerate derivative atlas assets

`prepare-atlas.mjs` crops the already saved browser captures and creates thumbnails and ten contact sheets. It leaves original captures untouched and writes a hash index. It uses the bundled Sharp runtime, with `SPATIAL_REVIEW_SHARP` available to point to another installed package.

```sh
node docs/explorations/isometric-ui/prepare-atlas.mjs
```

No product source, Git state, provider, production data or external communication was changed by this review package. All work remains local and uncommitted.

## Verify the prepared package

```sh
PYTHONDONTWRITEBYTECODE=1 python3 docs/explorations/isometric-ui/verify-package.py
```

This checks 120 unique IDs, ten groups, source paths, current capture revision, painted readiness,PNG dimensions, SHA-256 custody and pending baseline decisions. It writes `captures/package-checks.json`. It is artifact integrity evidence, not human approval or operational validation. PR-12 service direction and TR-06 deduction allocation remain explicit unresolved inputs in `QUALITY_REVIEW.md`.
