/**
 * パフォーマンス最適化の高度な例
 * v0.1.2の新機能を活用した効率的な大量データ処理
 */
import Heatbox from '../../src/index.js';
import * as Cesium from 'cesium';

/**
 * パフォーマンス最適化デモクラス
 */
export class PerformanceOptimizationDemo {
  constructor(viewer) {
    this.viewer = viewer;
    this.performanceMetrics = {};
  }

  /**
   * 大量データの段階的ロードと表示最適化
   */
  async demonstrateProgressiveLoading() {
    console.log('=== 段階的ローディングデモ開始 ===');
    
    // 大量のテストデータを生成（10,000エンティティ）
    const allEntities = this.generateLargeDataset(10000);
    
    // 段階1: 粗い解像度で全体像を把握
    const coarseHeatbox = new Heatbox(this.viewer, {
      voxelSize: 100,           // 大きなボクセル
      wireframeOnly: true,      // 枠線のみで軽量
      maxRenderVoxels: 50,      // 少ない描画数
      showEmptyVoxels: false
    });
    
    const startTime1 = performance.now();
    const coarseStats = await coarseHeatbox.createFromEntities(allEntities);
    const endTime1 = performance.now();
    
    console.log(`段階1 (粗い解像度): ${endTime1 - startTime1}ms`);
    console.log('粗い統計:', coarseStats);
    
    // 2秒待機してから次の段階
    await this.delay(2000);
    
    // 段階2: 中程度の解像度
    coarseHeatbox.clear();
    const mediumHeatbox = new Heatbox(this.viewer, {
      voxelSize: 50,            // 中程度のボクセル
      wireframeOnly: true,      // 枠線のみ
      maxRenderVoxels: 150,     // 中程度の描画数
      outlineWidth: 2
    });
    
    const startTime2 = performance.now();
    const mediumStats = await mediumHeatbox.createFromEntities(allEntities);
    const endTime2 = performance.now();
    
    console.log(`段階2 (中解像度): ${endTime2 - startTime2}ms`);
    console.log('中解像度統計:', mediumStats);
    
    await this.delay(2000);
    
    // 段階3: 高解像度（関心領域のみ）
    mediumHeatbox.clear();
    const highDensityEntities = this.filterHighDensityArea(allEntities, coarseStats);
    
    const fineHeatbox = new Heatbox(this.viewer, {
      voxelSize: 25,            // 細かいボクセル
      wireframeOnly: false,     // 通常表示
      heightBased: true,        // 高さベースで詳細表現
      maxRenderVoxels: 300,     // 多めの描画数
      opacity: 0.7
    });
    
    const startTime3 = performance.now();
    const fineStats = await fineHeatbox.createFromEntities(highDensityEntities);
    const endTime3 = performance.now();
    
    console.log(`段階3 (高解像度): ${endTime3 - startTime3}ms`);
    console.log('高解像度統計:', fineStats);
    
    this.performanceMetrics.progressiveLoading = {
      coarse: { time: endTime1 - startTime1, entities: allEntities.length },
      medium: { time: endTime2 - startTime2, entities: allEntities.length },
      fine: { time: endTime3 - startTime3, entities: highDensityEntities.length }
    };
    
    return fineHeatbox;
  }

  /**
   * 適応的品質調整デモ
   */
  async demonstrateAdaptiveQuality() {
    console.log('=== 適応的品質調整デモ開始 ===');
    
    const testSizes = [1000, 5000, 10000, 20000];
    const results = [];
    
    for (const size of testSizes) {
      const entities = this.generateLargeDataset(size);
      
      // データサイズに応じて設定を調整
      const adaptiveConfig = this.calculateAdaptiveConfig(size);
      
      const heatbox = new Heatbox(this.viewer, adaptiveConfig);
      
      const startTime = performance.now();
      const stats = await heatbox.createFromEntities(entities);
      const endTime = performance.now();
      
      const result = {
        entityCount: size,
        processingTime: endTime - startTime,
        config: adaptiveConfig,
        renderedVoxels: stats.nonEmptyVoxels,
        performance: this.calculatePerformanceScore(endTime - startTime, size)
      };
      
      results.push(result);
      console.log(`${size}エンティティ: ${result.processingTime.toFixed(1)}ms, スコア: ${result.performance.toFixed(2)}`);
      
      heatbox.clear();
      await this.delay(500);
    }
    
    this.performanceMetrics.adaptiveQuality = results;
    return results;
  }

  /**
   * メモリ使用量最適化デモ
   */
  async demonstrateMemoryOptimization() {
    console.log('=== メモリ最適化デモ開始 ===');
    
    const entities = this.generateLargeDataset(15000);
    
    // メモリ使用量測定（概算）
    const measureMemory = () => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
        };
      }
      return { used: 'N/A', total: 'N/A' };
    };
    
    const beforeMemory = measureMemory();
    console.log('処理前メモリ:', beforeMemory);
    
    // 最適化設定1: 枠線のみ（メモリ効率重視）
    const memoryOptimizedHeatbox = new Heatbox(this.viewer, {
      voxelSize: 40,
      wireframeOnly: true,      // エンティティ数削減
      maxRenderVoxels: 100,     // 描画数制限
      showEmptyVoxels: false,   // 空ボクセル非表示
      outlineWidth: 1
    });
    
    const startTime = performance.now();
    const stats = await memoryOptimizedHeatbox.createFromEntities(entities);
    const endTime = performance.now();
    
    const afterMemory = measureMemory();
    console.log('処理後メモリ:', afterMemory);
    console.log(`処理時間: ${endTime - startTime}ms`);
    console.log('統計:', stats);
    
    // メモリ使用量の差分
    const memoryDiff = typeof afterMemory.used === 'number' ? 
      afterMemory.used - beforeMemory.used : 'N/A';
    
    this.performanceMetrics.memoryOptimization = {
      beforeMemory,
      afterMemory,
      memoryDiff,
      processingTime: endTime - startTime,
      entitiesProcessed: entities.length,
      voxelsRendered: stats.nonEmptyVoxels
    };
    
    return memoryOptimizedHeatbox;
  }

  /**
   * リアルタイム更新パフォーマンステスト
   */
  async demonstrateRealTimeUpdates() {
    console.log('=== リアルタイム更新デモ開始 ===');
    
    let entities = this.generateLargeDataset(2000);
    
    const realtimeHeatbox = new Heatbox(this.viewer, {
      voxelSize: 30,
      wireframeOnly: true,      // 更新速度重視
      maxRenderVoxels: 200,
      outlineWidth: 2
    });
    
    // 初期表示
    await realtimeHeatbox.createFromEntities(entities);
    
    const updateTimes = [];
    const updateCount = 10;
    
    // 定期的にデータを更新
    for (let i = 0; i < updateCount; i++) {
      await this.delay(1000);
      
      // データを部分的に更新
      entities = this.updateEntitiesPartially(entities, 0.2); // 20%を更新
      
      const startTime = performance.now();
      realtimeHeatbox.clear();
      await realtimeHeatbox.createFromEntities(entities);
      const endTime = performance.now();
      
      const updateTime = endTime - startTime;
      updateTimes.push(updateTime);
      
      console.log(`更新 ${i + 1}/${updateCount}: ${updateTime.toFixed(1)}ms`);
    }
    
    const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
    
    this.performanceMetrics.realtimeUpdates = {
      updateTimes,
      averageUpdateTime: avgUpdateTime,
      entityCount: entities.length,
      updateCount
    };
    
    console.log(`平均更新時間: ${avgUpdateTime.toFixed(1)}ms`);
    
    return realtimeHeatbox;
  }

  /**
   * 大量データセット生成
   */
  generateLargeDataset(count) {
    const entities = [];
    const bounds = {
      minLon: 139.760, maxLon: 139.780,
      minLat: 35.675, maxLat: 35.695,
      minAlt: 0, maxAlt: 200
    };
    
    // クラスター化されたデータを生成（現実的なパターン）
    const clusterCount = Math.max(3, Math.floor(count / 1000));
    const entitiesPerCluster = Math.floor(count / clusterCount);
    
    for (let cluster = 0; cluster < clusterCount; cluster++) {
      const centerLon = bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon);
      const centerLat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
      const clusterSize = 0.001 + Math.random() * 0.002; // クラスターサイズ
      
      for (let i = 0; i < entitiesPerCluster; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.sqrt(Math.random()) * clusterSize;
        
        const lon = centerLon + Math.cos(angle) * distance;
        const lat = centerLat + Math.sin(angle) * distance;
        const alt = Math.random() * bounds.maxAlt;
        
        entities.push(this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
          point: {
            pixelSize: 2,
            color: Cesium.Color.fromRandom({ alpha: 0.8 }),
            heightReference: Cesium.HeightReference.NONE
          },
          properties: {
            cluster: cluster,
            timestamp: Date.now()
          }
        }));
      }
    }
    
    return entities;
  }

  /**
   * データサイズに応じた適応的設定計算
   */
  calculateAdaptiveConfig(entityCount) {
    if (entityCount < 2000) {
      // 小規模: 高品質
      return {
        voxelSize: 20,
        wireframeOnly: false,
        heightBased: true,
        maxRenderVoxels: 500,
        opacity: 0.8
      };
    } else if (entityCount < 8000) {
      // 中規模: バランス
      return {
        voxelSize: 30,
        wireframeOnly: true,
        heightBased: false,
        maxRenderVoxels: 300,
        outlineWidth: 2
      };
    } else {
      // 大規模: パフォーマンス重視
      return {
        voxelSize: 50,
        wireframeOnly: true,
        heightBased: false,
        maxRenderVoxels: 150,
        outlineWidth: 1
      };
    }
  }

  /**
   * パフォーマンススコア計算
   */
  calculatePerformanceScore(processingTime, entityCount) {
    // エンティティあたりの処理時間（ms）の逆数
    const entityPerMs = entityCount / processingTime;
    return Math.min(100, entityPerMs * 10); // 0-100のスコア
  }

  /**
   * 高密度エリアのフィルタリング
   */
  filterHighDensityArea(entities, stats) {
    // 実装を簡略化: 中央付近のエンティティを返す
    const centerLon = 139.770;
    const centerLat = 35.685;
    const radius = 0.003;
    
    return entities.filter(entity => {
      const position = entity.position.getValue(Cesium.JulianDate.now());
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      
      const distance = Math.sqrt(
        Math.pow(lon - centerLon, 2) + Math.pow(lat - centerLat, 2)
      );
      
      return distance < radius;
    });
  }

  /**
   * エンティティの部分更新
   */
  updateEntitiesPartially(entities, updateRatio) {
    const updateCount = Math.floor(entities.length * updateRatio);
    
    for (let i = 0; i < updateCount; i++) {
      const randomIndex = Math.floor(Math.random() * entities.length);
      const entity = entities[randomIndex];
      
      // 位置を少し変更
      const currentPos = entity.position.getValue(Cesium.JulianDate.now());
      const cartographic = Cesium.Cartographic.fromCartesian(currentPos);
      
      const newLon = Cesium.Math.toDegrees(cartographic.longitude) + 
        (Math.random() - 0.5) * 0.0001;
      const newLat = Cesium.Math.toDegrees(cartographic.latitude) + 
        (Math.random() - 0.5) * 0.0001;
      
      entity.position = Cesium.Cartesian3.fromDegrees(newLon, newLat, cartographic.height);
    }
    
    return entities;
  }

  /**
   * 遅延ヘルパー
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * パフォーマンスレポート生成
   */
  generatePerformanceReport() {
    console.log('=== パフォーマンスレポート ===');
    console.log(JSON.stringify(this.performanceMetrics, null, 2));
    
    return this.performanceMetrics;
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.viewer.entities.removeAll();
    this.performanceMetrics = {};
  }
}

// 使用例
/*
const perfDemo = new PerformanceOptimizationDemo(viewer);

// 段階的ローディングテスト
await perfDemo.demonstrateProgressiveLoading();

// 適応的品質調整テスト
await perfDemo.demonstrateAdaptiveQuality();

// メモリ最適化テスト
await perfDemo.demonstrateMemoryOptimization();

// リアルタイム更新テスト
await perfDemo.demonstrateRealTimeUpdates();

// レポート生成
const report = perfDemo.generatePerformanceReport();
console.log('最終レポート:', report);
*/
