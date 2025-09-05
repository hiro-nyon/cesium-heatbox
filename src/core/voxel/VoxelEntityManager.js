/**
 * ADR-0008 Phase 3: VoxelRenderer からエンティティ管理機能を分離
 * Entity management for 3D voxels.
 * 3Dボクセル用エンティティ管理
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';
import { VoxelEntityFactory } from './VoxelEntityFactory.js';

/**
 * VoxelEntityManager handles entity creation, management, and cleanup.
 * VoxelEntityManagerはエンティティの作成、管理、クリーンアップを処理します。
 */
/**
 * Specialized manager for Cesium entity lifecycle in voxel rendering.
 * ボクセルレンダリングにおけるCesiumエンティティライフサイクルの専門マネージャー。
 * 
 * This class handles all aspects of voxel entity management including creation,
 * addition to scene, visibility control, and cleanup. Extracted from VoxelRenderer
 * as part of ADR-0008 modular refactoring to improve separation of concerns
 * and maintainability.
 * 
 * このクラスは、作成、シーンへの追加、表示制御、クリーンアップを含む
 * ボクセルエンティティ管理のすべての側面を処理します。懸念の分離と
 * 保守性向上のためADR-0008モジュラーリファクタリングの一部として
 * VoxelRendererから抽出されました。
 * 
 * @since v0.1.10
 * @version 1.0.0 - Initial modular implementation (ADR-0008 Phase 3)
 */
export class VoxelEntityManager {
  /**
   * Constructor
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer / CesiumJS Viewer
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.entityFactory = new VoxelEntityFactory();
    this.voxelEntities = [];
  }

  /**
   * Add entity to managed entities list.
   * エンティティを管理対象リストに追加
   * @param {Cesium.Entity} entity - Entity to add / 追加するエンティティ
   */
  addEntity(entity) {
    this.voxelEntities.push(entity);
    return entity;
  }

  /**
   * Clear all managed entities.
   * すべての管理対象エンティティをクリア
   */
  clear() {
    Logger.debug('VoxelEntityManager.clear - Removing', this.voxelEntities.length, 'entities');
    
    this.voxelEntities.forEach(entity => {
      try {
        // isDestroyedのチェックを安全に行う
        const isDestroyed = typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
        
        if (entity && !isDestroyed) {
          this.viewer.entities.remove(entity);
        }
      } catch (error) {
        Logger.warn('Entity removal error:', error);
      }
    });
    
    this.voxelEntities = [];
  }

  /**
   * Set visibility of all managed entities.
   * 管理対象エンティティの表示/非表示を設定
   * @param {boolean} show - Visibility state / 表示状態
   */
  setVisible(show) {
    Logger.debug('VoxelEntityManager.setVisible:', show, 'for', this.voxelEntities.length, 'entities');
    
    this.voxelEntities.forEach(entity => {
      try {
        const isDestroyed = typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
        
        if (entity && !isDestroyed) {
          entity.show = show;
        }
      } catch (error) {
        Logger.warn('Entity visibility error:', error);
      }
    });
  }

  /**
   * Create and add an inset outline entity.
   * インセット枠線エンティティを作成・追加
   * @param {number} centerLon - Center longitude / 中心経度
   * @param {number} centerLat - Center latitude / 中心緯度
   * @param {number} centerAlt - Center altitude / 中心高度
   * @param {number} baseSizeX - Base X size / ベースXサイズ
   * @param {number} baseSizeY - Base Y size / ベースYサイズ  
   * @param {number} baseSizeZ - Base Z size / ベースZサイズ
   * @param {Cesium.Color} outlineColor - Outline color / 枠線色
   * @param {number} outlineWidth - Outline width / 枠線幅
   * @param {string} voxelKey - Voxel key / ボクセルキー
   * @param {number} insetAmount - Inset amount / インセット量
   * @returns {Cesium.Entity} Created entity / 作成されたエンティティ
   */
  createInsetOutline(centerLon, centerLat, centerAlt, baseSizeX, baseSizeY, baseSizeZ, outlineColor, outlineWidth, voxelKey, insetAmount = null) {
    // ADR-0004のインセット枠線実装
    const actualInset = insetAmount || 1.0; // デフォルト1m
    
    // インセット寸法の計算
    const insetX = Math.max(baseSizeX * 0.1, baseSizeX - 2 * actualInset);
    const insetY = Math.max(baseSizeY * 0.1, baseSizeY - 2 * actualInset);
    const insetZ = Math.max(baseSizeZ * 0.1, baseSizeZ - 2 * actualInset);

    // Enforce 20% max inset per axis (ADR-0004)
    const maxInsetX = baseSizeX * 0.4; // 両側で最大40%
    const maxInsetY = baseSizeY * 0.4;
    const maxInsetZ = baseSizeZ * 0.4;
    
    const finalInsetX = Math.max(insetX, baseSizeX - maxInsetX);
    const finalInsetY = Math.max(insetY, baseSizeY - maxInsetY);  
    const finalInsetZ = Math.max(insetZ, baseSizeZ - maxInsetZ);

    const insetDimensions = new Cesium.Cartesian3(finalInsetX, finalInsetY, finalInsetZ);
    
    const insetEntity = this.entityFactory.createBoxEntity({
      id: `voxel-inset-${voxelKey}`,
      position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
      dimensions: insetDimensions,
      color: Cesium.Color.TRANSPARENT, // 透明ボックス
      opacity: 0.0,
      outlineColor: outlineColor,
      outlineWidth: outlineWidth,
      wireframeOnly: true,
      key: `inset-${voxelKey}`
    });

    this.viewer.entities.add(insetEntity);
    this.addEntity(insetEntity);
    
    return insetEntity;
  }

  /**
   * Create thick outline frames using multiple frame boxes.
   * 複数のフレームボックスを使用して厚い枠線を作成
   * @param {number} centerLon - Center longitude / 中心経度
   * @param {number} centerLat - Center latitude / 中心緯度  
   * @param {number} centerAlt - Center altitude / 中心高度
   * @param {number} outerX - Outer X size / 外側Xサイズ
   * @param {number} outerY - Outer Y size / 外側Yサイズ
   * @param {number} outerZ - Outer Z size / 外側Zサイズ
   * @param {number} innerX - Inner X size / 内側Xサイズ
   * @param {number} innerY - Inner Y size / 内側Yサイズ
   * @param {number} innerZ - Inner Z size / 内側Zサイズ
   * @param {Cesium.Color} frameColor - Frame color / フレーム色
   * @param {string} voxelKey - Voxel key / ボクセルキー
   * @returns {Array} Created frame entities / 作成されたフレームエンティティ
   */
  createThickOutlineFrames(centerLon, centerLat, centerAlt, outerX, outerY, outerZ, innerX, innerY, innerZ, frameColor, voxelKey) {
    const frameEntities = [];
    const frameThickness = Math.max((outerX - innerX) / 2, 0.5); // minimum 0.5m thickness
    
    const frames = [
      // 6 faces: top/bottom, front/back, left/right
      
      // Top frame
      {
        position: [centerLon, centerLat, centerAlt + (outerZ - frameThickness) / 2],
        size: [outerX, outerY, frameThickness]
      },
      // Bottom frame  
      {
        position: [centerLon, centerLat, centerAlt - (outerZ - frameThickness) / 2],
        size: [outerX, outerY, frameThickness]
      },
      
      // Front frame (Y+)
      {
        position: [centerLon, centerLat + (outerY - frameThickness) / 2, centerAlt],
        size: [outerX, frameThickness, innerZ]
      },
      // Back frame (Y-)
      {
        position: [centerLon, centerLat - (outerY - frameThickness) / 2, centerAlt], 
        size: [outerX, frameThickness, innerZ]
      },
      
      // Right frame (X+)
      {
        position: [centerLon + (outerX - frameThickness) / 2, centerLat, centerAlt],
        size: [frameThickness, innerY, innerZ]
      },
      // Left frame (X-)
      {
        position: [centerLon - (outerX - frameThickness) / 2, centerLat, centerAlt],
        size: [frameThickness, innerY, innerZ]
      },
      
      // Edge frames (12 edges)
      // 4 vertical edges
      {
        position: [centerLon + (innerX) / 2, centerLat + (innerY) / 2, centerAlt],
        size: [frameThickness, frameThickness, outerZ]
      },
      {
        position: [centerLon - (innerX) / 2, centerLat + (innerY) / 2, centerAlt],
        size: [frameThickness, frameThickness, outerZ]
      },
      {
        position: [centerLon + (innerX) / 2, centerLat - (innerY) / 2, centerAlt],
        size: [frameThickness, frameThickness, outerZ] 
      },
      {
        position: [centerLon - (innerX) / 2, centerLat - (innerY) / 2, centerAlt],
        size: [frameThickness, frameThickness, outerZ]
      },
      
      // 4 horizontal edges (top)
      {
        position: [centerLon, centerLat + (innerY) / 2, centerAlt + (innerZ) / 2],
        size: [innerX, frameThickness, frameThickness]
      },
      {
        position: [centerLon, centerLat - (innerY) / 2, centerAlt + (innerZ) / 2],
        size: [innerX, frameThickness, frameThickness]
      }
    ];

    frames.forEach((frame, index) => {
      // Skip frames that are too small
      if (frame.size[0] > 0.1 && frame.size[1] > 0.1 && frame.size[2] > 0.1) {
        const frameEntity = this.entityFactory.createBoxEntity({
          id: `thick-frame-${voxelKey}-${index}`,
          position: Cesium.Cartesian3.fromDegrees(frame.position[0], frame.position[1], frame.position[2]),
          dimensions: {
            width: frame.size[0],
            height: frame.size[1], 
            depth: frame.size[2]
          },
          color: frameColor,
          opacity: 1.0,
          outlineColor: undefined,
          outlineWidth: 0,
          wireframeOnly: false,
          key: `thick-frame-${voxelKey}-${index}`
        });

        this.viewer.entities.add(frameEntity);
        this.addEntity(frameEntity);
        frameEntities.push(frameEntity);
      }
    });

    return frameEntities;
  }

  /**
   * Check if inset outline should be applied.
   * インセット枠線を適用すべきかどうかを判定
   * @param {boolean} isTopN - Is TopN voxel / TopNボクセルか
   * @param {Object} options - Options / オプション
   * @returns {boolean} Whether to apply inset outline / インセット枠線を適用するかどうか
   */
  shouldApplyInsetOutline(isTopN, options) {
    const mode = options.outlineInsetMode || 'all';
    
    switch (mode) {
      case 'all':
        return true;
      case 'topn-only':
        return isTopN;
      case 'non-topn':
        return !isTopN;
      default:
        return true;
    }
  }

  /**
   * Get statistics about managed entities.
   * 管理対象エンティティの統計を取得
   * @returns {Object} Entity statistics / エンティティ統計
   */
  getEntityStats() {
    return {
      totalEntities: this.voxelEntities.length,
      activeEntities: this.voxelEntities.filter(entity => {
        try {
          const isDestroyed = typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
          return !isDestroyed;
        } catch {
          return false;
        }
      }).length
    };
  }
}
