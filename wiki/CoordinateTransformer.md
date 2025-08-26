# Class: CoordinateTransformer

座標変換機能を提供するクラス

## Constructor

### new CoordinateTransformer()

## Methods

### (static) calculateBounds(entities) → {Object}

エンティティ配列から3D境界を計算

| Name | Type | Description |
|---|---|---|
| entities | Array | エンティティ配列 |

### (static) coordinateToCartesian3(lon, lat, alt) → {Cesium.Cartesian3}

地理座標をCesium Cartesian3に変換

| Name | Type | Description |
|---|---|---|
| lon | number | 経度 |
| lat | number | 緯度 |
| alt | number | 高度 |

### (static) voxelIndexToCoordinate(x, y, z, bounds, grid) → {Object}

ボクセルインデックスを地理座標（中心位置）に変換

| Name | Type | Description |
|---|---|---|
| x | number | X軸ボクセルインデックス |
| y | number | Y軸ボクセルインデックス |
| z | number | Z軸ボクセルインデックス |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |
