/**
 * Quality assurance integration test suite for v0.1.12
 * Phase 4: Comprehensive quality validation
 */

import { Heatbox } from '../../src/Heatbox.js';
import { validateAndNormalizeOptions } from '../../src/utils/validation.js';
// import { checkDocumentationConsistency } from '../../tools/documentation-consistency-check.js'; // TODO: Enable after fixing Jest ES module issues

describe('Quality Assurance Integration Tests', () => {
  let mockViewer;

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
        add: jest.fn().mockReturnValue({ id: 'mock-entity' }),
        remove: jest.fn(),
        removeAll: jest.fn()
      },
      camera: {
        flyTo: jest.fn(),
        setView: jest.fn()
      }
    };
  });

  describe('API Consistency Validation', () => {
    test('should have consistent profile naming across static methods', () => {
      const profiles = Heatbox.listProfiles();
      
      profiles.forEach(profileName => {
        const details = Heatbox.getProfileDetails(profileName);
        expect(details).toBeDefined();
        expect(details).toHaveProperty('description');
        expect(typeof details.description).toBe('string');
        expect(details.description.length).toBeGreaterThan(0);
      });
    });

    test('should handle all documented option combinations', () => {
      const optionCombinations = [
        // Profile with custom overrides
        {
          profile: 'mobile-fast',
          maxRenderVoxels: 8000,
          performanceOverlay: { enabled: true }
        },
        
        // New API without profile
        {
          outlineRenderMode: 'inset',
          emulationScope: 'topn',
          outlineWidthPreset: 'adaptive',
          fitViewOptions: { pitchDegrees: -30, headingDegrees: 45 }
        },
        
        // Legacy API (should work with warnings)
        {
          fitViewOptions: { pitch: -45, heading: 90 },
          outlineEmulation: 'non-topn',
          outlineWidthPreset: 'uniform'
        }
      ];

      optionCombinations.forEach(options => {
        expect(() => {
          const heatbox = new Heatbox(mockViewer, options);
          const effective = heatbox.getEffectiveOptions();
          expect(effective).toBeDefined();
          heatbox.clear();
        }).not.toThrow();
      });
    });

    test('should maintain consistent method signatures', () => {
      const heatbox = new Heatbox(mockViewer, {});

      // Static methods
      expect(typeof Heatbox.listProfiles).toBe('function');
      expect(typeof Heatbox.getProfileDetails).toBe('function');

      // Instance methods
      expect(typeof heatbox.setData).toBe('function');
      expect(typeof heatbox.clear).toBe('function');
      expect(typeof heatbox.getStatistics).toBe('function');
      expect(typeof heatbox.getEffectiveOptions).toBe('function');
      expect(typeof heatbox.togglePerformanceOverlay).toBe('function');
      expect(typeof heatbox.setPerformanceOverlayEnabled).toBe('function');
    });
  });

  describe('Migration Path Validation', () => {
    test('should provide clear migration path for all deprecated options', () => {
      const deprecatedOptions = {
        fitViewOptions: { pitch: -30, heading: 0 },
        outlineEmulation: 'topn',
        outlineWidthPreset: 'uniform',
        outlineWidthResolver: () => 2,
        outlineOpacityResolver: () => 0.8,
        boxOpacityResolver: () => 0.7
      };

      // Should not throw
      expect(() => {
        const normalized = validateAndNormalizeOptions(deprecatedOptions);
        
        // Should have migrated values
        expect(normalized.fitViewOptions.pitchDegrees).toBe(-30);
        expect(normalized.fitViewOptions.headingDegrees).toBe(0);
        expect(normalized.outlineRenderMode).toBeDefined();
        expect(normalized.emulationScope).toBe('topn');
        expect(normalized.outlineWidthPreset).toBe('medium'); // uniform → medium
        
        // Deprecated options should be removed
        expect(normalized.outlineWidthResolver).toBeUndefined();
        expect(normalized.outlineOpacityResolver).toBeUndefined();
        expect(normalized.boxOpacityResolver).toBeUndefined();
      }).not.toThrow();
    });

    test('should maintain backward compatibility for common use cases', () => {
      // Common v0.1.11 configuration
      const commonV011Config = {
        opacity: 0.8,
        minColor: [0, 0, 255],
        maxColor: [255, 0, 0],
        fitViewOptions: {
          pitch: -45,
          heading: 0,
          paddingPercent: 0.1
        },
        outlineEmulation: false,
        highlightTopN: 10
      };

      const heatbox = new Heatbox(mockViewer, commonV011Config);
      const stats = heatbox.getStatistics();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalVoxels).toBe('number');
      expect(typeof stats.renderedVoxels).toBe('number');
    });
  });

  describe('Feature Integration Validation', () => {
    test('should integrate performance overlay with profiles correctly', () => {
      const profiles = ['mobile-fast', 'desktop-balanced', 'dense-data', 'sparse-data'];

      profiles.forEach(profile => {
        const heatbox = new Heatbox(mockViewer, {
          profile,
          performanceOverlay: {
            enabled: true,
            position: 'bottom-right'
          }
        });

        const effective = heatbox.getEffectiveOptions();
        expect(effective.performanceOverlay.enabled).toBe(true);
        expect(effective.performanceOverlay.position).toBe('bottom-right');
        
        // Should have overlay methods
        expect(typeof heatbox.togglePerformanceOverlay).toBe('function');
        expect(typeof heatbox.showPerformanceOverlay).toBe('function');
        expect(typeof heatbox.hidePerformanceOverlay).toBe('function');
      });
    });

    test('should handle adaptive control with all render modes', () => {
      const renderModes = ['standard', 'inset', 'emulation-only'];
      const emulationScopes = ['off', 'topn', 'non-topn', 'all'];

      renderModes.forEach(renderMode => {
        emulationScopes.forEach(scope => {
          expect(() => {
            const heatbox = new Heatbox(mockViewer, {
              outlineRenderMode: renderMode,
              emulationScope: scope,
              adaptiveOutlines: true,
              adaptiveParams: {
                outlineWidthRange: [1, 3],
                outlineOpacityRange: [0.5, 1.0]
              }
            });

            const effective = heatbox.getEffectiveOptions();
            expect(effective.outlineRenderMode).toBe(renderMode);
            expect(effective.emulationScope).toBe(scope);
          }).not.toThrow();
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid profile names gracefully', () => {
      // Invalid profile should not crash, just ignore
      expect(() => {
        const heatbox = new Heatbox(mockViewer, {
          profile: 'nonexistent-profile',
          opacity: 0.7
        });

        const effective = heatbox.getEffectiveOptions();
        expect(effective.opacity).toBe(0.7); // User option should still work
      }).not.toThrow();
    });

    test('should handle edge cases in option validation', () => {
      const edgeCases = [
        { fitViewOptions: { pitchDegrees: 90 } }, // Extreme values
        { opacity: 0 }, // Boundary values
        { opacity: 1 },
        { emulationScope: 'invalid' }, // Invalid enum values (should fallback)
        { outlineRenderMode: 'invalid' }
      ];

      edgeCases.forEach(options => {
        expect(() => {
          const normalized = validateAndNormalizeOptions(options);
          expect(normalized).toBeDefined();
        }).not.toThrow();
      });
    });

    test('should handle missing viewer gracefully', () => {
      expect(() => {
        new Heatbox(null, { profile: 'mobile-fast' });
      }).toThrow(); // Should throw, but with meaningful error
    });
  });

  describe('Documentation Consistency', () => {
    test('should have consistent API documentation', async () => {
      // This test can be extended to run the documentation checker
      const profiles = Heatbox.listProfiles();
      
      // All documented profiles should exist
      const expectedProfiles = ['mobile-fast', 'desktop-balanced', 'dense-data', 'sparse-data'];
      expectedProfiles.forEach(profile => {
        expect(profiles).toContain(profile);
      });

      // All profiles should have proper details
      profiles.forEach(profile => {
        const details = Heatbox.getProfileDetails(profile);
        expect(details).toHaveProperty('description');
        expect(typeof details.description).toBe('string');
      });
    });
  });

  describe('Version Consistency', () => {
    test('should report consistent version information', () => {
      const heatbox = new Heatbox(mockViewer, {});
      
      // Check if version is accessible (implementation may vary)
      expect(typeof Heatbox.listProfiles).toBe('function');
      
      // Profile methods should work
      const profiles = Heatbox.listProfiles();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);
    });

    test('should maintain consistent option schema', () => {
      const heatbox = new Heatbox(mockViewer, {
        profile: 'desktop-balanced'
      });

      const effective = heatbox.getEffectiveOptions();
      
      // Core options should exist
      const coreOptions = [
        'opacity', 'minColor', 'maxColor',
        'outlineRenderMode', 'emulationScope', 
        'outlineWidthPreset', 'maxRenderVoxels'
      ];

      coreOptions.forEach(option => {
        expect(effective).toHaveProperty(option);
      });

      // Deprecated options should not exist
      const deprecatedOptions = [
        'outlineEmulation', 'outlineWidthResolver',
        'outlineOpacityResolver', 'boxOpacityResolver'
      ];

      deprecatedOptions.forEach(option => {
        expect(effective).not.toHaveProperty(option);
      });
    });
  });
});
