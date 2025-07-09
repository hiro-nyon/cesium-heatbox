# API リファレンス

## Heatbox クラス

### コンストラクタ

#### `new Heatbox(viewer, options)`

新しいHeatboxインスタンスを作成します。

**パラメータ:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewerインスタンス
- `options` (Object, optional) - 設定オプション

**オプション:**
- `voxelSize` (number, default: 20) - ボクセル一辺の長さ（メートル）
- `opacity` (number, default: 0.8) - データボクセルの透明度 (0.0-1.0)
- `emptyOpacity` (number, default: 0.03) - 空ボクセルの透明度 (0.0-1.0)
- `showOutline` (boolean, default: true) - アウトライン表示の有無
- `showEmptyVoxels` (boolean, default: false) - 空ボクセル表示の有無
- `minColor` (Array, default: [0, 32, 255]) - 最小密度の色 (RGB)
- `maxColor` (Array, default: [255, 64, 0]) - 最大密度の色 (RGB)
- `maxRenderVoxels` (number, default: 50000) - 最大描画ボクセル数
- `batchMode` (string, default: 'auto') - バッチ描画モード ('auto', 'primitive', 'entity')

**例:**
```javascript
const heatbox = new Heatbox(viewer, {
  voxelSize: 25,
  opacity: 0.9,
  showEmptyVoxels: true
});
```

### メソッド

#### `async createFromEntities(entities)`

エンティティ配列からヒートマップを作成します。

**パラメータ:**
- `entities` (Array<Cesium.Entity>) - 対象エンティティ配列

**戻り値:**
- `Promise<HeatboxStatistics>` - 統計情報

**例:**
```javascript
const entities = viewer.entities.values;
const statistics = await heatbox.createFromEntities(entities);
console.log('作成完了:', statistics);
```

#### `setVisible(show)`

ヒートマップの表示/非表示を切り替えます。

**パラメータ:**
- `show` (boolean) - 表示する場合はtrue

**例:**
```javascript
heatbox.setVisible(false); // 非表示
heatbox.setVisible(true);  // 表示
```

#### `clear()`

ヒートマップをクリアします。

**例:**
```javascript
heatbox.clear();
```

#### `getStatistics()`

統計情報を取得します。

**戻り値:**
- `HeatboxStatistics|null` - 統計情報、未作成の場合はnull

**例:**
```javascript
const stats = heatbox.getStatistics();
if (stats) {
  console.log('総ボクセル数:', stats.totalVoxels);
  console.log('非空ボクセル数:', stats.nonEmptyVoxels);
}
```

#### `getDetailedReport()`

詳細な統計レポートを取得します。

**戻り値:**
- `Object|null` - 詳細レポート、未作成の場合はnull

**例:**
```javascript
const report = heatbox.getDetailedReport();
if (report) {
  console.log('密度分布:', report.densityDistribution);
  console.log('分位数:', report.percentiles);
}
```

#### `updateOptions(newOptions)`

オプションを更新します。

**パラメータ:**
- `newOptions` (Object) - 新しいオプション

**例:**
```javascript
heatbox.updateOptions({
  voxelSize: 30,
  opacity: 0.7
});
```

#### `static filterEntities(entities, filter)`

エンティティをフィルタリングします。

**パラメータ:**
- `entities` (Array<Cesium.Entity>) - 対象エンティティ配列
- `filter` (Function) - フィルタ関数

**戻り値:**
- `Array<Cesium.Entity>` - フィルタリングされたエンティティ配列

**例:**
```javascript
const filteredEntities = Heatbox.filterEntities(entities, (entity) => {
  return entity.position.height > 50; // 高度50m以上
});
```

## 型定義

### HeatboxStatistics

```typescript
interface HeatboxStatistics {
  totalVoxels: number;        // 総ボクセル数（空含む）
  renderedVoxels: number;     // 描画されるボクセル数
  nonEmptyVoxels: number;     // データ有りボクセル数
  emptyVoxels: number;        // 空ボクセル数
  totalEntities: number;      // 総エンティティ数
  minCount: number;           // 最小エンティティ数/ボクセル
  maxCount: number;           // 最大エンティティ数/ボクセル
  averageCount: number;       // 平均エンティティ数/ボクセル
}
```

### HeatboxOptions

```typescript
interface HeatboxOptions {
  voxelSize?: number;
  opacity?: number;
  emptyOpacity?: number;
  showOutline?: boolean;
  showEmptyVoxels?: boolean;
  minColor?: [number, number, number];
  maxColor?: [number, number, number];
  maxRenderVoxels?: number;
  batchMode?: 'auto' | 'primitive' | 'entity';
}
```

## ユーティリティ関数

### `getAllEntities(viewer)`

指定されたviewerの全エンティティを取得します。

**パラメータ:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewer

**戻り値:**
- `Array<Cesium.Entity>` - エンティティ配列

### `generateTestEntities(viewer, bounds, count)`

テスト用エンティティを生成します。

**パラメータ:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewer
- `bounds` (Object) - 生成範囲
- `count` (number, default: 500) - 生成数

**戻り値:**
- `Array<Cesium.Entity>` - 生成されたエンティティ配列

## エラーハンドリング

### よくあるエラーとその対処法

#### `対象エンティティがありません`
- エンティティ配列が空の場合に発生
- 有効なエンティティを含む配列を渡してください

#### `CesiumJS Viewerが無効です`
- Viewerが正しく初期化されていない場合に発生
- 有効なCesium.Viewerインスタンスを渡してください

#### `ボクセル数が上限を超えています`
- 生成されるボクセル数が制限を超えた場合に発生
- ボクセルサイズを大きくするか、処理範囲を小さくしてください

#### `WebGLがサポートされていません`
- ブラウザがWebGLに対応していない場合に発生
- WebGL対応ブラウザを使用してください

## パフォーマンス考慮事項

### 推奨設定

- **エンティティ数**: 500-1,500個
- **ボクセルサイズ**: 20-50メートル
- **最大ボクセル数**: 50,000個以下

### 最適化のヒント

1. **ボクセルサイズの調整**: 大きなボクセルサイズを使用してボクセル数を減らす
2. **エンティティの事前フィルタリング**: 不要なエンティティを除外
3. **空ボクセルの非表示**: `showEmptyVoxels: false`を設定
4. **描画制限の活用**: `maxRenderVoxels`で描画数を制限
