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
- **太線エミュレーション拡張 (v0.1.6.2)**: `outlineEmulation` に 'all', 'non-topn' モード追加で WebGL 1px 制限を回避
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
- **Extended outline emulation (v0.1.6.2)**: `outlineEmulation` 'all', 'non-topn' modes to bypass WebGL 1px limitation
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

// v0.1.12: 新しいAPI命名規則でビューフィット  
heatbox.fitView({
  paddingPercent: 0.1,
  pitchDegrees: -45,              // 更新された命名規則
  headingDegrees: 0
});

// 統計情報の取得
const statistics = heatbox.getStatistics();
console.log('作成完了:', statistics);
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
