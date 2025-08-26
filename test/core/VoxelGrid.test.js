/**
 * VoxelGrid ヘルパーのテスト
 */

import { VoxelGrid } from '../../src/core/VoxelGrid.js';

describe('VoxelGrid', () => {

  test('getVoxelKey/parseVoxelKey が相互変換になる', () => {
    const key = VoxelGrid.getVoxelKey(3, 4, 5);
    expect(key).toBe('3,4,5');
    const idx = VoxelGrid.parseVoxelKey(key);
    expect(idx).toEqual({ x: 3, y: 4, z: 5 });
  });

  
});

