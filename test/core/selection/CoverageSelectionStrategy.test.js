/**
 * Test suite for CoverageSelectionStrategy
 * CoverageSelectionStrategy のテストスイート
 */
import { CoverageSelectionStrategy } from '../../../src/core/selection/CoverageSelectionStrategy.js';

describe('CoverageSelectionStrategy', () => {
  let strategy;
  let sampleVoxels;
  let sampleGrid;
  
  beforeEach(() => {
    strategy = new CoverageSelectionStrategy();
    
    // テスト用のサンプルボクセルデータ
    sampleVoxels = [
      { key: 'v1', info: { x: 0, y: 0, z: 0, count: 100 } },
      { key: 'v2', info: { x: 1, y: 0, z: 0, count: 90 } },
      { key: 'v3', info: { x: 0, y: 1, z: 0, count: 80 } },
      { key: 'v4', info: { x: 1, y: 1, z: 0, count: 70 } },
      { key: 'v5', info: { x: 2, y: 2, z: 0, count: 60 } },
      { key: 'v6', info: { x: 3, y: 3, z: 0, count: 50 } },
      { key: 'v7', info: { x: 0, y: 3, z: 0, count: 40 } },
      { key: 'v8', info: { x: 3, y: 0, z: 0, count: 30 } }
    ];
    
    sampleGrid = {
      numVoxelsX: 4,
      numVoxelsY: 4,
      numVoxelsZ: 1
    };
  });
  
  describe('Basic functionality', () => {
    test('should select voxels using coverage strategy', () => {
      const result = strategy.select(sampleVoxels, 4, sampleGrid);
      
      expect(result).toBeDefined();
      expect(result.selected).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.strategy).toBe('coverage');
      expect(result.selected.length).toBeLessThanOrEqual(4);
    });
    
    test('should respect maximum count limit', () => {
      const maxCount = 3;
      const result = strategy.select(sampleVoxels, maxCount, sampleGrid);
      
      expect(result.selected.length).toBeLessThanOrEqual(maxCount);
    });
    
    test('should handle empty voxel array', () => {
      const result = strategy.select([], 5, sampleGrid);
      
      expect(result.selected).toHaveLength(0);
      expect(result.metadata.strategy).toBe('coverage');
    });
    
    test('should handle single voxel', () => {
      const singleVoxel = [sampleVoxels[0]];
      const result = strategy.select(singleVoxel, 5, sampleGrid);
      
      expect(result.selected).toHaveLength(1);
      expect(result.selected[0]).toBe(singleVoxel[0]);
    });
  });
  
  describe('Force include functionality', () => {
    test('should include force-included voxels', () => {
      const forceInclude = new Set(['v2', 'v4']);
      const result = strategy.select(sampleVoxels, 4, sampleGrid, forceInclude);
      
      const selectedKeys = new Set(result.selected.map(v => v.key));
      expect(selectedKeys.has('v2')).toBe(true);
      expect(selectedKeys.has('v4')).toBe(true);
    });
    
    test('should handle force include exceeding max count', () => {
      const forceInclude = new Set(['v1', 'v2', 'v3', 'v4', 'v5']);
      const result = strategy.select(sampleVoxels, 3, sampleGrid, forceInclude);
      
      expect(result.selected.length).toBeLessThanOrEqual(3);
      // 強制包含の最初の3つが選ばれることを確認
      const selectedKeys = result.selected.map(v => v.key);
      expect(selectedKeys).toContain('v1');
      expect(selectedKeys).toContain('v2');
      expect(selectedKeys).toContain('v3');
    });
  });
  
  describe('Spatial binning', () => {
    test('should distribute selection across spatial bins', () => {
      const result = strategy.select(sampleVoxels, 4, sampleGrid);
      
      // 選択されたボクセルが空間的に分散していることを確認
      const selectedPositions = result.selected.map(v => ({ x: v.info.x, y: v.info.y }));
      
      // 異なる位置のボクセルが選ばれていることを確認
      const uniquePositions = new Set(selectedPositions.map(pos => `${pos.x},${pos.y}`));
      expect(uniquePositions.size).toBeGreaterThan(1);
    });
    
    test('should handle custom bin count', () => {
      const options = { coverageBinsXY: 2 };
      const result = strategy.select(sampleVoxels, 4, sampleGrid, new Set(), options);
      
      expect(result.selected.length).toBeLessThanOrEqual(4);
      expect(result.metadata.binsXY).toBe(2);
    });
    
    test('should auto-calculate bin count', () => {
      const options = { coverageBinsXY: 'auto' };
      const result = strategy.select(sampleVoxels, 8, sampleGrid, new Set(), options);
      
      expect(result.metadata.binsXY).toBeGreaterThan(1);
      expect(result.metadata.binsXY).toBeLessThanOrEqual(20);
    });
  });
  
  describe('Selection modes', () => {
    test('should support highest density mode', () => {
      const options = { binSelectionMode: 'highest' };
      const result = strategy.select(sampleVoxels, 2, sampleGrid, new Set(), options);
      
      expect(result.selected.length).toBeLessThanOrEqual(2);
      // 選択されたボクセルが高密度であることを確認
      result.selected.forEach(voxel => {
        expect(voxel.info.count).toBeGreaterThan(0);
      });
    });
    
    test('should support median selection mode', () => {
      const options = { binSelectionMode: 'median' };
      const result = strategy.select(sampleVoxels, 2, sampleGrid, new Set(), options);
      
      expect(result.selected.length).toBeLessThanOrEqual(2);
    });
    
    test('should support random selection mode', () => {
      const options = { binSelectionMode: 'random' };
      const result = strategy.select(sampleVoxels, 2, sampleGrid, new Set(), options);
      
      expect(result.selected.length).toBeLessThanOrEqual(2);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle zero max count', () => {
      const result = strategy.select(sampleVoxels, 0, sampleGrid);
      
      expect(result.selected).toHaveLength(0);
    });
    
    test('should handle invalid grid', () => {
      const invalidGrid = { numVoxelsX: 0, numVoxelsY: 0, numVoxelsZ: 0 };
      const result = strategy.select(sampleVoxels, 2, invalidGrid);
      
      expect(result.selected.length).toBeLessThanOrEqual(2);
    });
    
    test('should handle very large max count', () => {
      const result = strategy.select(sampleVoxels, 1000, sampleGrid);
      
      expect(result.selected.length).toBe(sampleVoxels.length);
    });
  });
  
  describe('Metadata validation', () => {
    test('should provide comprehensive metadata', () => {
      const result = strategy.select(sampleVoxels, 4, sampleGrid);
      
      expect(result.metadata).toMatchObject({
        strategy: 'coverage',
        totalSelected: expect.any(Number),
        selectionRatio: expect.any(Number)
      });
      
      expect(result.metadata.selectionRatio).toBeGreaterThanOrEqual(0);
      expect(result.metadata.selectionRatio).toBeLessThanOrEqual(1);
    });
    
    test('should include bin information in metadata', () => {
      const result = strategy.select(sampleVoxels, 4, sampleGrid);
      
      if (result.metadata.binsXY) {
        expect(result.metadata.binsXY).toBeGreaterThan(0);
      }
      if (result.metadata.totalBins) {
        expect(result.metadata.totalBins).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Performance', () => {
    test('should complete selection within reasonable time', () => {
      // 大きなデータセットでのパフォーマンステスト
      const largeVoxelSet = [];
      for (let i = 0; i < 1000; i++) {
        largeVoxelSet.push({
          key: `v${i}`,
          info: { 
            x: i % 10, 
            y: Math.floor(i / 10) % 10, 
            z: 0, 
            count: Math.random() * 100 
          }
        });
      }
      
      const startTime = performance.now();
      const result = strategy.select(largeVoxelSet, 50, { numVoxelsX: 10, numVoxelsY: 10, numVoxelsZ: 1 });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
      expect(result.selected.length).toBeLessThanOrEqual(50);
    });
  });
});
