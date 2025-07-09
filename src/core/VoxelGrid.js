/**
 * ボクセルグリッドを管理するクラス
 */

import { CoordinateTransformer } from './CoordinateTransformer.js';

/**
 * 3Dボクセルグリッドを管理するクラス
 */
export class VoxelGrid {
  /**
   * 境界情報とボクセルサイズからグリッドを作成
   * @param {Object} bounds - 境界情報
   * @param {number} voxelSizeMeters - ボクセルサイズ（メートル）
   * @returns {Object} グリッド情報
   */
  static createGrid(bounds, voxelSizeMeters) {
    const rangeInfo = CoordinateTransformer.calculateMetersRange(bounds);
    const { lonRangeMeters, latRangeMeters, altRangeMeters } = rangeInfo;
    
    // 各軸のボクセル数を計算（範囲を内包する最小のボクセル数）
    const numVoxelsX = Math.ceil(lonRangeMeters / voxelSizeMeters);
    const numVoxelsY = Math.ceil(latRangeMeters / voxelSizeMeters);
    const numVoxelsZ = Math.ceil(altRangeMeters / voxelSizeMeters);
    
    const totalVoxels = numVoxelsX * numVoxelsY * numVoxelsZ;
    
    return {
      numVoxelsX,
      numVoxelsY,
      numVoxelsZ,
      totalVoxels,
      voxelSizeMeters,
      lonRangeMeters,
      latRangeMeters,
      altRangeMeters
    };
  }
  
  /**
   * ボクセルインデックスからキーを生成
   * @param {number} x - X軸インデックス
   * @param {number} y - Y軸インデックス
   * @param {number} z - Z軸インデックス
   * @returns {string} ボクセルキー
   */
  static getVoxelKey(x, y, z) {
    return `${x},${y},${z}`;
  }
  
  /**
   * ボクセルキーからインデックスを解析
   * @param {string} key - ボクセルキー
   * @returns {Object} インデックス {x, y, z}
   */
  static parseVoxelKey(key) {
    const [x, y, z] = key.split(',').map(Number);
    return { x, y, z };
  }
  
  /**
   * ボクセルインデックスが有効な範囲内かチェック
   * @param {number} x - X軸インデックス
   * @param {number} y - Y軸インデックス
   * @param {number} z - Z軸インデックス
   * @param {Object} grid - グリッド情報
   * @returns {boolean} 有効な場合はtrue
   */
  static isValidVoxelIndex(x, y, z, grid) {
    const { numVoxelsX, numVoxelsY, numVoxelsZ } = grid;
    
    return (
      x >= 0 && x < numVoxelsX &&
      y >= 0 && y < numVoxelsY &&
      z >= 0 && z < numVoxelsZ
    );
  }
  
  /**
   * 指定されたボクセルの隣接ボクセルを取得
   * @param {number} x - X軸インデックス
   * @param {number} y - Y軸インデックス
   * @param {number} z - Z軸インデックス
   * @param {Object} grid - グリッド情報
   * @returns {Array} 隣接ボクセルのインデックス配列
   */
  static getNeighborVoxels(x, y, z, grid) {
    const neighbors = [];
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;
          
          if (this.isValidVoxelIndex(nx, ny, nz, grid)) {
            neighbors.push({ x: nx, y: ny, z: nz });
          }
        }
      }
    }
    
    return neighbors;
  }
  
  /**
   * グリッド内の全ボクセルを反復処理
   * @param {Object} grid - グリッド情報
   * @param {Function} callback - 各ボクセルに対するコールバック関数
   */
  static iterateAllVoxels(grid, callback) {
    const { numVoxelsX, numVoxelsY, numVoxelsZ } = grid;
    
    for (let x = 0; x < numVoxelsX; x++) {
      for (let y = 0; y < numVoxelsY; y++) {
        for (let z = 0; z < numVoxelsZ; z++) {
          const key = this.getVoxelKey(x, y, z);
          callback(x, y, z, key);
        }
      }
    }
  }
  
  /**
   * ボクセルの物理的な境界を計算
   * @param {number} x - X軸インデックス
   * @param {number} y - Y軸インデックス
   * @param {number} z - Z軸インデックス
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   * @returns {Object} ボクセルの境界情報
   */
  static getVoxelBounds(x, y, z, bounds, grid) {
    const { minLon, maxLon, minLat, maxLat, minAlt, maxAlt } = bounds;
    const { numVoxelsX, numVoxelsY, numVoxelsZ } = grid;
    
    // ボクセルの境界を計算
    const lonStep = (maxLon - minLon) / numVoxelsX;
    const latStep = (maxLat - minLat) / numVoxelsY;
    const altStep = (maxAlt - minAlt) / numVoxelsZ;
    
    return {
      minLon: minLon + x * lonStep,
      maxLon: minLon + (x + 1) * lonStep,
      minLat: minLat + y * latStep,
      maxLat: minLat + (y + 1) * latStep,
      minAlt: minAlt + z * altStep,
      maxAlt: minAlt + (z + 1) * altStep
    };
  }
}
