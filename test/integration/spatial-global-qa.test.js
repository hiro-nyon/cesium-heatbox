/**
 * Global Spatial ID QA integration tests (ADR-0015 v0.1.19)
 * グローバル端ケース向け Spatial ID 統合テスト
 */
import { SpatialIdAdapter } from '../../src/core/spatial/SpatialIdAdapter.js';
import { Heatbox } from '../../src/Heatbox.js';
import { createMockViewer } from '../helpers/testHelpers.js';

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

  describe('Hemisphere-crossing dataset robustness (fallback mode)', () => {
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
        voxelSize: 3000
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
});

