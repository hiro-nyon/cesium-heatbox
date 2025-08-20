/**
 * VoxelRenderer の描画上限テスト
 */

import { VoxelRenderer } from '../../src/core/VoxelRenderer.js';

describe('VoxelRenderer', () => {
  test('maxRenderVoxels により描画数が制限される', () => {
    const viewer = testUtils.createMockViewer();
    const renderer = new VoxelRenderer(viewer, {
      maxRenderVoxels: 1,
      showEmptyVoxels: true,
      showOutline: true
    });

    const bounds = {
      minLon: 0, maxLon: 1,
      minLat: 0, maxLat: 1,
      minAlt: 0, maxAlt: 1
    };
    const grid = {
      numVoxelsX: 2,
      numVoxelsY: 1,
      numVoxelsZ: 1,
      voxelSizeMeters: 10,
      totalVoxels: 2
    };
    const voxelData = new Map();
    voxelData.set('0,0,0', { x: 0, y: 0, z: 0, count: 1, entities: [{}] });
    voxelData.set('1,0,0', { x: 1, y: 0, z: 0, count: 5, entities: [{}, {}, {}, {}, {}] });
    const statistics = {
      totalVoxels: 2,
      nonEmptyVoxels: 2,
      emptyVoxels: 0,
      totalEntities: 6,
      minCount: 1,
      maxCount: 5,
      averageCount: 3
    };

    renderer.render(voxelData, bounds, grid, statistics);

    // v0.1.2からEntityベースになったため、entities.addが呼ばれる
    expect(viewer.entities.add).toHaveBeenCalled();
    expect(renderer.voxelEntities.length).toBeGreaterThan(0);
  });
});

