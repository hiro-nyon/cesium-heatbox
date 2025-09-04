/**
 * Interface for voxel selection strategies.
 * ボクセル選択戦略のインターフェース。
 * 
 * All selection strategies must implement the select method.
 * すべての選択戦略はselectメソッドを実装する必要があります。
 */

/**
 * Abstract base class for voxel selection strategies.
 * ボクセル選択戦略の抽象基底クラス。
 */
export class SelectionStrategyInterface {
  /**
   * Select voxels according to strategy.
   * 戦略に従ってボクセルを選択します。
   * 
   * @param {Array} allVoxels - All available voxels / 利用可能な全ボクセル
   * @param {number} maxCount - Maximum selection count / 最大選択数
   * @param {Object} grid - Grid information / グリッド情報
   * @param {Set} _forceInclude - Voxels to force include (e.g., TopN) / 強制包含ボクセル（例：TopN）
   * @param {Object} _options - Strategy-specific options / 戦略固有のオプション
   * @returns {Object} Selection result with metadata / メタデータ付きの選択結果
   * @returns {Array} returns.selected - Selected voxels / 選択されたボクセル
   * @returns {Object} returns.metadata - Strategy metadata / 戦略メタデータ
   * @abstract
   */
  select(allVoxels, maxCount, grid, _forceInclude = new Set(), _options = {}) {
    throw new Error('SelectionStrategyInterface.select() must be implemented by subclass');
  }

  /**
   * Get strategy name.
   * 戦略名を取得します。
   * 
   * @returns {string} Strategy name / 戦略名
   * @abstract
   */
  getStrategyName() {
    throw new Error('SelectionStrategyInterface.getStrategyName() must be implemented by subclass');
  }

  /**
   * Validate strategy-specific options.
   * 戦略固有のオプションを検証します。
   * 
   * @param {Object} _options - Options to validate / 検証するオプション
   * @returns {boolean} Whether options are valid / オプションが有効かどうか
   */
  validateOptions(_options) {
    // Default implementation accepts any options
    // デフォルト実装は任意のオプションを受け入れる
    return true;
  }
}
