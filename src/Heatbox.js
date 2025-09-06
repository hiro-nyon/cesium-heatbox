/**
 * CesiumJS Heatbox - メインクラス
 */
import * as Cesium from 'cesium';
import { DEFAULT_OPTIONS, ERROR_MESSAGES, PERFORMANCE_LIMITS } from './utils/constants.js';
import { 
  isValidViewer,
  isValidEntities,
  validateAndNormalizeOptions,
  validateVoxelCount,
  calculateDataRange
} from './utils/validation.js';
import { DeviceTierDetector } from './utils/deviceTierDetector.js';
import { VoxelSizeEstimator } from './utils/voxelSizeEstimator.js';
import { Logger } from './utils/logger.js';
import { CoordinateTransformer } from './core/CoordinateTransformer.js';
import { VoxelGrid } from './core/VoxelGrid.js';
import { DataProcessor } from './core/DataProcessor.js';
import { VoxelRenderer } from './core/VoxelRenderer.js';
import { ViewFitter } from './utils/ViewFitter.js';

/**
 * Main class of CesiumJS Heatbox.
 * Provides 3D voxel-based heatmap visualization in CesiumJS environments.
 *
 * CesiumJS Heatbox メインクラス。
 * CesiumJS 環境で 3D ボクセルベースのヒートマップ可視化を提供します。
 */
export class Heatbox {
  /**
   * Constructor
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer instance / CesiumJS Viewer インスタンス
   * @param {Object} options - Configuration options / 設定オプション
   */
  constructor(viewer, options = {}) {
    if (!isValidViewer(viewer)) {
      throw new Error(ERROR_MESSAGES.INVALID_VIEWER);
    }
    
    this.viewer = viewer;
    
    // ユーザーが voxelSize を明示指定したかどうかを保持（デフォルト値と区別するため）
    this._userProvidedVoxelSize = Object.prototype.hasOwnProperty.call(options || {}, 'voxelSize');

    // v0.1.9: Auto Render Budgetの適用
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    this.options = validateAndNormalizeOptions(DeviceTierDetector.applyAutoRenderBudget(mergedOptions));
    
    // ログレベルをオプションに基づいて設定
    Logger.setLogLevel(this.options);
    this.renderer = new VoxelRenderer(this.viewer, this.options);
    this.viewFitter = new ViewFitter(this.viewer);
    
    this._bounds = null;
    this._grid = null;
    this._voxelData = null;
    this._statistics = null;
    this._eventHandler = null;

    this._initializeEventListeners();
  }

  /**
   * Set heatmap data and render 3D voxel visualization.
   * ヒートマップデータを設定し、3Dボクセル可視化を描画します。
   * 
   * This method processes the provided entity array, calculates optimal voxel grid,
   * and renders 3D voxel-based heatmap visualization in the Cesium viewer.
   * 
   * このメソッドは提供されたエンティティ配列を処理し、最適なボクセルグリッドを計算して、
   * Cesiumビューアーで3Dボクセルベースのヒートマップ可視化を描画します。
   * 
   * @param {Cesium.Entity[]} entities - Array of Cesium entities with position information / 位置情報を持つCesiumエンティティの配列
   * @throws {Error} Throws error if entities array is invalid / エンティティ配列が無効な場合はエラーを投げます
   * @returns {Promise<void>} Promise that resolves when rendering is complete / 描画完了時に解決するPromise
   * 
   * @example
   * // Basic usage / 基本使用法
   * const entities = generateTestEntities(viewer, bounds, 1000);
   * await heatbox.setData(entities);
   * 
   * @example  
   * // With error handling / エラーハンドリング付き
   * try {
   *   await heatbox.setData(entities);
   *   console.log('Heatmap rendered successfully');
   * } catch (error) {
   *   console.error('Failed to render heatmap:', error);
   * }
   * 
   * @since v0.1.0
   */
  async setData(entities) {
    if (!isValidEntities(entities)) {
      this.clear();
      return;
    }
    
    try {
      Logger.debug('Heatbox.setData - 処理開始:', entities.length, '個のエンティティ');
      
      // 1. 境界計算
      Logger.debug('Step 1: 境界計算');
      this._bounds = CoordinateTransformer.calculateBounds(entities);
      if (!this._bounds) {
        Logger.error('境界計算に失敗');
        this.clear();
        return;
      }
      Logger.debug('境界計算完了:', this._bounds);

      // v0.1.4+v0.1.9: 自動ボクセルサイズ調整（占有率ベース対応）
      let finalVoxelSize = this.options.voxelSize || DEFAULT_OPTIONS.voxelSize;
      let autoAdjustmentInfo = null;
      
      // ユーザーが voxelSize を明示指定していない場合に限り、自動決定を適用
      if (this.options.autoVoxelSize && !this._userProvidedVoxelSize) {
        try {
          Logger.debug('自動ボクセルサイズ調整開始');
          
          // v0.1.9: 占有率ベースの計算オプション
          const sizeOptions = {
            autoVoxelSizeMode: this.options.autoVoxelSizeMode,
            autoVoxelTargetFill: this.options.autoVoxelTargetFill,
            maxRenderVoxels: this.options.maxRenderVoxels
          };
          
          const estimatedSize = VoxelSizeEstimator.estimate(entities, this._bounds, this.options.autoVoxelSizeMode, sizeOptions);
          const tempGrid = VoxelGrid.createGrid(this._bounds, estimatedSize);
          const validation = validateVoxelCount(tempGrid.totalVoxels, estimatedSize);
          
          if (!validation.valid && validation.recommendedSize) {
            finalVoxelSize = validation.recommendedSize;
            autoAdjustmentInfo = {
              enabled: true,
              mode: this.options.autoVoxelSizeMode,
              originalSize: estimatedSize,
              finalSize: finalVoxelSize,
              adjusted: true,
              reason: `Performance limit exceeded: ${tempGrid.totalVoxels} > ${PERFORMANCE_LIMITS.maxVoxels}`
            };
            Logger.info(`Auto-adjusted voxelSize: ${estimatedSize}m → ${finalVoxelSize}m (${tempGrid.totalVoxels} voxels)`);
          } else {
            finalVoxelSize = estimatedSize;
            autoAdjustmentInfo = {
              enabled: true,
              mode: this.options.autoVoxelSizeMode,
              originalSize: estimatedSize,
              finalSize: finalVoxelSize,
              adjusted: false,
              reason: null
            };
            Logger.info(`Auto-determined voxelSize: ${finalVoxelSize}m`);
          }
        } catch (error) {
          Logger.warn('Auto voxel size adjustment failed, using default:', error);
          finalVoxelSize = DEFAULT_OPTIONS.voxelSize;
          autoAdjustmentInfo = {
            enabled: true,
            adjusted: false,
            reason: 'Estimation failed, using default size',
            originalSize: null,
            finalSize: finalVoxelSize
          };
        }
      }

      // 2. グリッド生成（最終的なボクセルサイズを使用）
      Logger.debug('Step 2: グリッド生成 (サイズ:', finalVoxelSize, 'm)');
      this._grid = VoxelGrid.createGrid(this._bounds, finalVoxelSize);
      Logger.debug('グリッド生成完了:', this._grid);
      
      // 3. エンティティ分類
      Logger.debug('Step 3: エンティティ分類');
      this._voxelData = DataProcessor.classifyEntitiesIntoVoxels(entities, this._bounds, this._grid);
      Logger.debug('エンティティ分類完了:', this._voxelData.size, '個のボクセル');
      
      // 4. 統計計算
      Logger.debug('Step 4: 統計計算');
      this._statistics = DataProcessor.calculateStatistics(this._voxelData, this._grid);
      Logger.debug('統計情報:', this._statistics);
      
      // 統計情報に自動調整情報を追加
      if (autoAdjustmentInfo) {
        this._statistics.autoAdjusted = autoAdjustmentInfo.adjusted;
        this._statistics.originalVoxelSize = autoAdjustmentInfo.originalSize;
        this._statistics.finalVoxelSize = autoAdjustmentInfo.finalSize;
        this._statistics.adjustmentReason = autoAdjustmentInfo.reason;
      }
      
      // 5. 描画
      Logger.debug('Step 5: 描画');
      const renderedVoxelCount = this.renderer.render(this._voxelData, this._bounds, this._grid, this._statistics);
      
      // 統計情報に実際の描画数を反映
      this._statistics.renderedVoxels = renderedVoxelCount;
      Logger.info('描画完了 - 実際の描画数:', renderedVoxelCount);
      
      // v0.1.9: 自動視点調整
      if (this.options.autoView) {
        try {
          Logger.debug('Auto view adjustment triggered');
          await this.fitView();
          Logger.debug('Auto view adjustment completed');
        } catch (error) {
          Logger.warn('Auto view adjustment failed:', error);
          // 自動視点調整の失敗は致命的エラーとしない
        }
      }
      
      Logger.debug('Heatbox.setData - 処理完了');
      
    } catch (error) {
      Logger.error('ヒートマップ作成エラー:', error);
      this.clear();
      throw error;
    }
  }

  /**
   * Create heatmap from entities and return detailed statistics.
   * エンティティからヒートマップを作成し、詳細統計情報を返します。
   * 
   * This method is equivalent to calling setData() followed by getStatistics().
   * It processes the entity array to create voxel-based heatmap visualization
   * and returns comprehensive statistics about the rendered result.
   * 
   * このメソッドは setData() に続けて getStatistics() を呼び出すことと同等です。
   * エンティティ配列を処理してボクセルベースのヒートマップ可視化を作成し、
   * レンダリング結果に関する包括的な統計情報を返します。
   * 
   * @param {Cesium.Entity[]} entities - Array of Cesium entities to process / 処理するCesiumエンティティの配列
   * @returns {Promise<Object>} Detailed rendering statistics / 詳細なレンダリング統計情報
   * @returns {Promise<number>} returns.totalVoxels - Total number of voxels in grid / グリッド内の総ボクセル数
   * @returns {Promise<number>} returns.renderedVoxels - Number of actually rendered voxels / 実際にレンダリングされたボクセル数
   * @returns {Promise<number>} returns.nonEmptyVoxels - Number of voxels containing data / データを含むボクセル数
   * @returns {Promise<number>} returns.minCount - Minimum entity count in any voxel / 任意のボクセル内の最小エンティティ数
   * @returns {Promise<number>} returns.maxCount - Maximum entity count in any voxel / 任意のボクセル内の最大エンティティ数
   * @returns {Promise<number>} returns.averageCount - Average entity count per non-empty voxel / 非空ボクセルあたりの平均エンティティ数
   * @throws {Error} Throws error if entities array is empty or invalid / エンティティ配列が空または無効な場合はエラーを投げます
   * 
   * @example
   * // Create heatmap and get statistics / ヒートマップ作成と統計取得
   * const entities = generateTestEntities(viewer, bounds, 1000);
   * const stats = await heatbox.createFromEntities(entities);
   * console.log(`Rendered ${stats.renderedVoxels} out of ${stats.totalVoxels} voxels`);
   * 
   * @example
   * // Error handling with statistics / 統計情報付きエラーハンドリング
   * try {
   *   const stats = await heatbox.createFromEntities(entities);
   *   if (stats.renderedVoxels === 0) {
   *     console.warn('No voxels were rendered - check data distribution');
   *   }
   * } catch (error) {
   *   console.error('Failed to create heatmap:', error);
   * }
   * 
   * @since v0.1.0
   * @see {@link setData} For data processing without returning statistics
   * @see {@link getStatistics} For retrieving statistics after rendering
   */
  async createFromEntities(entities) {
    if (!isValidEntities(entities)) {
      throw new Error(ERROR_MESSAGES.NO_ENTITIES);
    }
    await this.setData(entities);
    return this.getStatistics();
  }

  /**
   * Control heatmap visibility without clearing data or re-rendering.
   * データやレンダリングをクリアすることなくヒートマップの表示を制御します。
   * 
   * This method efficiently toggles the visibility of all rendered voxels
   * by setting the 'show' property on Cesium entities. The underlying data
   * and voxel grid remain intact, allowing for fast show/hide operations.
   * 
   * このメソッドはCesiumエンティティの'show'プロパティを設定することで、
   * レンダリングされた全ボクセルの表示を効率的に切り替えます。基盤データと
   * ボクセルグリッドはそのまま保持され、高速な表示/非表示操作が可能です。
   * 
   * @param {boolean} show - Whether to show the heatmap (true) or hide it (false) / ヒートマップを表示する（true）か隠す（false）か
   * @returns {void}
   * 
   * @example
   * // Show heatmap / ヒートマップを表示
   * heatbox.setVisible(true);
   * 
   * @example
   * // Hide heatmap temporarily / 一時的にヒートマップを隠す
   * heatbox.setVisible(false);
   * // ... other operations ...
   * heatbox.setVisible(true); // Show again quickly
   * 
   * @example
   * // Toggle visibility based on user interaction / ユーザー操作に基づく表示切り替え
   * const toggleButton = document.getElementById('toggleHeatmap');
   * let isVisible = true;
   * toggleButton.onclick = () => {
   *   isVisible = !isVisible;
   *   heatbox.setVisible(isVisible);
   *   toggleButton.textContent = isVisible ? 'Hide' : 'Show';
   * };
   * 
   * @since v0.1.0
   * @see {@link clear} For permanently removing the heatmap
   */
  setVisible(show) {
    this.renderer.setVisible(show);
  }

  /**
   * Completely clear heatmap visualization and reset internal state.
   * ヒートマップ可視化を完全にクリアし、内部状態をリセットします。
   * 
   * This method removes all rendered voxel entities from the Cesium viewer and
   * resets all internal data structures (bounds, grid, voxel data, statistics).
   * After calling this method, the Heatbox instance returns to its initial state
   * and is ready to process new data.
   * 
   * このメソッドは、レンダリングされた全ボクセルエンティティをCesiumビューアーから削除し、
   * 全ての内部データ構造（境界、グリッド、ボクセルデータ、統計）をリセットします。
   * このメソッドを呼び出した後、Heatboxインスタンスは初期状態に戻り、新しいデータを処理する準備ができます。
   * 
   * @returns {void}
   * 
   * @example
   * // Clear current heatmap before loading new data / 新しいデータを読み込む前に現在のヒートマップをクリア
   * heatbox.clear();
   * await heatbox.setData(newEntities);
   * 
   * @example
   * // Clean up when component is destroyed / コンポーネント破棄時のクリーンアップ
   * const cleanup = () => {
   *   heatbox.clear();
   *   heatbox.destroy(); // Final cleanup
   * };
   * 
   * @example
   * // Reset to initial state for reuse / 再利用のため初期状態にリセット
   * heatbox.clear();
   * console.log(heatbox.getBounds()); // null - no data loaded
   * console.log(heatbox.getStatistics()); // null - no statistics available
   * 
   * @since v0.1.0
   * @see {@link setVisible} For temporary hiding without clearing data
   * @see {@link destroy} For final cleanup including event handlers
   */
  clear() {
    this.renderer.clear();
    this._bounds = null;
    this._grid = null;
    this._voxelData = null;
    this._statistics = null;
  }

  /**
   * Destroy the instance and release event listeners.
   * インスタンスを破棄し、イベントリスナーを解放します。
   */
  destroy() {
    this.clear();
    if (this._eventHandler && !this._eventHandler.isDestroyed()) {
      this._eventHandler.destroy();
    }
    this._eventHandler = null;
  }

  /**
   * Alias for destroy() to match examples and tests.
   * 互換性のための別名。destroy() を呼び出します。
   */
  dispose() {
    this.destroy();
  }

  /**
   * Get current options.
   * 現在のオプションを取得します。
   * @returns {Object} Options / オプション
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Update heatbox configuration options and automatically re-render if data exists.
   * ヒートボックスの設定オプションを更新し、データが存在する場合は自動的に再描画します。
   * 
   * This method merges new options with existing configuration and triggers 
   * automatic re-rendering when data is already loaded. Options are validated
   * and normalized before application.
   * 
   * このメソッドは新しいオプションを既存の設定とマージし、データが既にロードされている場合は
   * 自動的な再描画をトリガーします。オプションは適用前に検証・正規化されます。
   * 
   * @param {Object} newOptions - Configuration options to update / 更新する設定オプション
   * @param {number} [newOptions.voxelSize] - Voxel size in meters / ボクセルサイズ（メートル）
   * @param {number} [newOptions.opacity] - Base opacity (0-1) / 基本不透明度（0-1）
   * @param {boolean} [newOptions.showOutline] - Whether to show voxel outlines / ボクセル輪郭の表示
   * @param {string} [newOptions.colorMap] - Color map type ('custom', 'viridis', 'inferno') / カラーマップタイプ
   * @param {number} [newOptions.highlightTopN] - Number of top voxels to highlight / 強調表示するトップボクセル数
   * @param {boolean} [newOptions.adaptiveOutlines] - Enable adaptive outline control / 適応的輪郭制御を有効化
   * @throws {Error} Throws error if options validation fails / オプション検証が失敗した場合はエラーを投げます
   * @returns {void}
   * 
   * @example
   * // Update color settings / 色設定の更新
   * heatbox.updateOptions({
   *   colorMap: 'viridis',
   *   opacity: 0.9,
   *   highlightTopN: 50
   * });
   * 
   * @example
   * // Enable adaptive features / 適応機能を有効化
   * heatbox.updateOptions({
   *   adaptiveOutlines: true,
   *   outlineWidthPreset: 'adaptive-density'
   * });
   * 
   * @since v0.1.0
   */
  updateOptions(newOptions) {
    this.options = validateAndNormalizeOptions({ ...this.options, ...newOptions });
    this.renderer.options = this.options;
    
    // 既存のヒートマップがある場合は再描画
    if (this._voxelData) {
      const renderedVoxelCount = this.renderer.render(this._voxelData, this._bounds, this._grid, this._statistics);
      // 統計情報を更新
      this._statistics.renderedVoxels = renderedVoxelCount;
    }
  }

  /**
   * Initialize internal event listeners.
   * 内部のイベントリスナーを初期化します。
   * @private
   */
  _initializeEventListeners() {
    this._eventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // クリックイベントでInfoBoxを更新
    this._eventHandler.setInputAction(movement => {
      const pickedObject = this.viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && 
          pickedObject.id.properties && 
          pickedObject.id.properties.type === 'voxel') {
        // プロパティからキー値を取得
        const voxelKey = pickedObject.id.properties.key;
        const voxelInfo = {
          x: pickedObject.id.properties.x,
          y: pickedObject.id.properties.y,
          z: pickedObject.id.properties.z,
          count: pickedObject.id.properties.count
        };
        
        // InfoBoxに表示するためのダミーエンティティを作成
        const dummyEntity = new Cesium.Entity({
          id: `voxel-${voxelKey}`,
          description: this.renderer.createVoxelDescription(voxelInfo, voxelKey)
        });
        this.viewer.selectedEntity = dummyEntity;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  /**
   * Get statistics information.
   * 統計情報を取得します（未作成の場合は null）。
   * @returns {Object|null} Statistics or null / 統計情報 または null
   */
  getStatistics() {
    if (!this._statistics) {
      return null;
    }

    // 基本統計情報
    const stats = { ...this._statistics };

    // v0.1.9: 選択戦略統計を追加
    const selectionStats = this.renderer.getSelectionStats();
    if (selectionStats) {
      stats.selectionStrategy = selectionStats.strategy;
      stats.clippedNonEmpty = selectionStats.clippedNonEmpty;
      stats.coverageRatio = selectionStats.coverageRatio ?? 0;
    }

    // v0.1.9: Auto Render Budget統計を追加
    if (this.options._autoRenderBudget) {
      stats.renderBudgetTier = this.options._autoRenderBudget.tier;
      stats.autoMaxRenderVoxels = this.options._autoRenderBudget.autoMaxRenderVoxels;
    }

    // v0.1.9: occupancy ratio (rendered / budget) for diagnostics
    if (typeof this.options.maxRenderVoxels === 'number' && this.options.maxRenderVoxels > 0) {
      stats.occupancyRatio = Math.min(1, Math.max(0, (stats.renderedVoxels || 0) / this.options.maxRenderVoxels));
    } else {
      stats.occupancyRatio = null;
    }

    return stats;
  }

  /**
   * Get bounds info if available.
   * 境界情報を取得します（未作成の場合は null）。
   * @returns {Object|null} Bounds or null / 境界情報 または null
   */
  getBounds() {
    return this._bounds;
  }

  /**
   * Get debug information.
   * デバッグ情報を取得します。
   * @returns {Object} Debug info / デバッグ情報
   */
  getDebugInfo() {
    const baseInfo = {
      options: { ...this.options },
      bounds: this._bounds,
      grid: this._grid,
      statistics: this._statistics
    };
    
    // v0.1.4: 自動調整情報を追加
    if (this.options.autoVoxelSize) {
      baseInfo.autoVoxelSizeInfo = {
        enabled: this.options.autoVoxelSize,
        originalSize: this._statistics?.originalVoxelSize,
        finalSize: this._statistics?.finalVoxelSize,
        adjusted: this._statistics?.autoAdjusted || false,
        reason: this._statistics?.adjustmentReason,
        dataRange: this._bounds ? calculateDataRange(this._bounds) : null,
        estimatedDensity: this._bounds && this._statistics ? 
          this._statistics.totalEntities / (calculateDataRange(this._bounds).x * calculateDataRange(this._bounds).y * calculateDataRange(this._bounds).z) : null
      };
    }
    
    return baseInfo;
  }

  /**
   * Automatically fit camera view to data bounds with intelligent positioning.
   * データ境界にインテリジェントな位置決めでカメラビューを自動フィットします。
   * 
   * This method calculates optimal camera position and orientation to view the entire
   * heatmap data with appropriate padding and viewing angle. Uses smart algorithms to
   * avoid extreme camera positions and ensure good visibility.
   * 
   * このメソッドは適切なパディングと視角でヒートマップデータ全体を表示するため、
   * 最適なカメラ位置と向きを計算します。極端なカメラ位置を避けて良好な視認性を
   * 確保するスマートアルゴリズムを使用します。
   * 
   * @param {Object} [bounds] - Target bounds to fit to (uses current data bounds if omitted) / フィット対象境界（省略時は現在のデータ境界を使用）
   * @param {number} bounds.minLon - Minimum longitude in degrees / 最小経度（度）
   * @param {number} bounds.maxLon - Maximum longitude in degrees / 最大経度（度）
   * @param {number} bounds.minLat - Minimum latitude in degrees / 最小緯度（度）
   * @param {number} bounds.maxLat - Maximum latitude in degrees / 最大緯度（度）
   * @param {number} bounds.minAlt - Minimum altitude in meters / 最小高度（メートル）
   * @param {number} bounds.maxAlt - Maximum altitude in meters / 最大高度（メートル）
   * @param {Object} [options={}] - Camera positioning options / カメラ位置決めオプション
   * @param {number} [options.paddingPercent=0.1] - Padding around data as percentage (0-1) / データ周辺パディング（0-1の割合）
   * @param {number} [options.pitchDegrees=-45] - Camera pitch angle in degrees / カメラピッチ角度（度）
   * @param {number} [options.headingDegrees=0] - Camera heading angle in degrees / カメラヘディング角度（度）
   * @param {number} [options.duration=2.0] - Animation duration in seconds / アニメーション時間（秒）
   * @returns {Promise<void>} Promise that resolves when camera animation completes / カメラアニメーション完了時に解決するPromise
   * @throws {Error} Throws error if no bounds available for fitting / フィット用境界が利用できない場合はエラーを投げます
   * 
   * @example
   * // Fit to current data bounds / 現在のデータ境界にフィット
   * await heatbox.fitView();
   * 
   * @example
   * // Custom camera angle and padding / カスタムカメラ角度とパディング  
   * await heatbox.fitView(null, {
   *   pitchDegrees: -60,      // 上空60度からの視点
   *   headingDegrees: 45,     // 北東45度方向
   *   paddingPercent: 0.2,    // データ周辺に20%マージン
   *   duration: 3.0           // 3秒でアニメーション
   * });
   * 
   * @example
   * // Typical fitViewOptions patterns / 典型的なfitViewOptionsパターン
   * 
   * // Pattern 1: Top-down view / 真上からの視点
   * await heatbox.fitView(bounds, {
   *   pitchDegrees: -90,      // 真下を向く
   *   headingDegrees: 0,      // 北向き
   *   paddingPercent: 0.1
   * });
   * 
   * // Pattern 2: Diagonal overview / 斜め俯瞰
   * await heatbox.fitView(bounds, {
   *   pitchDegrees: -45,      // 45度斜め
   *   headingDegrees: 135,    // 南東方向から
   *   paddingPercent: 0.15
   * });
   * 
   * // Pattern 3: Close inspection / 近接観察
   * await heatbox.fitView(bounds, {
   *   pitchDegrees: -30,      // 浅い角度
   *   headingDegrees: 0,
   *   paddingPercent: 0.05,   // 狭いマージン
   *   duration: 1.0           // 素早く移動
   * });
   * 
   * @example
   * // Fit to specific bounds / 特定の境界にフィット
   * const customBounds = {
   *   minLon: 139.7, maxLon: 139.8,
   *   minLat: 35.6, maxLat: 35.7,
   *   minAlt: 0, maxAlt: 100
   * };
   * await heatbox.fitView(customBounds);
   * 
   * @since v0.1.9
   */
  async fitView(bounds = null, options = {}) {
    try {
      const targetBounds = bounds || this._bounds;
      if (!targetBounds) {
        Logger.warn('No bounds available for fitView');
        return;
      }

      // Merge with default fit view options
      const fitOptions = {
        ...this.options.fitViewOptions,
        ...options
      };

      Logger.debug('fitView called with bounds:', targetBounds, 'options:', fitOptions);

      // Map option names and delegate to ViewFitter
      const mapped = {
        paddingPercent: fitOptions.paddingPercent,
        pitchDegrees: fitOptions.pitch ?? fitOptions.pitchDegrees,
        headingDegrees: fitOptions.heading ?? fitOptions.headingDegrees,
        duration: fitOptions.duration,
        maximumHeight: fitOptions.maximumHeight,
        minimumHeight: fitOptions.minimumHeight
      };
      return await ViewFitter.fitToBounds(this.viewer, targetBounds, mapped);

    } catch (error) {
      Logger.error('fitView failed:', error);
      throw error;
    }
  }

  /**
   * Filter entity array (utility static method).
   * エンティティ配列をフィルタします（ユーティリティ・静的メソッド）。
   * @param {Cesium.Entity[]} entities - Entity array / エンティティ配列
   * @param {Function} predicate - Predicate function / フィルタ関数
   * @returns {Cesium.Entity[]} Filtered array / フィルタ済み配列
   */
  static filterEntities(entities, predicate) {
    if (!Array.isArray(entities) || typeof predicate !== 'function') return [];
    return entities.filter(predicate);
  }
}
