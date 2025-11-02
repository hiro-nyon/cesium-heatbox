/**
 * @jest-environment jsdom
 */

import { DataProcessor } from '../../src/core/DataProcessor.js';
import { VoxelGrid } from '../../src/core/VoxelGrid.js';
import { Heatbox } from '../../src/Heatbox.js';
import { GeometryRenderer } from '../../src/core/geometry/GeometryRenderer.js';
import { createMockViewer } from '../helpers/testHelpers.js';

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
          for (const count of voxelInfo.layerStats.values()) {
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

    it('should resolve values from PropertyBag getValue()', async () => {
      const entitiesWithPropertyBag = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: {
            getValue: () => ({ buildingType: 'residential' })
          }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: {
            getValue: () => ({ buildingType: 'commercial' })
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
        entitiesWithPropertyBag,
        bounds,
        grid,
        options
      );

      const voxelInfo = Array.from(voxelData.values())[0];
      expect(voxelInfo.layerStats.has('residential')).toBe(true);
      expect(voxelInfo.layerStats.has('commercial')).toBe(true);
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
    let viewer;
    let heatbox;

    beforeEach(() => {
      viewer = createMockViewer();
    });

    afterEach(() => {
      if (heatbox) {
        heatbox.clear();
        heatbox = null;
      }
    });

    it('should return top N layers in statistics', async () => {
      // Create entities with known distribution:
      // residential: 9 total (5+4)
      // industrial: 7 total
      // commercial: 5 total (3+2)
      const entities = [
        // Voxel 1: residential=5, commercial=3
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `res-1-${i}`,
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'residential' }
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `com-1-${i}`,
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'commercial' }
        })),
        // Voxel 2: industrial=7, commercial=2
        ...Array.from({ length: 7 }, (_, i) => ({
          id: `ind-2-${i}`,
          position: { x: 139.71, y: 35.70, z: 100 },
          properties: { type: 'industrial' }
        })),
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `com-2-${i}`,
          position: { x: 139.71, y: 35.70, z: 100 },
          properties: { type: 'commercial' }
        })),
        // Voxel 3: residential=4
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `res-3-${i}`,
          position: { x: 139.69, y: 35.68, z: 150 },
          properties: { type: 'residential' }
        }))
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: true,
          byProperty: 'type'
        }
      });

      await heatbox.createFromEntities(entities);
      const stats = heatbox.getStatistics();
      
      // Verify layers are returned
      expect(stats.layers).toBeDefined();
      expect(Array.isArray(stats.layers)).toBe(true);
      expect(stats.layers).toHaveLength(3);
      
      // Verify correct totals and sorting (descending)
      expect(stats.layers[0]).toEqual({ key: 'residential', total: 9 }); // 5+4
      expect(stats.layers[1]).toEqual({ key: 'industrial', total: 7 });
      expect(stats.layers[2]).toEqual({ key: 'commercial', total: 5 }); // 3+2
    });

    it('should respect custom topN value', async () => {
      // Create entities with 12 different layers (A-L)
      const layerNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      const entities = [];
      
      layerNames.forEach((name, index) => {
        // Create entities with descending counts: A=12, B=11, ..., L=1
        const count = layerNames.length - index;
        for (let i = 0; i < count; i++) {
          entities.push({
            id: `${name}-${i}`,
            position: {
              x: 139.69 + (index * 0.001),
              y: 35.68 + (index * 0.001),
              z: 50 + (i * 10)
            },
            properties: { type: name }
          });
        }
      });

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: true,
          byProperty: 'type',
          topN: 5 // Custom value
        }
      });

      await heatbox.createFromEntities(entities);
      const stats = heatbox.getStatistics();
      
      // Verify only top 5 are returned
      expect(stats.layers).toBeDefined();
      expect(stats.layers).toHaveLength(5);
      expect(stats.layers[0].key).toBe('A');
      expect(stats.layers[4].key).toBe('E');
    });

    it('should not return layers when aggregation is disabled', async () => {
      const entities = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'residential' }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'commercial' }
        }
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: false // Explicitly disabled
        }
      });

      await heatbox.createFromEntities(entities);
      const stats = heatbox.getStatistics();
      
      // Verify layers are not returned when aggregation is disabled
      expect(stats.layers).toBeUndefined();
    });
  });

  describe('Voxel description safety', () => {
    let viewer;
    let renderer;

    beforeEach(() => {
      viewer = createMockViewer();
      renderer = new GeometryRenderer(viewer, {
        aggregation: {
          enabled: true,
          showInDescription: true
        }
      });
    });

    afterEach(() => {
      renderer.clear();
      viewer.entities.removeAll();
    });

    it('should escape layer keys in descriptions', () => {
      const maliciousKey = '<script>alert(1)</script>';
      const voxelInfo = {
        x: 0,
        y: 0,
        z: 0,
        count: 5,
        layerTop: maliciousKey,
        layerStats: new Map([
          [maliciousKey, 3],
          ['safe', 2]
        ])
      };

      const description = renderer.createVoxelDescription(voxelInfo, 'voxel-1');
      expect(description).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(description).not.toContain('<script>alert(1)</script>');
    });

    it('should add layerTop to properties when creating voxel entities', () => {
      const voxelInfo = {
        x: 1,
        y: 2,
        z: 3,
        count: 4,
        layerTop: 'residential',
        layerStats: new Map([
          ['residential', 3],
          ['commercial', 1]
        ])
      };

      const colorStub = { withAlpha: jest.fn(() => ({})) };
      const entity = renderer.createVoxelBox({
        centerLon: 139.7,
        centerLat: 35.69,
        centerAlt: 50,
        cellSizeX: 20,
        cellSizeY: 20,
        boxHeight: 20,
        color: colorStub,
        opacity: 0.8,
        shouldShowOutline: true,
        outlineColor: {},
        outlineWidth: 1,
        voxelInfo,
        voxelKey: '1-2-3'
      });

      expect(entity.properties.layerTop).toBe('residential');
      expect(entity.description).toContain('レイヤ内訳');
      expect(colorStub.withAlpha).toHaveBeenCalledWith(0.8);
    });
  });
});
