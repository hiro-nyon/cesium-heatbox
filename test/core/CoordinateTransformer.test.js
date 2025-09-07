/**
 * CoordinateTransformer クラスのテスト
 */

import { CoordinateTransformer } from '../../src/core/CoordinateTransformer.js';

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
