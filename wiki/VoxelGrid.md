# Class: VoxelGrid（VoxelGridクラス）

**日本語** | [English](#english)

## English

Class for managing 3D voxel grids.

### Constructor

#### new VoxelGrid()

### Methods

#### (static) createGrid(bounds, voxelSizeMeters) → {Object}

Create a grid from bounds and voxel size (simple version).

| Name | Type | Description |
|---|---|---|
| bounds | Object | Bounds info / 境界情報 |
| voxelSizeMeters | number | Target voxel size in meters (actual cell size is range/divisions per axis) / 目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。 |

#### (static) getVoxelKey(x, y, z) → {string}

Generate a key from voxel indices.

| Name | Type | Description |
|---|---|---|
| x | number | X index / X軸インデックス |
| y | number | Y index / Y軸インデックス |
| z | number | Z index / Z軸インデックス |

#### (static) iterateAllVoxels(grid, callback)

Iterate all voxels and invoke callback per cell.

| Name | Type | Description |
|---|---|---|
| grid | Object | Grid info / グリッド情報 |
| callback | function | Callback per voxel / 各ボクセルに対するコールバック関数 |

#### (static) parseVoxelKey(key) → {Object}

Parse voxel key into indices.

| Name | Type | Description |
|---|---|---|
| key | string | Voxel key / ボクセルキー |


## 日本語

3Dボクセルグリッドを管理するクラス。

### コンストラクタ

#### new VoxelGrid()

### メソッド

#### (static) createGrid(bounds, voxelSizeMeters) → {Object}

境界情報とボクセルサイズからグリッドを作成（シンプル版）。

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | Bounds info / 境界情報 |
| voxelSizeMeters | number | Target voxel size in meters (actual cell size is range/divisions per axis) / 目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。 |

#### (static) getVoxelKey(x, y, z) → {string}

ボクセルインデックスからキーを生成します。

| 名前 | 型 | 説明 |
|---|---|---|
| x | number | X index / X軸インデックス |
| y | number | Y index / Y軸インデックス |
| z | number | Z index / Z軸インデックス |

#### (static) iterateAllVoxels(grid, callback)

グリッド内の全ボクセルを反復処理します。

| 名前 | 型 | 説明 |
|---|---|---|
| grid | Object | Grid info / グリッド情報 |
| callback | function | Callback per voxel / 各ボクセルに対するコールバック関数 |

#### (static) parseVoxelKey(key) → {Object}

ボクセルキーからインデックスを解析します。

| 名前 | 型 | 説明 |
|---|---|---|
| key | string | Voxel key / ボクセルキー |
