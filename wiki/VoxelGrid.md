# Class: VoxelGrid（VoxelGridクラス）

**English** | [日本語](#日本語)

Class that manages 3D voxel grids for spatial data organization and indexing.

3Dボクセルグリッドを管理し、空間データの整理とインデックス化を行うクラス。

## Constructor / コンストラクタ

### new VoxelGrid()

Creates a new VoxelGrid instance for 3D spatial grid management.

3D空間グリッド管理のための新しいVoxelGridインスタンスを作成します。

## Methods / メソッド

### (static) createGrid(bounds, voxelSizeMeters) → {Object}

Creates a grid from boundary information and voxel size (simplified version).

境界情報とボクセルサイズからグリッドを作成します（シンプル版）。

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |
| voxelSizeMeters | number | 目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。 |

### (static) getVoxelKey(x, y, z) → {string}

Generates a key string from voxel indices.

ボクセルインデックスからキーを生成

| Name | Type | Description |
|---|---|---|
| x | number | X軸インデックス |
| y | number | Y軸インデックス |
| z | number | Z軸インデックス |

### (static) iterateAllVoxels(grid, callback)

Iterates all voxels in the grid and invokes the callback per voxel.

グリッド内の全ボクセルを反復処理

| Name | Type | Description |
|---|---|---|
| grid | Object | グリッド情報 |
| callback | function | 各ボクセルに対するコールバック関数 |

### (static) parseVoxelKey(key) → {Object}

Parses a voxel key string into indices.

ボクセルキーからインデックスを解析

| Name | Type | Description |
|---|---|---|
| key | string | ボクセルキー |
