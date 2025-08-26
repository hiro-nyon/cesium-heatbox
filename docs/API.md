# API リファレンス - v0.1.6

> **⚠️ 注意**: このライブラリは現在npm未登録です。GitHubから直接取得してください。

## Heatbox クラス

### コンストラクタ

#### `new Heatbox(viewer, options)`

新しいHeatboxインスタンスを作成します。

**パラメータ:**
- `viewer` (Cesium.Viewer) - CesiumJS Viewerインスタンス
- `options` (Object, optional) - 設定オプション

**オプション（v0.1.6対応）:**
- `voxelSize` (number, default: 20) - 目標ボクセルサイズ（メートル）。実際の描画寸法はグリッド分割数に基づく各軸の実セルサイズ `cellSizeX/Y/Z` を使用し、`voxelSize` 以下になる場合があります（重なり防止のため）。
- `opacity` (number, default: 0.8) - データボクセルの透明度 (0.0-1.0)
- `emptyOpacity` (number, default: 0.03) - 空ボクセルの透明度 (0.0-1.0)
- `showOutline` (boolean, default: true) - アウトライン表示の有無
- `showEmptyVoxels` (boolean, default: false) - 空ボクセル表示の有無
- `minColor` (Array, default: [0, 32, 255]) - 最小密度の色 (RGB)
- `maxColor` (Array, default: [255, 64, 0]) - 最大密度の色 (RGB)
- `maxRenderVoxels` (number, default: 50000) - 最大描画ボクセル数
- **`wireframeOnly` (boolean, default: false) - 枠線のみ表示（v0.1.2新機能）**
- **`heightBased` (boolean, default: false) - 密度を高さで表現（v0.1.2新機能）**
- **`outlineWidth` (number, default: 2) - 枠線の太さ（v0.1.2新機能）**
- **`debug` (boolean | { showBounds?: boolean }, default: false) - ログ制御と境界表示（v0.1.5でオブジェクト形式に拡張）**
- **`autoVoxelSize` (boolean, default: false) - v0.1.4: ボクセルサイズを自動決定。`voxelSize` 未指定時に有効**
- **`colorMap` ('custom'|'viridis'|'inferno', default: 'custom') - v0.1.5: 知覚均等カラーマップ**
- **`diverging` (boolean, default: false) / `divergingPivot` (number, default: 0) - v0.1.5: 二極性データ向け発散配色**
- **`highlightTopN` (number|null, default: null) / `highlightStyle` ({ outlineWidth?: number; boostOpacity?: number }) - v0.1.5: 上位Nボクセルの強調表示**
// v0.1.6 追加
- **`voxelGap` (number, default: 0) - v0.1.6: ボクセル間にギャップ（メートル）を設けて枠線重なりを軽減**
- **`outlineOpacity` (number, default: 1.0) - v0.1.6: 枠線の透明度（0-1）を制御**
- **`outlineWidthResolver` ((params) => number|null, default: null) - v0.1.6: ボクセル毎の枠線太さを動的決定**
- `batchMode` は v0.1.5 で非推奨（無視されます。将来削除予定）

> 寸法について: 描画されるボックスの幅・奥行・高さは、グリッドの実セルサイズ `cellSizeX`, `cellSizeY`, `cellSizeZ` を使用します。`heightBased: true` の場合は `cellSizeZ` を基準に密度で高さをスケーリングします。

**例（v0.1.5）:**
```javascript
const heatbox = new Heatbox(viewer, {
  // 自動ボクセルサイズ（v0.1.4）
  autoVoxelSize: true,
  // デバッグ境界表示（v0.1.5）
  debug: { showBounds: true },
  // 視認性（v0.1.2）
  wireframeOnly: true,
  heightBased: true,
  outlineWidth: 2,
  // カラーマップ（v0.1.5）
  colorMap: 'viridis',
  // TopN強調（v0.1.5）
  highlightTopN: 50,
  highlightStyle: { outlineWidth: 4, boostOpacity: 0.2 }
});
```

**例（v0.1.6: 枠線重なり対策・動的枠線）:**
```javascript
const heatbox = new Heatbox(viewer, {
  colorMap: 'viridis',
  // 枠線重なり対策
  voxelGap: 1.0,          // 1m分のギャップを確保
  outlineOpacity: 0.6,    // 枠線を半透明に
  // 動的枠線制御（密度で太さを変える）
  outlineWidth: 2,        // 既定値
  highlightTopN: 10,
  outlineWidthResolver: ({ normalizedDensity, isTopN }) => {
    if (isTopN) return 4;           // 上位は太く
    return normalizedDensity > 0.7 ? 1 : 2; // 高密度は細く
  }
});
```

#### v0.1.6: 枠線制御の優先順位（重要）
- 優先度1: `outlineWidthResolver` を定義した場合、その戻り値が最優先（TopN設定より優先）。
- 優先度2: Resolver未使用時は、`highlightTopN` が有効なら TopN に `highlightStyle.outlineWidth` を適用、その他は `outlineWidth`。
- 優先度3: いずれも未設定なら、既定の `outlineWidth` が全ボクセルに適用。

補助オプション:
- `outlineOpacity` は枠線色のアルファ値に適用され、重なり時の視覚ノイズを低減。
- `voxelGap` はボクセル寸法を縮め、隣接枠線の重なり自体を軽減。


### メソッド

#### `createFromEntities(entities)`

エンティティ配列からヒートマップを非同期に作成します。内部で境界計算・グリッド作成・分類・描画を順に実行します。

v0.1.4 から `autoVoxelSize: true` の場合、`voxelSize` を省略するとエンティティ密度とデータ範囲からボクセルサイズを推定し、上限（`maxRenderVoxels`/内部制限）を超えないように自動調整します。統計情報に自動調整の有無と最終サイズが含まれます。

**パラメータ:**
- `entities` (Array<Cesium.Entity>)

**戻り値:**
- `Promise<HeatboxStatistics>`

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

#### `getOptions()`

現在のオプション（正規化済み）を取得します。

**戻り値:**
- `HeatboxOptions`

#### `getDebugInfo()`

内部状態（bounds/grid/statistics を含む）を取得します。デバッグ用途。

**戻り値:**
- `Object`

### 静的メソッド

#### `Heatbox.filterEntities(entities, predicate)`

任意の条件関数でエンティティ配列をフィルタします。

**戻り値:**
- `Array<Cesium.Entity>`

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
  // v0.1.4 自動ボクセルサイズ調整情報
  autoAdjusted?: boolean;
  originalVoxelSize?: number | null;
  finalVoxelSize?: number | null;
  adjustmentReason?: string | null;
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
  maxRenderVoxels?: number; // レンダリング上限（非空ボクセルが上限超過時は高密度トップNのみ描画）
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
