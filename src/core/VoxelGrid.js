/**
 * ボクセルグリッドを管理するクラス（シンプル実装）
 */
import { Logger } from '../utils/logger.js';

/**
 * 3Dボクセルグリッドを管理するクラス
 */
export class VoxelGrid {
  /**
   * 境界情報とボクセルサイズからグリッドを作成（シンプル版）
   * @param {Object} bounds - 境界情報
   * @param {number} voxelSizeMeters - 目標ボクセルサイズ（メートル）。実セルサイズは各軸で範囲/分割数。
   * @returns {Object} グリッド情報 { numVoxelsX, numVoxelsY, numVoxelsZ, totalVoxels, voxelSizeMeters, cellSizeX, cellSizeY, cellSizeZ, lonRangeMeters, latRangeMeters, altRangeMeters }
   */
  static createGrid(bounds, voxelSizeMeters) {
    // 緯度・経度をメートルに概算変換（シンプルな公式）
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const lonRangeMeters = (bounds.maxLon - bounds.minLon) * 111000 * Math.cos(centerLat * Math.PI / 180);
    const latRangeMeters = (bounds.maxLat - bounds.minLat) * 111000;
    const altRangeMeters = bounds.maxAlt - bounds.minAlt;
    
    // 各軸のボクセル数を計算
    const numVoxelsX = Math.max(1, Math.ceil(lonRangeMeters / voxelSizeMeters));
    const numVoxelsY = Math.max(1, Math.ceil(latRangeMeters / voxelSizeMeters));
    const numVoxelsZ = Math.max(1, Math.ceil(altRangeMeters / voxelSizeMeters));

    // 実際の各軸セルサイズ（メートル）
    // ceil により分割数が増える場合があるため、実セルサイズは指定サイズ以下になる。
    const cellSizeX = numVoxelsX > 0 ? (lonRangeMeters / numVoxelsX) : voxelSizeMeters;
    const cellSizeY = numVoxelsY > 0 ? (latRangeMeters / numVoxelsY) : voxelSizeMeters;
    // 高度差が極小の場合に0にならないよう最低1mを確保
    const cellSizeZ = numVoxelsZ > 0 ? Math.max(altRangeMeters / numVoxelsZ, 1) : Math.max(voxelSizeMeters, 1);
    
    const totalVoxels = numVoxelsX * numVoxelsY * numVoxelsZ;
    
    Logger.debug('VoxelGrid created:', {
      numVoxelsX,
      numVoxelsY,
      numVoxelsZ,
      totalVoxels,
      voxelSizeMeters,
      cellSizeX,
      cellSizeY,
      cellSizeZ,
      lonRangeMeters,
      latRangeMeters,
      altRangeMeters
    });
    
    return {
      numVoxelsX,
      numVoxelsY,
      numVoxelsZ,
      totalVoxels,
      voxelSizeMeters,
      cellSizeX,
      cellSizeY,
      cellSizeZ,
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
}
