# Source: core/color/ColorCalculator.js

**日本語** | [English](#english)

## English

See also: [Class: ColorCalculator](ColorCalculator)

```javascript
/**
 * Color calculation and mapping utilities for voxel rendering.
 * ボクセル描画用の色計算・マッピングユーティリティ。
 * 
 * This class implements color interpolation logic extracted from VoxelRenderer
 * as part of the Single Responsibility Principle refactoring (ADR-0009 Phase 1).
 * 
 * @version 0.1.11
 * @author Cesium Heatbox Team
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';

// カラーマップ定義（VoxelRendererから抽出）
// 科学的可視化用の標準カラーマップから簡略化
// Object.freezeで不変性を保証（誤変更防止）
const COLOR_MAPS = Object.freeze({
  // Viridisカラーマップ（10段階、重複削除済み）
  // 紫→青→緑→黄の滑らかなグラデーション
  viridis: Object.freeze([
    [68, 1, 84],     // Dark purple
    [72, 40, 120],   // Purple
    [62, 74, 137],   // Blue-purple  
    [49, 104, 142],  // Blue
    [38, 130, 142],  // Blue-teal
    [31, 158, 137],  // Teal
    [53, 183, 121],  // Green-teal
    [109, 205, 89],  // Green
    [180, 222, 44],  // Yellow-green
    [253, 231, 37]   // Bright yellow
  ]),
  // Infernoカラーマップ（10段階、重複削除済み）
  // 黒→紫→赤→オレンジ→黄の熱マップ風
  inferno: Object.freeze([
    [0, 0, 4],       // Near black
    [31, 12, 72],    // Dark purple
    [85, 15, 109],   // Purple
    [136, 34, 106],  // Red-purple
    [186, 54, 85],   // Red
    [227, 89, 51],   // Orange-red
    [249, 142, 8],   // Orange
    [252, 187, 17],  // Yellow-orange
    [245, 219, 76],  // Yellow
    [252, 255, 164]  // Light yellow
  ]),
  // 二極性配色（blue-white-red、17段階）
  // データの正負を表現するための対称配色
  diverging: Object.freeze([
    [0, 0, 255], [32, 64, 255], [64, 128, 255], [96, 160, 255],
    [128, 192, 255], [160, 224, 255], [192, 240, 255], [224, 248, 255],
    [255, 255, 255], [255, 248, 224], [255, 240, 192], [255, 224, 160],
    [255, 192, 128], [255, 160, 96], [255, 128, 64], [255, 64, 32], [255, 0, 0]
  ])
});

/**
 * Color calculator class for voxel rendering.
 * Handles linear interpolation, color map interpolation, and diverging color schemes.
 * 
 * This class is stateless and provides pure functions for color calculations.
 * All methods can be used without creating an instance (static methods).
 * 
 * ボクセル描画用の色計算クラス。
 * 線形補間、カラーマップ補間、二極性配色を処理する。
 * 
 * このクラスは状態を持たず、色計算のための純粋関数を提供する。
 * すべてのメソッドはインスタンスを作成せずに使用可能（静的メソッド）。
 */
export class ColorCalculator {
  
  /**
   * Calculate color based on normalized density and options.
   * 正規化された密度とオプションに基づいて色を計算。
   * 
   * @param {number} normalizedDensity - Normalized density (0-1) / 正規化された密度 (0-1)
   * @param {number} [rawValue] - Raw value for diverging scheme / 生値（二極性配色用）
   * @param {Object} options - Color calculation options / 色計算オプション
   * @param {Array<number>} [options.minColor=[0, 0, 255]] - Min color RGB values / 最小値色のRGB値
   * @param {Array<number>} [options.maxColor=[255, 0, 0]] - Max color RGB values / 最大値色のRGB値
   * @param {string} [options.colorMap] - Color map name (viridis|inferno|custom) / カラーマップ名
   * @param {boolean} [options.diverging=false] - Use diverging color scheme / 二極性配色を使用
   * @param {number} [options.divergingPivot=0] - Pivot value for diverging scheme / 二極性配色のピボット値
   * 
   * @description Diverging Color Behavior / 二極性配色の動作:
   * - When diverging=true: Always uses diverging color scheme with rawValue, regardless of pivot value
   * - When divergingPivot > 0: Standard deviation-based normalization around the pivot
   * - When divergingPivot = 0: Sign-based mapping (negative→blue, positive→red, zero→white)  
   * - This ensures consistent diverging behavior across all pivot values
   * 
   * 二極性配色=true: ピボット値に関わらず常にrawValueを使用して二極性配色
   * ピボット > 0: ピボット中心の標準偏差ベース正規化
   * ピボット = 0: 符号ベースマッピング（負→青、正→赤、0→白）
   * これにより全てのピボット値で一貫した二極性動作を保証
   * 
   * @returns {Cesium.Color} Calculated color / 計算された色
   */
  static calculateColor(normalizedDensity, rawValue = null, options = {}) {
    try {
      // 入力バリデーション（早期エラー回避）
      if (!Number.isFinite(normalizedDensity)) {
        Logger.warn(`Invalid normalizedDensity: ${normalizedDensity}. Using 0.5 as fallback.`);
        normalizedDensity = 0.5;
      }
      
      // デフォルト値の設定
      const {
        minColor = [0, 0, 255],
        maxColor = [255, 0, 0],
        colorMap,
        diverging = false,
        divergingPivot = 0
      } = options;

      // 二極性配色対応（pivot値に関わらず統一的に処理）
      if (diverging && rawValue !== null) {
        const pivot = typeof divergingPivot === 'number' ? divergingPivot : 0;
        return ColorCalculator.calculateDivergingColor(rawValue, { divergingPivot: pivot });
      }
      
      // カラーマップ対応
      // 'custom'は将来の拡張用予約語（現在は未実装でlinear interpolationにフォールバック）
      if (colorMap && colorMap !== 'custom') {
        return ColorCalculator.interpolateFromColorMap(normalizedDensity, colorMap);
      }
      
      // 従来のmin/max色線形補間（後方互換）
      return ColorCalculator.interpolateLinear(normalizedDensity, minColor, maxColor);
      
    } catch (error) {
      Logger.warn(`Color calculation failed: ${error.message}. Falling back to gray.`);
      // フォールバック: グレー色を返す
      return Cesium.Color.GRAY;
    }
  }
  
  /**
   * Linear color interpolation between min and max colors.
   * 最小色と最大色の間での線形色補間。
   * 
   * @param {number} normalizedValue - Normalized value (0-1) / 正規化された値 (0-1)
   * @param {Array<number>} minColor - Min color RGB values [r, g, b] / 最小色RGB値
   * @param {Array<number>} maxColor - Max color RGB values [r, g, b] / 最大色RGB値
   * @returns {Cesium.Color} Interpolated color / 補間された色
   */
  static interpolateLinear(normalizedValue, minColor, maxColor) {
    // 値をクランプ（0-1の範囲に制限）
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));
    
    const [minR, minG, minB] = minColor;
    const [maxR, maxG, maxB] = maxColor;
    
    const r = Math.round(minR + (maxR - minR) * clampedValue);
    const g = Math.round(minG + (maxG - minG) * clampedValue);
    const b = Math.round(minB + (maxB - minB) * clampedValue);
    
    return Cesium.Color.fromBytes(r, g, b);
  }
  
  /**
   * Interpolate color from a predefined color map.
   * 定義済みカラーマップから色を補間。
   * 
   * @param {number} normalizedValue - Normalized value (0-1) / 正規化された値 (0-1)
   * @param {string} colorMapName - Color map name (viridis|inferno|diverging) / カラーマップ名
   * @returns {Cesium.Color} Interpolated color / 補間された色
   */
  static interpolateFromColorMap(normalizedValue, colorMapName) {
    const colorMap = COLOR_MAPS[colorMapName];
    if (!colorMap) {
      Logger.warn(`Unknown color map: ${colorMapName}. Falling back to linear interpolation.`);
      // フォールバック: デフォルトの線形補間
      return ColorCalculator.interpolateLinear(normalizedValue, [0, 0, 255], [255, 0, 0]);
    }
    
    // 値をクランプ
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));
    
    // マップインデックスを計算
    const scaledValue = clampedValue * (colorMap.length - 1);
    const lowerIndex = Math.floor(scaledValue);
    const upperIndex = Math.min(lowerIndex + 1, colorMap.length - 1);
    const fraction = scaledValue - lowerIndex;
    
    // 線形補間
    const [r1, g1, b1] = colorMap[lowerIndex];
    const [r2, g2, b2] = colorMap[upperIndex];
    
    const r = Math.round(r1 + (r2 - r1) * fraction);
    const g = Math.round(g1 + (g2 - g1) * fraction);
    const b = Math.round(b1 + (b2 - b1) * fraction);
    
    return Cesium.Color.fromBytes(r, g, b);
  }
  
  /**
   * Calculate diverging (blue-white-red) color based on raw value and pivot.
   * 生値とピボットに基づいて二極性配色（blue-white-red）で色を計算。
   * 
   * @param {number} rawValue - Raw value / 生値
   * @param {Object} options - Diverging color options / 二極性配色オプション
   * @param {number} [options.divergingPivot=0] - Pivot value / ピボット値
   * 
   * @description Pivot=0 Handling / Pivot=0時の処理:
   * When pivot=0: negative values → blue side (0-0.5), positive values → red side (0.5-1), zero → white (0.5)
   * When pivot>0: standard deviation-based normalization around the pivot
   * 
   * Pivot=0時: 負値→青側(0-0.5)、正値→赤側(0.5-1)、0→白(0.5)
   * Pivot>0時: ピボット中心の標準的な偏差ベース正規化
   * 
   * @returns {Cesium.Color} Calculated diverging color / 計算された二極性色
   */
  static calculateDivergingColor(rawValue, options = {}) {
    const { divergingPivot = 0 } = options;
    const pivot = divergingPivot;
    
    // ピボットからの偏差を正規化
    let normalizedValue;
    
    if (pivot === 0) {
      // Special handling for pivot=0: use sign-based mapping
      // pivot=0の特別処理: 符号ベースマッピング
      if (rawValue < 0) {
        // 負値: 青い側 (0 to 0.5), より負の値ほど濃い青
        // Use logarithmic scale for better spread: -inf to 0 maps to 0 to 0.5
        normalizedValue = 0.5 * (1 / (1 - rawValue));
        normalizedValue = Math.max(0, Math.min(0.5, normalizedValue));
      } else if (rawValue > 0) {
        // 正値: 赤い側 (0.5 to 1), より正の値ほど濃い赤
        // Use logarithmic scale for better spread: 0 to +inf maps to 0.5 to 1
        normalizedValue = 0.5 + 0.5 * (rawValue / (1 + rawValue));
        normalizedValue = Math.max(0.5, Math.min(1, normalizedValue));
      } else {
        // rawValue === 0: 中央の白
        normalizedValue = 0.5;
      }
    } else {
      // Standard pivot-based normalization for pivot > 0
      // pivot > 0の標準ピボットベース正規化
      if (rawValue <= pivot) {
        // 青い側 (0 to 0.5)
        normalizedValue = 0.5 * (rawValue / pivot);
        normalizedValue = Math.max(0, Math.min(0.5, normalizedValue));
      } else {
        // 赤い側 (0.5 to 1)
        normalizedValue = 0.5 + 0.5 * ((rawValue - pivot) / pivot);
        normalizedValue = Math.max(0.5, Math.min(1, normalizedValue));
      }
    }
    
    return ColorCalculator.interpolateFromColorMap(normalizedValue, 'diverging');
  }
  
  /**
   * Get available color map names.
   * 利用可能なカラーマップ名を取得。
   * 
   * @returns {string[]} Array of color map names / カラーマップ名の配列
   */
  static getAvailableColorMaps() {
    return Object.keys(COLOR_MAPS);
  }
  
  /**
   * Validate color map exists.
   * カラーマップが存在するかを検証。
   * 
   * @param {string} colorMapName - Color map name to validate / 検証するカラーマップ名
   * @returns {boolean} True if color map exists / カラーマップが存在する場合true
   */
  static isValidColorMap(colorMapName) {
    return Object.hasOwn(COLOR_MAPS, colorMapName);
  }
}

```

## 日本語

関連: [ColorCalculatorクラス](ColorCalculator)

```javascript
/**
 * Color calculation and mapping utilities for voxel rendering.
 * ボクセル描画用の色計算・マッピングユーティリティ。
 * 
 * This class implements color interpolation logic extracted from VoxelRenderer
 * as part of the Single Responsibility Principle refactoring (ADR-0009 Phase 1).
 * 
 * @version 0.1.11
 * @author Cesium Heatbox Team
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';

// カラーマップ定義（VoxelRendererから抽出）
// 科学的可視化用の標準カラーマップから簡略化
// Object.freezeで不変性を保証（誤変更防止）
const COLOR_MAPS = Object.freeze({
  // Viridisカラーマップ（10段階、重複削除済み）
  // 紫→青→緑→黄の滑らかなグラデーション
  viridis: Object.freeze([
    [68, 1, 84],     // Dark purple
    [72, 40, 120],   // Purple
    [62, 74, 137],   // Blue-purple  
    [49, 104, 142],  // Blue
    [38, 130, 142],  // Blue-teal
    [31, 158, 137],  // Teal
    [53, 183, 121],  // Green-teal
    [109, 205, 89],  // Green
    [180, 222, 44],  // Yellow-green
    [253, 231, 37]   // Bright yellow
  ]),
  // Infernoカラーマップ（10段階、重複削除済み）
  // 黒→紫→赤→オレンジ→黄の熱マップ風
  inferno: Object.freeze([
    [0, 0, 4],       // Near black
    [31, 12, 72],    // Dark purple
    [85, 15, 109],   // Purple
    [136, 34, 106],  // Red-purple
    [186, 54, 85],   // Red
    [227, 89, 51],   // Orange-red
    [249, 142, 8],   // Orange
    [252, 187, 17],  // Yellow-orange
    [245, 219, 76],  // Yellow
    [252, 255, 164]  // Light yellow
  ]),
  // 二極性配色（blue-white-red、17段階）
  // データの正負を表現するための対称配色
  diverging: Object.freeze([
    [0, 0, 255], [32, 64, 255], [64, 128, 255], [96, 160, 255],
    [128, 192, 255], [160, 224, 255], [192, 240, 255], [224, 248, 255],
    [255, 255, 255], [255, 248, 224], [255, 240, 192], [255, 224, 160],
    [255, 192, 128], [255, 160, 96], [255, 128, 64], [255, 64, 32], [255, 0, 0]
  ])
});

/**
 * Color calculator class for voxel rendering.
 * Handles linear interpolation, color map interpolation, and diverging color schemes.
 * 
 * This class is stateless and provides pure functions for color calculations.
 * All methods can be used without creating an instance (static methods).
 * 
 * ボクセル描画用の色計算クラス。
 * 線形補間、カラーマップ補間、二極性配色を処理する。
 * 
 * このクラスは状態を持たず、色計算のための純粋関数を提供する。
 * すべてのメソッドはインスタンスを作成せずに使用可能（静的メソッド）。
 */
export class ColorCalculator {
  
  /**
   * Calculate color based on normalized density and options.
   * 正規化された密度とオプションに基づいて色を計算。
   * 
   * @param {number} normalizedDensity - Normalized density (0-1) / 正規化された密度 (0-1)
   * @param {number} [rawValue] - Raw value for diverging scheme / 生値（二極性配色用）
   * @param {Object} options - Color calculation options / 色計算オプション
   * @param {Array<number>} [options.minColor=[0, 0, 255]] - Min color RGB values / 最小値色のRGB値
   * @param {Array<number>} [options.maxColor=[255, 0, 0]] - Max color RGB values / 最大値色のRGB値
   * @param {string} [options.colorMap] - Color map name (viridis|inferno|custom) / カラーマップ名
   * @param {boolean} [options.diverging=false] - Use diverging color scheme / 二極性配色を使用
   * @param {number} [options.divergingPivot=0] - Pivot value for diverging scheme / 二極性配色のピボット値
   * 
   * @description Diverging Color Behavior / 二極性配色の動作:
   * - When diverging=true: Always uses diverging color scheme with rawValue, regardless of pivot value
   * - When divergingPivot > 0: Standard deviation-based normalization around the pivot
   * - When divergingPivot = 0: Sign-based mapping (negative→blue, positive→red, zero→white)  
   * - This ensures consistent diverging behavior across all pivot values
   * 
   * 二極性配色=true: ピボット値に関わらず常にrawValueを使用して二極性配色
   * ピボット > 0: ピボット中心の標準偏差ベース正規化
   * ピボット = 0: 符号ベースマッピング（負→青、正→赤、0→白）
   * これにより全てのピボット値で一貫した二極性動作を保証
   * 
   * @returns {Cesium.Color} Calculated color / 計算された色
   */
  static calculateColor(normalizedDensity, rawValue = null, options = {}) {
    try {
      // 入力バリデーション（早期エラー回避）
      if (!Number.isFinite(normalizedDensity)) {
        Logger.warn(`Invalid normalizedDensity: ${normalizedDensity}. Using 0.5 as fallback.`);
        normalizedDensity = 0.5;
      }
      
      // デフォルト値の設定
      const {
        minColor = [0, 0, 255],
        maxColor = [255, 0, 0],
        colorMap,
        diverging = false,
        divergingPivot = 0
      } = options;

      // 二極性配色対応（pivot値に関わらず統一的に処理）
      if (diverging && rawValue !== null) {
        const pivot = typeof divergingPivot === 'number' ? divergingPivot : 0;
        return ColorCalculator.calculateDivergingColor(rawValue, { divergingPivot: pivot });
      }
      
      // カラーマップ対応
      // 'custom'は将来の拡張用予約語（現在は未実装でlinear interpolationにフォールバック）
      if (colorMap && colorMap !== 'custom') {
        return ColorCalculator.interpolateFromColorMap(normalizedDensity, colorMap);
      }
      
      // 従来のmin/max色線形補間（後方互換）
      return ColorCalculator.interpolateLinear(normalizedDensity, minColor, maxColor);
      
    } catch (error) {
      Logger.warn(`Color calculation failed: ${error.message}. Falling back to gray.`);
      // フォールバック: グレー色を返す
      return Cesium.Color.GRAY;
    }
  }
  
  /**
   * Linear color interpolation between min and max colors.
   * 最小色と最大色の間での線形色補間。
   * 
   * @param {number} normalizedValue - Normalized value (0-1) / 正規化された値 (0-1)
   * @param {Array<number>} minColor - Min color RGB values [r, g, b] / 最小色RGB値
   * @param {Array<number>} maxColor - Max color RGB values [r, g, b] / 最大色RGB値
   * @returns {Cesium.Color} Interpolated color / 補間された色
   */
  static interpolateLinear(normalizedValue, minColor, maxColor) {
    // 値をクランプ（0-1の範囲に制限）
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));
    
    const [minR, minG, minB] = minColor;
    const [maxR, maxG, maxB] = maxColor;
    
    const r = Math.round(minR + (maxR - minR) * clampedValue);
    const g = Math.round(minG + (maxG - minG) * clampedValue);
    const b = Math.round(minB + (maxB - minB) * clampedValue);
    
    return Cesium.Color.fromBytes(r, g, b);
  }
  
  /**
   * Interpolate color from a predefined color map.
   * 定義済みカラーマップから色を補間。
   * 
   * @param {number} normalizedValue - Normalized value (0-1) / 正規化された値 (0-1)
   * @param {string} colorMapName - Color map name (viridis|inferno|diverging) / カラーマップ名
   * @returns {Cesium.Color} Interpolated color / 補間された色
   */
  static interpolateFromColorMap(normalizedValue, colorMapName) {
    const colorMap = COLOR_MAPS[colorMapName];
    if (!colorMap) {
      Logger.warn(`Unknown color map: ${colorMapName}. Falling back to linear interpolation.`);
      // フォールバック: デフォルトの線形補間
      return ColorCalculator.interpolateLinear(normalizedValue, [0, 0, 255], [255, 0, 0]);
    }
    
    // 値をクランプ
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));
    
    // マップインデックスを計算
    const scaledValue = clampedValue * (colorMap.length - 1);
    const lowerIndex = Math.floor(scaledValue);
    const upperIndex = Math.min(lowerIndex + 1, colorMap.length - 1);
    const fraction = scaledValue - lowerIndex;
    
    // 線形補間
    const [r1, g1, b1] = colorMap[lowerIndex];
    const [r2, g2, b2] = colorMap[upperIndex];
    
    const r = Math.round(r1 + (r2 - r1) * fraction);
    const g = Math.round(g1 + (g2 - g1) * fraction);
    const b = Math.round(b1 + (b2 - b1) * fraction);
    
    return Cesium.Color.fromBytes(r, g, b);
  }
  
  /**
   * Calculate diverging (blue-white-red) color based on raw value and pivot.
   * 生値とピボットに基づいて二極性配色（blue-white-red）で色を計算。
   * 
   * @param {number} rawValue - Raw value / 生値
   * @param {Object} options - Diverging color options / 二極性配色オプション
   * @param {number} [options.divergingPivot=0] - Pivot value / ピボット値
   * 
   * @description Pivot=0 Handling / Pivot=0時の処理:
   * When pivot=0: negative values → blue side (0-0.5), positive values → red side (0.5-1), zero → white (0.5)
   * When pivot>0: standard deviation-based normalization around the pivot
   * 
   * Pivot=0時: 負値→青側(0-0.5)、正値→赤側(0.5-1)、0→白(0.5)
   * Pivot>0時: ピボット中心の標準的な偏差ベース正規化
   * 
   * @returns {Cesium.Color} Calculated diverging color / 計算された二極性色
   */
  static calculateDivergingColor(rawValue, options = {}) {
    const { divergingPivot = 0 } = options;
    const pivot = divergingPivot;
    
    // ピボットからの偏差を正規化
    let normalizedValue;
    
    if (pivot === 0) {
      // Special handling for pivot=0: use sign-based mapping
      // pivot=0の特別処理: 符号ベースマッピング
      if (rawValue < 0) {
        // 負値: 青い側 (0 to 0.5), より負の値ほど濃い青
        // Use logarithmic scale for better spread: -inf to 0 maps to 0 to 0.5
        normalizedValue = 0.5 * (1 / (1 - rawValue));
        normalizedValue = Math.max(0, Math.min(0.5, normalizedValue));
      } else if (rawValue > 0) {
        // 正値: 赤い側 (0.5 to 1), より正の値ほど濃い赤
        // Use logarithmic scale for better spread: 0 to +inf maps to 0.5 to 1
        normalizedValue = 0.5 + 0.5 * (rawValue / (1 + rawValue));
        normalizedValue = Math.max(0.5, Math.min(1, normalizedValue));
      } else {
        // rawValue === 0: 中央の白
        normalizedValue = 0.5;
      }
    } else {
      // Standard pivot-based normalization for pivot > 0
      // pivot > 0の標準ピボットベース正規化
      if (rawValue <= pivot) {
        // 青い側 (0 to 0.5)
        normalizedValue = 0.5 * (rawValue / pivot);
        normalizedValue = Math.max(0, Math.min(0.5, normalizedValue));
      } else {
        // 赤い側 (0.5 to 1)
        normalizedValue = 0.5 + 0.5 * ((rawValue - pivot) / pivot);
        normalizedValue = Math.max(0.5, Math.min(1, normalizedValue));
      }
    }
    
    return ColorCalculator.interpolateFromColorMap(normalizedValue, 'diverging');
  }
  
  /**
   * Get available color map names.
   * 利用可能なカラーマップ名を取得。
   * 
   * @returns {string[]} Array of color map names / カラーマップ名の配列
   */
  static getAvailableColorMaps() {
    return Object.keys(COLOR_MAPS);
  }
  
  /**
   * Validate color map exists.
   * カラーマップが存在するかを検証。
   * 
   * @param {string} colorMapName - Color map name to validate / 検証するカラーマップ名
   * @returns {boolean} True if color map exists / カラーマップが存在する場合true
   */
  static isValidColorMap(colorMapName) {
    return Object.hasOwn(COLOR_MAPS, colorMapName);
  }
}

```
