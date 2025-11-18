import { interpolateColorMap } from '../../src/utils/colorMap.js';
import { Cesium } from '../../src/Heatbox.js';

describe('colorMap', () => {
  test('returns white for empty stops', () => {
    const color = interpolateColorMap([], 0.5);
    expect(color.equals(Cesium.Color.WHITE)).toBe(true);
  });

  test('returns single stop color when only one', () => {
    const color = interpolateColorMap([{ position: 0, color: '#ff0000' }], 0.5);
    const expected = Cesium.Color.fromCssColorString('#ff0000');
    expect(color.equals(expected)).toBe(true);
  });

  test('interpolates between two stops', () => {
    const stops = [
      { position: 0, color: '#000000' },
      { position: 1, color: '#ffffff' }
    ];
    const color = interpolateColorMap(stops, 0.5);
    const mid = new Cesium.Color(0.5, 0.5, 0.5, 1);
    expect(color.red).toBeCloseTo(mid.red, 2);
    expect(color.green).toBeCloseTo(mid.green, 2);
    expect(color.blue).toBeCloseTo(mid.blue, 2);
  });
});

