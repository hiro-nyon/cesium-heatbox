# Cesium Heatbox: Current Limitations

This document describes the verified boundaries of the current Cesium Heatbox runtime (version 1.3.7). It should be read together with the source code and the current architecture decision records. It distinguishes implemented behavior from capabilities that are not present or have not been validated in a real browser runtime.

## Rendering backend and scale

Heatbox renders voxels through Cesium's Entity API. Each voxel has a primary box Entity and may also have inset, frame, or polyline Entities, depending on the outline and styling options. The practical scale ceiling is therefore influenced by Cesium Entity count, the selected outline mode, host-application load, browser, device, and GPU.

The production renderer does not provide a `Primitive`, `GeometryInstance`, `Appearance`, custom-shader, GPU volume-rendering, or native 3D Tiles backend. Spatial ID support is an indexing and aggregation mode; it is not 3D Tiles generation or streaming. Heatbox also does not integrate with Cesium's `requestRenderMode` to request frames explicitly.

No sustained frame-rate, maximum voxel count, GPU-memory, or cross-device performance guarantee is published. Performance-oriented tests in the repository run against a Cesium mock and should not be interpreted as browser or GPU benchmarks.

## Camera-aware planning

The render planner uses camera height to select a budget band and uses a circular angular test around the camera direction to reject some voxel centres. This is a heuristic filter, not exact frustum-plane culling. It does not test near and far planes independently, use a rectangular horizontal/vertical frustum, perform terrain or GPU occlusion, or apply screen-space-error selection. Approximate voxel centres and incomplete camera fields can produce false inclusions or exclusions; when required camera inputs are unavailable, the planner degrades to a less selective path.

Camera-aware planning samples the camera when a render pass occurs. Temporal mode adds a throttled `camera.changed` listener that resubmits the latest time slice. Static datasets do not currently have an equivalent automatic camera-triggered replan, so moving the camera after a static render does not by itself recompute the planned voxel set. An application must cause another Heatbox render or update if it needs a new static plan.

Camera-height budget bands are workload heuristics, not geometric level of detail (LoD).

## Partial incremental rendering

The keyed frame protocol updates the primary box Entity in place when a voxel remains present, adds new records, and removes stale records. Incrementality is partial: active inset, frame, and thick-outline polyline auxiliaries are removed and recreated during synchronization. Options that change geometry or grouping can also require broader reconstruction. Stable identity of the primary box Entity should not be generalized to every Entity associated with a voxel.

## Temporal processing

Temporal playback is driven by Cesium Clock/JulianDate and supports interval lookup, interpolation, lazy loading, throttling, stale-result rejection, and one-slot update coalescing. The following boundaries apply:

- The production Worker path is used for numeric interpolation only. It does not render Cesium objects and Cesium is not loaded in the Worker.
- Temporal statistics are not wired into the production Worker path. In addition, the generated Worker statistics task currently references a helper that is not serialized into the Worker script, so that task is not operational as shipped. Statements that statistics are generally offloaded to a Worker are not accurate for the current runtime.
- **Known defect:** a `temporal.dataSource` callback that returns a rejected Promise is handled by the lazy-load path, but a callback that throws synchronously can escape before `Promise.resolve(...)` installs its rejection handler. Because the Clock tick entry point does not add an outer rejection boundary, this can surface as an unhandled rejection and disrupt temporal playback. Callbacks should return a rejected Promise instead of throwing synchronously until this is fixed.
- Interpolation pairs same-length arrays by index before falling back to identifier-based matching. Reordered inputs of equal length may therefore interpolate the wrong records unless ordering is stable.
- Lazy-loaded entries are accumulated without an eviction policy. The initially computed global classification domain is not automatically recomputed after later lazy-load merges.
- Stale slice resolutions are rejected, but an already-started render update is not cancelled. Some pending asynchronous work and one-shot render listeners have teardown gaps.

`temporal.dataSource` is a Heatbox callback API; it is not an integration with `Cesium.DataSource`.

## Coordinates and Spatial ID

Regular-grid processing converts Cesium Cartesian positions through Cartographic coordinates and then uses longitude, latitude, and altitude bins. It is an application-level voxel approximation rather than an exact geodetic volume model. Dataset extents that cross the antimeridian are not normalized as a single wrapped interval, so antimeridian-spanning inputs can produce an unexpectedly wide longitude extent.

Spatial ID mode uses a dynamically loaded provider when available and a project-authored ZFXY fallback otherwise. The fallback uses Web Mercator rules, including latitude clamping to approximately ±85.05112878 degrees, and uses approximate vertical bins. Neighbor lookup wraps the tile X index, but that does not remove the dataset-level antimeridian limitation. Provider and fallback behavior should be validated for the application's target zoom levels, altitude range, and boundary cases.

Spatial ID support must not be described as Cesium 3D Tiles generation, 3D Tiles consumption, or server-side tiling.

## Cesium compatibility and testing

Cesium is declared as a peer dependency and is externalized from the library bundles. The automated test suite maps `cesium` to a repository mock. CI dependency-matrix jobs install supported Cesium endpoints and run tests/build smoke checks, but they do not execute a real-Cesium WebGL browser matrix or visual regression suite.

Accordingly, a passing unit-test, build, or dependency-matrix job demonstrates application logic, package resolution, and bundle compatibility within those checks. It does not by itself prove runtime rendering correctness across all Cesium versions, browsers, GPUs, terrain providers, imagery providers, or device classes. The live Playground and representative host applications should be checked in real browsers for release-critical workflows.

## Capabilities outside the current implementation

The current source does not demonstrate:

- Cesium ion asset or token integration;
- native 3D Tiles generation, streaming, styling, or traversal;
- a Primitive, GeometryInstance, Appearance, or custom-shader renderer;
- GPU volume ray marching or instanced voxel rendering;
- terrain-aware, occlusion-aware, or screen-space-error visibility selection;
- a Cesium `DataSource` implementation or creation of `CallbackProperty`/`SampledProperty` objects;
- explicit `requestRenderMode` frame requests; or
- server-side tiling or backend infrastructure.

These exclusions describe the current project scope; they are not claims about what a host Cesium application may provide independently.
