/**
 * Migration scenarios test for v0.1.11 → v0.1.12
 * Phase 4: Quality assurance - migration path validation
 */

import { Heatbox } from '../../src/Heatbox.js';
import { validateAndNormalizeOptions } from '../../src/utils/validation.js';
import { clearWarnings } from '../../src/utils/deprecate.js';

describe('Migration Scenarios v0.1.11 → v0.1.12', () => {
  let mockViewer;
  let consoleSpy;

  beforeEach(() => {
    // Mock CesiumJS Viewer
    mockViewer = {
      scene: {
        postRender: {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        },
        globe: { show: true }
      },
      entities: {
        add: jest.fn(),
        remove: jest.fn(),
        removeAll: jest.fn()
      },
      camera: {
        flyTo: jest.fn(),
        setView: jest.fn()
      }
    };

    // Clear deprecation warnings
    clearWarnings();

    // Spy on console to capture deprecation warnings
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Scenario 1: Basic fitView options migration', () => {
    test('should handle pitch/heading → pitchDegrees/headingDegrees migration', () => {
      // v0.1.11 style configuration
      const oldConfig = {
        fitViewOptions: {
          pitch: -30,
          heading: 90,
          paddingPercent: 0.1
        }
      };

      const normalized = validateAndNormalizeOptions(oldConfig);

      // Should prioritize new names and show deprecation warnings
      expect(normalized.fitViewOptions.pitchDegrees).toBe(-30);
      expect(normalized.fitViewOptions.headingDegrees).toBe(90);
      expect(normalized.fitViewOptions.paddingPercent).toBe(0.1);

      // Should show deprecation warnings
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Heatbox][DEPRECATION][v0.2.0] fitViewOptions.pitch is deprecated')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Heatbox][DEPRECATION][v0.2.0] fitViewOptions.heading is deprecated')
      );
    });

    test('should prioritize new names when both old and new are provided', () => {
      const mixedConfig = {
        fitViewOptions: {
          pitch: -30,           // old
          pitchDegrees: -45,    // new (should win)
          heading: 90,          // old
          headingDegrees: 180   // new (should win)
        }
      };

      const normalized = validateAndNormalizeOptions(mixedConfig);

      expect(normalized.fitViewOptions.pitchDegrees).toBe(-45);
      expect(normalized.fitViewOptions.headingDegrees).toBe(180);
    });
  });

  describe('Scenario 2: Resolver system → adaptive control migration', () => {
    test('should handle outlineWidthResolver deprecation', () => {
      const oldResolverConfig = {
        outlineWidthResolver: (params) => params.isTopN ? 3 : 1,
        outlineOpacityResolver: (ctx) => ctx.isTopN ? 1.0 : 0.6
      };

      const normalized = validateAndNormalizeOptions(oldResolverConfig);

      // Resolvers should be removed from normalized options
      expect(normalized.outlineWidthResolver).toBeUndefined();
      expect(normalized.outlineOpacityResolver).toBeUndefined();

      // Should show deprecation warnings
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Heatbox][DEPRECATION][v0.2.0] outlineWidthResolver is deprecated')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Heatbox][DEPRECATION][v0.2.0] outlineOpacityResolver is deprecated')
      );
    });

    test('should suggest adaptive system migration', () => {
      const oldResolverConfig = {
        boxOpacityResolver: (ctx) => ctx.adaptiveParams.boxOpacity || 0.8
      };

      const normalized = validateAndNormalizeOptions(oldResolverConfig);

      expect(normalized.boxOpacityResolver).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('boxOpacityResolver is deprecated; use adaptiveParams system')
      );
    });
  });

  describe('Scenario 3: outlineEmulation → outlineRenderMode unification', () => {
    test('should migrate outlineEmulation boolean values', () => {
      const testCases = [
        { 
          old: { outlineEmulation: true },
          expected: { outlineRenderMode: 'emulation-only', emulationScope: 'all' }
        },
        { 
          old: { outlineEmulation: false },
          expected: { outlineRenderMode: 'standard', emulationScope: 'off' }
        }
      ];

      testCases.forEach(({ old, expected }) => {
        clearWarnings();
        const normalized = validateAndNormalizeOptions(old);
        
        expect(normalized.outlineRenderMode).toBe(expected.outlineRenderMode);
        expect(normalized.emulationScope).toBe(expected.emulationScope);
        expect(normalized.outlineEmulation).toBeUndefined();
      });
    });

    test('should migrate outlineEmulation string values', () => {
      const testCases = [
        { 
          old: { outlineEmulation: 'all' },
          expected: { outlineRenderMode: 'emulation-only', emulationScope: 'all' }
        },
        { 
          old: { outlineEmulation: 'topn' },
          expected: { outlineRenderMode: 'standard', emulationScope: 'topn' }
        },
        { 
          old: { outlineEmulation: 'non-topn' },
          expected: { outlineRenderMode: 'standard', emulationScope: 'non-topn' }
        },
        { 
          old: { outlineEmulation: 'off' },
          expected: { outlineRenderMode: 'standard', emulationScope: 'off' }
        }
      ];

      testCases.forEach(({ old, expected }) => {
        clearWarnings();
        const normalized = validateAndNormalizeOptions(old);
        
        expect(normalized.outlineRenderMode).toBe(expected.outlineRenderMode);
        expect(normalized.emulationScope).toBe(expected.emulationScope);
        expect(normalized.outlineEmulation).toBeUndefined();
      });
    });

    test('should show deprecation warning for outlineEmulation', () => {
      validateAndNormalizeOptions({ outlineEmulation: 'topn' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Heatbox][DEPRECATION][v0.2.0] outlineEmulation is deprecated')
      );
    });
  });

  describe('Scenario 4: outlineWidthPreset name unification', () => {
    test('should migrate legacy preset names', () => {
      const legacyPresets = [
        { old: 'uniform', new: 'medium' },
        { old: 'adaptive-density', new: 'adaptive' }, 
        { old: 'topn-focus', new: 'thick' }
      ];

      legacyPresets.forEach(({ old, new: newName }) => {
        clearWarnings();
        const normalized = validateAndNormalizeOptions({ outlineWidthPreset: old });
        
        expect(normalized.outlineWidthPreset).toBe(newName);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(`outlineWidthPreset '${old}' is deprecated; use '${newName}'`)
        );
      });
    });

    test('should accept new preset names without warning', () => {
      const newPresets = ['thin', 'medium', 'thick', 'adaptive'];

      newPresets.forEach(preset => {
        clearWarnings();
        consoleSpy.mockClear();
        
        const normalized = validateAndNormalizeOptions({ outlineWidthPreset: preset });
        
        expect(normalized.outlineWidthPreset).toBe(preset);
        expect(consoleSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Scenario 5: Profile-based configuration', () => {
    test('should apply mobile-fast profile correctly', () => {
      const heatbox = new Heatbox(mockViewer, {
        profile: 'mobile-fast',
        maxRenderVoxels: 8000  // Should override profile
      });

      const options = heatbox.getEffectiveOptions();
      
      // Profile should set base values
      expect(options.outlineRenderMode).toBe('emulation-only');
      expect(options.opacity).toBe(0.7);
      
      // User override should win
      expect(options.maxRenderVoxels).toBe(8000);
    });

    test('should list available profiles', () => {
      const profiles = Heatbox.listProfiles();
      
      expect(profiles).toEqual(['mobile-fast', 'desktop-balanced', 'dense-data', 'sparse-data']);
    });

    test('should get profile details', () => {
      const details = Heatbox.getProfileDetails('mobile-fast');
      
      expect(details).toHaveProperty('description');
      expect(details.description).toContain('Mobile devices');
      expect(details).toHaveProperty('maxRenderVoxels', 5000);
    });
  });

  describe('Scenario 6: Performance overlay integration', () => {
    test('should initialize performance overlay when enabled', () => {
      const heatbox = new Heatbox(mockViewer, {
        performanceOverlay: {
          enabled: true,
          position: 'bottom-left',
          autoShow: true
        }
      });

      // Should have overlay methods available
      expect(typeof heatbox.togglePerformanceOverlay).toBe('function');
      expect(typeof heatbox.showPerformanceOverlay).toBe('function');
      expect(typeof heatbox.hidePerformanceOverlay).toBe('function');
    });

    test('should handle runtime overlay enabling', () => {
      const heatbox = new Heatbox(mockViewer, {});

      const result = heatbox.setPerformanceOverlayEnabled(true, {
        position: 'top-left',
        updateIntervalMs: 250
      });

      expect(result).toBe(true);
    });
  });

  describe('Scenario 7: Complete migration workflow', () => {
    test('should handle complex v0.1.11 configuration migration', () => {
      // Comprehensive v0.1.11 style configuration
      const v011Config = {
        fitViewOptions: {
          pitch: -45,
          heading: 180
        },
        outlineEmulation: 'topn',
        outlineWidthPreset: 'uniform',
        outlineWidthResolver: (params) => params.isTopN ? 4 : 2,
        outlineOpacityResolver: (ctx) => ctx.isTopN ? 1.0 : 0.6,
        boxOpacityResolver: (_ctx) => 0.8
      };

      const heatbox = new Heatbox(mockViewer, v011Config);
      const effective = heatbox.getEffectiveOptions();

      // Check migration results
      expect(effective.fitViewOptions.pitchDegrees).toBe(-45);
      expect(effective.fitViewOptions.headingDegrees).toBe(180);
      expect(effective.outlineRenderMode).toBe('standard');
      expect(effective.emulationScope).toBe('topn');
      expect(effective.outlineWidthPreset).toBe('medium');
      
      // Resolvers should be removed
      expect(effective.outlineWidthResolver).toBeUndefined();
      expect(effective.outlineOpacityResolver).toBeUndefined();
      expect(effective.boxOpacityResolver).toBeUndefined();

      // Should show all relevant warnings
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('fitViewOptions.pitch is deprecated')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('outlineEmulation is deprecated')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('outlineWidthPreset \'uniform\' is deprecated')
      );
    });

    test('should maintain backward compatibility with warnings', () => {
      const v011Config = {
        fitViewOptions: { pitch: -30, heading: 0 },
        outlineEmulation: true,
        outlineWidthPreset: 'adaptive-density'
      };

      // Should work without throwing errors
      expect(() => {
        new Heatbox(mockViewer, v011Config);
      }).not.toThrow();

      // Should show deprecation warnings
      expect(consoleSpy).toHaveBeenCalledTimes(4); // pitch, heading, emulation, preset
    });
  });

  describe('Scenario 8: Warning suppression (warnOnce behavior)', () => {
    test('should warn only once per deprecation code', () => {
      // First usage - should warn
      validateAndNormalizeOptions({ fitViewOptions: { pitch: -30 } });
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      // Second usage - should not warn again
      validateAndNormalizeOptions({ fitViewOptions: { pitch: -45 } });
      expect(consoleSpy).toHaveBeenCalledTimes(1); // Still only 1 call

      // Different deprecation - should warn
      validateAndNormalizeOptions({ outlineEmulation: true });
      expect(consoleSpy).toHaveBeenCalledTimes(2); // Now 2 calls
    });
  });
});
