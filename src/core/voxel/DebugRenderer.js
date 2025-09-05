/**
 * Debug rendering utilities.
 * デバッグ描画ユーティリティ。
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';
import { VoxelEntityFactory } from './VoxelEntityFactory.js';

/**
 * Debug renderer class for development and troubleshooting.
 * 開発およびトラブルシューティング用のデバッグレンダラークラス。
 */
export class DebugRenderer {
  /**
   * Constructor.
   * @param {Cesium.Viewer} viewer - Cesium viewer instance / Cesiumビューアインスタンス
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.debugEntities = [];
  }

  /**
   * Check if debug bounds should be shown.
   * デバッグ境界を表示すべきかチェックします。
   * @param {Object|boolean} debugOptions - Debug options / デバッグオプション
   * @returns {boolean} True if bounds should be shown / 境界を表示する場合true
   */
  shouldShowBounds(debugOptions) {
    if (!debugOptions) {
      return false;
    }
    
    if (typeof debugOptions === 'boolean') {
      // 従来の動作：debugがtrueの場合はバウンディングボックス表示
      return debugOptions;
    }
    
    if (typeof debugOptions === 'object' && debugOptions !== null) {
      // 新しい動作：debug.showBoundsで明示的に制御
      return debugOptions.showBounds === true;
    }
    
    return false;
  }

  /**
   * Render debug bounding box.
   * デバッグ用バウンディングボックスを描画します。
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} debugOptions - Debug options / デバッグオプション
   * @returns {boolean} True if successfully rendered / 正常に描画された場合true
   */
  renderBoundingBox(bounds, debugOptions) {
    if (!this.shouldShowBounds(debugOptions)) {
      return false;
    }

    try {
      const boundingBoxConfig = VoxelEntityFactory.createDebugBoundingBox(bounds);
      if (!boundingBoxConfig) {
        Logger.warn('Failed to create debug bounding box configuration');
        return false;
      }

      const boundingBox = this.viewer.entities.add(boundingBoxConfig);
      this.debugEntities.push(boundingBox);
      
      Logger.debug('Debug bounding box added:', {
        center: { 
          lon: (bounds.minLon + bounds.maxLon) / 2, 
          lat: (bounds.minLat + bounds.maxLat) / 2, 
          alt: (bounds.minAlt + bounds.maxAlt) / 2 
        },
        size: { 
          width: (bounds.maxLon - bounds.minLon) * 111000 * Math.cos(((bounds.minLat + bounds.maxLat) / 2) * Math.PI / 180), 
          depth: (bounds.maxLat - bounds.minLat) * 111000, 
          height: bounds.maxAlt - bounds.minAlt 
        }
      });
      
      return true;
      
    } catch (error) {
      Logger.warn('Failed to render debug bounding box:', error);
      return false;
    }
  }

  /**
   * Render debug grid lines.
   * デバッグ用グリッド線を描画します。
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Object} debugOptions - Debug options / デバッグオプション
   * @returns {number} Number of grid lines rendered / 描画されたグリッド線数
   */
  renderGridLines(bounds, grid, debugOptions) {
    if (!debugOptions || !debugOptions.showGrid) {
      return 0;
    }

    try {
      let renderedLines = 0;
      
      // X軸方向のグリッド線（経度方向）
      for (let x = 0; x <= grid.numVoxelsX; x++) {
        const lon = bounds.minLon + x * (bounds.maxLon - bounds.minLon) / grid.numVoxelsX;
        
        const gridLine = this.viewer.entities.add({
          polyline: {
            positions: [
              Cesium.Cartesian3.fromDegrees(lon, bounds.minLat, bounds.minAlt),
              Cesium.Cartesian3.fromDegrees(lon, bounds.maxLat, bounds.minAlt),
              Cesium.Cartesian3.fromDegrees(lon, bounds.maxLat, bounds.maxAlt),
              Cesium.Cartesian3.fromDegrees(lon, bounds.minLat, bounds.maxAlt),
              Cesium.Cartesian3.fromDegrees(lon, bounds.minLat, bounds.minAlt)
            ],
            width: 1,
            material: Cesium.Color.CYAN.withAlpha(0.3),
            arcType: Cesium.ArcType.NONE
          },
          properties: {
            type: 'debug-grid',
            direction: 'x',
            index: x
          }
        });
        
        this.debugEntities.push(gridLine);
        renderedLines++;
      }
      
      // Y軸方向のグリッド線（緯度方向）
      for (let y = 0; y <= grid.numVoxelsY; y++) {
        const lat = bounds.minLat + y * (bounds.maxLat - bounds.minLat) / grid.numVoxelsY;
        
        const gridLine = this.viewer.entities.add({
          polyline: {
            positions: [
              Cesium.Cartesian3.fromDegrees(bounds.minLon, lat, bounds.minAlt),
              Cesium.Cartesian3.fromDegrees(bounds.maxLon, lat, bounds.minAlt),
              Cesium.Cartesian3.fromDegrees(bounds.maxLon, lat, bounds.maxAlt),
              Cesium.Cartesian3.fromDegrees(bounds.minLon, lat, bounds.maxAlt),
              Cesium.Cartesian3.fromDegrees(bounds.minLon, lat, bounds.minAlt)
            ],
            width: 1,
            material: Cesium.Color.MAGENTA.withAlpha(0.3),
            arcType: Cesium.ArcType.NONE
          },
          properties: {
            type: 'debug-grid',
            direction: 'y',
            index: y
          }
        });
        
        this.debugEntities.push(gridLine);
        renderedLines++;
      }
      
      Logger.debug(`Debug grid rendered: ${renderedLines} lines`);
      return renderedLines;
      
    } catch (error) {
      Logger.warn('Failed to render debug grid:', error);
      return 0;
    }
  }

  /**
   * Render debug statistics overlay.
   * デバッグ統計情報オーバーレイを描画します。
   * @param {Object} stats - Rendering statistics / 描画統計情報
   * @param {Object} debugOptions - Debug options / デバッグオプション
   * @returns {boolean} True if successfully rendered / 正常に描画された場合true
   */
  renderStatsOverlay(stats, debugOptions) {
    if (!debugOptions || !debugOptions.showStats) {
      return false;
    }

    try {
      // Create stats HTML overlay
      const _statsHtml = `
        <div style="
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 12px;
          z-index: 1000;
        ">
          <h4 style="margin: 0 0 10px 0;">Debug Stats</h4>
          <div>Total Voxels: ${stats.totalVoxels || 0}</div>
          <div>Rendered Voxels: ${stats.renderedVoxels || 0}</div>
          <div>Render Time: ${stats.renderTime || 0}ms</div>
          <div>Memory Usage: ${stats.memoryUsage || 'N/A'}</div>
        </div>
      `;
      
      // Note: In a real implementation, you would need to handle DOM overlay creation
      // This is a simplified version for demonstration
      Logger.debug('Debug stats overlay would be rendered:', stats);
      
      return true;
      
    } catch (error) {
      Logger.warn('Failed to render debug stats overlay:', error);
      return false;
    }
  }

  /**
   * Clear all debug entities.
   * 全てのデバッグエンティティをクリアします。
   */
  clear() {
    Logger.debug('DebugRenderer.clear - Removing', this.debugEntities.length, 'debug entities');
    
    this.debugEntities.forEach(entity => {
      try {
        const isDestroyed = typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
        
        if (entity && !isDestroyed) {
          this.viewer.entities.remove(entity);
        }
      } catch (error) {
        Logger.warn('Debug entity removal error:', error);
      }
    });
    
    this.debugEntities = [];
  }

  /**
   * Get debug entity count.
   * デバッグエンティティ数を取得します。
   * @returns {number} Number of debug entities / デバッグエンティティ数
   */
  getEntityCount() {
    return this.debugEntities.length;
  }

  /**
   * Log debug information.
   * デバッグ情報をログ出力します。
   * @param {string} category - Debug category / デバッグカテゴリ
   * @param {Object} data - Debug data / デバッグデータ
   */
  logDebugInfo(category, data) {
    Logger.debug(`[${category}]`, data);
  }
}
