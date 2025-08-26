# Class: VoxelRenderer

3Dボクセルの描画を担当するクラス

## Constructor

### new VoxelRenderer(viewer, options)

## Methods

### clear()

描画されたエンティティを全てクリア

### createVoxelDescription(voxelInfo, voxelKey) → {string}

ボクセルの説明文を生成

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | ボクセル情報 |
| voxelKey | string | ボクセルキー |

### interpolateColor(normalizedDensity, rawValueopt) → {Cesium.Color}

密度に基づいて色を補間（v0.1.5: カラーマップ対応）

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| normalizedDensity | number |  |  | 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | 生値（二極性配色用） |

### render(voxelData, bounds, grid, statistics) → {number}

ボクセルデータを描画（シンプル実装）

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |
| statistics | Object | 統計情報 |

### setVisible(show)

表示/非表示を切り替え

| Name | Type | Description |
|---|---|---|
| show | boolean | 表示する場合はtrue |
