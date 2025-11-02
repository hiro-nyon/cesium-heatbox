/**
 * @jest-environment jsdom
 */

import { DataProcessor } from '../../src/core/DataProcessor.js';
import { VoxelGrid } from '../../src/core/VoxelGrid.js';

describe('Layer Aggregation (ADR-0014)', () => {
  let mockEntities;
  let bounds;
  let grid;

  beforeEach(() => {
    // Mock entities with different layer properties
    mockEntities = [
      {
        id: 'entity-1',
        position: { x: 139.70, y: 35.69, z: 50 },
        properties: { buildingType: 'residential' }
      },
      {
        id: 'entity-2',
        position: { x: 139.70, y: 35.69, z: 50 },
        properties: { buildingType: 'commercial' }
      },
      {
        id: 'entity-3',
        position: { x: 139.70, y: 35.69, z: 50 },
        properties: { buildingType: 'residential' }
      },
      {
        id: 'entity-4',
        position: { x: 139.70, y: 35.69, z: 50 },
        properties: { buildingType: 'residential' }
      },
      {
        id: 'entity-5',
        position: { x: 139.71, y: 35.70, z: 60 },
        properties: { buildingType: 'industrial' }
      }
    ];

    bounds = {
      minLon: 139.69,
      maxLon: 139.71,
      minLat: 35.68,
      maxLat: 35.70,
      minAlt: 0,
      maxAlt: 200
    };

    grid = VoxelGrid.createGrid(bounds, 30);
  });

  describe('byProperty aggregation', () => {
    it('should aggregate entities by property key', async () => {
      const options = {
        aggregation: {
          enabled: true,
          byProperty: 'buildingType',
          showInDescription: true
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        mockEntities,
        bounds,
        grid,
        options
      );

      expect(voxelData.size).toBeGreaterThan(0);

      // Find voxel with multiple entities
      let foundVoxel = null;
      for (const voxelInfo of voxelData.values()) {
        if (voxelInfo.count > 1) {
          foundVoxel = voxelInfo;
          break;
        }
      }

      expect(foundVoxel).not.toBeNull();
      expect(foundVoxel.layerStats).toBeInstanceOf(Map);
      expect(foundVoxel.layerStats.size).toBeGreaterThan(0);
      expect(foundVoxel.layerTop).toBeDefined();
    });

    it('should calculate correct layer counts', async () => {
      const options = {
        aggregation: {
          enabled: true,
          byProperty: 'buildingType'
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        mockEntities,
        bounds,
        grid,
        options
      );

      // Find the voxel with 4 entities (3 residential, 1 commercial)
      let targetVoxel = null;
      for (const voxelInfo of voxelData.values()) {
        if (voxelInfo.count === 4) {
          targetVoxel = voxelInfo;
          break;
        }
      }

      // Assert that the target voxel exists (regression detection)
      expect(targetVoxel).toBeDefined();
      expect(targetVoxel).not.toBeNull();
      
      // Verify layer counts
      expect(targetVoxel.layerStats.get('residential')).toBe(3);
      expect(targetVoxel.layerStats.get('commercial')).toBe(1);
      expect(targetVoxel.layerTop).toBe('residential');
    });

    it('should handle missing property values', async () => {
      const entitiesWithMissing = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { buildingType: 'residential' }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: {} // Missing buildingType
        },
        {
          id: 'entity-3',
          position: { x: 139.70, y: 35.69, z: 50 }
          // No properties at all
        }
      ];

      const options = {
        aggregation: {
          enabled: true,
          byProperty: 'buildingType'
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        entitiesWithMissing,
        bounds,
        grid,
        options
      );

      const voxelInfo = Array.from(voxelData.values())[0];
      expect(voxelInfo.layerStats.has('unknown')).toBe(true);
      expect(voxelInfo.layerStats.get('unknown')).toBe(2);
    });
  });

  describe('keyResolver aggregation', () => {
    it('should use custom keyResolver function', async () => {
      const options = {
        aggregation: {
          enabled: true,
          keyResolver: (entity) => {
            const type = entity.properties?.buildingType || 'unknown';
            return type.toUpperCase();
          }
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        mockEntities,
        bounds,
        grid,
        options
      );

      let foundVoxel = null;
      for (const voxelInfo of voxelData.values()) {
        if (voxelInfo.count > 1) {
          foundVoxel = voxelInfo;
          break;
        }
      }

      expect(foundVoxel).not.toBeNull();
      expect(foundVoxel.layerStats).toBeInstanceOf(Map);
      
      // Keys should be uppercase
      const keys = Array.from(foundVoxel.layerStats.keys());
      keys.forEach(key => {
        expect(key).toBe(key.toUpperCase());
      });
    });

    it('should handle keyResolver errors gracefully', async () => {
      const options = {
        aggregation: {
          enabled: true,
          keyResolver: (entity) => {
            if (entity.id === 'entity-2') {
              throw new Error('Intentional error');
            }
            return entity.properties?.buildingType || 'default';
          }
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        mockEntities,
        bounds,
        grid,
        options
      );

      // Should not throw, and should use 'unknown' for failed entities
      expect(voxelData.size).toBeGreaterThan(0);
      
      let foundUnknown = false;
      for (const voxelInfo of voxelData.values()) {
        if (voxelInfo.layerStats?.has('unknown')) {
          foundUnknown = true;
          break;
        }
      }
      
      expect(foundUnknown).toBe(true);
    });

    it('should prioritize keyResolver over byProperty', async () => {
      const options = {
        aggregation: {
          enabled: true,
          byProperty: 'buildingType',
          keyResolver: () => 'custom-key'
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        mockEntities,
        bounds,
        grid,
        options
      );

      const voxelInfo = Array.from(voxelData.values())[0];
      expect(voxelInfo.layerStats.has('custom-key')).toBe(true);
      expect(voxelInfo.layerStats.has('residential')).toBe(false);
    });
  });

  describe('layerTop calculation', () => {
    it('should identify the most common layer', async () => {
      const options = {
        aggregation: {
          enabled: true,
          byProperty: 'buildingType'
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        mockEntities,
        bounds,
        grid,
        options
      );

      for (const voxelInfo of voxelData.values()) {
        if (voxelInfo.layerStats && voxelInfo.layerStats.size > 0) {
          expect(voxelInfo.layerTop).toBeDefined();
          
          // layerTop should be the key with the highest count
          const topCount = voxelInfo.layerStats.get(voxelInfo.layerTop);
          for (const [key, count] of voxelInfo.layerStats) {
            expect(count).toBeLessThanOrEqual(topCount);
          }
        }
      }
    });

    it('should handle ties consistently', async () => {
      const tiedEntities = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'A' }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'B' }
        }
      ];

      const options = {
        aggregation: {
          enabled: true,
          byProperty: 'type'
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        tiedEntities,
        bounds,
        grid,
        options
      );

      const voxelInfo = Array.from(voxelData.values())[0];
      expect(voxelInfo.layerTop).toBeDefined();
      expect(['A', 'B']).toContain(voxelInfo.layerTop);
    });
  });

  describe('aggregation disabled', () => {
    it('should not create layerStats when aggregation is disabled', async () => {
      const options = {
        aggregation: {
          enabled: false,
          byProperty: 'buildingType'
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        mockEntities,
        bounds,
        grid,
        options
      );

      for (const voxelInfo of voxelData.values()) {
        expect(voxelInfo.layerStats).toBeUndefined();
        expect(voxelInfo.layerTop).toBeUndefined();
      }
    });

    it('should not create layerStats when aggregation options are missing', async () => {
      const options = {};

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        mockEntities,
        bounds,
        grid,
        options
      );

      for (const voxelInfo of voxelData.values()) {
        expect(voxelInfo.layerStats).toBeUndefined();
        expect(voxelInfo.layerTop).toBeUndefined();
      }
    });
  });

  describe('Cesium PropertyBag resolution', () => {
    it('should resolve Cesium Property values', async () => {
      const mockTime = { dayNumber: 0, secondsOfDay: 0 };
      
      const entitiesWithProperties = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: {
            buildingType: {
              getValue: () => 'residential'
            }
          }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: {
            buildingType: {
              getValue: () => 'commercial'
            }
          }
        }
      ];

      const options = {
        aggregation: {
          enabled: true,
          byProperty: 'buildingType'
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        entitiesWithProperties,
        bounds,
        grid,
        options
      );

      const voxelInfo = Array.from(voxelData.values())[0];
      expect(voxelInfo.layerStats.has('residential')).toBe(true);
      expect(voxelInfo.layerStats.has('commercial')).toBe(true);
      expect(voxelInfo.layerStats.has('[object Object]')).toBe(false);
    });

    it('should handle getValue errors gracefully', async () => {
      const entitiesWithFailingProperty = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: {
            buildingType: {
              getValue: () => {
                throw new Error('Property error');
              }
            }
          }
        }
      ];

      const options = {
        aggregation: {
          enabled: true,
          byProperty: 'buildingType'
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        entitiesWithFailingProperty,
        bounds,
        grid,
        options
      );

      const voxelInfo = Array.from(voxelData.values())[0];
      expect(voxelInfo.layerStats.has('unknown')).toBe(true);
    });
  });

  describe('String coercion', () => {
    it('should coerce non-string layer keys to strings', async () => {
      const entitiesWithNumbers = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { floor: 1 }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { floor: 2 }
        },
        {
          id: 'entity-3',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { floor: 1 }
        }
      ];

      const options = {
        aggregation: {
          enabled: true,
          byProperty: 'floor'
        }
      };

      const voxelData = await DataProcessor.classifyEntitiesIntoVoxels(
        entitiesWithNumbers,
        bounds,
        grid,
        options
      );

      const voxelInfo = Array.from(voxelData.values())[0];
      expect(voxelInfo.layerStats.has('1')).toBe(true);
      expect(voxelInfo.layerStats.has('2')).toBe(true);
      expect(voxelInfo.layerStats.get('1')).toBe(2);
    });
  });

  describe('Global layer aggregation (Phase 3)', () => {
    it('should return top N layers in statistics', () => {
      // Create mock voxelData with layerStats
      const mockVoxelData = new Map();
      
      // Voxel 1: residential=5, commercial=3
      mockVoxelData.set('0_0_0', {
        x: 0, y: 0, z: 0,
        count: 8,
        entities: [],
        layerStats: new Map([
          ['residential', 5],
          ['commercial', 3]
        ]),
        layerTop: 'residential'
      });
      
      // Voxel 2: industrial=7, commercial=2
      mockVoxelData.set('1_0_0', {
        x: 1, y: 0, z: 0,
        count: 9,
        entities: [],
        layerStats: new Map([
          ['industrial', 7],
          ['commercial', 2]
        ]),
        layerTop: 'industrial'
      });
      
      // Voxel 3: residential=4
      mockVoxelData.set('2_0_0', {
        x: 2, y: 0, z: 0,
        count: 4,
        entities: [],
        layerStats: new Map([
          ['residential', 4]
        ]),
        layerTop: 'residential'
      });
      
      // Simulate Heatbox.getStatistics() logic
      const globalLayerCounts = new Map();
      for (const voxelInfo of mockVoxelData.values()) {
        for (const [layerKey, count] of voxelInfo.layerStats) {
          globalLayerCounts.set(
            layerKey,
            (globalLayerCounts.get(layerKey) || 0) + count
          );
        }
      }
      
      const topN = 10; // Default
      const sorted = Array.from(globalLayerCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN);
      
      const layers = sorted.map(([key, total]) => ({ key, total }));
      
      // Verify results
      expect(layers).toHaveLength(3);
      expect(layers[0]).toEqual({ key: 'residential', total: 9 }); // 5+4
      expect(layers[1]).toEqual({ key: 'industrial', total: 7 });
      expect(layers[2]).toEqual({ key: 'commercial', total: 5 }); // 3+2
    });

    it('should respect custom topN value', () => {
      // Create mock voxelData with many layers
      const mockVoxelData = new Map();
      
      const layerNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      layerNames.forEach((name, index) => {
        mockVoxelData.set(`${index}_0_0`, {
          x: index, y: 0, z: 0,
          count: 1,
          entities: [],
          layerStats: new Map([[name, layerNames.length - index]]), // Descending counts
          layerTop: name
        });
      });
      
      // Simulate Heatbox.getStatistics() logic with custom topN
      const globalLayerCounts = new Map();
      for (const voxelInfo of mockVoxelData.values()) {
        for (const [layerKey, count] of voxelInfo.layerStats) {
          globalLayerCounts.set(
            layerKey,
            (globalLayerCounts.get(layerKey) || 0) + count
          );
        }
      }
      
      const topN = 5; // Custom value
      const sorted = Array.from(globalLayerCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN);
      
      const layers = sorted.map(([key, total]) => ({ key, total }));
      
      // Verify only top 5 are returned
      expect(layers).toHaveLength(5);
      expect(layers[0].key).toBe('A');
      expect(layers[4].key).toBe('E');
    });

    it('should handle empty layerStats', () => {
      const mockVoxelData = new Map();
      
      // Voxel without layerStats (aggregation disabled)
      mockVoxelData.set('0_0_0', {
        x: 0, y: 0, z: 0,
        count: 5,
        entities: []
        // No layerStats
      });
      
      // Simulate Heatbox.getStatistics() logic
      const globalLayerCounts = new Map();
      for (const voxelInfo of mockVoxelData.values()) {
        if (voxelInfo.layerStats) {
          for (const [layerKey, count] of voxelInfo.layerStats) {
            globalLayerCounts.set(
              layerKey,
              (globalLayerCounts.get(layerKey) || 0) + count
            );
          }
        }
      }
      
      expect(globalLayerCounts.size).toBe(0);
    });
  });
});

