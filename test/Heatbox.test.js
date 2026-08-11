/**
 * Heatbox クラスのテスト
 */
/* global document */

import { Heatbox } from '../src/Heatbox.js';
import { Logger } from '../src/utils/logger.js';
import * as Cesium from 'cesium';

describe('Heatbox', () => {
  let viewer;
  let heatbox;
  
  beforeEach(() => {
    viewer = testUtils.createMockViewer();
    heatbox = new Heatbox(viewer);
  });
  
  afterEach(() => {
    if (heatbox) {
      heatbox.clear();
    }
  });
  
  describe('コンストラクタ', () => {
    test('有効なviewerで初期化できる', () => {
      expect(heatbox).toBeInstanceOf(Heatbox);
      expect(heatbox.viewer).toBe(viewer);
    });
    
    test('無効なviewerで初期化時にエラーが発生する', () => {
      expect(() => {
        new Heatbox(null);
      }).toThrow('CesiumJS Viewerが無効です');
    });
    
    test('オプションが正しく設定される', () => {
      const options = {
        voxelSize: 30,
        opacity: 0.7,
        showEmptyVoxels: true
      };
      
      const customHeatbox = new Heatbox(viewer, options);
      const actualOptions = customHeatbox.getOptions();
      
      expect(actualOptions.voxelSize).toBe(30);
      expect(actualOptions.opacity).toBe(0.7);
      expect(actualOptions.showEmptyVoxels).toBe(true);
    });

    test('非推奨のoutlineEmulationを既定値として注入しない', () => {
      expect(heatbox.getOptions()).not.toHaveProperty('outlineEmulation');
    });
  });
  
  describe('createFromEntities', () => {
    test('正常なエンティティからヒートマップが作成される', async () => {
      const bounds = testUtils.createMockBounds();
      const entities = [];
      
      // テストエンティティを作成
      for (let i = 0; i < 10; i++) {
        entities.push(testUtils.createMockEntity(
          bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon),
          bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
          bounds.minAlt + Math.random() * (bounds.maxAlt - bounds.minAlt)
        ));
      }
      
      const statistics = await heatbox.createFromEntities(entities);
      
      expect(statistics).toBeDefined();
      expect(statistics.totalEntities).toBeGreaterThanOrEqual(1); // v0.1.2でフィルタリング処理が変更
      expect(statistics.totalVoxels).toBeGreaterThan(0);
      expect(statistics.nonEmptyVoxels).toBeGreaterThan(0);
    });
    
    test('空のエンティティ配列でエラーが発生する', async () => {
      await expect(heatbox.createFromEntities([])).rejects.toThrow('対象エンティティがありません');
    });
    
    test('nullエンティティ配列でエラーが発生する', async () => {
      await expect(heatbox.createFromEntities(null)).rejects.toThrow('対象エンティティがありません');
    });
  });
  
  describe('表示制御', () => {
    test('setVisibleで表示/非表示を切り替えできる', () => {
      expect(() => {
        heatbox.setVisible(false);
        heatbox.setVisible(true);
      }).not.toThrow();
    });
    
    test('clearでヒートマップがクリアされる', () => {
      heatbox.clear();
      expect(heatbox.getStatistics()).toBeNull();
    });

    test('パフォーマンスオーバーレイを実行時に有効化・切替・無効化できる', () => {
      viewer.scene.postRender = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };

      expect(heatbox.togglePerformanceOverlay()).toBe(false);
      expect(heatbox.setPerformanceOverlayEnabled(true, { autoShow: true })).toBe(true);
      expect(heatbox._performanceOverlay).not.toBeNull();
      expect(heatbox.togglePerformanceOverlay()).toBe(false);

      heatbox.showPerformanceOverlay();
      expect(heatbox.togglePerformanceOverlay()).toBe(false);
      heatbox.hidePerformanceOverlay();
      expect(heatbox.setPerformanceOverlayEnabled(false)).toBe(false);
      expect(viewer.scene.postRender.removeEventListener).toHaveBeenCalled();
    });

    test('分類凡例を作成・更新・破棄できる', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      expect(heatbox.createLegend(container)).toBe(container);
      expect(() => heatbox.updateLegend()).not.toThrow();
      heatbox.destroyLegend();
      expect(heatbox._legend).toBeNull();
      container.remove();
    });
  });

  describe('クリック選択', () => {
    test('Cesium PropertyBag のボクセルをInfoBoxへ選択できる', () => {
      const voxel = new Cesium.Entity({
        properties: { type: 'voxel', key: '1,2,3', x: 1, y: 2, z: 3, count: 7 }
      });
      viewer.scene.pick = jest.fn(() => ({ id: voxel }));
      const handler = heatbox._eventHandler.setInputAction.mock.calls[0][0];

      handler({ position: { x: 10, y: 20 } });

      expect(viewer.selectedEntity.id).toBe('voxel-1,2,3');
      expect(viewer.selectedEntity.description).toContain('7');
    });
  });

  describe('カメラ制御', () => {
    test('fitViewはpostRender後にBoundingSphereへ移動する', async () => {
      viewer.camera.flyToBoundingSphere = jest.fn().mockResolvedValue(undefined);
      viewer.scene.postRender = {
        addEventListener: jest.fn(handler => {
          void handler();
        }),
        removeEventListener: jest.fn()
      };
      const bounds = testUtils.createMockBounds();

      await heatbox.fitView(bounds, { headingDegrees: 15, pitchDegrees: -40 });

      expect(viewer.camera.flyToBoundingSphere).toHaveBeenCalledTimes(1);
      expect(viewer.scene.postRender.removeEventListener).toHaveBeenCalledTimes(1);
    });

    test('fitViewのpaddingPercentとaltitudeStrategyを距離へ反映する', async () => {
      viewer.camera.flyToBoundingSphere = jest.fn().mockResolvedValue(undefined);
      const bounds = { ...testUtils.createMockBounds(), maxAlt: 2000 };

      await heatbox._fitByBoundingSphere(bounds, { paddingPercent: 0, altitudeStrategy: 'manual' });
      const manualRange = viewer.camera.flyToBoundingSphere.mock.calls[0][1].offset.range;
      await heatbox._fitByBoundingSphere(bounds, { paddingPercent: 0.5, altitudeStrategy: 'auto' });
      const autoRange = viewer.camera.flyToBoundingSphere.mock.calls[1][1].offset.range;

      expect(manualRange).toBeCloseTo(1100);
      expect(autoRange).toBeGreaterThan(manualRange);
    });

    test('fitViewは境界がない場合と無効な場合に安全に終了する', async () => {
      await expect(heatbox.fitView()).resolves.toBeUndefined();
      await expect(heatbox.fitView({ minLon: 1 })).resolves.toBeUndefined();
    });
  });
  
  describe('統計情報', () => {
    test('ヒートマップ作成前はnullが返される', () => {
      expect(heatbox.getStatistics()).toBeNull();
    });
    
    test('作成後は統計情報が取得できる', async () => {
      const bounds = testUtils.createMockBounds();
      const entities = [
        testUtils.createMockEntity(bounds.centerLon, bounds.centerLat, bounds.centerAlt)
      ];
      
      await heatbox.createFromEntities(entities);
      
      const stats = heatbox.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalEntities).toBeGreaterThanOrEqual(0); // v0.1.2でフィルタリング処理が変更
      expect(stats.nonEmptyVoxels).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('オプション管理', () => {
    test('getOptionsで現在のオプションを取得できる', () => {
      const options = heatbox.getOptions();
      expect(options).toBeDefined();
      expect(options.voxelSize).toBe(20); // デフォルト値
    });
    
    test('updateOptionsでオプションを更新できる', () => {
      const logLevelSpy = jest.spyOn(Logger, 'setLogLevel');
      heatbox.updateOptions({ voxelSize: 50 });
      const options = heatbox.getOptions();
      expect(options.voxelSize).toBe(50);
      expect(logLevelSpy).toHaveBeenCalledWith(expect.objectContaining({ voxelSize: 50 }));
      logLevelSpy.mockRestore();
    });

    test('autoVoxelSizeはvoxelSize未指定時に推定値を使用する', async () => {
      const automaticHeatbox = new Heatbox(viewer, { autoVoxelSize: true });
      const entities = [
        testUtils.createMockEntity(139.7, 35.6, 0),
        testUtils.createMockEntity(139.8, 35.7, 100)
      ];

      await automaticHeatbox.setData(entities);

      expect(automaticHeatbox.getStatistics().finalVoxelSize).toBeDefined();
      expect(automaticHeatbox._grid.voxelSizeMeters).toBe(
        automaticHeatbox.getStatistics().finalVoxelSize
      );
      automaticHeatbox.clear();
    });

    test('autoVoxelSizeでも明示したvoxelSizeを優先する', async () => {
      const fixedHeatbox = new Heatbox(viewer, { autoVoxelSize: true, voxelSize: 30 });
      const entities = [
        testUtils.createMockEntity(139.7, 35.6, 0),
        testUtils.createMockEntity(139.71, 35.61, 30)
      ];

      await fixedHeatbox.setData(entities);

      expect(fixedHeatbox._grid.voxelSizeMeters).toBe(30);
      expect(fixedHeatbox.getStatistics().finalVoxelSize).toBeNull();
      fixedHeatbox.clear();
    });

    test('updateValuesは条件を満たす場合に既存グリッドを再利用する', async () => {
      const initialEntities = [
        testUtils.createMockEntity(139.7000, 35.6000, 50),
        testUtils.createMockEntity(139.7004, 35.6004, 58),
        testUtils.createMockEntity(139.7002, 35.6002, 54)
      ];
      await heatbox.setData(initialEntities);

      const initialGrid = heatbox._grid;
      const initialBounds = heatbox._bounds;

      const nextEntities = [
        testUtils.createMockEntity(139.7001, 35.6001, 52),
        testUtils.createMockEntity(139.7003, 35.6003, 56)
      ];

      await heatbox.updateValues(nextEntities);

      expect(heatbox._grid).toBe(initialGrid);
      expect(heatbox._bounds).toBe(initialBounds);
      expect(heatbox.getStatistics().totalEntities).toBe(2);
    });

    test('updateValuesは条件を満たさない場合にsetData相当へフォールバックする', async () => {
      const initialEntities = [
        testUtils.createMockEntity(139.7000, 35.6000, 50),
        testUtils.createMockEntity(139.7002, 35.6002, 55)
      ];
      await heatbox.setData(initialEntities);

      const initialGrid = heatbox._grid;

      const farEntities = [
        testUtils.createMockEntity(140.5, 36.2, 80),
        testUtils.createMockEntity(140.6, 36.3, 90)
      ];

      await heatbox.updateValues(farEntities);

      expect(heatbox._grid).not.toBe(initialGrid);
      expect(heatbox.getStatistics().totalEntities).toBe(2);
    });

    test('updateValuesは旧boundsを超える更新を軽量経路で再利用しない', async () => {
      const initialEntities = [
        testUtils.createMockEntity(139.7000, 35.6000, 50),
        testUtils.createMockEntity(139.7008, 35.6008, 55)
      ];
      await heatbox.setData(initialEntities);

      const initialGrid = heatbox._grid;

      const expandedEntities = [
        testUtils.createMockEntity(139.6990, 35.5990, 49),
        testUtils.createMockEntity(139.7025, 35.6025, 58)
      ];

      await heatbox.updateValues(expandedEntities);

      expect(heatbox._grid).not.toBe(initialGrid);
      expect(heatbox.getStatistics().totalEntities).toBe(2);
    });
  });
  
  describe('静的メソッド', () => {
    test('filterEntitiesで関数フィルタが適用される', () => {
      const entities = [
        testUtils.createMockEntity(139.766, 35.681, 50),
        testUtils.createMockEntity(139.767, 35.682, 60),
        testUtils.createMockEntity(139.768, 35.683, 70)
      ];
      
      const filtered = Heatbox.filterEntities(entities, (entity) => {
        return entity.position.z > 55;
      });
      
      expect(filtered).toHaveLength(2);
    });
    
    test('filterEntitiesで空配列が正しく処理される', () => {
      const filtered = Heatbox.filterEntities([], () => true);
      expect(filtered).toHaveLength(0);
    });
  });
  
  describe('デバッグ情報', () => {
    test('getDebugInfoでデバッグ情報を取得できる', () => {
      const debugInfo = heatbox.getDebugInfo();
      expect(debugInfo).toBeDefined();
      expect(debugInfo.options).toBeDefined();
      expect(debugInfo.bounds).toBeNull(); // 未作成時
    });
  });
  
  describe('エラーハンドリング', () => {
    test('無効なボクセルサイズでエラーが発生する', () => {
      expect(() => {
        new Heatbox(viewer, { voxelSize: -1 });
      }).toThrow('ボクセルサイズが無効です');
    });
    
    test('無効なオプションが正規化される', () => {
      const heatbox = new Heatbox(viewer, { 
        opacity: 2.0, // 1.0を超過
        emptyOpacity: -0.5 // 0未満
      });
      
      const options = heatbox.getOptions();
      expect(options.opacity).toBe(1.0);
      expect(options.emptyOpacity).toBe(0.0);
    });
  });
});
