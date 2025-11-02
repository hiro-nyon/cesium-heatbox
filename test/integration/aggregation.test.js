/**
 * @jest-environment jsdom
 */

import { Heatbox } from '../../src/Heatbox.js';
import { createMockViewer } from '../helpers/testHelpers.js';

describe('Layer Aggregation Integration (ADR-0014)', () => {
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

  describe('Full workflow with aggregation', () => {
    it('should create heatbox with layer aggregation enabled', async () => {
      const entities = [
        {
          id: 'building-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'residential' }
        },
        {
          id: 'building-2',
          position: { x: 139.70, y: 35.69, z: 55 },
          properties: { type: 'commercial' }
        },
        {
          id: 'building-3',
          position: { x: 139.70, y: 35.69, z: 60 },
          properties: { type: 'residential' }
        }
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: true,
          byProperty: 'type',
          showInDescription: true
        }
      });

      await heatbox.createFromEntities(entities);

      const stats = heatbox.getStatistics();
      expect(stats).not.toBeNull();
      expect(stats.totalEntities).toBe(3);
      expect(stats.layers).toBeDefined();
      expect(Array.isArray(stats.layers)).toBe(true);
    });

    it('should return Top-N layers in statistics', async () => {
      const entities = [];
      const layerTypes = ['residential', 'commercial', 'industrial', 'office', 'retail'];
      
      // Create 100 entities with various types
      for (let i = 0; i < 100; i++) {
        entities.push({
          id: `entity-${i}`,
          position: {
            x: 139.69 + Math.random() * 0.02,
            y: 35.68 + Math.random() * 0.02,
            z: Math.random() * 200
          },
          properties: {
            buildingType: layerTypes[i % layerTypes.length]
          }
        });
      }

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: true,
          byProperty: 'buildingType'
        }
      });

      await heatbox.createFromEntities(entities);

      const stats = heatbox.getStatistics();
      expect(stats.layers).toBeDefined();
      expect(stats.layers.length).toBeGreaterThan(0);
      expect(stats.layers.length).toBeLessThanOrEqual(10); // Top-10 limit

      // Verify structure
      stats.layers.forEach(layer => {
        expect(layer).toHaveProperty('key');
        expect(layer).toHaveProperty('total');
        expect(typeof layer.key).toBe('string');
        expect(typeof layer.total).toBe('number');
      });

      // Verify sorted by count descending
      for (let i = 1; i < stats.layers.length; i++) {
        expect(stats.layers[i - 1].total).toBeGreaterThanOrEqual(stats.layers[i].total);
      }
    });

    it('should include layer info in rendered entity properties', async () => {
      const entities = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { category: 'A' }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 51 },
          properties: { category: 'A' }
        },
        {
          id: 'entity-3',
          position: { x: 139.70, y: 35.69, z: 52 },
          properties: { category: 'B' }
        }
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: true,
          byProperty: 'category'
        }
      });

      await heatbox.createFromEntities(entities);

      // Check rendered entities
      const allEntities = Array.from(viewer.entities.values);
      const renderedEntities = allEntities.filter(e => 
        e.properties && e.properties.type === 'voxel'
      );

      expect(renderedEntities.length).toBeGreaterThan(0);

      // Find voxel with multiple entities
      const voxelWithLayers = renderedEntities.find(e => 
        e.properties.layerTop !== undefined
      );

      if (voxelWithLayers) {
        expect(voxelWithLayers.properties.layerTop).toBeDefined();
        expect(voxelWithLayers.properties.layerStats).toBeDefined();
        expect(typeof voxelWithLayers.properties.layerStats).toBe('object');
      }
    });

    it('should include layer breakdown in voxel description when enabled', async () => {
      const entities = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'A' }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 51 },
          properties: { type: 'B' }
        }
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: true,
          byProperty: 'type',
          showInDescription: true
        }
      });

      await heatbox.createFromEntities(entities);

      const allEntities = Array.from(viewer.entities.values);
      const renderedEntities = allEntities.filter(e => 
        e.properties && e.properties.type === 'voxel'
      );

      const voxelEntity = renderedEntities[0];
      expect(voxelEntity.description).toBeDefined();
      
      const description = voxelEntity.description;
      expect(description).toContain('レイヤ内訳');
      expect(description).toContain('支配的レイヤ');
    });

    it('should not include layer breakdown when showInDescription is false', async () => {
      const entities = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'A' }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 51 },
          properties: { type: 'B' }
        }
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: true,
          byProperty: 'type',
          showInDescription: false
        }
      });

      await heatbox.createFromEntities(entities);

      const allEntities = Array.from(viewer.entities.values);
      const renderedEntities = allEntities.filter(e => 
        e.properties && e.properties.type === 'voxel'
      );

      const voxelEntity = renderedEntities[0];
      const description = voxelEntity.description;
      expect(description).not.toContain('レイヤ内訳');
    });

    it('should work with custom keyResolver', async () => {
      const entities = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { height: 10 }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 51 },
          properties: { height: 25 }
        },
        {
          id: 'entity-3',
          position: { x: 139.70, y: 35.69, z: 52 },
          properties: { height: 35 }
        }
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: true,
          keyResolver: (entity) => {
            const height = entity.properties?.height || 0;
            if (height < 20) return 'low-rise';
            if (height < 30) return 'mid-rise';
            return 'high-rise';
          }
        }
      });

      await heatbox.createFromEntities(entities);

      const stats = heatbox.getStatistics();
      expect(stats.layers).toBeDefined();
      
      const layerKeys = stats.layers.map(l => l.key);
      expect(layerKeys).toContain('low-rise');
      expect(layerKeys).toContain('mid-rise');
      expect(layerKeys).toContain('high-rise');
    });
  });

  describe('Spatial ID mode with aggregation', () => {
    it('should support aggregation in spatial ID mode', async () => {
      const entities = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { category: 'A' }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 55 },
          properties: { category: 'B' }
        }
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        spatialId: {
          enabled: true,
          mode: 'tile-grid',
          zoom: 25
        },
        aggregation: {
          enabled: true,
          byProperty: 'category'
        }
      });

      await heatbox.createFromEntities(entities);

      const stats = heatbox.getStatistics();
      expect(stats).not.toBeNull();
      expect(stats.spatialIdEnabled).toBe(true);
      expect(stats.layers).toBeDefined();
      expect(stats.layers.length).toBeGreaterThan(0);
    });
  });

  describe('XSS prevention', () => {
    it('should escape malicious layer keys in description', async () => {
      const entities = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: '<script>alert("XSS")</script>' }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 51 },
          properties: { type: '<img src=x onerror=alert(1)>' }
        }
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: true,
          byProperty: 'type',
          showInDescription: true
        }
      });

      await heatbox.createFromEntities(entities);

      const allEntities = Array.from(viewer.entities.values);
      const renderedEntities = allEntities.filter(e => 
        e.properties && e.properties.type === 'voxel'
      );

      const voxelEntity = renderedEntities[0];
      const description = voxelEntity.description;
      
      // Should contain escaped HTML
      expect(description).toContain('&lt;script&gt;');
      expect(description).toContain('&lt;img');
      
      // Should NOT contain unescaped tags
      expect(description).not.toContain('<script>');
      expect(description).not.toContain('<img src=x');
    });
  });

  describe('No aggregation', () => {
    it('should work normally when aggregation is disabled', async () => {
      const entities = [
        {
          id: 'entity-1',
          position: { x: 139.70, y: 35.69, z: 50 },
          properties: { type: 'A' }
        },
        {
          id: 'entity-2',
          position: { x: 139.70, y: 35.69, z: 51 },
          properties: { type: 'B' }
        }
      ];

      heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        aggregation: {
          enabled: false
        }
      });

      await heatbox.createFromEntities(entities);

      const stats = heatbox.getStatistics();
      expect(stats).not.toBeNull();
      expect(stats.layers).toBeUndefined();
      expect(stats.totalEntities).toBe(2);
    });
  });
});

