import { Logger } from '../../utils/logger.js';
import { DEFAULT_OPTIONS } from '../../utils/constants.js';

const DEFAULT_ADAPTIVE_PARAMS = DEFAULT_OPTIONS.adaptiveParams || {};

/**
 * AdaptiveController - Adaptive outline logic delegated from VoxelRenderer.
 * 適応的制御ロジック - ボクセルレンダラーから委譲されるアウトライン制御を担当
 * 
 * Responsibilities:
 * - 近傍密度計算 (Neighborhood density calculation)
 * - プリセット適用ロジック (Preset application logic)
 * - 適応的パラメータ計算 (Adaptive parameter calculation)
 * - Z軸スケール補正と重なり検出の推奨提示 (Z scale compensation & overlap recommendations)
 * 
 * ADR-0009 Phase 3 + ADR-0011 Phase 4
 * @version 0.1.15
 */
export class AdaptiveController {
  /**
   * AdaptiveController constructor
   * @param {Object} options - Adaptive control options / 適応制御オプション
   * @param {Object} options.adaptiveParams - Adaptive parameters / 適応パラメータ
   * Properties: `neighborhoodRadius`, `densityThreshold`, `cameraDistanceFactor`,
   * `overlapRiskFactor`, `outlineWidthRange`, `boxOpacityRange`,
   * `outlineOpacityRange`, `zScaleCompensation`, `overlapDetection`
   * / プロパティ: 近傍探索半径・密集判定閾値・カメラ距離係数・重なりリスク係数・
   * 枠線太さ範囲・ボックス不透明度範囲・枠線不透明度範囲・Z軸補正フラグ・重なり検出フラグ
   */
  constructor(options = {}) {
    const mergedAdaptiveParams = {
      ...DEFAULT_ADAPTIVE_PARAMS,
      ...(options.adaptiveParams || {})
    };

    this.options = {
      ...options,
      adaptiveParams: mergedAdaptiveParams
    };

    Logger.debug('AdaptiveController initialized with options:', this.options);
  }

  /**
   * Calculate neighborhood density around a voxel
   * ボクセル周辺の近傍密度を計算
   * 
   * @param {Object} voxelInfo - Target voxel information (`x`, `y`, `z` number) / 対象ボクセル情報（`x`・`y`・`z` は数値）
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @param {number} [radius] - Search radius override / 探索半径オーバーライド
   * @param {Object} [renderOptions] - Live render options snapshot / 現在の描画オプション
   * @returns {Object} Neighborhood density result / 近傍密度結果
   */
  calculateNeighborhoodDensity(voxelInfo, voxelData, radius = null, renderOptions = null) {
    // voxelDataのnull/undefined安全性チェック
    if (!voxelData || typeof voxelData.get !== 'function') {
      return {
        isDenseArea: false,
        neighborhoodDensity: 0,
        neighborCount: 0
      };
    }

    const { x, y, z } = voxelInfo;
    const controllerAdaptiveParams = {
      ...DEFAULT_ADAPTIVE_PARAMS,
      ...(this.options?.adaptiveParams || {}),
      ...(renderOptions?.adaptiveParams || {})
    };
    const effectiveRadius = controllerAdaptiveParams.neighborhoodRadius ?? DEFAULT_ADAPTIVE_PARAMS.neighborhoodRadius ?? 30;
    const searchRadius = radius !== null ? radius :
      Math.max(1, Math.floor(effectiveRadius / 20)); // 簡略化

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
    const densityThreshold = controllerAdaptiveParams.densityThreshold ?? DEFAULT_ADAPTIVE_PARAMS.densityThreshold ?? 5;
    const isDenseArea = avgNeighborhoodDensity > densityThreshold;
    
    return {
      totalDensity: neighborhoodDensity,
      neighborCount,
      avgDensity: avgNeighborhoodDensity,
      isDenseArea,
      searchRadius
    };
  }

  /**
   * Calculate Z-axis scale compensation factor
   * Z軸スケール補正係数を計算（v0.1.15 Phase 1 - ADR-0011）
   * 
   * @param {Object} voxelInfo - Target voxel information / 対象ボクセル情報
   * @param {Object} grid - Grid information with cellSizeX/Y/Z / グリッド情報
   * @returns {number} Scale compensation factor / スケール補正係数
   */
  _calculateZScaleCompensation(voxelInfo, grid) {
    const controllerAdaptiveParams = this.options.adaptiveParams || DEFAULT_ADAPTIVE_PARAMS;

    if (!grid || !controllerAdaptiveParams.zScaleCompensation) {
      return 1.0;
    }
    
    const { cellSizeX, cellSizeY, cellSizeZ } = grid;
    if (!cellSizeX || !cellSizeY || !cellSizeZ) {
      return 1.0;
    }
    
    const avgHorizontalSize = (cellSizeX + cellSizeY) / 2;
    const aspectRatio = cellSizeZ / avgHorizontalSize;
    
    // Z軸が極小の場合は補正を適用
    if (aspectRatio < 0.1) {
      return Math.max(0.7, Math.min(1.3, 1.0 + (0.1 - aspectRatio) * 2));
    }
    return 1.0;
  }

  /**
   * Count adjacent voxels (6 directions: ±X, ±Y, ±Z)
   * 隣接ボクセルをカウント（6方向：±X, ±Y, ±Z）（v0.1.15 Phase 2 - ADR-0011）
   * 
   * @param {Object} voxelInfo - Target voxel information (`x`, `y`, `z` number) / 対象ボクセル情報（`x`・`y`・`z` は数値）
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @returns {number} Number of adjacent voxels / 隣接ボクセル数
   */
  _countAdjacentVoxels(voxelInfo, voxelData) {
    if (!voxelInfo || !voxelData || typeof voxelData.get !== 'function') {
      return 0;
    }

    const { x, y, z } = voxelInfo;
    const adjacentDirections = [
      [1, 0, 0],   // +X
      [-1, 0, 0],  // -X
      [0, 1, 0],   // +Y
      [0, -1, 0],  // -Y
      [0, 0, 1],   // +Z
      [0, 0, -1]   // -Z
    ];

    let adjacentCount = 0;
    for (const [dx, dy, dz] of adjacentDirections) {
      const neighborKey = `${x + dx},${y + dy},${z + dz}`;
      if (voxelData.get(neighborKey)) {
        adjacentCount++;
      }
    }

    return adjacentCount;
  }

  /**
   * Detect overlap and recommend rendering mode
   * 隣接重なりを検出してレンダリングモードを推奨（v0.1.15 Phase 2 - ADR-0011）
   * 
   * @param {Object} voxelInfo - Target voxel information (`x`, `y`, `z` number) / 対象ボクセル情報（`x`・`y`・`z` は数値）
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @returns {Object} Recommended rendering settings / 推奨レンダリング設定
   * @returns {string} returns.recommendedMode - Recommended outline render mode / 推奨アウトライン描画モード
   * @returns {number} returns.recommendedInset - Recommended inset value / 推奨インセット値
   * @returns {string} [returns.reason] - Reason for recommendation / 推奨理由
   */
  _detectOverlapAndRecommendMode(voxelInfo, voxelData, renderOptions = null) {
    const liveOptions = renderOptions || this.options || {};
    const liveAdaptiveParams = {
      ...DEFAULT_ADAPTIVE_PARAMS,
      ...(this.options?.adaptiveParams || {}),
      ...(renderOptions?.adaptiveParams || {})
    };

    const currentMode = liveOptions.outlineRenderMode || 'standard';
    const currentInset = liveOptions.outlineInset || 0;

    // overlapDetection が無効な場合は現在の設定を返す
    if (!liveAdaptiveParams.overlapDetection) {
      return {
        recommendedMode: currentMode,
        recommendedInset: currentInset
      };
    }

    const adjacentCount = this._countAdjacentVoxels(voxelInfo, voxelData);
    const overlapRisk = adjacentCount / 6; // 最大6方向

    // 重なりリスクが高い場合、insetモードを推奨
    if (overlapRisk > 0.5 && currentMode !== 'emulation-only') {
      return {
        recommendedMode: 'inset',
        recommendedInset: Math.max(0.3, 0.8 - overlapRisk * 0.4),
        reason: `High overlap risk (${(overlapRisk * 100).toFixed(0)}%)`
      };
    }

    return {
      recommendedMode: currentMode,
      recommendedInset: currentInset
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
        // v0.1.12-alpha.10: 最小値を1.0に設定してRangeError防止
        adaptiveWidth = Math.max(1.0, baseOptions.outlineWidth * 0.8);
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
      case 'adaptive-density': {
        // v0.1.15 Phase 1: より柔軟で安定した調整（ADR-0011）
        // 密度に応じたベース係数（中央値を基準に調整）
        const baseFactor = isDenseArea ? 
          Math.max(0.6, 0.8 + (normalizedDensity - 0.5) * 0.3) : 1.0; // 0.6-0.95倍（密集時）
        
        // Z軸スケール補正を適用（有効な場合）
        // 注: voxelInfoとgridはcalculateAdaptiveParams内でのみ利用可能
        // ここではbaseFactor * zScaleFactorの形で後段で適用される想定
        
        adaptiveWidth = Math.max(1.0, Math.min(baseOptions.outlineWidth * 3.0,
          baseOptions.outlineWidth * baseFactor));
        adaptiveBoxOpacity = isDenseArea ? baseOptions.opacity * 0.8 : baseOptions.opacity;
        adaptiveOutlineOpacity = isDenseArea ? 0.6 : 1.0;
        break;
      }

      // Legacy name (map to thick/topn focus)
      case 'topn-focus':
        // v0.1.12-alpha.10: 安全な値範囲でRangeError防止
        adaptiveWidth = isTopN ?
          Math.max(1.0, Math.min(baseOptions.outlineWidth * 3.0, 
            baseOptions.outlineWidth * (1.5 + normalizedDensity * 0.5))) :
          Math.max(1.0, baseOptions.outlineWidth * 0.8); // 0.5→0.8で最小値を安全に
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
   * @param {Object} [grid] - Grid information (optional, for Z-scale compensation) / グリッド情報（オプション、Z軸補正用）
   * @returns {Object} Adaptive parameters / 適応的パラメータ
   */
  calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics, renderOptions, grid = null) {
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
    const neighborhoodResult = this.calculateNeighborhoodDensity(voxelInfo, voxelData, null, renderOptions);
    const { isDenseArea } = neighborhoodResult;

    // v0.1.15 Phase 1: Z軸スケール補正を適用（ADR-0011）
    const zScaleFactor = this._calculateZScaleCompensation(voxelInfo, grid);

    // v0.1.15 Phase 2: 重なり検出と推奨モード判定（ADR-0011）
    const overlapRecommendation = this._detectOverlapAndRecommendMode(voxelInfo, voxelData, renderOptions);

    // カメラ距離は簡略化（実装では固定値を使用）
    const cameraDistance = 1000; // 固定値、実際の実装ではカメラからの距離を取得
    const controllerAdaptiveParams = {
      ...DEFAULT_ADAPTIVE_PARAMS,
      ...(this.options?.adaptiveParams || {}),
      ...(renderOptions?.adaptiveParams || {})
    };
    const cameraDistanceFactor = controllerAdaptiveParams.cameraDistanceFactor ?? 1.0;
    const overlapRiskFactor = controllerAdaptiveParams.overlapRiskFactor ?? 0;
    const cameraFactor = Math.min(1.0, 1000 / cameraDistance) * cameraDistanceFactor;

    // 重なりリスクの算出
    const overlapRisk = isDenseArea ? overlapRiskFactor : 0;

    // プリセットによる調整
    const presetResult = this.applyPresetLogic(
      renderOptions.outlineWidthPreset,
      isTopN,
      normalizedDensity,
      isDenseArea,
      renderOptions
    );

    // v0.1.15 Phase 1: Z軸補正を含めた最終調整（ADR-0011）
    const finalWidth = presetResult.adaptiveWidth * cameraFactor * zScaleFactor;
    const finalOutlineOpacity = Math.max(0.2, presetResult.adaptiveOutlineOpacity * (1 - overlapRisk));

    // Range & clamp adjustments (v0.1.15 Phase 0/1)
    const rangeConfig = (renderOptions && renderOptions.adaptiveParams) || controllerAdaptiveParams || {};

    const clampWithRange = (value, range, hardMin, hardMax) => {
      let clamped = value;
      if (Array.isArray(range) && range.length === 2) {
        const [minRange, maxRange] = range;
        const minVal = (minRange !== undefined && minRange !== null) ? minRange : hardMin;
        const maxVal = (maxRange !== undefined && maxRange !== null) ? maxRange : hardMax;
        clamped = Math.min(maxVal ?? clamped, Math.max(minVal ?? clamped, clamped));
      }
      if (hardMin !== undefined && hardMin !== null) {
        clamped = Math.max(hardMin, clamped);
      }
      if (hardMax !== undefined && hardMax !== null) {
        clamped = Math.min(hardMax, clamped);
      }
      return clamped;
    };

    const clampedOutlineWidth = clampWithRange(
      Math.max(1.0, finalWidth),
      rangeConfig.outlineWidthRange,
      controllerAdaptiveParams.minOutlineWidth ?? 1.0,
      controllerAdaptiveParams.maxOutlineWidth ?? null
    );

    const clampedBoxOpacity = clampWithRange(
      Math.max(0.0, Math.min(1.0, presetResult.adaptiveBoxOpacity)),
      rangeConfig.boxOpacityRange,
      0,
      1
    );

    const clampedOutlineOpacity = clampWithRange(
      Math.max(0.2, Math.min(1.0, finalOutlineOpacity)),
      rangeConfig.outlineOpacityRange,
      0,
      1
    );

    return {
      // v0.1.12-alpha.10: RangeError防止のため最小値を1.0に設定
      outlineWidth: clampedOutlineWidth,
      boxOpacity: clampedBoxOpacity,
      outlineOpacity: clampedOutlineOpacity,
      shouldUseEmulation: isDenseArea || (finalWidth > 2 && renderOptions.outlineRenderMode !== 'standard'),
      // Debug info for testing / テスト用デバッグ情報
      _debug: {
        normalizedDensity,
        neighborhoodResult,
        cameraFactor,
        overlapRisk,
        zScaleFactor, // v0.1.15 Phase 1: Z軸補正係数
        overlapRecommendation, // v0.1.15 Phase 2: 重なり検出結果
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
