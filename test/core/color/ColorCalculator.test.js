/**
 * @fileoverview Tests for ColorCalculator class
 * ColorCalculatorクラスのテスト
 */

import { ColorCalculator } from '../../../src/core/color/ColorCalculator.js';
import * as Cesium from 'cesium';

describe('ColorCalculator', () => {
  describe('calculateColor', () => {
    test('should calculate linear interpolated color with default options', () => {
      const color = ColorCalculator.calculateColor(0.5);
      
      // Default minColor: [0, 0, 255], maxColor: [255, 0, 0]
      // At 0.5: [127.5, 0, 127.5] -> rounded to [128, 0, 128]
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      expect(color.red).toBeCloseTo(128/255, 2);
      expect(color.green).toBeCloseTo(0/255, 2);
      expect(color.blue).toBeCloseTo(128/255, 2);
    });

    test('should calculate linear interpolated color with custom colors', () => {
      const options = {
        minColor: [255, 255, 255], // white
        maxColor: [0, 0, 0]        // black
      };
      const color = ColorCalculator.calculateColor(0.5, null, options);
      
      // At 0.5: [127.5, 127.5, 127.5] -> rounded to [128, 128, 128]
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      expect(color.red).toBeCloseTo(128/255, 2);
      expect(color.green).toBeCloseTo(128/255, 2);
      expect(color.blue).toBeCloseTo(128/255, 2);
    });

    test('should use viridis color map when specified', () => {
      const options = { colorMap: 'viridis' };
      const color = ColorCalculator.calculateColor(0, null, options);
      
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      // First viridis color: [68, 1, 84]
      expect(color.red).toBeCloseTo(68/255, 2);
      expect(color.green).toBeCloseTo(1/255, 2);
      expect(color.blue).toBeCloseTo(84/255, 2);
    });

    test('should use inferno color map when specified', () => {
      const options = { colorMap: 'inferno' };
      const color = ColorCalculator.calculateColor(0, null, options);
      
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      // First inferno color: [0, 0, 4]
      expect(color.red).toBeCloseTo(0/255, 2);
      expect(color.green).toBeCloseTo(0/255, 2);
      expect(color.blue).toBeCloseTo(4/255, 2);
    });

    test('should use diverging color scheme when enabled', () => {
      const options = {
        diverging: true,
        divergingPivot: 10
      };
      const color = ColorCalculator.calculateColor(0.5, 5, options);
      
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      // Should use diverging color map for value below pivot
    });

    test('should fallback to linear interpolation for unknown color map', () => {
      const options = { colorMap: 'unknown' };
      const color = ColorCalculator.calculateColor(0.5, null, options);
      
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      // Should use default linear interpolation
      expect(color.red).toBeCloseTo(128/255, 2);
      expect(color.green).toBeCloseTo(0/255, 2);
      expect(color.blue).toBeCloseTo(128/255, 2);
    });

    test('should return gray color on error', () => {
      // Test with invalid input that causes an error
      const color = ColorCalculator.calculateColor(null, null, null);
      
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      expect(color).toEqual(Cesium.Color.GRAY);
    });
  });

  describe('interpolateLinear', () => {
    test('should interpolate between two colors linearly', () => {
      const minColor = [255, 0, 0]; // red
      const maxColor = [0, 0, 255]; // blue
      
      // At 0.0: should be red
      const color1 = ColorCalculator.interpolateLinear(0, minColor, maxColor);
      expect(color1.red).toBeCloseTo(255/255, 2);
      expect(color1.green).toBeCloseTo(0/255, 2);
      expect(color1.blue).toBeCloseTo(0/255, 2);
      
      // At 1.0: should be blue
      const color2 = ColorCalculator.interpolateLinear(1, minColor, maxColor);
      expect(color2.red).toBeCloseTo(0/255, 2);
      expect(color2.green).toBeCloseTo(0/255, 2);
      expect(color2.blue).toBeCloseTo(255/255, 2);
      
      // At 0.5: should be purple
      const color3 = ColorCalculator.interpolateLinear(0.5, minColor, maxColor);
      expect(color3.red).toBeCloseTo(128/255, 2);
      expect(color3.green).toBeCloseTo(0/255, 2);
      expect(color3.blue).toBeCloseTo(128/255, 2);
    });

    test('should clamp values outside 0-1 range', () => {
      const minColor = [0, 0, 0];
      const maxColor = [255, 255, 255];
      
      // Value below 0 should be clamped to 0
      const color1 = ColorCalculator.interpolateLinear(-0.5, minColor, maxColor);
      expect(color1.red).toBeCloseTo(0/255, 2);
      expect(color1.green).toBeCloseTo(0/255, 2);
      expect(color1.blue).toBeCloseTo(0/255, 2);
      
      // Value above 1 should be clamped to 1
      const color2 = ColorCalculator.interpolateLinear(1.5, minColor, maxColor);
      expect(color2.red).toBeCloseTo(255/255, 2);
      expect(color2.green).toBeCloseTo(255/255, 2);
      expect(color2.blue).toBeCloseTo(255/255, 2);
    });
  });

  describe('interpolateFromColorMap', () => {
    test('should interpolate from viridis color map', () => {
      // Test at 0: should be first color
      const color1 = ColorCalculator.interpolateFromColorMap(0, 'viridis');
      expect(color1.red).toBeCloseTo(68/255, 2);
      expect(color1.green).toBeCloseTo(1/255, 2);
      expect(color1.blue).toBeCloseTo(84/255, 2);
    });

    test('should interpolate from inferno color map', () => {
      // Test at 0: should be first color
      const color1 = ColorCalculator.interpolateFromColorMap(0, 'inferno');
      expect(color1.red).toBeCloseTo(0/255, 2);
      expect(color1.green).toBeCloseTo(0/255, 2);
      expect(color1.blue).toBeCloseTo(4/255, 2);
    });

    test('should fallback for unknown color map', () => {
      const color = ColorCalculator.interpolateFromColorMap(0.5, 'unknown');
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      // Should fallback to linear interpolation with default colors
      expect(color.red).toBeCloseTo(128/255, 2);
      expect(color.green).toBeCloseTo(0/255, 2);
      expect(color.blue).toBeCloseTo(128/255, 2);
    });

    test('should handle values outside 0-1 range', () => {
      const color1 = ColorCalculator.interpolateFromColorMap(-0.5, 'viridis');
      expect(color1).toHaveProperty('red');
      expect(color1).toHaveProperty('green');
      expect(color1).toHaveProperty('blue');
      
      const color2 = ColorCalculator.interpolateFromColorMap(1.5, 'viridis');
      expect(color2).toHaveProperty('red');
      expect(color2).toHaveProperty('green');
      expect(color2).toHaveProperty('blue');
    });
  });

  describe('calculateDivergingColor', () => {
    test('should calculate diverging color for value below pivot (blue side)', () => {
      const options = { divergingPivot: 10 };
      const color = ColorCalculator.calculateDivergingColor(5, options);  // 5 < 10, should be blue side
      
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      
      // Value 5 with pivot 10 -> normalized to 0.25 (blue side)
      // Should have more blue than red (blue side of diverging map)
      expect(color.blue).toBeGreaterThan(color.red);
    });

    test('should calculate diverging color for value above pivot (red side)', () => {
      const options = { divergingPivot: 10 };
      const color = ColorCalculator.calculateDivergingColor(15, options);  // 15 > 10, should be red side
      
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      
      // Value 15 with pivot 10 -> normalized to 0.75 (red side)  
      // Should have more red than blue (red side of diverging map)
      expect(color.red).toBeGreaterThan(color.blue);
    });

    test('should handle pivot value correctly (center white)', () => {
      const options = { divergingPivot: 10 };
      const color = ColorCalculator.calculateDivergingColor(10, options);  // exactly at pivot
      
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      
      // At pivot, should be close to white/neutral (center of diverging map)
      // All color components should be relatively high and similar
      expect(color.red).toBeGreaterThan(0.8);
      expect(color.green).toBeGreaterThan(0.8);
      expect(color.blue).toBeGreaterThan(0.8);
    });

    test('should handle zero pivot', () => {
      const options = { divergingPivot: 0 };
      const color = ColorCalculator.calculateDivergingColor(5, options);
      
      expect(color).toHaveProperty('red');
      expect(color).toHaveProperty('green');
      expect(color).toHaveProperty('blue');
      // With pivot=0, any positive value will be on red side
      expect(color.red).toBeGreaterThan(0);
    });
  });

  describe('utility methods', () => {
    test('should return available color maps', () => {
      const colorMaps = ColorCalculator.getAvailableColorMaps();
      
      expect(colorMaps).toContain('viridis');
      expect(colorMaps).toContain('inferno');
      expect(colorMaps).toContain('diverging');
      expect(colorMaps.length).toBeGreaterThanOrEqual(3);
    });

    test('should validate color map names', () => {
      expect(ColorCalculator.isValidColorMap('viridis')).toBe(true);
      expect(ColorCalculator.isValidColorMap('inferno')).toBe(true);
      expect(ColorCalculator.isValidColorMap('diverging')).toBe(true);
      expect(ColorCalculator.isValidColorMap('unknown')).toBe(false);
    });
  });
});
