# CesiumJS Heatbox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/hiro-nyon/cesium-heatbox/workflows/CI/badge.svg)](https://github.com/hiro-nyon/cesium-heatbox/actions)
[![Version](https://img.shields.io/github/package-json/v/hiro-nyon/cesium-heatbox?label=version)](https://github.com/hiro-nyon/cesium-heatbox/blob/main/package.json)
[![npm](https://img.shields.io/npm/v/cesium-heatbox)](https://www.npmjs.com/package/cesium-heatbox)

**日本語** | [English](#english)

## デモ / Live Demo

- Playground: https://hiro-nyon.github.io/cesium-heatbox/
- 背景タイル: CartoDB Light (OSMベース)。高トラフィック時はタイルポリシーにご配慮ください。
- デモは `gh-pages` ブランチに静的ファイルのみを配置しています。

CesiumJS環境内の既存エンティティを対象とした3Dボクセルベースヒートマップ可視化ライブラリです。

**English**

A 3D voxel-based heatmap visualization library for existing entities in CesiumJS environments.

## 特徴 / Features

### 日本語
- **Entityベース**: 既存のCesium Entityから自動でデータを取得
- **自動範囲設定**: エンティティ分布から最適な直方体（AABB）範囲を自動計算
- **最小ボクセル数**: 指定された範囲を内包する最小限のボクセル数で効率的に処理
- **相対的色分け**: データ内の最小値・最大値に基づく動的色分け
- **パフォーマンス最適化**: バッチ描画によるスムーズな3D表示

### English
- **Entity-based**: Automatically retrieves data from existing Cesium Entities
- **Automatic Range Setting**: Automatically calculates optimal axis-aligned box ranges from entity distribution
- **Minimal Voxel Count**: Efficient processing with minimum voxel count covering specified ranges
- **Relative Color Mapping**: Dynamic color mapping based on min/max values within data
- **Performance Optimization**: Smooth 3D display through batch rendering

## 既存手法との比較 / Comparison with Existing Approaches

### 日本語

**よくある代替手法**
- 2Dヒートマップ画像の貼り付け（例: heatmap.js を `ImageryLayer` として投影）
- 点群のクラスタリングやサマリ表示（Cesium の Entity クラスタリング）
- 他可視化フレームワークのレイヤー（例: deck.gl の HeatmapLayer など）

**Heatbox の強み**
- **真の3Dボクセル表現**: Z方向（高度）の分布を体積として可視化でき、2Dの塗りつぶしでは失われる高さ情報を保持
- **Entityベースのワークフロー**: 既存 `Cesium.Entity` から直接生成。事前のタイル化やサーバー処理が不要
- **自動ボクセルサイズ決定 (v0.1.4)**: `autoVoxelSize` によりデータ範囲と件数から最適サイズを自動計算。パフォーマンスと解像度のバランスを自動化
- **オーケストレーション型アーキテクチャ（ADR-0009, v0.1.11）**: Single Responsibility Principleに基づく完全な責務分離を実現
- **設定プロファイル機能 (v0.1.12)**: `mobile-fast`、`desktop-balanced`、`dense-data`、`sparse-data` で環境別最適化
- **パフォーマンス監視 (v0.1.12)**: リアルタイムオーバーレイでFPS、描画時間、メモリ使用量を可視化
- **API一貫性向上 (v0.1.12)**: 命名規則統一（`pitchDegrees`/`headingDegrees`）、`outlineRenderMode`/`emulationScope`統合
- **適応制御システム統合 (v0.1.12)**: Resolver廃止による`adaptiveParams`システムへの一本化
- **デバッグ支援強化 (v0.1.12)**: `getEffectiveOptions()`による設定確認とプロファイル詳細取得
  - **ColorCalculator**: 色計算・カラーマップ処理の専門化
  - **VoxelSelector**: 密度・カバレッジ・ハイブリッド選択戦略の専門化
  - **AdaptiveController**: 適応パラメータ・近隣密度計算の専門化
  - **GeometryRenderer**: エンティティ作成・ジオメトリ管理の専門化
  - **VoxelRenderer**: 各専門クラスのオーケストレーション役に特化（14.5%性能向上を達成）
- **適応的制御システム**: 密度とカメラ距離に基づく動的アウトライン制御と TopN 強調表示
- **自動視点調整 (v0.1.9)**: データ境界への自動カメラフィット機能で最適な視覚化を実現
- **デバッグ境界制御 (v0.1.5)**: `debug.showBounds` でバウンディングボックス表示をON/OFF制御
- **知覚均等カラーマップ (v0.1.5)**: `viridis`、`inferno` カラーマップと二極性配色（blue-white-red）をサポート
- **TopN強調表示 (v0.1.5)**: 密度上位N個のボクセルを強調、他を淡色表示する `highlightTopN` オプション
- **枠線重なり対策 (v0.1.6)**: `voxelGap` による間隔調整と `outlineOpacity` による透明度制御で視認性向上
- **動的枠線制御 (v0.1.6)**: `outlineWidthResolver` 関数でボクセル毎の枠線太さを密度に応じて動的調整
- **太線エミュレーション (v0.1.12)**: `outlineRenderMode: 'emulation-only'` または `emulationScope: 'topn'|'all'`（`outlineEmulation` は非推奨）
- **厚い枠線表示 (v0.1.6.2)**: `enableThickFrames` で12個のフレームボックスによる視覚的に厚い枠線を実現
- **インセット枠線 (v0.1.6.1)**: `outlineInset` で枠線をボックス内側にオフセット（`outlineInsetMode` で TopN 限定も可）
- **Wiki自動同期 (v0.1.6)**: JSDoc → Markdown 変換による GitHub Wiki の自動更新
- **パフォーマンス制御**: `maxRenderVoxels` と内部検証（例: `validateVoxelCount`）で安定動作を担保
- **デバッグ/統計の取得**: `getStatistics()` と `getDebugInfo()` でレンダリング状態や調整内容を把握可能
- **表現の柔軟性**: `wireframeOnly`、`heightBased`、カラーマップ設定などで見やすさを調整

**適していないケース（指針）**
- 数十万〜数百万スケールの体積格子を恒常的に描画する用途 → 専用GPUベースのボリュームレンダリングや3D Tiles等を検討
- 連続体の科学可視化（例: 医用CT/流体のボリュームレンダリング） → 専用のボリュームレンダリング手法が適合

### English

**Common Alternatives**
- Draped 2D heatmap textures (e.g., heatmap.js projected as an `ImageryLayer`)
- Point clustering/aggregation using Cesium Entity clustering
- Layers from other visualization frameworks (e.g., deck.gl HeatmapLayer)

**Strengths of Heatbox**
- **True 3D voxel representation**: Preserves vertical distribution (Z) as volumetric voxels, unlike 2D color fills
- **Entity-based workflow**: Builds directly from existing `Cesium.Entity` objects; no pre-tiling or server-side processing required
- **Automatic voxel sizing (v0.1.4)**: `autoVoxelSize` estimates optimal size from data extent and counts for balanced quality/performance
- **Debug boundary control (v0.1.5)**: `debug.showBounds` for bounding box display ON/OFF control
- **Perceptually uniform color maps (v0.1.5)**: `viridis`, `inferno` color maps and diverging color scheme (blue-white-red)
- **TopN highlighting (v0.1.5)**: `highlightTopN` option to emphasize top N density voxels
- **Outline overlap mitigation (v0.1.6)**: `voxelGap` for spacing and `outlineOpacity` for transparency control
- **Dynamic outline control (v0.1.6)**: `outlineWidthResolver` function for density-adaptive outline thickness
- **Outline emulation (v0.1.12)**: use `outlineRenderMode: 'emulation-only'` or `emulationScope: 'topn'|'all'` (legacy `outlineEmulation` is deprecated)
- **Thick outline frames (v0.1.6.2)**: `enableThickFrames` creates visually thick outlines using 12 frame boxes
- **Inset outline (v0.1.6.1)**: `outlineInset` to draw outlines inset from faces (`outlineInsetMode` to limit to TopN)
- **Wiki auto-sync (v0.1.6)**: JSDoc → Markdown conversion for automated GitHub Wiki updates
- **Performance guard rails**: `maxRenderVoxels` and internal checks (e.g., `validateVoxelCount`) for stable rendering
- **Debugging and statistics**: Introspection via `getStatistics()` and `getDebugInfo()`
- **Flexible presentation**: `wireframeOnly`, `heightBased`, and color map presets for readability

**When this may not fit**
- Persistent rendering of hundreds of thousands to millions of voxels → consider GPU volume rendering or 3D Tiles-based approaches
- Scientific continuous volumes (e.g., CT/CFD) → dedicated volume rendering techniques are more suitable

## インストール / Installation

### 日本語

#### npmからインストール（推奨）

```bash
npm install cesium-heatbox
```

#### CDN経由で利用

```html
<!-- UMDバンドルをCDN経由で読み込み -->
<script src="https://unpkg.com/cesium-heatbox@latest/dist/cesium-heatbox.umd.min.js"></script>
```

#### ソースからビルド（開発者向け）

```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build
```

### English

#### Install from npm (Recommended)

```bash
npm install cesium-heatbox
```

#### Use via CDN

```html
<!-- Load UMD bundle via CDN -->
<script src="https://unpkg.com/cesium-heatbox@latest/dist/cesium-heatbox.umd.min.js"></script>
```

#### Build from source (For development)

```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build
```

## 基本的な使用方法 / Basic Usage

### 日本語

```javascript
import { Heatbox } from 'cesium-heatbox';

// v0.1.12: プロファイル機能で環境に最適化
const heatbox = new Heatbox(viewer, {
  profile: 'desktop-balanced',     // 自動設定プロファイル  
  voxelSize: { x: 1000, y: 1000, z: 100 },
  opacity: 0.8,
  performanceOverlay: {
    enabled: true,                 // リアルタイム性能監視
    position: 'top-right'
  }
});

// エンティティからヒートマップを作成
const entities = viewer.entities.values;
heatbox.setData(entities);

// v0.1.12: fitView は内部で postRender 一回の実行にスケジュールされ、
// 描画競合を避けつつ Rectangle→BoundingSphere ベースで安定ズームします。
await heatbox.fitView(null, {
  paddingPercent: 0.1,
  pitchDegrees: -35,
  headingDegrees: 0
});

// 統計情報の取得
const statistics = heatbox.getStatistics();
console.log('作成完了:', statistics);
```

補足（v0.1.12）
- プロファイルの確認/詳細:
```javascript
const profiles = Heatbox.listProfiles();
const details = Heatbox.getProfileDetails('mobile-fast');
```
- パフォーマンスオーバーレイのランタイム制御:
```javascript
heatbox.setPerformanceOverlayEnabled(true, { position: 'bottom-left' });
heatbox.togglePerformanceOverlay();
```

### English

```javascript
import { Heatbox } from 'cesium-heatbox';

// v0.1.12: Use configuration profiles for environment optimization
const heatbox = new Heatbox(viewer, {
  profile: 'desktop-balanced',     // Auto-configuration profile
  voxelSize: { x: 1000, y: 1000, z: 100 },
  opacity: 0.8,
  performanceOverlay: {
    enabled: true,                 // Real-time performance monitoring  
    position: 'top-right'
  }
});

// Create heatmap from entities
const entities = viewer.entities.values;
heatbox.setData(entities);

// v0.1.12: Fit view with updated API naming convention
heatbox.fitView({
  paddingPercent: 0.1,
  pitchDegrees: -45,              // Updated naming convention
  headingDegrees: 0
});

// Get statistics
const statistics = heatbox.getStatistics();
console.log('Creation completed:', statistics);
```

Tips (v0.1.12)
- Profiles overview/details:
```javascript
const profiles = Heatbox.listProfiles();
const details = Heatbox.getProfileDetails('mobile-fast');
```
- Runtime control of performance overlay:
```javascript
heatbox.setPerformanceOverlayEnabled(true, { position: 'bottom-left' });
heatbox.togglePerformanceOverlay();
```

## 空間ID対応 / Spatial ID Support

### 日本語

**v0.1.17新機能**: 空間ID（METI準拠 / Ouranos）に基づくタイルグリッドモードに対応しました。

#### 概要

従来の一様グリッドに加え、地理空間タイルシステム（空間ID）を用いたボクセル生成が可能になりました：

- **タイルグリッドモード**: 経度・緯度・高度を考慮した空間IDベースのボクセル配置
- **Ouransos-GEXライブラリ統合**: METI準拠の空間ID変換（オプショナル依存）
- **フォールバックメカニズム**: Ouranos未インストール時は内蔵Web Mercatorベース変換を使用
- **自動ズーム選択**: 目標ボクセルサイズ（voxelSize）と緯度から最適なズームレベルを自動決定

#### インストール方法

空間ID機能は本体のインストールだけで基本的に動作しますが、公式の[ouranos-gex-lib-for-javascript](https://github.com/ouranos-gex/ouranos-gex-lib-for-JavaScript)を使用する場合は追加の手順が必要です。

##### ⚠️ 重要な注意事項

`ouranos-gex-lib-for-javascript`は**GitHub上にビルド済みファイルが含まれていません**。そのため、通常の`npm install`では動作しません。以下の特別な手順が必要です：

##### オプション1: 内蔵フォールバックモードで使用（推奨・簡単）

**インストール不要**です。`cesium-heatbox`本体のみをインストールすれば、内蔵のWeb Mercatorベース変換が自動的に使用されます：

```bash
npm install cesium-heatbox
```

このモードでは、Ouranoscが利用できない場合に自動的に内蔵変換に切り替わります。多くの用途で十分な精度を提供します。

##### オプション2: Ouranos公式ライブラリを使用（高精度）

METI準拠の高精度な空間ID変換が必要な場合は、以下の手順でOuranosライブラリをセットアップします：

```bash
# 1. cesium-heatboxをインストール
npm install cesium-heatbox

# 2. ouranos-gexをオプショナル依存としてインストール
npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save

# 3. 専用スクリプトでビルド＆セットアップ
npx cesium-heatbox-install-ouranos
```

> **Note**: `npx cesium-heatbox-install-ouranos`は`node_modules/cesium-heatbox/tools/install-ouranos.js`を実行します。このスクリプトは：
> 1. `vendor/`ディレクトリにOuranosリポジトリをクローン
> 2. 依存関係をインストールしてビルド
> 3. ビルド済みファイルを`node_modules/`にコピー

##### インストール確認

正しくインストールされているか確認するには：

```javascript
import { Heatbox } from 'cesium-heatbox';

const heatbox = new Heatbox(viewer, {
  spatialId: { enabled: true }
});

// 統計情報でプロバイダーを確認
const stats = heatbox.getStatistics();
console.log('Provider:', stats.spatialIdProvider); 
// "ouranos-gex" = 公式ライブラリ使用中
// "fallback" or null = 内蔵変換使用中
```

##### トラブルシューティング

**問題**: `npm install`後に空間ID機能が動作しない

**解決策**:
1. `node_modules/ouranos-gex-lib-for-javascript/dist/index.js`が存在するか確認
2. 存在しない場合は`npx cesium-heatbox-install-ouranos`を実行
3. それでも失敗する場合は、`vendor/`ディレクトリを削除してから再試行

**問題**: `Module not found: Error: Can't resolve 'ouranos-gex-lib-for-javascript'`という警告

**解決策**: これは**正常**です。Ouranosはオプショナル依存のため、webpackビルド時に警告が出ますが、実行時には動的importでフォールバックします。警告を無視して問題ありません。

#### 基本的な使用方法

```javascript
import { Heatbox } from 'cesium-heatbox';

// 空間IDモードを有効化（自動ズーム選択）
const heatbox = new Heatbox(viewer, {
  spatialId: {
    enabled: true,              // 空間IDモードを有効化
    mode: 'tile-grid',          // タイルグリッドモード
    provider: 'ouranos-gex',    // 空間IDプロバイダー
    zoomControl: 'auto',        // 自動ズーム選択
    zoomTolerancePct: 10        // 許容誤差 (%)
  },
  voxelSize: 30  // 目標ボクセルサイズ（メートル）
});

await heatbox.createFromEntities(entities);

// 空間ID統計の確認
const stats = heatbox.getStatistics();
console.log('空間IDズーム:', stats.spatialIdZoom);
console.log('プロバイダー:', stats.spatialIdProvider);
```

#### 手動ズーム指定

```javascript
const heatbox = new Heatbox(viewer, {
  spatialId: {
    enabled: true,
    zoom: 25,                    // ズームレベル 25（約1mセル）
    zoomControl: 'manual'        // 手動ズーム
  }
});
```

#### ズームレベルとセルサイズの関係

| ズーム | セルサイズ (赤道) | 用途例 |
|--------|------------------|--------|
| 15     | ~1220 m          | 広域エリア |
| 20     | ~38 m            | 都市ブロック |
| 25     | ~1.2 m           | 建物・詳細 |
| 30     | ~3.7 cm          | 超高精度 |

#### 制限事項（v0.1.17時点）

- **高緯度対応**: ±85.0511°（Web Mercator限界）内で正常動作
- **日付変更線対応**: 次バージョン（v0.1.19）で実装予定
- **グローバルQA**: 高緯度・極地・日付変更線をまたぐケースは v0.1.19 で検証予定

詳細は[空間ID使用例](examples/spatial-id/)を参照してください。

### English

**v0.1.17 New Feature**: Spatial ID (METI-compliant / Ouranos) tile-grid mode support.

#### Overview

In addition to uniform grids, voxel generation using geospatial tile systems (Spatial ID) is now available:

- **Tile-Grid Mode**: Spatial ID-based voxel placement considering longitude, latitude, and altitude
- **Ouranos-GEX Library Integration**: METI-compliant spatial ID conversion (optional dependency)
- **Fallback Mechanism**: Built-in Web Mercator-based conversion when Ouranos is not installed
- **Auto Zoom Selection**: Automatically determines optimal zoom level from target voxel size (voxelSize) and latitude

#### Installation

The Spatial ID feature works out of the box with basic installation, but using the official [ouranos-gex-lib-for-javascript](https://github.com/ouranos-gex/ouranos-gex-lib-for-JavaScript) requires additional setup.

##### ⚠️ Important Notice

**`ouranos-gex-lib-for-javascript` does not include pre-built files on GitHub**. Therefore, standard `npm install` will not work. Special setup steps are required:

##### Option 1: Use Built-in Fallback Mode (Recommended, Easy)

**No additional installation needed**. Simply install `cesium-heatbox` and the built-in Web Mercator-based converter will be used automatically:

```bash
npm install cesium-heatbox
```

This mode automatically falls back to the built-in converter when Ouranos is unavailable. It provides sufficient accuracy for most use cases.

##### Option 2: Use Official Ouranos Library (High Accuracy)

If you need METI-compliant high-precision spatial ID conversion, follow these steps to set up the Ouranos library:

```bash
# 1. Install cesium-heatbox
npm install cesium-heatbox

# 2. Install ouranos-gex as optional dependency
npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save

# 3. Build and setup using dedicated script
npx cesium-heatbox-install-ouranos
```

> **Note**: `npx cesium-heatbox-install-ouranos` runs `node_modules/cesium-heatbox/tools/install-ouranos.js`. This script:
> 1. Clones the Ouranos repository into `vendor/` directory
> 2. Installs dependencies and builds the library
> 3. Copies built files into `node_modules/`

##### Installation Verification

To verify correct installation:

```javascript
import { Heatbox } from 'cesium-heatbox';

const heatbox = new Heatbox(viewer, {
  spatialId: { enabled: true }
});

// Check provider in statistics
const stats = heatbox.getStatistics();
console.log('Provider:', stats.spatialIdProvider); 
// "ouranos-gex" = using official library
// "fallback" or null = using built-in converter
```

##### Troubleshooting

**Issue**: Spatial ID feature doesn't work after `npm install`

**Solution**:
1. Check if `node_modules/ouranos-gex-lib-for-javascript/dist/index.js` exists
2. If not, run `npx cesium-heatbox-install-ouranos`
3. If still failing, delete `vendor/` directory and retry

**Issue**: Warning `Module not found: Error: Can't resolve 'ouranos-gex-lib-for-javascript'`

**Solution**: This is **normal**. Ouranos is an optional dependency, so webpack shows warnings during build, but the runtime will dynamically import and fallback. You can safely ignore this warning.

#### Basic Usage

```javascript
import { Heatbox } from 'cesium-heatbox';

// Enable spatial ID mode with auto zoom
const heatbox = new Heatbox(viewer, {
  spatialId: {
    enabled: true,              // Enable spatial ID mode
    mode: 'tile-grid',          // Tile-grid mode
    provider: 'ouranos-gex',    // Spatial ID provider
    zoomControl: 'auto',        // Auto zoom selection
    zoomTolerancePct: 10        // Tolerance (%)
  },
  voxelSize: 30  // Target voxel size (meters)
});

await heatbox.createFromEntities(entities);

// Check spatial ID statistics
const stats = heatbox.getStatistics();
console.log('Spatial ID zoom:', stats.spatialIdZoom);
console.log('Provider:', stats.spatialIdProvider);
```

#### Manual Zoom Specification

```javascript
const heatbox = new Heatbox(viewer, {
  spatialId: {
    enabled: true,
    zoom: 25,                    // Zoom level 25 (~1m cells)
    zoomControl: 'manual'        // Manual zoom
  }
});
```

#### Zoom Level vs Cell Size

| Zoom | Cell Size (equator) | Use Case |
|------|---------------------|----------|
| 15   | ~1220 m             | Wide area |
| 20   | ~38 m               | City blocks |
| 25   | ~1.2 m              | Buildings/details |
| 30   | ~3.7 cm             | Ultra-precision |

#### Limitations & Global QA (v0.1.19)

- **High Latitude**: Operates within ±85.0511° (Web Mercator limit). v0.1.19 adds global QA tests and metrics; the built-in fallback converter targets ≤ ~10% relative XY error near poles, while ouranos-gex aims for stricter accuracy.
- **Antimeridian**: v0.1.19 validates neighbor continuity across the ±180° dateline (tile-grid neighbors/children/parent). For sensitive workflows, consider `zoomControl:'manual'` with a stable zoom level.
- **Global QA**: High-latitude, polar, and antimeridian-crossing scenarios are covered by automated tests (see `test/integration/spatial-global-qa.test.js`). QA metrics are exposed via `getStatistics().spatialId.edgeCaseMetrics` for diagnostics.

See [Spatial ID Examples](examples/spatial-id/) for details.

## レイヤ別集約 / Layer Aggregation

### 日本語

**v0.1.18新機能**: ボクセル内のエンティティをカテゴリ・種別・データソース等のレイヤで集約できるようになりました。

#### 概要

従来のボクセルごとの総エンティティ数に加え、各ボクセル内のエンティティを**レイヤ（カテゴリ）別**に集計できます：

- **プロパティベース集約**: エンティティの特定プロパティをレイヤキーとして使用
- **カスタムリゾルバ**: 任意のロジックでレイヤキーを決定
- **ボクセルごとの内訳**: 各ボクセルの支配的レイヤ（layerTop）と詳細内訳（layerStats）
- **グローバル統計**: 全ボクセルを通じた上位Nレイヤの集計
- **ピッキング統合**: ボクセルクリック時にレイヤ構成を表示

#### 基本的な使用方法

```javascript
import { Heatbox } from 'cesium-heatbox';

// プロパティベース集約（建物種別）
const heatbox = new Heatbox(viewer, {
  aggregation: {
    enabled: true,
    byProperty: 'buildingType',  // entity.properties.buildingType をレイヤキーとして使用
    showInDescription: true,     // ボクセル説明文にレイヤ内訳を表示
    topN: 10                     // 統計情報で上位10レイヤを返却
  }
});

await heatbox.createFromEntities(entities);

// グローバル統計の確認
const stats = heatbox.getStatistics();
console.log(stats.layers);
// [
//   { key: 'residential', total: 5234 },
//   { key: 'commercial', total: 2103 },
//   { key: 'industrial', total: 987 }
// ]
```

#### カスタムリゾルバ

```javascript
const heatbox = new Heatbox(viewer, {
  aggregation: {
    enabled: true,
    keyResolver: (entity) => {
      // カスタムロジックでレイヤキーを決定
      const hour = new Date(entity.timestamp).getHours();
      return hour < 12 ? 'morning' : 'afternoon';
    }
  }
});
```

#### ボクセルピッキング

ボクセルをクリックすると、レイヤ構成が表示されます：

```
ボクセル構成:
- residential: 30 (60%)
- commercial: 15 (30%)
- industrial: 5 (10%)
```

#### ベストプラクティス

- **カテゴリカルキーを使用**: タイムスタンプやIDなど連続値は避け、カテゴリ値を使用してください
- **ユニークレイヤ数を制限**: ボクセルあたり100未満のユニークレイヤを推奨
- **エラーハンドリング**: `keyResolver`は文字列を返すべきです。エラー時は'unknown'にフォールバックします

#### パフォーマンス

- **メモリ**: ボクセルあたりのユニークレイヤあたり ~8-16 バイト
- **処理時間**: 有効時 ≤ +10% オーバーヘッド
- **無効時**: オーバーヘッドなし（デフォルト）

詳細は[集約使用例](examples/aggregation/)を参照してください。

### English

**v0.1.18 New Feature**: Aggregate entities within voxels by category, type, data source, or custom layers.

#### Overview

In addition to total entity counts per voxel, you can now aggregate entities by **layers (categories)**:

- **Property-based aggregation**: Use a specific entity property as the layer key
- **Custom resolver**: Determine layer keys with arbitrary logic
- **Per-voxel breakdown**: Dominant layer (layerTop) and detailed breakdown (layerStats) for each voxel
- **Global statistics**: Top-N layer aggregation across all voxels
- **Picking integration**: Display layer composition when clicking voxels

#### Basic Usage

```javascript
import { Heatbox } from 'cesium-heatbox';

// Property-based aggregation (building types)
const heatbox = new Heatbox(viewer, {
  aggregation: {
    enabled: true,
    byProperty: 'buildingType',  // Use entity.properties.buildingType as layer key
    showInDescription: true,     // Show layer breakdown in voxel description
    topN: 10                     // Return top 10 layers in statistics
  }
});

await heatbox.createFromEntities(entities);

// Check global statistics
const stats = heatbox.getStatistics();
console.log(stats.layers);
// [
//   { key: 'residential', total: 5234 },
//   { key: 'commercial', total: 2103 },
//   { key: 'industrial', total: 987 }
// ]
```

#### Custom Resolver

```javascript
const heatbox = new Heatbox(viewer, {
  aggregation: {
    enabled: true,
    keyResolver: (entity) => {
      // Custom logic to determine layer key
      const hour = new Date(entity.timestamp).getHours();
      return hour < 12 ? 'morning' : 'afternoon';
    }
  }
});
```

#### Voxel Picking

When you click a voxel, the layer composition is displayed:

```
Voxel Composition:
- residential: 30 (60%)
- commercial: 15 (30%)
- industrial: 5 (10%)
```

#### Best Practices

- **Use categorical keys**: Avoid continuous values like timestamps or IDs; use categorical values
- **Limit unique layers**: Keep unique layer count < 100 per voxel for optimal performance
- **Error handling**: `keyResolver` should return strings; errors fall back to 'unknown'

#### Performance

- **Memory**: ~8-16 bytes per unique layer per voxel
- **Processing**: ≤ +10% overhead when enabled
- **No overhead**: When disabled (default)

See [Aggregation Examples](examples/aggregation/) for details.

## API

### 日本語

#### コンストラクタ

```javascript
const heatbox = new Heatbox(viewer, options);
```

**パラメータ**:
- `viewer` (Cesium.Viewer): CesiumJSビューワーインスタンス
- `options` (Object): 設定オプション

#### 主要メソッド

- `createFromEntities(entities)`: エンティティからヒートマップを作成
- `setVisible(show)`: 表示/非表示の切り替え
- `clear()`: ヒートマップをクリア
- `getStatistics()`: 統計情報を取得

### English

#### Constructor

```javascript
const heatbox = new Heatbox(viewer, options);
```

**Parameters**:
- `viewer` (Cesium.Viewer): CesiumJS viewer instance
- `options` (Object): Configuration options

#### Main Methods

- `createFromEntities(entities)`: Create heatmap from entities
- `setVisible(show)`: Toggle visibility
- `clear()`: Clear heatmap
- `getStatistics()`: Get statistics

## サンプル / Examples

### 日本語
基本的な使用例は `examples/` フォルダを参照してください。

### English
Please refer to the `examples/` folder for basic usage examples.

## ドキュメント / Documentation

英語 → 日本語の順で掲載し、各ページ先頭に言語切替リンク（[English](docs/API.md#english) | [日本語](docs/API.md#日本語)）を用意しています。  
Docs are structured English first, then Japanese. Each page includes a language switch at the top.

### 日本語
- [API リファレンス](docs/API.md)
- [クイックスタート](docs/quick-start.md)
- [はじめに](docs/getting-started.md)
- [移行ガイド](MIGRATION.md) 🆕 **v0.1.12移行ガイド**
- [開発ガイド](docs/development-guide.md)

### English
- [API Reference](docs/API.md)
- [Quick Start](docs/quick-start.md)
- [Getting Started](docs/getting-started.md)  
- [Migration Guide](MIGRATION.md) 🆕 **v0.1.12 Migration Guide**
- [Development Guide](docs/development-guide.md)

## ライセンス / License

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。  
MIT License - See [LICENSE](LICENSE) for details.

## 貢献 / Contributing

### 日本語
プロジェクトへの貢献を歓迎します！詳細は [CONTRIBUTING.md](docs/contributing.md) を参照してください。

### English
Contributions to the project are welcome! See [CONTRIBUTING.md](docs/contributing.md) for details.
