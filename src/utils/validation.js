/**
 * Validation utility functions.
 * バリデーション関連のユーティリティ関数。
 */

import * as Cesium from 'cesium';
import { PERFORMANCE_LIMITS, ERROR_MESSAGES } from './constants.js';
import { Logger } from './logger.js';
import { VoxelSizeEstimator } from './voxelSizeEstimator.js';

/**
 * Check whether a CesiumJS Viewer is valid.
 * CesiumJS Viewerが有効かチェックします。
 * @param {Object} viewer - CesiumJS Viewer
 * @returns {boolean} true if valid / 有効な場合は true
 */
export function isValidViewer(viewer) {
  if (!viewer) {
    return false;
  }
  
  // 必要なプロパティが存在するかチェック
  if (!viewer.scene || !viewer.entities || !viewer.scene.canvas) {
    return false;
  }
  
  // WebGL対応チェック（WebGL2 も許容）
  const canvas = viewer.scene.canvas;
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    return false;
  }
  
  return true;
}

/**
 * Check whether the entity array is valid.
 * エンティティ配列が有効かチェックします。
 * @param {Array} entities - Entity array / エンティティ配列
 * @returns {boolean} true if valid / 有効な場合は true
 */
export function isValidEntities(entities) {
  if (!Array.isArray(entities)) {
    return false;
  }
  
  if (entities.length === 0) {
    return false;
  }
  
  if (entities.length > PERFORMANCE_LIMITS.maxEntities) {
    Logger.warn(`エンティティ数が推奨値(${PERFORMANCE_LIMITS.maxEntities})を超えています: ${entities.length}`);
  }
  
  return true;
}

/**
 * Check whether the voxel size is valid.
 * ボクセルサイズが有効かチェックします。
 * @param {number} voxelSize - Voxel size / ボクセルサイズ
 * @returns {boolean} true if valid / 有効な場合は true
 */
export function isValidVoxelSize(voxelSize) {
  if (typeof voxelSize !== 'number' || isNaN(voxelSize)) {
    return false;
  }
  
  if (voxelSize < PERFORMANCE_LIMITS.minVoxelSize || voxelSize > PERFORMANCE_LIMITS.maxVoxelSize) {
    return false;
  }
  
  return true;
}

/**
 * Check whether an entity has a valid position.
 * エンティティが有効な位置情報を持つかチェックします。
 * @param {Object} entity - Cesium Entity
 * @returns {boolean} true if valid / 有効な場合は true
 */
export function hasValidPosition(entity) {
  if (!entity || !entity.position) {
    return false;
  }
  
  // Propertyベースの位置情報の場合
  if (typeof entity.position.getValue === 'function') {
    const position = entity.position.getValue(Cesium.JulianDate.now());
    return position && !isNaN(position.x) && !isNaN(position.y) && !isNaN(position.z);
  }
  
  // 直接Cartesian3の場合
  if (entity.position.x !== undefined) {
    return !isNaN(entity.position.x) && !isNaN(entity.position.y) && !isNaN(entity.position.z);
  }
  
  return false;
}

/**
 * Validate that total voxel count is within limits.
 * 処理するボクセル数が制限内かチェックします。
 * @param {number} totalVoxels - Total voxels / 総ボクセル数
 * @param {number} voxelSize - Voxel size / ボクセルサイズ
 * @returns {Object} Validation result / チェック結果
 */
export function validateVoxelCount(totalVoxels, voxelSize) {
  const result = {
    valid: true,
    warning: false,
    error: null,
    recommendedSize: null
  };
  
  if (totalVoxels > PERFORMANCE_LIMITS.maxVoxels) {
    result.valid = false;
    result.error = ERROR_MESSAGES.VOXEL_LIMIT_EXCEEDED;
    result.recommendedSize = Math.ceil(voxelSize * Math.pow(totalVoxels / PERFORMANCE_LIMITS.maxVoxels, 1/3));
  } else if (totalVoxels > PERFORMANCE_LIMITS.warningThreshold) {
    result.warning = true;
    result.error = ERROR_MESSAGES.MEMORY_WARNING;
  }
  
  return result;
}

/**
 * Validate and normalize options.
 * オプションを検証して正規化します。
 * v0.1.5: batchMode 非推奨化と新機能バリデーションを追加。
 * @param {Object} options - User-specified options / ユーザー指定のオプション
 * @returns {Object} Normalized options / 正規化されたオプション
 */
export function validateAndNormalizeOptions(options = {}) {
  const normalized = { ...options };
  
  // v0.1.5: batchMode非推奨化警告（debug時のみ）
  if (normalized.batchMode && normalized.debug) {
    Logger.warn('batchMode option is deprecated and will be removed in v1.0.0. It is currently ignored.');
  }
  
  // ボクセルサイズのバリデーション
  if (normalized.voxelSize !== undefined && !isValidVoxelSize(normalized.voxelSize)) {
    throw new Error(`${ERROR_MESSAGES.INVALID_VOXEL_SIZE}: ${normalized.voxelSize}`);
  }
  
  // 透明度のバリデーション
  if (normalized.opacity !== undefined) {
    normalized.opacity = Math.max(0, Math.min(1, normalized.opacity));
  }
  
  if (normalized.emptyOpacity !== undefined) {
    normalized.emptyOpacity = Math.max(0, Math.min(1, normalized.emptyOpacity));
  }
  
  // 色のバリデーション
  if (normalized.minColor && Array.isArray(normalized.minColor) && normalized.minColor.length === 3) {
    normalized.minColor = normalized.minColor.map(c => Math.max(0, Math.min(255, Math.floor(c))));
  }
  
  if (normalized.maxColor && Array.isArray(normalized.maxColor) && normalized.maxColor.length === 3) {
    normalized.maxColor = normalized.maxColor.map(c => Math.max(0, Math.min(255, Math.floor(c))));
  }
  
  // v0.1.5: 新機能のバリデーション
  if (normalized.colorMap !== undefined) {
    const validColorMaps = ['custom', 'viridis', 'inferno'];
    if (!validColorMaps.includes(normalized.colorMap)) {
      Logger.warn(`Invalid colorMap: ${normalized.colorMap}. Using 'custom'.`);
      normalized.colorMap = 'custom';
    }
  }
  
  if (normalized.highlightTopN !== undefined && normalized.highlightTopN !== null) {
    if (typeof normalized.highlightTopN !== 'number' || normalized.highlightTopN <= 0) {
      Logger.warn(`Invalid highlightTopN: ${normalized.highlightTopN}. Must be a positive number.`);
      normalized.highlightTopN = null;
    }
  }
  
  // v0.1.6: 枠線重なり対策のバリデーション
  if (normalized.voxelGap !== undefined) {
    normalized.voxelGap = Math.max(0, Math.min(100, parseFloat(normalized.voxelGap) || 0));
  }
  
  if (normalized.outlineOpacity !== undefined) {
    normalized.outlineOpacity = Math.max(0, Math.min(1, parseFloat(normalized.outlineOpacity) || 1));
  }
  

  // (duplicate early clamp removed; see stricter clamp below)

  // v0.1.6.1: インセット枠線（ADR-0004）
  if (normalized.outlineInset !== undefined) {
    // 0〜100mの範囲にクランプ（安全上限）
    const inset = parseFloat(normalized.outlineInset);
    normalized.outlineInset = Math.max(0, Math.min(100, isNaN(inset) ? 0 : inset));
  }
  
  if (normalized.outlineInsetMode !== undefined) {
    const validInsetModes = ['all', 'topn'];
    if (!validInsetModes.includes(normalized.outlineInsetMode)) {
      Logger.warn(`Invalid outlineInsetMode: ${normalized.outlineInsetMode}. Using 'all'.`);
      normalized.outlineInsetMode = 'all';
    }
  }
  
  // 厚い枠線表示
  if (normalized.enableThickFrames !== undefined) {
    normalized.enableThickFrames = Boolean(normalized.enableThickFrames);
  }
  
  // v0.1.9: 適応的レンダリング制限のバリデーション
  if (normalized.renderLimitStrategy !== undefined) {
    const validStrategies = ['density', 'coverage', 'hybrid'];
    if (!validStrategies.includes(normalized.renderLimitStrategy)) {
      Logger.warn(`Invalid renderLimitStrategy: ${normalized.renderLimitStrategy}. Using 'density'.`);
      normalized.renderLimitStrategy = 'density';
    }
  }
  if (normalized.minCoverageRatio !== undefined) {
    const v = parseFloat(normalized.minCoverageRatio);
    normalized.minCoverageRatio = isNaN(v) ? 0.2 : Math.max(0, Math.min(1, v));
  }
  if (normalized.coverageBinsXY !== undefined) {
    const v = normalized.coverageBinsXY;
    if (v !== 'auto') {
      const n = parseInt(v, 10);
      if (!Number.isFinite(n) || n <= 0) {
        Logger.warn(`Invalid coverageBinsXY: ${v}. Using 'auto'.`);
        normalized.coverageBinsXY = 'auto';
      } else {
        normalized.coverageBinsXY = n;
      }
    }
  }
  
  // v0.1.9: 自動ボクセルサイズ決定の強化
  if (normalized.autoVoxelSizeMode !== undefined) {
    const validModes = ['basic', 'occupancy'];
    if (!validModes.includes(normalized.autoVoxelSizeMode)) {
      Logger.warn(`Invalid autoVoxelSizeMode: ${normalized.autoVoxelSizeMode}. Using 'basic'.`);
      normalized.autoVoxelSizeMode = 'basic';
    }
  }
  if (normalized.autoVoxelTargetFill !== undefined) {
    const v = parseFloat(normalized.autoVoxelTargetFill);
    normalized.autoVoxelTargetFill = isNaN(v) ? 0.6 : Math.max(0, Math.min(1, v));
  }
  
  // v0.1.9: Auto Render Budget
  if (normalized.renderBudgetMode !== undefined) {
    const validModes = ['manual', 'auto'];
    if (!validModes.includes(normalized.renderBudgetMode)) {
      Logger.warn(`Invalid renderBudgetMode: ${normalized.renderBudgetMode}. Using 'manual'.`);
      normalized.renderBudgetMode = 'manual';
    }
  }
  
  // v0.1.10: fitViewOptions API統一 (ADR-0008 Phase 4)
  if (normalized.fitViewOptions !== undefined) {
    const f = normalized.fitViewOptions || {};
    const padding = parseFloat(f.paddingPercent);
    // 後方互換性: pitch/heading → pitchDegrees/headingDegrees
    const pitch = parseFloat(f.pitchDegrees ?? f.pitch);
    const heading = parseFloat(f.headingDegrees ?? f.heading);
    const altitudeStrategy = f.altitudeStrategy;
    
    // 旧API使用時の移行警告
    if (f.pitch !== undefined || f.heading !== undefined) {
      Logger.warn('fitViewOptions.pitch/heading は v0.1.11 で削除予定です。pitchDegrees/headingDegrees を使用してください。');
    }
    
    normalized.fitViewOptions = {
      paddingPercent: Number.isFinite(padding) ? Math.max(0, Math.min(1, padding)) : 0.1,
      pitchDegrees: Number.isFinite(pitch) ? Math.max(-90, Math.min(0, pitch)) : -30,
      headingDegrees: Number.isFinite(heading) ? heading : 0,
      altitudeStrategy: altitudeStrategy === 'manual' ? 'manual' : 'auto'
    };
  }
  
  return normalized;
}

/**
 * Estimate initial voxel size based on data bounds and entity count.
 * データ範囲とエンティティ数に基づいて初期ボクセルサイズを推定します。
 * @param {Object} bounds - Bounds info / 境界情報
 * @param {number} entityCount - Number of entities / エンティティ数
 * @param {Object} options - Calculation options / 計算オプション
 * @returns {number} Estimated voxel size in meters / 推定ボクセルサイズ（メートル）
 * @deprecated Use VoxelSizeEstimator.estimate() instead
 */
export function estimateInitialVoxelSize(bounds, entityCount, options = {}) {
  const mode = options.autoVoxelSizeMode || 'basic';
  return VoxelSizeEstimator.estimate(null, bounds, mode, { ...options, entityCount });
}

/**
 * Calculate data range from bounds
 * 境界からデータ範囲を計算
 * @param {Object} bounds - Bounds info / 境界情報
 * @returns {Object} Data range {x, y, z} in meters / データ範囲（メートル）
 * @deprecated Use VoxelSizeEstimator.calculateDataRange() instead
 */
export function calculateDataRange(bounds) {
  return VoxelSizeEstimator.calculateDataRange(bounds);
}

// Note: Occupancy-based voxel size estimation was moved to VoxelSizeEstimator.
// This module intentionally avoids duplicating estimation logic.
