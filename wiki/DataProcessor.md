# Class: DataProcessor（DataProcessorクラス）

**日本語** | [English](#english)

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

#### (async, static) classifyEntitiesIntoVoxels(entities, bounds, grid, optionsopt) → {Promise.<Map>}

Classify entities into voxels (simple implementation).

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| entities | Array |  |  | Entity array / エンティティ配列 |
| bounds | Object |  |  | Bounds info / 境界情報 |
| grid | Object |  |  | Grid info / グリッド情報 |
| options | Object | <optional> | {} | Processing options (v0.1.17: spatialId support) / 処理オプション |

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

#### (async, static) classifyEntitiesIntoVoxels(entities, bounds, grid, optionsopt) → {Promise.<Map>}

エンティティをボクセルに分類（シンプル実装）。

| 名前 | 型 | 属性 | 既定値 | 説明 |
|---|---|---|---|---|
| entities | Array |  |  | Entity array / エンティティ配列 |
| bounds | Object |  |  | Bounds info / 境界情報 |
| grid | Object |  |  | Grid info / グリッド情報 |
| options | Object | <optional> | {} | Processing options (v0.1.17: spatialId support) / 処理オプション |

#### (static) getTopNVoxels(voxelData, topN) → {Array}

上位 N 個のボクセルを取得します。

| 名前 | 型 | 説明 |
|---|---|---|
| voxelData | Map | Voxel data / ボクセルデータ |
| topN | number | Number to get / 取得する上位の数 |
