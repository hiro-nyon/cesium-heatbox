/**
 * データ処理を担当するクラス（シンプル実装）
 */
import * as Cesium from 'cesium';
import { VoxelGrid } from './VoxelGrid.js';
import { Logger } from '../utils/logger.js';
import { SpatialIdAdapter } from './spatial/SpatialIdAdapter.js';

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
   * @param {Object} [options={}] - Processing options (v0.1.17: spatialId support) / 処理オプション
   * @returns {Promise<Map>} Voxel data Map (key: voxel key, value: info) / ボクセルデータ（キー: ボクセルキー, 値: ボクセル情報）
   */
  static async classifyEntitiesIntoVoxels(entities, bounds, grid, options = {}) {
    // v0.1.17: Spatial ID mode (tile-grid) / 空間IDモード（tile-grid）
    if (options.spatialId?.enabled) {
      return await DataProcessor._classifyBySpatialId(entities, bounds, grid, options);
    }
    
    // Uniform grid mode (default) / 一様グリッドモード（デフォルト）
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
    
    // v0.1.17: Spatial ID mode can exceed grid.totalVoxels, clamp emptyVoxels to non-negative
    // 空間IDモードではgrid.totalVoxelsを超える可能性があるため、emptyVoxelsを非負にクランプ
    const emptyVoxels = Math.max(0, grid.totalVoxels - voxelData.size);
    
    const stats = {
      totalVoxels: grid.totalVoxels,
      renderedVoxels: 0, // 実際の描画後にVoxelRendererから設定される
      nonEmptyVoxels: voxelData.size,
      emptyVoxels: emptyVoxels,
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
  
  /**
   * Classify entities using Spatial ID (tile-grid mode).
   * 空間IDを使用してエンティティを分類（tile-gridモード）。
   * @param {Array} entities - Entity array / エンティティ配列
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {Object} grid - Grid info (for normalized indices) / グリッド情報（正規化インデックス用）
   * @param {Object} options - Processing options with spatialId config / spatialId設定を含む処理オプション
   * @returns {Promise<Map>} Voxel data Map (key: zfxyStr, value: info) / ボクセルデータ（キー: zfxyStr, 値: ボクセル情報）
   * @private
   */
  static async _classifyBySpatialId(entities, bounds, grid, options) {
    Logger.debug(`Spatial ID mode enabled: ${options.spatialId.mode}`);
    
    // Initialize SpatialIdAdapter / SpatialIdAdapterを初期化
    const adapter = new SpatialIdAdapter({
      provider: options.spatialId.provider || 'ouranos-gex'
    });
    
    await adapter.loadProvider();
    
    // Determine zoom level (auto or manual) / ズームレベルを決定（auto/manual）
    let zoom;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    
    if (options.spatialId.zoomControl === 'auto') {
      const targetSize = options.voxelSize || 30;
      const tolerance = options.spatialId.zoomTolerancePct || 10;
      zoom = adapter.calculateOptimalZoom(targetSize, centerLat, tolerance);
      Logger.info(`Auto-selected zoom level ${zoom} for target size ${targetSize}m (lat: ${centerLat.toFixed(4)}°)`);
    } else {
      // Manual mode: validate zoom is a valid number
      // 手動モード: ズームが有効な数値であることを検証
      const manualZoom = options.spatialId.zoom;
      if (typeof manualZoom === 'number' && Number.isFinite(manualZoom) && manualZoom >= 0 && manualZoom <= 35) {
        zoom = Math.floor(manualZoom);
      } else {
        // Invalid or 'auto' passed to manual mode, use default
        // 無効な値または'auto'が手動モードに渡された場合、デフォルトを使用
        zoom = 25;
        Logger.warn(`Invalid zoom value in manual mode (${manualZoom}), using default zoom level ${zoom}`);
      }
      Logger.info(`Using manual zoom level ${zoom}`);
    }
    
    // Store zoom level and provider info for statistics / 統計情報用にズームレベルとプロバイダー情報を保存
    options._resolvedZoom = zoom;
    options._spatialIdProvider = adapter.fallbackMode ? null : options.spatialId.provider;
    
    // Process entities and aggregate by spatial ID / エンティティを処理して空間IDで集約
    const voxelMap = new Map();
    let processedCount = 0;
    let skippedCount = 0;
    
    const currentTime = Cesium.JulianDate.now();
    
    for (const entity of entities) {
      try {
        // Get entity position / エンティティの位置を取得
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
          continue;
        }
        
        // Convert to lng/lat/alt / lng/lat/altに変換
        let lng, lat, alt;
        const looksLikeDegrees = typeof position?.x === 'number' && typeof position?.y === 'number' &&
          Math.abs(position.x) <= 360 && Math.abs(position.y) <= 90;
        
        if (looksLikeDegrees) {
          lng = position.x;
          lat = position.y;
          alt = typeof position.z === 'number' ? position.z : 0;
        } else if (Cesium.Cartographic && typeof Cesium.Cartographic.fromCartesian === 'function') {
          const cartographic = Cesium.Cartographic.fromCartesian(position);
          if (!cartographic) {
            skippedCount++;
            continue;
          }
          lng = Cesium.Math.toDegrees(cartographic.longitude);
          lat = Cesium.Math.toDegrees(cartographic.latitude);
          alt = cartographic.height;
        } else {
          if (typeof position.x !== 'number' || typeof position.y !== 'number') {
            skippedCount++;
            continue;
          }
          lng = position.x;
          lat = position.y;
          alt = typeof position.z === 'number' ? position.z : 0;
        }
        
        // Get voxel bounds from spatial ID / 空間IDからボクセル境界を取得
        const { zfxy, zfxyStr, vertices } = adapter.getVoxelBounds(lng, lat, alt, zoom);
        
        // Aggregate by zfxyStr (public key format) / zfxyStr（公開キー形式）で集約
        if (!voxelMap.has(zfxyStr)) {
          // Calculate normalized indices for VoxelSelector compatibility
          // VoxelSelector互換のために正規化されたインデックスを計算
          // Center coordinates from vertices average / 頂点の平均から中心座標を計算
          const centerLng = vertices.reduce((sum, v) => sum + v.lng, 0) / 8;
          const centerLat = vertices.reduce((sum, v) => sum + v.lat, 0) / 8;
          const centerAlt = vertices.reduce((sum, v) => sum + v.alt, 0) / 8;
          
          // Calculate spans with zero-span guards (same as uniform grid mode)
          // ゼロスパンガード付きでスパンを計算（一様グリッドモードと同じ）
          const lngSpan = bounds.maxLon - bounds.minLon;
          const latSpan = bounds.maxLat - bounds.minLat;
          const altSpan = bounds.maxAlt - bounds.minAlt;
          
          // Normalize to grid indices (0...numVoxels range for VoxelSelector)
          // グリッドインデックスに正規化（VoxelSelector用の0...numVoxels範囲）
          // When span is zero, default to 0 (flat dimension)
          // スパンがゼロの場合は0にデフォルト設定（平坦な次元）
          const normalizedX = lngSpan === 0 ? 0 : Math.floor((centerLng - bounds.minLon) / lngSpan * grid.numVoxelsX);
          const normalizedY = latSpan === 0 ? 0 : Math.floor((centerLat - bounds.minLat) / latSpan * grid.numVoxelsY);
          const normalizedZ = altSpan === 0 ? 0 : Math.floor((centerAlt - bounds.minAlt) / altSpan * grid.numVoxelsZ);
          
          // Clamp to valid grid range / 有効なグリッド範囲にクランプ
          const safeX = Math.max(0, Math.min(grid.numVoxelsX - 1, normalizedX));
          const safeY = Math.max(0, Math.min(grid.numVoxelsY - 1, normalizedY));
          const safeZ = Math.max(0, Math.min(grid.numVoxelsZ - 1, normalizedZ));
          
          voxelMap.set(zfxyStr, {
            key: zfxyStr,
            // Normalized indices for compatibility with VoxelSelector and other systems
            // VoxelSelectorなど他システムとの互換性のための正規化インデックス
            x: safeX,
            y: safeY,
            z: safeZ,
            bounds: vertices,  // 8 vertices from ouranos-gex or fallback / ouranos-gexまたはフォールバックからの8頂点
            spatialId: { ...zfxy, id: zfxyStr },
            entities: [],
            count: 0
          });
        }
        
        const voxelInfo = voxelMap.get(zfxyStr);
        voxelInfo.entities.push(entity);
        voxelInfo.count++;
        processedCount++;
        
      } catch (error) {
        Logger.warn(`Failed to process entity for spatial ID:`, error);
        skippedCount++;
      }
    }
    
    Logger.info(`Spatial ID: ${processedCount} entities classified into ${voxelMap.size} voxels (${skippedCount} skipped)`);
    return voxelMap;
  }
}
