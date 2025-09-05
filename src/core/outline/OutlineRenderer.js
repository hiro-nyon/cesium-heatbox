/**
 * Renderer for various outline modes.
 * 様々な枠線モードのレンダラー。
 * 
 * Handles standard, inset, and emulation-only outline rendering modes.
 * 標準、インセット、エミュレーションのみの枠線描画モードを処理します。
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';
import { VoxelEntityFactory } from '../voxel/VoxelEntityFactory.js';

/**
 * OutlineRenderer class for handling different outline rendering modes.
 * 異なる枠線描画モードを処理するOutlineRendererクラス。
 */
export class OutlineRenderer {
  /**
   * Constructor
   * @param {Cesium.Viewer} viewer - Cesium viewer / Cesiumビューワー
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.entityFactory = new VoxelEntityFactory();
  }

  /**
   * Render outline for a voxel based on the specified mode.
   * 指定されたモードに基づいてボクセルの枠線を描画します。
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {Object} outlineOptions - Outline options / 枠線オプション
   * @param {Object} adaptiveParams - Adaptive parameters / 適応的パラメータ
   * @returns {Array} Created outline entities / 作成された枠線エンティティ
   */
  renderOutline(voxelInfo, outlineOptions, adaptiveParams = {}) {
    const { outlineRenderMode } = outlineOptions;
    
    Logger.debug('Rendering outline for voxel:', {
      voxel: voxelInfo,
      mode: outlineRenderMode,
      adaptive: adaptiveParams
    });

    switch (outlineRenderMode) {
      case 'standard': {
        const entities = [];
        // Standard outline is already handled on the box entity (VoxelRenderer)
        // If inset is requested, add inset outline as an additional entity
        if ((outlineOptions.outlineInset || 0) > 0 && this._shouldApplyInsetOutline(voxelInfo, outlineOptions)) {
          entities.push(...this._renderInsetOutline(voxelInfo, outlineOptions, adaptiveParams));
        }
        return entities;
      }
      
      case 'inset':
        return this._renderInsetOutline(voxelInfo, outlineOptions, adaptiveParams);
      
      case 'emulation-only':
        return this._renderEmulationOutline(voxelInfo, outlineOptions, adaptiveParams);
      
      default:
        Logger.warn('Unknown outline render mode:', outlineRenderMode);
        return this._renderStandardOutline(voxelInfo, outlineOptions, adaptiveParams);
    }
  }

  /**
   * Determine if inset outline should be applied based on mode and TopN.
   * インセット枠線を適用すべきか判定します。
   * @param {Object} voxelInfo - Voxel information (may include isTopN) / ボクセル情報
   * @param {Object} outlineOptions - Outline options / 枠線オプション
   * @returns {boolean}
   * @private
   */
  _shouldApplyInsetOutline(voxelInfo, outlineOptions) {
    const mode = outlineOptions.outlineInsetMode || 'all';
    if (mode === 'topn') return !!voxelInfo.isTopN;
    return true;
  }

  /**
   * Render standard outline mode.
   * 標準枠線モードを描画します。
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {Object} outlineOptions - Outline options / 枠線オプション
   * @param {Object} adaptiveParams - Adaptive parameters / 適応的パラメータ
   * @returns {Array} Created outline entities / 作成された枠線エンティティ
   * @private
   */
  _renderStandardOutline(voxelInfo, outlineOptions, adaptiveParams) {
    const outlineWidth = adaptiveParams.outlineWidth || outlineOptions.outlineWidth;
    const outlineOpacity = adaptiveParams.outlineOpacity || 1.0;
    // Use fromBytes to avoid dependency on fromCssColorString in tests
    const outlineColor = Cesium.Color.fromBytes(255, 255, 255, Math.round(255 * outlineOpacity));
    
    // Create polyline entities for box edges / ボックスエッジのポリラインエンティティを作成
    const centerCart = voxelInfo.position;
    const sizeX = voxelInfo.width;
    const sizeY = voxelInfo.depth;
    const sizeZ = voxelInfo.height;
    const polylineEntities = VoxelEntityFactory.createBoxEdgePolylines(
      centerCart,
      sizeX,
      sizeY,
      sizeZ,
      outlineColor,
      outlineWidth
    );

    return polylineEntities;
  }

  /**
   * Render inset outline mode.
   * インセット枠線モードを描画します。
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {Object} outlineOptions - Outline options / 枠線オプション
   * @param {Object} adaptiveParams - Adaptive parameters / 適応的パラメータ
   * @returns {Array} Created outline entities / 作成された枠線エンティティ
   * @private
   */
  _renderInsetOutline(voxelInfo, outlineOptions, adaptiveParams) {
    const { outlineInset, outlineInsetMode } = outlineOptions;
    
    if (outlineInset <= 0) {
      // No inset, fall back to standard mode / インセットなし、標準モードにフォールバック
      return this._renderStandardOutline(voxelInfo, outlineOptions, adaptiveParams);
    }

    // Use emulation for high overlap risk areas / 高重複リスクエリアではエミュレーション使用
    if (adaptiveParams.shouldUseEmulation) {
      return this._renderEmulationOutline(voxelInfo, outlineOptions, adaptiveParams);
    }

    // Create inset voxel with reduced dimensions / 縮小された寸法でインセットボクセルを作成
    const insetVoxelInfo = this._createInsetVoxelInfo(voxelInfo, outlineInset, outlineInsetMode);
    
    const outlineWidth = adaptiveParams.outlineWidth || outlineOptions.outlineWidth;
    const outlineOpacity = adaptiveParams.outlineOpacity || 1.0;
    const centerCart = voxelInfo.position;
    // Enforce 20% max inset per axis (ADR-0004)
    const maxInsetX = voxelInfo.width * 0.2;
    const maxInsetY = voxelInfo.depth * 0.2;
    const maxInsetZ = voxelInfo.height * 0.2;
    const effInsetX = Math.min(outlineInset, maxInsetX);
    const effInsetY = Math.min(outlineInset, maxInsetY);
    const effInsetZ = Math.min(outlineInset, maxInsetZ);
    const sizeX = Math.max(voxelInfo.width - 2 * effInsetX, voxelInfo.width * 0.1);
    const sizeY = Math.max(voxelInfo.depth - 2 * effInsetY, voxelInfo.depth * 0.1);
    const sizeZ = Math.max(voxelInfo.height - 2 * effInsetZ, voxelInfo.height * 0.1);
    const outlineColor = Cesium.Color.fromBytes(255, 255, 255, Math.round(255 * outlineOpacity));

    // Create a box-only outline entity (no fill) to match prior behavior
    const boxEntity = {
      position: centerCart,
      box: {
        dimensions: new Cesium.Cartesian3(sizeX, sizeY, sizeZ),
        material: Cesium.Color.TRANSPARENT,
        outline: true,
        outlineColor: outlineColor,
        outlineWidth: Math.max(outlineWidth || 1, 1),
        fill: false
      },
      properties: {
        type: 'voxel-inset-outline',
        parentKey: voxelInfo.key,
        insetSize: { x: sizeX, y: sizeY, z: sizeZ }
      }
    };

    Logger.debug('Created inset outline with offset:', outlineInset);
    return [boxEntity];
  }

  /**
   * Render emulation-only outline mode.
   * エミュレーションのみの枠線モードを描画します。
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {Object} outlineOptions - Outline options / 枠線オプション
   * @param {Object} adaptiveParams - Adaptive parameters / 適応的パラメータ
   * @returns {Array} Created outline entities / 作成された枠線エンティティ
   * @private
   */
  _renderEmulationOutline(voxelInfo, outlineOptions, adaptiveParams) {
    const outlineWidth = adaptiveParams.outlineWidth || outlineOptions.outlineWidth;
    const outlineOpacity = adaptiveParams.outlineOpacity || 1.0;
    // Use darker outline color for emulation mode without CSS dependency
    const outlineColor = Cesium.Color.fromBytes(51, 51, 51, Math.round(255 * outlineOpacity));
    
    // Create thicker outline for emulation / エミュレーション用の太い枠線を作成
    const emulationWidth = outlineWidth * 1.5;
    
    const centerCart = voxelInfo.position;
    const sizeX = voxelInfo.width;
    const sizeY = voxelInfo.depth;
    const sizeZ = voxelInfo.height;
    const polylineEntities = VoxelEntityFactory.createBoxEdgePolylines(
      centerCart,
      sizeX,
      sizeY,
      sizeZ,
      outlineColor,
      emulationWidth
    );

    Logger.debug('Created emulation outline with enhanced width:', emulationWidth);
    return polylineEntities;
  }

  /**
   * Create inset voxel information with reduced dimensions.
   * 縮小された寸法でインセットボクセル情報を作成します。
   * 
   * @param {Object} voxelInfo - Original voxel information / 元のボクセル情報
   * @param {number} insetValue - Inset offset in meters / インセットオフセット（メートル）
   * @param {string} insetMode - Inset application mode / インセット適用モード
   * @returns {Object} Inset voxel information / インセットボクセル情報
   * @private
   */
  _createInsetVoxelInfo(voxelInfo, insetValue, insetMode) {
    const insetVoxelInfo = { ...voxelInfo };
    
    // Apply inset to dimensions based on mode / モードに基づいて寸法にインセットを適用
    switch (insetMode) {
      case 'all':
        insetVoxelInfo.width = Math.max(0.1, voxelInfo.width - insetValue * 2);
        insetVoxelInfo.height = Math.max(0.1, voxelInfo.height - insetValue * 2);
        insetVoxelInfo.depth = Math.max(0.1, voxelInfo.depth - insetValue * 2);
        break;
      
      case 'horizontal':
        insetVoxelInfo.width = Math.max(0.1, voxelInfo.width - insetValue * 2);
        insetVoxelInfo.depth = Math.max(0.1, voxelInfo.depth - insetValue * 2);
        // height remains unchanged / 高さは変更なし
        break;
      
      case 'vertical':
        insetVoxelInfo.height = Math.max(0.1, voxelInfo.height - insetValue * 2);
        // width and depth remain unchanged / 幅と奥行きは変更なし
        break;
      
      default:
        Logger.warn('Unknown inset mode:', insetMode);
        // Fall back to 'all' mode / 'all'モードにフォールバック
        insetVoxelInfo.width = Math.max(0.1, voxelInfo.width - insetValue * 2);
        insetVoxelInfo.height = Math.max(0.1, voxelInfo.height - insetValue * 2);
        insetVoxelInfo.depth = Math.max(0.1, voxelInfo.depth - insetValue * 2);
        break;
    }
    
    Logger.debug('Created inset voxel info:', {
      original: {
        width: voxelInfo.width,
        height: voxelInfo.height,
        depth: voxelInfo.depth
      },
      inset: {
        width: insetVoxelInfo.width,
        height: insetVoxelInfo.height,
        depth: insetVoxelInfo.depth
      },
      mode: insetMode,
      offset: insetValue
    });
    
    return insetVoxelInfo;
  }

  /**
   * Check if outline should be rendered for a voxel.
   * ボクセルに対して枠線を描画すべきかどうかをチェックします。
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {Object} outlineOptions - Outline options / 枠線オプション
   * @returns {boolean} Whether outline should be rendered / 枠線を描画すべきかどうか
   */
  shouldRenderOutline(voxelInfo, outlineOptions) {
    if (!outlineOptions.showOutline) {
      return false;
    }
    
    // Always render outline for non-empty voxels when outline is enabled
    // 枠線が有効な場合、空でないボクセルには常に枠線を描画
    return voxelInfo.count > 0;
  }

  /**
   * Get outline color based on voxel information and options.
   * ボクセル情報とオプションに基づいて枠線色を取得します。
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {Object} outlineOptions - Outline options / 枠線オプション
   * @param {boolean} isTopN - Whether it is TopN / TopNボクセルかどうか
   * @returns {Cesium.Color} Outline color / 枠線色
   */
  getOutlineColor(voxelInfo, outlineOptions, isTopN = false) {
    if (isTopN) {
      return Cesium.Color.fromBytes(255, 255, 0, 255); // Yellow
    }
    if (outlineOptions.outlineRenderMode === 'emulation-only') {
      return Cesium.Color.fromBytes(51, 51, 51, 255); // Dark
    }
    return Cesium.Color.fromBytes(255, 255, 255, 255); // White
  }
}
