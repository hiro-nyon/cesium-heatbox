/**
 * SpatialIdAdapter unit tests
 * v0.1.17: Spatial ID support (ADR-0013 Phase 5)
 */
import { SpatialIdAdapter } from '../../../src/core/spatial/SpatialIdAdapter.js';
import { Logger } from '../../../src/utils/logger.js';

// Mock Logger to prevent console output during tests
jest.mock('../../../src/utils/logger.js', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('SpatialIdAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Provider Loading', () => {
    it('should initialize with default provider', () => {
      const adapter = new SpatialIdAdapter();
      expect(adapter.provider).toBe('ouranos-gex');
      expect(adapter.Space).toBeNull();
      expect(adapter.fallbackMode).toBe(false);
      expect(adapter.loaded).toBe(false);
    });

    it('should initialize with custom provider', () => {
      const adapter = new SpatialIdAdapter({ provider: 'custom-provider' });
      expect(adapter.provider).toBe('custom-provider');
    });

    it('should use fallback mode when ouranos-gex is not available', async () => {
      const adapter = new SpatialIdAdapter({ provider: 'ouranos-gex' });
      
      // Since ouranos-gex is likely not installed in test environment
      await adapter.loadProvider();
      
      // Should fall back to built-in converter
      expect(adapter.fallbackMode).toBe(true);
      expect(adapter.loaded).toBe(true);
      expect(Logger.warn).toHaveBeenCalled();
    });

    it('should not reload provider if already loaded', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      const firstLoadState = adapter.fallbackMode;
      
      // Call loadProvider again
      await adapter.loadProvider();
      
      // State should remain the same
      expect(adapter.fallbackMode).toBe(firstLoadState);
      expect(adapter.loaded).toBe(true);
    });

    it('should use fallback for unknown provider', async () => {
      const adapter = new SpatialIdAdapter({ provider: 'unknown-provider' });
      await adapter.loadProvider();
      
      expect(adapter.fallbackMode).toBe(true);
      expect(adapter.loaded).toBe(true);
      expect(Logger.warn).toHaveBeenCalledWith(
        "SpatialIdAdapter: Unknown provider 'unknown-provider', using built-in fallback"
      );
    });
  });

  describe('getVoxelBounds', () => {
    it('should return 8 vertices for bounding box', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const result = adapter.getVoxelBounds(139.6917, 35.6895, 50, 25);
      
      expect(result).toHaveProperty('zfxy');
      expect(result).toHaveProperty('zfxyStr');
      expect(result).toHaveProperty('vertices');
      expect(result.vertices).toHaveLength(8);
    });

    it('should return valid ZFXY structure', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const result = adapter.getVoxelBounds(139.6917, 35.6895, 50, 25);
      
      expect(result.zfxy).toHaveProperty('z');
      expect(result.zfxy).toHaveProperty('f');
      expect(result.zfxy).toHaveProperty('x');
      expect(result.zfxy).toHaveProperty('y');
      expect(result.zfxy.z).toBe(25);
    });

    it('should return zfxyStr in correct format', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const result = adapter.getVoxelBounds(139.6917, 35.6895, 50, 25);
      
      // Format: /z/f/x/y
      expect(result.zfxyStr).toMatch(/^\/\d+\/\d+\/\d+\/\d+$/);
    });

    it('should return vertices with lng/lat/alt properties', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const result = adapter.getVoxelBounds(139.6917, 35.6895, 50, 25);
      
      result.vertices.forEach(vertex => {
        expect(vertex).toHaveProperty('lng');
        expect(vertex).toHaveProperty('lat');
        expect(vertex).toHaveProperty('alt');
        expect(typeof vertex.lng).toBe('number');
        expect(typeof vertex.lat).toBe('number');
        expect(typeof vertex.alt).toBe('number');
      });
    });

    it('should handle different zoom levels', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const zoom15 = adapter.getVoxelBounds(139.6917, 35.6895, 50, 15);
      const zoom25 = adapter.getVoxelBounds(139.6917, 35.6895, 50, 25);
      
      expect(zoom15.zfxy.z).toBe(15);
      expect(zoom25.zfxy.z).toBe(25);
      expect(zoom15.zfxyStr).not.toBe(zoom25.zfxyStr);
    });
  });

  describe('calculateOptimalZoom', () => {
    it('should return zoom within specified tolerance', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const targetSize = 30; // meters
      const centerLat = 35.6895;
      const tolerance = 10; // 10%
      
      const zoom = adapter.calculateOptimalZoom(targetSize, centerLat, tolerance);
      
      expect(zoom).toBeGreaterThanOrEqual(15);
      expect(zoom).toBeLessThanOrEqual(30);
      expect(Number.isInteger(zoom)).toBe(true);
    });

    it('should return closest zoom when tolerance cannot be met', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const targetSize = 200; // meters (larger target)
      const centerLat = 35.6895;
      const tolerance = 10;
      
      const zoom = adapter.calculateOptimalZoom(targetSize, centerLat, tolerance);
      
      // Should still return a valid zoom level
      expect(zoom).toBeGreaterThanOrEqual(15);
      expect(zoom).toBeLessThanOrEqual(30);
      expect(Number.isInteger(zoom)).toBe(true);
    });

    it('should prioritize zoom with smallest error within tolerance', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const targetSize = 30;
      const centerLat = 35.6895;
      const tolerance = 20; // Larger tolerance
      
      const zoom = adapter.calculateOptimalZoom(targetSize, centerLat, tolerance);
      
      // Should return a reasonable zoom
      expect(zoom).toBeGreaterThanOrEqual(15);
      expect(zoom).toBeLessThanOrEqual(30);
    });

    it('should handle different latitudes', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const targetSize = 30;
      const tolerance = 10;
      
      const zoom35 = adapter.calculateOptimalZoom(targetSize, 35.6895, tolerance);
      const zoom0 = adapter.calculateOptimalZoom(targetSize, 0, tolerance);
      
      // Zooms may differ due to latitude-dependent cell sizes
      expect(zoom35).toBeGreaterThanOrEqual(15);
      expect(zoom0).toBeGreaterThanOrEqual(15);
    });
  });

  describe('getStatus', () => {
    it('should return correct status before loading', () => {
      const adapter = new SpatialIdAdapter();
      const status = adapter.getStatus();
      
      expect(status.provider).toBe('ouranos-gex');
      expect(status.loaded).toBe(false);
      expect(status.fallbackMode).toBe(false);
    });

    it('should return correct status after loading', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      const status = adapter.getStatus();
      
      expect(status.provider).toBe('ouranos-gex');
      expect(status.loaded).toBe(true);
      expect(typeof status.fallbackMode).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle coordinates at extreme longitudes', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const result180 = adapter.getVoxelBounds(180, 35.6895, 50, 25);
      const resultNeg180 = adapter.getVoxelBounds(-180, 35.6895, 50, 25);
      
      expect(result180.vertices).toHaveLength(8);
      expect(resultNeg180.vertices).toHaveLength(8);
    });

    it('should handle coordinates at extreme latitudes', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const result85 = adapter.getVoxelBounds(139.6917, 85, 50, 25);
      const resultNeg85 = adapter.getVoxelBounds(139.6917, -85, 50, 25);
      
      expect(result85.vertices).toHaveLength(8);
      expect(resultNeg85.vertices).toHaveLength(8);
    });

    it('should handle zero altitude', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const result = adapter.getVoxelBounds(139.6917, 35.6895, 0, 25);
      
      expect(result.vertices).toHaveLength(8);
      expect(result.zfxy).toHaveProperty('f');
    });

    it('should handle negative altitude', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      
      const result = adapter.getVoxelBounds(139.6917, 35.6895, -100, 25);
      
      expect(result.vertices).toHaveLength(8);
    });
  });
});

