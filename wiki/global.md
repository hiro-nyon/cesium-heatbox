# Global

## Constructor

### (constant) COLOR_CONSTANTS

## Methods

### (constant) COLOR_CONSTANTS

色分け関連定数

### (constant) COORDINATE_CONSTANTS

座標変換定数

### (constant) DEFAULT_OPTIONS

デフォルト設定値

### (constant) DEFAULT_STATISTICS

統計情報のデフォルト値

### (constant) ERROR_MESSAGES

エラーメッセージ

### (constant) LOG_LEVELS

ログレベル定数

### (constant) Logger

ログ出力の共通ユーティリティ

### (constant) PERFORMANCE_LIMITS

パフォーマンス制限値

### (constant) VERSION

ライブラリのメタ情報

### (constant) log

下位互換のためのラッパー関数群
既存のconsole.log置き換え用

### calculateDataRange(bounds) → {Object}

境界からデータ範囲を計算

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |

### createBoundsFromCenter(centerLon, centerLat, centerAlt, sizeMeters) → {Object}

指定された中心点とサイズから境界を生成

| Name | Type | Description |
|---|---|---|
| centerLon | number | 中心経度 |
| centerLat | number | 中心緯度 |
| centerAlt | number | 中心高度 |
| sizeMeters | number | 一辺のサイズ（メートル） |

### estimateInitialVoxelSize(bounds, entityCount) → {number}

データ範囲に基づいて初期ボクセルサイズを推定

| Name | Type | Description |
|---|---|---|
| bounds | Object | 境界情報 |
| entityCount | number | エンティティ数 |

### generateTestEntities(viewer, bounds, count) → {Array}

指定された範囲内にランダムなテストエンティティを生成

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |
| bounds | Object | 生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt} |
| count | number | 生成数（デフォルト: 500） |

### getAllEntities(viewer) → {Array}

指定されたviewerの全エンティティを取得

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

### getEnvironmentInfo() → {Object}

環境情報を取得

### getLogLevel()

現在のログレベルを決定
NODE_ENV=production では ERROR と WARN のみ
DEBUG=true または NODE_ENV=development では全レベル出力

### getTokyoStationBounds() → {Object}

東京駅周辺の境界を取得

### hasValidPosition(entity) → {boolean}

エンティティが有効な位置情報を持つかチェック

| Name | Type | Description |
|---|---|---|
| entity | Object | Cesium Entity |

### isValidEntities(entities) → {boolean}

エンティティ配列が有効かチェック

| Name | Type | Description |
|---|---|---|
| entities | Array | エンティティ配列 |

### isValidViewer(viewer) → {boolean}

CesiumJS Viewerが有効かチェック

| Name | Type | Description |
|---|---|---|
| viewer | Object | CesiumJS Viewer |

### isValidVoxelSize(voxelSize) → {boolean}

ボクセルサイズが有効かチェック

| Name | Type | Description |
|---|---|---|
| voxelSize | number | ボクセルサイズ |

### validateAndNormalizeOptions(options) → {Object}

オプションを検証して正規化
v0.1.5: batchMode非推奨化と新機能バリデーションを追加

| Name | Type | Description |
|---|---|---|
| options | Object | ユーザー指定のオプション |

### validateVoxelCount(totalVoxels, voxelSize) → {Object}

処理するボクセル数が制限内かチェック

| Name | Type | Description |
|---|---|---|
| totalVoxels | number | 総ボクセル数 |
| voxelSize | number | ボクセルサイズ |
