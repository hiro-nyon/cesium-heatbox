/**
 * Voxel geometry calculation utilities.
 * ボクセルの幾何計算ユーティリティ。
 */
import * as Cesium from 'cesium';

/**
 * Voxel geometry calculation utility class.
 * ボクセルの幾何計算を担当するユーティリティクラス。
 */
export class VoxelGeometry {
  /**
   * Calculate voxel center coordinates.
   * ボクセルの中心座標を計算します。
   * @param {number} x - X grid index / X軸グリッドインデックス
   * @param {number} y - Y grid index / Y軸グリッドインデックス  
   * @param {number} z - Z grid index / Z軸グリッドインデックス
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} grid - Grid info / グリッド情報
   * @returns {Object} Center coordinates / 中心座標
   */
  static calculateVoxelCenter(x, y, z, bounds, grid) {
    const centerLon = bounds.minLon + (x + 0.5) * (bounds.maxLon - bounds.minLon) / grid.numVoxelsX;
    const centerLat = bounds.minLat + (y + 0.5) * (bounds.maxLat - bounds.minLat) / grid.numVoxelsY;
    const centerAlt = bounds.minAlt + (z + 0.5) * (bounds.maxAlt - bounds.minAlt) / grid.numVoxelsZ;
    
    return {
      longitude: centerLon,
      latitude: centerLat,
      altitude: centerAlt
    };
  }

  /**
   * Calculate voxel center position as Cartesian3.
   * ボクセルの中心位置をCartesian3として計算します。
   * @param {number} x - X grid index / X軸グリッドインデックス
   * @param {number} y - Y grid index / Y軸グリッドインデックス  
   * @param {number} z - Z grid index / Z軸グリッドインデックス
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} grid - Grid info / グリッド情報
   * @returns {Cesium.Cartesian3} Center position / 中心位置
   */
  static calculateVoxelPosition(x, y, z, bounds, grid) {
    const center = VoxelGeometry.calculateVoxelCenter(x, y, z, bounds, grid);
    return Cesium.Cartesian3.fromDegrees(center.longitude, center.latitude, center.altitude);
  }

  /**
   * Calculate voxel cell sizes for each axis.
   * 各軸のボクセルセルサイズを計算します。
   * @param {Object} grid - Grid info / グリッド情報
   * @param {Object} options - Rendering options / 描画オプション
   * @returns {Object} Cell sizes / セルサイズ
   */
  static calculateVoxelSizes(grid, options = {}) {
    // 各軸のセルサイズ（グリッドが持つ実セルサイズを優先、なければvoxelSizeMetersにフォールバック）
    let cellSizeX = grid.cellSizeX || (grid.lonRangeMeters ? (grid.lonRangeMeters / grid.numVoxelsX) : grid.voxelSizeMeters);
    let cellSizeY = grid.cellSizeY || (grid.latRangeMeters ? (grid.latRangeMeters / grid.numVoxelsY) : grid.voxelSizeMeters);
    let baseCellSizeZ = grid.cellSizeZ || (grid.altRangeMeters ? Math.max(grid.altRangeMeters / Math.max(grid.numVoxelsZ, 1), 1) : Math.max(grid.voxelSizeMeters, 1));

    // v0.1.6.1: ボクセルギャップ適用
    if (options.voxelGap > 0) {
      const gapFactor = Math.max(0.1, 1 - options.voxelGap * 0.01);
      cellSizeX *= gapFactor;
      cellSizeY *= gapFactor;
      baseCellSizeZ *= gapFactor;
    }

    return {
      sizeX: cellSizeX,
      sizeY: cellSizeY,
      sizeZ: baseCellSizeZ
    };
  }

  /**
   * Calculate adjusted voxel height based on density.
   * 密度に基づいて調整されたボクセル高さを計算します。
   * @param {number} baseSizeZ - Base Z size / 基本Z軸サイズ
   * @param {number} normalizedDensity - Normalized density (0-1) / 正規化された密度
   * @param {boolean} heightBased - Height-based mode / 高さベースモード
   * @returns {number} Adjusted height / 調整された高さ
   */
  static calculateAdjustedHeight(baseSizeZ, normalizedDensity, heightBased = false) {
    if (!heightBased) {
      return baseSizeZ;
    }

    // 最小高さを保証しつつ密度に比例
    const minHeightRatio = 0.1; // 最小10%の高さは保証
    return baseSizeZ * (minHeightRatio + (1 - minHeightRatio) * normalizedDensity);
  }

  /**
   * Calculate voxel dimensions with all adjustments.
   * 全ての調整を適用したボクセル寸法を計算します。
   * @param {Object} grid - Grid info / グリッド情報
   * @param {number} normalizedDensity - Normalized density (0-1) / 正規化された密度
   * @param {Object} options - Rendering options / 描画オプション
   * @returns {Cesium.Cartesian3} Voxel dimensions / ボクセル寸法
   */
  static calculateVoxelDimensions(grid, normalizedDensity, options = {}) {
    const sizes = VoxelGeometry.calculateVoxelSizes(grid, options);
    const adjustedHeight = VoxelGeometry.calculateAdjustedHeight(
      sizes.sizeZ, 
      normalizedDensity, 
      options.heightBased
    );

    return new Cesium.Cartesian3(sizes.sizeX, sizes.sizeY, adjustedHeight);
  }

  /**
   * Calculate data bounds center.
   * データ境界の中心を計算します。
   * @param {Object} bounds - Data bounds / データ境界
   * @returns {Object} Center coordinates / 中心座標
   */
  static calculateBoundsCenter(bounds) {
    return {
      longitude: (bounds.minLon + bounds.maxLon) / 2,
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      altitude: (bounds.minAlt + bounds.maxAlt) / 2
    };
  }

  /**
   * Calculate data bounds center as Cartesian3.
   * データ境界の中心をCartesian3として計算します。
   * @param {Object} bounds - Data bounds / データ境界
   * @returns {Cesium.Cartesian3} Center position / 中心位置
   */
  static calculateBoundsCenterPosition(bounds) {
    const center = VoxelGeometry.calculateBoundsCenter(bounds);
    return Cesium.Cartesian3.fromDegrees(center.longitude, center.latitude, center.altitude);
  }
}
