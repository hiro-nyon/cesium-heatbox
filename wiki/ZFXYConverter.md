# Class: ZFXYConverter（ZFXYConverterクラス）

**日本語** | [English](#english)

## English

ZFXYConverter - Built-in ZFXY (3D tile coordinates) converter
Provides Web Mercator-based ZFXY conversion without external dependencies.
This is a fallback when ouranos-gex-lib-for-javascript is not available.
Features:
- Web Mercator projection for X/Y tile calculation
- Fixed altitude binning for F (vertical) coordinate
- 8-vertex bounding box generation
- Coordinate normalization and clamping

### Constructor

#### new ZFXYConverter()

### Methods

#### (static) convert(lng, lat, alt, zoom) → {Object}

Convert lng/lat/alt to ZFXY coordinates and bounding box

| Name | Type | Description |
|---|---|---|
| lng | number | Longitude (degrees, -180 to 180) |
| lat | number | Latitude (degrees, -85.0511 to 85.0511) |
| alt | number | Altitude (meters) |
| zoom | number | Zoom level (0-35) |

#### (static) parseZFXYStr(zfxyStr) → {Object|null}

Parse zfxyStr to ZFXY object

| Name | Type | Description |
|---|---|---|
| zfxyStr | string | ZFXY string in format "/z/f/x/y" |

#### (static) validateZFXY(zfxy) → {boolean}

Validate ZFXY coordinates

| Name | Type | Description |
|---|---|---|
| zfxy | Object | ZFXY coordinates Properties Properties: ``z`` (`number`) - Zoom level; ``f`` (`number`) - Altitude index; ``x`` (`number`) - X tile coordinate; ``y`` (`number`) - Y tile coordinate | z | number | Zoom level | f | number | Altitude index | x | number | X tile coordinate | y | number | Y tile coordinate |
| z | number | Zoom level |
| f | number | Altitude index |
| x | number | X tile coordinate |
| y | number | Y tile coordinate |


## 日本語

内蔵ZFXY（3次元タイル座標）コンバーター
外部依存なしでWeb MercatorベースのZFXY変換を提供。
ouranos-gex-lib-for-javascriptが利用できない場合のフォールバック。
機能：
- X/Yタイル計算にWeb Mercator投影を使用
- F（垂直）座標の固定高度ビニング
- 8頂点バウンディングボックス生成
- 座標の正規化とクランプ

### コンストラクタ

#### new ZFXYConverter()

### メソッド

#### (static) convert(lng, lat, alt, zoom) → {Object}

lng/lat/altをZFXY座標とバウンディングボックスに変換

| 名前 | 型 | 説明 |
|---|---|---|
| lng | number | Longitude (degrees, -180 to 180) |
| lat | number | Latitude (degrees, -85.0511 to 85.0511) |
| alt | number | Altitude (meters) |
| zoom | number | Zoom level (0-35) |

#### (static) parseZFXYStr(zfxyStr) → {Object|null}

zfxyStr文字列をZFXYオブジェクトにパース

| 名前 | 型 | 説明 |
|---|---|---|
| zfxyStr | string | ZFXY string in format "/z/f/x/y" |

#### (static) validateZFXY(zfxy) → {boolean}

ZFXY座標を検証

| 名前 | 型 | 説明 |
|---|---|---|
| zfxy | Object | ZFXY coordinates Properties プロパティ: ``z`` (`number`) - Zoom level; ``f`` (`number`) - Altitude index; ``x`` (`number`) - X tile coordinate; ``y`` (`number`) - Y tile coordinate | z | number | Zoom level | f | number | Altitude index | x | number | X tile coordinate | y | number | Y tile coordinate |
| z | number | Zoom level |
| f | number | Altitude index |
| x | number | X tile coordinate |
| y | number | Y tile coordinate |
