import { TimeController } from '../../src/core/temporal/TimeController.js';
import * as Cesium from 'cesium';

// Mock Heatbox
class MockHeatbox {
    constructor() {
        this.data = null;
        this.options = {};
        this._options = { valueProperty: 'weight' };
        this._globalStats = null;
        this.clearCalled = false;
    }
    setData(data, options) {
        this.data = data;
        this.options = options;
    }
    clear() {
        this.clearCalled = true;
    }
}

// Mock Clock
class MockClock {
    constructor() {
        this.currentTime = Cesium.JulianDate.now();
        this.onTick = {
            addEventListener: jest.fn(() => jest.fn())
        };
    }
}

describe('Temporal Integration', () => {
    let viewer;
    let heatbox;
    let controller;

    const baseTime = Cesium.JulianDate.fromIso8601('2025-01-01T00:00:00Z');
    const mockData = [
        {
            start: '2025-01-01T00:00:00Z',
            stop: '2025-01-01T01:00:00Z',
            data: Array.from({ length: 2 }, () => ({
                position: { x: 139.7, y: 35.6, z: 10 },
                weight: 10
            }))
        },
        {
            start: '2025-01-01T01:00:00Z',
            stop: '2025-01-01T02:00:00Z',
            data: Array.from({ length: 4 }, () => ({
                position: { x: 139.8, y: 35.7, z: 20 },
                weight: 100
            }))
        }
    ];

    beforeEach(() => {
        viewer = {
            clock: new MockClock()
        };
        viewer.clock.currentTime = baseTime;
        heatbox = new MockHeatbox();
    });

    test('Global Scope: should calculate and pass global voxel-count stats', async () => {
        const options = {
            data: mockData,
            classificationScope: 'global'
        };

        controller = new TimeController(viewer, heatbox, options);
        await controller.activate();

        // Check if global stats were calculated and stored
        expect(heatbox._globalStats).toBeDefined();
        expect(heatbox._globalStats.min).toBe(2);
        expect(heatbox._globalStats.max).toBe(4);

        // Check if stats were passed to setData
        expect(heatbox.options._externalStats).toBeDefined();
        expect(heatbox.options._externalStats).toBe(heatbox._globalStats);
    });

    test('Per-Time Scope: should NOT pass global stats', () => {
        const options = {
            data: mockData,
            classificationScope: 'per-time' // or undefined (default)
        };

        controller = new TimeController(viewer, heatbox, options);
        controller.activate();

        // Global stats should not be calculated
        expect(heatbox._globalStats).toBeNull();

        // Stats should not be passed to setData
        expect(heatbox.options._externalStats).toBeUndefined();
    });

    test('Global Scope classifies voxel counts independently of valueProperty', async () => {
        heatbox.options.valueProperty = 'intensity';
        heatbox.options.classification = {
            enabled: true,
            scheme: 'quantile',
            classes: 2
        };

        const options = {
            data: [
                {
                    start: '2025-01-01T00:00:00Z',
                    stop: '2025-01-01T01:00:00Z',
                    data: Array.from({ length: 2 }, () => ({
                        position: { x: 139.7, y: 35.6, z: 10 },
                        weight: 5,
                        intensity: 100
                    }))
                },
                {
                    start: '2025-01-01T01:00:00Z',
                    stop: '2025-01-01T02:00:00Z',
                    data: Array.from({ length: 4 }, () => ({
                        position: { x: 139.8, y: 35.7, z: 20 },
                        weight: 10,
                        intensity: 300
                    }))
                }
            ],
            classificationScope: 'global'
        };

        controller = new TimeController(viewer, heatbox, options);
        await controller.activate();

        expect(heatbox._globalStats).toBeDefined();
        expect(heatbox._globalStats.min).toBe(2);
        expect(heatbox._globalStats.max).toBe(4);
        expect(heatbox._globalStats.minCount).toBe(2);
        expect(heatbox._globalStats.maxCount).toBe(4);
        expect(heatbox._globalStats.classification.breaks).toEqual([2, 3, 4]);
        expect(heatbox.options._externalStats).toBe(heatbox._globalStats);
    });
});
