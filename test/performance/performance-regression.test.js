/**
 * Performance regression test for v0.1.12
 * Phase 4: Quality assurance - performance degradation check
 */

import { Heatbox } from '../../src/Heatbox.js';

describe('Performance Regression Tests v0.1.12', () => {
  let mockViewer;

  beforeEach(() => {
    // Mock CesiumJS Viewer
    mockViewer = {
      scene: {
        postRender: {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        },
        globe: { show: true }
      },
      entities: {
        add: jest.fn().mockReturnValue({ id: 'mock-entity' }),
        remove: jest.fn(),
        removeAll: jest.fn()
      },
      camera: {
        flyTo: jest.fn(),
        setView: jest.fn()
      }
    };
  });

  describe('Profile Performance Benchmarks', () => {
    const testDataSizes = [
      { name: 'small', count: 100 },
      { name: 'medium', count: 1000 },
      { name: 'large', count: 5000 }
    ];

    const profiles = ['mobile-fast', 'desktop-balanced', 'dense-data', 'sparse-data'];

    testDataSizes.forEach(({ name, count }) => {
      profiles.forEach(profile => {
        test(`should maintain performance for ${profile} profile with ${name} dataset (${count} points)`, async () => {
          const testData = generateTestData(count);
          
          const heatbox = new Heatbox(mockViewer, {
            profile,
            performanceOverlay: { enabled: false } // Disable overlay for cleaner benchmarking
          });

          // Benchmark the setData operation
          const startTime = performance.now();
          
          try {
            heatbox.setData(testData);
            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // Performance expectations based on profile and data size
            const expectedMaxTimes = {
              'mobile-fast': { small: 50, medium: 150, large: 400 },
              'desktop-balanced': { small: 80, medium: 200, large: 500 },
              'dense-data': { small: 100, medium: 250, large: 600 },
              'sparse-data': { small: 60, medium: 180, large: 450 }
            };

            const maxTime = expectedMaxTimes[profile][name];
            
            expect(renderTime).toBeLessThan(maxTime);

            // Check that rendering actually happened
            const stats = heatbox.getStatistics();
            expect(stats.totalVoxels).toBeGreaterThan(0);
            expect(stats.renderedVoxels).toBeGreaterThan(0);

            console.log(`${profile} ${name}: ${renderTime.toFixed(2)}ms (${stats.renderedVoxels}/${stats.totalVoxels} voxels)`);
          } finally {
            heatbox.clear();
          }
        });
      });
    });
  });

  describe('Memory Usage Regression', () => {
    test('should not exceed expected memory usage patterns', () => {
      const testData = generateTestData(2000);
      
      const heatbox = new Heatbox(mockViewer, {
        profile: 'desktop-balanced'
      });

      heatbox.setData(testData);
      
      // Get estimated memory usage
      const estimated = heatbox._estimateMemoryUsage();
      
      // Should be reasonable for 2000 data points
      expect(estimated).toBeLessThan(50); // Less than 50MB
      expect(estimated).toBeGreaterThan(0.1); // At least 0.1MB
      
      heatbox.clear();
    });

    test('should clean up memory properly on clear', () => {
      const heatbox = new Heatbox(mockViewer, {
        profile: 'mobile-fast'
      });

      const testData = generateTestData(1000);
      heatbox.setData(testData);
      
      const beforeClear = heatbox._estimateMemoryUsage();
      heatbox.clear();
      const afterClear = heatbox._estimateMemoryUsage();
      
      // Memory usage should decrease significantly
      expect(afterClear).toBeLessThan(beforeClear * 0.5);
    });
  });

  describe('Adaptive Control Performance', () => {
    test('should handle adaptive outlines without significant overhead', () => {
      const testData = generateTestData(1500);
      
      // Test with adaptive outlines disabled
      const staticHeatbox = new Heatbox(mockViewer, {
        adaptiveOutlines: false,
        outlineWidthPreset: 'medium'
      });

      const staticStart = performance.now();
      staticHeatbox.setData(testData);
      const staticTime = performance.now() - staticStart;
      staticHeatbox.clear();

      // Test with adaptive outlines enabled
      const adaptiveHeatbox = new Heatbox(mockViewer, {
        adaptiveOutlines: true,
        outlineWidthPreset: 'adaptive',
        adaptiveParams: {
          outlineWidthRange: [1, 4],
          outlineOpacityRange: [0.4, 1.0]
        }
      });

      const adaptiveStart = performance.now();
      adaptiveHeatbox.setData(testData);
      const adaptiveTime = performance.now() - adaptiveStart;
      adaptiveHeatbox.clear();

      // Adaptive control should not add more than 50% overhead
      const overhead = (adaptiveTime - staticTime) / staticTime;
      expect(overhead).toBeLessThan(0.5);

      console.log(`Static: ${staticTime.toFixed(2)}ms, Adaptive: ${adaptiveTime.toFixed(2)}ms, Overhead: ${(overhead * 100).toFixed(1)}%`);
    });
  });

  describe('Performance Overlay Impact', () => {
    test('should have minimal impact when overlay is enabled but hidden', () => {
      const testData = generateTestData(1000);
      
      // Without overlay
      const noOverlayHeatbox = new Heatbox(mockViewer, {
        profile: 'desktop-balanced'
      });

      const noOverlayStart = performance.now();
      noOverlayHeatbox.setData(testData);
      const noOverlayTime = performance.now() - noOverlayStart;
      noOverlayHeatbox.clear();

      // With overlay enabled but hidden
      const overlayHeatbox = new Heatbox(mockViewer, {
        profile: 'desktop-balanced',
        performanceOverlay: {
          enabled: true,
          autoShow: false
        }
      });

      const overlayStart = performance.now();
      overlayHeatbox.setData(testData);
      const overlayTime = performance.now() - overlayStart;
      overlayHeatbox.clear();

      // Overlay should add minimal overhead when hidden
      const overhead = (overlayTime - noOverlayTime) / noOverlayTime;
      expect(overhead).toBeLessThan(0.2); // Less than 20% overhead

      console.log(`No overlay: ${noOverlayTime.toFixed(2)}ms, With overlay: ${overlayTime.toFixed(2)}ms, Overhead: ${(overhead * 100).toFixed(1)}%`);
    });
  });

  describe('Migration Path Performance', () => {
    test('should maintain performance when using deprecated options', () => {
      const testData = generateTestData(800);
      
      // New v0.1.12 configuration
      const newConfigHeatbox = new Heatbox(mockViewer, {
        fitViewOptions: {
          pitchDegrees: -45,
          headingDegrees: 0
        },
        outlineRenderMode: 'standard',
        emulationScope: 'topn',
        outlineWidthPreset: 'medium'
      });

      const newStart = performance.now();
      newConfigHeatbox.setData(testData);
      const newTime = performance.now() - newStart;
      newConfigHeatbox.clear();

      // Legacy v0.1.11 configuration (with deprecation warnings)
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const legacyConfigHeatbox = new Heatbox(mockViewer, {
        fitViewOptions: {
          pitch: -45,     // deprecated
          heading: 0      // deprecated
        },
        outlineEmulation: 'topn',        // deprecated
        outlineWidthPreset: 'uniform'    // deprecated
      });

      const legacyStart = performance.now();
      legacyConfigHeatbox.setData(testData);
      const legacyTime = performance.now() - legacyStart;
      legacyConfigHeatbox.clear();

      consoleWarnSpy.mockRestore();

      // Legacy configuration should not be significantly slower
      const difference = Math.abs(legacyTime - newTime) / newTime;
      expect(difference).toBeLessThan(0.3); // Less than 30% difference

      console.log(`New config: ${newTime.toFixed(2)}ms, Legacy config: ${legacyTime.toFixed(2)}ms, Difference: ${(difference * 100).toFixed(1)}%`);
    });
  });

  describe('Large Dataset Stress Test', () => {
    test('should handle maximum recommended voxel counts within time limits', () => {
      // Test with maximum recommended voxel counts for each profile
      const maxVoxelTests = [
        { profile: 'mobile-fast', maxVoxels: 5000, timeLimit: 500 },
        { profile: 'desktop-balanced', maxVoxels: 15000, timeLimit: 800 },
        { profile: 'dense-data', maxVoxels: 25000, timeLimit: 1200 },
        { profile: 'sparse-data', maxVoxels: 8000, timeLimit: 600 }
      ];

      maxVoxelTests.forEach(({ profile, maxVoxels, timeLimit }) => {
        const testData = generateTestData(maxVoxels);
        
        const heatbox = new Heatbox(mockViewer, { profile });

        const startTime = performance.now();
        heatbox.setData(testData);
        const renderTime = performance.now() - startTime;
        
        expect(renderTime).toBeLessThan(timeLimit);

        const stats = heatbox.getStatistics();
        expect(stats.renderedVoxels).toBeLessThanOrEqual(maxVoxels);

        console.log(`${profile} stress test: ${renderTime.toFixed(2)}ms for ${stats.renderedVoxels}/${stats.totalVoxels} voxels`);
        
        heatbox.clear();
      });
    });
  });
});

/**
 * Generate test data for performance testing
 * @param {number} count - Number of data points to generate
 * @returns {Array} Array of mock entities
 */
function generateTestData(count) {
  const entities = [];
  
  for (let i = 0; i < count; i++) {
    // Create realistic clustered data
    const isCluster = i % 10 === 0;
    const baseValue = isCluster ? 80 + Math.random() * 20 : Math.random() * 60;
    
    entities.push({
      id: `test-entity-${i}`,
      position: {
        x: 1000 + Math.random() * 2000,
        y: 2000 + Math.random() * 2000,
        z: Math.random() * 500
      },
      properties: {
        value: baseValue
      }
    });
  }
  
  return entities;
}
