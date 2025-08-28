# Class: CoordinateTransformer（CoordinateTransformerクラス）

**English** | [日本語](#日本語)

Class that provides coordinate transformation functionality for geographic and Cartesian coordinate systems.

地理座標系とデカルト座標系間の座標変換機能を提供するクラス。

## Constructor / コンストラクタ

### new CoordinateTransformer()

Creates a new CoordinateTransformer instance for coordinate system transformations.

座標系変換のための新しいCoordinateTransformerインスタンスを作成します。

## Methods / メソッド

### (static) calculateBounds(entities) → {Object}

Calculates 3D boundaries from an array of entities.

エンティティ配列から3D境界を計算します。

| Name | Type | Description |
|---|---|---|
| entities | Array | エンティティ配列 |

### (static) coordinateToCartesian3(lon, lat, alt) → {Cesium.Cartesian3}

Converts geographic coordinates to Cesium Cartesian3.

地理座標をCesium Cartesian3に変換

| Name | Type | Description |
|---|---|---|
| lon | number | 経度 |
| lat | number | 緯度 |
| alt | number | 高度 |

### (static) voxelIndexToCoordinate(x, y, z, bounds, grid) → {Object}

Converts voxel indices to geographic coordinates (cell center).

ボクセルインデックスを地理座標（中心位置）に変換

| Name | Type | Description |
|---|---|---|
| x | number | X軸ボクセルインデックス |
| y | number | Y軸ボクセルインデックス |
| z | number | Z軸ボクセルインデックス |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |
