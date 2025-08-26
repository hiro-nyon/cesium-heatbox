/**
 * ボクセルの描画を担当するクラス
 * プロトタイプ実装ベース（シンプル・確実動作重視）
 */
import * as Cesium from 'cesium';
import { Logger } from '../utils/logger.js';

// v0.1.5: カラーマップ定義（256段階のLUTテーブル）
const COLOR_MAPS = {
  // Viridisカラーマップ（簡略化した16段階）
  viridis: [
    [68, 1, 84], [71, 44, 122], [59, 81, 139], [44, 113, 142],
    [33, 144, 141], [39, 173, 129], [92, 200, 99], [170, 220, 50],
    [253, 231, 37], [255, 255, 255], [255, 255, 255], [255, 255, 255],
    [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]
  ],
  // Infernoカラーマップ（簡略化した16段階）
  inferno: [
    [0, 0, 4], [31, 12, 72], [85, 15, 109], [136, 34, 106],
    [186, 54, 85], [227, 89, 51], [249, 142, 8], [252, 187, 17],
    [245, 219, 76], [252, 255, 164], [255, 255, 255], [255, 255, 255],
    [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]
  ],
  // 二極性配色（blue-white-red）
  diverging: [
    [0, 0, 255], [32, 64, 255], [64, 128, 255], [96, 160, 255],
    [128, 192, 255], [160, 224, 255], [192, 240, 255], [224, 248, 255],
    [255, 255, 255], [255, 248, 224], [255, 240, 192], [255, 224, 160],
    [255, 192, 128], [255, 160, 96], [255, 128, 64], [255, 64, 32], [255, 0, 0]
  ]
};

/**
 * 3Dボクセルの描画を担当するクラス
 */
export class VoxelRenderer {
  /**
   * コンストラクタ
   * @param {Cesium.Viewer} viewer - CesiumJS Viewer
   * @param {Object} options - 描画オプション
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = {
      minColor: [0, 0, 255],
      maxColor: [255, 0, 0],
      opacity: 0.8,
      emptyOpacity: 0.03,
      showOutline: true,
      showEmptyVoxels: false,
      wireframeOnly: false,    // 枠線のみ表示
      heightBased: false,      // 高さベース表現
      outlineWidth: 2,         // 枠線の太さ
      // v0.1.6.1: インセット枠線のデフォルト値
      outlineInset: 0,         // インセット枠線オフセット（メートル）
      outlineInsetMode: 'all', // インセット枠線適用範囲
      ...options
    };
    this.voxelEntities = [];
    
    Logger.debug('VoxelRenderer initialized with options:', this.options);
  }

  /**
   * ボクセルデータを描画（シンプル実装）
   * @param {Map} voxelData - ボクセルデータ
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   * @param {Object} statistics - 統計情報
   * @returns {number} 実際に描画されたボクセル数
   */
  render(voxelData, bounds, grid, statistics) {
    this.clear();
    Logger.debug('VoxelRenderer.render - Starting render with simplified approach', {
      voxelDataSize: voxelData.size,
      bounds,
      grid,
      statistics
    });

    // バウンディングボックスのデバッグ表示制御（v0.1.5: debug.showBounds対応）
    const shouldShowBounds = this._shouldShowBounds();
    if (shouldShowBounds) {
      this._renderBoundingBox(bounds);
    }

    // 表示するボクセルのリスト
    let displayVoxels = [];
    const topNVoxels = new Set(); // v0.1.5: TopN強調表示用

    // 空ボクセルのフィルタリング
    if (this.options.showEmptyVoxels) {
      // 全ボクセルを生成（これは上限値が大きいとメモリ消費とパフォーマンスに影響する）
      const maxVoxels = Math.min(grid.totalVoxels, this.options.maxRenderVoxels || 10000);
      Logger.debug(`Generating grid for up to ${maxVoxels} voxels`);
      
      // 空のボクセルも含めて全ボクセルを追加
      for (let x = 0; x < grid.numVoxelsX; x++) {
        for (let y = 0; y < grid.numVoxelsY; y++) {
          for (let z = 0; z < grid.numVoxelsZ; z++) {
            const voxelKey = `${x},${y},${z}`;
            const voxelInfo = voxelData.get(voxelKey) || { x, y, z, count: 0 };
            
            displayVoxels.push({
              key: voxelKey,
              info: voxelInfo
            });
            
            if (displayVoxels.length >= maxVoxels) {
              Logger.debug(`Reached maximum voxel limit of ${maxVoxels}`);
              break;
            }
          }
          if (displayVoxels.length >= maxVoxels) break;
        }
        if (displayVoxels.length >= maxVoxels) break;
      }
    } else {
      // データがあるボクセルのみ表示
      displayVoxels = Array.from(voxelData.entries()).map(([key, info]) => {
        return { key, info };
      });
      
      // 密度でソートして上位を表示
      if (this.options.maxRenderVoxels && displayVoxels.length > this.options.maxRenderVoxels) {
        displayVoxels.sort((a, b) => b.info.count - a.info.count);
        displayVoxels = displayVoxels.slice(0, this.options.maxRenderVoxels);
        Logger.debug(`Limited to ${displayVoxels.length} highest density voxels`);
      }
    }

    // v0.1.5: TopN強調表示の前処理
    if (this.options.highlightTopN && this.options.highlightTopN > 0) {
      const sortedForTopN = [...displayVoxels].sort((a, b) => b.info.count - a.info.count);
      const topN = sortedForTopN.slice(0, this.options.highlightTopN);
      topN.forEach(voxel => topNVoxels.add(voxel.key));
      Logger.debug(`TopN highlight enabled: ${topNVoxels.size} voxels will be highlighted`);
    }
    
    Logger.debug(`Rendering ${displayVoxels.length} voxels`);
    
    // レンダリングカウント
    let renderedCount = 0;

    // 実際にボクセルを描画
    displayVoxels.forEach(({ key, info }) => {
      try {
        const { x, y, z } = info;
        
        // ボクセル中心座標を計算（シンプルな方法）
        const centerLon = bounds.minLon + (x + 0.5) * (bounds.maxLon - bounds.minLon) / grid.numVoxelsX;
        const centerLat = bounds.minLat + (y + 0.5) * (bounds.maxLat - bounds.minLat) / grid.numVoxelsY;
        const centerAlt = bounds.minAlt + (z + 0.5) * (bounds.maxAlt - bounds.minAlt) / grid.numVoxelsZ;
        
        // 密度に応じた色を計算
        let color, opacity;
        const isTopN = topNVoxels.has(key); // v0.1.5: TopNハイライト判定
        
        if (info.count === 0) {
          // 空ボクセルの場合
          color = Cesium.Color.LIGHTGRAY;
          opacity = this.options.emptyOpacity;
        } else {
          // データありボクセルの場合
          const normalizedDensity = statistics.maxCount > statistics.minCount ? 
            (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
          
          color = this.interpolateColor(normalizedDensity, info.count);
          opacity = this.options.opacity;
          
          // v0.1.5: TopN強調表示で非TopNボクセルを淡色化
          if (this.options.highlightTopN && !isTopN) {
            opacity *= (1 - (this.options.highlightStyle?.boostOpacity || 0.2));
          }
        }
        
        // v0.1.6: ボクセル寸法計算（voxelGap対応）
        // 各軸のセルサイズ（グリッドが持つ実セルサイズを優先、なければvoxelSizeMetersにフォールバック）
        let cellSizeX = grid.cellSizeX || (grid.lonRangeMeters ? (grid.lonRangeMeters / grid.numVoxelsX) : grid.voxelSizeMeters);
        let cellSizeY = grid.cellSizeY || (grid.latRangeMeters ? (grid.latRangeMeters / grid.numVoxelsY) : grid.voxelSizeMeters);
        let baseCellSizeZ = grid.cellSizeZ || (grid.altRangeMeters ? Math.max(grid.altRangeMeters / Math.max(grid.numVoxelsZ, 1), 1) : Math.max(grid.voxelSizeMeters, 1));

        // v0.1.6: voxelGap による寸法縮小（枠線重なり対策）
        if (this.options.voxelGap > 0) {
          cellSizeX = Math.max(cellSizeX - this.options.voxelGap, cellSizeX * 0.1);
          cellSizeY = Math.max(cellSizeY - this.options.voxelGap, cellSizeY * 0.1);
          baseCellSizeZ = Math.max(baseCellSizeZ - this.options.voxelGap, baseCellSizeZ * 0.1);
        }

        let boxHeight = baseCellSizeZ;
        if (this.options.heightBased && info.count > 0) {
          const normalizedDensity = statistics.maxCount > statistics.minCount ? 
            (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
          boxHeight = baseCellSizeZ * (0.1 + normalizedDensity * 0.9); // 10%から100%の高さ
        }
        
        // v0.1.6: 動的枠線太さ制御
        let finalOutlineWidth;
        if (this.options.outlineWidthResolver && typeof this.options.outlineWidthResolver === 'function') {
          // outlineWidthResolver による動的制御
          const normalizedDensity = statistics.maxCount > statistics.minCount ? 
            (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
          const resolverParams = {
            voxel: { x, y, z, count: info.count },
            isTopN: isTopN,
            normalizedDensity: normalizedDensity
          };
          finalOutlineWidth = this.options.outlineWidthResolver(resolverParams);
        } else {
          // 従来の静的制御
          finalOutlineWidth = isTopN && this.options.highlightTopN ? 
            (this.options.highlightStyle?.outlineWidth || this.options.outlineWidth) : 
            this.options.outlineWidth;
        }

        // v0.1.6: 枠線透明度制御
        const finalOutlineOpacity = this.options.outlineOpacity ?? 1.0;
        const outlineColorWithOpacity = color.withAlpha(finalOutlineOpacity);

        // エンティティの設定
        const entityConfig = {
          position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
          box: {
            dimensions: new Cesium.Cartesian3(
              cellSizeX,
              cellSizeY,
              boxHeight
            ),
            outline: this.options.showOutline,
            outlineColor: outlineColorWithOpacity,
            outlineWidth: Math.max(finalOutlineWidth || 1, 0) // 負値防止
          },
          properties: {
            type: 'voxel',
            key: key,
            count: info.count,
            x: x,
            y: y,
            z: z
          },
          description: this.createVoxelDescription(info, key)
        };
        
        // v0.1.6+: WebGLの1px制限を回避する太線エミュレーション
        let emulateThickForThis = false;
        if (this.options.outlineEmulation === 'topn') {
          emulateThickForThis = isTopN && (finalOutlineWidth || 1) > 1;
        } else if (this.options.outlineEmulation === 'non-topn') {
          emulateThickForThis = !isTopN && (finalOutlineWidth || 1) > 1;
        } else if (this.options.outlineEmulation === 'all') {
          emulateThickForThis = (finalOutlineWidth || 1) > 1;
        }
        if (emulateThickForThis) {
          // 標準アウトラインは無効化（重複・チラつき回避）
          entityConfig.box.outline = false;
        }

        // wireframeOnlyモードの場合は透明、そうでなければ通常の材質
        if (this.options.wireframeOnly) {
          entityConfig.box.material = Cesium.Color.TRANSPARENT;
          entityConfig.box.fill = false;
        } else {
          entityConfig.box.material = color.withAlpha(opacity);
          entityConfig.box.fill = true;
        }
        
        // エンティティを作成
        const entity = this.viewer.entities.add(entityConfig);
        
        this.voxelEntities.push(entity);

        // v0.1.6.1: インセット枠線の実装（ADR-0004: 二重Box方式）
        if (this.options.outlineInset > 0 && this._shouldApplyInsetOutline(isTopN)) {
          try {
            this._createInsetOutline(
              centerLon, centerLat, centerAlt,
              cellSizeX, cellSizeY, boxHeight,
              outlineColorWithOpacity, Math.max(finalOutlineWidth || 1, 1),
              key
            );
          } catch (e) {
            Logger.warn('Failed to create inset outline:', e);
          }
        }
        
        // 太線エミュレーション（条件に応じてポリラインでエッジを追加）
        // 隣接枠線の被りを避けるため、外縁ではなく“インセット後”の寸法でエッジを描く
        if (emulateThickForThis) {
          try {
            const centerCart = entity.position.getValue(Cesium.JulianDate.now());

            const maxInsetX = cellSizeX * 0.2;
            const maxInsetY = cellSizeY * 0.2;
            const maxInsetZ = boxHeight * 0.2;
            const baseInset = (this.options.outlineInset && this.options.outlineInset > 0) ? this.options.outlineInset : 0;
            const autoInsetX = cellSizeX * 0.05;
            const autoInsetY = cellSizeY * 0.05;
            const autoInsetZ = boxHeight * 0.05;
            const effInsetX = Math.min(baseInset > 0 ? baseInset : autoInsetX, maxInsetX);
            const effInsetY = Math.min(baseInset > 0 ? baseInset : autoInsetY, maxInsetY);
            const effInsetZ = Math.min(baseInset > 0 ? baseInset : autoInsetZ, maxInsetZ);

            // 外縁とインセットの“中間”に相当する寸法（片側ぶんだけ縮める）
            const midSizeX = Math.max(cellSizeX - effInsetX, cellSizeX * 0.1);
            const midSizeY = Math.max(cellSizeY - effInsetY, cellSizeY * 0.1);
            const midSizeZ = Math.max(boxHeight - effInsetZ, boxHeight * 0.1);

            this._addEdgePolylines(
              centerCart,
              midSizeX,
              midSizeY,
              midSizeZ,
              outlineColorWithOpacity,
              Math.max(finalOutlineWidth, 1)
            );
          } catch (e) {
            Logger.warn('Failed to add emulated thick outline polylines:', e);
          }
        }
        renderedCount++;
      } catch (error) {
        Logger.warn('Error rendering voxel:', error);
      }
    });

    Logger.info(`Successfully rendered ${renderedCount} voxels`);
    
    // 実際に描画されたボクセル数を返す
    return renderedCount;
  }

  /**
   * バウンディングボックスを描画（デバッグ用）
   * @param {Object} bounds - 境界情報
   * @private
   */
  _renderBoundingBox(bounds) {
    if (!bounds) return;

    try {
      // 中心点
      const centerLon = (bounds.minLon + bounds.maxLon) / 2;
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerAlt = (bounds.minAlt + bounds.maxAlt) / 2;
      
      // サイズ計算（概算）
      const widthMeters = (bounds.maxLon - bounds.minLon) * 111000 * Math.cos(centerLat * Math.PI / 180);
      const depthMeters = (bounds.maxLat - bounds.minLat) * 111000;
      const heightMeters = bounds.maxAlt - bounds.minAlt;
      
      // 境界ボックスの作成
      const boundingBox = this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
        box: {
          dimensions: new Cesium.Cartesian3(widthMeters, depthMeters, heightMeters),
          material: Cesium.Color.YELLOW.withAlpha(0.1),
          outline: true,
          outlineColor: Cesium.Color.YELLOW.withAlpha(0.3),
          outlineWidth: 2
        },
        description: `バウンディングボックス<br>サイズ: ${widthMeters.toFixed(1)} x ${depthMeters.toFixed(1)} x ${heightMeters.toFixed(1)} m`
      });
      
      this.voxelEntities.push(boundingBox);
      
      Logger.debug('Debug bounding box added:', {
        center: { lon: centerLon, lat: centerLat, alt: centerAlt },
        size: { width: widthMeters, depth: depthMeters, height: heightMeters }
      });
      
    } catch (error) {
      Logger.warn('Failed to render bounding box:', error);
    }
  }

  /**
   * ボックスのエッジをポリラインで描画（太線エミュレーション）
   * @param {Cesium.Cartesian3} centerCart - ボックス中心
   * @param {number} sx - X寸法（m）
   * @param {number} sy - Y寸法（m）
   * @param {number} sz - Z寸法（m）
   * @param {Cesium.Color} color - 線色
   * @param {number} width - 線幅（px）
   * @private
   */
  _addEdgePolylines(centerCart, sx, sy, sz, color, width) {
    try {
      const halfX = sx / 2, halfY = sy / 2, halfZ = sz / 2;
      const enu = Cesium.Transforms.eastNorthUpToFixedFrame(centerCart);
      const toWorld = (dx, dy, dz) => {
        const local = new Cesium.Cartesian3(dx, dy, dz);
        return Cesium.Matrix4.multiplyByPoint(enu, local, new Cesium.Cartesian3());
      };
      const C = [
        toWorld(-halfX, -halfY, -halfZ),
        toWorld( halfX, -halfY, -halfZ),
        toWorld( halfX,  halfY, -halfZ),
        toWorld(-halfX,  halfY, -halfZ),
        toWorld(-halfX, -halfY,  halfZ),
        toWorld( halfX, -halfY,  halfZ),
        toWorld( halfX,  halfY,  halfZ),
        toWorld(-halfX,  halfY,  halfZ)
      ];
      const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      edges.forEach(([i, j]) => {
        const poly = this.viewer.entities.add({
          polyline: {
            positions: [C[i], C[j]],
            width: width,
            material: color,
            arcType: Cesium.ArcType.NONE
          }
        });
        this.voxelEntities.push(poly);
      });
    } catch (error) {
      Logger.warn('Edge polyline creation failed:', error);
    }
  }

  /**
   * 密度に基づいて色を補間（v0.1.5: カラーマップ対応）
   * @param {number} normalizedDensity - 正規化された密度 (0-1)
   * @param {number} [rawValue] - 生値（二極性配色用）
   * @returns {Cesium.Color} 計算された色
   */
  interpolateColor(normalizedDensity, rawValue = null) {
    // v0.1.5: 二極性配色対応（pivot<=0 の場合は安全にフォールバック）
    if (this.options.diverging && rawValue !== null) {
      const pivot = typeof this.options.divergingPivot === 'number' ? this.options.divergingPivot : 0;
      if (pivot > 0) {
        return this._interpolateDivergingColor(rawValue);
      }
      // pivot が 0 以下の場合は従来の補間にフォールバック
    }
    
    // v0.1.5: カラーマップ対応
    if (this.options.colorMap && this.options.colorMap !== 'custom') {
      return this._interpolateFromColorMap(normalizedDensity, this.options.colorMap);
    }
    
    // 従来のmin/max色補間（後方互換）
    const [minR, minG, minB] = this.options.minColor;
    const [maxR, maxG, maxB] = this.options.maxColor;
    
    const r = Math.round(minR + (maxR - minR) * normalizedDensity);
    const g = Math.round(minG + (maxG - minG) * normalizedDensity);
    const b = Math.round(minB + (maxB - minB) * normalizedDensity);
    
    return Cesium.Color.fromBytes(r, g, b);
  }
  
  /**
   * カラーマップから色を補間
   * @param {number} normalizedValue - 正規化された値 (0-1)
   * @param {string} colorMapName - カラーマップ名
   * @returns {Cesium.Color} 計算された色
   * @private
   */
  _interpolateFromColorMap(normalizedValue, colorMapName) {
    const colorMap = COLOR_MAPS[colorMapName];
    if (!colorMap) {
      Logger.warn(`Unknown color map: ${colorMapName}. Falling back to custom.`);
      return this.interpolateColor(normalizedValue);
    }
    
    // マップインデックスを計算
    const scaledValue = normalizedValue * (colorMap.length - 1);
    const lowerIndex = Math.floor(scaledValue);
    const upperIndex = Math.min(lowerIndex + 1, colorMap.length - 1);
    const fraction = scaledValue - lowerIndex;
    
    // 線形補間
    const [r1, g1, b1] = colorMap[lowerIndex];
    const [r2, g2, b2] = colorMap[upperIndex];
    
    const r = Math.round(r1 + (r2 - r1) * fraction);
    const g = Math.round(g1 + (g2 - g1) * fraction);
    const b = Math.round(b1 + (b2 - b1) * fraction);
    
    return Cesium.Color.fromBytes(r, g, b);
  }
  
  /**
   * 二極性配色（blue-white-red）で色を補間
   * @param {number} rawValue - 生値
   * @returns {Cesium.Color} 計算された色
   * @private
   */
  _interpolateDivergingColor(rawValue) {
    const pivot = this.options.divergingPivot || 0;
    
    // ピボットからの偏差を正規化
    let normalizedValue;
    if (rawValue <= pivot) {
      // 青い側 (0 to 0.5)
      normalizedValue = 0.5 * (rawValue / pivot);
      normalizedValue = Math.max(0, Math.min(0.5, normalizedValue));
    } else {
      // 赤い側 (0.5 to 1)
      normalizedValue = 0.5 + 0.5 * ((rawValue - pivot) / pivot);
      normalizedValue = Math.max(0.5, Math.min(1, normalizedValue));
    }
    
    return this._interpolateFromColorMap(normalizedValue, 'diverging');
  }

  /**
   * ボクセルの説明文を生成
   * @param {Object} voxelInfo - ボクセル情報
   * @param {string} voxelKey - ボクセルキー
   * @returns {string} HTML形式の説明文
   */
  createVoxelDescription(voxelInfo, voxelKey) {
    return `
      <div style="padding: 10px; font-family: Arial, sans-serif;">
        <h3 style="margin-top: 0;">ボクセル [${voxelInfo.x}, ${voxelInfo.y}, ${voxelInfo.z}]</h3>
        <table style="width: 100%;">
          <tr><td><b>エンティティ数:</b></td><td>${voxelInfo.count}</td></tr>
          <tr><td><b>ID:</b></td><td>${voxelKey}</td></tr>
        </table>
      </div>
    `;
  }

  /**
   * 描画されたエンティティを全てクリア
   */
  clear() {
    Logger.debug('VoxelRenderer.clear - Removing', this.voxelEntities.length, 'entities');
    
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
   * デバッグ境界ボックス表示の判定（v0.1.5: debug.showBounds対応）
   * @returns {boolean} 境界ボックスを表示する場合はtrue
   * @private
   */
  _shouldShowBounds() {
    if (!this.options.debug) {
      return false;
    }
    
    if (typeof this.options.debug === 'boolean') {
      // 従来の動作：debugがtrueの場合はバウンディングボックス表示
      return this.options.debug;
    }
    
    if (typeof this.options.debug === 'object' && this.options.debug !== null) {
      // 新しい動作：debug.showBoundsで明示的に制御
      return this.options.debug.showBounds === true;
    }
    
    return false;
  }

  /**
   * インセット枠線を適用すべきかどうかを判定（ADR-0004）
   * @param {boolean} isTopN - TopNボクセルかどうか
   * @returns {boolean} インセット枠線を適用する場合はtrue
   * @private
   */
  _shouldApplyInsetOutline(isTopN) {
    const mode = this.options.outlineInsetMode || 'all';
    switch (mode) {
      case 'topn':
        return isTopN;
      case 'all':
      default:
        return true;
    }
  }

  /**
   * インセット枠線用のセカンダリBoxエンティティを作成（ADR-0004）
   * @param {number} centerLon - 中心経度
   * @param {number} centerLat - 中心緯度  
   * @param {number} centerAlt - 中心高度
   * @param {number} baseSizeX - 基本サイズX
   * @param {number} baseSizeY - 基本サイズY
   * @param {number} baseSizeZ - 基本サイズZ
   * @param {Cesium.Color} outlineColor - 枠線色
   * @param {number} outlineWidth - 枠線太さ
   * @param {string} voxelKey - ボクセルキー
   * @private
   */
  _createInsetOutline(centerLon, centerLat, centerAlt, baseSizeX, baseSizeY, baseSizeZ, outlineColor, outlineWidth, voxelKey) {
    // インセット距離の適用（ADR-0004の境界条件：両側合計で各軸寸法の最大40%まで＝片側20%）
    // 片側20%までに制限することで、最終寸法は元の60%以上を保証する
    const maxInsetX = baseSizeX * 0.2;
    const maxInsetY = baseSizeY * 0.2;
    const maxInsetZ = baseSizeZ * 0.2;
    
    const effectiveInsetX = Math.min(this.options.outlineInset, maxInsetX);
    const effectiveInsetY = Math.min(this.options.outlineInset, maxInsetY);  
    const effectiveInsetZ = Math.min(this.options.outlineInset, maxInsetZ);
    
    // インセット後の寸法計算（各軸から2倍のインセットを引く）
    const insetSizeX = Math.max(baseSizeX - (effectiveInsetX * 2), baseSizeX * 0.1);
    const insetSizeY = Math.max(baseSizeY - (effectiveInsetY * 2), baseSizeY * 0.1);
    const insetSizeZ = Math.max(baseSizeZ - (effectiveInsetZ * 2), baseSizeZ * 0.1);
    
    // セカンダリBoxエンティティの設定（枠線のみ、塗りなし）
    const insetEntity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
      box: {
        dimensions: new Cesium.Cartesian3(insetSizeX, insetSizeY, insetSizeZ),
        fill: false,
        outline: true,
        outlineColor: outlineColor,
        outlineWidth: Math.max(outlineWidth || 1, 0)
      },
      properties: {
        type: 'voxel-inset-outline',
        parentKey: voxelKey,
        insetSize: { x: insetSizeX, y: insetSizeY, z: insetSizeZ }
      }
    });
    
    this.voxelEntities.push(insetEntity);
    
    // 枠線の厚み部分を視覚化（WebGL 1px制限の回避）
    if (this.options.enableThickFrames && (effectiveInsetX > 0.1 || effectiveInsetY > 0.1 || effectiveInsetZ > 0.1)) {
      this._createThickOutlineFrames(
        centerLon, centerLat, centerAlt,
        baseSizeX, baseSizeY, baseSizeZ,
        insetSizeX, insetSizeY, insetSizeZ,
        outlineColor, voxelKey
      );
    }
    
    Logger.debug(`Inset outline created for voxel ${voxelKey}:`, {
      originalSize: { x: baseSizeX, y: baseSizeY, z: baseSizeZ },
      insetSize: { x: insetSizeX, y: insetSizeY, z: insetSizeZ },
      effectiveInset: { x: effectiveInsetX, y: effectiveInsetY, z: effectiveInsetZ }
    });
  }

  /**
   * 枠線の厚み部分を視覚化するフレーム構造を作成
   * メインボックスとインセットボックスの間を12個のボックスで埋める
   * @param {number} centerLon - 中心経度
   * @param {number} centerLat - 中心緯度
   * @param {number} centerAlt - 中心高度
   * @param {number} outerX - 外側サイズX
   * @param {number} outerY - 外側サイズY
   * @param {number} outerZ - 外側サイズZ
   * @param {number} innerX - 内側サイズX
   * @param {number} innerY - 内側サイズY
   * @param {number} innerZ - 内側サイズZ
   * @param {Cesium.Color} frameColor - フレーム色
   * @param {string} voxelKey - ボクセルキー
   * @private
   */
  _createThickOutlineFrames(centerLon, centerLat, centerAlt, outerX, outerY, outerZ, innerX, innerY, innerZ, frameColor, voxelKey) {
    // フレーム厚み計算（各軸方向の差の半分）
    const frameThickX = (outerX - innerX) / 2;
    const frameThickY = (outerY - innerY) / 2;
    const frameThickZ = (outerZ - innerZ) / 2;
    
    // 基準位置（ボクセル中心）
    
    // 12個のフレームボックスを配置
    const frames = [
      // 上面の枠線（4つ）
      { pos: [0, frameThickY + innerY/2, outerZ/2], size: [innerX, frameThickY, frameThickZ], name: 'top-back' },
      { pos: [0, -frameThickY - innerY/2, outerZ/2], size: [innerX, frameThickY, frameThickZ], name: 'top-front' },
      { pos: [frameThickX + innerX/2, 0, outerZ/2], size: [frameThickX, outerY, frameThickZ], name: 'top-right' },
      { pos: [-frameThickX - innerX/2, 0, outerZ/2], size: [frameThickX, outerY, frameThickZ], name: 'top-left' },
      
      // 下面の枠線（4つ）
      { pos: [0, frameThickY + innerY/2, -outerZ/2], size: [innerX, frameThickY, frameThickZ], name: 'bottom-back' },
      { pos: [0, -frameThickY - innerY/2, -outerZ/2], size: [innerX, frameThickY, frameThickZ], name: 'bottom-front' },
      { pos: [frameThickX + innerX/2, 0, -outerZ/2], size: [frameThickX, outerY, frameThickZ], name: 'bottom-right' },
      { pos: [-frameThickX - innerX/2, 0, -outerZ/2], size: [frameThickX, outerY, frameThickZ], name: 'bottom-left' },
      
      // 縦の枠線（4つ）
      { pos: [frameThickX + innerX/2, frameThickY + innerY/2, 0], size: [frameThickX, frameThickY, innerZ], name: 'vertical-back-right' },
      { pos: [frameThickX + innerX/2, -frameThickY - innerY/2, 0], size: [frameThickX, frameThickY, innerZ], name: 'vertical-front-right' },
      { pos: [-frameThickX - innerX/2, frameThickY + innerY/2, 0], size: [frameThickX, frameThickY, innerZ], name: 'vertical-back-left' },
      { pos: [-frameThickX - innerX/2, -frameThickY - innerY/2, 0], size: [frameThickX, frameThickY, innerZ], name: 'vertical-front-left' }
    ];
    
    // 各フレームボックスを作成
    frames.forEach(frame => {
      if (frame.size[0] > 0.1 && frame.size[1] > 0.1 && frame.size[2] > 0.1) {
        try {
          // より正確な座標計算：経度・緯度・高度で直接オフセット
          const DEG_PER_METER_LON = 1 / (111000 * Math.cos(centerLat * Math.PI / 180));
          const DEG_PER_METER_LAT = 1 / 111000;
          
          const frameLon = centerLon + frame.pos[0] * DEG_PER_METER_LON;
          const frameLat = centerLat + frame.pos[1] * DEG_PER_METER_LAT;
          const frameAlt = centerAlt + frame.pos[2];
          
          const frameEntity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(frameLon, frameLat, frameAlt),
            box: {
              dimensions: new Cesium.Cartesian3(frame.size[0], frame.size[1], frame.size[2]),
              material: frameColor.withAlpha(0.8), // 少し透明度を下げて重なりを考慮
              outline: false, // 内部フレームには枠線なし
              fill: true
            },
            properties: {
              type: 'voxel-outline-frame',
              parentKey: voxelKey,
              frameName: frame.name
            }
          });
          
          this.voxelEntities.push(frameEntity);
        } catch (e) {
          Logger.warn(`Failed to create outline frame ${frame.name}:`, e);
        }
      }
    });
    
    Logger.debug(`Thick outline frames created for voxel ${voxelKey}: ${frames.length} frames`);
  }

  /**
   * 表示/非表示を切り替え
   * @param {boolean} show - 表示する場合はtrue
   */
  setVisible(show) {
    Logger.debug('VoxelRenderer.setVisible:', show);
    
    this.voxelEntities.forEach(entity => {
      try {
        // isDestroyedのチェックを安全に行う
        const isDestroyed = typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
        
        if (entity && !isDestroyed) {
          entity.show = show;
        }
      } catch (error) {
        Logger.warn('Entity visibility error:', error);
      }
    });
  }
}
