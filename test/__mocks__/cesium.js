// Self-contained Cesium mock for Jest tests

class MockViewer {
  constructor() {
    this.scene = {
      canvas: {
        getContext: () => ({ /* WebGL context mock */ })
      },
      primitives: {
        add: jest.fn(),
        remove: jest.fn()
      },
      pick: jest.fn(() => ({ id: { type: 'voxel', key: '0,0,0', info: { x:0,y:0,z:0,count:0 } } }))
    };
    this.entities = {
      values: [],
      add: jest.fn(function() { return {}; }),
      removeAll: jest.fn()
    };
    this.selectedEntity = null;
  }
}

class Cartesian3 {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  static fromDegrees(lon, lat, alt) { return { x: lon, y: lat, z: alt }; }
}
Cartesian3.ZERO = new Cartesian3(0, 0, 0);

const Cartographic = {
  fromCartesian: jest.fn((position) => ({
    longitude: position.x * Math.PI / 180,
    latitude: position.y * Math.PI / 180,
    height: position.z || 0
  }))
};

const MathUtil = {
  toDegrees: jest.fn((radians) => radians * 180 / Math.PI),
  toRadians: jest.fn((degrees) => degrees * Math.PI / 180)
};

const Transforms = {
  eastNorthUpToFixedFrame: jest.fn(() => ({ /* Matrix4 mock */ }))
};

const JulianDate = {
  now: jest.fn(() => ({ /* JulianDate mock */ }))
};

const Color = {
  YELLOW: { r: 1, g: 1, b: 0, a: 1 },
  BLACK: { r: 0, g: 0, b: 0, a: 1 },
  WHITE: { r: 1, g: 1, b: 1, a: 1 },
  LIGHTGRAY: { r: 0.8, g: 0.8, b: 0.8, a: 1 },
  DARKGRAY: { r: 0.2, g: 0.2, b: 0.2, a: 1 },
  fromRgb: jest.fn((r, g, b) => ({ r: r/255, g: g/255, b: b/255, a: 1 })),
  fromHsl: jest.fn((h, s, l) => ({ h, s, l, a: 1 })),
  fromBytes: jest.fn((r, g, b, a = 255) => ({ r, g, b, a, withAlpha(alpha) { return { r, g, b, a: alpha }; } })),
  withAlpha: jest.fn(function(alpha) { return { ...this, a: alpha }; })
};

class MockBoxGeometry {
  constructor(options) { this.options = options; }
}

class MockBoxOutlineGeometry {
  constructor(options) { this.options = options; }
}

class MockPrimitive {
  constructor(options) { this.options = options; this.show = true; }
}

class MockGeometryInstance {
  constructor(options) { this.options = options; }
}

class MockPerInstanceColorAppearance {
  constructor(options) { this.options = options; }
  static get VERTEX_FORMAT() { return 'VERTEX_FORMAT'; }
}

const ColorGeometryInstanceAttribute = {
  fromColor: jest.fn((color) => color)
};

const Matrix4 = {
  multiplyByTranslation: jest.fn(() => ({}))
};

class MockCartesian2 { constructor(x, y) { this.x = x; this.y = y; } }

const LabelStyle = { FILL_AND_OUTLINE: 'FILL_AND_OUTLINE' };

class MockEntity {
  constructor(options) { Object.assign(this, options); }
}

class MockScreenSpaceEventHandler {
  constructor(canvas) { this.canvas = canvas; }
  setInputAction() { /* noop */ }
  isDestroyed() { return false; }
  destroy() { /* noop */ }
}

const ScreenSpaceEventType = { LEFT_CLICK: 'LEFT_CLICK' };

const defined = (v) => v !== undefined && v !== null;

module.exports = {
  VERSION: '1.120.0',
  Viewer: MockViewer,
  Cartesian3,
  Cartographic,
  Math: MathUtil,
  Transforms,
  JulianDate,
  Color,
  BoxGeometry: MockBoxGeometry,
  BoxOutlineGeometry: MockBoxOutlineGeometry,
  Primitive: MockPrimitive,
  GeometryInstance: MockGeometryInstance,
  PerInstanceColorAppearance: MockPerInstanceColorAppearance,
  ColorGeometryInstanceAttribute,
  Matrix4,
  Cartesian2: MockCartesian2,
  LabelStyle,
  Entity: MockEntity,
  ScreenSpaceEventHandler: MockScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined
};
