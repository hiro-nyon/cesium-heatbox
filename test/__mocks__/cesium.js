// 基本的なCesiumのモック
// 各テストファイルで必要に応じて拡張されることを想定

const Cartesian3 = class {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  static fromDegrees(lon, lat, alt = 0) {
    return new Cartesian3(lon, lat, alt);
  }
  static distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
};

const mockColor = (r, g, b, a = 1.0) => {
  const color = {
    red: r,
    green: g,
    blue: b,
    alpha: a,
    withAlpha: (newAlpha) => mockColor(r, g, b, newAlpha)
  };
  return color;
};

const Color = {
  fromBytes: (r, g, b, a = 255) => mockColor(r / 255, g / 255, b / 255, a / 255),
  YELLOW: mockColor(1.0, 1.0, 0.0, 1.0),
  GRAY: mockColor(0.5, 0.5, 0.5, 1.0),
  LIGHTGRAY: mockColor(211 / 255, 211 / 255, 211 / 255, 1.0),
  TRANSPARENT: mockColor(0.0, 0.0, 0.0, 0.0)
};

const ScreenSpaceEventHandler = jest.fn().mockImplementation(() => ({
  setInputAction: jest.fn(),
  destroy: jest.fn()
}));

const JulianDate = {
  now: jest.fn(() => 'mock-julian-date')
};

const ScreenSpaceEventType = {
  LEFT_CLICK: 'mock-left-click'
};

// 必要最小限のCartographic/Mathユーティリティ
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

// definedユーティリティ
const defined = (v) => v !== undefined && v !== null;

// Entityの軽量モック
class Entity {
  constructor(options) { Object.assign(this, options); }
}

module.exports = {
  Cartesian3,
  Cartographic,
  Math: MathUtil,
  Color,
  ScreenSpaceEventHandler,
  JulianDate,
  ScreenSpaceEventType,
  defined,
  Entity
};
