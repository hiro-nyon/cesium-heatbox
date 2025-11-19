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
    let mockTimeControllerInstance;

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
        mockTimeControllerInstance = {
            activate: jest.fn(),
            deactivate: jest.fn()
        };
        TimeController.mockImplementation(() => mockTimeControllerInstance);
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
        expect(mockTimeControllerInstance.activate).toHaveBeenCalledTimes(1);
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

        expect(mockTimeControllerInstance.deactivate).toHaveBeenCalledTimes(1);
    });
});
