/**
 * Density-based voxel selection strategy.
 * 密度ベースのボクセル選択戦略。
 * 
 * This strategy selects voxels with the highest density values first.
 * この戦略は密度値の高いボクセルを優先して選択します。
 */

import { SelectionStrategyInterface } from './SelectionStrategyInterface.js';

/**
 * Density selection strategy implementation.
 * 密度選択戦略の実装。
 */
export class DensitySelectionStrategy extends SelectionStrategyInterface {
  /**
   * Select voxels by density (highest density first).
   * 密度による選択（密度の高い順）。
   * 
   * @param {Array} allVoxels - All available voxels / 利用可能な全ボクセル
   * @param {number} maxCount - Maximum selection count / 最大選択数
   * @param {Object} grid - Grid information (not used in density strategy) / グリッド情報（密度戦略では未使用）
   * @param {Set} forceInclude - Voxels to force include (e.g., TopN) / 強制包含ボクセル（例：TopN）
   * @param {Object} _options - Strategy options (not used in density strategy) / 戦略オプション（密度戦略では未使用）
   * @returns {Object} Selection result / 選択結果
   * @returns {Array} returns.selected - Selected voxels sorted by density / 密度順でソートされた選択ボクセル
   * @returns {Object} returns.metadata - Selection metadata / 選択メタデータ
   */
  select(allVoxels, maxCount, grid, forceInclude = new Set(), _options = {}) {
    // Validate inputs / 入力検証
    if (!Array.isArray(allVoxels)) {
      throw new Error('allVoxels must be an array');
    }
    if (typeof maxCount !== 'number' || maxCount < 0) {
      throw new Error('maxCount must be a non-negative number');
    }
    if (!(forceInclude instanceof Set)) {
      throw new Error('forceInclude must be a Set');
    }

    // Sort voxels by density (highest first)
    // 密度でソートして上位を選択
    const sorted = [...allVoxels].sort((a, b) => b.info.count - a.info.count);
    
    // Initialize selection arrays
    // 選択配列を初期化
    const selected = [];
    const included = new Set();
    
    // Add force-included voxels first (e.g., TopN highlights)
    // 強制包含ボクセルを先に追加（例：TopN強調表示）
    sorted.forEach(voxel => {
      if (forceInclude.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });
    
    // Add remaining voxels in density order
    // 残りを密度順で追加
    sorted.forEach(voxel => {
      if (!included.has(voxel.key) && selected.length < maxCount) {
        selected.push(voxel);
        included.add(voxel.key);
      }
    });

    // Calculate statistics
    // 統計を計算
    const totalVoxels = allVoxels.length;
    const selectedCount = selected.length;
    const clippedCount = totalVoxels - selectedCount;
    
    const metadata = {
      strategy: this.getStrategyName(),
      totalVoxels,
      selectedCount,
      clippedCount,
      forceIncludedCount: Math.min(forceInclude.size, selectedCount),
      densityRange: selected.length > 0 ? {
        max: selected[0]?.info?.count || 0,
        min: selected[selected.length - 1]?.info?.count || 0
      } : { max: 0, min: 0 }
    };

    return {
      selected,
      metadata
    };
  }

  /**
   * Get strategy name.
   * 戦略名を取得します。
   * 
   * @returns {string} Strategy name / 戦略名
   */
  getStrategyName() {
    return 'density';
  }

  /**
   * Validate density strategy options.
   * 密度戦略オプションを検証します。
   * 
   * @param {Object} _options - Options to validate / 検証するオプション
   * @returns {boolean} Whether options are valid / オプションが有効かどうか
   */
  validateOptions(_options) {
    // Density strategy doesn't require specific options
    // 密度戦略は特定のオプションを必要としません
    return true;
  }
}
