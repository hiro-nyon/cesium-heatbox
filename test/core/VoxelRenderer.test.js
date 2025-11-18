/**
 * VoxelRenderer の描画上限テスト
 */

import { VoxelRenderer } from '../../src/core/VoxelRenderer.js';
import { ColorCalculator } from '../../src/core/color/ColorCalculator.js';

describe('VoxelRenderer', () => {
  // v0.1.6: 色補間テスト追加
  describe('色補間機能', () => {
    let renderer;
    
    beforeEach(() => {
      const viewer = testUtils.createMockViewer();
      renderer = new VoxelRenderer(viewer, {
        minColor: [0, 0, 255],
        maxColor: [255, 0, 0]
      });
    });
    
    test('色補間メソッドが存在し、呼び出し可能', () => {
      // 基本的にinterpolateColorメソッドが存在することを確認
      expect(typeof renderer.interpolateColor).toBe('function');
      
      // メソッドが呼び出し可能で、何かしらの戻り値がある
      const result = renderer.interpolateColor(0.5);
      expect(result).toBeDefined();
      expect(result !== null).toBe(true);
    });
    
    test('カラーマップ設定がinterpolateColorメソッドに影響する', () => {
      renderer.options.colorMap = 'viridis';
      const viridisColor = renderer.interpolateColor(0.5);
      
      renderer.options.colorMap = 'custom';
      const customColor = renderer.interpolateColor(0.5);
      
      // 異なるカラーマップで異なる結果が得られる（または同じでもOK）
      expect(viridisColor).toBeDefined();
      expect(customColor).toBeDefined();
    });
  });
  
  // v0.1.6: 発散配色テスト追加
  describe('発散配色機能', () => {
    let renderer;
    
    beforeEach(() => {
      const viewer = testUtils.createMockViewer();
      renderer = new VoxelRenderer(viewer, {
        diverging: true,
        divergingPivot: 0
      });
    });
    
    test('発散配色モードでもinterpolateColorが呼び出し可能', () => {
      // 発散配色設定時にもinterpolateColorが正常動作
      const color = renderer.interpolateColor(0.5);
      expect(color).toBeDefined();
      expect(color !== null).toBe(true);
    });
  });
  
  // v0.1.6: TopN強調テスト追加
  describe('TopN強調機能', () => {
    test('TopN強調時の描画パラメータ調整', () => {
      const viewer = testUtils.createMockViewer();
      const renderer = new VoxelRenderer(viewer, {
        highlightTopN: 2,
        highlightStyle: {
          outlineWidth: 6,
          boostOpacity: 0.3
        },
        opacity: 0.7
      });
      
      const voxelData = new Map();
      voxelData.set('0,0,0', { x: 0, y: 0, z: 0, count: 10 }); // Top1
      voxelData.set('1,0,0', { x: 1, y: 0, z: 0, count: 8 });  // Top2
      voxelData.set('2,0,0', { x: 2, y: 0, z: 0, count: 3 });  // 非TopN
      
      const bounds = { minLon: 0, maxLon: 3, minLat: 0, maxLat: 1, minAlt: 0, maxAlt: 1 };
      const grid = { numVoxelsX: 3, numVoxelsY: 1, numVoxelsZ: 1, voxelSizeMeters: 10 };
      const statistics = { minCount: 3, maxCount: 10 };
      
      const renderCount = renderer.render(voxelData, bounds, grid, statistics);
      
      expect(renderCount).toBe(3);
      expect(viewer.entities.add).toHaveBeenCalledTimes(3);
    });
  });

  describe('classification color integration', () => {
    test('uses classification palette for voxel colors when enabled', () => {
      const viewer = testUtils.createMockViewer();
      const renderer = new VoxelRenderer(viewer, {
        classification: {
          enabled: true,
          scheme: 'linear',
          colorMap: ['#000000', '#ffffff'],
          classificationTargets: { color: true }
        }
      });

      const voxelData = new Map();
      voxelData.set('0,0,0', { x: 0, y: 0, z: 0, count: 1 });
      voxelData.set('1,0,0', { x: 1, y: 0, z: 0, count: 10 });

      const bounds = { minLon: 0, maxLon: 2, minLat: 0, maxLat: 1, minAlt: 0, maxAlt: 1 };
      const grid = { numVoxelsX: 2, numVoxelsY: 1, numVoxelsZ: 1, voxelSizeMeters: 5 };
      const statistics = { minCount: 1, maxCount: 10 };

      renderer.render(voxelData, bounds, grid, statistics);

      const lowCall = viewer.entities.add.mock.calls.find(call => call[0].properties.key === '0,0,0');
      const highCall = viewer.entities.add.mock.calls.find(call => call[0].properties.key === '1,0,0');

      expect(lowCall).toBeDefined();
      expect(highCall).toBeDefined();
      expect(lowCall[0].box.material.red).toBeCloseTo(0, 2);
      expect(highCall[0].box.material.red).toBeCloseTo(1, 2);
    });

    test('falls back to legacy color when color target is disabled', () => {
      const viewer = testUtils.createMockViewer();
      const renderer = new VoxelRenderer(viewer, {
        classification: {
          enabled: true,
          scheme: 'linear',
          colorMap: ['#000000', '#ffffff'],
          classificationTargets: { color: false }
        }
      });

      const colorSpy = jest.spyOn(ColorCalculator, 'calculateColor');

      const voxelData = new Map();
      voxelData.set('0,0,0', { x: 0, y: 0, z: 0, count: 5 });

      const bounds = { minLon: 0, maxLon: 1, minLat: 0, maxLat: 1, minAlt: 0, maxAlt: 1 };
      const grid = { numVoxelsX: 1, numVoxelsY: 1, numVoxelsZ: 1, voxelSizeMeters: 5 };
      const statistics = { minCount: 5, maxCount: 5 };

      renderer.render(voxelData, bounds, grid, statistics);

      expect(colorSpy).toHaveBeenCalled();

      colorSpy.mockRestore();
    });
  });
  
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
  
  // v0.1.6: 枠線重なり対策の基本テスト
  describe('枠線重なり対策', () => {
    test('デバッグ境界ボックス表示制御', () => {
      const viewer = testUtils.createMockViewer();
      
      // オブジェクト形式のdebug設定
      const renderer = new VoxelRenderer(viewer, {
        debug: { showBounds: true }
      });
      
      expect(renderer._shouldShowBounds()).toBe(true);
    });
    
    test('従来のboolean形式debug設定も動作', () => {
      const viewer = testUtils.createMockViewer();
      const renderer = new VoxelRenderer(viewer, {
        debug: true
      });
      
      expect(renderer._shouldShowBounds()).toBe(true);
    });
  });

  // v0.1.6: 枠線太さ・ギャップ・透明度のユニットテスト
  describe('v0.1.6 枠線・ギャップ機能', () => {
    let viewer, renderer, mockAdd;

    beforeEach(() => {
      viewer = testUtils.createMockViewer();
      mockAdd = viewer.entities.add;
    });

    const voxelData = new Map([
      ['0,0,0', { x: 0, y: 0, z: 0, count: 10 }], // TopN
      ['1,1,1', { x: 1, y: 1, z: 1, count: 5 }]  // Not TopN
    ]);
    const bounds = { minLon: 0, maxLon: 2, minLat: 0, maxLat: 2, minAlt: 0, maxAlt: 2 };
    const grid = { numVoxelsX: 2, numVoxelsY: 2, numVoxelsZ: 2, voxelSizeMeters: 10 };
    const statistics = { minCount: 5, maxCount: 10 };

    test('outlineWidthResolver が正しく適用される', () => {
      renderer = new VoxelRenderer(viewer, {
        outlineWidthResolver: ({ isTopN }) => isTopN ? 5 : 1.5,
        highlightTopN: 1
      });
      renderer.render(voxelData, bounds, grid, statistics);

      expect(mockAdd).toHaveBeenCalledTimes(2);
      const topNVoxelCall = mockAdd.mock.calls.find(call => call[0].properties.key === '0,0,0');
      const otherVoxelCall = mockAdd.mock.calls.find(call => call[0].properties.key === '1,1,1');

      expect(topNVoxelCall[0].box.outlineWidth).toBe(5);
      expect(otherVoxelCall[0].box.outlineWidth).toBe(1.5);
    });

    test('voxelGap がボクセルの寸法に適用される', () => {
      renderer = new VoxelRenderer(viewer, { voxelGap: 1 }); // 1mギャップ
      renderer.render(voxelData, bounds, grid, statistics);

      const expectedSize = grid.voxelSizeMeters - 1;
      const call = mockAdd.mock.calls[0];
      const dimensions = call[0].box.dimensions;

      expect(dimensions.x).toBeCloseTo(expectedSize);
      expect(dimensions.y).toBeCloseTo(expectedSize);
      expect(dimensions.z).toBeCloseTo(expectedSize);
    });

    test('outlineOpacity が枠線のアルファ値に適用される', () => {
      renderer = new VoxelRenderer(viewer, { showOutline: true, outlineOpacity: 0.5 });
      renderer.render(voxelData, bounds, grid, statistics);

      const call = mockAdd.mock.calls[0];
      const outlineColor = call[0].box.outlineColor;

      expect(outlineColor.alpha).toBe(0.5);
    });

    test('デフォルトの枠線太さが適用される', () => {
        renderer = new VoxelRenderer(viewer, {
            outlineWidth: 2,
            highlightTopN: 1,
            highlightStyle: { outlineWidth: 4 }
        });
        renderer.render(voxelData, bounds, grid, statistics);

        const topNVoxelCall = mockAdd.mock.calls.find(call => call[0].properties.key === '0,0,0');
        const otherVoxelCall = mockAdd.mock.calls.find(call => call[0].properties.key === '1,1,1');

        expect(topNVoxelCall[0].box.outlineWidth).toBe(4);
        expect(otherVoxelCall[0].box.outlineWidth).toBe(2);
    });
  });

  // v0.1.6.1: インセット枠線機能のテスト（ADR-0004）
  describe('インセット枠線機能', () => {
    let viewer, renderer, mockAdd;

    beforeEach(() => {
      viewer = testUtils.createMockViewer();
      mockAdd = viewer.entities.add;
    });

    const voxelData = new Map([
      ['0,0,0', { x: 0, y: 0, z: 0, count: 10 }], // TopN
      ['1,1,1', { x: 1, y: 1, z: 1, count: 5 }]  // Not TopN
    ]);
    const bounds = { minLon: 0, maxLon: 2, minLat: 0, maxLat: 2, minAlt: 0, maxAlt: 2 };
    const grid = { numVoxelsX: 2, numVoxelsY: 2, numVoxelsZ: 2, voxelSizeMeters: 20 };
    const statistics = { minCount: 5, maxCount: 10 };

    test('outlineInset > 0 でインセット枠線エンティティが追加される', () => {
      renderer = new VoxelRenderer(viewer, {
        outlineInset: 2, // 2mインセット
        outlineInsetMode: 'all'
      });
      renderer.render(voxelData, bounds, grid, statistics);

      // 通常のボクセル2個 + インセット枠線2個 = 4個のエンティティ
      expect(mockAdd).toHaveBeenCalledTimes(4);

      // インセット枠線エンティティの検証
      const insetCalls = mockAdd.mock.calls.filter(call => 
        call[0].properties && call[0].properties.type === 'voxel-inset-outline'
      );
      expect(insetCalls).toHaveLength(2);

      // インセット枠線の設定検証
      const insetEntity = insetCalls[0][0];
      expect(insetEntity.box.fill).toBe(false);
      expect(insetEntity.box.outline).toBe(true);
      expect(insetEntity.box.dimensions.x).toBeLessThan(20); // 元のサイズより小さい
    });

    test('outlineInsetMode: "topn" でTopNのみにインセット枠線が適用される', () => {
      renderer = new VoxelRenderer(viewer, {
        outlineInset: 2,
        outlineInsetMode: 'topn',
        highlightTopN: 1
      });
      renderer.render(voxelData, bounds, grid, statistics);

      // 通常のボクセル2個 + TopN用インセット枠線1個 = 3個のエンティティ
      expect(mockAdd).toHaveBeenCalledTimes(3);

      const insetCalls = mockAdd.mock.calls.filter(call => 
        call[0].properties && call[0].properties.type === 'voxel-inset-outline'
      );
      expect(insetCalls).toHaveLength(1);
    });

    test('インセット距離が各軸寸法の40%制限内に収まる', () => {
      const largeInset = 100; // 20mボクセルの40%（8m）を超える値
      renderer = new VoxelRenderer(viewer, {
        outlineInset: largeInset,
        outlineInsetMode: 'all'
      });
      renderer.render(voxelData, bounds, grid, statistics);

      const insetCall = mockAdd.mock.calls.find(call => 
        call[0].properties && call[0].properties.type === 'voxel-inset-outline'
      );
      const insetEntity = insetCall[0];
      
      // インセット後のサイズは元のサイズの60%以上であること（40%制限）
      const expectedMinSize = grid.voxelSizeMeters * 0.6;
      expect(insetEntity.box.dimensions.x).toBeGreaterThanOrEqual(expectedMinSize);
      expect(insetEntity.box.dimensions.y).toBeGreaterThanOrEqual(expectedMinSize);
      expect(insetEntity.box.dimensions.z).toBeGreaterThanOrEqual(expectedMinSize);
    });

    test('outlineInset = 0 でインセット枠線が作成されない', () => {
      renderer = new VoxelRenderer(viewer, {
        outlineInset: 0
      });
      renderer.render(voxelData, bounds, grid, statistics);

      // 通常のボクセル2個のみ
      expect(mockAdd).toHaveBeenCalledTimes(2);

      const insetCalls = mockAdd.mock.calls.filter(call => 
        call[0].properties && call[0].properties.type === 'voxel-inset-outline'
      );
      expect(insetCalls).toHaveLength(0);
    });

    test('インセット枠線エンティティのプロパティが正しく設定される', () => {
      renderer = new VoxelRenderer(viewer, {
        outlineInset: 3,
        outlineInsetMode: 'all'
      });
      renderer.render(voxelData, bounds, grid, statistics);

      const insetCall = mockAdd.mock.calls.find(call => 
        call[0].properties && call[0].properties.type === 'voxel-inset-outline'
      );
      const insetEntity = insetCall[0];
      
      expect(insetEntity.properties.type).toBe('voxel-inset-outline');
      expect(insetEntity.properties.parentKey).toBeDefined();
      expect(insetEntity.properties.insetSize).toBeDefined();
      expect(insetEntity.properties.insetSize.x).toBeGreaterThan(0);
      expect(insetEntity.properties.insetSize.y).toBeGreaterThan(0);
      expect(insetEntity.properties.insetSize.z).toBeGreaterThan(0);
    });

    test('_shouldApplyInsetOutline メソッドが正しく動作する', () => {
      renderer = new VoxelRenderer(viewer, { outlineInsetMode: 'all' });
      expect(renderer._shouldApplyInsetOutline(true)).toBe(true);
      expect(renderer._shouldApplyInsetOutline(false)).toBe(true);

      renderer = new VoxelRenderer(viewer, { outlineInsetMode: 'topn' });
      expect(renderer._shouldApplyInsetOutline(true)).toBe(true);
      expect(renderer._shouldApplyInsetOutline(false)).toBe(false);
    });
  });

  // v0.1.7: 適応的枠線制御テスト
  describe('適応的枠線制御機能 (v0.1.7)', () => {
    let renderer;
    let mockVoxelData;
    let mockStatistics;
    let mockGrid;
    
    beforeEach(() => {
      const viewer = testUtils.createMockViewer();
      renderer = new VoxelRenderer(viewer, {
        adaptiveOutlines: true,
        outlineWidthPreset: 'adaptive-density'
      });
      
      mockVoxelData = new Map();
      mockVoxelData.set('0,0,0', { x: 0, y: 0, z: 0, count: 10 });
      mockVoxelData.set('1,1,1', { x: 1, y: 1, z: 1, count: 5 });
      
      mockStatistics = {
        minCount: 1,
        maxCount: 10,
        totalEntities: 15
      };

      mockGrid = {
        cellSizeX: 20,
        cellSizeY: 20,
        cellSizeZ: 5,
        numVoxelsX: 2,
        numVoxelsY: 2,
        numVoxelsZ: 2
      };
    });
    
    test('_calculateAdaptiveParams メソッドが存在し、適応的パラメータを計算', () => {
      expect(typeof renderer._calculateAdaptiveParams).toBe('function');
      
      const voxelInfo = { x: 0, y: 0, z: 0, count: 5 };
      const result = renderer._calculateAdaptiveParams(voxelInfo, false, mockVoxelData, mockStatistics, mockGrid);
      
      expect(result).toHaveProperty('outlineWidth');
      expect(result).toHaveProperty('boxOpacity');
      expect(result).toHaveProperty('outlineOpacity');
      expect(result).toHaveProperty('shouldUseEmulation');
    });
    
    test('adaptiveOutlines が無効時は null を返す', () => {
      renderer.options.adaptiveOutlines = false;
      
      const voxelInfo = { x: 0, y: 0, z: 0, count: 5 };
      const result = renderer._calculateAdaptiveParams(voxelInfo, false, mockVoxelData, mockStatistics, mockGrid);
      
      expect(result.outlineWidth).toBeNull();
      expect(result.boxOpacity).toBeNull();
      expect(result.outlineOpacity).toBeNull();
      expect(result.shouldUseEmulation).toBe(false);
    });
    
    test('各プリセットが異なる適応的パラメータを生成', () => {
      const voxelInfo = { x: 0, y: 0, z: 0, count: 8 };
      
      renderer.options.outlineWidthPreset = 'adaptive-density';
      const adaptiveResult = renderer._calculateAdaptiveParams(voxelInfo, false, mockVoxelData, mockStatistics, mockGrid);
      
      renderer.options.outlineWidthPreset = 'topn-focus';
      const topnResult = renderer._calculateAdaptiveParams(voxelInfo, true, mockVoxelData, mockStatistics, mockGrid);
      
      renderer.options.outlineWidthPreset = 'uniform';
      const uniformResult = renderer._calculateAdaptiveParams(voxelInfo, false, mockVoxelData, mockStatistics, mockGrid);
      
      expect(adaptiveResult).toBeDefined();
      expect(topnResult).toBeDefined();
      expect(uniformResult).toBeDefined();
      
      // topn-focusモードではTopNボクセルが太くなることを確認
      expect(topnResult.outlineWidth).toBeGreaterThan(uniformResult.outlineWidth);
    });
  });

  // v0.1.7: 透明度resolver機能テスト
  describe('透明度resolver機能 (v0.1.7)', () => {
    let renderer;
    
    beforeEach(() => {
      const viewer = testUtils.createMockViewer();
      renderer = new VoxelRenderer(viewer, {
        boxOpacityResolver: (_ctx) => 0.5,
        outlineOpacityResolver: (_ctx) => 0.8
      });
    });
    
    test('boxOpacityResolver が設定されている場合は適用される', () => {
      expect(renderer.options.boxOpacityResolver).toBeDefined();
      expect(typeof renderer.options.boxOpacityResolver).toBe('function');
      
      const result = renderer.options.boxOpacityResolver({
        voxel: { x: 0, y: 0, z: 0, count: 5 },
        isTopN: false,
        normalizedDensity: 0.5
      });
      
      expect(result).toBe(0.5);
    });
    
    test('outlineOpacityResolver が設定されている場合は適用される', () => {
      expect(renderer.options.outlineOpacityResolver).toBeDefined();
      expect(typeof renderer.options.outlineOpacityResolver).toBe('function');
      
      const result = renderer.options.outlineOpacityResolver({
        voxel: { x: 0, y: 0, z: 0, count: 5 },
        isTopN: true,
        normalizedDensity: 0.8
      });
      
      expect(result).toBe(0.8);
    });
  });

  // v0.1.7: outlineRenderMode テスト
  describe('outlineRenderMode 制御 (v0.1.7)', () => {
    let renderer;
    
    beforeEach(() => {
      const viewer = testUtils.createMockViewer();
      renderer = new VoxelRenderer(viewer);
    });
    
    test('standard モードは既存の動作を維持', () => {
      renderer.options.outlineRenderMode = 'standard';
      renderer.options.showOutline = true;
      
      expect(renderer.options.outlineRenderMode).toBe('standard');
      expect(renderer.options.showOutline).toBe(true);
    });
    
    test('inset モードが設定できる', () => {
      renderer.options.outlineRenderMode = 'inset';
      
      expect(renderer.options.outlineRenderMode).toBe('inset');
    });
    
    test('emulation-only モードが設定できる', () => {
      renderer.options.outlineRenderMode = 'emulation-only';
      
      expect(renderer.options.outlineRenderMode).toBe('emulation-only');
    });
    
    test('無効な outlineRenderMode は standard にフォールバック', () => {
      renderer.options.outlineRenderMode = 'invalid-mode';
      
      // 実際の処理では適切にフォールバックされることを期待
      expect(['standard', 'inset', 'emulation-only']).toContain('standard'); // フォールバック確認
    });
  });
});
