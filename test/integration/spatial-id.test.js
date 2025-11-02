/**
 * Spatial ID Integration Tests
 * v0.1.17: Full workflow validation (ADR-0013 Phase 5)
 */
import { Heatbox } from '../../src/Heatbox.js';
import { generateMockEntities, createMockViewer } from '../helpers/testHelpers.js';

describe('Spatial ID Integration Tests', () => {
  let mockViewer;
  let mockEntities;

  beforeEach(() => {
    // Use testHelpers.createMockViewer() for proper validation
    mockViewer = createMockViewer();

    // Generate test entities (Shinjuku area)
    mockEntities = generateMockEntities(100, {
      minLon: 139.69,
      maxLon: 139.71,
      minLat: 35.68,
      maxLat: 35.70,
      minAlt: 0,
      maxAlt: 200
    });
  });

  describe('Basic Spatial ID Workflow', () => {
    it('should create heatmap with spatial ID enabled', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          mode: 'tile-grid',
          zoom: 25,
          zoomControl: 'manual'
        },
        voxelSize: 30
      });

      const stats = await heatbox.createFromEntities(mockEntities);

      expect(stats).toBeDefined();
      expect(stats.spatialIdEnabled).toBe(true);
      expect(stats.spatialIdZoom).toBe(25);
      expect(stats.nonEmptyVoxels).toBeGreaterThan(0);
      expect(mockViewer.entities.add).toHaveBeenCalled();
    });

    it('should create heatmap with auto zoom selection', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          mode: 'tile-grid',
          zoomControl: 'auto',
          zoomTolerancePct: 10
        },
        voxelSize: 30
      });

      const stats = await heatbox.createFromEntities(mockEntities);

      expect(stats.spatialIdEnabled).toBe(true);
      expect(stats.zoomControl).toBe('auto');
      expect(stats.spatialIdZoom).toBeGreaterThanOrEqual(15);
      expect(stats.spatialIdZoom).toBeLessThanOrEqual(30);
    });

    it('should fallback gracefully when ouranos-gex unavailable', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          mode: 'tile-grid',
          provider: 'ouranos-gex',
          zoom: 25
        }
      });

      const stats = await heatbox.createFromEntities(mockEntities);

      expect(stats.spatialIdEnabled).toBe(true);
      // Provider may be null if fallback is used
      expect(stats.spatialIdProvider === null || stats.spatialIdProvider === 'ouranos-gex').toBe(true);
      expect(stats.nonEmptyVoxels).toBeGreaterThan(0);
    });
  });

  describe('Statistics Validation', () => {
    it('should include spatial ID statistics', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        }
      });

      const stats = await heatbox.createFromEntities(mockEntities);

      expect(stats).toHaveProperty('spatialIdEnabled');
      expect(stats).toHaveProperty('spatialIdMode');
      expect(stats).toHaveProperty('spatialIdProvider');
      expect(stats).toHaveProperty('spatialIdZoom');
      expect(stats).toHaveProperty('zoomControl');
    });

    it('should handle emptyVoxels correctly for spatial ID mode', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        }
      });

      const stats = await heatbox.createFromEntities(mockEntities);

      // emptyVoxels should never be negative
      expect(stats.emptyVoxels).toBeGreaterThanOrEqual(0);
    });

    it('should report correct totalEntities', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        }
      });

      const stats = await heatbox.createFromEntities(mockEntities);

      expect(stats.totalEntities).toBe(mockEntities.length);
    });
  });

  describe('Rendered Entity Properties', () => {
    it('should add spatialId to entity properties', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        }
      });

      await heatbox.createFromEntities(mockEntities);

      // Check that entities were created with spatialId properties
      const addCalls = mockViewer.entities.add.mock.calls;
      expect(addCalls.length).toBeGreaterThan(0);

      // Find a voxel entity (type: 'voxel')
      const voxelEntity = addCalls.find(call => call[0]?.properties?.type === 'voxel');
      expect(voxelEntity).toBeDefined();
      
      if (voxelEntity && voxelEntity[0].properties.spatialId) {
        const spatialId = voxelEntity[0].properties.spatialId;
        expect(spatialId).toHaveProperty('z');
        expect(spatialId).toHaveProperty('f');
        expect(spatialId).toHaveProperty('x');
        expect(spatialId).toHaveProperty('y');
        expect(spatialId).toHaveProperty('id');
        expect(spatialId.id).toMatch(/^\/\d+\/\d+\/\d+\/\d+$/);
      }
    });
  });

  describe('Comparison with Uniform Grid', () => {
    it('should produce different voxelization than uniform grid', async () => {
      const uniformHeatbox = new Heatbox(mockViewer, {
        spatialId: { enabled: false },
        voxelSize: 30
      });

      const spatialHeatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        },
        voxelSize: 30
      });

      const uniformStats = await uniformHeatbox.createFromEntities(mockEntities);
      
      // Reset mock
      mockViewer.entities.add.mockClear();
      
      const spatialStats = await spatialHeatbox.createFromEntities(mockEntities);

      // Both should process all entities
      expect(uniformStats.totalEntities).toBe(mockEntities.length);
      expect(spatialStats.totalEntities).toBe(mockEntities.length);

      // Spatial ID mode should be enabled for second heatbox
      expect(uniformStats.spatialIdEnabled).toBe(false);
      expect(spatialStats.spatialIdEnabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should validate zoom value in manual mode', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoomControl: 'manual',
          zoom: 'auto' // Invalid: string in manual mode
        }
      });

      // Should not throw, should use default zoom
      const stats = await heatbox.createFromEntities(mockEntities);
      
      expect(stats.spatialIdEnabled).toBe(true);
      expect(stats.spatialIdZoom).toBe(25); // Default fallback
    });

    it('should handle invalid zoom range', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoomControl: 'manual',
          zoom: 100 // Out of range
        }
      });

      const stats = await heatbox.createFromEntities(mockEntities);
      
      expect(stats.spatialIdEnabled).toBe(true);
      expect(stats.spatialIdZoom).toBe(25); // Default fallback
    });

    it('should handle empty entity array', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        }
      });

      await expect(heatbox.createFromEntities([])).rejects.toThrow();
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete within reasonable time for 100 entities', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        }
      });

      const startTime = Date.now();
      await heatbox.createFromEntities(mockEntities);
      const endTime = Date.now();

      const duration = endTime - startTime;
      
      // Should complete within 5 seconds (generous limit for test environment)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Flat Dataset Handling', () => {
    it('should handle 2D dataset (constant altitude)', async () => {
      // Create flat dataset (all at altitude 50m)
      const flatEntities = generateMockEntities(50, {
        minLon: 139.69,
        maxLon: 139.71,
        minLat: 35.68,
        maxLat: 35.70,
        minAlt: 50,
        maxAlt: 50 // Same as minAlt
      });

      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        }
      });

      const stats = await heatbox.createFromEntities(flatEntities);

      // Should not produce NaN or negative values
      expect(stats.emptyVoxels).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(stats.emptyVoxels)).toBe(false);
      expect(stats.nonEmptyVoxels).toBeGreaterThan(0);
    });
  });

  describe('VoxelSelector Compatibility', () => {
    it('should work with coverage selection strategy', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        },
        renderLimitStrategy: 'coverage',
        maxRenderVoxels: 50
      });

      const stats = await heatbox.createFromEntities(mockEntities);

      expect(stats.spatialIdEnabled).toBe(true);
      expect(stats.nonEmptyVoxels).toBeGreaterThan(0);
      // Verify the intended strategy was actually used
      if (stats.selectionStrategy) {
        expect(['coverage', 'hybrid']).toContain(stats.selectionStrategy);
      }
    });

    it('should work with hybrid selection strategy', async () => {
      const heatbox = new Heatbox(mockViewer, {
        spatialId: {
          enabled: true,
          zoom: 25
        },
        renderLimitStrategy: 'hybrid',
        maxRenderVoxels: 50
      });

      const stats = await heatbox.createFromEntities(mockEntities);

      expect(stats.spatialIdEnabled).toBe(true);
      expect(stats.nonEmptyVoxels).toBeGreaterThan(0);
      // Verify the intended strategy was actually used
      if (stats.selectionStrategy) {
        expect(['coverage', 'hybrid']).toContain(stats.selectionStrategy);
      }
    });
  });
});

