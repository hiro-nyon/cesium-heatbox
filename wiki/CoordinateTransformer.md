# Class: CoordinateTransformer（CoordinateTransformerクラス）

**日本語** | [English](#english)

## English

Class providing coordinate transformation utilities.

### Constructor

#### new CoordinateTransformer()

### Methods

#### (static) calculateBounds(entities) → {Object}

Calculate 3D bounds from an entity array.

| Name | Type | Description |
|---|---|---|
| entities | Array | Entity array / エンティティ配列 |

#### (static) coordinateToCartesian3(lon, lat, alt) → {Cesium.Cartesian3}

Convert geographic coordinates to Cesium Cartesian3.

| Name | Type | Description |
|---|---|---|
| lon | number | Longitude / 経度 |
| lat | number | Latitude / 緯度 |
| alt | number | Altitude / 高度 |

#### (static) voxelIndexToCoordinate(x, y, z, bounds, grid) → {Object}

Convert voxel indices to geographic coordinates (cell center).

| Name | Type | Description |
|---|---|---|
| x | number | X-axis voxel index / X軸ボクセルインデックス |
| y | number | Y-axis voxel index / Y軸ボクセルインデックス |
| z | number | Z-axis voxel index / Z軸ボクセルインデックス |
| bounds | Object | Bounds info / 境界情報 |
| grid | Object | Grid info / グリッド情報 |


## 日本語

座標変換機能を提供するクラス。

### コンストラクタ

#### new CoordinateTransformer()

### メソッド

#### (static) calculateBounds(entities) → {Object}

エンティティ配列から 3D 境界を計算します。

| 名前 | 型 | 説明 |
|---|---|---|
| entities | Array | Entity array / エンティティ配列 |

#### (static) coordinateToCartesian3(lon, lat, alt) → {Cesium.Cartesian3}

地理座標を Cesium Cartesian3 に変換します。

| 名前 | 型 | 説明 |
|---|---|---|
| lon | number | Longitude / 経度 |
| lat | number | Latitude / 緯度 |
| alt | number | Altitude / 高度 |

#### (static) voxelIndexToCoordinate(x, y, z, bounds, grid) → {Object}

ボクセルインデックスを地理座標（中心位置）に変換します。

| 名前 | 型 | 説明 |
|---|---|---|
| x | number | X-axis voxel index / X軸ボクセルインデックス |
| y | number | Y-axis voxel index / Y軸ボクセルインデックス |
| z | number | Z-axis voxel index / Z軸ボクセルインデックス |
| bounds | Object | Bounds info / 境界情報 |
| grid | Object | Grid info / グリッド情報 |
