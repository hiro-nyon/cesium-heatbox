/**
 * Validation utility functions.
 * バリデーション関連のユーティリティ関数。
 */

import * as Cesium from 'cesium';
import { PERFORMANCE_LIMITS, ERROR_MESSAGES } from './constants.js';
import { Logger } from './logger.js';

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
  
  if (normalized.outlineWidthResolver !== undefined && normalized.outlineWidthResolver !== null) {
    if (typeof normalized.outlineWidthResolver !== 'function') {
      Logger.warn('outlineWidthResolver must be a function. Ignoring.');
      normalized.outlineWidthResolver = null;
    }
  }

  // v0.1.6+: 太線エミュレーションモード
  if (normalized.outlineEmulation !== undefined) {
    const validModes = ['off', 'topn', 'non-topn', 'all'];
    if (!validModes.includes(normalized.outlineEmulation)) {
      Logger.warn(`Invalid outlineEmulation: ${normalized.outlineEmulation}. Using 'off'.`);
      normalized.outlineEmulation = 'off';
    }
  }

  // v0.1.6.1 (ADR-0004): インセット枠線
  if (normalized.outlineInset !== undefined) {
    const v = parseFloat(normalized.outlineInset);
    normalized.outlineInset = isNaN(v) || v < 0 ? 0 : v;
  }
  if (normalized.outlineInsetMode !== undefined) {
    const validModes = ['all', 'topn'];
    if (!validModes.includes(normalized.outlineInsetMode)) {
      Logger.warn(`Invalid outlineInsetMode: ${normalized.outlineInsetMode}. Using 'all'.`);
      normalized.outlineInsetMode = 'all';
    }
  }

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
  
  return normalized;
}

/**
 * Estimate initial voxel size based on data range.
 * データ範囲に基づいて初期ボクセルサイズを推定します。
 * @param {Object} bounds - Bounds info / 境界情報
 * @param {number} entityCount - Number of entities / エンティティ数
 * @returns {number} Estimated voxel size in meters / 推定ボクセルサイズ（メートル）
 */
export function estimateInitialVoxelSize(bounds, entityCount) {
  try {
    // 1. データ範囲（X/Y/Z軸の物理的範囲）を計算
    const dataRange = calculateDataRange(bounds);
    
    // 2. エンティティ密度を推定
    const volume = dataRange.x * dataRange.y * Math.max(dataRange.z, 10); // 最小高度差10m
    const density = entityCount / volume; // エンティティ/立方メートル
    
    // 3. 密度に応じて適切なボクセルサイズを推定
    // - 高密度: 細かいサイズ（10-20m）
    // - 中密度: 標準サイズ（20-50m）
    // - 低密度: 粗いサイズ（50-100m）
    let estimatedSize;
    
    if (density > 0.001) {
      // 高密度：細かいサイズ
      estimatedSize = Math.max(10, Math.min(20, 20 / Math.sqrt(density * 1000)));
    } else if (density > 0.0001) {
      // 中密度：標準サイズ
      estimatedSize = Math.max(20, Math.min(50, 50 / Math.sqrt(density * 10000)));
    } else {
      // 低密度：粗いサイズ
      estimatedSize = Math.max(50, Math.min(100, 100 / Math.sqrt(density * 100000)));
    }
    
    // 制限値内に収める
    estimatedSize = Math.max(PERFORMANCE_LIMITS.minVoxelSize, 
                            Math.min(PERFORMANCE_LIMITS.maxVoxelSize, estimatedSize));
    
    Logger.debug(`Estimated voxel size: ${estimatedSize}m (density: ${density}, volume: ${volume})`);
    return Math.round(estimatedSize);
    
  } catch (error) {
    Logger.warn('Initial voxel size estimation failed:', error);
    return 20; // デフォルトサイズ
  }
}

/**
 * 境界からデータ範囲を計算
 * @param {Object} bounds - 境界情報
 * @returns {Object} データ範囲 {x, y, z}（メートル）
 */
export function calculateDataRange(bounds) {
  try {
    // 緯度経度をメートルに変換（簡易変換）
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const cosLat = Math.cos(centerLat * Math.PI / 180);
    
    const lonRangeMeters = (bounds.maxLon - bounds.minLon) * 111000 * cosLat;
    const latRangeMeters = (bounds.maxLat - bounds.minLat) * 111000;
    const altRangeMeters = Math.max(bounds.maxAlt - bounds.minAlt, 1); // 最小1m
    
    return {
      x: Math.max(lonRangeMeters, 1),
      y: Math.max(latRangeMeters, 1),
      z: altRangeMeters
    };
    
  } catch (error) {
    Logger.warn('Data range calculation failed:', error);
    // フォールバック値
    return { x: 1000, y: 1000, z: 100 };
  }
}
