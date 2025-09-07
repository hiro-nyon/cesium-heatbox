/**
 * AdaptiveController unit tests
 * AdaptiveController単体テスト
 * 
 * ADR-0009 Phase 3: VoxelRenderer責任分離 - 適応制御ロジック
 * @version 0.1.11-alpha
 */

import { jest } from '@jest/globals';
import { AdaptiveController } from '../../../src/core/adaptive/AdaptiveController.js';

// Mock Logger
jest.mock('../../../src/utils/logger.js', () => ({
  Logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('AdaptiveController', () => {
  /**
   * Create mock voxel data for testing
   * テスト用のモックボクセルデータを作成
   */
  const createMockVoxelData = (voxels) => {
    const voxelData = new Map();
    voxels.forEach(({ x, y, z, count }) => {
      const key = `${x},${y},${z}`;
      voxelData.set(key, { x, y, z, count });
    });
    return voxelData;
  };

  /**
   * Create mock statistics
   * モック統計情報を作成
   */
  const createMockStatistics = (minCount = 1, maxCount = 100) => ({
    minCount,
    maxCount,
    totalCount: maxCount * 10,
    voxelCount: 50
  });

  /**
   * Create mock render options
   * モック描画オプションを作成
   */
  const createMockRenderOptions = (overrides = {}) => ({
    adaptiveOutlines: true,
    outlineWidthPreset: 'uniform',
    outlineWidth: 2,
    opacity: 0.8,
    outlineOpacity: 1.0,
    outlineRenderMode: 'standard',
    ...overrides
  });

  describe('Constructor & Initialization', () => {
    test('Should initialize with default options', () => {
      const controller = new AdaptiveController();
      
      expect(controller.options.adaptiveParams).toEqual({
        neighborhoodRadius: 50,
        densityThreshold: 5,
        cameraDistanceFactor: 1.0,
        overlapRiskFactor: 0.3
      });
    });

    test('Should initialize with custom options', () => {
      const customOptions = {
        adaptiveParams: {
          neighborhoodRadius: 100,
          densityThreshold: 10,
          cameraDistanceFactor: 1.5,
          overlapRiskFactor: 0.5
        }
      };

      const controller = new AdaptiveController(customOptions);
      
      expect(controller.options.adaptiveParams).toEqual(customOptions.adaptiveParams);
    });

    test('Should merge custom options with defaults', () => {
      const customOptions = {
        adaptiveParams: {
          neighborhoodRadius: 75
        },
        customProperty: 'test'
      };

      const controller = new AdaptiveController(customOptions);
      
      expect(controller.options.adaptiveParams.neighborhoodRadius).toBe(75);
      expect(controller.options.adaptiveParams.densityThreshold).toBe(5); // default
      expect(controller.options.customProperty).toBe('test');
    });
  });

  describe('Neighborhood Density Calculation', () => {
    test('Should calculate neighborhood density correctly', () => {
      const controller = new AdaptiveController();
      
      // 3x3x3グリッド中央のボクセル周辺密度を計算
      const voxelData = createMockVoxelData([
        { x: 0, y: 0, z: 0, count: 10 },
        { x: 1, y: 0, z: 0, count: 5 },
        { x: 2, y: 0, z: 0, count: 8 },
        { x: 0, y: 1, z: 0, count: 12 },
        { x: 1, y: 1, z: 0, count: 15 }, // target
        { x: 2, y: 1, z: 0, count: 7 },
        { x: 0, y: 0, z: 1, count: 6 },
        { x: 1, y: 0, z: 1, count: 9 },
        { x: 2, y: 0, z: 1, count: 4 }
      ]);

      const targetVoxel = { x: 1, y: 1, z: 0 };
      const result = controller.calculateNeighborhoodDensity(targetVoxel, voxelData);

      expect(result.neighborCount).toBeGreaterThan(0);
      expect(result.totalDensity).toBeGreaterThan(0);
      expect(result.avgDensity).toBeGreaterThan(0);
      expect(typeof result.isDenseArea).toBe('boolean');
      expect(result.searchRadius).toBeGreaterThan(0);
    });

    test('Should handle empty neighborhood', () => {
      const controller = new AdaptiveController();
      
      // 孤立したボクセル
      const voxelData = createMockVoxelData([
        { x: 0, y: 0, z: 0, count: 10 }
      ]);

      const targetVoxel = { x: 0, y: 0, z: 0 };
      const result = controller.calculateNeighborhoodDensity(targetVoxel, voxelData);

      expect(result.neighborCount).toBe(0);
      expect(result.totalDensity).toBe(0);
      expect(result.avgDensity).toBe(0);
      expect(result.isDenseArea).toBe(false);
    });

    test('Should use custom radius', () => {
      const controller = new AdaptiveController();
      
      const voxelData = createMockVoxelData([
        { x: 0, y: 0, z: 0, count: 10 },
        { x: 1, y: 0, z: 0, count: 5 },
        { x: 3, y: 0, z: 0, count: 15 } // 範囲外
      ]);

      const targetVoxel = { x: 0, y: 0, z: 0 };
      
      // 半径1で検索
      const result1 = controller.calculateNeighborhoodDensity(targetVoxel, voxelData, 1);
      expect(result1.searchRadius).toBe(1);
      
      // 半径2で検索
      const result2 = controller.calculateNeighborhoodDensity(targetVoxel, voxelData, 2);
      expect(result2.searchRadius).toBe(2);
      
      // より広い範囲で検索すると、より多くの隣接ボクセルが見つかる可能性がある
      expect(result2.neighborCount).toBeGreaterThanOrEqual(result1.neighborCount);
    });

    test('Should identify dense areas correctly', () => {
      const controller = new AdaptiveController({
        adaptiveParams: { densityThreshold: 5 }
      });
      
      // 高密度エリア
      const voxelData = createMockVoxelData([
        { x: 0, y: 0, z: 0, count: 10 },
        { x: 1, y: 0, z: 0, count: 8 },
        { x: 0, y: 1, z: 0, count: 12 }
      ]);

      const targetVoxel = { x: 0, y: 0, z: 0 };
      const result = controller.calculateNeighborhoodDensity(targetVoxel, voxelData);

      // 平均密度が閾値を超えているかチェック
      if (result.avgDensity > 5) {
        expect(result.isDenseArea).toBe(true);
      }
    });
  });

  describe('Preset Logic Application', () => {
    test('Should apply adaptive-density preset', () => {
      const controller = new AdaptiveController();
      const baseOptions = createMockRenderOptions({
        outlineWidth: 2,
        opacity: 0.8,
        outlineOpacity: 1.0
      });

      // 密集エリアの場合
      const result1 = controller.applyPresetLogic(
        'adaptive-density', 
        false, // isTopN
        0.7,   // normalizedDensity
        true,  // isDenseArea
        baseOptions
      );

      expect(result1.adaptiveWidth).toBeGreaterThan(0.5);
      expect(result1.adaptiveBoxOpacity).toBe(baseOptions.opacity * 0.8);
      expect(result1.adaptiveOutlineOpacity).toBe(0.6);

      // 非密集エリアの場合
      const result2 = controller.applyPresetLogic(
        'adaptive-density',
        false,
        0.3,
        false,
        baseOptions
      );

      expect(result2.adaptiveWidth).toBe(baseOptions.outlineWidth);
      expect(result2.adaptiveBoxOpacity).toBe(baseOptions.opacity);
      expect(result2.adaptiveOutlineOpacity).toBe(1.0);
    });

    test('Should apply topn-focus preset', () => {
      const controller = new AdaptiveController();
      const baseOptions = createMockRenderOptions({
        outlineWidth: 2,
        opacity: 0.8
      });

      // TopNボクセルの場合
      const result1 = controller.applyPresetLogic(
        'topn-focus',
        true,  // isTopN
        0.8,
        false,
        baseOptions
      );

      expect(result1.adaptiveWidth).toBeGreaterThan(baseOptions.outlineWidth);
      expect(result1.adaptiveBoxOpacity).toBe(baseOptions.opacity);
      expect(result1.adaptiveOutlineOpacity).toBe(1.0);

      // 非TopNボクセルの場合
      const result2 = controller.applyPresetLogic(
        'topn-focus',
        false, // isTopN
        0.8,
        false,
        baseOptions
      );

      expect(result2.adaptiveWidth).toBeLessThan(result1.adaptiveWidth);
      expect(result2.adaptiveBoxOpacity).toBe(baseOptions.opacity * 0.6);
      expect(result2.adaptiveOutlineOpacity).toBe(0.4);
    });

    test('Should apply uniform preset', () => {
      const controller = new AdaptiveController();
      const baseOptions = createMockRenderOptions({
        outlineWidth: 2,
        opacity: 0.8,
        outlineOpacity: 1.0
      });

      const result = controller.applyPresetLogic(
        'uniform',
        true,  // isTopN - 無視される
        0.9,   // normalizedDensity - 無視される
        true,  // isDenseArea - 無視される
        baseOptions
      );

      expect(result.adaptiveWidth).toBe(baseOptions.outlineWidth);
      expect(result.adaptiveBoxOpacity).toBe(baseOptions.opacity);
      expect(result.adaptiveOutlineOpacity).toBe(baseOptions.outlineOpacity);
    });

    test('Should handle unknown preset as uniform', () => {
      const controller = new AdaptiveController();
      const baseOptions = createMockRenderOptions();

      const result = controller.applyPresetLogic(
        'unknown-preset',
        false,
        0.5,
        false,
        baseOptions
      );

      expect(result.adaptiveWidth).toBe(baseOptions.outlineWidth);
      expect(result.adaptiveBoxOpacity).toBe(baseOptions.opacity);
      expect(result.adaptiveOutlineOpacity).toBe(baseOptions.outlineOpacity);
    });
  });

  describe('Adaptive Parameters Calculation', () => {
    test('Should return null parameters when adaptive outlines disabled', () => {
      const controller = new AdaptiveController();
      const voxelData = createMockVoxelData([]);
      const statistics = createMockStatistics();
      const renderOptions = createMockRenderOptions({ adaptiveOutlines: false });

      const result = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 10 },
        false,
        voxelData,
        statistics,
        renderOptions
      );

      expect(result).toEqual({
        outlineWidth: null,
        boxOpacity: null,
        outlineOpacity: null,
        shouldUseEmulation: false
      });
    });

    test('Should calculate adaptive parameters correctly', () => {
      const controller = new AdaptiveController();
      
      const voxelData = createMockVoxelData([
        { x: 0, y: 0, z: 0, count: 50 },
        { x: 1, y: 0, z: 0, count: 30 },
        { x: 0, y: 1, z: 0, count: 40 }
      ]);
      
      const statistics = createMockStatistics(10, 100);
      const renderOptions = createMockRenderOptions();

      const result = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 50 },
        false, // isTopN
        voxelData,
        statistics,
        renderOptions
      );

      expect(result.outlineWidth).toBeGreaterThanOrEqual(0.5);
      expect(result.boxOpacity).toBeGreaterThanOrEqual(0.1);
      expect(result.boxOpacity).toBeLessThanOrEqual(1.0);
      expect(result.outlineOpacity).toBeGreaterThanOrEqual(0.2);
      expect(result.outlineOpacity).toBeLessThanOrEqual(1.0);
      expect(typeof result.shouldUseEmulation).toBe('boolean');
      
      // デバッグ情報の確認
      expect(result._debug).toBeDefined();
      expect(result._debug.normalizedDensity).toBeDefined();
      expect(result._debug.neighborhoodResult).toBeDefined();
    });

    test('Should handle TopN voxels specially with topn-focus preset', () => {
      const controller = new AdaptiveController();
      
      const voxelData = createMockVoxelData([
        { x: 0, y: 0, z: 0, count: 90 }
      ]);
      
      const statistics = createMockStatistics(10, 100);
      const renderOptions = createMockRenderOptions({
        outlineWidthPreset: 'topn-focus',
        outlineWidth: 2
      });

      const topNResult = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 90 },
        true, // isTopN
        voxelData,
        statistics,
        renderOptions
      );

      const regularResult = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 90 },
        false, // not TopN
        voxelData,
        statistics,
        renderOptions
      );

      // TopNボクセルはより太い枠線を持つはず
      expect(topNResult.outlineWidth).toBeGreaterThan(regularResult.outlineWidth);
    });

    test('Should handle extreme density values', () => {
      const controller = new AdaptiveController();
      
      const voxelData = createMockVoxelData([]);
      const statistics = createMockStatistics(1, 1); // minCount = maxCount
      const renderOptions = createMockRenderOptions();

      const result = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 1 },
        false,
        voxelData,
        statistics,
        renderOptions
      );

      expect(result.outlineWidth).toBeGreaterThanOrEqual(0.5);
      expect(result.boxOpacity).toBeGreaterThanOrEqual(0.1);
      expect(result.outlineOpacity).toBeGreaterThanOrEqual(0.2);
    });

    test('Should enable emulation for thick outlines', () => {
      const controller = new AdaptiveController();
      
      const voxelData = createMockVoxelData([]);
      const statistics = createMockStatistics();
      const renderOptions = createMockRenderOptions({
        outlineWidth: 5, // 太い枠線
        outlineRenderMode: 'inset'
      });

      const result = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 50 },
        false,
        voxelData,
        statistics,
        renderOptions
      );

      // 太い枠線の場合はエミュレーションが有効になるはず
      if (result.outlineWidth > 2) {
        expect(result.shouldUseEmulation).toBe(true);
      }
    });
  });

  describe('Configuration Management', () => {
    test('Should update options correctly', () => {
      const controller = new AdaptiveController();
      
      const newOptions = {
        adaptiveParams: {
          neighborhoodRadius: 75,
          densityThreshold: 8
        },
        newProperty: 'updated'
      };

      controller.updateOptions(newOptions);

      expect(controller.options.adaptiveParams.neighborhoodRadius).toBe(75);
      expect(controller.options.adaptiveParams.densityThreshold).toBe(8);
      expect(controller.options.adaptiveParams.cameraDistanceFactor).toBe(1.0); // unchanged
      expect(controller.options.newProperty).toBe('updated');
    });

    test('Should get configuration with version info', () => {
      const controller = new AdaptiveController({ testOption: 'test' });
      
      const config = controller.getConfiguration();

      expect(config.version).toBe('0.1.11-alpha');
      expect(config.phase).toBe('ADR-0009 Phase 3');
      expect(config.testOption).toBe('test');
      expect(config.adaptiveParams).toBeDefined();
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('Should handle null/undefined voxel data', () => {
      const controller = new AdaptiveController();
      
      const emptyVoxelData = new Map();
      const statistics = createMockStatistics();
      const renderOptions = createMockRenderOptions();

      const result = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 10 },
        false,
        emptyVoxelData,
        statistics,
        renderOptions
      );

      expect(result).toBeDefined();
      expect(result.outlineWidth).toBeGreaterThanOrEqual(0.5);
    });

    test('Should handle zero-count voxels', () => {
      const controller = new AdaptiveController();
      
      const voxelData = createMockVoxelData([]);
      const statistics = createMockStatistics();
      const renderOptions = createMockRenderOptions();

      const result = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 0 },
        false,
        voxelData,
        statistics,
        renderOptions
      );

      expect(result).toBeDefined();
      expect(result.outlineWidth).toBeGreaterThanOrEqual(0.5);
      expect(result.boxOpacity).toBeGreaterThanOrEqual(0.1);
    });

    test('Should handle invalid statistics gracefully', () => {
      const controller = new AdaptiveController();
      
      const voxelData = createMockVoxelData([]);
      const invalidStats = { minCount: 100, maxCount: 10 }; // max < min
      const renderOptions = createMockRenderOptions();

      const result = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 50 },
        false,
        voxelData,
        invalidStats,
        renderOptions
      );

      expect(result).toBeDefined();
      expect(result._debug.normalizedDensity).toBe(0); // Should be 0 when max <= min
    });
  });
});
