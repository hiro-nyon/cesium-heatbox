# Cesium Heatbox — Technical Supporting Evidence

This directory collects public technical evidence for [Cesium Heatbox](https://github.com/hiro-nyon/cesium-heatbox), a client-side library that converts existing Cesium Entity data into altitude-preserving 3D voxel density visualizations. The material documents the implementation, its CesiumJS integration points, and its verified limits.

## Live demo

- [Cesium Heatbox Playground](https://hiro-nyon.github.io/cesium-heatbox/playground/) — interactive examples running in CesiumJS, including 3D voxel display, classification, Spatial ID scenarios, and temporal workflows.

## Technical evidence

- [Architecture Evidence](ARCHITECTURE_EVIDENCE.md) — simplified diagrams and explanations of the runtime pipeline, CesiumJS boundary, keyed Entity synchronization, camera integration, and temporal processing.
- [Selected Code Evidence](CODE_EVIDENCE.md) — focused, commit-pinned source references for coordinate conversion, Entity rendering, camera and scene lifecycle, Clock/JulianDate handling, picking, and asynchronous update control.
- [Supporting Evidence](SUPPORTING_EVIDENCE.md) — a curated route through the live project, architecture records, examples, package, and CI configuration.
- [Known Limitations](LIMITATIONS.md) — explicit boundaries of the current Entity-based implementation.

## Architecture decision records

- [ADR-0019 — Current Runtime Architecture and CesiumJS Integration](../docs/adr/ADR-0019-v1.3.7-current-runtime-architecture.md)
- [ADR-0020 — Incremental Entity Rendering and Camera-Aware Render Planning](../docs/adr/ADR-0020-v1.3.0-incremental-entity-rendering.md)
- [ADR-0021 — Asynchronous Temporal Data Pipeline and Lightweight Updates](../docs/adr/ADR-0021-v1.3.2-asynchronous-temporal-pipeline.md)

ADR-0019 is the entry point for the current v1.3.7 architecture. ADR-0020 and ADR-0021 provide deeper rendering and temporal context, including trade-offs and implementation limits.

## Project resources

- [Repository](https://github.com/hiro-nyon/cesium-heatbox)
- [npm package](https://www.npmjs.com/package/cesium-heatbox)
- [Examples](../examples/README.md)
- [API reference](../docs/API.md)
- [CI configuration](../.github/workflows/ci.yml)

## Scope

Heatbox uses Cesium's Entity API, camera, scene events, Clock and JulianDate, coordinate types, picking, and selected-Entity/InfoBox path. Its production renderer creates discrete box and polyline graphics through `viewer.entities`. It does not claim a custom shader or GPU volume renderer, a Primitive/GeometryInstance production backend, native 3D Tiles generation, exact frustum-plane or terrain-occlusion culling, or worker-side Cesium rendering. See [Known Limitations](LIMITATIONS.md) for the precise current scope.
