/**
 * CoordinateTransformer クラスのテスト
 */

import { CoordinateTransformer } from '../src/core/CoordinateTransformer.js';

describe('CoordinateTransformer', () => {
  describe('calculateBounds', () => {
    test('正常なエンティティから境界を計算', () => {
      const entities = [
        testUtils.createMockEntity(139.765, 35.680, 10),
        testUtils.createMockEntity(139.767, 35.682, 20),
        testUtils.createMockEntity(139.769, 35.684, 30)
      ];
      
      const bounds = CoordinateTransformer.calculateBounds(entities);
      
      expect(bounds.minLon).toBe(139.765);
      expect(bounds.maxLon).toBe(139.769);
      expect(bounds.minLat).toBe(35.680);
      expect(bounds.maxLat).toBe(35.684);
      expect(bounds.minAlt).toBe(10);
      expect(bounds.maxAlt).toBe(30);
      expect(bounds.centerLon).toBe(139.767);
      expect(bounds.centerLat).toBe(35.682);
      expect(bounds.centerAlt).toBe(20);
    });
    
    test('空のエンティティ配列でエラーが発生', () => {
      expect(() => {
        CoordinateTransformer.calculateBounds([]);
      }).toThrow('エンティティが提供されていません');
    });
    
    test('有効な位置情報がない場合エラーが発生', () => {
      const entities = [
        { id: 'invalid', position: null }
      ];
      
      expect(() => {
        CoordinateTransformer.calculateBounds(entities);
      }).toThrow('有効な位置情報を持つエンティティが見つかりません');
    });
  });
  
  describe('getEntityPosition', () => {
    test('Cartesian3位置情報を取得', () => {
      const entity = testUtils.createMockEntity(139.766, 35.681, 50);
      const position = CoordinateTransformer.getEntityPosition(entity);
      
      expect(position).toBeDefined();
      expect(position.x).toBe(139.766);
      expect(position.y).toBe(35.681);
      expect(position.z).toBe(50);
    });
    
    test('無効なエンティティでnullが返される', () => {
      const position = CoordinateTransformer.getEntityPosition(null);
      expect(position).toBeNull();
    });
  });
  
  describe('calculateMetersRange', () => {
    test('メートル単位の範囲を計算', () => {
      const bounds = {
        minLon: 139.765,
        maxLon: 139.767,
        minLat: 35.680,
        maxLat: 35.682,
        minAlt: 10,
        maxAlt: 30,
        centerLat: 35.681
      };
      
      const range = CoordinateTransformer.calculateMetersRange(bounds);
      
      expect(range.lonRangeMeters).toBeGreaterThan(0);
      expect(range.latRangeMeters).toBeGreaterThan(0);
      expect(range.altRangeMeters).toBe(20);
    });
  });
  
  describe('coordinateToVoxelIndex', () => {
    test('座標をボクセルインデックスに変換', () => {
      const bounds = {
        minLon: 139.765,
        maxLon: 139.767,
        minLat: 35.680,
        maxLat: 35.682,
        minAlt: 10,
        maxAlt: 30
      };
      
      const grid = {
        numVoxelsX: 10,
        numVoxelsY: 10,
        numVoxelsZ: 10
      };
      
      const index = CoordinateTransformer.coordinateToVoxelIndex(
        139.766, 35.681, 20, bounds, grid
      );
      
      expect(index.x).toBeGreaterThanOrEqual(0);
      expect(index.x).toBeLessThan(10);
      expect(index.y).toBeGreaterThanOrEqual(0);
      expect(index.y).toBeLessThan(10);
      expect(index.z).toBeGreaterThanOrEqual(0);
      expect(index.z).toBeLessThan(10);
    });
    
    test('境界値の処理', () => {
      const bounds = {
        minLon: 139.765,
        maxLon: 139.767,
        minLat: 35.680,
        maxLat: 35.682,
        minAlt: 10,
        maxAlt: 30
      };
      
      const grid = {
        numVoxelsX: 10,
        numVoxelsY: 10,
        numVoxelsZ: 10
      };
      
      // 最小値
      const minIndex = CoordinateTransformer.coordinateToVoxelIndex(
        bounds.minLon, bounds.minLat, bounds.minAlt, bounds, grid
      );
      
      expect(minIndex.x).toBe(0);
      expect(minIndex.y).toBe(0);
      expect(minIndex.z).toBe(0);
      
      // 最大値
      const maxIndex = CoordinateTransformer.coordinateToVoxelIndex(
        bounds.maxLon, bounds.maxLat, bounds.maxAlt, bounds, grid
      );
      
      expect(maxIndex.x).toBe(9);
      expect(maxIndex.y).toBe(9);
      expect(maxIndex.z).toBe(9);
    });
  });
  
  describe('voxelIndexToCoordinate', () => {
    test('ボクセルインデックスを座標に変換', () => {
      const bounds = {
        minLon: 139.765,
        maxLon: 139.767,
        minLat: 35.680,
        maxLat: 35.682,
        minAlt: 10,
        maxAlt: 30
      };
      
      const grid = {
        numVoxelsX: 10,
        numVoxelsY: 10,
        numVoxelsZ: 10
      };
      
      const coord = CoordinateTransformer.voxelIndexToCoordinate(
        5, 5, 5, bounds, grid
      );
      
      expect(coord.lon).toBeGreaterThan(bounds.minLon);
      expect(coord.lon).toBeLessThan(bounds.maxLon);
      expect(coord.lat).toBeGreaterThan(bounds.minLat);
      expect(coord.lat).toBeLessThan(bounds.maxLat);
      expect(coord.alt).toBeGreaterThan(bounds.minAlt);
      expect(coord.alt).toBeLessThan(bounds.maxAlt);
    });
  });
});
