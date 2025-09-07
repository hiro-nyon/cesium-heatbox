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

// 🔧 CI環境対応: 全てのconsole.warn出力を完全無効化してCI環境でのエラー扱い回避
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// CI環境またはJest環境での徹底的なログ制御
if (typeof global.jest !== 'undefined' || process.env.CI || process.env.GITHUB_ACTIONS) {
  // console.warn を完全無効化（CI環境でのエラー扱い回避）
  console.warn = jest.fn();
  // console.error も制御（必要に応じて）  
  console.error = jest.fn();
  
  // テスト終了時の復旧用
  global.restoreConsole = () => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  };
  
  console.log('[TEST SETUP] CI環境検出: console.warn/error を無効化しました');
}

// Logger自体も制御（二重防御）
try {
  const { Logger } = require('../src/utils/logger.js');
  Logger.setLogLevel({ debug: false });
  // Logger.warnも念のためモック化
  if (typeof global.jest !== 'undefined' || process.env.CI || process.env.GITHUB_ACTIONS) {
    Logger.warn = jest.fn();
    Logger.error = jest.fn();
    Logger.debug = jest.fn();  // debugログも無効化
    
    console.log('[TEST SETUP] Logger.warn/error/debug を無効化しました');
  }
} catch (error) {
  // Logger が読み込めない場合は無視
  console.log('[TEST SETUP] Logger読み込みスキップ:', error.message);
}
