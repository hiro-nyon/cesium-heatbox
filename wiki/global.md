# Global

**日本語** | [English](#english)

## English

### Constructor

#### (constant) COLOR_CONSTANTS

### Methods

#### (constant) COLOR_CONSTANTS

Color-related constants.

#### (constant) COORDINATE_CONSTANTS

Coordinate-related constants.

#### (constant) DEFAULT_OPTIONS

Default option values.

#### (constant) DEFAULT_STATISTICS

Default statistics values.

#### (constant) DEVICE_TIER_RANGES

Device tier constants

#### (constant) ERROR_MESSAGES

Error message strings.

#### (constant) LOG_LEVELS

Log level constants.

#### (constant) Logger

Common logging utility.

#### (constant) PERFORMANCE_LIMITS

Performance limits.

#### (constant) VERSION

Library metadata.

#### (constant) log

Wrapper functions for backward compatibility.

#### applyAutoRenderBudget(options) → {Object}

Apply auto render budget to options

| Name | Type | Description |
|---|---|---|
| options | Object | 設定オプション |

#### calculateDataRange(bounds) → {Object}

> English translation pending. See Japanese section below.

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |

#### createBoundsFromCenter(centerLon, centerLat, centerAlt, sizeMeters) → {Object}

> English translation pending. See Japanese section below.

| Name | Type | Description |
|---|---|---|
| centerLon | number | 中心経度 |
| centerLat | number | 中心緯度 |
| centerAlt | number | 中心高度 |
| sizeMeters | number | 一辺のサイズ（メートル） |

#### detectDeviceTier() → {Object}

Detect device tier and return appropriate maxRenderVoxels

#### estimateInitialVoxelSize(bounds, entityCount, options) → {number}

Estimate initial voxel size based on data range.

| Name | Type | Description |
|---|---|---|
| bounds | Object | Bounds info / 境界情報 |
| entityCount | number | Number of entities / エンティティ数 |
| options | Object | Calculation options / 計算オプション |

#### estimateVoxelSizeBasic(bounds, entityCount) → {number}

Basic voxel size estimation (existing algorithm).

| Name | Type | Description |
|---|---|---|
| bounds | Object | Bounds info / 境界情報 |
| entityCount | number | Number of entities / エンティティ数 |

#### estimateVoxelSizeByOccupancy(bounds, entityCount, options) → {number}

Occupancy-based voxel size estimation with iterative approximation.

| Name | Type | Description |
|---|---|---|
| bounds | Object | Bounds info / 境界情報 |
| entityCount | number | Number of entities / エンティティ数 |
| options | Object | Calculation options / 計算オプション |

#### generateSampleData(total, config) → {Array.<Cesium.Entity>}

Generate clustered sample entities without adding to a viewer.

| Name | Type | Description |
|---|---|---|
| total | number | 総エンティティ数 |
| config | Object | { clusters: Array<{ center:[lon,lat,alt], radius:number, density:number, count:number }> } |

#### generateTestEntities(viewer, bounds, count) → {Array}

> English translation pending. See Japanese section below.

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |
| bounds | Object | 生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt} |
| count | number | 生成数（デフォルト: 500） |

#### getAllEntities(viewer) → {Array}

> English translation pending. See Japanese section below.

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

#### getDeviceInfo() → {Object}

Get device information

#### getEnvironmentInfo() → {Object}

Get environment information.

#### getLogLevel()

Determine current log level.

#### getTokyoStationBounds() → {Object}

> English translation pending. See Japanese section below.

#### getWebGLInfo() → {Object}

Get WebGL capability information

#### hasValidPosition(entity) → {boolean}

Check whether an entity has a valid position.

| Name | Type | Description |
|---|---|---|
| entity | Object | Cesium Entity |

#### isValidEntities(entities) → {boolean}

Check whether the entity array is valid.

| Name | Type | Description |
|---|---|---|
| entities | Array | Entity array / エンティティ配列 |

#### isValidViewer(viewer) → {boolean}

Check whether a CesiumJS Viewer is valid.

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

#### isValidVoxelSize(voxelSize) → {boolean}

Check whether the voxel size is valid.

| Name | Type | Description |
|---|---|---|
| voxelSize | number | Voxel size / ボクセルサイズ |

#### validateAndNormalizeOptions(options) → {Object}

Validate and normalize options.

| Name | Type | Description |
|---|---|---|
| options | Object | User-specified options / ユーザー指定のオプション |

#### validateVoxelCount(totalVoxels, voxelSize) → {Object}

Validate that total voxel count is within limits.

| Name | Type | Description |
|---|---|---|
| totalVoxels | number | Total voxels / 総ボクセル数 |
| voxelSize | number | Voxel size / ボクセルサイズ |


## 日本語

### コンストラクタ

#### (constant) COLOR_CONSTANTS

### メソッド

#### (constant) COLOR_CONSTANTS

色分け関連定数。

#### (constant) COORDINATE_CONSTANTS

座標変換定数。

#### (constant) DEFAULT_OPTIONS

デフォルト設定値。

#### (constant) DEFAULT_STATISTICS

統計情報のデフォルト値。

#### (constant) DEVICE_TIER_RANGES

端末ティア定数

#### (constant) ERROR_MESSAGES

エラーメッセージ。

#### (constant) LOG_LEVELS

ログレベル定数。

#### (constant) Logger

ログ出力の共通ユーティリティ。

#### (constant) PERFORMANCE_LIMITS

パフォーマンス制限値。

#### (constant) VERSION

ライブラリのメタ情報。

#### (constant) log

既存の console.log 置き換え用のラッパー関数群。

#### applyAutoRenderBudget(options) → {Object}

Auto Render Budgetをオプションに適用

| 名前 | 型 | 説明 |
|---|---|---|
| options | Object | 設定オプション |

#### calculateDataRange(bounds) → {Object}

境界からデータ範囲を計算

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | 境界情報 |

#### createBoundsFromCenter(centerLon, centerLat, centerAlt, sizeMeters) → {Object}

指定された中心点とサイズから境界を生成

| 名前 | 型 | 説明 |
|---|---|---|
| centerLon | number | 中心経度 |
| centerLat | number | 中心緯度 |
| centerAlt | number | 中心高度 |
| sizeMeters | number | 一辺のサイズ（メートル） |

#### detectDeviceTier() → {Object}

端末ティアを検出し、適切なmaxRenderVoxelsを返す

#### estimateInitialVoxelSize(bounds, entityCount, options) → {number}

データ範囲に基づいて初期ボクセルサイズを推定します。

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | Bounds info / 境界情報 |
| entityCount | number | Number of entities / エンティティ数 |
| options | Object | Calculation options / 計算オプション |

#### estimateVoxelSizeBasic(bounds, entityCount) → {number}

基本的なボクセルサイズ推定（既存アルゴリズム）

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | Bounds info / 境界情報 |
| entityCount | number | Number of entities / エンティティ数 |

#### estimateVoxelSizeByOccupancy(bounds, entityCount, options) → {number}

占有率ベースのボクセルサイズ推定（反復近似）

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | Bounds info / 境界情報 |
| entityCount | number | Number of entities / エンティティ数 |
| options | Object | Calculation options / 計算オプション |

#### generateSampleData(total, config) → {Array.<Cesium.Entity>}

ビューアに追加せず、クラスター状のサンプルエンティティ配列を生成します。

| 名前 | 型 | 説明 |
|---|---|---|
| total | number | 総エンティティ数 |
| config | Object | { clusters: Array<{ center:[lon,lat,alt], radius:number, density:number, count:number }> } |

#### generateTestEntities(viewer, bounds, count) → {Array}

指定された範囲内にランダムなテストエンティティを生成

| 名前 | 型 | 説明 |
|---|---|---|
| viewer | Object | CesiumJS Viewer |
| bounds | Object | 生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt} |
| count | number | 生成数（デフォルト: 500） |

#### getAllEntities(viewer) → {Array}

指定されたviewerの全エンティティを取得

| 名前 | 型 | 説明 |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

#### getDeviceInfo() → {Object}

端末情報を取得

#### getEnvironmentInfo() → {Object}

環境情報を取得します。

#### getLogLevel()

現在のログレベルを決定します。
NODE_ENV=production では ERROR と WARN のみ、DEBUG=true または NODE_ENV=development では全レベル出力。

#### getTokyoStationBounds() → {Object}

東京駅周辺の境界を取得

#### getWebGLInfo() → {Object}

WebGL能力情報を取得

#### hasValidPosition(entity) → {boolean}

エンティティが有効な位置情報を持つかチェックします。

| 名前 | 型 | 説明 |
|---|---|---|
| entity | Object | Cesium Entity |

#### isValidEntities(entities) → {boolean}

エンティティ配列が有効かチェックします。

| 名前 | 型 | 説明 |
|---|---|---|
| entities | Array | Entity array / エンティティ配列 |

#### isValidViewer(viewer) → {boolean}

CesiumJS Viewerが有効かチェックします。

| 名前 | 型 | 説明 |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

#### isValidVoxelSize(voxelSize) → {boolean}

ボクセルサイズが有効かチェックします。

| 名前 | 型 | 説明 |
|---|---|---|
| voxelSize | number | Voxel size / ボクセルサイズ |

#### validateAndNormalizeOptions(options) → {Object}

オプションを検証して正規化します。
v0.1.5: batchMode 非推奨化と新機能バリデーションを追加。

| 名前 | 型 | 説明 |
|---|---|---|
| options | Object | User-specified options / ユーザー指定のオプション |

#### validateVoxelCount(totalVoxels, voxelSize) → {Object}

処理するボクセル数が制限内かチェックします。

| 名前 | 型 | 説明 |
|---|---|---|
| totalVoxels | number | Total voxels / 総ボクセル数 |
| voxelSize | number | Voxel size / ボクセルサイズ |
