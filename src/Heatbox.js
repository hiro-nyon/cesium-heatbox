/**
 * CesiumJS Heatbox - メインクラス
 */

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
   * @param {Object} viewer - CesiumJS Viewer インスタンス
   * @param {Object} options - 設定オプション
   */
  constructor(viewer, options = {}) {
    // Viewer検証
    if (!isValidViewer(viewer)) {
      throw new Error(ERROR_MESSAGES.INVALID_VIEWER);
    }
    
    this.viewer = viewer;
    this.options = { ...DEFAULT_OPTIONS, ...validateAndNormalizeOptions(options) };
    this.renderer = new VoxelRenderer(viewer, this.options);
    
    // 内部状態
    this.bounds = null;
    this.grid = null;
    this.voxelData = null;
    this.statistics = null;
  }
  
  /**
   * エンティティからヒートマップを作成
   * @param {Array} entities - 対象エンティティ配列
   * @returns {Promise<Object>} 統計情報
   */
  async createFromEntities(entities) {
    // 入力検証
    if (!isValidEntities(entities)) {
      throw new Error(ERROR_MESSAGES.NO_ENTITIES);
    }
    
    console.log(`${entities.length}個のエンティティからヒートマップを作成中...`);
    
    try {
      // 1. 境界計算
      console.log('境界を計算中...');
      this.bounds = CoordinateTransformer.calculateBounds(entities);
      
      // 2. グリッド生成
      console.log('ボクセルグリッドを生成中...');
      this.grid = VoxelGrid.createGrid(this.bounds, this.options.voxelSize);
      
      // 3. ボクセル数制限チェック
      const validation = validateVoxelCount(this.grid.totalVoxels, this.options.voxelSize);
      if (!validation.valid) {
        throw new Error(
          `${validation.error}: ${this.grid.totalVoxels}個\n` +
          `推奨ボクセルサイズ: ${validation.recommendedSize}m以上`
        );
      }
      
      if (validation.warning) {
        console.warn(`${validation.error}: ${this.grid.totalVoxels}個`);
      }
      
      // 4. エンティティ分類
      console.log('エンティティをボクセルに分類中...');
      this.voxelData = DataProcessor.classifyEntitiesIntoVoxels(entities, this.bounds, this.grid);
      
      // 5. 統計計算
      console.log('統計情報を計算中...');
      this.statistics = DataProcessor.calculateStatistics(this.voxelData, this.grid);
      
      // 6. 描画
      console.log('ヒートマップを描画中...');
      this.renderer.renderVoxels(this.voxelData, this.bounds, this.grid, this.statistics);
      
      // 7. 結果ログ
      console.log('ヒートマップ作成完了:', {
        totalVoxels: this.statistics.totalVoxels,
        nonEmptyVoxels: this.statistics.nonEmptyVoxels,
        renderedVoxels: this.statistics.renderedVoxels,
        totalEntities: this.statistics.totalEntities
      });
      
      return this.statistics;
      
    } catch (error) {
      console.error('ヒートマップ作成エラー:', error);
      this.clear();
      throw error;
    }
  }
  
  /**
   * エンティティを更新（部分更新）
   * @param {Array} deltaEntities - 変更対象エンティティ
   * @param {Object} options - 更新オプション
   * @returns {Promise<Object>} 更新後の統計情報
   */
  async updateEntities(deltaEntities, options = {}) {
    const { mode = 'append' } = options;
    
    if (!this.voxelData) {
      throw new Error('ヒートマップが作成されていません');
    }
    
    // 将来の実装: 部分更新機能
    console.warn('updateEntities は将来の実装予定です');
    return this.statistics;
  }
  
  /**
   * 表示/非表示を切り替え
   * @param {boolean} show - 表示する場合はtrue
   */
  setVisible(show) {
    if (this.renderer) {
      this.renderer.setVisible(show);
    }
  }
  
  /**
   * ヒートマップをクリア
   */
  clear() {
    if (this.renderer) {
      this.renderer.clearPrimitives();
    }
    
    this.bounds = null;
    this.grid = null;
    this.voxelData = null;
    this.statistics = null;
  }
  
  /**
   * 統計情報を取得
   * @returns {Object|null} 統計情報、未作成の場合はnull
   */
  getStatistics() {
    return this.statistics;
  }
  
  /**
   * 詳細な統計レポートを取得
   * @returns {Object|null} 詳細レポート、未作成の場合はnull
   */
  getDetailedReport() {
    if (!this.statistics || !this.voxelData) {
      return null;
    }
    
    return DataProcessor.generateDetailedReport(this.statistics, this.voxelData);
  }
  
  /**
   * 境界情報を取得
   * @returns {Object|null} 境界情報、未作成の場合はnull
   */
  getBounds() {
    return this.bounds;
  }
  
  /**
   * グリッド情報を取得
   * @returns {Object|null} グリッド情報、未作成の場合はnull
   */
  getGrid() {
    return this.grid;
  }
  
  /**
   * 現在のオプションを取得
   * @returns {Object} 現在のオプション
   */
  getOptions() {
    return { ...this.options };
  }
  
  /**
   * オプションを更新
   * @param {Object} newOptions - 新しいオプション
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...validateAndNormalizeOptions(newOptions) };
    this.renderer.options = this.options;
    
    // 既存のヒートマップがある場合は再描画
    if (this.voxelData) {
      this.renderer.renderVoxels(this.voxelData, this.bounds, this.grid, this.statistics);
    }
  }
  
  /**
   * エンティティをフィルタリング（静的メソッド）
   * @param {Array} entities - 対象エンティティ配列
   * @param {Function|Object} filter - フィルタ条件
   * @returns {Array} フィルタリングされたエンティティ配列
   */
  static filterEntities(entities, filter) {
    if (!Array.isArray(entities)) {
      return [];
    }
    
    if (typeof filter === 'function') {
      return entities.filter(filter);
    }
    
    // オブジェクトベースのフィルタ（将来実装）
    console.warn('オブジェクトベースのフィルタは将来実装予定です');
    return entities;
  }
  
  /**
   * デバッグ情報を取得
   * @returns {Object} デバッグ情報
   */
  getDebugInfo() {
    return {
      bounds: this.bounds,
      grid: this.grid,
      statistics: this.statistics,
      options: this.options,
      voxelDataSize: this.voxelData ? this.voxelData.size : 0,
      primitivesCount: this.renderer ? this.renderer.primitives.length : 0
    };
  }
}
