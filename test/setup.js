/**
 * Jest テストセットアップファイル
 */

// CesiumJS のモック
global.Cesium = {
  VERSION: '1.120.0',
  
  // 基本的なクラス
  Viewer: class MockViewer {
    constructor() {
      this.scene = {
        canvas: {
          getContext: () => ({ /* WebGL context mock */ })
        },
        primitives: {
          add: jest.fn(),
          remove: jest.fn()
        }
      };
      this.entities = {
        values: [],
        add: jest.fn()
      };
    }
  },
  
  // 座標系関連
  Cartesian3: {
    fromDegrees: jest.fn((lon, lat, alt) => ({ x: lon, y: lat, z: alt })),
    ZERO: { x: 0, y: 0, z: 0 }
  },
  
  Cartographic: {
    fromCartesian: jest.fn((position) => ({
      longitude: position.x * Math.PI / 180,
      latitude: position.y * Math.PI / 180,
      height: position.z || 0
    }))
  },
  
  // 数学関数
  Math: {
    toDegrees: jest.fn((radians) => radians * 180 / Math.PI),
    toRadians: jest.fn((degrees) => degrees * Math.PI / 180)
  },
  
  // 変換関数
  Transforms: {
    eastNorthUpToFixedFrame: jest.fn(() => ({ /* Matrix4 mock */ }))
  },
  
  // 時間
  JulianDate: {
    now: jest.fn(() => ({ /* JulianDate mock */ }))
  },
  
  // 色
  Color: {
    YELLOW: { r: 1, g: 1, b: 0, a: 1 },
    BLACK: { r: 0, g: 0, b: 0, a: 1 },
    WHITE: { r: 1, g: 1, b: 1, a: 1 },
    LIGHTGRAY: { r: 0.8, g: 0.8, b: 0.8, a: 1 },
    
    fromRgb: jest.fn((r, g, b) => ({ r: r/255, g: g/255, b: b/255, a: 1 })),
    fromHsl: jest.fn((h, s, l) => ({ h, s, l, a: 1 })),
    withAlpha: jest.fn(function(alpha) { return { ...this, a: alpha }; })
  },
  
  // ジオメトリ
  BoxGeometry: class MockBoxGeometry {
    constructor(options) {
      this.options = options;
    }
  },
  
  // プリミティブ
  Primitive: class MockPrimitive {
    constructor(options) {
      this.options = options;
      this.show = true;
    }
  },
  
  // ジオメトリインスタンス
  GeometryInstance: class MockGeometryInstance {
    constructor(options) {
      this.options = options;
    }
  },
  
  // アピアランス
  PerInstanceColorAppearance: class MockPerInstanceColorAppearance {
    constructor(options) {
      this.options = options;
    }
    
    static get VERTEX_FORMAT() {
      return 'VERTEX_FORMAT';
    }
  },
  
  // 属性
  ColorGeometryInstanceAttribute: {
    fromColor: jest.fn((color) => color)
  },
  
  // Matrix4
  Matrix4: {
    multiplyByTranslation: jest.fn(() => ({ /* Matrix4 mock */ }))
  },
  
  // Cartesian2
  Cartesian2: class MockCartesian2 {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  },
  
  // ラベルスタイル
  LabelStyle: {
    FILL_AND_OUTLINE: 'FILL_AND_OUTLINE'
  }
};

// console.log のモック（テスト時は静かに）
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// テストユーティリティ
global.testUtils = {
  createMockEntity: (lon, lat, alt) => ({
    id: `test-entity-${Math.random()}`,
    position: global.Cesium.Cartesian3.fromDegrees(lon, lat, alt),
    point: {
      pixelSize: 5,
      color: global.Cesium.Color.YELLOW
    }
  }),
  
  createMockViewer: () => new global.Cesium.Viewer(),
  
  createMockBounds: () => ({
    minLon: 139.7640,
    maxLon: 139.7680,
    minLat: 35.6790,
    maxLat: 35.6820,
    minAlt: 0,
    maxAlt: 100,
    centerLon: 139.7660,
    centerLat: 35.6805,
    centerAlt: 50
  })
};
