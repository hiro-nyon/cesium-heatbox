/**
 * 拡張版エンティティフィルタリング例
 */

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
   * 高度範囲でフィルタ
   */
  byAltitudeRange: (minAlt, maxAlt) => (entity) => {
    const position = CoordinateTransformer.getEntityPosition(entity);
    if (!position) return false;
    
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    return cartographic.height >= minAlt && cartographic.height <= maxAlt;
  },
  
  /**
   * 属性値でフィルタ
   */
  byProperty: (propertyName, value) => (entity) => {
    return entity.properties && 
           entity.properties[propertyName] && 
           entity.properties[propertyName].getValue() === value;
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
