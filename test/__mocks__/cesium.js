// 基本的なCesiumのモック
// 各テストファイルで必要に応じて拡張されることを想定

const Cartesian3 = class {
  constructor (x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static fromDegrees (lon, lat, alt = 0) {
    return new Cartesian3(lon, lat, alt);
  }

  static distance (p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
};

class Color {
  constructor (r = 1, g = 1, b = 1, a = 1) {
    this.red = r;
    this.green = g;
    this.blue = b;
    this.alpha = a;
  }

  withAlpha (newAlpha) {
    return new Color(this.red, this.green, this.blue, newAlpha);
  }

  clone () {
    return new Color(this.red, this.green, this.blue, this.alpha);
  }

  equals (other) {
    if (!other) return false;
    const eps = 1e-6;
    return Math.abs(this.red - other.red) < eps &&
      Math.abs(this.green - other.green) < eps &&
      Math.abs(this.blue - other.blue) < eps &&
      Math.abs(this.alpha - other.alpha) < eps;
  }

  static fromBytes (r, g, b, a = 255) {
    return new Color(r / 255, g / 255, b / 255, a / 255);
  }

  static fromCssColorString (str) {
    if (!str || typeof str !== 'string') {
      return new Color(1, 1, 1, 1);
    }
    const hex = str.trim().toLowerCase();
    if (hex === '#000' || hex === '#000000') {
      return new Color(0, 0, 0, 1);
    }
    if (hex === '#fff' || hex === '#ffffff') {
      return new Color(1, 1, 1, 1);
    }
    if (hex === '#ff0000') {
      return new Color(1, 0, 0, 1);
    }
    // 簡易実装: 未対応色は白
    return new Color(1, 1, 1, 1);
  }

  static lerp (left, right, t, result = new Color()) {
    const clampedT = Math.max(0, Math.min(1, t));
    result.red = left.red + (right.red - left.red) * clampedT;
    result.green = left.green + (right.green - left.green) * clampedT;
    result.blue = left.blue + (right.blue - left.blue) * clampedT;
    result.alpha = left.alpha + (right.alpha - left.alpha) * clampedT;
    return result;
  }
}

Color.WHITE = new Color(1, 1, 1, 1);
Color.BLACK = new Color(0, 0, 0, 1);
Color.YELLOW = new Color(1, 1, 0, 1);
Color.RED = new Color(1, 0, 0, 1);
Color.BLUE = new Color(0, 0, 1, 1);
Color.GRAY = new Color(0.5, 0.5, 0.5, 1);
Color.LIGHTGRAY = new Color(211 / 255, 211 / 255, 211 / 255, 1);
Color.TRANSPARENT = new Color(0, 0, 0, 0);

const ScreenSpaceEventHandler = jest.fn().mockImplementation(() => ({
  setInputAction: jest.fn(),
  destroy: jest.fn()
}));

class JulianDate {
  constructor (date = new Date()) {
    this._value = date instanceof Date ? date : new Date(date);
  }

  static fromIso8601 (isoString) {
    return new JulianDate(new Date(isoString));
  }

  static fromDate (date) {
    return new JulianDate(new Date(date.getTime()));
  }

  static addSeconds (julianDate, seconds, result = new JulianDate()) {
    const baseMillis = JulianDate._getTime(julianDate);
    const newValue = new Date(baseMillis + seconds * 1000);
    if (result instanceof JulianDate) {
      result._value = newValue;
      return result;
    }
    return new JulianDate(newValue);
  }

  static compare (left, right) {
    return JulianDate._getTime(left) - JulianDate._getTime(right);
  }

  static greaterThan (left, right) {
    return JulianDate.compare(left, right) > 0;
  }

  static greaterThanOrEquals (left, right) {
    return JulianDate.compare(left, right) >= 0;
  }

  static lessThan (left, right) {
    return JulianDate.compare(left, right) < 0;
  }

  static equals (left, right) {
    return JulianDate.compare(left, right) === 0;
  }

  static clone (source, result = new JulianDate()) {
    const cloneValue = new Date(JulianDate._getTime(source));
    if (result instanceof JulianDate) {
      result._value = cloneValue;
      return result;
    }
    return new JulianDate(cloneValue);
  }

  static now () {
    return new JulianDate(new Date());
  }

  static _getTime (value) {
    if (value instanceof JulianDate) {
      return value._value.getTime();
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    return new Date(value).getTime();
  }
}

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
