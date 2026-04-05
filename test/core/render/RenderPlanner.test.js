import { RenderPlanner } from '../../../src/core/render/RenderPlanner.js';

describe('RenderPlanner', () => {
  const bounds = {
    minLon: 139.6,
    maxLon: 139.8,
    minLat: 35.5,
    maxLat: 35.7,
    minAlt: 0,
    maxAlt: 100
  };
  const grid = {
    numVoxelsX: 2,
    numVoxelsY: 1,
    numVoxelsZ: 1,
    voxelSizeMeters: 20
  };

  test('culls voxels behind the camera when camera/frustum info is available', () => {
    const viewer = {
      scene: {
        canvas: {
          clientWidth: 800,
          clientHeight: 600
        }
      },
      camera: {
        positionCartographic: {
          longitude: 139.7 * (Math.PI / 180),
          latitude: 35.6 * (Math.PI / 180),
          height: 100
        },
        direction: { x: 1, y: 0, z: 0 },
        frustum: {
          fov: Math.PI / 3,
          aspectRatio: 4 / 3
        }
      }
    };

    const planner = new RenderPlanner(viewer, {});
    const voxels = [
      { key: 'east', info: { x: 1, y: 0, z: 0, count: 5 } },
      { key: 'west', info: { x: 0, y: 0, z: 0, count: 5 } }
    ];

    const result = planner.plan(voxels, bounds, grid, new Set(), 2);

    expect(result.voxels).toHaveLength(1);
    expect(result.voxels[0].key).toBe('east');
    expect(result.culledCount).toBe(1);
  });

  test('reduces render budget when camera altitude is very high', () => {
    const viewer = {
      scene: {
        canvas: {
          clientWidth: 800,
          clientHeight: 600
        }
      },
      camera: {
        positionCartographic: {
          longitude: 139.7 * (Math.PI / 180),
          latitude: 35.6 * (Math.PI / 180),
          height: 200000
        },
        direction: { x: 0, y: 1, z: 0 },
        frustum: {
          fov: Math.PI / 3,
          aspectRatio: 4 / 3
        }
      }
    };

    const planner = new RenderPlanner(viewer, {});
    const voxels = Array.from({ length: 200 }, (_, index) => ({
      key: `voxel-${index}`,
      info: { x: index % 2, y: 0, z: 0, count: index + 1 }
    }));

    const result = planner.plan(voxels, bounds, grid, new Set(), 200);

    expect(result.budget).toBeLessThan(200);
    expect(result.voxels).toHaveLength(result.budget);
  });
});
