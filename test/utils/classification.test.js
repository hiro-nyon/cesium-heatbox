jest.mock('../../src/utils/logger.js', () => ({
  Logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }
}));

import { createClassifier } from '../../src/utils/classification.js';
import { validateAndNormalizeOptions } from '../../src/utils/validation.js';
import { Logger } from '../../src/utils/logger.js';
import * as Cesium from 'cesium';

describe('classification', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('linear scheme', () => {
    test('should normalize values linearly', () => {
      const classifier = createClassifier({
        scheme: 'linear',
        domain: [0, 100]
      });

      expect(classifier.normalize(0)).toBe(0);
      expect(classifier.normalize(50)).toBe(0.5);
      expect(classifier.normalize(100)).toBe(1);
    });
  });

  describe('log scheme', () => {
    test('should normalize values logarithmically', () => {
      const classifier = createClassifier({
        scheme: 'log',
        domain: [1, 100]
      });

      expect(classifier.normalize(1)).toBeCloseTo(0, 2);
      expect(classifier.normalize(10)).toBeCloseTo(0.5, 2);
      expect(classifier.normalize(100)).toBeCloseTo(1, 2);
    });

    test('should handle min <= 0 by adjusting to 1', () => {
      const classifier = createClassifier({
        scheme: 'log',
        domain: [0, 100]
      });

      expect(classifier.domain[0]).toBe(1);
    });
  });

  describe('equal-interval scheme', () => {
    test('should create equal intervals', () => {
      const classifier = createClassifier({
        scheme: 'equal-interval',
        domain: [0, 100],
        classes: 5
      });

      expect(classifier.breaks).toEqual([0, 20, 40, 60, 80, 100]);
      expect(classifier.classify(15)).toBe(0);
      expect(classifier.classify(35)).toBe(1);
      expect(classifier.classify(95)).toBe(4);
    });
  });

  describe('quantize scheme', () => {
    test('should quantize values into discrete classes', () => {
      const classifier = createClassifier({
        scheme: 'quantize',
        domain: [0, 100],
        classes: 4
      });

      expect(classifier.classify(12)).toBe(0);
      expect(classifier.classify(37)).toBe(1);
      expect(classifier.classify(62)).toBe(2);
      expect(classifier.classify(87)).toBe(3);
    });
  });

  describe('threshold scheme', () => {
    test('should classify by thresholds', () => {
      const classifier = createClassifier({
        scheme: 'threshold',
        domain: [0, 100],
        thresholds: [25, 50, 75],
        colorMap: ['green', 'yellow', 'orange', 'red']
      });

      expect(classifier.breaks).toEqual([0, 25, 50, 75, 100]);
      expect(classifier.classify(10)).toBe(0);
      expect(classifier.classify(40)).toBe(1);
      expect(classifier.classify(60)).toBe(2);
      expect(classifier.classify(90)).toBe(3);
    });
  });

  describe('quantile scheme', () => {
    test('should compute quantile breaks and classify correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const classifier = createClassifier({
        scheme: 'quantile',
        values,
        classes: 4
      });

      expect(classifier.breaks.length).toBe(5);
      expect(classifier.breaks[0]).toBe(1);
      expect(classifier.breaks[classifier.breaks.length - 1]).toBe(10);
      expect(classifier.classify(2)).toBe(0);
      expect(classifier.classify(5)).toBe(1);
      expect(classifier.classify(7)).toBe(2);
      expect(classifier.classify(9)).toBe(3);
    });
  });

  describe('jenks scheme', () => {
    test('should compute jenks breaks and classify clustered data', () => {
      const values = [1, 2, 3, 10, 11, 12, 20, 21, 22];
      const classifier = createClassifier({
        scheme: 'jenks',
        values,
        classes: 3
      });

      expect(classifier.breaks.length).toBe(4);
      expect(classifier.breaks[0]).toBe(1);
      expect(classifier.breaks[classifier.breaks.length - 1]).toBe(22);
      expect(classifier.classify(2)).toBe(0);
      expect(classifier.classify(11)).toBe(1);
      expect(classifier.classify(21)).toBe(2);
    });
  });

  describe('color map handling', () => {
    test('should accept simple palette arrays', () => {
      const classifier = createClassifier({
        scheme: 'linear',
        domain: [0, 100],
        colorMap: ['#000000', '#ffffff']
      });

      const start = classifier.getColor(0);
      const end = classifier.getColor(1);
      const mid = classifier.getColor(0.5);
      const expectedMid = Cesium.Color.lerp(
        Cesium.Color.fromCssColorString('#000000'),
        Cesium.Color.fromCssColorString('#ffffff'),
        0.5,
        new Cesium.Color()
      );

      expect(start.equals(Cesium.Color.fromCssColorString('#000000'))).toBe(true);
      expect(end.equals(Cesium.Color.fromCssColorString('#ffffff'))).toBe(true);
      expect(mid.red).toBeCloseTo(expectedMid.red, 2);
      expect(mid.green).toBeCloseTo(expectedMid.green, 2);
      expect(mid.blue).toBeCloseTo(expectedMid.blue, 2);
    });

    test('should preserve stop objects', () => {
      const classifier = createClassifier({
        scheme: 'linear',
        domain: [0, 1],
        colorMap: [
          { position: 0, color: '#000000' },
          { position: 1, color: '#ffffff' }
        ]
      });

      const color = classifier.getColor(0.0);
      expect(color.equals(Cesium.Color.fromCssColorString('#000000'))).toBe(true);
    });

    test('should provide discrete colors per class index', () => {
      const classifier = createClassifier({
        scheme: 'equal-interval',
        domain: [0, 100],
        classes: 4,
        colorMap: ['#0000ff', '#00ff00', '#ffff00', '#ff0000']
      });

      const first = classifier.getColorForClass(0);
      const second = classifier.getColorForClass(1);
      const last = classifier.getColorForClass(3);

      expect(first.equals(Cesium.Color.fromCssColorString('#0000ff'))).toBe(true);
      expect(second.equals(Cesium.Color.fromCssColorString('#00ff00'))).toBe(true);
      expect(last.equals(Cesium.Color.fromCssColorString('#ff0000'))).toBe(true);
    });

    test('should respect threshold class count when mapping colors', () => {
      const classifier = createClassifier({
        scheme: 'threshold',
        domain: [0, 100],
        thresholds: [25, 50, 75],
        colorMap: ['#0f172a', '#2563eb', '#f97316', '#facc15']
      });

      expect(classifier.getColorForClass(0).equals(Cesium.Color.fromCssColorString('#0f172a'))).toBe(true);
      expect(classifier.getColorForClass(2).equals(Cesium.Color.fromCssColorString('#f97316'))).toBe(true);
      expect(classifier.getColorForClass(3).equals(Cesium.Color.fromCssColorString('#facc15'))).toBe(true);
    });
  });

  describe('classificationTargets normalization', () => {
    test('defaults to color only with opacity/width disabled', () => {
      const normalized = validateAndNormalizeOptions({});
      expect(normalized.classification.classificationTargets).toEqual({
        color: true,
        opacity: false,
        width: false
      });
    });

    test('accepts opacity and width flags on classificationTargets', () => {
      const normalized = validateAndNormalizeOptions({
        classification: {
          enabled: true,
          classificationTargets: {
            opacity: true,
            width: true
          }
        }
      });

      expect(normalized.classification.classificationTargets).toEqual({
        color: true,
        opacity: true,
        width: true
      });
    });

    test('merges legacy classification.targets alias', () => {
      const normalized = validateAndNormalizeOptions({
        classification: {
          enabled: true,
          targets: {
            color: false,
            opacity: true
          }
        }
      });

      expect(normalized.classification.classificationTargets).toEqual({
        color: false,
        opacity: true,
        width: false
      });
    });

    test('ignores invalid target configuration with warning', () => {
      const normalized = validateAndNormalizeOptions({
        classification: {
          enabled: true,
          targets: 'invalid'
        }
      });

      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('targets')
      );
      expect(normalized.classification.classificationTargets).toEqual({
        color: true,
        opacity: false,
        width: false
      });
    });
  });
});
