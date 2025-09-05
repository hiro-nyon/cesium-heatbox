/**
 * Coordinate transformation utilities (simple implementation).
 * 座標変換を担当するクラス（シンプル実装）。
 */
import * as Cesium from 'cesium';
import { Logger } from '../utils/logger.js';

/**
 * Comprehensive coordinate transformation utilities for geospatial data processing.
 * 地理空間データ処理用の包括的座標変換ユーティリティ。
 * 
 * This utility class provides essential coordinate transformation and bounds calculation
 * functions for processing geospatial entity data in CesiumJS environments. Handles
 * conversions between different coordinate systems, calculates 3D spatial bounds,
 * and provides robust error handling for invalid coordinate data.
 * 
 * このユーティリティクラスは、CesiumJS環境で地理空間エンティティデータを処理するための
 * 重要な座標変換と境界計算機能を提供します。異なる座標系間の変換を処理し、3D空間境界を
 * 計算し、無効な座標データに対する堅牢なエラーハンドリングを提供します。
 * 
 * @since v0.1.0
 * @version 1.0.0 - Stable coordinate transformation utilities
 */
export class CoordinateTransformer {
  /**
   * Calculate comprehensive 3D spatial bounds from Cesium entity array.
   * Cesiumエンティティ配列から包括的な3D空間境界を計算します。
   * 
   * This method analyzes all provided entities to determine the minimum and maximum
   * longitude, latitude, and altitude values, creating a bounding box that encompasses
   * the entire dataset. Handles various entity position formats and provides robust
   * error handling for invalid or missing position data.
   * 
   * このメソッドは提供された全エンティティを分析して最小・最大の経度、緯度、高度値を
   * 決定し、データセット全体を包含するバウンディングボックスを作成します。様々な
   * エンティティ位置形式を処理し、無効または欠落している位置データに対する
   * 堅牢なエラーハンドリングを提供します。
   * 
   * @param {Cesium.Entity[]} entities - Array of Cesium entities with position information / 位置情報を持つCesiumエンティティの配列
   * @returns {Object} Comprehensive bounds information / 包括的な境界情報
   * @returns {number} returns.minLon - Minimum longitude in degrees / 最小経度（度）
   * @returns {number} returns.maxLon - Maximum longitude in degrees / 最大経度（度）
   * @returns {number} returns.minLat - Minimum latitude in degrees / 最小緯度（度）
   * @returns {number} returns.maxLat - Maximum latitude in degrees / 最大緯度（度）
   * @returns {number} returns.minAlt - Minimum altitude in meters / 最小高度（メートル）
   * @returns {number} returns.maxAlt - Maximum altitude in meters / 最大高度（メートル）
   * @returns {number} returns.validEntityCount - Number of entities with valid positions / 有効な位置を持つエンティティ数
   * @throws {Error} Throws error if entity array is empty or invalid / エンティティ配列が空または無効な場合はエラーを投げます
   * 
   * @example
   * // Calculate bounds for visualization / 可視化用境界計算
   * const entities = getAllEntities(viewer);
   * const bounds = CoordinateTransformer.calculateBounds(entities);
   * console.log(`Data spans ${bounds.maxLon - bounds.minLon}° longitude`);
   * 
   * @example  
   * // Error handling for invalid data / 無効データのエラーハンドリング
   * try {
   *   const bounds = CoordinateTransformer.calculateBounds(entities);
   *   if (bounds.validEntityCount === 0) {
   *     console.warn('No entities with valid positions found');
   *   }
   * } catch (error) {
   *   console.error('Failed to calculate bounds:', error);
   * }
   * 
   * @since v0.1.0
   * @static
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
