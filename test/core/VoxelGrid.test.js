/**
 * VoxelGrid ヘルパーのテスト
 */

import { VoxelGrid } from '../../src/core/VoxelGrid.js';

describe('VoxelGrid', () => {
  const bounds = {
    minLon: 0,
    maxLon: 1,
    minLat: 0,
    maxLat: 1,
    minAlt: 0,
    maxAlt: 10,
    centerLat: 0.5
  };

  test('getVoxelKey/parseVoxelKey が相互変換になる', () => {
    const key = VoxelGrid.getVoxelKey(3, 4, 5);
    expect(key).toBe('3,4,5');
    const idx = VoxelGrid.parseVoxelKey(key);
    expect(idx).toEqual({ x: 3, y: 4, z: 5 });
  });

  test('isValidVoxelIndex が境界を判断できる', () => {
    const grid = { numVoxelsX: 3, numVoxelsY: 3, numVoxelsZ: 3 };
    expect(VoxelGrid.isValidVoxelIndex(0, 0, 0, grid)).toBe(true);
    expect(VoxelGrid.isValidVoxelIndex(2, 2, 2, grid)).toBe(true);
    expect(VoxelGrid.isValidVoxelIndex(3, 0, 0, grid)).toBe(false);
    expect(VoxelGrid.isValidVoxelIndex(-1, 0, 0, grid)).toBe(false);
  });

  test('getNeighborVoxels が範囲内の近傍を返す', () => {
    const grid = { numVoxelsX: 3, numVoxelsY: 3, numVoxelsZ: 3 };
    const neighborsCenter = VoxelGrid.getNeighborVoxels(1, 1, 1, grid);
    expect(neighborsCenter.length).toBe(26); // 3x3x3 - 1
    const neighborsCorner = VoxelGrid.getNeighborVoxels(0, 0, 0, grid);
    expect(neighborsCorner.length).toBeGreaterThan(0);
    expect(neighborsCorner.every(n => VoxelGrid.isValidVoxelIndex(n.x, n.y, n.z, grid))).toBe(true);
  });

  test('getVoxelBounds が各軸のステップで分割する', () => {
    const grid = { numVoxelsX: 10, numVoxelsY: 10, numVoxelsZ: 10 };
    const vb = VoxelGrid.getVoxelBounds(5, 5, 5, bounds, grid);
    expect(vb.minLon).toBeLessThan(vb.maxLon);
    expect(vb.minLat).toBeLessThan(vb.maxLat);
    expect(vb.minAlt).toBeLessThan(vb.maxAlt);
  });
});

