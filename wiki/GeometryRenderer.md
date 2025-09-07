# Class: GeometryRenderer（GeometryRendererクラス）

**日本語** | [English](#english)

## English

GeometryRenderer - 3D geometry rendering for VoxelRenderer
Responsibilities:
ADR-0009 Phase 4: VoxelRenderer responsibility separation

### Constructor

#### new GeometryRenderer(viewer, options)

### Methods

#### clear()

Clear all managed entities

#### createEdgePolylines(config) → {Array.<Cesium.Entity>}

Create edge polylines for thick outline emulation

| Name | Type | Description |
|---|---|---|
| config | Object | Edge polyline configuration / エッジポリライン設定
                Properties
                


    
    
        
        Name
        

        Type

        

        

        Description
    
    

    
    

        
            
                centerLon
            

            
            
                
number


            
            

            

            

            Center longitude / 中心経度
        

    

        
            
                centerLat
            

            
            
                
number


            
            

            

            

            Center latitude / 中心緯度
        

    

        
            
                centerAlt
            

            
            
                
number


            
            

            

            

            Center altitude / 中心高度
        

    

        
            
                cellSizeX
            

            
            
                
number


            
            

            

            

            X dimension / X寸法
        

    

        
            
                cellSizeY
            

            
            
                
number


            
            

            

            

            Y dimension / Y寸法
        

    

        
            
                boxHeight
            

            
            
                
number


            
            

            

            

            Box height / ボックス高さ
        

    

        
            
                outlineColor
            

            
            
                
Cesium.Color


            
            

            

            

            Outline color / 枠線色
        

    

        
            
                outlineWidth
            

            
            
                
number


            
            

            

            

            Outline width / 枠線太さ
        

    

        
            
                voxelKey
            

            
            
                
string


            
            

            

            

            Voxel key / ボクセルキー | centerLon | number | Center longitude / 中心経度 | centerLat | number | Center latitude / 中心緯度 | centerAlt | number | Center altitude / 中心高度 | cellSizeX | number | X dimension / X寸法 | cellSizeY | number | Y dimension / Y寸法 | boxHeight | number | Box height / ボックス高さ | outlineColor | Cesium.Color | Outline color / 枠線色 | outlineWidth | number | Outline width / 枠線太さ | voxelKey | string | Voxel key / ボクセルキー |
| centerLon | number | Center longitude / 中心経度 |
| centerLat | number | Center latitude / 中心緯度 |
| centerAlt | number | Center altitude / 中心高度 |
| cellSizeX | number | X dimension / X寸法 |
| cellSizeY | number | Y dimension / Y寸法 |
| boxHeight | number | Box height / ボックス高さ |
| outlineColor | Cesium.Color | Outline color / 枠線色 |
| outlineWidth | number | Outline width / 枠線太さ |
| voxelKey | string | Voxel key / ボクセルキー |

#### createInsetOutline(config) → {Cesium.Entity}

Create inset outline for a voxel

| Name | Type | Description |
|---|---|---|
| config | Object | Inset outline configuration / インセット枠線設定
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        

        Description
    
    

    
    

        
            
                centerLon
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center longitude / 中心経度
        

    

        
            
                centerLat
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center latitude / 中心緯度
        

    

        
            
                centerAlt
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center altitude / 中心高度
        

    

        
            
                baseSizeX
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Base X size / ベースX寸法
        

    

        
            
                baseSizeY
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Base Y size / ベースY寸法
        

    

        
            
                baseSizeZ
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Base Z size / ベースZ寸法
        

    

        
            
                outlineColor
            

            
            
                
Cesium.Color


            
            

            
                
                

                

                
                
            

            

            Outline color / 枠線色
        

    

        
            
                outlineWidth
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Outline width / 枠線太さ
        

    

        
            
                voxelKey
            

            
            
                
string


            
            

            
                
                

                

                
                
            

            

            Voxel key / ボクセルキー
        

    

        
            
                insetAmount
            

            
            
                
number


            
            

            
                
                
                    <optional>
                

                

                
                
            

            

            Custom inset amount / カスタムインセット量 | centerLon | number |  | Center longitude / 中心経度 | centerLat | number |  | Center latitude / 中心緯度 | centerAlt | number |  | Center altitude / 中心高度 | baseSizeX | number |  | Base X size / ベースX寸法 | baseSizeY | number |  | Base Y size / ベースY寸法 | baseSizeZ | number |  | Base Z size / ベースZ寸法 | outlineColor | Cesium.Color |  | Outline color / 枠線色 | outlineWidth | number |  | Outline width / 枠線太さ | voxelKey | string |  | Voxel key / ボクセルキー | insetAmount | number | <optional> | Custom inset amount / カスタムインセット量 |
| centerLon | number |  | Center longitude / 中心経度 |
| centerLat | number |  | Center latitude / 中心緯度 |
| centerAlt | number |  | Center altitude / 中心高度 |
| baseSizeX | number |  | Base X size / ベースX寸法 |
| baseSizeY | number |  | Base Y size / ベースY寸法 |
| baseSizeZ | number |  | Base Z size / ベースZ寸法 |
| outlineColor | Cesium.Color |  | Outline color / 枠線色 |
| outlineWidth | number |  | Outline width / 枠線太さ |
| voxelKey | string |  | Voxel key / ボクセルキー |
| insetAmount | number | <optional> | Custom inset amount / カスタムインセット量 |

#### createThickOutlineFrames(config) → {Array.<Cesium.Entity>}

Create thick outline frame structures

| Name | Type | Description |
|---|---|---|
| config | Object | Frame configuration / フレーム設定
                Properties
                


    
    
        
        Name
        

        Type

        

        

        Description
    
    

    
    

        
            
                centerLon
            

            
            
                
number


            
            

            

            

            Center longitude / 中心経度
        

    

        
            
                centerLat
            

            
            
                
number


            
            

            

            

            Center latitude / 中心緯度
        

    

        
            
                centerAlt
            

            
            
                
number


            
            

            

            

            Center altitude / 中心高度
        

    

        
            
                outerX
            

            
            
                
number


            
            

            

            

            Outer X size / 外側Xサイズ
        

    

        
            
                outerY
            

            
            
                
number


            
            

            

            

            Outer Y size / 外側Yサイズ
        

    

        
            
                outerZ
            

            
            
                
number


            
            

            

            

            Outer Z size / 外側Zサイズ
        

    

        
            
                innerX
            

            
            
                
number


            
            

            

            

            Inner X size / 内側Xサイズ
        

    

        
            
                innerY
            

            
            
                
number


            
            

            

            

            Inner Y size / 内側Yサイズ
        

    

        
            
                innerZ
            

            
            
                
number


            
            

            

            

            Inner Z size / 内側Zサイズ
        

    

        
            
                frameColor
            

            
            
                
Cesium.Color


            
            

            

            

            Frame color / フレーム色
        

    

        
            
                voxelKey
            

            
            
                
string


            
            

            

            

            Voxel key / ボクセルキー | centerLon | number | Center longitude / 中心経度 | centerLat | number | Center latitude / 中心緯度 | centerAlt | number | Center altitude / 中心高度 | outerX | number | Outer X size / 外側Xサイズ | outerY | number | Outer Y size / 外側Yサイズ | outerZ | number | Outer Z size / 外側Zサイズ | innerX | number | Inner X size / 内側Xサイズ | innerY | number | Inner Y size / 内側Yサイズ | innerZ | number | Inner Z size / 内側Zサイズ | frameColor | Cesium.Color | Frame color / フレーム色 | voxelKey | string | Voxel key / ボクセルキー |
| centerLon | number | Center longitude / 中心経度 |
| centerLat | number | Center latitude / 中心緯度 |
| centerAlt | number | Center altitude / 中心高度 |
| outerX | number | Outer X size / 外側Xサイズ |
| outerY | number | Outer Y size / 外側Yサイズ |
| outerZ | number | Outer Z size / 外側Zサイズ |
| innerX | number | Inner X size / 内側Xサイズ |
| innerY | number | Inner Y size / 内側Yサイズ |
| innerZ | number | Inner Z size / 内側Zサイズ |
| frameColor | Cesium.Color | Frame color / フレーム色 |
| voxelKey | string | Voxel key / ボクセルキー |

#### createVoxelBox(config) → {Cesium.Entity}

Create a voxel box entity

| Name | Type | Description |
|---|---|---|
| config | Object | Voxel configuration / ボクセル設定
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        

        Description
    
    

    
    

        
            
                centerLon
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center longitude / 中心経度
        

    

        
            
                centerLat
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center latitude / 中心緯度
        

    

        
            
                centerAlt
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center altitude / 中心高度
        

    

        
            
                cellSizeX
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            X dimension / X寸法
        

    

        
            
                cellSizeY
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Y dimension / Y寸法
        

    

        
            
                boxHeight
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Box height / ボックス高さ
        

    

        
            
                color
            

            
            
                
Cesium.Color


            
            

            
                
                

                

                
                
            

            

            Box color / ボックス色
        

    

        
            
                opacity
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Box opacity / ボックス透明度
        

    

        
            
                shouldShowOutline
            

            
            
                
boolean


            
            

            
                
                

                

                
                
            

            

            Show outline / 枠線表示
        

    

        
            
                outlineColor
            

            
            
                
Cesium.Color


            
            

            
                
                

                

                
                
            

            

            Outline color / 枠線色
        

    

        
            
                outlineWidth
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Outline width / 枠線太さ
        

    

        
            
                voxelInfo
            

            
            
                
Object


            
            

            
                
                

                

                
                
            

            

            Voxel data / ボクセルデータ
        

    

        
            
                voxelKey
            

            
            
                
string


            
            

            
                
                

                

                
                
            

            

            Voxel key / ボクセルキー
        

    

        
            
                emulateThick
            

            
            
                
boolean


            
            

            
                
                
                    <optional>
                

                

                
                
            

            

            Use thick outline emulation / 太線エミュレーション使用 | centerLon | number |  | Center longitude / 中心経度 | centerLat | number |  | Center latitude / 中心緯度 | centerAlt | number |  | Center altitude / 中心高度 | cellSizeX | number |  | X dimension / X寸法 | cellSizeY | number |  | Y dimension / Y寸法 | boxHeight | number |  | Box height / ボックス高さ | color | Cesium.Color |  | Box color / ボックス色 | opacity | number |  | Box opacity / ボックス透明度 | shouldShowOutline | boolean |  | Show outline / 枠線表示 | outlineColor | Cesium.Color |  | Outline color / 枠線色 | outlineWidth | number |  | Outline width / 枠線太さ | voxelInfo | Object |  | Voxel data / ボクセルデータ | voxelKey | string |  | Voxel key / ボクセルキー | emulateThick | boolean | <optional> | Use thick outline emulation / 太線エミュレーション使用 |
| centerLon | number |  | Center longitude / 中心経度 |
| centerLat | number |  | Center latitude / 中心緯度 |
| centerAlt | number |  | Center altitude / 中心高度 |
| cellSizeX | number |  | X dimension / X寸法 |
| cellSizeY | number |  | Y dimension / Y寸法 |
| boxHeight | number |  | Box height / ボックス高さ |
| color | Cesium.Color |  | Box color / ボックス色 |
| opacity | number |  | Box opacity / ボックス透明度 |
| shouldShowOutline | boolean |  | Show outline / 枠線表示 |
| outlineColor | Cesium.Color |  | Outline color / 枠線色 |
| outlineWidth | number |  | Outline width / 枠線太さ |
| voxelInfo | Object |  | Voxel data / ボクセルデータ |
| voxelKey | string |  | Voxel key / ボクセルキー |
| emulateThick | boolean | <optional> | Use thick outline emulation / 太線エミュレーション使用 |

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

ジオメトリレンダラー - ボクセル描画のための3Dジオメトリ描画
- ボクセルボックス描画 (Voxel box rendering)
- インセット枠線描画 (Inset outline rendering)
- エッジポリライン描画 (Edge polyline rendering)
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
| config | Object | Edge polyline configuration / エッジポリライン設定
                Properties
                


    
    
        
        Name
        

        Type

        

        

        Description
    
    

    
    

        
            
                centerLon
            

            
            
                
number


            
            

            

            

            Center longitude / 中心経度
        

    

        
            
                centerLat
            

            
            
                
number


            
            

            

            

            Center latitude / 中心緯度
        

    

        
            
                centerAlt
            

            
            
                
number


            
            

            

            

            Center altitude / 中心高度
        

    

        
            
                cellSizeX
            

            
            
                
number


            
            

            

            

            X dimension / X寸法
        

    

        
            
                cellSizeY
            

            
            
                
number


            
            

            

            

            Y dimension / Y寸法
        

    

        
            
                boxHeight
            

            
            
                
number


            
            

            

            

            Box height / ボックス高さ
        

    

        
            
                outlineColor
            

            
            
                
Cesium.Color


            
            

            

            

            Outline color / 枠線色
        

    

        
            
                outlineWidth
            

            
            
                
number


            
            

            

            

            Outline width / 枠線太さ
        

    

        
            
                voxelKey
            

            
            
                
string


            
            

            

            

            Voxel key / ボクセルキー | centerLon | number | Center longitude / 中心経度 | centerLat | number | Center latitude / 中心緯度 | centerAlt | number | Center altitude / 中心高度 | cellSizeX | number | X dimension / X寸法 | cellSizeY | number | Y dimension / Y寸法 | boxHeight | number | Box height / ボックス高さ | outlineColor | Cesium.Color | Outline color / 枠線色 | outlineWidth | number | Outline width / 枠線太さ | voxelKey | string | Voxel key / ボクセルキー |
| centerLon | number | Center longitude / 中心経度 |
| centerLat | number | Center latitude / 中心緯度 |
| centerAlt | number | Center altitude / 中心高度 |
| cellSizeX | number | X dimension / X寸法 |
| cellSizeY | number | Y dimension / Y寸法 |
| boxHeight | number | Box height / ボックス高さ |
| outlineColor | Cesium.Color | Outline color / 枠線色 |
| outlineWidth | number | Outline width / 枠線太さ |
| voxelKey | string | Voxel key / ボクセルキー |

#### createInsetOutline(config) → {Cesium.Entity}

ボクセルのインセット枠線を作成

| 名前 | 型 | 説明 |
|---|---|---|
| config | Object | Inset outline configuration / インセット枠線設定
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        

        Description
    
    

    
    

        
            
                centerLon
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center longitude / 中心経度
        

    

        
            
                centerLat
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center latitude / 中心緯度
        

    

        
            
                centerAlt
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center altitude / 中心高度
        

    

        
            
                baseSizeX
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Base X size / ベースX寸法
        

    

        
            
                baseSizeY
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Base Y size / ベースY寸法
        

    

        
            
                baseSizeZ
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Base Z size / ベースZ寸法
        

    

        
            
                outlineColor
            

            
            
                
Cesium.Color


            
            

            
                
                

                

                
                
            

            

            Outline color / 枠線色
        

    

        
            
                outlineWidth
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Outline width / 枠線太さ
        

    

        
            
                voxelKey
            

            
            
                
string


            
            

            
                
                

                

                
                
            

            

            Voxel key / ボクセルキー
        

    

        
            
                insetAmount
            

            
            
                
number


            
            

            
                
                
                    <optional>
                

                

                
                
            

            

            Custom inset amount / カスタムインセット量 | centerLon | number |  | Center longitude / 中心経度 | centerLat | number |  | Center latitude / 中心緯度 | centerAlt | number |  | Center altitude / 中心高度 | baseSizeX | number |  | Base X size / ベースX寸法 | baseSizeY | number |  | Base Y size / ベースY寸法 | baseSizeZ | number |  | Base Z size / ベースZ寸法 | outlineColor | Cesium.Color |  | Outline color / 枠線色 | outlineWidth | number |  | Outline width / 枠線太さ | voxelKey | string |  | Voxel key / ボクセルキー | insetAmount | number | <optional> | Custom inset amount / カスタムインセット量 |
| centerLon | number |  | Center longitude / 中心経度 |
| centerLat | number |  | Center latitude / 中心緯度 |
| centerAlt | number |  | Center altitude / 中心高度 |
| baseSizeX | number |  | Base X size / ベースX寸法 |
| baseSizeY | number |  | Base Y size / ベースY寸法 |
| baseSizeZ | number |  | Base Z size / ベースZ寸法 |
| outlineColor | Cesium.Color |  | Outline color / 枠線色 |
| outlineWidth | number |  | Outline width / 枠線太さ |
| voxelKey | string |  | Voxel key / ボクセルキー |
| insetAmount | number | <optional> | Custom inset amount / カスタムインセット量 |

#### createThickOutlineFrames(config) → {Array.<Cesium.Entity>}

枠線の厚み部分を視覚化するフレーム構造を作成

| 名前 | 型 | 説明 |
|---|---|---|
| config | Object | Frame configuration / フレーム設定
                Properties
                


    
    
        
        Name
        

        Type

        

        

        Description
    
    

    
    

        
            
                centerLon
            

            
            
                
number


            
            

            

            

            Center longitude / 中心経度
        

    

        
            
                centerLat
            

            
            
                
number


            
            

            

            

            Center latitude / 中心緯度
        

    

        
            
                centerAlt
            

            
            
                
number


            
            

            

            

            Center altitude / 中心高度
        

    

        
            
                outerX
            

            
            
                
number


            
            

            

            

            Outer X size / 外側Xサイズ
        

    

        
            
                outerY
            

            
            
                
number


            
            

            

            

            Outer Y size / 外側Yサイズ
        

    

        
            
                outerZ
            

            
            
                
number


            
            

            

            

            Outer Z size / 外側Zサイズ
        

    

        
            
                innerX
            

            
            
                
number


            
            

            

            

            Inner X size / 内側Xサイズ
        

    

        
            
                innerY
            

            
            
                
number


            
            

            

            

            Inner Y size / 内側Yサイズ
        

    

        
            
                innerZ
            

            
            
                
number


            
            

            

            

            Inner Z size / 内側Zサイズ
        

    

        
            
                frameColor
            

            
            
                
Cesium.Color


            
            

            

            

            Frame color / フレーム色
        

    

        
            
                voxelKey
            

            
            
                
string


            
            

            

            

            Voxel key / ボクセルキー | centerLon | number | Center longitude / 中心経度 | centerLat | number | Center latitude / 中心緯度 | centerAlt | number | Center altitude / 中心高度 | outerX | number | Outer X size / 外側Xサイズ | outerY | number | Outer Y size / 外側Yサイズ | outerZ | number | Outer Z size / 外側Zサイズ | innerX | number | Inner X size / 内側Xサイズ | innerY | number | Inner Y size / 内側Yサイズ | innerZ | number | Inner Z size / 内側Zサイズ | frameColor | Cesium.Color | Frame color / フレーム色 | voxelKey | string | Voxel key / ボクセルキー |
| centerLon | number | Center longitude / 中心経度 |
| centerLat | number | Center latitude / 中心緯度 |
| centerAlt | number | Center altitude / 中心高度 |
| outerX | number | Outer X size / 外側Xサイズ |
| outerY | number | Outer Y size / 外側Yサイズ |
| outerZ | number | Outer Z size / 外側Zサイズ |
| innerX | number | Inner X size / 内側Xサイズ |
| innerY | number | Inner Y size / 内側Yサイズ |
| innerZ | number | Inner Z size / 内側Zサイズ |
| frameColor | Cesium.Color | Frame color / フレーム色 |
| voxelKey | string | Voxel key / ボクセルキー |

#### createVoxelBox(config) → {Cesium.Entity}

ボクセルボックスエンティティを作成

| 名前 | 型 | 説明 |
|---|---|---|
| config | Object | Voxel configuration / ボクセル設定
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        

        Description
    
    

    
    

        
            
                centerLon
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center longitude / 中心経度
        

    

        
            
                centerLat
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center latitude / 中心緯度
        

    

        
            
                centerAlt
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Center altitude / 中心高度
        

    

        
            
                cellSizeX
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            X dimension / X寸法
        

    

        
            
                cellSizeY
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Y dimension / Y寸法
        

    

        
            
                boxHeight
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Box height / ボックス高さ
        

    

        
            
                color
            

            
            
                
Cesium.Color


            
            

            
                
                

                

                
                
            

            

            Box color / ボックス色
        

    

        
            
                opacity
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Box opacity / ボックス透明度
        

    

        
            
                shouldShowOutline
            

            
            
                
boolean


            
            

            
                
                

                

                
                
            

            

            Show outline / 枠線表示
        

    

        
            
                outlineColor
            

            
            
                
Cesium.Color


            
            

            
                
                

                

                
                
            

            

            Outline color / 枠線色
        

    

        
            
                outlineWidth
            

            
            
                
number


            
            

            
                
                

                

                
                
            

            

            Outline width / 枠線太さ
        

    

        
            
                voxelInfo
            

            
            
                
Object


            
            

            
                
                

                

                
                
            

            

            Voxel data / ボクセルデータ
        

    

        
            
                voxelKey
            

            
            
                
string


            
            

            
                
                

                

                
                
            

            

            Voxel key / ボクセルキー
        

    

        
            
                emulateThick
            

            
            
                
boolean


            
            

            
                
                
                    <optional>
                

                

                
                
            

            

            Use thick outline emulation / 太線エミュレーション使用 | centerLon | number |  | Center longitude / 中心経度 | centerLat | number |  | Center latitude / 中心緯度 | centerAlt | number |  | Center altitude / 中心高度 | cellSizeX | number |  | X dimension / X寸法 | cellSizeY | number |  | Y dimension / Y寸法 | boxHeight | number |  | Box height / ボックス高さ | color | Cesium.Color |  | Box color / ボックス色 | opacity | number |  | Box opacity / ボックス透明度 | shouldShowOutline | boolean |  | Show outline / 枠線表示 | outlineColor | Cesium.Color |  | Outline color / 枠線色 | outlineWidth | number |  | Outline width / 枠線太さ | voxelInfo | Object |  | Voxel data / ボクセルデータ | voxelKey | string |  | Voxel key / ボクセルキー | emulateThick | boolean | <optional> | Use thick outline emulation / 太線エミュレーション使用 |
| centerLon | number |  | Center longitude / 中心経度 |
| centerLat | number |  | Center latitude / 中心緯度 |
| centerAlt | number |  | Center altitude / 中心高度 |
| cellSizeX | number |  | X dimension / X寸法 |
| cellSizeY | number |  | Y dimension / Y寸法 |
| boxHeight | number |  | Box height / ボックス高さ |
| color | Cesium.Color |  | Box color / ボックス色 |
| opacity | number |  | Box opacity / ボックス透明度 |
| shouldShowOutline | boolean |  | Show outline / 枠線表示 |
| outlineColor | Cesium.Color |  | Outline color / 枠線色 |
| outlineWidth | number |  | Outline width / 枠線太さ |
| voxelInfo | Object |  | Voxel data / ボクセルデータ |
| voxelKey | string |  | Voxel key / ボクセルキー |
| emulateThick | boolean | <optional> | Use thick outline emulation / 太線エミュレーション使用 |

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
