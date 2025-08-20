/**
 * v0.1.2 新機能デモ: wireframeOnly & heightBased
 * 視認性改善とデータ表現の多様化
 */
import Heatbox from '../../src/index.js';
import * as Cesium from 'cesium';

/**
 * 高度なヒートマップデモクラス
 */
export class WireframeHeightDemo {
  constructor(viewer) {
    this.viewer = viewer;
    this.heatboxes = [];
    this.testEntities = [];
  }

  /**
   * 複数の表示モードを同時に比較するデモ
   */
  async createComparisonDemo() {
    // テストデータを生成
    this.generateTestData();

    // 1. 従来の表示方式（比較用）
    const traditionalHeatbox = new Heatbox(this.viewer, {
      voxelSize: 25,
      opacity: 0.6,
      showOutline: true,
      wireframeOnly: false,
      heightBased: false,
      maxRenderVoxels: 200
    });

    // 2. 枠線のみ表示（視認性重視）
    const wireframeHeatbox = new Heatbox(this.viewer, {
      voxelSize: 25,
      opacity: 0.0,           // 本体は透明
      showOutline: true,
      wireframeOnly: true,    // 枠線のみ
      outlineWidth: 2,
      heightBased: false,
      maxRenderVoxels: 200
    });

    // 3. 高さベース表現（直感的理解）
    const heightBasedHeatbox = new Heatbox(this.viewer, {
      voxelSize: 25,
      opacity: 0.7,
      showOutline: true,
      wireframeOnly: false,
      heightBased: true,      // 高さで密度表現
      outlineWidth: 1,
      maxRenderVoxels: 200
    });

    // 4. 組み合わせ（最高の視認性）
    const combinedHeatbox = new Heatbox(this.viewer, {
      voxelSize: 25,
      opacity: 0.0,           // 本体透明
      showOutline: true,
      wireframeOnly: true,    // 枠線のみ
      heightBased: true,      // 高さベース
      outlineWidth: 3,        // 太い枠線
      maxRenderVoxels: 200
    });

    // 異なる位置に配置して比較
    const baseEntities = this.testEntities;
    
    // 1. 従来方式（左上）
    const traditionalEntities = this.offsetEntities(baseEntities, -0.002, 0.001);
    await traditionalHeatbox.createFromEntities(traditionalEntities);

    // 2. 枠線のみ（右上）
    const wireframeEntities = this.offsetEntities(baseEntities, 0.002, 0.001);
    await wireframeHeatbox.createFromEntities(wireframeEntities);

    // 3. 高さベース（左下）
    const heightEntities = this.offsetEntities(baseEntities, -0.002, -0.001);
    await heightBasedHeatbox.createFromEntities(heightEntities);

    // 4. 組み合わせ（右下）
    const combinedEntities = this.offsetEntities(baseEntities, 0.002, -0.001);
    await combinedHeatbox.createFromEntities(combinedEntities);

    this.heatboxes = [traditionalHeatbox, wireframeHeatbox, heightBasedHeatbox, combinedHeatbox];

    // ラベルを追加
    this.addComparisonLabels();

    return {
      traditional: traditionalHeatbox.getStatistics(),
      wireframe: wireframeHeatbox.getStatistics(),
      heightBased: heightBasedHeatbox.getStatistics(),
      combined: combinedHeatbox.getStatistics()
    };
  }

  /**
   * 密度レベル別の最適表示デモ
   */
  async createDensityOptimizedDemo() {
    this.generateDensityVariedData();

    // 高密度エリア用（枠線のみで視認性重視）
    const highDensityHeatbox = new Heatbox(this.viewer, {
      voxelSize: 15,
      wireframeOnly: true,
      outlineWidth: 2,
      maxRenderVoxels: 300,
      minColor: [255, 0, 0],  // 赤系
      maxColor: [255, 100, 0]
    });

    // 低密度エリア用（高さベースで差を強調）
    const lowDensityHeatbox = new Heatbox(this.viewer, {
      voxelSize: 30,
      wireframeOnly: false,
      heightBased: true,
      opacity: 0.8,
      maxRenderVoxels: 150,
      minColor: [0, 100, 255], // 青系
      maxColor: [0, 200, 255]
    });

    // 高密度・低密度データを分離
    const { highDensityEntities, lowDensityEntities } = this.separateByDensity(this.testEntities);

    await highDensityHeatbox.createFromEntities(highDensityEntities);
    await lowDensityHeatbox.createFromEntities(lowDensityEntities);

    this.heatboxes = [highDensityHeatbox, lowDensityHeatbox];

    return {
      highDensity: highDensityHeatbox.getStatistics(),
      lowDensity: lowDensityHeatbox.getStatistics()
    };
  }

  /**
   * インタラクティブな表示切り替えデモ
   */
  setupInteractiveDemo() {
    const heatbox = new Heatbox(this.viewer, {
      voxelSize: 20,
      opacity: 0.7,
      showOutline: true,
      wireframeOnly: false,
      heightBased: false,
      outlineWidth: 2,
      maxRenderVoxels: 250
    });

    // キーボードショートカットで表示切り替え
    document.addEventListener('keydown', async (event) => {
      switch (event.key) {
        case '1':
          // 従来表示
          await this.switchMode(heatbox, { wireframeOnly: false, heightBased: false });
          console.log('モード: 従来表示');
          break;
        case '2':
          // 枠線のみ
          await this.switchMode(heatbox, { wireframeOnly: true, heightBased: false });
          console.log('モード: 枠線のみ');
          break;
        case '3':
          // 高さベース
          await this.switchMode(heatbox, { wireframeOnly: false, heightBased: true });
          console.log('モード: 高さベース');
          break;
        case '4':
          // 組み合わせ
          await this.switchMode(heatbox, { wireframeOnly: true, heightBased: true });
          console.log('モード: 枠線+高さベース');
          break;
      }
    });

    return heatbox;
  }

  /**
   * テストデータ生成
   */
  generateTestData() {
    const bounds = {
      minLon: 139.765, maxLon: 139.770,
      minLat: 35.680, maxLat: 35.685,
      minAlt: 0, maxAlt: 100
    };

    this.testEntities = [];
    
    // クラスター状のデータを生成（密度の違いを作る）
    for (let cluster = 0; cluster < 3; cluster++) {
      const centerLon = bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon);
      const centerLat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
      
      const entityCount = 50 + Math.random() * 100; // クラスターごとに異なる密度
      
      for (let i = 0; i < entityCount; i++) {
        const lon = centerLon + (Math.random() - 0.5) * 0.001;
        const lat = centerLat + (Math.random() - 0.5) * 0.001;
        const alt = Math.random() * bounds.maxAlt;
        
        this.testEntities.push(this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
          point: {
            pixelSize: 3,
            color: Cesium.Color.YELLOW,
            heightReference: Cesium.HeightReference.NONE
          },
          properties: {
            cluster: cluster,
            density: entityCount
          }
        }));
      }
    }
  }

  /**
   * 密度の異なるデータを生成
   */
  generateDensityVariedData() {
    this.testEntities = [];
    
    // 高密度エリア
    this.addDensityCluster(139.766, 35.681, 200, 0.0005, 'high');
    
    // 低密度エリア
    this.addDensityCluster(139.768, 35.683, 50, 0.001, 'low');
  }

  /**
   * 密度クラスターを追加
   */
  addDensityCluster(centerLon, centerLat, count, spread, densityType) {
    for (let i = 0; i < count; i++) {
      const lon = centerLon + (Math.random() - 0.5) * spread;
      const lat = centerLat + (Math.random() - 0.5) * spread;
      const alt = Math.random() * 80;
      
      this.testEntities.push(this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        point: {
          pixelSize: densityType === 'high' ? 2 : 4,
          color: densityType === 'high' ? Cesium.Color.RED : Cesium.Color.BLUE
        },
        properties: {
          densityType: densityType
        }
      }));
    }
  }

  /**
   * エンティティの位置をオフセット
   */
  offsetEntities(entities, lonOffset, latOffset) {
    return entities.map(entity => {
      const originalPos = entity.position.getValue(Cesium.JulianDate.now());
      const cartographic = Cesium.Cartographic.fromCartesian(originalPos);
      
      const newLon = Cesium.Math.toDegrees(cartographic.longitude) + lonOffset;
      const newLat = Cesium.Math.toDegrees(cartographic.latitude) + latOffset;
      const newAlt = cartographic.height;
      
      return this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(newLon, newLat, newAlt),
        point: entity.point,
        properties: entity.properties
      });
    });
  }

  /**
   * 密度による分離
   */
  separateByDensity(entities) {
    const highDensityEntities = [];
    const lowDensityEntities = [];
    
    entities.forEach(entity => {
      if (entity.properties && entity.properties.densityType) {
        const densityType = entity.properties.densityType.getValue();
        if (densityType === 'high') {
          highDensityEntities.push(entity);
        } else {
          lowDensityEntities.push(entity);
        }
      }
    });
    
    return { highDensityEntities, lowDensityEntities };
  }

  /**
   * 表示モード切り替え
   */
  async switchMode(heatbox, newOptions) {
    const currentEntities = this.testEntities;
    heatbox.clear();
    
    // 新しいオプションでヒートボックスを再作成
    const newHeatbox = new Heatbox(this.viewer, {
      ...heatbox.getOptions(),
      ...newOptions
    });
    
    await newHeatbox.createFromEntities(currentEntities);
    return newHeatbox;
  }

  /**
   * 比較ラベルを追加
   */
  addComparisonLabels() {
    const labels = [
      { text: '従来表示', lon: 139.763, lat: 35.682 },
      { text: '枠線のみ', lon: 139.772, lat: 35.682 },
      { text: '高さベース', lon: 139.763, lat: 35.679 },
      { text: '組み合わせ', lon: 139.772, lat: 35.679 }
    ];

    labels.forEach(label => {
      this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(label.lon, label.lat, 120),
        label: {
          text: label.text,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10)
        }
      });
    });
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.heatboxes.forEach(heatbox => heatbox.clear());
    this.viewer.entities.removeAll();
    this.heatboxes = [];
    this.testEntities = [];
  }
}

// 使用例
/*
const demo = new WireframeHeightDemo(viewer);

// 比較デモ実行
const comparisonStats = await demo.createComparisonDemo();
console.log('比較デモ統計:', comparisonStats);

// 密度最適化デモ実行
// demo.cleanup();
// const densityStats = await demo.createDensityOptimizedDemo();
// console.log('密度最適化デモ統計:', densityStats);

// インタラクティブデモ（キー1-4で切り替え）
// const interactiveHeatbox = demo.setupInteractiveDemo();
*/
