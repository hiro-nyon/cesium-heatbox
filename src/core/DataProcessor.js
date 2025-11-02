/**
 * データ処理を担当するクラス（シンプル実装）
 */
import * as Cesium from 'cesium';
import { VoxelGrid } from './VoxelGrid.js';
import { Logger } from '../utils/logger.js';
import { SpatialIdAdapter } from './spatial/SpatialIdAdapter.js';
import { resolvePropertyValue } from '../utils/cesiumProperty.js';

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

    // v0.1.18: Layer aggregation setup (ADR-0014)
    const aggregationOptions = options.aggregation || {};
    const aggregationEnabled = Boolean(aggregationOptions.enabled);
    const currentTime = Cesium.JulianDate.now();
    const byProperty = typeof aggregationOptions.byProperty === 'string' && aggregationOptions.byProperty.trim() !== ''
      ? aggregationOptions.byProperty.trim()
      : null;
    const userResolver = typeof aggregationOptions.keyResolver === 'function' ? aggregationOptions.keyResolver : null;
    let resolveLayerKey = null;

    if (aggregationEnabled) {
      if (userResolver || byProperty) {
        resolveLayerKey = (entity, entityIndex) => {
          let value;

          if (userResolver) {
            try {
              value = userResolver(entity);
            } catch (error) {
              Logger.warn(`[aggregation] keyResolver threw error for entity ${entityIndex}, using "unknown"`, error);
              return 'unknown';
            }
            value = resolvePropertyValue(value, currentTime);
          } else if (byProperty) {
            let resolved;
            try {
              const bag = entity.properties?.getValue?.(currentTime);
              if (bag && typeof bag === 'object' && byProperty in bag) {
                resolved = bag[byProperty];
              }
            } catch (error) {
              Logger.warn(`[aggregation] Failed to resolve PropertyBag for ${byProperty}, fallback to direct property`, error);
            }

            if (resolved === undefined) {
              const prop = entity.properties?.[byProperty];
              resolved = resolvePropertyValue(prop, currentTime);
            }

            value = resolved;
          }

          if (value === undefined || value === null || (typeof value === 'number' && Number.isNaN(value))) {
            return 'unknown';
          }

          const stringValue = String(value);
          return stringValue.trim() === '' ? 'unknown' : stringValue;
        };
      } else {
        Logger.warn('[aggregation] enabled but no byProperty or keyResolver specified, using "default" key');
        resolveLayerKey = () => 'default';
      }
    }

    Logger.debug(`Processing ${entities.length} entities for classification`);
    
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
        
        const { x: voxelX, y: voxelY, z: voxelZ } = DataProcessor._normalizeGridIndices(lon, lat, alt, bounds, grid);
        
        // インデックスが有効範囲内かチェック
        if (voxelX >= 0 && voxelX < grid.numVoxelsX &&
            voxelY >= 0 && voxelY < grid.numVoxelsY &&
            voxelZ >= 0 && voxelZ < grid.numVoxelsZ) {
            
          const voxelKey = VoxelGrid.getVoxelKey(voxelX, voxelY, voxelZ);
          
          if (!voxelData.has(voxelKey)) {
            const newVoxelInfo = {
              x: voxelX,
              y: voxelY,
              z: voxelZ,
              entities: [],
              count: 0
            };
            
            // v0.1.18: Initialize layerStats if aggregation enabled (ADR-0014)
            if (aggregationEnabled) {
              newVoxelInfo.layerStats = new Map();
            }
            
            voxelData.set(voxelKey, newVoxelInfo);
          }
          
          const voxelInfo = voxelData.get(voxelKey);
          voxelInfo.entities.push(entity);
          voxelInfo.count++;
          
          // v0.1.18: Aggregate by layer (ADR-0014)
          if (aggregationEnabled && resolveLayerKey) {
            const layerKey = resolveLayerKey(entity, index) || 'unknown';
            const currentCount = voxelInfo.layerStats.get(layerKey) || 0;
            voxelInfo.layerStats.set(layerKey, currentCount + 1);
          }
          
          processedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        Logger.warn(`エンティティ ${index} の処理に失敗:`, error);
        skippedCount++;
      }
    });
    
    // v0.1.18: Calculate layerTop (most common layer per voxel) (ADR-0014)
    if (aggregationEnabled) {
      for (const voxelInfo of voxelData.values()) {
        if (voxelInfo.layerStats && voxelInfo.layerStats.size > 0) {
          let maxCount = 0;
          let topLayer = null;
          
          for (const [layerKey, count] of voxelInfo.layerStats) {
            if (count > maxCount) {
              maxCount = count;
              topLayer = layerKey;
            }
          }
          
          voxelInfo.layerTop = topLayer;
        }
      }
      
      Logger.debug(`[aggregation] Calculated layerTop for ${voxelData.size} voxels`);
    }
    
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
   * Normalize geographic coordinates into grid indices with zero-span guards.
   * ゼロスパン対策付きで地理座標をグリッドインデックスに正規化
   *
   * @param {number} lon - Longitude / 経度
   * @param {number} lat - Latitude / 緯度
   * @param {number} alt - Altitude / 高度
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {Object} grid - Grid info / グリッド情報
   * @returns {{x: number, y: number, z: number}}
   * @private
   */
  static _normalizeGridIndices(lon, lat, alt, bounds, grid) {
    const safeVoxelCount = (value) => {
      const parsed = Number.isFinite(value) ? Math.floor(value) : 0;
      return parsed > 0 ? parsed : 1;
    };

    const normalizeAxis = (coordinate, minBound, maxBound, voxelCount) => {
      const span = Number.isFinite(maxBound - minBound) ? (maxBound - minBound) : 0;
      const clampedCoordinate = Number.isFinite(coordinate) ? coordinate : minBound;
      const count = safeVoxelCount(voxelCount);
      if (span === 0) {
        return 0;
      }
      const ratio = (clampedCoordinate - minBound) / span;
      const rawIndex = Math.floor(ratio * count);
      const maxIndex = count - 1;
      const finiteIndex = Number.isFinite(rawIndex) ? rawIndex : 0;
      return Math.max(0, Math.min(maxIndex, finiteIndex));
    };

    const x = normalizeAxis(lon, bounds.minLon, bounds.maxLon, grid.numVoxelsX);
    const y = normalizeAxis(lat, bounds.minLat, bounds.maxLat, grid.numVoxelsY);
    const z = normalizeAxis(alt, bounds.minAlt, bounds.maxAlt, grid.numVoxelsZ);

    return { x, y, z };
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
    
    // v0.1.18: Layer aggregation setup (ADR-0014)
    const aggregationOptions = options.aggregation || {};
    const aggregationEnabled = Boolean(aggregationOptions.enabled);
    const currentTime = Cesium.JulianDate.now();
    const byProperty = typeof aggregationOptions.byProperty === 'string' && aggregationOptions.byProperty.trim() !== ''
      ? aggregationOptions.byProperty.trim()
      : null;
    const userResolver = typeof aggregationOptions.keyResolver === 'function' ? aggregationOptions.keyResolver : null;
    let resolveLayerKey = null;

    if (aggregationEnabled) {
      if (userResolver || byProperty) {
        resolveLayerKey = (entity, entityIndex) => {
          let value;

          if (userResolver) {
            try {
              value = userResolver(entity);
            } catch (error) {
              Logger.warn(`[aggregation] keyResolver threw error for entity ${entityIndex}, using "unknown"`, error);
              return 'unknown';
            }
            value = resolvePropertyValue(value, currentTime);
          } else if (byProperty) {
            let resolved;
            try {
              const bag = entity.properties?.getValue?.(currentTime);
              if (bag && typeof bag === 'object' && byProperty in bag) {
                resolved = bag[byProperty];
              }
            } catch (error) {
              Logger.warn(`[aggregation] Failed to resolve PropertyBag for ${byProperty}, fallback to direct property`, error);
            }

            if (resolved === undefined) {
              const prop = entity.properties?.[byProperty];
              resolved = resolvePropertyValue(prop, currentTime);
            }

            value = resolved;
          }

          if (value === undefined || value === null || (typeof value === 'number' && Number.isNaN(value))) {
            return 'unknown';
          }

          const stringValue = String(value);
          return stringValue.trim() === '' ? 'unknown' : stringValue;
        };
      } else {
        Logger.warn('[aggregation] enabled but no byProperty or keyResolver specified, using "default" key');
        resolveLayerKey = () => 'default';
      }
    }
    
    // Process entities and aggregate by spatial ID / エンティティを処理して空間IDで集約
    const voxelMap = new Map();
    let processedCount = 0;
    let skippedCount = 0;
    
    let entityIndex = 0;
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

          const { x: safeX, y: safeY, z: safeZ } = DataProcessor._normalizeGridIndices(centerLng, centerLat, centerAlt, bounds, grid);

          const newVoxelInfo = {
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
          };
          
          // v0.1.18: Initialize layerStats if aggregation enabled (ADR-0014)
          if (aggregationEnabled) {
            newVoxelInfo.layerStats = new Map();
          }
          
          voxelMap.set(zfxyStr, newVoxelInfo);
        }
        
        const voxelInfo = voxelMap.get(zfxyStr);
        voxelInfo.entities.push(entity);
        voxelInfo.count++;
        
        // v0.1.18: Aggregate by layer (ADR-0014)
        if (aggregationEnabled && resolveLayerKey) {
          const layerKey = resolveLayerKey(entity, entityIndex) || 'unknown';
          const currentCount = voxelInfo.layerStats.get(layerKey) || 0;
          voxelInfo.layerStats.set(layerKey, currentCount + 1);
        }

        processedCount++;

      } catch (error) {
        Logger.warn(`Failed to process entity for spatial ID:`, error);
        skippedCount++;
      }

      entityIndex++;
    }
    
    // v0.1.18: Calculate layerTop (most common layer per voxel) (ADR-0014)
    if (aggregationEnabled) {
      for (const voxelInfo of voxelMap.values()) {
        if (voxelInfo.layerStats && voxelInfo.layerStats.size > 0) {
          let maxCount = 0;
          let topLayer = null;
          
          for (const [layerKey, count] of voxelInfo.layerStats) {
            if (count > maxCount) {
              maxCount = count;
              topLayer = layerKey;
            }
          }
          
          voxelInfo.layerTop = topLayer;
        }
      }
      
      Logger.debug(`[aggregation] Calculated layerTop for ${voxelMap.size} voxels (Spatial ID mode)`);
    }
    
    Logger.info(`Spatial ID: ${processedCount} entities classified into ${voxelMap.size} voxels (${skippedCount} skipped)`);
    return voxelMap;
  }
}
