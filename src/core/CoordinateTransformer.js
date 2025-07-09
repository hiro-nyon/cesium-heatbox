/**
 * 座標変換を担当するクラス
 */

import { COORDINATE_CONSTANTS } from '../utils/constants.js';

/**
 * 座標変換機能を提供するクラス
 */
export class CoordinateTransformer {
  /**
   * エンティティ配列から3D境界を計算
   * @param {Array} entities - エンティティ配列
   * @returns {Object} 境界情報
   */
  static calculateBounds(entities) {
    if (!Array.isArray(entities) || entities.length === 0) {
      throw new Error('エンティティが提供されていません');
    }
    
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minAlt = Infinity;
    let maxAlt = -Infinity;
    
    let validCount = 0;
    
    for (const entity of entities) {
      const position = this.getEntityPosition(entity);
      
      if (!position) {
        continue;
      }
      
      // Cartesian3からCartographic（経度、緯度、高度）に変換
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const alt = cartographic.height;
      
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minAlt = Math.min(minAlt, alt);
      maxAlt = Math.max(maxAlt, alt);
      
      validCount++;
    }
    
    if (validCount === 0) {
      throw new Error('有効な位置情報を持つエンティティが見つかりません');
    }
    
    return {
      minLon,
      maxLon,
      minLat,
      maxLat,
      minAlt,
      maxAlt,
      centerLon: (minLon + maxLon) / 2,
      centerLat: (minLat + maxLat) / 2,
      centerAlt: (minAlt + maxAlt) / 2
    };
  }
  
  /**
   * エンティティから位置情報を取得
   * @param {Object} entity - Cesium Entity
   * @returns {Cartesian3|null} 位置情報
   */
  static getEntityPosition(entity) {
    if (!entity || !entity.position) {
      return null;
    }
    
    try {
      // Propertyベースの位置情報の場合
      if (typeof entity.position.getValue === 'function') {
        const position = entity.position.getValue(Cesium.JulianDate.now());
        return position;
      }
      
      // 直接Cartesian3の場合
      if (entity.position.x !== undefined) {
        return entity.position;
      }
      
      return null;
    } catch (error) {
      console.warn('エンティティの位置情報取得に失敗:', error);
      return null;
    }
  }
  
  /**
   * 境界からメートル単位の範囲を計算
   * @param {Object} bounds - 境界情報
   * @returns {Object} メートル単位の範囲情報
   */
  static calculateMetersRange(bounds) {
    const { minLon, maxLon, minLat, maxLat, minAlt, maxAlt, centerLat } = bounds;
    
    // 緯度による経度の補正
    const centerLatRad = centerLat * COORDINATE_CONSTANTS.DEGREES_TO_RADIANS;
    const lonRangeMeters = (maxLon - minLon) * COORDINATE_CONSTANTS.DEGREES_TO_METERS_LAT * Math.cos(centerLatRad);
    const latRangeMeters = (maxLat - minLat) * COORDINATE_CONSTANTS.DEGREES_TO_METERS_LAT;
    const altRangeMeters = maxAlt - minAlt;
    
    return {
      lonRangeMeters,
      latRangeMeters,
      altRangeMeters
    };
  }
  
  /**
   * 地理座標をボクセルインデックスに変換
   * @param {number} lon - 経度
   * @param {number} lat - 緯度
   * @param {number} alt - 高度
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   * @returns {Object} ボクセルインデックス {x, y, z}
   */
  static coordinateToVoxelIndex(lon, lat, alt, bounds, grid) {
    const { minLon, maxLon, minLat, maxLat, minAlt, maxAlt } = bounds;
    const { numVoxelsX, numVoxelsY, numVoxelsZ } = grid;
    
    // 正規化（0-1の範囲）
    const normalizedLon = (lon - minLon) / (maxLon - minLon);
    const normalizedLat = (lat - minLat) / (maxLat - minLat);
    const normalizedAlt = (alt - minAlt) / (maxAlt - minAlt);
    
    // ボクセルインデックスを計算
    const voxelX = Math.floor(normalizedLon * numVoxelsX);
    const voxelY = Math.floor(normalizedLat * numVoxelsY);
    const voxelZ = Math.floor(normalizedAlt * numVoxelsZ);
    
    // 境界チェック
    return {
      x: Math.max(0, Math.min(numVoxelsX - 1, voxelX)),
      y: Math.max(0, Math.min(numVoxelsY - 1, voxelY)),
      z: Math.max(0, Math.min(numVoxelsZ - 1, voxelZ))
    };
  }
  
  /**
   * ボクセルインデックスを地理座標（中心位置）に変換
   * @param {number} x - X軸ボクセルインデックス
   * @param {number} y - Y軸ボクセルインデックス
   * @param {number} z - Z軸ボクセルインデックス
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   * @returns {Object} 地理座標 {lon, lat, alt}
   */
  static voxelIndexToCoordinate(x, y, z, bounds, grid) {
    const { minLon, maxLon, minLat, maxLat, minAlt, maxAlt } = bounds;
    const { numVoxelsX, numVoxelsY, numVoxelsZ } = grid;
    
    // ボクセルの中心位置を計算
    const normalizedLon = (x + 0.5) / numVoxelsX;
    const normalizedLat = (y + 0.5) / numVoxelsY;
    const normalizedAlt = (z + 0.5) / numVoxelsZ;
    
    return {
      lon: minLon + normalizedLon * (maxLon - minLon),
      lat: minLat + normalizedLat * (maxLat - minLat),
      alt: minAlt + normalizedAlt * (maxAlt - minAlt)
    };
  }
  
  /**
   * 地理座標をCesium Cartesian3に変換
   * @param {number} lon - 経度
   * @param {number} lat - 緯度
   * @param {number} alt - 高度
   * @returns {Cartesian3} Cesium Cartesian3
   */
  static coordinateToCartesian3(lon, lat, alt) {
    return Cesium.Cartesian3.fromDegrees(lon, lat, alt);
  }
}
