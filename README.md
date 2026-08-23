# CesiumJS Heatbox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/hiro-nyon/cesium-heatbox/workflows/CI/badge.svg)](https://github.com/hiro-nyon/cesium-heatbox/actions)
[![Version](https://img.shields.io/github/package-json/v/hiro-nyon/cesium-heatbox?label=version)](https://github.com/hiro-nyon/cesium-heatbox/blob/main/package.json)
[![npm](https://img.shields.io/npm/v/cesium-heatbox)](https://www.npmjs.com/package/cesium-heatbox)

English | [日本語](README.ja.md)

A 3D voxel-based heatmap visualization library for [CesiumJS](https://cesium.com/cesiumjs/). Build volumetric heatmaps directly from existing Cesium Entities — no server-side processing or pre-tiling required.

## Live Demo

**Playground:** https://hiro-nyon.github.io/cesium-heatbox/

> Background tiles: CartoDB Light (OSM-based). Please respect tile usage policies under high traffic. The demo is served as static files on the `gh-pages` branch.

## Features

- **Entity-based** — builds directly from `Cesium.Entity` objects
- **True 3D voxels** — preserves vertical (altitude) distribution as volumetric boxes
- **Automatic ranging** — computes optimal bounding box and voxel sizing from data
- **Classification engine** — 7 schemes: linear / log / equal-interval / quantize / threshold / quantile / jenks
- **Spatial ID support** — METI-compliant tile-grid mode with Ouranos-GEX integration or built-in fallback
- **Time-dependent data** — sync heatmaps to Cesium's clock with global or per-time classification
- **Layer aggregation** — per-voxel breakdown by category, property, or custom resolver
- **Adaptive rendering** — density/coverage/hybrid selection, auto render budget, device-tier detection
- **Configuration profiles** — `mobile-fast`, `desktop-balanced`, `dense-data`, `sparse-data` presets
- **Performance overlay** — real-time FPS, render time, and memory monitoring

## Installation

### npm (Recommended)

```bash
npm install cesium-heatbox
```

### CDN

```html
<script src="https://unpkg.com/cesium-heatbox@latest/dist/cesium-heatbox.umd.min.js"></script>
```

### Build from Source

```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build
```

## Compatibility

- Minimum supported Cesium: `^1.120.0`
- CI validates both `cesium@^1.120.0` and `cesium@latest`

## Quick Start

```javascript
import { Heatbox } from 'cesium-heatbox';

const heatbox = new Heatbox(viewer, {
  voxelSize: 100,
  opacity: 0.8
});

// Create heatmap from entities
await heatbox.createFromEntities(viewer.entities.values);

// Fit camera to data bounds
await heatbox.fitView(null, { paddingPercent: 0.1, pitchDegrees: -35 });

// Inspect results
console.log(heatbox.getStatistics());
```

### Advanced runtime controls

The v0.1.12 runtime controls remain available for compatibility:

- `fitViewOptions.headingDegrees` and `fitViewOptions.pitchDegrees` control camera orientation.
- `outlineRenderMode` and `emulationScope` replace the deprecated `outlineEmulation` option.
- `performanceOverlay` can be changed later with `togglePerformanceOverlay()` or `setPerformanceOverlayEnabled()`.
- `getEffectiveOptions()` returns the normalized configuration currently in use.

## Key Capabilities

<details>
<summary><strong>Classification Engine</strong></summary>

Declarative color classification with 7 schemes. Supports multi-target control (color / opacity / width) via `classificationTargets` and adaptive parameter ranges.

```javascript
const heatbox = new Heatbox(viewer, {
  classification: {
    enabled: true,
    scheme: 'quantile',   // linear | log | equal-interval | quantize | threshold | quantile | jenks
    classes: 5,
    colorMap: ['#0f172a', '#1d4ed8', '#22d3ee', '#f97316', '#facc15'],
    classificationTargets: { color: true, opacity: true, width: true }
  },
  adaptiveParams: {
    boxOpacityRange: [0.35, 0.95],
    outlineWidthRange: [1, 5]
  }
});

await heatbox.createFromEntities(entities);

// Classification statistics
const stats = heatbox.getStatistics().classification;
console.log(stats.breaks);      // computed class breaks
console.log(stats.histogram);   // { bins, counts }

// Legend
const legendEl = heatbox.createLegend();
```

- `threshold` scheme requires an explicit `thresholds` array; other schemes derive breaks automatically.
- `colorMap` accepts color strings or stop objects `{ position, color }`.
- Statistics include `domain`, `quantiles`, `jenksBreaks`, `ckmeansClusters`, `histogram`, and `breaks`.
- Interactive demo: `examples/advanced/classification-demo.html`

See [API Reference — Classification](docs/API.md) for full details.

</details>

<details>
<summary><strong>Time-Dependent Data</strong></summary>

Sync voxel heatmaps to Cesium's clock with per-frame or throttled updates. Supports global classification (shared min/max across all time slices) or per-time recalculation.

```javascript
const heatbox = new Heatbox(viewer, {
  temporal: {
    enabled: true,
    data: [
      { start: '2024-01-01T00:00:00Z', stop: '2024-01-01T06:00:00Z', data: morningEntities },
      { start: '2024-01-01T06:00:00Z', stop: '2024-01-01T12:00:00Z', data: afternoonEntities }
    ],
    classificationScope: 'global',  // or 'per-time'
    updateInterval: 1000,           // ms throttle
    outOfRangeBehavior: 'clear',    // or 'hold'
    interpolate: true               // interpolate numeric properties across gaps
  }
});
```

- Overlap resolution: `prefer-earlier`, `prefer-later`, or `skip`
- Binary search + cache for efficient temporal lookup
- `updateValues()` reuses the current grid when temporal slices stay within the existing bounds
- `dataSource(currentTime, context)` can lazily provide additional temporal slices
- `useWorker: true` offloads interpolation and temporal stats preprocessing when workers are available
- Demos cover baseline playback, global/per-time comparison, scenario simulation, and advanced interpolation/lazy-loading flows
- Demos: `examples/temporal/README.md`

See [API Reference — Temporal](docs/API.md) for full details.

</details>

<details>
<summary><strong>Spatial ID Support</strong></summary>

Tile-grid mode using METI-compliant Spatial IDs (Ouranos-GEX) for geospatially-aware voxel placement.

```javascript
const heatbox = new Heatbox(viewer, {
  spatialId: {
    enabled: true,
    mode: 'tile-grid',
    provider: 'ouranos-gex',
    zoomControl: 'auto',
    zoomTolerancePct: 10
  },
  voxelSize: 30  // target voxel size (meters)
});
```

#### Provider

The official Ouranos-GEX provider is included in the distributed lazy chunks; no extra package installation is required. If a chunk cannot be loaded, Heatbox automatically uses its built-in Web Mercator fallback.

#### Zoom Level Reference

| Zoom | Cell Size (equator) | Use Case |
|------|---------------------|----------|
| 15   | ~1220 m             | Wide area |
| 20   | ~38 m               | City blocks |
| 25   | ~1.2 m              | Buildings / details |
| 30   | ~3.7 cm             | Ultra-precision |

#### Verification

```javascript
const stats = heatbox.getStatistics();
console.log(stats.spatialId.provider); // "ouranos-gex" with the official provider; null when using fallback
```

#### Troubleshooting

- When copying or self-hosting `dist/`, deploy the numbered lazy chunks together with the main ESM, CJS, or UMD bundle.
- Check the browser network log if statistics report `provider: null`; a missing lazy chunk triggers the built-in fallback.

#### Limitations

- Operates within ±85.0511° latitude (Web Mercator limit)
- Antimeridian crossing: planned for a future release

See [Spatial ID Examples](examples/spatial-id/README.md) for details.

</details>

<details>
<summary><strong>Layer Aggregation</strong></summary>

Aggregate entities within voxels by category, type, or custom logic. Each voxel tracks a per-layer breakdown and dominant layer.

```javascript
const heatbox = new Heatbox(viewer, {
  aggregation: {
    enabled: true,
    byProperty: 'buildingType',
    showInDescription: true,
    topN: 10
  }
});

await heatbox.createFromEntities(entities);
console.log(heatbox.getStatistics().layers);
// [{ key: 'residential', total: 5234 }, { key: 'commercial', total: 2103 }, ...]
```

#### Custom Resolver

```javascript
aggregation: {
  enabled: true,
  keyResolver: (entity) => {
    const hour = new Date(entity.timestamp).getHours();
    return hour < 12 ? 'morning' : 'afternoon';
  }
}
```

#### Best Practices

- Use categorical keys (avoid continuous values like timestamps or IDs)
- Keep unique layer count < 100 per voxel for optimal performance
- `keyResolver` should return strings; errors fall back to `'unknown'`

#### Performance

- Memory: ~8–16 bytes per unique layer per voxel
- Processing: ≤ +10% overhead when enabled; zero overhead when disabled

See [Aggregation Examples](examples/aggregation/README.md) for details.

</details>

## Why Heatbox?

| Strength | Description |
|----------|-------------|
| **True 3D** | Volumetric voxels preserve altitude information that 2D heatmap textures lose |
| **Entity-based** | Works directly with `Cesium.Entity` — no pre-tiling, server processing, or format conversion |
| **Zero infrastructure** | Pure client-side library; just `npm install` and go |

**When this may not fit:**
- Persistent rendering of hundreds of thousands to millions of voxels — consider GPU volume rendering or 3D Tiles
- Scientific continuous volumes (CT / CFD) — dedicated volume rendering techniques are more suitable

## API Overview

| Method | Description |
|--------|-------------|
| `new Heatbox(viewer, options)` | Create a new instance |
| `createFromEntities(entities)` | Create heatmap (async, returns statistics) |
| `setData(entities)` | Set data and render |
| `updateValues(entities, runtimeOptions?)` | Update data while reusing the current grid when possible |
| `updateOptions(newOptions)` | Update options and re-render |
| `setVisible(show)` | Toggle visibility |
| `clear()` | Clear heatmap |
| `destroy()` | Release all resources |
| `fitView(bounds?, options?)` | Fit camera to data bounds |
| `getStatistics()` | Get rendering statistics |
| `getDebugInfo()` | Get debug information |
| `createLegend(container?)` | Create interactive legend element |
| `Heatbox.listProfiles()` | List available configuration profiles (static) |
| `Heatbox.getProfileDetails(name)` | Get profile configuration details (static) |

See [API Reference](docs/API.md) for complete options and method documentation.

## Examples

| Category | Description | Location |
|----------|-------------|----------|
| Basic | Getting started | `examples/basic/index.html` |
| Classification | Color scheme demos | `examples/advanced/README.md` |
| Temporal | Time-dependent data | `examples/temporal/README.md` |
| Spatial ID | Tile-grid mode | `examples/spatial-id/README.md` |
| Aggregation | Layer breakdown | `examples/aggregation/README.md` |
| Rendering | Wireframe, height-based | `examples/rendering/README.md` |
| Performance | Adaptive, overlay | `examples/observability/README.md` |

## Documentation

**Start using the library**

- [Quick Start](docs/quick-start.md) — install and render your first heatbox in 10–15 minutes
- [API Reference](docs/API.md) — complete options, methods, and return types
- [Migration Guide](MIGRATION.md) — upgrade existing integrations

**Explore features**

- [Documentation Index](docs/README.md) — guides grouped by audience and task
- [GitHub Wiki](https://github.com/hiro-nyon/cesium-heatbox/wiki) — rendering strategies, performance, Spatial ID, pitfalls, and glossary
- [Roadmap](ROADMAP.md) and [Changelog](CHANGELOG.md)

**Understand the architecture**

- [Current Runtime Architecture](docs/adr/ADR-0019-v1.3.7-current-runtime-architecture.md) — ADR-0019: subsystem responsibilities, CesiumJS integration boundaries, and known limitations. Start here.
- [Rendering Architecture](docs/adr/ADR-0020-v1.3.0-incremental-entity-rendering.md) — ADR-0020: incremental Entity lifecycle and camera-aware render planning
- [Temporal Architecture](docs/adr/ADR-0021-v1.3.2-asynchronous-temporal-pipeline.md) — ADR-0021: asynchronous temporal pipeline and lightweight updates
- [ADR Index](docs/adr/README.md) — all architecture decision records, with status and implementation state

**Contribute and develop**

- [Development Environment Setup](docs/development-setup.md)
- [Development Guide](docs/development-guide.md)
- [Contributing](CONTRIBUTING.md)

## License

MIT License — see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
