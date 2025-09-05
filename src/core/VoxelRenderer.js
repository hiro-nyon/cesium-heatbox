/**
 * Class responsible for rendering 3D voxels.
 * 3Dボクセルの描画を担当するクラス。
 * プロトタイプ実装ベース（シンプル・確実動作重視）
 */
import * as Cesium from 'cesium';
import { Logger } from '../utils/logger.js';
import { DensitySelectionStrategy } from './selection/DensitySelectionStrategy.js';
import { CoverageSelectionStrategy } from './selection/CoverageSelectionStrategy.js';
import { HybridSelectionStrategy } from './selection/HybridSelectionStrategy.js';
import { ColorMap } from './color/ColorMap.js';
import { VoxelGeometry } from './voxel/VoxelGeometry.js';
import { VoxelEntityFactory } from './voxel/VoxelEntityFactory.js';
import { DebugRenderer } from './voxel/DebugRenderer.js';
import { AdaptiveOutlineController } from './outline/AdaptiveOutlineController.js';
import { OutlineRenderer } from './outline/OutlineRenderer.js';

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
      adaptiveParams: {
        neighborhoodRadius: 50,
        densityThreshold: 5,
        cameraDistanceFactor: 1.0,
        overlapRiskFactor: 0.3
      },
      ...options
    };
    this.voxelEntities = [];
    
    // v0.1.10: Initialize selection strategies / 選択戦略を初期化
    this._initializeSelectionStrategies();
    
    // ADR-0008 Phase 1: Initialize debug renderer / デバッグレンダラーを初期化
    this.debugRenderer = new DebugRenderer(viewer);
    
    // ADR-0008 Phase 2: Initialize outline components / 枠線コンポーネントを初期化
    this.adaptiveOutlineController = new AdaptiveOutlineController(this.options.adaptiveParams);
    this.outlineRenderer = new OutlineRenderer(viewer);
    
    Logger.debug('VoxelRenderer initialized with options:', this.options);
  }

  /**
   * Initialize selection strategies (v0.1.10).
   * 選択戦略を初期化します (v0.1.10)。
   * @private
   */
  _initializeSelectionStrategies() {
    this._selectionStrategies = {
      density: new DensitySelectionStrategy(),
      coverage: new CoverageSelectionStrategy(),
      hybrid: new HybridSelectionStrategy()
    };
  }

  /**
   * Compute adaptive outline parameters (v0.1.7).
   * 適応的枠線パラメータを計算 (v0.1.7)。
   * @param {Object} voxelInfo - Voxel info / ボクセル情報
   * @param {boolean} isTopN - Whether it is TopN / TopNボクセルかどうか
   * @param {Map} voxelData - All voxel data / 全ボクセルデータ
   * @param {Object} statistics - Statistics / 統計情報
   * @returns {Object} Adaptive params / 適応的パラメータ
   * @private
   */
  _calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics) {
    // ADR-0008 Phase 2: Delegate to AdaptiveOutlineController
    return this.adaptiveOutlineController.calculateAdaptiveParams(
      voxelInfo, 
      isTopN, 
      voxelData, 
      statistics, 
      this.viewer, 
      this.options
    );
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
    this.clear();
    Logger.debug('VoxelRenderer.render - Starting render with simplified approach', {
      voxelDataSize: voxelData.size,
      bounds,
      grid,
      statistics
    });

    // ADR-0008 Phase 1: DebugRendererでバウンディングボックス表示制御
    this.debugRenderer.renderBoundingBox(bounds, this.options.debug);

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
        const adaptiveParams = this._calculateAdaptiveParams({ ...info, position }, isTopN, voxelData, statistics);
        
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
          
          color = ColorMap.interpolateColor(normalizedDensity, info.count, this.options);
          
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
        
        // ADR-0008 Phase 1: ボクセル寸法計算をVoxelGeometryで実行
        const normalizedDensity = statistics.maxCount > statistics.minCount ? 
          (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
        const voxelDimensions = VoxelGeometry.calculateVoxelDimensions(grid, normalizedDensity, this.options);
        const cellSizeX = voxelDimensions.x;
        const cellSizeY = voxelDimensions.y;
        const boxHeight = voxelDimensions.z;
        
        // v0.1.7: 動的枠線太さ制御（優先順位：resolver > 適応的 > 固定値）
        let finalOutlineWidth;
        if (this.options.outlineWidthResolver && typeof this.options.outlineWidthResolver === 'function') {
          // outlineWidthResolver による動的制御
          const normalizedDensity = statistics.maxCount > statistics.minCount ? 
            (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
          const resolverParams = {
            voxel: { x, y, z, count: info.count },
            isTopN,
            normalizedDensity,
            statistics,
            adaptiveParams
          };
          try {
            finalOutlineWidth = this.options.outlineWidthResolver(resolverParams);
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

        // Effective adaptive params include resolver-adjusted width
        const effectiveAdaptive = { ...adaptiveParams, outlineWidth: finalOutlineWidth };

        // ADR-0008 Phase 1: VoxelEntityFactoryでエンティティ作成
        const dimensions = new Cesium.Cartesian3(cellSizeX, cellSizeY, boxHeight);
        
        const entityConfig = VoxelEntityFactory.createBoxEntity({
          position: position,
          dimensions: dimensions,
          color: color,
          opacity: opacity,
          wireframe: this.options.wireframeOnly,
          outline: {
            show: this.options.showOutline === true,
            color: Cesium.Color.fromBytes(255, 255, 255, 255).withAlpha(
              (effectiveAdaptive.outlineOpacity != null) ? effectiveAdaptive.outlineOpacity : (this.options.outlineOpacity ?? 1.0)
            ),
            width: finalOutlineWidth || this.options.outlineWidth || 1
          },
          properties: {
            key: key,
            count: info.count,
            x: x,
            y: y,
            z: z
          },
          description: this.createVoxelDescription(info, key)
        });
        
        // エンティティを作成
        const entity = this.viewer.entities.add(entityConfig);
        
        this.voxelEntities.push(entity);

        // ADR-0008 Phase 2: Render outline using OutlineRenderer (after box added)
        if (this.outlineRenderer.shouldRenderOutline(info, this.options)) {
          try {
            const outlineEntities = this.outlineRenderer.renderOutline(
              {
              ...info,
              key: key,
              position: position,
              width: cellSizeX,
              height: boxHeight,
              depth: cellSizeY,
              isTopN: isTopN
            },
              this.options,
              effectiveAdaptive
            );
            outlineEntities.forEach(outlineEntity => {
              const outlineEntityAdded = this.viewer.entities.add(outlineEntity);
              this.voxelEntities.push(outlineEntityAdded);
            });
          } catch (e) {
            Logger.warn('Outline rendering skipped due to error:', e);
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
   * Backward-compatible color interpolation API.
   * 後方互換の色補間API（Phase1抽出後もI/F維持）。
   * @param {number} normalizedDensity
   * @param {number} [rawValue]
   * @returns {Cesium.Color}
   */
  interpolateColor(normalizedDensity, rawValue = null) {
    return ColorMap.interpolateColor(normalizedDensity, rawValue, this.options);
  }

  /**
   * Backward-compatible debug bounds flag checker.
   * 後方互換のデバッグ境界表示判定（旧_private I/F維持）。
   * @returns {boolean}
   * @private
   */
  _shouldShowBounds() {
    return this.debugRenderer.shouldShowBounds(this.options?.debug);
  }

  /**
   * Create description HTML for a voxel.
   * ボクセルの説明文を生成します。
   * @param {Object} voxelInfo - Voxel info / ボクセル情報
   * @param {string} voxelKey - Voxel key / ボクセルキー
   * @returns {string} HTML description / HTML形式の説明文
   */
  createVoxelDescription(voxelInfo, voxelKey) {
    return `
      <div style="padding: 10px; font-family: Arial, sans-serif;">
        <h3 style="margin-top: 0;">ボクセル [${voxelInfo.x}, ${voxelInfo.y}, ${voxelInfo.z}]</h3>
        <table style="width: 100%;">
          <tr><td><b>エンティティ数:</b></td><td>${voxelInfo.count}</td></tr>
          <tr><td><b>ID:</b></td><td>${voxelKey}</td></tr>
        </table>
      </div>
    `;
  }

  /**
   * 描画されたエンティティを全てクリア
   */
  clear() {
    Logger.debug('VoxelRenderer.clear - Removing', this.voxelEntities.length, 'entities');
    
    this.voxelEntities.forEach(entity => {
      try {
        // isDestroyedのチェックを安全に行う
        const isDestroyed = typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
        
        if (entity && !isDestroyed) {
          this.viewer.entities.remove(entity);
        }
      } catch (error) {
        Logger.warn('Entity removal error:', error);
      }
    });
    
    this.voxelEntities = [];
    
    // ADR-0008 Phase 1: DebugRendererもクリア
    if (this.debugRenderer) {
      this.debugRenderer.clear();
    }
  }

  /**
   * インセット枠線を適用すべきかどうかを判定（ADR-0004）
   * @param {boolean} isTopN - TopNボクセルかどうか
   * @returns {boolean} インセット枠線を適用する場合はtrue
   * @private
   */
  _shouldApplyInsetOutline(isTopN) {
    const mode = this.options.outlineInsetMode || 'all';
    switch (mode) {
      case 'topn':
        return isTopN;
      case 'all':
      default:
        return true;
    }
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
    const strategy = this.options.renderLimitStrategy || 'density';
    
    // TopN強調ボクセルは必ず選択対象に含む
    const topNVoxels = new Set();
    if (this.options.highlightTopN && this.options.highlightTopN > 0) {
      const sortedForTopN = [...allVoxels].sort((a, b) => b.info.count - a.info.count);
      const topN = sortedForTopN.slice(0, this.options.highlightTopN);
      topN.forEach(voxel => topNVoxels.add(voxel.key));
    }
    
    let selectedVoxels;
    let clippedCount;
    let coverageRatio = null;
    
    switch (strategy) {
      case 'coverage': {
        const coverageResult = this._selectionStrategies.coverage.select(
          allVoxels, maxCount, grid, topNVoxels, {}
        );
        selectedVoxels = coverageResult.selected;
        clippedCount = allVoxels.length - selectedVoxels.length;
        break;
      }
      
      case 'hybrid': {
        const hybridResult = this._selectionStrategies.hybrid.select(
          allVoxels, maxCount, grid, topNVoxels, {}
        );
        selectedVoxels = hybridResult.selected;
        clippedCount = allVoxels.length - selectedVoxels.length;
        coverageRatio = hybridResult.metadata?.coverageRatio;
        break;
      }
      
      case 'density':
      default: {
        const densityStrategy = this._selectionStrategies.density;
        const densityResult = densityStrategy.select(allVoxels, maxCount, grid, topNVoxels, this.options);
        selectedVoxels = densityResult.selected;
        clippedCount = densityResult.metadata.clippedCount;
        break;
      }
    }
    
    return {
      selectedVoxels,
      strategy,
      clippedNonEmpty: clippedCount,
      coverageRatio
    };
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
