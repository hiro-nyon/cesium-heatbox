/**
 * 座標変換を担当するクラス（シンプル実装）
 */
import * as Cesium from 'cesium';

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
    const currentTime = Cesium.JulianDate.now();
    
    entities.forEach((entity, index) => {
      try {
        // エンティティの位置を取得
        let position;
        if (entity.position) {
          if (typeof entity.position.getValue === 'function') {
            position = entity.position.getValue(currentTime);
          } else {
            position = entity.position;
          }
        }
        
        if (!position) {
          return; // 位置情報がない場合はスキップ
        }
        
        // Cartesian3からCartographic（経度、緯度、高度）に変換
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        if (!cartographic) return;
        
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
      } catch (error) {
        console.warn(`エンティティ ${index} の処理に失敗:`, error);
      }
    });
    
    if (validCount === 0) {
      throw new Error('有効な位置情報を持つエンティティが見つかりません');
    }
    
    // デバッグ出力
    console.log('座標範囲計算完了:', {
      validCount,
      bounds: {
        minLon, maxLon, 
        minLat, maxLat, 
        minAlt, maxAlt
      }
    });
    
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
    
    // ボクセルの中心位置を計算（シンプルな線形補間）
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
   * @returns {Cesium.Cartesian3} Cesium Cartesian3
   */
  static coordinateToCartesian3(lon, lat, alt) {
    return Cesium.Cartesian3.fromDegrees(lon, lat, alt);
  }
}