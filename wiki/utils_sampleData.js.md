# Source: utils/sampleData.js

[English](#english) | [日本語](#日本語)

## English

See also: [Class: sampleData](sampleData)

```javascript
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

```

## 日本語

関連: [sampleDataクラス](sampleData)

```javascript
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

```
