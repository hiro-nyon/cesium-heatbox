/**
 * Controller for adaptive outline parameter calculation.
 * 適応的枠線パラメータ計算のコントローラー。
 * 
 * Handles dynamic outline width, opacity, and emulation decisions based on
 * voxel density, camera distance, and neighborhood analysis.
 * ボクセル密度、カメラ距離、近傍分析に基づく動的枠線幅、不透明度、
 * エミュレーション判定を処理します。
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';

/**
 * AdaptiveOutlineController class for dynamic outline parameter calculation.
 * 動的枠線パラメータ計算のためのAdaptiveOutlineControllerクラス。
 */
export class AdaptiveOutlineController {
  /**
   * Constructor
   * @param {Object} options - Configuration options / 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      neighborhoodRadius: 50,
      densityThreshold: 5,
      cameraDistanceFactor: 1.0,
      overlapRiskFactor: 0.3,
      ...options
    };
  }

  /**
   * Calculate adaptive outline parameters for a voxel.
   * ボクセルの適応的枠線パラメータを計算します。
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {boolean} isTopN - Whether it is TopN / TopNボクセルかどうか
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @param {Object} statistics - Statistics / 統計情報
   * @param {Cesium.Viewer} viewer - Cesium viewer / Cesiumビューワー
   * @param {Object} baseOptions - Base rendering options / 基本描画オプション
   * @returns {Object} Adaptive parameters / 適応的パラメータ
   */
  calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics, viewer, baseOptions) {
    if (!baseOptions.adaptiveOutlines) {
      return {
        outlineWidth: null,
        boxOpacity: null,
        outlineOpacity: null,
        shouldUseEmulation: false
      };
    }

    const { x, y, z, count } = voxelInfo;
    const normalizedDensity = statistics.maxCount > statistics.minCount ? 
      (count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;

    // Calculate neighborhood density / 近傍密度を計算
    const neighborDensity = this._calculateNeighborhoodDensity(x, y, z, voxelData);
    
    // Calculate camera distance factor / カメラ距離係数を計算
    const cameraFactor = this._calculateCameraDistanceFactor(voxelInfo, viewer);
    
    // Calculate overlap risk / 重複リスクを計算
    const overlapRisk = this._calculateOverlapRisk(voxelInfo, voxelData, viewer);

    // Determine outline width based on preset / プリセットに基づく枠線幅を決定
    const outlineWidth = this._calculateOutlineWidth(
      normalizedDensity, 
      neighborDensity, 
      cameraFactor, 
      baseOptions.outlineWidthPreset,
      baseOptions.outlineWidth,
      isTopN
    );

    // Calculate adaptive opacities / 適応的不透明度を計算
    const boxOpacity = this._calculateBoxOpacity(normalizedDensity, isTopN, baseOptions.opacity);
    const outlineOpacity = this._calculateOutlineOpacity(
      normalizedDensity, 
      neighborDensity, 
      cameraFactor
    );

    // Determine if emulation should be used / エミュレーション使用判定
    const shouldUseEmulation = this._shouldUseEmulation(
      overlapRisk, 
      neighborDensity, 
      baseOptions.outlineRenderMode
    );

    Logger.debug('Calculated adaptive params for voxel:', {
      voxel: { x, y, z, count },
      normalizedDensity,
      neighborDensity,
      cameraFactor,
      overlapRisk,
      result: { outlineWidth, boxOpacity, outlineOpacity, shouldUseEmulation }
    });

    return {
      outlineWidth,
      boxOpacity,
      outlineOpacity,
      shouldUseEmulation
    };
  }

  /**
   * Calculate neighborhood density around a voxel.
   * ボクセル周辺の近傍密度を計算します。
   * 
   * @param {number} x - X coordinate / X座標
   * @param {number} y - Y coordinate / Y座標
   * @param {number} z - Z coordinate / Z座標
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @returns {number} Neighborhood density / 近傍密度
   * @private
   */
  _calculateNeighborhoodDensity(x, y, z, voxelData) {
    const radius = Math.floor(this.options.neighborhoodRadius / 100); // Convert to grid units
    let totalCount = 0;
    let voxelCount = 0;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const key = `${x + dx},${y + dy},${z + dz}`;
          const neighbor = voxelData.get(key);
          if (neighbor) {
            totalCount += neighbor.count;
            voxelCount++;
          }
        }
      }
    }

    return voxelCount > 0 ? totalCount / voxelCount : 0;
  }

  /**
   * Calculate camera distance factor for adaptive rendering.
   * 適応的描画のためのカメラ距離係数を計算します。
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {Cesium.Viewer} viewer - Cesium viewer / Cesiumビューワー
   * @returns {number} Camera distance factor / カメラ距離係数
   * @private
   */
  _calculateCameraDistanceFactor(voxelInfo, viewer) {
    // Fallback when viewer camera or position is unavailable (tests/mocks)
    if (!viewer || !viewer.camera || !voxelInfo || !voxelInfo.position) {
      return 1.0;
    }
    const camera = viewer.camera;
    const voxelPosition = voxelInfo.position;
    const cameraPosition = camera.position || new Cesium.Cartesian3(0, 0, 1000);
    const distance = Cesium.Cartesian3.distance(cameraPosition, voxelPosition);
    const normalizedDistance = Math.min(distance / 10000, 1.0); // Normalize to 0-1
    
    return 1.0 - (normalizedDistance * this.options.cameraDistanceFactor);
  }

  /**
   * Calculate overlap risk between nearby voxels.
   * 近接ボクセル間の重複リスクを計算します。
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @param {Cesium.Viewer} viewer - Cesium viewer / Cesiumビューワー
   * @returns {number} Overlap risk factor / 重複リスク係数
   * @private
   */
_calculateOverlapRisk(voxelInfo, voxelData, _viewer) {
    const { x, y, z } = voxelInfo;
    let adjacentCount = 0;
    
    // Check immediate neighbors / 隣接ボクセルをチェック
    const neighbors = [
      [x+1, y, z], [x-1, y, z],
      [x, y+1, z], [x, y-1, z],
      [x, y, z+1], [x, y, z-1]
    ];
    
    for (const [nx, ny, nz] of neighbors) {
      const key = `${nx},${ny},${nz}`;
      if (voxelData.has(key)) {
        adjacentCount++;
      }
    }
    
    const adjacencyRatio = adjacentCount / 6;
    return adjacencyRatio * this.options.overlapRiskFactor;
  }

  /**
   * Calculate outline width based on preset and adaptive factors.
   * プリセットと適応的要因に基づく枠線幅を計算します。
   * 
   * @param {number} normalizedDensity - Normalized density / 正規化密度
   * @param {number} neighborDensity - Neighborhood density / 近傍密度
   * @param {number} cameraFactor - Camera distance factor / カメラ距離係数
   * @param {string} preset - Width preset / 幅プリセット
   * @param {number} baseWidth - Base outline width / 基本枠線幅
   * @returns {number} Calculated outline width / 計算された枠線幅
   * @private
   */
  _calculateOutlineWidth(normalizedDensity, neighborDensity, cameraFactor, preset, baseWidth, isTopN = false) {
    switch (preset) {
      case 'adaptive-density':
        return neighborDensity > this.options.densityThreshold
          ? Math.max(0.5, baseWidth * (0.5 + normalizedDensity * 0.5))
          : baseWidth;

      case 'topn-focus':
        return isTopN
          ? baseWidth * (1.5 + normalizedDensity * 0.5)
          : Math.max(0.5, baseWidth * 0.7);
      
      case 'density-based':
        return baseWidth * (0.5 + normalizedDensity * 1.5);
      
      case 'distance-adaptive':
        return baseWidth * (0.8 + cameraFactor * 0.4);
      
      case 'neighborhood-aware': {
        const densityFactor = neighborDensity > this.options.densityThreshold ? 0.7 : 1.2;
        return baseWidth * densityFactor;
      }
      
      case 'uniform':
      default:
        return baseWidth;
    }
  }

  /**
   * Calculate adaptive box opacity.
   * 適応的ボックス不透明度を計算します。
   * 
   * @param {number} normalizedDensity - Normalized density / 正規化密度
   * @param {boolean} isTopN - Whether it is TopN / TopNボクセルかどうか
   * @param {number} baseOpacity - Base opacity / 基本不透明度
   * @returns {number} Calculated box opacity / 計算されたボックス不透明度
   * @private
   */
  _calculateBoxOpacity(normalizedDensity, isTopN, baseOpacity) {
    if (isTopN) {
      return Math.min(baseOpacity * 1.2, 1.0);
    }
    
    return baseOpacity * (0.6 + normalizedDensity * 0.4);
  }

  /**
   * Calculate adaptive outline opacity.
   * 適応的枠線不透明度を計算します。
   * 
   * @param {number} normalizedDensity - Normalized density / 正規化密度
   * @param {number} neighborDensity - Neighborhood density / 近傍密度
   * @param {number} cameraFactor - Camera distance factor / カメラ距離係数
   * @returns {number} Calculated outline opacity / 計算された枠線不透明度
   * @private
   */
  _calculateOutlineOpacity(normalizedDensity, neighborDensity, cameraFactor) {
    const densityComponent = 0.7 + normalizedDensity * 0.3;
    const neighborComponent = neighborDensity > this.options.densityThreshold ? 0.9 : 1.0;
    const cameraComponent = 0.8 + cameraFactor * 0.2;
    
    return Math.min(densityComponent * neighborComponent * cameraComponent, 1.0);
  }

  /**
   * Determine if emulation mode should be used.
   * エミュレーションモードを使用すべきかどうかを判定します。
   * 
   * @param {number} overlapRisk - Overlap risk factor / 重複リスク係数
   * @param {number} neighborDensity - Neighborhood density / 近傍密度
   * @param {string} renderMode - Outline render mode / 枠線描画モード
   * @returns {boolean} Whether to use emulation / エミュレーション使用フラグ
   * @private
   */
  _shouldUseEmulation(overlapRisk, neighborDensity, renderMode) {
    if (renderMode === 'emulation-only') {
      return true;
    }
    
    if (renderMode === 'standard') {
      return false;
    }
    
    // For 'inset' mode, use emulation in high-density areas / 'inset'モードでは高密度エリアでエミュレーション使用
    return overlapRisk > 0.5 && neighborDensity > this.options.densityThreshold;
  }

  /**
   * Update adaptive parameters configuration.
   * 適応的パラメータ設定を更新します。
   * 
   * @param {Object} newOptions - New options / 新しいオプション
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    Logger.debug('AdaptiveOutlineController options updated:', this.options);
  }
}
