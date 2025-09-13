import { Logger } from '../../utils/logger.js';

/**
 * AdaptiveController - Adaptive control logic for VoxelRenderer
 * 適応的制御ロジック - ボクセル描画の適応的制御を担当
 * 
 * Responsibilities:
 * - 近傍密度計算 (Neighborhood density calculation)
 * - プリセット適用ロジック (Preset application logic) 
 * - 適応的パラメータ計算 (Adaptive parameter calculation)
 * - カメラ距離・重なりリスク調整 (Camera distance & overlap risk adjustment)
 * 
 * ADR-0009 Phase 3: VoxelRenderer responsibility separation
 * @version 0.1.11
 */
export class AdaptiveController {
  /**
   * AdaptiveController constructor
   * @param {Object} options - Adaptive control options / 適応制御オプション
   * @param {Object} options.adaptiveParams - Adaptive parameters / 適応パラメータ
   * @param {number} options.adaptiveParams.neighborhoodRadius - Neighborhood search radius / 近傍探索半径
   * @param {number} options.adaptiveParams.densityThreshold - Dense area threshold / 密集エリア判定閾値
   * @param {number} options.adaptiveParams.cameraDistanceFactor - Camera distance factor / カメラ距離係数
   * @param {number} options.adaptiveParams.overlapRiskFactor - Overlap risk factor / 重なりリスク係数
   */
  constructor(options = {}) {
    this.options = {
      ...options,
      // v0.1.11-alpha: AdaptiveController適応制御デフォルト設定 (ADR-0009 Phase 3)
      adaptiveParams: {
        neighborhoodRadius: 50,
        densityThreshold: 5,
        cameraDistanceFactor: 1.0,
        overlapRiskFactor: 0.3, // デフォルト値を追加
        ...options.adaptiveParams
      }
    };

    Logger.debug('AdaptiveController initialized with options:', this.options);
  }

  /**
   * Calculate neighborhood density around a voxel
   * ボクセル周辺の近傍密度を計算
   * 
   * @param {Object} voxelInfo - Target voxel information / 対象ボクセル情報
   * @param {number} voxelInfo.x - X coordinate / X座標
   * @param {number} voxelInfo.y - Y coordinate / Y座標  
   * @param {number} voxelInfo.z - Z coordinate / Z座標
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @param {number} [radius] - Search radius override / 探索半径オーバーライド
   * @returns {Object} Neighborhood density result / 近傍密度結果
   */
  calculateNeighborhoodDensity(voxelInfo, voxelData, radius = null) {
    // voxelDataのnull/undefined安全性チェック
    if (!voxelData || typeof voxelData.get !== 'function') {
      return {
        isDenseArea: false,
        neighborhoodDensity: 0,
        neighborCount: 0
      };
    }

    const { x, y, z } = voxelInfo;
    const searchRadius = radius !== null ? radius : 
      Math.max(1, Math.floor(this.options.adaptiveParams.neighborhoodRadius / 20)); // 簡略化

    let neighborhoodDensity = 0;
    let neighborCount = 0;
    
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dz = -searchRadius; dz <= searchRadius; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;
          
          const neighborKey = `${x + dx},${y + dy},${z + dz}`;
          const neighbor = voxelData.get(neighborKey);
          
          if (neighbor) {
            neighborhoodDensity += neighbor.count;
            neighborCount++;
          }
        }
      }
    }
    
    const avgNeighborhoodDensity = neighborCount > 0 ? neighborhoodDensity / neighborCount : 0;
    const isDenseArea = avgNeighborhoodDensity > this.options.adaptiveParams.densityThreshold;
    
    return {
      totalDensity: neighborhoodDensity,
      neighborCount,
      avgDensity: avgNeighborhoodDensity,
      isDenseArea,
      searchRadius
    };
  }

  /**
   * Apply preset-specific adaptive logic
   * プリセット固有の適応ロジックを適用
   * 
   * @param {string} preset - Outline width preset / アウトライン幅プリセット
   * @param {boolean} isTopN - Whether it is TopN voxel / TopNボクセルかどうか
   * @param {number} normalizedDensity - Normalized density [0-1] / 正規化密度 [0-1]
   * @param {boolean} isDenseArea - Whether it is dense area / 密集エリアかどうか
   * @param {Object} baseOptions - Base options for calculation / 計算用基準オプション
   * @returns {Object} Applied preset parameters / 適用済みプリセットパラメータ
   */
  applyPresetLogic(preset, isTopN, normalizedDensity, isDenseArea, baseOptions) {
    let adaptiveWidth, adaptiveBoxOpacity, adaptiveOutlineOpacity;

    switch (preset) {
      // New names (v0.1.12)
      case 'thin':
        adaptiveWidth = Math.max(0.5, baseOptions.outlineWidth * 0.7);
        adaptiveBoxOpacity = baseOptions.opacity;
        adaptiveOutlineOpacity = baseOptions.outlineOpacity || 0.8;
        break;

      case 'medium':
        adaptiveWidth = baseOptions.outlineWidth;
        adaptiveBoxOpacity = baseOptions.opacity;
        adaptiveOutlineOpacity = baseOptions.outlineOpacity || 1.0;
        break;

      case 'thick':
        adaptiveWidth = Math.max(1, baseOptions.outlineWidth * 1.5);
        adaptiveBoxOpacity = baseOptions.opacity;
        adaptiveOutlineOpacity = baseOptions.outlineOpacity || 1.0;
        break;

      case 'adaptive':
      case 'adaptive-density':
        adaptiveWidth = isDenseArea ?
          Math.max(0.5, baseOptions.outlineWidth * (0.5 + normalizedDensity * 0.5)) :
          baseOptions.outlineWidth;
        adaptiveBoxOpacity = isDenseArea ? baseOptions.opacity * 0.8 : baseOptions.opacity;
        adaptiveOutlineOpacity = isDenseArea ? 0.6 : 1.0;
        break;

      // Legacy name (map to thick/topn focus)
      case 'topn-focus':
        adaptiveWidth = isTopN ?
          baseOptions.outlineWidth * (1.5 + normalizedDensity * 0.5) :
          Math.max(0.5, baseOptions.outlineWidth * 0.7);
        adaptiveBoxOpacity = isTopN ? baseOptions.opacity : baseOptions.opacity * 0.6;
        adaptiveOutlineOpacity = isTopN ? 1.0 : 0.4;
        break;

      // Legacy name (uniform)
      case 'uniform':
      default:
        adaptiveWidth = baseOptions.outlineWidth;
        adaptiveBoxOpacity = baseOptions.opacity;
        adaptiveOutlineOpacity = baseOptions.outlineOpacity || 1.0;
        break;
    }

    return {
      adaptiveWidth,
      adaptiveBoxOpacity,
      adaptiveOutlineOpacity
    };
  }

  /**
   * Calculate adaptive parameters for a voxel
   * ボクセルの適応的パラメータを計算
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {boolean} isTopN - Whether it is TopN voxel / TopNボクセルかどうか
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @param {Object} statistics - Statistics information / 統計情報
   * @param {Object} renderOptions - Rendering options / 描画オプション
   * @returns {Object} Adaptive parameters / 適応的パラメータ
   */
  calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics, renderOptions) {
    // 引数の安全性チェック
    if (!voxelInfo || !statistics || !renderOptions) {
      return {
        outlineWidth: null,
        boxOpacity: null,
        outlineOpacity: null,
        shouldUseEmulation: false
      };
    }
    
    // v0.1.11-alpha: 適応制御が無効な場合は早期リターン (ADR-0009 Phase 3)
    if (!renderOptions.adaptiveOutlines) {
      return {
        outlineWidth: null,
        boxOpacity: null,
        outlineOpacity: null,
        shouldUseEmulation: false
      };
    }

    const { count } = voxelInfo;
    const normalizedDensity = statistics.maxCount > statistics.minCount ? 
      (count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
    
    // 近傍密度を計算
    const neighborhoodResult = this.calculateNeighborhoodDensity(voxelInfo, voxelData);
    const { isDenseArea } = neighborhoodResult;
    
    // カメラ距離は簡略化（実装では固定値を使用）
    const cameraDistance = 1000; // 固定値、実際の実装ではカメラからの距離を取得
    const cameraFactor = Math.min(1.0, 1000 / cameraDistance) * this.options.adaptiveParams.cameraDistanceFactor;
    
    // 重なりリスクの算出
    const overlapRisk = isDenseArea ? this.options.adaptiveParams.overlapRiskFactor : 0;
    
    // プリセットによる調整
    const presetResult = this.applyPresetLogic(
      renderOptions.outlineWidthPreset,
      isTopN,
      normalizedDensity,
      isDenseArea,
      renderOptions
    );
    
    // カメラ距離と重なりリスクで調整
    const finalWidth = presetResult.adaptiveWidth * cameraFactor;
    const finalOutlineOpacity = Math.max(0.2, presetResult.adaptiveOutlineOpacity * (1 - overlapRisk));
    
    return {
      outlineWidth: Math.max(0.5, finalWidth),
      boxOpacity: Math.max(0.1, Math.min(1.0, presetResult.adaptiveBoxOpacity)),
      outlineOpacity: Math.max(0.2, Math.min(1.0, finalOutlineOpacity)),
      shouldUseEmulation: isDenseArea || (finalWidth > 2 && renderOptions.outlineRenderMode !== 'standard'),
      // Debug info for testing / テスト用デバッグ情報
      _debug: {
        normalizedDensity,
        neighborhoodResult,
        cameraFactor,
        overlapRisk,
        preset: renderOptions.outlineWidthPreset
      }
    };
  }

  /**
   * Update adaptive control options
   * 適応制御オプションを更新
   * 
   * @param {Object} newOptions - New options to merge / マージする新オプション
   */
  updateOptions(newOptions) {
    this.options = {
      ...this.options,
      ...newOptions,
      adaptiveParams: {
        ...this.options.adaptiveParams,
        ...(newOptions.adaptiveParams || {})
      }
    };
    
    Logger.debug('AdaptiveController options updated:', this.options);
  }

  /**
   * Get current adaptive control configuration
   * 現在の適応制御設定を取得
   * 
   * @returns {Object} Current configuration / 現在の設定
   */
  getConfiguration() {
    return {
      ...this.options,
      version: '0.1.11',
      phase: 'ADR-0009 Phase 3'
    };
  }
}
