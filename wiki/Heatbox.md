# Class: Heatbox

CesiumJS Heatbox メインクラス
3Dボクセルベースのヒートマップ可視化を提供

## Constructor

### new Heatbox(viewer, options)

## Methods

### clear()

ヒートマップをクリア

### (async) createFromEntities(entities) → {Promise.<Object>}

エンティティからヒートマップを作成（非同期API）

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | 対象エンティティ配列 |

### destroy()

インスタンスを破棄し、イベントリスナーを解放

### getBounds() → {Object|null}

境界情報を取得

### getDebugInfo() → {Object}

デバッグ情報を取得

### getOptions() → {Object}

現在のオプションを取得

### getStatistics() → {Object|null}

統計情報を取得

### setData(entities)

ヒートマップデータを設定し、描画を実行

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | 対象エンティティ配列 |

### setVisible(show)

表示/非表示を切り替え

| Name | Type | Description |
|---|---|---|
| show | boolean | 表示する場合はtrue |

### updateOptions(newOptions)

オプションを更新

| Name | Type | Description |
|---|---|---|
| newOptions | Object | 新しいオプション |

### (static) filterEntities(entities, predicate) → {Array.<Cesium.Entity>}

エンティティ配列をフィルタ（ユーティリティ, 静的メソッド）

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | エンティティ配列 |
| predicate | function | フィルタ関数 |


## Quick Start Example

```javascript
// 1. Initialize Heatbox
const viewer = new Cesium.Viewer('cesiumContainer');
const heatbox = new Heatbox(viewer, { voxelSize: 30, opacity: 0.8 });

// 2. Collect entities (example)
const entities = viewer.entities.values; // or build your own array

// 3. Create heatmap from entities
const stats = await heatbox.createFromEntities(entities);
console.log('rendered voxels:', stats.renderedVoxels);
```

## v0.1.6 New Features

```javascript
// Adaptive outline width control
const options = {
  outlineWidthResolver: ({ voxel, isTopN, normalizedDensity }) => {
    if (isTopN) return 6;           // TopN: thick outline
    if (normalizedDensity > 0.7) return 1; // Dense: thin
    return 3;                       // Sparse: normal
  },
  voxelGap: 1.5,        // Gap between voxels (meters)
  outlineOpacity: 0.8   // Outline transparency
};
```
