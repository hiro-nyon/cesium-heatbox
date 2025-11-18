import { getClassificationBackend, setClassificationBackend } from '../../src/utils/classificationBackend.js';

describe('classificationBackend', () => {
  afterEach(() => {
    setClassificationBackend(null);
  });

  test('quantile returns expected basic quantiles', () => {
    const backend = getClassificationBackend();
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    expect(backend.quantile(values, 0.5)).toBeCloseTo(5.5, 1);
    expect(backend.quantile(values, 0.25)).toBeLessThan(backend.quantile(values, 0.5));
    expect(backend.quantile(values, 0.75)).toBeGreaterThan(backend.quantile(values, 0.5));
  });

  test('summary returns basic stats', () => {
    const backend = getClassificationBackend();
    const values = [1, 2, 3, 4, 5];
    const stats = backend.summary(values);

    expect(stats.min).toBe(1);
    expect(stats.max).toBe(5);
    expect(stats.mean).toBe(3);
    expect(stats.stddev).toBeGreaterThan(0);
  });

  test('setClassificationBackend overrides implementation', () => {
    const mockBackend = {
      quantile: jest.fn(() => 42)
    };

    setClassificationBackend(mockBackend);
    const backend = getClassificationBackend();

    expect(backend.quantile([1, 2, 3], 0.5)).toBe(42);
    expect(mockBackend.quantile).toHaveBeenCalled();
  });
});

