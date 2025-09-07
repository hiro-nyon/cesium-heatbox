# Class: ColorCalculator（ColorCalculatorクラス）

**日本語** | [English](#english)

## English

Color calculator class for voxel rendering.
Handles linear interpolation, color map interpolation, and diverging color schemes.
This class is stateless and provides pure functions for color calculations.
All methods can be used without creating an instance (static methods).

### Constructor

#### new ColorCalculator()

### Methods

#### (static) calculateColor(normalizedDensity, rawValueopt, options) → {Cesium.Color}

- When diverging=true: Always uses diverging color scheme with rawValue, regardless of pivot value
- When divergingPivot > 0: Standard deviation-based normalization around the pivot
- When divergingPivot = 0: Sign-based mapping (negative→blue, positive→red, zero→white)
- This ensures consistent diverging behavior across all pivot values

| Name | Type | Attributes | Default | Description |
|---|---|---|---|---|
| normalizedDensity | number |  |  | Normalized density (0-1) / 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | Raw value for diverging scheme / 生値（二極性配色用） |
| options | Object |  |  | Color calculation options / 色計算オプション
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        
        Default
        

        Description
    
    

    
    

        
            
                minColor
            

            
            
                
Array.<number>


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    [0, 0, 255]
                
                
            

            Min color RGB values / 最小値色のRGB値
        

    

        
            
                maxColor
            

            
            
                
Array.<number>


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    [255, 0, 0]
                
                
            

            Max color RGB values / 最大値色のRGB値
        

    

        
            
                colorMap
            

            
            
                
string


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                
            

            Color map name (viridis\|inferno\|custom) / カラーマップ名
        

    

        
            
                diverging
            

            
            
                
boolean


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    false
                
                
            

            Use diverging color scheme / 二極性配色を使用
        

    

        
            
                divergingPivot
            

            
            
                
number


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    0
                
                
            

            Pivot value for diverging scheme / 二極性配色のピボット値 | minColor | Array.<number> | <optional> | [0, 0, 255] | Min color RGB values / 最小値色のRGB値 | maxColor | Array.<number> | <optional> | [255, 0, 0] | Max color RGB values / 最大値色のRGB値 | colorMap | string | <optional> |  | Color map name (viridis\|inferno\|custom) / カラーマップ名 | diverging | boolean | <optional> | false | Use diverging color scheme / 二極性配色を使用 | divergingPivot | number | <optional> | 0 | Pivot value for diverging scheme / 二極性配色のピボット値 |
| minColor | Array.<number> | <optional> | [0, 0, 255] | Min color RGB values / 最小値色のRGB値 |
| maxColor | Array.<number> | <optional> | [255, 0, 0] | Max color RGB values / 最大値色のRGB値 |
| colorMap | string | <optional> |  | Color map name (viridis\|inferno\|custom) / カラーマップ名 |
| diverging | boolean | <optional> | false | Use diverging color scheme / 二極性配色を使用 |
| divergingPivot | number | <optional> | 0 | Pivot value for diverging scheme / 二極性配色のピボット値 |

#### (static) calculateDivergingColor(rawValue, options) → {Cesium.Color}

When pivot=0: negative values → blue side (0-0.5), positive values → red side (0.5-1), zero → white (0.5)
When pivot>0: standard deviation-based normalization around the pivot

| Name | Type | Description |
|---|---|---|
| rawValue | number | Raw value / 生値 |
| options | Object | Diverging color options / 二極性配色オプション
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        
        Default
        

        Description
    
    

    
    

        
            
                divergingPivot
            

            
            
                
number


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    0
                
                
            

            Pivot value / ピボット値 | divergingPivot | number | <optional> | 0 | Pivot value / ピボット値 |
| divergingPivot | number | <optional> | 0 | Pivot value / ピボット値 |

#### (static) getAvailableColorMaps() → {Array.<string>}

Get available color map names.

#### (static) interpolateFromColorMap(normalizedValue, colorMapName) → {Cesium.Color}

Interpolate color from a predefined color map.

| Name | Type | Description |
|---|---|---|
| normalizedValue | number | Normalized value (0-1) / 正規化された値 (0-1) |
| colorMapName | string | Color map name (viridis\|inferno\|diverging) / カラーマップ名 |

#### (static) interpolateLinear(normalizedValue, minColor, maxColor) → {Cesium.Color}

Linear color interpolation between min and max colors.

| Name | Type | Description |
|---|---|---|
| normalizedValue | number | Normalized value (0-1) / 正規化された値 (0-1) |
| minColor | Array.<number> | Min color RGB values [r, g, b] / 最小色RGB値 |
| maxColor | Array.<number> | Max color RGB values [r, g, b] / 最大色RGB値 |

#### (static) isValidColorMap(colorMapName) → {boolean}

Validate color map exists.

| Name | Type | Description |
|---|---|---|
| colorMapName | string | Color map name to validate / 検証するカラーマップ名 |


## 日本語

ボクセル描画用の色計算クラス。
線形補間、カラーマップ補間、二極性配色を処理する。
このクラスは状態を持たず、色計算のための純粋関数を提供する。
すべてのメソッドはインスタンスを作成せずに使用可能（静的メソッド）。

### コンストラクタ

#### new ColorCalculator()

### メソッド

#### (static) calculateColor(normalizedDensity, rawValueopt, options) → {Cesium.Color}

Diverging Color Behavior / 二極性配色の動作:
二極性配色=true: ピボット値に関わらず常にrawValueを使用して二極性配色
ピボット > 0: ピボット中心の標準偏差ベース正規化
ピボット = 0: 符号ベースマッピング（負→青、正→赤、0→白）
これにより全てのピボット値で一貫した二極性動作を保証

| 名前 | 型 | 属性 | 既定値 | 説明 |
|---|---|---|---|---|
| normalizedDensity | number |  |  | Normalized density (0-1) / 正規化された密度 (0-1) |
| rawValue | number | <optional> | null | Raw value for diverging scheme / 生値（二極性配色用） |
| options | Object |  |  | Color calculation options / 色計算オプション
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        
        Default
        

        Description
    
    

    
    

        
            
                minColor
            

            
            
                
Array.<number>


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    [0, 0, 255]
                
                
            

            Min color RGB values / 最小値色のRGB値
        

    

        
            
                maxColor
            

            
            
                
Array.<number>


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    [255, 0, 0]
                
                
            

            Max color RGB values / 最大値色のRGB値
        

    

        
            
                colorMap
            

            
            
                
string


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                
            

            Color map name (viridis\|inferno\|custom) / カラーマップ名
        

    

        
            
                diverging
            

            
            
                
boolean


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    false
                
                
            

            Use diverging color scheme / 二極性配色を使用
        

    

        
            
                divergingPivot
            

            
            
                
number


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    0
                
                
            

            Pivot value for diverging scheme / 二極性配色のピボット値 | minColor | Array.<number> | <optional> | [0, 0, 255] | Min color RGB values / 最小値色のRGB値 | maxColor | Array.<number> | <optional> | [255, 0, 0] | Max color RGB values / 最大値色のRGB値 | colorMap | string | <optional> |  | Color map name (viridis\|inferno\|custom) / カラーマップ名 | diverging | boolean | <optional> | false | Use diverging color scheme / 二極性配色を使用 | divergingPivot | number | <optional> | 0 | Pivot value for diverging scheme / 二極性配色のピボット値 |
| minColor | Array.<number> | <optional> | [0, 0, 255] | Min color RGB values / 最小値色のRGB値 |
| maxColor | Array.<number> | <optional> | [255, 0, 0] | Max color RGB values / 最大値色のRGB値 |
| colorMap | string | <optional> |  | Color map name (viridis\|inferno\|custom) / カラーマップ名 |
| diverging | boolean | <optional> | false | Use diverging color scheme / 二極性配色を使用 |
| divergingPivot | number | <optional> | 0 | Pivot value for diverging scheme / 二極性配色のピボット値 |

#### (static) calculateDivergingColor(rawValue, options) → {Cesium.Color}

Pivot=0 Handling / Pivot=0時の処理:
Pivot=0時: 負値→青側(0-0.5)、正値→赤側(0.5-1)、0→白(0.5)
Pivot>0時: ピボット中心の標準的な偏差ベース正規化

| 名前 | 型 | 説明 |
|---|---|---|
| rawValue | number | Raw value / 生値 |
| options | Object | Diverging color options / 二極性配色オプション
                Properties
                


    
    
        
        Name
        

        Type

        
        Attributes
        

        
        Default
        

        Description
    
    

    
    

        
            
                divergingPivot
            

            
            
                
number


            
            

            
                
                
                    <optional>
                

                

                
                
            

            
                
                
                    0
                
                
            

            Pivot value / ピボット値 | divergingPivot | number | <optional> | 0 | Pivot value / ピボット値 |
| divergingPivot | number | <optional> | 0 | Pivot value / ピボット値 |

#### (static) getAvailableColorMaps() → {Array.<string>}

利用可能なカラーマップ名を取得。

#### (static) interpolateFromColorMap(normalizedValue, colorMapName) → {Cesium.Color}

定義済みカラーマップから色を補間。

| 名前 | 型 | 説明 |
|---|---|---|
| normalizedValue | number | Normalized value (0-1) / 正規化された値 (0-1) |
| colorMapName | string | Color map name (viridis\|inferno\|diverging) / カラーマップ名 |

#### (static) interpolateLinear(normalizedValue, minColor, maxColor) → {Cesium.Color}

最小色と最大色の間での線形色補間。

| 名前 | 型 | 説明 |
|---|---|---|
| normalizedValue | number | Normalized value (0-1) / 正規化された値 (0-1) |
| minColor | Array.<number> | Min color RGB values [r, g, b] / 最小色RGB値 |
| maxColor | Array.<number> | Max color RGB values [r, g, b] / 最大色RGB値 |

#### (static) isValidColorMap(colorMapName) → {boolean}

カラーマップが存在するかを検証。

| 名前 | 型 | 説明 |
|---|---|---|
| colorMapName | string | Color map name to validate / 検証するカラーマップ名 |
