/**
 * ボクセルの描画を担当するクラス
 */

import { CoordinateTransformer } from './CoordinateTransformer.js';
import { VoxelGrid } from './VoxelGrid.js';
import { COLOR_CONSTANTS } from '../utils/constants.js';

/**
 * 3Dボクセルの描画を担当するクラス
 */
export class VoxelRenderer {
  /**
   * コンストラクタ
   * @param {Object} viewer - CesiumJS Viewer
   * @param {Object} options - 描画オプション
   */
  constructor(viewer, options) {
    this.viewer = viewer;
    this.options = options;
    this.primitives = [];
    this.statistics = null;
  }
  
  /**
   * ボクセルデータを描画
   * @param {Map} voxelData - ボクセルデータ
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   * @param {Object} statistics - 統計情報
   */
  renderVoxels(voxelData, bounds, grid, statistics) {
    this.statistics = statistics;
    this.clearPrimitives();
    
    // 空ボクセルの描画
    if (this.options.showEmptyVoxels) {
      this.renderEmptyVoxels(voxelData, bounds, grid);
    }
    
    // データボクセルの描画
    this.renderDataVoxels(voxelData, bounds, grid);
    
    // 統計情報の更新
    this.updateStatistics(voxelData);
  }
  
  /**
   * データボクセルを描画
   * @param {Map} voxelData - ボクセルデータ
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   */
  renderDataVoxels(voxelData, bounds, grid) {
    const instances = [];
    const { minCount, maxCount } = this.statistics;
    
    // 描画制限のチェック
    let renderCount = 0;
    const maxRender = this.options.maxRenderVoxels;
    
    // 密度の高いボクセルから優先的に描画
    const sortedVoxels = Array.from(voxelData.values())
      .sort((a, b) => b.count - a.count);
    
    for (const voxel of sortedVoxels) {
      if (renderCount >= maxRender) {
        console.warn(`描画制限により${maxRender}個のボクセルのみ表示`);
        break;
      }
      
      // ボクセルの中心位置を計算
      const centerCoord = CoordinateTransformer.voxelIndexToCoordinate(
        voxel.x, voxel.y, voxel.z, bounds, grid
      );
      
      const worldPosition = CoordinateTransformer.coordinateToCartesian3(
        centerCoord.lon, centerCoord.lat, centerCoord.alt
      );
      
      // 密度に基づく色の計算
      const color = this.calculateColor(voxel.count, minCount, maxCount);
      
      // GeometryInstance作成
      const instance = new Cesium.GeometryInstance({
        geometry: new Cesium.BoxGeometry({
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
          dimensions: new Cesium.Cartesian3(
            grid.voxelSizeMeters,
            grid.voxelSizeMeters,
            grid.voxelSizeMeters
          )
        }),
        modelMatrix: Cesium.Matrix4.multiplyByTranslation(
          Cesium.Transforms.eastNorthUpToFixedFrame(worldPosition),
          new Cesium.Cartesian3(0, 0, grid.voxelSizeMeters / 2),
          new Cesium.Matrix4()
        ),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            color.withAlpha(this.options.opacity)
          )
        },
        id: VoxelGrid.getVoxelKey(voxel.x, voxel.y, voxel.z)
      });
      
      instances.push(instance);
      renderCount++;
    }
    
    if (instances.length > 0) {
      // Primitive作成（バッチ描画）
      const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance({
          closed: true,
          translucent: this.options.opacity < 1.0
        }),
        allowPicking: true
      });
      
      this.viewer.scene.primitives.add(primitive);
      this.primitives.push(primitive);
    }
  }
  
  /**
   * 空ボクセルを描画
   * @param {Map} voxelData - ボクセルデータ
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   */
  renderEmptyVoxels(voxelData, bounds, grid) {
    const instances = [];
    const emptyColor = Cesium.Color.LIGHTGRAY;
    
    let renderCount = 0;
    const maxEmptyRender = Math.min(10000, this.options.maxRenderVoxels / 2);
    
    // 全ボクセルを反復処理して空ボクセルを見つける
    VoxelGrid.iterateAllVoxels(grid, (x, y, z, key) => {
      if (renderCount >= maxEmptyRender) {
        return;
      }
      
      if (!voxelData.has(key)) {
        // 空ボクセルの描画
        const centerCoord = CoordinateTransformer.voxelIndexToCoordinate(
          x, y, z, bounds, grid
        );
        
        const worldPosition = CoordinateTransformer.coordinateToCartesian3(
          centerCoord.lon, centerCoord.lat, centerCoord.alt
        );
        
        const instance = new Cesium.GeometryInstance({
          geometry: new Cesium.BoxGeometry({
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
            dimensions: new Cesium.Cartesian3(
              grid.voxelSizeMeters,
              grid.voxelSizeMeters,
              grid.voxelSizeMeters
            )
          }),
          modelMatrix: Cesium.Matrix4.multiplyByTranslation(
            Cesium.Transforms.eastNorthUpToFixedFrame(worldPosition),
            new Cesium.Cartesian3(0, 0, grid.voxelSizeMeters / 2),
            new Cesium.Matrix4()
          ),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              emptyColor.withAlpha(this.options.emptyOpacity)
            )
          },
          id: `empty-${key}`
        });
        
        instances.push(instance);
        renderCount++;
      }
    });
    
    if (instances.length > 0) {
      const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance({
          closed: true,
          translucent: true
        }),
        allowPicking: true
      });
      
      this.viewer.scene.primitives.add(primitive);
      this.primitives.push(primitive);
    }
  }
  
  /**
   * 密度に基づいて色を計算
   * @param {number} count - エンティティ数
   * @param {number} minCount - 最小エンティティ数
   * @param {number} maxCount - 最大エンティティ数
   * @returns {Cesium.Color} 計算された色
   */
  calculateColor(count, minCount, maxCount) {
    if (maxCount === minCount) {
      // 密度が同じ場合は中間色
      return Cesium.Color.fromRgb(
        this.options.minColor[0],
        this.options.minColor[1],
        this.options.minColor[2]
      );
    }
    
    // 正規化された密度（0-1の範囲）
    const normalizedDensity = (count - minCount) / (maxCount - minCount);
    
    // HSV補間による色計算
    const hue = COLOR_CONSTANTS.MIN_HUE + 
                normalizedDensity * (COLOR_CONSTANTS.MAX_HUE - COLOR_CONSTANTS.MIN_HUE);
    const saturation = COLOR_CONSTANTS.SATURATION + 
                      normalizedDensity * COLOR_CONSTANTS.SATURATION_RANGE;
    const brightness = COLOR_CONSTANTS.BRIGHTNESS + 
                      normalizedDensity * COLOR_CONSTANTS.BRIGHTNESS_RANGE;
    
    return Cesium.Color.fromHsl(hue / 360, saturation, brightness);
  }
  
  /**
   * 描画されたプリミティブをクリア
   */
  clearPrimitives() {
    for (const primitive of this.primitives) {
      this.viewer.scene.primitives.remove(primitive);
    }
    this.primitives = [];
  }
  
  /**
   * 表示/非表示を切り替え
   * @param {boolean} show - 表示する場合はtrue
   */
  setVisible(show) {
    for (const primitive of this.primitives) {
      primitive.show = show;
    }
  }
  
  /**
   * 統計情報を更新
   * @param {Map} voxelData - ボクセルデータ
   */
  updateStatistics(voxelData) {
    if (this.statistics) {
      // 実際に描画されたボクセル数を更新
      this.statistics.renderedVoxels = Math.min(
        voxelData.size,
        this.options.maxRenderVoxels
      );
    }
  }
}
