# Class: DataProcessor

エンティティデータの処理を担当するクラス

## Constructor

### new DataProcessor()

## Methods

### (static) calculateStatistics(voxelData, grid) → {Object}

ボクセルデータから統計情報を計算

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| grid | Object | グリッド情報 |

### (static) classifyEntitiesIntoVoxels(entities, bounds, grid) → {Map}

エンティティをボクセルに分類（シンプル実装）

| Name | Type | Description |
|---|---|---|
| entities | Array | エンティティ配列 |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |

### (static) getTopNVoxels(voxelData, topN) → {Array}

上位N個のボクセルを取得

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| topN | number | 取得する上位の数 |
