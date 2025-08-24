# CesiumJS Heatbox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/hiro-nyon/cesium-heatbox/workflows/CI/badge.svg)](https://github.com/hiro-nyon/cesium-heatbox/actions)

> **⚠️ 重要 / Important**: このライブラリは現在npm未登録です。GitHubから直接ダウンロードしてご利用ください。  
> This library is currently not registered on npm. Please download directly from GitHub.

**日本語** | [English](#english)

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
- **Performance guard rails**: `maxRenderVoxels` and internal checks (e.g., `validateVoxelCount`) for stable rendering
- **Debugging and statistics**: Introspection via `getStatistics()` and `getDebugInfo()`
- **Flexible presentation**: `wireframeOnly`, `heightBased`, and color map presets for readability

**When this may not fit**
- Persistent rendering of hundreds of thousands to millions of voxels → consider GPU volume rendering or 3D Tiles-based approaches
- Scientific continuous volumes (e.g., CT/CFD) → dedicated volume rendering techniques are more suitable

## インストール / Installation

### 日本語

> **注意**: このライブラリは現在npm未登録のため、以下の方法でインストールしてください。

#### 方法1: GitHubから直接クローン

```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

#### 方法2: CDN経由で直接利用

```html
<!-- UMDバンドルを直接読み込み -->
<script src="https://raw.githubusercontent.com/hiro-nyon/cesium-heatbox/main/dist/cesium-heatbox.umd.min.js"></script>
```

#### 将来的なnpm対応

npm登録を検討中です。登録後は以下のコマンドでインストール可能になります：

```bash
# 将来的に利用可能予定
npm install cesium-heatbox
```

### English

> **Note**: This library is currently not registered on npm. Please install using the following methods:

#### Method 1: Direct Clone from GitHub

```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

#### Method 2: Direct Use via CDN

```html
<!-- Load UMD bundle directly -->
<script src="https://raw.githubusercontent.com/hiro-nyon/cesium-heatbox/main/dist/cesium-heatbox.umd.min.js"></script>
```

#### Future npm Support

We are considering npm registration. After registration, installation will be possible with:

```bash
# Will be available in the future
npm install cesium-heatbox
```

## 基本的な使用方法 / Basic Usage

### 日本語

```javascript
import Heatbox from 'cesium-heatbox';

// Viewerが初期化済みの状態で
const heatbox = new Heatbox(viewer, {
  voxelSize: 20,
  opacity: 0.8
});

// エンティティからヒートマップを作成
const entities = viewer.entities.values;
const statistics = await heatbox.createFromEntities(entities);

console.log('作成完了:', statistics);
```

### English

```javascript
import Heatbox from 'cesium-heatbox';

// With initialized Viewer
const heatbox = new Heatbox(viewer, {
  voxelSize: 20,
  opacity: 0.8
});

// Create heatmap from entities
const entities = viewer.entities.values;
const statistics = await heatbox.createFromEntities(entities);

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

### 日本語
- [API リファレンス](docs/API.md)
- [クイックスタート](docs/quick-start.md)
- [はじめに](docs/getting-started.md)
- [開発ガイド](docs/development-guide.md)

### English
- [API Reference](docs/API.md)
- [Quick Start](docs/quick-start.md)
- [Getting Started](docs/getting-started.md)
- [Development Guide](docs/development-guide.md)

## ライセンス / License

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。  
MIT License - See [LICENSE](LICENSE) for details.

## 貢献 / Contributing

### 日本語
プロジェクトへの貢献を歓迎します！詳細は [CONTRIBUTING.md](docs/contributing.md) を参照してください。

### English
Contributions to the project are welcome! See [CONTRIBUTING.md](docs/contributing.md) for details.
