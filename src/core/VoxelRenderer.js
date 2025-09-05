/**
 * Class responsible for rendering 3D voxels.
 * 3Dボクセルの描画を担当するクラス。
 * ADR-0008 Phase 3: Refactored with modular architecture
 */
import { Logger } from '../utils/logger.js';
import { DensitySelectionStrategy } from './selection/DensitySelectionStrategy.js';
import { CoverageSelectionStrategy } from './selection/CoverageSelectionStrategy.js';
import { HybridSelectionStrategy } from './selection/HybridSelectionStrategy.js';
import { ColorMap } from './color/ColorMap.js';
import { DebugRenderer } from './voxel/DebugRenderer.js';
import { AdaptiveOutlineController } from './outline/AdaptiveOutlineController.js';
import { OutlineRenderer } from './outline/OutlineRenderer.js';
import { DescriptionBuilder } from './voxel/DescriptionBuilder.js';
import { VoxelRenderingEngine } from './voxel/VoxelRenderingEngine.js';
import { VoxelEntityManager } from './voxel/VoxelEntityManager.js';

/**
 * Core class responsible for 3D voxel rendering and visualization management.
 * 3Dボクセルのレンダリングと可視化管理を担当するコアクラス。
 * 
 * This class orchestrates the rendering of 3D voxel-based heatmaps by coordinating
 * multiple specialized components: rendering engine, entity manager, outline controllers,
 * and description builders. It provides the main interface for voxel visualization
 * with support for advanced features like adaptive outlines, TopN highlighting,
 * and customizable rendering modes.
 * 
 * このクラスは、レンダリングエンジン、エンティティマネージャー、アウトラインコントローラー、
 * および説明文ビルダーなどの複数の専門コンポーネントを調整して、3Dボクセルベースの
 * ヒートマップのレンダリングを統括します。適応的アウトライン、TopN強調、
 * カスタマイズ可能なレンダリングモードなどの高度な機能をサポートする、
 * ボクセル可視化のメインインターフェースを提供します。
 * 
 * @since v0.1.0
 * @version v0.1.10 - Refactored with modular architecture (ADR-0008)
 */
export class VoxelRenderer {
  /**
   * Initialize VoxelRenderer with comprehensive rendering capabilities.
   * 包括的なレンダリング機能を持つVoxelRendererを初期化します。
   * 
   * Creates a fully-featured voxel renderer with modular architecture including
   * dedicated components for entity management, outline rendering, adaptive
   * control systems, and description generation. Supports extensive customization
   * through the options parameter.
   * 
   * エンティティ管理、アウトラインレンダリング、適応制御システム、
   * 説明文生成の専用コンポーネントを含むモジュラーアーキテクチャを持つ、
   * フル機能のボクセルレンダラーを作成します。optionsパラメーターを通じて
   * 広範囲なカスタマイズをサポートします。
   * 
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer instance for rendering / レンダリング用CesiumJSビューアーインスタンス
   * @param {Object} [options={}] - Comprehensive rendering configuration / 包括的なレンダリング設定
   * @param {number[]} [options.minColor=[0,0,255]] - RGB color for minimum density / 最小密度のRGB色
   * @default [0, 0, 255]
   * @param {number[]} [options.maxColor=[255,0,0]] - RGB color for maximum density / 最大密度のRGB色  
   * @default [255, 0, 0]
   * @param {number} [options.opacity=0.8] - Base opacity for voxels (0-1) / ボクセルの基本不透明度（0-1）
   * @default 0.8
   * @param {boolean} [options.showOutline=true] - Whether to show voxel outlines / ボクセルアウトラインの表示
   * @default true
   * @param {boolean} [options.adaptiveOutlines=false] - Enable adaptive outline control / 適応的アウトライン制御を有効化
   * @default false
   * @param {string} [options.outlineWidthPreset='uniform'] - Outline width preset ('uniform', 'adaptive-density', 'topn-focus') / アウトライン幅プリセット
   * @default 'uniform'
   * @param {string} [options.outlineRenderMode='standard'] - Rendering mode ('standard', 'inset', 'emulation-only') / レンダリングモード
   * @default 'standard'
   * @param {Object} [options.adaptiveParams] - Parameters for adaptive algorithms / 適応アルゴリズム用パラメーター
   * 
   * @throws {Error} Throws if viewer is invalid or required dependencies fail to initialize / ビューアーが無効または必要な依存関係の初期化に失敗した場合はエラーを投げます
   * 
   * @example
   * // Basic renderer setup / 基本レンダラーセットアップ
   * const renderer = new VoxelRenderer(viewer, {
   *   opacity: 0.9,
   *   showOutline: true,
   *   minColor: [0, 0, 255],
   *   maxColor: [255, 0, 0]
   * });
   * 
   * @example
   * // Advanced setup with adaptive features / 適応機能付き高度セットアップ
   * const renderer = new VoxelRenderer(viewer, {
   *   adaptiveOutlines: true,
   *   outlineWidthPreset: 'adaptive-density',
   *   outlineRenderMode: 'inset',
   *   adaptiveParams: {
   *     neighborhoodRadius: 75,
   *     densityThreshold: 10
   *   }
   * });
   * 
   * @example
   * // OutlineRenderMode patterns / アウトラインレンダリングモードパターン
   * 
   * // Pattern 1: Standard mode (default) / 標準モード（デフォルト）
   * const standardRenderer = new VoxelRenderer(viewer, {
   *   outlineRenderMode: 'standard',
   *   showOutline: true,
   *   outlineWidth: 2
   * });
   * 
   * // Pattern 2: Inset mode (cleaner overlaps) / インセットモード（重なり軽減）
   * const insetRenderer = new VoxelRenderer(viewer, {
   *   outlineRenderMode: 'inset',
   *   outlineInset: 0.1,          // 10% inset
   *   outlineInsetMode: 'adaptive' // または 'all'
   * });
   * 
   * // Pattern 3: Emulation-only mode / エミュレーション専用モード
   * const emulationRenderer = new VoxelRenderer(viewer, {
   *   outlineRenderMode: 'emulation-only',
   *   adaptiveOutlines: true
   * });
   * 
   * @example 
   * // AdaptiveOutlines + OutlineWidthPreset patterns / 適応的アウトライン + 幅プリセットパターン
   * 
   * // Pattern 1: Uniform width (default) / 均一幅（デフォルト）
   * const uniformRenderer = new VoxelRenderer(viewer, {
   *   adaptiveOutlines: false,
   *   outlineWidthPreset: 'uniform'
   * });
   * 
   * // Pattern 2: Density-adaptive width / 密度適応幅
   * const densityRenderer = new VoxelRenderer(viewer, {
   *   adaptiveOutlines: true,
   *   outlineWidthPreset: 'adaptive-density',
   *   adaptiveParams: {
   *     minOutlineWidth: 1,
   *     maxOutlineWidth: 4
   *   }
   * });
   * 
   * // Pattern 3: TopN focused width / TopN集中幅
   * const topnRenderer = new VoxelRenderer(viewer, {
   *   adaptiveOutlines: true,
   *   outlineWidthPreset: 'topn-focus',
   *   highlightTopN: 20,
   *   highlightStyle: {
   *     outlineWidth: 5,
   *     outlineOpacity: 1.0
   *   }
   * });
   * 
   * @since v0.1.0
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
    
    // v0.1.10: Initialize selection strategies / 選択戦略を初期化
    this._initializeSelectionStrategies();
    
    // ADR-0008 Phase 1: Initialize debug renderer / デバッグレンダラーを初期化
    this.debugRenderer = new DebugRenderer(viewer);
    
    // ADR-0008 Phase 2: Initialize outline components / 枠線コンポーネントを初期化
    this.adaptiveOutlineController = new AdaptiveOutlineController(this.options.adaptiveParams);
    this.outlineRenderer = new OutlineRenderer(viewer);
    
    // ADR-0008 Phase 3: Initialize description builder / 説明文ビルダーを初期化
    this.descriptionBuilder = new DescriptionBuilder();
    
    // ADR-0008 Phase 3: Initialize rendering engine and entity manager / レンダリングエンジンとエンティティマネージャーを初期化
    this.renderingEngine = new VoxelRenderingEngine(viewer);
    this.entityManager = new VoxelEntityManager(viewer);
    
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
   * 適応的枠線パラメータを計算します (v0.1.7)。
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {boolean} isTopN - Is TopN voxel / TopNボクセルか
   * @param {Map} voxelData - Voxel data / ボクセルデータ
   * @param {Object} statistics - Statistics / 統計情報
   * @returns {Object} Adaptive parameters / 適応的パラメータ
   * @private
   */
  _calculateAdaptiveParams(voxelInfo, isTopN, voxelData, statistics) {
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
   * Render voxel data (simplified implementation using rendering engine).
   * ボクセルデータを描画（レンダリングエンジンを使用したシンプル実装）。
   * @param {Map} voxelData - Voxel data / ボクセルデータ
   * @param {Object} bounds - Bounds info / 境界情報
   * @param {Object} grid - Grid info / グリッド情報
   * @param {Object} statistics - Statistics / 統計情報
   * @returns {number} Number of rendered voxels / 実際に描画されたボクセル数
   */
  render(voxelData, bounds, grid, statistics) {
    this.clear();
    Logger.debug('VoxelRenderer.render - Starting render with rendering engine', {
      voxelDataSize: voxelData.size,
      bounds,
      grid,
      statistics
    });

    // ADR-0008 Phase 1: DebugRendererでバウンディングボックス表示制御
    this.debugRenderer.renderBoundingBox(bounds, this.options.debug);

    // ADR-0008 Phase 3: Use rendering engine to process display voxels
    const { displayVoxels, topNVoxels } = this.renderingEngine.processDisplayVoxels(
      voxelData, bounds, grid, this.options, 
      this._selectVoxelsForRendering.bind(this)
    );

    // Update selection stats if applicable
    if (this.options.maxRenderVoxels && voxelData.size > this.options.maxRenderVoxels) {
      /**
       * Internal selection statistics for debugging and performance monitoring.
       * デバッグとパフォーマンス監視用の内部選択統計。
       * @private
       * @type {Object}
       */
      this._selectionStats = this._selectionStats || {
        strategy: 'none',
        clippedNonEmpty: 0,
        coverageRatio: 1.0
      };
    }

    // ADR-0008 Phase 3: Use rendering engine to render voxels  
    const entities = this.renderingEngine.renderVoxels(
      displayVoxels, 
      topNVoxels, 
      bounds, 
      grid, 
      statistics, 
      {
        ...this.options,
        createVoxelDescription: this.descriptionBuilder.createVoxelDescription.bind(this.descriptionBuilder)
      },
      this._calculateAdaptiveParams.bind(this),
      this.outlineRenderer,
      this.adaptiveOutlineController
    );

    // Add entities to manager
    entities.forEach(entity => this.entityManager.addEntity(entity));

    Logger.info(`Successfully rendered ${entities.length} voxels`);
    return entities.length;
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
   * 描画されたエンティティを全てクリア
   */
  clear() {
    // ADR-0008 Phase 3: Use entity manager for clearing
    this.entityManager.clear();
    
    // ADR-0008 Phase 1: DebugRendererもクリア
    if (this.debugRenderer) {
      this.debugRenderer.clear();
    }
  }

  /**
   * Toggle visibility.
   * 表示/非表示を切り替え。
   * @param {boolean} show - true=表示 false=非表示
   */
  setVisible(show) {
    // ADR-0008 Phase 3: Use entity manager for visibility control
    this.entityManager.setVisible(show);
  }

  /**
   * Select voxels for rendering based on the specified strategy.
   * 指定された戦略に基づいてレンダリング用ボクセルを選択します。
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} maxCount - Maximum count / 最大数
   * @param {Object} bounds - Bounds / 境界
   * @param {Object} grid - Grid / グリッド
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _selectVoxelsForRendering(allVoxels, maxCount, bounds, grid) {
    const strategy = this.options.voxelSelectionStrategy || 'density';
    let selectedVoxels;
    let clippedCount;
    let coverageRatio;

    // TopNボクセルの処理
    const topNVoxels = new Set();
    if (this.options.highlightTopN && this.options.highlightTopN > 0) {
      const sortedForTopN = [...allVoxels].sort((a, b) => b.info.count - a.info.count);
      const topN = sortedForTopN.slice(0, this.options.highlightTopN);
      topN.forEach(voxel => topNVoxels.add(voxel.key));
    }
    
    switch (strategy) {
      case 'coverage': {
        const coverageResult = this._selectionStrategies.coverage.select(allVoxels, maxCount, grid, topNVoxels, this.options);
        selectedVoxels = coverageResult.selected;
        clippedCount = allVoxels.length - selectedVoxels.length;
        break;
      }
      
      case 'hybrid': {
        const hybridResult = this._selectionStrategies.hybrid.select(allVoxels, maxCount, grid, topNVoxels, this.options);
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

  /**
   * Backward compatibility: Get voxel entities.
   * 後方互換性: ボクセルエンティティを取得。
   * @returns {Array} Voxel entities / ボクセルエンティティ
   */
  get voxelEntities() {
    return this.entityManager.voxelEntities || [];
  }

  /**
   * Backward compatibility: Check if inset outline should be applied.
   * 後方互換性: インセット枠線を適用すべきかどうかを判定。
   * @param {boolean} isTopN - Is TopN voxel / TopNボクセルか
   * @returns {boolean} Whether to apply inset outline / インセット枠線を適用するかどうか
   * @private
   */
  _shouldApplyInsetOutline(isTopN) {
    const mode = this.options.outlineInsetMode || 'all';
    if (mode === 'topn') return !!isTopN;
    return true;
  }
}
