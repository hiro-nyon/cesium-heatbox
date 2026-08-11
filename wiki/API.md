<!-- Generated from docs/API.md by npm run wiki:sync. Edit the canonical source, not this page. -->

# API Reference (APIリファレンス) - v1.3.7-alpha.4

[English](#english) | [日本語](#日本語)

## English

### Heatbox Class

#### Constructor

##### `new Heatbox(viewer, options)`

Creates a new Heatbox instance.

**Parameters:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewer instance
- `options` (Object, optional) - Configuration options

**Options (v1.0.0 compatible):**
- `voxelSize` (number, default: 20) - Target voxel size (meters). Actual rendering dimensions use real cell sizes `cellSizeX/Y/Z` based on grid division, which may be smaller than `voxelSize` (to prevent overlaps).
- `opacity` (number, default: 0.8) - Data voxel opacity (0.0-1.0)
- `emptyOpacity` (number, default: 0.03) - Empty voxel opacity (0.0-1.0)
- `showOutline` (boolean, default: true) - Show outline
- `showEmptyVoxels` (boolean, default: false) - Show empty voxels
- `minColor` (Array, default: [0, 32, 255]) - Minimum density color (RGB)
- `maxColor` (Array, default: [255, 64, 0]) - Maximum density color (RGB)
- `maxRenderVoxels` (number|'auto', default: 50000) - Maximum render voxel count. v0.1.9: `'auto'` enables device-based Auto Render Budget
- **`wireframeOnly` (boolean, default: false) - Wireframe only display (v0.1.2 new feature)**
- **`heightBased` (boolean, default: false) - Express density as height (v0.1.2 new feature)**
- **`outlineWidth` (number, default: 2) - Outline thickness (v0.1.2 new feature)**
- **`debug` (boolean | { showBounds?: boolean }, default: false) - Log control and bounds display (v0.1.5 expanded to object format)**
- **`autoVoxelSize` (boolean, default: false) - v0.1.4: Auto-determine voxel size. Effective when `voxelSize` is not specified**
- **`autoVoxelSizeMode` ('basic'|'occupancy', default: 'basic') - v0.1.9: Auto voxel size calculation method. 'occupancy' uses occupancy-based estimation**
- **`autoVoxelTargetFill` (number, default: 0.6) - Target occupancy ratio used by `autoVoxelSizeMode: 'occupancy'`**
- **`colorMap` ('custom'|'viridis'|'inferno', default: 'custom') - v0.1.5: Perceptually uniform color maps**
- **`diverging` (boolean, default: false) / `divergingPivot` (number, default: 0) - v0.1.5: Diverging color scheme for bipolar data**
- **`highlightTopN` (number|null, default: null) / `highlightStyle` ({ outlineWidth?: number; boostOpacity?: number; boostOutlineWidth?: number }) - Highlight top N voxels. `boostOutlineWidth` is added to the highlighted outline width**
- **`profile` ('mobile-fast'|'desktop-balanced'|'dense-data'|'sparse-data') - Start from a predefined configuration profile; explicitly supplied options take precedence**
- **`voxelGap` (number, default: 0) - Gap between voxel dimensions in meters**
- **`outlineOpacity` (number, default: 1.0) - Outline opacity from 0 to 1**
- **`outlineWidthResolver` ((params) => number|null, default: null) - Per-voxel outline-width resolver**
- **`outlineInset` (number, default: 0) / `outlineInsetMode` ('all'|'topn'|'none', default: 'all') - Inset outline offset and target scope**
- **`outlineRenderMode` ('standard'|'inset'|'emulation-only', default: 'standard') / `emulationScope` ('off'|'topn'|'non-topn'|'all', default: 'off') - Outline rendering mode and emulation scope**
- **`adaptiveOutlines` (boolean, default: false) / `outlineWidthPreset` ('thin'|'medium'|'thick'|'adaptive', default: 'medium') - Adaptive outline controls**
- **`performanceOverlay` (Object|null, default: null) - Optional FPS/render-time/memory overlay configuration**
- **`enableThickFrames` (boolean, default: false) - Fill the space between standard and inset outlines to emulate thick frames**
- **`renderLimitStrategy` ('density'|'coverage'|'hybrid', default: 'density') - v0.1.9: Adaptive rendering strategy for voxel selection when exceeding maxRenderVoxels**
- **`minCoverageRatio` (number, default: 0.2) - v0.1.9: Minimum coverage ratio for hybrid strategy**
- **`coverageBinsXY` (number|'auto', default: 'auto') - v0.1.9: Number of XY bins for stratified coverage sampling**
- **`renderBudgetMode` ('manual'|'auto', default: 'manual') - v0.1.9: Use Auto Render Budget when 'auto'**
- **`autoView` (boolean, default: false) - v0.1.9: Automatically execute fitView after data loading**
- **`fitViewOptions` (Object) - v0.1.9: Default options for fitView method**
  - `headingDegrees` (number, default: 0) - Camera heading (degrees)
  - `pitchDegrees` (number, default: -30) - Camera pitch (degrees)
  - `paddingPercent` (number, default: 0.1) - Padding ratio around data bounds
  - `altitudeStrategy` ('auto'|'manual', default: 'auto') - In `auto`, include the altitude span when determining camera range; `manual` uses the padded horizontal bounds only
- **`adaptiveParams` (Object) - Adaptive outline and opacity controls**
  - `neighborhoodRadius` (number, default: 30) - Neighbor sampling radius in meters
  - `densityThreshold` (number, default: 3) - Density threshold in entities per voxel
  - `cameraDistanceFactor` (number, default: 0.8) - Camera-distance compensation factor
  - `overlapRiskFactor` (number, default: 0.4) - Overlap-risk factor used by diagnostics
  - `minOutlineWidth` / `maxOutlineWidth` (number, defaults: 1 / 5) - Compatibility aliases normalized to `outlineWidthRange` when both are supplied
  - `outlineWidthRange` ([number, number]|null, default: null) - Min/max adaptive outline width
  - `boxOpacityRange` / `outlineOpacityRange` ([number, number]|null, default: null) - Min/max adaptive opacity ranges
  - `adaptiveOpacityEnabled` (boolean, default: false) - Reserved compatibility flag; resolver APIs continue to work until adaptive opacity is fully provided
  - `zScaleCompensation` (boolean, default: true) - Enable Z-scale compensation
  - `overlapDetection` (boolean, default: false) - Enable overlap diagnostics
- **`spatialId` (Object) - Spatial ID tile-grid configuration**
  - `enabled` (boolean, default: false) - Enable Spatial ID mode
  - `mode` ('tile-grid', default: 'tile-grid') - Spatial grid mode
  - `provider` ('ouranos-gex', default: 'ouranos-gex') - Spatial ID provider
  - `zoom` (number|'auto', default: 25) - Zoom level from 0 to 35, or automatic selection
  - `zoomControl` ('auto'|'manual', default: 'auto') - Automatic or explicit zoom control
  - `zoomTolerancePct` (number, default: 10) - Allowed size error for automatic zoom selection
- **`aggregation` (Object) - Per-layer aggregation configuration**
  - `enabled` (boolean, default: false) - Enable layer aggregation
  - `byProperty` (string|null, default: null) - Entity property used as the layer key
  - `keyResolver` ((entity) => string|null, default: null) - Custom key resolver; takes precedence over `byProperty`
  - `showInDescription` (boolean, default: true) - Include layer breakdown in voxel descriptions
  - `topN` (number, default: 10) - Maximum number of layers returned by `getStatistics()`
- **`classification` (string | ClassificationOptions | false) - v1.1.0: Declarative classification engine (`linear`/`log`/`equal-interval`/`quantize`/`threshold`/`quantile`/`jenks`) with multi-target control (color / opacity / width). When `false`, the legacy min/max interpolation is used. See [ClassificationOptions](#classificationoptions-v110).**
- **`temporal` (TemporalOptions|null) - v1.2.0/v1.3.x: Built-in Cesium clock synchronisation. Supports `classificationScope`, throttling, overlap policies, numeric interpolation across gaps, and optional lazy loading via `dataSource`.**

The deprecated `boxOpacityResolver` and `outlineOpacityResolver` APIs still execute for compatibility. Prefer `adaptiveParams.*Range` for declarative ranges, but do not remove resolver usage until an equivalent adaptive-opacity path is available and documented.

#### Methods

##### `createFromEntities(entities)`

Asynchronously creates a heatmap from an entity array.

**Parameters:**
- `entities` (Array<Cesium.Entity>)

**Returns:**
- `Promise<HeatboxStatistics>`

##### `setData(entities)`

Creates heatmap data from entity array and renders it.

**Parameters:**
- `entities` (Array<Cesium.Entity>) - Target entity array

**Returns:**
- `Promise<void>` - Resolves after rendering completes; invalid or empty input clears the heatmap

**Example:**
```javascript
await heatbox.setData(viewer.entities.values);
```

##### `updateValues(entities, runtimeOptions?)` (v1.3.x)

Updates voxel data while reusing the current bounds/grid when the new data still fits the existing spatial envelope.

**Parameters:**
- `entities` (Array<Cesium.Entity>) - Target entity array
- `runtimeOptions` (Object, optional) - Internal/runtime overrides such as `_externalStats`

##### `updateOptions(newOptions)`

Updates options and re-renders existing heatmap.

**Parameters:**
- `newOptions` (Object) - New options

##### `setVisible(show)`

Toggles heatmap visibility.

**Parameters:**
- `show` (boolean) - true to show

##### `clear()`

Clears heatmap and resets related resources.

##### `destroy()`

Destroys Heatbox instance and releases allocated resources.

##### `dispose()`

Compatibility alias for `destroy()`. It releases the same renderer, event-listener, overlay, legend, and temporal-controller resources.

##### `getStatistics()`

Gets current heatmap statistics.

**Returns:**
- `HeatboxStatistics|null` - Statistics object or null if data not created.

When `aggregation.enabled` is true, the result includes `layers`, sorted by total entity count and limited by `aggregation.topN`. The `spatialId` object reports whether Spatial ID mode is active, the provider, resolved zoom, zoom-control mode, and optional edge-case QA metrics.

##### `getOptions()`

Returns a shallow snapshot of the current normalized options.

**Returns:** `HeatboxOptions`

##### `getEffectiveOptions()`

Returns a serialization-safe snapshot of the normalized options currently used by the renderer. Functions or other non-JSON values fall back to a shallow copy.

**Returns:** `HeatboxOptions`

##### `getDebugInfo()`

Returns current options, bounds, grid information, statistics, and auto-voxel-size diagnostics when enabled.

**Returns:** `HeatboxDebugInfo`

##### `togglePerformanceOverlay()` / `showPerformanceOverlay()` / `hidePerformanceOverlay()`

Controls the optional runtime performance overlay. `togglePerformanceOverlay()` returns the new visibility state, or `false` when the overlay is not initialized.

##### `setPerformanceOverlayEnabled(enabled, options?)`

Creates, shows, hides, or reconfigures the performance overlay at runtime.

**Parameters:**
- `enabled` (boolean) - Desired enabled state
- `options` (PerformanceOverlayConfig, optional) - Overlay configuration updates

**Returns:** `boolean` - Current enabled state

##### `fitView(bounds, options)` (v0.1.9, updated v0.1.12)

Automatically adjusts camera position to optimally view the heatmap data.

**Parameters:**
- `bounds` (Object, optional) - Custom bounds. If not specified, uses data bounds
  - `minLon`, `maxLon`, `minLat`, `maxLat`, `minAlt`, `maxAlt` (number) - Boundary coordinates
- `options` (Object, optional) - Camera positioning options
  - `headingDegrees` (number, default: 0) - Camera heading in degrees
  - `pitchDegrees` (number, default: -30) - Camera pitch in degrees
  - `paddingPercent` (number, default: 0.1) - Padding ratio around bounds

**Returns:**
- `Promise<void>` - Completes when camera movement finishes

**Example:**
```javascript
// Basic usage - fit to all data
await heatbox.fitView();

// Custom camera angle (v0.1.12 naming)
await heatbox.fitView(null, {
  headingDegrees: 45,
  pitchDegrees: -60,
  paddingPercent: 0.2
});

// Fit to specific area
await heatbox.fitView({
  minLon: 139.7, maxLon: 139.75,
  minLat: 35.65, maxLat: 35.72,
  minAlt: 0, maxAlt: 200
});
```

##### `getBounds()`

Gets current heatmap bounds information (latitude/longitude).

**Returns:**
- `Object|null` - Bounds information object or null if data not created.

##### `createLegend(container?)`

Creates or reuses a classification legend and renders the current classifier state.

**Parameters:**
- `container` (HTMLElement, optional) - Parent container; defaults to the document body

**Returns:** `HTMLElement|null`

##### `updateLegend()`

Refreshes an existing legend from the current classifier and classification options.

##### `destroyLegend()`

Removes the legend DOM and releases its internal resources.

#### Static Methods

##### `Heatbox.listProfiles()`

Returns the names of available configuration profiles.

**Returns:** `Array<'mobile-fast'|'desktop-balanced'|'dense-data'|'sparse-data'>`

##### `Heatbox.getProfileDetails(name)`

Returns a profile configuration and description, or `null` for an unknown name.

##### `Heatbox.filterEntities(entities, predicate)`

Filters entity array with arbitrary condition function.

**Returns:**
- `Array<Cesium.Entity>`

### Type Definitions

#### HeatboxStatistics

```typescript
interface HeatboxStatistics {
  totalVoxels: number;        // Total voxel count (including empty)
  renderedVoxels: number;     // Rendered voxel count
  nonEmptyVoxels: number;     // Non-empty voxel count
  emptyVoxels: number;        // Empty voxel count
  totalEntities: number;      // Total entity count
  minCount: number;           // Minimum entity count per voxel
  maxCount: number;           // Maximum entity count per voxel
  averageCount: number;       // Average entity count per voxel
  // v0.1.4 auto voxel size adjustment info
  autoAdjusted?: boolean;
  originalVoxelSize?: number | null;
  finalVoxelSize?: number | null;
  adjustmentReason?: string | null;
  // v0.1.9 selection + budget meta
  selectionStrategy?: 'density'|'coverage'|'hybrid';
  clippedNonEmpty?: number;   // Number of non-empty voxels clipped by limit
  coverageRatio?: number;     // Effective ratio of coverage selection (hybrid)
  renderBudgetTier?: 'low'|'mid'|'high';
  autoMaxRenderVoxels?: number; // Auto budget decided maxRenderVoxels
  occupancyRatio?: number | null; // renderedVoxels / maxRenderVoxels (if numeric)
  layers?: Array<{ key: string; total: number }>;
  spatialId?: {
    enabled: boolean;
    provider: string | null;
    zoom: number | null;
    zoomControl: 'auto' | 'manual' | null;
    edgeCaseMetrics: object | null;
  };
}
```

#### Spatial ID and Aggregation Examples

```javascript
const heatbox = new Heatbox(viewer, {
  spatialId: {
    enabled: true,
    mode: 'tile-grid',
    zoom: 'auto',
    zoomControl: 'auto'
  },
  aggregation: {
    enabled: true,
    byProperty: 'layer',
    topN: 5
  }
});

await heatbox.setData(entities);
const { spatialId, layers } = heatbox.getStatistics();
```

#### TemporalDataEntry (v1.2.0)

```typescript
interface TemporalDataEntry {
  start: Cesium.JulianDate | string | Date | number;
  stop: Cesium.JulianDate | string | Date | number;
  data: Array<Cesium.Entity | { id?: string; position: Cesium.Cartesian3; properties?: any }>;
}
```

#### TemporalOptions (v1.2.0)

```typescript
interface TemporalOptions {
  enabled?: boolean;                // Enable temporal controller (default false)
  data: TemporalDataEntry[];        // Ordered slices
  classificationScope?: 'global'|'per-time';
  updateInterval?: 'frame' | number; // 'frame' or milliseconds
  outOfRangeBehavior?: 'clear'|'hold';
  overlapResolution?: 'skip'|'prefer-earlier'|'prefer-later';
  interpolate?: boolean;            // Interpolate numeric values across gaps
  dataSource?: (currentTime, context) => Promise<TemporalDataEntry[]|TemporalDataEntry|null> | TemporalDataEntry[] | TemporalDataEntry | null;
  useWorker?: boolean;              // Run interpolation/stat preprocessing in a worker when available
}
```

### Utility Functions

#### `createHeatbox(viewer, options)`

Helper function to create a Heatbox instance.

#### `getAllEntities(viewer)`

Gets all entities from specified viewer.

#### `generateTestEntities(viewer, bounds, count)`

Generates test entities for testing purposes.

#### `getEnvironmentInfo()`

Gets environment information such as library version and WebGL support status.

### Error Handling

Common errors include: no target entities, invalid CesiumJS Viewer, voxel count exceeding limits, and WebGL not supported. See Japanese section for detailed solutions.

### Performance Considerations

- **Recommended entity count**: 500-1,500
- **Recommended voxel size**: 20-50 meters
- **Max voxel count**: Under 50,000

See Japanese section for complete performance optimization tips.

## 日本語

### Heatbox クラス

#### コンストラクタ

#### `new Heatbox(viewer, options)`

新しいHeatboxインスタンスを作成します。

**パラメータ:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewerインスタンス
- `options` (Object, optional) - 設定オプション

**オプション（v0.1.7 以降）:**
- `voxelSize` (number, default: 20) - 目標ボクセルサイズ（メートル）。実際の描画寸法はグリッド分割数に基づく各軸の実セルサイズ `cellSizeX/Y/Z` を使用し、`voxelSize` 以下になる場合があります（重なり防止のため）。
- `opacity` (number, default: 0.8) - データボクセルの透明度 (0.0-1.0)
- `emptyOpacity` (number, default: 0.03) - 空ボクセルの透明度 (0.0-1.0)
- `showOutline` (boolean, default: true) - アウトライン表示の有無
- `showEmptyVoxels` (boolean, default: false) - 空ボクセル表示の有無
- `minColor` (Array, default: [0, 32, 255]) - 最小密度の色 (RGB)
- `maxColor` (Array, default: [255, 64, 0]) - 最大密度の色 (RGB)
- `maxRenderVoxels` (number|'auto', default: 50000) - 最大描画ボクセル数。`'auto'` で端末別の自動レンダリング予算を有効化
- **`wireframeOnly` (boolean, default: false) - 枠線のみ表示（v0.1.2新機能）**
- **`heightBased` (boolean, default: false) - 密度を高さで表現（v0.1.2新機能）**
- **`outlineWidth` (number, default: 2) - 枠線の太さ（v0.1.2新機能）**
- **`debug` (boolean | { showBounds?: boolean }, default: false) - ログ制御と境界表示（v0.1.5でオブジェクト形式に拡張）**
- **`autoVoxelSize` (boolean, default: false) - v0.1.4: ボクセルサイズを自動決定。`voxelSize` 未指定時に有効**
- **`autoVoxelSizeMode` ('basic'|'occupancy', default: 'basic') - 自動ボクセルサイズの計算方式**
- **`autoVoxelTargetFill` (number, default: 0.6) - `occupancy` モードで目標とする占有率**
- **`colorMap` ('custom'|'viridis'|'inferno', default: 'custom') - v0.1.5: 知覚均等カラーマップ**
- **`diverging` (boolean, default: false) / `divergingPivot` (number, default: 0) - v0.1.5: 二極性データ向け発散配色**
- **`highlightTopN` (number|null, default: null) / `highlightStyle` ({ outlineWidth?: number; boostOpacity?: number; boostOutlineWidth?: number }) - 上位Nボクセルの強調表示。`boostOutlineWidth` は強調時の枠線幅へ加算されます**
// v0.1.6 追加
- **`voxelGap` (number, default: 0) - v0.1.6: ボクセル間にギャップ（メートル）を設けて枠線重なりを軽減**
- **`outlineOpacity` (number, default: 1.0) - v0.1.6: 枠線の透明度（0-1）を制御**
- **`outlineWidthResolver` ((params) => number|null, default: null) - v0.1.6: ボクセル毎の枠線太さを動的決定**
// v0.1.6.1 追加
- **`outlineInset` (number, default: 0) - v0.1.6.1: インセット枠線のオフセット距離（メートル）**
- **`outlineInsetMode` ('all'|'topn', default: 'all') - v0.1.6.1: インセット枠線の適用範囲**
- **`enableThickFrames` (boolean, default: false) - 標準枠線とインセット枠線の間を埋め、太いフレームを表現**
  - 制約: 各軸のインセットは片側最大20%（両側合計40%）にクランプされ、最終寸法は元の60%以上を保証します。
// v0.1.7 追加
- **`outlineRenderMode` ('standard'|'inset'|'emulation-only', default: 'standard') - v0.1.7: 表示モード切替**
- **`emulationScope` ('off'|'topn'|'non-topn'|'all', default: 'off') - v0.1.12: エミュレーション適用範囲（`outlineRenderMode` と組み合わせ）**
- **`adaptiveOutlines` (boolean, default: false) - v0.1.7: 適応的枠線制御を有効化（オプトイン）**
- **`outlineWidthPreset` ('thin'|'medium'|'thick'|'adaptive') - v0.1.7→v0.1.12: プリセット名を統一（旧: 'uniform'|'adaptive-density'|'topn-focus'）**
- ~~`boxOpacityResolver` ((ctx) => number 0–1)~~ - Deprecated in v0.1.12: `adaptiveOutlines` + `adaptiveParams` を使用してください
- ~~`outlineOpacityResolver` ((ctx) => number 0–1)~~ - Deprecated in v0.1.12: `adaptiveOutlines` + `adaptiveParams` を使用してください
// v0.1.12 追加
- **`profile` ('mobile-fast'|'desktop-balanced'|'dense-data'|'sparse-data') - v0.1.12: 環境別の事前定義プロファイル**
- **`performanceOverlay` ({ enabled?: boolean; position?: 'top-left'|'top-right'|'bottom-left'|'bottom-right'; autoShow?: boolean; updateIntervalMs?: number }) - v0.1.12: パフォーマンスオーバーレイ**
- **`renderLimitStrategy` ('density'|'coverage'|'hybrid', default: 'density') - 描画上限超過時のボクセル選択戦略**
- **`minCoverageRatio` (number, default: 0.2) / `coverageBinsXY` (number|'auto', default: 'auto') - coverage/hybrid選択の設定**
- **`renderBudgetMode` ('manual'|'auto', default: 'manual') - 端末別の自動描画予算を有効化**
- **`autoView` (boolean, default: false) - データ描画後に `fitView()` を自動実行**
- **`fitViewOptions` (Object) - `fitView()` と `autoView` の既定設定**
  - `headingDegrees` (number, default: 0) - カメラ方位角（度）
  - `pitchDegrees` (number, default: -30) - カメラ俯角（度）
  - `paddingPercent` (number, default: 0.1) - 境界周囲のパディング率
  - `altitudeStrategy` ('auto'|'manual', default: 'auto') - `auto` は高度幅をカメラ距離へ反映し、`manual` は水平方向の境界とパディングのみを使用
- **`adaptiveParams` (Object) - 適応枠線・透明度の制御**
  - `neighborhoodRadius` (number, default: 30) - 近傍サンプリング半径（メートル）
  - `densityThreshold` (number, default: 3) - 密度しきい値（エンティティ/ボクセル）
  - `cameraDistanceFactor` (number, default: 0.8) - カメラ距離補正係数
  - `overlapRiskFactor` (number, default: 0.4) - 診断用の重なりリスク係数
  - `minOutlineWidth` / `maxOutlineWidth` (number, defaults: 1 / 5) - 両方指定時に `outlineWidthRange` へ正規化される互換エイリアス
  - `outlineWidthRange` ([number, number]|null, default: null) - 適応枠線幅の最小・最大値
  - `boxOpacityRange` / `outlineOpacityRange` ([number, number]|null, default: null) - 適応透明度の最小・最大値
  - `adaptiveOpacityEnabled` (boolean, default: false) - 互換性のための予約フラグ。適応透明度の代替実装が完成するまでresolver APIは動作を維持します
  - `zScaleCompensation` (boolean, default: true) - Z軸スケール補正
  - `overlapDetection` (boolean, default: false) - 重なり診断を有効化
- **`spatialId` (Object) - 空間IDタイルグリッド設定**
  - `enabled` (boolean, default: false) - 空間IDモードを有効化
  - `mode` ('tile-grid', default: 'tile-grid') - 空間グリッド方式
  - `provider` ('ouranos-gex', default: 'ouranos-gex') - 空間IDプロバイダー
  - `zoom` (number|'auto', default: 25) - 0〜35のズーム値または自動選択
  - `zoomControl` ('auto'|'manual', default: 'auto') - ズーム制御方式
  - `zoomTolerancePct` (number, default: 10) - 自動選択時に許容するサイズ誤差率
- **`aggregation` (Object) - レイヤ別集約設定**
  - `enabled` (boolean, default: false) - レイヤ集約を有効化
  - `byProperty` (string|null, default: null) - レイヤキーに使うエンティティプロパティ
  - `keyResolver` ((entity) => string|null, default: null) - 独自キー解決関数。`byProperty` より優先
  - `showInDescription` (boolean, default: true) - ボクセル説明にレイヤ内訳を表示
  - `topN` (number, default: 10) - `getStatistics()` が返す最大レイヤ数
- **`classification` (string | ClassificationOptions | false) - linear/log/equal-interval/quantize/threshold/quantile/jenks を選択できる分類エンジン**
- **`temporal` (TemporalOptions|null) - Cesium Clock同期、分類スコープ、スロットル、補間、遅延ロードを含む時系列設定**
- // v0.1.6+ 追加（強調表示向け）
- ~~`outlineEmulation` ('off'|'topn'|...)~~ - Deprecated in v0.1.12: `outlineRenderMode` + `emulationScope` に統合
  - 太線の表現は引き続き利用可能です。`outlineRenderMode: 'emulation-only'` と `emulationScope` を使用してください。
- `batchMode` は v0.1.5 で非推奨（無視されます。将来削除予定）

> 寸法について: 描画されるボックスの幅・奥行・高さは、グリッドの実セルサイズ `cellSizeX`, `cellSizeY`, `cellSizeZ` を使用します。`heightBased: true` の場合は `cellSizeZ` を基準に密度で高さをスケーリングします。

**例（v0.1.7）:**
```javascript
const heatbox = new Heatbox(viewer, {
  // 表示モード（v0.1.7）
  outlineRenderMode: 'emulation-only',
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',
  // 透明度の適応制御（v0.1.7）
  // 順相関（密度が高いほど不透明、低いほど薄い）
  boxOpacityResolver: ({ isTopN, normalizedDensity }) => isTopN ? 1.0 : Math.max(0, Math.min(1, 0.3 + 0.7 * (normalizedDensity || 0))),
  outlineOpacityResolver: ({ isTopN, normalizedDensity }) => isTopN ? 1.0 : Math.max(0, Math.min(1, 0.3 + 0.7 * (normalizedDensity || 0))),
  // インセット（v0.1.6.1）
  outlineInset: 2.0,
  outlineInsetMode: 'all',
  // 従来オプション
  outlineWidth: 2,
  highlightTopN: 50,
  colorMap: 'viridis'
});
```

**例（v0.1.6: 枠線重なり対策・動的枠線）:**
```javascript
const heatbox = new Heatbox(viewer, {
  colorMap: 'viridis',
  // 枠線重なり対策
  voxelGap: 1.0,          // 1m分のギャップを確保
  outlineOpacity: 0.6,    // 枠線を半透明に
  // 動的枠線制御（密度で太さを変える）
  outlineWidth: 2,        // 既定値
  highlightTopN: 10,
  outlineWidthResolver: ({ normalizedDensity, isTopN }) => {
    if (isTopN) return 4;           // 上位は太く
    return normalizedDensity > 0.7 ? 1 : 2; // 高密度は細く
  }
});
```

#### v0.1.6: 枠線制御の優先順位（重要）
- 優先度1: `outlineWidthResolver` を定義した場合、その戻り値が最優先（TopN設定より優先）。
- 優先度2: Resolver未使用時は、`highlightTopN` が有効なら TopN に `highlightStyle.outlineWidth` を適用、その他は `outlineWidth`。
- 優先度3: いずれも未設定なら、既定の `outlineWidth` が全ボクセルに適用。

補助オプション:
- `outlineOpacity` は枠線色のアルファ値に適用され、重なり時の視覚ノイズを低減。
- `voxelGap` はボクセル寸法を縮め、隣接枠線の重なり自体を軽減。

#### 時系列オプション (`temporal`, v1.2.0)

`temporal` オプションを指定すると、Heatbox が `viewer.clock` と自動同期し、時間帯ごとに用意したエンティティ配列を順次描画します。

- `enabled`: true で時間依存モードを有効化（省略時は従来どおり静的表示）。
- `data`: `{ start, stop, data }` の配列。`data` には通常の `setData()` と同じエンティティ配列を渡します。
- `classificationScope`: `'global'` は全期間の統計量を共有、`'per-time'` は時点ごとに再計算。
- `updateInterval`: `'frame'` またはミリ秒指定。値が大きいほど更新頻度を抑制。
- `outOfRangeBehavior`: `'hold'`（既定）か `'clear'`。Clock が範囲外にいる際の表示制御。
- `overlapResolution`: `'prefer-earlier'`（既定）/`'prefer-later'`/`'skip'`。時間帯が重複するデータをどう扱うかを指定。
- `interpolate`: true にすると、隣接スライス間ギャップに対して数値プロパティを補間します。
- `dataSource(currentTime, context)`: 必要な時刻付近のスライスを遅延供給する async/sync provider。
- `useWorker`: true で補間と時系列統計の前処理を worker にオフロードし、非対応環境では自動でメインスレッドにフォールバック。

Cesium の `timeline` をそのまま利用できるため、既存アプリで `clock.onTick` を自前実装していた場合も `updateOptions({ temporal: ... })` でオン/オフを切り替えられます。時系列更新では `Heatbox.updateValues()` が優先利用され、既存グリッドを再利用できるケースでは再構築コストを抑えます。初回描画で候補がカリングされた場合も、カメラ移動時に現在のスライスを再描画して表示を回復します。

### メソッド

#### `createFromEntities(entities)`

エンティティ配列からヒートマップを非同期に作成します。内部で境界計算・グリッド作成・分類・描画を順に実行します。

v0.1.4 から `autoVoxelSize: true` の場合、`voxelSize` を省略するとエンティティ密度とデータ範囲からボクセルサイズを推定し、上限（`maxRenderVoxels`/内部制限）を超えないように自動調整します。統計情報に自動調整の有無と最終サイズが含まれます。

**パラメータ:**
- `entities` (Array<Cesium.Entity>)

**戻り値:**
- `Promise<HeatboxStatistics>`

#### `setData(entities)`

エンティティ配列からヒートマップデータを作成し、描画します。

**パラメータ:**
- `entities` (Array<Cesium.Entity>) - 対象エンティティ配列

**戻り値:**
- `Promise<void>` - 描画完了後に解決。無効または空の入力はヒートマップをクリア

**例:**
```javascript
const entities = viewer.entities.values;
await heatbox.setData(entities);
console.log('ヒートマップ作成が完了しました。');
```

#### `updateValues(entities, runtimeOptions?)` (v1.3.x)

新しいデータが現在の空間範囲に収まる場合、既存の bounds/grid を再利用してボクセル値を更新します。再利用できない場合は `setData()` にフォールバックします。

**パラメータ:**
- `entities` (Array<Cesium.Entity>) - 対象エンティティ配列
- `runtimeOptions` (Object, optional) - 内部実行時オーバーライド

**戻り値:** `Promise<void>`

#### `updateOptions(newOptions)`

オプションを更新し、既存のヒートマップを再描画します。

**パラメータ:**
- `newOptions` (Object) - 新しいオプション

**例:**
```javascript
heatbox.updateOptions({
  voxelSize: 30,
  opacity: 0.7
});
```

#### `setVisible(show)`

ヒートマップの表示/非表示を切り替えます。

**パラメータ:**
- `show` (boolean) - 表示する場合はtrue

**例:**
```javascript
heatbox.setVisible(false); // 非表示
heatbox.setVisible(true);  // 表示
```

#### `clear()`

ヒートマップをクリアし、関連リソースをリセットします。

**例:**
```javascript
heatbox.clear();
```

#### `destroy()`

Heatboxインスタンスを破棄し、確保したリソース（イベントリスナー等）を解放します。

**例:**
```javascript
heatbox.destroy();
```

#### `dispose()`

`destroy()` の互換エイリアスです。レンダラー、イベントリスナー、オーバーレイ、凡例、時系列コントローラーを同様に解放します。

#### `getStatistics()`

現在のヒートマップの統計情報を取得します。

**戻り値:**
- `HeatboxStatistics|null` - 統計情報オブジェクト。データ未作成の場合はnull。

**例:**
```javascript
const stats = heatbox.getStatistics();
if (stats) {
  console.log('総ボクセル数:', stats.totalVoxels);
  console.log('非空ボクセル数:', stats.nonEmptyVoxels);
}
```

`aggregation.enabled` が有効な場合は、エンティティ総数の降順で `aggregation.topN` 件に制限した `layers` を含みます。`spatialId` には有効状態、プロバイダー、解決済みズーム、ズーム制御方式、端ケースQAメトリクスが含まれます。

#### `fitView(bounds?, options?)`

データ境界または指定した境界へカメラを移動します。

**パラメータ:**
- `bounds` (Object|null, optional) - `minLon`, `maxLon`, `minLat`, `maxLat`, `minAlt`, `maxAlt`。省略時は現在のデータ境界
- `options` (Object, optional) - `headingDegrees`, `pitchDegrees`, `paddingPercent`, `altitudeStrategy`

**戻り値:** `Promise<void>`

```javascript
await heatbox.fitView(null, {
  headingDegrees: 0,
  pitchDegrees: -35,
  paddingPercent: 0.1,
  altitudeStrategy: 'auto'
});
```

#### `getBounds()`

現在のヒートマップの境界情報（緯度経度）を取得します。

**戻り値:**
- `Object|null` - 境界情報オブジェクト。データ未作成の場合はnull。

**例:**
```javascript
const bounds = heatbox.getBounds();
if (bounds) {
  console.log('最大緯度:', bounds.maxLat);
}
```

#### `createLegend(container?)`

現在の分類状態から凡例DOMを作成します。`container` 省略時は `document.body` に追加します。

**戻り値:** `HTMLElement|null`

#### `updateLegend()` / `destroyLegend()`

`updateLegend()` は作成済みの凡例を最新の分類状態で更新し、`destroyLegend()` は凡例DOMと内部リソースを破棄します。

#### `getOptions()`

現在のオプション（正規化済み）を取得します。

**戻り値:**
- `HeatboxOptions`

#### `getDebugInfo()`

内部状態（bounds/grid/statistics を含む）を取得します。デバッグ用途。

**戻り値:**
- `Object`

#### `getEffectiveOptions()` (v0.1.12)

正規化・プロファイル適用後の有効な設定を取得します（`defaults ← profile ← user`）。

**戻り値:**
- `Object`

#### `togglePerformanceOverlay()` / `showPerformanceOverlay()` / `hidePerformanceOverlay()` (v0.1.12)

パフォーマンスオーバーレイ（FPS/描画時間/メモリ）をトグル・表示・非表示します。

#### `setPerformanceOverlayEnabled(enabled, options?)` (v0.1.12)

オーバーレイをランタイムで有効/無効化します。

**パラメータ:**
- `enabled` (boolean)
- `options` ({ position?: 'top-left'|'top-right'|'bottom-left'|'bottom-right'; updateIntervalMs?: number })

### 静的メソッド

#### `Heatbox.listProfiles()` (v0.1.12)

利用可能な設定プロファイル名を配列で返します。

**戻り値:**
- `string[]`

#### `Heatbox.getProfileDetails(name)` (v0.1.12)

プロファイルの説明や主要パラメータを返します。

**パラメータ:**
- `name` (string)

**戻り値:**
- `Object`

#### `Heatbox.filterEntities(entities, predicate)`

任意の条件関数でエンティティ配列をフィルタします。

**戻り値:**
- `Array<Cesium.Entity>`

## 型定義

### HeatboxStatistics

```typescript
interface HeatboxStatistics {
  totalVoxels: number;        // 総ボクセル数（空含む）
  renderedVoxels: number;     // 描画されるボクセル数
  nonEmptyVoxels: number;     // データ有りボクセル数
  emptyVoxels: number;        // 空ボクセル数
  totalEntities: number;      // 総エンティティ数
  minCount: number;           // 最小エンティティ数/ボクセル
  maxCount: number;           // 最大エンティティ数/ボクセル
  averageCount: number;       // 平均エンティティ数/ボクセル
  // v0.1.4 自動ボクセルサイズ調整情報
  autoAdjusted?: boolean;
  originalVoxelSize?: number | null;
  finalVoxelSize?: number | null;
  adjustmentReason?: string | null;
  classification?: ClassificationStatistics | null; // v1.1.0: 分類メタデータ
  layers?: Array<{ key: string; total: number }>;
  spatialId?: {
    enabled: boolean;
    provider: string | null;
    zoom: number | null;
    zoomControl: 'auto' | 'manual' | null;
    edgeCaseMetrics: object | null;
  };
}

interface ClassificationStatistics {
  enabled: boolean;
  scheme: 'linear' | 'log' | 'equal-interval' | 'quantize' | 'threshold' | 'quantile' | 'jenks';
  domain: [number, number];
  classes: number | null;
  thresholds: number[] | null;
  sampleSize: number;
  quantiles: [number, number, number, number] | null;
  histogram: {
    bins: Array<{ start: number; end: number }>;
    counts: number[];
  } | null;
  breaks: number[] | null;
  jenksBreaks: number[] | null;
  ckmeansClusters: number[][] | null;
}
```

`classification` には DataProcessor が算出したメタデータが格納されます。`histogram` は最大10ビンで自動作成され、`breaks` は現在のスキームに応じた境界値（threshold では `[min, ...thresholds, max]`、quantile/jenks ではデータ分布に応じた境界）。`jenksBreaks` と `ckmeansClusters` は jenks スキーム時にのみ付与されます。

### HeatboxOptions

```typescript
interface HeatboxOptions {
  voxelSize?: number;
  opacity?: number;
  emptyOpacity?: number;
  showOutline?: boolean;
  showEmptyVoxels?: boolean;
  minColor?: [number, number, number];
  maxColor?: [number, number, number];
  maxRenderVoxels?: number | 'auto'; // レンダリング上限（`auto` は端末性能に応じて自動設定）
  batchMode?: 'auto' | 'primitive' | 'entity';
  classification?: ClassificationOptions | 'linear' | 'log' | 'equal-interval' | 'quantize' | 'threshold' | 'quantile' | 'jenks' | false;
  temporal?: TemporalOptions | null; // v1.2.0: 時系列データ再生
}
```

#### `ClassificationOptions` (v1.1.0)

```typescript
interface ClassificationOptions {
  enabled?: boolean; // 省略時は scheme 指定で自動的に true
  scheme?: 'linear' | 'log' | 'equal-interval' | 'quantize' | 'threshold' | 'quantile' | 'jenks';
  classes?: number; // 2-20 の整数。threshold の場合は無視。quantile/jenks は values 必須
  thresholds?: number[]; // threshold 時のみ必須。昇順で指定
  colorMap?: Array<string | { position: number; color: string }>;
  domain?: [number, number]; // オプション。未指定時はデータドメインを使用
  classificationTargets?: {
    color?: boolean;
    opacity?: boolean;
    width?: boolean;
  };
}
```

`classification` に文字列（例: `'log'`）を渡すと `scheme` を略記できます。`false`/`null` は明示的に無効化します。`colorResolver` が存在する場合は従来どおり resolver が優先され、分類エンジンはスキップされます。`classificationTargets` で color/opacity/width の適用可否を切り替え、`adaptiveParams.*Range` と組み合わせて不透明度や線幅を補間します。

### TemporalDataEntry (v1.2.0)

```typescript
interface TemporalDataEntry {
  start: Cesium.JulianDate | string | Date | number;
  stop: Cesium.JulianDate | string | Date | number;
  data: Array<Cesium.Entity | { id?: string; position: Cesium.Cartesian3; properties?: any }>;
}
```

### TemporalOptions (v1.2.0)

```typescript
interface TemporalOptions {
  enabled?: boolean;
  data: TemporalDataEntry[];
  classificationScope?: 'global' | 'per-time';
  updateInterval?: 'frame' | number;
  outOfRangeBehavior?: 'clear' | 'hold';
  overlapResolution?: 'skip' | 'prefer-earlier' | 'prefer-later';
  interpolate?: boolean;
}
```

## ユーティリティ関数

### Legend API (v1.1.0)

- `createLegend(container?: HTMLElement): HTMLElement|null` — 現在の classifier で凡例 DOM を生成（省略時は body に追加）。`classificationTargets` に応じたターゲットを表示。
- `updateLegend()` — `updateOptions` / `createFromEntities` 後に最新状態で凡例を再描画。
- `destroyLegend()` — 生成済み凡例を破棄し、DOM から除去。

### `createHeatbox(viewer, options)`

Heatboxインスタンスを生成するためのヘルパー関数です。

**パラメータ:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewer
- `options` (Object) - 設定オプション

**戻り値:**
- `Heatbox` - 新しいHeatboxインスタンス

### `getAllEntities(viewer)`

指定されたviewerの全エンティティを取得します。

**パラメータ:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewer

**戻り値:**
- `Array<Cesium.Entity>` - エンティティ配列

### `generateTestEntities(viewer, bounds, count)`

テスト用エンティティを生成します。

**パラメータ:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewer
- `bounds` (Object) - 生成範囲
- `count` (number, default: 500) - 生成数

**戻り値:**
- `Array<Cesium.Entity>` - 生成されたエンティティ配列

### `getEnvironmentInfo()`

ライブラリのバージョンやWebGLサポート状況などの環境情報を取得します。

**戻り値:**
- `Object` - 環境情報

## エラーハンドリング

### よくあるエラーとその対処法

#### `対象エンティティがありません`
- エンティティ配列が空の場合に発生
- 有効なエンティティを含む配列を渡してください

#### `CesiumJS Viewerが無効です`
- Viewerが正しく初期化されていない場合に発生
- 有効なCesium.Viewerインスタンスを渡してください

#### `ボクセル数が上限を超えています`
- 生成されるボクセル数が制限を超えた場合に発生
- ボクセルサイズを大きくするか、処理範囲を小さくしてください

#### `WebGLがサポートされていません`
- ブラウザがWebGLに対応していない場合に発生
- WebGL対応ブラウザを使用してください

## パフォーマンス考慮事項

### 推奨設定

- **エンティティ数**: 500-1,500個
- **ボクセルサイズ**: 20-50メートル
- **最大ボクセル数**: 50,000個以下

### 最適化のヒント

1. **ボクセルサイズの調整**: 大きなボクセルサイズを使用してボクセル数を減らす
2. **エンティティの事前フィルタリング**: 不要なエンティティを除外
3. **空ボクセルの非表示**: `showEmptyVoxels: false`を設定
4. **描画制限の活用**: `maxRenderVoxels`で描画数を制限
