/**
 * データ処理を担当するクラス（シンプル実装）
 */
import * as Cesium from 'cesium';
import { VoxelGrid } from './VoxelGrid.js';
import { Logger } from '../utils/logger.js';

/**
 * Class responsible for processing entity data.
 * エンティティデータの処理を担当するクラス。
 */
export class DataProcessor {
  /**
   * Classify entities into voxels (simple implementation).
   * エンティティをボクセルに分類（シンプル実装）。
   * @param {Array} entities - Entity array / エンティティ配列
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {Object} grid - Grid info / グリッド情報
   * @returns {Map} Voxel data Map (key: voxel key, value: info) / ボクセルデータ（キー: ボクセルキー, 値: ボクセル情報）
   */
  static classifyEntitiesIntoVoxels(entities, bounds, grid) {
    const voxelData = new Map();
    let processedCount = 0;
    let skippedCount = 0;
    
    Logger.debug(`Processing ${entities.length} entities for classification`);
    
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
        
        // Cartesian3からCartographicに変換（テスト環境向けフォールバックあり）
        let lon, lat, alt;
        const looksLikeDegrees = typeof position?.x === 'number' && typeof position?.y === 'number' &&
          Math.abs(position.x) <= 360 && Math.abs(position.y) <= 90;
        if (looksLikeDegrees) {
          // フォールバック: position を {x:lon, y:lat, z:alt} とみなす（テストの単純モック互換）
          lon = position.x;
          lat = position.y;
          alt = typeof position.z === 'number' ? position.z : 0;
        } else if (Cesium.Cartographic && typeof Cesium.Cartographic.fromCartesian === 'function') {
          const cartographic = Cesium.Cartographic.fromCartesian(position);
          if (!cartographic) {
            skippedCount++;
            return;
          }
          // 地理座標に変換
          lon = Cesium.Math.toDegrees(cartographic.longitude);
          lat = Cesium.Math.toDegrees(cartographic.latitude);
          alt = cartographic.height;
        } else {
          // フォールバック: position を {x:lon, y:lat, z:alt} とみなす（テストの単純モック互換）
          if (typeof position.x !== 'number' || typeof position.y !== 'number') {
            skippedCount++;
            return;
          }
          lon = position.x;
          lat = position.y;
          alt = typeof position.z === 'number' ? position.z : 0;
        }
        
        // 範囲外チェック（少しマージンを持たせる）
        if (lon < bounds.minLon - 0.001 || lon > bounds.maxLon + 0.001 ||
            lat < bounds.minLat - 0.001 || lat > bounds.maxLat + 0.001 ||
            alt < bounds.minAlt - 1 || alt > bounds.maxAlt + 1) {
          skippedCount++;
          return;
        }
        
        // ボクセルインデックスを計算（範囲0の安全対策）
        const lonDen = (bounds.maxLon - bounds.minLon);
        const latDen = (bounds.maxLat - bounds.minLat);
        const altDen = (bounds.maxAlt - bounds.minAlt);

        const voxelX = lonDen === 0 ? 0 : Math.min(
          grid.numVoxelsX - 1,
          Math.floor((lon - bounds.minLon) / lonDen * grid.numVoxelsX)
        );
        const voxelY = latDen === 0 ? 0 : Math.min(
          grid.numVoxelsY - 1,
          Math.floor((lat - bounds.minLat) / latDen * grid.numVoxelsY)
        );
        const voxelZ = altDen === 0 ? 0 : Math.min(
          grid.numVoxelsZ - 1,
          Math.floor((alt - bounds.minAlt) / altDen * grid.numVoxelsZ)
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
        Logger.warn(`エンティティ ${index} の処理に失敗:`, error);
        skippedCount++;
      }
    });
    
    Logger.info(`${processedCount}個のエンティティを${voxelData.size}個のボクセルに分類（${skippedCount}個はスキップ）`);
    return voxelData;
  }
  
  /**
   * Calculate statistics from voxel data.
   * ボクセルデータから統計情報を計算します。
   * @param {Map} voxelData - Voxel data / ボクセルデータ
   * @param {Object} grid - Grid info / グリッド情報
   * @returns {Object} Statistics / 統計情報
   */
  static calculateStatistics(voxelData, grid) {
    if (voxelData.size === 0) {
      return {
        totalVoxels: grid.totalVoxels,
        renderedVoxels: 0,
        nonEmptyVoxels: 0,
        emptyVoxels: grid.totalVoxels,
        totalEntities: 0,
        minCount: 0,
        maxCount: 0,
        averageCount: 0,
        // v0.1.4: 自動調整情報の初期化
        autoAdjusted: false,
        originalVoxelSize: null,
        finalVoxelSize: null,
        adjustmentReason: null
      };
    }
    
    const counts = Array.from(voxelData.values()).map(voxel => voxel.count);
    const totalEntities = counts.reduce((sum, count) => sum + count, 0);
    
    const stats = {
      totalVoxels: grid.totalVoxels,
      renderedVoxels: 0, // 実際の描画後にVoxelRendererから設定される
      nonEmptyVoxels: voxelData.size,
      emptyVoxels: grid.totalVoxels - voxelData.size,
      totalEntities: totalEntities,
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts),
      averageCount: totalEntities / voxelData.size,
      // v0.1.4: 自動調整情報の初期化
      autoAdjusted: false,
      originalVoxelSize: null,
      finalVoxelSize: null,
      adjustmentReason: null
    };
    
    Logger.debug('統計情報計算完了:', stats);
    return stats;
  }
  
  /**
   * Get top-N densest voxels.
   * 上位 N 個のボクセルを取得します。
   * @param {Map} voxelData - Voxel data / ボクセルデータ
   * @param {number} topN - Number to get / 取得する上位の数
   * @returns {Array} Top-N voxel info / 上位N個のボクセル情報
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
