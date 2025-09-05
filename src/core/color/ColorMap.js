/**
 * Color mapping and interpolation utilities for voxel rendering.
 * ボクセル描画用の色マッピング・補間ユーティリティ。
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';

// v0.1.5: カラーマップ定義（256段階のLUTテーブル）
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
 * Color mapping and interpolation utility class.
 * 色マッピングと補間を担当するユーティリティクラス。
 */
export class ColorMap {
  /**
   * Main color interpolation method.
   * メイン色補間メソッド。
   * @param {number} normalizedDensity - Normalized density (0-1) / 正規化された密度 (0-1)
   * @param {number} [rawValue] - Raw value for diverging scheme / 生値（二極性配色用）
   * @param {Object} options - Color options / 色オプション
   * @returns {Cesium.Color} Calculated color / 計算された色
   */
  static interpolateColor(normalizedDensity, rawValue = null, options = {}) {
    // v0.1.5: 二極性配色対応（pivot<=0 の場合は安全にフォールバック）
    if (options.diverging && rawValue !== null) {
      const pivot = typeof options.divergingPivot === 'number' ? options.divergingPivot : 0;
      if (pivot > 0) {
        return ColorMap._interpolateDivergingColor(rawValue, options);
      }
      // pivot が 0 以下の場合は従来の補間にフォールバック
    }
    
    // v0.1.5: カラーマップ対応
    if (options.colorMap && options.colorMap !== 'custom') {
      return ColorMap._interpolateFromColorMap(normalizedDensity, options.colorMap);
    }
    
    // 従来のmin/max色補間（後方互換）
    const minColor = options.minColor || [0, 0, 255];
    const maxColor = options.maxColor || [255, 0, 0];
    
    const [minR, minG, minB] = minColor;
    const [maxR, maxG, maxB] = maxColor;
    
    const r = Math.round(minR + (maxR - minR) * normalizedDensity);
    const g = Math.round(minG + (maxG - minG) * normalizedDensity);
    const b = Math.round(minB + (maxB - minB) * normalizedDensity);
    
    return Cesium.Color.fromBytes(r, g, b);
  }

  /**
   * Interpolate color from a color map.
   * カラーマップから色を補間します。
   * @param {number} normalizedValue - Normalized value (0-1) / 正規化された値 (0-1)
   * @param {string} colorMapName - Color map name / カラーマップ名
   * @returns {Cesium.Color} Calculated color / 計算された色
   * @private
   */
  static _interpolateFromColorMap(normalizedValue, colorMapName) {
    const colorMap = COLOR_MAPS[colorMapName];
    if (!colorMap) {
      Logger.warn(`Unknown color map: ${colorMapName}. Falling back to custom.`);
      return ColorMap.interpolateColor(normalizedValue);
    }
    
    // マップインデックスを計算
    const scaledValue = normalizedValue * (colorMap.length - 1);
    const lowerIndex = Math.floor(scaledValue);
    const upperIndex = Math.min(lowerIndex + 1, colorMap.length - 1);
    const fraction = scaledValue - lowerIndex;
    
    // 補間計算
    const [lowerR, lowerG, lowerB] = colorMap[lowerIndex];
    const [upperR, upperG, upperB] = colorMap[upperIndex];
    
    const r = Math.round(lowerR + (upperR - lowerR) * fraction);
    const g = Math.round(lowerG + (upperG - lowerG) * fraction);
    const b = Math.round(lowerB + (upperB - lowerB) * fraction);
    
    return Cesium.Color.fromBytes(r, g, b);
  }

  /**
   * Interpolate color using diverging scheme.
   * 二極性配色を使用して色を補間します。
   * @param {number} rawValue - Raw value / 生値
   * @param {Object} options - Color options / 色オプション
   * @returns {Cesium.Color} Calculated color / 計算された色
   * @private
   */
  static _interpolateDivergingColor(rawValue, options) {
    const pivot = options.divergingPivot || 0;
    
    // ピボットからの偏差を正規化
    let normalizedValue;
    if (rawValue <= pivot) {
      // 青い側 (0 to 0.5)
      normalizedValue = 0.5 * (rawValue / pivot);
      normalizedValue = Math.max(0, Math.min(0.5, normalizedValue));
    } else {
      // 赤い側 (0.5 to 1)
      normalizedValue = 0.5 + 0.5 * ((rawValue - pivot) / pivot);
      normalizedValue = Math.max(0.5, Math.min(1, normalizedValue));
    }
    
    return ColorMap._interpolateFromColorMap(normalizedValue, 'diverging');
  }

  /**
   * Get available color map names.
   * 利用可能なカラーマップ名を取得します。
   * @returns {string[]} Available color map names / 利用可能なカラーマップ名
   */
  static getAvailableColorMaps() {
    return Object.keys(COLOR_MAPS);
  }

  /**
   * Check if a color map exists.
   * カラーマップが存在するかをチェックします。
   * @param {string} colorMapName - Color map name / カラーマップ名
   * @returns {boolean} True if exists / 存在する場合true
   */
  static hasColorMap(colorMapName) {
    return Object.prototype.hasOwnProperty.call(COLOR_MAPS, colorMapName);
  }
}
