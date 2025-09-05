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
