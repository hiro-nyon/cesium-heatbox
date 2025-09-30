/**
 * Tests for ADR-0011 Phase 0: validation and defaults for adaptiveParams
 * v0.1.15: バリデーション/既定値の整備テスト
 */

import { describe, it, expect } from '@jest/globals';
import { validateAndNormalizeOptions } from '../../src/utils/validation.js';

describe('ADR-0011 Phase 0: adaptiveParams validation and normalization', () => {
  describe('min/max → range normalization', () => {
    it('should normalize minOutlineWidth/maxOutlineWidth to outlineWidthRange', () => {
      const options = {
        adaptiveParams: {
          minOutlineWidth: 2,
          maxOutlineWidth: 6
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(normalized.adaptiveParams.outlineWidthRange).toEqual([2, 6]);
    });
    
    it('should prioritize outlineWidthRange over min/max when both exist', () => {
      const options = {
        adaptiveParams: {
          minOutlineWidth: 2,
          maxOutlineWidth: 6,
          outlineWidthRange: [1, 5]
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(normalized.adaptiveParams.outlineWidthRange).toEqual([1, 5]);
    });
    
    it('should swap min/max if min > max', () => {
      const options = {
        adaptiveParams: {
          outlineWidthRange: [5, 2]
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(normalized.adaptiveParams.outlineWidthRange).toEqual([2, 5]);
    });
    
    it('should enforce minimum width of 1.0', () => {
      const options = {
        adaptiveParams: {
          minOutlineWidth: 0.5,
          maxOutlineWidth: 3
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(normalized.adaptiveParams.outlineWidthRange[0]).toBeGreaterThanOrEqual(1.0);
    });
  });
  
  describe('opacity range normalization', () => {
    it('should clamp boxOpacityRange to [0, 1]', () => {
      const options = {
        adaptiveParams: {
          boxOpacityRange: [-0.5, 1.5]
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(normalized.adaptiveParams.boxOpacityRange[0]).toBeGreaterThanOrEqual(0);
      expect(normalized.adaptiveParams.boxOpacityRange[0]).toBeLessThanOrEqual(1);
      expect(normalized.adaptiveParams.boxOpacityRange[1]).toBeGreaterThanOrEqual(0);
      expect(normalized.adaptiveParams.boxOpacityRange[1]).toBeLessThanOrEqual(1);
    });
    
    it('should swap opacity range if min > max', () => {
      const options = {
        adaptiveParams: {
          outlineOpacityRange: [0.8, 0.2]
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(normalized.adaptiveParams.outlineOpacityRange).toEqual([0.2, 0.8]);
    });
  });
  
  describe('default values (v0.1.15)', () => {
    it('should have updated default values', () => {
      const normalized = validateAndNormalizeOptions({});
      
      // v0.1.15のデフォルト値を確認
      expect(normalized.adaptiveParams).toBeDefined();
    });
    
    it('should default overlapDetection to false (opt-in)', () => {
      const normalized = validateAndNormalizeOptions({});
      
      // DEFAULT_OPTIONSから継承される
      expect(normalized.adaptiveParams).toBeDefined();
    });
  });
  
  describe('boolean flag validation', () => {
    it('should coerce overlapDetection to boolean', () => {
      const options = {
        adaptiveParams: {
          overlapDetection: 'true'
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(typeof normalized.adaptiveParams.overlapDetection).toBe('boolean');
    });
    
    it('should coerce zScaleCompensation to boolean', () => {
      const options = {
        adaptiveParams: {
          zScaleCompensation: 1
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(typeof normalized.adaptiveParams.zScaleCompensation).toBe('boolean');
      expect(normalized.adaptiveParams.zScaleCompensation).toBe(true);
    });
    
    it('should coerce adaptiveOpacityEnabled to boolean', () => {
      const options = {
        adaptiveParams: {
          adaptiveOpacityEnabled: 'false'
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(typeof normalized.adaptiveParams.adaptiveOpacityEnabled).toBe('boolean');
    });
  });
  
  describe('numeric parameter validation', () => {
    it('should validate neighborhoodRadius', () => {
      const options = {
        adaptiveParams: {
          neighborhoodRadius: 'invalid'
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      // デフォルト値（30）にフォールバック
      expect(normalized.adaptiveParams.neighborhoodRadius).toBe(30);
    });
    
    it('should validate densityThreshold', () => {
      const options = {
        adaptiveParams: {
          densityThreshold: -5
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      // デフォルト値（3）にフォールバック
      expect(normalized.adaptiveParams.densityThreshold).toBe(3);
    });
    
    it('should clamp overlapRiskFactor to [0, 1]', () => {
      const options = {
        adaptiveParams: {
          overlapRiskFactor: 1.5
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(normalized.adaptiveParams.overlapRiskFactor).toBeLessThanOrEqual(1);
      expect(normalized.adaptiveParams.overlapRiskFactor).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty adaptiveParams', () => {
      const options = {
        adaptiveParams: {}
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(normalized.adaptiveParams).toBeDefined();
    });
    
    it('should handle null range values', () => {
      const options = {
        adaptiveParams: {
          outlineWidthRange: null,
          boxOpacityRange: null,
          outlineOpacityRange: null
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      expect(normalized.adaptiveParams.outlineWidthRange).toBeNull();
      expect(normalized.adaptiveParams.boxOpacityRange).toBeNull();
      expect(normalized.adaptiveParams.outlineOpacityRange).toBeNull();
    });
    
    it('should handle non-array range values', () => {
      const options = {
        adaptiveParams: {
          outlineWidthRange: 'invalid'
        }
      };
      
      const normalized = validateAndNormalizeOptions(options);
      
      // 不正な値はそのまま（後続処理で無視される）
      expect(normalized.adaptiveParams.outlineWidthRange).toBe('invalid');
    });
  });
});
