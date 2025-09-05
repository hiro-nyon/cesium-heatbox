/**
 * @fileoverview InfoBox用のボクセル説明文生成モジュール
 * 
 * ADR-0008 Phase 3: VoxelRendererからDescriptionBuilder機能を分離
 * 
 * @author cesium-heatbox
 * @version 0.1.10
 * @since 0.1.10
 */

/**
 * InfoBox用のボクセル説明文生成クラス
 * 
 * VoxelRendererから説明文生成機能を分離し、単一責任の原則に従って
 * InfoBox表示用のHTML生成を専門に行います。
 * 
 * @class DescriptionBuilder
 * @since 0.1.10
 */
export class DescriptionBuilder {
  /**
   * DescriptionBuilderのコンストラクタ
   * 
   * @param {Object} [options={}] - 設定オプション
   * @param {string} [options.fontFamily='Arial, sans-serif'] - フォントファミリー
   * @param {string} [options.containerPadding='10px'] - コンテナパディング
   * @param {string} [options.headerMargin='0'] - ヘッダーマージン
   * @param {string} [options.tableWidth='100%'] - テーブル幅
   */
  constructor(options = {}) {
    this.options = {
      fontFamily: options.fontFamily || 'Arial, sans-serif',
      containerPadding: options.containerPadding || '10px',
      headerMargin: options.headerMargin || '0',
      tableWidth: options.tableWidth || '100%',
      ...options
    };
  }

  /**
   * ボクセル用の説明文HTMLを生成
   * 
   * @param {Object} voxelInfo - ボクセル情報
   * @param {number} voxelInfo.x - X軸インデックス
   * @param {number} voxelInfo.y - Y軸インデックス
   * @param {number} voxelInfo.z - Z軸インデックス
   * @param {number} voxelInfo.count - エンティティ数
   * @param {string} voxelKey - ボクセルキー
   * @returns {string} HTML形式の説明文
   */
  createVoxelDescription(voxelInfo, voxelKey) {
    return `
      <div style="padding: ${this.options.containerPadding}; font-family: ${this.options.fontFamily};">
        <h3 style="margin-top: ${this.options.headerMargin};">ボクセル [${voxelInfo.x}, ${voxelInfo.y}, ${voxelInfo.z}]</h3>
        <table style="width: ${this.options.tableWidth};">
          <tr><td><b>エンティティ数:</b></td><td>${voxelInfo.count}</td></tr>
          <tr><td><b>ID:</b></td><td>${voxelKey}</td></tr>
        </table>
      </div>
    `;
  }

  /**
   * 統計情報を含む拡張説明文を生成
   * 
   * @param {Object} voxelInfo - ボクセル情報
   * @param {string} voxelKey - ボクセルキー
   * @param {Object} [statistics] - 統計情報（オプション）
   * @param {number} [statistics.percentile] - パーセンタイル
   * @param {number} [statistics.rank] - ランク
   * @param {number} [statistics.total] - 総数
   * @returns {string} HTML形式の拡張説明文
   */
  createExtendedVoxelDescription(voxelInfo, voxelKey, statistics = null) {
    let baseDescription = this.createVoxelDescription(voxelInfo, voxelKey);
    
    if (statistics) {
      const statsSection = `
        <hr style="margin: 10px 0;">
        <h4 style="margin: 5px 0;">統計情報</h4>
        <table style="width: ${this.options.tableWidth};">
          ${statistics.percentile !== undefined ? `<tr><td><b>パーセンタイル:</b></td><td>${statistics.percentile.toFixed(1)}%</td></tr>` : ''}
          ${statistics.rank !== undefined && statistics.total !== undefined ? `<tr><td><b>ランク:</b></td><td>${statistics.rank}/${statistics.total}</td></tr>` : ''}
        </table>
      `;
      
      // </div>を取り除いて統計情報を追加し、最後に</div>を付ける
      baseDescription = baseDescription.replace('</div>', statsSection + '</div>');
    }
    
    return baseDescription;
  }

  /**
   * カスタムフィールドを追加できる柔軟な説明文生成
   * 
   * @param {Object} voxelInfo - ボクセル情報
   * @param {string} voxelKey - ボクセルキー
   * @param {Array<Object>} [customFields=[]] - カスタムフィールド配列
   * @param {string} customFields[].label - フィールドラベル
   * @param {string|number} customFields[].value - フィールド値
   * @returns {string} HTML形式のカスタム説明文
   */
  createCustomVoxelDescription(voxelInfo, voxelKey, customFields = []) {
    const customRows = customFields.map(field => 
      `<tr><td><b>${field.label}:</b></td><td>${field.value}</td></tr>`
    ).join('');

    return `
      <div style="padding: ${this.options.containerPadding}; font-family: ${this.options.fontFamily};">
        <h3 style="margin-top: ${this.options.headerMargin};">ボクセル [${voxelInfo.x}, ${voxelInfo.y}, ${voxelInfo.z}]</h3>
        <table style="width: ${this.options.tableWidth};">
          <tr><td><b>エンティティ数:</b></td><td>${voxelInfo.count}</td></tr>
          <tr><td><b>ID:</b></td><td>${voxelKey}</td></tr>
          ${customRows}
        </table>
      </div>
    `;
  }
}
