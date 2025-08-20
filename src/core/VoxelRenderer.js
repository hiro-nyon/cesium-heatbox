/**
 * ボクセルの描画を担当するクラス
 */
import * as Cesium from 'cesium';
import { CoordinateTransformer } from './CoordinateTransformer.js';
import { VoxelGrid } from './VoxelGrid.js';

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
      ...options
    };
    this.primitives = [];
  }

  /**
   * ボクセルデータを描画
   * @param {Map} voxelData - ボクセルデータ
   * @param {Object} bounds - 境界情報
   * @param {Object} grid - グリッド情報
   * @param {Object} statistics - 統計情報
   */
  render(voxelData, bounds, grid, statistics) {
    this.clear();

    const instances = [];
    const outlineInstances = [];

    // レンダリング上限: 非空ボクセルが上限を超える場合は高密度から描画
    let allowedKeys = null;
    if (voxelData.size > (this.options.maxRenderVoxels || Infinity)) {
      const sorted = Array.from(voxelData.values()).sort((a, b) => b.count - a.count);
      const top = sorted.slice(0, this.options.maxRenderVoxels);
      allowedKeys = new Set(top.map(v => VoxelGrid.getVoxelKey(v.x, v.y, v.z)));
    }

    VoxelGrid.iterateAllVoxels(grid, (x, y, z, key) => {
      const voxelInfo = voxelData.get(key);
      const hasData = !!voxelInfo;

      if (allowedKeys && (!hasData || !allowedKeys.has(key))) {
        return; // 上位N以外は描画しない、空ボクセルも描画しない
      }

      if (!hasData && !this.options.showEmptyVoxels) {
        return;
      }

      const centerCoord = CoordinateTransformer.voxelIndexToCoordinate(x, y, z, bounds, grid);
      const worldPosition = CoordinateTransformer.coordinateToCartesian3(centerCoord.lon, centerCoord.lat, centerCoord.alt);
      
      const dimensions = new Cesium.Cartesian3(grid.voxelSizeMeters, grid.voxelSizeMeters, grid.voxelSizeMeters);
      const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(worldPosition);

      let color, opacity;
      if (hasData) {
        const normalizedDensity = statistics.maxCount > statistics.minCount
          ? (voxelInfo.count - statistics.minCount) / (statistics.maxCount - statistics.minCount)
          : 0;
        color = this.interpolateColor(normalizedDensity);
        opacity = this.options.opacity;
      } else {
        color = Cesium.Color.LIGHTGRAY;
        opacity = this.options.emptyOpacity;
      }

      // ボクセル本体のインスタンス
      instances.push(new Cesium.GeometryInstance({
        geometry: new Cesium.BoxGeometry({ dimensions }),
        modelMatrix: modelMatrix,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(color.withAlpha(opacity))
        },
        id: {
          type: 'voxel',
          key: key,
          info: voxelInfo || { x, y, z, count: 0 }
        }
      }));

      // 境界線のインスタンス
      if (this.options.showOutline) {
        outlineInstances.push(new Cesium.GeometryInstance({
          geometry: new Cesium.BoxOutlineGeometry({ dimensions }),
          modelMatrix: modelMatrix,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(hasData ? color : Cesium.Color.DARKGRAY)
          }
        }));
      }
    });

    if (instances.length > 0) {
      const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance({
          translucent: true,
          closed: true
        }),
        asynchronous: false
      });
      this.viewer.scene.primitives.add(primitive);
      this.primitives.push(primitive);
    }

    if (outlineInstances.length > 0) {
      const outlinePrimitive = new Cesium.Primitive({
        geometryInstances: outlineInstances,
        appearance: new Cesium.PerInstanceColorAppearance({
          flat: true,
          translucent: false
        }),
        asynchronous: false
      });
      this.viewer.scene.primitives.add(outlinePrimitive);
      this.primitives.push(outlinePrimitive);
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
   * @returns {string} HTML形式の説明文
   */
  createVoxelDescription(voxelInfo) {
    return `
      <b>Voxel [${voxelInfo.x}, ${voxelInfo.y}, ${voxelInfo.z}]</b><br>
      Entity Count: ${voxelInfo.count}<br>
    `;
  }

  /**
   * 描画されたプリミティブを全てクリア
   */
  clear() {
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
}
