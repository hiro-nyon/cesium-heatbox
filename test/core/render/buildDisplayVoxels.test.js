import { buildDisplayVoxels } from '../../../src/core/render/buildDisplayVoxels.js';

describe('buildDisplayVoxels', () => {
  test('grid dimensionsから総数を計算して空セルを補完する', () => {
    const voxelData = new Map([
      ['1,0,0', { x: 1, y: 0, z: 0, count: 2 }]
    ]);
    const select = jest.fn();

    const result = buildDisplayVoxels(
      voxelData,
      { numVoxelsX: 2, numVoxelsY: 1, numVoxelsZ: 1 },
      { showEmptyVoxels: true, maxRenderVoxels: 10 },
      select
    );

    expect(result.voxels).toEqual([
      { key: '1,0,0', info: { x: 1, y: 0, z: 0, count: 2 } },
      { key: '0,0,0', info: { x: 0, y: 0, z: 0, count: 0 } }
    ]);
    expect(result.selectionResult).toBeNull();
    expect(select).not.toHaveBeenCalled();
  });

  test('実セルが上限を超える場合は選択結果を返す', () => {
    const voxelData = new Map([
      ['0,0,0', { count: 1 }],
      ['1,0,0', { count: 2 }],
      ['2,0,0', { count: 3 }]
    ]);
    const selectionResult = {
      selectedVoxels: [{ key: '2,0,0', info: { count: 3 } }],
      strategy: 'density',
      clippedNonEmpty: 2
    };
    const select = jest.fn(() => selectionResult);

    const result = buildDisplayVoxels(
      voxelData,
      { totalVoxels: 3 },
      { showEmptyVoxels: false, maxRenderVoxels: 1 },
      select
    );

    expect(select).toHaveBeenCalledWith(expect.any(Array), 1);
    expect(result).toEqual({ voxels: selectionResult.selectedVoxels, selectionResult });
  });

  test('無効な描画上限では安全な既定値を使う', () => {
    const voxelData = new Map([
      ['0,0,0', { x: 0, y: 0, z: 0, count: 1 }]
    ]);

    const result = buildDisplayVoxels(
      voxelData,
      { totalVoxels: 1 },
      { showEmptyVoxels: false, maxRenderVoxels: NaN },
      jest.fn()
    );

    expect(result.voxels).toHaveLength(1);
  });
});
