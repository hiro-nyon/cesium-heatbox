import { Heatbox } from '../../src/Heatbox.js';

// Mock dependencies
jest.mock('../../src/core/temporal/TimeController.js');
import { TimeController } from '../../src/core/temporal/TimeController.js';

// Mock Cesium
jest.mock('cesium', () => {
    const original = jest.requireActual('cesium');
    return {
        ...original,
        ScreenSpaceEventHandler: jest.fn(() => ({
            setInputAction: jest.fn(),
            destroy: jest.fn(),
            isDestroyed: jest.fn(() => false)
        })),
        // Ensure JulianDate is available
        JulianDate: original.JulianDate
    };
});
import * as Cesium from 'cesium';

describe('Heatbox Temporal Integration', () => {
    let viewer;
    let controllerInstances;

    beforeEach(() => {
        const mockCanvas = document.createElement('canvas');
        mockCanvas.getContext = jest.fn(() => ({})); // Mock WebGL context

        viewer = {
            scene: {
                canvas: mockCanvas,
                pick: jest.fn(),
                postRender: {
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                },
                requestRender: jest.fn()
            },
            camera: {
                flyTo: jest.fn(),
                flyToBoundingSphere: jest.fn()
            },
            clock: {
                currentTime: Cesium.JulianDate.now(),
                onTick: {
                    addEventListener: jest.fn(() => jest.fn())
                }
            },
            entities: {
                values: []
            },
            isDestroyed: () => false
        };

        // Reset mocks
        TimeController.mockClear();
        controllerInstances = [];
        TimeController.mockImplementation(() => {
            const instance = {
                activate: jest.fn(),
                deactivate: jest.fn()
            };
            controllerInstances.push(instance);
            return instance;
        });
    });

    test('should initialize TimeController when temporal option is enabled', () => {
        const options = {
            temporal: {
                enabled: true,
                data: []
            }
        };

        const heatbox = new Heatbox(viewer, options);

        expect(TimeController).toHaveBeenCalledTimes(1);
        expect(TimeController).toHaveBeenCalledWith(viewer, heatbox, options.temporal);
        expect(controllerInstances[0].activate).toHaveBeenCalledTimes(1);
    });

    test('should NOT initialize TimeController when temporal option is disabled', () => {
        const options = {
            temporal: {
                enabled: false
            }
        };

        const heatbox = new Heatbox(viewer, options);

        expect(TimeController).not.toHaveBeenCalled();
    });

    test('should NOT initialize TimeController when temporal option is missing', () => {
        const options = {};

        const heatbox = new Heatbox(viewer, options);

        expect(TimeController).not.toHaveBeenCalled();
    });

    test('should deactivate TimeController on destroy', () => {
        const options = {
            temporal: {
                enabled: true,
                data: []
            }
        };

        const heatbox = new Heatbox(viewer, options);
        heatbox.destroy();

        expect(controllerInstances[0].deactivate).toHaveBeenCalledTimes(1);
    });

    test('should enable TimeController when temporal option is toggled on via updateOptions', () => {
        const heatbox = new Heatbox(viewer, {
            temporal: {
                enabled: false
            }
        });

        heatbox.updateOptions({
            temporal: {
                enabled: true,
                data: [{ time: Cesium.JulianDate.now(), data: [] }]
            }
        });

        expect(TimeController).toHaveBeenCalledTimes(1);
        expect(controllerInstances[0].activate).toHaveBeenCalledTimes(1);
    });

    test('should deactivate TimeController when temporal option is toggled off via updateOptions', () => {
        const heatbox = new Heatbox(viewer, {
            temporal: {
                enabled: true,
                data: []
            }
        });

        expect(controllerInstances[0].activate).toHaveBeenCalledTimes(1);

        heatbox.updateOptions({
            temporal: {
                enabled: false
            }
        });

        expect(controllerInstances[0].deactivate).toHaveBeenCalledTimes(1);
        expect(TimeController).toHaveBeenCalledTimes(1);
    });

    test('should reinitialize TimeController when enabled temporal config changes via updateOptions', () => {
        const heatbox = new Heatbox(viewer, {
            temporal: {
                enabled: true,
                data: [{ time: Cesium.JulianDate.now(), data: [{ position: [0, 0, 0], weight: 1 }] }]
            }
        });

        expect(controllerInstances[0].activate).toHaveBeenCalledTimes(1);

        heatbox.updateOptions({
            temporal: {
                enabled: true,
                updateInterval: 100,
                data: [{ time: Cesium.JulianDate.addSeconds(Cesium.JulianDate.now(), 30, new Cesium.JulianDate()), data: [] }]
            }
        });

        expect(controllerInstances[0].deactivate).toHaveBeenCalledTimes(1);
        expect(TimeController).toHaveBeenCalledTimes(2);
        expect(controllerInstances[1]).toBeDefined();
        expect(controllerInstances[1].activate).toHaveBeenCalledTimes(1);
    });
});
