/**
 * CesiumJS Heatbox - メインクラス
 */
import * as Cesium from 'cesium';
import { DEFAULT_OPTIONS, ERROR_MESSAGES } from './utils/constants.js';
import { isValidViewer, isValidEntities, validateAndNormalizeOptions, validateVoxelCount } from './utils/validation.js';
import { CoordinateTransformer } from './core/CoordinateTransformer.js';
import { VoxelGrid } from './core/VoxelGrid.js';
import { DataProcessor } from './core/DataProcessor.js';
import { VoxelRenderer } from './core/VoxelRenderer.js';

/**
 * CesiumJS Heatbox メインクラス
 * 3Dボクセルベースのヒートマップ可視化を提供
 */
export class Heatbox {
  /**
   * コンストラクタ
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer インスタンス
   * @param {Object} options - 設定オプション
   */
  constructor(viewer, options = {}) {
    if (!isValidViewer(viewer)) {
      throw new Error(ERROR_MESSAGES.INVALID_VIEWER);
    }
    
    this.viewer = viewer;
    this.options = validateAndNormalizeOptions({ ...DEFAULT_OPTIONS, ...options });
    this.renderer = new VoxelRenderer(this.viewer, this.options);
    
    this._bounds = null;
    this._grid = null;
    this._voxelData = null;
    this._statistics = null;
    this._eventHandler = null;
    this._selectedEntitySubscription = null;

    this._initializeEventListeners();
  }

  /**
   * ヒートマップデータを設定し、描画を実行
   * @param {Cesium.Entity[]} entities - 対象エンティティ配列
   */
  setData(entities) {
    if (!isValidEntities(entities)) {
      this.clear();
      return;
    }
    
    try {
      // 1. 境界計算
      this._bounds = CoordinateTransformer.calculateBounds(entities);
      if (!this._bounds) {
        this.clear();
        return;
      }

      // 2. グリッド生成（ボクセル上限に合わせて自動スケール）
      let voxelSize = this.options.voxelSize;
      let attempts = 0;
      const MAX_ATTEMPTS = 5;
      
      while (attempts <= MAX_ATTEMPTS) {
        const gridCandidate = VoxelGrid.createGrid(this._bounds, voxelSize);
        const check = validateVoxelCount(gridCandidate.totalVoxels, voxelSize);
        if (check.valid) {
          if (check.warning && typeof console !== 'undefined') {
            console.warn(check.error);
          }
          this._grid = gridCandidate;
          this.options.voxelSize = voxelSize; // 正規化された値を保持
          break;
        }
        if (!check.recommendedSize || attempts++ >= MAX_ATTEMPTS) {
          throw new Error(check.error || 'Failed to determine suitable voxel size');
        }
        voxelSize = check.recommendedSize;
      }
      
      // 3. エンティティ分類
      this._voxelData = DataProcessor.classifyEntitiesIntoVoxels(entities, this._bounds, this._grid);
      
      // 4. 統計計算
      this._statistics = DataProcessor.calculateStatistics(this._voxelData, this._grid);
      
      // 5. 描画
      this.renderer.render(this._voxelData, this._bounds, this._grid, this._statistics);
      
    } catch (error) {
      console.error('ヒートマップ作成エラー:', error);
      this.clear();
      throw error;
    }
  }

  /**
   * エンティティからヒートマップを作成（非同期API）
   * @param {Cesium.Entity[]} entities - 対象エンティティ配列
   * @returns {Promise<Object>} 統計情報
   */
  async createFromEntities(entities) {
    if (!isValidEntities(entities)) {
      throw new Error(ERROR_MESSAGES.NO_ENTITIES);
    }
    this.setData(entities);
    return this.getStatistics();
  }

  /**
   * 表示/非表示を切り替え
   * @param {boolean} show - 表示する場合はtrue
   */
  setVisible(show) {
    this.renderer.setVisible(show);
  }

  /**
   * ヒートマップをクリア
   */
  clear() {
    this.renderer.clear();
    this._bounds = null;
    this._grid = null;
    this._voxelData = null;
    this._statistics = null;
  }

  /**
   * インスタンスを破棄し、イベントリスナーを解放
   */
  destroy() {
    this.clear();
    if (this._eventHandler && !this._eventHandler.isDestroyed()) {
      this._eventHandler.destroy();
    }
    if (this._selectedEntitySubscription) {
      this._selectedEntitySubscription();
    }
    this._eventHandler = null;
    this._selectedEntitySubscription = null;
  }

  /**
   * 現在のオプションを取得
   * @returns {Object} オプション
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * オプションを更新
   * @param {Object} newOptions - 新しいオプション
   */
  updateOptions(newOptions) {
    this.options = validateAndNormalizeOptions({ ...this.options, ...newOptions });
    this.renderer.options = this.options;
    
    // 既存のヒートマップがある場合は再描画
    if (this._voxelData) {
      this.renderer.render(this._voxelData, this._bounds, this._grid, this._statistics);
    }
  }

  /**
   * 内部のイベントリスナーを初期化
   * @private
   */
  _initializeEventListeners() {
    this._eventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // クリックイベントでInfoBoxを更新
    this._eventHandler.setInputAction(movement => {
      const pickedObject = this.viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.type === 'voxel') {
        // InfoBoxに表示するためのダミーエンティティを作成
        const dummyEntity = new Cesium.Entity({
          id: `voxel-${pickedObject.id.key}`,
          description: this.renderer.createVoxelDescription(pickedObject.id.info)
        });
        this.viewer.selectedEntity = dummyEntity;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  /**
   * 統計情報を取得
   * @returns {Object|null} 統計情報、未作成の場合はnull
   */
  getStatistics() {
    return this._statistics;
  }

  /**
   * 境界情報を取得
   * @returns {Object|null} 境界情報、未作成の場合はnull
   */
  getBounds() {
    return this._bounds;
  }

  /**
   * デバッグ情報を取得
   * @returns {Object} デバッグ情報
   */
  getDebugInfo() {
    return {
      options: { ...this.options },
      bounds: this._bounds,
      grid: this._grid,
      statistics: this._statistics
    };
  }

  /**
   * エンティティ配列をフィルタ（ユーティリティ, 静的メソッド）
   * @param {Cesium.Entity[]} entities - エンティティ配列
   * @param {Function} predicate - フィルタ関数
   * @returns {Cesium.Entity[]} フィルタ済み配列
   */
  static filterEntities(entities, predicate) {
    if (!Array.isArray(entities) || typeof predicate !== 'function') return [];
    return entities.filter(predicate);
  }
}
