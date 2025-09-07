# Getting Started（はじめに）

**日本語** | [English](#english)

このページでは、ライブラリ利用者向けに最短で使い始めるための手順を説明します。

## English

This page explains the quickest steps for library users to get started.

## インストール / Installation

### 日本語

#### npmからインストール（推奨）
```bash
npm install cesium-heatbox
```

#### GitHubから直接取得
```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

#### CDN経由
```html
<script src="https://unpkg.com/cesium-heatbox@latest/dist/cesium-heatbox.umd.min.js"></script>
```

Peer Dependency として Cesium を別途インストールしてください。

### English

#### Install from npm (Recommended)
```bash
npm install cesium-heatbox
```

#### Direct from GitHub (for development)
```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

#### Via CDN
```html
<script src="https://unpkg.com/cesium-heatbox@latest/dist/cesium-heatbox.umd.min.js"></script>
```

Please install Cesium separately as a peer dependency.

## 使い方（基本） / Basic Usage

### 日本語

```javascript
import Heatbox from 'cesium-heatbox';

// 1) Cesium Viewer の用意
const viewer = new Cesium.Viewer('cesiumContainer');

// 2) Heatbox を初期化（v0.1.11）
const heatbox = new Heatbox(viewer, {
  // v0.1.4: voxelSize を省略して autoVoxelSize で自動決定も可能
  // voxelSize: 20,      // 明示指定する場合はコメント解除
  autoVoxelSize: true,   // 自動ボクセルサイズ決定
  opacity: 0.8,          // データボクセル不透明度
  emptyOpacity: 0.03,    // 空ボクセル不透明度
  showOutline: true,     // 枠線表示
  showEmptyVoxels: false,// 空ボクセル描画
  wireframeOnly: false,  // 枠線のみ表示（v0.1.2）
  heightBased: false,    // 高さベース表現（v0.1.2）
  outlineWidth: 2,       // 枠線の太さ（v0.1.2）
  // v0.1.5: デバッグ境界表示を明示制御
  debug: { showBounds: false },
  // v0.1.5: 知覚均等カラーマップ/発散配色/TopN強調
  colorMap: 'custom',    // 'viridis' | 'inferno'
  diverging: false,
  divergingPivot: 0,
  highlightTopN: null,
  highlightStyle: { outlineWidth: 4, boostOpacity: 0.2 }
});

// 3) エンティティからヒートマップ生成（非同期）
const entities = viewer.entities.values;
const stats = await heatbox.createFromEntities(entities);
console.log('統計', stats);

// 4) 表示切替・クリアなど
heatbox.setVisible(true);
// heatbox.clear();
// heatbox.destroy();
```

### English

```javascript
import Heatbox from 'cesium-heatbox';

// 1) Prepare a Cesium Viewer
const viewer = new Cesium.Viewer('cesiumContainer');

// 2) Initialize Heatbox (v0.1.11)
const heatbox = new Heatbox(viewer, {
  // v0.1.4: You can omit voxelSize and use autoVoxelSize
  // voxelSize: 20,      // Uncomment to explicitly set
  autoVoxelSize: true,   // Auto determine voxel size
  opacity: 0.8,          // Opacity for data voxels
  emptyOpacity: 0.03,    // Opacity for empty voxels
  showOutline: true,     // Show outlines
  showEmptyVoxels: false,// Draw empty voxels
  wireframeOnly: false,  // Wireframe-only (v0.1.2)
  heightBased: false,    // Height-based (v0.1.2)
  outlineWidth: 2,       // Outline thickness (v0.1.2)
  // v0.1.5: Explicit control of debug boundary display
  debug: { showBounds: false },
  // v0.1.5: Perceptual colormaps/diverging/TopN highlight
  colorMap: 'custom',    // 'viridis' | 'inferno'
  diverging: false,
  divergingPivot: 0,
  highlightTopN: null,
  highlightStyle: { outlineWidth: 4, boostOpacity: 0.2 }
});

// 3) Create heatmap from entities (async)
const entities = viewer.entities.values;
const stats = await heatbox.createFromEntities(entities);
console.log('stats', stats);

// 4) Toggle visibility / clear / destroy
heatbox.setVisible(true);
// heatbox.clear();
// heatbox.destroy();
```

## オプション一覧 / Options (v0.1.5+)
- `voxelSize` number（既定: 20）
- `opacity` number 0–1（既定: 0.8）
- `emptyOpacity` number 0–1（既定: 0.03）
- `showOutline` boolean（既定: true）
- `showEmptyVoxels` boolean（既定: false）
- `minColor` [r,g,b]（既定: [0,32,255]）
- `maxColor` [r,g,b]（既定: [255,64,0]）
- `maxRenderVoxels` number（描画上限）
- **`wireframeOnly` boolean（v0.1.2新機能）** - 枠線のみ表示
- **`heightBased` boolean（v0.1.2新機能）** - 密度を高さで表現
- **`outlineWidth` number（v0.1.2新機能）** - 枠線の太さ（既定: 2）
- **`debug` boolean | { showBounds?: boolean }（v0.1.3→v0.1.5）** - ログ制御と境界表示
- **`autoVoxelSize` boolean（v0.1.4新機能）** - `voxelSize` 未指定時に自動決定
- **`colorMap` 'custom'|'viridis'|'inferno'（v0.1.5）** - 知覚均等カラーマップ
- **`diverging` boolean / `divergingPivot` number（v0.1.5）** - 発散配色（青-白-赤）
- **`highlightTopN` number|null / `highlightStyle`（v0.1.5）** - 上位Nボクセルを強調
- `batchMode` は v0.1.5 で非推奨（互換のため受理するが無視）

### English
- `voxelSize` number (default: 20)
- `opacity` number 0–1 (default: 0.8)
- `emptyOpacity` number 0–1 (default: 0.03)
- `showOutline` boolean (default: true)
- `showEmptyVoxels` boolean (default: false)
- `minColor` [r,g,b] (default: [0,32,255])
- `maxColor` [r,g,b] (default: [255,64,0])
- `maxRenderVoxels` number (render cap)
- `wireframeOnly` boolean (v0.1.2) — outlines only
- `heightBased` boolean (v0.1.2) — represent density with height
- `outlineWidth` number (v0.1.2) — outline thickness (default: 2)
- `debug` boolean | { showBounds?: boolean } (v0.1.3→v0.1.5) — logs/bounds
- `autoVoxelSize` boolean (v0.1.4) — auto size when `voxelSize` is omitted
- `colorMap` 'custom'|'viridis'|'inferno' (v0.1.5) — perceptual maps
- `diverging` boolean / `divergingPivot` number (v0.1.5) — diverging scheme
- `highlightTopN` number|null / `highlightStyle` (v0.1.5) — emphasize top N
- `batchMode` deprecated in v0.1.5 (accepted for compat but ignored)

### v0.1.7 Additions / 追加
- `adaptiveOutlines` boolean — adaptive outline behavior
- `outlineRenderMode` 'standard'|'inset'|'emulation-only' — rendering mode
- `outlineWidthPreset` 'uniform'|'adaptive-density'|'topn-focus'
- `boxOpacityResolver(ctx)` / `outlineOpacityResolver(ctx)` — opacity resolvers (priority: resolver > adaptive > fixed)
- `adaptiveParams` — tunables for adaptive logic

更新は `heatbox.updateOptions({ ... })` で反映できます。
Apply updates via `heatbox.updateOptions({ ... })`.

## 統計情報 / Statistics
`getStatistics()` で取得できる主な項目:
- `totalVoxels` 総ボクセル数
- `renderedVoxels` 実際に描画されたボクセル数（v0.1.3追加）
- `nonEmptyVoxels` データ有りボクセル数
- `emptyVoxels` 空ボクセル数
- `totalEntities` 総エンティティ数
- `minCount` / `maxCount` / `averageCount`

Key fields from `getStatistics()`:
- `totalVoxels`, `renderedVoxels`, `nonEmptyVoxels`, `emptyVoxels`
- `totalEntities`, `minCount`, `maxCount`, `averageCount`

## TypeScript / 型定義
型定義（`types/index.d.ts`）を同梱しています。ESM 環境でそのまま利用可能です。  
Type definitions are bundled in `types/index.d.ts` and usable in ESM.

## 対応バンドル形式 / Bundles
- ES Modules: `import Heatbox from 'cesium-heatbox'`
- UMD: `<script src=".../cesium-heatbox.umd.min.js"></script>` → `window.CesiumHeatbox`

## 次のステップ / Next Steps
- 基本コードと UI 操作例 / Basic code and UI examples: [[Examples]]
- 詳細 API / Detailed API: [[API-Reference]]
