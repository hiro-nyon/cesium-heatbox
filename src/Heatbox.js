/**
 * CesiumJS Heatbox - Main orchestration class.
 * CesiumJS Heatbox - メインオーケストレーションクラス
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
import { getProfileNames, getProfile, applyProfile } from './utils/profiles.js';
import { PerformanceOverlay } from './utils/performanceOverlay.js';

/**
 * @typedef {('mobile-fast'|'desktop-balanced'|'dense-data'|'sparse-data')} ProfileName
 * @since 0.1.12
 */

/**
 * @typedef {('standard'|'inset'|'emulation-only')} OutlineRenderMode
 * @since 0.1.12
 */

/**
 * @typedef {('off'|'topn'|'non-topn'|'all')} EmulationScope
 * @since 0.1.12
 */

/**
 * @typedef {('thin'|'medium'|'thick'|'adaptive')} OutlineWidthPreset
 * @since 0.1.12
 */

/**
 * @typedef {Object} PerformanceOverlayConfig
 * @property {boolean} [enabled=false] - Enable performance overlay / パフォーマンスオーバーレイを有効化
 * @property {('top-left'|'top-right'|'bottom-left'|'bottom-right')} [position='top-right'] - Overlay position / 配置位置
 * @property {boolean} [autoShow=false] - Show overlay automatically / 自動表示
 * @property {boolean} [autoUpdate=true] - Auto refresh overlay after render / 描画後に自動更新するか
 * @property {number} [updateIntervalMs=500] - Update interval in milliseconds / 更新間隔（ミリ秒）
 * @property {number} [fpsAveragingWindowMs=1000] - FPS 平滑化窓（ミリ秒）/ Averaging window for FPS
 * @since 0.1.12
 */

/**
 * @typedef {Object} HeatboxHighlightStyle
 * @property {number} [outlineWidth=4] - Outline width applied to highlighted voxels / ハイライト対象ボクセルに適用する枠線太さ
 * @property {number} [boostOpacity=0.2] - Extra opacity applied to highlighted voxels / ハイライト時に加算する不透明度
 * @property {number} [boostOutlineWidth] - Optional outline width override / 枠線太さの上書き指定
 */

/**
 * @typedef {Object} HeatboxAdaptiveParams
 * @property {number} [neighborhoodRadius=30] - Neighbor radius in meters used for density sampling / 密度サンプリングに用いる近傍半径（メートル）
 * @property {number} [densityThreshold=3] - Density threshold (entities per voxel) / 密度しきい値（エンティティ/ボクセル）
 * @property {number} [cameraDistanceFactor=0.8] - Camera distance compensation factor / カメラ距離補正係数
 * @property {number} [overlapRiskFactor=0.4] - Overlap risk factor used for diagnostics / 重なりリスク係数
 * @property {(Array.<number>|null)} [outlineWidthRange=null] - `[min,max]` outline width clamp / 枠線太さの許容範囲 `[最小, 最大]`
 * @property {(Array.<number>|null)} [boxOpacityRange=null] - `[min,max]` box opacity clamp / ボックス不透明度の許容範囲
 * @property {(Array.<number>|null)} [outlineOpacityRange=null] - `[min,max]` outline opacity clamp / 枠線不透明度の許容範囲
 * @property {boolean} [adaptiveOpacityEnabled=false] - Reserved flag for adaptive opacity / 適応透明度（プレースホルダー）
 * @property {boolean} [zScaleCompensation=true] - Enable Z scale compensation / Z軸スケール補正の有効化
 * @property {boolean} [overlapDetection=false] - Enable overlap diagnostics / 重なり検出を有効化
 */

/**
 * @typedef {Object} HeatboxFitViewOptions
 * @property {number} [paddingPercent=0.1] - Padding ratio around bounds / 境界に対するパディング割合
 * @property {number} [pitchDegrees=-30] - Camera pitch angle in degrees / カメラ俯角（度）
 * @property {number} [headingDegrees=0] - Camera heading in degrees / カメラ方位（度）
 * @property {('auto'|'manual')} [altitudeStrategy='auto'] - Altitude strategy for camera / カメラ高度の計算方法
 */

/**
 * @typedef {Object} HeatboxBounds
 * @property {number} minLon - Minimum longitude / 最小経度
 * @property {number} maxLon - Maximum longitude / 最大経度
 * @property {number} minLat - Minimum latitude / 最小緯度
 * @property {number} maxLat - Maximum latitude / 最大緯度
 * @property {number} minAlt - Minimum altitude / 最小高度
 * @property {number} maxAlt - Maximum altitude / 最大高度
 * @property {number} [centerLon] - Center longitude / 中心経度
 * @property {number} [centerLat] - Center latitude / 中心緯度
 * @property {number} [centerAlt] - Center altitude / 中心高度
 */

/**
 * @typedef {Object} HeatboxGridInfo
 * @property {number} numVoxelsX - Number of voxels along X axis / X軸方向のボクセル数
 * @property {number} numVoxelsY - Number of voxels along Y axis / Y軸方向のボクセル数
 * @property {number} numVoxelsZ - Number of voxels along Z axis / Z軸方向のボクセル数
 * @property {number} voxelSizeMeters - Voxel size in meters / ボクセルサイズ（メートル）
 * @property {number} totalVoxels - Total voxel count / 総ボクセル数
 */

/**
 * @typedef {Object} HeatboxLayerStat
 * @property {string} key - Layer key / レイヤキー
 * @property {number} total - Total entity count for this layer / このレイヤの総エンティティ数
 */

/**
 * @typedef {Object} HeatboxStatistics
 * @property {number} totalVoxels - Total voxels generated / 生成された総ボクセル数
 * @property {number} renderedVoxels - Voxels actually rendered / 実際に描画されたボクセル数
 * @property {number} nonEmptyVoxels - Non-empty voxels / データを含むボクセル数
 * @property {number} emptyVoxels - Empty voxels / 空ボクセル数
 * @property {number} totalEntities - Entities processed / 処理したエンティティ数
 * @property {number} minCount - Minimum entity count per voxel / 1ボクセルあたり最小エンティティ数
 * @property {number} maxCount - Maximum entity count per voxel / 1ボクセルあたり最大エンティティ数
 * @property {number} averageCount - Average entity count per voxel / 平均エンティティ数
 * @property {boolean} [autoAdjusted] - Whether auto adjustments occurred / 自動調整が行われたか
 * @property {number|null} [originalVoxelSize] - Original voxel size before adjustment / 調整前のボクセルサイズ
 * @property {number|null} [finalVoxelSize] - Final voxel size after adjustment / 調整後のボクセルサイズ
 * @property {string|null} [adjustmentReason] - Reason for auto adjustment / 自動調整の理由
 * @property {number} [renderTimeMs] - Render time in milliseconds / 描画時間（ミリ秒）
 * @property {string} [selectionStrategy] - Selection strategy used / 適用された選択戦略
 * @property {number} [clippedNonEmpty] - Non-empty voxels clipped by limits / 制限により除外された非空ボクセル数
 * @property {number} [coverageRatio] - Coverage ratio when hybrid strategy used / ハイブリッド戦略時のカバレッジ比率
 * @property {string} [renderBudgetTier] - Auto render budget tier label / 自動レンダーバジェットの区分
 * @property {number} [autoMaxRenderVoxels] - Auto-assigned maxRenderVoxels / 自動設定された maxRenderVoxels
 * @property {number|null} [occupancyRatio] - Ratio of rendered voxels to limit / 描画ボクセルと上限の比率
 * @property {HeatboxLayerStat[]} [layers] - Top-N layer aggregation (v0.1.18 ADR-0014) / 上位N個のレイヤ集約
 */

/**
 * @typedef {Object} HeatboxAutoVoxelSizeInfo
 * @property {boolean} enabled - Whether auto voxel sizing ran / 自動ボクセル調整が実行されたか
 * @property {boolean} adjusted - Whether voxel size was adjusted / サイズが調整されたか
 * @property {string|null} reason - Adjustment reason / 調整理由
 * @property {number|null} originalSize - Initial estimate / 初期推定値
 * @property {number|null} finalSize - Final size / 最終サイズ
 * @property {Object|null} [dataRange] - Estimated data range / 推定データ範囲
 * @property {number|null} [estimatedDensity] - Estimated density / 推定密度
 */

/**
 * @typedef {Object} HeatboxDebugInfo
 * @property {HeatboxOptions} options - Effective options / 有効なオプション
 * @property {HeatboxBounds|null} bounds - Current bounds / 現在の境界
 * @property {HeatboxGridInfo|null} grid - Grid information / グリッド情報
 * @property {HeatboxStatistics|null} statistics - Statistics snapshot / 統計情報
 * @property {HeatboxAutoVoxelSizeInfo|null} [autoVoxelSizeInfo] - Auto voxel sizing details / 自動ボクセル調整の詳細
 */

/**
 * @typedef {Object} HeatboxResolverVoxelInfo
 * @property {number} x - Voxel grid index (X) / ボクセルのXインデックス
 * @property {number} y - Voxel grid index (Y) / ボクセルのYインデックス
 * @property {number} z - Voxel grid index (Z) / ボクセルのZインデックス
 * @property {number} count - Number of entities within the voxel / ボクセル内のエンティティ数
 */

/**
 * @typedef {Object} HeatboxOutlineWidthResolverParams
 * @property {HeatboxResolverVoxelInfo} voxel - Voxel information / ボクセル情報
 * @property {boolean} isTopN - Whether voxel is part of highlighted TopN / TopN対象か
 * @property {number} normalizedDensity - Density normalised to 0-1 / 正規化密度（0〜1）
 * @property {HeatboxStatistics} statistics - Latest statistics snapshot / 最新統計情報
 * @property {HeatboxAdaptiveParams|null} [adaptiveParams] - Adaptive parameters / 適応パラメータ
 */

/**
 * @typedef {Object} HeatboxOpacityResolverContext
 * @property {HeatboxResolverVoxelInfo} voxel - Voxel information / ボクセル情報
 * @property {boolean} isTopN - Whether voxel is part of highlighted TopN / TopN対象か
 * @property {number} normalizedDensity - Density normalised to 0-1 / 正規化密度（0〜1）
 * @property {HeatboxStatistics} statistics - Latest statistics snapshot / 最新統計情報
 * @property {HeatboxAdaptiveParams|null} [adaptiveParams] - Adaptive parameters / 適応パラメータ
 */

/**
 * @typedef {Object} HeatboxOptions
 * @property {ProfileName} [profile] - Named preset to start from / 推奨プリセット名
 * @property {number} [voxelSize=20] - Voxel size in meters / ボクセルサイズ（メートル）
 * @property {boolean} [autoVoxelSize=false] - Enable auto voxel size estimation / 自動ボクセルサイズ推定
 * @property {('basic'|'occupancy')} [autoVoxelSizeMode='basic'] - Auto voxel mode / 自動ボクセルモード
 * @property {number} [autoVoxelTargetFill=0.6] - Target occupancy ratio for auto mode / 自動モード時の目標充填率
 * @property {number} [maxRenderVoxels=50000] - Max voxels to render / 描画ボクセル上限
 * @property {('density'|'coverage'|'hybrid')} [renderLimitStrategy='density'] - Voxel selection strategy / ボクセル選択戦略
 * @property {number} [minCoverageRatio=0.2] - Minimum coverage ratio for hybrid strategy / ハイブリッド戦略時の最小カバレッジ比率
 * @property {('auto'|number)} [coverageBinsXY='auto'] - Grid bins for coverage strategy / カバレッジ戦略用グリッド分割
 * @property {boolean} [showOutline=true] - Draw voxel outlines / 枠線を描画
 * @property {boolean} [showEmptyVoxels=false] - Show empty voxels / 空ボクセルを描画
 * @property {boolean} [wireframeOnly=false] - Render outlines only / 枠線のみ描画
 * @property {boolean} [heightBased=false] - Scale height by density / 密度に応じて高さを調整
 * @property {number} [outlineWidth=2] - Base outline width / 基本枠線太さ
 * @property {number} [voxelGap=0] - Gap between voxels in meters / ボクセル間ギャップ（メートル）
 * @property {number} [opacity=0.8] - Box opacity / ボックス不透明度
 * @property {number} [emptyOpacity=0.03] - Empty voxel opacity / 空ボクセル不透明度
 * @property {number[]} [minColor=[0,32,255]] - RGB colour for minimum density / 最低密度時のRGB
 * @property {number[]} [maxColor=[255,64,0]] - RGB colour for maximum density / 最高密度時のRGB
 * @property {('custom'|'viridis'|'inferno')} [colorMap='custom'] - Colour map preset / カラーマップ
 * @property {boolean} [diverging=false] - Use diverging colour mode / 発散配色モード
 * @property {number} [divergingPivot=0] - Diverging pivot value / 発散配色のピボット
 * @property {number|null} [highlightTopN=null] - Highlight top N voxels / 上位Nボクセルの強調
 * @property {HeatboxHighlightStyle} [highlightStyle] - Highlight styling / ハイライトスタイル
 * @property {OutlineRenderMode} [outlineRenderMode='standard'] - Outline rendering mode / 枠線描画モード
 * @property {EmulationScope} [emulationScope='off'] - Emulation scope / エミュレーション範囲
 * @property {boolean} [adaptiveOutlines=false] - Enable adaptive outline mode / 適応枠線制御を有効化
 * @property {OutlineWidthPreset} [outlineWidthPreset='medium'] - Outline width preset / 枠線プリセット
 * @property {?function(HeatboxOutlineWidthResolverParams):number} [outlineWidthResolver=null] - Custom outline width resolver / 枠線太さの独自制御
 * @property {?function(HeatboxOpacityResolverContext):number} [outlineOpacityResolver=null] - Custom outline opacity resolver / 枠線透明度の独自制御
 * @property {?function(HeatboxOpacityResolverContext):number} [boxOpacityResolver=null] - Custom box opacity resolver / ボックス透明度の独自制御
 * @property {number} [outlineInset=0] - Inset outline offset in meters / インセット枠線のオフセット
 * @property {('all'|'topn'|'none')} [outlineInsetMode='all'] - Inset outline target / インセット枠線の適用対象
 * @property {boolean} [enableThickFrames=false] - Enable thick frame fill / 厚枠フレーム補完
 * @property {HeatboxAdaptiveParams} [adaptiveParams] - Adaptive control parameters / 適応制御パラメータ
 * @property {boolean} [autoView=false] - Automatically fit camera after render / 描画後に視点を自動調整
 * @property {HeatboxFitViewOptions} [fitViewOptions] - Camera fit options / ビューフィットの設定
 * @property {PerformanceOverlayConfig|null} [performanceOverlay=null] - Performance overlay config / パフォーマンスオーバーレイ設定
 * @property {('manual'|'auto')} [renderBudgetMode='manual'] - Render budget mode / レンダーバジェット制御モード
 * @property {(boolean|Object)} [debug=false] - Debug options (`true` enables verbose logging, object can contain `showBounds`) / デバッグ設定（trueで詳細ログ、オブジェクトの場合は`showBounds`などを指定）
 */

/**
 * Main class of CesiumJS Heatbox.
 * Provides 3D voxel-based heatmap visualization in CesiumJS environments.
 * Refer to {@link HeatboxOptions} for the full option catalogue with defaults.
 *
 * CesiumJS Heatbox メインクラス。
 * CesiumJS 環境で 3D ボクセルベースのヒートマップ可視化を提供します。
 * 利用可能なオプションと既定値は {@link HeatboxOptions} を参照してください。
 */
export class Heatbox {
  /**
   * Constructor.
   * Prepares the renderer, normalises options, and wires core event listeners.
   *
   * 初期化処理ではオプションの正規化とレンダラー生成、必要なイベント購読を行います。
   *
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer instance / CesiumJS Viewer インスタンス
   * @param {HeatboxOptions} [options={}] - Configuration options / 設定オプション
   */
  constructor(viewer, options = {}) {
    if (!isValidViewer(viewer)) {
      throw new Error(ERROR_MESSAGES.INVALID_VIEWER);
    }
    
    this.viewer = viewer;
    
    // v0.1.9: Auto Render Budgetの適用
    // Phase 4: Ensure profile and legacy migration are applied before merging defaults
    let userOptions = { ...(options || {}) };
    // Apply profile before merging defaults (defaults <- profile <- user)
    if (userOptions.profile && getProfileNames().includes(userOptions.profile)) {
      userOptions = applyProfile(userOptions.profile, userOptions);
      delete userOptions.profile;
    }
    const mergedOptions = { ...DEFAULT_OPTIONS, ...userOptions };
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
    this._overlayLastUpdate = 0;
    this._postRenderListener = null;
    this._prevFrameTimestamp = null;

    this._initializeEventListeners();
    
    // v0.1.12: Initialize performance overlay if enabled
    if (this.options.performanceOverlay && this.options.performanceOverlay.enabled) {
      this._initializePerformanceOverlay();
    }
  }

  /**
   * Get effective normalized options snapshot.
   * 正規化済みオプションのスナップショットを取得します。
   * @returns {HeatboxOptions} options snapshot / オプションのスナップショット
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
   * @returns {ProfileName[]} Array of profile names / プロファイル名の配列
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
   * Returned object shares the same keys as {@link HeatboxOptions} plus an optional `description`.
   * 戻り値は {@link HeatboxOptions} と同じキーに加えて `description` フィールドを含みます。
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
      updateIntervalMs: 500,
      ...this.options.performanceOverlay
    };

    this._performanceOverlay = new PerformanceOverlay(overlayOptions);
    
    // Show immediately if configured
    if (overlayOptions.autoShow) {
      this._performanceOverlay.show();
    }

    Logger.debug('Performance overlay initialized');

    // Hook postRender to provide real-time updates with low overhead
    this._hookPerformanceOverlayUpdates();
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
   * Enable or disable performance overlay at runtime.
   * 実行時にパフォーマンスオーバーレイを有効/無効化します。
   * @param {boolean} enabled - true to enable, false to disable
   * @param {PerformanceOverlayConfig} [options] - Optional overlay options to apply / 追加設定
   * @returns {boolean} Current enabled state / 現在の有効状態
   * @since 0.1.12
   */
  setPerformanceOverlayEnabled(enabled, options = {}) {
    if (enabled) {
      if (!this._performanceOverlay) {
        // Initialize with given options overriding existing config
        this.options.performanceOverlay = { enabled: true, ...(this.options.performanceOverlay || {}), ...options };
        this._initializePerformanceOverlay();
      } else {
        // Apply options if provided
        if (options && Object.keys(options).length > 0) {
          this._performanceOverlay.options = { ...this._performanceOverlay.options, ...options };
        }
        this._performanceOverlay.show();
      }
      return true;
    }

    // Disable and cleanup listener
    if (this._performanceOverlay) {
      this._performanceOverlay.hide();
    }
    if (this._postRenderListener) {
      try { this.viewer.scene.postRender.removeEventListener(this._postRenderListener); } catch (_) { Logger.debug('postRender listener removal failed (non-fatal)'); }
      this._postRenderListener = null;
    }
    return false;
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
      const entityCount = (this.renderer?.geometryRenderer?.entities?.length) 
        || (this.renderer?.voxelEntities?.length) || 0;
      let voxelDataSize = 0;
      if (this._voxelData) {
        if (this._voxelData instanceof Map) {
          voxelDataSize = this._voxelData.size;
        } else if (typeof this._voxelData.size === 'number') {
          voxelDataSize = this._voxelData.size;
        } else if (Array.isArray(this._voxelData)) {
          voxelDataSize = this._voxelData.length;
        } else if (typeof this._voxelData === 'object') {
          voxelDataSize = Object.keys(this._voxelData).length;
        }
      }
      
      // Estimate: ~1KB per entity + ~100B per voxel data entry
      const estimated = (entityCount * 1024 + voxelDataSize * 100) / (1024 * 1024);
      return Math.max(0.1, estimated);
    } catch (_error) {
      return 0;
    }
  }

  /**
   * Set heatmap data and render.
   * Calculates bounds, prepares the voxel grid, runs classification, and finally renders.
   *
   * ヒートマップデータを設定し、境界計算→ボクセル分類→描画の順で処理します。
   *
   * @param {Cesium.Entity[]} entities - Target entities array / 対象エンティティ配列
   * @returns {Promise<void>} Resolves when rendering is completed / 描画完了時に解決
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
      
      // 3. エンティティ分類（v0.1.17: 空間IDサポート）
      Logger.debug('Step 3: エンティティ分類');
      // Pass options with voxelSize for spatial ID auto zoom calculation
      const classificationOptions = { ...this.options, voxelSize: finalVoxelSize };
      this._voxelData = await DataProcessor.classifyEntitiesIntoVoxels(entities, this._bounds, this._grid, classificationOptions);
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
      
      // v0.1.17: 空間ID情報を統計に追加
      if (classificationOptions.spatialId?.enabled) {
        this._statistics.spatialIdEnabled = true;
        this._statistics.spatialIdMode = classificationOptions.spatialId.mode;
        this._statistics.spatialIdProvider = classificationOptions._spatialIdProvider || null;
        this._statistics.spatialIdZoom = classificationOptions._resolvedZoom || null;
        this._statistics.zoomControl = classificationOptions.spatialId.zoomControl;
      } else {
        this._statistics.spatialIdEnabled = false;
      }
      
      // 5. 描画（レンダリング時間の計測）
      Logger.debug('Step 5: 描画');
      const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const renderedVoxelCount = this.renderer.render(this._voxelData, this._bounds, this._grid, this._statistics);
      const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      this._lastRenderTime = Math.max(0, t1 - t0);
      
      // 統計情報に実際の描画数を反映
      this._statistics.renderedVoxels = renderedVoxelCount;
      this._statistics.renderTimeMs = this._lastRenderTime;
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
      
      // Update overlay immediately after render if available
      if (this._performanceOverlay && this._performanceOverlay.isVisible) {
        const stats = this.getStatistics() || {};
        stats.renderTimeMs = this._lastRenderTime;
        stats.memoryUsageMB = this._estimateMemoryUsage();
        this._performanceOverlay.update(stats, undefined);
      }
      
    } catch (error) {
      Logger.error('ヒートマップ作成エラー:', error);
      this.clear();
      throw error;
    }
  }

  /**
   * Create heatmap from entities (async).
   * エンティティからヒートマップを作成（非同期 API）。
   * Resolves with the statistics snapshot calculated by {@link getStatistics}.
   * 描画完了後に {@link getStatistics} と同じ統計スナップショットを返します。
   * @param {Cesium.Entity[]} entities - Target entities array / 対象エンティティ配列
   * @returns {Promise<HeatboxStatistics>} Statistics info / 統計情報
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
    // Remove overlay listener and destroy overlay
    if (this._postRenderListener) {
      try { this.viewer.scene.postRender.removeEventListener(this._postRenderListener); } catch (_) { Logger.debug('postRender listener removal failed (non-fatal)'); }
      this._postRenderListener = null;
    }
    if (this._performanceOverlay) {
      try { this._performanceOverlay.destroy(); } catch (_) { Logger.debug('overlay destroy failed (non-fatal)'); }
      this._performanceOverlay = null;
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
   * @returns {HeatboxOptions} Options / オプション
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Update options and re-render if applicable.
   * オプションを更新し、必要に応じて再描画します。
   * @param {HeatboxOptions} newOptions - New options (partial allowed) / 新しいオプション（部分指定可）
   */
  updateOptions(newOptions) {
    this.options = validateAndNormalizeOptions({ ...this.options, ...newOptions });
    this.renderer.options = this.options;

    if (this.renderer.adaptiveController && typeof this.renderer.adaptiveController.updateOptions === 'function') {
      this.renderer.adaptiveController.updateOptions(this.options);
    }
    if (this.renderer.geometryRenderer && typeof this.renderer.geometryRenderer.updateOptions === 'function') {
      this.renderer.geometryRenderer.updateOptions(this.options);
    }
    
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
   * @returns {HeatboxStatistics|null} Statistics or null / 統計情報 または null
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

    // v0.1.18: Layer aggregation statistics (ADR-0014)
    if (this.options.aggregation?.enabled && this._voxelData) {
      const globalLayerCounts = new Map();
      
      // Aggregate across all voxels / 全ボクセルを集約
      for (const voxelInfo of this._voxelData.values()) {
        if (voxelInfo.layerStats) {
          for (const [layerKey, count] of voxelInfo.layerStats) {
            globalLayerCounts.set(
              layerKey,
              (globalLayerCounts.get(layerKey) || 0) + count
            );
          }
        }
      }
      
      // Top N layers (configurable via options.aggregation.topN) / 上位N個のレイヤ（options.aggregation.topNで設定可能）
      const topN = this.options.aggregation?.topN ?? 10;
      const sorted = Array.from(globalLayerCounts.entries())
        .sort((a, b) => b[1] - a[1])  // Sort by count descending / カウント降順でソート
        .slice(0, topN);
      
      stats.layers = sorted.map(([key, total]) => ({ key, total }));
      
      Logger.debug(`[aggregation] Aggregated ${globalLayerCounts.size} unique layers, returning top ${stats.layers.length}`);
    }

    return stats;
  }

  /**
   * Get bounds info if available.
   * 境界情報を取得します（未作成の場合は null）。
   * @returns {HeatboxBounds|null} Bounds or null / 境界情報 または null
   */
  getBounds() {
    return this._bounds;
  }

  /**
   * Get debug information.
   * デバッグ情報を取得します。
   * @returns {HeatboxDebugInfo} Debug info / デバッグ情報
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
   * Hook viewer postRender to feed overlay with periodic updates.
   * viewer の postRender にフックし、オーバーレイへ定期更新を供給します。
   * @private
   */
  _hookPerformanceOverlayUpdates() {
    if (!this._performanceOverlay || this._postRenderListener) return;

    const interval = this._performanceOverlay.options?.updateIntervalMs ?? 500;
    this._postRenderListener = () => {
      // Skip if overlay not visible
      if (!this._performanceOverlay || !this._performanceOverlay.isVisible) return;

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      // Calculate frame time from previous timestamp
      let frameTime;
      if (this._prevFrameTimestamp != null) {
        frameTime = Math.max(0, now - this._prevFrameTimestamp);
      }
      this._prevFrameTimestamp = now;

      // Throttle updates
      if (now - this._overlayLastUpdate < interval) return;
      this._overlayLastUpdate = now;

      const stats = this.getStatistics() || {};
      // Attach last render time and estimated memory usage
      if (this._lastRenderTime != null) stats.renderTimeMs = this._lastRenderTime;
      stats.memoryUsageMB = this._estimateMemoryUsage();

      try {
        this._performanceOverlay.update(stats, frameTime);
      } catch (_e) {
        // Ignore overlay update errors to avoid impacting render loop
      }
    };

    try {
      this.viewer.scene.postRender.addEventListener(this._postRenderListener);
    } catch (_e) {
      // No-op if event registration fails
    }
  }

  /**
   * Fit view to data bounds with smart camera positioning.
   * データ境界にスマートなカメラ位置でビューをフィットします。
   *
   * 実装メモ（v0.1.12）：
   * - 描画とカメラ移動の競合を避けるため、`viewer.scene.postRender` で1回だけ実行します。
   * - 矩形境界（経緯度）から `Cesium.Rectangle` → `Cesium.BoundingSphere` を生成し、
   *   `camera.flyToBoundingSphere` + `HeadingPitchRange` で安定的にズームします。
   * - 俯角は安全範囲にクランプ（既定: -35°, 範囲: [-85°, -10°]）。
   * - 失敗時は `viewer.zoomTo(viewer.entities)` へフォールバックします。
   *
   * @param {HeatboxBounds|null} [bounds=null] - Target bounds（省略時は現在のデータ境界）
   * @param {HeatboxFitViewOptions} [options={}] - Fit view options / フィットビュー設定
   * @returns {Promise<void>} カメラ移動完了時に解決する Promise
   * @example
   * // データを適用後、安定的にビューフィット
   * await heatbox.setData(viewer.entities.values);
   * await heatbox.fitView(null, { headingDegrees: 0, pitchDegrees: -35, paddingPercent: 0.1 });
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

      // postRenderで一回だけ実行して描画との競合を回避
      const safeOptions = { ...fitOptions };
      if (!Number.isFinite(safeOptions.pitchDegrees)) safeOptions.pitchDegrees = -35;
      if (!Number.isFinite(safeOptions.headingDegrees)) safeOptions.headingDegrees = 0;

      return await new Promise((resolve) => {
        let fired = false;
        const handler = async () => {
          if (fired) return;
          fired = true;
          try {
            await this._fitByBoundingSphere(targetBounds, safeOptions);
          } catch (e) {
            Logger.warn('fitView (postRender) failed, trying fallback:', e);
          try {
            await this.viewer.zoomTo(this.viewer.entities);
          } catch (zoomErr) {
            Logger.warn('zoomTo fallback failed:', zoomErr);
          }
          } finally {
            try {
              this.viewer.scene.postRender.removeEventListener(handler);
            } catch (remErr) {
              Logger.debug('postRender removeEventListener failed (non-fatal):', remErr);
            }
            resolve();
          }
        };
        try {
          this.viewer.scene.postRender.addEventListener(handler);
        } catch (e) {
          Logger.warn('postRender addEventListener failed:', e);
          resolve();
        }
      });

    } catch (error) {
      Logger.error('fitView failed:', error);
      throw error;
    }
  }

  /**
   * Fit by bounding sphere derived from rectangle bounds
   * @private
   */
  async _fitByBoundingSphere(bounds, fitOptions) {
    const rect = Cesium.Rectangle.fromDegrees(bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat);
    const bs = Cesium.BoundingSphere.fromRectangle3D(rect, Cesium.Ellipsoid.WGS84, Math.max(0, bounds.minAlt || 0));
    const heading = Cesium.Math.toRadians(fitOptions.headingDegrees ?? 0);
    const pitchDeg = Math.max(-85, Math.min(-10, fitOptions.pitchDegrees ?? -35));
    const pitch = Cesium.Math.toRadians(pitchDeg);
    const range = Math.max(bs.radius * 2.2, 1000.0);
    await this.viewer.camera.flyToBoundingSphere(bs, {
      duration: 1.2,
      offset: new Cesium.HeadingPitchRange(heading, pitch, range)
    });
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
