/**
 * Voxel entity creation utilities.
 * ボクセルエンティティ作成ユーティリティ。
 */
import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';

/**
 * Voxel entity factory class.
 * ボクセルエンティティ作成クラス。
 */
export class VoxelEntityFactory {
  /**
   * Create a box voxel entity.
   * ボックス形状のボクセルエンティティを作成します。
   * @param {Object} config - Entity configuration / エンティティ設定
   * @param {Cesium.Cartesian3} config.position - Position / 位置
   * @param {Cesium.Cartesian3} config.dimensions - Dimensions / 寸法
   * @param {Cesium.Color} config.color - Fill color / 塗りつぶし色
   * @param {number} config.opacity - Opacity / 不透明度
   * @param {boolean} config.wireframe - Wireframe mode / ワイヤーフレームモード
   * @param {Object} config.outline - Outline settings / アウトライン設定
   * @param {Object} config.properties - Custom properties / カスタムプロパティ
   * @param {string} config.description - Description HTML / 説明HTML
   * @returns {Object} Entity configuration / エンティティ設定
   */
  static createBoxEntity(config) {
    const {
      position,
      dimensions,
      color,
      opacity,
      wireframe = false,
      outline = {},
      properties = {},
      description = ''
    } = config;

    const entityConfig = {
      position: position,
      box: {
        dimensions: dimensions,
        outline: outline.show || false,
        outlineColor: outline.color || Cesium.Color.WHITE,
        outlineWidth: Math.max(outline.width || 1, 0) // 負値防止
      },
      properties: {
        type: 'voxel',
        ...properties
      },
      description: description
    };

    // Wireframe mode handling / ワイヤーフレームモードの処理
    if (wireframe) {
      entityConfig.box.material = Cesium.Color.TRANSPARENT;
      entityConfig.box.fill = false;
    } else {
      entityConfig.box.material = color.withAlpha(opacity);
      entityConfig.box.fill = true;
    }

    return entityConfig;
  }

  /**
   * Create a polyline entity for edge outlines.
   * エッジアウトライン用のポリラインエンティティを作成します。
   * @param {Object} config - Polyline configuration / ポリライン設定
   * @param {Array<Cesium.Cartesian3>} config.positions - Line positions / 線の位置
   * @param {Cesium.Color} config.color - Line color / 線の色
   * @param {number} config.width - Line width / 線の幅
   * @param {Object} config.properties - Custom properties / カスタムプロパティ
   * @returns {Object} Entity configuration / エンティティ設定
   */
  static createPolylineEntity(config) {
    const {
      positions,
      color,
      width = 1,
      properties = {}
    } = config;

    return {
      polyline: {
        positions: positions,
        width: width,
        material: color,
        arcType: Cesium.ArcType.NONE
      },
      properties: {
        type: 'outline',
        ...properties
      }
    };
  }

  /**
   * Create edge polylines for a box (thick outline emulation).
   * ボックスのエッジポリライン作成（太線アウトラインエミュレーション）。
   * @param {Cesium.Cartesian3} centerCart - Box center position / ボックス中心位置
   * @param {number} sizeX - X dimension / X軸寸法
   * @param {number} sizeY - Y dimension / Y軸寸法
   * @param {number} sizeZ - Z dimension / Z軸寸法
   * @param {Cesium.Color} color - Line color / 線の色
   * @param {number} width - Line width / 線の幅
   * @returns {Array<Object>} Array of polyline entity configurations / ポリラインエンティティ設定の配列
   */
  static createBoxEdgePolylines(centerCart, sizeX, sizeY, sizeZ, color, width) {
    try {
      if (!(sizeX > 0) || !(sizeY > 0) || !(sizeZ > 0)) {
        if (Logger && Logger.warn) Logger.warn('Invalid box dimensions for edge polylines:', { sizeX, sizeY, sizeZ });
        return [];
      }
      const halfX = sizeX / 2;
      const halfY = sizeY / 2;
      const halfZ = sizeZ / 2;
      
      // ENU座標系の変換行列を取得
      const enu = Cesium.Transforms.eastNorthUpToFixedFrame(centerCart);
      
      // ローカル座標をワールド座標に変換する関数
      const toWorld = (dx, dy, dz) => {
        const local = new Cesium.Cartesian3(dx, dy, dz);
        return Cesium.Matrix4.multiplyByPoint(enu, local, new Cesium.Cartesian3());
      };
      
      // ボックスの8つの角
      const corners = [
        toWorld(-halfX, -halfY, -halfZ), // 0: 左下後
        toWorld( halfX, -halfY, -halfZ), // 1: 右下後
        toWorld( halfX,  halfY, -halfZ), // 2: 右上後
        toWorld(-halfX,  halfY, -halfZ), // 3: 左上後
        toWorld(-halfX, -halfY,  halfZ), // 4: 左下前
        toWorld( halfX, -halfY,  halfZ), // 5: 右下前
        toWorld( halfX,  halfY,  halfZ), // 6: 右上前
        toWorld(-halfX,  halfY,  halfZ)  // 7: 左上前
      ];
      
      // ボックスの12本のエッジ
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // 後面の4本
        [4, 5], [5, 6], [6, 7], [7, 4], // 前面の4本
        [0, 4], [1, 5], [2, 6], [3, 7]  // 前後をつなぐ4本
      ];
      
      // 各エッジのポリラインエンティティ設定を作成
      return edges.map(([i, j]) => 
        VoxelEntityFactory.createPolylineEntity({
          positions: [corners[i], corners[j]],
          color: color,
          width: width,
          properties: {
            edgeType: 'thick-outline-emulation'
          }
        })
      );
      
    } catch (error) {
      Logger.warn('Edge polyline creation failed:', error);
      return [];
    }
  }

  /**
   * Create a debug bounding box entity.
   * デバッグ用バウンディングボックスエンティティを作成します。
   * @param {Object} bounds - Data bounds / データ境界
   * @param {Object} bounds.minLon - Minimum longitude / 最小経度
   * @param {Object} bounds.maxLon - Maximum longitude / 最大経度
   * @param {Object} bounds.minLat - Minimum latitude / 最小緯度
   * @param {Object} bounds.maxLat - Maximum latitude / 最大緯度
   * @param {Object} bounds.minAlt - Minimum altitude / 最小高度
   * @param {Object} bounds.maxAlt - Maximum altitude / 最大高度
   * @returns {Object|null} Entity configuration or null if bounds invalid / エンティティ設定または無効な場合null
   */
  static createDebugBoundingBox(bounds) {
    if (!bounds) return null;

    try {
      // 中心点を計算
      const centerLon = (bounds.minLon + bounds.maxLon) / 2;
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerAlt = (bounds.minAlt + bounds.maxAlt) / 2;
      
      // サイズ計算（概算）
      const widthMeters = (bounds.maxLon - bounds.minLon) * 111000 * Math.cos(centerLat * Math.PI / 180);
      const depthMeters = (bounds.maxLat - bounds.minLat) * 111000;
      const heightMeters = bounds.maxAlt - bounds.minAlt;
      
      return {
        position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
        box: {
          dimensions: new Cesium.Cartesian3(widthMeters, depthMeters, heightMeters),
          material: Cesium.Color.YELLOW.withAlpha(0.1),
          outline: true,
          outlineColor: Cesium.Color.YELLOW.withAlpha(0.3),
          outlineWidth: 2
        },
        properties: {
          type: 'debug-bounds'
        },
        description: `バウンディングボックス<br>サイズ: ${widthMeters.toFixed(1)} x ${depthMeters.toFixed(1)} x ${heightMeters.toFixed(1)} m`
      };
      
    } catch (error) {
      Logger.warn('Failed to create debug bounding box:', error);
      return null;
    }
  }

  /**
   * Create inset outline polylines.
   * インセットアウトラインポリラインを作成します。
   * @param {number} centerLon - Center longitude / 中心経度
   * @param {number} centerLat - Center latitude / 中心緯度
   * @param {number} centerAlt - Center altitude / 中心高度
   * @param {number} sizeX - X dimension / X軸寸法
   * @param {number} sizeY - Y dimension / Y軸寸法
   * @param {number} sizeZ - Z dimension / Z軸寸法
   * @param {Cesium.Color} color - Outline color / アウトライン色
   * @param {number} width - Line width / 線の幅
   * @param {number} insetAmount - Inset amount in meters / インセット量（メートル）
   * @returns {Array<Object>} Array of polyline entity configurations / ポリラインエンティティ設定の配列
   */
  static createInsetOutlinePolylines(centerLon, centerLat, centerAlt, sizeX, sizeY, sizeZ, color, width, insetAmount) {
    try {
      const centerCart = Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt);
      
      // インセット適用後のサイズ
      const insetSizeX = Math.max(sizeX - insetAmount * 2, sizeX * 0.1);
      const insetSizeY = Math.max(sizeY - insetAmount * 2, sizeY * 0.1);
      const insetSizeZ = Math.max(sizeZ - insetAmount * 2, sizeZ * 0.1);
      
      return VoxelEntityFactory.createBoxEdgePolylines(
        centerCart,
        insetSizeX,
        insetSizeY,
        insetSizeZ,
        color,
        width
      ).map(config => ({
        ...config,
        properties: {
          ...config.properties,
          edgeType: 'inset-outline'
        }
      }));
      
    } catch (error) {
      Logger.warn('Failed to create inset outline:', error);
      return [];
    }
  }
}
