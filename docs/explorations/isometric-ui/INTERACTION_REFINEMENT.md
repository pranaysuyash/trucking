# Interaction refinement and capture handoff

Updated: 2026-10-23, Asia/Kolkata. Historical source and responsive-asset revision: `f0e21e664830ec47`. See `REFINEMENT_PASS.md` and `VERIFICATION.md` for the current revision.
Scope: isolated review gallery only. Human visual decisions remain pending.

## Implemented continuation

CF-02 now exposes length, width and height handles. AS-05 exposes deck length, body width, body height and tractor wheelbase handles. Enable **Edit dimensions** above the model. Dragging changes one declared measurement while preserving the camera. Exact numeric inputs remain available. Arrow keys change a handle by 0.01 m; Shift changes it by 0.10 m. One complete drag is one undo step. Redo, Escape cancellation and an undoable fixture reset are implemented.

The screen projection determines the movement along the physical axis. Centered length/width changes use twice the face displacement; body height and wheelbase use their fixed reference. A nearly camera-aligned axis declines the drag and offers the isometric preset or exact input. A viewport resize cancels the current drag. These are temporary synthetic-fixture edits, not canonical asset changes or physical validation.

Empty, invalid and nonfinite inputs retain the last valid geometry. The numeric fields are required, and invalid/incomplete text restores the last valid value on blur. Numeric typing preserves orbit/zoom; **Fit** is an explicit choice. **Back to model** returns from lower inspection controls without reloading or losing the current selection.

The atlas now reads real local review states, supports a review-status filter, refreshes saved decisions, and distinguishes current reviews from changed revisions. It explains that thumbnails show authored defaults when a saved review uses another fixture state.

## Review context and response ownership

Each decision requires a versioned `reviewContext` containing the editable fixture where applicable, the Solid/X-ray/Structure mode, sequence and layer separation. The local server validates that context before appending a human decision. A current-source saved review restores its fixture/layer state. If the current state differs, its badge says **Different view; saved review retained**. Camera orbit is an inspection control and is not part of the approval context. This records a visual-study decision, not product integration or an operational action.

A save response is checked against its submitted case ID and revision. A delayed response for case A can update A's stored record, and cannot badge the newly opened case B. Errors retain the unsaved user choice. No successful human decision has been created to test persistence.

## Evidence actually obtained

- `node --test gallery/interaction.test.mjs` passed six focused checks: projected movement, axis scaling/limits, history branching, current/stale status, fixture-context identity and delayed-response ownership, and rendered handle positions/multipliers.
- Source syntax checks passed for the host and helpers, including the atlas's extracted inline module.
- Actual browser pointer events changed cargo length from 1.2192 to 1.8438 m with an identical camera signature. Undo restored the entire gesture; redo reapplied it. Escape restored width, keyboard adjustments reached 1.41 m height, and reset was undoable.
- Actual browser wheelbase movement changed 6.1 to 7.3686 m while preserving the camera; undo restored 6.1 m. A top-view height handle declined an unusable axis. Invalid input recovery failed first, was corrected, then passed.
- An empty dimension and empty mass retained their last valid fixture values. Numeric edits preserved the camera. The evidence JSON is `captures/iterations/interaction-empty-input-and-camera.json`.
- At 390 px, a pointer height drag changed 1.3 to 1.5244 m without camera movement or horizontal overflow. The browser bridge does not support `Input.dispatchTouchEvent`; touch gestures and physical devices remain unverified.
- Updated PF-10 source layouts were captured at actual 1440/834/390 CSS widths with selected HU 01 and zero horizontal page overflow. Source revision and timestamps are in `references/responsive/metadata.json`.
- Local HTTP checks rejected missing context (400), invalid fixture context (400), stale source (409) and foreign origin (403). The decision endpoint returned an empty object and no decision journal existed.
- An independent source review identified four defects: fixture-unbound approval, wrong-case delayed response, empty inputs becoming zero and camera reset on numeric typing. All four were corrected and re-reviewed. This is source-review evidence; the successful human write/restore path remains unexercised.
- After capture recovery, a new CF-02 pointer drag changed length from 1.2192 to 1.9424 m, retained the identical camera signature and updated envelope volume to 2.5655 m³. Exact values and the full 1440 × 1024 screenshot are `captures/iterations/continuation-drag-proof.json` and `.png`.
- The current atlas showed 120 awaiting review and zero approved. Filtering Approved returned zero tiles; Pending plus WH-04 returned exactly WH-04; clearing restored 120 tiles and six concepts. Evidence: `captures/atlas-review-filter-checks.json`.

## Capture interruption and completed recovery

The earlier complete 120-image collection is preserved under `captures/iterations/baseline-db5b828dd82f6f74/`, including its source and metadata. Sixteen new current-revision captures were saved before the browser connection repeatedly stalled and finally returned **transport closed before response**. Rebinding, a fresh capture tab, module/network diagnostics and a direct PNG screenshot method were attempted. The local HTTP server continued to answer normally.

At the interruption, the canonical index explicitly recorded sixteen captures at `f0e21e664830ec47` and 104 preserved images at `db5b828dd82f6f74`. Artifact integrity passed, while the strict revision check correctly failed. This historical mixed-revision state was reported rather than hidden.

On continuation the browser connection recovered; the loopback server had stopped and was restarted. AS-05 through PF-12 were captured at the frozen source revision, after matching each `data-painted` ID. At that time all 120 canonical PNGs used 1440 × 1024 and revision `f0e21e664830ec47`. The staging journal is `captures/refinement-pass-results.jsonl`. Every browser original is preserved with format/path/hash, and the 120 thumbnails and ten contact sheets were regenerated. `verify-package.py` passes with 120 unique image hashes, no stale captures and no integrity errors. This establishes capture currency and custody, not creative approval.

## Ownership and next decision

Only `docs/explorations/isometric-ui/` changed. The local server remains on 127.0.0.1:5195. No product source, Git state, deployment, provider or external communication was changed. All work is local and uncommitted. Pranay can inspect the latest interactive studies now; visual approval and any later integration remain separate decisions.
