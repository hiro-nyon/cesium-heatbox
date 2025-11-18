/**
 * AdaptiveController unit tests
 * AdaptiveController単体テスト
 * 
 * ADR-0009 Phase 3: VoxelRenderer責任分離 - 適応制御ロジック
 * @version 0.1.11
 */

import { jest } from '@jest/globals';
import { AdaptiveController } from '../../../src/core/adaptive/AdaptiveController.js';
import { createClassifier } from '../../../src/utils/classification.js';

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

  const createMockGrid = (overrides = {}) => ({
    cellSizeX: 20,
    cellSizeY: 20,
    cellSizeZ: 5,
    numVoxelsX: 10,
    numVoxelsY: 10,
    numVoxelsZ: 4,
    ...overrides
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
      
      expect(controller.options.adaptiveParams).toMatchObject({
        neighborhoodRadius: 30,
        densityThreshold: 3,
        cameraDistanceFactor: 0.8,
        overlapRiskFactor: 0.4,
        minOutlineWidth: 1.0,
        maxOutlineWidth: 5.0,
        outlineWidthRange: null,
        boxOpacityRange: null,
        outlineOpacityRange: null,
        adaptiveOpacityEnabled: false,
        zScaleCompensation: true,
        overlapDetection: false
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
      
      expect(controller.options.adaptiveParams).toMatchObject(customOptions.adaptiveParams);
      expect(controller.options.adaptiveParams.minOutlineWidth).toBe(1.0);
      expect(controller.options.adaptiveParams.maxOutlineWidth).toBe(5.0);
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
      expect(controller.options.adaptiveParams.densityThreshold).toBe(3); // default
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
        renderOptions,
        createMockGrid()
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
        renderOptions,
        createMockGrid()
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
        renderOptions,
        createMockGrid()
      );

      const regularResult = controller.calculateAdaptiveParams(
        { x: 0, y: 0, z: 0, count: 90 },
        false, // not TopN
        voxelData,
        statistics,
        renderOptions,
        createMockGrid()
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
        renderOptions,
        createMockGrid()
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
        renderOptions,
        createMockGrid()
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
      expect(controller.options.adaptiveParams.cameraDistanceFactor).toBe(0.8); // unchanged default
      expect(controller.options.newProperty).toBe('updated');
    });

    test('Should get configuration with version info', () => {
      const controller = new AdaptiveController({ testOption: 'test' });
      
      const config = controller.getConfiguration();

      expect(config.version).toBe('0.1.11');
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
        renderOptions,
        createMockGrid()
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
        renderOptions,
        createMockGrid()
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
        renderOptions,
        createMockGrid()
      );

      expect(result).toBeDefined();
      expect(result._debug.normalizedDensity).toBe(0); // Should be 0 when max <= min
    });
  });

  /**
   * Phase 2: Edge case tests (ADR-0011)
   * Phase 2: エッジケーステスト
   */
  describe('Phase 2: Edge Case Handling', () => {
    describe('_countAdjacentVoxels', () => {
      test('Should count 0 adjacent voxels for isolated voxel', () => {
        const controller = new AdaptiveController();
        
        const voxelData = createMockVoxelData([
          { x: 0, y: 0, z: 0, count: 10 }
        ]);
        
        const adjacentCount = controller._countAdjacentVoxels(
          { x: 0, y: 0, z: 0 },
          voxelData
        );
        
        expect(adjacentCount).toBe(0);
      });

      test('Should count 3 adjacent voxels in partial neighborhood', () => {
        const controller = new AdaptiveController();
        
        const voxelData = createMockVoxelData([
          { x: 0, y: 0, z: 0, count: 10 },
          { x: 1, y: 0, z: 0, count: 10 }, // +X
          { x: 0, y: 1, z: 0, count: 10 }, // +Y
          { x: 0, y: 0, z: 1, count: 10 }  // +Z
        ]);
        
        const adjacentCount = controller._countAdjacentVoxels(
          { x: 0, y: 0, z: 0 },
          voxelData
        );
        
        expect(adjacentCount).toBe(3);
      });

      test('Should count 6 adjacent voxels when fully surrounded', () => {
        const controller = new AdaptiveController();
        
        const voxelData = createMockVoxelData([
          { x: 0, y: 0, z: 0, count: 10 },
          { x: 1, y: 0, z: 0, count: 10 },  // +X
          { x: -1, y: 0, z: 0, count: 10 }, // -X
          { x: 0, y: 1, z: 0, count: 10 },  // +Y
          { x: 0, y: -1, z: 0, count: 10 }, // -Y
          { x: 0, y: 0, z: 1, count: 10 },  // +Z
          { x: 0, y: 0, z: -1, count: 10 }  // -Z
        ]);
        
        const adjacentCount = controller._countAdjacentVoxels(
          { x: 0, y: 0, z: 0 },
          voxelData
        );
        
        expect(adjacentCount).toBe(6);
      });

      test('Should handle invalid voxelData gracefully', () => {
        const controller = new AdaptiveController();
        
        expect(controller._countAdjacentVoxels({ x: 0, y: 0, z: 0 }, null)).toBe(0);
        expect(controller._countAdjacentVoxels({ x: 0, y: 0, z: 0 }, undefined)).toBe(0);
        expect(controller._countAdjacentVoxels({ x: 0, y: 0, z: 0 }, {})).toBe(0);
      });

      test('Should handle invalid voxelInfo gracefully', () => {
        const controller = new AdaptiveController();
        const voxelData = createMockVoxelData([]);
        
        expect(controller._countAdjacentVoxels(null, voxelData)).toBe(0);
        expect(controller._countAdjacentVoxels(undefined, voxelData)).toBe(0);
      });
    });

    describe('_detectOverlapAndRecommendMode', () => {
      test('Should return current mode when overlapDetection is disabled', () => {
        const controller = new AdaptiveController({
          adaptiveParams: { overlapDetection: false },
          outlineRenderMode: 'standard',
          outlineInset: 0
        });
        
        const voxelData = createMockVoxelData([
          { x: 0, y: 0, z: 0, count: 10 },
          { x: 1, y: 0, z: 0, count: 10 },
          { x: -1, y: 0, z: 0, count: 10 },
          { x: 0, y: 1, z: 0, count: 10 },
          { x: 0, y: -1, z: 0, count: 10 }
        ]);
        
        const recommendation = controller._detectOverlapAndRecommendMode(
          { x: 0, y: 0, z: 0 },
          voxelData,
          {
            outlineRenderMode: 'standard',
            outlineInset: 0,
            adaptiveParams: { overlapDetection: false }
          }
        );
        
        expect(recommendation.recommendedMode).toBe('standard');
        expect(recommendation.recommendedInset).toBe(0);
        expect(recommendation.reason).toBeUndefined();
      });

      test('Should recommend inset mode for high overlap risk', () => {
        const controller = new AdaptiveController({
          adaptiveParams: { overlapDetection: true },
          outlineRenderMode: 'standard',
          outlineInset: 0
        });
        
        const voxelData = createMockVoxelData([
          { x: 0, y: 0, z: 0, count: 10 },
          { x: 1, y: 0, z: 0, count: 10 },  // +X
          { x: -1, y: 0, z: 0, count: 10 }, // -X
          { x: 0, y: 1, z: 0, count: 10 },  // +Y
          { x: 0, y: -1, z: 0, count: 10 }  // -Y (4/6 = 66%)
        ]);
        
        const recommendation = controller._detectOverlapAndRecommendMode(
          { x: 0, y: 0, z: 0 },
          voxelData,
          {
            outlineRenderMode: 'standard',
            outlineInset: 0,
            adaptiveParams: { overlapDetection: true }
          }
        );
        
        expect(recommendation.recommendedMode).toBe('inset');
        expect(recommendation.recommendedInset).toBeGreaterThanOrEqual(0.3);
        expect(recommendation.recommendedInset).toBeLessThanOrEqual(0.8);
        expect(recommendation.reason).toContain('overlap risk');
      });

      test('Should maintain current mode for low overlap risk', () => {
        const controller = new AdaptiveController({
          adaptiveParams: { overlapDetection: true },
          outlineRenderMode: 'standard',
          outlineInset: 0
        });
        
        const voxelData = createMockVoxelData([
          { x: 0, y: 0, z: 0, count: 10 },
          { x: 1, y: 0, z: 0, count: 10 }  // Only +X (1/6 = 16%)
        ]);
        
        const recommendation = controller._detectOverlapAndRecommendMode(
          { x: 0, y: 0, z: 0 },
          voxelData,
          {
            outlineRenderMode: 'standard',
            outlineInset: 0,
            adaptiveParams: { overlapDetection: true }
          }
        );
        
        expect(recommendation.recommendedMode).toBe('standard');
        expect(recommendation.recommendedInset).toBe(0);
        expect(recommendation.reason).toBeUndefined();
      });

      test('Should not recommend inset when already in emulation-only mode', () => {
        const controller = new AdaptiveController({
          adaptiveParams: { overlapDetection: true },
          outlineRenderMode: 'emulation-only',
          outlineInset: 0
        });
        
        const voxelData = createMockVoxelData([
          { x: 0, y: 0, z: 0, count: 10 },
          { x: 1, y: 0, z: 0, count: 10 },
          { x: -1, y: 0, z: 0, count: 10 },
          { x: 0, y: 1, z: 0, count: 10 },
          { x: 0, y: -1, z: 0, count: 10 }
        ]);
        
      const recommendation = controller._detectOverlapAndRecommendMode(
        { x: 0, y: 0, z: 0 },
        voxelData,
        {
          outlineRenderMode: 'emulation-only',
          outlineInset: 0,
          adaptiveParams: { overlapDetection: true }
        }
      );
      
      // Should maintain emulation-only mode, not recommend inset
      expect(recommendation.recommendedMode).toBe('emulation-only');
      expect(recommendation.recommendedInset).toBe(0);
    });

    test('Should respect live render options after runtime change', () => {
      const controller = new AdaptiveController({
        adaptiveParams: { overlapDetection: true },
        outlineRenderMode: 'standard',
        outlineInset: 0
      });

      const voxelData = createMockVoxelData([
        { x: 0, y: 0, z: 0, count: 12 },
        { x: 1, y: 0, z: 0, count: 12 },
        { x: -1, y: 0, z: 0, count: 12 },
        { x: 0, y: 1, z: 0, count: 12 },
        { x: 0, y: -1, z: 0, count: 12 }
      ]);

      const runtimeOptions = {
        outlineRenderMode: 'emulation-only',
        outlineInset: 0.4,
        adaptiveParams: { overlapDetection: true }
      };

      const recommendation = controller._detectOverlapAndRecommendMode(
        { x: 0, y: 0, z: 0 },
        voxelData,
        runtimeOptions
      );

      expect(recommendation.recommendedMode).toBe('emulation-only');
      expect(recommendation.recommendedInset).toBeCloseTo(0.4);
      expect(recommendation.reason).toBeUndefined();
    });
  });

  describe('Z-axis extreme aspect ratio edge cases', () => {
      test('Should apply compensation for extremely thin Z-axis', () => {
        const controller = new AdaptiveController({
          adaptiveParams: {
            zScaleCompensation: true
          }
        });
        
        const extremeGrid = createMockGrid({
          cellSizeX: 100,
          cellSizeY: 100,
          cellSizeZ: 1  // Aspect ratio = 1/100 = 0.01 << 0.1
        });
        
        const zScaleFactor = controller._calculateZScaleCompensation(
          { x: 0, y: 0, z: 0, count: 10 },
          extremeGrid
        );
        
        expect(zScaleFactor).toBeGreaterThan(1.0); // Should increase
        expect(zScaleFactor).toBeLessThanOrEqual(1.3); // Should be clamped
      });

      test('Should not apply compensation for normal aspect ratio', () => {
        const controller = new AdaptiveController({
          adaptiveParams: {
            zScaleCompensation: true
          }
        });
        
        const normalGrid = createMockGrid({
          cellSizeX: 20,
          cellSizeY: 20,
          cellSizeZ: 20  // Aspect ratio = 1.0 > 0.1
        });
        
        const zScaleFactor = controller._calculateZScaleCompensation(
          { x: 0, y: 0, z: 0, count: 10 },
          normalGrid
        );
        
        expect(zScaleFactor).toBe(1.0);
      });

      test('Should respect compensation bounds (0.7 - 1.3)', () => {
        const controller = new AdaptiveController({
          adaptiveParams: {
            zScaleCompensation: true
          }
        });
        
        const extremeGrid = createMockGrid({
          cellSizeX: 1000,
          cellSizeY: 1000,
          cellSizeZ: 0.1  // Aspect ratio = 0.0001 << 0.1
        });
        
        const zScaleFactor = controller._calculateZScaleCompensation(
          { x: 0, y: 0, z: 0, count: 10 },
          extremeGrid
        );
        
        expect(zScaleFactor).toBeGreaterThanOrEqual(0.7);
        expect(zScaleFactor).toBeLessThanOrEqual(1.3);
      });
    });

    describe('calculateAdaptiveParams with overlap detection', () => {
      test('Should include overlapRecommendation in debug info', () => {
        const controller = new AdaptiveController({
          adaptiveParams: {
            overlapDetection: true
          },
          outlineRenderMode: 'standard'
        });
        
        const voxelData = createMockVoxelData([
          { x: 0, y: 0, z: 0, count: 50 },
          { x: 1, y: 0, z: 0, count: 50 },
          { x: -1, y: 0, z: 0, count: 50 },
          { x: 0, y: 1, z: 0, count: 50 },
          { x: 0, y: -1, z: 0, count: 50 }
        ]);
        
        const statistics = createMockStatistics(1, 100);
        const renderOptions = createMockRenderOptions();
        
        const result = controller.calculateAdaptiveParams(
          { x: 0, y: 0, z: 0, count: 50 },
          false,
          voxelData,
          statistics,
          renderOptions,
          createMockGrid()
        );
        
        expect(result._debug).toBeDefined();
        expect(result._debug.overlapRecommendation).toBeDefined();
        expect(result._debug.overlapRecommendation.recommendedMode).toBe('inset');
      });

      test('Should work correctly with dense area and high overlap', () => {
        const controller = new AdaptiveController({
          adaptiveParams: {
            densityThreshold: 2,
            overlapDetection: true
          }
        });
        
        // Create a dense cluster with high overlap
        const voxelData = createMockVoxelData([
          { x: 0, y: 0, z: 0, count: 80 },
          { x: 1, y: 0, z: 0, count: 70 },
          { x: -1, y: 0, z: 0, count: 75 },
          { x: 0, y: 1, z: 0, count: 85 },
          { x: 0, y: -1, z: 0, count: 90 },
          { x: 0, y: 0, z: 1, count: 78 }
        ]);
        
        const statistics = createMockStatistics(1, 100);
        const renderOptions = createMockRenderOptions({ outlineWidthPreset: 'adaptive' });
        
        const result = controller.calculateAdaptiveParams(
          { x: 0, y: 0, z: 0, count: 80 },
          false,
          voxelData,
          statistics,
          renderOptions,
          createMockGrid()
        );
        
        expect(result).toBeDefined();
        expect(result._debug.neighborhoodResult.isDenseArea).toBe(true);
        expect(result._debug.overlapRecommendation.recommendedMode).toBe('inset');
      });
    });
  });

  describe('classificationTargets integration (v1.1.0)', () => {
    test('applies classification-based opacity ranges when enabled', () => {
      const controller = new AdaptiveController();
      const classifier = createClassifier({
        scheme: 'linear',
        domain: [0, 100]
      });

      const voxelInfo = { x: 0, y: 0, z: 0, count: 50 };
      const renderOptions = createMockRenderOptions({
        adaptiveOutlines: false,
        classification: {
          enabled: true,
          classificationTargets: { opacity: true }
        },
        adaptiveParams: {
          boxOpacityRange: [0.2, 0.8],
          outlineOpacityRange: [0.1, 0.9]
        }
      });
      const statistics = createMockStatistics(0, 100);

      const result = controller.calculateAdaptiveParams(
        voxelInfo,
        false,
        new Map(),
        statistics,
        renderOptions,
        null,
        classifier
      );

      expect(result.boxOpacity).toBeCloseTo(0.5, 2);
      expect(result.outlineOpacity).toBeCloseTo(0.5, 2);
    });

    test('applies classification-based width range and topN boost', () => {
      const controller = new AdaptiveController();
      const classifier = createClassifier({
        scheme: 'linear',
        domain: [0, 100]
      });

      const voxelInfo = { x: 0, y: 0, z: 0, count: 50 };
      const renderOptions = createMockRenderOptions({
        adaptiveOutlines: false,
        highlightTopN: 1,
        highlightTopNWidthBoost: 2,
        classification: {
          enabled: true,
          classificationTargets: { width: true }
        },
        adaptiveParams: {
          outlineWidthRange: [1, 5]
        }
      });
      const statistics = createMockStatistics(0, 100);

      const result = controller.calculateAdaptiveParams(
        voxelInfo,
        true,
        new Map(),
        statistics,
        renderOptions,
        null,
        classifier
      );

      // outlineWidthRangeで 1→5 の中間 (3) に topN boost 2 を加算
      expect(result.outlineWidth).toBeCloseTo(5, 2);
    });
  });
});
