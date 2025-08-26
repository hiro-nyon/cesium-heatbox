
/**
 * validation.js のユニットテスト
 */

import {
  isValidViewer,
  isValidEntities
} from '../../src/utils/validation.js';
import { PERFORMANCE_LIMITS } from '../../src/utils/constants.js';
import { Logger } from '../../src/utils/logger.js';

// Loggerの警告をモック化してテスト中にコンソールを汚さないようにする
jest.mock('../../src/utils/logger.js', () => ({
  Logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('validation.js', () => {

  // テスト後にモックをクリア
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidViewer', () => {
    test('有効なViewerオブジェクトでtrueを返す', () => {
      const mockViewer = {
        scene: {
          canvas: {
            getContext: jest.fn().mockReturnValue(true), // WebGLコンテキストあり
          },
        },
        entities: {},
      };
      expect(isValidViewer(mockViewer)).toBe(true);
    });

    test('nullまたはundefinedでfalseを返す', () => {
      expect(isValidViewer(null)).toBe(false);
      expect(isValidViewer(undefined)).toBe(false);
    });

    test('必須プロパティが欠けている場合にfalseを返す', () => {
      expect(isValidViewer({ scene: {} })).toBe(false);
      expect(isValidViewer({ scene: {}, entities: {} })).toBe(false);
    });

    test('WebGLコンテキストが取得できない場合にfalseを返す', () => {
      const mockViewer = {
        scene: {
          canvas: {
            getContext: jest.fn().mockReturnValue(null), // WebGLコンテキストなし
          },
        },
        entities: {},
      };
      expect(isValidViewer(mockViewer)).toBe(false);
    });
  });

  describe('isValidEntities', () => {
    test('有効なエンティティ配列でtrueを返す', () => {
      const entities = [{}, {}];
      expect(isValidEntities(entities)).toBe(true);
    });

    test('配列でない場合にfalseを返す', () => {
      expect(isValidEntities({})).toBe(false);
      expect(isValidEntities(null)).toBe(false);
    });

    test('空の配列でfalseを返す', () => {
      expect(isValidEntities([])).toBe(false);
    });

    test('エンティティ数が推奨値を超えた場合に警告を出す', () => {
      const largeArray = new Array(PERFORMANCE_LIMITS.maxEntities + 1).fill({});
      expect(isValidEntities(largeArray)).toBe(true); // trueは返すが警告を出す
      expect(Logger.warn).toHaveBeenCalled();
    });
  });
});
