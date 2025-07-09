/**
 * サンプルデータ生成のユーティリティ関数
 */

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
  
  if (!bounds || !bounds.minLon || !bounds.maxLon || !bounds.minLat || !bounds.maxLat) {
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
