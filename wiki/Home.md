# CesiumJS Heatbox Wiki

[![Version](https://img.shields.io/github/package-json/v/hiro-nyon/cesium-heatbox?label=version)](https://github.com/hiro-nyon/cesium-heatbox/blob/main/package.json)
[![npm](https://img.shields.io/npm/v/cesium-heatbox)](https://www.npmjs.com/package/cesium-heatbox)

**日本語** | [English](#english)

CesiumJS Heatbox は、CesiumJS 上の既存 Entity を対象に、3D ボクセルで密度を可視化するヒートマップライブラリです。エンティティ分布から自動で範囲を推定し、設定した `voxelSize` と描画上限（`maxRenderVoxels`）で効率よく描画します。`autoVoxelSize: true` やプロファイル機能により、端末に合わせた描画チューニングを自動化できます。

### v0.1.15 ハイライト
- ADR-0011 Phase 4: 適応制御の最終仕上げ（Z 軸補正・重なり検出・範囲クランプ）
- `PerformanceOverlay` の強化とデバッグメトリクスの充実
- `profile` / `adaptiveParams` の整理、型定義 (`types/index.d.ts`) の刷新
- Wiki / ガイドを全面的に日英対応へアップデート

## English

CesiumJS Heatbox visualises density using 3D voxels for existing Cesium entities. It estimates bounds from the entity distribution and renders efficiently with the configured `voxelSize` and draw limits (`maxRenderVoxels`). With `autoVoxelSize: true` and rendering profiles you can tailor the workload to each device automatically.

### v0.1.15 Highlights
- ADR-0011 Phase 4: final adaptive-control tweaks (Z-scale compensation, overlap diagnostics, range clamps)
- Enhanced `PerformanceOverlay` with richer debug metrics
- Refined `profile` and `adaptiveParams` shape plus an updated public type definition (`types/index.d.ts`)
- Wiki / guides refreshed with full Japanese & English coverage

## 主要機能 / Key Features

### 日本語
- エンティティ連携: `viewer.entities` から自動集計
- 自動範囲設定: 分布に基づく直方体（AABB）範囲の推定
- ボクセル最適化: 範囲を内包する最少ボクセル数で生成
- 相対色分け: データ内 min/max に応じた動的カラー
- パフォーマンス配慮: バッチ描画と描画上限制御

### English
- Entity Integration: Automatic aggregation from `viewer.entities`
- Automatic Range Setting: Axis-aligned box range estimation based on distribution
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
npmからインストール（推奨）：
```bash
npm install cesium-heatbox
```

### English
Install from npm (Recommended):
```bash
npm install cesium-heatbox
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
