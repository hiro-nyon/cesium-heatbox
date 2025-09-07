# Class: AdaptiveController（AdaptiveControllerクラス）

[English](#english) | [日本語](#日本語)

## English

AdaptiveController - Adaptive control logic for VoxelRenderer
Responsibilities:
ADR-0009 Phase 3: VoxelRenderer responsibility separation

### Constructor

#### new AdaptiveController(options)

### Methods

#### applyPresetLogic(preset, isTopN, normalizedDensity, isDenseArea, baseOptions) → {Object}

Apply preset-specific adaptive logic

| Name | Type | Description |
|---|---|---|
| preset | string | Outline width preset / アウトライン幅プリセット |
| isTopN | boolean | Whether it is TopN voxel / TopNボクセルかどうか |
| normalizedDensity | number | Normalized density [0-1] / 正規化密度 [0-1] |
| isDenseArea | boolean | Whether it is dense area / 密集エリアかどうか |
| baseOptions | Object | Base options for calculation / 計算用基準オプション |

#### calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics, renderOptions) → {Object}

Calculate adaptive parameters for a voxel

| Name | Type | Description |
|---|---|---|
| voxelInfo | Object | Voxel information / ボクセル情報 |
| isTopN | boolean | Whether it is TopN voxel / TopNボクセルかどうか |
| voxelData | Map | All voxel data / 全ボクセルデータ |
| statistics | Object | Statistics information / 統計情報 |
| renderOptions | Object | Rendering options / 描画オプション |

#### calculateNeighborhoodDensity(voxelInfo, voxelData, radiusopt) → {Object}

Calculate neighborhood density around a voxel

| Name | Type | Attributes | Description |
|---|---|---|---|
| voxelInfo | Object |  | Target voxel information / 対象ボクセル情報
                Properties
                


    
    
        
        Name
        

        Type

        

        

        Description
    
    

    
    

        
            
                x
            

            
            
                
number


            
            

            

            

            X coordinate / X座標
        

    

        
            
                y
            

            
            
                
number


            
            

            

            

            Y coordinate / Y座標
        

    

        
            
                z
            

            
            
                
number


            
            

            

            

            Z coordinate / Z座標 | x | number | X coordinate / X座標 | y | number | Y coordinate / Y座標 | z | number | Z coordinate / Z座標 |
| x | number | X coordinate / X座標 |
| y | number | Y coordinate / Y座標 |
| z | number | Z coordinate / Z座標 |
| voxelData | Map |  | All voxel data / 全ボクセルデータ |
| radius | number | <optional> | Search radius override / 探索半径オーバーライド |

#### getConfiguration() → {Object}

Get current adaptive control configuration

#### updateOptions(newOptions)

Update adaptive control options

| Name | Type | Description |
|---|---|---|
| newOptions | Object | New options to merge / マージする新オプション |


## 日本語

適応的制御ロジック - ボクセル描画の適応的制御を担当
- 近傍密度計算 (Neighborhood density calculation)
- プリセット適用ロジック (Preset application logic)
- 適応的パラメータ計算 (Adaptive parameter calculation)
- カメラ距離・重なりリスク調整 (Camera distance & overlap risk adjustment)

### コンストラクタ

#### new AdaptiveController(options)

### メソッド

#### applyPresetLogic(preset, isTopN, normalizedDensity, isDenseArea, baseOptions) → {Object}

プリセット固有の適応ロジックを適用

| 名前 | 型 | 説明 |
|---|---|---|
| preset | string | Outline width preset / アウトライン幅プリセット |
| isTopN | boolean | Whether it is TopN voxel / TopNボクセルかどうか |
| normalizedDensity | number | Normalized density [0-1] / 正規化密度 [0-1] |
| isDenseArea | boolean | Whether it is dense area / 密集エリアかどうか |
| baseOptions | Object | Base options for calculation / 計算用基準オプション |

#### calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics, renderOptions) → {Object}

ボクセルの適応的パラメータを計算

| 名前 | 型 | 説明 |
|---|---|---|
| voxelInfo | Object | Voxel information / ボクセル情報 |
| isTopN | boolean | Whether it is TopN voxel / TopNボクセルかどうか |
| voxelData | Map | All voxel data / 全ボクセルデータ |
| statistics | Object | Statistics information / 統計情報 |
| renderOptions | Object | Rendering options / 描画オプション |

#### calculateNeighborhoodDensity(voxelInfo, voxelData, radiusopt) → {Object}

ボクセル周辺の近傍密度を計算

| 名前 | 型 | 属性 | 説明 |
|---|---|---|---|
| voxelInfo | Object |  | Target voxel information / 対象ボクセル情報
                Properties
                


    
    
        
        Name
        

        Type

        

        

        Description
    
    

    
    

        
            
                x
            

            
            
                
number


            
            

            

            

            X coordinate / X座標
        

    

        
            
                y
            

            
            
                
number


            
            

            

            

            Y coordinate / Y座標
        

    

        
            
                z
            

            
            
                
number


            
            

            

            

            Z coordinate / Z座標 | x | number | X coordinate / X座標 | y | number | Y coordinate / Y座標 | z | number | Z coordinate / Z座標 |
| x | number | X coordinate / X座標 |
| y | number | Y coordinate / Y座標 |
| z | number | Z coordinate / Z座標 |
| voxelData | Map |  | All voxel data / 全ボクセルデータ |
| radius | number | <optional> | Search radius override / 探索半径オーバーライド |

#### getConfiguration() → {Object}

現在の適応制御設定を取得

#### updateOptions(newOptions)

適応制御オプションを更新

| 名前 | 型 | 説明 |
|---|---|---|
| newOptions | Object | New options to merge / マージする新オプション |
