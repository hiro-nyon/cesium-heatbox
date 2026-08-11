<!-- Generated from docs/api/SpatialIdAdapter.html by npm run wiki:sync. Edit JSDoc in src/, not this page. -->

# Class: SpatialIdAdapter（SpatialIdAdapterクラス）

**日本語** | [English](#english)

## English

SpatialIdAdapter - Abstraction layer for spatial ID providers
Provides a unified interface for spatial ID conversion with support for:
- Dynamic loading of the bundled ouranos-gex-lib-for-javascript provider
- Built-in Web Mercator-based fallback converter (ZFXYConverter)
- Automatic zoom level selection based on target cell size
- 8-vertex bounding box calculation for each spatial ID voxel

### Constructor

#### new SpatialIdAdapter(options)

### Methods

#### calculateOptimalZoom(targetSize, centerLat, toleranceopt) → {number}

Calculate optimal zoom level for target cell size
Automatically selects the best zoom level (15-30) to match a target cell size at a given
latitude. The algorithm prioritizes zoom levels within the specified tolerance, falling back
to the closest match if no zoom meets the tolerance.

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| targetSize | number |  |  | Target cell size in meters (目標セルサイズ、メートル単位) |
| centerLat | number |  |  | Center latitude for calculation in degrees (計算用の中心緯度、度単位) |
| tolerance | number | <optional> | 10 | Tolerance percentage, 0-100 (許容誤差、パーセント、0-100) |

#### children(zfxy) → {Array.<{z:number, f:number, x:number, y:number}>}

Get children for given ZFXY tile (4-way subdivision in X/Y).
Altitude index F is kept as-is; vertical subdivision is not modeled here.

| Name | Type | Description |
|---|---|---|
| zfxy | Object | Parent tile / 親タイル |

#### getStatus() → {Object}

Get provider status information

#### getVoxelBounds(lng, lat, alt, zoom) → {Object|Object|number|number|number|number|string|Array.<{lng: number, lat: number, alt: number}>}

Get voxel bounds from geographic coordinates
Converts a geographic point (lng/lat/alt) and zoom level into a spatial ID voxel
with 8-vertex bounding box. Uses ouranos-gex if available, otherwise falls back
to built-in Web Mercator converter.

| Name | Type | Description |
|---|---|---|
| lng | number | Longitude in degrees (経度、度単位) |
| lat | number | Latitude in degrees (緯度、度単位) |
| alt | number | Altitude in meters (高度、メートル単位) |
| zoom | number | Zoom level 0-35 (ズームレベル 0-35) |

#### (async) loadProvider() → {Promise.<boolean>}

Load spatial ID provider dynamically

#### neighbors(zfxy) → {Array.<{z:number, f:number, x:number, y:number}>}

Get neighbors for given ZFXY tile (8-connected in X/Y).
Dateline wrapping is handled in X so that tiles at x=0 and x=max
are considered neighbors across the ±180° meridian.

| Name | Type | Description |
|---|---|---|
| zfxy | Object | Tile identifier / タイル識別子 |

#### parent(zfxy) → {Object|null}

Get parent tile for given ZFXY tile.

| Name | Type | Description |
|---|---|---|
| zfxy | Object | Child tile / 子タイル |


## 日本語

空間IDプロバイダーの抽象化層
以下をサポートする空間ID変換の統合インターフェースを提供：
- バンドル済みouranos-gex-lib-for-javascriptプロバイダーの動的読み込み
- 内蔵Web Mercatorベースのフォールバックコンバーター（ZFXYConverter）
- 目標セルサイズに基づく自動ズームレベル選択
- 各空間IDボクセルの8頂点バウンディングボックス計算

### コンストラクタ

#### new SpatialIdAdapter(options)

### メソッド

#### calculateOptimalZoom(targetSize, centerLat, toleranceopt) → {number}

ターゲットセルサイズに対する最適なズームレベルを計算
指定された緯度でターゲットセルサイズに最も近い最適なズームレベル（15-30）を
自動選択します。アルゴリズムは指定された許容範囲内のズームレベルを優先し、
許容範囲を満たすズームがない場合は最も近いものにフォールバックします。

| 名前 | 型 | 属性 | 既定値 | 説明 |
|---|---|---|---|---|
| targetSize | number |  |  | Target cell size in meters (目標セルサイズ、メートル単位) |
| centerLat | number |  |  | Center latitude for calculation in degrees (計算用の中心緯度、度単位) |
| tolerance | number | <optional> | 10 | Tolerance percentage, 0-100 (許容誤差、パーセント、0-100) |

#### children(zfxy) → {Array.<{z:number, f:number, x:number, y:number}>}

指定ZFXYタイルの子セル（X/Yを2分割した4セル）を取得します。
高度方向Fはそのままとし、垂直方向の細分化は扱いません。

| 名前 | 型 | 説明 |
|---|---|---|
| zfxy | Object | Parent tile / 親タイル |

#### getStatus() → {Object}

プロバイダーステータス情報を取得

#### getVoxelBounds(lng, lat, alt, zoom) → {Object|Object|number|number|number|number|string|Array.<{lng: number, lat: number, alt: number}>}

地理座標からボクセル境界を取得
地理的な点（経度/緯度/高度）とズームレベルを、8頂点バウンディングボックスを
持つ空間IDボクセルに変換します。利用可能な場合はouranos-gexを使用し、
それ以外の場合は内蔵Web Mercatorコンバーターにフォールバックします。

| 名前 | 型 | 説明 |
|---|---|---|
| lng | number | Longitude in degrees (経度、度単位) |
| lat | number | Latitude in degrees (緯度、度単位) |
| alt | number | Altitude in meters (高度、メートル単位) |
| zoom | number | Zoom level 0-35 (ズームレベル 0-35) |

#### (async) loadProvider() → {Promise.<boolean>}

空間IDプロバイダーを動的に読み込む

#### neighbors(zfxy) → {Array.<{z:number, f:number, x:number, y:number}>}

指定ZFXYタイルの隣接セル（X/Yの8近傍）を取得します。
経度±180°付近ではX方向のラップを考慮し、x=0 と x=max を隣接セルとして扱います。

| 名前 | 型 | 説明 |
|---|---|---|
| zfxy | Object | Tile identifier / タイル識別子 |

#### parent(zfxy) → {Object|null}

指定ZFXYタイルの親セルを取得します。

| 名前 | 型 | 説明 |
|---|---|---|
| zfxy | Object | Child tile / 子タイル |
