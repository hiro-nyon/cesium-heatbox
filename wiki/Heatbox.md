# Class: Heatbox（Heatboxクラス）

**日本語** | [English](#english)

## English

Main class of CesiumJS Heatbox.
Provides 3D voxel-based heatmap visualization in CesiumJS environments.
Refer to HeatboxOptions for the full option catalogue with defaults.

### Constructor

#### new Heatbox(viewer, optionsopt)

### Methods

#### clear()

Clear the heatmap and internal state.

#### (async) createFromEntities(entities) → {Promise.<HeatboxStatistics>}

Create heatmap from entities (async).
Resolves with the statistics snapshot calculated by getStatistics.

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | Target entities array / 対象エンティティ配列 |

#### destroy()

Destroy the instance and release event listeners.

#### dispose()

Alias for destroy() to match examples and tests.

#### (async) fitView(boundsopt, optionsopt) → {Promise.<void>}

Fit view to data bounds with smart camera positioning.

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| bounds | HeatboxBounds \| null | <optional> | null | Target bounds（省略時は現在のデータ境界） |
| options | HeatboxFitViewOptions | <optional> | {} | Fit view options / フィットビュー設定 |

#### getBounds() → {HeatboxBounds|null}

Get bounds info if available.

#### getDebugInfo() → {HeatboxDebugInfo}

Get debug information.

#### getEffectiveOptions() → {HeatboxOptions}

Get effective normalized options snapshot.

#### getOptions() → {HeatboxOptions}

Get current options.

#### getStatistics() → {HeatboxStatistics|null}

Get statistics information.

#### hidePerformanceOverlay()

Hide performance overlay

#### (async) setData(entities) → {Promise.<void>}

Set heatmap data and render.
Calculates bounds, prepares the voxel grid, runs classification, and finally renders.

| Name | Type | Description |
|---|---|---|
| entities | Array.<Cesium.Entity> | Target entities array / 対象エンティティ配列 |

#### setPerformanceOverlayEnabled(enabled, optionsopt) → {boolean}

Enable or disable performance overlay at runtime.

| Name | Type | Attributes | Description |
|---|---|---|---|
| enabled | boolean |  | true to enable, false to disable |
| options | PerformanceOverlayConfig | <optional> | Optional overlay options to apply / 追加設定 |

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
| newOptions | HeatboxOptions | New options (partial allowed) / 新しいオプション（部分指定可） |

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
| profileName | string | Profile name / プロファイル名 Returned object shares the same keys as HeatboxOptions plus an optional `description`. 戻り値は HeatboxOptions と同じキーに加えて `description` フィールドを含みます。 |

#### (static) listProfiles() → {Array.<ProfileName>}

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
利用可能なオプションと既定値は HeatboxOptions を参照してください。

### コンストラクタ

#### new Heatbox(viewer, optionsopt)

### メソッド

#### clear()

ヒートマップと内部状態をクリアします。

#### (async) createFromEntities(entities) → {Promise.<HeatboxStatistics>}

エンティティからヒートマップを作成（非同期 API）。
描画完了後に getStatistics と同じ統計スナップショットを返します。

| 名前 | 型 | 説明 |
|---|---|---|
| entities | Array.<Cesium.Entity> | Target entities array / 対象エンティティ配列 |

#### destroy()

インスタンスを破棄し、イベントリスナーを解放します。

#### dispose()

互換性のための別名。destroy() を呼び出します。

#### (async) fitView(boundsopt, optionsopt) → {Promise.<void>}

データ境界にスマートなカメラ位置でビューをフィットします。
実装メモ（v0.1.12）：
- 描画とカメラ移動の競合を避けるため、`viewer.scene.postRender` で1回だけ実行します。
- 矩形境界（経緯度）から `Cesium.Rectangle` → `Cesium.BoundingSphere` を生成し、
`camera.flyToBoundingSphere` + `HeadingPitchRange` で安定的にズームします。
- 俯角は安全範囲にクランプ（既定: -35°, 範囲: [-85°, -10°]）。
- 失敗時は `viewer.zoomTo(viewer.entities)` へフォールバックします。

| 名前 | 型 | 属性 | 既定値 | 説明 |
|---|---|---|---|---|
| bounds | HeatboxBounds \| null | <optional> | null | Target bounds（省略時は現在のデータ境界） |
| options | HeatboxFitViewOptions | <optional> | {} | Fit view options / フィットビュー設定 |

#### getBounds() → {HeatboxBounds|null}

境界情報を取得します（未作成の場合は null）。

#### getDebugInfo() → {HeatboxDebugInfo}

デバッグ情報を取得します。

#### getEffectiveOptions() → {HeatboxOptions}

正規化済みオプションのスナップショットを取得します。

#### getOptions() → {HeatboxOptions}

現在のオプションを取得します。

#### getStatistics() → {HeatboxStatistics|null}

統計情報を取得します（未作成の場合は null）。

#### hidePerformanceOverlay()

パフォーマンスオーバーレイを非表示

#### (async) setData(entities) → {Promise.<void>}

ヒートマップデータを設定し、境界計算→ボクセル分類→描画の順で処理します。

| 名前 | 型 | 説明 |
|---|---|---|
| entities | Array.<Cesium.Entity> | Target entities array / 対象エンティティ配列 |

#### setPerformanceOverlayEnabled(enabled, optionsopt) → {boolean}

実行時にパフォーマンスオーバーレイを有効/無効化します。

| 名前 | 型 | 属性 | 説明 |
|---|---|---|---|
| enabled | boolean |  | true to enable, false to disable |
| options | PerformanceOverlayConfig | <optional> | Optional overlay options to apply / 追加設定 |

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
| newOptions | HeatboxOptions | New options (partial allowed) / 新しいオプション（部分指定可） |

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
| profileName | string | Profile name / プロファイル名 Returned object shares the same keys as HeatboxOptions plus an optional `description`. 戻り値は HeatboxOptions と同じキーに加えて `description` フィールドを含みます。 |

#### (static) listProfiles() → {Array.<ProfileName>}

利用可能な設定プロファイルの一覧を取得
