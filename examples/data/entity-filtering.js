/**
 * 拡張版エンティティフィルタリング例
 * v0.1.2 対応版
 */
import * as Cesium from 'cesium';

const SHINJUKU_BOUNDS = {
  west: 139.68,
  east: 139.705,
  south: 35.68,
  north: 35.70
}; // 新宿駅周辺境界 / Shinjuku area bounds

// エンティティタイプ別フィルタリング
export const EntityFilters = {
  /**
   * Pointエンティティのみ
   */
  pointsOnly: (entity) => entity.point !== undefined,
  
  /**
   * 3Dモデルのみ
   */
  modelsOnly: (entity) => entity.model !== undefined,
  
  /**
   * ビルボードのみ
   */
  billboardsOnly: (entity) => entity.billboard !== undefined,
  
  /**
   * 特定のデータソースのみ
   */
  fromDataSource: (dataSourceName) => (entity) => {
    return entity.entityCollection && 
           entity.entityCollection.owner && 
           entity.entityCollection.owner.name === dataSourceName;
  },
  
  /**
   * 高度範囲でフィルタ（v0.1.2対応）
   */
  byAltitudeRange: (minAlt, maxAlt) => (entity) => {
    // v0.1.2: 直接エンティティから位置を取得
    let position;
    if (entity.position) {
      if (typeof entity.position.getValue === 'function') {
        position = entity.position.getValue(Cesium.JulianDate.now());
      } else {
        position = entity.position;
      }
    }
    
    if (!position) return false;
    
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    if (!cartographic) return false;
    
    return cartographic.height >= minAlt && cartographic.height <= maxAlt;
  },
  
  /**
   * 属性値でフィルタ
   */
  byProperty: (propertyName, value) => (entity) => {
    return entity.properties && 
           entity.properties[propertyName] && 
           entity.properties[propertyName].getValue() === value;
  },
  
  /**
   * 密度ベースフィルタ（v0.1.2新機能用）
   * 高密度エリア用と低密度エリア用で異なる表示設定を適用
   */
  forHighDensityDisplay: (entity, index, entities) => {
    // 高密度エリア向けの設定: wireframeOnlyで視認性重視
    return true; // 全エンティティを対象とするが、設定で差別化
  },
  
  /**
   * 地理的範囲でフィルタ
   */
  byGeographicBounds: (minLon, maxLon, minLat, maxLat) => (entity) => {
    let position;
    if (entity.position) {
      if (typeof entity.position.getValue === 'function') {
        position = entity.position.getValue(Cesium.JulianDate.now());
      } else {
        position = entity.position;
      }
    }
    
    if (!position) return false;
    
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    if (!cartographic) return false;
    
    const lon = Cesium.Math.toDegrees(cartographic.longitude);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    
    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  }
};

// 使用例
const pointEntities = Heatbox.filterEntities(
  viewer.entities.values, 
  EntityFilters.pointsOnly
);

const highAltitudeEntities = Heatbox.filterEntities(
  viewer.entities.values,
  EntityFilters.byAltitudeRange(100, 1000)
);

const specificDataSource = Heatbox.filterEntities(
  viewer.entities.values,
  EntityFilters.fromDataSource('GeoJSON Data')
);

// v0.1.2 新機能を活用した高度な使用例
const tokyoAreaEntities = Heatbox.filterEntities(
  viewer.entities.values,
  EntityFilters.byGeographicBounds(SHINJUKU_BOUNDS.west, SHINJUKU_BOUNDS.east, SHINJUKU_BOUNDS.south, SHINJUKU_BOUNDS.north)
);

// 高密度エリア用の設定（wireframeOnly）
const highDensityHeatbox = new Heatbox(viewer, {
  voxelSize: 15,
  wireframeOnly: true,    // 枠線のみで視認性向上
  outlineWidth: 2,
  maxRenderVoxels: 300
});

// 低密度エリア用の設定（通常表示）
const lowDensityHeatbox = new Heatbox(viewer, {
  voxelSize: 30,
  wireframeOnly: false,   // 通常の塗りつぶし
  heightBased: true,      // 高さベース表現
  opacity: 0.7
});

// 使用例: 異なる設定で同じデータを可視化
await highDensityHeatbox.createFromEntities(tokyoAreaEntities);

// 複合フィルタの例
const complexFilter = (entity) => {
  return EntityFilters.pointsOnly(entity) && 
         EntityFilters.byAltitudeRange(50, 200)(entity) &&
         EntityFilters.byGeographicBounds(
           SHINJUKU_BOUNDS.west + 0.002,
           SHINJUKU_BOUNDS.east - 0.002,
           SHINJUKU_BOUNDS.south + 0.002,
           SHINJUKU_BOUNDS.north - 0.002
         )(entity);
};

const filteredEntities = Heatbox.filterEntities(viewer.entities.values, complexFilter);
