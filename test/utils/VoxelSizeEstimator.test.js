/**
 * Test suite for VoxelSizeEstimator
 * VoxelSizeEstimator のテストスイート
 */

import { VoxelSizeEstimator } from '../../src/utils/voxelSizeEstimator.js';

describe('VoxelSizeEstimator', () => {
  const sampleBounds = {
    west: 2.4383 * Math.PI / 180,  // 約139.69°
    east: 2.4408 * Math.PI / 180,  // 約139.74°
    south: 0.6228 * Math.PI / 180, // 約35.67°
    north: 0.6240 * Math.PI / 180, // 約35.74°
    minimumHeight: 0,
    maximumHeight: 100
  };

  describe('Basic estimation mode', () => {
    test('should estimate reasonable size for high density data', () => {
      const entityCount = 10000;
      const size = VoxelSizeEstimator.estimateBasic(sampleBounds, entityCount);
      
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(100);
      expect(size).toBeGreaterThanOrEqual(1);
    });

    test('should estimate larger size for low density data', () => {
      const lowDensityCount = 100;
      const highDensityCount = 10000;
      
      const lowSize = VoxelSizeEstimator.estimateBasic(sampleBounds, lowDensityCount);
      const highSize = VoxelSizeEstimator.estimateBasic(sampleBounds, highDensityCount);
      
      expect(lowSize).toBeGreaterThan(highSize);
    });

    test('should handle zero entities gracefully', () => {
      const size = VoxelSizeEstimator.estimateBasic(sampleBounds, 0);
      
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(100);
    });

    test('should respect performance limits', () => {
      const entityCount = 1000000; // Very high density
      const size = VoxelSizeEstimator.estimateBasic(sampleBounds, entityCount);
      
      expect(size).toBeGreaterThanOrEqual(1); // PERFORMANCE_LIMITS.minVoxelSize
      expect(size).toBeLessThanOrEqual(100); // PERFORMANCE_LIMITS.maxVoxelSize
    });
  });

  describe('Occupancy estimation mode', () => {
    test('should estimate size based on target fill ratio', () => {
      const entityCount = 5000;
      const options = {
        maxRenderVoxels: 10000,
        autoVoxelTargetFill: 0.5
      };
      
      const size = VoxelSizeEstimator.estimateByOccupancy(sampleBounds, entityCount, options);
      
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(100);
    });

    test('should converge within maximum iterations', () => {
      const entityCount = 5000;
      const options = {
        maxRenderVoxels: 15000,
        autoVoxelTargetFill: 0.6
      };
      
      const size = VoxelSizeEstimator.estimateByOccupancy(sampleBounds, entityCount, options);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    test('should handle edge cases with very high target fill', () => {
      const entityCount = 1000;
      const options = {
        maxRenderVoxels: 50000,
        autoVoxelTargetFill: 0.9
      };
      
      const size = VoxelSizeEstimator.estimateByOccupancy(sampleBounds, entityCount, options);
      
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(100);
    });

    test('should handle edge cases with very low target fill', () => {
      const entityCount = 10000;
      const options = {
        maxRenderVoxels: 5000,
        autoVoxelTargetFill: 0.1
      };
      
      const size = VoxelSizeEstimator.estimateByOccupancy(sampleBounds, entityCount, options);
      
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(100);
    });
  });

  describe('Main estimation interface', () => {
    test('should delegate to basic mode when mode is "basic"', () => {
      const data = new Array(1000).fill(null);
      const size = VoxelSizeEstimator.estimate(data, sampleBounds, 'basic');
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    test('should delegate to occupancy mode when mode is "occupancy"', () => {
      const data = new Array(1000).fill(null);
      const options = {
        maxRenderVoxels: 10000,
        autoVoxelTargetFill: 0.6
      };
      const size = VoxelSizeEstimator.estimate(data, sampleBounds, 'occupancy', options);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    test('should support backward compatibility with entityCount in options', () => {
      const options = {
        entityCount: 1500,
        maxRenderVoxels: 10000,
        autoVoxelTargetFill: 0.6
      };
      const size = VoxelSizeEstimator.estimate(null, sampleBounds, 'basic', options);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    test('should default to basic mode for unknown modes', () => {
      const data = new Array(500).fill(null);
      const size = VoxelSizeEstimator.estimate(data, sampleBounds, 'unknown');
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    test('should handle errors gracefully', () => {
      // Pass invalid bounds to trigger error
      const invalidBounds = null;
      const size = VoxelSizeEstimator.estimate([], invalidBounds, 'basic');
      
      expect(size).toBe(20); // Default fallback size
    });
  });

  describe('Data range calculation', () => {
    test('should calculate correct data range from bounds', () => {
      const range = VoxelSizeEstimator.calculateDataRange(sampleBounds);
      
      expect(range).toHaveProperty('x');
      expect(range).toHaveProperty('y');
      expect(range).toHaveProperty('z');
      expect(range.x).toBeGreaterThan(0);
      expect(range.y).toBeGreaterThan(0);
      expect(range.z).toBeGreaterThan(0);
    });

    test('should handle minimal altitude difference', () => {
      const flatBounds = {
        ...sampleBounds,
        minimumHeight: 50,
        maximumHeight: 50 // Same height
      };
      
      const range = VoxelSizeEstimator.calculateDataRange(flatBounds);
      
      expect(range.z).toBeGreaterThanOrEqual(0);
    });

    test('should convert degrees to meters approximately', () => {
      const range = VoxelSizeEstimator.calculateDataRange(sampleBounds);
      
      // The sample bounds span ~0.0025 degrees longitude and ~0.0012 degrees latitude
      // At Tokyo latitude (35.7°), this should be roughly 200-300m longitude and 130m latitude
      expect(range.x).toBeGreaterThan(200);
      expect(range.x).toBeLessThan(400);
      
      expect(range.y).toBeGreaterThan(100);
      expect(range.y).toBeLessThan(200);
    });
  });

  describe('Estimation metadata', () => {
    test('should provide comprehensive metadata for basic mode', () => {
      const entityCount = 2000;
      const metadata = VoxelSizeEstimator.getEstimationMetadata(sampleBounds, entityCount, 'basic');
      
      expect(metadata).toHaveProperty('mode', 'basic');
      expect(metadata).toHaveProperty('entityCount', entityCount);
      expect(metadata).toHaveProperty('dataRange');
      expect(metadata).toHaveProperty('volume');
      expect(metadata).toHaveProperty('density');
      expect(metadata).toHaveProperty('densityCategory');
      
      expect(['high', 'medium', 'low']).toContain(metadata.densityCategory);
    });

    test('should provide comprehensive metadata for occupancy mode', () => {
      const entityCount = 8000;
      const metadata = VoxelSizeEstimator.getEstimationMetadata(sampleBounds, entityCount, 'occupancy');
      
      expect(metadata).toHaveProperty('mode', 'occupancy');
      expect(metadata).toHaveProperty('entityCount', entityCount);
      expect(metadata.density).toBeGreaterThan(0);
    });

    test('should categorize density correctly', () => {
      const highDensityMetadata = VoxelSizeEstimator.getEstimationMetadata(sampleBounds, 50000, 'basic');
      const lowDensityMetadata = VoxelSizeEstimator.getEstimationMetadata(sampleBounds, 10, 'basic');
      
      // High density data should result in 'high' or 'medium' category
      expect(['high', 'medium']).toContain(highDensityMetadata.densityCategory);
      
      // Low density data should result in 'low' category
      expect(lowDensityMetadata.densityCategory).toBe('low');
    });
  });

  describe('Performance', () => {
    test('should complete basic estimation quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        VoxelSizeEstimator.estimateBasic(sampleBounds, 1000 + i);
      }
      
      const end = performance.now();
      const totalTime = end - start;
      
      expect(totalTime).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should complete occupancy estimation within reasonable time', () => {
      const start = performance.now();
      
      const options = {
        maxRenderVoxels: 10000,
        autoVoxelTargetFill: 0.6
      };
      
      for (let i = 0; i < 10; i++) {
        VoxelSizeEstimator.estimateByOccupancy(sampleBounds, 5000 + i * 100, options);
      }
      
      const end = performance.now();
      const totalTime = end - start;
      
      expect(totalTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
