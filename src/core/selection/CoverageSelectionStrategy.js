/**
 * Coverage-based selection strategy for voxels.
 * カバレッジベース選択戦略（層化抽出による空間的代表性確保）
 */
import { SelectionStrategyInterface } from './SelectionStrategyInterface.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implements coverage-based voxel selection using stratified sampling.
 * 層化抽出による空間的代表性を重視したボクセル選択を実装します。
 * 空間を格子状に分割し、各セクションから代表的なボクセルを選択することで、
 * 偏りの少ない可視化を実現します。
 */
export class CoverageSelectionStrategy extends SelectionStrategyInterface {
  /**
   * Select voxels based on spatial coverage using stratified sampling.
   * 層化抽出による空間カバレッジを重視した選択を行います。
   * 
   * @param {Array} allVoxels - All available voxels / 全ボクセル
   * @param {number} maxCount - Maximum voxels to select / 選択する最大ボクセル数
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Set} forceInclude - Voxels to force include / 強制包含ボクセル
   * @param {Object} options - Selection options / 選択オプション
   * @returns {Object} Selection result / 選択結果
   */
  select(allVoxels, maxCount, grid, forceInclude = new Set(), options = {}) {
    Logger.debug(`Coverage selection: ${allVoxels.length} candidates, max ${maxCount}`);
    
    const selected = [];
    const included = new Set();
    
    // 強制包含ボクセルを先に追加
    this._addForceIncludedVoxels(allVoxels, selected, included, forceInclude, maxCount);
    
    if (selected.length >= maxCount) {
      return this._createResult(selected, options);
    }
    
    // グリッド分割による層化抽出の実行
    const remainingVoxels = allVoxels.filter(voxel => !included.has(voxel.key));
    const binsXY = this._calculateOptimalBinCount(maxCount - selected.length, options);
    const bins = this._createSpatialBins(remainingVoxels, grid, binsXY);
    
    // 各ビンから代表ボクセルを選択
    this._selectFromBins(bins, selected, included, maxCount, options);
    
    Logger.debug(`Coverage selection completed: ${selected.length} voxels selected`);
    return this._createResult(selected, options, { binsXY, totalBins: bins.size });
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
   * Calculate optimal number of bins for spatial division.
   * 空間分割の最適ビン数を計算します。
   * @param {number} targetCount - Target selection count / 目標選択数
   * @param {Object} options - Selection options / 選択オプション
   * @returns {number} Optimal bin count / 最適ビン数
   * @private
   */
  _calculateOptimalBinCount(targetCount, options) {
    if (options.coverageBinsXY && options.coverageBinsXY !== 'auto') {
      return Math.max(1, parseInt(options.coverageBinsXY));
    }
    
    // 自動計算: 平均4ボクセル/ビンを目標とする
    const targetVoxelsPerBin = 4;
    const calculatedBins = Math.ceil(Math.sqrt(targetCount / targetVoxelsPerBin));
    
    // 最小2、最大20の範囲で制限
    return Math.max(2, Math.min(20, calculatedBins));
  }
  
  /**
   * Create spatial bins for stratified sampling.
   * 層化抽出のための空間ビンを作成します。
   * @param {Array} voxels - Voxels to bin / ビン分けするボクセル
   * @param {Object} grid - Grid information / グリッド情報
   * @param {number} binsXY - Number of bins per axis / 軸あたりのビン数
   * @returns {Map} Spatial bins / 空間ビン
   * @private
   */
  _createSpatialBins(voxels, grid, binsXY) {
    const bins = new Map();
    const maxX = Math.max(1, grid.numVoxelsX);
    const maxY = Math.max(1, grid.numVoxelsY);
    
    for (const voxel of voxels) {
      const binX = Math.max(0, Math.min(binsXY - 1, 
        Math.floor((voxel.info.x / maxX) * binsXY)));
      const binY = Math.max(0, Math.min(binsXY - 1, 
        Math.floor((voxel.info.y / maxY) * binsXY)));
      const binKey = `${binX},${binY}`;
      
      if (!bins.has(binKey)) {
        bins.set(binKey, []);
      }
      bins.get(binKey).push(voxel);
    }
    
    return bins;
  }
  
  /**
   * Select representative voxels from each bin.
   * 各ビンから代表ボクセルを選択します。
   * @param {Map} bins - Spatial bins / 空間ビン
   * @param {Array} selected - Selected voxels array / 選択済みボクセル配列
   * @param {Set} included - Included voxel keys / 包含済みボクセルキー
   * @param {number} maxCount - Maximum count / 最大数
   * @param {Object} options - Selection options / 選択オプション
   * @private
   */
  _selectFromBins(bins, selected, included, maxCount, options) {
    const binKeys = Array.from(bins.keys());
    let binIndex = 0;
    const maxIterations = binKeys.length * 10; // 無限ループ防止
    
    while (selected.length < maxCount && binIndex < maxIterations && bins.size > 0) {
      const binKey = binKeys[binIndex % binKeys.length];
      const binVoxels = bins.get(binKey);
      
      if (binVoxels && binVoxels.length > 0) {
        // ビン内で最高密度のボクセルを選択
        const voxel = this._selectBestVoxelFromBin(binVoxels, options);
        
        if (voxel && !included.has(voxel.key)) {
          selected.push(voxel);
          included.add(voxel.key);
        }
        
        // 選択されたボクセルをビンから除去
        const voxelIndex = binVoxels.indexOf(voxel);
        if (voxelIndex >= 0) {
          binVoxels.splice(voxelIndex, 1);
        }
        
        // 空になったビンを削除
        if (binVoxels.length === 0) {
          bins.delete(binKey);
          const keyIndex = binKeys.indexOf(binKey);
          if (keyIndex >= 0) {
            binKeys.splice(keyIndex, 1);
          }
        }
      }
      
      binIndex++;
    }
  }
  
  /**
   * Select the best voxel from a bin based on selection criteria.
   * 選択基準に基づいてビン内の最適なボクセルを選択します。
   * @param {Array} binVoxels - Voxels in the bin / ビン内のボクセル
   * @param {Object} options - Selection options / 選択オプション
   * @returns {Object} Best voxel / 最適なボクセル
   * @private
   */
  _selectBestVoxelFromBin(binVoxels, options) {
    if (binVoxels.length === 0) return null;
    if (binVoxels.length === 1) return binVoxels[0];
    
    // 密度（カウント）順でソート
    const sortedVoxels = [...binVoxels].sort((a, b) => b.info.count - a.info.count);
    
    // 選択モード: 'highest'（最高密度）、'median'（中央値）、'random'（ランダム）
    const selectionMode = options.binSelectionMode || 'highest';
    
    switch (selectionMode) {
      case 'median':
        return sortedVoxels[Math.floor(sortedVoxels.length / 2)];
      case 'random':
        return sortedVoxels[Math.floor(Math.random() * sortedVoxels.length)];
      case 'highest':
      default:
        return sortedVoxels[0];
    }
  }
  
  /**
   * Create selection result with metadata.
   * メタデータ付きの選択結果を作成します。
   * @param {Array} selected - Selected voxels / 選択されたボクセル
   * @param {Object} options - Selection options / 選択オプション
   * @param {Object} additionalMetadata - Additional metadata / 追加メタデータ
   * @returns {Object} Selection result / 選択結果
   * @private
   */
  _createResult(selected, options, additionalMetadata = {}) {
    const metadata = {
      strategy: 'coverage',
      totalSelected: selected.length,
      selectionRatio: selected.length > 0 ? 1.0 : 0.0,
      ...additionalMetadata
    };
    
    return { selected, metadata };
  }
}
