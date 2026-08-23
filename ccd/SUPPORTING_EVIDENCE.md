# Cesium Heatbox: Supporting Evidence

The following evidence groups provide a compact route from the running project to its design decisions and implementation. Source links are pinned to the v1.3.7 implementation commit; architecture records are pinned to the reviewed documentation baseline.

## 1. Live Playground

- **URL status:** Public URL verified on 2026-08-23; the deployed interface reported version 1.3.7.
- **URL:** https://hiro-nyon.github.io/cesium-heatbox/playground/
- **What it shows:** Heatbox running inside an interactive Cesium Viewer, including three-dimensional voxel output and user-facing controls.
- **Qualification:** A live demonstration is runtime evidence only for the browser, data, options, and deployed revision that were actually exercised. It should not be treated as a cross-browser performance benchmark.

## 2. Source repository and architecture overview

- **URL status:** Existing public repository URL.
- **Repository:** https://github.com/hiro-nyon/cesium-heatbox
- **Project overview:** https://github.com/hiro-nyon/cesium-heatbox#readme
- **What it shows:** Source structure, public API examples, package metadata, development history, issue tracking, and the relationship between processing, rendering, temporal, and spatial modules.
- **Review note:** The implementation references below use commit-pinned URLs so they remain reproducible after branch changes.

## 3. Current runtime architecture record

- **URL status:** Commit-pinned repository URL.
- **ADR-0019:** https://github.com/hiro-nyon/cesium-heatbox/blob/8749fc1ee21f84cf2229c0bb0c6be919d60872fc/docs/adr/ADR-0019-v1.3.7-current-runtime-architecture.md
- **What it shows:** The current component boundaries, Cesium integration surface, data flow, decision history, and known limitations.
- **Qualification:** Where prose and executable source differ, the current source code is the runtime authority. In particular, blanket failure-containment and Worker-statistics statements require the qualifications in [Known Limitations](LIMITATIONS.md).

## 4. Rendering and temporal decision records

- **URL status:** Commit-pinned repository URLs.
- **ADR-0020 — incremental Entity rendering:** https://github.com/hiro-nyon/cesium-heatbox/blob/8749fc1ee21f84cf2229c0bb0c6be919d60872fc/docs/adr/ADR-0020-v1.3.0-incremental-entity-rendering.md
- **ADR-0021 — asynchronous temporal pipeline:** https://github.com/hiro-nyon/cesium-heatbox/blob/8749fc1ee21f84cf2229c0bb0c6be919d60872fc/docs/adr/ADR-0021-v1.3.2-asynchronous-temporal-pipeline.md
- **What they show:** Keyed add/update/remove synchronization, partial Entity identity preservation, camera-aware planning, Cesium Clock/JulianDate integration, stale-result handling, coalescing, lazy loading, interpolation, and Worker design.
- **Qualification:** The primary box Entity is incrementally updated, while some auxiliary Entities are recreated. The production Worker path performs interpolation only; generated Worker statistics are currently non-operational and not connected to the live path.

## 5. Direct code and test evidence

- **URL status:** Commit-pinned repository URLs.
- **Cesium integration and orchestration:** https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/Heatbox.js
- **Entity lifecycle:** https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/geometry/GeometryRenderer.js
- **Camera planner:** https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/render/RenderPlanner.js
- **Temporal controller and slicer:** https://github.com/hiro-nyon/cesium-heatbox/tree/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/temporal
- **Spatial ID modules:** https://github.com/hiro-nyon/cesium-heatbox/tree/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/spatial
- **Tests and Cesium mock:** https://github.com/hiro-nyon/cesium-heatbox/tree/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/test
- **What it shows:** The executable implementation behind the architectural claims and the automated tests for processing, rendering records, temporal state, spatial conversion, and interaction behavior.
- **Qualification:** Jest maps Cesium to a mock. These tests cover library logic but are not a real-WebGL or visual compatibility suite.

## 6. Package, examples, and continuous integration

- **URL status:** npm `latest` verified as 1.3.7 on 2026-08-23; repository URLs are commit-pinned.
- **npm package:** https://www.npmjs.com/package/cesium-heatbox
- **Examples:** https://github.com/hiro-nyon/cesium-heatbox/tree/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/examples
- **CI runs:** https://github.com/hiro-nyon/cesium-heatbox/actions
- **Package metadata:** https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/package.json
- **What it shows:** Reusable package distribution, example coverage, automated unit/build/documentation checks, and Cesium peer-dependency/build smoke jobs.
- **Qualification:** Published-package state should be checked immediately before use. The CI matrix validates install, mock-based tests, and builds; it does not run the full library against real Cesium/WebGL across the supported version range.

## Reproducibility note

The source and architecture-record URLs above are immutable commit references. Live pages, package registries, and CI listings remain mutable and should be checked at the time they are used.
