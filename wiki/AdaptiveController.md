# Class: AdaptiveController（AdaptiveControllerクラス）

**日本語** | [English](#english)

## English

AdaptiveController - Adaptive outline logic delegated from VoxelRenderer.
Responsibilities:
ADR-0009 Phase 3 + ADR-0011 Phase 4

### Constructor

#### new AdaptiveController(options)

### Methods

#### _calculateZScaleCompensation(voxelInfo, grid) → {number}

Calculate Z-axis scale compensation factor

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | Target voxel information / 対象ボクセル情報 |
| grid | Object | Grid information with cellSizeX/Y/Z / グリッド情報 |

#### _countAdjacentVoxels(voxelInfo, voxelData) → {number}

Count adjacent voxels (6 directions: ±X, ±Y, ±Z)

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | Target voxel information / 対象ボクセル情報<br>Properties: `x`, `y`, `z` (`number`) |
| voxelData | Map | All voxel data / 全ボクセルデータ |

#### _detectOverlapAndRecommendMode(voxelInfo, voxelData) → {Object|string|number|string}

Detect overlap and recommend rendering mode

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | Target voxel information / 対象ボクセル情報 |
| voxelData | Map | All voxel data / 全ボクセルデータ |

#### applyPresetLogic(preset, isTopN, normalizedDensity, isDenseArea, baseOptions) → {Object}

Apply preset-specific adaptive logic

| Name | Type | Description |
|---|---|---|
| preset | string | Outline width preset / アウトライン幅プリセット |
| isTopN | boolean | Whether it is TopN voxel / TopNボクセルかどうか |
| normalizedDensity | number | Normalized density [0-1] / 正規化密度 [0-1] |
| isDenseArea | boolean | Whether it is dense area / 密集エリアかどうか |
| baseOptions | Object | Base options for calculation / 計算用基準オプション |

#### calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics, renderOptions, gridopt) → {Object}

Calculate adaptive parameters for a voxel

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| voxelInfo | Object |  |  | Voxel information / ボクセル情報 |
| isTopN | boolean |  |  | Whether it is TopN voxel / TopNボクセルかどうか |
| voxelData | Map |  |  | All voxel data / 全ボクセルデータ |
| statistics | Object |  |  | Statistics information / 統計情報 |
| renderOptions | Object |  |  | Rendering options / 描画オプション |
| grid | Object | <optional> | null | Grid information (optional, for Z-scale compensation) / グリッド情報（オプション、Z軸補正用） |

#### calculateNeighborhoodDensity(voxelInfo, voxelData, radiusopt, renderOptionsopt) → {Object}

Calculate neighborhood density around a voxel

| Name | Type | Attributes | Description |
|---|---|---|---|
| voxelInfo | Object |  | Target voxel information / 対象ボクセル情報<br>Properties: `x`, `y`, `z` (`number`) |
| voxelData | Map |  | All voxel data / 全ボクセルデータ |
| radius | number | <optional> | Search radius override / 探索半径オーバーライド |
| renderOptions | Object | <optional> | Live render options snapshot / 現在の描画オプション |

#### getConfiguration() → {Object}

Get current adaptive control configuration

#### updateOptions(newOptions)

Update adaptive control options

| Name | Type | Description |
|---|---|---|
| newOptions | Object | New options to merge / マージする新オプション |


## 日本語

適応的制御ロジック - ボクセルレンダラーから委譲されるアウトライン制御を担当
- 近傍密度計算 (Neighborhood density calculation)
- プリセット適用ロジック (Preset application logic)
- 適応的パラメータ計算 (Adaptive parameter calculation)
- Z軸スケール補正と重なり検出の推奨提示 (Z scale compensation & overlap recommendations)

### コンストラクタ

#### new AdaptiveController(options)

### メソッド

#### _calculateZScaleCompensation(voxelInfo, grid) → {number}

Z軸スケール補正係数を計算（v0.1.15 Phase 1 - ADR-0011）

| 名前 | 型 | 説明 |
|---|---|---|
| voxelInfo | Object | Target voxel information / 対象ボクセル情報 |
| grid | Object | Grid information with cellSizeX/Y/Z / グリッド情報 |

#### _countAdjacentVoxels(voxelInfo, voxelData) → {number}

隣接ボクセルをカウント（6方向：±X, ±Y, ±Z）（v0.1.15 Phase 2 - ADR-0011）

| 名前 | 型 | 説明 |
|---|---|---|
| voxelInfo | Object | 対象ボクセル情報 / Target voxel information<br>プロパティ: `x`・`y`・`z`（number） |
| voxelData | Map | 全ボクセルデータ / All voxel data |

#### _detectOverlapAndRecommendMode(voxelInfo, voxelData) → {Object|string|number|string}

隣接重なりを検出してレンダリングモードを推奨（v0.1.15 Phase 2 - ADR-0011）

| 名前 | 型 | 説明 |
|---|---|---|
| voxelInfo | Object | Target voxel information / 対象ボクセル情報 |
| voxelData | Map | All voxel data / 全ボクセルデータ |

#### applyPresetLogic(preset, isTopN, normalizedDensity, isDenseArea, baseOptions) → {Object}

プリセット固有の適応ロジックを適用

| 名前 | 型 | 説明 |
|---|---|---|
| preset | string | Outline width preset / アウトライン幅プリセット |
| isTopN | boolean | Whether it is TopN voxel / TopNボクセルかどうか |
| normalizedDensity | number | Normalized density [0-1] / 正規化密度 [0-1] |
| isDenseArea | boolean | Whether it is dense area / 密集エリアかどうか |
| baseOptions | Object | Base options for calculation / 計算用基準オプション |

#### calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics, renderOptions, gridopt) → {Object}

ボクセルの適応的パラメータを計算

| 名前 | 型 | 属性 | 既定値 | 説明 |
|---|---|---|---|---|
| voxelInfo | Object |  |  | Voxel information / ボクセル情報 |
| isTopN | boolean |  |  | Whether it is TopN voxel / TopNボクセルかどうか |
| voxelData | Map |  |  | All voxel data / 全ボクセルデータ |
| statistics | Object |  |  | Statistics information / 統計情報 |
| renderOptions | Object |  |  | Rendering options / 描画オプション |
| grid | Object | <optional> | null | Grid information (optional, for Z-scale compensation) / グリッド情報（オプション、Z軸補正用） |

#### calculateNeighborhoodDensity(voxelInfo, voxelData, radiusopt, renderOptionsopt) → {Object}

ボクセル周辺の近傍密度を計算

| 名前 | 型 | 属性 | 説明 |
|---|---|---|---|
| voxelInfo | Object |  | 対象ボクセル情報 / Target voxel information<br>プロパティ: `x`・`y`・`z`（number） |
| voxelData | Map |  | 全ボクセルデータ / All voxel data |
| radius | number | <optional> | 探索半径オーバーライド / Search radius override |
| renderOptions | Object | <optional> | 現在の描画オプション / Live render options snapshot |

#### getConfiguration() → {Object}

現在の適応制御設定を取得

#### updateOptions(newOptions)

適応制御オプションを更新

| 名前 | 型 | 説明 |
|---|---|---|
| newOptions | Object | New options to merge / マージする新オプション |
