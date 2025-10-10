# Class: GeometryRenderer（GeometryRendererクラス）

**日本語** | [English](#english)

## English

GeometryRenderer - Creates Cesium entities consumed by VoxelRenderer.
Responsibilities:
ADR-0009 Phase 4

### Constructor

#### new GeometryRenderer(viewer, options)

### Methods

#### clear()

Clear all managed entities

#### createEdgePolylines(config) → {Array.<Cesium.Entity>}

Create edge polylines for thick outline emulation

| Name | Type | Description |
|---|---|---|
| config | Object | Edge polyline configuration / エッジポリライン設定<br>Properties: `centerLon`・`centerLat`・`centerAlt` (number) – Center position / 中心座標; `cellSizeX`・`cellSizeY` (number) – Footprint dimensions / フットプリント寸法; `boxHeight` (number) – Box height / ボックス高さ; `outlineColor` (Cesium.Color) – Outline color / 枠線色; `outlineWidth` (number) – Outline width / 枠線太さ; `voxelKey` (string) – Voxel key / ボクセルキー |

#### createInsetOutline(config) → {Cesium.Entity}

Create inset outline for a voxel

| Name | Type | Description |
|---|---|---|
| config | Object | Inset outline configuration / インセット枠線設定<br>Properties: `centerLon`・`centerLat`・`centerAlt` (number) – Center position / 中心座標; `baseSizeX`・`baseSizeY`・`baseSizeZ` (number) – Base dimensions / ベース寸法; `outlineColor` (Cesium.Color) – Outline color / 枠線色; `outlineWidth` (number) – Outline width / 枠線太さ; `voxelKey` (string) – Voxel key / ボクセルキー; `insetAmount` (number, optional) – Custom inset amount / カスタムインセット量 |

#### createThickOutlineFrames(config) → {Array.<Cesium.Entity>}

Create thick outline frame structures

| Name | Type | Description |
|---|---|---|
| config | Object | Frame configuration / フレーム設定<br>Properties: `centerLon`・`centerLat`・`centerAlt` (number) – Center position / 中心座標; `outerX`・`outerY`・`outerZ` (number) – Outer frame size / 外枠サイズ; `innerX`・`innerY`・`innerZ` (number) – Inner frame size / 内枠サイズ; `frameColor` (Cesium.Color) – Frame color / フレーム色; `voxelKey` (string) – Voxel key / ボクセルキー |

#### createVoxelBox(config) → {Cesium.Entity}

Create a voxel box entity

| Name | Type | Description |
|---|---|---|
| config | Object | Voxel configuration / ボクセル設定<br>Properties: `centerLon`・`centerLat`・`centerAlt` (number) – Center position / 中心座標; `cellSizeX`・`cellSizeY` (number) – Footprint dimensions / フットプリント寸法; `boxHeight` (number) – Box height / ボックス高さ; `color` (Cesium.Color) – Box color / ボックス色; `opacity` (number) – Box opacity / ボックス透明度; `shouldShowOutline` (boolean) – Show outline / 枠線表示; `outlineColor` (Cesium.Color) – Outline color / 枠線色; `outlineWidth` (number) – Outline width / 枠線太さ; `voxelInfo` (Object) – Voxel data / ボクセルデータ; `voxelKey` (string) – Voxel key / ボクセルキー; `emulateThick` (boolean, optional) – Use thick outline emulation / 太線エミュレーション使用 |

#### createVoxelDescription(voxelInfo, voxelKey) → {string}

Create voxel description HTML

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | Voxel information / ボクセル情報 |
| voxelKey | string | Voxel key / ボクセルキー |

#### getConfiguration() → {Object}

Get current configuration

#### getEntityCount() → {number}

Get entity count

#### renderBoundingBox(bounds)

Render a debug bounding box for given bounds

| Name | Type | Description |
|---|---|---|
| bounds | Object | {minLon, maxLon, minLat, maxLat, minAlt, maxAlt} |

#### shouldApplyInsetOutline(isTopN) → {boolean}

Check if inset outline should be applied

| Name | Type | Description |
|---|---|---|
| isTopN | boolean | Is TopN voxel / TopNボクセルかどうか |

#### updateOptions(newOptions)

Update rendering options

| Name | Type | Description |
|---|---|---|
| newOptions | Object | New options to merge / マージする新オプション |


## 日本語

ジオメトリレンダラー - VoxelRenderer が利用する Cesium エンティティを生成・管理
- ボクセルボックス描画 (Voxel box rendering)
- インセット枠線描画 (Inset outline rendering)
- エッジポリライン描画 (Edge polyline rendering for emulation)
- エンティティライフサイクル管理 (Entity lifecycle management)

### コンストラクタ

#### new GeometryRenderer(viewer, options)

### メソッド

#### clear()

管理対象の全エンティティをクリア

#### createEdgePolylines(config) → {Array.<Cesium.Entity>}

太線エミュレーション用のエッジポリライン作成

| 名前 | 型 | 説明 |
|---|---|---|
| config | Object | エッジポリライン設定 / Edge polyline configuration<br>プロパティ: centerLon・centerLat・centerAlt（number） - 中心座標 / Center position; cellSizeX・cellSizeY（number） - フットプリント寸法 / Footprint dimensions; boxHeight（number） - ボックス高さ / Box height; outlineColor（Cesium.Color） - 枠線色 / Outline color; outlineWidth（number） - 枠線太さ / Outline width; voxelKey（string） - ボクセルキー / Voxel key |

#### createInsetOutline(config) → {Cesium.Entity}

ボクセル用のインセット枠線を作成

| 名前 | 型 | 説明 |
|---|---|---|
| config | Object | インセット枠線設定 / Inset outline configuration<br>プロパティ: centerLon・centerLat・centerAlt（number） - 中心座標 / Center position; baseSizeX・baseSizeY・baseSizeZ（number） - ベース寸法 / Base dimensions; outlineColor（Cesium.Color） - 枠線色 / Outline color; outlineWidth（number） - 枠線太さ / Outline width; voxelKey（string） - ボクセルキー / Voxel key; insetAmount（number, optional） - カスタムインセット量 / Custom inset amount |

#### createThickOutlineFrames(config) → {Array.<Cesium.Entity>}

太枠フレーム構造を生成

| 名前 | 型 | 説明 |
|---|---|---|
| config | Object | フレーム設定 / Frame configuration<br>プロパティ: centerLon・centerLat・centerAlt（number） - 中心座標 / Center position; outerX・outerY・outerZ（number） - 外枠サイズ / Outer frame size; innerX・innerY・innerZ（number） - 内枠サイズ / Inner frame size; frameColor（Cesium.Color） - フレーム色 / Frame color; voxelKey（string） - ボクセルキー / Voxel key |

#### createVoxelBox(config) → {Cesium.Entity}

ボクセルボックスを生成

| 名前 | 型 | 説明 |
|---|---|---|
| config | Object | ボクセル設定 / Voxel configuration<br>プロパティ: centerLon・centerLat・centerAlt（number） - 中心座標 / Center position; cellSizeX・cellSizeY（number） - フットプリント寸法 / Footprint dimensions; boxHeight（number） - ボックス高さ / Box height; color（Cesium.Color） - ボックス色 / Box color; opacity（number） - ボックス透明度 / Box opacity; shouldShowOutline（boolean） - 枠線表示 / Show outline; outlineColor（Cesium.Color） - 枠線色 / Outline color; outlineWidth（number） - 枠線太さ / Outline width; voxelInfo（Object） - ボクセルデータ / Voxel data; voxelKey（string） - ボクセルキー / Voxel key; emulateThick（boolean, optional） - 太線エミュレーション使用 / Use thick outline emulation |

#### createVoxelDescription(voxelInfo, voxelKey) → {string}

ボクセルの説明HTMLを生成

| 名前 | 型 | 説明 |
|---|---|---|
| voxelInfo | Object | Voxel information / ボクセル情報 |
| voxelKey | string | Voxel key / ボクセルキー |

#### getConfiguration() → {Object}

現在の設定を取得

#### getEntityCount() → {number}

エンティティ数を取得

#### renderBoundingBox(bounds)

指定された境界のデバッグ用バウンディングボックスを描画

| 名前 | 型 | 説明 |
|---|---|---|
| bounds | Object | {minLon, maxLon, minLat, maxLat, minAlt, maxAlt} |

#### shouldApplyInsetOutline(isTopN) → {boolean}

インセット枠線を適用すべきかどうかを判定

| 名前 | 型 | 説明 |
|---|---|---|
| isTopN | boolean | Is TopN voxel / TopNボクセルかどうか |

#### updateOptions(newOptions)

描画オプションを更新

| 名前 | 型 | 説明 |
|---|---|---|
| newOptions | Object | New options to merge / マージする新オプション |
