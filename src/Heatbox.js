/**
 * CesiumJS Heatbox - メインクラス
 */
import * as Cesium from 'cesium';
import { DEFAULT_OPTIONS, ERROR_MESSAGES } from './utils/constants.js';
import { isValidViewer, isValidEntities, validateAndNormalizeOptions } from './utils/validation.js';
import { Logger } from './utils/logger.js';
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
   * ヒートマップデータを設定し、描画を実行
   * @param {Cesium.Entity[]} entities - 対象エンティティ配列
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

      // 2. グリッド生成（シンプル化したアプローチ）
      Logger.debug('Step 2: グリッド生成 (サイズ:', this.options.voxelSize, 'm)');
      this._grid = VoxelGrid.createGrid(this._bounds, this.options.voxelSize);
      Logger.debug('グリッド生成完了:', this._grid);
      
      // 3. エンティティ分類
      Logger.debug('Step 3: エンティティ分類');
      this._voxelData = DataProcessor.classifyEntitiesIntoVoxels(entities, this._bounds, this._grid);
      Logger.debug('エンティティ分類完了:', this._voxelData.size, '個のボクセル');
      
      // 4. 統計計算
      Logger.debug('Step 4: 統計計算');
      this._statistics = DataProcessor.calculateStatistics(this._voxelData, this._grid);
      Logger.debug('統計情報:', this._statistics);
      
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
    this._eventHandler = null;
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
      const renderedVoxelCount = this.renderer.render(this._voxelData, this._bounds, this._grid, this._statistics);
      // 統計情報を更新
      this._statistics.renderedVoxels = renderedVoxelCount;
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
