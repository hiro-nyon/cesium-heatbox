/**
 * Voxel Size Estimator for automatic voxel size calculation.
 * ボクセルサイズ自動計算用推定機
 */

import { Logger } from './logger.js';
import { PERFORMANCE_LIMITS } from './constants.js';

/**
 * Voxel Size Estimator class for calculating optimal voxel sizes
 * 最適なボクセルサイズを計算するための推定機クラス
 */
export class VoxelSizeEstimator {
  /**
   * Estimate optimal voxel size
   * 最適なボクセルサイズを推定
   * @param {Array} data - Data points / データポイント
   * @param {Object} bounds - Data bounds / データ境界
   * @param {string} mode - Estimation mode: 'basic' | 'occupancy' / 推定モード
   * @param {Object} options - Estimation options / 推定オプション
   * @returns {number} Estimated voxel size in meters / 推定ボクセルサイズ（メートル）
   */
  static estimate(data, bounds, mode = 'basic', options = {}) {
    try {
      // Support backward compatibility with entityCount in options
      const entityCount = options.entityCount !== undefined ? options.entityCount : (data ? data.length : 0);
      
      if (mode === 'occupancy') {
        return VoxelSizeEstimator.estimateByOccupancy(bounds, entityCount, options);
      } else {
        return VoxelSizeEstimator.estimateBasic(bounds, entityCount);
      }
    } catch (error) {
      Logger.warn('Voxel size estimation failed:', error);
      return 20; // デフォルトサイズ
    }
  }

  /**
   * Basic voxel size estimation (existing algorithm)
   * 基本的なボクセルサイズ推定（既存アルゴリズム）
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {number} entityCount - Number of entities / エンティティ数
   * @returns {number} Estimated voxel size in meters / 推定ボクセルサイズ（メートル）
   */
  static estimateBasic(bounds, entityCount) {
    // 1. データ範囲（X/Y/Z軸の物理的範囲）を計算
    const dataRange = VoxelSizeEstimator.calculateDataRange(bounds);
    
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
   * Occupancy-based voxel size estimation with iterative approximation
   * 占有率ベースのボクセルサイズ推定（反復近似）
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {number} entityCount - Number of entities / エンティティ数
   * @param {Object} options - Calculation options / 計算オプション
   * @returns {number} Estimated voxel size in meters / 推定ボクセルサイズ（メートル）
   */
  static estimateByOccupancy(bounds, entityCount, options) {
    const dataRange = VoxelSizeEstimator.calculateDataRange(bounds);
    const maxRenderVoxels = options.maxRenderVoxels || 50000;
    const targetFill = options.autoVoxelTargetFill || 0.6;
    const maxIterations = 10;
    const tolerance = 0.05; // 5%の許容誤差
    
    // 初期推定値（基本アルゴリズムから）
    let currentSize = VoxelSizeEstimator.estimateBasic(bounds, entityCount);
    
    Logger.debug(`Starting occupancy-based estimation: N=${entityCount}, target=${targetFill}, maxVoxels=${maxRenderVoxels}`);
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // 現在のサイズでの総ボクセル数を計算
      const numVoxelsX = Math.ceil(dataRange.x / currentSize);
      const numVoxelsY = Math.ceil(dataRange.y / currentSize);
      const numVoxelsZ = Math.ceil(dataRange.z / currentSize);
      const totalVoxels = numVoxelsX * numVoxelsY * numVoxelsZ;
      
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
      
      // サイズ調整（Newton法的なアプローチ）
      if (currentFill > targetFill) {
        // 占有率が高すぎる → サイズを大きくしてボクセル数を減らす
        currentSize *= Math.pow(currentFill / targetFill, 0.3);
      } else {
        // 占有率が低すぎる → サイズを小さくしてボクセル数を増やす
        currentSize *= Math.pow(currentFill / targetFill, 0.3);
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
   * Calculate data range from bounds
   * 境界からデータ範囲を計算
   * @param {Object} bounds - Bounds info / 境界情報
   * @returns {Object} Data range {x, y, z} in meters / データ範囲（メートル）
   */
  static calculateDataRange(bounds) {
    // Support both Cesium.Rectangle-like bounds (west/east/south/north in radians)
    // and library-internal bounds (minLon/maxLon/minLat/maxLat in degrees).
    const hasDeg = typeof bounds.minLon === 'number' && typeof bounds.maxLon === 'number';
    const hasRad = typeof bounds.west === 'number' && typeof bounds.east === 'number';

    const minLon = hasDeg
      ? bounds.minLon
      : hasRad ? (bounds.west * 180 / Math.PI) : 0;
    const maxLon = hasDeg
      ? bounds.maxLon
      : hasRad ? (bounds.east * 180 / Math.PI) : 0;
    const minLat = hasDeg
      ? bounds.minLat
      : hasRad ? (bounds.south * 180 / Math.PI) : 0;
    const maxLat = hasDeg
      ? bounds.maxLat
      : hasRad ? (bounds.north * 180 / Math.PI) : 0;
    const minAlt = (typeof bounds.minAlt === 'number') ? bounds.minAlt : (bounds.minimumHeight || 0);
    const maxAlt = (typeof bounds.maxAlt === 'number') ? bounds.maxAlt : (bounds.maximumHeight || 100);
    
    // 経度・緯度範囲をメートルに概算変換
    // 緯度1度 ≈ 111,000m、経度は緯度により変動するが中央緯度で近似
    const centerLat = (minLat + maxLat) / 2;
    const lonRangeMeters = (maxLon - minLon) * 111000 * Math.cos(centerLat * Math.PI / 180);
    const latRangeMeters = (maxLat - minLat) * 111000;
    const altRangeMeters = Math.abs(maxAlt - minAlt);
    
    return {
      x: Math.abs(lonRangeMeters),
      y: Math.abs(latRangeMeters),
      z: Math.abs(altRangeMeters)
    };
  }

  /**
   * Get estimation metadata
   * 推定メタデータを取得
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {number} entityCount - Number of entities / エンティティ数
   * @param {string} mode - Estimation mode / 推定モード
   * @returns {Object} Estimation metadata / 推定メタデータ
   */
  static getEstimationMetadata(bounds, entityCount, mode) {
    const dataRange = VoxelSizeEstimator.calculateDataRange(bounds);
    const volume = dataRange.x * dataRange.y * Math.max(dataRange.z, 10);
    const density = entityCount / volume;
    
    return {
      mode,
      entityCount,
      dataRange,
      volume,
      density,
      densityCategory: density > 0.001 ? 'high' : density > 0.0001 ? 'medium' : 'low'
    };
  }
}
