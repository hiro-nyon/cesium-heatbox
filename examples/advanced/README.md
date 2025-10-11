# Advanced Examples - cesium-heatbox

このディレクトリには、cesium-heatbox の高度な使用例が含まれています。

目次（体系化：v0.1.14計画）
- Observability（観測可能性）
  - performance-overlay-demo.html（v0.1.12 のオーバーレイ）
  - **adaptive-phase3-demo.html（v0.1.15 Phase 3 適応制御デモ）** 🆕
  - benchmark-usage（CLIの使い方は後述リンク）
- Rendering（描画モード・高さ/ワイヤーフレーム）
  - wireframe-height-demo.js / wireframe-height-demo-umd.html
  - adaptive-rendering-demo.html / adaptive-rendering-demo.js
- Outlines（枠線：標準/インセット/エミュレーション）
  - outline-overlap-demo-umd.html
  - emulation-scope-demo.html（計画中）
- Selection & Limits（選択戦略と描画上限）
  - performance-optimization.js（段階的ロード・上限制御）
  - selection-strategy-demo.html（計画中: density/coverage/hybrid 比較）
- Data（データ生成・フィルタリング）
  - entity-filtering.js

## 📁 ファイル構成

### 1. `entity-filtering.js`
**エンティティフィルタリングの高度な例**

- エンティティタイプ別フィルタリング
- 高度・地理的範囲によるフィルタ
- 属性値によるフィルタ
- v0.1.2対応の位置取得ロジック

```javascript
import { EntityFilters } from './entity-filtering.js';

// Point エンティティのみフィルタ
const points = Heatbox.filterEntities(viewer.entities.values, EntityFilters.pointsOnly);

// 高度範囲でフィルタ（v0.1.2対応）
const highAltitude = Heatbox.filterEntities(
  viewer.entities.values, 
  EntityFilters.byAltitudeRange(100, 1000)
);

// 地理的範囲でフィルタ
const tokyoArea = Heatbox.filterEntities(
  viewer.entities.values,
  EntityFilters.byGeographicBounds(139.7, 139.8, 35.65, 35.72)
);
```

### 2. `wireframe-height-demo.js` / `wireframe-height-demo-umd.html` **v0.1.2 新機能**
**wireframeOnly & heightBased 機能のデモ**

- 4つの表示モードの同時比較
- 密度レベル別最適表示
- インタラクティブな表示切り替え
- **NEW**: UMD版でブラウザ直接実行対応

```javascript
import { WireframeHeightDemo } from './wireframe-height-demo.js';

const demo = new WireframeHeightDemo(viewer);

// 比較デモ実行
const stats = await demo.createComparisonDemo();

// 密度最適化デモ
await demo.createDensityOptimizedDemo();

// インタラクティブデモ（キー1-4で切り替え）
const interactiveHeatbox = demo.setupInteractiveDemo();
```

**表示モード:**
- **1キー**: 従来表示
- **2キー**: 枠線のみ（視認性向上）
- **3キー**: 高さベース表現
- **4キー**: 枠線+高さベース（最高の視認性）

### 3. `performance-optimization.js`
**パフォーマンス最適化の高度な例**

- 大量データの段階的ロード
- 適応的品質調整
- メモリ使用量最適化
- リアルタイム更新パフォーマンス

```javascript
import { PerformanceOptimizationDemo } from './performance-optimization.js';

const perfDemo = new PerformanceOptimizationDemo(viewer);

// 段階的ローディング（10,000エンティティ）
await perfDemo.demonstrateProgressiveLoading();

// データサイズに応じた適応的設定
await perfDemo.demonstrateAdaptiveQuality();

// メモリ使用量測定
await perfDemo.demonstrateMemoryOptimization();

// リアルタイム更新テスト
await perfDemo.demonstrateRealTimeUpdates();

// パフォーマンスレポート
const report = perfDemo.generatePerformanceReport();
```

### 4. `outline-overlap-demo-umd.html` **v0.1.6 新機能**
**枠線重なり対策と動的枠線制御のデモ（ブラウザ直接実行対応）**

- `voxelGap` によるボクセル寸法の縮小（重なり軽減）
- `outlineOpacity` による枠線透明度制御
- 適応的枠線プリセット (`adaptiveOutlines` + `outlineWidthPreset`) による密度連動の枠線太さ調整（TopN強調対応）

UMDビルドを参照するため、ファイルをそのままブラウザで開けます。
Baseline（対策なし）と Mitigated（対策あり）をワンクリックで比較できます。

### 5. `adaptive-phase3-demo.html` **v0.1.15 Phase 3 新機能** 🆕
**適応制御機能の包括的デモ（ADR-0011 Phase 3）**

ADR-0011 Phase 3で実装された適応制御機能を体験できる包括的なデモです。

**主な機能:**
- 📊 密度パターン生成（Clustered/Scattered/Gradient/Mixed）
- ⚙️ 適応的パラメータのリアルタイム調整
- 🎯 Z軸スケール補正の有効化/無効化
- 🔍 重なり検出と自動モード推奨
- 📈 拡張パフォーマンスオーバーレイ（適応制御メトリクス付き）
- ⚡ ベンチマーク機能

**表示される適応制御メトリクス:**
- Dense Areas: 密集エリア検出数と割合
- Emulation: エミュレーションモード使用数と割合
- Avg Width: 平均アウトライン幅（適応制御による調整後）
- Overlaps: 重なり検出数と割合
- Z-Scale Adj: Z軸スケール補正適用数

```html
<!-- 使用例：ブラウザで直接開く -->
file:///.../examples/advanced/adaptive-phase3-demo.html
```

**推奨設定（高密度データ）:**
```javascript
{
  pattern: 'clustered',        // 高密度クラスター
  entityCount: 2000,           // 適度なデータ量
  adaptiveParams: {
    zScaleCompensation: true,  // Z軸補正有効
    overlapDetection: true,    // 重なり検出有効
    densityThreshold: 3,       // 密集判定閾値
    neighborhoodRadius: 30     // 近傍探索半径
  },
  outlineRenderMode: 'emulation-only',  // エミュレーションモード
  outlineWidthPreset: 'adaptive'         // 適応的プリセット
}
```

## 使用方法

### オプション1: ブラウザ直接実行（簡単！）

**UMD版デモファイル**（`.html`ファイル）を直接ブラウザで開くことができます：
- `wireframe-height-demo-umd.html` - ブラウザで直接動作
- `outline-overlap-demo-umd.html` - 0.1.6の枠線対策を体験

これらのファイルはUMDビルドを使用しているため、開発サーバーやビルドツールなしで動作します。

### オプション2: モジュール形式（高度）

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Cesium.js"></script>
  <link href="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
</head>
<body>
  <div id="cesiumContainer" style="width: 100%; height: 100%;"></div>
  
  <script type="module">
    import { WireframeHeightDemo } from './wireframe-height-demo.js';
    
    const viewer = new Cesium.Viewer('cesiumContainer');
    const demo = new WireframeHeightDemo(viewer);
    
    // デモ実行
    await demo.createComparisonDemo();
  </script>
</body>
</html>
```

### Node.js環境での使用

```javascript
// ES Modules
import Heatbox from '../../src/index.js';
import { EntityFilters } from './entity-filtering.js';
import { WireframeHeightDemo } from './wireframe-height-demo.js';
import { PerformanceOptimizationDemo } from './performance-optimization.js';

// 使用例
const viewer = new Cesium.Viewer('cesiumContainer');

// 1. フィルタリング
const filteredEntities = Heatbox.filterEntities(
  viewer.entities.values, 
  EntityFilters.pointsOnly
);

// 2. v0.1.2新機能デモ
const wireframeDemo = new WireframeHeightDemo(viewer);
await wireframeDemo.createComparisonDemo();

// 3. パフォーマンス最適化
const perfDemo = new PerformanceOptimizationDemo(viewer);
await perfDemo.demonstrateProgressiveLoading();
```

## v0.1.2 新機能の活用

### wireframeOnly（枠線のみ表示）
**問題**: 重なったボクセルで内部構造が見えない  
**解決**: 枠線のみ表示で視認性を大幅改善

```javascript
const heatbox = new Heatbox(viewer, {
  wireframeOnly: true,    // ボックス本体を透明に
  outlineWidth: 2,        // 枠線を太く
  showOutline: true       // 枠線表示
});
```

### heightBased（高さベース表現）
**効果**: 密度を高さで直感的に表現

```javascript
const heatbox = new Heatbox(viewer, {
  heightBased: true,      // 高密度 = 高いボクセル
  voxelSize: 25,
  opacity: 0.8
});
```

### 組み合わせ使用（推奨）
**最高の視認性**: 枠線 + 高さベース

```javascript
const heatbox = new Heatbox(viewer, {
  wireframeOnly: true,    // 透明ボックス
  heightBased: true,      // 高さで密度表現
  outlineWidth: 3,        // 太い枠線
  showEmptyVoxels: false  // 空ボクセル非表示
});
```

## パフォーマンスガイドライン

### データサイズ別推奨設定

| エンティティ数 | voxelSize | maxRenderVoxels | wireframeOnly | 推定処理時間 |
|---------------|-----------|-----------------|---------------|-------------|
| < 2,000       | 20m       | 500            | false         | < 100ms     |
| 2,000-8,000   | 30m       | 300            | true          | 100-300ms   |
| 8,000-20,000  | 50m       | 150            | true          | 300-800ms   |
| > 20,000      | 100m      | 100            | true          | > 800ms     |

### メモリ最適化のコツ

1. **wireframeOnly = true**: エンティティ数を削減
2. **maxRenderVoxels制限**: 描画負荷を制限
3. **showEmptyVoxels = false**: 不要なボクセルを非表示
4. **段階的ロード**: 大量データを分割処理

## トラブルシューティング

### よくある問題

**Q: 大量データで動作が重い**  
A: `performance-optimization.js`の適応的設定を参考に、データサイズに応じて設定を調整

**Q: ボクセルが重なって見えない**  
A: `wireframeOnly: true`を使用して視認性を改善

**Q: 密度の違いが分からない**  
A: `heightBased: true`で高さベース表現を使用

**Q: メモリ不足エラー**  
A: `maxRenderVoxels`を小さくし、`wireframeOnly: true`を使用

## 関連ドキュメント
  
### 観測可能性の追加例（v0.1.12+）
- performance-overlay-demo.html（FPS/フレーム時間/ボクセル統計/メモリ目安を表示）
- ベンチマークCLIの使い方は `tools/benchmark.js` を参照（`npm run benchmark -- --out markdown` でMD出力）

### 次期整理（v0.1.14）
- カテゴリ配下に README を追加し、リンクを更新します。既存ファイルの移動は段階的に行います（リンク切れ防止のため）。

- [API Reference](../../wiki/API-Reference.md)
- [Examples](../../wiki/Examples.md)
- [Quick Start](../../wiki/Quick-Start.md)
- [Basic Examples](../basic/)

## 🤝 コントリビュート

新しい高度な例の追加や改善提案は、GitHubのIssuesまたはPull Requestでお願いします。

---

**cesium-heatbox** - 視認性とパフォーマンスの両立を実現
