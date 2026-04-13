# Class: TimeSlicer（TimeSlicerクラス）

**日本語** | [English](#english)

## English

TimeSlicer class for managing and retrieving time-series data.

### Constructor

#### new TimeSlicer(rawData, options)

### Methods

#### calculateGlobalStats(valueProperty) → {Object}

Calculate global statistics across all time entries.

| Name | Type | Default | Description |
|---|---|---|---|
| valueProperty | string | weight | Property name to use for value (default: 'weight') |

#### getCacheHitRate() → {number}

Get cache hit rate.

#### getEntry(currentTime) → {Object|null}

Get entry for the current time.

| Name | Type | Description |
|---|---|---|
| currentTime | Cesium.JulianDate |  |

#### getTimeRange() → {Object|null}

Get time range of all data.


## 日本語

時系列データの管理と高速検索を担当するクラス。

### コンストラクタ

#### new TimeSlicer(rawData, options)

### メソッド

#### calculateGlobalStats(valueProperty) → {Object}

全時間のエントリーにまたがる統計量を計算します。

| 名前 | 型 | 既定値 | 説明 |
|---|---|---|---|
| valueProperty | string | weight | Property name to use for value (default: 'weight') |

#### getCacheHitRate() → {number}

キャッシュヒット率を取得します。

#### getEntry(currentTime) → {Object|null}

現在時刻に対応するエントリーを取得します。

| 名前 | 型 | 説明 |
|---|---|---|
| currentTime | Cesium.JulianDate |  |

#### getTimeRange() → {Object|null}

全データの時間範囲を取得します。
