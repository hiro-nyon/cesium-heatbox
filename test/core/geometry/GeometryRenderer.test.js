/**
 * GeometryRenderer unit tests
 * GeometryRenderer単体テスト
 * 
 * ADR-0009 Phase 4: VoxelRenderer責任分離 - ジオメトリ描画機能
 * @version 0.1.11-alpha
 */

import { jest } from '@jest/globals';
import { GeometryRenderer } from '../../../src/core/geometry/GeometryRenderer.js';

// Mock Logger
jest.mock('../../../src/utils/logger.js', () => ({
  Logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock Cesium
jest.mock('cesium', () => ({
  Cartesian3: jest.fn((x, y, z) => ({ x, y, z })),
  Color: {
    TRANSPARENT: { withAlpha: jest.fn(opacity => ({ alpha: opacity })) },
    GRAY: { withAlpha: jest.fn(opacity => ({ alpha: opacity })) }
  },
  JulianDate: {
    now: jest.fn(() => 'now')
  }
}));

// Add static methods to Cartesian3 after mocking
const Cesium = require('cesium');
Cesium.Cartesian3.fromDegrees = jest.fn((lon, lat, alt) => ({ x: lon, y: lat, z: alt }));

describe('GeometryRenderer', () => {
  let mockViewer;
  let geometryRenderer;
  let mockEntity;

  beforeEach(() => {
    mockEntity = {
      id: 'test-entity',
      properties: { type: 'voxel' },
      position: { getValue: jest.fn(() => ({ x: 0, y: 0, z: 0 })) },
      isDestroyed: jest.fn(() => false)
    };

    mockViewer = {
      entities: {
        add: jest.fn(() => mockEntity),
        remove: jest.fn()
      }
    };

    geometryRenderer = new GeometryRenderer(mockViewer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor & Initialization', () => {
    test('Should initialize with default options', () => {
      const renderer = new GeometryRenderer(mockViewer);

      expect(renderer.viewer).toBe(mockViewer);
      expect(renderer.options).toEqual({
        wireframeOnly: false,
        showOutline: true,
        outlineWidth: 2,
        outlineInset: 0,
        outlineInsetMode: 'all',
        outlineRenderMode: 'standard',
        enableThickFrames: false
      });
      expect(renderer.entities).toEqual([]);
    });

    test('Should initialize with custom options', () => {
      const customOptions = {
        wireframeOnly: true,
        outlineWidth: 5,
        outlineInsetMode: 'topn'
      };

      const renderer = new GeometryRenderer(mockViewer, customOptions);

      expect(renderer.options.wireframeOnly).toBe(true);
      expect(renderer.options.outlineWidth).toBe(5);
      expect(renderer.options.outlineInsetMode).toBe('topn');
      expect(renderer.options.showOutline).toBe(true); // default preserved
    });
  });

  describe('Voxel Box Creation', () => {
    test('Should create voxel box with correct configuration', () => {
      const config = {
        centerLon: 139.7,
        centerLat: 35.6,
        centerAlt: 100,
        cellSizeX: 10,
        cellSizeY: 20,
        boxHeight: 30,
        color: { withAlpha: jest.fn(opacity => ({ alpha: opacity })) },
        opacity: 0.8,
        shouldShowOutline: true,
        outlineColor: { withAlpha: jest.fn(opacity => ({ alpha: opacity })) },
        outlineWidth: 2,
        voxelInfo: { x: 1, y: 2, z: 3, count: 10 },
        voxelKey: 'test-key'
      };

      const entity = geometryRenderer.createVoxelBox(config);

      expect(mockViewer.entities.add).toHaveBeenCalled();
      expect(entity).toBe(mockEntity);
      expect(geometryRenderer.entities).toContain(entity);
    });

    test('Should handle wireframe mode correctly', () => {
      geometryRenderer.options.wireframeOnly = true;

      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        cellSizeX: 10, cellSizeY: 10, boxHeight: 10,
        color: { withAlpha: jest.fn() },
        opacity: 0.5,
        shouldShowOutline: false,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 1,
        voxelInfo: { x: 0, y: 0, z: 0, count: 1 },
        voxelKey: 'wireframe-key'
      };

      geometryRenderer.createVoxelBox(config);

      const callArgs = mockViewer.entities.add.mock.calls[0][0];
      expect(callArgs.box.fill).toBe(false);
    });

    test('Should handle thick outline emulation', () => {
      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        cellSizeX: 10, cellSizeY: 10, boxHeight: 10,
        color: { withAlpha: jest.fn() },
        opacity: 0.5,
        shouldShowOutline: true,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 5,
        voxelInfo: { x: 0, y: 0, z: 0, count: 1 },
        voxelKey: 'thick-key',
        emulateThick: true
      };

      geometryRenderer.createVoxelBox(config);

      const callArgs = mockViewer.entities.add.mock.calls[0][0];
      expect(callArgs.box.outline).toBe(false); // Should disable standard outline for emulation
    });
  });

  describe('Inset Outline Creation', () => {
    test('Should create inset outline with correct dimensions', () => {
      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        baseSizeX: 100, baseSizeY: 100, baseSizeZ: 100,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 2,
        voxelKey: 'inset-key',
        insetAmount: 5
      };

      const entity = geometryRenderer.createInsetOutline(config);

      expect(mockViewer.entities.add).toHaveBeenCalled();
      expect(entity).toBe(mockEntity);
      expect(geometryRenderer.entities).toContain(entity);

      const callArgs = mockViewer.entities.add.mock.calls[0][0];
      expect(callArgs.box.fill).toBe(false);
      expect(callArgs.box.outline).toBe(true);
    });

    test('Should respect inset limits (20% of each dimension)', () => {
      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        baseSizeX: 10, baseSizeY: 10, baseSizeZ: 10,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 2,
        voxelKey: 'limit-key',
        insetAmount: 10 // Large amount that should be limited
      };

      geometryRenderer.createInsetOutline(config);

      // Should still create entity despite large inset
      expect(mockViewer.entities.add).toHaveBeenCalled();
    });

    test('Should use default inset when amount not provided', () => {
      geometryRenderer.options.outlineInset = 3;

      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        baseSizeX: 100, baseSizeY: 100, baseSizeZ: 100,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 2,
        voxelKey: 'default-key'
        // insetAmount not provided
      };

      geometryRenderer.createInsetOutline(config);

      expect(mockViewer.entities.add).toHaveBeenCalled();
    });
  });

  describe('Edge Polylines Creation', () => {
    test('Should create 12 edge polylines for a box', () => {
      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        cellSizeX: 10, cellSizeY: 10, boxHeight: 10,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 3,
        voxelKey: 'polyline-key'
      };

      const polylines = geometryRenderer.createEdgePolylines(config);

      expect(polylines).toHaveLength(12); // 12 edges in a box
      expect(mockViewer.entities.add).toHaveBeenCalledTimes(12);
      expect(geometryRenderer.entities).toHaveLength(12);
    });

    test('Should configure polylines with correct properties', () => {
      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        cellSizeX: 10, cellSizeY: 10, boxHeight: 10,
        outlineColor: 'red',
        outlineWidth: 4,
        voxelKey: 'props-key'
      };

      geometryRenderer.createEdgePolylines(config);

      const callArgs = mockViewer.entities.add.mock.calls[0][0];
      expect(callArgs.polyline.width).toBe(4);
      expect(callArgs.polyline.material).toBe('red');
      expect(callArgs.properties.type).toBe('voxel-edge-polyline');
      expect(callArgs.properties.parentKey).toBe('props-key');
    });
  });

  describe('Thick Outline Frames Creation', () => {
    test('Should create frame entities', () => {
      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        outerX: 20, outerY: 20, outerZ: 20,
        innerX: 10, innerY: 10, innerZ: 10,
        frameColor: { withAlpha: jest.fn(opacity => ({ alpha: opacity })) },
        voxelKey: 'frame-key'
      };

      const frames = geometryRenderer.createThickOutlineFrames(config);

      expect(frames.length).toBeGreaterThan(0);
      expect(mockViewer.entities.add).toHaveBeenCalled();
    });
  });

  describe('Voxel Description Generation', () => {
    test('Should generate HTML description', () => {
      const voxelInfo = { x: 1, y: 2, z: 3, count: 42 };
      const voxelKey = 'desc-key';

      const description = geometryRenderer.createVoxelDescription(voxelInfo, voxelKey);

      expect(description).toContain('ボクセル [1, 2, 3]');
      expect(description).toContain('42');
      expect(description).toContain('desc-key');
      expect(description).toContain('v0.1.11-alpha GeometryRenderer');
    });
  });

  describe('Inset Outline Application Logic', () => {
    test('Should apply inset outline for "all" mode', () => {
      geometryRenderer.options.outlineInsetMode = 'all';

      expect(geometryRenderer.shouldApplyInsetOutline(true)).toBe(true);
      expect(geometryRenderer.shouldApplyInsetOutline(false)).toBe(true);
    });

    test('Should apply inset outline only for TopN in "topn" mode', () => {
      geometryRenderer.options.outlineInsetMode = 'topn';

      expect(geometryRenderer.shouldApplyInsetOutline(true)).toBe(true);
      expect(geometryRenderer.shouldApplyInsetOutline(false)).toBe(false);
    });

    test('Should not apply inset outline in "none" mode', () => {
      geometryRenderer.options.outlineInsetMode = 'none';

      expect(geometryRenderer.shouldApplyInsetOutline(true)).toBe(false);
      expect(geometryRenderer.shouldApplyInsetOutline(false)).toBe(false);
    });
  });

  describe('Entity Management', () => {
    test('Should track created entities', () => {
      expect(geometryRenderer.getEntityCount()).toBe(0);

      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        cellSizeX: 10, cellSizeY: 10, boxHeight: 10,
        color: { withAlpha: jest.fn() },
        opacity: 0.5,
        shouldShowOutline: false,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 1,
        voxelInfo: { x: 0, y: 0, z: 0, count: 1 },
        voxelKey: 'track-key'
      };

      geometryRenderer.createVoxelBox(config);

      expect(geometryRenderer.getEntityCount()).toBe(1);
    });

    test('Should clear all entities', () => {
      // Create some entities
      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        cellSizeX: 10, cellSizeY: 10, boxHeight: 10,
        color: { withAlpha: jest.fn() },
        opacity: 0.5,
        shouldShowOutline: false,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 1,
        voxelInfo: { x: 0, y: 0, z: 0, count: 1 },
        voxelKey: 'clear-key'
      };

      geometryRenderer.createVoxelBox(config);
      geometryRenderer.createVoxelBox({ ...config, voxelKey: 'clear-key-2' });

      expect(geometryRenderer.getEntityCount()).toBe(2);

      geometryRenderer.clear();

      expect(mockViewer.entities.remove).toHaveBeenCalledTimes(2);
      expect(geometryRenderer.getEntityCount()).toBe(0);
    });

    test('Should handle entity removal errors gracefully', () => {
      // Create entity that fails to remove
      const failingEntity = {
        ...mockEntity,
        isDestroyed: jest.fn(() => true) // Already destroyed
      };

      geometryRenderer.entities.push(failingEntity);

      // Should not throw
      expect(() => geometryRenderer.clear()).not.toThrow();
      expect(geometryRenderer.getEntityCount()).toBe(0);
    });

    test('Should handle null/undefined entities in clear', () => {
      // Add null entity
      geometryRenderer.entities.push(null);
      geometryRenderer.entities.push(undefined);

      // Should not throw
      expect(() => geometryRenderer.clear()).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    test('Should update options correctly', () => {
      const newOptions = {
        wireframeOnly: true,
        outlineWidth: 10
      };

      geometryRenderer.updateOptions(newOptions);

      expect(geometryRenderer.options.wireframeOnly).toBe(true);
      expect(geometryRenderer.options.outlineWidth).toBe(10);
      expect(geometryRenderer.options.showOutline).toBe(true); // unchanged
    });

    test('Should get current configuration', () => {
      geometryRenderer.entities.push(mockEntity);

      const config = geometryRenderer.getConfiguration();

      expect(config.entityCount).toBe(1);
      expect(config.version).toBe('0.1.11-alpha');
      expect(config.phase).toBe('ADR-0009 Phase 4');
      expect(config.wireframeOnly).toBe(false);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('Should handle viewer.entities.add failures gracefully', () => {
      mockViewer.entities.add.mockImplementation(() => {
        throw new Error('Add failed');
      });

      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        cellSizeX: 10, cellSizeY: 10, boxHeight: 10,
        color: { withAlpha: jest.fn() },
        opacity: 0.5,
        shouldShowOutline: false,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 1,
        voxelInfo: { x: 0, y: 0, z: 0, count: 1 },
        voxelKey: 'fail-key'
      };

      expect(() => geometryRenderer.createVoxelBox(config)).toThrow('Add failed');
    });

    test('Should handle zero/negative dimensions', () => {
      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        cellSizeX: 0, cellSizeY: -5, boxHeight: 10,
        color: { withAlpha: jest.fn() },
        opacity: 0.5,
        shouldShowOutline: false,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: 1,
        voxelInfo: { x: 0, y: 0, z: 0, count: 1 },
        voxelKey: 'zero-key'
      };

      // Should not throw
      expect(() => geometryRenderer.createVoxelBox(config)).not.toThrow();
    });

    test('Should handle negative outline width', () => {
      const config = {
        centerLon: 0, centerLat: 0, centerAlt: 0,
        baseSizeX: 10, baseSizeY: 10, baseSizeZ: 10,
        outlineColor: { withAlpha: jest.fn() },
        outlineWidth: -5,
        voxelKey: 'negative-width-key'
      };

      geometryRenderer.createInsetOutline(config);

      const callArgs = mockViewer.entities.add.mock.calls[0][0];
      expect(callArgs.box.outlineWidth).toBeGreaterThanOrEqual(0);
    });
  });
});
