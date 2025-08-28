# Class: DataProcessor（DataProcessorクラス）

**English** | [日本語](#日本語)

Class responsible for processing entity data, classification into voxels, and statistical calculations.

エンティティデータの処理、ボクセルへの分類、統計計算を担当するクラス。

## Constructor / コンストラクタ

### new DataProcessor()

Creates a new DataProcessor instance for entity data processing.

エンティティデータ処理のための新しいDataProcessorインスタンスを作成します。

## Methods / メソッド

### (static) calculateStatistics(voxelData, grid) → {Object}

Calculates statistical information from voxel data.

ボクセルデータから統計情報を計算します。

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| grid | Object | グリッド情報 |

### (static) classifyEntitiesIntoVoxels(entities, bounds, grid) → {Map}

Classifies entities into voxels (simple implementation).

エンティティをボクセルに分類（シンプル実装）

| Name | Type | Description |
|---|---|---|
| entities | Array | エンティティ配列 |
| bounds | Object | 境界情報 |
| grid | Object | グリッド情報 |

### (static) getTopNVoxels(voxelData, topN) → {Array}

Returns the top N voxels by count.

上位N個のボクセルを取得

| Name | Type | Description |
|---|---|---|
| voxelData | Map | ボクセルデータ |
| topN | number | 取得する上位の数 |
