# Spatial UI references and local reuse

Date: 2026-10-22, Asia/Kolkata. Owner: Pranay. Status: exploration, awaiting visual approval.

## Operator correction and scope

The operator asked for spatial exploration of everything in Trucking, including containers with dimensions, volume and mass, routes, money, time, evidence and status. Earlier advice to keep entire product areas in 2D was premature. Every documented case receives a spatial candidate before narrowing. Exact text and equivalent accessible representations remain part of the design, rather than reasons to exclude a case.

Order of work: document the complete map, create reviewable visuals for every case, ask Pranay to approve or revise them, and only then decide implementation. Visual approval does not authorize product integration, provider actions, Git mutations or deployment.

Further operator correction: the local Set the Light study was a short experiment, not a quality ceiling or approved art direction. It establishes available capability. Trucking studies must earn approval on their own composition, material detail, information clarity and interaction quality. No reference is an automatic visual target.

## Live primary references inspected

| Reference | Evidence acquired on 2026-10-22 | Transfer into Trucking |
|---|---|---|
| [Set the Mood](https://sael.net/interior/) | Live browser screenshot `references/sael-interior.png`; page interaction documentation | Cut-open composition, selectable objects, direct manipulation, visible feedback, materials and light with clear purpose. Transfer the interaction and composition, not clinic/interior styling. |
| [Swarm Floor Logistics Lab](https://sael.net/swarm-floor/) | Live browser screenshot `references/sael-swarm-floor.png`; live control/robot state observed | Facility geometry, selectable units, path/queue/safety layers, incidents, pause/step, fleet inspection. Strong reference for Warehouse and Yard. |
| [Supertankers and Dinghies](https://sael.net/supertankers/) | Current page text inspected | Data expressed as physical carrying capacity, explicit scale, labeled comparisons. Supports exploring monetary/volume/weight comparisons spatially. No claim of captured visual quality for this reference. |
| [Token Town](https://sael.net/token-town/) | Current page text inspected | Quantities and activity represented through a consistent spatial world; keep model-derived activity separate from measured values. No screenshot captured in this pass. |
| [Who Gets the Green?](https://sael.net/traffic/) | Current page text inspected | Route/time/queue consequence, comparison under common inputs, selecting a scenario changes the scene. No screenshot captured in this pass. |

### X and related exploration

The current Sael site links to [Ryan Sael on X](https://x.com/RyanSael). A direct fetch returned HTTP 403. Public searches for Ryan Sael, logistics, xmliszt and zafarlab were performed. Search results and third-party reposts are discovery leads, not proof of authorship, implementation, licensing or current availability. No login, post, message, like or follow was performed. The accessible first-party demos above provide stronger evidence for this exploration. The inaccessible X timeline is not reported as reviewed.

Existing Trucking references to xmliszt/laundro.cafe, Zafar Lab and 0x_fokki are preserved in `products/product-04-asset-studio/src/engine/vectorIsometric.ts` and the Cargo Fit isometric council document. Their mentions are historical reference leads, not permission to copy external assets or claims of fresh inspection.

## Existing local implementation found after operator pointer

### Standalone editor: In Good Light / Set the Light

Canonical current directory: `/Users/pranay/Projects/opus5.5-experiments/set-the-light/`.

Its README and `GAUNTLET_LOG.md` explain that it moved from `abhishek_bhaiya/docs/design/prototypes/set-the-light/`. The parent README warns that port 5432 belongs to Postgres. A fresh listener check found Postgres on 5432 and no preview on 5433/5434. No local reference service was started, stopped or changed during discovery.

Current source inspected:

| Source | Useful retained work | Scope of transfer |
|---|---|---|
| `js/main.js:72` | Renderer setup, PMREM room environment, tone mapping, controls, shadow policy, scene inspection and editing | Study the actual implementation; configure a Trucking presentation rather than importing the whole application. |
| `js/main.js:165` | Separate view/edit state, dirty rendering, shadow invalidation | Keep camera/selection separate from authoritative cargo or facility state. |
| `js/main.js:695` | Pointer interaction, keyboard operations, undo/redo, dimensions and opening tools | Useful interaction reference for cargo, doors, racks and equipment; domain validation must come from Trucking engines. |
| `js/main.js:818` | Controls-aware composition, camera resize and projected scene bounds | Place the model in the genuinely usable viewport, including responsive side panels. |
| `js/camera-fit.js:1` | Pure checked frustum/AABB fit and projected-focus helpers | A concrete local starting point for a shared camera fitting capability; coordinate/camera type adapters still needed. |
| `js/scene.js:1` | Parameterized cutaway scene, material identity, rounded geometry, item builders, selective owned-resource disposal | Transfer scene craft and ownership patterns; clinic furnishings and identity are outside Trucking scope. |
| `js/layout.js:5` | Versioned item/wall/opening data, stable IDs, height parameters, normalization, migration, storage/export | Strong precedent for one scene model with editable physical dimensions, rather than visual-only mesh state. |
| `tests/camera-fit.test.mjs` and related tests | Existing camera and layout checks | Inspected as source only. No fresh pass claim. |

Saved output inspected: `gauntlet/ours-v10-full-page.png`, showing the actual authored local room, lighting, material controls and callouts. This is historical rendered evidence, not a fresh runtime capture. Prior notes record unresolved device/fallback and visual-parity work. It is not described as approved Sael parity.

### Related port in abhishek_bhaiya

`/Users/pranay/Projects/abhishek_bhaiya/room-frontend/src/room-v2/` contains the related Room v2 experience. `three/scene.ts`, `three/materials.ts` and `three/textures.ts` explicitly record their provenance from Set the Light. This is a product-specific port with fixed material/daylight choices and an existing visitor journey. It is a reference, not a candidate to relocate or modify.

### Further local reusable mechanics

`/Users/pranay/Projects/opus5.5-experiments/visit-diorama-v2/src/` includes:

- `contactShadows.ts`: a low-cost contact-shadow pattern. Its footprint list belongs to the original room and must not be copied as Trucking geometry.
- `cameraMotion.ts`: bounded, interruptible scene transitions and current-target handling.
- `deviceTier.ts`: explicit user/device choices and a linear/simple alternative.
- `architecture.ts`, `interiorCraft.ts` and `professionalGallery.ts`: additional procedural scene craftsmanship.

## Preservation and evidence

All external project sources were read only. No clinic, experiment, credentials, patient data, provider or production state was changed. Read-only scoped Git status produced no modified paths for the inspected Room v2 and visitor-redesign subtrees. The experiments parent has no AGENTS.md; shared workspace instructions apply. Current source is Tier 1; saved local output is dated artifact evidence; the two new Sael screenshots are direct browser observations of those reference pages only.

## Visual review obligations

Each Trucking case needs a unique stable ID, its own review route and persisted image, clear synthetic-data labeling, exact visible quantities where relevant, and a Pranay decision. Reusing camera/rendering mechanics is encouraged; reusing a generic scene without expressing the case's actual question is insufficient. Preserve all first attempts and revisions. Do not mark a case approved from an agent critique, generated image, successful render or passing check.
