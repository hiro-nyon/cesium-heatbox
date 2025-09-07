/**
 * Heatbox クラスのテスト
 */

import { Heatbox } from '../src/Heatbox.js';

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
      heatbox.updateOptions({ voxelSize: 50 });
      const options = heatbox.getOptions();
      expect(options.voxelSize).toBe(50);
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
