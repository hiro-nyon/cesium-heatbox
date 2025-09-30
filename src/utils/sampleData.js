/**
 * サンプルデータ生成のユーティリティ関数
 */
import * as Cesium from 'cesium';

/**
 * 指定された範囲内にランダムなテストエンティティを生成
 * @param {Object} viewer - CesiumJS Viewer
 * @param {Object} bounds - 生成範囲 {minLon, maxLon, minLat, maxLat, minAlt, maxAlt}
 * @param {number} count - 生成数（デフォルト: 500）
 * @returns {Array} 生成されたエンティティ配列
 */
export function generateTestEntities(viewer, bounds, count = 500) {
  if (!viewer) {
    throw new Error('viewer is required');
  }
  
  if (!bounds || !('minLon' in bounds) || !('maxLon' in bounds) || !('minLat' in bounds) || !('maxLat' in bounds)) {
    throw new Error('bounds must include minLon, maxLon, minLat, maxLat');
  }
  
  const entities = [];
  
  // デフォルト高度範囲
  const minAlt = bounds.minAlt || 0;
  const maxAlt = bounds.maxAlt || 100;
  
  for (let i = 0; i < count; i++) {
    const lon = bounds.minLon + (bounds.maxLon - bounds.minLon) * Math.random();
    const lat = bounds.minLat + (bounds.maxLat - bounds.minLat) * Math.random();
    const alt = minAlt + (maxAlt - minAlt) * Math.random();
    
    const entity = viewer.entities.add({
      id: `test-entity-${i}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
      point: {
        pixelSize: 5,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1
      },
      label: {
        text: `Test ${i}`,
        font: '10pt sans-serif',
        pixelOffset: new Cesium.Cartesian2(0, -30),
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE
      }
    });
    
    entities.push(entity);
  }
  
  return entities;
}

/**
 * 指定されたviewerの全エンティティを取得
 * @param {Object} viewer - CesiumJS Viewer
 * @returns {Array} エンティティ配列
 */
export function getAllEntities(viewer) {
  if (!viewer || !viewer.entities) {
    throw new Error('Invalid viewer');
  }
  
  return viewer.entities.values;
}

/**
 * Generate clustered sample entities without adding to a viewer.
 * ビューアに追加せず、クラスター状のサンプルエンティティ配列を生成します。
 * @param {number} total - 総エンティティ数
 * @param {Object} config - { clusters: Array<{ center:[lon,lat,alt], radius:number, density:number, count:number }> }
 * @returns {Array<Cesium.Entity>} エンティティ配列
 */
export function generateSampleData(total, config = {}) {
  const clusters = Array.isArray(config.clusters) && config.clusters.length > 0
    ? config.clusters
    : [{ center: [139.75, 35.7, 50], radius: 0.02, density: 0.5, count: total }];

  const entities = [];
  let remaining = total;

  clusters.forEach((c, idx) => {
    const count = Math.min(remaining, Math.max(0, c.count || Math.floor(total / clusters.length)));
    remaining -= count;

    const [lon0, lat0, alt0] = c.center || [139.75, 35.7, 50];
    const radius = c.radius || 0.02; // degrees
    const altRange = 100;

    for (let i = 0; i < count; i++) {
      // Uniform random within circle (approx in degrees)
      const r = Math.sqrt(Math.random()) * radius;
      const theta = Math.random() * Math.PI * 2;
      const lon = lon0 + r * Math.cos(theta);
      const lat = lat0 + r * Math.sin(theta);
      const alt = alt0 + (Math.random() - 0.5) * altRange;

      const entity = new Cesium.Entity({
        id: `sample-${idx}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt)
      });
      entities.push(entity);
    }
  });

  // If any remainder, add around the first cluster center
  while (remaining-- > 0) {
    const [lon0, lat0, alt0] = clusters[0].center;
    const lon = lon0 + (Math.random() - 0.5) * 0.02;
    const lat = lat0 + (Math.random() - 0.5) * 0.02;
    const alt = alt0 + (Math.random() - 0.5) * 100;
    entities.push(new Cesium.Entity({
      id: `sample-extra-${Math.random().toString(36).slice(2, 8)}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alt)
    }));
  }

  return entities;
}

/**
 * 東京駅周辺の境界を取得
 * @returns {Object} 東京駅周辺の境界情報
 */
export function getTokyoStationBounds() {
  return {
    minLon: 139.7640,
    maxLon: 139.7680,
    minLat: 35.6790,
    maxLat: 35.6820,
    minAlt: 0,
    maxAlt: 100,
    centerLon: 139.7660,
    centerLat: 35.6805,
    centerAlt: 50
  };
}

/**
 * 指定された中心点とサイズから境界を生成
 * @param {number} centerLon - 中心経度
 * @param {number} centerLat - 中心緯度
 * @param {number} centerAlt - 中心高度
 * @param {number} sizeMeters - 一辺のサイズ（メートル）
 * @returns {Object} 境界情報
 */
export function createBoundsFromCenter(centerLon, centerLat, centerAlt, sizeMeters) {
  // 度からメートルへの概算変換
  const latDelta = sizeMeters / 111000 / 2;
  const lonDelta = sizeMeters / (111000 * Math.cos(centerLat * Math.PI / 180)) / 2;
  const altDelta = sizeMeters / 2;
  
  return {
    minLon: centerLon - lonDelta,
    maxLon: centerLon + lonDelta,
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minAlt: centerAlt - altDelta,
    maxAlt: centerAlt + altDelta,
    centerLon,
    centerLat,
    centerAlt
  };
}

/**
 * v0.1.15 Phase 1: Density pattern generators for parameter optimization (ADR-0011)
 * パラメータ最適化用の密度パターン生成関数
 */

/**
 * Generate clustered density pattern (高密度クラスター)
 * @param {Object} bounds - Bounding box
 * @param {number} count - Total entity count
 * @param {number} clusterCount - Number of clusters (default: 3)
 * @returns {Array<Cesium.Entity>} Generated entities
 */
function generateClusteredPattern(bounds, count, clusterCount = 3) {
  const entities = [];
  if (!Number.isFinite(count) || count <= 0) {
    return entities;
  }

  const clusters = Math.max(1, Math.min(Math.floor(clusterCount) || 1, count));
  const basePerCluster = Math.floor(count / clusters);
  const remainder = count - basePerCluster * clusters;

  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerAlt = (bounds.minAlt + bounds.maxAlt) / 2;
  
  let globalIndex = 0;
  for (let c = 0; c < clusters; c++) {
    const clusterSize = basePerCluster + (c < remainder ? 1 : 0);
    if (clusterSize <= 0) {
      continue;
    }
    // クラスター中心をランダムに配置
    const clusterLon = centerLon + (Math.random() - 0.5) * (bounds.maxLon - bounds.minLon) * 0.6;
    const clusterLat = centerLat + (Math.random() - 0.5) * (bounds.maxLat - bounds.minLat) * 0.6;
    const clusterAlt = centerAlt + (Math.random() - 0.5) * (bounds.maxAlt - bounds.minAlt) * 0.6;
    
    // 各クラスター内にエンティティを密集配置
    const clusterRadius = Math.min(
      (bounds.maxLon - bounds.minLon),
      (bounds.maxLat - bounds.minLat)
    ) * 0.1;
    
    for (let i = 0; i < clusterSize; i++) {
      const r = Math.sqrt(Math.random()) * clusterRadius;
      const theta = Math.random() * Math.PI * 2;
      
      const lon = clusterLon + r * Math.cos(theta);
      const lat = clusterLat + r * Math.sin(theta);
      const alt = clusterAlt + (Math.random() - 0.5) * (bounds.maxAlt - bounds.minAlt) * 0.2;
      
      entities.push(new Cesium.Entity({
        id: `clustered-${c}-${i}-${globalIndex}-${Math.random().toString(36).slice(2, 8)}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt)
      }));
      globalIndex++;
    }
  }
  
  return entities;
}

/**
 * Generate scattered density pattern (疎分布)
 * @param {Object} bounds - Bounding box
 * @param {number} count - Total entity count
 * @returns {Array<Cesium.Entity>} Generated entities
 */
function generateScatteredPattern(bounds, count) {
  const entities = [];
  
  for (let i = 0; i < count; i++) {
    const lon = bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon);
    const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const alt = bounds.minAlt + Math.random() * (bounds.maxAlt - bounds.minAlt);
    
    entities.push(new Cesium.Entity({
      id: `scattered-${i}-${Math.random().toString(36).slice(2, 8)}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alt)
    }));
  }
  
  return entities;
}

/**
 * Generate gradient density pattern (グラデーション分布)
 * @param {Object} bounds - Bounding box
 * @param {number} count - Total entity count
 * @returns {Array<Cesium.Entity>} Generated entities
 */
function generateGradientPattern(bounds, count) {
  const entities = [];
  
  for (let i = 0; i < count; i++) {
    // X軸方向に密度が増加するグラデーション
    const x = Math.random();
    const densityWeight = x * x; // 二乗で密度を増加
    
    const lon = bounds.minLon + x * (bounds.maxLon - bounds.minLon);
    const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const alt = bounds.minAlt + Math.random() * (bounds.maxAlt - bounds.minAlt);
    
    // 密度の高いエリアでは複数のエンティティを近接配置
    if (densityWeight > 0.7 && Math.random() > 0.5) {
      const offset = 0.0001; // 約10m
      entities.push(new Cesium.Entity({
        id: `gradient-${i}-extra-${Math.random().toString(36).slice(2, 8)}`,
        position: Cesium.Cartesian3.fromDegrees(
          lon + (Math.random() - 0.5) * offset,
          lat + (Math.random() - 0.5) * offset,
          alt
        )
      }));
    }
    
    entities.push(new Cesium.Entity({
      id: `gradient-${i}-${Math.random().toString(36).slice(2, 8)}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alt)
    }));
  }
  
  return entities;
}

/**
 * Generate mixed density pattern (混在分布)
 * @param {Object} bounds - Bounding box
 * @param {number} count - Total entity count
 * @returns {Array<Cesium.Entity>} Generated entities
 */
function generateMixedPattern(bounds, count) {
  const entities = [];
  
  // 30%を高密度クラスター、70%を疎分布として配置
  const clusteredCount = Math.floor(count * 0.3);
  const scatteredCount = count - clusteredCount;
  
  // 高密度クラスター部分
  const clusteredEntities = generateClusteredPattern(bounds, clusteredCount, 2);
  entities.push(...clusteredEntities);
  
  // 疎分布部分
  const scatteredEntities = generateScatteredPattern(bounds, scatteredCount);
  entities.push(...scatteredEntities);
  
  return entities;
}

/**
 * Density pattern generators map (ADR-0011 Phase 1)
 * パラメータ最適化用密度パターンマップ
 */
export const DENSITY_PATTERNS = {
  clustered: generateClusteredPattern,
  scattered: generateScatteredPattern,
  gradient: generateGradientPattern,
  mixed: generateMixedPattern
};

/**
 * Generate test dataset with specified pattern
 * 指定したパターンでテストデータセットを生成
 * @param {string} pattern - Pattern name ('clustered', 'scattered', 'gradient', 'mixed')
 * @param {Object} bounds - Bounding box
 * @param {number} count - Total entity count
 * @returns {Array<Cesium.Entity>} Generated entities
 */
export function generatePatternData(pattern, bounds, count) {
  const generator = DENSITY_PATTERNS[pattern];
  if (!generator) {
    throw new Error(`Unknown pattern: ${pattern}. Available: ${Object.keys(DENSITY_PATTERNS).join(', ')}`);
  }
  return generator(bounds, count);
}
