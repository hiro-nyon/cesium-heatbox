# Class: VoxelGrid

3Dボクセルグリッドを管理するクラス

## Constructor

### new VoxelGrid()

## Methods

### (static) createGrid(bounds, voxelSizeMeters) → {Object}

境界情報とボクセルサイズからグリッドを作成（シンプル版）

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |
| voxelSizeMeters | number | 目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。 |

### (static) getVoxelKey(x, y, z) → {string}

ボクセルインデックスからキーを生成

| Name | Type | Description |
|---|---|---|
| x | number | X軸インデックス |
| y | number | Y軸インデックス |
| z | number | Z軸インデックス |

### (static) iterateAllVoxels(grid, callback)

グリッド内の全ボクセルを反復処理

| Name | Type | Description |
|---|---|---|
| grid | Object | グリッド情報 |
| callback | function | 各ボクセルに対するコールバック関数 |

### (static) parseVoxelKey(key) → {Object}

ボクセルキーからインデックスを解析

| Name | Type | Description |
|---|---|---|
| key | string | ボクセルキー |
