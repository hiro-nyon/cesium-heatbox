/**
 * CesiumJS Heatbox - メインクラス
 */
import * as Cesium from 'cesium';
import { DEFAULT_OPTIONS, ERROR_MESSAGES, PERFORMANCE_LIMITS } from './utils/constants.js';
import { isValidViewer, isValidEntities, validateAndNormalizeOptions, validateVoxelCount, estimateInitialVoxelSize, calculateDataRange } from './utils/validation.js';
import { Logger } from './utils/logger.js';
import { CoordinateTransformer } from './core/CoordinateTransformer.js';
import { VoxelGrid } from './core/VoxelGrid.js';
import { DataProcessor } from './core/DataProcessor.js';
import { VoxelRenderer } from './core/VoxelRenderer.js';

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
    this.options = validateAndNormalizeOptions({ ...DEFAULT_OPTIONS, ...options });
    // ログレベルをオプションに基づいて設定
    Logger.setLogLevel(this.options);
    this.renderer = new VoxelRenderer(this.viewer, this.options);
    
    this._bounds = null;
    this._grid = null;
    this._voxelData = null;
    this._statistics = null;
    this._eventHandler = null;

    this._initializeEventListeners();
  }

  /**
   * Set heatmap data and render.
   * ヒートマップデータを設定し、描画を実行します。
   * @param {Cesium.Entity[]} entities - Target entities array / 対象エンティティ配列
   */
  setData(entities) {
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

      // v0.1.4: 自動ボクセルサイズ調整
      let finalVoxelSize = this.options.voxelSize || DEFAULT_OPTIONS.voxelSize;
      let autoAdjustmentInfo = null;
      
      if (this.options.autoVoxelSize && !this.options.voxelSize) {
        try {
          Logger.debug('自動ボクセルサイズ調整開始');
          const estimatedSize = estimateInitialVoxelSize(this._bounds, entities.length);
          const tempGrid = VoxelGrid.createGrid(this._bounds, estimatedSize);
          const validation = validateVoxelCount(tempGrid.totalVoxels, estimatedSize);
          
          if (!validation.valid && validation.recommendedSize) {
            finalVoxelSize = validation.recommendedSize;
            autoAdjustmentInfo = {
              enabled: true,
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
      
      Logger.debug('Heatbox.setData - 処理完了');
      
    } catch (error) {
      Logger.error('ヒートマップ作成エラー:', error);
      this.clear();
      throw error;
    }
  }

  /**
   * Create heatmap from entities (async).
   * エンティティからヒートマップを作成（非同期 API）。
   * @param {Cesium.Entity[]} entities - Target entities array / 対象エンティティ配列
   * @returns {Promise<Object>} Statistics info / 統計情報
   */
  async createFromEntities(entities) {
    if (!isValidEntities(entities)) {
      throw new Error(ERROR_MESSAGES.NO_ENTITIES);
    }
    this.setData(entities);
    return this.getStatistics();
  }

  /**
   * Toggle visibility.
   * 表示/非表示を切り替えます。
   * @param {boolean} show - true to show / 表示する場合は true
   */
  setVisible(show) {
    this.renderer.setVisible(show);
  }

  /**
   * Clear the heatmap and internal state.
   * ヒートマップと内部状態をクリアします。
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
   * Get current options.
   * 現在のオプションを取得します。
   * @returns {Object} Options / オプション
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Update options and re-render if applicable.
   * オプションを更新し、必要に応じて再描画します。
   * @param {Object} newOptions - New options / 新しいオプション
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
   * Get statistics if available.
   * 統計情報を取得します（未作成の場合は null）。
   * @returns {Object|null} Statistics or null / 統計情報 または null
   */
  getStatistics() {
    return this._statistics;
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
