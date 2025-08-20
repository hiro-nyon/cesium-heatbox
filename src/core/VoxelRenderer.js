/**
 * ボクセルの描画を担当するクラス
 * プロトタイプ実装ベース（シンプル・確実動作重視）
 */
import * as Cesium from 'cesium';

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
      ...options
    };
    this.voxelEntities = [];
    
    // eslint-disable-next-line no-console
    console.log('VoxelRenderer initialized with options:', this.options);
  }

  /**
   * ボクセルデータを描画（シンプル実装）
   * @param {Map} voxelData - ボクセルデータ
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   * @param {Object} statistics - 統計情報
   */
  render(voxelData, bounds, grid, statistics) {
    this.clear();
    // eslint-disable-next-line no-console
    console.log('VoxelRenderer.render - Starting render with simplified approach', {
      voxelDataSize: voxelData.size,
      bounds,
      grid,
      statistics
    });

    // バウンディングボックスのデバッグ表示
    this._renderBoundingBox(bounds);

    // 表示するボクセルのリスト
    let displayVoxels = [];

    // 空ボクセルのフィルタリング
    if (this.options.showEmptyVoxels) {
      // 全ボクセルを生成（これは上限値が大きいとメモリ消費とパフォーマンスに影響する）
      const maxVoxels = Math.min(grid.totalVoxels, this.options.maxRenderVoxels || 10000);
      // eslint-disable-next-line no-console
      console.log(`Generating grid for up to ${maxVoxels} voxels`);
      
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
              // eslint-disable-next-line no-console
              console.log(`Reached maximum voxel limit of ${maxVoxels}`);
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
        // eslint-disable-next-line no-console
        console.log(`Limited to ${displayVoxels.length} highest density voxels`);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`Rendering ${displayVoxels.length} voxels`);
    
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
        if (info.count === 0) {
          // 空ボクセルの場合
          color = Cesium.Color.LIGHTGRAY;
          opacity = this.options.emptyOpacity;
        } else {
          // データありボクセルの場合
          const normalizedDensity = statistics.maxCount > statistics.minCount ? 
            (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
          
          color = this.interpolateColor(normalizedDensity);
          opacity = this.options.opacity;
        }
        
        // 高さベース表現の場合、ボクセルの高さを密度に応じて調整
        let boxHeight = grid.voxelSizeMeters;
        if (this.options.heightBased && info.count > 0) {
          const normalizedDensity = statistics.maxCount > statistics.minCount ? 
            (info.count - statistics.minCount) / (statistics.maxCount - statistics.minCount) : 0;
          boxHeight = grid.voxelSizeMeters * (0.1 + normalizedDensity * 0.9); // 10%から100%の高さ
        }
        
        // エンティティの設定
        const entityConfig = {
          position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, centerAlt),
          box: {
            dimensions: new Cesium.Cartesian3(
              grid.voxelSizeMeters,
              grid.voxelSizeMeters,
              boxHeight
            ),
            outline: this.options.showOutline,
            outlineColor: color.withAlpha(1.0),
            outlineWidth: this.options.outlineWidth
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
        renderedCount++;
      } catch (error) {
        console.warn('Error rendering voxel:', error);
      }
    });

    // eslint-disable-next-line no-console
    console.log(`Successfully rendered ${renderedCount} voxels`);
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
      
      // eslint-disable-next-line no-console
      console.log('Debug bounding box added:', {
        center: { lon: centerLon, lat: centerLat, alt: centerAlt },
        size: { width: widthMeters, depth: depthMeters, height: heightMeters }
      });
      
    } catch (error) {
      console.warn('Failed to render bounding box:', error);
    }
  }

  /**
   * 密度に基づいて色を補間
   * @param {number} normalizedDensity - 正規化された密度 (0-1)
   * @returns {Cesium.Color} 計算された色
   */
  interpolateColor(normalizedDensity) {
    const [minR, minG, minB] = this.options.minColor;
    const [maxR, maxG, maxB] = this.options.maxColor;
    
    const r = Math.round(minR + (maxR - minR) * normalizedDensity);
    const g = Math.round(minG + (maxG - minG) * normalizedDensity);
    const b = Math.round(minB + (maxB - minB) * normalizedDensity);
    
    return Cesium.Color.fromBytes(r, g, b);
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
    // eslint-disable-next-line no-console
    console.log('VoxelRenderer.clear - Removing', this.voxelEntities.length, 'entities');
    
    this.voxelEntities.forEach(entity => {
      try {
        // isDestroyedのチェックを安全に行う
        const isDestroyed = typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
        
        if (entity && !isDestroyed) {
          this.viewer.entities.remove(entity);
        }
      } catch (error) {
        console.warn('Entity removal error:', error);
      }
    });
    
    this.voxelEntities = [];
  }

  /**
   * 表示/非表示を切り替え
   * @param {boolean} show - 表示する場合はtrue
   */
  setVisible(show) {
    // eslint-disable-next-line no-console
    console.log('VoxelRenderer.setVisible:', show);
    
    this.voxelEntities.forEach(entity => {
      try {
        // isDestroyedのチェックを安全に行う
        const isDestroyed = typeof entity.isDestroyed === 'function' ? entity.isDestroyed() : false;
        
        if (entity && !isDestroyed) {
          entity.show = show;
        }
      } catch (error) {
        console.warn('Entity visibility error:', error);
      }
    });
  }
}