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
            data: [{ weight: 10 }]
        },
        {
            start: '2025-01-01T01:00:00Z',
            stop: '2025-01-01T02:00:00Z',
            data: [{ weight: 100 }]
        }
    ];

    beforeEach(() => {
        viewer = {
            clock: new MockClock()
        };
        viewer.clock.currentTime = baseTime;
        heatbox = new MockHeatbox();
    });

    test('Global Scope: should calculate and pass global stats', () => {
        const options = {
            data: mockData,
            classificationScope: 'global'
        };

        controller = new TimeController(viewer, heatbox, options);
        controller.activate();

        // Check if global stats were calculated and stored
        expect(heatbox._globalStats).toBeDefined();
        expect(heatbox._globalStats.min).toBe(10);
        expect(heatbox._globalStats.max).toBe(100);

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

    test('Global Scope uses heatbox valueProperty when computing stats', () => {
        heatbox.options.valueProperty = 'intensity';

        const options = {
            data: [
                {
                    start: '2025-01-01T00:00:00Z',
                    stop: '2025-01-01T01:00:00Z',
                    data: [{ weight: 5, intensity: 100 }]
                },
                {
                    start: '2025-01-01T01:00:00Z',
                    stop: '2025-01-01T02:00:00Z',
                    data: [{ weight: 10, intensity: 300 }]
                }
            ],
            classificationScope: 'global'
        };

        controller = new TimeController(viewer, heatbox, options);
        controller.activate();

        expect(heatbox._globalStats).toBeDefined();
        expect(heatbox._globalStats.min).toBe(100);
        expect(heatbox._globalStats.max).toBe(300);
        expect(heatbox.options._externalStats).toBe(heatbox._globalStats);
    });
});
