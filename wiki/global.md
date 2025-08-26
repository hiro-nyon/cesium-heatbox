# JSDoc: Global

# Global

### Members

#### (constant) COLOR_CONSTANTS

#### (constant) COLOR_CONSTANTS

#### (constant) COORDINATE_CONSTANTS

#### (constant) COORDINATE_CONSTANTS

#### (constant) DEFAULT_OPTIONS

#### (constant) DEFAULT_OPTIONS

#### (constant) DEFAULT_STATISTICS

#### (constant) DEFAULT_STATISTICS

#### (constant) ERROR_MESSAGES

#### (constant) ERROR_MESSAGES

#### (constant) LOG_LEVELS

#### (constant) LOG_LEVELS

#### (constant) Logger

#### (constant) Logger

#### (constant) PERFORMANCE_LIMITS

#### (constant) PERFORMANCE_LIMITS

#### (constant) VERSION

#### (constant) VERSION

#### (constant) log

#### (constant) log

### Methods

#### calculateDataRange(bounds) → {Object}

##### Parameters:

##### Returns:

#### calculateDataRange(bounds) → {Object}

##### Parameters:

##### Returns:

#### createBoundsFromCenter(centerLon, centerLat, centerAlt, sizeMeters) → {Object}

##### Parameters:

##### Returns:

#### createBoundsFromCenter(centerLon, centerLat, centerAlt, sizeMeters) → {Object}

##### Parameters:

##### Returns:

#### createHeatbox(viewer, options) → {Heatbox}

##### Parameters:

##### Returns:

#### createHeatbox(viewer, options) → {Heatbox}

##### Parameters:

##### Returns:

#### estimateInitialVoxelSize(bounds, entityCount) → {number}

##### Parameters:

##### Returns:

#### estimateInitialVoxelSize(bounds, entityCount) → {number}

##### Parameters:

##### Returns:

#### generateTestEntities(viewer, bounds, count) → {Array}

##### Parameters:

##### Returns:

#### generateTestEntities(viewer, bounds, count) → {Array}

##### Parameters:

##### Returns:

#### getAllEntities(viewer) → {Array}

##### Parameters:

##### Returns:

#### getAllEntities(viewer) → {Array}

##### Parameters:

##### Returns:

#### getEnvironmentInfo() → {Object}

##### Returns:

#### getEnvironmentInfo() → {Object}

##### Returns:

#### getLogLevel()

#### getLogLevel()

#### getTokyoStationBounds() → {Object}

##### Returns:

#### getTokyoStationBounds() → {Object}

##### Returns:

#### hasValidPosition(entity) → {boolean}

##### Parameters:

##### Returns:

#### hasValidPosition(entity) → {boolean}

##### Parameters:

##### Returns:

#### isValidEntities(entities) → {boolean}

##### Parameters:

##### Returns:

#### isValidEntities(entities) → {boolean}

##### Parameters:

##### Returns:

#### isValidViewer(viewer) → {boolean}

##### Parameters:

##### Returns:

#### isValidViewer(viewer) → {boolean}

##### Parameters:

##### Returns:

#### isValidVoxelSize(voxelSize) → {boolean}

##### Parameters:

##### Returns:

#### isValidVoxelSize(voxelSize) → {boolean}

##### Parameters:

##### Returns:

#### validateAndNormalizeOptions(options) → {Object}

##### Parameters:

##### Returns:

#### validateAndNormalizeOptions(options) → {Object}

##### Parameters:

##### Returns:

#### validateVoxelCount(totalVoxels, voxelSize) → {Object}

##### Parameters:

##### Returns:

#### validateVoxelCount(totalVoxels, voxelSize) → {Object}

##### Parameters:

##### Returns:

## Home

### Classes

### Global

統計情報のデフォルト値

統計情報のデフォルト値

ログ出力の共通ユーティリティ

ログ出力の共通ユーティリティ

下位互換のためのラッパー関数群
既存のconsole.log置き換え用

下位互換のためのラッパー関数群
既存のconsole.log置き換え用

境界からデータ範囲を計算

境界からデータ範囲を計算

指定された中心点とサイズから境界を生成

一辺のサイズ（メートル）

指定された中心点とサイズから境界を生成

一辺のサイズ（メートル）

Quick start helper function

CesiumJS Viewer

Configuration options

Quick start helper function

CesiumJS Viewer

Configuration options

データ範囲に基づいて初期ボクセルサイズを推定

データ範囲に基づいて初期ボクセルサイズを推定

指定された範囲内にランダムなテストエンティティを生成

CesiumJS Viewer

生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt}

生成数（デフォルト: 500）

指定された範囲内にランダムなテストエンティティを生成

CesiumJS Viewer

生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt}

生成数（デフォルト: 500）

指定されたviewerの全エンティティを取得

CesiumJS Viewer

指定されたviewerの全エンティティを取得

CesiumJS Viewer

現在のログレベルを決定
NODE_ENV=production では ERROR と WARN のみ
DEBUG=true または NODE_ENV=development では全レベル出力

現在のログレベルを決定
NODE_ENV=production では ERROR と WARN のみ
DEBUG=true または NODE_ENV=development では全レベル出力

東京駅周辺の境界を取得

東京駅周辺の境界を取得

エンティティが有効な位置情報を持つかチェック

Cesium Entity

エンティティが有効な位置情報を持つかチェック

Cesium Entity

エンティティ配列が有効かチェック

エンティティ配列が有効かチェック

CesiumJS Viewerが有効かチェック

CesiumJS Viewer

CesiumJS Viewerが有効かチェック

CesiumJS Viewer

ボクセルサイズが有効かチェック

ボクセルサイズが有効かチェック

オプションを検証して正規化
v0.1.5: batchMode非推奨化と新機能バリデーションを追加

ユーザー指定のオプション

オプションを検証して正規化
v0.1.5: batchMode非推奨化と新機能バリデーションを追加

ユーザー指定のオプション

処理するボクセル数が制限内かチェック

処理するボクセル数が制限内かチェック

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |

| Name | Type | Description |
|---|---|---|
| centerLon | number | 中心経度 |
| centerLat | number | 中心緯度 |
| centerAlt | number | 中心高度 |
| sizeMeters | number | 一辺のサイズ（メートル） |

| Name | Type | Description |
|---|---|---|
| centerLon | number | 中心経度 |
| centerLat | number | 中心緯度 |
| centerAlt | number | 中心高度 |
| sizeMeters | number | 一辺のサイズ（メートル） |

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |
| options | Object | Configuration options |

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |
| options | Object | Configuration options |

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |
| entityCount | number | エンティティ数 |

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |
| entityCount | number | エンティティ数 |

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |
| bounds | Object | 生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt} |
| count | number | 生成数（デフォルト: 500） |

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |
| bounds | Object | 生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt} |
| count | number | 生成数（デフォルト: 500） |

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

| Name | Type | Description |
|---|---|---|
| entity | Object | Cesium Entity |

| Name | Type | Description |
|---|---|---|
| entity | Object | Cesium Entity |

| Name | Type | Description |
|---|---|---|
| entities | Array | エンティティ配列 |

| Name | Type | Description |
|---|---|---|
| entities | Array | エンティティ配列 |

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

| Name | Type | Description |
|---|---|---|
| voxelSize | number | ボクセルサイズ |

| Name | Type | Description |
|---|---|---|
| voxelSize | number | ボクセルサイズ |

| Name | Type | Description |
|---|---|---|
| options | Object | ユーザー指定のオプション |

| Name | Type | Description |
|---|---|---|
| options | Object | ユーザー指定のオプション |

| Name | Type | Description |
|---|---|---|
| totalVoxels | number | 総ボクセル数 |
| voxelSize | number | ボクセルサイズ |

| Name | Type | Description |
|---|---|---|
| totalVoxels | number | 総ボクセル数 |
| voxelSize | number | ボクセルサイズ |
