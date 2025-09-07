# Source: core/selection/VoxelSelector.js

[English](#english) | [日本語](#日本語)

## English

See also: [Class: VoxelSelector](VoxelSelector)

```javascript
/**
 * @fileoverview VoxelSelector - Voxel selection strategies implementation
 * ADR-0009 Phase2: VoxelRenderer責任分離 - ボクセル選択戦略専門クラス
 * 
 * 機能:
 * - 密度選択戦略（density）
 * - カバレッジ選択戦略（coverage - 層化抽出）
 * - ハイブリッド選択戦略（hybrid - 密度+カバレッジ）
 * - TopN強調対応
 * - 統計情報収集
 */

import { Logger } from '../../utils/logger.js';

/**
 * VoxelSelector - ボクセル選択戦略の実装
 * 
 * Single Responsibility: ボクセル選択ロジックのみを担当
 * - 戦略パターンを使用して選択アルゴリズムを切り替え可能
 * - 純粋関数として設計（Cesium依存なし）
 * - エラー時は密度ソート選抜にフォールバック
 */
export class VoxelSelector {
  
  /**
   * Create a VoxelSelector instance.
   * VoxelSelectorインスタンスを作成。
   * 
   * @param {Object} options - Selection options / 選択オプション
   * @param {string} [options.renderLimitStrategy='density'] - Selection strategy / 選択戦略
   * @param {number} [options.highlightTopN=0] - TopN highlight count / TopN強調数
   * @param {number|string} [options.coverageBinsXY='auto'] - Coverage bins / カバレッジビン数
   * @param {number} [options.minCoverageRatio=0.2] - Min coverage ratio for hybrid / ハイブリッド用最小カバレッジ比率
   */
  constructor(options = {}) {
    this.options = {
      renderLimitStrategy: 'density',
      highlightTopN: 0,
      coverageBinsXY: 'auto',
      minCoverageRatio: 0.2,
      ...options
    };
    
    this._lastSelectionStats = null;
    
    Logger.debug(`VoxelSelector initialized with strategy: ${this.options.renderLimitStrategy}`);
  }
  
  /**
   * Select voxels for rendering based on configured strategy.
   * 設定された戦略に基づいてレンダリング用ボクセルを選択。
   * 
   * @param {Array} allVoxels - All voxels to select from / 選択元の全ボクセル
   * @param {number} maxCount - Maximum number of voxels to select / 選択する最大ボクセル数
   * @param {Object} context - Selection context / 選択コンテキスト
   * @param {Object} context.grid - Grid information / グリッド情報
   * @param {Object} [context.bounds] - Data bounds / データ境界
   * @returns {Object} Selection result / 選択結果
   */
  selectVoxels(allVoxels, maxCount, context = {}) {
    try {
      // 入力バリデーション
      if (!Array.isArray(allVoxels) || allVoxels.length === 0) {
        Logger.warn('VoxelSelector: Empty or invalid voxel array provided');
        return this._createEmptyResult();
      }
      
      if (maxCount <= 0) {
        Logger.warn(`VoxelSelector: Invalid maxCount: ${maxCount}`);
        return this._createEmptyResult();
      }
      
      // 全て選択可能な場合は早期リターン
      if (allVoxels.length <= maxCount) {
        return this._createResult(allVoxels, this.options.renderLimitStrategy, allVoxels.length, 0);
      }
      
      const { grid } = context;
      const strategy = this.options.renderLimitStrategy || 'density';
      
      // TopN強調ボクセルの特定
      const topNVoxels = this._identifyTopNVoxels(allVoxels);
      
      let result;
      
      // 戦略別選択実行
      switch (strategy) {
        case 'coverage':
          result = this._selectByCoverageStrategy(allVoxels, maxCount, grid, topNVoxels);
          break;
          
        case 'hybrid':
          result = this._selectByHybridStrategy(allVoxels, maxCount, grid, topNVoxels);
          break;
          
        case 'density':
        default:
          result = this._selectByDensityStrategy(allVoxels, maxCount, topNVoxels);
          break;
      }
      
      // 統計情報の保存
      this._lastSelectionStats = {
        strategy: result.strategy,
        clippedNonEmpty: result.clippedNonEmpty,
        coverageRatio: result.coverageRatio || null,
        selectedCount: result.selectedVoxels.length,
        totalCount: allVoxels.length
      };
      
      Logger.debug(`VoxelSelector: Applied ${result.strategy} strategy - selected ${result.selectedVoxels.length}/${allVoxels.length} voxels`);
      
      return result;
      
    } catch (error) {
      Logger.error(`VoxelSelector: Selection failed: ${error.message}. Falling back to density strategy.`);
      return this._fallbackToDensitySelection(allVoxels, maxCount);
    }
  }
  
  /**
   * Get the last selection statistics.
   * 最後の選択統計を取得。
   * 
   * @returns {Object|null} Selection statistics / 選択統計
   */
  getLastSelectionStats() {
    return this._lastSelectionStats;
  }
  
  /**
   * Identify TopN voxels for forced inclusion.
   * 強制包含用のTopNボクセルを特定。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @returns {Set} Set of TopN voxel keys / TopNボクセルキーのSet
   * @private
   */
  _identifyTopNVoxels(allVoxels) {
    const topNVoxels = new Set();
    
    if (this.options.highlightTopN && this.options.highlightTopN > 0) {
      const sortedForTopN = [...allVoxels].sort((a, b) => b.info.count - a.info.count);
      const topN = sortedForTopN.slice(0, this.options.highlightTopN);
      topN.forEach(voxel => topNVoxels.add(voxel.key));
      
      Logger.debug(`VoxelSelector: Identified ${topN.length} TopN voxels for forced inclusion`);
    }
    
    return topNVoxels;
  }
  
  /**
   * Select voxels using density strategy.
   * 密度戦略でボクセルを選択。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} maxCount - Maximum count / 最大数
   * @param {Set} forceInclude - Voxels to force include / 強制包含ボクセル
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _selectByDensityStrategy(allVoxels, maxCount, forceInclude = new Set()) {
    // 密度でソートして上位を選択
    const sorted = [...allVoxels].sort((a, b) => b.info.count - a.info.count);
    
    // 強制包含ボクセルを最初に追加
    const selected = [];
    const included = new Set();
    
    // TopNなど強制包含ボクセルを先に追加
    sorted.forEach(voxel => {
      if (forceInclude.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });
    
    // 残りを密度順で追加
    sorted.forEach(voxel => {
      if (!included.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });
    
    const clippedCount = allVoxels.length - selected.length;
    return this._createResult(selected, 'density', selected.length, clippedCount);
  }
  
  /**
   * Select voxels using coverage strategy (stratified sampling).
   * カバレッジ戦略でボクセルを選択（層化抽出）。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} maxCount - Maximum count / 最大数
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Set} forceInclude - Voxels to force include / 強制包含ボクセル
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _selectByCoverageStrategy(allVoxels, maxCount, grid, forceInclude = new Set()) {
    const selected = [];
    const included = new Set();
    
    // 強制包含ボクセルを先に追加
    allVoxels.forEach(voxel => {
      if (forceInclude.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });
    
    // 格子分割数の決定
    const binsXY = this.options.coverageBinsXY === 'auto' 
      ? Math.ceil(Math.sqrt(maxCount / 4)) // 自動計算: 平均4ボクセル/ビン
      : this.options.coverageBinsXY;
    
    // 空間をグリッド分割
    const bins = new Map();
    const remainingVoxels = allVoxels.filter(voxel => !included.has(voxel.key));
    
    remainingVoxels.forEach(voxel => {
      const binX = Math.max(0, Math.min(binsXY - 1, Math.floor((voxel.info.x / Math.max(1, grid.numVoxelsX)) * binsXY)));
      const binY = Math.max(0, Math.min(binsXY - 1, Math.floor((voxel.info.y / Math.max(1, grid.numVoxelsY)) * binsXY)));
      const binKey = `${binX},${binY}`;
      
      if (!bins.has(binKey)) {
        bins.set(binKey, []);
      }
      bins.get(binKey).push(voxel);
    });
    
    // 各ビンから代表ボクセルを選択
    const binKeys = Array.from(bins.keys());
    let binIndex = 0;
    
    while (selected.length < maxCount && binIndex < binKeys.length * 10) { // 最大10周
      const binKey = binKeys[binIndex % binKeys.length];
      const binVoxels = bins.get(binKey);
      
      if (binVoxels && binVoxels.length > 0) {
        // ビン内で最高密度のボクセルを選択
        binVoxels.sort((a, b) => b.info.count - a.info.count);
        const voxel = binVoxels.shift();
        
        if (!included.has(voxel.key)) {
          selected.push(voxel);
          included.add(voxel.key);
        }
        
        // 空になったビンを削除
        if (binVoxels.length === 0) {
          bins.delete(binKey);
          binKeys.splice(binKeys.indexOf(binKey), 1);
        }
      }
      
      binIndex++;
    }
    
    const clippedCount = allVoxels.length - selected.length;
    return this._createResult(selected, 'coverage', selected.length, clippedCount);
  }
  
  /**
   * Select voxels using hybrid strategy (density + coverage).
   * ハイブリッド戦略でボクセルを選択（密度 + カバレッジ）。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} maxCount - Maximum count / 最大数
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Set} forceInclude - Voxels to force include / 強制包含ボクセル
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _selectByHybridStrategy(allVoxels, maxCount, grid, forceInclude = new Set()) {
    const minCoverageRatio = this.options.minCoverageRatio || 0.2;
    
    const selected = [];
    const included = new Set();
    
    // 強制包含ボクセルを先に追加
    allVoxels.forEach(voxel => {
      if (forceInclude.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });
    
    const remainingCount = maxCount - selected.length;
    const adjustedCoverageCount = Math.floor(remainingCount * minCoverageRatio);
    const adjustedDensityCount = remainingCount - adjustedCoverageCount;
    
    // カバレッジ選択（層化抽出）
    if (adjustedCoverageCount > 0) {
      const coverageResult = this._selectByCoverageStrategy(
        allVoxels.filter(voxel => !included.has(voxel.key)), 
        adjustedCoverageCount, 
        grid, 
        new Set()
      );
      
      coverageResult.selectedVoxels.forEach(voxel => {
        if (selected.length < maxCount && !included.has(voxel.key)) {
          selected.push(voxel);
          included.add(voxel.key);
        }
      });
    }
    
    // 密度選択（残り）
    if (adjustedDensityCount > 0) {
      const densityResult = this._selectByDensityStrategy(
        allVoxels.filter(voxel => !included.has(voxel.key)), 
        adjustedDensityCount, 
        new Set()
      );
      
      densityResult.selectedVoxels.forEach(voxel => {
        if (selected.length < maxCount && !included.has(voxel.key)) {
          selected.push(voxel);
          included.add(voxel.key);
        }
      });
    }
    
    // 実際のカバレッジ比率を計算
    const actualCoverageRatio = adjustedCoverageCount > 0 ? 
      (selected.length - forceInclude.size - adjustedDensityCount) / (selected.length - forceInclude.size) : 0;
    
    const clippedCount = allVoxels.length - selected.length;
    return this._createResult(selected, 'hybrid', selected.length, clippedCount, actualCoverageRatio);
  }
  
  /**
   * Fallback to density selection when other strategies fail.
   * 他の戦略が失敗した場合の密度選択フォールバック。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} maxCount - Maximum count / 最大数
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _fallbackToDensitySelection(allVoxels, maxCount) {
    try {
      const topNVoxels = new Set(); // エラー時はTopN無効化
      const result = this._selectByDensityStrategy(allVoxels, maxCount, topNVoxels);
      result.strategy = 'density-fallback';
      
      this._lastSelectionStats = {
        strategy: result.strategy,
        clippedNonEmpty: result.clippedNonEmpty,
        coverageRatio: null,
        selectedCount: result.selectedVoxels.length,
        totalCount: allVoxels.length,
        error: true
      };
      
      return result;
    } catch (error) {
      Logger.error(`VoxelSelector: Even fallback failed: ${error.message}`);
      return this._createEmptyResult();
    }
  }
  
  /**
   * Create a selection result object.
   * 選択結果オブジェクトを作成。
   * 
   * @param {Array} selectedVoxels - Selected voxels / 選択されたボクセル
   * @param {string} strategy - Strategy used / 使用された戦略
   * @param {number} selectedCount - Number selected / 選択数
   * @param {number} clippedCount - Number clipped / クリップ数
   * @param {number} [coverageRatio] - Coverage ratio for hybrid / ハイブリッド用カバレッジ比率
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _createResult(selectedVoxels, strategy, selectedCount, clippedCount, coverageRatio = null) {
    return {
      selectedVoxels,
      strategy,
      clippedNonEmpty: clippedCount,
      coverageRatio
    };
  }
  
  /**
   * Create an empty selection result.
   * 空の選択結果を作成。
   * 
   * @returns {Object} Empty selection result / 空の選択結果
   * @private
   */
  _createEmptyResult() {
    return {
      selectedVoxels: [],
      strategy: 'none',
      clippedNonEmpty: 0,
      coverageRatio: null
    };
  }
}

```

## 日本語

関連: [VoxelSelectorクラス](VoxelSelector)

```javascript
/**
 * @fileoverview VoxelSelector - Voxel selection strategies implementation
 * ADR-0009 Phase2: VoxelRenderer責任分離 - ボクセル選択戦略専門クラス
 * 
 * 機能:
 * - 密度選択戦略（density）
 * - カバレッジ選択戦略（coverage - 層化抽出）
 * - ハイブリッド選択戦略（hybrid - 密度+カバレッジ）
 * - TopN強調対応
 * - 統計情報収集
 */

import { Logger } from '../../utils/logger.js';

/**
 * VoxelSelector - ボクセル選択戦略の実装
 * 
 * Single Responsibility: ボクセル選択ロジックのみを担当
 * - 戦略パターンを使用して選択アルゴリズムを切り替え可能
 * - 純粋関数として設計（Cesium依存なし）
 * - エラー時は密度ソート選抜にフォールバック
 */
export class VoxelSelector {
  
  /**
   * Create a VoxelSelector instance.
   * VoxelSelectorインスタンスを作成。
   * 
   * @param {Object} options - Selection options / 選択オプション
   * @param {string} [options.renderLimitStrategy='density'] - Selection strategy / 選択戦略
   * @param {number} [options.highlightTopN=0] - TopN highlight count / TopN強調数
   * @param {number|string} [options.coverageBinsXY='auto'] - Coverage bins / カバレッジビン数
   * @param {number} [options.minCoverageRatio=0.2] - Min coverage ratio for hybrid / ハイブリッド用最小カバレッジ比率
   */
  constructor(options = {}) {
    this.options = {
      renderLimitStrategy: 'density',
      highlightTopN: 0,
      coverageBinsXY: 'auto',
      minCoverageRatio: 0.2,
      ...options
    };
    
    this._lastSelectionStats = null;
    
    Logger.debug(`VoxelSelector initialized with strategy: ${this.options.renderLimitStrategy}`);
  }
  
  /**
   * Select voxels for rendering based on configured strategy.
   * 設定された戦略に基づいてレンダリング用ボクセルを選択。
   * 
   * @param {Array} allVoxels - All voxels to select from / 選択元の全ボクセル
   * @param {number} maxCount - Maximum number of voxels to select / 選択する最大ボクセル数
   * @param {Object} context - Selection context / 選択コンテキスト
   * @param {Object} context.grid - Grid information / グリッド情報
   * @param {Object} [context.bounds] - Data bounds / データ境界
   * @returns {Object} Selection result / 選択結果
   */
  selectVoxels(allVoxels, maxCount, context = {}) {
    try {
      // 入力バリデーション
      if (!Array.isArray(allVoxels) || allVoxels.length === 0) {
        Logger.warn('VoxelSelector: Empty or invalid voxel array provided');
        return this._createEmptyResult();
      }
      
      if (maxCount <= 0) {
        Logger.warn(`VoxelSelector: Invalid maxCount: ${maxCount}`);
        return this._createEmptyResult();
      }
      
      // 全て選択可能な場合は早期リターン
      if (allVoxels.length <= maxCount) {
        return this._createResult(allVoxels, this.options.renderLimitStrategy, allVoxels.length, 0);
      }
      
      const { grid } = context;
      const strategy = this.options.renderLimitStrategy || 'density';
      
      // TopN強調ボクセルの特定
      const topNVoxels = this._identifyTopNVoxels(allVoxels);
      
      let result;
      
      // 戦略別選択実行
      switch (strategy) {
        case 'coverage':
          result = this._selectByCoverageStrategy(allVoxels, maxCount, grid, topNVoxels);
          break;
          
        case 'hybrid':
          result = this._selectByHybridStrategy(allVoxels, maxCount, grid, topNVoxels);
          break;
          
        case 'density':
        default:
          result = this._selectByDensityStrategy(allVoxels, maxCount, topNVoxels);
          break;
      }
      
      // 統計情報の保存
      this._lastSelectionStats = {
        strategy: result.strategy,
        clippedNonEmpty: result.clippedNonEmpty,
        coverageRatio: result.coverageRatio || null,
        selectedCount: result.selectedVoxels.length,
        totalCount: allVoxels.length
      };
      
      Logger.debug(`VoxelSelector: Applied ${result.strategy} strategy - selected ${result.selectedVoxels.length}/${allVoxels.length} voxels`);
      
      return result;
      
    } catch (error) {
      Logger.error(`VoxelSelector: Selection failed: ${error.message}. Falling back to density strategy.`);
      return this._fallbackToDensitySelection(allVoxels, maxCount);
    }
  }
  
  /**
   * Get the last selection statistics.
   * 最後の選択統計を取得。
   * 
   * @returns {Object|null} Selection statistics / 選択統計
   */
  getLastSelectionStats() {
    return this._lastSelectionStats;
  }
  
  /**
   * Identify TopN voxels for forced inclusion.
   * 強制包含用のTopNボクセルを特定。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @returns {Set} Set of TopN voxel keys / TopNボクセルキーのSet
   * @private
   */
  _identifyTopNVoxels(allVoxels) {
    const topNVoxels = new Set();
    
    if (this.options.highlightTopN && this.options.highlightTopN > 0) {
      const sortedForTopN = [...allVoxels].sort((a, b) => b.info.count - a.info.count);
      const topN = sortedForTopN.slice(0, this.options.highlightTopN);
      topN.forEach(voxel => topNVoxels.add(voxel.key));
      
      Logger.debug(`VoxelSelector: Identified ${topN.length} TopN voxels for forced inclusion`);
    }
    
    return topNVoxels;
  }
  
  /**
   * Select voxels using density strategy.
   * 密度戦略でボクセルを選択。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} maxCount - Maximum count / 最大数
   * @param {Set} forceInclude - Voxels to force include / 強制包含ボクセル
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _selectByDensityStrategy(allVoxels, maxCount, forceInclude = new Set()) {
    // 密度でソートして上位を選択
    const sorted = [...allVoxels].sort((a, b) => b.info.count - a.info.count);
    
    // 強制包含ボクセルを最初に追加
    const selected = [];
    const included = new Set();
    
    // TopNなど強制包含ボクセルを先に追加
    sorted.forEach(voxel => {
      if (forceInclude.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });
    
    // 残りを密度順で追加
    sorted.forEach(voxel => {
      if (!included.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });
    
    const clippedCount = allVoxels.length - selected.length;
    return this._createResult(selected, 'density', selected.length, clippedCount);
  }
  
  /**
   * Select voxels using coverage strategy (stratified sampling).
   * カバレッジ戦略でボクセルを選択（層化抽出）。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} maxCount - Maximum count / 最大数
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Set} forceInclude - Voxels to force include / 強制包含ボクセル
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _selectByCoverageStrategy(allVoxels, maxCount, grid, forceInclude = new Set()) {
    const selected = [];
    const included = new Set();
    
    // 強制包含ボクセルを先に追加
    allVoxels.forEach(voxel => {
      if (forceInclude.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });
    
    // 格子分割数の決定
    const binsXY = this.options.coverageBinsXY === 'auto' 
      ? Math.ceil(Math.sqrt(maxCount / 4)) // 自動計算: 平均4ボクセル/ビン
      : this.options.coverageBinsXY;
    
    // 空間をグリッド分割
    const bins = new Map();
    const remainingVoxels = allVoxels.filter(voxel => !included.has(voxel.key));
    
    remainingVoxels.forEach(voxel => {
      const binX = Math.max(0, Math.min(binsXY - 1, Math.floor((voxel.info.x / Math.max(1, grid.numVoxelsX)) * binsXY)));
      const binY = Math.max(0, Math.min(binsXY - 1, Math.floor((voxel.info.y / Math.max(1, grid.numVoxelsY)) * binsXY)));
      const binKey = `${binX},${binY}`;
      
      if (!bins.has(binKey)) {
        bins.set(binKey, []);
      }
      bins.get(binKey).push(voxel);
    });
    
    // 各ビンから代表ボクセルを選択
    const binKeys = Array.from(bins.keys());
    let binIndex = 0;
    
    while (selected.length < maxCount && binIndex < binKeys.length * 10) { // 最大10周
      const binKey = binKeys[binIndex % binKeys.length];
      const binVoxels = bins.get(binKey);
      
      if (binVoxels && binVoxels.length > 0) {
        // ビン内で最高密度のボクセルを選択
        binVoxels.sort((a, b) => b.info.count - a.info.count);
        const voxel = binVoxels.shift();
        
        if (!included.has(voxel.key)) {
          selected.push(voxel);
          included.add(voxel.key);
        }
        
        // 空になったビンを削除
        if (binVoxels.length === 0) {
          bins.delete(binKey);
          binKeys.splice(binKeys.indexOf(binKey), 1);
        }
      }
      
      binIndex++;
    }
    
    const clippedCount = allVoxels.length - selected.length;
    return this._createResult(selected, 'coverage', selected.length, clippedCount);
  }
  
  /**
   * Select voxels using hybrid strategy (density + coverage).
   * ハイブリッド戦略でボクセルを選択（密度 + カバレッジ）。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} maxCount - Maximum count / 最大数
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Set} forceInclude - Voxels to force include / 強制包含ボクセル
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _selectByHybridStrategy(allVoxels, maxCount, grid, forceInclude = new Set()) {
    const minCoverageRatio = this.options.minCoverageRatio || 0.2;
    
    const selected = [];
    const included = new Set();
    
    // 強制包含ボクセルを先に追加
    allVoxels.forEach(voxel => {
      if (forceInclude.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });
    
    const remainingCount = maxCount - selected.length;
    const adjustedCoverageCount = Math.floor(remainingCount * minCoverageRatio);
    const adjustedDensityCount = remainingCount - adjustedCoverageCount;
    
    // カバレッジ選択（層化抽出）
    if (adjustedCoverageCount > 0) {
      const coverageResult = this._selectByCoverageStrategy(
        allVoxels.filter(voxel => !included.has(voxel.key)), 
        adjustedCoverageCount, 
        grid, 
        new Set()
      );
      
      coverageResult.selectedVoxels.forEach(voxel => {
        if (selected.length < maxCount && !included.has(voxel.key)) {
          selected.push(voxel);
          included.add(voxel.key);
        }
      });
    }
    
    // 密度選択（残り）
    if (adjustedDensityCount > 0) {
      const densityResult = this._selectByDensityStrategy(
        allVoxels.filter(voxel => !included.has(voxel.key)), 
        adjustedDensityCount, 
        new Set()
      );
      
      densityResult.selectedVoxels.forEach(voxel => {
        if (selected.length < maxCount && !included.has(voxel.key)) {
          selected.push(voxel);
          included.add(voxel.key);
        }
      });
    }
    
    // 実際のカバレッジ比率を計算
    const actualCoverageRatio = adjustedCoverageCount > 0 ? 
      (selected.length - forceInclude.size - adjustedDensityCount) / (selected.length - forceInclude.size) : 0;
    
    const clippedCount = allVoxels.length - selected.length;
    return this._createResult(selected, 'hybrid', selected.length, clippedCount, actualCoverageRatio);
  }
  
  /**
   * Fallback to density selection when other strategies fail.
   * 他の戦略が失敗した場合の密度選択フォールバック。
   * 
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} maxCount - Maximum count / 最大数
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _fallbackToDensitySelection(allVoxels, maxCount) {
    try {
      const topNVoxels = new Set(); // エラー時はTopN無効化
      const result = this._selectByDensityStrategy(allVoxels, maxCount, topNVoxels);
      result.strategy = 'density-fallback';
      
      this._lastSelectionStats = {
        strategy: result.strategy,
        clippedNonEmpty: result.clippedNonEmpty,
        coverageRatio: null,
        selectedCount: result.selectedVoxels.length,
        totalCount: allVoxels.length,
        error: true
      };
      
      return result;
    } catch (error) {
      Logger.error(`VoxelSelector: Even fallback failed: ${error.message}`);
      return this._createEmptyResult();
    }
  }
  
  /**
   * Create a selection result object.
   * 選択結果オブジェクトを作成。
   * 
   * @param {Array} selectedVoxels - Selected voxels / 選択されたボクセル
   * @param {string} strategy - Strategy used / 使用された戦略
   * @param {number} selectedCount - Number selected / 選択数
   * @param {number} clippedCount - Number clipped / クリップ数
   * @param {number} [coverageRatio] - Coverage ratio for hybrid / ハイブリッド用カバレッジ比率
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _createResult(selectedVoxels, strategy, selectedCount, clippedCount, coverageRatio = null) {
    return {
      selectedVoxels,
      strategy,
      clippedNonEmpty: clippedCount,
      coverageRatio
    };
  }
  
  /**
   * Create an empty selection result.
   * 空の選択結果を作成。
   * 
   * @returns {Object} Empty selection result / 空の選択結果
   * @private
   */
  _createEmptyResult() {
    return {
      selectedVoxels: [],
      strategy: 'none',
      clippedNonEmpty: 0,
      coverageRatio: null
    };
  }
}

```
