# Complete spatial refinement pass

**Current status, 30 Oct 2026:** All 120 browser captures and atlas derivatives match source revision `8e539f3c2c669d86`. The local package verifier passes; all human decisions remain pending. The first 24 original captures are JPEG and the remaining 96 are PNG, preserved with metadata under `captures/iterations/browser-8e539f3c2c669d86/`. Delivered PNGs retain composition and dimensions. `captures/capture-results.json` and `captures/artifact-index.json` record hashes and provenance.

The independent review of six `92ebb5edaabe240d` screenshots identified unclear warehouse alternatives, a misleading radial route boundary, remote waterfall labels and faint provenance links. Source changes distinguish the warehouse destination and alternatives, remove the route ring, label the waterfall blocks, and strengthen provenance relationships. The author inspected all four in the live browser and removed a warehouse label that overlapped an alternative. These observations are not a fresh independent re-critique or human approval. CF-02 and TM-03 had no blocking visual issue in the earlier independent review.

The capture refresh paused on 29 Oct at 24 cases when disk space fell to 383 MB free. It resumed on 30 Oct with 3.3 GB free. The remaining 96 studies were captured through the browser with matching painted IDs and revision, then derivatives were regenerated. All original and earlier baseline artifacts were preserved.

Date: 2026-10-23, Asia/Kolkata. Scope: isolated gallery, shared review modules, complete visual refresh and concrete integration proposal. All human decisions remain pending.

## Preserved baseline and source ownership

The complete earlier source and 120 captures at `f0e21e664830ec47` are preserved under `captures/iterations/baseline-f0e21e664830ec47/`. No product source, external project, Git state or provider record was changed by this pass. Concurrent product work remains under its existing owners.

## Implemented shared capabilities

| Module | Responsibility | M01-M30 relationship |
| --- | --- | --- |
| `gallery/presentation.mjs` | Bounded light/environment resources, contact shading, restrained post-processing, Studio/Simple rendering, demand-driven draws. Current installed Three uses PCFShadowMap; its removed PCFSoft alias was corrected after a browser warning. | M01, M16, M26 |
| `gallery/scene-kernel.mjs` | Shared synthetic physical/semantic primitives, cargo, containers, racks, vehicles, paths, measures and models; deterministic subject IDs scoped to their parents. Domain-specific case stories remain in scenes.mjs. | M03, M04, M06, M10, M12, M14 |
| `gallery/scene-craft.mjs` | Seeded, bounded material textures with metre-based UVs, rounded surfaces and batching within semantic owners. Transparent wrap parts batch only within their own subjects. | M03, M16, M26 |
| `gallery/camera-fit.mjs` | Aspect-aware orthographic fitting; explicit true-isometric and top presets. | M01, M04 |
| `gallery/annotations.mjs` | Projected dimensions, rail callouts, leaders and viewport clamping. Narrow screens use a separate readable annotation list. | M05, M25 |
| `gallery/selection.mjs` | Unique selectable subjects and ray-hit-to-owner resolution. Picker covers all subjects; Focus/Clear and linked details retain selection across scene-style changes. | M02, M25 |
| `gallery/fixture-editing.mjs` | Constrained dimensions, projected drag math and reversible gesture history. | M09, M27 |
| `gallery/review-state.mjs` | Current/stale decisions and submitted-context ownership. Context v2 adds rendering quality and annotation visibility to fixture/layer state. | M30 |

These are actual gallery modules, not adopted product packages. Product unit converters, policies, state and generator contracts remain canonical. `INTEGRATION_PROPOSAL.md` names the first bounded native-product pilot and the remaining adapter/validation work.

## Craft decisions and falsification

Lighting/materials are a logistics-specific application of the threejs-reference-polish method. The installed local Three.js API, local Set the Light source and first-party Sael pages were inspected. Sael's live visual page stalled in the original browser connection; it is not reported as a new captured reference. Primary pages remained readable. No Sael parity or human acceptance is claimed.

A first blind A/B critic preferred the refined candidate, then identified three gaps: small dimension labels, speckled straps and a crowded editing fold. The next candidate enlarged desktop dimension text to 11 px, removed the cargo/strap surface overlap, restrained wrap highlights, and reduced the stage/status-row height. Actual desktop action bounds are below y=988 in a 1024 px viewport. The current Isometric preset uses equal axes.

The first batching check compared conservative transformed AABBs and failed on a rotated document even though vertices remained inside the authored shape. The corrected check compares actual vertices, requires containment within the original envelope and bounds chamfer removal by the declared 25 mm radius. A second initial test used a nonexistent generic rack ID for WH-04; source inspection identified its actual preferred slot R01-B02-L02-A and the oracle was corrected. These are oracle corrections, not claimed implementation regressions.

The studio pass initially exposed cold module connection resets. Loopback service keep-alive and a 64-request queue corrected the observed reload failure. No product service was restarted. The original browser connector stalled and became unavailable; the available Chrome DevTools connector then provided actual local browser evidence.

## Evidence and current disposition

Eleven focused checks passed at the current revision after the craft changes, including all 120 finite-geometry/envelope/identity checks and actual ray-selection of batched cargo. Warehouse WH-04 went from 438 to 85 meshes before the final wrap refinement. This is a source-fixture mesh reduction, not a device performance benchmark. Raw output: `captures/iterations/craft-test-results-current.txt`.

Six desktop candidates and metadata are preserved as `captures/iterations/craft-round3-<ID>.*`. Blind review rounds and their source changes are retained. Current full-capture currency and final browser outcomes are owned by `captures/package-checks.json`, `captures/capture-results.json` and the completed verification report. Older images must not be described as current after source changes.

Current capture currency, browser provenance and limitations are recorded above and in `VERIFICATION.md`.

## Recovery and next human decision

Retain the complete baseline and all iterations. Reload the local review page after source changes. Start the loopback server with the existing README command. Do not create human approvals for testing. Review state v2 requires current presentation, fixture and layer state; older revisions remain stale.

The next human decision is per-case visual review, followed by selection of a specific integration scope. No product integration, deployment, provider write, commit or push is included in this pass.
