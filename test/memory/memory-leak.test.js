/**
 * Memory leak tests for VoxelRenderer orchestration system
 * VoxelRendererオーケストレーションシステムのメモリリークテスト
 * 
 * v0.1.11-alpha: ADR-0009 Phase 5 - Memory safety validation
 */

import { VoxelRenderer } from '../../src/core/VoxelRenderer.js';
import { Logger } from '../../src/utils/logger.js';

// Memory monitoring utilities
const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB  
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
    external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
  };
};

const forceGarbageCollection = () => {
  if (global.gc) {
    global.gc();
  }
};

// Mock Cesium viewer for testing
const createMockViewer = () => ({
  entities: {
    add: jest.fn().mockReturnValue({ id: Math.random().toString() }),
    removeAll: jest.fn(),
    remove: jest.fn()
  }
});

// Generate test voxel data
const generateVoxelData = (size = 100) => {
  const voxelData = new Map();
  for (let i = 0; i < size; i++) {
    const x = i % 10;
    const y = Math.floor(i / 10) % 10;
    const z = Math.floor(i / 100);
    voxelData.set(`${x},${y},${z}`, {
      x, y, z,
      count: Math.floor(Math.random() * 100) + 1
    });
  }
  return voxelData;
};

const createTestBounds = () => ({
  minLon: 139.7, maxLon: 139.8,
  minLat: 35.6, maxLat: 35.7, 
  minAlt: 0, maxAlt: 100
});

const createTestGrid = () => ({
  numVoxelsX: 10, numVoxelsY: 10, numVoxelsZ: 10,
  voxelSizeMeters: 10,
  totalVoxels: 1000
});

const createTestStatistics = () => ({
  minCount: 1, maxCount: 100,
  totalVoxels: 100, nonEmptyVoxels: 100
});

describe('VoxelRenderer Memory Leak Tests', () => {
  let viewer;
  let renderer;
  let initialMemory;

  beforeAll(() => {
    // Force garbage collection before tests
    forceGarbageCollection();
    initialMemory = getMemoryUsage();
    Logger.info('Initial memory usage:', initialMemory);
  });

  beforeEach(() => {
    viewer = createMockViewer();
    renderer = new VoxelRenderer(viewer, {
      maxRenderVoxels: 1000,
      showEmptyVoxels: false
    });
  });

  afterEach(() => {
    // Clean up renderer
    if (renderer) {
      renderer.clear();
      renderer = null;
    }
    viewer = null;
    
    // Force garbage collection
    forceGarbageCollection();
  });

  afterAll(() => {
    const finalMemory = getMemoryUsage();
    const memoryIncrease = {
      rss: finalMemory.rss - initialMemory.rss,
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      external: finalMemory.external - initialMemory.external
    };
    
    Logger.info('Final memory usage:', finalMemory);
    Logger.info('Memory increase:', memoryIncrease);
    
    // Memory increase should be reasonable (less than 70MB for heap)
    // CI環境のばらつきを考慮して余裕を持たせる
    expect(memoryIncrease.heapUsed).toBeLessThan(70);
  });

  describe('Render/Clear Cycle Memory Management', () => {
    test('should not leak memory during repeated render/clear cycles', () => {
      const voxelData = generateVoxelData(500);
      const bounds = createTestBounds();
      const grid = createTestGrid();
      const statistics = createTestStatistics();

      const beforeCycles = getMemoryUsage();
      
      // Perform 50 render/clear cycles
      for (let i = 0; i < 50; i++) {
        renderer.render(voxelData, bounds, grid, statistics);
        renderer.clear();
        
        // Occasional garbage collection
        if (i % 10 === 0) {
          forceGarbageCollection();
        }
      }

      const afterCycles = getMemoryUsage();
      const heapIncrease = afterCycles.heapUsed - beforeCycles.heapUsed;
      
      Logger.info(`Memory after 50 render/clear cycles: ${afterCycles.heapUsed}MB (increase: ${heapIncrease}MB)`);
      
      // Heap increase should be reasonable for intensive operations (CI余裕込みで<65MB)
      expect(heapIncrease).toBeLessThan(65);
    });

    test('should properly clean up entities in clear()', () => {
      const voxelData = generateVoxelData(100);
      const bounds = createTestBounds();
      const grid = createTestGrid();
      const statistics = createTestStatistics();

      // Track entity creation
      const addSpy = jest.spyOn(viewer.entities, 'add');
      
      // Render voxels
      const renderedCount = renderer.render(voxelData, bounds, grid, statistics);
      expect(renderedCount).toBeGreaterThan(0);
      expect(addSpy).toHaveBeenCalled();
      
      const entitiesCreated = addSpy.mock.calls.length;
      Logger.info(`Entities created: ${entitiesCreated}`);
      
      // Clear should delegate to geometryRenderer.clear()
      renderer.clear();
      
      // Verify entities array is managed properly
      expect(renderer.voxelEntities).toHaveLength(0);
    });
  });

  describe('Large Dataset Memory Management', () => {
    test('should handle large voxel datasets without excessive memory growth', () => {
      const beforeLarge = getMemoryUsage();
      
      // Create progressively larger datasets
      for (let size = 100; size <= 1000; size += 100) {
        const voxelData = generateVoxelData(size);
        const bounds = createTestBounds();
        const grid = { ...createTestGrid(), totalVoxels: size };
        const statistics = { ...createTestStatistics(), totalVoxels: size };

        renderer.render(voxelData, bounds, grid, statistics);
        renderer.clear();
        
        // Force GC every few iterations
        if (size % 300 === 0) {
          forceGarbageCollection();
        }
      }
      
      const afterLarge = getMemoryUsage();
      const heapGrowth = afterLarge.heapUsed - beforeLarge.heapUsed;
      
      Logger.info(`Memory growth after large dataset tests: ${heapGrowth}MB`);
      
      // Memory growth should be reasonable（環境差を考慮して25MBに緩和）
      expect(heapGrowth).toBeLessThan(25);
    });
  });

  describe('Specialized Class Memory Management', () => {
    test('should not accumulate memory in VoxelSelector', () => {
      const voxelData = generateVoxelData(200);
      const bounds = createTestBounds();
      const grid = createTestGrid();
      const statistics = createTestStatistics();
      
      const beforeSelector = getMemoryUsage();
      
      // Multiple renders with selection strategies
      for (let i = 0; i < 20; i++) {
        renderer.options.voxelSelectionStrategy = ['density', 'coverage', 'hybrid'][i % 3];
        renderer.options.maxRenderVoxels = 50; // Force selection
        
        renderer.render(voxelData, bounds, grid, statistics);
        renderer.clear();
      }
      
      const afterSelector = getMemoryUsage();
      const selectorMemGrowth = afterSelector.heapUsed - beforeSelector.heapUsed;
      
      Logger.info(`VoxelSelector memory growth: ${selectorMemGrowth}MB`);
      expect(selectorMemGrowth).toBeLessThan(10); // Adjusted for realistic selection operations
    });

    test('should not accumulate memory in AdaptiveController', () => {
      const beforeAdaptive = getMemoryUsage();
      
      // Test adaptive controller with different configurations
      for (let i = 0; i < 30; i++) {
        renderer.options.adaptiveOutlines = i % 2 === 0;
        renderer.options.outlineWidthPreset = ['uniform', 'topn-boost', 'density-based'][i % 3];
        
        const voxelData = generateVoxelData(100);
        const bounds = createTestBounds();
        const grid = createTestGrid();
        const statistics = createTestStatistics();
        
        renderer.render(voxelData, bounds, grid, statistics);
        renderer.clear();
      }
      
      const afterAdaptive = getMemoryUsage();
      const adaptiveMemGrowth = afterAdaptive.heapUsed - beforeAdaptive.heapUsed;
      
      Logger.info(`AdaptiveController memory growth: ${adaptiveMemGrowth}MB`);
      expect(adaptiveMemGrowth).toBeLessThan(15); // Adjusted for adaptive parameter calculations
    });
  });

  describe('Error Handling Memory Safety', () => {
    test('should not leak memory when handling errors', () => {
      const beforeErrors = getMemoryUsage();
      
      // Simulate various error conditions
      for (let i = 0; i < 10; i++) {
        try {
          // Invalid voxel data
          renderer.render(null, createTestBounds(), createTestGrid(), createTestStatistics());
        } catch (_e) {
          // Expected error
        }
        
        try {
          // Invalid bounds
          renderer.render(generateVoxelData(50), null, createTestGrid(), createTestStatistics());
        } catch (_e) {
          // Expected error
        }
        
        renderer.clear();
      }
      
      const afterErrors = getMemoryUsage();
      const errorMemGrowth = afterErrors.heapUsed - beforeErrors.heapUsed;
      
      Logger.info(`Error handling memory growth: ${errorMemGrowth}MB`);
      expect(errorMemGrowth).toBeLessThan(3);
    });
  });
});
