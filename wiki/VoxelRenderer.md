# JSDoc: Class: VoxelRenderer

# Class: VoxelRenderer

## VoxelRenderer(viewer, options)

## Constructor

#### new VoxelRenderer(viewer, options)

##### Parameters:

### Classes

### Methods

#### clear()

#### clear()

#### createVoxelDescription(voxelInfo, voxelKey) → {string}

##### Parameters:

##### Returns:

#### createVoxelDescription(voxelInfo, voxelKey) → {string}

##### Parameters:

##### Returns:

#### interpolateColor(normalizedDensity, rawValueopt) → {Cesium.Color}

##### Parameters:

##### Returns:

#### interpolateColor(normalizedDensity, rawValueopt) → {Cesium.Color}

##### Parameters:

##### Returns:

#### render(voxelData, bounds, grid, statistics) → {number}

##### Parameters:

##### Returns:

#### render(voxelData, bounds, grid, statistics) → {number}

##### Parameters:

##### Returns:

#### setVisible(show)

##### Parameters:

#### setVisible(show)

##### Parameters:

## VoxelRendererVoxelRenderer(viewer, options)

## Constructor

#### new VoxelRenderer(viewer, options)

##### Parameters:

### Classes

### Methods

#### clear()

#### clear()

#### createVoxelDescription(voxelInfo, voxelKey) → {string}

##### Parameters:

##### Returns:

#### createVoxelDescription(voxelInfo, voxelKey) → {string}

##### Parameters:

##### Returns:

#### interpolateColor(normalizedDensity, rawValueopt) → {Cesium.Color}

##### Parameters:

##### Returns:

#### interpolateColor(normalizedDensity, rawValueopt) → {Cesium.Color}

##### Parameters:

##### Returns:

#### render(voxelData, bounds, grid, statistics) → {number}

##### Parameters:

##### Returns:

#### render(voxelData, bounds, grid, statistics) → {number}

##### Parameters:

##### Returns:

#### setVisible(show)

##### Parameters:

#### setVisible(show)

##### Parameters:

## Home

### Classes

### Global

CesiumJS Viewer

描画されたエンティティを全てクリア

描画されたエンティティを全てクリア

ボクセルの説明文を生成

ボクセルの説明文を生成

密度に基づいて色を補間（v0.1.5: カラーマップ対応）

正規化された密度 (0-1)

密度に基づいて色を補間（v0.1.5: カラーマップ対応）

正規化された密度 (0-1)

ボクセルデータを描画（シンプル実装）

ボクセルデータを描画（シンプル実装）

表示/非表示を切り替え

表示する場合はtrue

表示/非表示を切り替え

表示する場合はtrue

CesiumJS Viewer

描画されたエンティティを全てクリア

描画されたエンティティを全てクリア

ボクセルの説明文を生成

ボクセルの説明文を生成

密度に基づいて色を補間（v0.1.5: カラーマップ対応）

正規化された密度 (0-1)

密度に基づいて色を補間（v0.1.5: カラーマップ対応）

正規化された密度 (0-1)

ボクセルデータを描画（シンプル実装）

ボクセルデータを描画（シンプル実装）

表示/非表示を切り替え

表示する場合はtrue

表示/非表示を切り替え

表示する場合はtrue

| Name | Type | Description |
|---|---|---|
| viewer | Cesium.Viewer | CesiumJS Viewer |
| options | Object | 描画オプション |

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | ボクセル情報 |
| voxelKey | string | ボクセルキー |

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | ボクセル情報 |
| voxelKey | string | ボクセルキー |

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| normalizedDensity | number |  |  | 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | 生値（二極性配色用） |

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| normalizedDensity | number |  |  | 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | 生値（二極性配色用） |

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |
| statistics | Object | 統計情報 |

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |
| statistics | Object | 統計情報 |

| Name | Type | Description |
|---|---|---|
| show | boolean | 表示する場合はtrue |

| Name | Type | Description |
|---|---|---|
| show | boolean | 表示する場合はtrue |

| Name | Type | Description |
|---|---|---|
| viewer | Cesium.Viewer | CesiumJS Viewer |
| options | Object | 描画オプション |

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | ボクセル情報 |
| voxelKey | string | ボクセルキー |

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | ボクセル情報 |
| voxelKey | string | ボクセルキー |

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| normalizedDensity | number |  |  | 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | 生値（二極性配色用） |

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| normalizedDensity | number |  |  | 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | 生値（二極性配色用） |

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |
| statistics | Object | 統計情報 |

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |
| statistics | Object | 統計情報 |

| Name | Type | Description |
|---|---|---|
| show | boolean | 表示する場合はtrue |

| Name | Type | Description |
|---|---|---|
| show | boolean | 表示する場合はtrue |
