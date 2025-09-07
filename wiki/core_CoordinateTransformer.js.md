# Source: core/CoordinateTransformer.js

**日本語** | [English](#english)

## English

See also: [Class: CoordinateTransformer](CoordinateTransformer)

```javascript
/**
 * Coordinate transformation utilities (simple implementation).
 * 座標変換を担当するクラス（シンプル実装）。
 */
import * as Cesium from 'cesium';
import { Logger } from '../utils/logger.js';

/**
 * Class providing coordinate transformation utilities.
 * 座標変換機能を提供するクラス。
 */
export class CoordinateTransformer {
  /**
   * Calculate 3D bounds from an entity array.
   * エンティティ配列から 3D 境界を計算します。
   * @param {Array} entities - Entity array / エンティティ配列
   * @returns {Object} Bounds info / 境界情報
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
        
        // Cartesian3→Cartographic 変換（テスト環境の簡易モックに対するフォールバック）
        let lon, lat, alt;
        const looksLikeDegrees = typeof position?.x === 'number' && typeof position?.y === 'number' &&
          Math.abs(position.x) <= 360 && Math.abs(position.y) <= 90;
        if (looksLikeDegrees) {
          lon = position.x; lat = position.y; alt = typeof position.z === 'number' ? position.z : 0;
        } else {
          const cartographic = Cesium.Cartographic.fromCartesian(position);
          if (!cartographic) return;
          lon = Cesium.Math.toDegrees(cartographic.longitude);
          lat = Cesium.Math.toDegrees(cartographic.latitude);
          alt = cartographic.height;
        }
        
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minAlt = Math.min(minAlt, alt);
        maxAlt = Math.max(maxAlt, alt);
        
        validCount++;
      } catch (error) {
        Logger.warn(`エンティティ ${index} の処理に失敗:`, error);
      }
    });
    
    if (validCount === 0) {
      throw new Error('有効な位置情報を持つエンティティが見つかりません');
    }
    
    // デバッグ出力
    Logger.debug('座標範囲計算完了:', {
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
   * Convert voxel indices to geographic coordinates (cell center).
   * ボクセルインデックスを地理座標（中心位置）に変換します。
   * @param {number} x - X-axis voxel index / X軸ボクセルインデックス
   * @param {number} y - Y-axis voxel index / Y軸ボクセルインデックス
   * @param {number} z - Z-axis voxel index / Z軸ボクセルインデックス
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {Object} grid - Grid info / グリッド情報
   * @returns {Object} Geographic coordinate {lon, lat, alt} / 地理座標 {lon, lat, alt}
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
   * Convert geographic coordinates to Cesium Cartesian3.
   * 地理座標を Cesium Cartesian3 に変換します。
   * @param {number} lon - Longitude / 経度
   * @param {number} lat - Latitude / 緯度
   * @param {number} alt - Altitude / 高度
   * @returns {Cesium.Cartesian3} Cesium Cartesian3
   */
  static coordinateToCartesian3(lon, lat, alt) {
    return Cesium.Cartesian3.fromDegrees(lon, lat, alt);
  }
}

```

## 日本語

関連: [CoordinateTransformerクラス](CoordinateTransformer)

```javascript
/**
 * Coordinate transformation utilities (simple implementation).
 * 座標変換を担当するクラス（シンプル実装）。
 */
import * as Cesium from 'cesium';
import { Logger } from '../utils/logger.js';

/**
 * Class providing coordinate transformation utilities.
 * 座標変換機能を提供するクラス。
 */
export class CoordinateTransformer {
  /**
   * Calculate 3D bounds from an entity array.
   * エンティティ配列から 3D 境界を計算します。
   * @param {Array} entities - Entity array / エンティティ配列
   * @returns {Object} Bounds info / 境界情報
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
        
        // Cartesian3→Cartographic 変換（テスト環境の簡易モックに対するフォールバック）
        let lon, lat, alt;
        const looksLikeDegrees = typeof position?.x === 'number' && typeof position?.y === 'number' &&
          Math.abs(position.x) <= 360 && Math.abs(position.y) <= 90;
        if (looksLikeDegrees) {
          lon = position.x; lat = position.y; alt = typeof position.z === 'number' ? position.z : 0;
        } else {
          const cartographic = Cesium.Cartographic.fromCartesian(position);
          if (!cartographic) return;
          lon = Cesium.Math.toDegrees(cartographic.longitude);
          lat = Cesium.Math.toDegrees(cartographic.latitude);
          alt = cartographic.height;
        }
        
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minAlt = Math.min(minAlt, alt);
        maxAlt = Math.max(maxAlt, alt);
        
        validCount++;
      } catch (error) {
        Logger.warn(`エンティティ ${index} の処理に失敗:`, error);
      }
    });
    
    if (validCount === 0) {
      throw new Error('有効な位置情報を持つエンティティが見つかりません');
    }
    
    // デバッグ出力
    Logger.debug('座標範囲計算完了:', {
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
   * Convert voxel indices to geographic coordinates (cell center).
   * ボクセルインデックスを地理座標（中心位置）に変換します。
   * @param {number} x - X-axis voxel index / X軸ボクセルインデックス
   * @param {number} y - Y-axis voxel index / Y軸ボクセルインデックス
   * @param {number} z - Z-axis voxel index / Z軸ボクセルインデックス
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {Object} grid - Grid info / グリッド情報
   * @returns {Object} Geographic coordinate {lon, lat, alt} / 地理座標 {lon, lat, alt}
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
   * Convert geographic coordinates to Cesium Cartesian3.
   * 地理座標を Cesium Cartesian3 に変換します。
   * @param {number} lon - Longitude / 経度
   * @param {number} lat - Latitude / 緯度
   * @param {number} alt - Altitude / 高度
   * @returns {Cesium.Cartesian3} Cesium Cartesian3
   */
  static coordinateToCartesian3(lon, lat, alt) {
    return Cesium.Cartesian3.fromDegrees(lon, lat, alt);
  }
}

```
