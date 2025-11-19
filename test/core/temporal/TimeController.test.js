import { TimeController } from '../../../src/core/temporal/TimeController.js';
import * as Cesium from 'cesium';

// Mock Heatbox
class MockHeatbox {
    constructor() {
        this.data = null;
        this.options = {};
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
    tick(seconds) {
        this.currentTime = Cesium.JulianDate.addSeconds(
            this.currentTime,
            seconds,
            new Cesium.JulianDate()
        );
    }
}

describe('TimeController', () => {
    let viewer;
    let heatbox;
    let controller;
    let options;

    const baseTime = Cesium.JulianDate.fromIso8601('2025-01-01T00:00:00Z');

    beforeEach(() => {
        viewer = {
            clock: new MockClock()
        };
        viewer.clock.currentTime = baseTime;

        heatbox = new MockHeatbox();

        options = {
            data: [
                {
                    start: '2025-01-01T00:00:00Z',
                    stop: '2025-01-01T01:00:00Z',
                    data: [{ id: 1 }]
                }
            ],
            updateInterval: 'frame'
        };

        controller = new TimeController(viewer, heatbox, options);
    });

    afterEach(() => {
        if (controller) {
            controller.deactivate();
        }
    });

    test('should register listener on activate', () => {
        controller.activate();
        expect(viewer.clock.onTick.addEventListener).toHaveBeenCalled();
    });

    test('should update heatbox on tick', () => {
        controller.activate();

        // Tick within range
        controller._onTick(viewer.clock);
        expect(heatbox.data).not.toBeNull();
        expect(heatbox.data[0].id).toBe(1);
    });

    test('should not update if data has not changed', () => {
        controller.activate();

        // First tick
        controller._onTick(viewer.clock);
        heatbox.data = null; // Reset to verify it's NOT called again

        // Second tick (same time)
        controller._onTick(viewer.clock);
        expect(heatbox.data).toBeNull(); // Should not have been updated
    });

    test('should handle out of range behavior (clear)', () => {
        options.outOfRangeBehavior = 'clear';
        controller = new TimeController(viewer, heatbox, options);
        controller.activate();

        // Move time out of range
        viewer.clock.tick(7200); // +2 hours
        controller._onTick(viewer.clock);

        expect(heatbox.clearCalled).toBe(true);
    });
});
