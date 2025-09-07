/**
 * Class responsible for rendering 3D voxels.
 * 3Dボクセルの描画を担当するクラス。
 * 
 * v0.1.11-alpha: ADR-0009準拠のアーキテクチャ - Single Responsibility Principle適用
 * 
 * **アーキテクチャ概要**:
 * - **オーケストレーション役**: 各専門クラスを統括し、描画プロセス全体を調整
 * - **ColorCalculator**: 色計算・カラーマップ処理の専門クラス (Phase 1)
 * - **VoxelSelector**: ボクセル選択戦略の専門クラス (Phase 2)  
 * - **AdaptiveController**: 適応制御ロジックの専門クラス (Phase 3)
 * - **GeometryRenderer**: ジオメトリ作成・エンティティ管理の専門クラス (Phase 4)
 * - **Phase 5**: 完全オーケストレーション化・性能最適化済み
 * 
 * **責任範囲**:
 * - 描画プロセスの統制・調整
 * - 各専門クラス間のデータ連携
 * - 高レベルAPIの提供・後方互換性維持
 * - エラーハンドリング・ログ管理
 */
import * as Cesium from 'cesium';
import { Logger } from '../utils/logger.js';
import { ColorCalculator } from './color/ColorCalculator.js';
import { VoxelSelector } from './selection/VoxelSelector.js';
import { AdaptiveController } from './adaptive/AdaptiveController.js';
import { GeometryRenderer } from './geometry/GeometryRenderer.js';

// v0.1.11-alpha: COLOR_MAPS moved to ColorCalculator (ADR-0009 Phase 1)
// v0.1.11-alpha: VoxelSelector added (ADR-0009 Phase 2)
// v0.1.11-alpha: AdaptiveController added (ADR-0009 Phase 3)
// v0.1.11-alpha: GeometryRenderer added (ADR-0009 Phase 4)

/**
 * VoxelRenderer - 3D voxel rendering orchestration class.
 * 3Dボクセル描画オーケストレーションクラス。
 * 
 * v0.1.11-alpha: Refactored for Single Responsibility Principle (ADR-0009).
 * Now serves as orchestrator delegating specialized tasks to:
 * ColorCalculator, VoxelSelector, AdaptiveController, and GeometryRenderer.
 * 
 * 各専門クラスに特化タスクを委譲するオーケストレーション役に特化。
 */
export class VoxelRenderer {
  /**
   * Constructor - Initialize VoxelRenderer orchestration system.
   * VoxelRendererオーケストレーションシステムを初期化します。
   * 
   * v0.1.11-alpha: Instantiates specialized classes for delegation:
   * - VoxelSelector: Voxel selection strategies (density, coverage, hybrid)
   * - AdaptiveController: Adaptive parameter calculation and preset logic  
   * - GeometryRenderer: Entity creation and management
   * - ColorCalculator: Used statically for color computation
   * 
   * 各専門クラスをインスタンス化し、委譲体制を構築:
   * - VoxelSelector: ボクセル選択戦略（密度・カバレッジ・ハイブリッド）
   * - AdaptiveController: 適応パラメータ計算・プリセットロジック
   * - GeometryRenderer: エンティティ作成・管理
   * - ColorCalculator: 色計算用の静的利用
   * 
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer instance / CesiumJS Viewerインスタンス
   * @param {Object} options - Rendering options / 描画オプション
   * @param {Array} [options.minColor=[0,0,255]] - Minimum density color (RGB) / 最小密度色
   * @param {Array} [options.maxColor=[255,0,0]] - Maximum density color (RGB) / 最大密度色
   * @param {number} [options.opacity=0.8] - Base opacity / 基本透明度
   * @param {boolean} [options.showOutline=true] - Show voxel outlines / ボクセル枠線表示
   * @param {string} [options.voxelSelectionStrategy='density'] - Selection strategy / 選択戦略
   * @param {boolean} [options.adaptiveOutlines=false] - Enable adaptive outline control / 適応枠線制御
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = {
      minColor: [0, 0, 255],
      maxColor: [255, 0, 0],
      opacity: 0.8,
      emptyOpacity: 0.03,
      showOutline: true,
      showEmptyVoxels: false,
      wireframeOnly: false,    // 枠線のみ表示
      heightBased: false,      // 高さベース表現
      outlineWidth: 2,         // 枠線の太さ
      // v0.1.6.1: インセット枠線のデフォルト値
      outlineInset: 0,         // インセット枠線オフセット（メートル）
      outlineInsetMode: 'all', // インセット枠線適用範囲
      // v0.1.7: 新オプション
      outlineRenderMode: 'standard',
      adaptiveOutlines: false,
      outlineWidthPreset: 'uniform',
      boxOpacityResolver: null,
      outlineOpacityResolver: null,
      ...options
    };
    
    // v0.1.11-alpha: VoxelSelector instantiation (ADR-0009 Phase 2)
    this.voxelSelector = new VoxelSelector(this.options);
    this._selectionStats = null;
    
    // v0.1.11-alpha: AdaptiveController instantiation (ADR-0009 Phase 3)
    this.adaptiveController = new AdaptiveController(this.options);
    
    // v0.1.11-alpha: GeometryRenderer instantiation (ADR-0009 Phase 4)
    this.geometryRenderer = new GeometryRenderer(this.viewer, this.options);
    
    // Legacy compatibility: voxelEntities now delegates to GeometryRenderer
    Object.defineProperty(this, 'voxelEntities', {
      get: () => this.geometryRenderer.entities,
      enumerable: true,
      configurable: true
    });
    
    Logger.debug('VoxelRenderer initialized with options:', this.options);
  }

  /**
   * Compute adaptive outline parameters (v0.1.11-alpha).
   * 適応的枠線パラメータを計算 (v0.1.11-alpha)。
   * v0.1.11-alpha: AdaptiveControllerに委譲 (ADR-0009 Phase 3)
   * @param {Object} voxelInfo - Voxel info / ボクセル情報
   * @param {boolean} isTopN - Whether it is TopN / TopNボクセルかどうか
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @param {Object} statistics - Statistics / 統計情報
   * @returns {Object} Adaptive params / 適応的パラメータ
   * @private
   */
  _calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics) {
    // v0.1.11-alpha: 新しいAdaptiveControllerに委譲しつつ、既存インターフェースを維持 (ADR-0009 Phase 3)
    return this.adaptiveController.calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics, this.options);
  }

  /**
   * Backward-compatible inset outline decision API.
   * 後方互換のためのインセット枠線適用判定メソッド。
   * v0.1.11-alpha: GeometryRenderer に委譲 (ADR-0009 Phase 4)
   * @param {boolean} isTopN
   * @returns {boolean}
   * @private
   */
  _shouldApplyInsetOutline(isTopN) {
    return this.geometryRenderer.shouldApplyInsetOutline(isTopN);
  }

  /**
   * Render voxel data - Orchestrated rendering process.
   * ボクセルデータ描画 - オーケストレーション化された描画プロセス。
   * 
   * v0.1.11-alpha: Fully orchestrated implementation (ADR-0009 Phase 5):
   * 
   * **Process Flow**:
   * 1. **GeometryRenderer.clear()** - Clear existing entities
   * 2. **VoxelSelector.selectVoxels()** - Apply selection strategy if needed
   * 3. **For each voxel**: Delegate to `_renderSingleVoxel()` for orchestration:
   *    - **AdaptiveController** - Calculate adaptive parameters
   *    - **ColorCalculator** - Compute colors based on density  
   *    - **GeometryRenderer** - Create voxel box, outlines, and polylines
   * 4. **Return count** - Number of successfully rendered voxels
   * 
   * **実行フロー**:
   * 1. **GeometryRenderer.clear()** - 既存エンティティのクリア
   * 2. **VoxelSelector.selectVoxels()** - 必要に応じて選択戦略適用
   * 3. **各ボクセル**: `_renderSingleVoxel()` へのオーケストレーション委譲:
   *    - **AdaptiveController** - 適応パラメータ計算
   *    - **ColorCalculator** - 密度ベース色計算
   *    - **GeometryRenderer** - ボクセルボックス・枠線・ポリライン作成
   * 4. **カウント返却** - 正常描画されたボクセル数
   * 
   * @param {Map} voxelData - Voxel data map / ボクセルデータマップ
   * @param {Object} bounds - Spatial bounds / 空間境界
   * @param {Object} grid - Grid configuration / グリッド設定
   * @param {Object} statistics - Density statistics / 密度統計
   * @returns {number} Number of rendered voxels / 実際に描画されたボクセル数
   */
  render(voxelData, bounds, grid, statistics) {
    // v0.1.11-alpha: GeometryRendererに委譲してエンティティクリア (ADR-0009 Phase 4)
    this.geometryRenderer.clear();
    Logger.debug('VoxelRenderer.render - Starting render with simplified approach', {
      voxelDataSize: voxelData.size,
      bounds,
      grid,
      statistics
    });

    // バウンディングボックスのデバッグ表示制御（v0.1.5: debug.showBounds対応）
    const shouldShowBounds = this._shouldShowBounds();
    if (shouldShowBounds) {
      this._renderBoundingBox(bounds);
    }

    // 表示するボクセルのリスト
    let displayVoxels = [];
    const topNVoxels = new Set(); // v0.1.5: TopN強調表示用

    // 空ボクセルのフィルタリング
    if (this.options.showEmptyVoxels) {
      // 全ボクセルを生成（これは上限値が大きいとメモリ消費とパフォーマンスに影響する）
      const maxVoxels = Math.min(grid.totalVoxels, this.options.maxRenderVoxels || 10000);
      Logger.debug(`Generating grid for up to ${maxVoxels} voxels`);
      
      // 空のボクセルも含めて全ボクセルを追加
      for (let x = 0; x < grid.numVoxelsX; x++) {
        for (let y = 0; y < grid.numVoxelsY; y++) {
          for (let z = 0; z < grid.numVoxelsZ; z++) {
            const voxelKey = `${x},${y},${z}`;
            const voxelInfo = voxelData.get(voxelKey) || { x, y, z, count: 0 };
            
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
      if (this.options.maxRenderVoxels && displayVoxels.length > this.options.maxRenderVoxels) {
        const selectionResult = this._selectVoxelsForRendering(displayVoxels, this.options.maxRenderVoxels, bounds, grid);
        displayVoxels = selectionResult.selectedVoxels;
        
        // 統計情報の更新
        this._selectionStats = {
          strategy: selectionResult.strategy,
          clippedNonEmpty: selectionResult.clippedNonEmpty,
          coverageRatio: selectionResult.coverageRatio || 0
        };
        
        Logger.debug(`Applied ${selectionResult.strategy} strategy: ${displayVoxels.length} voxels selected, ${selectionResult.clippedNonEmpty} clipped`);
      }
    }

    // v0.1.5: TopN強調表示の前処理
    if (this.options.highlightTopN && this.options.highlightTopN > 0) {
      const sortedForTopN = [...displayVoxels].sort((a, b) => b.info.count - a.info.count);
      const topN = sortedForTopN.slice(0, this.options.highlightTopN);
      topN.forEach(voxel => topNVoxels.add(voxel.key));
      Logger.debug(`TopN highlight enabled: ${topNVoxels.size} voxels will be highlighted`);
    }
    
    Logger.debug(`Rendering ${displayVoxels.length} voxels`);
    
    // レンダリングカウント
    let renderedCount = 0;

    // 実際にボクセルを描画
    // パフォーマンス最適化: Resolver用の一時オブジェクトを再利用してGCを削減
    const reusableVoxelCtx = { x: 0, y: 0, z: 0, count: 0 };
    const reusableWidthResolverParams = { voxel: reusableVoxelCtx, isTopN: false, normalizedDensity: 0, statistics, adaptiveParams: null };
    const reusableOpacityResolverCtx = { voxel: reusableVoxelCtx, isTopN: false, normalizedDensity: 0, statistics, adaptiveParams: null };

    displayVoxels.forEach(({ key, info }) => {
      try {
        renderedCount += this._renderSingleVoxel(key, info, bounds, grid, statistics, topNVoxels, reusableVoxelCtx, reusableWidthResolverParams, reusableOpacityResolverCtx);
      } catch (error) {
        Logger.warn('Error rendering voxel:', error);
      }
    });

    Logger.info(`Successfully rendered ${renderedCount} voxels`);
    
    // 実際に描画されたボクセル数を返す
    return renderedCount;
  }

  /**
   * バウンディングボックスを描画（デバッグ用）
   * @param {Object} bounds - 境界情報
   * @private
   */
  _renderBoundingBox(bounds) {
    if (!bounds) return;

    try {
      // 中心点
      const centerLon = (bounds.minLon + bounds.maxLon) / 2;
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerAlt = (bounds.minAlt + bounds.maxAlt) / 2;
      
      // サイズ計算（概算）
      const widthMeters = (bounds.maxLon - bounds.minLon) * 111000 * Math.cos(centerLat * Math.PI / 180);
      const depthMeters = (bounds.maxLat - bounds.minLat) * 111000;
      const heightMeters = bounds.maxAlt - bounds.minAlt;
      
      // 境界ボックスの作成
      const boundingBox = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
        box: {
          dimensions: new Cesium.Cartesian3(widthMeters, depthMeters, heightMeters),
          material: Cesium.Color.YELLOW.withAlpha(0.1),
          outline: true,
          outlineColor: Cesium.Color.YELLOW.withAlpha(0.3),
          outlineWidth: 2
        },
        description: `バウンディングボックス<br>サイズ: ${widthMeters.toFixed(1)} x ${depthMeters.toFixed(1)} x ${heightMeters.toFixed(1)} m`
      });
      
      this.voxelEntities.push(boundingBox);
      
      Logger.debug('Debug bounding box added:', {
        center: { lon: centerLon, lat: centerLat, alt: centerAlt },
        size: { width: widthMeters, depth: depthMeters, height: heightMeters }
      });
      
    } catch (error) {
      Logger.warn('Failed to render bounding box:', error);
    }
  }

  // v0.1.11-alpha: _addEdgePolylines moved to GeometryRenderer (ADR-0009 Phase 4)

  /**
   * Render a single voxel with all visual configurations.
   * 単一ボクセルを全ての視覚設定で描画します。
   * v0.1.11-alpha: Phase5 オーケストレーション最適化 (ADR-0009 Phase 5)
   * @param {string} key - Voxel key / ボクセルキー
   * @param {Object} info - Voxel info / ボクセル情報
   * @param {Object} bounds - Bounds / 境界
   * @param {Object} grid - Grid / グリッド
   * @param {Object} statistics - Statistics / 統計
   * @param {Set} topNVoxels - TopN voxel keys / TopNボクセルキー
   * @param {Object} reusableVoxelCtx - Reusable context for performance / 再利用コンテキスト
   * @param {Object} reusableWidthResolverParams - Reusable width resolver params / 再利用太さResolver
   * @param {Object} reusableOpacityResolverCtx - Reusable opacity resolver context / 再利用透明度Resolver
   * @returns {number} 1 if rendered successfully, 0 if skipped / 描画成功時1、スキップ時0
   * @private
   */
  _renderSingleVoxel(key, info, bounds, grid, statistics, topNVoxels, reusableVoxelCtx, reusableWidthResolverParams, reusableOpacityResolverCtx) {
    const { x, y, z } = info;
    const isTopN = topNVoxels.has(key);
    
    // Calculate voxel rendering parameters
    const renderParams = this._calculateVoxelRenderingParams(info, bounds, grid, statistics, isTopN, reusableVoxelCtx, reusableWidthResolverParams, reusableOpacityResolverCtx);
    
    // Delegate to GeometryRenderer for actual rendering
    this._delegateVoxelRendering(key, renderParams);
    
    return 1; // Successfully rendered
  }

  /**
   * Calculate all rendering parameters for a voxel.
   * ボクセルの全描画パラメータを計算します。
   * @param {Object} info - Voxel info / ボクセル情報
   * @param {Object} bounds - Bounds / 境界
   * @param {Object} grid - Grid / グリッド
   * @param {Object} statistics - Statistics / 統計
   * @param {boolean} isTopN - Is TopN voxel / TopNボクセルか
   * @param {Object} reusableVoxelCtx - Reusable context / 再利用コンテキスト
   * @param {Object} reusableWidthResolverParams - Width resolver params / 太さResolver
   * @param {Object} reusableOpacityResolverCtx - Opacity resolver context / 透明度Resolver
   * @returns {Object} Complete rendering parameters / 完全な描画パラメータ
   * @private
   */
  _calculateVoxelRenderingParams(info, bounds, grid, statistics, isTopN, reusableVoxelCtx, reusableWidthResolverParams, reusableOpacityResolverCtx) {
    const { x, y, z } = info;
    
    // Position calculation
    const centerLon = bounds.minLon + (x + 0.5) * (bounds.maxLon - bounds.minLon) / grid.numVoxelsX;
    const centerLat = bounds.minLat + (y + 0.5) * (bounds.maxLat - bounds.minLat) / grid.numVoxelsY;
    const centerAlt = bounds.minAlt + (z + 0.5) * (bounds.maxAlt - bounds.minAlt) / grid.numVoxelsZ;
    
    // Normalized density
    const normalizedDensity = statistics.maxCount > statistics.minCount ? 
      (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
    
    // Adaptive parameters
    const adaptiveParams = this._calculateAdaptiveParams(info, isTopN, null, statistics);
    
    // Color and opacity
    const { color, opacity } = this._calculateColorAndOpacity(info, normalizedDensity, isTopN, adaptiveParams, statistics, reusableVoxelCtx, reusableOpacityResolverCtx);
    
    // Dimensions
    const { cellSizeX, cellSizeY, boxHeight } = this._calculateDimensions(grid, normalizedDensity);
    
    // Outline properties
    const outlineProps = this._calculateOutlineProperties(info, isTopN, normalizedDensity, adaptiveParams, statistics, color, reusableVoxelCtx, reusableWidthResolverParams);
    
    return {
      centerLon, centerLat, centerAlt,
      cellSizeX, cellSizeY, boxHeight,
      color, opacity,
      ...outlineProps,
      voxelInfo: info,
      adaptiveParams
    };
  }

  /**
   * Calculate color and opacity for a voxel.
   * ボクセルの色と透明度を計算します。
   * @param {Object} info - Voxel info / ボクセル情報
   * @param {number} normalizedDensity - Normalized density / 正規化密度
   * @param {boolean} isTopN - Is TopN voxel / TopNボクセルか
   * @param {Object} adaptiveParams - Adaptive params / 適応パラメータ
   * @param {Object} statistics - Statistics / 統計
   * @param {Object} reusableVoxelCtx - Reusable context / 再利用コンテキスト
   * @param {Object} reusableOpacityResolverCtx - Opacity resolver context / 透明度Resolverコンテキスト
   * @returns {Object} Color and opacity / 色と透明度
   * @private
   */
  _calculateColorAndOpacity(info, normalizedDensity, isTopN, adaptiveParams, statistics, reusableVoxelCtx, reusableOpacityResolverCtx) {
    let color, opacity;
    
    if (info.count === 0) {
      color = Cesium.Color.LIGHTGRAY;
      opacity = this.options.emptyOpacity;
    } else {
      color = ColorCalculator.calculateColor(normalizedDensity, info.count, this.options);
      
      // Opacity calculation with resolver support
      if (this.options.boxOpacityResolver && typeof this.options.boxOpacityResolver === 'function') {
        reusableVoxelCtx.x = info.x; reusableVoxelCtx.y = info.y; reusableVoxelCtx.z = info.z; reusableVoxelCtx.count = info.count;
        reusableOpacityResolverCtx.isTopN = isTopN;
        reusableOpacityResolverCtx.normalizedDensity = normalizedDensity;
        reusableOpacityResolverCtx.adaptiveParams = adaptiveParams;
        try {
          const resolverOpacity = this.options.boxOpacityResolver(reusableOpacityResolverCtx);
          opacity = isNaN(resolverOpacity) ? this.options.opacity : Math.max(0, Math.min(1, resolverOpacity));
        } catch (e) {
          Logger.warn('boxOpacityResolver error, using fallback:', e);
          opacity = adaptiveParams.boxOpacity || this.options.opacity;
        }
      } else {
        opacity = adaptiveParams.boxOpacity || this.options.opacity;
      }
      
      // TopN highlight adjustment
      if (this.options.highlightTopN && !isTopN && !this.options.boxOpacityResolver) {
        opacity *= (1 - (this.options.highlightStyle?.boostOpacity || 0.2));
      }
    }
    
    return { color, opacity };
  }

  /**
   * Calculate voxel dimensions with gap support.
   * voxelGap対応のボクセル寸法を計算します。
   * @param {Object} grid - Grid info / グリッド情報
   * @param {number} normalizedDensity - Normalized density / 正規化密度
   * @returns {Object} Dimensions / 寸法
   * @private
   */
  _calculateDimensions(grid, normalizedDensity) {
    let cellSizeX = grid.cellSizeX || (grid.lonRangeMeters ? (grid.lonRangeMeters / grid.numVoxelsX) : grid.voxelSizeMeters);
    let cellSizeY = grid.cellSizeY || (grid.latRangeMeters ? (grid.latRangeMeters / grid.numVoxelsY) : grid.voxelSizeMeters);
    let baseCellSizeZ = grid.cellSizeZ || (grid.altRangeMeters ? Math.max(grid.altRangeMeters / Math.max(grid.numVoxelsZ, 1), 1) : Math.max(grid.voxelSizeMeters, 1));

    // Apply voxel gap
    if (this.options.voxelGap > 0) {
      cellSizeX = Math.max(cellSizeX - this.options.voxelGap, cellSizeX * 0.1);
      cellSizeY = Math.max(cellSizeY - this.options.voxelGap, cellSizeY * 0.1);
      baseCellSizeZ = Math.max(baseCellSizeZ - this.options.voxelGap, baseCellSizeZ * 0.1);
    }

    // Height-based scaling
    let boxHeight = baseCellSizeZ;
    if (this.options.heightBased) {
      boxHeight = baseCellSizeZ * (0.1 + normalizedDensity * 0.9);
    }
    
    return { cellSizeX, cellSizeY, boxHeight };
  }

  /**
   * Calculate outline properties with resolver support.
   * Resolver対応の枠線プロパティを計算します。
   * @param {Object} info - Voxel info / ボクセル情報
   * @param {boolean} isTopN - Is TopN voxel / TopNボクセルか
   * @param {number} normalizedDensity - Normalized density / 正規化密度
   * @param {Object} adaptiveParams - Adaptive params / 適応パラメータ
   * @param {Object} statistics - Statistics / 統計
   * @param {Cesium.Color} color - Base color / ベース色
   * @param {Object} reusableVoxelCtx - Reusable context / 再利用コンテキスト
   * @param {Object} reusableWidthResolverParams - Width resolver params / 太さResolverパラメータ
   * @returns {Object} Outline properties / 枠線プロパティ
   * @private
   */
  _calculateOutlineProperties(info, isTopN, normalizedDensity, adaptiveParams, statistics, color, reusableVoxelCtx, reusableWidthResolverParams) {
    // Outline width calculation
    let finalOutlineWidth;
    if (this.options.outlineWidthResolver && typeof this.options.outlineWidthResolver === 'function') {
      reusableVoxelCtx.x = info.x; reusableVoxelCtx.y = info.y; reusableVoxelCtx.z = info.z; reusableVoxelCtx.count = info.count;
      reusableWidthResolverParams.isTopN = isTopN;
      reusableWidthResolverParams.normalizedDensity = normalizedDensity;
      reusableWidthResolverParams.adaptiveParams = adaptiveParams;
      try {
        finalOutlineWidth = this.options.outlineWidthResolver(reusableWidthResolverParams);
        if (isNaN(finalOutlineWidth)) {
          finalOutlineWidth = adaptiveParams.outlineWidth || this.options.outlineWidth;
        }
      } catch (e) {
        Logger.warn('outlineWidthResolver error, using fallback:', e);
        finalOutlineWidth = adaptiveParams.outlineWidth || this.options.outlineWidth;
      }
    } else {
      if (this.options.adaptiveOutlines && adaptiveParams.outlineWidth !== null) {
        finalOutlineWidth = adaptiveParams.outlineWidth;
      } else {
        finalOutlineWidth = isTopN && this.options.highlightTopN ? 
          (this.options.highlightStyle?.outlineWidth || this.options.outlineWidth) : 
          this.options.outlineWidth;
      }
    }

    // Outline opacity
    const finalOutlineOpacity = adaptiveParams.outlineOpacity || (this.options.outlineOpacity ?? 1.0);
    const outlineColorWithOpacity = color.withAlpha(finalOutlineOpacity);

    // Render mode configuration
    const renderModeConfig = this._determineRenderModeConfig();

    // Emulation logic
    let emulateThickForThis = renderModeConfig.shouldUseEmulationOnly;
    if (!renderModeConfig.shouldUseEmulationOnly) {
      if (this.options.outlineEmulation === 'topn') {
        emulateThickForThis = isTopN && (finalOutlineWidth || 1) > 1;
      } else if (this.options.outlineEmulation === 'non-topn') {
        emulateThickForThis = !isTopN && (finalOutlineWidth || 1) > 1;
      } else if (this.options.outlineEmulation === 'all') {
        emulateThickForThis = (finalOutlineWidth || 1) > 1;
      } else if (this.options.adaptiveOutlines && adaptiveParams.shouldUseEmulation) {
        emulateThickForThis = true;
      }
    }

    return {
      shouldShowOutline: renderModeConfig.shouldShowStandardOutline,
      outlineColor: outlineColorWithOpacity,
      outlineWidth: finalOutlineWidth || 1,
      shouldShowInsetOutline: renderModeConfig.shouldShowInsetOutline,
      emulateThick: emulateThickForThis
    };
  }

  /**
   * Determine render mode configuration.
   * レンダーモード設定を決定します。
   * @returns {Object} Render mode config / レンダーモード設定
   * @private
   */
  _determineRenderModeConfig() {
    let shouldShowStandardOutline = true;
    let shouldShowInsetOutline = false;
    let shouldUseEmulationOnly = false;
    
    switch (this.options.outlineRenderMode) {
      case 'standard':
        shouldShowStandardOutline = this.options.showOutline;
        shouldShowInsetOutline = this.options.outlineInset > 0;
        break;
      case 'inset':
        shouldShowStandardOutline = false;
        shouldShowInsetOutline = true;
        break;
      case 'emulation-only':
        shouldShowStandardOutline = false;
        shouldShowInsetOutline = false;
        shouldUseEmulationOnly = true;
        break;
    }
    
    return { shouldShowStandardOutline, shouldShowInsetOutline, shouldUseEmulationOnly };
  }

  /**
   * Delegate voxel rendering to GeometryRenderer.
   * ボクセル描画をGeometryRendererに委譲します。
   * @param {string} key - Voxel key / ボクセルキー
   * @param {Object} params - Rendering parameters / 描画パラメータ
   * @private
   */
  _delegateVoxelRendering(key, params) {
    // Main voxel box
    this.geometryRenderer.createVoxelBox({
      centerLon: params.centerLon, centerLat: params.centerLat, centerAlt: params.centerAlt,
      cellSizeX: params.cellSizeX, cellSizeY: params.cellSizeY, boxHeight: params.boxHeight,
      color: params.color, opacity: params.opacity,
      shouldShowOutline: params.shouldShowOutline,
      outlineColor: params.outlineColor,
      outlineWidth: params.outlineWidth,
      voxelInfo: params.voxelInfo,
      voxelKey: key,
      emulateThick: params.emulateThick
    });

    // Inset outline
    if (params.shouldShowInsetOutline && this.geometryRenderer.shouldApplyInsetOutline(params.voxelInfo.isTopN)) {
      try {
        const insetAmount = this.options.outlineInset > 0 ? this.options.outlineInset : 1;
        this.geometryRenderer.createInsetOutline({
          centerLon: params.centerLon, centerLat: params.centerLat, centerAlt: params.centerAlt,
          baseSizeX: params.cellSizeX, baseSizeY: params.cellSizeY, baseSizeZ: params.boxHeight,
          outlineColor: params.outlineColor,
          outlineWidth: Math.max(params.outlineWidth, 1),
          voxelKey: key,
          insetAmount
        });
      } catch (e) {
        Logger.warn('Failed to create inset outline:', e);
      }
    }
    
    // Edge polylines for thick emulation
    if (params.emulateThick) {
      try {
        this.geometryRenderer.createEdgePolylines({
          centerLon: params.centerLon, centerLat: params.centerLat, centerAlt: params.centerAlt,
          cellSizeX: params.cellSizeX, cellSizeY: params.cellSizeY, boxHeight: params.boxHeight,
          outlineColor: params.outlineColor,
          outlineWidth: Math.max(params.outlineWidth, 1),
          voxelKey: key
        });
      } catch (e) {
        Logger.warn('Failed to add emulated thick outline polylines:', e);
      }
    }
  }

  /**
   * Interpolate color based on density (v0.1.5: color maps supported).
   * 密度に基づいて色を補間（v0.1.5: カラーマップ対応）。
   * v0.1.11-alpha: ColorCalculatorに委譲 (ADR-0009 Phase 1)
   * @param {number} normalizedDensity - Normalized density (0-1) / 正規化された密度 (0-1)
   * @param {number} [rawValue] - Raw value for diverging scheme / 生値（二極性配色用）
   * @returns {Cesium.Color} Calculated color / 計算された色
   */
  interpolateColor(normalizedDensity, rawValue = null) {
    // v0.1.11-alpha: 新しいColorCalculatorに委譲
    return ColorCalculator.calculateColor(normalizedDensity, rawValue, this.options);
  }
  
  // v0.1.11-alpha: _interpolateFromColorMap and _interpolateDivergingColor methods 
  // moved to ColorCalculator (ADR-0009 Phase 1)


  /**
   * 描画されたエンティティを全てクリア
   * v0.1.11-alpha: GeometryRendererに委譲 (ADR-0009 Phase 4)
   */
  clear() {
    this.geometryRenderer.clear();
  }

  /**
   * デバッグ境界ボックス表示の判定（v0.1.5: debug.showBounds対応）
   * @returns {boolean} 境界ボックスを表示する場合はtrue
   * @private
   */
  _shouldShowBounds() {
    if (!this.options.debug) {
      return false;
    }
    
    if (typeof this.options.debug === 'boolean') {
      // 従来の動作：debugがtrueの場合はバウンディングボックス表示
      return this.options.debug;
    }
    
    if (typeof this.options.debug === 'object' && this.options.debug !== null) {
      // 新しい動作：debug.showBoundsで明示的に制御
      return this.options.debug.showBounds === true;
    }
    
    return false;
  }


  // v0.1.11-alpha: _createInsetOutline moved to GeometryRenderer (ADR-0009 Phase 4)

  /**
   * 枠線の厚み部分を視覚化するフレーム構造を作成
   * メインボックスとインセットボックスの間を12個のボックスで埋める
   * @param {number} centerLon - 中心経度
   * @param {number} centerLat - 中心緯度
   * @param {number} centerAlt - 中心高度
   * @param {number} outerX - 外側サイズX
   * @param {number} outerY - 外側サイズY
   * @param {number} outerZ - 外側サイズZ
   * @param {number} innerX - 内側サイズX
   * @param {number} innerY - 内側サイズY
   * @param {number} innerZ - 内側サイズZ
   * @param {Cesium.Color} frameColor - フレーム色
   * @param {string} voxelKey - ボクセルキー
   * @private
   */
  _createThickOutlineFrames(centerLon, centerLat, centerAlt, outerX, outerY, outerZ, innerX, innerY, innerZ, frameColor, voxelKey) {
    // フレーム厚み計算（外側と内側の差を2で割ったもの）
    const frameThickX = (outerX - innerX) / 2;
    const frameThickY = (outerY - innerY) / 2;
    const frameThickZ = (outerZ - innerZ) / 2;
    
    // 境界計算：各軸での内側・外側の境界
    const outerBoundX = outerX / 2;    // 外側境界（中心からの距離）
    const outerBoundY = outerY / 2;
    const outerBoundZ = outerZ / 2;
    const innerBoundX = innerX / 2;    // 内側境界（中心からの距離）
    const innerBoundY = innerY / 2;
    const innerBoundZ = innerZ / 2;
    
    Logger.debug(`Frame bounds for ${voxelKey}:`, {
      frameThick: { x: frameThickX, y: frameThickY, z: frameThickZ },
      outerBound: { x: outerBoundX, y: outerBoundY, z: outerBoundZ },
      innerBound: { x: innerBoundX, y: innerBoundY, z: innerBoundZ }
    });
    
    // 12個のフレームボックスを配置（外側と内側の境界間に正確にフィット）
    const frames = [
      // 上面の枠線（4つ）- Z軸上側
      { 
        pos: [0, (outerBoundY + innerBoundY) / 2, outerBoundZ - frameThickZ / 2], 
        size: [innerX, frameThickY, frameThickZ], 
        name: 'top-back' 
      },
      { 
        pos: [0, -(outerBoundY + innerBoundY) / 2, outerBoundZ - frameThickZ / 2], 
        size: [innerX, frameThickY, frameThickZ], 
        name: 'top-front' 
      },
      { 
        pos: [(outerBoundX + innerBoundX) / 2, 0, outerBoundZ - frameThickZ / 2], 
        size: [frameThickX, outerY, frameThickZ], 
        name: 'top-right' 
      },
      { 
        pos: [-(outerBoundX + innerBoundX) / 2, 0, outerBoundZ - frameThickZ / 2], 
        size: [frameThickX, outerY, frameThickZ], 
        name: 'top-left' 
      },
      
      // 下面の枠線（4つ）- Z軸下側
      { 
        pos: [0, (outerBoundY + innerBoundY) / 2, -outerBoundZ + frameThickZ / 2], 
        size: [innerX, frameThickY, frameThickZ], 
        name: 'bottom-back' 
      },
      { 
        pos: [0, -(outerBoundY + innerBoundY) / 2, -outerBoundZ + frameThickZ / 2], 
        size: [innerX, frameThickY, frameThickZ], 
        name: 'bottom-front' 
      },
      { 
        pos: [(outerBoundX + innerBoundX) / 2, 0, -outerBoundZ + frameThickZ / 2], 
        size: [frameThickX, outerY, frameThickZ], 
        name: 'bottom-right' 
      },
      { 
        pos: [-(outerBoundX + innerBoundX) / 2, 0, -outerBoundZ + frameThickZ / 2], 
        size: [frameThickX, outerY, frameThickZ], 
        name: 'bottom-left' 
      },
      
      // 縦の枠線（4つ）- 角の柱
      { 
        pos: [(outerBoundX + innerBoundX) / 2, (outerBoundY + innerBoundY) / 2, 0], 
        size: [frameThickX, frameThickY, innerZ], 
        name: 'vertical-back-right' 
      },
      { 
        pos: [(outerBoundX + innerBoundX) / 2, -(outerBoundY + innerBoundY) / 2, 0], 
        size: [frameThickX, frameThickY, innerZ], 
        name: 'vertical-front-right' 
      },
      { 
        pos: [-(outerBoundX + innerBoundX) / 2, (outerBoundY + innerBoundY) / 2, 0], 
        size: [frameThickX, frameThickY, innerZ], 
        name: 'vertical-back-left' 
      },
      { 
        pos: [-(outerBoundX + innerBoundX) / 2, -(outerBoundY + innerBoundY) / 2, 0], 
        size: [frameThickX, frameThickY, innerZ], 
        name: 'vertical-front-left' 
      }
    ];
    
    // 各フレームボックスを作成
    frames.forEach(frame => {
      if (frame.size[0] > 0.1 && frame.size[1] > 0.1 && frame.size[2] > 0.1) {
        try {
          // より正確な座標計算：経度・緯度・高度で直接オフセット
          const DEG_PER_METER_LON = 1 / (111000 * Math.cos(centerLat * Math.PI / 180));
          const DEG_PER_METER_LAT = 1 / 111000;
          
          const frameLon = centerLon + frame.pos[0] * DEG_PER_METER_LON;
          const frameLat = centerLat + frame.pos[1] * DEG_PER_METER_LAT;
          const frameAlt = centerAlt + frame.pos[2];
          
          const frameEntity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(frameLon, frameLat, frameAlt),
            box: {
              dimensions: new Cesium.Cartesian3(frame.size[0], frame.size[1], frame.size[2]),
              material: frameColor.withAlpha(0.8), // 少し透明度を下げて重なりを考慮
              outline: false, // 内部フレームには枠線なし
              fill: true
            },
            properties: {
              type: 'voxel-outline-frame',
              parentKey: voxelKey,
              frameName: frame.name
            }
          });
          
          this.voxelEntities.push(frameEntity);
        } catch (e) {
          Logger.warn(`Failed to create outline frame ${frame.name}:`, e);
        }
      }
    });
    
    Logger.debug(`Thick outline frames created for voxel ${voxelKey}: ${frames.length} frames`);
  }

  /**
   * Toggle visibility.
   * 表示/非表示を切り替えます。
   * v0.1.11-alpha: GeometryRendererに委譲 (ADR-0009 Phase 5)
   * @param {boolean} show - true to show / 表示する場合は true
   */
  setVisible(show) {
    Logger.debug('VoxelRenderer.setVisible:', show);
    this.voxelEntities.forEach(entity => {
      if (entity && (!entity.isDestroyed || !entity.isDestroyed())) {
        entity.show = show;
      }
    });
  }

  /**
   * Select voxels for rendering based on the specified strategy.
   * 指定された戦略に基づいてレンダリング用ボクセルを選択します。
   * @param {Array} allVoxels - All available voxels / 利用可能な全ボクセル
   * @param {number} maxCount - Maximum number of voxels to select / 選択する最大ボクセル数
   * @param {Object} bounds - Data bounds / データ境界
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _selectVoxelsForRendering(allVoxels, maxCount, bounds, grid) {
    // v0.1.11-alpha: 新しいVoxelSelectorに委譲しつつ、既存インターフェースを維持 (ADR-0009 Phase 2)
    const selectionResult = this.voxelSelector.selectVoxels(allVoxels, maxCount, { grid, bounds });
    
    // 統計情報の更新
    this._selectionStats = this.voxelSelector.getLastSelectionStats();
    
    return selectionResult;
  }




  /**
   * Get selection statistics.
   * 選択統計を取得します。
   * @returns {Object|null} Selection statistics / 選択統計
   */
  getSelectionStats() {
    return this._selectionStats || null;
  }
}
