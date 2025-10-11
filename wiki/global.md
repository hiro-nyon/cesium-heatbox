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

#### (constant) DENSITY_PATTERNS

Density pattern generators map (ADR-0011 Phase 1)

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

#### (constant) PROFILES

Predefined configuration profiles

#### (constant) VERSION

Library metadata.

#### (constant) log

Wrapper functions for backward compatibility.

#### applyAutoRenderBudget(options) → {Object}

Apply auto render budget to options

| Name | Type | Description |
|---|---|---|
| options | Object | 設定オプション |

#### applyProfile(profileName, userOptions) → {Object}

Apply profile to options with user options taking priority

| Name | Type | Description |
|---|---|---|
| profileName | string | Profile name / プロファイル名 |
| userOptions | Object | User provided options / ユーザー提供オプション |

#### calculateDataRange(bounds) → {Object}

Calculate physical span (meters) from geographic bounds.

| Name | Type | Description |
|---|---|---|
| bounds | Object | Bounds information / 境界情報 |

#### clearWarnings()

Clear all warning states (for testing)

#### coerceBoolean(value, fallbackopt) → {boolean}

Coerce various input types to boolean while respecting common string representations.

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| value | * |  |  | 値 |
| fallback | boolean | <optional> | false | 未定義/無効値時のフォールバック |

#### createBoundsFromCenter(centerLon, centerLat, centerAlt, sizeMeters) → {Object}

Create an axis-aligned bounding box from a centre point and edge length.

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

#### generateClusteredPattern(bounds, count, clusterCount) → {Array.<Cesium.Entity>}

Generate a clustered density pattern.

| Name | Type | Default | Description |
|---|---|---|---|
| bounds | Object |  | Bounding box |
| count | number |  | Total entity count |
| clusterCount | number | 3 | Number of clusters (default: 3) |

#### generateGradientPattern(bounds, count) → {Array.<Cesium.Entity>}

Generate a gradient-based density pattern.

| Name | Type | Description |
|---|---|---|
| bounds | Object | Bounding box |
| count | number | Total entity count |

#### generateMixedPattern(bounds, count) → {Array.<Cesium.Entity>}

Generate a mixed density pattern.

| Name | Type | Description |
|---|---|---|
| bounds | Object | Bounding box |
| count | number | Total entity count |

#### generatePatternData(pattern, bounds, count) → {Array.<Cesium.Entity>}

Generate test dataset with specified pattern

| Name | Type | Description |
|---|---|---|
| pattern | string | Pattern name ('clustered', 'scattered', 'gradient', 'mixed') |
| bounds | Object | Bounding box |
| count | number | Total entity count |

#### generateSampleData(total, config) → {Array.<Cesium.Entity>}

Generate clustered sample entities without adding to a viewer.

| Name | Type | Description |
|---|---|---|
| total | number | 総エンティティ数 |
| config | Object | { clusters: Array<{ center:[lon,lat,alt], radius:number, density:number, count:number }> } |

#### generateScatteredPattern(bounds, count) → {Array.<Cesium.Entity>}

Generate a scattered density pattern.

| Name | Type | Description |
|---|---|---|
| bounds | Object | Bounding box |
| count | number | Total entity count |

#### generateTestEntities(viewer, bounds, count) → {Array}

Generate pseudo-random test entities within the specified bounds.

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |
| bounds | Object | 生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt} |
| count | number | 生成数（デフォルト: 500） |

#### getAllEntities(viewer) → {Array}

Retrieve every entity registered on the given viewer.

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

#### getDeviceInfo() → {Object}

Get device information

#### getEnvironmentInfo() → {Object}

Get environment information.

#### getLogLevel()

Determine current log level.

#### getProfile(profileName) → {Object|null}

Get profile configuration

| Name | Type | Description |
|---|---|---|
| profileName | string | Profile name / プロファイル名 |

#### getProfileNames() → {Array.<string>}

Get list of available profile names

#### getTokyoStationBounds() → {Object}

Return a convenience bounding box covering the Tokyo Station area.

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

#### isValidProfile(profileName) → {boolean}

Validate profile name

| Name | Type | Description |
|---|---|---|
| profileName | string | Profile name to validate / 検証するプロファイル名 |

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

#### warnOnce(code, message)

Warn once about deprecated feature

| Name | Type | Description |
|---|---|---|
| code | string | Unique warning code / 一意の警告コード |
| message | string | Warning message / 警告メッセージ |

#### EmulationScope

#### HeatboxAdaptiveParams

#### HeatboxAutoVoxelSizeInfo

#### HeatboxBounds

#### HeatboxDebugInfo

#### HeatboxFitViewOptions

#### HeatboxGridInfo

#### HeatboxHighlightStyle

#### HeatboxOpacityResolverContext

#### HeatboxOptions

#### HeatboxOutlineWidthResolverParams

#### HeatboxResolverVoxelInfo

#### HeatboxStatistics

#### OutlineRenderMode

#### OutlineWidthPreset

#### PerformanceOverlayConfig

#### ProfileName


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

#### (constant) DENSITY_PATTERNS

パラメータ最適化用密度パターンマップ

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

#### (constant) PROFILES

事前定義された設定プロファイル

#### (constant) VERSION

ライブラリのメタ情報。

#### (constant) log

既存の console.log 置き換え用のラッパー関数群。

#### applyAutoRenderBudget(options) → {Object}

Auto Render Budgetをオプションに適用

| 名前 | 型 | 説明 |
|---|---|---|
| options | Object | 設定オプション |

#### applyProfile(profileName, userOptions) → {Object}

ユーザーオプション優先でプロファイルをオプションに適用

| 名前 | 型 | 説明 |
|---|---|---|
| profileName | string | Profile name / プロファイル名 |
| userOptions | Object | User provided options / ユーザー提供オプション |

#### calculateDataRange(bounds) → {Object}

境界からデータ範囲（メートル）を計算します。

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | Bounds information / 境界情報 |

#### clearWarnings()

すべての警告状態をクリア（テスト用）

#### coerceBoolean(value, fallbackopt) → {boolean}

文字列で渡された真偽値表現にも対応した安全な真偽値変換を行う。

| 名前 | 型 | 属性 | 既定値 | 説明 |
|---|---|---|---|---|
| value | * |  |  | 値 |
| fallback | boolean | <optional> | false | 未定義/無効値時のフォールバック |

#### createBoundsFromCenter(centerLon, centerLat, centerAlt, sizeMeters) → {Object}

指定された中心点とサイズから境界を生成します。

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

#### generateClusteredPattern(bounds, count, clusterCount) → {Array.<Cesium.Entity>}

高密度クラスターの分布を生成します。

| 名前 | 型 | 既定値 | 説明 |
|---|---|---|---|
| bounds | Object |  | Bounding box |
| count | number |  | Total entity count |
| clusterCount | number | 3 | Number of clusters (default: 3) |

#### generateGradientPattern(bounds, count) → {Array.<Cesium.Entity>}

グラデーション分布のデータセットを生成します。

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | Bounding box |
| count | number | Total entity count |

#### generateMixedPattern(bounds, count) → {Array.<Cesium.Entity>}

混在分布のデータセットを生成します。

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | Bounding box |
| count | number | Total entity count |

#### generatePatternData(pattern, bounds, count) → {Array.<Cesium.Entity>}

指定したパターンでテストデータセットを生成

| 名前 | 型 | 説明 |
|---|---|---|
| pattern | string | Pattern name ('clustered', 'scattered', 'gradient', 'mixed') |
| bounds | Object | Bounding box |
| count | number | Total entity count |

#### generateSampleData(total, config) → {Array.<Cesium.Entity>}

ビューアに追加せず、クラスター状のサンプルエンティティ配列を生成します。

| 名前 | 型 | 説明 |
|---|---|---|
| total | number | 総エンティティ数 |
| config | Object | { clusters: Array<{ center:[lon,lat,alt], radius:number, density:number, count:number }> } |

#### generateScatteredPattern(bounds, count) → {Array.<Cesium.Entity>}

疎分布のデータセットを生成します。

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | Bounding box |
| count | number | Total entity count |

#### generateTestEntities(viewer, bounds, count) → {Array}

指定範囲内にランダムなテストエンティティを生成します。

| 名前 | 型 | 説明 |
|---|---|---|
| viewer | Object | CesiumJS Viewer |
| bounds | Object | 生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt} |
| count | number | 生成数（デフォルト: 500） |

#### getAllEntities(viewer) → {Array}

指定された Viewer の全エンティティを取得します。

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

#### getProfile(profileName) → {Object|null}

プロファイル設定を取得

| 名前 | 型 | 説明 |
|---|---|---|
| profileName | string | Profile name / プロファイル名 |

#### getProfileNames() → {Array.<string>}

利用可能なプロファイル名の一覧を取得

#### getTokyoStationBounds() → {Object}

東京駅周辺の境界情報を返します。

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

#### isValidProfile(profileName) → {boolean}

プロファイル名の検証

| 名前 | 型 | 説明 |
|---|---|---|
| profileName | string | Profile name to validate / 検証するプロファイル名 |

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

#### warnOnce(code, message)

廃止予定機能について一度だけ警告する

| 名前 | 型 | 説明 |
|---|---|---|
| code | string | Unique warning code / 一意の警告コード |
| message | string | Warning message / 警告メッセージ |

#### EmulationScope

#### HeatboxAdaptiveParams

#### HeatboxAutoVoxelSizeInfo

#### HeatboxBounds

#### HeatboxDebugInfo

#### HeatboxFitViewOptions

#### HeatboxGridInfo

#### HeatboxHighlightStyle

#### HeatboxOpacityResolverContext

#### HeatboxOptions

#### HeatboxOutlineWidthResolverParams

#### HeatboxResolverVoxelInfo

#### HeatboxStatistics

#### OutlineRenderMode

#### OutlineWidthPreset

#### PerformanceOverlayConfig

#### ProfileName
