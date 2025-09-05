/**
 * ADR-0008 Phase 3: VoxelRenderer からレンダリングエンジンを分離
 * Main rendering engine for 3D voxels.
 * 3Dボクセル用メインレンダリングエンジン
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';
import { ColorMap } from '../color/ColorMap.js';
import { VoxelGeometry } from './VoxelGeometry.js';
import { VoxelEntityFactory } from './VoxelEntityFactory.js';

/**
 * VoxelRenderingEngine handles the main rendering loop and voxel creation.
 * VoxelRenderingEngineはメインの描画ループとボクセル作成を処理します。
 */
export class VoxelRenderingEngine {
  /**
   * Constructor
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer / CesiumJS Viewer
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.entityFactory = new VoxelEntityFactory();
    this.colorMap = new ColorMap();
  }

  /**
   * Render voxel data (main rendering loop).
   * ボクセルデータを描画（メイン描画ループ）
   * @param {Array} displayVoxels - Voxels to display / 表示するボクセル
   * @param {Set} topNVoxels - TopN highlighted voxels / TopN強調表示ボクセル
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {Object} grid - Grid info / グリッド情報  
   * @param {Object} statistics - Statistics / 統計情報
   * @param {Object} options - Rendering options / 描画オプション
   * @param {Function} calculateAdaptiveParams - Adaptive parameter calculation / 適応パラメータ計算
   * @param {Object} outlineRenderer - Outline renderer / 枠線レンダラー
   * @param {Object} adaptiveOutlineController - Adaptive outline controller / 適応枠線コントローラー
   * @returns {Array} Created entities / 作成されたエンティティ
   */
  renderVoxels(displayVoxels, topNVoxels, bounds, grid, statistics, options, calculateAdaptiveParams, outlineRenderer, adaptiveOutlineController) {
    const entities = [];
    
    Logger.debug(`Rendering ${displayVoxels.length} voxels`);
    
    // 実際にボクセルを描画
    displayVoxels.forEach(({ key, info }) => {
      try {
        const { x, y, z } = info;
        
        // ADR-0008 Phase 1: ボクセル中心座標をVoxelGeometryで計算
        const center = VoxelGeometry.calculateVoxelCenter(x, y, z, bounds, grid);
        const centerLon = center.longitude;
        const centerLat = center.latitude;
        const centerAlt = center.altitude;
        
        const isTopN = topNVoxels.has(key); // v0.1.5: TopNハイライト判定
        
        // 位置を先に計算して適応パラメータに渡す
        const position = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt);
        // v0.1.7: 適応的パラメータの計算（位置情報を含めて渡す）
        const adaptiveParams = calculateAdaptiveParams({ ...info, position }, isTopN, null, statistics);
        
        // 密度に応じた色を計算
        let color, opacity;
        
        // 正規化密度を計算
        const normalizedDensity = statistics.maxCount > statistics.minCount ? 
          (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
        
        if (info.count === 0) {
          // 空ボクセルの場合
          color = Cesium.Color.LIGHTGRAY;
          opacity = options.emptyOpacity;
        } else {
          // データありボクセルの場合
          color = ColorMap.interpolateColor(normalizedDensity, info.count, options);
          
          // v0.1.7: 透明度resolverの適用（優先順位：resolver > 適応的 > 固定値）
          if (options.boxOpacityResolver && typeof options.boxOpacityResolver === 'function') {
            const resolverCtx = {
              voxel: { x, y, z, count: info.count },
              isTopN,
              normalizedDensity,
              statistics,
              adaptiveParams
            };
            try {
              const resolverOpacity = options.boxOpacityResolver(resolverCtx);
              opacity = isNaN(resolverOpacity) ? options.opacity : Math.max(0, Math.min(1, resolverOpacity));
            } catch (e) {
              Logger.warn('boxOpacityResolver error, using fallback:', e);
              opacity = adaptiveParams.boxOpacity || options.opacity;
            }
          } else {
            opacity = adaptiveParams.boxOpacity || options.opacity;
          }
          
          // v0.1.5: TopN強調表示での淡色化処理
          if (options.highlightTopN && !isTopN && !options.boxOpacityResolver) {
            opacity *= 0.3; // TopN以外を薄くする
          }
        }

        // ADR-0008 Phase 1: ボクセル寸法計算をVoxelGeometryで実行
        const dimensions = VoxelGeometry.calculateVoxelDimensions(grid);
        
        // 高さベース表現の場合の高さ調整
        let adjustedHeight = dimensions.height;
        let adjustedAlt = centerAlt;
        
        if (options.heightBased && info.count > 0 && statistics.maxCount > 0) {
          const heightRatio = info.count / statistics.maxCount;
          adjustedHeight = dimensions.height * Math.max(0.1, heightRatio);
          adjustedAlt = centerAlt + (adjustedHeight - dimensions.height) / 2;
        }

        // 枠線の設定
        let outlineWidth = options.outlineWidth;
        let outlineColor = options.showOutline ? Cesium.Color.WHITE : undefined;
        
        // v0.1.6: 動的枠線制御の適用（優先順位：resolver > 適応的 > 固定値）
        if (options.outlineWidthResolver && typeof options.outlineWidthResolver === 'function') {
          const resolverCtx = {
            voxel: { x, y, z, count: info.count },
            isTopN,
            density: info.count,
            normalizedDensity: statistics.maxCount > statistics.minCount ? 
              (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0,
            statistics,
            adaptiveParams
          };
          try {
            const resolverWidth = options.outlineWidthResolver(resolverCtx);
            outlineWidth = isNaN(resolverWidth) ? options.outlineWidth : Math.max(0, resolverWidth);
          } catch (e) {
            Logger.warn('outlineWidthResolver error, using fallback:', e);
            outlineWidth = adaptiveParams.outlineWidth || options.outlineWidth;
          }
        } else {
          // v0.1.7: 適応的枠線制御のサポート
          if (options.adaptiveOutlines && adaptiveParams.outlineWidth !== null) {
            outlineWidth = adaptiveParams.outlineWidth;
          }
        }
        
        // 枠線不透明度の処理
        let outlineOpacity = 1.0;
        if (options.outlineOpacityResolver && typeof options.outlineOpacityResolver === 'function') {
          const resolverCtx = {
            voxel: { x, y, z, count: info.count },
            isTopN,
            density: info.count,
            normalizedDensity: statistics.maxCount > statistics.minCount ? 
              (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0,
            statistics,
            adaptiveParams
          };
          try {
            const resolverOpacity = options.outlineOpacityResolver(resolverCtx);
            outlineOpacity = isNaN(resolverOpacity) ? 1.0 : Math.max(0, Math.min(1, resolverOpacity));
          } catch (e) {
            Logger.warn('outlineOpacityResolver error, using fallback:', e);
            outlineOpacity = adaptiveParams.outlineOpacity || 1.0;
          }
        } else {
          outlineOpacity = adaptiveParams.outlineOpacity || 1.0;
        }

        // 枠線の色に透明度を適用
        if (outlineColor && outlineOpacity !== 1.0) {
          outlineColor = outlineColor.withAlpha(outlineOpacity);
        }

        // ADR-0008 Phase 1: VoxelEntityFactoryでエンティティ作成
        const entityConfig = VoxelEntityFactory.createBoxEntity({
          position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, adjustedAlt),
          dimensions: new Cesium.Cartesian3(dimensions.width, adjustedHeight, dimensions.depth),
          color: color,
          opacity: opacity,
          wireframe: options.wireframeOnly,
          outline: {
            show: options.showOutline === true,
            color: outlineColor,
            width: outlineWidth || 1
          },
          properties: {
            key: key,
            count: info.count,
            x: info.x,
            y: info.y,
            z: info.z,
            isTopN: isTopN,
            normalizedDensity: normalizedDensity
          }
        });

        // Cesiumエンティティを直接作成
        const boxEntity = new Cesium.Entity({
          id: `voxel-${key}`,
          ...entityConfig
        });
        
        // 拡張情報を設定
        boxEntity.description = options.createVoxelDescription ? 
          options.createVoxelDescription(info, normalizedDensity, statistics) : `Count: ${info.count}`;
        
        this.viewer.entities.add(boxEntity);
        entities.push(boxEntity);

        // ADR-0008 Phase 2: Render outline using OutlineRenderer (after box added)
        const outlineOptions = {
          outlineRenderMode: options.outlineRenderMode,
          outlineInset: options.outlineInset,
          outlineInsetMode: options.outlineInsetMode,
          showOutline: options.showOutline,
          outlineColor: outlineColor,
          outlineWidth: outlineWidth,
          enableThickFrames: options.enableThickFrames
        };
        
        const voxelInfoWithPosition = {
          ...info,
          position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, adjustedAlt),
          width: dimensions.width,
          height: adjustedHeight,
          depth: dimensions.depth,
          isTopN: isTopN
        };

        const outlineEntities = outlineRenderer.renderOutline(voxelInfoWithPosition, outlineOptions, adaptiveParams);
        outlineEntities.forEach(entity => {
          this.viewer.entities.add(entity);
          entities.push(entity);
        });

      } catch (error) {
        Logger.error('Error rendering voxel:', error, { key, info });
      }
    });

    Logger.info(`Successfully rendered ${entities.length} voxels`);
    return entities;
  }

  /**
   * Process display voxels from voxel data.
   * ボクセルデータから表示用ボクセルを処理
   * @param {Map} voxelData - Raw voxel data / 生ボクセルデータ
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {Object} grid - Grid info / グリッド情報
   * @param {Object} options - Options / オプション
   * @param {Function} selectVoxelsForRendering - Voxel selection function / ボクセル選択関数
   * @returns {Object} Processing result / 処理結果
   */
  processDisplayVoxels(voxelData, bounds, grid, options, selectVoxelsForRendering) {
    let displayVoxels = [];
    const topNVoxels = new Set();
    const maxVoxels = 1000000;

    // 空ボクセルのフィルタリング
    if (options.showEmptyVoxels) {
      // すべてのボクセルを表示
      for (let x = 0; x < grid.numVoxelsX; x++) {
        for (let y = 0; y < grid.numVoxelsY; y++) {
          for (let z = 0; z < grid.numVoxelsZ; z++) {
            const voxelKey = `${x},${y},${z}`;
            const voxelInfo = voxelData.get(voxelKey) || { x, y, z, count: 0, entities: [] };
            
            displayVoxels.push({
              key: voxelKey,
              info: voxelInfo
            });
            
            if (displayVoxels.length >= maxVoxels) {
              Logger.debug(`Reached maximum voxel limit of ${maxVoxels}`);
              break;
            }
          }
          if (displayVoxels.length >= maxVoxels) break;
        }
        if (displayVoxels.length >= maxVoxels) break;
      }
    } else {
      // データがあるボクセルのみ表示
      displayVoxels = Array.from(voxelData.entries()).map(([key, info]) => {
        return { key, info };
      });
      
      // v0.1.9: 適応的レンダリング制限の適用
      if (options.maxRenderVoxels && displayVoxels.length > options.maxRenderVoxels) {
        const selectionResult = selectVoxelsForRendering(displayVoxels, options.maxRenderVoxels, bounds, grid);
        displayVoxels = selectionResult.selectedVoxels;
        
        Logger.debug(`Applied ${selectionResult.strategy} strategy: ${displayVoxels.length} voxels selected, ${selectionResult.clippedNonEmpty} clipped`);
      }
    }

    // v0.1.5: TopN強調表示の前処理
    if (options.highlightTopN && options.highlightTopN > 0) {
      const sortedForTopN = [...displayVoxels].sort((a, b) => b.info.count - a.info.count);
      const topN = sortedForTopN.slice(0, options.highlightTopN);
      topN.forEach(voxel => topNVoxels.add(voxel.key));
      Logger.debug(`TopN highlight enabled: ${topNVoxels.size} voxels will be highlighted`);
    }

    return { displayVoxels, topNVoxels };
  }
}
