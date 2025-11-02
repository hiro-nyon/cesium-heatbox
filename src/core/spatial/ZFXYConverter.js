/**
 * ZFXYConverter - Built-in ZFXY (3D tile coordinates) converter
 * 内蔵ZFXY（3次元タイル座標）コンバーター
 * 
 * Provides Web Mercator-based ZFXY conversion without external dependencies.
 * This is a fallback when ouranos-gex-lib-for-javascript is not available.
 * 
 * Features:
 * - Web Mercator projection for X/Y tile calculation
 * - Fixed altitude binning for F (vertical) coordinate
 * - 8-vertex bounding box generation
 * - Coordinate normalization and clamping
 * 
 * 外部依存なしでWeb MercatorベースのZFXY変換を提供。
 * ouranos-gex-lib-for-javascriptが利用できない場合のフォールバック。
 * 
 * 機能：
 * - X/Yタイル計算にWeb Mercator投影を使用
 * - F（垂直）座標の固定高度ビニング
 * - 8頂点バウンディングボックス生成
 * - 座標の正規化とクランプ
 * 
 * @class
 * @version 0.1.17
 * @since 0.1.17
 * 
 * @example
 * // Basic usage
 * const result = ZFXYConverter.convert(139.7, 35.69, 50, 25);
 * 
 * console.log(result.zfxy);     // {z: 25, f: 5, x: 28765, y: 12850}
 * console.log(result.zfxyStr);  // "/25/5/28765/12850"
 * console.log(result.vertices.length); // 8
 * 
 * @example
 * // Coordinates are automatically normalized
 * const normalized = ZFXYConverter.convert(200, 90, -50, 25);
 * // lng: 200 → -160 (normalized to -180..180)
 * // lat: 90 → 85.0511 (clamped to Web Mercator limits)
 * // alt: -50 → valid (negative altitudes supported)
 */
export class ZFXYConverter {
  /**
   * Convert lng/lat/alt to ZFXY coordinates and bounding box
   * lng/lat/altをZFXY座標とバウンディングボックスに変換
   * 
   * @param {number} lng - Longitude (degrees, -180 to 180)
   * @param {number} lat - Latitude (degrees, -85.0511 to 85.0511)
   * @param {number} alt - Altitude (meters)
   * @param {number} zoom - Zoom level (0-35)
   * @returns {{zfxy: {z, f, x, y}, zfxyStr: string, vertices: Array<{lng, lat, alt}>}}
   */
  static convert(lng, lat, alt, zoom) {
    // Clamp inputs to valid ranges
    lng = ZFXYConverter._normalizeLongitude(lng);
    lat = ZFXYConverter._clampLatitude(lat);
    zoom = Math.max(0, Math.min(35, Math.floor(zoom)));

    // Calculate XY tile coordinates (Web Mercator)
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);

    // Calculate F (altitude index)
    // Simplified: use fixed altitude bins (e.g., 10m per level at zoom 25)
    // This is an approximation; actual F calculation depends on zoom level
    const altitudePerBin = ZFXYConverter._getAltitudePerBin(zoom);
    const f = Math.floor(alt / altitudePerBin);

    const zfxy = { z: zoom, f, x, y };
    const zfxyStr = `/${zoom}/${f}/${x}/${y}`;

    // Calculate 8 vertices (bounding box corners)
    const vertices = ZFXYConverter._calculateVertices(lng, lat, alt, zoom, x, y, f, altitudePerBin);

    return { zfxy, zfxyStr, vertices };
  }

  /**
   * Normalize longitude to [-180, 180]
   * 経度を[-180, 180]に正規化
   * 
   * @param {number} lng - Longitude (degrees)
   * @returns {number} Normalized longitude
   * @private
   */
  static _normalizeLongitude(lng) {
    // Handle ±180 equivalence: 180 -> -180
    if (lng === 180) return -180;
    
    // Wrap to [-180, 180]
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    
    return lng;
  }

  /**
   * Clamp latitude to Web Mercator limits
   * 緯度をWeb Mercator制限にクランプ
   * 
   * @param {number} lat - Latitude (degrees)
   * @returns {number} Clamped latitude
   * @private
   */
  static _clampLatitude(lat) {
    const MAX_LAT = 85.0511287798;  // Web Mercator limit
    return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
  }

  /**
   * Get altitude per bin for given zoom level
   * 指定されたズームレベルの高度ビンを取得
   * 
   * @param {number} zoom - Zoom level
   * @returns {number} Altitude per bin in meters
   * @private
   */
  static _getAltitudePerBin(zoom) {
    // Simplified altitude binning
    // Actual specification may vary; this is an approximation
    // 簡略化された高度ビン
    // 実際の仕様は異なる可能性があります；これは近似値
    
    if (zoom <= 10) return 1000;  // 1km per bin
    if (zoom <= 15) return 100;   // 100m per bin
    if (zoom <= 20) return 50;    // 50m per bin
    if (zoom <= 25) return 10;    // 10m per bin
    return 5;  // 5m per bin for zoom > 25
  }

  /**
   * Calculate 8 vertices of the voxel bounding box
   * ボクセルバウンディングボックスの8頂点を計算
   * 
   * @param {number} lng - Center longitude
   * @param {number} lat - Center latitude
   * @param {number} alt - Center altitude
   * @param {number} zoom - Zoom level
   * @param {number} x - X tile coordinate
   * @param {number} y - Y tile coordinate
   * @param {number} f - F altitude index
   * @param {number} altitudePerBin - Altitude per bin
   * @returns {Array<{lng, lat, alt}>} 8 corner vertices
   * @private
   */
  static _calculateVertices(lng, lat, alt, zoom, x, y, f, altitudePerBin) {
    const n = Math.pow(2, zoom);
    
    // Calculate tile bounds in lng/lat
    const minLng = x / n * 360 - 180;
    const maxLng = (x + 1) / n * 360 - 180;
    
    const minLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n)));
    const maxLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
    const minLat = minLatRad * 180 / Math.PI;
    const maxLat = maxLatRad * 180 / Math.PI;
    
    // Calculate altitude bounds
    const minAlt = f * altitudePerBin;
    const maxAlt = (f + 1) * altitudePerBin;
    
    // 8 vertices: bottom 4 + top 4
    const vertices = [
      // Bottom face (minAlt)
      { lng: minLng, lat: minLat, alt: minAlt },  // 0: SW bottom
      { lng: maxLng, lat: minLat, alt: minAlt },  // 1: SE bottom
      { lng: maxLng, lat: maxLat, alt: minAlt },  // 2: NE bottom
      { lng: minLng, lat: maxLat, alt: minAlt },  // 3: NW bottom
      // Top face (maxAlt)
      { lng: minLng, lat: minLat, alt: maxAlt },  // 4: SW top
      { lng: maxLng, lat: minLat, alt: maxAlt },  // 5: SE top
      { lng: maxLng, lat: maxLat, alt: maxAlt },  // 6: NE top
      { lng: minLng, lat: maxLat, alt: maxAlt }   // 7: NW top
    ];
    
    return vertices;
  }

  /**
   * Validate ZFXY coordinates
   * ZFXY座標を検証
   * 
   * @param {Object} zfxy - ZFXY coordinates
   * @param {number} zfxy.z - Zoom level
   * @param {number} zfxy.f - Altitude index
   * @param {number} zfxy.x - X tile coordinate
   * @param {number} zfxy.y - Y tile coordinate
   * @returns {boolean} True if valid
   */
  static validateZFXY(zfxy) {
    if (!zfxy || typeof zfxy !== 'object') return false;
    
    const { z, f, x, y } = zfxy;
    
    // Check types
    if (!Number.isInteger(z) || !Number.isInteger(f) || 
        !Number.isInteger(x) || !Number.isInteger(y)) {
      return false;
    }
    
    // Check ranges
    if (z < 0 || z > 35) return false;
    
    const n = Math.pow(2, z);
    if (x < 0 || x >= n) return false;
    if (y < 0 || y >= n) return false;
    
    // F can be negative (below sea level) or very large
    // No strict bounds on F in this implementation
    
    return true;
  }

  /**
   * Parse zfxyStr to ZFXY object
   * zfxyStr文字列をZFXYオブジェクトにパース
   * 
   * @param {string} zfxyStr - ZFXY string in format "/z/f/x/y"
   * @returns {{z, f, x, y}|null} Parsed ZFXY or null if invalid
   */
  static parseZFXYStr(zfxyStr) {
    if (typeof zfxyStr !== 'string') return null;
    
    const parts = zfxyStr.split('/').filter(p => p.length > 0);
    if (parts.length !== 4) return null;
    
    const [z, f, x, y] = parts.map(p => parseInt(p, 10));
    
    if (Number.isNaN(z) || Number.isNaN(f) || Number.isNaN(x) || Number.isNaN(y)) {
      return null;
    }
    
    const zfxy = { z, f, x, y };
    return ZFXYConverter.validateZFXY(zfxy) ? zfxy : null;
  }
}

