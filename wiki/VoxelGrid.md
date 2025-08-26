# JSDoc: Class: VoxelGrid

# Class: VoxelGrid

## VoxelGrid()

## Constructor

#### new VoxelGrid()

### Methods

#### (static) createGrid(bounds, voxelSizeMeters) → {Object}

##### Parameters:

##### Returns:

#### (static) createGrid(bounds, voxelSizeMeters) → {Object}

##### Parameters:

##### Returns:

#### (static) getVoxelKey(x, y, z) → {string}

##### Parameters:

##### Returns:

#### (static) getVoxelKey(x, y, z) → {string}

##### Parameters:

##### Returns:

#### (static) iterateAllVoxels(grid, callback)

##### Parameters:

#### (static) iterateAllVoxels(grid, callback)

##### Parameters:

#### (static) parseVoxelKey(key) → {Object}

##### Parameters:

##### Returns:

#### (static) parseVoxelKey(key) → {Object}

##### Parameters:

##### Returns:

## VoxelGrid()

## Constructor

#### new VoxelGrid()

### Methods

#### (static) createGrid(bounds, voxelSizeMeters) → {Object}

##### Parameters:

##### Returns:

#### (static) createGrid(bounds, voxelSizeMeters) → {Object}

##### Parameters:

##### Returns:

#### (static) getVoxelKey(x, y, z) → {string}

##### Parameters:

##### Returns:

#### (static) getVoxelKey(x, y, z) → {string}

##### Parameters:

##### Returns:

#### (static) iterateAllVoxels(grid, callback)

##### Parameters:

#### (static) iterateAllVoxels(grid, callback)

##### Parameters:

#### (static) parseVoxelKey(key) → {Object}

##### Parameters:

##### Returns:

#### (static) parseVoxelKey(key) → {Object}

##### Parameters:

##### Returns:

## Home

### Classes

### Global

境界情報とボクセルサイズからグリッドを作成（シンプル版）

目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。

境界情報とボクセルサイズからグリッドを作成（シンプル版）

目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。

ボクセルインデックスからキーを生成

ボクセルインデックスからキーを生成

グリッド内の全ボクセルを反復処理

各ボクセルに対するコールバック関数

グリッド内の全ボクセルを反復処理

各ボクセルに対するコールバック関数

ボクセルキーからインデックスを解析

ボクセルキーからインデックスを解析

境界情報とボクセルサイズからグリッドを作成（シンプル版）

目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。

境界情報とボクセルサイズからグリッドを作成（シンプル版）

目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。

ボクセルインデックスからキーを生成

ボクセルインデックスからキーを生成

グリッド内の全ボクセルを反復処理

各ボクセルに対するコールバック関数

グリッド内の全ボクセルを反復処理

各ボクセルに対するコールバック関数

ボクセルキーからインデックスを解析

ボクセルキーからインデックスを解析

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |
| voxelSizeMeters | number | 目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。 |

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |
| voxelSizeMeters | number | 目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。 |

| Name | Type | Description |
|---|---|---|
| x | number | X軸インデックス |
| y | number | Y軸インデックス |
| z | number | Z軸インデックス |

| Name | Type | Description |
|---|---|---|
| x | number | X軸インデックス |
| y | number | Y軸インデックス |
| z | number | Z軸インデックス |

| Name | Type | Description |
|---|---|---|
| grid | Object | グリッド情報 |
| callback | function | 各ボクセルに対するコールバック関数 |

| Name | Type | Description |
|---|---|---|
| grid | Object | グリッド情報 |
| callback | function | 各ボクセルに対するコールバック関数 |

| Name | Type | Description |
|---|---|---|
| key | string | ボクセルキー |

| Name | Type | Description |
|---|---|---|
| key | string | ボクセルキー |

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |
| voxelSizeMeters | number | 目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。 |

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |
| voxelSizeMeters | number | 目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。 |

| Name | Type | Description |
|---|---|---|
| x | number | X軸インデックス |
| y | number | Y軸インデックス |
| z | number | Z軸インデックス |

| Name | Type | Description |
|---|---|---|
| x | number | X軸インデックス |
| y | number | Y軸インデックス |
| z | number | Z軸インデックス |

| Name | Type | Description |
|---|---|---|
| grid | Object | グリッド情報 |
| callback | function | 各ボクセルに対するコールバック関数 |

| Name | Type | Description |
|---|---|---|
| grid | Object | グリッド情報 |
| callback | function | 各ボクセルに対するコールバック関数 |

| Name | Type | Description |
|---|---|---|
| key | string | ボクセルキー |

| Name | Type | Description |
|---|---|---|
| key | string | ボクセルキー |
