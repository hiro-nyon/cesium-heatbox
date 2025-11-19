# Examples Overview / サンプル概要

このディレクトリには、CesiumJS Heatbox の各機能を実演するサンプルが含まれています。カテゴリ別に整理されており、基本的な使い方から高度な機能まで段階的に学習できます。

## 前提条件 / Prerequisites

- **ブラウザ**: Chrome/Firefox/Edge/Safari の最新版
- **CesiumJS**: v1.120.0 以降（サンプル内で CDN から自動読み込み）
- **ローカルサーバー**: `npm run dev` で起動、または任意の HTTP サーバー
- **Cesium Ion トークン**: 不要（サンプルはすべて Ion なしで動作）

## カテゴリ別ガイド / Category Guide

### 📘 Basic / 基本 (`basic/`)

**対象**: 初めて Heatbox を使う方、基本機能を理解したい方

最小構成の UI 例です。エンティティの生成からヒートマップ作成、表示切替までの基本フローを網羅しています。

**主な機能**:
- エンティティ生成（新宿駅周辺のテストデータ）
- 自動ボクセルサイズ計算（Basic/Occupancy モード）
- 不透明度・枠線・カラーマップの調整
- TopN ハイライト、発散カラーマップ
- 適応的枠線制御（v0.1.7+）
- エミュレーションレンダリングモード（v0.1.7+）

**ファイル**:
- `index.html` - UI 定義
- `app.js` - アプリケーションロジック

### 📊 Observability / 観測可能性 (`observability/`)

**対象**: パフォーマンス調整、デバッグ、内部動作の理解

描画パフォーマンスの可視化と適応的制御の動作確認を行うサンプル群です。

**サンプル**:
- `performance-overlay/` - リアルタイム描画統計オーバーレイ
- `adaptive-phase3/` - 適応的可視化の Phase 3 デモ

**確認できる情報**:
- 描画ボクセル数、非空ボクセル数
- TopN 比率、平均密度
- フレーム時間（参考値）
- 選択戦略の適用状況

### 🎨 Rendering / 描画 (`rendering/`)

**対象**: 描画モードの比較、高さ表現、ワイヤーフレーム表示

各種描画モードと表現方法を試すサンプル群です。

**サンプル**:
- `wireframe-height/` - ワイヤーフレーム＋高さベース表現
- `v0.1.12-features/` - v0.1.12 以降の新機能デモ

**試せる機能**:
- 標準塗りつぶし / ワイヤーフレームのみ
- 高さベースの色分け
- 複数ヒートマップの同時表示

### 🔲 Outlines / 枠線 (`outlines/`)

**対象**: 枠線レンダリング方式の比較、重なり対策

標準枠線・インセット枠線・エミュレーションの使い分けを学ぶサンプル群です。

**サンプル**:
- `outline-overlap/` - 標準/インセット枠線の重なり比較
- `emulation-scope/` - エミュレーションスコープ制御

**枠線モード**:
- `standard` - Cesium 標準の BoxGraphics 枠線
- `inset` - 内側オフセット枠線（重なり軽減）
- `emulation-only` - ポリライン枠線のみ（ボックス非表示）

**用途**:
- 密集データでの視認性向上
- TopN ボクセルの強調
- カメラ距離に応じた太さ調整

### 🎯 Selection & Limits / 選択戦略・描画上限 (`selection-limits/`)

**対象**: 大規模データの扱い、選択戦略の最適化

描画上限と選択戦略を調整して、パフォーマンスと視認性のバランスを取るサンプル群です。

**サンプル**:
- `selection-strategy/` - density/coverage/hybrid 戦略の比較
- `adaptive-rendering/` - 適応的レンダリング制御
- `performance-optimization/` - 段階的ロード・上限制御

**選択戦略**:
- `density` - 密度順に TopK 選択（デフォルト）
- `coverage` - 空間カバレッジ重視の層化抽出
- `hybrid` - 密度 TopK + カバレッジ補完

**調整可能な上限**:
- `maxRenderVoxels` - 最大描画ボクセル数
- `minCoverageRatio` - 最小カバレッジ比率（hybrid/coverage）

### 📁 Data / データ処理 (`data/`)

**対象**: データの前処理、フィルタリング

（将来拡張予定）エンティティのフィルタリングやデータ変換のユーティリティ例です。

### ⏱ Temporal / 時系列 (`temporal/`)

**対象**: v1.2.0 の `temporal` オプションを試したい方

- `basic-temporal.html` – Cesium タイムラインと同期する最小構成。Per-Time スコープで各時間帯のコントラストを最大化。
- `global-vs-per-time.html` – Global/Per-Time をラジオで切り替え、ドメインとクォンタイルの差を観察。
- `simulation.html` – 平日ラッシュ/イベント/週末のシナリオを動的に切り替え、`updateInterval` や `outOfRangeBehavior` を調整。

いずれも `dist/cesium-heatbox.umd.min.js` を読み込み、`heatbox.updateOptions({ temporal: { ... } })` で TimeController を再初期化するフローを確認できます。

### 🧪 Advanced / Classification (`advanced/`)

**対象**: v1.0.0 で追加された分類エンジンの UI/挙動を確認したい方

`classification-demo.html` では 5 種類の `classification.scheme`（linear/log/equal-interval/quantize/threshold）と 4 つのパレットを切り替えながら、`HeatboxStatistics.classification` のドメイン/クォンタイル/ブレークをリアルタイムに閲覧できます。

**操作フロー**:
1. **Generate Sample Data** – 新宿周辺へクラスタ/グラデーションのテストエンティティを生成。Viewer 上の旧ヒートマップはクリアされます。
2. **Apply Classification** – 現在の Scheme・Classes・Color Map を適用してヒートマップを描画。Apply 後に stats パネルへメタデータが反映されるので、Jenks/quantile 追加予定の v1.1.0 への布石として利用可能です。
3. Scheme ボタンまたはセレクトを切り替えると Apply ボタンが再度有効化されるため、必要に応じて再描画してください。

※ `examples/data/README.md` で紹介している `EntityFilters` を併用すれば、任意のデータ前処理 → 分類デモへの投入ルートを作れます。

## 共通ファイル / Common Utilities

`common/` ディレクトリには、各サンプルで共有する共通ユーティリティが含まれています。

### `camera.js`

カメラ制御ヘルパー。データ境界に自動フォーカス、視野角・高度の調整を簡便化します。

**主な関数**:
- `HeatboxDemoCamera.focus(viewer, { bounds, ...options })` - データ境界にフォーカス
- `getViewFromBounds(bounds, options)` - 境界から視点を計算
- `getDefaultView(options)` - デフォルト視点（新宿駅）を取得

**オプション**:
- `headingDegrees` - 方位角（度）
- `pitchDegrees` - 仰俯角（度）
- `altitude` - カメラ高度（メートル）
- `altitudeScale` - 距離に応じたスケール係数
- `cameraLatOffset` - 緯度オフセット（視界調整用）

### `demo.css`

統一されたスタイル定義。コントロールパネル、ボタン、スライダーなどの共通デザインを提供します。

**主要クラス**:
- `.hb-panel` - コントロールパネル背景
- `.hb-btn-primary` / `.hb-btn-secondary` / `.hb-btn-danger` - ボタンスタイル
- `.control-group` - 各コントロール要素のグループ

## 使い方 / How to Use

### 0. 事前準備 / Prerequisites

```bash
npm install
npm run build        # dist/cesium-heatbox.* を生成（UMDベースのHTML例で必要）
```

`npm run dev` を実行すると webpack-dev-server が立ち上がり、ESM 版を import する例もそのまま動かせます。UMD ベースの HTML を直接ブラウザで開く場合は上記 build 済みであることを確認してください。

### 1. ローカルサーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:8080/examples/` を開きます。

### 2. 個別サンプルの起動

各カテゴリ配下の `index.html` を直接開きます：

```
http://localhost:8080/examples/basic/index.html
http://localhost:8080/examples/observability/performance-overlay/index.html
```

### 3. 基本的な操作フロー

1. **Generate Entities** - テストデータを生成
2. **オプション調整** - UI で各種パラメータを変更
3. **Create Heatmap** - ヒートマップを描画
4. **表示切替** - 表示/非表示、クリア

## ファイル構成 / File Structure

```
examples/
├── README.md           # このファイル / This file
├── common/             # 共通ユーティリティ / Common utilities
│   ├── camera.js       # カメラ制御 / Camera control
│   └── demo.css        # 共通スタイル / Common styles
├── basic/              # 基本例 / Basic example
│   ├── index.html
│   └── app.js
├── observability/      # 観測可能性 / Observability
│   ├── README.md
│   ├── performance-overlay/
│   └── adaptive-phase3/
├── rendering/          # 描画 / Rendering
│   ├── README.md
│   ├── wireframe-height/
│   └── v0.1.12-features/
├── outlines/           # 枠線 / Outlines
│   ├── README.md
│   ├── outline-overlap/
│   └── emulation-scope/
├── selection-limits/   # 選択戦略 / Selection & Limits
│   ├── README.md
│   ├── selection-strategy/
│   ├── adaptive-rendering/
│   └── performance-optimization/
└── data/               # データ処理 / Data processing
    └── README.md
```

## 技術仕様 / Technical Specifications

### Cesium 初期化

すべてのサンプルは以下の標準設定を使用します（ADR-0012 参照）：

- **Ion トークン**: 無効化（`null`）
- **地図タイル**: CartoDB Light または OpenStreetMap
- **地形**: EllipsoidTerrainProvider（平面近似）
- **ベース色**: `#0f172a`（ダークブルーグレー）

### データ生成

テストデータは新宿駅周辺（`lon: 139.6917, lat: 35.6895`）を中心に生成されます：

- **範囲**: 経度±0.008°、緯度±0.008°（約1.6km四方）
- **高度**: 0–180m（ランダム）
- **エンティティ数**: 100–5000（UI で調整可能）

### カメラ設定

統一されたカメラ設定により、すべてのサンプルで一貫したビューを提供：

- **方位角**: 0°（真北向き）
- **仰俯角**: -45°（斜め下向き）
- **高度**: 2000m
- **緯度オフセット**: -0.025°（南に約2.75km、視界中心調整）

## トラブルシューティング / Troubleshooting

### 白画面・エラーが出る

1. ブラウザのコンソールでエラーを確認
2. ハードリロード（Cmd+Shift+R / Ctrl+Shift+F5）
3. `npm run build` でライブラリを再ビルド
4. キャッシュクリア

### パフォーマンスが悪い

1. エンティティ数を減らす（100–1000 程度）
2. `maxRenderVoxels` を下げる（500–2000）
3. 自動ボクセルサイズを有効化
4. 選択戦略を `density` に変更

### カメラ位置がおかしい

1. `common/camera.js` が正しく読み込まれているか確認
2. `CAMERA_DEFAULTS` の `cameraLatOffset` を調整
3. ブラウザコンソールで `HeatboxDemoCamera` の存在確認

## 参照 / References

- **API ドキュメント**: `docs/api/`
- **ADR-0012**: Examples 構成ガイドライン
- **ROADMAP.md**: 今後の機能追加計画（v0.1.16 Examples 体系化）
- **Wiki**: https://github.com/your-org/cesium-heatbox/wiki

---

# Examples Overview (English)

This directory contains sample applications demonstrating various features of CesiumJS Heatbox. Organized by category, they provide a progressive learning path from basic usage to advanced features.

## Prerequisites

- **Browser**: Latest Chrome/Firefox/Edge/Safari
- **CesiumJS**: v1.120.0+ (auto-loaded via CDN)
- **Local Server**: `npm run dev` or any HTTP server
- **Cesium Ion Token**: Not required (all samples work without Ion)

## Category Guide

### 📘 Basic (`basic/`)

**For**: First-time users, understanding basic functionality

Minimal UI example covering the basic workflow from entity generation to heatmap creation and display toggle.

**Key Features**:
- Entity generation (test data around Shinjuku Station)
- Auto voxel size calculation (Basic/Occupancy modes)
- Opacity, outline, and color map adjustments
- TopN highlighting, diverging color maps
- Adaptive outline control (v0.1.7+)
- Emulation rendering modes (v0.1.7+)

**Files**:
- `index.html` - UI definition
- `app.js` - Application logic

### 📊 Observability (`observability/`)

**For**: Performance tuning, debugging, understanding internals

Visualize rendering performance and verify adaptive control behavior.

**Samples**:
- `performance-overlay/` - Real-time rendering statistics overlay
- `adaptive-phase3/` - Adaptive visualization Phase 3 demo

**Available Metrics**:
- Rendered voxel count, non-empty voxel count
- TopN ratio, average density
- Frame time (reference)
- Applied selection strategy

### 🎨 Rendering (`rendering/`)

**For**: Comparing rendering modes, height-based visualization, wireframes

Explore various rendering modes and visualization techniques.

**Samples**:
- `wireframe-height/` - Wireframe + height-based coloring
- `v0.1.12-features/` - v0.1.12+ new features demo

**Available Features**:
- Standard fill / wireframe-only
- Height-based color gradients
- Multiple simultaneous heatmaps

### 🔲 Outlines (`outlines/`)

**For**: Comparing outline rendering methods, overlap mitigation

Learn when to use standard, inset, or emulation outlines.

**Samples**:
- `outline-overlap/` - Standard vs inset outline overlap comparison
- `emulation-scope/` - Emulation scope control

**Outline Modes**:
- `standard` - Cesium's native BoxGraphics outlines
- `inset` - Inset offset outlines (reduced overlap)
- `emulation-only` - Polyline outlines only (no box fill)

**Use Cases**:
- Improving visibility in dense data
- Emphasizing TopN voxels
- Distance-adaptive outline width

### 🎯 Selection & Limits (`selection-limits/`)

**For**: Handling large datasets, optimizing selection strategies

Balance performance and visibility by adjusting rendering limits and selection strategies.

**Samples**:
- `selection-strategy/` - Compare density/coverage/hybrid strategies
- `adaptive-rendering/` - Adaptive rendering control
- `performance-optimization/` - Progressive loading & limit control

**Selection Strategies**:
- `density` - TopK by density (default)
- `coverage` - Spatial coverage-focused stratified sampling
- `hybrid` - Density TopK + coverage补充

**Adjustable Limits**:
- `maxRenderVoxels` - Maximum rendered voxels
- `minCoverageRatio` - Minimum coverage ratio (hybrid/coverage)

### 📁 Data (`data/`)

**For**: Data preprocessing, filtering

(Future expansion) Utility examples for entity filtering and data transformation.

## Common Utilities

The `common/` directory contains shared utilities used across samples.

### `camera.js`

Camera control helper for auto-focusing on data bounds and adjusting view angles/altitude.

**Main Functions**:
- `HeatboxDemoCamera.focus(viewer, { bounds, ...options })` - Focus on data bounds
- `getViewFromBounds(bounds, options)` - Calculate view from bounds
- `getDefaultView(options)` - Get default view (Shinjuku Station)

**Options**:
- `headingDegrees` - Heading angle (degrees)
- `pitchDegrees` - Pitch angle (degrees)
- `altitude` - Camera altitude (meters)
- `altitudeScale` - Distance-based scale factor
- `cameraLatOffset` - Latitude offset (for view adjustment)

### `demo.css`

Unified style definitions providing common design for control panels, buttons, sliders, etc.

**Main Classes**:
- `.hb-panel` - Control panel background
- `.hb-btn-primary` / `.hb-btn-secondary` / `.hb-btn-danger` - Button styles
- `.control-group` - Control element group

## How to Use

### 1. Start Local Server

```bash
npm run dev
```

Open `http://localhost:8080/examples/` in your browser.

### 2. Launch Individual Samples

Open `index.html` files directly under each category:

```
http://localhost:8080/examples/basic/index.html
http://localhost:8080/examples/observability/performance-overlay/index.html
```

### 3. Basic Operation Flow

1. **Generate Entities** - Create test data
2. **Adjust Options** - Modify parameters via UI
3. **Create Heatmap** - Render heatmap
4. **Toggle Display** - Show/hide, clear

## File Structure

```
examples/
├── README.md           # This file
├── common/             # Common utilities
│   ├── camera.js       # Camera control
│   └── demo.css        # Common styles
├── basic/              # Basic example
│   ├── index.html
│   └── app.js
├── observability/      # Observability
│   ├── README.md
│   ├── performance-overlay/
│   └── adaptive-phase3/
├── rendering/          # Rendering
│   ├── README.md
│   ├── wireframe-height/
│   └── v0.1.12-features/
├── outlines/           # Outlines
│   ├── README.md
│   ├── outline-overlap/
│   └── emulation-scope/
├── selection-limits/   # Selection & Limits
│   ├── README.md
│   ├── selection-strategy/
│   ├── adaptive-rendering/
│   └── performance-optimization/
└── data/               # Data processing
    └── README.md
```

## Technical Specifications

### Cesium Initialization

All samples use the following standard configuration (see ADR-0012):

- **Ion Token**: Disabled (`null`)
- **Map Tiles**: CartoDB Light or OpenStreetMap
- **Terrain**: EllipsoidTerrainProvider (flat approximation)
- **Base Color**: `#0f172a` (dark blue-gray)

### Data Generation

Test data is generated around Shinjuku Station (`lon: 139.6917, lat: 35.6895`):

- **Extent**: ±0.008° longitude/latitude (~1.6km square)
- **Altitude**: 0–180m (random)
- **Entity Count**: 100–5000 (adjustable via UI)

### Camera Settings

Unified camera settings provide consistent views across all samples:

- **Heading**: 0° (due north)
- **Pitch**: -45° (looking down)
- **Altitude**: 2000m
- **Latitude Offset**: -0.025° (south ~2.75km, view centering)

## Troubleshooting

### Blank Screen / Errors

1. Check browser console for errors
2. Hard reload (Cmd+Shift+R / Ctrl+Shift+F5)
3. Rebuild library: `npm run build`
4. Clear cache

### Poor Performance

1. Reduce entity count (100–1000 range)
2. Lower `maxRenderVoxels` (500–2000)
3. Enable auto voxel size
4. Switch selection strategy to `density`

### Camera Position Issues

1. Verify `common/camera.js` is loaded correctly
2. Adjust `cameraLatOffset` in `CAMERA_DEFAULTS`
3. Check `HeatboxDemoCamera` exists in browser console

## References

- **API Documentation**: `docs/api/`
- **ADR-0012**: Examples organization guidelines
- **ROADMAP.md**: Future feature plans (v0.1.16 Examples organization)
- **Wiki**: https://github.com/your-org/cesium-heatbox/wiki
