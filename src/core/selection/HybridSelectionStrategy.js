/**
 * Hybrid selection strategy combining density and coverage approaches.
 * 密度選択とカバレッジ選択を組み合わせたハイブリッド戦略
 */
import { SelectionStrategyInterface } from './SelectionStrategyInterface.js';
import { DensitySelectionStrategy } from './DensitySelectionStrategy.js';
import { CoverageSelectionStrategy } from './CoverageSelectionStrategy.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implements hybrid voxel selection combining density and coverage strategies.
 * 密度選択とカバレッジ選択を組み合わせたハイブリッド選択を実装します。
 * 重要な高密度領域を確保しつつ、空間的な代表性も維持します。
 */
export class HybridSelectionStrategy extends SelectionStrategyInterface {
  constructor() {
    super();
    this.densityStrategy = new DensitySelectionStrategy();
    this.coverageStrategy = new CoverageSelectionStrategy();
  }
  
  /**
   * Select voxels using hybrid approach (density + coverage).
   * ハイブリッドアプローチ（密度 + カバレッジ）による選択を行います。
   * 
   * @param {Array} allVoxels - All available voxels / 全ボクセル
   * @param {number} maxCount - Maximum voxels to select / 選択する最大ボクセル数
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Set} forceInclude - Voxels to force include / 強制包含ボクセル
   * @param {Object} options - Selection options / 選択オプション
   * @returns {Object} Selection result / 選択結果
   */
  select(allVoxels, maxCount, grid, forceInclude = new Set(), options = {}) {
    Logger.debug(`Hybrid selection: ${allVoxels.length} candidates, max ${maxCount}`);
    
    const selected = [];
    const included = new Set();
    
    // 強制包含ボクセルを先に追加
    this._addForceIncludedVoxels(allVoxels, selected, included, forceInclude, maxCount);
    
    if (selected.length >= maxCount) {
      return this._createResult(selected, options, 0, 0);
    }
    
    // カバレッジ比率の決定
    const coverageRatio = this._determineCoverageRatio(options);
    const remainingCount = maxCount - selected.length;
    
    // カバレッジとDensityの分配を計算
    const coverageCount = Math.floor(remainingCount * coverageRatio);
    const densityCount = remainingCount - coverageCount;
    
    Logger.debug(`Hybrid split: ${coverageCount} coverage, ${densityCount} density`);
    
    // カバレッジ選択の実行
    let actualCoverageCount = 0;
    if (coverageCount > 0) {
      actualCoverageCount = this._executeCoverageSelection(
        allVoxels, coverageCount, grid, included, selected, maxCount, options
      );
    }
    
    // 密度選択の実行（残り）
    let actualDensityCount = 0;
    if (densityCount > 0 && selected.length < maxCount) {
      actualDensityCount = this._executeDensitySelection(
        allVoxels, densityCount, grid, included, selected, maxCount, options
      );
    }
    
    Logger.debug(`Hybrid selection completed: ${selected.length} total (${actualCoverageCount} coverage, ${actualDensityCount} density)`);
    
    return this._createResult(selected, options, actualCoverageCount, actualDensityCount);
  }
  
  /**
   * Add force-included voxels to selection.
   * 強制包含ボクセルを選択に追加します。
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {Array} selected - Selected voxels array / 選択済みボクセル配列
   * @param {Set} included - Set of included voxel keys / 包含済みボクセルキーセット
   * @param {Set} forceInclude - Force include set / 強制包含セット
   * @param {number} maxCount - Maximum count / 最大数
   * @private
   */
  _addForceIncludedVoxels(allVoxels, selected, included, forceInclude, maxCount) {
    for (const voxel of allVoxels) {
      if (forceInclude.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    }
  }
  
  /**
   * Determine the coverage ratio for hybrid selection.
   * ハイブリッド選択のカバレッジ比率を決定します。
   * @param {Object} options - Selection options / 選択オプション
   * @returns {number} Coverage ratio (0.0-1.0) / カバレッジ比率
   * @private
   */
  _determineCoverageRatio(options) {
    const defaultRatio = 0.3; // デフォルト30%をカバレッジに割り当て
    
    if (options.minCoverageRatio !== undefined) {
      return Math.max(0.0, Math.min(1.0, options.minCoverageRatio));
    }
    
    if (options.coverageRatio !== undefined) {
      return Math.max(0.0, Math.min(1.0, options.coverageRatio));
    }
    
    return defaultRatio;
  }
  
  /**
   * Execute coverage selection phase.
   * カバレッジ選択フェーズを実行します。
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} coverageCount - Target coverage count / 目標カバレッジ数
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Set} included - Already included voxels / 既に含まれているボクセル
   * @param {Array} selected - Selected voxels array / 選択済みボクセル配列
   * @param {number} maxCount - Maximum total count / 最大総数
   * @param {Object} options - Selection options / 選択オプション
   * @returns {number} Actual coverage count added / 実際に追加されたカバレッジ数
   * @private
   */
  _executeCoverageSelection(allVoxels, coverageCount, grid, included, selected, maxCount, options) {
    const availableVoxels = allVoxels.filter(voxel => !included.has(voxel.key));
    
    if (availableVoxels.length === 0 || coverageCount <= 0) {
      return 0;
    }
    
    const coverageOptions = {
      ...options,
      // カバレッジ特有のオプションを設定
      binSelectionMode: options.hybridCoverageMode || 'highest'
    };
    
    const coverageResult = this.coverageStrategy.select(
      availableVoxels,
      coverageCount,
      grid,
      new Set(), // カバレッジ選択では新しい強制包含セットを使用
      coverageOptions
    );
    
    let addedCount = 0;
    for (const voxel of coverageResult.selected) {
      if (selected.length < maxCount && !included.has(voxel.key)) {
        selected.push(voxel);
        included.add(voxel.key);
        addedCount++;
      }
    }
    
    return addedCount;
  }
  
  /**
   * Execute density selection phase.
   * 密度選択フェーズを実行します。
   * @param {Array} allVoxels - All voxels / 全ボクセル
   * @param {number} densityCount - Target density count / 目標密度数
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Set} included - Already included voxels / 既に含まれているボクセル
   * @param {Array} selected - Selected voxels array / 選択済みボクセル配列
   * @param {number} maxCount - Maximum total count / 最大総数
   * @param {Object} options - Selection options / 選択オプション
   * @returns {number} Actual density count added / 実際に追加された密度数
   * @private
   */
  _executeDensitySelection(allVoxels, densityCount, grid, included, selected, maxCount, options) {
    const availableVoxels = allVoxels.filter(voxel => !included.has(voxel.key));
    
    if (availableVoxels.length === 0 || densityCount <= 0) {
      return 0;
    }
    
    const densityOptions = {
      ...options,
      // 密度特有のオプションを設定
      selectionMode: options.hybridDensityMode || 'highest'
    };
    
    const densityResult = this.densityStrategy.select(
      availableVoxels,
      densityCount,
      grid,
      new Set(), // 密度選択では新しい強制包含セットを使用
      densityOptions
    );
    
    let addedCount = 0;
    for (const voxel of densityResult.selected) {
      if (selected.length < maxCount && !included.has(voxel.key)) {
        selected.push(voxel);
        included.add(voxel.key);
        addedCount++;
      }
    }
    
    return addedCount;
  }
  
  /**
   * Create selection result with hybrid metadata.
   * ハイブリッドメタデータ付きの選択結果を作成します。
   * @param {Array} selected - Selected voxels / 選択されたボクセル
   * @param {Object} options - Selection options / 選択オプション
   * @param {number} coverageCount - Actual coverage count / 実際のカバレッジ数
   * @param {number} densityCount - Actual density count / 実際の密度数
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _createResult(selected, options, coverageCount, densityCount) {
    const totalSelectionCount = selected.length;
    const actualCoverageRatio = totalSelectionCount > 0 ? 
      coverageCount / totalSelectionCount : 0;
    
    const metadata = {
      strategy: 'hybrid',
      totalSelected: totalSelectionCount,
      coverageSelected: coverageCount,
      densitySelected: densityCount,
      coverageRatio: actualCoverageRatio,
      targetCoverageRatio: this._determineCoverageRatio(options),
      selectionRatio: totalSelectionCount > 0 ? 1.0 : 0.0
    };
    
    return { selected, metadata };
  }
}
