# Class: VoxelRenderer（VoxelRendererクラス）

**English** | [日本語](#日本語)

Class responsible for rendering 3D voxels with advanced outline control and adaptive display features.

3Dボクセルの描画を担当するクラス。高度な枠線制御と適応的表示機能を提供します。

## Constructor / コンストラクタ

### new VoxelRenderer(viewer, options)

Creates a new VoxelRenderer instance with Cesium viewer and rendering options.

CesiumビューワーとレンダリングオプションでVoxelRendererインスタンスを作成します。

## Methods / メソッド

### clear()

Clears all rendered entities and removes them from the viewer.

すべての描画されたエンティティをクリアし、ビューワーから削除します。

### createVoxelDescription(voxelInfo, voxelKey) → {string}

Generates a description string for a voxel.

ボクセルの説明文を生成

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | ボクセル情報 |
| voxelKey | string | ボクセルキー |

### interpolateColor(normalizedDensity, rawValueopt) → {Cesium.Color}

Interpolates color based on density (v0.1.5: color maps supported).

密度に基づいて色を補間（v0.1.5: カラーマップ対応）

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| normalizedDensity | number |  |  | 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | 生値（二極性配色用） |

### render(voxelData, bounds, grid, statistics) → {number}

Renders voxel data (simple implementation).

ボクセルデータを描画（シンプル実装）

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |
| statistics | Object | 統計情報 |

### setVisible(show)

Toggles visibility.

表示/非表示を切り替え

| Name | Type | Description |
|---|---|---|
| show | boolean | 表示する場合はtrue |
