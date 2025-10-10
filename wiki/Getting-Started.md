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

// 2) Heatbox を初期化（v0.1.15）
const heatbox = new Heatbox(viewer, {
  profile: 'desktop-balanced', // 端末に応じた推奨設定（v0.1.12+）
  autoVoxelSize: true,         // voxelSize 未指定時に自動決定
  adaptiveOutlines: true,      // v0.1.15 の適応制御
  adaptiveParams: {
    outlineWidthRange: [1.2, 3.0],
    zScaleCompensation: true,
    overlapDetection: true
  },
  performanceOverlay: {
    enabled: true,
    position: 'top-right'
  }
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

// 2) Initialize Heatbox (v0.1.15)
const heatbox = new Heatbox(viewer, {
  profile: 'desktop-balanced', // Recommended bundle for desktop GPUs
  autoVoxelSize: true,
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.2, 3.0],
    zScaleCompensation: true,
    overlapDetection: true
  },
  performanceOverlay: {
    enabled: true,
    position: 'top-right'
  }
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

## オプション一覧 / Options (v0.1.15)

### 日本語
- **基本描画**: `voxelSize` / `autoVoxelSize` / `maxRenderVoxels` / `opacity` / `emptyOpacity`
- **プロファイル**: `profile`（`mobile-fast` / `desktop-balanced` / `dense-data` / `sparse-data`）で推奨値を一括適用
- **適応制御**: `adaptiveOutlines`, `outlineWidthPreset`, `adaptiveParams.neighborhoodRadius`, `adaptiveParams.zScaleCompensation`, `adaptiveParams.overlapDetection`
- **表示モード**: `outlineRenderMode`, `emulationScope`, `wireframeOnly`, `heightBased`
- **カラーマップ**: `colorMap`, `diverging`, `divergingPivot`, `highlightTopN`, `highlightStyle`
- **観測性**: `performanceOverlay`, `togglePerformanceOverlay()`, `getStatistics()`
- **チューニング**: `renderLimitStrategy`, `renderBudgetMode`, `debug.showBounds`

### English
- **Core rendering**: `voxelSize`, `autoVoxelSize`, `maxRenderVoxels`, `opacity`, `emptyOpacity`
- **Profiles**: `profile` (`mobile-fast`, `desktop-balanced`, `dense-data`, `sparse-data`) apply curated presets
- **Adaptive control**: `adaptiveOutlines`, `outlineWidthPreset`, `adaptiveParams.neighborhoodRadius`, `adaptiveParams.zScaleCompensation`, `adaptiveParams.overlapDetection`
- **Display modes**: `outlineRenderMode`, `emulationScope`, `wireframeOnly`, `heightBased`
- **Colour & highlight**: `colorMap`, `diverging`, `divergingPivot`, `highlightTopN`, `highlightStyle`
- **Observability**: `performanceOverlay`, overlay helper methods, `getStatistics()`
- **Tuning knobs**: `renderLimitStrategy`, `renderBudgetMode`, `debug.showBounds`

最新の型情報は `types/index.d.ts` と [API Reference](API-Reference.md) を参照し、`heatbox.updateOptions({...})` で動的に切り替えられます。

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

> v0.1.15 以降は `renderTimeMs` や `occupancyRatio` などのメトリクスも取得できます。

## TypeScript / 型定義
型定義（`types/index.d.ts`）を同梱しています。ESM 環境でそのまま利用可能です。  
Type definitions are bundled in `types/index.d.ts` and usable in ESM.

## 対応バンドル形式 / Bundles
- ES Modules: `import Heatbox from 'cesium-heatbox'`
- UMD: `<script src=".../cesium-heatbox.umd.min.js"></script>` → `window.CesiumHeatbox`

## 次のステップ / Next Steps
- 基本コードと UI 操作例 / Basic code and UI examples: [[Examples]]
- 詳細 API / Detailed API: [[API-Reference]]
