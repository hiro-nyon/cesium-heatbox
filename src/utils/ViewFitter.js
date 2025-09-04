/**
 * ViewFitter utility for optimal camera positioning.
 * カメラの最適配置のためのViewFitterユーティリティ
 */
import * as Cesium from 'cesium';
import { Logger } from './logger.js';

/**
 * Utility class for fitting camera view to data bounds.
 * データ境界にカメラビューを合わせるためのユーティリティクラス
 */
export class ViewFitter {
  /**
   * Fit camera view to data bounds with optimal positioning.
   * データ境界に最適な位置でカメラビューを合わせます。
   * 
   * @param {Cesium.Viewer} viewer - Cesium viewer instance / Cesiumビューアインスタンス
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} options - View fitting options / ビューフィッティングオプション
   * @returns {Promise} Promise that resolves when camera movement completes / カメラ移動完了時に解決されるPromise
   */
  static async fitToBounds(viewer, bounds, options = {}) {
    try {
      if (!viewer || !bounds) {
        throw new Error('Viewer and bounds are required');
      }
      
      // 境界の妥当性チェック
      if (!ViewFitter._isValidBounds(bounds)) {
        Logger.warn('Invalid bounds provided to ViewFitter:', bounds);
        return Promise.resolve();
      }
      
      // オプションのマージ
      const fitOptions = {
        paddingPercent: 0.1,
        pitchDegrees: -45,
        headingDegrees: 0,
        duration: 2.0,
        maximumHeight: 50000,
        minimumHeight: 100,
        ...options
      };
      
      Logger.debug('ViewFitter: fitting to bounds', bounds, 'with options', fitOptions);
      
      // データ範囲が極小または極大の場合の特別処理
      const dataRange = ViewFitter._calculateDataRange(bounds);
      const maxRange = Math.max(dataRange.x, dataRange.y, dataRange.z);
      
      if (maxRange < 10) {
        return ViewFitter._handleMinimalDataRange(viewer, bounds, fitOptions);
      }
      
      if (maxRange > 100000) {
        return ViewFitter._handleLargeDataRange(viewer, bounds, fitOptions);
      }
      
      // 標準的なカメラ配置計算
      return ViewFitter._executeStandardFit(viewer, bounds, fitOptions, maxRange);
      
    } catch (error) {
      Logger.error('ViewFitter: Failed to fit view to bounds:', error);
      throw error;
    }
  }
  
  /**
   * Calculate data range in meters from bounds.
   * 境界からメートル単位のデータ範囲を計算します。
   * @param {Object} bounds - Data bounds / データ境界
   * @returns {Object} Data range {x, y, z} in meters / メートル単位のデータ範囲
   * @private
   */
  static _calculateDataRange(bounds) {
    // 緯度経度をメートルに変換（簡易変換）
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const cosLat = Math.cos(centerLat * Math.PI / 180);
    
    const lonRangeMeters = (bounds.maxLon - bounds.minLon) * 111000 * cosLat;
    const latRangeMeters = (bounds.maxLat - bounds.minLat) * 111000;
    const altRangeMeters = Math.max(bounds.maxAlt - bounds.minAlt, 1);
    
    return {
      x: Math.max(lonRangeMeters, 1),
      y: Math.max(latRangeMeters, 1),
      z: altRangeMeters
    };
  }
  
  /**
   * Validate bounds object.
   * 境界オブジェクトの妥当性をチェックします。
   * @param {Object} bounds - Bounds to validate / 検証する境界
   * @returns {boolean} True if valid / 有効な場合true
   * @private
   */
  static _isValidBounds(bounds) {
    if (!bounds) {
      return false;
    }
    
    return typeof bounds.minLon === 'number' && !isNaN(bounds.minLon) &&
           typeof bounds.maxLon === 'number' && !isNaN(bounds.maxLon) &&
           typeof bounds.minLat === 'number' && !isNaN(bounds.minLat) &&
           typeof bounds.maxLat === 'number' && !isNaN(bounds.maxLat) &&
           typeof bounds.minAlt === 'number' && !isNaN(bounds.minAlt) &&
           typeof bounds.maxAlt === 'number' && !isNaN(bounds.maxAlt) &&
           bounds.minLon <= bounds.maxLon &&
           bounds.minLat <= bounds.maxLat &&
           bounds.minAlt <= bounds.maxAlt;
  }
  
  /**
   * Handle minimal data range (very small datasets).
   * 極小データ範囲の処理（非常に小さなデータセット）
   * @param {Cesium.Viewer} viewer - Cesium viewer / Cesiumビューア
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} options - Fit options / フィットオプション
   * @returns {Promise} Camera movement promise / カメラ移動Promise
   * @private
   */
  static _handleMinimalDataRange(viewer, bounds, options) {
    Logger.debug('ViewFitter: handling minimal data range');
    
    const centerLon = (bounds.minLon + bounds.maxLon) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    
    // 極小データの場合は固定高度を使用
    const fixedHeight = Math.max(options.minimumHeight, 500);
    
    return ViewFitter._executeCameraMovement(viewer, {
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, fixedHeight),
      orientation: {
        heading: Cesium.Math.toRadians(options.headingDegrees),
        pitch: Cesium.Math.toRadians(options.pitchDegrees),
        roll: 0.0
      },
      duration: options.duration
    });
  }
  
  /**
   * Handle large data range (very large datasets).
   * 極大データ範囲の処理（非常に大きなデータセット）
   * @param {Cesium.Viewer} viewer - Cesium viewer / Cesiumビューア
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} options - Fit options / フィットオプション
   * @returns {Promise} Camera movement promise / カメラ移動Promise
   * @private
   */
  static _handleLargeDataRange(viewer, bounds, options) {
    Logger.debug('ViewFitter: handling large data range');
    
    // 大きなデータセットの場合はRectangleを使用
    const rectangle = Cesium.Rectangle.fromDegrees(
      bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat
    );
    
    const cameraOptions = {
      duration: options.duration,
      maximumHeight: options.maximumHeight
    };
    
    return new Promise((resolve, reject) => {
      try {
        viewer.camera.flyTo({
          destination: rectangle,
          ...cameraOptions,
          complete: () => {
            Logger.debug('ViewFitter: large data range fit completed');
            resolve();
          },
          cancel: () => {
            Logger.debug('ViewFitter: large data range fit cancelled');
            resolve();
          }
        });
      } catch (error) {
        Logger.error('ViewFitter: large data range fit failed:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Execute standard camera fit for normal data ranges.
   * 通常のデータ範囲に対する標準カメラフィットを実行します。
   * @param {Cesium.Viewer} viewer - Cesium viewer / Cesiumビューア
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} options - Fit options / フィットオプション
   * @param {number} maxRange - Maximum data range / 最大データ範囲
   * @returns {Promise} Camera movement promise / カメラ移動Promise
   * @private
   */
  static _executeStandardFit(viewer, bounds, options, maxRange) {
    const centerLon = (bounds.minLon + bounds.maxLon) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    
    // パディングの計算
    const paddingPercent = Math.max(0.05, Math.min(0.5, options.paddingPercent));
    const paddingMeters = paddingPercent * maxRange;
    
    // カメラ高度の計算
    const cameraHeight = ViewFitter._calculateOptimalCameraHeight(
      maxRange, 
      paddingMeters, 
      options
    );
    
    // カメラ移動の実行
    return ViewFitter._executeCameraMovement(viewer, {
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, cameraHeight),
      orientation: {
        heading: Cesium.Math.toRadians(options.headingDegrees),
        pitch: Cesium.Math.toRadians(options.pitchDegrees),
        roll: 0.0
      },
      duration: options.duration
    });
  }
  
  /**
   * Calculate optimal camera height based on data range and viewing parameters.
   * データ範囲と表示パラメータに基づいて最適なカメラ高度を計算します。
   * @param {number} maxRange - Maximum data range / 最大データ範囲
   * @param {number} paddingMeters - Padding in meters / メートル単位のパディング
   * @param {Object} options - Fit options / フィットオプション
   * @returns {number} Optimal camera height / 最適なカメラ高度
   * @private
   */
  static _calculateOptimalCameraHeight(maxRange, paddingMeters, options) {
    // 視野角（通常60度程度）
    const fovRadians = Math.PI / 3; // 60度
    const pitchRadians = Math.abs(Cesium.Math.toRadians(options.pitchDegrees));
    
    // ピッチを考慮した有効表示範囲
    const effectiveRange = maxRange + (2 * paddingMeters);
    const pitchFactor = Math.cos(pitchRadians);
    
    // 基本的な高度計算
    let cameraHeight = (effectiveRange / pitchFactor) / (2 * Math.tan(fovRadians / 2));
    
    // 安全マージンの追加（20%）
    cameraHeight *= 1.2;
    
    // 高度制限の適用（安全マージン後）
    cameraHeight = Math.max(options.minimumHeight, 
                          Math.min(options.maximumHeight, cameraHeight));
    
    return cameraHeight;
  }
  
  /**
   * Execute camera movement with proper promise handling.
   * 適切なPromise処理でカメラ移動を実行します。
   * @param {Cesium.Viewer} viewer - Cesium viewer / Cesiumビューア
   * @param {Object} cameraOptions - Camera movement options / カメラ移動オプション
   * @returns {Promise} Camera movement promise / カメラ移動Promise
   * @private
   */
  static _executeCameraMovement(viewer, cameraOptions) {
    return new Promise((resolve, reject) => {
      try {
        const flyToOptions = {
          ...cameraOptions,
          complete: () => {
            Logger.debug('ViewFitter: camera movement completed');
            resolve();
          },
          cancel: () => {
            Logger.debug('ViewFitter: camera movement cancelled');
            resolve();
          }
        };
        
        viewer.camera.flyTo(flyToOptions);
        
      } catch (error) {
        Logger.error('ViewFitter: camera movement failed:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Create a Rectangle from bounds for large datasets.
   * 大きなデータセット用に境界からRectangleを作成します。
   * @param {Object} bounds - Data bounds / データ境界
   * @returns {Cesium.Rectangle} Cesium Rectangle / CesiumのRectangle
   * @static
   */
  static createRectangleFromBounds(bounds) {
    if (!ViewFitter._isValidBounds(bounds)) {
      throw new Error('Invalid bounds provided');
    }
    
    return Cesium.Rectangle.fromDegrees(
      bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat
    );
  }
  
  /**
   * Calculate camera position for specific viewing angle.
   * 特定の視角に対するカメラ位置を計算します。
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} viewOptions - View options / ビューオプション
   * @returns {Object} Camera position and orientation / カメラ位置と向き
   * @static
   */
  static calculateCameraPosition(bounds, viewOptions = {}) {
    if (!ViewFitter._isValidBounds(bounds)) {
      throw new Error('Invalid bounds provided');
    }
    
    const options = {
      paddingPercent: 0.1,
      pitchDegrees: -45,
      headingDegrees: 0,
      minimumHeight: 100,
      maximumHeight: 50000,
      ...viewOptions
    };
    
    const centerLon = (bounds.minLon + bounds.maxLon) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const dataRange = ViewFitter._calculateDataRange(bounds);
    const maxRange = Math.max(dataRange.x, dataRange.y, dataRange.z);
    
    const paddingMeters = options.paddingPercent * maxRange;
    const cameraHeight = ViewFitter._calculateOptimalCameraHeight(
      maxRange, paddingMeters, options
    );
    
    return {
      position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, cameraHeight),
      orientation: {
        heading: Cesium.Math.toRadians(options.headingDegrees),
        pitch: Cesium.Math.toRadians(options.pitchDegrees),
        roll: 0.0
      },
      metadata: {
        dataRange: maxRange,
        cameraHeight,
        paddingMeters
      }
    };
  }
}
