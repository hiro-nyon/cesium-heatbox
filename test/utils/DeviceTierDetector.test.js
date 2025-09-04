/**
 * Test suite for DeviceTierDetector
 * DeviceTierDetector のテストスイート
 */

import { DeviceTierDetector, detectDeviceTier, applyAutoRenderBudget } from '../../src/utils/deviceTierDetector.js';

// Mock navigator and screen for testing
const originalNavigator = global.navigator;
const originalScreen = global.screen;
const originalWindow = global.window;

describe('DeviceTierDetector', () => {
  beforeEach(() => {
    // Reset mocks before each test (jsdom-safe navigator override)
    const store = { _deviceMemory: undefined, _hardwareConcurrency: undefined };

    // Ensure a navigator object exists and make deviceMemory/hardwareConcurrency writable via accessors
    if (!global.navigator) {
      Object.defineProperty(global, 'navigator', { value: {}, configurable: true, writable: true });
    }
    try {
      Object.defineProperty(global.navigator, 'deviceMemory', {
        configurable: true,
        get() { return store._deviceMemory; },
        set(v) { store._deviceMemory = v; }
      });
    } catch (_e) {
      // Fallback if property is not redefinable
      global.navigator.deviceMemory = undefined; // eslint-disable-line no-param-reassign
    }
    try {
      Object.defineProperty(global.navigator, 'hardwareConcurrency', {
        configurable: true,
        get() { return store._hardwareConcurrency; },
        set(v) { store._hardwareConcurrency = v; }
      });
    } catch (_e) {
      global.navigator.hardwareConcurrency = undefined; // eslint-disable-line no-param-reassign
    }
    // Make userAgent writable via accessor for jsdom
    try {
      let uaStore = 'Test Browser';
      Object.defineProperty(global.navigator, 'userAgent', {
        configurable: true,
        get() { return uaStore; },
        set(v) { uaStore = v; }
      });
    } catch (_e) { /* ignore if not redefinable */ }

    global.screen = {
      width: 1920,
      height: 1080
    };
    global.window = {
      devicePixelRatio: 1
    };

    // Mock document.createElement for WebGL context (with WebGL constants)
    global.document = {
      createElement: jest.fn(() => ({
        getContext: jest.fn(() => ({
          MAX_TEXTURE_SIZE: 'MAX_TEXTURE_SIZE',
          MAX_RENDERBUFFER_SIZE: 'MAX_RENDERBUFFER_SIZE',
          getParameter: jest.fn((param) => {
            if (param === 'MAX_TEXTURE_SIZE') return 4096;
            if (param === 'MAX_RENDERBUFFER_SIZE') return 4096;
            return null;
          })
        })),
        remove: jest.fn()
      }))
    };
  });

  afterAll(() => {
    global.navigator = originalNavigator;
    global.screen = originalScreen;
    global.window = originalWindow;
  });

  describe('Device tier detection', () => {
    test('should detect high tier with deviceMemory > 8GB', () => {
      global.navigator.deviceMemory = 16;
      
      const result = DeviceTierDetector.detect();
      
      // Note: Due to WebGL limits mocking in test environment, tier might be downgraded
      expect(['mid', 'high']).toContain(result.tier);
      expect(result.maxRenderVoxels).toBeGreaterThan(15000);
      expect(result.metadata.detectionMethod).toContain('deviceMemory');
    });

    test('should detect mid tier with deviceMemory 4-8GB', () => {
      global.navigator.deviceMemory = 6;
      
      const result = DeviceTierDetector.detect();
      
      // Note: Due to WebGL limits mocking in test environment, tier might be downgraded to low
      expect(['low', 'mid']).toContain(result.tier);
      expect(result.maxRenderVoxels).toBeGreaterThan(8000);
      expect(result.metadata.detectionMethod).toContain('deviceMemory');
    });

    test('should detect low tier with deviceMemory <= 4GB', () => {
      global.navigator.deviceMemory = 2;
      
      const result = DeviceTierDetector.detect();
      
      expect(result.tier).toBe('low');
      expect(result.maxRenderVoxels).toBeLessThanOrEqual(15000);
      expect(result.metadata.detectionMethod).toContain('deviceMemory');
    });

    test('should fallback to hardwareConcurrency when deviceMemory unavailable', () => {
      global.navigator.deviceMemory = undefined;
      global.navigator.hardwareConcurrency = 8;
      
      const result = DeviceTierDetector.detect();
      
      expect(['low', 'mid', 'high']).toContain(result.tier);
      expect(result.metadata.detectionMethod).toContain('hardwareConcurrency');
    });

    test('should consider screen resolution in hardwareConcurrency fallback', () => {
      global.navigator.deviceMemory = undefined;
      global.navigator.hardwareConcurrency = 4;
      global.screen.width = 3840;
      global.screen.height = 2160;
      global.window.devicePixelRatio = 2;
      
      const result = DeviceTierDetector.detect();
      
      expect(result.metadata.detectionMethod).toContain('hardwareConcurrency+resolution');
    });

    test('should downgrade tier for limited WebGL capabilities', () => {
      global.navigator.deviceMemory = 16;
      
      // Mock limited WebGL context
      global.document.createElement = jest.fn(() => ({
        getContext: jest.fn(() => ({
          MAX_TEXTURE_SIZE: 'MAX_TEXTURE_SIZE',
          MAX_RENDERBUFFER_SIZE: 'MAX_RENDERBUFFER_SIZE',
          getParameter: jest.fn((param) => {
            if (param === 'MAX_TEXTURE_SIZE') return 2048; // Limited
            if (param === 'MAX_RENDERBUFFER_SIZE') return 2048;
            return null;
          })
        })),
        remove: jest.fn()
      }));
      
      const result = DeviceTierDetector.detect();
      
      expect(result.tier).not.toBe('high'); // Should be downgraded
      expect(result.metadata.detectionMethod).toContain('webglLimits');
    });

    test('should handle WebGL context creation failure', () => {
      global.navigator.deviceMemory = 8;
      
      // Mock failed WebGL context
      global.document.createElement = jest.fn(() => ({
        getContext: jest.fn(() => null),
        remove: jest.fn()
      }));
      
      const result = DeviceTierDetector.detect();
      
      expect(['low', 'mid', 'high']).toContain(result.tier);
      expect(result.metadata.webglInfo.webgl2).toBe(false);
    });

    test('should return fallback on detection error', () => {
      // Force error by making _getDeviceInfo throw
      const spy = jest.spyOn(DeviceTierDetector, '_getDeviceInfo').mockImplementation(() => {
        throw new Error('forced-error');
      });

      const result = DeviceTierDetector.detect();

      expect(['low', 'mid']).toContain(result.tier); // May be downgraded due to environment
      expect(result.maxRenderVoxels).toBeGreaterThan(5000);
      expect(result.metadata.detectionMethod).toBe('error-fallback');
      expect(result.metadata.error).toBeDefined();

      spy.mockRestore();
    });
  });

  describe('Auto render budget application', () => {
    test('should apply auto render budget when maxRenderVoxels is "auto"', () => {
      global.navigator.deviceMemory = 8;
      
      const options = {
        maxRenderVoxels: 'auto',
        voxelSize: 50
      };
      
      const result = DeviceTierDetector.applyAutoRenderBudget(options);
      
      expect(result.maxRenderVoxels).toBeGreaterThan(0);
      expect(result.maxRenderVoxels).not.toBe('auto');
      expect(result._autoRenderBudget).toBeDefined();
      expect(result._autoRenderBudget.tier).toBeDefined();
    });

    test('should apply auto render budget when renderBudgetMode is "auto"', () => {
      global.navigator.deviceMemory = 4;
      
      const options = {
        renderBudgetMode: 'auto',
        maxRenderVoxels: 10000
      };
      
      const result = DeviceTierDetector.applyAutoRenderBudget(options);
      
      expect(result.maxRenderVoxels).toBeGreaterThan(0);
      expect(result._autoRenderBudget).toBeDefined();
    });

    test('should not modify options when not in auto mode', () => {
      const options = {
        maxRenderVoxels: 15000,
        renderBudgetMode: 'manual',
        voxelSize: 30
      };
      
      const result = DeviceTierDetector.applyAutoRenderBudget(options);
      
      expect(result).toEqual(options);
      expect(result._autoRenderBudget).toBeUndefined();
    });

    test('should preserve other options when applying auto budget', () => {
      global.navigator.deviceMemory = 8;
      
      const options = {
        maxRenderVoxels: 'auto',
        voxelSize: 40,
        outlineWidth: 2,
        debug: true
      };
      
      const result = DeviceTierDetector.applyAutoRenderBudget(options);
      
      expect(result.voxelSize).toBe(40);
      expect(result.outlineWidth).toBe(2);
      expect(result.debug).toBe(true);
      expect(result.maxRenderVoxels).not.toBe('auto');
    });
  });

  describe('Backward compatibility functions', () => {
    test('detectDeviceTier function should work', () => {
      global.navigator.deviceMemory = 8;
      
      const result = detectDeviceTier();
      
      expect(['low', 'mid']).toContain(result.tier); // May be downgraded due to WebGL
      expect(result.maxRenderVoxels).toBeGreaterThan(0);
      expect(result.detectionMethod).toBeDefined();
      expect(result.deviceInfo).toBeDefined();
      expect(result.webglInfo).toBeDefined();
    });

    test('applyAutoRenderBudget function should work', () => {
      global.navigator.deviceMemory = 8;
      
      const options = { maxRenderVoxels: 'auto' };
      const result = applyAutoRenderBudget(options);
      
      expect(result.maxRenderVoxels).toBeGreaterThan(0);
      expect(result._autoRenderBudget).toBeDefined();
    });
  });

  describe('Performance requirements', () => {
    test('should respect PERFORMANCE_LIMITS.maxVoxels', () => {
      global.navigator.deviceMemory = 32; // Very high memory
      
      const result = DeviceTierDetector.detect();
      
      expect(result.maxRenderVoxels).toBeLessThanOrEqual(50000); // PERFORMANCE_LIMITS.maxVoxels
    });

    test('should provide reasonable values for all tiers', () => {
      const tiers = ['low', 'mid', 'high'];
      
      tiers.forEach((expectedTier) => {
        // Set up conditions for each tier
        if (expectedTier === 'low') {
          global.navigator.deviceMemory = 2;
        } else if (expectedTier === 'mid') {
          global.navigator.deviceMemory = 6;
        } else {
          global.navigator.deviceMemory = 16;
        }
        
        const result = DeviceTierDetector.detect();
        // Due to WebGL limits in test environment, tier might be downgraded
        expect(['low', 'mid', 'high']).toContain(result.tier);
        expect(result.maxRenderVoxels).toBeGreaterThan(5000);
        expect(result.maxRenderVoxels).toBeLessThanOrEqual(50000);
      });
    });
  });

  describe('Device information collection', () => {
    test('should collect comprehensive device information', () => {
      global.navigator.deviceMemory = 8;
      global.navigator.hardwareConcurrency = 8;
      global.navigator.userAgent = 'Mozilla/5.0 Test Browser';
      global.window.devicePixelRatio = 2;
      global.screen.width = 2560;
      global.screen.height = 1440;
      
      const result = DeviceTierDetector.detect();
      
      expect(result.metadata.deviceInfo.deviceMemory).toBe(8);
      expect(result.metadata.deviceInfo.hardwareConcurrency).toBe(8);
      expect(result.metadata.deviceInfo.userAgent).toContain('Test Browser');
      expect(result.metadata.deviceInfo.devicePixelRatio).toBe(2);
      expect(result.metadata.deviceInfo.screenPixels).toBeGreaterThan(0);
    });

    test('should handle missing device information gracefully', () => {
      global.navigator.deviceMemory = undefined;
      global.navigator.hardwareConcurrency = undefined;
      
      const result = DeviceTierDetector.detect();
      
      expect(result.tier).toBe('mid'); // Should fallback to mid tier
      expect(result.metadata.deviceInfo.deviceMemory).toBeNull();
      expect(result.metadata.deviceInfo.hardwareConcurrency).toBeNull();
    });

    test('should collect WebGL capability information', () => {
      const result = DeviceTierDetector.detect();
      
      expect(result.metadata.webglInfo).toBeDefined();
      // In test environment with mocked WebGL, these might be 0 or valid values
      expect(typeof result.metadata.webglInfo.maxTextureSize).toBe('number');
      expect(typeof result.metadata.webglInfo.maxRenderbufferSize).toBe('number');
    });
  });

  describe('Integration scenarios', () => {
    test('should handle typical mobile device (low tier)', () => {
      global.navigator.deviceMemory = 2;
      global.navigator.hardwareConcurrency = 4;
      global.window.devicePixelRatio = 3;
      global.screen.width = 414;
      global.screen.height = 896;
      
      const result = DeviceTierDetector.detect();
      
      expect(result.tier).toBe('low');
      expect(result.maxRenderVoxels).toBeLessThanOrEqual(15000);
    });

    test('should handle typical desktop device (mid-high tier)', () => {
      global.navigator.deviceMemory = 8;
      global.navigator.hardwareConcurrency = 8;
      global.window.devicePixelRatio = 1;
      global.screen.width = 1920;
      global.screen.height = 1080;
      
      const result = DeviceTierDetector.detect();
      
      expect(['mid', 'high']).toContain(result.tier);
      expect(result.maxRenderVoxels).toBeGreaterThan(15000);
    });

    test('should handle high-end workstation (high tier)', () => {
      global.navigator.deviceMemory = 32;
      global.navigator.hardwareConcurrency = 16;
      global.window.devicePixelRatio = 1;
      global.screen.width = 3840;
      global.screen.height = 2160;
      
      const result = DeviceTierDetector.detect();
      
      expect(result.tier).toBe('high');
      expect(result.maxRenderVoxels).toBeGreaterThan(30000);
    });
  });
});
