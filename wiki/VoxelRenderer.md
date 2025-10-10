# Class: VoxelRenderer（VoxelRendererクラス）

**日本語** | [English](#english)

## English

VoxelRenderer - 3D voxel rendering orchestration class.
v0.1.11: Refactored for Single Responsibility Principle (ADR-0009).
Now serves as orchestrator delegating specialized tasks to:
ColorCalculator, VoxelSelector, AdaptiveController, and GeometryRenderer.

### Constructor

#### new VoxelRenderer(viewer, options)

### Methods

#### clear()

Clear all rendered Cesium entities (delegates to `GeometryRenderer.clear()`).

#### getSelectionStats() → {Object|null}

Get selection statistics.

#### interpolateColor(normalizedDensity, rawValueopt) → {Cesium.Color}

Interpolate color based on density (v0.1.5: color maps supported).

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| normalizedDensity | number |  |  | Normalized density (0-1) / 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | Raw value for diverging scheme / 生値（二極性配色用） |

#### render(voxelData, bounds, grid, statistics) → {number}

Render the supplied voxel dataset.  
The renderer clears previous entities, selects voxels according to the configured strategy, calculates adaptive parameters, and emits Cesium entities.  
Returns the number of voxels rendered successfully.

| Name | Type | Description |
|---|---|---|
| voxelData | Map | Voxel data map / ボクセルデータマップ |
| bounds | Object | Spatial bounds / 空間境界 |
| grid | Object | Grid configuration / グリッド設定 |
| statistics | Object | Density statistics / 密度統計 |

#### setVisible(show)

Toggle visibility.

| Name | Type | Description |
|---|---|---|
| show | boolean | true to show / 表示する場合は true |


## 日本語

3Dボクセル描画オーケストレーションクラス。
各専門クラスに特化タスクを委譲するオーケストレーション役に特化。

### コンストラクタ

#### new VoxelRenderer(viewer, options)

### メソッド

#### clear()

描画されたエンティティを全てクリア
v0.1.11: GeometryRendererに委譲 (ADR-0009 Phase 4)

#### getSelectionStats() → {Object|null}

選択統計を取得します。

#### interpolateColor(normalizedDensity, rawValueopt) → {Cesium.Color}

密度に基づいて色を補間（v0.1.5: カラーマップ対応）。
v0.1.11: ColorCalculatorに委譲 (ADR-0009 Phase 1)

| 名前 | 型 | 属性 | 既定値 | 説明 |
|---|---|---|---|---|
| normalizedDensity | number |  |  | Normalized density (0-1) / 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | Raw value for diverging scheme / 生値（二極性配色用） |

#### render(voxelData, bounds, grid, statistics) → {number}

ボクセルデータ描画 - オーケストレーション化された描画プロセス。
**実行フロー**:
1. **GeometryRenderer.clear()** - 既存エンティティのクリア
2. **VoxelSelector.selectVoxels()** - 必要に応じて選択戦略適用
3. **各ボクセル**: `_renderSingleVoxel()` へのオーケストレーション委譲:
- **AdaptiveController** - 適応パラメータ計算
- **ColorCalculator** - 密度ベース色計算
- **GeometryRenderer** - ボクセルボックス・枠線・ポリライン作成
4. **カウント返却** - 正常描画されたボクセル数

| 名前 | 型 | 説明 |
|---|---|---|
| voxelData | Map | Voxel data map / ボクセルデータマップ |
| bounds | Object | Spatial bounds / 空間境界 |
| grid | Object | Grid configuration / グリッド設定 |
| statistics | Object | Density statistics / 密度統計 |

#### setVisible(show)

表示/非表示を切り替えます。
v0.1.11: GeometryRendererに委譲 (ADR-0009 Phase 5)

| 名前 | 型 | 説明 |
|---|---|---|
| show | boolean | true to show / 表示する場合は true |
