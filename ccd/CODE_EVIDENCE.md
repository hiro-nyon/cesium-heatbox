# Cesium Heatbox — Linked Code Evidence

All links in this document are pinned to immutable source commit [`32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c`](https://github.com/hiro-nyon/cesium-heatbox/tree/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c). Excerpts are intentionally short; the linked source is authoritative.

## 1. Time-aware Entity position and coordinate conversion

Heatbox evaluates a Cesium position Property at a `JulianDate`, converts the resulting `Cartesian3` to `Cartographic`, and expresses longitude and latitude in degrees for voxel bounds and indexing.

**Source:** [`src/core/CoordinateTransformer.js`, lines 32–61](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/CoordinateTransformer.js#L32-L61)

```js
const currentTime = Cesium.JulianDate.now();
// ...
if (typeof entity.position.getValue === 'function') {
  position = entity.position.getValue(currentTime);
} else {
  position = entity.position;
}
// ...
const cartographic = Cesium.Cartographic.fromCartesian(position);
lon = Cesium.Math.toDegrees(cartographic.longitude);
lat = Cesium.Math.toDegrees(cartographic.latitude);
alt = cartographic.height;
```

This is sampled evaluation, not continuous tracking: Heatbox does not create `CallbackProperty` or `SampledProperty` objects.

## 2. Spatial ID grouping becomes Cesium-sized voxel geometry

The optional Spatial ID path groups positions by ZFXY ID and retains each cell's eight geographic vertices. The renderer converts corner vertices to `Cartesian3` and uses Cesium distances for box dimensions.

**Source:** [`DataProcessor` Spatial ID record](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/DataProcessor.js#L554-L577), [`VoxelRenderer` dimension calculation](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/VoxelRenderer.js#L345-L352)

```js
const { zfxy, zfxyStr, vertices } = adapter.getVoxelBounds(lng, lat, alt, zoom);
// ...
bounds: vertices,
spatialId: { ...zfxy, id: zfxyStr },
// ...
cellSizeX = Cesium.Cartesian3.distance(v0, v1);
cellSizeY = Cesium.Cartesian3.distance(v0, v3);
baseCellSizeZ = Cesium.Cartesian3.distance(v0, v4);
```

This is 3D spatial grouping and visualization. It is not Cesium 3D Tiles generation or consumption.

## 3. Declarative Entity graphics and keyed lifecycle

`GeometryRenderer` creates voxel boxes through the Viewer's `EntityCollection`, attaches inspectable metadata, and retains a record keyed by voxel ID. Existing box Entities are updated rather than re-added.

**Source:** [`createVoxelBox`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/geometry/GeometryRenderer.js#L155-L213), [`syncVoxel`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/geometry/GeometryRenderer.js#L84-L106)

```js
const entityConfig = {
  position: Cesium.Cartesian3.fromDegrees(safeCenterLon, safeCenterLat, safeCenterAlt),
  box: boxConfig,
  properties: {
    type: 'voxel',
    key: voxelKey,
    count: voxelInfo.count,
    // ...
  },
  // ...
};
const entity = this.viewer.entities.add(entityConfig);

if (!record.boxEntity) {
  record.boxEntity = this.createVoxelBox(config);
} else {
  this._updateVoxelBox(record.boxEntity, config);
}
```

Incrementality is **partial**. Box Entities are updated in place, while active inset outlines and edge polylines are removed and recreated on each synchronization: [`_syncInsetRecord` and `_syncPolylineRecord`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/geometry/GeometryRenderer.js#L734-L784).

## 4. Camera-aware planning, with a static-mode refresh gap

Before synchronization, `RenderPlanner` applies an angular visibility approximation, scales the Entity budget with Camera height, and sorts by a weighted score. The planner reads Camera state only when a render pass runs.

**Source:** [`RenderPlanner.plan`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/render/RenderPlanner.js#L25-L40), [`angular filter`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/render/RenderPlanner.js#L122-L161)

```js
const visibleVoxels = this._cullByViewport(voxels, bounds, grid);
const budget = this._resolveDynamicBudget(safeBudget, bounds, grid, visibleVoxels.length);
const prioritized = [...visibleVoxels].sort((a, b) => {
  return this._comparePriority(a, b, topNVoxels, bounds, grid);
});
```

The filter is a centre-point direction-cone heuristic, not full frustum-plane, near/far, terrain, or occlusion culling. More importantly, `camera.changed` is bound by `TimeController` only, and `Heatbox` constructs that controller only when temporal mode is enabled: [`TimeController._bindCameraListener`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/temporal/TimeController.js#L88-L96), [`Heatbox` temporal initialization](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/Heatbox.js#L346-L349). Static Camera movement alone does not trigger re-planning.

## 5. Post-render Camera fitting

`fitView` defers Camera movement to a one-shot `scene.postRender` listener, then derives a `BoundingSphere` from geographic bounds and flies with a clamped `HeadingPitchRange`.

**Source:** [`fitView` post-render sequencing](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/Heatbox.js#L1217-L1251), [`_fitByBoundingSphere`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/Heatbox.js#L1263-L1281)

```js
const rect = Cesium.Rectangle.fromDegrees(bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat);
const bs = Cesium.BoundingSphere.fromRectangle3D(rect, Cesium.Ellipsoid.WGS84, Math.max(0, bounds.minAlt || 0));
// ...
await this.viewer.camera.flyToBoundingSphere(bs, {
  duration: 1.2,
  offset: new Cesium.HeadingPitchRange(heading, pitch, range)
});
```

The sphere uses the minimum altitude; vertical span influences the requested range. It is not an exact bounding volume for every 3D voxel corner.

## 6. Scene picking and InfoBox selection

A Cesium screen-space handler picks the scene, resolves Property values at the current Clock time, and sets `viewer.selectedEntity` to expose the selected voxel through the standard InfoBox path.

**Source:** [`Heatbox._initializeEventListeners`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/Heatbox.js#L988-L1014)

```js
const pickedObject = this.viewer.scene.pick(movement.position);
const currentTime = this.viewer.clock?.currentTime || Cesium.JulianDate.now();
// ... resolve voxel properties at currentTime ...
const dummyEntity = new Cesium.Entity({
  id: `voxel-${voxelKey}`,
  description: this.renderer.geometryRenderer.createVoxelDescription(voxelInfo, voxelKey)
});
this.viewer.selectedEntity = dummyEntity;
```

Selection is intentionally limited to Heatbox Entities whose resolved `type` is `voxel`.

## 7. Clock-driven temporal updates and concurrency guards

`TimeController` subscribes to `viewer.clock.onTick`. Asynchronous ticks receive monotonically increasing request IDs, so a late result is discarded. Rendering updates are serialized with one latest-value queue.

**Source:** [`Clock subscription`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/temporal/TimeController.js#L77-L85), [`stale-result rejection`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/temporal/TimeController.js#L152-L170), [`update coalescing`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/temporal/TimeController.js#L219-L267)

```js
const requestId = ++this._asyncTickRequestId;
const entry = await this._slicer.getEntryAsync(now);

if (!this._isActive || requestId !== this._asyncTickRequestId) {
  return;
}

if (this._updateInFlight) {
  this._queuedEntry = entry;
  this._hasQueuedEntry = true;
  return this._updateInFlight;
}
```

The fast update path reuses bounds and grid only when eligible; it still reclassifies data, recomputes statistics, and runs the diff renderer.

## 8. Lazy temporal loading and its synchronous-throw boundary

`TimeSlicer` performs direct lookup first, then uses one global in-flight Promise for an optional caller-supplied `temporal.dataSource` callback. This callback is not the Cesium `DataSource` API. Returned Promise rejections are logged and swallowed by the chain shown below.

**Source:** [`TimeSlicer.getEntryAsync`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/temporal/TimeSlicer.js#L239-L280), [`TimeController` async dispatch](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/temporal/TimeController.js#L128-L170)

```js
if (this._dataSource && !this._pendingLoad) {
    this._pendingLoad = Promise.resolve(
        this._dataSource(currentTime, {
            loadedEntries: this._entries.length,
            timeRange: this.getTimeRange()
        })
    )
        .then(result => {
            this._pendingLoad = null;
            this._mergeLoadedEntries(result);
        })
        .catch(error => {
            this._pendingLoad = null;
            Logger.warn('Temporal dataSource failed to provide data:', error);
        });
}
```

There is a material qualification: JavaScript evaluates `this._dataSource(...)` before calling `Promise.resolve`. A synchronous throw therefore bypasses this `.catch`; `TimeController` dispatches `_handleAsyncTick` with `void` and has no local catch around `await getEntryAsync`, so that case may become an unhandled rejection at the Cesium event boundary. Only a returned rejected Promise is contained by this chain.

The optional Web Worker is also limited to plain-data temporal preprocessing. Its generated protocol declares interpolation and statistics branches and contains no Cesium rendering API: [`TemporalWorkerScript`](https://github.com/hiro-nyon/cesium-heatbox/blob/32bdfcd8ce4e9e983f42deea222a9e1630e7ce5c/src/core/temporal/TemporalWorkerScript.js#L9-L39). At this commit, the generated script omits `calculateTemporalValueStats`, so its statistics branch is not operational. Entity creation, mutation, and removal remain on the main thread.

## Implementation scope

These excerpts document Entity lifecycle management, geographic coordinates, Camera and Scene integration, Clock/JulianDate temporal control, interaction, and budgeted planning. The implementation does not include custom GPU rendering, custom shaders or Appearances, a production Primitive backend, native 3D Tiles generation, full frustum/terrain/occlusion culling, unlimited-scale voxel rendering, or worker-side Cesium rendering.
