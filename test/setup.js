const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// JSDOMのセットアップ
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Cesiumの基本的なモック
// これにより、各テストファイルでCesiumのグローバルオブジェクトを拡張できます
global.Cesium = {};

const { Cartesian3 } = require('cesium');

// テストユーティリティ
global.testUtils = {
  createMockViewer: () => ({
    scene: {
      primitives: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
        destroy: jest.fn()
      },
      canvas: {
        getContext: () => ({})
      }
    },
    entities: {
      add: jest.fn(entity => ({
        ...entity,
        isDestroyed: () => false
      })),
      remove: jest.fn(),
      removeAll: jest.fn()
    },
    camera: {
      flyTo: jest.fn()
    },
    destroy: jest.fn()
  }),

  createMockBounds: () => ({
    minLon: 139.7, maxLon: 139.8,
    minLat: 35.6, maxLat: 35.7,
    minAlt: 0, maxAlt: 100,
    centerLon: 139.75, centerLat: 35.65, centerAlt: 50
  }),

  createMockEntity: (lon, lat, alt) => {
    const cartesianPosition = new Cartesian3(lon, lat, alt);
    const positionProperty = {
      x: lon, // 後方互換性のため
      y: lat, // 後方互換性のため
      z: alt, // 後方互換性のため
      getValue: jest.fn(() => cartesianPosition)
    };
    return {
      id: `mock-entity-${Math.random()}`,
      position: positionProperty
    };
  }
};

// CI環境対応: テスト中のLogger.warnを完全無効化してログ出力問題を防ぐ
try {
  const { Logger } = require('../src/utils/logger.js');
  Logger.setLogLevel({ debug: false });
  // Jest実行環境またはCI環境でLogger.warnを無効化
  if (typeof global.jest !== 'undefined' || process.env.CI || process.env.GITHUB_ACTIONS) {
    Logger.warn = jest.fn(); // すべてのconsole.warn出力を無効化
  }
} catch (_) {
  // ignore if logger is not loadable in this context
}
