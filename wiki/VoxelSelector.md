# Class: VoxelSelector（VoxelSelectorクラス）

[English](#english) | [日本語](#日本語)

## English

> English translation pending. See Japanese section below.

### Constructor

#### new VoxelSelector(options)

### Methods

#### getLastSelectionStats() → {Object|null}

Get the last selection statistics.

#### selectVoxels(allVoxels, maxCount, context) → {Object}

Select voxels for rendering based on configured strategy.

| Name | Type | Description |
|---|---|---|
| allVoxels | Array | All voxels to select from / 選択元の全ボクセル |
| maxCount | number | Maximum number of voxels to select / 選択する最大ボクセル数 |
| context | Object | Selection context / 選択コンテキスト
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        

        Description
    
    

    
    

        
            
                grid
            

            
            
                
Object


            
            

            
                
                

                

                
                
            

            

            Grid information / グリッド情報
        

    

        
            
                bounds
            

            
            
                
Object


            
            

            
                
                
                    <optional>
                

                

                
                
            

            

            Data bounds / データ境界 | grid | Object |  | Grid information / グリッド情報 | bounds | Object | <optional> | Data bounds / データ境界 |
| grid | Object |  | Grid information / グリッド情報 |
| bounds | Object | <optional> | Data bounds / データ境界 |


## 日本語

VoxelSelector - ボクセル選択戦略の実装
Single Responsibility: ボクセル選択ロジックのみを担当
- 戦略パターンを使用して選択アルゴリズムを切り替え可能
- 純粋関数として設計（Cesium依存なし）
- エラー時は密度ソート選抜にフォールバック

### コンストラクタ

#### new VoxelSelector(options)

### メソッド

#### getLastSelectionStats() → {Object|null}

最後の選択統計を取得。

#### selectVoxels(allVoxels, maxCount, context) → {Object}

設定された戦略に基づいてレンダリング用ボクセルを選択。

| 名前 | 型 | 説明 |
|---|---|---|
| allVoxels | Array | All voxels to select from / 選択元の全ボクセル |
| maxCount | number | Maximum number of voxels to select / 選択する最大ボクセル数 |
| context | Object | Selection context / 選択コンテキスト
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        

        Description
    
    

    
    

        
            
                grid
            

            
            
                
Object


            
            

            
                
                

                

                
                
            

            

            Grid information / グリッド情報
        

    

        
            
                bounds
            

            
            
                
Object


            
            

            
                
                
                    <optional>
                

                

                
                
            

            

            Data bounds / データ境界 | grid | Object |  | Grid information / グリッド情報 | bounds | Object | <optional> | Data bounds / データ境界 |
| grid | Object |  | Grid information / グリッド情報 |
| bounds | Object | <optional> | Data bounds / データ境界 |
