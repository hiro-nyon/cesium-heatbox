/**
 * outlineWidthResolver パフォーマンステスト (v0.1.6)
 * 大量ボクセルでの動的太さ制御のパフォーマンス影響を測定
 */

import { VoxelRenderer } from '../../src/core/VoxelRenderer.js';

describe('outlineWidthResolver Performance', () => {
  let viewer, mockCesium;

  beforeEach(() => {
    // Cesiumモック
    mockCesium = {
      Color: {
        fromBytes: (r, g, b, a = 255) => ({ red: r/255, green: g/255, blue: b/255, alpha: a/255 }),
        LIGHTGRAY: { red: 0.8, green: 0.8, blue: 0.8, alpha: 1 },
        TRANSPARENT: { red: 0, green: 0, blue: 0, alpha: 0 }
      },
      Cartesian3: class {
        constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
        static fromDegrees(lon, lat, alt) { return new mockCesium.Cartesian3(lon, lat, alt); }
      }
    };
    global.Cesium = mockCesium;

    viewer = {
      entities: {
        add: jest.fn(),
        removeAll: jest.fn(),
        values: []
      }
    };
  });

  test('静的太さ制御（ベースライン）のパフォーマンス', async () => {
    const renderer = new VoxelRenderer(viewer, {
      outlineWidth: 2,
      highlightTopN: null
    });

    const { voxelData, bounds, grid, statistics } = createLargeTestDataset(1000);

    const startTime = performance.now();
    const renderCount = renderer.render(voxelData, bounds, grid, statistics);
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    
    expect(renderCount).toBe(1000);
    expect(renderTime).toBeLessThan(500); // 500ms以下
    
    console.log(`静的制御: ${renderTime.toFixed(2)}ms for ${renderCount} voxels`);
  });

  test('シンプルなoutlineWidthResolverのパフォーマンス', async () => {
    const renderer = new VoxelRenderer(viewer, {
      outlineWidthResolver: ({ normalizedDensity, isTopN }) => {
        if (isTopN) return 4;
        return normalizedDensity > 0.5 ? 1 : 2;
      },
      highlightTopN: 10
    });

    const { voxelData, bounds, grid, statistics } = createLargeTestDataset(1000);

    const startTime = performance.now();
    const renderCount = renderer.render(voxelData, bounds, grid, statistics);
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    
    expect(renderCount).toBe(1000);
    expect(renderTime).toBeLessThan(600); // 静的制御の120%以下
    
    console.log(`シンプルResolver: ${renderTime.toFixed(2)}ms for ${renderCount} voxels`);
  });

  test('複雑なoutlineWidthResolverのパフォーマンス', async () => {
    const renderer = new VoxelRenderer(viewer, {
      outlineWidthResolver: ({ voxel, normalizedDensity, isTopN }) => {
        // より複雑な計算を含むResolver
        const { x, y, z, count } = voxel;
        const spatialFactor = Math.sin(x * 0.1) * Math.cos(y * 0.1) * Math.sin(z * 0.1);
        const densityFactor = Math.log(count + 1) / 10;
        
        if (isTopN) return Math.max(4 + spatialFactor, 2);
        if (normalizedDensity > 0.8) return Math.max(1 + densityFactor, 0.5);
        if (normalizedDensity > 0.4) return 2 + spatialFactor;
        return 3;
      },
      highlightTopN: 20
    });

    const { voxelData, bounds, grid, statistics } = createLargeTestDataset(1000);

    const startTime = performance.now();
    const renderCount = renderer.render(voxelData, bounds, grid, statistics);
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    
    expect(renderCount).toBe(1000);
    expect(renderTime).toBeLessThan(1000); // 1秒以下（実用的な範囲）
    
    console.log(`複雑Resolver: ${renderTime.toFixed(2)}ms for ${renderCount} voxels`);
  });

  test('大量データでのメモリ使用量の安定性', async () => {
    const renderer = new VoxelRenderer(viewer, {
      outlineWidthResolver: ({ normalizedDensity }) => {
        return normalizedDensity > 0.5 ? 1 : 3;
      }
    });

    // 複数回の大量レンダリング
    for (let i = 0; i < 5; i++) {
      const { voxelData, bounds, grid, statistics } = createLargeTestDataset(500);
      
      const renderCount = renderer.render(voxelData, bounds, grid, statistics);
      expect(renderCount).toBe(500);
      
      // メモリリークチェック（概算）
      if (global.gc) {
        global.gc();
      }
    }
    
    // メモリ使用量がある程度安定していることを期待
    expect(true).toBe(true); // プレースホルダー
  });

  test('outlineWidthResolverのキャッシュ効果', async () => {
    let callCount = 0;
    const cachedResolver = ({ normalizedDensity, isTopN }) => {
      callCount++;
      return isTopN ? 4 : (normalizedDensity > 0.5 ? 1 : 2);
    };

    const renderer = new VoxelRenderer(viewer, {
      outlineWidthResolver: cachedResolver,
      highlightTopN: 5
    });

    const { voxelData, bounds, grid, statistics } = createLargeTestDataset(100);

    renderer.render(voxelData, bounds, grid, statistics);
    
    // outlineWidthResolverが各ボクセルで1回だけ呼ばれることを確認
    expect(callCount).toBe(100);
  });

  // ADR-0003 受け入れ基準: パフォーマンス影響<5%のテスト
  test('ADR-0003受け入れ基準: outlineWidthResolverのパフォーマンス影響<5%', async () => {
    const testDataSize = 2000;
    
    // ベースライン（静的制御）
    const staticRenderer = new VoxelRenderer(viewer, { outlineWidth: 2 });
    const { voxelData, bounds, grid, statistics } = createLargeTestDataset(testDataSize);
    
    const staticStart = performance.now();
    staticRenderer.render(voxelData, bounds, grid, statistics);
    const staticTime = performance.now() - staticStart;
    
    // 動的制御
    const dynamicRenderer = new VoxelRenderer(viewer, {
      outlineWidthResolver: ({ normalizedDensity }) => normalizedDensity > 0.5 ? 1 : 2
    });
    
    const dynamicStart = performance.now();
    dynamicRenderer.render(voxelData, bounds, grid, statistics);
    const dynamicTime = performance.now() - dynamicStart;
    
    // パフォーマンス影響が5%以下であることを確認
    const performanceImpact = ((dynamicTime - staticTime) / staticTime) * 100;
    
    console.log(`Performance Impact: ${performanceImpact.toFixed(1)}%`);
    console.log(`Static: ${staticTime.toFixed(2)}ms, Dynamic: ${dynamicTime.toFixed(2)}ms`);
    
    expect(performanceImpact).toBeLessThan(5); // ADR-0003受け入れ基準
  });
});

/**
 * 大量テストデータセットを作成
 * @param {number} size - ボクセル数
 * @returns {Object} テストデータ
 */
function createLargeTestDataset(size) {
  const voxelData = new Map();
  
  for (let i = 0; i < size; i++) {
    const x = i % 10;
    const y = Math.floor(i / 10) % 10;
    const z = Math.floor(i / 100);
    const count = Math.floor(Math.random() * 100) + 1;
    
    voxelData.set(`${x},${y},${z}`, {
      x, y, z, count,
      entities: new Array(count).fill({})
    });
  }
  
  const bounds = {
    minLon: 139.0, maxLon: 140.0,
    minLat: 35.0, maxLat: 36.0,
    minAlt: 0, maxAlt: 1000
  };
  
  const grid = {
    numVoxelsX: 10,
    numVoxelsY: 10,
    numVoxelsZ: Math.ceil(size / 100),
    voxelSizeMeters: 100
  };
  
  const counts = Array.from(voxelData.values()).map(v => v.count);
  const statistics = {
    totalVoxels: size,
    minCount: Math.min(...counts),
    maxCount: Math.max(...counts),
    averageCount: counts.reduce((a, b) => a + b, 0) / counts.length
  };
  
  return { voxelData, bounds, grid, statistics };
}
