# Class: Heatbox（Heatboxクラス）

**English** | [日本語](#日本語)

CesiumJS Heatbox main class that provides 3D voxel-based heatmap visualization.

CesiumJS Heatbox メインクラス。3Dボクセルベースのヒートマップ可視化を提供します。

## Constructor / コンストラクタ

### new Heatbox(viewer, options)

Creates a new Heatbox instance for 3D voxel-based heatmap visualization.

3Dボクセルベースのヒートマップ可視化のための新しいHeatboxインスタンスを作成します。

## Methods / メソッド

### clear()

Clears the heatmap and removes all rendered voxels.

ヒートマップをクリアし、描画されたすべてのボクセルを削除します。

### (async) createFromEntities(entities) → {Promise.<Object>}

Creates a heatmap from entities (asynchronous API).

エンティティからヒートマップを作成します（非同期API）。

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | 対象エンティティ配列 |

### destroy()

Destroys the instance and releases event listeners.

インスタンスを破棄し、イベントリスナーを解放

### getBounds() → {Object|null}

Gets current bounds information.

境界情報を取得

### getDebugInfo() → {Object}

Returns debug information.

デバッグ情報を取得

### getOptions() → {Object}

Returns current options.

現在のオプションを取得

### getStatistics() → {Object|null}

Returns statistics, or null if not created.

統計情報を取得

### setData(entities)

Sets heatmap data and triggers rendering.

ヒートマップデータを設定し、描画を実行

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | 対象エンティティ配列 |

### setVisible(show)

Toggles visibility.

表示/非表示を切り替え

| Name | Type | Description |
|---|---|---|
| show | boolean | 表示する場合はtrue |

### updateOptions(newOptions)

Updates options.

オプションを更新

| Name | Type | Description |
|---|---|---|
| newOptions | Object | 新しいオプション |

### (static) filterEntities(entities, predicate) → {Array.<Cesium.Entity>}

Filters an entity array with a predicate (utility static method).

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
