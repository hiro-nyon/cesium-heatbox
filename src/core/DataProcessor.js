/**
 * データ処理を担当するクラス（シンプル実装）
 */
import * as Cesium from 'cesium';
import { VoxelGrid } from './VoxelGrid.js';

/**
 * エンティティデータの処理を担当するクラス
 */
export class DataProcessor {
  /**
   * エンティティをボクセルに分類（シンプル実装）
   * @param {Array} entities - エンティティ配列
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   * @returns {Map} ボクセルデータ（キー: ボクセルキー, 値: ボクセル情報）
   */
  static classifyEntitiesIntoVoxels(entities, bounds, grid) {
    const voxelData = new Map();
    let processedCount = 0;
    let skippedCount = 0;
    
    console.log(`Processing ${entities.length} entities for classification`);
    
    const currentTime = Cesium.JulianDate.now();
    
    entities.forEach((entity, index) => {
      try {
        // エンティティの位置を取得（シンプルなアプローチ）
        let position;
        if (entity.position) {
          if (typeof entity.position.getValue === 'function') {
            position = entity.position.getValue(currentTime);
          } else {
            position = entity.position;
          }
        }
        
        if (!position) {
          skippedCount++;
          return; // 位置がない場合はスキップ
        }
        
        // Cartesian3からCartographicに変換
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        if (!cartographic) {
          skippedCount++;
          return;
        }
        
        // 地理座標に変換
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const alt = cartographic.height;
        
        // 範囲外チェック（少しマージンを持たせる）
        if (lon < bounds.minLon - 0.001 || lon > bounds.maxLon + 0.001 ||
            lat < bounds.minLat - 0.001 || lat > bounds.maxLat + 0.001 ||
            alt < bounds.minAlt - 1 || alt > bounds.maxAlt + 1) {
          skippedCount++;
          return;
        }
        
        // ボクセルインデックスを計算（直接的な方法）
        const voxelX = Math.floor(
          (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) * grid.numVoxelsX
        );
        const voxelY = Math.floor(
          (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) * grid.numVoxelsY
        );
        const voxelZ = Math.floor(
          (alt - bounds.minAlt) / (bounds.maxAlt - bounds.minAlt) * grid.numVoxelsZ
        );
        
        // インデックスが有効範囲内かチェック
        if (voxelX >= 0 && voxelX < grid.numVoxelsX &&
            voxelY >= 0 && voxelY < grid.numVoxelsY &&
            voxelZ >= 0 && voxelZ < grid.numVoxelsZ) {
            
          const voxelKey = VoxelGrid.getVoxelKey(voxelX, voxelY, voxelZ);
          
          if (!voxelData.has(voxelKey)) {
            voxelData.set(voxelKey, {
              x: voxelX,
              y: voxelY,
              z: voxelZ,
              entities: [],
              count: 0
            });
          }
          
          const voxelInfo = voxelData.get(voxelKey);
          voxelInfo.entities.push(entity);
          voxelInfo.count++;
          
          processedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.warn(`エンティティ ${index} の処理に失敗:`, error);
        skippedCount++;
      }
    });
    
    console.log(`${processedCount}個のエンティティを${voxelData.size}個のボクセルに分類（${skippedCount}個はスキップ）`);
    return voxelData;
  }
  
  /**
   * ボクセルデータから統計情報を計算
   * @param {Map} voxelData - ボクセルデータ
   * @param {Object} grid - グリッド情報
   * @returns {Object} 統計情報
   */
  static calculateStatistics(voxelData, grid) {
    if (voxelData.size === 0) {
      return {
        totalVoxels: grid.totalVoxels,
        nonEmptyVoxels: 0,
        emptyVoxels: grid.totalVoxels,
        totalEntities: 0,
        minCount: 0,
        maxCount: 0,
        averageCount: 0
      };
    }
    
    const counts = Array.from(voxelData.values()).map(voxel => voxel.count);
    const totalEntities = counts.reduce((sum, count) => sum + count, 0);
    
    const stats = {
      totalVoxels: grid.totalVoxels,
      nonEmptyVoxels: voxelData.size,
      emptyVoxels: grid.totalVoxels - voxelData.size,
      totalEntities: totalEntities,
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts),
      averageCount: totalEntities / voxelData.size
    };
    
    console.log('統計情報計算完了:', stats);
    return stats;
  }
  
  /**
   * 上位N個のボクセルを取得
   * @param {Map} voxelData - ボクセルデータ
   * @param {number} topN - 取得する上位の数
   * @returns {Array} 上位N個のボクセル情報
   */
  static getTopNVoxels(voxelData, topN) {
    if (voxelData.size === 0 || topN <= 0) {
      return [];
    }
    
    // ボクセルを密度でソート
    const sortedVoxels = Array.from(voxelData.values())
      .sort((a, b) => b.count - a.count);
    
    // 上位N個を返す
    return sortedVoxels.slice(0, Math.min(topN, sortedVoxels.length));
  }
}