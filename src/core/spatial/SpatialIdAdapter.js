import { Logger } from '../../utils/logger.js';
import { ZFXYConverter } from './ZFXYConverter.js';

/**
 * SpatialIdAdapter - Abstraction layer for spatial ID providers
 * 空間IDプロバイダーの抽象化層
 * 
 * Supports dynamic loading of ouranos-gex with built-in fallback.
 * ouranos-gexの動的読み込みと内蔵フォールバックをサポート。
 * 
 * @class
 * @version 0.1.17
 */
export class SpatialIdAdapter {
  /**
   * Constructor
   * @param {Object} options - Adapter options
   * @param {string} [options.provider='ouranos-gex'] - Spatial ID provider name
   */
  constructor(options = {}) {
    this.provider = options.provider || 'ouranos-gex';
    this.Space = null;  // Will be set via loadProvider()
    this.fallbackMode = false;
    this.loaded = false;
  }

  /**
   * Load spatial ID provider dynamically
   * 空間IDプロバイダーを動的に読み込む
   * 
   * @returns {Promise<boolean>} True if provider loaded, false if fallback
   */
  async loadProvider() {
    if (this.loaded) {
      return !this.fallbackMode;
    }

    if (this.provider === 'ouranos-gex') {
      try {
        const module = await import('ouranos-gex-lib-for-javascript');
        this.Space = module.Space;
        this.fallbackMode = false;
        this.loaded = true;
        Logger.info('SpatialIdAdapter: ouranos-gex loaded successfully');
        return true;
      } catch (error) {
        Logger.warn('SpatialIdAdapter: ouranos-gex not available, using built-in fallback', error.message);
        this.fallbackMode = true;
        this.loaded = true;
        return false;
      }
    } else {
      Logger.warn(`SpatialIdAdapter: Unknown provider '${this.provider}', using built-in fallback`);
      this.fallbackMode = true;
      this.loaded = true;
      return false;
    }
  }

  /**
   * Get voxel bounds from geographic coordinates
   * 地理座標からボクセル境界を取得
   * 
   * @param {number} lng - Longitude (degrees)
   * @param {number} lat - Latitude (degrees)
   * @param {number} alt - Altitude (meters)
   * @param {number} zoom - Zoom level (0-35)
   * @returns {{zfxy: {z, f, x, y}, zfxyStr: string, vertices: Array<{lng, lat, alt}>}}
   */
  getVoxelBounds(lng, lat, alt, zoom) {
    if (!this.loaded) {
      throw new Error('SpatialIdAdapter: loadProvider() must be called before getVoxelBounds()');
    }

    if (this.Space && !this.fallbackMode) {
      try {
        const space = new this.Space({ lng, lat, alt }, zoom);
        return {
          zfxy: space.zfxy,         // {z, f, x, y}
          zfxyStr: space.zfxyStr,   // PUBLIC API format: /z/f/x/y
          vertices: space.vertices3d()  // 8 corner points
        };
      } catch (error) {
        Logger.warn('SpatialIdAdapter: ouranos-gex error, falling back to built-in converter', error.message);
        return ZFXYConverter.convert(lng, lat, alt, zoom);
      }
    } else {
      // Use built-in fallback
      return ZFXYConverter.convert(lng, lat, alt, zoom);
    }
  }

  /**
   * Calculate optimal zoom level for target cell size
   * ターゲットセルサイズに対する最適なズームレベルを計算
   * 
   * @param {number} targetSize - Target cell size in meters
   * @param {number} centerLat - Center latitude for calculation (degrees)
   * @param {number} [tolerance=10] - Tolerance percentage (default: 10%)
   * @returns {number} Optimal zoom level (15-30)
   */
  calculateOptimalZoom(targetSize, centerLat, tolerance = 10) {
    const minZoom = 15;
    const maxZoom = 30;
    let bestZoom = 25;  // Default fallback
    let minError = Infinity;
    let bestZoomWithinTolerance = null;

    for (let z = minZoom; z <= maxZoom; z++) {
      const cellSizeXY = this._calculateCellSizeAtZoom(z, centerLat);
      const relativeError = Math.abs(cellSizeXY - targetSize) / targetSize;

      // Always track the zoom with minimum error
      if (relativeError < minError) {
        bestZoom = z;
        minError = relativeError;
      }

      // Also track the first zoom within tolerance
      if (bestZoomWithinTolerance === null && relativeError <= tolerance / 100) {
        bestZoomWithinTolerance = z;
      }
    }

    // Prefer zoom within tolerance, otherwise use closest
    const selectedZoom = bestZoomWithinTolerance !== null ? bestZoomWithinTolerance : bestZoom;
    const selectedCellSize = this._calculateCellSizeAtZoom(selectedZoom, centerLat);
    const selectedErrorPct = Math.abs(selectedCellSize - targetSize) / targetSize * 100;

    Logger.debug(`SpatialIdAdapter: Optimal zoom ${selectedZoom} for target size ${targetSize}m (cell size: ${selectedCellSize.toFixed(1)}m, error: ${selectedErrorPct.toFixed(1)}%)${bestZoomWithinTolerance === null ? ' [closest, exceeds tolerance]' : ''}`);
    return selectedZoom;
  }

  /**
   * Calculate approximate XY cell size at given zoom level and latitude
   * 指定されたズームレベルと緯度でのXYセルサイズを近似計算
   * 
   * @param {number} zoom - Zoom level
   * @param {number} lat - Latitude (degrees)
   * @returns {number} Approximate cell size in meters
   * @private
   */
  _calculateCellSizeAtZoom(zoom, lat) {
    // Web Mercator tile calculation
    // Earth circumference at equator: ~40075017 meters
    const earthCircumference = 40075017;
    const latRadians = lat * Math.PI / 180;
    
    // XY cell size = (earth circumference * cos(lat)) / (2^zoom * 256)
    // Simplified: XY cell size ≈ (earth circumference * cos(lat)) / (2^zoom)
    const cellSize = (earthCircumference * Math.cos(latRadians)) / Math.pow(2, zoom);
    
    return cellSize;
  }

  /**
   * Get provider status information
   * プロバイダーステータス情報を取得
   * 
   * @returns {{provider: string, loaded: boolean, fallbackMode: boolean}}
   */
  getStatus() {
    return {
      provider: this.provider,
      loaded: this.loaded,
      fallbackMode: this.fallbackMode
    };
  }
}

