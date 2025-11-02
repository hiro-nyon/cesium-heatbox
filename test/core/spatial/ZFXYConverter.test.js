/**
 * ZFXYConverter unit tests
 * v0.1.17: Built-in ZFXY fallback (ADR-0013 Phase 5)
 */
import { ZFXYConverter } from '../../../src/core/spatial/ZFXYConverter.js';

describe('ZFXYConverter', () => {
  describe('convert', () => {
    it('should convert lng/lat/alt to ZFXY structure', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      
      expect(result).toHaveProperty('zfxy');
      expect(result).toHaveProperty('zfxyStr');
      expect(result).toHaveProperty('vertices');
    });

    it('should return correct ZFXY components', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      
      expect(result.zfxy.z).toBe(25);
      expect(typeof result.zfxy.f).toBe('number');
      expect(typeof result.zfxy.x).toBe('number');
      expect(typeof result.zfxy.y).toBe('number');
      expect(result.zfxy.f).toBeGreaterThanOrEqual(0);
      expect(result.zfxy.x).toBeGreaterThanOrEqual(0);
      expect(result.zfxy.y).toBeGreaterThanOrEqual(0);
    });

    it('should generate 8 vertices for bounding box', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      
      expect(result.vertices).toHaveLength(8);
    });

    it('should return vertices with lng/lat/alt properties', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      
      result.vertices.forEach((vertex) => {
        expect(vertex).toHaveProperty('lng');
        expect(vertex).toHaveProperty('lat');
        expect(vertex).toHaveProperty('alt');
        expect(typeof vertex.lng).toBe('number');
        expect(typeof vertex.lat).toBe('number');
        expect(typeof vertex.alt).toBe('number');
      });
    });

    it('should return zfxyStr in correct format', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      
      // Format: /z/f/x/y
      expect(result.zfxyStr).toMatch(/^\/\d+\/\d+\/\d+\/\d+$/);
      expect(result.zfxyStr).toBe(`/${result.zfxy.z}/${result.zfxy.f}/${result.zfxy.x}/${result.zfxy.y}`);
    });

    it('should form a valid bounding box', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      
      const lngs = result.vertices.map(v => v.lng);
      const lats = result.vertices.map(v => v.lat);
      const alts = result.vertices.map(v => v.alt);
      
      // Box should have positive dimensions
      expect(Math.max(...lngs) - Math.min(...lngs)).toBeGreaterThan(0);
      expect(Math.max(...lats) - Math.min(...lats)).toBeGreaterThan(0);
      expect(Math.max(...alts) - Math.min(...alts)).toBeGreaterThan(0);
    });
  });

  describe('Zoom Level Handling', () => {
    it('should handle different zoom levels', () => {
      const zoom15 = ZFXYConverter.convert(139.6917, 35.6895, 50, 15);
      const zoom25 = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      const zoom30 = ZFXYConverter.convert(139.6917, 35.6895, 50, 30);
      
      expect(zoom15.zfxy.z).toBe(15);
      expect(zoom25.zfxy.z).toBe(25);
      expect(zoom30.zfxy.z).toBe(30);
      
      // Higher zoom should result in smaller voxels (more x/y tiles)
      const lngs15 = zoom15.vertices.map(v => v.lng);
      const lngs25 = zoom25.vertices.map(v => v.lng);
      
      const span15 = Math.max(...lngs15) - Math.min(...lngs15);
      const span25 = Math.max(...lngs25) - Math.min(...lngs25);
      
      expect(span25).toBeLessThan(span15);
    });

    it('should handle minimum zoom level', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50, 0);
      
      expect(result.zfxy.z).toBe(0);
      expect(result.vertices).toHaveLength(8);
    });

    it('should handle maximum zoom level', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50, 35);
      
      expect(result.zfxy.z).toBe(35);
      expect(result.vertices).toHaveLength(8);
    });
  });

  describe('Coordinate Normalization', () => {
    it('should clamp latitude to ±85.0511 (Web Mercator limit)', () => {
      const result90 = ZFXYConverter.convert(0, 90, 0, 25);
      const resultNeg90 = ZFXYConverter.convert(0, -90, 0, 25);
      
      result90.vertices.forEach(vertex => {
        // Allow small floating-point tolerance
        expect(Math.abs(vertex.lat)).toBeLessThanOrEqual(85.06);
      });
      
      resultNeg90.vertices.forEach(vertex => {
        expect(Math.abs(vertex.lat)).toBeLessThanOrEqual(85.06);
      });
    });

    it('should handle longitude wrapping', () => {
      const result180 = ZFXYConverter.convert(180, 35.6895, 50, 25);
      const resultNeg180 = ZFXYConverter.convert(-180, 35.6895, 50, 25);
      
      // Both should produce valid results
      expect(result180.vertices).toHaveLength(8);
      expect(resultNeg180.vertices).toHaveLength(8);
    });

    it('should normalize longitude to [-180, 180)', () => {
      const result200 = ZFXYConverter.convert(200, 35.6895, 50, 25);
      const resultNeg200 = ZFXYConverter.convert(-200, 35.6895, 50, 25);
      
      result200.vertices.forEach(vertex => {
        expect(vertex.lng).toBeGreaterThanOrEqual(-180);
        expect(vertex.lng).toBeLessThan(180);
      });
      
      resultNeg200.vertices.forEach(vertex => {
        expect(vertex.lng).toBeGreaterThanOrEqual(-180);
        expect(vertex.lng).toBeLessThan(180);
      });
    });
  });

  describe('Altitude Handling', () => {
    it('should handle zero altitude', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 0, 25);
      
      expect(result.vertices).toHaveLength(8);
      expect(result.zfxy.f).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative altitude', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, -1000, 25);
      
      expect(result.vertices).toHaveLength(8);
      // All vertices should have negative altitude
      result.vertices.forEach(vertex => {
        expect(vertex.alt).toBeLessThanOrEqual(0);
      });
    });

    it('should handle very high altitude', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50000, 25);
      
      expect(result.vertices).toHaveLength(8);
      result.vertices.forEach(vertex => {
        expect(vertex.alt).toBeGreaterThan(0);
      });
    });

    it('should calculate correct F coordinate for altitude', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 100, 25);
      
      // F coordinate should be non-negative integer
      expect(Number.isInteger(result.zfxy.f)).toBe(true);
      expect(result.zfxy.f).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Hierarchical Subdivision', () => {
    it('should reduce altitude slice size as zoom increases', () => {
      const zoomPairs = [
        { parent: 20, child: 21 },
        { parent: 21, child: 22 },
        { parent: 22, child: 23 },
        { parent: 23, child: 24 },
        { parent: 24, child: 25 }
      ];

      zoomPairs.forEach(({ parent, child }) => {
        const parentResult = ZFXYConverter.convert(139.6917, 35.6895, 50, parent);
        const childResult = ZFXYConverter.convert(139.6917, 35.6895, 50, child);

        const parentHeight = parentResult.vertices[4].alt - parentResult.vertices[0].alt;
        const childHeight = childResult.vertices[4].alt - childResult.vertices[0].alt;

        expect(childHeight).toBeLessThan(parentHeight);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle coordinates at prime meridian', () => {
      const result = ZFXYConverter.convert(0, 35.6895, 50, 25);
      
      expect(result.vertices).toHaveLength(8);
      expect(result.zfxyStr).toMatch(/^\/\d+\/\d+\/\d+\/\d+$/);
    });

    it('should handle coordinates at equator', () => {
      const result = ZFXYConverter.convert(139.6917, 0, 50, 25);
      
      expect(result.vertices).toHaveLength(8);
      expect(result.zfxyStr).toMatch(/^\/\d+\/\d+\/\d+\/\d+$/);
    });

    it('should handle same coordinates with different zoom', () => {
      const result20 = ZFXYConverter.convert(139.6917, 35.6895, 50, 20);
      const result25 = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      
      expect(result20.zfxyStr).not.toBe(result25.zfxyStr);
      expect(result20.zfxy.x).not.toBe(result25.zfxy.x);
      expect(result20.zfxy.y).not.toBe(result25.zfxy.y);
    });

    it('should handle very close coordinates at high zoom', () => {
      const result1 = ZFXYConverter.convert(139.6917, 35.6895, 50, 30);
      const result2 = ZFXYConverter.convert(139.6918, 35.6896, 50, 30);
      
      // At high zoom, close coordinates may fall in different voxels
      expect(result1.vertices).toHaveLength(8);
      expect(result2.vertices).toHaveLength(8);
    });
  });

  describe('Consistency', () => {
    it('should produce consistent results for same input', () => {
      const result1 = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      const result2 = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      
      expect(result1.zfxyStr).toBe(result2.zfxyStr);
      expect(result1.zfxy).toEqual(result2.zfxy);
    });

    it('should have 4 bottom vertices and 4 top vertices', () => {
      const result = ZFXYConverter.convert(139.6917, 35.6895, 50, 25);
      
      // Bottom 4 vertices should have same altitude
      const bottomAlts = result.vertices.slice(0, 4).map(v => v.alt);
      const topAlts = result.vertices.slice(4, 8).map(v => v.alt);
      
      // All bottom vertices should have same altitude
      const minBottom = Math.min(...bottomAlts);
      const maxBottom = Math.max(...bottomAlts);
      expect(maxBottom - minBottom).toBeLessThan(0.0001); // Near-equal
      
      // All top vertices should have same altitude
      const minTop = Math.min(...topAlts);
      const maxTop = Math.max(...topAlts);
      expect(maxTop - minTop).toBeLessThan(0.0001); // Near-equal
      
      // Top should be higher than bottom
      expect(Math.min(...topAlts)).toBeGreaterThan(Math.max(...bottomAlts));
    });
  });
});
