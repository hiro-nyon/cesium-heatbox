/**
 * DensitySelectionStrategy のテスト
 * Tests for DensitySelectionStrategy
 */

import { DensitySelectionStrategy } from '../../../src/core/selection/DensitySelectionStrategy.js';

describe('DensitySelectionStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new DensitySelectionStrategy();
  });

  describe('基本機能 (Basic functionality)', () => {
    test('戦略名が正しく返される', () => {
      expect(strategy.getStrategyName()).toBe('density');
    });

    test('オプション検証が常に true を返す', () => {
      expect(strategy.validateOptions({})).toBe(true);
      expect(strategy.validateOptions({ someOption: 'value' })).toBe(true);
    });
  });

  describe('ボクセル選択 (Voxel selection)', () => {
    const mockVoxels = [
      { key: 'voxel1', info: { count: 10 } },
      { key: 'voxel2', info: { count: 5 } },
      { key: 'voxel3', info: { count: 15 } },
      { key: 'voxel4', info: { count: 8 } },
      { key: 'voxel5', info: { count: 12 } }
    ];

    test('密度順でボクセルが選択される', () => {
      const result = strategy.select(mockVoxels, 3);
      
      expect(result.selected).toHaveLength(3);
      expect(result.selected[0].key).toBe('voxel3'); // count: 15
      expect(result.selected[1].key).toBe('voxel5'); // count: 12
      expect(result.selected[2].key).toBe('voxel1'); // count: 10
    });

    test('maxCount が全ボクセル数より少ない場合、制限される', () => {
      const result = strategy.select(mockVoxels, 2);
      
      expect(result.selected).toHaveLength(2);
      expect(result.selected[0].info.count).toBe(15);
      expect(result.selected[1].info.count).toBe(12);
    });

    test('maxCount が全ボクセル数以上の場合、全ボクセルが選択される', () => {
      const result = strategy.select(mockVoxels, 10);
      
      expect(result.selected).toHaveLength(5);
      // 密度順にソートされているかチェック
      for (let i = 0; i < result.selected.length - 1; i++) {
        expect(result.selected[i].info.count).toBeGreaterThanOrEqual(
          result.selected[i + 1].info.count
        );
      }
    });

    test('空の配列でも正常に動作する', () => {
      const result = strategy.select([], 5);
      
      expect(result.selected).toHaveLength(0);
      expect(result.metadata.totalVoxels).toBe(0);
      expect(result.metadata.selectedCount).toBe(0);
    });

    test('強制包含ボクセルが優先される', () => {
      const forceInclude = new Set(['voxel2']); // count: 5 (低密度)
      const result = strategy.select(mockVoxels, 2, {}, forceInclude);
      
      expect(result.selected).toHaveLength(2);
      // voxel2 (count: 5) が低密度にも関わらず含まれているはず
      const keys = result.selected.map(v => v.key);
      expect(keys).toContain('voxel2');
      expect(keys).toContain('voxel3'); // 最高密度
    });

    test('強制包含ボクセルが複数ある場合も正常に動作する', () => {
      const forceInclude = new Set(['voxel2', 'voxel4']); // count: 5, 8
      const result = strategy.select(mockVoxels, 3, {}, forceInclude);
      
      expect(result.selected).toHaveLength(3);
      const keys = result.selected.map(v => v.key);
      expect(keys).toContain('voxel2');
      expect(keys).toContain('voxel4');
      expect(keys).toContain('voxel3'); // 最高密度
    });
  });

  describe('メタデータ (Metadata)', () => {
    const mockVoxels = [
      { key: 'voxel1', info: { count: 10 } },
      { key: 'voxel2', info: { count: 5 } },
      { key: 'voxel3', info: { count: 15 } }
    ];

    test('メタデータが正しく生成される', () => {
      const result = strategy.select(mockVoxels, 2);
      
      expect(result.metadata).toEqual({
        strategy: 'density',
        totalVoxels: 3,
        selectedCount: 2,
        clippedCount: 1,
        forceIncludedCount: 0,
        densityRange: {
          max: 15,
          min: 10
        }
      });
    });

    test('強制包含がある場合のメタデータ', () => {
      const forceInclude = new Set(['voxel2']);
      const result = strategy.select(mockVoxels, 2, {}, forceInclude);
      
      expect(result.metadata.forceIncludedCount).toBe(1);
    });

    test('空配列の場合のメタデータ', () => {
      const result = strategy.select([], 5);
      
      expect(result.metadata).toEqual({
        strategy: 'density',
        totalVoxels: 0,
        selectedCount: 0,
        clippedCount: 0,
        forceIncludedCount: 0,
        densityRange: {
          max: 0,
          min: 0
        }
      });
    });
  });

  describe('エラーハンドリング (Error handling)', () => {
    test('無効な allVoxels でエラーが発生する', () => {
      expect(() => {
        strategy.select(null, 5);
      }).toThrow('allVoxels must be an array');

      expect(() => {
        strategy.select('invalid', 5);
      }).toThrow('allVoxels must be an array');
    });

    test('無効な maxCount でエラーが発生する', () => {
      expect(() => {
        strategy.select([], -1);
      }).toThrow('maxCount must be a non-negative number');

      expect(() => {
        strategy.select([], 'invalid');
      }).toThrow('maxCount must be a non-negative number');
    });

    test('無効な forceInclude でエラーが発生する', () => {
      expect(() => {
        strategy.select([], 5, {}, []);
      }).toThrow('forceInclude must be a Set');

      expect(() => {
        strategy.select([], 5, {}, 'invalid');
      }).toThrow('forceInclude must be a Set');
    });
  });

  describe('パフォーマンス (Performance)', () => {
    test('大量のボクセルでも適切に動作する', () => {
      // 1000個のボクセルを生成
      const largeVoxelSet = Array.from({ length: 1000 }, (_, i) => ({
        key: `voxel${i}`,
        info: { count: Math.floor(Math.random() * 100) }
      }));

      const startTime = performance.now();
      const result = strategy.select(largeVoxelSet, 100);
      const endTime = performance.now();

      expect(result.selected).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
      
      // 密度順にソートされているかチェック
      for (let i = 0; i < result.selected.length - 1; i++) {
        expect(result.selected[i].info.count).toBeGreaterThanOrEqual(
          result.selected[i + 1].info.count
        );
      }
    });
  });
});
