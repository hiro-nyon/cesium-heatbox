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

#### `setData(entities)`

エンティティ配列からヒートマップデータを作成し、描画します。

**パラメータ:**
- `entities` (Array<Cesium.Entity>) - 対象エンティティ配列

**戻り値:**
- `void`

**例:**
```javascript
const entities = viewer.entities.values;
heatbox.setData(entities);
console.log('ヒートマップ作成が実行されました。');
```

#### `updateOptions(newOptions)`

オプションを更新し、既存のヒートマップを再描画します。

**パラメータ:**
- `newOptions` (Object) - 新しいオプション

**例:**
```javascript
heatbox.updateOptions({
  voxelSize: 30,
  opacity: 0.7
});
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

ヒートマップをクリアし、関連リソースをリセットします。

**例:**
```javascript
heatbox.clear();
```

#### `destroy()`

Heatboxインスタンスを破棄し、確保したリソース（イベントリスナー等）を解放します。

**例:**
```javascript
heatbox.destroy();
```

#### `getStatistics()`

現在のヒートマップの統計情報を取得します。

**戻り値:**
- `HeatboxStatistics|null` - 統計情報オブジェクト。データ未作成の場合はnull。

**例:**
```javascript
const stats = heatbox.getStatistics();
if (stats) {
  console.log('総ボクセル数:', stats.totalVoxels);
  console.log('非空ボクセル数:', stats.nonEmptyVoxels);
}
```

#### `getBounds()`

現在のヒートマップの境界情報（緯度経度）を取得します。

**戻り値:**
- `Object|null` - 境界情報オブジェクト。データ未作成の場合はnull。

**例:**
```javascript
const bounds = heatbox.getBounds();
if (bounds) {
  console.log('最大緯度:', bounds.maxLat);
}
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

### `createHeatbox(viewer, options)`

Heatboxインスタンスを生成するためのヘルパー関数です。

**パラメータ:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewer
- `options` (Object) - 設定オプション

**戻り値:**
- `Heatbox` - 新しいHeatboxインスタンス

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

### `getEnvironmentInfo()`

ライブラリのバージョンやWebGLサポート状況などの環境情報を取得します。

**戻り値:**
- `Object` - 環境情報

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
