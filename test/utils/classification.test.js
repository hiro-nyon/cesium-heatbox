import { createClassifier } from '../../src/utils/classification.js';

describe('classification', () => {
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

  describe('unsupported schemes', () => {
    test('should throw error for quantile in v1.0.0', () => {
      expect(() => {
        createClassifier({ scheme: 'quantile' });
      }).toThrow(/not supported in v1.0.0/);
    });

    test('should throw error for jenks in v1.0.0', () => {
      expect(() => {
        createClassifier({ scheme: 'jenks' });
      }).toThrow(/not supported in v1.0.0/);
    });
  });
});

