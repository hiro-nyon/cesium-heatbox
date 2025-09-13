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
  estimateInitialVoxelSize,
  calculateDataRange
} from './utils/validation.js';
import { applyAutoRenderBudget } from './utils/deviceTierDetector.js';
import { Logger } from './utils/logger.js';
import { CoordinateTransformer } from './core/CoordinateTransformer.js';
import { VoxelGrid } from './core/VoxelGrid.js';
import { DataProcessor } from './core/DataProcessor.js';
import { VoxelRenderer } from './core/VoxelRenderer.js';
import { getProfileNames, getProfile } from './utils/profiles.js';
import { PerformanceOverlay } from './utils/performanceOverlay.js';

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
    
    // v0.1.9: Auto Render Budgetの適用
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    this.options = validateAndNormalizeOptions(applyAutoRenderBudget(mergedOptions));
    
    // ログレベルをオプションに基づいて設定
    Logger.setLogLevel(this.options);
    this.renderer = new VoxelRenderer(this.viewer, this.options);
    
    this._bounds = null;
    this._grid = null;
    this._voxelData = null;
    this._statistics = null;
    this._eventHandler = null;
    this._performanceOverlay = null;
    this._lastRenderTime = null;

    this._initializeEventListeners();
    
    // v0.1.12: Initialize performance overlay if enabled
    if (this.options.performanceOverlay && this.options.performanceOverlay.enabled) {
      this._initializePerformanceOverlay();
    }
  }

  /**
   * Get effective normalized options snapshot.
   * 正規化済みオプションのスナップショットを取得します。
   * @returns {Object} options snapshot
   */
  getEffectiveOptions() {
    try {
      return JSON.parse(JSON.stringify(this.options));
    } catch (_) {
      // Fallback shallow copy
      return { ...this.options };
    }
  }

  /**
   * Get list of available configuration profiles
   * 利用可能な設定プロファイルの一覧を取得
   * 
   * @returns {string[]} Array of profile names / プロファイル名の配列
   * @static
   * @since 0.1.12
   */
  static listProfiles() {
    return getProfileNames();
  }

  /**
   * Get configuration profile details
   * 設定プロファイルの詳細を取得
   * 
   * @param {string} profileName - Profile name / プロファイル名
   * @returns {Object|null} Profile configuration with description / 説明付きプロファイル設定
   * @static
   * @since 0.1.12
   */
  static getProfileDetails(profileName) {
    return getProfile(profileName);
  }

  /**
   * Initialize performance overlay
   * パフォーマンスオーバーレイを初期化
   * @private
   * @since 0.1.12
   */
  _initializePerformanceOverlay() {
    if (typeof window === 'undefined') {
      Logger.warn('Performance overlay requires browser environment');
      return;
    }

    const overlayOptions = {
      position: 'top-right',
      fpsAveragingWindowMs: 1000,
      autoUpdate: true,
      ...this.options.performanceOverlay
    };

    this._performanceOverlay = new PerformanceOverlay(overlayOptions);
    
    // Show immediately if configured
    if (overlayOptions.autoShow) {
      this._performanceOverlay.show();
    }

    Logger.debug('Performance overlay initialized');
  }

  /**
   * Toggle performance overlay visibility
   * パフォーマンスオーバーレイの表示/非表示切り替え
   * 
   * @returns {boolean} New visibility state / 新しい表示状態
   * @since 0.1.12
   */
  togglePerformanceOverlay() {
    if (!this._performanceOverlay) {
      Logger.warn('Performance overlay not initialized. Set performanceOverlay.enabled: true in options.');
      return false;
    }
    
    this._performanceOverlay.toggle();
    return this._performanceOverlay.isVisible;
  }

  /**
   * Show performance overlay
   * パフォーマンスオーバーレイを表示
   * @since 0.1.12
   */
  showPerformanceOverlay() {
    if (this._performanceOverlay) {
      this._performanceOverlay.show();
    }
  }

  /**
   * Hide performance overlay
   * パフォーマンスオーバーレイを非表示
   * @since 0.1.12
   */
  hidePerformanceOverlay() {
    if (this._performanceOverlay) {
      this._performanceOverlay.hide();
    }
  }

  /**
   * Estimate memory usage for performance monitoring
   * パフォーマンス監視用のメモリ使用量推定
   * @private
   * @since 0.1.12
   */
  _estimateMemoryUsage() {
    try {
      // Rough estimation based on rendered entities and data
      const entityCount = this.renderer?.entities?.length || 0;
      const voxelDataSize = this._voxelData ? Object.keys(this._voxelData).length : 0;
      
      // Estimate: ~1KB per entity + ~100B per voxel data entry
      const estimated = (entityCount * 1024 + voxelDataSize * 100) / (1024 * 1024);
      return Math.max(0.1, estimated);
    } catch (_error) {
      return 0;
    }
  }

  /**
   * Set heatmap data and render.
   * ヒートマップデータを設定し、描画を実行します。
   * @param {Cesium.Entity[]} entities - Target entities array / 対象エンティティ配列
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
      
      if (this.options.autoVoxelSize && !this.options.voxelSize) {
        try {
          Logger.debug('自動ボクセルサイズ調整開始');
          
          // v0.1.9: 占有率ベースの計算オプション
          const sizeOptions = {
            autoVoxelSizeMode: this.options.autoVoxelSizeMode,
            autoVoxelTargetFill: this.options.autoVoxelTargetFill,
            maxRenderVoxels: this.options.maxRenderVoxels
          };
          
          const estimatedSize = estimateInitialVoxelSize(this._bounds, entities.length, sizeOptions);
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
   * Create heatmap from entities (async).
   * エンティティからヒートマップを作成（非同期 API）。
   * @param {Cesium.Entity[]} entities - Target entities array / 対象エンティティ配列
   * @returns {Promise<Object>} Statistics info / 統計情報
   */
  async createFromEntities(entities) {
    if (!isValidEntities(entities)) {
      throw new Error(ERROR_MESSAGES.NO_ENTITIES);
    }
    await this.setData(entities);
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
   * Fit view to data bounds with smart camera positioning.
   * データ境界にスマートなカメラ位置でビューをフィットします。
   * @param {Object} bounds - Target bounds (optional, uses current data bounds if not provided) / 対象境界
   * @param {Object} options - Fit view options / フィットビューオプション
   * @returns {Promise} Promise that resolves when camera movement is complete / カメラ移動完了時に解決するPromise
   */
  async fitView(bounds = null, options = {}) {
    try {
      const targetBounds = bounds || this._bounds;
      if (!targetBounds) {
        Logger.warn('No bounds available for fitView');
        return;
      }

      // 境界の妥当性チェック
      if (!this._isValidBounds(targetBounds)) {
        Logger.warn('Invalid bounds provided to fitView:', targetBounds);
        return;
      }

      const fitOptions = {
        ...this.options.fitViewOptions,
        ...options
      };

      Logger.debug('fitView called with bounds:', targetBounds, 'options:', fitOptions);

      // データ境界の中心とサイズを計算
      const centerLon = (targetBounds.minLon + targetBounds.maxLon) / 2;
      const centerLat = (targetBounds.minLat + targetBounds.maxLat) / 2;
      const centerAlt = (targetBounds.minAlt + targetBounds.maxAlt) / 2;

      // データ範囲の計算（極端なケースの処理）
      const dataRange = calculateDataRange(targetBounds);
      const maxRange = Math.max(dataRange.x, dataRange.y, dataRange.z);
      
      // 極小データの保護
      if (maxRange < 10) {
        Logger.debug('Very small data range detected, applying minimum scale');
        return this._handleMinimalDataRange(centerLon, centerLat, centerAlt, fitOptions);
      }
      
      // 極大データの保護
      if (maxRange > 100000) {
        Logger.debug('Very large data range detected, applying maximum scale');
        return this._handleLargeDataRange(targetBounds, fitOptions);
      }

      // パディングの計算（範囲制限）
      const paddingPercent = Math.max(0.05, Math.min(0.5, fitOptions.paddingPercent));
      const paddingMeters = paddingPercent * maxRange;
      
      // カメラ高度の計算（ピッチと視野角を考慮）
      const cameraHeight = this._calculateOptimalCameraHeight(
        maxRange, 
        paddingMeters, 
        fitOptions
      );

      // カメラ移動の実行
      return this._executeCameraMovement(
        centerLon, 
        centerLat, 
        centerAlt, 
        cameraHeight, 
        fitOptions,
        maxRange,
        paddingMeters
      );

    } catch (error) {
      Logger.error('fitView failed:', error);
      throw error;
    }
  }

  /**
   * Validate bounds object.
   * 境界オブジェクトの妥当性をチェックします。
   * @param {Object} bounds - Bounds to validate / 検証する境界
   * @returns {boolean} True if valid / 有効な場合true
   * @private
   */
  _isValidBounds(bounds) {
    return bounds &&
           typeof bounds.minLon === 'number' && !isNaN(bounds.minLon) &&
           typeof bounds.maxLon === 'number' && !isNaN(bounds.maxLon) &&
           typeof bounds.minLat === 'number' && !isNaN(bounds.minLat) &&
           typeof bounds.maxLat === 'number' && !isNaN(bounds.maxLat) &&
           typeof bounds.minAlt === 'number' && !isNaN(bounds.minAlt) &&
           typeof bounds.maxAlt === 'number' && !isNaN(bounds.maxAlt) &&
           bounds.minLon <= bounds.maxLon &&
           bounds.minLat <= bounds.maxLat &&
           bounds.minAlt <= bounds.maxAlt;
  }

  /**
   * Handle minimal data range case.
   * 極小データ範囲の場合の処理
   * @param {number} centerLon - Center longitude / 中心経度
   * @param {number} centerLat - Center latitude / 中心緯度
   * @param {number} centerAlt - Center altitude / 中心高度
   * @param {Object} fitOptions - Fit options / フィットオプション
   * @returns {Promise} Camera movement promise / カメラ移動Promise
   * @private
   */
  async _handleMinimalDataRange(centerLon, centerLat, centerAlt, fitOptions) {
    Logger.debug('Handling minimal data range');
    
    const destination = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt + 2000);
    const heading = Cesium.Math.toRadians(fitOptions.headingDegrees || fitOptions.heading);
    const pitch = Cesium.Math.toRadians(fitOptions.pitchDegrees || fitOptions.pitch);
    
    return this.viewer.camera.flyTo({
      destination,
      orientation: { heading, pitch, roll: 0 },
      duration: 1.5
    });
  }

  /**
   * Handle large data range case.
   * 極大データ範囲の場合の処理
   * @param {Object} bounds - Target bounds / 対象境界
   * @param {Object} fitOptions - Fit options / フィットオプション
   * @returns {Promise} Camera movement promise / カメラ移動Promise
   * @private
   */
  async _handleLargeDataRange(bounds, fitOptions) {
    Logger.debug('Handling large data range with bounding sphere');
    
    const centerLon = (bounds.minLon + bounds.maxLon) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerAlt = (bounds.minAlt + bounds.maxAlt) / 2;
    
    const dataRange = calculateDataRange(bounds);
    const maxRange = Math.max(dataRange.x, dataRange.y, dataRange.z);
    
    const boundingSphere = new Cesium.BoundingSphere(
      Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
      maxRange / 2
    );
    
    const heading = Cesium.Math.toRadians(fitOptions.headingDegrees || fitOptions.heading);
    const pitch = Cesium.Math.toRadians(fitOptions.pitchDegrees || fitOptions.pitch);
    
    return this.viewer.camera.flyToBoundingSphere(boundingSphere, {
      duration: 2.5,
      offset: new Cesium.HeadingPitchRange(heading, pitch, 0)
    });
  }

  /**
   * Calculate optimal camera height.
   * 最適なカメラ高度を計算します。
   * @param {number} maxRange - Maximum data range / 最大データ範囲
   * @param {number} paddingMeters - Padding in meters / パディング（メートル）
   * @param {Object} fitOptions - Fit options / フィットオプション
   * @returns {number} Optimal camera height / 最適なカメラ高度
   * @private
   */
  _calculateOptimalCameraHeight(maxRange, paddingMeters, fitOptions) {
    if (fitOptions.altitudeStrategy !== 'auto') {
      return fitOptions.altitude || 5000;
    }

    try {
      const pitch = Cesium.Math.toRadians(fitOptions.pitchDegrees || fitOptions.pitch);
      const fov = this.viewer.camera.frustum.fovy || Cesium.Math.toRadians(60);
      
      // 幾何学的計算: データがフレームに収まる高度を計算
      const adjustedRange = maxRange + paddingMeters;
      const baseCameraHeight = adjustedRange / (2 * Math.tan(fov / 2));
      
      // ピッチ補正（斜め視点での見え方調整）
      const absPitch = Math.abs(pitch);
      const pitchFactor = Math.max(0.5, Math.sin(Math.PI/2 - absPitch) + 0.3);
      let cameraHeight = baseCameraHeight * pitchFactor;
      
      // アスペクト比補正（極端に細長いデータの場合）
      const aspectRatio = maxRange / Math.min(maxRange, 100);
      if (aspectRatio > 5) {
        cameraHeight *= Math.log10(aspectRatio) + 1;
      }
      
      // 制限値適用（データ範囲に基づく適応的制限）
      const minHeight = Math.max(500, maxRange * 0.1);
      const maxHeight = Math.min(100000, maxRange * 10);
      cameraHeight = Math.max(minHeight, Math.min(maxHeight, cameraHeight));
      
      Logger.debug(`Camera height calculated: ${cameraHeight.toFixed(0)}m (range: ${maxRange.toFixed(0)}m, pitch: ${fitOptions.pitchDegrees || fitOptions.pitch}°)`);
      return cameraHeight;
      
    } catch (error) {
      Logger.warn('Camera height calculation failed, using fallback:', error);
      return Math.max(2000, maxRange * 2);
    }
  }

  /**
   * Execute camera movement.
   * カメラ移動を実行します。
   * @param {number} centerLon - Center longitude / 中心経度
   * @param {number} centerLat - Center latitude / 中心緯度
   * @param {number} centerAlt - Center altitude / 中心高度
   * @param {number} cameraHeight - Camera height / カメラ高度
   * @param {Object} fitOptions - Fit options / フィットオプション
   * @param {number} maxRange - Maximum range / 最大範囲
   * @param {number} paddingMeters - Padding meters / パディング（メートル）
   * @returns {Promise} Camera movement promise / カメラ移動Promise
   * @private
   */
  async _executeCameraMovement(centerLon, centerLat, centerAlt, cameraHeight, fitOptions, maxRange, paddingMeters) {
    try {
      // 目標カメラ位置
      const destination = Cesium.Cartesian3.fromDegrees(
        centerLon, 
        centerLat, 
        centerAlt + cameraHeight
      );

      // カメラの向き設定
      const heading = Cesium.Math.toRadians(fitOptions.headingDegrees || fitOptions.heading);
      const pitch = Cesium.Math.toRadians(fitOptions.pitchDegrees || fitOptions.pitch);
      const roll = 0;

      const orientation = {
        heading,
        pitch,
        roll
      };

      Logger.debug(`Camera target: position=${centerLon.toFixed(6)},${centerLat.toFixed(6)},${(centerAlt + cameraHeight).toFixed(0)}, heading=${fitOptions.headingDegrees || fitOptions.heading}°, pitch=${fitOptions.pitchDegrees || fitOptions.pitch}°`);

      // 距離に応じた移動時間の調整
      const duration = Math.max(1.0, Math.min(3.0, Math.log10(maxRange) * 0.8));

      // プライマリ: flyTo を使用
      const flyPromise = this.viewer.camera.flyTo({
        destination,
        orientation,
        duration,
        complete: () => {
          Logger.debug('fitView camera movement completed');
        },
        cancel: () => {
          Logger.debug('fitView camera movement cancelled');
        }
      });

      // flyToが利用できない場合のフォールバック
      if (!flyPromise) {
        Logger.debug('Using fallback: flyToBoundingSphere');
        const boundingSphere = new Cesium.BoundingSphere(
          Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
          maxRange / 2 + paddingMeters
        );
        
        await this.viewer.camera.flyToBoundingSphere(boundingSphere, {
          duration,
          offset: new Cesium.HeadingPitchRange(heading, pitch, 0)
        });
      } else {
        await flyPromise;
      }

      Logger.info('fitView completed successfully');
      
    } catch (error) {
      Logger.error('Camera movement execution failed:', error);
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
