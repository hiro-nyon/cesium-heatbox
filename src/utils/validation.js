/**
 * Validation utility functions.
 * バリデーション関連のユーティリティ関数。
 */

import * as Cesium from 'cesium';
import { PERFORMANCE_LIMITS, ERROR_MESSAGES } from './constants.js';
import { Logger } from './logger.js';
import { warnOnce } from './deprecate.js';
import { applyProfile, isValidProfile } from './profiles.js';

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
    
    // Safe calculation with bounds checking
    const ratio = totalVoxels / PERFORMANCE_LIMITS.maxVoxels;
    const scaleFactor = Math.pow(Math.max(1, Math.min(1000, ratio)), 1/3);
    const calculatedSize = voxelSize * scaleFactor;
    
    result.recommendedSize = Math.ceil(
      Math.max(PERFORMANCE_LIMITS.minVoxelSize, 
               Math.min(PERFORMANCE_LIMITS.maxVoxelSize, calculatedSize))
    );
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
  // v0.1.12: Apply profile if specified (before normalization)
  let mergedOptions = options;
  if (options.profile && options.profile !== 'none') {
    if (isValidProfile(options.profile)) {
      Logger.debug(`Applying profile: ${options.profile}`);
      mergedOptions = applyProfile(options.profile, options);
      // Remove profile property after application
      delete mergedOptions.profile;
    } else {
      Logger.warn(`Invalid profile name: ${options.profile}. Available profiles: mobile-fast, desktop-balanced, dense-data, sparse-data`);
    }
  }

  const normalized = { ...mergedOptions };
  
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
  
  // v0.1.12: Deprecated Resolver systems - show warnings and remove
  if (normalized.outlineWidthResolver !== undefined && normalized.outlineWidthResolver !== null) {
    warnOnce('outlineWidthResolver',
      '[Heatbox][DEPRECATION][v0.2.0] outlineWidthResolver is deprecated; prefer adaptiveOutlines with outlineWidthPreset and adaptiveParams.');
    if (typeof normalized.outlineWidthResolver !== 'function') {
      Logger.warn('outlineWidthResolver must be a function. Ignoring.');
      normalized.outlineWidthResolver = null;
    }
  }
  
  // v0.2.0 planned: Resolver deprecation. For now, warn but keep for compatibility.
  if (normalized.outlineOpacityResolver !== undefined && normalized.outlineOpacityResolver !== null) {
    warnOnce('outlineOpacityResolver',
      '[Heatbox][DEPRECATION][v0.2.0] outlineOpacityResolver is deprecated; prefer adaptiveOutlines with adaptiveParams.outlineOpacityRange.');
    if (typeof normalized.outlineOpacityResolver !== 'function') {
      Logger.warn('outlineOpacityResolver must be a function. Ignoring.');
      normalized.outlineOpacityResolver = null;
    }
  }
  
  if (normalized.boxOpacityResolver !== undefined && normalized.boxOpacityResolver !== null) {
    warnOnce('boxOpacityResolver',
      '[Heatbox][DEPRECATION][v0.2.0] boxOpacityResolver is deprecated; prefer adaptiveOutlines with adaptiveParams.boxOpacityRange.');
    if (typeof normalized.boxOpacityResolver !== 'function') {
      Logger.warn('boxOpacityResolver must be a function. Ignoring.');
      normalized.boxOpacityResolver = null;
    }
  }

  // v0.1.12: outlineEmulation deprecation and migration to outlineRenderMode  
  if (normalized.outlineEmulation !== undefined && (normalized.outlineRenderMode === undefined || normalized.outlineRenderMode === 'standard')) {
    warnOnce('outlineEmulation',
      '[Heatbox][DEPRECATION][v0.2.0] outlineEmulation is deprecated; use outlineRenderMode and emulationScope instead.');
    
    const v = normalized.outlineEmulation;
    if (v === false || v === 'off') {
      // outlineEmulation: false/off → standard mode + explicit off scope
      normalized.outlineRenderMode = 'standard';
      normalized.emulationScope = 'off';
    } else if (v === true || v === 'all') {
      // outlineEmulation: true/all → emulation-only mode
      normalized.outlineRenderMode = 'emulation-only';
      normalized.emulationScope = 'all';
    } else if (v === 'topn') {
      // outlineEmulation: topn → standard mode + emulation for topn
      normalized.outlineRenderMode = 'standard';
      normalized.emulationScope = 'topn';
    } else if (v === 'non-topn') {
      // outlineEmulation: non-topn → standard mode + emulation for non-topn
      normalized.outlineRenderMode = 'standard';
      normalized.emulationScope = 'non-topn';
    } else {
      Logger.warn(`Invalid outlineEmulation: ${v}. Using 'standard' mode.`);
      normalized.outlineRenderMode = 'standard';
    }
    
    // Remove old property
    delete normalized.outlineEmulation;
  }
  
  // v0.1.12: outlineWidthPreset legacy name mapping
  if (normalized.outlineWidthPreset !== undefined) {
    const preset = normalized.outlineWidthPreset;
    const legacyMap = { 'uniform': 'medium', 'adaptive-density': 'adaptive', 'topn-focus': 'thick' };
    
    if (legacyMap[preset]) {
      warnOnce(`outlineWidthPreset.${preset}`,
        `[Heatbox][DEPRECATION][v0.2.0] outlineWidthPreset "${preset}" is deprecated; use "${legacyMap[preset]}".`);
      normalized.outlineWidthPreset = legacyMap[preset];
    }
  }

  // v0.1.6.1 (ADR-0004): インセット枠線
  if (normalized.outlineInset !== undefined) {
    const v = parseFloat(normalized.outlineInset);
    normalized.outlineInset = isNaN(v) || v < 0 ? 0 : v;
  }
  if (normalized.outlineInsetMode !== undefined) {
    let mode = normalized.outlineInsetMode;
    if (mode === 'off') mode = 'none'; // legacy alias
    const validModes = ['all', 'topn', 'none'];
    if (!validModes.includes(mode)) {
      Logger.warn(`Invalid outlineInsetMode: ${normalized.outlineInsetMode}. Using 'all'.`);
      normalized.outlineInsetMode = 'all';
    } else {
      normalized.outlineInsetMode = mode;
    }
  }

  // v0.1.6.1: インセット枠線（ADR-0004）
  if (normalized.outlineInset !== undefined) {
    // 0〜100mの範囲にクランプ（安全上限）
    const inset = parseFloat(normalized.outlineInset);
    normalized.outlineInset = Math.max(0, Math.min(100, isNaN(inset) ? 0 : inset));
  }
  
  if (normalized.outlineInsetMode !== undefined) {
    let mode2 = normalized.outlineInsetMode;
    if (mode2 === 'off') mode2 = 'none'; // legacy alias
    const validInsetModes = ['all', 'topn', 'none'];
    if (!validInsetModes.includes(mode2)) {
      Logger.warn(`Invalid outlineInsetMode: ${normalized.outlineInsetMode}. Using 'all'.`);
      normalized.outlineInsetMode = 'all';
    } else {
      normalized.outlineInsetMode = mode2;
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
  
  // v0.1.9: 自動視点調整 fitView オプション
  if (normalized.fitViewOptions !== undefined) {
    const f = normalized.fitViewOptions || {};
    
    // v0.1.12: Deprecation warnings for old naming
    if (f.pitch !== undefined && f.pitchDegrees === undefined) {
      warnOnce('fitViewOptions.pitch',
        '[Heatbox][DEPRECATION][v0.2.0] fitViewOptions.pitch is deprecated; use fitViewOptions.pitchDegrees.');
    }
    if (f.heading !== undefined && f.headingDegrees === undefined) {
      warnOnce('fitViewOptions.heading',
        '[Heatbox][DEPRECATION][v0.2.0] fitViewOptions.heading is deprecated; use fitViewOptions.headingDegrees.');
    }
    
    const padding = parseFloat(f.paddingPercent);
    // Prioritize new names, fallback to old names
    const pitch = f.pitchDegrees !== undefined ? parseFloat(f.pitchDegrees) : parseFloat(f.pitch);
    const heading = f.headingDegrees !== undefined ? parseFloat(f.headingDegrees) : parseFloat(f.heading);
    const altitudeStrategy = f.altitudeStrategy;
    
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
 * Estimate initial voxel size based on data range.
 * データ範囲に基づいて初期ボクセルサイズを推定します。
 * @param {Object} bounds - Bounds info / 境界情報
 * @param {number} entityCount - Number of entities / エンティティ数
 * @param {Object} options - Calculation options / 計算オプション
 * @returns {number} Estimated voxel size in meters / 推定ボクセルサイズ（メートル）
 */
export function estimateInitialVoxelSize(bounds, entityCount, options = {}) {
  try {
    const mode = options.autoVoxelSizeMode || 'basic';
    
    if (mode === 'occupancy') {
      return estimateVoxelSizeByOccupancy(bounds, entityCount, options);
    } else {
      return estimateVoxelSizeBasic(bounds, entityCount);
    }
  } catch (error) {
    Logger.warn('Initial voxel size estimation failed:', error);
    return 20; // デフォルトサイズ
  }
}

/**
 * Basic voxel size estimation (existing algorithm).
 * 基本的なボクセルサイズ推定（既存アルゴリズム）
 * @param {Object} bounds - Bounds info / 境界情報
 * @param {number} entityCount - Number of entities / エンティティ数
 * @returns {number} Estimated voxel size in meters / 推定ボクセルサイズ（メートル）
 */
function estimateVoxelSizeBasic(bounds, entityCount) {
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
  
  Logger.debug(`Basic voxel size estimated: ${estimatedSize}m (density: ${density}, volume: ${volume})`);
  return Math.round(estimatedSize);
}

/**
 * Occupancy-based voxel size estimation with iterative approximation.
 * 占有率ベースのボクセルサイズ推定（反復近似）
 * @param {Object} bounds - Bounds info / 境界情報
 * @param {number} entityCount - Number of entities / エンティティ数
 * @param {Object} options - Calculation options / 計算オプション
 * @returns {number} Estimated voxel size in meters / 推定ボクセルサイズ（メートル）
 */
function estimateVoxelSizeByOccupancy(bounds, entityCount, options) {
  const dataRange = calculateDataRange(bounds);
  const maxRenderVoxels = options.maxRenderVoxels || 50000;
  const targetFill = options.autoVoxelTargetFill || 0.6;
  const maxIterations = 10;
  const tolerance = 0.05; // 5%の許容誤差
  
  // 初期推定値（基本アルゴリズムから）
  let currentSize = estimateVoxelSizeBasic(bounds, entityCount);
  
  Logger.debug(`Starting occupancy-based estimation: N=${entityCount}, target=${targetFill}, maxVoxels=${maxRenderVoxels}`);
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Safe bounds checking for currentSize
    if (!Number.isFinite(currentSize) || currentSize <= 0) {
      Logger.warn(`Invalid currentSize detected: ${currentSize}, using fallback`);
      currentSize = estimateVoxelSizeBasic(bounds, entityCount);
      if (!Number.isFinite(currentSize) || currentSize <= 0) {
        currentSize = PERFORMANCE_LIMITS.minVoxelSize;
      }
    }
    
    // 現在のサイズでの総ボクセル数を計算（安全性チェック付き）
    const numVoxelsX = Math.max(1, Math.ceil(Math.max(0, dataRange.x) / currentSize));
    const numVoxelsY = Math.max(1, Math.ceil(Math.max(0, dataRange.y) / currentSize));
    const numVoxelsZ = Math.max(1, Math.ceil(Math.max(0, dataRange.z) / currentSize));
    const totalVoxels = numVoxelsX * numVoxelsY * numVoxelsZ;
    
    // Safeguard against overflow
    if (!Number.isFinite(totalVoxels) || totalVoxels <= 0 || totalVoxels > 1e9) {
      Logger.warn(`Invalid totalVoxels calculated: ${totalVoxels}, breaking iteration`);
      break;
    }
    
    // 期待占有セル数の計算: E[occupied] ≈ M × (1 - exp(-N/M))
    const expectedOccupied = totalVoxels * (1 - Math.exp(-entityCount / totalVoxels));
    
    // 現在の占有率
    const currentFill = Math.min(expectedOccupied / maxRenderVoxels, 1.0);
    
    Logger.debug(`Iteration ${iteration}: size=${currentSize.toFixed(1)}m, totalVoxels=${totalVoxels}, expectedOccupied=${expectedOccupied.toFixed(0)}, fill=${currentFill.toFixed(3)}`);
    
    // 収束判定
    const fillError = Math.abs(currentFill - targetFill);
    if (fillError < tolerance) {
      Logger.debug(`Converged at iteration ${iteration}: size=${currentSize.toFixed(1)}m, fill=${currentFill.toFixed(3)}`);
      break;
    }
    
    // サイズ調整（Newton法的なアプローチ）- 安全な計算
    const fillRatio = Math.max(0.1, Math.min(10.0, currentFill / targetFill));
    const adjustmentFactor = Math.pow(fillRatio, 0.3);
    
    if (currentFill > targetFill) {
      // 占有率が高すぎる → サイズを大きくしてボクセル数を減らす
      currentSize *= adjustmentFactor;
    } else {
      // 占有率が低すぎる → サイズを小さくしてボクセル数を増やす
      currentSize *= adjustmentFactor;
    }
    
    // 制限値内に収める
    currentSize = Math.max(PERFORMANCE_LIMITS.minVoxelSize, 
                          Math.min(PERFORMANCE_LIMITS.maxVoxelSize, currentSize));
  }
  
  const finalSize = Math.round(currentSize);
  Logger.info(`Occupancy-based voxel size: ${finalSize}m (target fill: ${targetFill})`);
  
  return finalSize;
}

/**
 * 境界からデータ範囲を計算
 * @param {Object} bounds - 境界情報
 * @returns {Object} データ範囲 {x, y, z}（メートル）
 */
export function calculateDataRange(bounds) {
  try {
    // Validate bounds input
    const validBounds = {
      minLat: Number.isFinite(bounds.minLat) ? Math.max(-90, Math.min(90, bounds.minLat)) : 0,
      maxLat: Number.isFinite(bounds.maxLat) ? Math.max(-90, Math.min(90, bounds.maxLat)) : 0.1,
      minLon: Number.isFinite(bounds.minLon) ? Math.max(-180, Math.min(180, bounds.minLon)) : 0,
      maxLon: Number.isFinite(bounds.maxLon) ? Math.max(-180, Math.min(180, bounds.maxLon)) : 0.1,
      minAlt: Number.isFinite(bounds.minAlt) ? bounds.minAlt : 0,
      maxAlt: Number.isFinite(bounds.maxAlt) ? bounds.maxAlt : 100
    };
    
    // Ensure valid ranges
    if (validBounds.maxLat <= validBounds.minLat) {
      validBounds.maxLat = validBounds.minLat + 0.001; // ~100m
    }
    if (validBounds.maxLon <= validBounds.minLon) {
      validBounds.maxLon = validBounds.minLon + 0.001; // ~100m at equator
    }
    if (validBounds.maxAlt <= validBounds.minAlt) {
      validBounds.maxAlt = validBounds.minAlt + 1; // 1m minimum
    }
    
    // 緯度経度をメートルに変換（簡易変換）- 安全な計算
    const centerLat = (validBounds.minLat + validBounds.maxLat) / 2;
    const cosLat = Math.cos(Math.max(-Math.PI/2, Math.min(Math.PI/2, centerLat * Math.PI / 180)));
    
    const lonRangeMeters = Math.abs(validBounds.maxLon - validBounds.minLon) * 111000 * Math.abs(cosLat);
    const latRangeMeters = Math.abs(validBounds.maxLat - validBounds.minLat) * 111000;
    const altRangeMeters = Math.abs(validBounds.maxAlt - validBounds.minAlt);
    
    return {
      x: Math.max(1, Math.min(1e6, lonRangeMeters)), // 1m to 1000km bounds
      y: Math.max(1, Math.min(1e6, latRangeMeters)), 
      z: Math.max(1, Math.min(1e4, altRangeMeters))  // 1m to 10km altitude range
    };
    
  } catch (error) {
    Logger.warn('Data range calculation failed:', error);
    // フォールバック値
    return { x: 1000, y: 1000, z: 100 };
  }
}
