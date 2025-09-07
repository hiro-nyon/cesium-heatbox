/**
 * Color calculation and mapping utilities for voxel rendering.
 * ボクセル描画用の色計算・マッピングユーティリティ。
 * 
 * This class implements color interpolation logic extracted from VoxelRenderer
 * as part of the Single Responsibility Principle refactoring (ADR-0009 Phase 1).
 * 
 * @version 0.1.11-alpha
 * @author Cesium Heatbox Team
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';

// カラーマップ定義（VoxelRendererから抽出）
const COLOR_MAPS = {
  // Viridisカラーマップ（簡略化した16段階）
  viridis: [
    [68, 1, 84], [71, 44, 122], [59, 81, 139], [44, 113, 142],
    [33, 144, 141], [39, 173, 129], [92, 200, 99], [170, 220, 50],
    [253, 231, 37], [255, 255, 255], [255, 255, 255], [255, 255, 255],
    [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]
  ],
  // Infernoカラーマップ（簡略化した16段階）
  inferno: [
    [0, 0, 4], [31, 12, 72], [85, 15, 109], [136, 34, 106],
    [186, 54, 85], [227, 89, 51], [249, 142, 8], [252, 187, 17],
    [245, 219, 76], [252, 255, 164], [255, 255, 255], [255, 255, 255],
    [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]
  ],
  // 二極性配色（blue-white-red）
  diverging: [
    [0, 0, 255], [32, 64, 255], [64, 128, 255], [96, 160, 255],
    [128, 192, 255], [160, 224, 255], [192, 240, 255], [224, 248, 255],
    [255, 255, 255], [255, 248, 224], [255, 240, 192], [255, 224, 160],
    [255, 192, 128], [255, 160, 96], [255, 128, 64], [255, 64, 32], [255, 0, 0]
  ]
};

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
   * @returns {Cesium.Color} Calculated color / 計算された色
   */
  static calculateColor(normalizedDensity, rawValue = null, options = {}) {
    try {
      // デフォルト値の設定
      const {
        minColor = [0, 0, 255],
        maxColor = [255, 0, 0],
        colorMap,
        diverging = false,
        divergingPivot = 0
      } = options;

      // 二極性配色対応（pivot>0 の場合のみ）
      if (diverging && rawValue !== null) {
        const pivot = typeof divergingPivot === 'number' ? divergingPivot : 0;
        if (pivot > 0) {
          return ColorCalculator.calculateDivergingColor(rawValue, { divergingPivot: pivot });
        }
        // pivot が 0 以下の場合は従来の補間にフォールバック
      }
      
      // カラーマップ対応
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
   * @returns {Cesium.Color} Calculated diverging color / 計算された二極性色
   */
  static calculateDivergingColor(rawValue, options = {}) {
    const { divergingPivot = 0 } = options;
    const pivot = divergingPivot;
    
    // ピボットからの偏差を正規化
    let normalizedValue;
    
    if (rawValue <= pivot) {
      // 青い側 (0 to 0.5)
      normalizedValue = pivot === 0 ? 0.5 : 0.5 * (rawValue / pivot);
      normalizedValue = Math.max(0, Math.min(0.5, normalizedValue));
    } else {
      // 赤い側 (0.5 to 1)
      normalizedValue = pivot === 0 ? 0.5 : 0.5 + 0.5 * ((rawValue - pivot) / pivot);
      normalizedValue = Math.max(0.5, Math.min(1, normalizedValue));
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
    return COLOR_MAPS.hasOwnProperty(colorMapName);
  }
}
