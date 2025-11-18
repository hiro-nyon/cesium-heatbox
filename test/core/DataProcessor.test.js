/**
 * DataProcessor ユーティリティのテスト（分類以外）
 */

import { DataProcessor } from '../../src/core/DataProcessor.js';

function makeVoxelData(entries) {
  const m = new Map();
  for (const e of entries) {
    const key = `${e.x},${e.y},${e.z}`;
    m.set(key, { ...e, entities: new Array(e.count).fill({}) });
  }
  return m;
}

describe('DataProcessor utils', () => {
  test('calculateStatistics が統計値を計算', () => {
    const grid = { totalVoxels: 100 };
    const vd = makeVoxelData([
      { x: 0, y: 0, z: 0, count: 1 },
      { x: 1, y: 1, z: 1, count: 3 }
    ]);
    const stats = DataProcessor.calculateStatistics(vd, grid);
    expect(stats.totalVoxels).toBe(100);
    expect(stats.nonEmptyVoxels).toBe(2);
    expect(stats.totalEntities).toBe(4);
    expect(stats.minCount).toBe(1);
    expect(stats.maxCount).toBe(3);
    expect(stats.averageCount).toBeCloseTo(2);
    expect(stats.classification).toBeDefined();
    expect(stats.classification.enabled).toBe(false);
  });

  test('classification statistics are populated when enabled', () => {
    const grid = { totalVoxels: 50 };
    const vd = makeVoxelData([
      { x: 0, y: 0, z: 0, count: 1 },
      { x: 1, y: 1, z: 1, count: 5 },
      { x: 2, y: 2, z: 2, count: 9 }
    ]);
    const stats = DataProcessor.calculateStatistics(vd, grid, {
      classification: {
        enabled: true,
        scheme: 'equal-interval',
        classes: 3,
        colorMap: ['#000000', '#ffffff']
      }
    });
    expect(stats.classification.enabled).toBe(true);
    expect(stats.classification.scheme).toBe('equal-interval');
    expect(stats.classification.domain).toEqual([1, 9]);
    expect(stats.classification.breaks).toHaveLength(4);
    expect(stats.classification.quantiles).toHaveLength(3);
    const histTotal = stats.classification.histogram.counts.reduce((sum, val) => sum + val, 0);
    expect(histTotal).toBe(vd.size);
  });

  

  test('getTopNVoxels が上位Nを返す', () => {
    const vd = makeVoxelData([
      { x: 0, y: 0, z: 0, count: 1 },
      { x: 1, y: 1, z: 1, count: 3 },
      { x: 2, y: 2, z: 2, count: 2 }
    ]);
    const top2 = DataProcessor.getTopNVoxels(vd, 2);
    expect(top2.map(v => v.count)).toEqual([3, 2]);
  });

  
});
