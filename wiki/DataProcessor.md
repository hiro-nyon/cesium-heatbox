# Class: DataProcessor（DataProcessorクラス）

[English](#english) | [日本語](#日本語)

## English

Class responsible for processing entity data.

### Constructor

#### new DataProcessor()

### Methods

#### (static) calculateStatistics(voxelData, grid) → {Object}

Calculate statistics from voxel data.

| Name | Type | Description |
|---|---|---|
| voxelData | Map | Voxel data / ボクセルデータ |
| grid | Object | Grid info / グリッド情報 |

#### (static) classifyEntitiesIntoVoxels(entities, bounds, grid) → {Map}

Classify entities into voxels (simple implementation).

| Name | Type | Description |
|---|---|---|
| entities | Array | Entity array / エンティティ配列 |
| bounds | Object | Bounds info / 境界情報 |
| grid | Object | Grid info / グリッド情報 |

#### (static) getTopNVoxels(voxelData, topN) → {Array}

Get top-N densest voxels.

| Name | Type | Description |
|---|---|---|
| voxelData | Map | Voxel data / ボクセルデータ |
| topN | number | Number to get / 取得する上位の数 |


## 日本語

エンティティデータの処理を担当するクラス。

### コンストラクタ

#### new DataProcessor()

### メソッド

#### (static) calculateStatistics(voxelData, grid) → {Object}

ボクセルデータから統計情報を計算します。

| 名前 | 型 | 説明 |
|---|---|---|
| voxelData | Map | Voxel data / ボクセルデータ |
| grid | Object | Grid info / グリッド情報 |

#### (static) classifyEntitiesIntoVoxels(entities, bounds, grid) → {Map}

エンティティをボクセルに分類（シンプル実装）。

| 名前 | 型 | 説明 |
|---|---|---|
| entities | Array | Entity array / エンティティ配列 |
| bounds | Object | Bounds info / 境界情報 |
| grid | Object | Grid info / グリッド情報 |

#### (static) getTopNVoxels(voxelData, topN) → {Array}

上位 N 個のボクセルを取得します。

| 名前 | 型 | 説明 |
|---|---|---|
| voxelData | Map | Voxel data / ボクセルデータ |
| topN | number | Number to get / 取得する上位の数 |
