import * as Cesium from 'cesium';
import { Logger } from '../../utils/logger.js';

/**
 * GeometryRenderer - Creates Cesium entities consumed by VoxelRenderer.
 * ジオメトリレンダラー - VoxelRenderer が利用する Cesium エンティティを生成・管理
 *
 * Responsibilities:
 * - ボクセルボックス描画 (Voxel box rendering)
 * - インセット枠線描画 (Inset outline rendering)
 * - エッジポリライン描画 (Edge polyline rendering for emulation)
 * - エンティティライフサイクル管理 (Entity lifecycle management)
 *
 * ADR-0009 Phase 4
 * @version 0.1.15
 */
export class GeometryRenderer {
  /**
   * GeometryRenderer constructor
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer instance / CesiumJS Viewerインスタンス
   * @param {Object} options - Rendering options / 描画オプション
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = {
      // Geometry rendering defaults
      wireframeOnly: false,
      showOutline: true,
      outlineWidth: 2,
      outlineInset: 0,
      outlineInsetMode: 'all',
      outlineRenderMode: 'standard',
      enableThickFrames: false,
      ...options
    };

    // Entity management
    this.entities = [];

    Logger.debug('GeometryRenderer initialized with viewer and options:', this.options);
  }

  /**
   * Create a voxel box entity
   * ボクセルボックスエンティティを作成
   * 
   * @param {Object} config - Voxel configuration / ボクセル設定
   * @param {number} config.centerLon - Center longitude / 中心経度
   * @param {number} config.centerLat - Center latitude / 中心緯度  
   * @param {number} config.centerAlt - Center altitude / 中心高度
   * @param {number} config.cellSizeX - X dimension / X寸法
   * @param {number} config.cellSizeY - Y dimension / Y寸法
   * @param {number} config.boxHeight - Box height / ボックス高さ
   * @param {Cesium.Color} config.color - Box color / ボックス色
   * @param {number} config.opacity - Box opacity / ボックス透明度
   * @param {boolean} config.shouldShowOutline - Show outline / 枠線表示
   * @param {Cesium.Color} config.outlineColor - Outline color / 枠線色  
   * @param {number} config.outlineWidth - Outline width / 枠線太さ
   * @param {Object} config.voxelInfo - Voxel data / ボクセルデータ
   * @param {string} config.voxelKey - Voxel key / ボクセルキー
   * @param {boolean} [config.emulateThick] - Use thick outline emulation / 太線エミュレーション使用
   * @returns {Cesium.Entity} Created voxel entity / 作成されたボクセルエンティティ
   */
  createVoxelBox(config) {
    const {
      centerLon, centerLat, centerAlt,
      cellSizeX, cellSizeY, boxHeight,
      color, opacity,
      shouldShowOutline, outlineColor, outlineWidth,
      voxelInfo, voxelKey,
      emulateThick = false
    } = config;

    // Validate coordinate inputs to prevent Cesium RangeError
    const safeCenterLon = Number.isFinite(centerLon) ? Math.max(-180, Math.min(180, centerLon)) : 0;
    const safeCenterLat = Number.isFinite(centerLat) ? Math.max(-90, Math.min(90, centerLat)) : 0;
    const safeCenterAlt = Number.isFinite(centerAlt) ? Math.max(-10000, Math.min(100000, centerAlt)) : 0;
    
    // Validate dimension inputs to prevent Cesium geometry errors
    const safeCellSizeX = Number.isFinite(cellSizeX) && cellSizeX > 0 ? Math.min(cellSizeX, 1e6) : 1;
    const safeCellSizeY = Number.isFinite(cellSizeY) && cellSizeY > 0 ? Math.min(cellSizeY, 1e6) : 1;
    const safeBoxHeight = Number.isFinite(boxHeight) && boxHeight > 0 ? Math.min(boxHeight, 1e6) : 1;
    
    // Log warning if values were clamped
    if (safeCenterLon !== centerLon || safeCenterLat !== centerLat || safeCenterAlt !== centerAlt ||
        safeCellSizeX !== cellSizeX || safeCellSizeY !== cellSizeY || safeBoxHeight !== boxHeight) {
      Logger.warn(`Clamped invalid geometry values for voxel ${voxelKey}:`, {
        original: { centerLon, centerLat, centerAlt, cellSizeX, cellSizeY, boxHeight },
        clamped: { safeCenterLon, safeCenterLat, safeCenterAlt, safeCellSizeX, safeCellSizeY, safeBoxHeight }
      });
    }

    // Entity configuration with safe values
    const showOutline = Boolean(shouldShowOutline && !emulateThick);
    const boxConfig = {
      dimensions: new Cesium.Cartesian3(safeCellSizeX, safeCellSizeY, safeBoxHeight),
      outline: showOutline
    };
    if (showOutline) {
      boxConfig.outlineColor = outlineColor;
      boxConfig.outlineWidth = Math.max(outlineWidth || 1, 1);
    }

    const entityConfig = {
      position: Cesium.Cartesian3.fromDegrees(safeCenterLon, safeCenterLat, safeCenterAlt),
      box: boxConfig,
      properties: {
        type: 'voxel',
        key: voxelKey,
        count: voxelInfo.count,
        x: voxelInfo.x,
        y: voxelInfo.y,
        z: voxelInfo.z
      },
      description: this.createVoxelDescription(voxelInfo, voxelKey)
    };

    // Material configuration based on wireframe mode
    if (this.options.wireframeOnly) {
      entityConfig.box.material = Cesium.Color.TRANSPARENT;
      entityConfig.box.fill = false;
    } else {
      entityConfig.box.material = color.withAlpha(opacity);
      entityConfig.box.fill = true;
    }
    
    // Create and track entity
    const entity = this.viewer.entities.add(entityConfig);
    this.entities.push(entity);
    
    return entity;
  }

  /**
   * Create inset outline for a voxel  
   * ボクセルのインセット枠線を作成
   * 
   * @param {Object} config - Inset outline configuration / インセット枠線設定
   * @param {number} config.centerLon - Center longitude / 中心経度
   * @param {number} config.centerLat - Center latitude / 中心緯度
   * @param {number} config.centerAlt - Center altitude / 中心高度
   * @param {number} config.baseSizeX - Base X size / ベースX寸法
   * @param {number} config.baseSizeY - Base Y size / ベースY寸法
   * @param {number} config.baseSizeZ - Base Z size / ベースZ寸法
   * @param {Cesium.Color} config.outlineColor - Outline color / 枠線色
   * @param {number} config.outlineWidth - Outline width / 枠線太さ
   * @param {string} config.voxelKey - Voxel key / ボクセルキー
   * @param {number} [config.insetAmount] - Custom inset amount / カスタムインセット量
   * @returns {Cesium.Entity} Created inset outline entity / 作成されたインセット枠線エンティティ
   */
  createInsetOutline(config) {
    const {
      centerLon, centerLat, centerAlt,
      baseSizeX, baseSizeY, baseSizeZ,
      outlineColor, outlineWidth, voxelKey,
      insetAmount = null
    } = config;

    // Validate inputs for inset outline to prevent Cesium errors
    const safeCenterLon = Number.isFinite(centerLon) ? Math.max(-180, Math.min(180, centerLon)) : 0;
    const safeCenterLat = Number.isFinite(centerLat) ? Math.max(-90, Math.min(90, centerLat)) : 0;
    const safeCenterAlt = Number.isFinite(centerAlt) ? Math.max(-10000, Math.min(100000, centerAlt)) : 0;
    
    const safeBaseSizeX = Number.isFinite(baseSizeX) && baseSizeX > 0 ? Math.min(baseSizeX, 1e6) : 1;
    const safeBaseSizeY = Number.isFinite(baseSizeY) && baseSizeY > 0 ? Math.min(baseSizeY, 1e6) : 1;
    const safeBaseSizeZ = Number.isFinite(baseSizeZ) && baseSizeZ > 0 ? Math.min(baseSizeZ, 1e6) : 1;

    // インセット距離の適用（ADR-0004の境界条件：両側合計で各軸寸法の最大40%まで＝片側20%）
    // 片側20%までに制限することで、最終寸法は元の60%以上を保証する
    const maxInsetX = safeBaseSizeX * 0.2;
    const maxInsetY = safeBaseSizeY * 0.2;
    const maxInsetZ = safeBaseSizeZ * 0.2;
    
    const baseInset = insetAmount !== null ? insetAmount : this.options.outlineInset;
    const effectiveInsetX = Math.min(baseInset, maxInsetX);
    const effectiveInsetY = Math.min(baseInset, maxInsetY);  
    const effectiveInsetZ = Math.min(baseInset, maxInsetZ);
    
    // インセット後の寸法計算（各軸から2倍のインセットを引く）
    const insetSizeX = Math.max(safeBaseSizeX - (effectiveInsetX * 2), safeBaseSizeX * 0.1);
    const insetSizeY = Math.max(safeBaseSizeY - (effectiveInsetY * 2), safeBaseSizeY * 0.1);
    const insetSizeZ = Math.max(safeBaseSizeZ - (effectiveInsetZ * 2), safeBaseSizeZ * 0.1);
    
    // セカンダリBoxエンティティの設定（枠線のみ、塗りなし）
    const insetEntity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(safeCenterLon, safeCenterLat, safeCenterAlt),
      box: {
        dimensions: new Cesium.Cartesian3(insetSizeX, insetSizeY, insetSizeZ),
        fill: false,
        outline: true,
        outlineColor: outlineColor,
        // CesiumのBox outlineWidthは0や負値で不安定になるため最低1にクランプ
        outlineWidth: Math.max(outlineWidth || 1, 1)
      },
      properties: {
        type: 'voxel-inset-outline',
        parentKey: voxelKey,
        insetSize: { x: insetSizeX, y: insetSizeY, z: insetSizeZ }
      }
    });
    
    this.entities.push(insetEntity);
    
    // 枠線の厚み部分を視覚化（WebGL 1px制限の回避）
    if (this.options.enableThickFrames && (effectiveInsetX > 0.1 || effectiveInsetY > 0.1 || effectiveInsetZ > 0.1)) {
      this.createThickOutlineFrames({
        centerLon: safeCenterLon, centerLat: safeCenterLat, centerAlt: safeCenterAlt,
        outerX: safeBaseSizeX, outerY: safeBaseSizeY, outerZ: safeBaseSizeZ,
        innerX: insetSizeX, innerY: insetSizeY, innerZ: insetSizeZ,
        frameColor: outlineColor, voxelKey
      });
    }
    
    Logger.debug(`Inset outline created for voxel ${voxelKey}:`, {
      originalSize: { x: baseSizeX, y: baseSizeY, z: baseSizeZ },
      insetSize: { x: insetSizeX, y: insetSizeY, z: insetSizeZ },
      effectiveInset: { x: effectiveInsetX, y: effectiveInsetY, z: effectiveInsetZ }
    });

    return insetEntity;
  }

  /**
   * Create thick outline frame structures
   * 枠線の厚み部分を視覚化するフレーム構造を作成
   * 
   * @param {Object} config - Frame configuration / フレーム設定
   * @param {number} config.centerLon - Center longitude / 中心経度
   * @param {number} config.centerLat - Center latitude / 中心緯度
   * @param {number} config.centerAlt - Center altitude / 中心高度
   * @param {number} config.outerX - Outer X size / 外側Xサイズ
   * @param {number} config.outerY - Outer Y size / 外側Yサイズ
   * @param {number} config.outerZ - Outer Z size / 外側Zサイズ
   * @param {number} config.innerX - Inner X size / 内側Xサイズ
   * @param {number} config.innerY - Inner Y size / 内側Yサイズ
   * @param {number} config.innerZ - Inner Z size / 内側Zサイズ
   * @param {Cesium.Color} config.frameColor - Frame color / フレーム色
   * @param {string} config.voxelKey - Voxel key / ボクセルキー
   * @returns {Array<Cesium.Entity>} Created frame entities / 作成されたフレームエンティティ配列
   */
  createThickOutlineFrames(config) {
    const {
      centerLon, centerLat, centerAlt,
      outerX, outerY, outerZ,
      innerX, innerY, innerZ,
      frameColor, voxelKey
    } = config;

    // フレーム厚み計算（外側と内側の差を2で割ったもの）
    let frameThickX = (outerX - innerX) / 2;
    let frameThickY = (outerY - innerY) / 2;
    let frameThickZ = (outerZ - innerZ) / 2;
    // 厚みが0や負になるケースを防止（ゼロ寸法BoxはCesiumで不安定）
    const minFrame = 0.05;
    if (frameThickX <= 0 || frameThickY <= 0 || frameThickZ <= 0) {
      Logger.warn(`Invalid frame thickness for voxel ${voxelKey}, skipping thick frames`);
      return [];
    }
    frameThickX = Math.max(frameThickX, minFrame);
    frameThickY = Math.max(frameThickY, minFrame);
    frameThickZ = Math.max(frameThickZ, minFrame);
    
    // 境界計算：各軸での内側・外側の境界
    const outerBoundX = outerX / 2;    // 外側境界（中心からの距離）
    const outerBoundY = outerY / 2;
    const outerBoundZ = outerZ / 2;
    // 内側境界は以降の処理では直接使用しないため計算を省略

    const frameEntities = [];
    
    // 12個のフレームボックスを作成
    // X軸に平行なフレーム（4本）
    const xFrames = [
      { y: outerBoundY, z: outerBoundZ, sizeY: frameThickY, sizeZ: frameThickZ },
      { y: -outerBoundY, z: outerBoundZ, sizeY: frameThickY, sizeZ: frameThickZ },
      { y: outerBoundY, z: -outerBoundZ, sizeY: frameThickY, sizeZ: frameThickZ },
      { y: -outerBoundY, z: -outerBoundZ, sizeY: frameThickY, sizeZ: frameThickZ }
    ];

    // Y軸に平行なフレーム（4本）
    const yFrames = [
      { x: outerBoundX, z: outerBoundZ, sizeX: frameThickX, sizeZ: frameThickZ },
      { x: -outerBoundX, z: outerBoundZ, sizeX: frameThickX, sizeZ: frameThickZ },
      { x: outerBoundX, z: -outerBoundZ, sizeX: frameThickX, sizeZ: frameThickZ },
      { x: -outerBoundX, z: -outerBoundZ, sizeX: frameThickX, sizeZ: frameThickZ }
    ];

    // Z軸に平行なフレーム（4本）
    const zFrames = [
      { x: outerBoundX, y: outerBoundY, sizeX: frameThickX, sizeY: frameThickY },
      { x: -outerBoundX, y: outerBoundY, sizeX: frameThickX, sizeY: frameThickY },
      { x: outerBoundX, y: -outerBoundY, sizeX: frameThickX, sizeY: frameThickY },
      { x: -outerBoundX, y: -outerBoundY, sizeX: frameThickX, sizeY: frameThickY }
    ];

    // X軸フレームを作成
    xFrames.forEach((frame, index) => {
      const position = Cesium.Cartesian3.fromDegrees(
        centerLon,
        centerLat + (frame.y / 111320), // 緯度変換（概算）
        centerAlt + frame.z
      );

      const frameEntity = this.viewer.entities.add({
        position: position,
        box: {
          dimensions: new Cesium.Cartesian3(outerX, frame.sizeY, frame.sizeZ),
          fill: true,
          material: frameColor.withAlpha(0.3),
          outline: false
        },
        properties: {
          type: 'voxel-thick-frame-x',
          parentKey: voxelKey,
          frameIndex: index
        }
      });

      this.entities.push(frameEntity);
      frameEntities.push(frameEntity);
    });

    // Y軸フレームを作成
    yFrames.forEach((frame, index) => {
      const position = Cesium.Cartesian3.fromDegrees(
        centerLon + (frame.x / (111320 * Math.cos(centerLat * Math.PI / 180))), // 経度変換（概算）
        centerLat,
        centerAlt + frame.z
      );

      const frameEntity = this.viewer.entities.add({
        position: position,
        box: {
          dimensions: new Cesium.Cartesian3(frame.sizeX, outerY, frame.sizeZ),
          fill: true,
          material: frameColor.withAlpha(0.3),
          outline: false
        },
        properties: {
          type: 'voxel-thick-frame-y',
          parentKey: voxelKey,
          frameIndex: index
        }
      });

      this.entities.push(frameEntity);
      frameEntities.push(frameEntity);
    });

    // Z軸フレームを作成
    zFrames.forEach((frame, index) => {
      const position = Cesium.Cartesian3.fromDegrees(
        centerLon + (frame.x / (111320 * Math.cos(centerLat * Math.PI / 180))), // 経度変換（概算）
        centerLat + (frame.y / 111320), // 緯度変換（概算）
        centerAlt
      );

      const frameEntity = this.viewer.entities.add({
        position: position,
        box: {
          dimensions: new Cesium.Cartesian3(frame.sizeX, frame.sizeY, outerZ),
          fill: true,
          material: frameColor.withAlpha(0.3),
          outline: false
        },
        properties: {
          type: 'voxel-thick-frame-z',
          parentKey: voxelKey,
          frameIndex: index
        }
      });

      this.entities.push(frameEntity);
      frameEntities.push(frameEntity);
    });

    Logger.debug(`Created ${frameEntities.length} thick frame entities for voxel ${voxelKey}`);
    
    return frameEntities;
  }

  /**
   * Create edge polylines for thick outline emulation
   * 太線エミュレーション用のエッジポリライン作成
   * 
   * @param {Object} config - Edge polyline configuration / エッジポリライン設定
   * @param {number} config.centerLon - Center longitude / 中心経度
   * @param {number} config.centerLat - Center latitude / 中心緯度
   * @param {number} config.centerAlt - Center altitude / 中心高度
   * @param {number} config.cellSizeX - X dimension / X寸法
   * @param {number} config.cellSizeY - Y dimension / Y寸法
   * @param {number} config.boxHeight - Box height / ボックス高さ
   * @param {Cesium.Color} config.outlineColor - Outline color / 枠線色
   * @param {number} config.outlineWidth - Outline width / 枠線太さ
   * @param {string} config.voxelKey - Voxel key / ボクセルキー
   * @returns {Array<Cesium.Entity>} Created polyline entities / 作成されたポリラインエンティティ配列
   */
  createEdgePolylines(config) {
    const {
      centerLon, centerLat, centerAlt,
      cellSizeX, cellSizeY, boxHeight,
      outlineColor, outlineWidth, voxelKey
    } = config;

    const polylineEntities = [];
    
    // Validate inputs for edge polylines to prevent coordinate calculation errors
    const safeCenterLon = Number.isFinite(centerLon) ? Math.max(-180, Math.min(180, centerLon)) : 0;
    const safeCenterLat = Number.isFinite(centerLat) ? Math.max(-85, Math.min(85, centerLat)) : 0; // Avoid poles more strictly
    const safeCenterAlt = Number.isFinite(centerAlt) ? Math.max(-10000, Math.min(100000, centerAlt)) : 0;
    
    const safeCellSizeX = Number.isFinite(cellSizeX) && cellSizeX > 0 ? Math.min(cellSizeX, 1e5) : 1; // More conservative limits
    const safeCellSizeY = Number.isFinite(cellSizeY) && cellSizeY > 0 ? Math.min(cellSizeY, 1e5) : 1;
    const safeBoxHeight = Number.isFinite(boxHeight) && boxHeight > 0 ? Math.min(boxHeight, 1e5) : 1;

    // Early validation: check if dimensions are reasonable
    if (safeCellSizeX < 0.001 || safeCellSizeY < 0.001 || safeBoxHeight < 0.001) {
      Logger.warn(`Dimensions too small for voxel ${voxelKey}, skipping edge polylines`);
      return polylineEntities;
    }

    // ボックスの8つの頂点を計算 - 安全な値を使用
    const halfX = safeCellSizeX / 2;
    const halfY = safeCellSizeY / 2;
    const halfZ = safeBoxHeight / 2;
    
    // 座標変換係数の安全な計算 - より保守的なアプローチ
    const cosLat = Math.cos(safeCenterLat * Math.PI / 180);
    const safeCosFactor = Math.max(0.1, Math.abs(cosLat)); // より保守的な最小値

    // 計算された座標オフセットの事前検証
    const lonOffset = halfX / (111320 * safeCosFactor);
    const latOffset = halfY / 111320;
    
    if (!Number.isFinite(lonOffset) || !Number.isFinite(latOffset) || 
        Math.abs(lonOffset) > 0.1 || Math.abs(latOffset) > 0.1) {
      Logger.warn(`Coordinate offsets out of range for voxel ${voxelKey}, skipping edge polylines`);
      return polylineEntities;
    }

    // 頂点座標の事前計算とバリデーション
    const vertexCoords = [
      // 下面の4頂点
      [safeCenterLon - lonOffset, safeCenterLat - latOffset, safeCenterAlt - halfZ],
      [safeCenterLon + lonOffset, safeCenterLat - latOffset, safeCenterAlt - halfZ],
      [safeCenterLon + lonOffset, safeCenterLat + latOffset, safeCenterAlt - halfZ],
      [safeCenterLon - lonOffset, safeCenterLat + latOffset, safeCenterAlt - halfZ],
      // 上面の4頂点
      [safeCenterLon - lonOffset, safeCenterLat - latOffset, safeCenterAlt + halfZ],
      [safeCenterLon + lonOffset, safeCenterLat - latOffset, safeCenterAlt + halfZ],
      [safeCenterLon + lonOffset, safeCenterLat + latOffset, safeCenterAlt + halfZ],
      [safeCenterLon - lonOffset, safeCenterLat + latOffset, safeCenterAlt + halfZ]
    ];

    // 全ての座標が有効範囲内かチェック
    const allCoordsValid = vertexCoords.every(([lon, lat, alt]) => 
      Number.isFinite(lon) && Number.isFinite(lat) && Number.isFinite(alt) &&
      lon >= -180 && lon <= 180 && lat >= -85 && lat <= 85 &&
      alt >= -50000 && alt <= 500000
    );

    if (!allCoordsValid) {
      Logger.warn(`Invalid vertex coordinates for voxel ${voxelKey}, skipping edge polylines`);
      return polylineEntities;
    }

    // Cartesian3頂点の安全な作成
    let vertices;
    try {
      vertices = vertexCoords.map(([lon, lat, alt]) => 
        Cesium.Cartesian3.fromDegrees(lon, lat, alt)
      );
    } catch (error) {
      Logger.warn(`Failed to create Cartesian3 vertices for voxel ${voxelKey}:`, error);
      return polylineEntities;
    }

    // 作成された頂点の最終検証
    const validVertices = vertices.every(vertex => 
      vertex && Number.isFinite(vertex.x) && Number.isFinite(vertex.y) && Number.isFinite(vertex.z)
    );

    if (!validVertices) {
      Logger.warn(`Generated vertices contain invalid values for voxel ${voxelKey}, skipping edge polylines`);
      return polylineEntities;
    }

    // ボックスの12エッジを定義
    const edges = [
      // 下面の4エッジ
      [0, 1], [1, 2], [2, 3], [3, 0],
      // 上面の4エッジ
      [4, 5], [5, 6], [6, 7], [7, 4],
      // 垂直の4エッジ
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    // 各エッジをポリラインとして作成
    edges.forEach((edge, index) => {
      try {
        const vertex0 = vertices[edge[0]];
        const vertex1 = vertices[edge[1]];
        
        // 追加の安全性チェック
        if (!vertex0 || !vertex1) {
          Logger.warn(`Missing vertices for edge ${index} in voxel ${voxelKey}`);
          return;
        }

        const positions = [vertex0, vertex1];
        
        // positions配列の最終検証
        if (positions.length !== 2) {
          Logger.warn(`Invalid positions array length for edge ${index} in voxel ${voxelKey}`);
          return;
        }

        const polylineEntity = this.viewer.entities.add({
          polyline: {
            positions: positions,
            width: Math.max(Math.min(outlineWidth, 20), 1), // width制限も追加
            material: outlineColor,
            clampToGround: false
          },
          properties: {
            type: 'voxel-edge-polyline',
            parentKey: voxelKey,
            edgeIndex: index
          }
        });

        this.entities.push(polylineEntity);
        polylineEntities.push(polylineEntity);
        
      } catch (error) {
        Logger.warn(`Failed to create polyline for edge ${index} in voxel ${voxelKey}:`, error);
        // エラーが発生しても処理を継続（他のエッジは正常に作成される可能性がある）
      }
    });

    Logger.debug(`Created ${polylineEntities.length} edge polylines for voxel ${voxelKey}`);
    
    return polylineEntities;
  }

  /**
   * Create voxel description HTML
   * ボクセルの説明HTMLを生成
   * 
   * @param {Object} voxelInfo - Voxel information / ボクセル情報
   * @param {string} voxelKey - Voxel key / ボクセルキー
   * @returns {string} HTML description / HTML形式の説明文
   */
  createVoxelDescription(voxelInfo, voxelKey) {
    return `
      <div style="padding: 10px; font-family: Arial, sans-serif;">
        <h3 style="margin-top: 0;">ボクセル [${voxelInfo.x}, ${voxelInfo.y}, ${voxelInfo.z}]</h3>
        <table style="width: 100%;">
          <tr><td><b>エンティティ数:</b></td><td>${voxelInfo.count}</td></tr>
          <tr><td><b>ボクセルキー:</b></td><td>${voxelKey}</td></tr>
          <tr><td><b>座標:</b></td><td>X=${voxelInfo.x}, Y=${voxelInfo.y}, Z=${voxelInfo.z}</td></tr>
        </table>
        <p style="margin-bottom: 0;">
          <small>v0.1.11 GeometryRenderer</small>
        </p>
      </div>
    `;
  }

  /**
   * Check if inset outline should be applied
   * インセット枠線を適用すべきかどうかを判定
   * 
   * @param {boolean} isTopN - Is TopN voxel / TopNボクセルかどうか
   * @returns {boolean} Should apply inset outline / インセット枠線を適用する場合はtrue
   */
  shouldApplyInsetOutline(isTopN) {
    const mode = this.options.outlineInsetMode || 'all';
    switch (mode) {
      case 'topn':
        return isTopN;
      case 'all':
      default:
        return true;
      case 'none':
        return false;
    }
  }

  /**
   * Clear all managed entities
   * 管理対象の全エンティティをクリア
   */
  clear() {
    Logger.debug('GeometryRenderer.clear - Removing', this.entities.length, 'entities');
    
    this.entities.forEach(entity => {
      try {
        // entityとisDestroyedのチェックを安全に行う
        const isDestroyed = entity && typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
        
        if (entity && !isDestroyed) {
          this.viewer.entities.remove(entity);
        }
      } catch (error) {
        Logger.warn('Entity removal error:', error);
      }
    });
    
    this.entities = [];
  }

  /**
   * Render a debug bounding box for given bounds
   * 指定された境界のデバッグ用バウンディングボックスを描画
   * @param {Object} bounds - {minLon, maxLon, minLat, maxLat, minAlt, maxAlt}
   */
  renderBoundingBox(bounds) {
    if (!bounds) return;
    try {
      const centerLon = (bounds.minLon + bounds.maxLon) / 2;
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerAlt = (bounds.minAlt + bounds.maxAlt) / 2;

      const widthMeters = (bounds.maxLon - bounds.minLon) * 111000 * Math.cos(centerLat * Math.PI / 180);
      const depthMeters = (bounds.maxLat - bounds.minLat) * 111000;
      const heightMeters = bounds.maxAlt - bounds.minAlt;

      const boundingBox = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
        box: {
          dimensions: new Cesium.Cartesian3(widthMeters, depthMeters, heightMeters),
          material: Cesium.Color.YELLOW.withAlpha(0.1),
          outline: true,
          outlineColor: Cesium.Color.YELLOW.withAlpha(0.3),
          outlineWidth: 2
        },
        description: `Bounding Box<br>Size: ${widthMeters.toFixed(1)} x ${depthMeters.toFixed(1)} x ${heightMeters.toFixed(1)} m`
      });
      this.entities.push(boundingBox);
      Logger.debug('Debug bounding box added:', {
        center: { lon: centerLon, lat: centerLat, alt: centerAlt },
        size: { width: widthMeters, depth: depthMeters, height: heightMeters }
      });
    } catch (error) {
      Logger.warn('Failed to render bounding box:', error);
    }
  }

  /**
   * Get entity count
   * エンティティ数を取得
   * 
   * @returns {number} Number of managed entities / 管理対象エンティティ数
   */
  getEntityCount() {
    return this.entities.length;
  }

  /**
   * Update rendering options
   * 描画オプションを更新
   * 
   * @param {Object} newOptions - New options to merge / マージする新オプション
   */
  updateOptions(newOptions) {
    this.options = {
      ...this.options,
      ...newOptions
    };
    
    Logger.debug('GeometryRenderer options updated:', this.options);
  }

  /**
   * Get current configuration
   * 現在の設定を取得
   * 
   * @returns {Object} Current configuration / 現在の設定
   */
  getConfiguration() {
    return {
      ...this.options,
      entityCount: this.entities.length,
      version: '0.1.11',
      phase: 'ADR-0009 Phase 4'
    };
  }
}
