/**
 * Test suite for ViewFitter
 * ViewFitter のテストスイート
 */

// Cesiumモジュールをモック
jest.mock('cesium', () => ({
  Cartesian3: {
    fromDegrees: jest.fn((lon, lat, height) => ({ lon, lat, height }))
  },
  Rectangle: {
    fromDegrees: jest.fn((west, south, east, north) => ({ west, south, east, north }))
  },
  Math: {
    toRadians: jest.fn(degrees => degrees * Math.PI / 180)
  }
}));

import { ViewFitter } from '../../src/utils/ViewFitter.js';

describe('ViewFitter', () => {
  let mockViewer;
  let sampleBounds;
  
  beforeEach(() => {
    // モックビューアの作成
    mockViewer = {
      camera: {
        flyTo: jest.fn((options) => {
          // flyToの完了をシミュレート
          setTimeout(() => {
            if (options.complete) options.complete();
          }, 10);
        })
      }
    };
    
    // サンプル境界データ
    sampleBounds = {
      minLon: 139.7,
      maxLon: 139.8,
      minLat: 35.6,
      maxLat: 35.7,
      minAlt: 0,
      maxAlt: 100
    };
    
    // モックのリセット
    jest.clearAllMocks();
  });
  
  describe('Basic functionality', () => {
    test('should fit view to valid bounds', async () => {
      await ViewFitter.fitToBounds(mockViewer, sampleBounds);
      
      expect(mockViewer.camera.flyTo).toHaveBeenCalled();
    });
    
    test('should reject invalid parameters', async () => {
      await expect(ViewFitter.fitToBounds(null, sampleBounds))
        .rejects.toThrow('Viewer and bounds are required');
      
      await expect(ViewFitter.fitToBounds(mockViewer, null))
        .rejects.toThrow('Viewer and bounds are required');
    });
    
    test('should handle invalid bounds gracefully', async () => {
      const invalidBounds = {
        minLon: 'invalid',
        maxLon: 139.8,
        minLat: 35.6,
        maxLat: 35.7,
        minAlt: 0,
        maxAlt: 100
      };
      
      // 無効な境界の場合は何もしない（エラーを投げない）
      await ViewFitter.fitToBounds(mockViewer, invalidBounds);
      expect(mockViewer.camera.flyTo).not.toHaveBeenCalled();
    });
  });
  
  describe('Bounds validation', () => {
    test('should validate correct bounds', () => {
      const isValid = ViewFitter._isValidBounds(sampleBounds);
      expect(isValid).toBe(true);
    });
    
    test('should reject bounds with NaN values', () => {
      const invalidBounds = { ...sampleBounds, minLon: NaN };
      const isValid = ViewFitter._isValidBounds(invalidBounds);
      expect(isValid).toBe(false);
    });
    
    test('should reject bounds with invalid ranges', () => {
      const invalidBounds = { ...sampleBounds, minLon: 140, maxLon: 139 };
      const isValid = ViewFitter._isValidBounds(invalidBounds);
      expect(isValid).toBe(false);
    });
    
    test('should reject undefined bounds', () => {
      const isValid = ViewFitter._isValidBounds(undefined);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Data range calculation', () => {
    test('should calculate data range in meters', () => {
      const dataRange = ViewFitter._calculateDataRange(sampleBounds);
      
      expect(dataRange).toMatchObject({
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number)
      });
      
      expect(dataRange.x).toBeGreaterThan(0);
      expect(dataRange.y).toBeGreaterThan(0);
      expect(dataRange.z).toBeGreaterThan(0);
    });
    
    test('should handle minimal altitude difference', () => {
      const flatBounds = { ...sampleBounds, minAlt: 50, maxAlt: 50 };
      const dataRange = ViewFitter._calculateDataRange(flatBounds);
      
      expect(dataRange.z).toBe(1); // 最小1mが保証される
    });
    
    test('should calculate reasonable values for different locations', () => {
      // 赤道付近
      const equatorBounds = {
        minLon: 0, maxLon: 1,
        minLat: 0, maxLat: 1,
        minAlt: 0, maxAlt: 100
      };
      
      const equatorRange = ViewFitter._calculateDataRange(equatorBounds);
      expect(equatorRange.x).toBeGreaterThan(100000); // 約111km
      expect(equatorRange.y).toBeGreaterThan(100000); // 約111km
    });
  });
  
  describe('Options handling', () => {
    test('should apply default options', async () => {
      await ViewFitter.fitToBounds(mockViewer, sampleBounds);
      
      const flyToCall = mockViewer.camera.flyTo.mock.calls[0][0];
      expect(flyToCall.duration).toBeDefined();
      expect(flyToCall.destination).toBeDefined();
      expect(flyToCall.orientation).toBeDefined();
    });
    
    test('should respect custom options', async () => {
      const customOptions = {
        paddingPercent: 0.2,
        pitchDegrees: -60,
        headingDegrees: 45,
        duration: 3.0,
        maximumHeight: 30000,
        minimumHeight: 200
      };
      
      await ViewFitter.fitToBounds(mockViewer, sampleBounds, customOptions);
      
      expect(mockViewer.camera.flyTo).toHaveBeenCalled();
      const flyToCall = mockViewer.camera.flyTo.mock.calls[0][0];
      expect(flyToCall.duration).toBe(3.0);
    });
    
    test('should clamp padding to valid range', async () => {
      const extremeOptions = {
        paddingPercent: 2.0 // 200% (should be clamped to 50%)
      };
      
      await ViewFitter.fitToBounds(mockViewer, sampleBounds, extremeOptions);
      expect(mockViewer.camera.flyTo).toHaveBeenCalled();
    });
  });
  
  describe('Special data range handling', () => {
    test('should handle minimal data range', async () => {
      const minimalBounds = {
        minLon: 139.7500,
        maxLon: 139.7501, // 非常に小さな範囲
        minLat: 35.6500,
        maxLat: 35.6501,
        minAlt: 0,
        maxAlt: 1
      };
      
      await ViewFitter.fitToBounds(mockViewer, minimalBounds);
      expect(mockViewer.camera.flyTo).toHaveBeenCalled();
    });
    
    test('should handle large data range', async () => {
      const largeBounds = {
        minLon: 130,
        maxLon: 150, // 大きな範囲
        minLat: 30,
        maxLat: 40,
        minAlt: 0,
        maxAlt: 5000
      };
      
      await ViewFitter.fitToBounds(mockViewer, largeBounds);
      expect(mockViewer.camera.flyTo).toHaveBeenCalled();
    });
  });
  
  describe('Camera height calculation', () => {
    test('should calculate reasonable camera height', () => {
      const maxRange = 10000; // 10km
      const paddingMeters = 1000; // 1km
      const options = {
        paddingPercent: 0.1,
        pitchDegrees: -45,
        minimumHeight: 100,
        maximumHeight: 50000
      };
      
      const height = ViewFitter._calculateOptimalCameraHeight(maxRange, paddingMeters, options);
      
      expect(height).toBeGreaterThan(options.minimumHeight);
      expect(height).toBeLessThan(options.maximumHeight);
      expect(height).toBeGreaterThan(maxRange); // カメラは少なくともデータ範囲より高い位置
    });
    
    test('should respect height limits', () => {
      const maxRange = 100000; // 100km (非常に大きな範囲)
      const paddingMeters = 10000;
      const options = {
        minimumHeight: 1000,
        maximumHeight: 20000,
        pitchDegrees: -45
      };
      
      const height = ViewFitter._calculateOptimalCameraHeight(maxRange, paddingMeters, options);
      
      expect(height).toBeLessThanOrEqual(options.maximumHeight);
      expect(height).toBeGreaterThanOrEqual(options.minimumHeight);
    });
  });
  
  describe('Static utility methods', () => {
    test('should create Rectangle from bounds', () => {
      const Cesium = require('cesium');
      const rectangle = ViewFitter.createRectangleFromBounds(sampleBounds);
      
      expect(Cesium.Rectangle.fromDegrees).toHaveBeenCalledWith(
        sampleBounds.minLon,
        sampleBounds.minLat,
        sampleBounds.maxLon,
        sampleBounds.maxLat
      );
      expect(rectangle).toBeDefined();
    });
    
    test('should calculate camera position', () => {
      const cameraInfo = ViewFitter.calculateCameraPosition(sampleBounds);
      
      expect(cameraInfo).toMatchObject({
        position: expect.any(Object),
        orientation: expect.objectContaining({
          heading: expect.any(Number),
          pitch: expect.any(Number),
          roll: expect.any(Number)
        }),
        metadata: expect.objectContaining({
          dataRange: expect.any(Number),
          cameraHeight: expect.any(Number),
          paddingMeters: expect.any(Number)
        })
      });
    });
    
    test('should handle custom view options in calculateCameraPosition', () => {
      const Cesium = require('cesium');
      const viewOptions = {
        paddingPercent: 0.2,
        pitchDegrees: -30,
        headingDegrees: 90
      };
      
      const cameraInfo = ViewFitter.calculateCameraPosition(sampleBounds, viewOptions);
      
      expect(Cesium.Math.toRadians).toHaveBeenCalledWith(90); // heading
      expect(Cesium.Math.toRadians).toHaveBeenCalledWith(-30); // pitch
      expect(cameraInfo.metadata.dataRange).toBeGreaterThan(0);
    });
  });
  
  describe('Error handling', () => {
    test('should handle camera flyTo errors', async () => {
      mockViewer.camera.flyTo = jest.fn(() => {
        throw new Error('Camera error');
      });
      
      await expect(ViewFitter.fitToBounds(mockViewer, sampleBounds))
        .rejects.toThrow('Camera error');
    });
    
    test('should handle invalid bounds in utility methods', () => {
      expect(() => ViewFitter.createRectangleFromBounds(null))
        .toThrow('Invalid bounds provided');
      
      expect(() => ViewFitter.calculateCameraPosition(null))
        .toThrow('Invalid bounds provided');
    });
  });
  
  describe('Promise handling', () => {
    test('should resolve when camera movement completes', async () => {
      const promise = ViewFitter.fitToBounds(mockViewer, sampleBounds);
      expect(promise).toBeInstanceOf(Promise);
      
      await expect(promise).resolves.toBeUndefined();
    });
    
    test('should handle camera movement cancellation', async () => {
      mockViewer.camera.flyTo = jest.fn((options) => {
        setTimeout(() => {
          if (options.cancel) options.cancel();
        }, 10);
      });
      
      await expect(ViewFitter.fitToBounds(mockViewer, sampleBounds))
        .resolves.toBeUndefined();
    });
  });
});
