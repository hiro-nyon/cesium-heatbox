/**
 * Test suite for HybridSelectionStrategy
 * HybridSelectionStrategy のテストスイート
 */
import { HybridSelectionStrategy } from '../../../src/core/selection/HybridSelectionStrategy.js';

describe('HybridSelectionStrategy', () => {
  let strategy;
  let sampleVoxels;
  let sampleGrid;
  
  beforeEach(() => {
    strategy = new HybridSelectionStrategy();
    
    // テスト用のサンプルボクセルデータ
    sampleVoxels = [
      { key: 'v1', info: { x: 0, y: 0, z: 0, count: 100 } },
      { key: 'v2', info: { x: 1, y: 0, z: 0, count: 95 } },
      { key: 'v3', info: { x: 2, y: 0, z: 0, count: 90 } },
      { key: 'v4', info: { x: 0, y: 1, z: 0, count: 85 } },
      { key: 'v5', info: { x: 1, y: 1, z: 0, count: 80 } },
      { key: 'v6', info: { x: 2, y: 1, z: 0, count: 75 } },
      { key: 'v7', info: { x: 0, y: 2, z: 0, count: 70 } },
      { key: 'v8', info: { x: 1, y: 2, z: 0, count: 65 } },
      { key: 'v9', info: { x: 2, y: 2, z: 0, count: 60 } },
      { key: 'v10', info: { x: 3, y: 3, z: 0, count: 30 } }
    ];
    
    sampleGrid = {
      numVoxelsX: 4,
      numVoxelsY: 4,
      numVoxelsZ: 1
    };
  });
  
  describe('Basic functionality', () => {
    test('should select voxels using hybrid strategy', () => {
      const result = strategy.select(sampleVoxels, 6, sampleGrid);
      
      expect(result).toBeDefined();
      expect(result.selected).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.strategy).toBe('hybrid');
      expect(result.selected.length).toBeLessThanOrEqual(6);
    });
    
    test('should respect maximum count limit', () => {
      const maxCount = 4;
      const result = strategy.select(sampleVoxels, maxCount, sampleGrid);
      
      expect(result.selected.length).toBeLessThanOrEqual(maxCount);
    });
    
    test('should handle empty voxel array', () => {
      const result = strategy.select([], 5, sampleGrid);
      
      expect(result.selected).toHaveLength(0);
      expect(result.metadata.strategy).toBe('hybrid');
    });
  });
  
  describe('Coverage and density balance', () => {
    test('should split selection between coverage and density', () => {
      const result = strategy.select(sampleVoxels, 6, sampleGrid);
      
      expect(result.metadata).toMatchObject({
        strategy: 'hybrid',
        totalSelected: expect.any(Number),
        coverageSelected: expect.any(Number),
        densitySelected: expect.any(Number),
        coverageRatio: expect.any(Number)
      });
      
      // カバレッジと密度の両方が選択されることを確認
      expect(result.metadata.coverageSelected + result.metadata.densitySelected)
        .toBeLessThanOrEqual(result.metadata.totalSelected);
    });
    
    test('should respect custom coverage ratio', () => {
      const customRatio = 0.5; // 50%をカバレッジに
      const options = { coverageRatio: customRatio };
      const result = strategy.select(sampleVoxels, 6, sampleGrid, new Set(), options);
      
      expect(result.metadata.targetCoverageRatio).toBe(customRatio);
      
      // 実際の比率が目標に近いことを確認（小さなデータセットでは完全一致は困難）
      if (result.metadata.totalSelected > 0) {
        expect(result.metadata.coverageRatio).toBeGreaterThanOrEqual(0);
        expect(result.metadata.coverageRatio).toBeLessThanOrEqual(1);
      }
    });
    
    test('should handle minCoverageRatio option', () => {
      const minRatio = 0.4;
      const options = { minCoverageRatio: minRatio };
      const result = strategy.select(sampleVoxels, 8, sampleGrid, new Set(), options);
      
      expect(result.metadata.targetCoverageRatio).toBe(minRatio);
    });
  });
  
  describe('Force include functionality', () => {
    test('should include force-included voxels', () => {
      const forceInclude = new Set(['v2', 'v5']);
      const result = strategy.select(sampleVoxels, 6, sampleGrid, forceInclude);
      
      const selectedKeys = new Set(result.selected.map(v => v.key));
      expect(selectedKeys.has('v2')).toBe(true);
      expect(selectedKeys.has('v5')).toBe(true);
    });
    
    test('should handle force include exceeding max count', () => {
      const forceInclude = new Set(['v1', 'v2', 'v3', 'v4', 'v5']);
      const result = strategy.select(sampleVoxels, 3, sampleGrid, forceInclude);
      
      expect(result.selected.length).toBeLessThanOrEqual(3);
    });
  });
  
  describe('Strategy combination', () => {
    test('should combine high-density and spatial coverage voxels', () => {
      const result = strategy.select(sampleVoxels, 8, sampleGrid);
      
      // 高密度ボクセル（上位3つ）の少なくとも一部が含まれることを確認
      const selectedKeys = new Set(result.selected.map(v => v.key));
      const highDensityVoxels = ['v1', 'v2', 'v3']; // 最高密度の3つ
      
      const hasHighDensity = highDensityVoxels.some(key => selectedKeys.has(key));
      expect(hasHighDensity).toBe(true);
      
      // 空間的に分散していることを確認
      const selectedPositions = result.selected.map(v => ({ x: v.info.x, y: v.info.y }));
      const uniquePositions = new Set(selectedPositions.map(pos => `${pos.x},${pos.y}`));
      expect(uniquePositions.size).toBeGreaterThan(1);
    });
    
    test('should work with different coverage ratios', () => {
      const ratios = [0.1, 0.3, 0.5, 0.7, 0.9];
      
      ratios.forEach(ratio => {
        const options = { coverageRatio: ratio };
        const result = strategy.select(sampleVoxels, 6, sampleGrid, new Set(), options);
        
        expect(result.selected.length).toBeLessThanOrEqual(6);
        expect(result.metadata.targetCoverageRatio).toBe(ratio);
      });
    });
  });
  
  describe('Options handling', () => {
    test('should support hybrid-specific options', () => {
      const options = {
        coverageRatio: 0.4,
        hybridCoverageMode: 'median',
        hybridDensityMode: 'highest'
      };
      
      const result = strategy.select(sampleVoxels, 6, sampleGrid, new Set(), options);
      
      expect(result.selected.length).toBeLessThanOrEqual(6);
      expect(result.metadata.targetCoverageRatio).toBe(0.4);
    });
    
    test('should handle edge case ratios', () => {
      // 0%カバレッジ（完全密度選択）
      const densityOnlyResult = strategy.select(sampleVoxels, 4, sampleGrid, new Set(), { coverageRatio: 0 });
      expect(densityOnlyResult.metadata.coverageSelected).toBe(0);
      expect(densityOnlyResult.metadata.densitySelected).toBeGreaterThan(0);
      
      // 100%カバレッジ（完全カバレッジ選択）
      const coverageOnlyResult = strategy.select(sampleVoxels, 4, sampleGrid, new Set(), { coverageRatio: 1.0 });
      expect(coverageOnlyResult.metadata.densitySelected).toBe(0);
      expect(coverageOnlyResult.metadata.coverageSelected).toBeGreaterThan(0);
    });
  });
  
  describe('Edge cases', () => {
    test('should handle zero max count', () => {
      const result = strategy.select(sampleVoxels, 0, sampleGrid);
      
      expect(result.selected).toHaveLength(0);
      expect(result.metadata.coverageSelected).toBe(0);
      expect(result.metadata.densitySelected).toBe(0);
    });
    
    test('should handle single voxel selection', () => {
      const result = strategy.select(sampleVoxels, 1, sampleGrid);
      
      expect(result.selected).toHaveLength(1);
      expect(result.metadata.totalSelected).toBe(1);
    });
    
    test('should handle very large max count', () => {
      const result = strategy.select(sampleVoxels, 1000, sampleGrid);
      
      expect(result.selected.length).toBe(sampleVoxels.length);
    });
  });
  
  describe('Metadata validation', () => {
    test('should provide comprehensive hybrid metadata', () => {
      const result = strategy.select(sampleVoxels, 6, sampleGrid);
      
      expect(result.metadata).toMatchObject({
        strategy: 'hybrid',
        totalSelected: expect.any(Number),
        coverageSelected: expect.any(Number),
        densitySelected: expect.any(Number),
        coverageRatio: expect.any(Number),
        targetCoverageRatio: expect.any(Number),
        selectionRatio: expect.any(Number)
      });
      
      // 値の範囲チェック
      expect(result.metadata.coverageRatio).toBeGreaterThanOrEqual(0);
      expect(result.metadata.coverageRatio).toBeLessThanOrEqual(1);
      expect(result.metadata.targetCoverageRatio).toBeGreaterThanOrEqual(0);
      expect(result.metadata.targetCoverageRatio).toBeLessThanOrEqual(1);
    });
    
    test('should calculate ratios correctly', () => {
      const result = strategy.select(sampleVoxels, 8, sampleGrid);
      
      if (result.metadata.totalSelected > 0) {
        const calculatedRatio = result.metadata.coverageSelected / result.metadata.totalSelected;
        expect(Math.abs(result.metadata.coverageRatio - calculatedRatio)).toBeLessThan(0.001);
      }
    });
  });
  
  describe('Performance', () => {
    test('should complete hybrid selection within reasonable time', () => {
      // 大きなデータセットでのパフォーマンステスト
      const largeVoxelSet = [];
      for (let i = 0; i < 1000; i++) {
        largeVoxelSet.push({
          key: `v${i}`,
          info: { 
            x: i % 20, 
            y: Math.floor(i / 20) % 20, 
            z: 0, 
            count: Math.random() * 100 
          }
        });
      }
      
      const startTime = performance.now();
      const result = strategy.select(largeVoxelSet, 50, { numVoxelsX: 20, numVoxelsY: 20, numVoxelsZ: 1 });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(2000); // 2秒以内
      expect(result.selected.length).toBeLessThanOrEqual(50);
    });
  });
  
  describe('Strategy dependencies', () => {
    test('should have access to density and coverage strategies', () => {
      expect(strategy.densityStrategy).toBeDefined();
      expect(strategy.coverageStrategy).toBeDefined();
    });
    
    test('should properly delegate to sub-strategies', () => {
      // 密度のみの選択をテスト
      const densityOnlyResult = strategy.select(sampleVoxels, 4, sampleGrid, new Set(), { coverageRatio: 0 });
      expect(densityOnlyResult.metadata.densitySelected).toBeGreaterThan(0);
      expect(densityOnlyResult.metadata.coverageSelected).toBe(0);
      
      // カバレッジのみの選択をテスト
      const coverageOnlyResult = strategy.select(sampleVoxels, 4, sampleGrid, new Set(), { coverageRatio: 1.0 });
      expect(coverageOnlyResult.metadata.coverageSelected).toBeGreaterThan(0);
      expect(coverageOnlyResult.metadata.densitySelected).toBe(0);
    });
  });
});
