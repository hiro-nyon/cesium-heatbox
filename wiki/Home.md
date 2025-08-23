# CesiumJS Heatbox Wiki

> **⚠️ 重要な注意 / Important Notice**: このライブラリは現在npm未登録です。GitHubから直接ダウンロードしてご利用ください。  
> This library is currently not registered on npm. Please download directly from GitHub.

**日本語** | [English](#english)

CesiumJS Heatbox は、CesiumJS 上の既存 Entity を対象に、3D ボクセルで密度を可視化するヒートマップライブラリです。エンティティ分布から自動で範囲を推定し、設定した `voxelSize` と描画上限（`maxRenderVoxels`）で効率よく描画します（ボクセルサイズの自動調整は v0.1.4 で対応予定）。

## English

CesiumJS Heatbox is a heatmap library that visualizes density using 3D voxels for existing entities on CesiumJS. It automatically estimates ranges from entity distribution and renders efficiently using the configured `voxelSize` and draw limits (`maxRenderVoxels`). Auto voxel-size adjustment is planned for v0.1.4.

## 主要機能 / Key Features

### 日本語
- エンティティ連携: `viewer.entities` から自動集計
- 自動範囲設定: 分布に基づく立方体範囲の推定
- ボクセル最適化: 範囲を内包する最少ボクセル数で生成
- 相対色分け: データ内 min/max に応じた動的カラー
- パフォーマンス配慮: バッチ描画と描画上限制御

### English
- Entity Integration: Automatic aggregation from `viewer.entities`
- Automatic Range Setting: Cubic range estimation based on distribution
- Voxel Optimization: Generate minimal voxel count covering the range
- Relative Color Mapping: Dynamic colors based on data min/max
- Performance Consideration: Batch rendering and draw limit control

## クイックリンク / Quick Links

### 日本語
- Getting Started: [[Getting-Started]]
- Quick Start: [[Quick-Start]]
- API リファレンス: [[API-Reference]]
- サンプルと使い方: [[Examples]]
- トラブルシューティング: [[Troubleshooting]]
- アーキテクチャ: [[Architecture]]
- 開発ガイド: [[Development-Guide]]
- コントリビュート: [[Contributing]]
- リリースノート: [[Release-Notes]]

### English
- Getting Started: [[Getting-Started]]
- Quick Start: [[Quick-Start]]
- API Reference: [[API-Reference]]
- Examples and Usage: [[Examples]]
- Troubleshooting: [[Troubleshooting]]
- Architecture: [[Architecture]]
- Development Guide: [[Development-Guide]]
- Contributing: [[Contributing]]
- Release Notes: [[Release-Notes]]

## インストール / Installation

### 日本語
現在npm未登録のため、GitHubから直接取得してください：
```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

### English
Currently not on npm, please get directly from GitHub:
```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

## 対応環境 / Requirements

### 日本語
- Cesium: `^1.120.0`（peer dependency）
- Node.js: `>=18`
- ブラウザ: 最新のモダンブラウザ（WebGL 必須）

### English
- Cesium: `^1.120.0` (peer dependency)
- Node.js: `>=18`
- Browser: Modern browsers (WebGL required)

## 最小コード例 / Minimal Code Example

### 日本語
```javascript
import Heatbox from 'cesium-heatbox';

const heatbox = new Heatbox(viewer, {
  voxelSize: 20,
  opacity: 0.8,
});

const entities = viewer.entities.values;
const stats = await heatbox.createFromEntities(entities);
console.log(stats);
```

> 補足: UMD 版は `CesiumHeatbox` として参照可能です。

### English
```javascript
import Heatbox from 'cesium-heatbox';

const heatbox = new Heatbox(viewer, {
  voxelSize: 20,
  opacity: 0.8,
});

const entities = viewer.entities.values;
const stats = await heatbox.createFromEntities(entities);
console.log(stats);
```

> Note: UMD version can be referenced as `CesiumHeatbox`.
