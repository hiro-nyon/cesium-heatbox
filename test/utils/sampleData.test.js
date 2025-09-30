import { generatePatternData } from '../../src/utils/sampleData.js';

describe('sampleData clustered pattern generator', () => {
  const bounds = {
    minLon: 139.7,
    maxLon: 139.8,
    minLat: 35.6,
    maxLat: 35.7,
    minAlt: 0,
    maxAlt: 100
  };

  test('returns requested count when evenly divisible', () => {
    const requested = 12;
    const entities = generatePatternData('clustered', bounds, requested);

    expect(entities).toHaveLength(requested);
  });

  test('returns requested count when not evenly divisible', () => {
    const requested = 10;
    const entities = generatePatternData('clustered', bounds, requested);

    expect(entities).toHaveLength(requested);
  });

  test('handles fewer points than clusters gracefully', () => {
    const requested = 2;
    const entities = generatePatternData('clustered', bounds, requested);

    expect(entities).toHaveLength(requested);
  });
});
