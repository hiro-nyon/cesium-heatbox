/**
 * データ処理を担当するクラス
 */

import { CoordinateTransformer } from './CoordinateTransformer.js';
import { VoxelGrid } from './VoxelGrid.js';
import { hasValidPosition } from '../utils/validation.js';

/**
 * エンティティデータの処理を担当するクラス
 */
export class DataProcessor {
  /**
   * エンティティをボクセルに分類
   * @param {Array} entities - エンティティ配列
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   * @returns {Map} ボクセルデータ（キー: ボクセルキー, 値: ボクセル情報）
   */
  static classifyEntitiesIntoVoxels(entities, bounds, grid) {
    const voxelData = new Map();
    let processedCount = 0;
    
    for (const entity of entities) {
      if (!hasValidPosition(entity)) {
        continue;
      }
      
      const position = CoordinateTransformer.getEntityPosition(entity);
      if (!position) {
        continue;
      }
      
      try {
        // Cartesian3をCartographicに変換
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const alt = cartographic.height;
        
        // ボクセルインデックスを計算
        const voxelIndex = CoordinateTransformer.coordinateToVoxelIndex(lon, lat, alt, bounds, grid);
        const voxelKey = VoxelGrid.getVoxelKey(voxelIndex.x, voxelIndex.y, voxelIndex.z);
        
        // ボクセルデータに追加
        if (!voxelData.has(voxelKey)) {
          voxelData.set(voxelKey, {
            x: voxelIndex.x,
            y: voxelIndex.y,
            z: voxelIndex.z,
            entities: [],
            count: 0
          });
        }
        
        const voxelInfo = voxelData.get(voxelKey);
        voxelInfo.entities.push(entity);
        voxelInfo.count++;
        
        processedCount++;
      } catch (error) {
        console.warn('エンティティの処理に失敗:', error);
      }
    }
    
    console.log(`${processedCount}個のエンティティを${voxelData.size}個のボクセルに分類`);
    return voxelData;
  }
  
  /**
   * ボクセルデータから統計情報を計算
   * @param {Map} voxelData - ボクセルデータ
   * @param {Object} grid - グリッド情報
   * @returns {Object} 統計情報
   */
  static calculateStatistics(voxelData, grid) {
    const nonEmptyVoxels = voxelData.size;
    const emptyVoxels = grid.totalVoxels - nonEmptyVoxels;
    
    let totalEntities = 0;
    let minCount = Infinity;
    let maxCount = 0;
    
    for (const voxelInfo of voxelData.values()) {
      totalEntities += voxelInfo.count;
      minCount = Math.min(minCount, voxelInfo.count);
      maxCount = Math.max(maxCount, voxelInfo.count);
    }
    
    // 空ボクセルがある場合、最小値は0
    if (emptyVoxels > 0) {
      minCount = 0;
    }
    
    // 空ボクセルしかない場合の処理
    if (nonEmptyVoxels === 0) {
      minCount = 0;
    }
    
    const averageCount = nonEmptyVoxels > 0 ? totalEntities / nonEmptyVoxels : 0;
    
    return {
      totalVoxels: grid.totalVoxels,
      renderedVoxels: nonEmptyVoxels, // 初期値、実際の描画数は後で更新
      nonEmptyVoxels,
      emptyVoxels,
      totalEntities,
      minCount,
      maxCount,
      averageCount
    };
  }
  
  /**
   * ボクセルデータをフィルタリング
   * @param {Map} voxelData - ボクセルデータ
   * @param {Function} filterFunc - フィルタ関数
   * @returns {Map} フィルタリングされたボクセルデータ
   */
  static filterVoxelData(voxelData, filterFunc) {
    const filteredData = new Map();
    
    for (const [key, voxelInfo] of voxelData.entries()) {
      if (filterFunc(voxelInfo)) {
        filteredData.set(key, voxelInfo);
      }
    }
    
    return filteredData;
  }
  
  /**
   * 密度に基づいてボクセルデータをソート
   * @param {Map} voxelData - ボクセルデータ
   * @param {boolean} ascending - 昇順の場合はtrue
   * @returns {Array} ソートされたボクセル情報配列
   */
  static sortVoxelsByDensity(voxelData, ascending = false) {
    const voxels = Array.from(voxelData.values());
    
    return voxels.sort((a, b) => {
      return ascending ? a.count - b.count : b.count - a.count;
    });
  }
  
  /**
   * 上位N個のボクセルを取得
   * @param {Map} voxelData - ボクセルデータ
   * @param {number} topN - 取得する上位の数
   * @returns {Array} 上位N個のボクセル情報
   */
  static getTopNVoxels(voxelData, topN) {
    const sortedVoxels = this.sortVoxelsByDensity(voxelData, false);
    return sortedVoxels.slice(0, topN);
  }
  
  /**
   * 統計情報の詳細レポートを生成
   * @param {Object} statistics - 統計情報
   * @param {Map} voxelData - ボクセルデータ
   * @returns {Object} 詳細レポート
   */
  static generateDetailedReport(statistics, voxelData) {
    const densityDistribution = {};
    
    // 密度分布を計算
    for (const voxelInfo of voxelData.values()) {
      const count = voxelInfo.count;
      densityDistribution[count] = (densityDistribution[count] || 0) + 1;
    }
    
    // 密度の分位数を計算
    const sortedCounts = Array.from(voxelData.values())
      .map(v => v.count)
      .sort((a, b) => a - b);
    
    const getPercentile = (arr, percentile) => {
      const index = Math.floor(arr.length * percentile / 100);
      return arr[index] || 0;
    };
    
    return {
      ...statistics,
      densityDistribution,
      percentiles: {
        p25: getPercentile(sortedCounts, 25),
        p50: getPercentile(sortedCounts, 50),
        p75: getPercentile(sortedCounts, 75),
        p90: getPercentile(sortedCounts, 90),
        p95: getPercentile(sortedCounts, 95)
      }
    };
  }
}
