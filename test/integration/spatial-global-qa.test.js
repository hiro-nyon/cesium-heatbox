/**
 * Global Spatial ID QA integration tests (ADR-0015 v0.1.19)
 * グローバル端ケース向け Spatial ID 統合テスト
 */
import { SpatialIdAdapter } from '../../src/core/spatial/SpatialIdAdapter.js';
import { computeSpatialIdEdgeCaseMetrics } from '../../src/core/spatial/SpatialIdQaMetrics.js';
import { Heatbox } from '../../src/Heatbox.js';
import { createMockViewer, generateMockEntities } from '../helpers/testHelpers.js';

describe('Global Spatial ID QA (ADR-0015)', () => {
  describe('Dateline neighbors / children / parent continuity', () => {
    it('neighbors are continuous across the dateline', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();

      const zoom = 24;
      const n = Math.pow(2, zoom);
      const y = Math.floor(n / 2);
      const f = 0;

      const tileLeft = { z: zoom, f, x: 0, y };        // West side near -180°
      const tileRight = { z: zoom, f, x: n - 1, y };   // East side near +180°

      const neighborsLeft = adapter.neighbors(tileLeft);
      const neighborsRight = adapter.neighbors(tileRight);

      expect(neighborsLeft).toContainEqual(tileRight);
      expect(neighborsRight).toContainEqual(tileLeft);
    });

    it('children and parent remain consistent near dateline', async () => {
      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();

      const zoom = 5;
      const n = Math.pow(2, zoom);
      const y = Math.floor(n / 2);
      const f = 0;

      const tileLeft = { z: zoom, f, x: 0, y };
      const tileRight = { z: zoom, f, x: n - 1, y };

      const childrenLeft = adapter.children(tileLeft);
      const childrenRight = adapter.children(tileRight);

      // All children should have tileLeft / tileRight as their parent respectively
      childrenLeft.forEach(child => {
        const parent = adapter.parent(child);
        expect(parent).toEqual(tileLeft);
      });

      childrenRight.forEach(child => {
        const parent = adapter.parent(child);
        expect(parent).toEqual(tileRight);
      });
    });
  });

  describe('Dateline-crossing dataset robustness (fallback mode)', () => {
    it('handles entities around the dateline without crashing', async () => {
      const viewer = createMockViewer();

      const entities = [
        // Around +179.9°E
        {
          id: 'east-1',
          position: { x: 179.9, y: 0.1, z: 0 },
          properties: { value: 1 }
        },
        {
          id: 'east-2',
          position: { x: 179.95, y: -0.1, z: 10 },
          properties: { value: 2 }
        },
        // Around -179.9°W
        {
          id: 'west-1',
          position: { x: -179.9, y: 0.05, z: 5 },
          properties: { value: 3 }
        },
        {
          id: 'west-2',
          position: { x: -179.95, y: -0.05, z: 15 },
          properties: { value: 4 }
        }
      ];

      const heatbox = new Heatbox(viewer, {
        spatialId: {
          enabled: true,
          mode: 'tile-grid',
          zoomControl: 'auto'
        },
        voxelSize: 30
      });

      await expect(heatbox.createFromEntities(entities)).resolves.toBeDefined();

      const stats = heatbox.getStatistics();
      expect(stats).not.toBeNull();
      expect(stats.nonEmptyVoxels).toBeGreaterThan(0);
      expect(stats.spatialIdEnabled).toBe(true);
      if (stats.spatialId) {
        expect(stats.spatialId.enabled).toBe(true);
      }
    });
  });

  describe('Polar tiles dataset (high latitude)', () => {
    it('handles high-latitude entities near ±85° without crashing', async () => {
      const viewer = createMockViewer();

      const entities = generateMockEntities(50, {
        minLon: -10,
        maxLon: 10,
        minLat: 80,
        maxLat: 85,
        minAlt: 0,
        maxAlt: 200
      });

      const heatbox = new Heatbox(viewer, {
        spatialId: {
          enabled: true,
          mode: 'tile-grid',
          zoomControl: 'auto'
        },
        voxelSize: 30
      });

      const stats = await heatbox.createFromEntities(entities);

      expect(stats).not.toBeNull();
      expect(stats.nonEmptyVoxels).toBeGreaterThan(0);
      expect(stats.spatialIdEnabled).toBe(true);
      if (stats.spatialId) {
        expect(stats.spatialId.enabled).toBe(true);
      }
    });
  });

  describe('Hemisphere-crossing bounds via entities', () => {
    it('handles entities across 170E/-170W without crashing', async () => {
      const viewer = createMockViewer();

      const entities = generateMockEntities(80, {
        minLon: 170,
        maxLon: 190, // Wraps beyond 180 into -170
        minLat: 35,
        maxLat: 40,
        minAlt: 0,
        maxAlt: 500
      });

      const heatbox = new Heatbox(viewer, {
        spatialId: {
          enabled: true,
          mode: 'tile-grid',
          zoomControl: 'auto'
        },
        voxelSize: 30
      });

      const stats = await heatbox.createFromEntities(entities);

      expect(stats).not.toBeNull();
      expect(stats.nonEmptyVoxels).toBeGreaterThan(0);
      expect(stats.totalEntities).toBe(entities.length);
      expect(stats.spatialIdEnabled).toBe(true);
      if (stats.spatialId) {
        expect(stats.spatialId.enabled).toBe(true);
      }
    });
  });

  describe('Edge case metrics helper (Phase2/4/5)', () => {
    it('computes and exposes SpatialIdEdgeCaseMetrics via statistics', async () => {
      const viewer = createMockViewer();
      const entities = generateMockEntities(50, {
        minLon: 170,
        maxLon: 190,
        minLat: 35,
        maxLat: 40,
        minAlt: 0,
        maxAlt: 500
      });

      const heatbox = new Heatbox(viewer, {
        spatialId: {
          enabled: true,
          mode: 'tile-grid',
          zoomControl: 'auto'
        },
        voxelSize: 30
      });

      const adapter = new SpatialIdAdapter();
      await adapter.loadProvider();
      const metrics = computeSpatialIdEdgeCaseMetrics(adapter);

      // Phase2: metrics object should have all expected fields
      expect(metrics.datelineNeighborsChecked).toBeGreaterThan(0);
      expect(metrics.datelineNeighborsMismatched).toBeGreaterThanOrEqual(0);
      expect(metrics.polarTilesChecked).toBeGreaterThan(0);
      expect(metrics.polarMaxRelativeErrorXY).toBeGreaterThanOrEqual(0);
      expect(metrics.hemisphereBoundsChecked).toBeGreaterThan(0);
      expect(metrics.hemisphereBoundsMismatched).toBeGreaterThanOrEqual(0);

      // Phase4: polar error should be within acceptable threshold for fallback
      expect(metrics.polarMaxRelativeErrorXY).toBeLessThanOrEqual(0.1);

      // Phase5: hemisphere metrics should indicate no hard mismatch in this basic check
      expect(metrics.hemisphereBoundsMismatched).toBeLessThanOrEqual(1);

      // Attach metrics to Heatbox instance and verify exposure via getStatistics()
      const statsBefore = await heatbox.createFromEntities(entities);
      expect(statsBefore.spatialIdEnabled).toBe(true);

      heatbox._spatialIdEdgeCaseMetrics = metrics;

      const statsAfter = heatbox.getStatistics();
      expect(statsAfter).toBeDefined();
      expect(statsAfter.spatialId).toBeDefined();
      expect(statsAfter.spatialId.edgeCaseMetrics).toEqual(metrics);
    });
  });
});
