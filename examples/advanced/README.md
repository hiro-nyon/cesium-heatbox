# Advanced Examples - cesium-heatbox v0.1.2

このディレクトリには、cesium-heatbox v0.1.2の高度な使用例が含まれています。

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

### 2. `wireframe-height-demo.js` ⭐ **v0.1.2 新機能**
**wireframeOnly & heightBased 機能のデモ**

- 4つの表示モードの同時比較
- 密度レベル別最適表示
- インタラクティブな表示切り替え

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

## 🚀 使用方法

### 基本的なセットアップ

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.132/Build/Cesium/Cesium.js"></script>
  <link href="https://cesium.com/downloads/cesiumjs/releases/1.132/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
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

## 🎯 v0.1.2 新機能の活用

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

## 📊 パフォーマンスガイドライン

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

## 🔧 トラブルシューティング

### よくある問題

**Q: 大量データで動作が重い**  
A: `performance-optimization.js`の適応的設定を参考に、データサイズに応じて設定を調整

**Q: ボクセルが重なって見えない**  
A: `wireframeOnly: true`を使用して視認性を改善

**Q: 密度の違いが分からない**  
A: `heightBased: true`で高さベース表現を使用

**Q: メモリ不足エラー**  
A: `maxRenderVoxels`を小さくし、`wireframeOnly: true`を使用

## 📚 関連ドキュメント

- [API Reference](../../wiki/API-Reference.md)
- [Examples](../../wiki/Examples.md)
- [Quick Start](../../wiki/Quick-Start.md)
- [Basic Examples](../basic/)

## 🤝 コントリビュート

新しい高度な例の追加や改善提案は、GitHubのIssuesまたはPull Requestでお願いします。

---

**cesium-heatbox v0.1.2** - 視認性とパフォーマンスの両立を実現
