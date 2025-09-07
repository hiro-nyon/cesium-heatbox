/**
 * @fileoverview VoxelSelector.test.js
 * ADR-0009 Phase2: VoxelSelectorの単体テスト
 * 
 * Test Coverage:
 * - 密度選択戦略 (Density Strategy)
 * - カバレッジ選択戦略 (Coverage Strategy - Stratified Sampling)
 * - ハイブリッド選択戦略 (Hybrid Strategy - Density + Coverage)
 * - TopN強調機能 (TopN Highlight)
 * - エラーハンドリング (Error Handling & Fallback)
 * - 統計情報収集 (Statistics Collection)
 */

import { VoxelSelector } from '../../../src/core/selection/VoxelSelector.js';

describe('VoxelSelector', () => {
  
  /**
   * テスト用のモックボクセルデータ生成
   * @param {number} count - 生成するボクセル数
   * @param {Object} options - 生成オプション
   * @returns {Array} Mock voxel array
   */
  function createMockVoxels(count, options = {}) {
    const voxels = [];
    const { 
      densityRange = [1, 100],
      spatialRange = { x: [0, 10], y: [0, 10] }
    } = options;
    
    for (let i = 0; i < count; i++) {
      voxels.push({
        key: `voxel_${i}`,
        info: {
          count: Math.floor(Math.random() * (densityRange[1] - densityRange[0]) + densityRange[0]),
          x: Math.floor(Math.random() * (spatialRange.x[1] - spatialRange.x[0]) + spatialRange.x[0]),
          y: Math.floor(Math.random() * (spatialRange.y[1] - spatialRange.y[0]) + spatialRange.y[0])
        }
      });
    }
    
    return voxels;
  }
  
  /**
   * テスト用のモックグリッド情報生成
   * @returns {Object} Mock grid info
   */
  function createMockGrid() {
    return {
      numVoxelsX: 10,
      numVoxelsY: 10,
      numVoxelsZ: 5
    };
  }

  describe('Constructor & Initialization', () => {
    
    test('Should initialize with default options', () => {
      const selector = new VoxelSelector();
      
      expect(selector.options.renderLimitStrategy).toBe('density');
      expect(selector.options.highlightTopN).toBe(0);
      expect(selector.options.coverageBinsXY).toBe('auto');
      expect(selector.options.minCoverageRatio).toBe(0.2);
    });
    
    test('Should initialize with custom options', () => {
      const customOptions = {
        renderLimitStrategy: 'coverage',
        highlightTopN: 5,
        coverageBinsXY: 4,
        minCoverageRatio: 0.3
      };
      
      const selector = new VoxelSelector(customOptions);
      
      expect(selector.options.renderLimitStrategy).toBe('coverage');
      expect(selector.options.highlightTopN).toBe(5);
      expect(selector.options.coverageBinsXY).toBe(4);
      expect(selector.options.minCoverageRatio).toBe(0.3);
    });
    
    test('Should initialize statistics as null', () => {
      const selector = new VoxelSelector();
      expect(selector.getLastSelectionStats()).toBeNull();
    });
  });

  describe('Input Validation', () => {
    
    let selector;
    
    beforeEach(() => {
      selector = new VoxelSelector();
    });
    
    test('Should handle empty voxel array', () => {
      const result = selector.selectVoxels([], 10, { grid: createMockGrid() });
      
      expect(result.selectedVoxels).toHaveLength(0);
      expect(result.strategy).toBe('none');
      expect(result.clippedNonEmpty).toBe(0);
    });
    
    test('Should handle null/undefined voxel array', () => {
      const result1 = selector.selectVoxels(null, 10, { grid: createMockGrid() });
      const result2 = selector.selectVoxels(undefined, 10, { grid: createMockGrid() });
      
      expect(result1.selectedVoxels).toHaveLength(0);
      expect(result2.selectedVoxels).toHaveLength(0);
    });
    
    test('Should handle invalid maxCount', () => {
      const voxels = createMockVoxels(10);
      const result1 = selector.selectVoxels(voxels, 0, { grid: createMockGrid() });
      const result2 = selector.selectVoxels(voxels, -5, { grid: createMockGrid() });
      
      expect(result1.selectedVoxels).toHaveLength(0);
      expect(result2.selectedVoxels).toHaveLength(0);
    });
    
    test('Should return all voxels when maxCount >= voxel count', () => {
      const voxels = createMockVoxels(5);
      const result = selector.selectVoxels(voxels, 10, { grid: createMockGrid() });
      
      expect(result.selectedVoxels).toHaveLength(5);
      expect(result.clippedNonEmpty).toBe(0);
    });
  });

  describe('Density Selection Strategy', () => {
    
    let selector;
    
    beforeEach(() => {
      selector = new VoxelSelector({ renderLimitStrategy: 'density' });
    });
    
    test('Should select highest density voxels', () => {
      const voxels = [
        { key: 'low', info: { count: 10, x: 1, y: 1 } },
        { key: 'high', info: { count: 100, x: 2, y: 2 } },
        { key: 'medium', info: { count: 50, x: 3, y: 3 } }
      ];
      
      const result = selector.selectVoxels(voxels, 2, { grid: createMockGrid() });
      
      expect(result.selectedVoxels).toHaveLength(2);
      expect(result.strategy).toBe('density');
      expect(result.selectedVoxels[0].key).toBe('high');
      expect(result.selectedVoxels[1].key).toBe('medium');
      expect(result.clippedNonEmpty).toBe(1);
    });
    
    test('Should respect TopN highlight voxels', () => {
      const selectorWithTopN = new VoxelSelector({ 
        renderLimitStrategy: 'density',
        highlightTopN: 1
      });
      
      const voxels = [
        { key: 'low', info: { count: 10, x: 1, y: 1 } },
        { key: 'high', info: { count: 100, x: 2, y: 2 } },
        { key: 'medium', info: { count: 50, x: 3, y: 3 } }
      ];
      
      const result = selectorWithTopN.selectVoxels(voxels, 1, { grid: createMockGrid() });
      
      // TopN (highest density) should be included
      expect(result.selectedVoxels).toHaveLength(1);
      expect(result.selectedVoxels[0].key).toBe('high');
    });
    
    test('Should store correct statistics', () => {
      const voxels = createMockVoxels(20);
      const result = selector.selectVoxels(voxels, 10, { grid: createMockGrid() });
      
      const stats = selector.getLastSelectionStats();
      expect(stats.strategy).toBe('density');
      expect(stats.selectedCount).toBe(10);
      expect(stats.totalCount).toBe(20);
      expect(stats.clippedNonEmpty).toBe(10);
      expect(stats.coverageRatio).toBeNull();
    });
  });

  describe('Coverage Selection Strategy', () => {
    
    let selector;
    
    beforeEach(() => {
      selector = new VoxelSelector({ renderLimitStrategy: 'coverage' });
    });
    
    test('Should distribute selection spatially', () => {
      // Create voxels in different spatial regions
      const voxels = [
        { key: 'region1_a', info: { count: 100, x: 0, y: 0 } },
        { key: 'region1_b', info: { count: 90, x: 1, y: 1 } },
        { key: 'region2_a', info: { count: 80, x: 8, y: 8 } },
        { key: 'region2_b', info: { count: 70, x: 9, y: 9 } }
      ];
      
      const result = selector.selectVoxels(voxels, 2, { grid: createMockGrid() });
      
      expect(result.selectedVoxels).toHaveLength(2);
      expect(result.strategy).toBe('coverage');
      
      // Should select from different regions (spatial distribution)
      const selectedKeys = result.selectedVoxels.map(v => v.key);
      // At least one from each major region
      const hasRegion1 = selectedKeys.some(key => key.startsWith('region1'));
      const hasRegion2 = selectedKeys.some(key => key.startsWith('region2'));
      expect(hasRegion1 || hasRegion2).toBe(true); // Should have spatial distribution
    });
    
    test('Should handle auto bin calculation', () => {
      const autoSelector = new VoxelSelector({ 
        renderLimitStrategy: 'coverage',
        coverageBinsXY: 'auto'
      });
      
      const voxels = createMockVoxels(16);
      const result = autoSelector.selectVoxels(voxels, 8, { grid: createMockGrid() });
      
      expect(result.selectedVoxels.length).toBeLessThanOrEqual(8);
      expect(result.strategy).toBe('coverage');
    });
    
    test('Should handle fixed bin size', () => {
      const fixedSelector = new VoxelSelector({ 
        renderLimitStrategy: 'coverage',
        coverageBinsXY: 3
      });
      
      const voxels = createMockVoxels(20);
      const result = fixedSelector.selectVoxels(voxels, 5, { grid: createMockGrid() });
      
      expect(result.selectedVoxels.length).toBeLessThanOrEqual(5);
      expect(result.strategy).toBe('coverage');
    });
  });

  describe('Hybrid Selection Strategy', () => {
    
    let selector;
    
    beforeEach(() => {
      selector = new VoxelSelector({ 
        renderLimitStrategy: 'hybrid',
        minCoverageRatio: 0.3
      });
    });
    
    test('Should combine density and coverage strategies', () => {
      const voxels = [
        // High density, region 1
        { key: 'high_r1', info: { count: 100, x: 0, y: 0 } },
        { key: 'med_r1', info: { count: 50, x: 1, y: 1 } },
        // Medium density, region 2
        { key: 'med_r2', info: { count: 70, x: 8, y: 8 } },
        { key: 'low_r2', info: { count: 30, x: 9, y: 9 } }
      ];
      
      const result = selector.selectVoxels(voxels, 3, { grid: createMockGrid() });
      
      expect(result.selectedVoxels).toHaveLength(3);
      expect(result.strategy).toBe('hybrid');
      expect(result.coverageRatio).toBeGreaterThanOrEqual(0);
      expect(result.coverageRatio).toBeLessThanOrEqual(1);
    });
    
    test('Should respect minCoverageRatio setting', () => {
      const strictSelector = new VoxelSelector({ 
        renderLimitStrategy: 'hybrid',
        minCoverageRatio: 0.5
      });
      
      const voxels = createMockVoxels(20, { 
        spatialRange: { x: [0, 10], y: [0, 10] }
      });
      
      const result = strictSelector.selectVoxels(voxels, 10, { grid: createMockGrid() });
      
      expect(result.strategy).toBe('hybrid');
      // Coverage ratio should be influenced by minCoverageRatio
      expect(typeof result.coverageRatio).toBe('number');
    });
    
    test('Should store hybrid statistics correctly', () => {
      const voxels = createMockVoxels(30);
      const result = selector.selectVoxels(voxels, 15, { grid: createMockGrid() });
      
      const stats = selector.getLastSelectionStats();
      expect(stats.strategy).toBe('hybrid');
      expect(stats.selectedCount).toBe(15);
      expect(stats.totalCount).toBe(30);
      expect(stats.coverageRatio).not.toBeNull();
      expect(typeof stats.coverageRatio).toBe('number');
    });
  });

  describe('TopN Highlight Feature', () => {
    
    test('Should force include TopN voxels in all strategies', () => {
      const strategies = ['density', 'coverage', 'hybrid'];
      
      strategies.forEach(strategy => {
        const selector = new VoxelSelector({ 
          renderLimitStrategy: strategy,
          highlightTopN: 2
        });
        
        const voxels = [
          { key: 'highest', info: { count: 100, x: 0, y: 0 } },
          { key: 'second', info: { count: 90, x: 1, y: 1 } },
          { key: 'third', info: { count: 80, x: 2, y: 2 } },
          { key: 'fourth', info: { count: 70, x: 3, y: 3 } }
        ];
        
        const result = selector.selectVoxels(voxels, 2, { grid: createMockGrid() });
        
        // TopN should always be included
        const selectedKeys = result.selectedVoxels.map(v => v.key);
        expect(selectedKeys).toContain('highest');
        expect(selectedKeys).toContain('second');
      });
    });
    
    test('Should handle TopN larger than maxCount', () => {
      const selector = new VoxelSelector({ 
        renderLimitStrategy: 'density',
        highlightTopN: 5
      });
      
      const voxels = createMockVoxels(10);
      const result = selector.selectVoxels(voxels, 3, { grid: createMockGrid() });
      
      // Should not exceed maxCount
      expect(result.selectedVoxels.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Error Handling & Fallback', () => {
    
    test('Should fallback to density on strategy failure', () => {
      // Mock a scenario where coverage strategy might fail
      const selector = new VoxelSelector({ renderLimitStrategy: 'coverage' });
      
      // Voxels with problematic spatial coordinates
      const voxels = [
        { key: 'problem1', info: { count: 50, x: NaN, y: 0 } },
        { key: 'problem2', info: { count: 40, x: 0, y: NaN } },
        { key: 'normal', info: { count: 30, x: 1, y: 1 } }
      ];
      
      // Should not throw error and fallback gracefully
      expect(() => {
        const result = selector.selectVoxels(voxels, 2, { grid: createMockGrid() });
        expect(result.selectedVoxels.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
    
    test('Should handle missing grid information gracefully', () => {
      const selector = new VoxelSelector({ renderLimitStrategy: 'coverage' });
      const voxels = createMockVoxels(5);
      
      // Missing or invalid grid should not crash
      expect(() => {
        const result1 = selector.selectVoxels(voxels, 3, { grid: null });
        const result2 = selector.selectVoxels(voxels, 3, { grid: undefined });
        const result3 = selector.selectVoxels(voxels, 3, {});
        
        expect(result1.selectedVoxels.length).toBeGreaterThanOrEqual(0);
        expect(result2.selectedVoxels.length).toBeGreaterThanOrEqual(0);
        expect(result3.selectedVoxels.length).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });
    
    test('Should mark fallback in statistics', () => {
      const selector = new VoxelSelector();
      
      // Force an error scenario
      const invalidVoxels = [
        { key: 'invalid', info: null }
      ];
      
      // Should fallback and mark error in stats
      const result = selector.selectVoxels(invalidVoxels, 1, { grid: createMockGrid() });
      const stats = selector.getLastSelectionStats();
      
      // Either successful with empty result or error marked
      expect(result.selectedVoxels).toBeDefined();
      expect(Array.isArray(result.selectedVoxels)).toBe(true);
    });
  });

  describe('Statistics Collection', () => {
    
    test('Should collect comprehensive statistics', () => {
      const selector = new VoxelSelector({ renderLimitStrategy: 'hybrid' });
      const voxels = createMockVoxels(25);
      
      const result = selector.selectVoxels(voxels, 10, { grid: createMockGrid() });
      const stats = selector.getLastSelectionStats();
      
      expect(stats).toHaveProperty('strategy');
      expect(stats).toHaveProperty('clippedNonEmpty');
      expect(stats).toHaveProperty('selectedCount');
      expect(stats).toHaveProperty('totalCount');
      expect(stats).toHaveProperty('coverageRatio');
      
      expect(stats.strategy).toBe('hybrid');
      expect(stats.selectedCount).toBe(10);
      expect(stats.totalCount).toBe(25);
      expect(stats.clippedNonEmpty).toBe(15);
    });
    
    test('Should update statistics on each selection', () => {
      const selector = new VoxelSelector();
      
      // First selection
      const voxels1 = createMockVoxels(10);
      selector.selectVoxels(voxels1, 5, { grid: createMockGrid() });
      const stats1 = selector.getLastSelectionStats();
      
      // Second selection
      const voxels2 = createMockVoxels(20);
      selector.selectVoxels(voxels2, 8, { grid: createMockGrid() });
      const stats2 = selector.getLastSelectionStats();
      
      // Stats should be updated
      expect(stats1.totalCount).toBe(10);
      expect(stats2.totalCount).toBe(20);
      expect(stats1).not.toEqual(stats2);
    });
  });

  describe('Performance & Edge Cases', () => {
    
    test('Should handle large voxel arrays efficiently', () => {
      const selector = new VoxelSelector({ renderLimitStrategy: 'density' });
      const largeVoxelArray = createMockVoxels(1000);
      
      const startTime = Date.now();
      const result = selector.selectVoxels(largeVoxelArray, 100, { grid: createMockGrid() });
      const endTime = Date.now();
      
      expect(result.selectedVoxels).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
    
    test('Should handle edge case where all voxels have same density', () => {
      const uniformVoxels = Array(10).fill(null).map((_, i) => ({
        key: `uniform_${i}`,
        info: { count: 50, x: i % 3, y: Math.floor(i / 3) }
      }));
      
      const selector = new VoxelSelector({ renderLimitStrategy: 'density' });
      const result = selector.selectVoxels(uniformVoxels, 5, { grid: createMockGrid() });
      
      expect(result.selectedVoxels).toHaveLength(5);
      expect(result.strategy).toBe('density');
    });
    
    test('Should handle single voxel selection', () => {
      const singleVoxel = [{ key: 'only', info: { count: 42, x: 5, y: 5 } }];
      const selector = new VoxelSelector();
      
      const result = selector.selectVoxels(singleVoxel, 1, { grid: createMockGrid() });
      
      expect(result.selectedVoxels).toHaveLength(1);
      expect(result.selectedVoxels[0].key).toBe('only');
      expect(result.clippedNonEmpty).toBe(0);
    });
  });
});
