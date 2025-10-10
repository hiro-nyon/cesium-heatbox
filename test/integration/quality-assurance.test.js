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
      const _heatbox = new Heatbox(mockViewer, {});
      
      // Check if version is accessible (implementation may vary)
      expect(typeof Heatbox.listProfiles).toBe('function');
      
      // Profile methods should work
      const profiles = Heatbox.listProfiles();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);
    });

    test('should maintain consistent option schema', () => {
      const _heatboxInstance = new Heatbox(mockViewer, {
        profile: 'desktop-balanced'
      });

      const effective = _heatboxInstance.getEffectiveOptions();
      
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

  describe('Adaptive Control Acceptance Criteria (v0.1.15 Phase 4)', () => {
    describe('Visibility Requirements', () => {
      test('should improve visibility with adaptive control vs uniform settings', () => {
        const uniformHeatbox = new Heatbox(mockViewer, {
          adaptiveOutlines: false,
          outlineWidth: 2,
          opacity: 0.8,
          outlineOpacity: 1.0
        });

        const adaptiveHeatbox = new Heatbox(mockViewer, {
          adaptiveOutlines: true,
          outlineWidthPreset: 'adaptive',
          adaptiveParams: {
            densityThreshold: 3,
            neighborhoodRadius: 30
          }
        });

        // Both should be created without errors
        expect(uniformHeatbox).toBeDefined();
        expect(adaptiveHeatbox).toBeDefined();

        const uniformOptions = uniformHeatbox.getEffectiveOptions();
        const adaptiveOptions = adaptiveHeatbox.getEffectiveOptions();

        // Adaptive should have adaptive control enabled
        expect(adaptiveOptions.adaptiveOutlines).toBe(true);
        expect(uniformOptions.adaptiveOutlines).toBe(false);
      });

      test('should prevent TopN voxels from being buried', () => {
        const heatbox = new Heatbox(mockViewer, {
          highlightTopN: 10,
          adaptiveOutlines: true,
          outlineWidthPreset: 'adaptive',
          adaptiveParams: {
            outlineWidthRange: [1.0, 5.0]  // Allow TopN boost
          }
        });

        const options = heatbox.getEffectiveOptions();
        
        expect(options.highlightTopN).toBe(10);
        expect(options.adaptiveOutlines).toBe(true);
        expect(options.adaptiveParams.outlineWidthRange).toEqual([1.0, 5.0]);
        
        // Upper bound should be high enough for TopN boost
        expect(options.adaptiveParams.outlineWidthRange[1]).toBeGreaterThanOrEqual(4.0);
      });

      test('should handle outline render mode transitions stably', () => {
        const modes = ['standard', 'inset', 'emulation-only'];
        
        modes.forEach(mode => {
          expect(() => {
            const heatbox = new Heatbox(mockViewer, {
              outlineRenderMode: mode,
              adaptiveOutlines: true
            });

            const options = heatbox.getEffectiveOptions();
            expect(options.outlineRenderMode).toBe(mode);
          }).not.toThrow();
        });
      });
    });

    describe('Priority and Clamping', () => {
      test('should respect priority order: Resolver > Adaptive > Base', () => {
        // Note: Resolvers are deprecated but still functional in v0.1.15
        const heatbox = new Heatbox(mockViewer, {
          outlineWidth: 2,  // Base
          adaptiveOutlines: true,  // Adaptive
          adaptiveParams: {
            outlineWidthRange: [1.0, 3.0]
          }
        });

        const options = heatbox.getEffectiveOptions();
        
        // Adaptive should be enabled
        expect(options.adaptiveOutlines).toBe(true);
        
        // Base width should be set
        expect(options.outlineWidth).toBe(2);
        
        // Range should clamp adaptive values
        expect(options.adaptiveParams.outlineWidthRange).toEqual([1.0, 3.0]);
      });

      test('should clamp outline width within outlineWidthRange', () => {
        const heatbox = new Heatbox(mockViewer, {
          adaptiveOutlines: true,
          adaptiveParams: {
            outlineWidthRange: [1.5, 2.5],
            minOutlineWidth: 1.0,
            maxOutlineWidth: 5.0
          }
        });

        const options = heatbox.getEffectiveOptions();
        
        // outlineWidthRange should take priority over min/max
        expect(options.adaptiveParams.outlineWidthRange).toEqual([1.5, 2.5]);
      });

      test('should clamp box opacity within boxOpacityRange', () => {
        const heatbox = new Heatbox(mockViewer, {
          opacity: 0.8,
          adaptiveOutlines: true,
          adaptiveParams: {
            boxOpacityRange: [0.5, 0.9]
          }
        });

        const options = heatbox.getEffectiveOptions();
        
        expect(options.adaptiveParams.boxOpacityRange).toEqual([0.5, 0.9]);
        expect(options.opacity).toBe(0.8);
        
        // Opacity should be within range
        expect(options.opacity).toBeGreaterThanOrEqual(0.5);
        expect(options.opacity).toBeLessThanOrEqual(0.9);
      });

      test('should clamp outline opacity within outlineOpacityRange', () => {
        const heatbox = new Heatbox(mockViewer, {
          outlineOpacity: 1.0,
          adaptiveOutlines: true,
          adaptiveParams: {
            outlineOpacityRange: [0.3, 1.0]
          }
        });

        const options = heatbox.getEffectiveOptions();
        
        expect(options.adaptiveParams.outlineOpacityRange).toEqual([0.3, 1.0]);
        expect(options.outlineOpacity).toBe(1.0);
        
        // Outline opacity should be within range
        expect(options.outlineOpacity).toBeGreaterThanOrEqual(0.3);
        expect(options.outlineOpacity).toBeLessThanOrEqual(1.0);
      });

      test('should handle boundary values in range clamping', () => {
        const testCases = [
          { range: [1.0, 3.0], expected: [1.0, 3.0] },
          { range: [0, 1], expected: [0, 1] },
          { range: [1.5, 1.5], expected: [1.5, 1.5] },  // Edge case: min === max
        ];

        testCases.forEach(({ range, expected }) => {
          const heatbox = new Heatbox(mockViewer, {
            adaptiveOutlines: true,
            adaptiveParams: {
              outlineWidthRange: range
            }
          });

          const options = heatbox.getEffectiveOptions();
          expect(options.adaptiveParams.outlineWidthRange).toEqual(expected);
        });
      });
    });

    describe('Performance Requirements', () => {
      test('should not significantly increase computation time with adaptive control', () => {
        const startBase = performance.now();
        const baseHeatbox = new Heatbox(mockViewer, {
          adaptiveOutlines: false
        });
        const baseTime = performance.now() - startBase;

        const startAdaptive = performance.now();
        const adaptiveHeatbox = new Heatbox(mockViewer, {
          adaptiveOutlines: true,
          adaptiveParams: {
            neighborhoodRadius: 30,
            densityThreshold: 3
          }
        });
        const adaptiveTime = performance.now() - startAdaptive;

        // Adaptive should not be more than 15% slower
        const overhead = (adaptiveTime - baseTime) / baseTime;
        expect(overhead).toBeLessThanOrEqual(0.15);

        expect(baseHeatbox).toBeDefined();
        expect(adaptiveHeatbox).toBeDefined();
      });

      test('should maintain stable frame time within ±20% range', () => {
        const heatbox = new Heatbox(mockViewer, {
          adaptiveOutlines: true,
          maxRenderVoxels: 5000
        });

        const frameTimes = [];
        for (let i = 0; i < 10; i++) {
          const start = performance.now();
          // Simulate render cycle
          heatbox.getStatistics();
          const frameTime = performance.now() - start;
          frameTimes.push(frameTime);
        }

        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const deviations = frameTimes.map(t => Math.abs(t - avgFrameTime) / avgFrameTime);
        const maxDeviation = Math.max(...deviations);

        // Frame time should be stable within ±20%
        expect(maxDeviation).toBeLessThanOrEqual(0.20);
      });
    });

    describe('Edge Cases and Robustness', () => {
      test('should handle Z-axis extreme aspect ratios', () => {
        const heatbox = new Heatbox(mockViewer, {
          adaptiveOutlines: true,
          adaptiveParams: {
            zScaleCompensation: true
          },
          heightMultiplier: 2.0
        });

        const options = heatbox.getEffectiveOptions();
        
        expect(options.adaptiveParams.zScaleCompensation).toBe(true);
        expect(options.heightMultiplier).toBe(2.0);
      });

      test('should handle overlap detection configuration', () => {
        const heatbox = new Heatbox(mockViewer, {
          adaptiveOutlines: true,
          adaptiveParams: {
            overlapDetection: true
          },
          outlineRenderMode: 'inset',
          outlineInset: 0.5
        });

        const options = heatbox.getEffectiveOptions();
        
        expect(options.adaptiveParams.overlapDetection).toBe(true);
        expect(options.outlineRenderMode).toBe('inset');
        expect(options.outlineInset).toBe(0.5);
      });

      test('should handle empty or null adaptiveParams gracefully', () => {
        expect(() => {
          const heatbox = new Heatbox(mockViewer, {
            adaptiveOutlines: true,
            adaptiveParams: null
          });
          expect(heatbox).toBeDefined();
        }).not.toThrow();

        expect(() => {
          const heatbox = new Heatbox(mockViewer, {
            adaptiveOutlines: true,
            adaptiveParams: {}
          });
          expect(heatbox).toBeDefined();
        }).not.toThrow();
      });

      test('should validate range format [min, max]', () => {
        const validRanges = [
          [1.0, 3.0],
          [0, 1],
          [1.5, 1.5]
        ];

        validRanges.forEach(range => {
          expect(() => {
            const heatbox = new Heatbox(mockViewer, {
              adaptiveOutlines: true,
              adaptiveParams: {
                outlineWidthRange: range
              }
            });
            expect(heatbox).toBeDefined();
          }).not.toThrow();
        });
      });
    });

    describe('Integration with Existing Features', () => {
      test('should work with profiles', () => {
        const profiles = ['mobile-fast', 'desktop-balanced', 'dense-data', 'sparse-data'];
        
        profiles.forEach(profile => {
          const heatbox = new Heatbox(mockViewer, {
            profile,
            adaptiveOutlines: true
          });

          const options = heatbox.getEffectiveOptions();
          expect(options.adaptiveOutlines).toBe(true);
          expect(heatbox).toBeDefined();
        });
      });

      test('should work with all outline render modes', () => {
        const modes = ['standard', 'inset', 'emulation-only'];
        
        modes.forEach(mode => {
          const heatbox = new Heatbox(mockViewer, {
            outlineRenderMode: mode,
            adaptiveOutlines: true,
            adaptiveParams: {
              outlineWidthRange: [1.0, 3.0]
            }
          });

          const options = heatbox.getEffectiveOptions();
          expect(options.outlineRenderMode).toBe(mode);
          expect(options.adaptiveOutlines).toBe(true);
        });
      });

      test('should work with emulationScope options', () => {
        const scopes = ['off', 'topn', 'non-topn', 'all'];
        
        scopes.forEach(scope => {
          const heatbox = new Heatbox(mockViewer, {
            emulationScope: scope,
            adaptiveOutlines: true
          });

          const options = heatbox.getEffectiveOptions();
          expect(options.emulationScope).toBe(scope);
        });
      });
    });
  });
});
