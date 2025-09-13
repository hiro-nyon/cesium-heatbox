# Class: Heatbox（Heatboxクラス）

**日本語** | [English](#english)

## English

Main class of CesiumJS Heatbox.
Provides 3D voxel-based heatmap visualization in CesiumJS environments.

### Constructor

#### new Heatbox(viewer, options)

### Methods

#### clear()

Clear the heatmap and internal state.

#### (async) createFromEntities(entities) → {Promise.<Object>}

Create heatmap from entities (async).

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | Target entities array / 対象エンティティ配列 |

#### destroy()

Destroy the instance and release event listeners.

#### dispose()

Alias for destroy() to match examples and tests.

#### (async) fitView(bounds, options) → {Promise}

Fit view to data bounds with smart camera positioning.

| Name | Type | Default | Description |
|---|---|---|---|
| bounds | Object | null | Target bounds (optional, uses current data bounds if not provided) / 対象境界 |
| options | Object |  | Fit view options / フィットビューオプション |

#### getBounds() → {Object|null}

Get bounds info if available.

#### getDebugInfo() → {Object}

Get debug information.

#### getEffectiveOptions() → {Object}

Get effective normalized options snapshot.

#### getOptions() → {Object}

Get current options.

#### getStatistics() → {Object|null}

Get statistics information.

#### hidePerformanceOverlay()

Hide performance overlay

#### (async) setData(entities)

Set heatmap data and render.

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | Target entities array / 対象エンティティ配列 |

#### setPerformanceOverlayEnabled(enabled, optionsopt) → {boolean}

Enable or disable performance overlay at runtime.

| Name | Type | Attributes | Description |
|---|---|---|---|
| enabled | boolean |  | true to enable, false to disable |
| options | Object | <optional> | Optional overlay options to apply |

#### setVisible(show)

Toggle visibility.

| Name | Type | Description |
|---|---|---|
| show | boolean | true to show / 表示する場合は true |

#### showPerformanceOverlay()

Show performance overlay

#### togglePerformanceOverlay() → {boolean}

Toggle performance overlay visibility

#### updateOptions(newOptions)

Update options and re-render if applicable.

| Name | Type | Description |
|---|---|---|
| newOptions | Object | New options / 新しいオプション |

#### (static) filterEntities(entities, predicate) → {Array.<Cesium.Entity>}

Filter entity array (utility static method).

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | Entity array / エンティティ配列 |
| predicate | function | Predicate function / フィルタ関数 |

#### (static) getProfileDetails(profileName) → {Object|null}

Get configuration profile details

| Name | Type | Description |
|---|---|---|
| profileName | string | Profile name / プロファイル名 |

#### (static) listProfiles() → {Array.<string>}

Get list of available configuration profiles


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

## 日本語

CesiumJS Heatbox メインクラス。
CesiumJS 環境で 3D ボクセルベースのヒートマップ可視化を提供します。

### コンストラクタ

#### new Heatbox(viewer, options)

### メソッド

#### clear()

ヒートマップと内部状態をクリアします。

#### (async) createFromEntities(entities) → {Promise.<Object>}

エンティティからヒートマップを作成（非同期 API）。

| 名前 | 型 | 説明 |
|---|---|---|
| entities | Array.<Cesium.Entity> | Target entities array / 対象エンティティ配列 |

#### destroy()

インスタンスを破棄し、イベントリスナーを解放します。

#### dispose()

互換性のための別名。destroy() を呼び出します。

#### (async) fitView(bounds, options) → {Promise}

データ境界にスマートなカメラ位置でビューをフィットします。

| 名前 | 型 | 既定値 | 説明 |
|---|---|---|---|
| bounds | Object | null | Target bounds (optional, uses current data bounds if not provided) / 対象境界 |
| options | Object |  | Fit view options / フィットビューオプション |

#### getBounds() → {Object|null}

境界情報を取得します（未作成の場合は null）。

#### getDebugInfo() → {Object}

デバッグ情報を取得します。

#### getEffectiveOptions() → {Object}

正規化済みオプションのスナップショットを取得します。

#### getOptions() → {Object}

現在のオプションを取得します。

#### getStatistics() → {Object|null}

統計情報を取得します（未作成の場合は null）。

#### hidePerformanceOverlay()

パフォーマンスオーバーレイを非表示

#### (async) setData(entities)

ヒートマップデータを設定し、描画を実行します。

| 名前 | 型 | 説明 |
|---|---|---|
| entities | Array.<Cesium.Entity> | Target entities array / 対象エンティティ配列 |

#### setPerformanceOverlayEnabled(enabled, optionsopt) → {boolean}

実行時にパフォーマンスオーバーレイを有効/無効化します。

| 名前 | 型 | 属性 | 説明 |
|---|---|---|---|
| enabled | boolean |  | true to enable, false to disable |
| options | Object | <optional> | Optional overlay options to apply |

#### setVisible(show)

表示/非表示を切り替えます。

| 名前 | 型 | 説明 |
|---|---|---|
| show | boolean | true to show / 表示する場合は true |

#### showPerformanceOverlay()

パフォーマンスオーバーレイを表示

#### togglePerformanceOverlay() → {boolean}

パフォーマンスオーバーレイの表示/非表示切り替え

#### updateOptions(newOptions)

オプションを更新し、必要に応じて再描画します。

| 名前 | 型 | 説明 |
|---|---|---|
| newOptions | Object | New options / 新しいオプション |

#### (static) filterEntities(entities, predicate) → {Array.<Cesium.Entity>}

エンティティ配列をフィルタします（ユーティリティ・静的メソッド）。

| 名前 | 型 | 説明 |
|---|---|---|
| entities | Array.<Cesium.Entity> | Entity array / エンティティ配列 |
| predicate | function | Predicate function / フィルタ関数 |

#### (static) getProfileDetails(profileName) → {Object|null}

設定プロファイルの詳細を取得

| 名前 | 型 | 説明 |
|---|---|---|
| profileName | string | Profile name / プロファイル名 |

#### (static) listProfiles() → {Array.<string>}

利用可能な設定プロファイルの一覧を取得
