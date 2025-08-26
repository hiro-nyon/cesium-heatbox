
/**
 * validation.js のユニットテスト
 */

import {
  isValidViewer,
  isValidEntities,
  validateAndNormalizeOptions
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

  describe('validateAndNormalizeOptions', () => {
    describe('v0.1.6.1: インセット枠線バリデーション', () => {
      test('outlineInset が正しく正規化される', () => {
        const options1 = { outlineInset: 5 };
        const normalized1 = validateAndNormalizeOptions(options1);
        expect(normalized1.outlineInset).toBe(5);

        const options2 = { outlineInset: -2 };
        const normalized2 = validateAndNormalizeOptions(options2);
        expect(normalized2.outlineInset).toBe(0); // 負値は0になる

        const options3 = { outlineInset: '3.5' };
        const normalized3 = validateAndNormalizeOptions(options3);
        expect(normalized3.outlineInset).toBe(3.5); // 文字列から数値に変換
      });

      test('outlineInsetMode が正しくバリデーションされる', () => {
        const options1 = { outlineInsetMode: 'all' };
        const normalized1 = validateAndNormalizeOptions(options1);
        expect(normalized1.outlineInsetMode).toBe('all');

        const options2 = { outlineInsetMode: 'topn' };
        const normalized2 = validateAndNormalizeOptions(options2);
        expect(normalized2.outlineInsetMode).toBe('topn');

        // 無効な値の場合は警告が出て 'all' になる
        const options3 = { outlineInsetMode: 'invalid' };
        const normalized3 = validateAndNormalizeOptions(options3);
        expect(normalized3.outlineInsetMode).toBe('all');
        expect(Logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Invalid outlineInsetMode')
        );
      });

      test('outlineInset と outlineInsetMode が未定義でもエラーにならない', () => {
        const options = { voxelSize: 10 };
        expect(() => validateAndNormalizeOptions(options)).not.toThrow();
      });

      test('outlineInset の範囲制限テスト', () => {
        const options1 = { outlineInset: 101 };
        const normalized1 = validateAndNormalizeOptions(options1);
        expect(normalized1.outlineInset).toBe(100); // 最大100に制限

        const options2 = { outlineInset: 'abc' };
        const normalized2 = validateAndNormalizeOptions(options2);
        expect(normalized2.outlineInset).toBe(0); // NaN は 0 になる
      });
    });

    describe('既存のバリデーション機能', () => {
      test('透明度が0-1範囲に正規化される', () => {
        const options1 = { opacity: 1.5 };
        const normalized1 = validateAndNormalizeOptions(options1);
        expect(normalized1.opacity).toBe(1);

        const options2 = { emptyOpacity: -0.5 };
        const normalized2 = validateAndNormalizeOptions(options2);
        expect(normalized2.emptyOpacity).toBe(0);
      });

      test('色配列が正しく正規化される', () => {
        const options = {
          minColor: [256, -10, 128.7],
          maxColor: [50, 300, 0]
        };
        const normalized = validateAndNormalizeOptions(options);
        
        expect(normalized.minColor).toEqual([255, 0, 128]);
        expect(normalized.maxColor).toEqual([50, 255, 0]);
      });

      test('無効なcolorMapの場合に警告が出て"custom"にフォールバック', () => {
        const options = { colorMap: 'invalid-map' };
        const normalized = validateAndNormalizeOptions(options);
        
        expect(normalized.colorMap).toBe('custom');
        expect(Logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Invalid colorMap')
        );
      });
    });
  });
});
