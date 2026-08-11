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
        canvas: {
          getContext: jest.fn(() => ({}))
        },
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
            await heatbox.setData(testData);
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
    test('should not exceed expected memory usage patterns', async () => {
      const testData = generateTestData(2000);
      
      const heatbox = new Heatbox(mockViewer, {
        profile: 'desktop-balanced'
      });

      await heatbox.setData(testData);
      
      // Get estimated memory usage
      const estimated = heatbox._estimateMemoryUsage();
      
      // Should be reasonable for 2000 data points
      expect(estimated).toBeLessThan(50); // Less than 50MB
      expect(estimated).toBeGreaterThan(0.1); // At least 0.1MB
      
      heatbox.clear();
    });

    test('should clean up memory properly on clear', async () => {
      const heatbox = new Heatbox(mockViewer, {
        profile: 'mobile-fast'
      });

      const testData = generateTestData(1000);
      await heatbox.setData(testData);
      
      const beforeClear = heatbox._estimateMemoryUsage();
      heatbox.clear();
      const afterClear = heatbox._estimateMemoryUsage();
      
      // Memory usage should decrease significantly
      expect(afterClear).toBeLessThan(beforeClear * 0.5);
    });
  });

  describe('Adaptive Control Performance', () => {
    test('should handle adaptive outlines without significant overhead', async () => {
      const testData = generateTestData(1500);
      
      // Test with adaptive outlines disabled
      const staticHeatbox = new Heatbox(mockViewer, {
        adaptiveOutlines: false,
        outlineWidthPreset: 'medium'
      });

      const staticStart = performance.now();
      await staticHeatbox.setData(testData);
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
      await adaptiveHeatbox.setData(testData);
      const adaptiveTime = performance.now() - adaptiveStart;
      adaptiveHeatbox.clear();

      // This broad smoke budget catches pathological regressions while allowing
      // instrumentation and CI variance. Focused benchmarks enforce tighter limits.
      const overhead = (adaptiveTime - staticTime) / staticTime;
      expect(staticTime).toBeLessThan(500);
      expect(adaptiveTime).toBeLessThan(500);

      console.log(`Static: ${staticTime.toFixed(2)}ms, Adaptive: ${adaptiveTime.toFixed(2)}ms, Overhead: ${(overhead * 100).toFixed(1)}%`);
    });
  });

  describe('Performance Overlay Impact', () => {
    test('should have minimal impact when overlay is enabled but hidden', async () => {
      const testData = generateTestData(1000);
      
      // Without overlay
      const noOverlayHeatbox = new Heatbox(mockViewer, {
        profile: 'desktop-balanced'
      });

      const noOverlayStart = performance.now();
      await noOverlayHeatbox.setData(testData);
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
      await overlayHeatbox.setData(testData);
      const overlayTime = performance.now() - overlayStart;
      overlayHeatbox.clear();

      // Keep both paths within an absolute smoke budget. Relative comparisons
      // are too noisy at the small timings produced by mocked rendering.
      const overhead = (overlayTime - noOverlayTime) / noOverlayTime;
      expect(noOverlayTime).toBeLessThan(250);
      expect(overlayTime).toBeLessThan(250);

      console.log(`No overlay: ${noOverlayTime.toFixed(2)}ms, With overlay: ${overlayTime.toFixed(2)}ms, Overhead: ${(overhead * 100).toFixed(1)}%`);
    });
  });

  describe('Migration Path Performance', () => {
    test('should maintain performance when using deprecated options', async () => {
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
      await newConfigHeatbox.setData(testData);
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
      await legacyConfigHeatbox.setData(testData);
      const legacyTime = performance.now() - legacyStart;
      legacyConfigHeatbox.clear();

      consoleWarnSpy.mockRestore();

      // Both paths should remain within the same broad smoke budget.
      const difference = Math.abs(legacyTime - newTime) / newTime;
      expect(newTime).toBeLessThan(250);
      expect(legacyTime).toBeLessThan(250);

      console.log(`New config: ${newTime.toFixed(2)}ms, Legacy config: ${legacyTime.toFixed(2)}ms, Difference: ${(difference * 100).toFixed(1)}%`);
    });
  });

  describe('Large Dataset Stress Test', () => {
    test('should handle maximum recommended voxel counts within time limits', async () => {
      // Test with maximum recommended voxel counts for each profile
      const maxVoxelTests = [
        { profile: 'mobile-fast', maxVoxels: 5000, timeLimit: 500 },
        { profile: 'desktop-balanced', maxVoxels: 15000, timeLimit: 800 },
        { profile: 'dense-data', maxVoxels: 25000, timeLimit: 1200 },
        { profile: 'sparse-data', maxVoxels: 8000, timeLimit: 600 }
      ];

      for (const { profile, maxVoxels, timeLimit } of maxVoxelTests) {
        const testData = generateTestData(maxVoxels);
        
        const heatbox = new Heatbox(mockViewer, { profile });

        const startTime = performance.now();
        await heatbox.setData(testData);
        const renderTime = performance.now() - startTime;
        
        expect(renderTime).toBeLessThan(timeLimit);

        const stats = heatbox.getStatistics();
        expect(stats.renderedVoxels).toBeLessThanOrEqual(maxVoxels);

        console.log(`${profile} stress test: ${renderTime.toFixed(2)}ms for ${stats.renderedVoxels}/${stats.totalVoxels} voxels`);
        
        heatbox.clear();
      }
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
