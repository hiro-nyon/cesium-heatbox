/**
 * PerformanceOverlay unit tests
 * PerformanceOverlay単体テスト
 * 
 * v0.1.15 Phase 3: ADR-0011 - Enhanced with adaptive metrics support
 */

import { jest } from '@jest/globals';
import { PerformanceOverlay } from '../../src/utils/performanceOverlay.js';

describe('PerformanceOverlay', () => {
  let overlay;

  beforeEach(() => {
    // Create a fresh overlay instance for each test
    overlay = new PerformanceOverlay({ autoUpdate: false });
  });

  afterEach(() => {
    // Clean up overlay
    if (overlay) {
      overlay.destroy();
      overlay = null;
    }
  });

  describe('Constructor & Initialization', () => {
    test('Should initialize with default options', () => {
      const testOverlay = new PerformanceOverlay();
      
      expect(testOverlay.options.position).toBe('top-right');
      expect(testOverlay.options.fpsAveragingWindowMs).toBe(1000);
      expect(testOverlay.options.autoUpdate).toBe(true);
      expect(testOverlay.isVisible).toBe(false);
      
      testOverlay.destroy();
    });

    test('Should initialize with custom options', () => {
      const testOverlay = new PerformanceOverlay({
        position: 'bottom-left',
        fpsAveragingWindowMs: 2000,
        autoUpdate: false
      });
      
      expect(testOverlay.options.position).toBe('bottom-left');
      expect(testOverlay.options.fpsAveragingWindowMs).toBe(2000);
      expect(testOverlay.options.autoUpdate).toBe(false);
      
      testOverlay.destroy();
    });

    test('Should create DOM element on construction', () => {
      expect(overlay.element).toBeDefined();
      expect(overlay.element.id).toBe('cesium-heatbox-perf-overlay');
      expect(overlay.contentElement).toBeDefined();
    });
  });

  describe('Visibility Control', () => {
    test('Should show overlay', () => {
      overlay.show();
      
      expect(overlay.isVisible).toBe(true);
      expect(overlay.element.style.display).toBe('block');
    });

    test('Should hide overlay', () => {
      overlay.show();
      overlay.hide();
      
      expect(overlay.isVisible).toBe(false);
      expect(overlay.element.style.display).toBe('none');
    });

    test('Should toggle visibility', () => {
      expect(overlay.isVisible).toBe(false);
      
      overlay.toggle();
      expect(overlay.isVisible).toBe(true);
      
      overlay.toggle();
      expect(overlay.isVisible).toBe(false);
    });
  });

  describe('Statistics Update', () => {
    test('Should update with basic stats', () => {
      overlay.show();
      
      const stats = {
        totalVoxels: 1000,
        renderedVoxels: 500,
        topNCount: 100
      };
      
      overlay.update(stats);
      
      const content = overlay.contentElement.innerHTML;
      expect(content).toContain('Total: 1000');
      expect(content).toContain('Rendered: 500');
      expect(content).toContain('TopN: 100');
    });

    test('Should update with selection strategy info', () => {
      overlay.show();
      
      const stats = {
        totalVoxels: 1000,
        renderedVoxels: 800,
        selectionStrategy: 'density',
        coverageRatio: 0.85,
        renderBudgetTier: 'medium'
      };
      
      overlay.update(stats);
      
      const content = overlay.contentElement.innerHTML;
      expect(content).toContain('Selection: density');
      expect(content).toContain('Coverage: 85.0%');
      expect(content).toContain('Budget Tier: medium');
    });

    test('Should update with performance metrics', () => {
      overlay.show();
      
      const stats = {
        totalVoxels: 1000,
        renderedVoxels: 500,
        renderTimeMs: 45.5,
        memoryUsageMB: 32.8
      };
      
      overlay.update(stats);
      
      const content = overlay.contentElement.innerHTML;
      expect(content).toContain('Render Time: 45.5ms');
      expect(content).toContain('Memory: 32.8MB');
    });

    test('Should update with frame time and calculate FPS', () => {
      overlay.show();
      
      // Simulate multiple frames
      for (let i = 0; i < 10; i++) {
        overlay.update({}, 16.7); // ~60 FPS
      }
      
      const content = overlay.contentElement.innerHTML;
      expect(content).toContain('FPS:');
      expect(content).toContain('Frame:');
    });
  });

  describe('Phase 3: Adaptive Control Metrics (ADR-0011)', () => {
    test('Should display adaptive control metrics', () => {
      overlay.show();
      
      const stats = {
        totalVoxels: 1000,
        renderedVoxels: 800,
        adaptive: {
          denseModeCount: 350,
          emulationModeCount: 600,
          avgOutlineWidth: 1.85,
          overlapDetections: 45,
          zScaleAdjustments: 12
        }
      };
      
      overlay.update(stats);
      
      const content = overlay.contentElement.innerHTML;
      expect(content).toContain('Adaptive Control');
      expect(content).toContain('Dense Areas: 350');
      expect(content).toContain('43.8%'); // 350/800
      expect(content).toContain('Emulation: 600');
      expect(content).toContain('75.0%'); // 600/800
      expect(content).toContain('Avg Width: 1.85px');
      expect(content).toContain('Overlaps: 45');
      expect(content).toContain('5.6%'); // 45/800
      expect(content).toContain('Z-Scale Adj: 12');
    });

    test('Should handle adaptive metrics with zero rendered voxels', () => {
      overlay.show();
      
      const stats = {
        totalVoxels: 1000,
        renderedVoxels: 0,
        adaptive: {
          denseModeCount: 0,
          emulationModeCount: 0,
          avgOutlineWidth: 0,
          overlapDetections: 0
        }
      };
      
      overlay.update(stats);
      
      const content = overlay.contentElement.innerHTML;
      expect(content).toContain('0.0%');
    });

    test('Should skip Z-Scale Adj if zero', () => {
      overlay.show();
      
      const stats = {
        totalVoxels: 1000,
        renderedVoxels: 800,
        adaptive: {
          denseModeCount: 100,
          emulationModeCount: 200,
          avgOutlineWidth: 2.0,
          overlapDetections: 10,
          zScaleAdjustments: 0
        }
      };
      
      overlay.update(stats);
      
      const content = overlay.contentElement.innerHTML;
      expect(content).not.toContain('Z-Scale Adj:');
    });

    test('Should apply color coding for adaptive metrics', () => {
      overlay.show();
      
      const stats = {
        totalVoxels: 1000,
        renderedVoxels: 500,
        adaptive: {
          denseModeCount: 100,
          emulationModeCount: 200,
          avgOutlineWidth: 2.5,  // Within good range (1.0-3.0)
          overlapDetections: 0     // No overlaps = good
        }
      };
      
      overlay.update(stats);
      
      const content = overlay.contentElement.innerHTML;
      // Good width should be green (#4CAF50)
      expect(content).toContain('#4CAF50');
      // No overlaps should also be green
      expect(content).toContain('Overlaps: 0');
    });
  });

  describe('Auto Update', () => {
    test('Should start auto update when showing if enabled', () => {
      const autoOverlay = new PerformanceOverlay({ autoUpdate: true });
      
      autoOverlay.show();
      expect(autoOverlay.updateInterval).toBeDefined();
      
      autoOverlay.destroy();
    });

    test('Should not start auto update if disabled', () => {
      overlay.show();
      expect(overlay.updateInterval).toBeNull();
    });

    test('Should stop auto update when hiding', () => {
      const autoOverlay = new PerformanceOverlay({ autoUpdate: true });
      
      autoOverlay.show();
      const interval = autoOverlay.updateInterval;
      
      autoOverlay.hide();
      expect(autoOverlay.updateInterval).toBeNull();
      
      autoOverlay.destroy();
    });
  });

  describe('Cleanup', () => {
    test('Should remove element on destroy', () => {
      const element = overlay.element;
      expect(document.body.contains(element)).toBe(true);
      
      overlay.destroy();
      
      expect(document.body.contains(element)).toBe(false);
      expect(overlay.element).toBeNull();
      expect(overlay.contentElement).toBeNull();
    });

    test('Should stop auto update on destroy', () => {
      const autoOverlay = new PerformanceOverlay({ autoUpdate: true });
      autoOverlay.show();
      
      autoOverlay.destroy();
      
      expect(autoOverlay.updateInterval).toBeNull();
    });
  });

  describe('Position Styles', () => {
    test('Should apply top-right position by default', () => {
      const styles = overlay.element.style.cssText;
      expect(styles).toContain('top: 10px');
      expect(styles).toContain('right: 10px');
    });

    test('Should apply bottom-left position', () => {
      const testOverlay = new PerformanceOverlay({ position: 'bottom-left' });
      const styles = testOverlay.element.style.cssText;
      
      expect(styles).toContain('bottom: 10px');
      expect(styles).toContain('left: 10px');
      
      testOverlay.destroy();
    });

    test('Should fallback to top-right for invalid position', () => {
      const testOverlay = new PerformanceOverlay({ position: 'invalid-position' });
      const styles = testOverlay.element.style.cssText;
      
      expect(styles).toContain('top: 10px');
      expect(styles).toContain('right: 10px');
      
      testOverlay.destroy();
    });
  });
});
