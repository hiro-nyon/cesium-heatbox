/**
 * Class responsible for rendering 3D voxels.
 * 3Dボクセルの描画を担当するクラス。
 * プロトタイプ実装ベース（シンプル・確実動作重視）
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
 * Class responsible for 3D voxel rendering.
 * 3Dボクセルの描画を担当するクラス。
 */
export class VoxelRenderer {
  /**
   * Constructor
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer / CesiumJS Viewer
   * @param {Object} options - Rendering options / 描画オプション
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
   * Render voxel data (simple implementation).
   * ボクセルデータを描画（シンプル実装）。
   * @param {Map} voxelData - Voxel data / ボクセルデータ
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {Object} grid - Grid info / グリッド情報
   * @param {Object} statistics - Statistics / 統計情報
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
        const { x, y, z } = info;
        
        // ボクセル中心座標を計算（シンプルな方法）
        const centerLon = bounds.minLon + (x + 0.5) * (bounds.maxLon - bounds.minLon) / grid.numVoxelsX;
        const centerLat = bounds.minLat + (y + 0.5) * (bounds.maxLat - bounds.minLat) / grid.numVoxelsY;
        const centerAlt = bounds.minAlt + (z + 0.5) * (bounds.maxAlt - bounds.minAlt) / grid.numVoxelsZ;
        
        const isTopN = topNVoxels.has(key); // v0.1.5: TopNハイライト判定
        
        // 事前に正規化密度を一度だけ計算し使い回す
        const normalizedDensity = statistics.maxCount > statistics.minCount ? 
          (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
        
        // v0.1.7: 適応的パラメータの計算（必要箇所で参照）
        const adaptiveParams = this._calculateAdaptiveParams(info, isTopN, voxelData, statistics);
        
        // 密度に応じた色を計算
        let color, opacity;
        
        if (info.count === 0) {
          // 空ボクセルの場合
          color = Cesium.Color.LIGHTGRAY;
          opacity = this.options.emptyOpacity;
        } else {
          // データありボクセルの場合
          const normalizedDensity = statistics.maxCount > statistics.minCount ? 
            (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
          
          color = this.interpolateColor(normalizedDensity, info.count);
          
          // v0.1.7: 透明度resolverの適用（優先順位：resolver > 適応的 > 固定値）
          if (this.options.boxOpacityResolver && typeof this.options.boxOpacityResolver === 'function') {
            const resolverCtx = {
              voxel: { x, y, z, count: info.count },
              isTopN,
              normalizedDensity,
              statistics,
              adaptiveParams
            };
            try {
              const resolverOpacity = this.options.boxOpacityResolver(resolverCtx);
              opacity = isNaN(resolverOpacity) ? this.options.opacity : Math.max(0, Math.min(1, resolverOpacity));
            } catch (e) {
              Logger.warn('boxOpacityResolver error, using fallback:', e);
              opacity = adaptiveParams.boxOpacity || this.options.opacity;
            }
          } else {
            opacity = adaptiveParams.boxOpacity || this.options.opacity;
          }
          
          // v0.1.5: TopN強調表示で非TopNボクセルを淡色化（resolver適用後）
          if (this.options.highlightTopN && !isTopN && !this.options.boxOpacityResolver) {
            opacity *= (1 - (this.options.highlightStyle?.boostOpacity || 0.2));
          }
        }
        
        // v0.1.6: ボクセル寸法計算（voxelGap対応）
        // 各軸のセルサイズ（グリッドが持つ実セルサイズを優先、なければvoxelSizeMetersにフォールバック）
        let cellSizeX = grid.cellSizeX || (grid.lonRangeMeters ? (grid.lonRangeMeters / grid.numVoxelsX) : grid.voxelSizeMeters);
        let cellSizeY = grid.cellSizeY || (grid.latRangeMeters ? (grid.latRangeMeters / grid.numVoxelsY) : grid.voxelSizeMeters);
        let baseCellSizeZ = grid.cellSizeZ || (grid.altRangeMeters ? Math.max(grid.altRangeMeters / Math.max(grid.numVoxelsZ, 1), 1) : Math.max(grid.voxelSizeMeters, 1));

        // v0.1.6: voxelGap による寸法縮小（枠線重なり対策）
        if (this.options.voxelGap > 0) {
          cellSizeX = Math.max(cellSizeX - this.options.voxelGap, cellSizeX * 0.1);
          cellSizeY = Math.max(cellSizeY - this.options.voxelGap, cellSizeY * 0.1);
          baseCellSizeZ = Math.max(baseCellSizeZ - this.options.voxelGap, baseCellSizeZ * 0.1);
        }

        let boxHeight = baseCellSizeZ;
        if (this.options.heightBased && info.count > 0) {
          boxHeight = baseCellSizeZ * (0.1 + normalizedDensity * 0.9); // 10%から100%の高さ
        }
        
        // v0.1.7: 動的枠線太さ制御（優先順位：resolver > 適応的 > 固定値）
        let finalOutlineWidth;
        if (this.options.outlineWidthResolver && typeof this.options.outlineWidthResolver === 'function') {
          // outlineWidthResolver による動的制御（再利用オブジェクトで割り当て削減）
          reusableVoxelCtx.x = x; reusableVoxelCtx.y = y; reusableVoxelCtx.z = z; reusableVoxelCtx.count = info.count;
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
          // v0.1.7: 適応的パラメータを優先、なければ従来の静的制御
          if (this.options.adaptiveOutlines && adaptiveParams.outlineWidth !== null) {
            finalOutlineWidth = adaptiveParams.outlineWidth;
          } else {
            finalOutlineWidth = isTopN && this.options.highlightTopN ? 
              (this.options.highlightStyle?.outlineWidth || this.options.outlineWidth) : 
              this.options.outlineWidth;
          }
        }

        // v0.1.7: 枠線透明度制御（resolver > 適応的 > 固定値）
        let finalOutlineOpacity;
        if (this.options.outlineOpacityResolver && typeof this.options.outlineOpacityResolver === 'function') {
          // 透明度resolverも同様に再利用オブジェクトで最適化
          reusableVoxelCtx.x = x; reusableVoxelCtx.y = y; reusableVoxelCtx.z = z; reusableVoxelCtx.count = info.count;
          reusableOpacityResolverCtx.isTopN = isTopN;
          reusableOpacityResolverCtx.normalizedDensity = normalizedDensity;
          reusableOpacityResolverCtx.adaptiveParams = adaptiveParams;
          try {
            const resolverOpacity = this.options.outlineOpacityResolver(reusableOpacityResolverCtx);
            finalOutlineOpacity = isNaN(resolverOpacity) ? (this.options.outlineOpacity ?? 1.0) : Math.max(0, Math.min(1, resolverOpacity));
          } catch (e) {
            Logger.warn('outlineOpacityResolver error, using fallback:', e);
            finalOutlineOpacity = adaptiveParams.outlineOpacity || (this.options.outlineOpacity ?? 1.0);
          }
        } else {
          finalOutlineOpacity = adaptiveParams.outlineOpacity || (this.options.outlineOpacity ?? 1.0);
        }
        
        const outlineColorWithOpacity = color.withAlpha(finalOutlineOpacity);

        // v0.1.7: outlineRenderModeによる表示モード制御
        let shouldShowStandardOutline = true;
        let shouldShowInsetOutline = false;
        let shouldUseEmulationOnly = false;
        
        switch (this.options.outlineRenderMode) {
          case 'standard':
            shouldShowStandardOutline = this.options.showOutline;
            shouldShowInsetOutline = this.options.outlineInset > 0;
            break;
          case 'inset':
            shouldShowStandardOutline = false; // インセットモードでは標準枠線を無効化
            shouldShowInsetOutline = true;
            break;
          case 'emulation-only':
            shouldShowStandardOutline = false;
            shouldShowInsetOutline = false;
            shouldUseEmulationOnly = true;
            break;
        }
        
        // v0.1.7: 適応的エミュレーション判定を組み込み
        let emulateThickForThis = shouldUseEmulationOnly;
        if (!shouldUseEmulationOnly) {
          // 従来のoutlineEmulationオプションを尊重
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
        
        // v0.1.11-alpha: GeometryRendererに委譲してボクセルボックス作成 (ADR-0009 Phase 4)
        this.geometryRenderer.createVoxelBox({
          centerLon, centerLat, centerAlt,
          cellSizeX, cellSizeY, boxHeight,
          color, opacity,
          shouldShowOutline: shouldShowStandardOutline,
            outlineColor: outlineColorWithOpacity,
          outlineWidth: finalOutlineWidth || 1,
          voxelInfo: info,
          voxelKey: key,
          emulateThick: emulateThickForThis
        });

        // v0.1.11-alpha: GeometryRendererに委譲してインセット枠線作成 (ADR-0009 Phase 4)
        if (shouldShowInsetOutline && this.geometryRenderer.shouldApplyInsetOutline(isTopN)) {
          try {
            const insetAmount = this.options.outlineInset > 0 ? this.options.outlineInset : 1; // emulation-onlyでは最低1m
            this.geometryRenderer.createInsetOutline({
              centerLon, centerLat, centerAlt,
              baseSizeX: cellSizeX, baseSizeY: cellSizeY, baseSizeZ: boxHeight,
              outlineColor: outlineColorWithOpacity,
              outlineWidth: Math.max(finalOutlineWidth || 1, 1),
              voxelKey: key,
              insetAmount
            });
          } catch (e) {
            Logger.warn('Failed to create inset outline:', e);
          }
        }
        
        // v0.1.11-alpha: GeometryRendererに委譲して太線エミュレーション (ADR-0009 Phase 4)
        if (emulateThickForThis) {
          try {
            this.geometryRenderer.createEdgePolylines({
              centerLon, centerLat, centerAlt,
              cellSizeX, cellSizeY, boxHeight,
              outlineColor: outlineColorWithOpacity,
              outlineWidth: Math.max(finalOutlineWidth, 1),
              voxelKey: key
            });
          } catch (e) {
            Logger.warn('Failed to add emulated thick outline polylines:', e);
          }
        }
        renderedCount++;
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

  /**
   * ボックスのエッジをポリラインで描画（太線エミュレーション）
   * @param {Cesium.Cartesian3} centerCart - ボックス中心
   * @param {number} sx - X寸法（m）
   * @param {number} sy - Y寸法（m）
   * @param {number} sz - Z寸法（m）
   * @param {Cesium.Color} color - 線色
   * @param {number} width - 線幅（px）
   * @private
   */
  _addEdgePolylines(centerCart, sx, sy, sz, color, width) {
    try {
      const halfX = sx / 2, halfY = sy / 2, halfZ = sz / 2;
      const enu = Cesium.Transforms.eastNorthUpToFixedFrame(centerCart);
      const toWorld = (dx, dy, dz) => {
        const local = new Cesium.Cartesian3(dx, dy, dz);
        return Cesium.Matrix4.multiplyByPoint(enu, local, new Cesium.Cartesian3());
      };
      const C = [
        toWorld(-halfX, -halfY, -halfZ),
        toWorld( halfX, -halfY, -halfZ),
        toWorld( halfX,  halfY, -halfZ),
        toWorld(-halfX,  halfY, -halfZ),
        toWorld(-halfX, -halfY,  halfZ),
        toWorld( halfX, -halfY,  halfZ),
        toWorld( halfX,  halfY,  halfZ),
        toWorld(-halfX,  halfY,  halfZ)
      ];
      const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      edges.forEach(([i, j]) => {
        const poly = this.viewer.entities.add({
          polyline: {
            positions: [C[i], C[j]],
            width: width,
            material: color,
            arcType: Cesium.ArcType.NONE
          }
        });
        this.voxelEntities.push(poly);
      });
    } catch (error) {
      Logger.warn('Edge polyline creation failed:', error);
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


  /**
   * インセット枠線用のセカンダリBoxエンティティを作成（ADR-0004）
   * @param {number} centerLon - 中心経度
   * @param {number} centerLat - 中心緯度  
   * @param {number} centerAlt - 中心高度
   * @param {number} baseSizeX - 基本サイズX
   * @param {number} baseSizeY - 基本サイズY
   * @param {number} baseSizeZ - 基本サイズZ
   * @param {Cesium.Color} outlineColor - 枠線色
   * @param {number} outlineWidth - 枠線太さ
   * @param {string} voxelKey - ボクセルキー
   * @param {number} [insetAmount] - v0.1.7: インセット量のオーバーライド
   * @private
   */
  _createInsetOutline(centerLon, centerLat, centerAlt, baseSizeX, baseSizeY, baseSizeZ, outlineColor, outlineWidth, voxelKey, insetAmount = null) {
    // インセット距離の適用（ADR-0004の境界条件：両側合計で各軸寸法の最大40%まで＝片側20%）
    // 片側20%までに制限することで、最終寸法は元の60%以上を保証する
    const maxInsetX = baseSizeX * 0.2;
    const maxInsetY = baseSizeY * 0.2;
    const maxInsetZ = baseSizeZ * 0.2;
    
    const baseInset = insetAmount !== null ? insetAmount : this.options.outlineInset;
    const effectiveInsetX = Math.min(baseInset, maxInsetX);
    const effectiveInsetY = Math.min(baseInset, maxInsetY);  
    const effectiveInsetZ = Math.min(baseInset, maxInsetZ);
    
    // インセット後の寸法計算（各軸から2倍のインセットを引く）
    const insetSizeX = Math.max(baseSizeX - (effectiveInsetX * 2), baseSizeX * 0.1);
    const insetSizeY = Math.max(baseSizeY - (effectiveInsetY * 2), baseSizeY * 0.1);
    const insetSizeZ = Math.max(baseSizeZ - (effectiveInsetZ * 2), baseSizeZ * 0.1);
    
    // セカンダリBoxエンティティの設定（枠線のみ、塗りなし）
    const insetEntity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
      box: {
        dimensions: new Cesium.Cartesian3(insetSizeX, insetSizeY, insetSizeZ),
        fill: false,
        outline: true,
        outlineColor: outlineColor,
        outlineWidth: Math.max(outlineWidth || 1, 0)
      },
      properties: {
        type: 'voxel-inset-outline',
        parentKey: voxelKey,
        insetSize: { x: insetSizeX, y: insetSizeY, z: insetSizeZ }
      }
    });
    
    this.voxelEntities.push(insetEntity);
    
    // 枠線の厚み部分を視覚化（WebGL 1px制限の回避）
    if (this.options.enableThickFrames && (effectiveInsetX > 0.1 || effectiveInsetY > 0.1 || effectiveInsetZ > 0.1)) {
      this._createThickOutlineFrames(
        centerLon, centerLat, centerAlt,
        baseSizeX, baseSizeY, baseSizeZ,
        insetSizeX, insetSizeY, insetSizeZ,
        outlineColor, voxelKey
      );
    }
    
    Logger.debug(`Inset outline created for voxel ${voxelKey}:`, {
      originalSize: { x: baseSizeX, y: baseSizeY, z: baseSizeZ },
      insetSize: { x: insetSizeX, y: insetSizeY, z: insetSizeZ },
      effectiveInset: { x: effectiveInsetX, y: effectiveInsetY, z: effectiveInsetZ }
    });
  }

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
   * @param {boolean} show - true to show / 表示する場合は true
   */
  setVisible(show) {
    Logger.debug('VoxelRenderer.setVisible:', show);
    
    this.voxelEntities.forEach(entity => {
      try {
        // isDestroyedのチェックを安全に行う
        const isDestroyed = typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
        
        if (entity && !isDestroyed) {
          entity.show = show;
        }
      } catch (error) {
        Logger.warn('Entity visibility error:', error);
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
