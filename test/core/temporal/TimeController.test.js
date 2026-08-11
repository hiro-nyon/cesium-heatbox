import { TimeController } from '../../../src/core/temporal/TimeController.js';
import * as Cesium from 'cesium';

// Mock Heatbox
class MockHeatbox {
    constructor() {
        this.data = null;
        this.options = {};
        this.clearCalled = false;
        this.setData = jest.fn((data, options) => {
            this.data = data;
            this.options = options;
        });
    }
    clear() {
        this.clearCalled = true;
    }
}

// Mock Clock
class MockClock {
    constructor() {
        this.currentTime = Cesium.JulianDate.now();
        this._listener = null;
        this.onTick = {
            addEventListener: jest.fn((listener) => {
                this._listener = listener;
                return () => {
                    this._listener = null;
                };
            })
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

class MockCamera {
    constructor() {
        this._listener = null;
        this.changed = {
            addEventListener: jest.fn((listener) => {
                this._listener = listener;
                return () => {
                    this._listener = null;
                };
            })
        };
    }

    fireChanged() {
        this._listener?.();
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
            clock: new MockClock(),
            camera: new MockCamera()
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

    test('should clear immediately when activated out of range', () => {
        options.outOfRangeBehavior = 'clear';
        controller = new TimeController(viewer, heatbox, options);

        // Set clock outside data range before activation
        viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('2025-01-01T05:00:00Z');

        controller.activate(); // Initial tick should clear immediately
        expect(heatbox.clearCalled).toBe(true);
    });

    test('should throttle updates when updateInterval is numeric', () => {
        options.updateInterval = 200;
        options.data = [
            {
                start: '2025-01-01T00:00:00Z',
                stop: '2025-01-01T01:00:00Z',
                data: [{ id: 'early' }]
            },
            {
                start: '2025-01-01T01:00:00Z',
                stop: '2025-01-01T02:00:00Z',
                data: [{ id: 'late' }]
            }
        ];
        const nowSpy = jest.spyOn(Date, 'now');
        nowSpy.mockReturnValue(0);

        controller = new TimeController(viewer, heatbox, options);
        controller.activate();
        heatbox.setData.mockClear();

        nowSpy.mockReturnValue(50);
        controller._onTick(viewer.clock);
        expect(heatbox.setData).not.toHaveBeenCalled();

        viewer.clock.currentTime = Cesium.JulianDate.addSeconds(
            viewer.clock.currentTime,
            3700,
            new Cesium.JulianDate()
        );
        nowSpy.mockReturnValue(250);
        controller._onTick(viewer.clock);
        expect(heatbox.setData).toHaveBeenCalledTimes(1);

        nowSpy.mockRestore();
    });

    test('should update when clock moves backwards (reverse playback)', () => {
        options.data = [
            {
                start: '2025-01-01T00:00:00Z',
                stop: '2025-01-01T01:00:00Z',
                data: [{ id: 'early' }]
            },
            {
                start: '2025-01-01T01:00:00Z',
                stop: '2025-01-01T02:00:00Z',
                data: [{ id: 'late' }]
            }
        ];
        controller = new TimeController(viewer, heatbox, options);
        controller.activate();
        heatbox.setData.mockClear();

        viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('2025-01-01T01:30:00Z');
        controller._onTick(viewer.clock);
        expect(heatbox.setData).toHaveBeenLastCalledWith(
            [{ id: 'late' }],
            expect.objectContaining({})
        );

        viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('2025-01-01T00:15:00Z');
        controller._onTick(viewer.clock);
        expect(heatbox.setData).toHaveBeenLastCalledWith(
            [{ id: 'early' }],
            expect.objectContaining({})
        );
    });

    test('should prefer updateValues when Heatbox provides lightweight update API', () => {
        heatbox.updateValues = jest.fn();
        controller = new TimeController(viewer, heatbox, options);
        controller.activate();

        controller._onTick(viewer.clock);

        expect(heatbox.updateValues).toHaveBeenCalledWith(
            [{ id: 1 }],
            expect.objectContaining({ _skipAutoView: true })
        );
        expect(heatbox.setData).not.toHaveBeenCalled();
    });

    test('should refresh current entry when camera changes', () => {
        controller = new TimeController(viewer, heatbox, options);
        controller.activate();
        heatbox.setData.mockClear();

        viewer.camera.fireChanged();

        expect(heatbox.setData).toHaveBeenCalledWith(
            [{ id: 1 }],
            expect.objectContaining({ _skipAutoView: true })
        );
    });

    test('should ignore stale async tick results that resolve out of order', async () => {
        options.dataSource = jest.fn();
        controller = new TimeController(viewer, heatbox, options);
        controller._isActive = true;

        let resolveFirst;
        let resolveSecond;
        const firstPromise = new Promise((resolve) => {
            resolveFirst = resolve;
        });
        const secondPromise = new Promise((resolve) => {
            resolveSecond = resolve;
        });

        controller._slicer.getEntryAsync = jest
            .fn()
            .mockReturnValueOnce(firstPromise)
            .mockReturnValueOnce(secondPromise);

        const pendingFirst = controller._handleAsyncTick({
            currentTime: Cesium.JulianDate.fromIso8601('2025-01-01T00:10:00Z')
        });
        const pendingSecond = controller._handleAsyncTick({
            currentTime: Cesium.JulianDate.fromIso8601('2025-01-01T00:20:00Z')
        });

        resolveSecond({ data: [{ id: 'new' }] });
        await pendingSecond;

        resolveFirst({ data: [{ id: 'old' }] });
        await pendingFirst;

        expect(heatbox.setData).toHaveBeenCalledTimes(1);
        expect(heatbox.setData).toHaveBeenCalledWith(
            [{ id: 'new' }],
            expect.objectContaining({ _skipAutoView: true })
        );
    });

    test('should serialize async Heatbox updates and keep only the latest queued entry', async () => {
        options.data = [
            {
                start: '2025-01-01T00:00:00Z',
                stop: '2025-01-01T01:00:00Z',
                data: [{ id: 'first' }]
            },
            {
                start: '2025-01-01T01:00:00Z',
                stop: '2025-01-01T02:00:00Z',
                data: [{ id: 'second' }]
            },
            {
                start: '2025-01-01T02:00:00Z',
                stop: '2025-01-01T03:00:00Z',
                data: [{ id: 'latest' }]
            }
        ];

        let resolveFirst;
        heatbox.setData = jest.fn()
            .mockImplementationOnce(() => new Promise((resolve) => {
                resolveFirst = resolve;
            }))
            .mockResolvedValue(undefined);
        controller = new TimeController(viewer, heatbox, options);
        controller.activate();

        viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('2025-01-01T01:30:00Z');
        controller._onTick(viewer.clock);
        viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('2025-01-01T02:30:00Z');
        controller._onTick(viewer.clock);

        expect(heatbox.setData).toHaveBeenCalledTimes(1);
        resolveFirst();
        await Promise.resolve();
        await Promise.resolve();

        expect(heatbox.setData).toHaveBeenCalledTimes(2);
        expect(heatbox.setData).toHaveBeenLastCalledWith(
            [{ id: 'latest' }],
            expect.objectContaining({ _skipAutoView: true })
        );
    });
});
