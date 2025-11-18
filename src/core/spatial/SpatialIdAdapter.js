import { Logger } from '../../utils/logger.js';
import { COORDINATE_CONSTANTS } from '../../utils/constants.js';
import { ZFXYConverter } from './ZFXYConverter.js';

/**
 * SpatialIdAdapter - Abstraction layer for spatial ID providers
 * 空間IDプロバイダーの抽象化層
 * 
 * Provides a unified interface for spatial ID conversion with support for:
 * - Dynamic loading of ouranos-gex-lib-for-javascript (optional dependency)
 * - Built-in Web Mercator-based fallback converter (ZFXYConverter)
 * - Automatic zoom level selection based on target cell size
 * - 8-vertex bounding box calculation for each spatial ID voxel
 * 
 * 以下をサポートする空間ID変換の統合インターフェースを提供：
 * - ouranos-gex-lib-for-javascriptの動的読み込み（オプショナル依存）
 * - 内蔵Web Mercatorベースのフォールバックコンバーター（ZFXYConverter）
 * - 目標セルサイズに基づく自動ズームレベル選択
 * - 各空間IDボクセルの8頂点バウンディングボックス計算
 * 
 * @class
 * @version 0.1.17
 * @since 0.1.17
 * 
 * @example
 * // Basic usage with auto zoom selection
 * const adapter = new SpatialIdAdapter({ provider: 'ouranos-gex' });
 * await adapter.loadProvider();
 * 
 * // Calculate optimal zoom for 30m target cell size at latitude 35.69
 * const zoom = adapter.calculateOptimalZoom(30, 35.69, 10);
 * 
 * // Get voxel bounds
 * const bounds = adapter.getVoxelBounds(139.7, 35.69, 50, zoom);
 * console.log(bounds.zfxyStr); // e.g., "/25/12/28765/12850"
 * console.log(bounds.vertices.length); // 8 vertices
 * 
 * @example
 * // Fallback mode when ouranos-gex is not available
 * const adapter = new SpatialIdAdapter();
 * await adapter.loadProvider(); // Falls back to ZFXYConverter
 * const status = adapter.getStatus();
 * console.log(status.fallbackMode); // true
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
   * Get neighbors for given ZFXY tile (8-connected in X/Y).
   * 指定ZFXYタイルの隣接セル（X/Yの8近傍）を取得します。
   *
   * Dateline wrapping is handled in X so that tiles at x=0 and x=max
   * are considered neighbors across the ±180° meridian.
   * 経度±180°付近ではX方向のラップを考慮し、x=0 と x=max を隣接セルとして扱います。
   *
   * @param {{z:number,f:number,x:number,y:number}} zfxy - Tile identifier / タイル識別子
   * @returns {Array.<{z:number,f:number,x:number,y:number}>} Neighbor tiles / 隣接タイル群
   */
  neighbors(zfxy) {
    const { z, f, x, y } = zfxy;
    const n = Math.pow(2, z);
    const neighbors = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) {
          continue;
        }

        const ny = y + dy;
        if (ny < 0 || ny >= n) {
          continue;
        }

        const nx = (x + dx + n) % n;
        neighbors.push({ z, f, x: nx, y: ny });
      }
    }

    return neighbors;
  }

  /**
   * Get children for given ZFXY tile (4-way subdivision in X/Y).
   * 指定ZFXYタイルの子セル（X/Yを2分割した4セル）を取得します。
   *
   * Altitude index F is kept as-is; vertical subdivision is not modeled here.
   * 高度方向Fはそのままとし、垂直方向の細分化は扱いません。
   *
   * @param {{z:number,f:number,x:number,y:number}} zfxy - Parent tile / 親タイル
   * @returns {Array.<{z:number,f:number,x:number,y:number}>} Child tiles / 子タイル群
   */
  children(zfxy) {
    const { z, f, x, y } = zfxy;
    const childZ = z + 1;
    const baseX = x * 2;
    const baseY = y * 2;
    const nChild = Math.pow(2, childZ);

    const children = [];
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = 0; dx <= 1; dx++) {
        const cx = (baseX + dx) % nChild;
        const cy = baseY + dy;
        if (cy < 0 || cy >= nChild) {
          continue;
        }
        children.push({ z: childZ, f, x: cx, y: cy });
      }
    }

    return children;
  }

  /**
   * Get parent tile for given ZFXY tile.
   * 指定ZFXYタイルの親セルを取得します。
   *
   * @param {{z:number,f:number,x:number,y:number}} zfxy - Child tile / 子タイル
   * @returns {{z:number,f:number,x:number,y:number}|null} Parent tile or null at root / 親タイルまたはルートの場合null
   */
  parent(zfxy) {
    const { z, f, x, y } = zfxy;
    if (z <= 0) {
      return null;
    }
    const parentZ = z - 1;
    const parentX = Math.floor(x / 2);
    const parentY = Math.floor(y / 2);
    return { z: parentZ, f, x: parentX, y: parentY };
  }

  /**
   * Get voxel bounds from geographic coordinates
   * 地理座標からボクセル境界を取得
   * 
   * Converts a geographic point (lng/lat/alt) and zoom level into a spatial ID voxel
   * with 8-vertex bounding box. Uses ouranos-gex if available, otherwise falls back
   * to built-in Web Mercator converter.
   * 
   * 地理的な点（経度/緯度/高度）とズームレベルを、8頂点バウンディングボックスを
   * 持つ空間IDボクセルに変換します。利用可能な場合はouranos-gexを使用し、
   * それ以外の場合は内蔵Web Mercatorコンバーターにフォールバックします。
   * 
   * @param {number} lng - Longitude in degrees (経度、度単位)
   * @param {number} lat - Latitude in degrees (緯度、度単位)
   * @param {number} alt - Altitude in meters (高度、メートル単位)
   * @param {number} zoom - Zoom level 0-35 (ズームレベル 0-35)
   * 
   * @returns {Object} Voxel bounds result
   * @returns {Object} returns.zfxy - Spatial ID components {z, f, x, y}
   * @returns {number} returns.zfxy.z - Zoom level
   * @returns {number} returns.zfxy.f - Vertical (altitude) tile index
   * @returns {number} returns.zfxy.x - Horizontal (longitude) tile index
   * @returns {number} returns.zfxy.y - Vertical (latitude) tile index
   * @returns {string} returns.zfxyStr - Spatial ID string format "/z/f/x/y"
   * @returns {Array<{lng: number, lat: number, alt: number}>} returns.vertices - 
   *   8 corner vertices of the voxel bounding box. Order: bottom 4 vertices (CCW from SW), 
   *   then top 4 vertices (CCW from SW)
   * 
   * @throws {Error} If loadProvider() has not been called
   * 
   * @example
   * const adapter = new SpatialIdAdapter();
   * await adapter.loadProvider();
   * 
   * // Get voxel bounds for Shinjuku Station at zoom 25
   * const bounds = adapter.getVoxelBounds(139.7, 35.69, 50, 25);
   * 
   * console.log(bounds.zfxy);     // {z: 25, f: 12, x: 28765, y: 12850}
   * console.log(bounds.zfxyStr);  // "/25/12/28765/12850"
   * console.log(bounds.vertices); // [{lng, lat, alt}, ...] (8 vertices)
   * 
   * // Vertices order: [SW_bottom, SE_bottom, NE_bottom, NW_bottom,
   * //                  SW_top, SE_top, NE_top, NW_top]
   */
  getVoxelBounds(lng, lat, alt, zoom) {
    if (!this.loaded) {
      throw new Error('SpatialIdAdapter: loadProvider() must be called before getVoxelBounds()');
    }

    if (this.Space && !this.fallbackMode) {
      try {
        const space = new this.Space({ lng, lat, alt }, zoom);
        const rawVertices = typeof space.vertices3d === 'function' ? space.vertices3d() : [];
        const vertices = SpatialIdAdapter._normalizeVertices(rawVertices);

        return {
          zfxy: space.zfxy,         // {z, f, x, y}
          zfxyStr: space.zfxyStr,   // PUBLIC API format: /z/f/x/y
          vertices
        };
      } catch (error) {
        Logger.warn('SpatialIdAdapter: ouranos-gex error, falling back to built-in converter', error.message);
        return ZFXYConverter.convert(lng, lat, alt, zoom);
      }
    } else {
      // Use built-in fallback
      const result = ZFXYConverter.convert(lng, lat, alt, zoom);
      result.vertices = SpatialIdAdapter._normalizeVertices(result.vertices);
      return result;
    }
  }

  /**
   * Calculate optimal zoom level for target cell size
   * ターゲットセルサイズに対する最適なズームレベルを計算
   * 
   * Automatically selects the best zoom level (15-30) to match a target cell size at a given
   * latitude. The algorithm prioritizes zoom levels within the specified tolerance, falling back
   * to the closest match if no zoom meets the tolerance.
   * 
   * 指定された緯度でターゲットセルサイズに最も近い最適なズームレベル（15-30）を
   * 自動選択します。アルゴリズムは指定された許容範囲内のズームレベルを優先し、
   * 許容範囲を満たすズームがない場合は最も近いものにフォールバックします。
   * 
   * @param {number} targetSize - Target cell size in meters (目標セルサイズ、メートル単位)
   * @param {number} centerLat - Center latitude for calculation in degrees (計算用の中心緯度、度単位)
   * @param {number} [tolerance=10] - Tolerance percentage, 0-100 (許容誤差、パーセント、0-100)
   * 
   * @returns {number} Optimal zoom level 15-30 (最適なズームレベル 15-30)
   * 
   * @example
   * const adapter = new SpatialIdAdapter();
   * await adapter.loadProvider();
   * 
   * // Find zoom for ~30m cells at Shinjuku latitude with 10% tolerance
   * const zoom = adapter.calculateOptimalZoom(30, 35.69, 10);
   * console.log(zoom); // e.g., 20 (~38m cells, within 10% tolerance)
   * 
   * @example
   * // Tighter tolerance for precise cell size matching
   * const preciseZoom = adapter.calculateOptimalZoom(100, 35.69, 5);
   * 
   * @example
   * // If no zoom matches within tolerance, returns closest
   * const largeCell = adapter.calculateOptimalZoom(5000, 35.69, 10);
   * console.log(largeCell); // e.g., 15 (closest, even if >10% error)
   */
  calculateOptimalZoom(targetSize, centerLat, tolerance = 10) {
    const minZoom = 15;
    const maxZoom = 30;
    let bestZoom = 25;  // Default fallback
    let minError = Infinity;
    let bestZoomWithinTolerance = null;
    let bestErrorWithinTolerance = Infinity;

    for (let z = minZoom; z <= maxZoom; z++) {
      const cellSizeXY = this._calculateCellSizeAtZoom(z, centerLat);
      const relativeError = Math.abs(cellSizeXY - targetSize) / targetSize;

      // Always track the zoom with minimum error (regardless of tolerance)
      if (relativeError < minError) {
        bestZoom = z;
        minError = relativeError;
      }

      // Track the best zoom within tolerance (smallest error within tolerance)
      if (relativeError <= tolerance / 100 && relativeError < bestErrorWithinTolerance) {
        bestZoomWithinTolerance = z;
        bestErrorWithinTolerance = relativeError;
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
   * Normalize vertex data returned by providers into {lng, lat, alt} objects.
   * プロバイダーが返す頂点データを {lng, lat, alt} 形式に正規化
   *
   * @param {Array} rawVertices - Provider vertices / プロバイダー頂点
   * @returns {Array<{lng: number, lat: number, alt: number}>}
   * @private
   */
  static _normalizeVertices(rawVertices) {
    if (!Array.isArray(rawVertices)) {
      return [];
    }

    return rawVertices.map((vertex, index) => {
      if (Array.isArray(vertex)) {
        const [lng, lat, alt] = vertex;
        return {
          lng: SpatialIdAdapter._toNumber(lng),
          lat: SpatialIdAdapter._toNumber(lat),
          alt: SpatialIdAdapter._toNumber(alt)
        };
      }

      if (vertex && typeof vertex === 'object') {
        const lngCandidate = vertex.lng ?? vertex.lon ?? vertex.longitude;
        const latCandidate = vertex.lat ?? vertex.latitude;
        const altCandidate = vertex.alt ?? vertex.altitude ?? vertex.height;

        return {
          lng: SpatialIdAdapter._toNumber(lngCandidate),
          lat: SpatialIdAdapter._toNumber(latCandidate),
          alt: SpatialIdAdapter._toNumber(altCandidate)
        };
      }

      Logger.warn('SpatialIdAdapter: Unexpected vertex format from provider', { index, vertex });
      return { lng: 0, lat: 0, alt: 0 };
    });
  }

  /**
   * Safely convert value to finite number, defaulting to 0.
   * 値を有限な数値に変換（失敗時は0）
   *
   * @param {*} value - Value to convert / 変換する値
   * @returns {number}
   * @private
   */
  static _toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
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
    const earthCircumference = COORDINATE_CONSTANTS.EARTH_CIRCUMFERENCE_EQUATOR;
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
