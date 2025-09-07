/**
 * Sample code validation tests
 * サンプルコードの動作検証テスト
 * 
 * v0.1.11-alpha: Ensures backward compatibility after ADR-0009 orchestration refactoring
 */

import { Heatbox } from '../../src/index.js';

// Mock Cesium environment
const mockViewer = {
  entities: {
    add: jest.fn().mockReturnValue({ id: Math.random().toString() }),
    removeAll: jest.fn(),
    remove: jest.fn(),
    values: []
  },
  camera: {
    flyToBoundingSphere: jest.fn(),
    position: { clone: jest.fn() },
    direction: { clone: jest.fn() },
    up: { clone: jest.fn() }
  },
  clock: {
    currentTime: { clone: jest.fn() }
  },
  scene: {
    canvas: {
      getContext: jest.fn((type) => {
        // Mock WebGL context for validation
        if (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl') {
          return { /* mock WebGL context */ };
        }
        return null;
      })
    }
  }
};

// Mock Cesium objects
global.Cesium = {
  Viewer: jest.fn(() => mockViewer),
  Cartesian3: {
    fromDegrees: jest.fn((lon, lat, alt = 0) => ({ x: lon, y: lat, z: alt })),
    distance: jest.fn(() => 1000),
    subtract: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
    multiplyByScalar: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
    add: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
    magnitude: jest.fn(() => 100)
  },
  Color: {
    RED: { withAlpha: jest.fn(alpha => ({ r: 1, g: 0, b: 0, a: alpha })), clone: jest.fn() },
    BLUE: { withAlpha: jest.fn(alpha => ({ r: 0, g: 0, b: 1, a: alpha })), clone: jest.fn() },
    LIGHTGRAY: { withAlpha: jest.fn(alpha => ({ r: 0.8, g: 0.8, b: 0.8, a: alpha })), clone: jest.fn() },
    fromBytes: jest.fn((r, g, b, a) => ({ r: r/255, g: g/255, b: b/255, a: a/255 })),
    lerp: jest.fn(() => ({ r: 0.5, g: 0.5, b: 0.5, a: 1 }))
  },
  BoundingSphere: {
    fromPoints: jest.fn(() => ({
      center: { x: 0, y: 0, z: 0 },
      radius: 1000
    }))
  },
  Matrix4: {
    multiplyByPoint: jest.fn(() => ({ x: 0, y: 0, z: 0 }))
  },
  Transforms: {
    eastNorthUpToFixedFrame: jest.fn(() => ({}))
  },
  ArcType: {
    NONE: 'NONE'
  }
};

describe('Sample Code Validation', () => {
  let viewer;
  
  beforeEach(() => {
    viewer = mockViewer;
    // Reset mock counters
    jest.clearAllMocks();
  });

  describe('Basic Usage Examples', () => {
    test('should support minimal implementation pattern from wiki', async () => {
      // From wiki/Examples.md - 最小実装
      const heatbox = new Heatbox(viewer, { 
        voxelSize: 30, 
        opacity: 0.7,
        wireframeOnly: true,
        heightBased: false
      });

      // Create mock entities
      const mockEntities = [];
      for (let i = 0; i < 100; i++) {
        const lon = 139.764 + Math.random() * 0.005;
        const lat = 35.679 + Math.random() * 0.004;
        const alt = Math.random() * 150;
        mockEntities.push({ 
          position: global.Cesium.Cartesian3.fromDegrees(lon, lat, alt), 
          point: { pixelSize: 5 } 
        });
      }

      // Test the creation process
      await expect(heatbox.createFromEntities(mockEntities)).resolves.toBeDefined();
      
      // Verify heatbox was created successfully
      expect(heatbox).toBeDefined();
      expect(heatbox.getStatistics()).toBeDefined();
    });

    test('should support visibility control pattern', async () => {
      // From wiki/Examples.md - 表示制御
      const heatbox = new Heatbox(viewer, { voxelSize: 30 });
      
      const mockEntities = [
        { position: global.Cesium.Cartesian3.fromDegrees(139.764, 35.679, 50) }
      ];
      
      await heatbox.createFromEntities(mockEntities);
      
      // Test visibility control
      expect(() => {
        heatbox.setVisible(false);
        heatbox.setVisible(true);
      }).not.toThrow();
    });

    test('should support options update pattern', async () => {
      // From wiki/Examples.md - オプション更新
      const heatbox = new Heatbox(viewer, { voxelSize: 30 });
      
      const mockEntities = [
        { position: global.Cesium.Cartesian3.fromDegrees(139.764, 35.679, 50) }
      ];
      
      await heatbox.createFromEntities(mockEntities);
      
      // Test options update
      expect(() => {
        heatbox.updateOptions({ voxelSize: 40, showEmptyVoxels: true });
      }).not.toThrow();
    });

    test('should provide statistics as shown in examples', async () => {
      // From wiki/Examples.md - 統計情報の活用
      const heatbox = new Heatbox(viewer, { voxelSize: 30 });
      
      const mockEntities = [
        { position: global.Cesium.Cartesian3.fromDegrees(139.764, 35.679, 50) },
        { position: global.Cesium.Cartesian3.fromDegrees(139.765, 35.680, 60) }
      ];
      
      await heatbox.createFromEntities(mockEntities);
      
      const stats = heatbox.getStatistics();
      
      // Verify statistics structure matches example
      expect(stats).toHaveProperty('totalVoxels');
      expect(stats).toHaveProperty('nonEmptyVoxels');  
      expect(stats).toHaveProperty('totalEntities');
      expect(stats).toHaveProperty('maxCount');
      
      expect(typeof stats.totalVoxels).toBe('number');
      expect(typeof stats.nonEmptyVoxels).toBe('number');
      expect(typeof stats.totalEntities).toBe('number');
      expect(typeof stats.maxCount).toBe('number');
    });
  });

  describe('Advanced Feature Examples', () => {
    test('should support wireframe-only display from examples', async () => {
      // From wiki/Examples.md - 枠線のみ表示
      const heatbox = new Heatbox(viewer, {
        voxelSize: 25,
        wireframeOnly: true,
        showOutline: true,
        outlineWidth: 2
      });

      const mockEntities = [
        { position: global.Cesium.Cartesian3.fromDegrees(139.764, 35.679, 50) }
      ];

      await expect(heatbox.createFromEntities(mockEntities)).resolves.toBeDefined();
      
      // Verify wireframe configuration
      expect(heatbox.options.wireframeOnly).toBe(true);
      expect(heatbox.options.showOutline).toBe(true);
      expect(heatbox.options.outlineWidth).toBe(2);
    });

    test('should support height-based density representation', async () => {
      // From wiki/Examples.md - 高さベース密度表現
      const heatbox = new Heatbox(viewer, {
        voxelSize: 30,
        heightBased: true,
        wireframeOnly: false,
        opacity: 0.8
      });

      const mockEntities = [
        { position: global.Cesium.Cartesian3.fromDegrees(139.764, 35.679, 50) },
        { position: global.Cesium.Cartesian3.fromDegrees(139.764, 35.679, 51) }, // Same location
        { position: global.Cesium.Cartesian3.fromDegrees(139.764, 35.679, 52) }  // Higher density
      ];

      await expect(heatbox.createFromEntities(mockEntities)).resolves.toBeDefined();
      
      // Verify height-based configuration
      expect(heatbox.options.heightBased).toBe(true);
      expect(heatbox.options.opacity).toBe(0.8);
    });

    test('should support combined feature usage', async () => {
      // From wiki/Examples.md - 組み合わせ使用
      const heatbox = new Heatbox(viewer, {
        voxelSize: 20,
        wireframeOnly: true,
        heightBased: true,
        outlineWidth: 3,
        showEmptyVoxels: false
      });

      const mockEntities = [
        { position: global.Cesium.Cartesian3.fromDegrees(139.764, 35.679, 50) }
      ];

      await expect(heatbox.createFromEntities(mockEntities)).resolves.toBeDefined();
      
      // Verify combined configuration
      expect(heatbox.options.wireframeOnly).toBe(true);
      expect(heatbox.options.heightBased).toBe(true);
      expect(heatbox.options.outlineWidth).toBe(3);
      expect(heatbox.options.showEmptyVoxels).toBe(false);
    });
  });

  describe('Utility Function Examples', () => {
    test('should support entity filtering as shown in examples', () => {
      // From wiki/Examples.md - エンティティのフィルタリング
      const mockEntities = [
        { point: { pixelSize: 5 } },
        { box: { dimensions: [10, 10, 10] } },
        { point: { pixelSize: 3 } }
      ];
      
      // Test filtering utility
      const pointEntities = Heatbox.filterEntities(mockEntities, e => !!e.point);
      
      expect(pointEntities).toHaveLength(2);
      expect(pointEntities.every(e => !!e.point)).toBe(true);
    });

    test('should maintain backward compatibility for all public APIs', async () => {
      const heatbox = new Heatbox(viewer, { voxelSize: 30 });
      
      // Test all public methods mentioned in examples
      expect(typeof heatbox.createFromEntities).toBe('function');
      expect(typeof heatbox.setVisible).toBe('function');
      expect(typeof heatbox.updateOptions).toBe('function');
      expect(typeof heatbox.getStatistics).toBe('function');
      expect(typeof heatbox.clear).toBe('function');
      
      // Test static methods
      expect(typeof Heatbox.filterEntities).toBe('function');
    });
  });

  describe('v0.1.11-alpha Orchestration Architecture Compatibility', () => {
    test('should maintain same API surface after orchestration refactoring', async () => {
      const heatbox = new Heatbox(viewer, { 
        voxelSize: 30,
        // Test advanced features still work
        highlightTopN: 5,
        adaptiveOutlines: true,
        voxelSelectionStrategy: 'hybrid'
      });

      const mockEntities = [];
      for (let i = 0; i < 50; i++) {
        mockEntities.push({ 
          position: global.Cesium.Cartesian3.fromDegrees(
            139.764 + Math.random() * 0.001, 
            35.679 + Math.random() * 0.001, 
            Math.random() * 100
          )
        });
      }

      // Test that orchestration doesn't break existing functionality
      await expect(heatbox.createFromEntities(mockEntities)).resolves.toBeDefined();
      
      const stats = heatbox.getStatistics();
      expect(stats.totalEntities).toBe(50);
      expect(stats.totalVoxels).toBeGreaterThan(0);
    });
  });
});
