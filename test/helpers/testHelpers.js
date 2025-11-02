/**
 * Shared test helpers for CesiumJS Heatbox test suite
 * Centralizes common test utilities to reduce code duplication
 */

/**
 * Create a mock CesiumJS viewer for testing
 * @returns {Object} Mock viewer object
 */
export function createMockViewer() {
  return {
    scene: {
      canvas: { 
        getContext: jest.fn(() => ({})),
        clientWidth: 800,
        clientHeight: 600
      },
      postRender: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      },
      globe: { show: true },
      primitives: {
        add: jest.fn(),
        remove: jest.fn(),
        removeAll: jest.fn()
      }
    },
    entities: {
      add: jest.fn().mockReturnValue({ id: 'mock-entity' }),
      remove: jest.fn(),
      removeAll: jest.fn()
    },
    camera: {
      flyTo: jest.fn(),
      setView: jest.fn(),
      position: { x: 0, y: 0, z: 1000000 },
      direction: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 }
    }
  };
}

/**
 * Enhanced console spy helper for deprecation warnings
 * @param {jest.SpyInstance} consoleSpy - Jest spy on console.warn
 * @returns {Object} Helper functions for warning assertions
 */
export function createWarningAssertions(consoleSpy) {
  const expectWarnContains = (substring) => {
    const calls = consoleSpy.mock.calls.map(args => 
      args.map(a => String(a)).join(' ')
    );
    expect(calls.some(line => line.includes(substring))).toBe(true);
  };

  const expectNoWarnFor = (substring) => {
    const calls = consoleSpy.mock.calls.map(args => 
      args.map(a => String(a)).join(' ')
    );
    expect(calls.some(line => line.includes(substring))).toBe(false);
  };

  const getWarningCount = () => consoleSpy.mock.calls.length;

  const getAllWarnings = () => consoleSpy.mock.calls.map(args => 
    args.map(a => String(a)).join(' ')
  );

  return {
    expectWarnContains,
    expectNoWarnFor, 
    getWarningCount,
    getAllWarnings
  };
}

/**
 * Generate test data for performance and integration tests
 * @param {number} count - Number of data points
 * @param {Object} options - Generation options
 * @returns {Array} Array of mock entities
 */
export function generateTestData(count, options = {}) {
  const {
    clustered = true,
    valueRange = [0, 100],
    spatialRange = { x: [0, 2000], y: [0, 2000], z: [0, 500] }
  } = options;

  const entities = [];
  
  for (let i = 0; i < count; i++) {
    // Create realistic clustered or random data
    const isCluster = clustered && i % 10 === 0;
    const baseValue = isCluster 
      ? valueRange[0] + 0.8 * (valueRange[1] - valueRange[0]) + Math.random() * 0.2 * (valueRange[1] - valueRange[0])
      : valueRange[0] + Math.random() * (valueRange[1] - valueRange[0]);
    
    entities.push({
      id: `test-entity-${i}`,
      position: {
        x: spatialRange.x[0] + Math.random() * (spatialRange.x[1] - spatialRange.x[0]),
        y: spatialRange.y[0] + Math.random() * (spatialRange.y[1] - spatialRange.y[0]),
        z: spatialRange.z[0] + Math.random() * (spatialRange.z[1] - spatialRange.z[0])
      },
      properties: {
        value: baseValue
      }
    });
  }
  
  return entities;
}

/**
 * Generate mock entities with geographic coordinates (lng/lat/alt)
 * @param {number} count - Number of entities
 * @param {Object} bounds - Geographic bounds
 * @returns {Array} Array of mock entities with geographic positions
 */
export function generateMockEntities(count, bounds = {}) {
  const {
    minLon = 139.69,
    maxLon = 139.71,
    minLat = 35.68,
    maxLat = 35.70,
    minAlt = 0,
    maxAlt = 200
  } = bounds;

  const entities = [];
  
  for (let i = 0; i < count; i++) {
    entities.push({
      id: `mock-entity-${i}`,
      position: {
        x: minLon + Math.random() * (maxLon - minLon),
        y: minLat + Math.random() * (maxLat - minLat),
        z: minAlt + Math.random() * (maxAlt - minAlt)
      },
      properties: {
        value: Math.random() * 100
      }
    });
  }
  
  return entities;
}

/**
 * Performance measurement helper
 * @param {Function} fn - Function to measure
 * @returns {Promise<{result: any, timeMs: number}>}
 */
export async function measurePerformance(fn) {
  const startTime = performance.now();
  const result = await fn();
  const timeMs = performance.now() - startTime;
  return { result, timeMs };
}

/**
 * Wait for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Common test configuration for different scenarios
 */
export const TEST_CONFIGS = {
  // Migration test configurations
  LEGACY_V011: {
    fitViewOptions: { pitch: -45, heading: 0 },
    outlineEmulation: 'topn',
    outlineWidthPreset: 'uniform'
  },
  
  NEW_V012: {
    fitViewOptions: { pitchDegrees: -45, headingDegrees: 0 },
    outlineRenderMode: 'standard',
    emulationScope: 'topn',
    outlineWidthPreset: 'medium'
  },

  // Performance test profiles
  PROFILES: ['mobile-fast', 'desktop-balanced', 'dense-data', 'sparse-data'],
  
  // Data size variants
  DATA_SIZES: {
    small: 100,
    medium: 1000,
    large: 5000
  }
};
